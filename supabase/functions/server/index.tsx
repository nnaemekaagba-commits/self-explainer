import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { OpenAI } from "npm:openai";
import { validateAndFixLatex } from "./latex_fix.tsx";
import { fixMissingSpaces } from "./text_fix.tsx";
import { SCAFFOLDING_REQUIREMENTS, JSON_FORMAT_EXAMPLE, TOPIC_IDENTIFICATION_PROMPT, LATEX_NOTATION_REQUIREMENTS, CALCULATION_ENFORCEMENT_MESSAGE } from "./ai_prompts.tsx";
import { SIMPLE_SYSTEM_PROMPT, SIMPLE_SYSTEM_PROMPT_WITH_VISION, SIMPLE_REMINDER } from "./simple_prompts.tsx";
import { generateIntelligentFormula } from "./intelligent_formulas.tsx";
import { IMAGE_EXTRACTION_PROMPT, IMAGE_WITH_TEXT_PROMPT } from "./vision_prompts.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";
import { validateStepsHaveCalculations, validateAndEnhanceDescription } from "./description_validator.tsx";
import { fixAllFormulas } from "./formula_fixer.tsx";
import { validatePracticeAnswerHandler } from "./validate_practice_endpoint.tsx";
import { aggressiveUnescape } from "./aggressive_unescape.tsx";

const app = new Hono();

// Helper to get session-scoped key
function getSessionKey(sessionId: string | null, key: string): string {
  if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
    // Fallback to global namespace for backwards compatibility
    return key;
  }
  return `${sessionId}:${key}`;
}

// Helper to extract session ID from request
function getSessionId(c: any): string | null {
  const sessionId = c.req.header('X-Session-Id');
  return sessionId || null;
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Session-Id"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to identify problem topic/domain using OpenAI
async function identifyProblemTopic(question: string, openaiKey: string): Promise<any> {
  console.log("Identifying problem topic/domain...");
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: TOPIC_IDENTIFICATION_PROMPT 
          },
          { 
            role: "user", 
            content: `Analyze this problem and identify its domain:\n\n${question}` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    const data = await response.json();
    const topicInfo = JSON.parse(data.choices[0].message.content);
    
    console.log("Topic identified:", topicInfo);
    return topicInfo;
  } catch (error) {
    console.error("Failed to identify topic:", error);
    // Return default if identification fails
    return {
      domain: "General",
      subDomain: "Unknown",
      keyTerms: [],
      notation: "mathematical"
    };
  }
}

// Health check endpoint
app.get("/make-server-9063c65e/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test API connectivity endpoint
app.get("/make-server-9063c65e/test-api", async (c) => {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  
  const results: any = {
    openai: { tested: false, success: false, error: null }
  };
  
  // Test OpenAI
  if (openaiKey) {
    results.openai.tested = true;
    try {
      console.log("Testing OpenAI API connectivity...");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: "Say 'test'" }],
          max_tokens: 10
        })
      });
      
      if (response.ok) {
        results.openai.success = true;
        results.openai.statusCode = response.status;
      } else {
        const errorText = await response.text();
        results.openai.error = `HTTP ${response.status}: ${errorText}`;
        results.openai.statusCode = response.status;
      }
    } catch (error) {
      results.openai.error = error.message;
    }
  } else {
    results.openai.error = "No API key configured";
  }
  
  return c.json(results);
});

// Diagnostic endpoint to check API keys
app.get("/make-server-9063c65e/check-keys", (c) => {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");

  return c.json({
    hasOpenAI: !!openaiKey,
    openaiKeyPrefix: openaiKey ? openaiKey.substring(0, 7) + "..." : "NOT SET",
    openaiKeyLength: openaiKey?.length || 0,
    openaiKeyFormat: openaiKey?.startsWith("sk-") ? "Looks valid (sk- prefix)" : "Invalid format (should start with sk-)",
    message: !openaiKey
      ? "No API key found. Add OPENAI_API_KEY to Supabase secrets and redeploy."
      : "API key detected successfully!",
    testAdvice: "Try calling /make-server-9063c65e/solve-problem with a simple question to test API connectivity"
  });
});

// Sign up endpoint - Create new user with Supabase Auth
app.post("/make-server-9063c65e/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Create Supabase admin client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      user_metadata: { name: name || email.split('@')[0] },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    console.log("User created successfully:", data.user?.id);

    return c.json({ 
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Failed to create account" }, 500);
  }
});

// Solve problem with AI (OpenAI)
app.post("/make-server-9063c65e/solve-problem", async (c) => {
  try {
    const body = await c.req.json();
    const { question, imageUrl, apiProvider = 'openai' } = body;

    console.log("=== SOLVE PROBLEM REQUEST ===");
    console.log("Request received at:", new Date().toISOString());
    console.log("Question:", question || "(not provided)");
    console.log("Image URL provided:", !!imageUrl);
    if (imageUrl) {
      console.log("Image URL type:", typeof imageUrl);
      console.log("Image URL length:", imageUrl.length);
      console.log("Image URL prefix:", imageUrl.substring(0, 100) + "...");
      console.log("Is base64 data URL:", imageUrl.startsWith("data:"));
    }
    console.log("API Provider:", apiProvider);
    console.log("===========================");

    if (!question && !imageUrl) {
      return c.json({ error: "Question or image is required" }, 400);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    console.log("=== API Keys Check ===");
    console.log("OpenAI key present:", !!openaiKey);
    console.log("OpenAI key prefix:", openaiKey?.substring(0, 7));
    console.log("OpenAI key length:", openaiKey?.length);
    console.log("======================");

    if (!openaiKey) {
      return c.json({
        error: "No AI API key configured. Please add OPENAI_API_KEY to Supabase secrets.",
        hint: "Make sure to redeploy the edge function after adding secrets"
      }, 500);
    }

    // PERFORMANCE OPTIMIZATION: Skip topic identification to reduce latency
    // The AI can identify topic/domain implicitly from the question
    console.log(`Using OpenAI API (skipping topic identification for speed)`);

    if (openaiKey) {
      let openaiError = null; // Declare error tracking variable
      try {
        console.log("Attempting OpenAI API call...");
        console.log("Using API key (first 10/last 4):", openaiKey?.substring(0, 10) + "..." + openaiKey?.substring(openaiKey.length - 4));
        let messages;

        // If imageUrl is provided, use GPT-4 Vision to extract text from image
        if (imageUrl) {
          // Build the prompt that combines both the image and text if both are provided
          let userPrompt = "Carefully analyze this image and extract ALL information";
          let hasAdditionalText = false;
          
          if (question && question.trim() && !question.includes("Please read and extract")) {
            userPrompt = `Carefully analyze this image and extract ALL information from it. Then combine it with the user's question: "${question}"\n\nThe image may contain:\n- Diagrams (mechanical systems, circuits, free body diagrams, etc.)\n- Mathematical equations or formulas\n- Physics scenarios with objects, forces, dimensions\n- Geometric figures with measurements\n- Graphs or charts\n\nProvide a COMPLETE description of what you see, then integrate it with the user's question to form the complete problem.`;
            hasAdditionalText = true;
            userPrompt = IMAGE_WITH_TEXT_PROMPT(question);
            console.log("Combining image with user text:", question);
          } else {
            userPrompt = `Carefully analyze this image and extract ALL information from it.\n\nThe image may contain:\n- Diagrams (mechanical systems, circuits, free body diagrams, etc.)\n- Mathematical equations or formulas written on the image\n- Physics scenarios (e.g., "a 60kg man standing on a table", "a ball rolling down an incline")\n- Geometric figures with measurements and labels\n- Graphs, charts, or data plots\n\nProvide a COMPLETE description of:\n1. What objects/elements are shown (with their properties like mass, dimensions, angles)\n2. The physical setup or scenario depicted\n3. What measurements, values, or equations are visible\n4. What the diagram is asking you to find or calculate\n\nThen create a guided solution based on this complete description.`;
            // Use improved vision prompt that extracts BOTH text and visuals
            userPrompt = IMAGE_EXTRACTION_PROMPT;
            console.log("Processing image only - will extract BOTH complete text AND diagrams");
          }
          
          // ADD SIMPLE REMINDER TO USER MESSAGE
          userPrompt += `\n\n${SIMPLE_REMINDER}`;
          
          console.log("OCR Mode:", hasAdditionalText ? "Image + Text" : "Image Only");
          
          messages = [
            {
              role: "system",
              content: SIMPLE_SYSTEM_PROMPT_WITH_VISION // Use vision-specific prompt for OCR
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userPrompt
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                    detail: "auto" // Auto mode balances speed and accuracy
                  }
                },
                {
                  type: "text",
                  text: `CRITICAL REQUIREMENTS: 

1. GENERATE ONLY 3-6 STEPS MAXIMUM - Keep concise to avoid response truncation!
2. In your JSON response, EVERY step MUST have a non-empty 'formula' field with at least one equation in LaTeX format. 
3. For physics/geometry/circuit/engineering steps, ALSO include a detailed 'diagram' field describing what to visualize. 
4. DO NOT leave these fields empty - students need this scaffolding!

MANDATORY LaTeX NOTATION RULES:
- Use \\times or \\cdot for multiplication: \\(F = m \\times a\\) or \\(2 \\times 8\\)
- Use \\sum for summation: \\(\\sum M_A = 0\\) or \\(\\sum_{i=1}^{n} F_i\\)
- Wrap ALL math in \\( \\) for inline or \\[ \\] for display
- NEVER write plain text "times" or "x" or "imes" for multiplication
- NEVER write "Sum" or "extSum" - always use \\(\\sum\\)
- Example CORRECT: \\(0 = -1 \\times 0 + 2 \\times 8 + 5 \\times 12 + 2 \\times 16\\)
- Example WRONG: "0 = -1imes0 + 2imes8" or "extSumofmoments"`
                }
              ]
            }
          ];
        } else {
          messages = [
            {
              role: "system",
              content: SIMPLE_SYSTEM_PROMPT
            },
            {
              role: "user",
              content: `Create a guided solution for this problem: ${question}

${SIMPLE_REMINDER}`
            }
          ];
        }

        console.log("Sending request to OpenAI API...");
        let openaiResponse;
        try {
          openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: messages,
              response_format: { type: "json_object" },
              temperature: 0.3, // Lower temperature for more consistent results
              seed: 12345, // Fixed seed for reproducibility
              max_tokens: 14000 // Balanced to prevent truncation while keeping responses focused
            })
          });
        } catch (fetchError) {
          console.error("OpenAI fetch error (network/connection issue):", fetchError);
          throw fetchError; // Re-throw to be caught by outer try-catch
        }

        console.log("OpenAI response status:", openaiResponse.status);
        console.log("OpenAI response ok:", openaiResponse.ok);
        console.log("OpenAI response statusText:", openaiResponse.statusText);
        
        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          console.log("OpenAI response received successfully");
          
          // Log the raw content for debugging
          let rawContent = data.choices?.[0]?.message?.content;
          const finishReason = data.choices?.[0]?.finish_reason;
          
          // Check if content is empty or null
          if (!rawContent || rawContent.trim() === '') {
            console.error("OpenAI returned empty content!");
            console.error("Full response data:", JSON.stringify(data, null, 2));
            throw new Error("OpenAI returned empty response content");
          }
          console.log("Raw OpenAI content length:", rawContent?.length || 0);
          console.log("Finish reason:", finishReason);
          console.log("Content preview (first 500 chars):", rawContent?.substring(0, 500));
          console.log("Content end (last 500 chars):", rawContent?.substring(Math.max(0, (rawContent?.length || 0) - 500)));
          
          if (finishReason === 'length') {
            console.warn("WARNING: Response was truncated due to max_tokens limit!");
          }
          
          // CRITICAL FIX: Fix "sum" -> "\\sum" in the RAW JSON string BEFORE parsing
          // This catches AI mistakes where it writes "sumF_y" instead of "\\sum F_y"
          console.log("🔧 Pre-processing RAW JSON to fix 'sum' text to '\\\\sum' symbols...");
          const originalLength = rawContent.length;
          rawContent = rawContent.replace(/\\bsum([A-Z_])/g, '\\\\\\\\sum $1');
          rawContent = rawContent.replace(/\\bSum([A-Z_])/g, '\\\\\\\\sum $1');
          rawContent = rawContent.replace(/\\bsum\\b/g, '\\\\\\\\sum');
          rawContent = rawContent.replace(/\\bSum\\b/g, '\\\\\\\\sum');
          if (rawContent.length !== originalLength) {
            console.log("✅ Fixed 'sum' occurrences in raw JSON");
          }
          
          // Parse with error handling and automatic repair
          let parsed;
          try {
            parsed = JSON.parse(rawContent);
          } catch (parseError) {
            console.error("Initial JSON parsing error:", parseError.message);
            
            // ENHANCED REPAIR STRATEGY for truncated responses
            let repairedContent = rawContent;
            
            // Strategy 0: Handle unterminated strings by finding last valid quote
            if (parseError.message.includes("Unterminated string")) {
              console.log("Detected unterminated string, finding last complete field...");
              
              // Find the position of the error
              const errorMatch = parseError.message.match(/position (\d+)/);
              if (errorMatch) {
                const errorPos = parseInt(errorMatch[1]);
                console.log(`Error at position ${errorPos}, content length: ${rawContent.length}`);
                
                // Find the last complete field before the error
                // Look for the last complete string value ending with ","
                const beforeError = rawContent.substring(0, errorPos);
                const lastCompleteField = beforeError.lastIndexOf('",');
                
                if (lastCompleteField > 100) {
                  console.log(`Truncating at last complete field at position ${lastCompleteField}`);
                  repairedContent = rawContent.substring(0, lastCompleteField + 1); // +1 to include the "
                  
                  // Close any open step object
                  repairedContent += '\n  }';
                  // Close steps array
                  repairedContent += '\n  ]';
                  // Close main object
                  repairedContent += '\n}';
                }
              }
            }
            
            // Strategy 1: Find the last complete step object
            // Look for pattern: },\n    {\n      "stepNumber": N
            const stepPattern = /},\s*{\s*"stepNumber":\s*\d+/g;
            const stepMatches = [...repairedContent.matchAll(stepPattern)];
            
            if (stepMatches.length > 0) {
              // Find the last complete step
              const lastStepMatch = stepMatches[stepMatches.length - 1];
              const lastStepEnd = lastStepMatch.index;
              console.log(`Found ${stepMatches.length} complete steps, truncating after last complete step`);
              
              // Truncate to just before the last step separator
              repairedContent = repairedContent.substring(0, lastStepEnd + 1); // +1 to include the }
              
              // Close the steps array and main object
              repairedContent += '\n  ]\n}';
            } else {
              // Fallback: Look for ANY complete step object
              const anyStepPattern = /"stepNumber":\s*\d+,\s*"title":[^}]+}/g;
              const anyStepMatches = [...repairedContent.matchAll(anyStepPattern)];
              
              if (anyStepMatches.length > 0) {
                const lastMatch = anyStepMatches[anyStepMatches.length - 1];
                const endPos = lastMatch.index + lastMatch[0].length;
                console.log(`Found ${anyStepMatches.length} step objects, truncating to position ${endPos}`);
                repairedContent = repairedContent.substring(0, endPos);
                repairedContent += '\n  ]\n}';
              } else {
                // Last resort: find last complete } and try to build valid JSON
                console.log("No complete steps found, attempting structural repair");
                const lastBrace = repairedContent.lastIndexOf('}');
                if (lastBrace > 100) {
                  repairedContent = repairedContent.substring(0, lastBrace + 1);
                  
                  // Count and balance braces/brackets
                  let openBraces = (repairedContent.match(/{/g) || []).length;
                  let closeBraces = (repairedContent.match(/}/g) || []).length;
                  let openBrackets = (repairedContent.match(/\[/g) || []).length;
                  let closeBrackets = (repairedContent.match(/\]/g) || []).length;
                  
                  console.log(`Balancing: { ${openBraces} to ${closeBraces} } [ ${openBrackets} to ${closeBrackets} ]`);
                  
                  while (closeBrackets < openBrackets) {
                    repairedContent += ']';
                    closeBrackets++;
                  }
                  while (closeBraces < openBraces) {
                    repairedContent += '}';
                    closeBraces++;
                  }
                }
              }
            }
            
            // Try parsing the repaired content
            try {
              parsed = JSON.parse(repairedContent);
              console.log("Successfully repaired and parsed JSON!");
              if (finishReason === 'length') {
                console.warn(`Response was truncated - parsed ${parsed.steps?.length || 0} steps successfully`);
              }
            } catch (secondError) {
              console.error("JSON repair failed:", secondError.message);
              console.error("Content length:", rawContent.length);
              console.error("Repaired content length:", repairedContent.length);
              console.error("First 1000 chars:", rawContent.substring(0, 1000));
              console.error("Last 1000 chars:", rawContent.substring(Math.max(0, rawContent.length - 1000)));
              console.error("Repaired last 500 chars:", repairedContent.substring(Math.max(0, repairedContent.length - 500)));
              throw new Error(`Failed to parse OpenAI response as JSON even after repair attempt: ${parseError.message}`);
            }
          }

          // CRITICAL: Unescape LaTeX - AI sometimes outputs \\sum instead of \sum
          // This recursively fixes all strings in the parsed object
          function unescapeLatexInObject(obj: any): any {
            if (typeof obj === 'string') {
              // Replace double backslashes with single (but not at end of strings)
              return obj.replace(/\\\\/g, '\\');
            } else if (Array.isArray(obj)) {
              return obj.map(unescapeLatexInObject);
            } else if (obj && typeof obj === 'object') {
              const result: any = {};
              for (const key in obj) {
                result[key] = unescapeLatexInObject(obj[key]);
              }
              return result;
            }
            return obj;
          }
          
          console.log("🔧 Unescaping LaTeX backslashes...");
          console.log("BEFORE unescape:", JSON.stringify(parsed.strategy).substring(0, 200));
          parsed = unescapeLatexInObject(parsed);
          console.log("AFTER unescape:", JSON.stringify(parsed.strategy).substring(0, 200));
          
          // FIX PROFESSIONAL MATHEMATICAL NOTATION (convert plain text symbols to LaTeX)
          console.log("Applying professional formula notation fixes...");
          
          // DEBUG: Log raw AI output before any fixes
          console.log("🔍 DEBUG - Raw AI strategy output:", JSON.stringify(parsed.strategy).substring(0, 300));
          if (parsed.steps && parsed.steps[0]) {
            console.log("🔍 DEBUG - Raw first step title:", JSON.stringify(parsed.steps[0].title).substring(0, 200));
            console.log("🔍 DEBUG - Raw first step description:", JSON.stringify(parsed.steps[0].description).substring(0, 200));
          }
          
          parsed = fixAllFormulas(parsed);
          console.log("Formula notation fixes complete");

          // Validate and fix LaTeX in all fields, and fix missing spaces
          const validatedSolution = validateAndFixLatex(fixMissingSpaces(parsed.solution || "Guided solution created"));
          const validatedStrategy = validateAndFixLatex(fixMissingSpaces(parsed.strategy || "Follow the hints for each step"));
          const validatedQuestion = validateAndFixLatex(fixMissingSpaces(parsed.extractedQuestion || question));
          
          // Log extracted question from image
          if (imageUrl && parsed.extractedQuestion) {
            console.log("📸 IMAGE PROCESSING RESULT:");
            console.log("✅ Extracted question from image:", parsed.extractedQuestion);
            console.log("📊 Original question param:", question);
          }
          
          // Validate steps with ENHANCED scaffolding enforcement
          const validatedSteps = await Promise.all((parsed.steps || []).map(async (step: any, index: number) => {
            // CRITICAL: Ensure formula field is NEVER empty
            let formula = step.formula || "";
            if (!formula || formula.trim() === "") {
              console.warn(`WARNING: Step ${index + 1} missing formula! Generating intelligent scaffolding...`);
              // Use intelligent formula generation based on step content
              formula = generateIntelligentFormula(step, index);
            }
            
            // IMPORTANT: Check for diagram and warn if missing for technical steps
            let diagram = step.diagram || "";
            const isTechnicalStep = step.description && (
              step.description.toLowerCase().includes('force') ||
              step.description.toLowerCase().includes('diagram') ||
              step.description.toLowerCase().includes('vector') ||
              step.description.toLowerCase().includes('circuit') ||
              step.description.toLowerCase().includes('geometry') ||
              step.description.toLowerCase().includes('angle') ||
              step.description.toLowerCase().includes('component')
            );
            
            if (isTechnicalStep && (!diagram || diagram.trim() === "")) {
              console.warn(`WARNING: Step ${index + 1} appears technical but missing diagram description!`);
            }
            
            return {
              ...step,
              title: validateAndFixLatex(fixMissingSpaces(step.title || "")),
              description: validateAndFixLatex(fixMissingSpaces(step.description || "")),
              hint: validateAndFixLatex(fixMissingSpaces(step.hint || "")),
              formula: validateAndFixLatex(fixMissingSpaces(formula)),
              diagram: diagram ? validateAndFixLatex(fixMissingSpaces(diagram)) : diagram
            };
          }));

          // CRITICAL VALIDATION: Check if steps actually contain calculations
          console.log("Validating that steps contain actual calculations...");
          const validationResult = validateStepsHaveCalculations(validatedSteps);
          
          if (!validationResult.allValid) {
            console.error("SCAFFOLDING VALIDATION FAILED");
            console.error(`Found ${validationResult.invalidCount} steps WITHOUT proper calculations:`);
            validationResult.issues.forEach(issue => {
              console.error(`  Step ${issue.stepIndex + 1}: ${issue.issue}`);
            });
            console.error("AI did not follow scaffolding requirements properly!");
            
            // Log the problematic steps for debugging
            validationResult.issues.forEach(issue => {
              const step = validatedSteps[issue.stepIndex];
              console.error(`\nProblematic Step ${issue.stepIndex + 1}:`);
              console.error(`  Title: ${step.title}`);
              console.error(`  Description: ${step.description?.substring(0, 200)}...`);
            });
          } else {
            console.log(`All ${validationResult.validCount} steps contain proper calculations!`);
          }

          // SKIP DALL-E diagram generation for faster initial response
          // Diagrams can be generated on-demand later if needed
          console.log("⚡ Skipping DALL-E diagram generation for faster response");
          const stepsWithDiagrams = validatedSteps;

          // Return the AI-generated guided solution with OpenAI metadata and DALL-E diagrams
          return c.json({
            solution: validatedSolution,
            strategy: validatedStrategy,
            extractedQuestion: validatedQuestion,
            steps: stepsWithDiagrams,
            diagram: null, // Legacy field - diagrams are now per-step
            // OpenAI API metadata
            promptId: data.id || null,
            model: data.model || null,
            created: data.created || null,
            usage: data.usage || null
          });
        } else {
          console.error("OpenAI API returned non-OK status:", openaiResponse.status);
          const errorText = await openaiResponse.text();
          console.error("OpenAI error response body:", errorText);
          
          // Try to parse error details
          try {
            const errorData = JSON.parse(errorText);
            console.error("OpenAI error details:", JSON.stringify(errorData, null, 2));
            
            // Store error for reporting
            openaiError = {
              status: openaiResponse.status,
              message: errorData.error?.message || errorText,
              type: errorData.error?.type,
              code: errorData.error?.code
            };
          } catch {
            openaiError = {
              status: openaiResponse.status,
              message: errorText
            };
          }
          
          // Don't throw yet - will try fallback below if configured
        }
      } catch (error) {
        console.error("OpenAI API error:", error);
        openaiError = {
          message: error.message,
          stack: error.stack
        };
      }
      
      // If we reach here and have an error, return it
      if (openaiError) {
        console.error("All API attempts failed. Last error:", openaiError);
        return c.json({
          error: "Failed to generate solution. Please check API configuration.",
          details: openaiError,
          hint: "Verify that your OPENAI_API_KEY is valid and has sufficient credits."
        }, 500);
      }
    }
    
    // Should not reach here
    return c.json({ error: "No API key configured" }, 500);
  } catch (error) {
    console.error("Unexpected error in solve-problem endpoint:", error);
    return c.json({
      error: "An unexpected error occurred",
      details: error.message
    }, 500);
  }
});

// Get hint for a specific step
app.post("/make-server-9063c65e/get-hint", async (c) => {
  try {
    const body = await c.req.json();
    const { question, stepNumber } = body;

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return c.json({
        error: "OpenAI API key not configured"
      }, 500);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a math tutor. Provide a helpful hint for the student without giving away the full answer."
          },
          {
            role: "user",
            content: `For this problem: "${question}", provide a hint for step ${stepNumber}`
          }
        ]
      })
    });

    if (!response.ok) {
      return c.json({ error: "Failed to get hint from AI" }, 500);
    }

    const data = await response.json();
    const hint = validateAndFixLatex(fixMissingSpaces(data.choices[0].message.content));

    return c.json({ hint });
  } catch (error) {
    console.log("Error in get-hint endpoint:", error);
    return c.json({ error: `Failed to get hint: ${error.message}` }, 500);
  }
});

// Validate student's answer and explanation
app.post("/make-server-9063c65e/validate-step", async (c) => {
  try {
    const body = await c.req.json();
    const { stepData, userAnswer, userExplanation, answerImageUrl, explanationImageUrl } = body;

    if (!stepData) {
      return c.json({ error: "Step data is required" }, 400);
    }

    // Check if student provided at least something (text or image)
    if (!userAnswer && !answerImageUrl) {
      return c.json({ error: "Please provide an answer (text or image)" }, 400);
    }

    if (!userExplanation && !explanationImageUrl) {
      return c.json({ error: "Please provide an explanation (text or image)" }, 400);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return c.json({
        error: "No AI API keys configured"
      }, 500);
    }

    // Try OpenAI first
    if (openaiKey) {
      try {
        // Build user message with optional images
        let userMessageContent: any = [];
        
        // Determine if answer/explanation is image-only
        const answerIsImageOnly = !userAnswer || userAnswer === '[See uploaded image]';
        const explanationIsImageOnly = !userExplanation || userExplanation === '[See uploaded image]';
        
        // Add the main validation text
        let validationText = `Step: ${stepData.title}
Description: ${stepData.description}
Hint: ${stepData.hint}
Formula: ${stepData.formula || "N/A"}

Student's Answer (text): ${answerIsImageOnly ? 'Not provided - see image below' : userAnswer}
Student's Explanation (text): ${explanationIsImageOnly ? 'Not provided - see image below' : (userExplanation || "No explanation provided")}

`;
        
        // If student uploaded images, note that in the text
        if (answerImageUrl) {
          validationText += answerIsImageOnly 
            ? `\nIMPORTANT: The student provided their answer ONLY as an IMAGE (no text). You MUST analyze the image below to extract and validate their answer.\n`
            : `\nThe student also uploaded an IMAGE for their answer. Analyze the image to understand their complete answer.\n`;
        }
        if (explanationImageUrl) {
          validationText += explanationIsImageOnly
            ? `\nIMPORTANT: The student provided their explanation ONLY as an IMAGE (no text). You MUST analyze the image below to extract and validate their explanation.\n`
            : `\nThe student also uploaded an IMAGE for their explanation. Analyze the image to understand their complete reasoning.\n`;
        }
        
        validationText += `\nValidate STRICTLY. Reject poor explanations. Consider BOTH text and images when provided.`;
        
        userMessageContent.push({
          type: "text",
          text: validationText
        });
        
        // Add answer image if provided
        if (answerImageUrl) {
          userMessageContent.push({
            type: "image_url",
            image_url: {
              url: answerImageUrl
            }
          });
        }
        
        // Add explanation image if provided
        if (explanationImageUrl) {
          userMessageContent.push({
            type: "image_url",
            image_url: {
              url: explanationImageUrl
            }
          });
        }

        const messages = [
          {
            role: "system",
            content: `You are a STRICT math tutor validating student work with RIGOROUS standards.

CRITICAL VALIDATION RULES:

For ANSWER validation:
- The numerical/mathematical result must be EXACTLY correct
- Accept equivalent forms ONLY (e.g., 1/2 = 0.5, √4 = 2)
- Ignore only formatting (spaces, parentheses style)
- ANY wrong number = FAIL
- IF student uploaded an IMAGE for their answer, read and analyze it carefully to extract their complete answer

For EXPLANATION validation - BE VERY STRICT:
- Student MUST demonstrate deep understanding of the underlying concept
- They MUST explain the mathematical reasoning behind each step
- They MUST reference the key concepts from the hint/description
- Generic statements like "I solved it", "I used the formula", "basic math" are NOT acceptable
- Nonsense, random words, or incomplete thoughts are WRONG
- Require them to explain WHY each step works, not just WHAT they did
- Check for mathematical vocabulary relevant to the problem
- Minimal effort explanations = FAIL
- IF student uploaded an IMAGE for their explanation, read and analyze it carefully to understand their complete reasoning (diagrams, work shown, written explanations in the image)

RED FLAGS for explanation (mark as WRONG):
- Fewer than 15 words without good reason
- No mention of mathematical concepts (formula names, operations, properties)
- Circular reasoning ("I got X because I calculated X")
- Vague language ("I just did it", "it's obvious", "simple math")
- Random words or gibberish
- Copy-pasting the question
- No logical connection to the problem

GOOD explanation must include:
- WHY this approach works
- WHICH mathematical concept/formula is being applied
- HOW the steps connect logically
- Demonstration of understanding the underlying principle

When images are provided:
- Carefully read any handwritten or typed text in the images
- Analyze diagrams, free body diagrams, circuit diagrams, geometric figures
- Look for equations, calculations, and mathematical work shown
- Combine the text explanation with the visual work to form a complete assessment

IMPORTANT - Feedback acknowledgment:
- If the student submitted an IMAGE for their answer, START your feedback by acknowledging this: "I reviewed your uploaded answer image..."
- If the student submitted an IMAGE for their explanation, mention this in your feedback: "I analyzed your handwritten/uploaded work..." or "Looking at your uploaded diagram/solution..."
- Make the student feel that their image submission was carefully examined and valued

Return JSON with:
- answerCorrect: boolean (mathematically perfect?)
- explanationCorrect: boolean (shows TRUE deep understanding?)
- feedback: string (specific, detailed feedback on what's wrong/good - MUST acknowledge image submissions!)
- diagramDescription: string (if helpful, describe a diagram that would help explain the concept - e.g., "Free body diagram showing all forces acting on the block on an inclined plane" or "Vector diagram showing the components of velocity". Leave empty if diagram is not needed)

BE HARSH. Students learn better from constructive criticism than false praise.`
          },
          {
            role: "user",
            content: userMessageContent
          }
        ];

        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: messages,
            response_format: { type: "json_object" },
            temperature: 0.2, // Very low temperature for consistent grading
            seed: 54321 // Fixed seed for reproducible validation
          })
        });

        if (openaiResponse.ok) {
          const data = await openaiResponse.json();
          const parsed = JSON.parse(data.choices[0].message.content);

          // Generate diagram if description provided
          let feedbackDiagram = null;
          // Diagram generation removed (Gemini dependency removed)

          return c.json({
            answerCorrect: parsed.answerCorrect || false,
            explanationCorrect: parsed.explanationCorrect || false,
            feedback: validateAndFixLatex(fixMissingSpaces(parsed.feedback || "Review your work")),
            diagram: feedbackDiagram
          });
        }
      } catch (error) {
        console.log("OpenAI validation error:", error);
      }
    }

    return c.json({
      error: "Failed to validate step"
    }, 500);
  } catch (error) {
    console.log("Error in validate-step endpoint:", error);
    return c.json({ error: `Failed to validate: ${error.message}` }, 500);
  }
});

// Get all activities
app.get("/make-server-9063c65e/activities", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const prefix = getSessionKey(sessionId, "activity:");
    const activities = await kv.getByPrefix(prefix);
    
    // Sort by date (newest first)
    const sortedActivities = activities.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return c.json({ activities: sortedActivities });
  } catch (error) {
    console.log("Error fetching activities:", error);
    return c.json({ error: "Failed to fetch activities" }, 500);
  }
});

// Save a new activity
app.post("/make-server-9063c65e/activities", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const body = await c.req.json();
    const { question, status, aiData, completedSteps, totalSteps } = body;

    const activityId = getSessionKey(sessionId, `activity:${Date.now()}`);
    const activity = {
      id: activityId,
      question,
      status: status || "In Progress",
      aiData,
      completedSteps: completedSteps || 0,
      totalSteps: totalSteps || aiData?.steps?.length || 0,
      date: new Date().toISOString()
    };

    await kv.set(activityId, activity);
    
    console.log("Activity saved:", activityId);
    return c.json({ success: true, id: activityId });
  } catch (error) {
    console.log("Error saving activity:", error);
    return c.json({ error: "Failed to save activity" }, 500);
  }
});

// Update activity status
app.put("/make-server-9063c65e/activities/:id", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const id = c.req.param("id");
    const body = await c.req.json();
    const { status, completedSteps } = body;

    const activity = await kv.get(id);
    
    if (!activity) {
      return c.json({ error: "Activity not found" }, 404);
    }

    const updatedActivity = {
      ...activity,
      status,
      completedSteps: completedSteps !== undefined ? completedSteps : activity.completedSteps,
      updatedAt: new Date().toISOString()
    };

    await kv.set(id, updatedActivity);
    
    return c.json({ success: true });
  } catch (error) {
    console.log("Error updating activity:", error);
    return c.json({ error: "Failed to update activity" }, 500);
  }
});

// Delete an activity
app.delete("/make-server-9063c65e/activities/:id", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const id = c.req.param("id");
    await kv.del(id);
    
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting activity:", error);
    return c.json({ error: "Failed to delete activity" }, 500);
  }
});

// Generate and save invite code
app.post("/make-server-9063c65e/invite/generate", async (c) => {
  try {
    const generateCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return code;
    };

    let inviteCode = generateCode();
    
    // Make sure code is unique
    let exists = await kv.get(`invite:${inviteCode}`);
    while (exists) {
      inviteCode = generateCode();
      exists = await kv.get(`invite:${inviteCode}`);
    }

    // Save invite code with metadata
    const inviteData = {
      code: inviteCode,
      createdAt: new Date().toISOString(),
      used: false,
      usedBy: null
    };

    await kv.set(`invite:${inviteCode}`, inviteData);
    
    console.log("Invite code generated:", inviteCode);
    return c.json({ inviteCode, link: `https://app.learning.ai/invite/${inviteCode}` });
  } catch (error) {
    console.log("Error generating invite code:", error);
    return c.json({ error: "Failed to generate invite code" }, 500);
  }
});

// Validate invite code
app.get("/make-server-9063c65e/invite/:code", async (c) => {
  try {
    const code = c.req.param("code");
    const inviteData = await kv.get(`invite:${code}`);
    
    if (!inviteData) {
      return c.json({ valid: false, error: "Invalid invite code" }, 404);
    }

    return c.json({ valid: true, invite: inviteData });
  } catch (error) {
    console.log("Error validating invite code:", error);
    return c.json({ error: "Failed to validate invite code" }, 500);
  }
});

// Mark invite as used
app.post("/make-server-9063c65e/invite/:code/use", async (c) => {
  try {
    const code = c.req.param("code");
    const body = await c.req.json();
    const { userId } = body;

    const inviteData = await kv.get(`invite:${code}`);
    
    if (!inviteData) {
      return c.json({ error: "Invalid invite code" }, 404);
    }

    if (inviteData.used) {
      return c.json({ error: "Invite code already used" }, 400);
    }

    const updatedInvite = {
      ...inviteData,
      used: true,
      usedBy: userId,
      usedAt: new Date().toISOString()
    };

    await kv.set(`invite:${code}`, updatedInvite);
    
    return c.json({ success: true });
  } catch (error) {
    console.log("Error marking invite as used:", error);
    return c.json({ error: "Failed to mark invite as used" }, 500);
  }
});

// Ask AI for help with feedback
app.post("/make-server-9063c65e/ask-help", async (c) => {
  try {
    const body = await c.req.json();
    const { question, context } = body;

    if (!question) {
      return c.json({ error: "Question is required" }, 400);
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    // Build detailed context for the AI
    const feedbackStatus = context.answerCorrect && context.explanationCorrect 
      ? "both correct"
      : !context.answerCorrect && !context.explanationCorrect
      ? "both incorrect"
      : context.answerCorrect
      ? "answer correct but explanation incorrect"
      : "explanation correct but answer incorrect";
    
    // Build enhanced system prompt with all available information
    let systemPrompt = `You are a supportive math/physics/engineering tutor using SELF-EXPLANATION PROMPTS to help a student working on Step ${context.stepNumber}.

STUDENT'S CURRENT STATUS: ${feedbackStatus}

STUDENT'S WORK:
Answer: "${context.userAnswer}"
Explanation: "${context.userExplanation}"`;

    // Add original problem context if available
    if (context.originalQuestion) {
      systemPrompt += `\n\nORIGINAL PROBLEM: "${context.originalQuestion}"`;
    }

    // Add step details if available
    if (context.stepData) {
      systemPrompt += `\n\nSTEP ${context.stepNumber} DETAILS:`;
      if (context.stepData.title) systemPrompt += `\nTitle: "${context.stepData.title}"`;
      if (context.stepData.description) systemPrompt += `\nDescription: "${context.stepData.description}"`;
      if (context.stepData.formula) systemPrompt += `\nFormulas: ${context.stepData.formula}`;
      if (context.stepData.diagram) systemPrompt += `\nDiagram Description: ${context.stepData.diagram}`;
    }

    // Note if student uploaded images
    if (context.answerImageUrl) {
      systemPrompt += `\n\nNOTE: Student uploaded an IMAGE for their answer. They may have handwritten work.`;
    }
    if (context.explanationImageUrl) {
      systemPrompt += `\n\nNOTE: Student uploaded an IMAGE for their explanation. They may have drawn diagrams or shown detailed work.`;
    }

    systemPrompt += `\n\nSELF-EXPLANATION PROMPT ALREADY PROVIDED: "${context.hint}"

YOUR ROLE - USE SELF-EXPLANATION QUESTIONING WITH DOMAIN-SPECIFIC TERMINOLOGY AND PARTIAL CALCULATIONS:
1. **IDENTIFY THE PROBLEM DOMAIN** (mechanical eng, electrical eng, physics, math, etc.) and USE DOMAIN-SPECIFIC TERMS throughout
2. Analyze their SPECIFIC mistakes and misconceptions based on what they wrote
3. **PROVIDE PARTIAL CALCULATIONS** when guiding them - show the first few steps with actual numbers, then ask them to complete
4. Ask questions using domain-specific terminology that help them identify WHERE their reasoning went wrong
5. Use self-explanation prompts that address their specific errors with domain-specific perspective (use terms like "statics", "equilibrium", "KVL", "conservation of energy", etc.)
4. Ask scaffolding questions about assumptions, constraints, and system behavior
5. If their work shows an error, ask them to verify using engineering checks and reasonableness tests
6. If their explanation lacks engineering rigor, ask about boundary conditions, sign conventions, or physical meaning
7. Reference their actual work and ask how it relates to engineering principles
8. Ask questions that develop engineering thinking: "Does this make physical sense?", "What are the limits of this approach?", "How would you validate this?"
9. Never give direct answers - always prompt them to think like engineers and justify their reasoning

IMPORTANT FORMATTING:
- Use LaTeX for ALL mathematical formulas enclosed in $ signs (inline) or $$ signs (block)
- Examples: $F = ma$, $v = \\frac{d}{t}$, $$\\sum_{i=1}^{n} x_i$$
- For fractions: \\frac{numerator}{denominator}
- For square roots: \\sqrt{x}
- For subscripts: x_i or F_n
- For superscripts: x^2 or e^{-x}
- Don't give direct answers - use Socratic questioning
- Point out specific parts of their work that need attention
- Provide mini-examples if helpful (with different numbers)
- Build on what they got right (if anything)

Keep responses under 150 words and make them actionable.`;

    // Build conversation messages array with history
    const messages: any[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add previous conversation messages if they exist
    if (context.previousMessages && context.previousMessages.length > 0) {
      context.previousMessages.forEach((msg: any) => {
        messages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        });
      });
    }

    // Add current question
    messages.push({
      role: "user",
      content: question
    });

    // Try OpenAI first
    if (openaiApiKey) {
      try {
        console.log("[ask-help] Trying OpenAI...");
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: messages,
          temperature: 0.7,
          max_tokens: 350
        });

        const rawResponse = completion.choices[0].message.content || "";
        console.log("[ask-help] RAW AI RESPONSE:", rawResponse.substring(0, 300));
        const response = validateAndFixLatex(fixMissingSpaces(rawResponse));
        console.log("[ask-help] AFTER fixMissingSpaces:", response.substring(0, 300));
        console.log("[ask-help] OpenAI success");
        return c.json({ response });
      } catch (openaiError) {
        console.error("[ask-help] OpenAI error:", openaiError);
        console.error("[ask-help] OpenAI error message:", openaiError.message);
        if (openaiError.stack) {
          console.error("[ask-help] OpenAI error stack:", openaiError.stack);
        }
        return c.json({ error: "Failed to get AI help" }, 503);
      }
    }

    return c.json({ error: "OpenAI API key not configured" }, 503);
  } catch (error) {
    console.error("Error getting AI help:", error);
    return c.json({ error: "Failed to get AI help" }, 500);
  }
});

// Generate complete solution for a step (after 3 attempts)
app.post("/make-server-9063c65e/generate-step-solution", async (c) => {
  try {
    const body = await c.req.json();
    const { stepData, questionContext } = body;

    console.log('Generate step solution request:', { stepData, questionContext });

    if (!stepData) {
      console.error('Missing step data');
      return c.json({ error: "Step data is required" }, 400);
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    console.log('API Keys available:', { 
      openai: !!openaiApiKey
    });

    // Try OpenAI first
    if (openaiApiKey) {
      try {
        console.log('Trying OpenAI...');
        
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are a math tutor providing the COMPLETE CORRECT SOLUTION for a specific step.

You MUST respond with ONLY valid JSON in this exact format:
{
  "answer": "the correct answer (number, expression, or equation)",
  "explanation": "detailed step-by-step explanation of how to solve this"
}

Be specific and show all work. Use plain text for math (e.g., "x = 5" or "2x + 3 = 11").`
              },
              {
                role: "user",
                content: `Provide the complete solution for this step:

STEP ${stepData.stepNumber}: ${stepData.title}
Description: ${stepData.description}
${stepData.formula ? `Formula: ${stepData.formula}` : ''}
Hint: ${stepData.hint}

${questionContext ? `Original Problem: ${questionContext}` : ''}

Provide the CORRECT ANSWER and DETAILED EXPLANATION.`
              }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          })
        });

        console.log('OpenAI response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI error response:', errorText);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('OpenAI raw response:', data);
        
        const content = data.choices[0].message.content;
        console.log('OpenAI content:', content);
        
        const parsed = JSON.parse(content);
        console.log('Parsed solution:', parsed);

        return c.json({
          correctAnswer: validateAndFixLatex(fixMissingSpaces(parsed.answer || "Unable to generate answer")),
          correctExplanation: validateAndFixLatex(fixMissingSpaces(parsed.explanation || "Unable to generate explanation"))
        });
      } catch (openaiError) {
        console.error("OpenAI error details:", openaiError);
        return c.json({ 
          error: "Failed to generate solution",
          correctAnswer: "Service unavailable",
          correctExplanation: "Unable to generate solution at this time. Please try again."
        }, 503);
      }
    }

    return c.json({ 
      error: "OpenAI API key not configured",
      correctAnswer: "Service unavailable",
      correctExplanation: "AI service is not configured. Please contact support."
    }, 503);
  } catch (error) {
    console.error("Error generating step solution:", error);
    return c.json({ 
      error: `Failed to generate step solution: ${error.message}`,
      correctAnswer: "Error occurred",
      correctExplanation: "An error occurred while generating the solution."
    }, 500);
  }
});

// Activity Log Endpoints

// Get all activity logs
app.get("/make-server-9063c65e/activity-logs", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const prefix = getSessionKey(sessionId, "log:");
    const logs = await kv.getByPrefix(prefix);
    
    // Sort by start date (newest first)
    const sortedLogs = logs.sort((a: any, b: any) => {
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });

    return c.json({ logs: sortedLogs });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return c.json({ error: "Failed to fetch activity logs" }, 500);
  }
});

// Get a specific activity log
app.get("/make-server-9063c65e/activity-logs/:id", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const id = c.req.param("id");
    const log = await kv.get(id);
    
    if (!log) {
      return c.json({ error: "Activity log not found" }, 404);
    }

    return c.json({ log });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return c.json({ error: "Failed to fetch activity log" }, 500);
  }
});

// Create a new activity log
app.post("/make-server-9063c65e/activity-logs", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const body = await c.req.json();
    
    console.log('[CREATE ACTIVITY LOG] Endpoint called');
    console.log('  Session ID:', sessionId);
    console.log('  Original body.id:', body.id);
    
    // Always scope with session - the body.id format is "log:timestamp"
    // We need to add session prefix to make it "session_xxx:log:timestamp"
    const scopedId = getSessionKey(sessionId, body.id);
    const scopedBody = { ...body, id: scopedId };
    
    console.log('  Scoped ID:', scopedId);
    console.log('  Storing activity log...');
    
    await kv.set(scopedId, scopedBody);
    
    console.log('[SUCCESS] Activity log created successfully');
    
    return c.json({ success: true, id: scopedId });
  } catch (error) {
    console.error("Error creating activity log:", error);
    return c.json({ error: "Failed to create activity log" }, 500);
  }
});

// Record a step attempt
app.post("/make-server-9063c65e/activity-logs/:id/steps/:stepNumber/attempt", async (c) => {
  try {
    const id = c.req.param("id");
    const stepNumber = parseInt(c.req.param("stepNumber"));
    const body = await c.req.json();
    
    console.log('[RECORD STEP ATTEMPT] Endpoint called');
    console.log('  ID:', id);
    console.log('  Step Number:', stepNumber);
    console.log('  Body:', JSON.stringify(body, null, 2));
    
    const log = await kv.get(id);
    if (!log) {
      console.error('[ERROR] Activity log not found for ID:', id);
      return c.json({ error: "Activity log not found" }, 404);
    }
    
    console.log('[SUCCESS] Activity log found:', log.id);
    console.log('  Total steps:', log.steps.length);

    const stepIndex = log.steps.findIndex((s: any) => s.stepNumber === stepNumber);
    if (stepIndex === -1) {
      console.error('[ERROR] Step not found. Available steps:', log.steps.map((s: any) => s.stepNumber));
      return c.json({ error: "Step not found" }, 404);
    }
    
    console.log('[SUCCESS] Step found at index:', stepIndex);
    console.log('  Current attempts:', log.steps[stepIndex].attempts.length);

    // Create new attempt
    const attempt = {
      attemptNumber: log.steps[stepIndex].attempts.length + 1,
      userAnswer: body.userAnswer,
      userExplanation: body.userExplanation,
      answerCorrect: body.answerCorrect,
      explanationCorrect: body.explanationCorrect,
      aiQueriesUsed: body.aiQueriesUsed || 0,
      chatMessages: body.chatMessages || [],
      answerImageUrl: body.answerImageUrl,  // Save answer image URL
      explanationImageUrl: body.explanationImageUrl,  // Save explanation image URL
      timestamp: new Date().toISOString()
    };
    
    console.log('[NEW ATTEMPT] Created:', JSON.stringify(attempt, null, 2));

    // Update step
    log.steps[stepIndex].attempts.push(attempt);
    log.totalAttempts += 1;

    // If both correct, mark step as completed
    if (body.answerCorrect && body.explanationCorrect) {
      log.steps[stepIndex].completed = true;
      log.steps[stepIndex].correctAttemptNumber = attempt.attemptNumber;
      log.totalCorrectResponses += 1;
      console.log('[SUCCESS] Step marked as completed');
    }
    
    console.log('[SAVING] Updated log to kv store...');
    await kv.set(id, log);
    console.log('[SUCCESS] Log saved successfully');
    
    return c.json({ success: true });
  } catch (error) {
    console.error("[ERROR] in record-step-attempt endpoint:");
    console.error("  Error message:", error.message);
    console.error("  Error stack:", error.stack);
    console.error("  Full error:", error);
    return c.json({ error: `Failed to record step attempt: ${error.message}` }, 500);
  }
});

// Record an AI query
app.post("/make-server-9063c65e/activity-logs/:id/steps/:stepNumber/ai-query", async (c) => {
  try {
    const id = c.req.param("id");
    const stepNumber = parseInt(c.req.param("stepNumber"));
    
    console.log('[RECORD AI QUERY] Endpoint called');
    console.log('  ID:', id);
    console.log('  Step Number:', stepNumber);
    
    const log = await kv.get(id);
    if (!log) {
      console.error('[ERROR] Activity log not found for ID:', id);
      return c.json({ error: "Activity log not found" }, 404);
    }

    const stepIndex = log.steps.findIndex((s: any) => s.stepNumber === stepNumber);
    if (stepIndex === -1) {
      console.error('[ERROR] Step not found. Available steps:', log.steps.map((s: any) => s.stepNumber));
      return c.json({ error: "Step not found" }, 404);
    }

    // Increment AI query counters
    log.steps[stepIndex].totalAIQueries += 1;
    log.totalAIQueriesUsed += 1;
    
    console.log('[SUCCESS] AI query count incremented. New total:', log.totalAIQueriesUsed);

    await kv.set(id, log);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("[ERROR] in record-ai-query endpoint:");
    console.error("  Error message:", error.message);
    console.error("  Error stack:", error.stack);
    console.error("  Full error:", error);
    return c.json({ error: `Failed to record AI query: ${error.message}` }, 500);
  }
});

// Update the last attempt's chat messages for a specific step
app.put("/make-server-9063c65e/activity-logs/:id/steps/:stepNumber/update-chat", async (c) => {
  try {
    const id = c.req.param("id");
    const stepNumber = parseInt(c.req.param("stepNumber"));
    const body = await c.req.json();
    const { chatMessages } = body;
    
    console.log('[UPDATE CHAT MESSAGES] Endpoint called');
    console.log('Activity Log ID:', id);
    console.log('Step Number:', stepNumber);
    console.log('Chat Messages Received:', JSON.stringify(chatMessages, null, 2));
    
    const log = await kv.get(id);
    if (!log) {
      console.log('[ERROR] Activity log not found for ID:', id);
      return c.json({ error: "Activity log not found" }, 404);
    }
    
    console.log('[SUCCESS] Activity log found:', log.id);
    
    const step = log.steps.find((s: any) => s.stepNumber === stepNumber);
    if (!step) {
      console.log('[ERROR] Step not found. Available steps:', log.steps.map((s: any) => s.stepNumber));
      return c.json({ error: "Step not found" }, 404);
    }
    
    console.log('[SUCCESS] Step found with', step.attempts.length, 'attempts');
    
    // Update the last attempt's chat messages
    if (step.attempts.length > 0) {
      const lastAttempt = step.attempts[step.attempts.length - 1];
      console.log('[UPDATING] Attempt', lastAttempt.attemptNumber);
      console.log('[DEBUG] Before update - aiQueriesUsed:', lastAttempt.aiQueriesUsed);
      console.log('[DEBUG] Before update - chatMessages:', lastAttempt.chatMessages);
      
      lastAttempt.chatMessages = chatMessages;
      
      // Count how many user queries were made (user messages in the chat)
      const userQueriesInChat = chatMessages.filter((msg: any) => msg.role === 'user').length;
      lastAttempt.aiQueriesUsed = userQueriesInChat;
      
      console.log('[DEBUG] After update - aiQueriesUsed:', lastAttempt.aiQueriesUsed);
      console.log('[DEBUG] After update - chatMessages length:', lastAttempt.chatMessages?.length);
      
      // Recalculate total AI queries for the step
      step.totalAIQueries = step.attempts.reduce((total: number, attempt: any) => 
        total + (attempt.aiQueriesUsed || 0), 0
      );
      
      console.log('[DEBUG] Step total AI queries:', step.totalAIQueries);
      
      // Recalculate total AI queries used across all steps
      log.totalAIQueriesUsed = log.steps.reduce((total: number, s: any) => 
        total + s.totalAIQueries, 0
      );
      
      console.log('[DEBUG] Log total AI queries:', log.totalAIQueriesUsed);
      
      // Save updated log
      await kv.set(id, log);
      console.log('[SUCCESS] Successfully saved updated log to database');
      return c.json({ success: true });
    } else {
      return c.json({ error: "No attempts found for this step" }, 400);
    }
  } catch (error) {
    console.error("Error updating chat messages:", error);
    return c.json({ error: "Failed to update chat messages" }, 500);
  }
});

// Mark activity as completed
app.post("/make-server-9063c65e/activity-logs/:id/complete", async (c) => {
  try {
    const id = c.req.param("id");
    
    const log = await kv.get(id);
    if (!log) {
      return c.json({ error: "Activity log not found" }, 404);
    }

    log.status = 'completed';
    log.completedAt = new Date().toISOString();

    await kv.set(id, log);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error marking activity as completed:", error);
    return c.json({ error: "Failed to mark activity as completed" }, 500);
  }
});

// Clear all activity logs
app.delete("/make-server-9063c65e/activity-logs/clear-all", async (c) => {
  try {
    const sessionId = getSessionId(c);
    console.log('[CLEAR ALL] Session ID received:', sessionId);
    
    const prefix = getSessionKey(sessionId, "log:");
    console.log('[CLEAR ALL] Searching for logs with prefix:', prefix);
    
    const logs = await kv.getByPrefix(prefix);
    console.log(`[CLEAR ALL] Found ${logs.length} logs to delete for session ${sessionId}`);
    
    // Delete all activity logs
    const logIds = logs.map((log: any) => log.id);
    if (logIds.length > 0) {
      console.log('[CLEAR ALL] Deleting log IDs:', logIds);
      await kv.mdel(logIds);
    }
    
    console.log(`[SUCCESS] Cleared ${logIds.length} activity logs for session:`, sessionId);
    return c.json({ success: true, deletedCount: logIds.length });
  } catch (error) {
    console.error("Error clearing activity logs:", error);
    return c.json({ error: "Failed to clear activity logs" }, 500);
  }
});

// Delete selected activity logs
app.delete("/make-server-9063c65e/activity-logs/delete-selected", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const body = await c.req.json();
    const { logIds } = body;
    
    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return c.json({ error: "logIds array is required" }, 400);
    }
    
    // Delete the selected activity logs
    await kv.mdel(logIds);
    
    console.log(`Deleted ${logIds.length} activity logs for session:`, sessionId);
    return c.json({ success: true, deletedCount: logIds.length });
  } catch (error) {
    console.error("Error deleting selected activity logs:", error);
    return c.json({ error: "Failed to delete selected activity logs" }, 500);
  }
});

// ==========================================
// CO-LEARNER CHAT LOGGING ENDPOINTS
// ==========================================

// Create a new co-learner chat session
app.post("/make-server-9063c65e/colearner-chats", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const body = await c.req.json();
    const { participants, problemContext, activityLogId } = body;
    
    if (!participants || participants.length < 2) {
      return c.json({ error: "At least 2 participants required" }, 400);
    }
    
    const chatId = getSessionKey(sessionId, `colearner-chat:${Date.now()}`);
    const chatSession = {
      id: chatId,
      participants: participants, // Array of participant names/IDs
      problemContext: problemContext || null, // What problem they're working on
      activityLogId: activityLogId || null, // Link to activity log if applicable
      messages: [],
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      totalMessages: 0,
      status: 'active' // active, archived, ended
    };
    
    await kv.set(chatId, chatSession);
    console.log("[SUCCESS] Co-learner chat session created:", chatId);
    
    return c.json({ success: true, chatId, session: chatSession });
  } catch (error) {
    console.error("Error creating co-learner chat session:", error);
    return c.json({ error: "Failed to create chat session" }, 500);
  }
});

// Get all co-learner chat sessions
app.get("/make-server-9063c65e/colearner-chats", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const prefix = getSessionKey(sessionId, "colearner-chat:");
    const chats = await kv.getByPrefix(prefix);
    
    // Sort by last message time (newest first)
    const sortedChats = chats.sort((a: any, b: any) => {
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
    
    return c.json({ chats: sortedChats });
  } catch (error) {
    console.error("Error fetching co-learner chats:", error);
    return c.json({ error: "Failed to fetch chats" }, 500);
  }
});

// Get a specific co-learner chat session
app.get("/make-server-9063c65e/colearner-chats/:chatId", async (c) => {
  try {
    const chatId = c.req.param("chatId");
    
    console.log('[GET] Co-learner chat, chatId:', chatId);
    
    // Chat ID is already fully scoped (session_xxx:colearner-chat:timestamp)
    const chat = await kv.get(chatId);
    
    if (!chat) {
      console.error('[ERROR] Chat session not found:', chatId);
      return c.json({ error: "Chat session not found" }, 404);
    }
    
    console.log('[SUCCESS] Chat session found:', chat.id);
    return c.json({ chat });
  } catch (error) {
    console.error("Error fetching co-learner chat:", error);
    return c.json({ error: "Failed to fetch chat" }, 500);
  }
});

// Add a message to a co-learner chat session
app.post("/make-server-9063c65e/colearner-chats/:chatId/messages", async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const body = await c.req.json();
    const { sender, message, messageType } = body;
    
    if (!sender || !message) {
      return c.json({ error: "Sender and message are required" }, 400);
    }
    
    console.log('[CHAT] POST message to chat, chatId:', chatId);
    
    // Chat ID is already fully scoped (session_xxx:colearner-chat:timestamp)
    const chat = await kv.get(chatId);
    
    if (!chat) {
      console.error('[ERROR] Chat session not found:', chatId);
      return c.json({ error: "Chat session not found" }, 404);
    }
    
    // Create new message
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: sender,
      message: message,
      messageType: messageType || 'text', // text, code, latex, diagram, etc.
      timestamp: new Date().toISOString()
    };
    
    // Add message to chat
    chat.messages.push(newMessage);
    chat.totalMessages = chat.messages.length;
    chat.lastMessageAt = newMessage.timestamp;
    
    await kv.set(chatId, chat);
    
    console.log(`[CHAT] Message added to chat ${chatId} by ${sender}`);
    
    return c.json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Error adding message to co-learner chat:", error);
    return c.json({ error: "Failed to add message" }, 500);
  }
});

// Update co-learner chat session status
app.put("/make-server-9063c65e/colearner-chats/:chatId/status", async (c) => {
  try {
    const chatId = c.req.param("chatId");
    const body = await c.req.json();
    const { status } = body;
    
    if (!status || !['active', 'archived', 'ended'].includes(status)) {
      return c.json({ error: "Valid status required (active, archived, ended)" }, 400);
    }
    
    console.log('🔄 UPDATE chat status, chatId:', chatId);
    
    // Chat ID is already fully scoped (session_xxx:colearner-chat:timestamp)
    const chat = await kv.get(chatId);
    
    if (!chat) {
      console.error('[ERROR] Chat session not found:', chatId);
      return c.json({ error: "Chat session not found" }, 404);
    }
    
    chat.status = status;
    if (status === 'ended') {
      chat.endedAt = new Date().toISOString();
    }
    
    await kv.set(chatId, chat);
    
    console.log(`[OK] Chat ${chatId} status updated to: ${status}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating co-learner chat status:", error);
    return c.json({ error: "Failed to update status" }, 500);
  }
});

// Delete a co-learner chat session
app.delete("/make-server-9063c65e/colearner-chats/:chatId", async (c) => {
  try {
    const chatId = c.req.param("chatId");
    
    console.log('🗑️ DELETE co-learner chat, chatId:', chatId);
    
    // Chat ID is already fully scoped (session_xxx:colearner-chat:timestamp)
    await kv.del(chatId);
    
    console.log(`🗑️ Co-learner chat deleted: ${chatId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting co-learner chat:", error);
    return c.json({ error: "Failed to delete chat" }, 500);
  }
});

// Clear all co-learner chats
app.delete("/make-server-9063c65e/colearner-chats/clear-all", async (c) => {
  try {
    const chats = await kv.getByPrefix("colearner-chat:");
    
    const chatIds = chats.map((chat: any) => chat.id);
    if (chatIds.length > 0) {
      await kv.mdel(chatIds);
    }
    
    console.log(`🗑️ Cleared ${chatIds.length} co-learner chats`);
    return c.json({ success: true, deletedCount: chatIds.length });
  } catch (error) {
    console.error("Error clearing co-learner chats:", error);
    return c.json({ error: "Failed to clear chats" }, 500);
  }
});

// Search co-learner chats by participant
app.get("/make-server-9063c65e/colearner-chats/search/participant/:participantName", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const participantName = c.req.param("participantName");
    const prefix = getSessionKey(sessionId, "colearner-chat:");
    const allChats = await kv.getByPrefix(prefix);
    
    // Filter chats that include this participant
    const participantChats = allChats.filter((chat: any) => 
      chat.participants.some((p: string) => 
        p.toLowerCase().includes(participantName.toLowerCase())
      )
    );
    
    // Sort by last message time
    const sortedChats = participantChats.sort((a: any, b: any) => {
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
    
    return c.json({ chats: sortedChats });
  } catch (error) {
    console.error("Error searching co-learner chats:", error);
    return c.json({ error: "Failed to search chats" }, 500);
  }
});

// Get co-learner chat statistics
app.get("/make-server-9063c65e/colearner-chats/stats", async (c) => {
  try {
    const sessionId = getSessionId(c);
    const prefix = getSessionKey(sessionId, "colearner-chat:");
    const allChats = await kv.getByPrefix(prefix);
    
    const stats = {
      totalSessions: allChats.length,
      activeSessions: allChats.filter((chat: any) => chat.status === 'active').length,
      archivedSessions: allChats.filter((chat: any) => chat.status === 'archived').length,
      endedSessions: allChats.filter((chat: any) => chat.status === 'ended').length,
      totalMessages: allChats.reduce((sum: number, chat: any) => sum + chat.totalMessages, 0),
      averageMessagesPerSession: allChats.length > 0 
        ? (allChats.reduce((sum: number, chat: any) => sum + chat.totalMessages, 0) / allChats.length).toFixed(2)
        : 0
    };
    
    return c.json({ stats });
  } catch (error) {
    console.error("Error getting co-learner chat stats:", error);
    return c.json({ error: "Failed to get stats" }, 500);
  }
});

// NEW: Diagnostic endpoint to test if AI is actually doing calculations
app.post("/make-server-9063c65e/test-calculations", async (c) => {
  try {
    const { question } = await c.req.json();
    
    if (!question) {
      return c.json({ error: "Question required" }, 400);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiKey) {
      return c.json({ error: "No OpenAI API key configured" }, 500);
    }

    console.log("🧪 DIAGNOSTIC TEST - Testing if AI does calculations...");

    const testPrompt = `You MUST do actual calculations, not just describe them.

Problem: ${question}

Create ONE step that shows actual math work. For example:
- GOOD: "Weight = mg = (60)(9.8) = 588 N"
- BAD: "Calculate the weight using W = mg"

Return JSON with "description" field containing real calculations.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: testPrompt },
          { role: "user", content: "Create the step." }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Analyze what we got back
    const hasNumbers = /\d+/.test(result.description || "");
    const hasEquals = /=/.test(result.description || "");
    const hasParenthCalc = /\(\d+\)\s*\(\d+\.?\d*\)/.test(result.description || "");
    const length = (result.description || "").length;
    
    const isGood = hasNumbers && hasEquals && length > 50;
    
    return c.json({
      testQuestion: question,
      aiResponse: result.description,
      analysis: {
        hasNumbers,
        hasEquals,
        hasParenthCalc,
        descriptionLength: length,
        verdict: isGood ? "[OK] AI IS DOING CALCULATIONS" : "[FAIL] AI GIVING INSTRUCTIONS ONLY"
      },
      promptUsed: testPrompt.substring(0, 200) + "..."
    });

  } catch (error) {
    console.error("Diagnostic test error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Generate similar practice question endpoint
app.post("/make-server-9063c65e/generate-similar-question", async (c) => {
  try {
    console.log("🎯 === PRACTICE QUESTION GENERATION STARTED ===");
    
    const { originalQuestion, originalAIData } = await c.req.json();
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    console.log("📝 Original question:", originalQuestion);
    console.log("📊 Has originalAIData:", !!originalAIData);
    console.log("🔑 Has OpenAI key:", !!openaiKey);

    if (!openaiKey) {
      console.error("❌ OPENAI_API_KEY not configured");
      return c.json({ error: "OPENAI_API_KEY not configured" }, 500);
    }

    if (!originalQuestion) {
      console.error("❌ Original question is required");
      return c.json({ error: "Original question is required" }, 400);
    }

    // Create prompt for generating similar question
    const prompt = `Based on the following solved problem, generate a SIMILAR but DIFFERENT practice problem that tests the same concepts and requires the same solution approach.

ORIGINAL PROBLEM:
${originalQuestion}

SOLUTION APPROACH USED:
${originalAIData?.strategy || 'Standard problem-solving approach'}

STEPS COVERED:
${originalAIData?.steps?.map((s: any, i: number) => `${i + 1}. ${s.title}: ${s.description}`).join('\\n') || 'N/A'}

REQUIREMENTS:
1. The new problem should be similar in structure and difficulty
2. Change the numbers, context, or specific details to create variety
3. Keep the same mathematical concepts and solution steps
4. Make it DIFFERENT enough that students must think, not just copy
5. Provide the complete step-by-step breakdown

Generate a JSON response with this structure:
{
  "question": "The new practice problem statement",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "What the student needs to do in this step",
      "expectedAnswer": "The correct answer for this step (optional)"
    }
  ],
  "fullSolution": "Complete solution explanation (optional)"
}

Use proper LaTeX notation for all mathematical expressions. For example:
- Fractions: $\\\\frac{numerator}{denominator}$
- Exponents: $x^2$
- Square roots: $\\\\sqrt{x}$
- Multiplication: $3 \\\\times 4$ or $3 \\\\cdot 4$
- Division: $\\\\div$ or use fractions`;

    console.log("🤖 Calling OpenAI to generate similar question...");
    console.log("📝 Using model: gpt-4o-mini");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert math educator who creates practice problems. Generate similar problems that help students practice what they've learned."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    console.log("📡 OpenAI response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenAI API error:", errorText);
      return c.json({ error: "Failed to generate similar question: " + errorText }, 500);
    }

    const data = await response.json();
    console.log("📦 Raw API response:", JSON.stringify(data).substring(0, 200));
    const result = JSON.parse(data.choices[0].message.content);

    console.log("✅ Similar question generated successfully!");
    console.log("📊 Generated question:", result.question?.substring(0, 100));
    console.log("📊 Number of steps:", result.steps?.length);
    return c.json(result);

  } catch (error) {
    console.error("❌ ERROR generating similar question:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    return c.json({ error: error.message }, 500);
  }
});

// Validate practice answer endpoint (without hints)
app.post("/make-server-9063c65e/validate-practice-answer", validatePracticeAnswerHandler);

// Generate diagram/figure using DALL-E
app.post("/make-server-9063c65e/generate-diagram", async (c) => {
  try {
    const body = await c.req.json();
    const { prompt, size = "1024x1024", quality = "standard" } = body;

    console.log("=== DALL-E DIAGRAM GENERATION REQUEST ===");
    console.log("Prompt:", prompt);
    console.log("Size:", size);
    console.log("Quality:", quality);
    console.log("========================================");

    if (!prompt || !prompt.trim()) {
      return c.json({ error: "Prompt is required" }, 400);
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return c.json({
        error: "No OpenAI API key configured. Please add OPENAI_API_KEY to Supabase secrets.",
      }, 500);
    }

    console.log("Calling DALL-E API...");
    
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size, // Options: "1024x1024", "1024x1792", "1792x1024"
        quality: quality, // Options: "standard", "hd"
        style: "natural" // Options: "natural", "vivid"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DALL-E API error:", errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        return c.json({
          error: "Failed to generate image",
          details: errorData.error?.message || errorText
        }, response.status);
      } catch {
        return c.json({
          error: "Failed to generate image",
          details: errorText
        }, response.status);
      }
    }

    const data = await response.json();
    console.log("DALL-E image generated successfully");
    
    // DALL-E 3 returns the image URL in data[0].url
    const imageUrl = data.data?.[0]?.url;
    const revisedPrompt = data.data?.[0]?.revised_prompt; // DALL-E may revise the prompt

    if (!imageUrl) {
      console.error("No image URL in DALL-E response:", data);
      return c.json({ error: "No image URL returned from DALL-E" }, 500);
    }

    console.log("Generated image URL:", imageUrl);
    if (revisedPrompt) {
      console.log("Revised prompt:", revisedPrompt);
    }

    return c.json({
      imageUrl: imageUrl,
      revisedPrompt: revisedPrompt,
      created: data.created
    });

  } catch (error) {
    console.error("Unexpected error in generate-diagram endpoint:", error);
    return c.json({
      error: "An unexpected error occurred",
      details: error.message
    }, 500);
  }
});

Deno.serve(app.fetch);