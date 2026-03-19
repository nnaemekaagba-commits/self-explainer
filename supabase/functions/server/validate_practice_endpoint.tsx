import type { Context } from "npm:hono";

function normalizeComparisonText(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\left|\\right/g, "")
    .replace(/\\,/g, "")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/\\pm/g, "+-")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/[(){}\[\]\s,$]/g, "")
    .replace(/[−–]/g, "-");
}

function extractAnswerCore(value: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/=|≈|:|→/).map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : trimmed;
}

function parseNumericValue(value: string): number | null {
  const core = extractAnswerCore(value);
  if (!core) return null;

  const fractionMatch = core.match(/^([-+]?\d*\.?\d+)\s*\/\s*([-+]?\d*\.?\d+)$/);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  const numericMatch = core.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
  if (!numericMatch) return null;
  const parsed = Number(numericMatch[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function answersEquivalent(studentAnswer: string, expectedAnswer?: string): boolean {
  if (!studentAnswer || !expectedAnswer) return false;

  const studentCore = extractAnswerCore(studentAnswer);
  const expectedCore = extractAnswerCore(expectedAnswer);
  if (!studentCore || !expectedCore) return false;

  if (normalizeComparisonText(studentCore) === normalizeComparisonText(expectedCore)) {
    return true;
  }

  const studentNumeric = parseNumericValue(studentCore);
  const expectedNumeric = parseNumericValue(expectedCore);
  if (studentNumeric !== null && expectedNumeric !== null) {
    return Math.abs(studentNumeric - expectedNumeric) <= 1e-6;
  }

  return false;
}

function explanationLooksReasonable(text: string): boolean {
  const normalized = (text || "").trim().toLowerCase();
  if (!normalized || normalized === "no explanation provided") return false;
  if (normalized.split(/\s+/).length < 4) return false;
  return /\b(because|so|therefore|using|apply|substitute|divide|multiply|equilibrium|force|moment|formula|equation|simplify|isolate)\b/.test(normalized);
}

export async function validatePracticeAnswerHandler(c: Context) {
  try {
    console.log("Validating practice answer...");
    
    const { practiceQuestion, step, userAnswer, userExplanation } = await c.req.json();
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return c.json({ error: "OPENAI_API_KEY not configured" }, 500);
    }

    if (!practiceQuestion || !step || !userAnswer) {
      return c.json({ error: "Missing required parameters" }, 400);
    }

    // Build explanation section safely
    const explanationText = userExplanation || 'No explanation provided';
    
    // Create prompt for validation
    const prompt = `You are validating a student's answer AND explanation for a practice problem where they are working INDEPENDENTLY without hints.

PRACTICE PROBLEM:
${practiceQuestion}

CURRENT STEP:
Step ${step.stepNumber}: ${step.title}
${step.description}
${step.expectedAnswer ? `Expected answer: ${step.expectedAnswer}` : ''}

STUDENT'S ANSWER:
${userAnswer}

STUDENT'S EXPLANATION:
${explanationText}

Evaluate BOTH the student's answer and their explanation for this step. Be reasonably lenient - accept equivalent forms and reasonable approximations.

Provide your response as JSON:
{
  "answerCorrect": true or false,
  "explanationCorrect": true or false,
  "answerFeedback": "Brief feedback on the answer",
  "explanationFeedback": "Brief feedback on the explanation"
}

For the ANSWER:
- If CORRECT: Provide brief encouraging feedback
- If INCORRECT: Explain what's wrong WITHOUT giving away the answer, suggest what to reconsider

For the EXPLANATION:
- If provided and CORRECT: Acknowledge their reasoning
- If provided but INCORRECT: Point out gaps in reasoning without giving the full answer
- If NOT provided: Gently encourage them to explain their thinking

Use LaTeX notation for any math in the feedback.`;

    console.log("Calling OpenAI to validate answer and explanation...");
    
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
            content: "You are a supportive math tutor validating student work during independent practice. Be fair but encouraging. Evaluate both numerical answers and conceptual explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return c.json({ error: "Failed to validate answer" }, 500);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    if (answersEquivalent(userAnswer, step.expectedAnswer)) {
      result.answerCorrect = true;
      if (!result.answerFeedback || /wrong|incorrect|reconsider|check/i.test(result.answerFeedback)) {
        result.answerFeedback = `Your answer is mathematically equivalent to the expected result \\(${step.expectedAnswer}\\).`;
      }
    }

    if (userExplanation && explanationLooksReasonable(userExplanation) && result.explanationCorrect === false) {
      result.explanationCorrect = true;
      if (!result.explanationFeedback || /wrong|incorrect|gap|missing/i.test(result.explanationFeedback)) {
        result.explanationFeedback = "Your explanation shows the main idea for this step.";
      }
    }

    console.log("Answer and explanation validated:", result);
    return c.json(result);

  } catch (error) {
    console.error("Error validating practice answer:", error);
    return c.json({ error: error.message }, 500);
  }
}
