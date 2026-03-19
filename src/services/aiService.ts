import { projectId, publicAnonKey } from '../../utils/supabase/info';

// API configuration
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;
const USE_DEMO_MODE = false; // Real AI mode - backend connected

interface SolveProblemResponse {
  solution: string;
  strategy: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    hint: string;
    formula: string;
  }>;
  extractedQuestion?: string;
  diagram?: {
    svg: string;
    description: string;
  };
}

interface HintResponse {
  hint: string;
}

interface ValidateAnswerResponse {
  isCorrect: boolean;
  feedback: string;
}


function extractFirstNumberAfterKeyword(question: string, keyword: string): number | null {
  const regex = new RegExp(`${keyword}\\s*(?:of\\s*)?([-+]?\\d*\\.?\\d+)`, 'i');
  const match = question.match(regex);
  return match ? Number(match[1]) : null;
}

function parseSimpleLinearEquation(question: string): { a: number; b: number; c: number } | null {
  const cleaned = question.replace(/\s+/g, '').replace(/−/g, '-');
  const match = cleaned.match(/([-+]?\d*\.?\d*)x([+-]\d+\.?\d*)?=([-+]?\d+\.?\d*)/i);
  if (!match) return null;

  const aRaw = match[1];
  const bRaw = match[2] || '+0';
  const cRaw = match[3];

  const a = aRaw === '' || aRaw === '+' ? 1 : aRaw === '-' ? -1 : Number(aRaw);
  const b = Number(bRaw);
  const c = Number(cRaw);

  if ([a, b, c].some((n) => Number.isNaN(n))) return null;
  return { a, b, c };
}

// Generate problem-specific partial solution
function generatePartialSolution(question: string): {
  solution: string;
  strategy: string;
  steps: Array<{ title: string; description: string; formula: string }>;
} {
  const lowerQ = question.toLowerCase();

  // Detect problem type and generate specific solution

  // Linear equations (e.g., "solve for x: 2x + 5 = 15")
  if (lowerQ.includes('solve for') || (lowerQ.includes('=') && lowerQ.includes('x'))) {
    const parsed = parseSimpleLinearEquation(question);
    if (parsed) {
      const { a, b, c } = parsed;
      const rhsAfterConstant = c - b;
      return {
        solution: `To solve this linear equation, isolate \(x\) using inverse operations while keeping both sides balanced.`,
        strategy: `First remove the constant term, then divide by the coefficient of \(x\). I will complete the setup and leave the last simple arithmetic step for the student.`,
        steps: [
          {
            title: "Write the equation in working form",
            description: `Start with \(${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}\). We want the \(x\)-term by itself, so the first move is to undo ${b >= 0 ? `\(+${b}\)` : `\(-${Math.abs(b)}\)`}.`,
            formula: `\\(${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${c}\\)`
          },
          {
            title: "Remove the constant term",
            description: `Subtract ${b} from both sides: \(${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} ${b >= 0 ? '-' : '+'} ${Math.abs(b)} = ${c} ${b >= 0 ? '-' : '+'} ${Math.abs(b)}\), so \(${a}x = ${rhsAfterConstant}\).`,
            formula: `\\(${a}x = ${rhsAfterConstant}\\)`
          },
          {
            title: "Isolate the variable",
            description: `Now divide both sides by the coefficient of \(x\): \(x = \\frac{${rhsAfterConstant}}{${a}}\).`,
            formula: `\\(x = \\frac{${rhsAfterConstant}}{${a}}\\)`
          },
          {
            title: "Finish the last arithmetic step",
            description: `The algebra is complete. Only the final numerical simplification remains.`,
            formula: `\\(x = \\frac{${rhsAfterConstant}}{${a}}\\)`
          }
        ].map((step, index) => ({
          ...step,
          hint: index === 2 || index === 3 ? `Complete the division \\(\\frac{${rhsAfterConstant}}{${a}}\\). What is the value of \\(x\\)?` : ''
        }))
      };
    }
    return {
      solution: `To solve this equation, isolate the variable by performing inverse operations on both sides.`,
      strategy: `I will set up the balancing steps and leave the final simplification for the student.`,
      steps: [
        {
          title: "Identify the Equation",
          description: `Given equation: ${question.split(':')[1]?.trim() || question}. We need to isolate the variable.`,
          formula: "\\(ax + b = c\\)"
        },
        {
          title: "Eliminate Constants",
          description: "Move the constant term away from the variable by doing the opposite operation on both sides.",
          formula: "\\(ax + b = c \\Rightarrow ax = c - b\\)"
        },
        {
          title: "Solve for the Variable",
          description: "After the constant is removed, divide both sides by the coefficient of the variable.",
          formula: "\\(ax = d \\Rightarrow x = \\frac{d}{a}\\)"
        }
      ].map((step, index) => ({
        ...step,
        hint: index === 2 ? 'Carry out the final division to get the numerical value of the variable.' : ''
      }))
    };
  }

  // Quadratic equations
  if (lowerQ.includes('quadratic') || lowerQ.includes('x²') || lowerQ.includes('x^2')) {
    return {
      solution: `This is a quadratic equation. You can solve it by factoring, completing the square, or using the quadratic formula.`,
      strategy: `For quadratic equations in the form ax² + bx + c = 0, the quadratic formula is often the most reliable method.`,
      steps: [
        {
          title: "Write in Standard Form",
          description: "Rearrange the equation to the form ax² + bx + c = 0.",
          formula: "ax² + bx + c = 0"
        },
        {
          title: "Identify Coefficients",
          description: "Identify the values of a, b, and c from your equation.",
          formula: "a = coefficient of x², b = coefficient of x, c = constant term"
        },
        {
          title: "Apply Quadratic Formula",
          description: "Substitute a, b, and c into the quadratic formula.",
          formula: "x = (-b ± √(b² - 4ac)) / (2a)"
        },
        {
          title: "Simplify",
          description: "Calculate the discriminant (b² - 4ac) and solve for both possible values of x.",
          formula: ""
        }
      ]
    };
  }

  // Area problems
  if (lowerQ.includes('area') && (lowerQ.includes('circle') || lowerQ.includes('radius'))) {
    const radius = extractFirstNumberAfterKeyword(question, 'radius');
    const radiusSquared = radius !== null ? radius * radius : null;
    return {
      solution: `To find the area of a circle, use \(A = \pi r^2\).`,
      strategy: `Square the radius first, substitute it into the formula, and leave the final multiplication by \(\pi\) to the student.`,
      steps: [
        {
          title: "Identify the radius",
          description: radius !== null ? `The given radius is \(r = ${radius}\).` : `Identify the radius from the problem statement before substituting into the area formula.`,
          formula: "\\(A = \\pi r^2\\)"
        },
        {
          title: "Substitute into the formula",
          description: radius !== null ? `Substitute \(r = ${radius}\) into \(A = \\pi r^2\): \(A = \\pi(${radius})^2\).` : `Write the formula with the specific radius value substituted in.`,
          formula: radius !== null ? `\\(A = \\pi(${radius})^2\\)` : "\\(A = \\pi r^2\\)"
        },
        {
          title: "Complete the squaring step",
          description: radiusSquared !== null ? `Square the radius: \(A = \\pi(${radiusSquared})\).` : `Square the radius value before multiplying by \(\\pi\).`,
          formula: radiusSquared !== null ? `\\(A = ${radiusSquared}\\pi\\)` : "\\(A = \\pi r^2\\)",
          hint: radiusSquared !== null ? `Now multiply ${radiusSquared} by \\(\\pi\\) and give the area in square units.` : `What do you get after squaring the radius and multiplying by \\(\\pi\\)?`
        }
      ]
    };
  }

  // Derivatives
  if (lowerQ.includes('derivative') || lowerQ.includes('differentiate')) {
    return {
      solution: `To find the derivative, apply the power rule: d/dx(xⁿ) = n·xⁿ⁻¹. For polynomials, differentiate each term separately.`,
      strategy: `Break down the function into individual terms, apply the power rule to each, and combine the results.`,
      steps: [
        {
          title: "Identify the Function",
          description: `The function to differentiate is: ${question.split('of')[1]?.trim() || 'f(x)'}`,
          formula: ""
        },
        {
          title: "Apply Power Rule to Each Term",
          description: "For each term axⁿ, the derivative is n·axⁿ���¹. Constants become 0.",
          formula: "d/dx(xⁿ) = n·xⁿ⁻¹"
        },
        {
          title: "Combine the Terms",
          description: "Add all the differentiated terms together to get the final derivative.",
          formula: ""
        },
        {
          title: "Simplify",
          description: "Simplify your answer by combining like terms if possible.",
          formula: ""
        }
      ]
    };
  }

  // Percentage problems
  if (lowerQ.includes('%') || lowerQ.includes('percent')) {
    return {
      solution: `To solve percentage problems, convert the percentage to a decimal and multiply, or use the formula: (part/whole) × 100 = percentage.`,
      strategy: `Remember: "of" means multiply, "is" means equals. Convert percentage to decimal by dividing by 100.`,
      steps: [
        {
          title: "Identify What You're Finding",
          description: "Determine whether you're finding the percentage, the part, or the whole.",
          formula: ""
        },
        {
          title: "Set Up the Equation",
          description: "Use the formula: (Part/Whole) × 100 = Percentage, or rearrange as needed.",
          formula: "Part = (Percentage/100) × Whole"
        },
        {
          title: "Calculate",
          description: "Perform the multiplication or division to find the answer.",
          formula: ""
        },
        {
          title: "Check Reasonableness",
          description: "Verify that your answer makes sense in the context of the problem.",
          formula: ""
        }
      ]
    };
  }

  // Generic fallback with problem context
  return {
    solution: `Let's solve "${question}" step by step. First, we need to understand what the problem is asking for.`,
    strategy: `Break down the problem: identify what you know, what you need to find, and which mathematical concepts apply to this specific problem.`,
    steps: [
      {
        title: "Understand the Problem",
        description: `Read carefully: "${question}". Identify what is being asked and what information is given.`,
        formula: ""
      },
      {
        title: "Identify the Method",
        description: "Based on the problem type, determine which mathematical formula or approach to use.",
        formula: ""
      },
      {
        title: "Set Up the Solution",
        description: "Write out the equation or method you'll use with the specific numbers from this problem.",
        formula: ""
      },
      {
        title: "Solve and Verify",
        description: "Work through the calculations, then check if your answer makes sense.",
        formula: ""
      }
    ]
  };
}

// Test backend connection
export async function testConnection(): Promise<boolean> {
  try {
    // Check health
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    const healthText = await healthResponse.text();
    console.log('Health check response status:', healthResponse.status);
    console.log('Health check response body:', healthText);

    if (healthResponse.ok) {
      console.log('✅ Backend is reachable and responding');
    } else {
      console.error('❌ Backend returned error status:', healthResponse.status);
    }

    // Check API keys
    const keysResponse = await fetch(`${API_BASE_URL}/check-keys`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });

    if (keysResponse.ok) {
      const keysData = await keysResponse.json();
      console.log('\n🔑 API Keys Status:', keysData);

      if (!keysData.hasOpenAI) {
        console.error('❌ NO API KEY FOUND!');
        console.error('📝 Please add OPENAI_API_KEY in Make settings > Supabase secrets');
        console.error('⚠️  After adding, you MUST redeploy the edge function!');
      } else {
        console.log('✅ API key configured!');
        if (keysData.hasOpenAI) console.log('  - OpenAI:', keysData.openaiKeyPrefix);
      }
    }

    return healthResponse.ok;
  } catch (error) {
    console.error('❌ Health check failed - backend not reachable:', error);
    return false;
  }
}

// Fallback to demo mode with problem-specific solution
function getDemoSolution(question: string, imageUrl?: string): Promise<SolveProblemResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate OCR/text extraction for images
      let extractedQuestion = question;

      if (imageUrl && question.includes('analyze this image')) {
        // Demo: simulate extracting text from image
        extractedQuestion = "Solve for x: 3x + 7 = 22\n\n(Fallback mode: the backend did not return a full AI solution, so a local guided solution was generated instead.)";
      } else if (question.includes('PDF document')) {
        extractedQuestion = "Calculate the area of a circle with radius 5cm\n\n(Fallback mode: the backend did not return a full AI solution, so a local guided solution was generated instead.)";
      } else if (question.startsWith('Uploaded file:')) {
        extractedQuestion = "Example math problem extracted from file\n\n(Fallback mode: the backend did not return a full AI solution, so a local guided solution was generated instead.)";
      }

      
function extractFirstNumberAfterKeyword(question: string, keyword: string): number | null {
  const regex = new RegExp(`${keyword}\\s*(?:of\\s*)?([-+]?\\d*\\.?\\d+)`, 'i');
  const match = question.match(regex);
  return match ? Number(match[1]) : null;
}

function parseSimpleLinearEquation(question: string): { a: number; b: number; c: number } | null {
  const cleaned = question.replace(/\s+/g, '').replace(/−/g, '-');
  const match = cleaned.match(/([-+]?\d*\.?\d*)x([+-]\d+\.?\d*)?=([-+]?\d+\.?\d*)/i);
  if (!match) return null;

  const aRaw = match[1];
  const bRaw = match[2] || '+0';
  const cRaw = match[3];

  const a = aRaw === '' || aRaw === '+' ? 1 : aRaw === '-' ? -1 : Number(aRaw);
  const b = Number(bRaw);
  const c = Number(cRaw);

  if ([a, b, c].some((n) => Number.isNaN(n))) return null;
  return { a, b, c };
}

// Generate problem-specific partial solution
      const problemSpecificSolution = generatePartialSolution(extractedQuestion);

      resolve({
        solution: problemSpecificSolution.solution,
        strategy: problemSpecificSolution.strategy,
        extractedQuestion: extractedQuestion,
        steps: problemSpecificSolution.steps.map((step, index) => ({
          stepNumber: index + 1,
          title: step.title,
          description: step.description,
          hint: '',
          formula: step.formula
        }))
      });
    }, 1000);
  });
}

export async function solveProblem(question: string, imageUrl?: string, apiProvider?: 'openai' | 'gemini'): Promise<SolveProblemResponse> {
  // If demo mode, return demo data immediately
  if (USE_DEMO_MODE) {
    return getDemoSolution(question, imageUrl);
  }

  console.log('=== AI SERVICE: solveProblem ===');
  console.log('📥 Question:', question);
  console.log('🖼️ Image provided:', !!imageUrl);
  console.log('🤖 API Provider:', apiProvider || 'default');
  if (imageUrl) {
    console.log('📐 Image data length:', imageUrl.length);
    console.log('🔗 Image URL prefix:', imageUrl.substring(0, 100) + '...');
  }
  console.log('🌐 API URL:', `${API_BASE_URL}/solve-problem`);
  console.log('🔑 Using auth key (first 20 chars):', publicAnonKey.substring(0, 20) + '...');
  console.log('================================');

  try {
    const requestBody = { question, imageUrl, apiProvider };
    console.log('📤 Sending request body:', JSON.stringify({ 
      question, 
      hasImage: !!imageUrl,
      imageUrlLength: imageUrl?.length || 0,
      apiProvider: apiProvider || 'default'
    }));
    
    console.log('⏳ Starting fetch request...');
    const fetchStartTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}/solve-problem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`✅ Fetch completed in ${fetchDuration}ms`);
    console.log('📡 Backend response status:', response.status);
    console.log('📡 Backend response statusText:', response.statusText);
    console.log('📡 Backend response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error response:', errorText);
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(errorText);
        console.error('❌ Detailed error info:', errorData);
        
        if (errorData.debugInfo) {
          console.error('🔍 OpenAI Error:', errorData.debugInfo.openaiError);
        }
        
        throw new Error(`Backend returned ${response.status}: ${errorData.error || errorText}`);
      } catch (e) {
        // Error text is not JSON
        throw new Error(`Backend returned ${response.status}: ${errorText}`);
      }
    }

    const responseText = await response.text();
    console.log('✅ Response received, length:', responseText.length);
    console.log('📄 Response preview:', responseText.substring(0, 200) + '...');

    try {
      const parsedResponse = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON response');
      console.log('📊 Response has steps:', parsedResponse.steps?.length || 0);
      return parsedResponse;
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('📄 Full response text:', responseText);
      console.warn('⚠️  Backend returned invalid JSON, falling back to demo mode');
      return getDemoSolution(question, imageUrl);
    }
  } catch (error) {
    console.error('❌ Error solving problem:', error);
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 NETWORK ERROR: Cannot reach the backend server');
      console.error('   Possible causes:');
      console.error('   1. Edge function not deployed');
      console.error('   2. Edge function has errors and crashed');
      console.error('   3. Network connectivity issue');
      console.error('   4. CORS policy blocking the request');
      console.error('   💡 Check Supabase Dashboard > Edge Functions for deployment status');
    }
    
    console.warn('⚠️  Backend error, falling back to demo mode');
    return getDemoSolution(question, imageUrl);
  }
}

export async function getHint(question: string, stepNumber: number): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/get-hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ question, stepNumber })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get hint');
    }

    const data: HintResponse = await response.json();
    return data.hint;
  } catch (error) {
    console.error('Error getting hint:', error);
    throw error;
  }
}

export async function validateAnswer(
  question: string,
  studentAnswer: string,
  stepNumber: number
): Promise<ValidateAnswerResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ question, studentAnswer, stepNumber })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to validate answer');
    }

    return await response.json();
  } catch (error) {
    console.error('Error validating answer:', error);
    throw error;
  }
}

export async function validateStep(
  stepData: {
    stepNumber: number;
    title: string;
    description: string;
    hint: string;
    formula: string;
  },
  userAnswer: string,
  userExplanation: string,
  answerImageUrl?: string,
  explanationImageUrl?: string
): Promise<{
  answerCorrect: boolean;
  explanationCorrect: boolean;
  feedback: string;
}> {
  const response = await fetch(`${API_BASE_URL}/validate-step`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ 
      stepData, 
      userAnswer, 
      userExplanation,
      answerImageUrl,
      explanationImageUrl
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to validate step");
  }

  return response.json();
}

export async function askAIForHelp(
  question: string,
  context: {
    stepNumber: number;
    hint: string;
    userAnswer: string;
    userExplanation: string;
    answerCorrect: boolean;
    explanationCorrect: boolean;
    originalQuestion?: string;  // The original problem being solved
    stepData?: {  // Full step context
      title?: string;
      description?: string;
      formula?: string;
      diagram?: string;
    };
    answerImageUrl?: string;  // Image of student's answer
    explanationImageUrl?: string;  // Image of student's explanation
    previousMessages?: Array<{role: 'user' | 'ai', content: string}>;  // Chat history
  }
): Promise<string> {
  // If in demo mode, return mock response
  if (USE_DEMO_MODE) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Great question! Let me help you understand this better. Looking at your answer "${context.userAnswer}", I notice you're on the right track. Consider: What happens when you ${context.hint.toLowerCase()}? Try breaking down the problem into smaller parts.`);
      }, 1000);
    });
  }

  const response = await fetch(`${API_BASE_URL}/ask-help`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({ question, context })
  });

  if (!response.ok) {
    throw new Error('Failed to get AI help');
  }

  const data = await response.json();
  return data.response;
}

// Generate diagram/visualization for concepts
export async function generateDiagram(
  concept: string,
  context?: string
): Promise<{ svg: string; concept: string; fallback?: boolean }> {
  console.log("🎨 Requesting diagram for:", concept);

  const response = await fetch(`${API_BASE_URL}/generate-diagram`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({ concept, context })
  });

  if (!response.ok) {
    throw new Error('Failed to generate diagram');
  }

  const data = await response.json();
  console.log("✅ Diagram generated:", data);
  return data;
}

// Generate DALL-E image for educational diagrams
export async function generateDalleImage(
  prompt: string,
  size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024',
  quality: 'standard' | 'hd' = 'standard'
): Promise<{ imageUrl: string; revisedPrompt?: string }> {
  console.log("🎨 Requesting DALL-E image for:", prompt);

  const response = await fetch(`${API_BASE_URL}/generate-diagram`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({ prompt, size, quality })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate DALL-E image');
  }

  const data = await response.json();
  console.log("✅ DALL-E image generated:", data.imageUrl);
  return {
    imageUrl: data.imageUrl,
    revisedPrompt: data.revisedPrompt
  };
}

export async function generateStepSolution(
  stepData: {
    stepNumber: number;
    title: string;
    description: string;
    hint: string;
    formula: string;
  },
  questionContext?: string
): Promise<{
  correctAnswer: string;
  correctExplanation: string;
}> {
  try {
    console.log('Calling generate-step-solution API with:', { stepData, questionContext });
    
    const response = await fetch(`${API_BASE_URL}/generate-step-solution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ stepData, questionContext })
    });

    console.log('API response status:', response.status);
    
    const data = await response.json();
    console.log('API response data:', data);

    if (!response.ok) {
      throw new Error(data.error || `Failed to generate step solution (${response.status})`);
    }

    return {
      correctAnswer: data.correctAnswer,
      correctExplanation: data.correctExplanation
    };
  } catch (error) {
    console.error('Error generating step solution:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

// Generate a similar practice question based on the original question
export async function generateSimilarQuestion(
  originalQuestion: string,
  originalAIData: any
): Promise<{
  question: string;
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    expectedAnswer?: string;
  }>;
  fullSolution?: string;
}> {
  try {
    console.log('🎯 Generating similar practice question...');
    console.log('📝 Request payload:', { 
      originalQuestion, 
      hasOriginalAIData: !!originalAIData,
      originalAIDataKeys: originalAIData ? Object.keys(originalAIData) : []
    });
    
    const response = await fetch(`${API_BASE_URL}/generate-similar-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ 
        originalQuestion, 
        originalAIData 
      })
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error response:', errorText);
      let errorObj;
      try {
        errorObj = JSON.parse(errorText);
        console.error('❌ Parsed error object:', errorObj);
      } catch (e) {
        console.error('❌ Could not parse error as JSON');
      }
      throw new Error(errorObj?.error || errorText || 'Failed to generate similar question');
    }

    const data = await response.json();
    console.log('✅ Similar question generated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error generating similar question:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error constructor:', error?.constructor?.name);
    console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
}

// Validate a practice answer without providing hints
export async function validatePracticeAnswer(
  practiceQuestion: string,
  step: {
    stepNumber: number;
    title: string;
    description: string;
    expectedAnswer?: string;
  },
  userAnswer: string,
  userExplanation?: string
): Promise<{
  answerCorrect: boolean;
  explanationCorrect: boolean;
  answerFeedback: string;
  explanationFeedback: string;
}> {
  try {
    console.log('🔍 Validating practice answer...');
    
    const response = await fetch(`${API_BASE_URL}/validate-practice-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ 
        practiceQuestion, 
        step, 
        userAnswer,
        userExplanation 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to validate practice answer');
    }

    const data = await response.json();
    console.log('✅ Practice answer validated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error validating practice answer:', error);
    throw error;
  }
}