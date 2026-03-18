export function createValidationPrompt(
  practiceQuestion: string,
  step: { stepNumber: number; title: string; description: string; expectedAnswer?: string },
  userAnswer: string,
  userExplanation?: string
): string {
  const explanationSection = userExplanation 
    ? `STUDENT'S EXPLANATION:
${userExplanation}`
    : `STUDENT'S EXPLANATION:
No explanation provided`;

  return `You are validating a student's answer AND explanation for a practice problem where they are working INDEPENDENTLY without hints.

PRACTICE PROBLEM:
${practiceQuestion}

CURRENT STEP:
Step ${step.stepNumber}: ${step.title}
${step.description}
${step.expectedAnswer ? `Expected answer: ${step.expectedAnswer}` : ''}

STUDENT'S ANSWER:
${userAnswer}

${explanationSection}

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
}
