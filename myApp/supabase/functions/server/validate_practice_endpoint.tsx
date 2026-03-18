import type { Context } from "npm:hono";

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

    console.log("Answer and explanation validated:", result);
    return c.json(result);

  } catch (error) {
    console.error("Error validating practice answer:", error);
    return c.json({ error: error.message }, 500);
  }
}
