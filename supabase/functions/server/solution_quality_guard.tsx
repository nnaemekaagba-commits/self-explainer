type TopicInfo = {
  domain?: string;
  subDomain?: string;
  keyTerms?: string[];
  notation?: string;
};

type StepIssue = {
  stepIndex: number;
  issue: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function lower(value: unknown): string {
  return text(value).toLowerCase();
}

function hasLatexDelimiter(value: string): boolean {
  return /\\\(|\\\[/.test(value);
}

function hasUnits(value: string): boolean {
  return /\\text\{(?:n|j|v|a|w|kg|m|s|pa|ohm|omega|rad|k?nm|hz|c)\}|(?:\bN\b|\bJ\b|\bV\b|\bA\b|\bW\b|\bPa\b|\bHz\b)/i.test(value);
}

function isFormulaEquationLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (!hasLatexDelimiter(trimmed)) return false;
  return /[=<>]|\\sum|\\frac|\\int|\\sqrt|\\Delta|\\tau|\\Phi|\\mathcal|\\sin|\\cos|\\tan/.test(trimmed);
}

function formulaHasProse(formula: string): boolean {
  return formula
    .split(/\r?\n/)
    .some((line) => !isFormulaEquationLine(line));
}

function inferExpectedTerms(question: string, topicInfo?: TopicInfo): string[] {
  const combined = `${lower(question)} ${(topicInfo?.domain || "").toLowerCase()} ${(topicInfo?.subDomain || "").toLowerCase()}`;
  if (/\b(resistor|voltage|current|circuit|ohm|kvl|kcl)\b/.test(combined)) {
    return ["voltage", "current", "resistance", "kvl", "kcl", "ohm", "loop", "node"];
  }
  if (/\b(beam|truss|static|equilibrium|moment|torque|support|force|statics)\b/.test(combined)) {
    return ["force", "moment", "equilibrium", "support", "reaction", "torque", "free body"];
  }
  if (/\b(derivative|differentiate|slope|integral|integrate|calculus)\b/.test(combined)) {
    return ["derivative", "integral", "differentiate", "slope", "substitute", "simplify"];
  }
  if (/\b(energy|momentum|kinematic|acceleration|projectile|physics)\b/.test(combined)) {
    return ["energy", "momentum", "acceleration", "velocity", "force", "kinematic"];
  }
  return [];
}

function isStaticsLike(question: string, topicInfo?: TopicInfo): boolean {
  const combined = `${lower(question)} ${(topicInfo?.domain || "").toLowerCase()} ${(topicInfo?.subDomain || "").toLowerCase()}`;
  return /\b(statics|truss|joint|member|equilibrium|support|reaction|free body|moment|pin|roller)\b/.test(combined);
}

function hintGivesAwayAnswer(hint: string): boolean {
  return /\bthe answer is\b|\btherefore\b|\bso the final answer\b|\byou get\b/i.test(hint);
}

function normalizeStepText(value: string): string {
  return lower(value)
    .replace(/\\\(|\\\)|\\\[|\\\]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordOverlapRatio(a: string, b: string): number {
  const wordsA = new Set(normalizeStepText(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalizeStepText(b).split(" ").filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  wordsA.forEach((word) => {
    if (wordsB.has(word)) overlap++;
  });

  return overlap / Math.max(wordsA.size, wordsB.size);
}

function isSimpleMathQuestion(question: string, topicInfo?: TopicInfo): boolean {
  const combined = `${lower(question)} ${(topicInfo?.domain || "").toLowerCase()} ${(topicInfo?.subDomain || "").toLowerCase()}`;
  return /\bsolve for\b|\blinear\b|\bequation\b|\bsimplify\b|\bevaluate\b|[a-z]\s*[+\-*/=]\s*\d|\d+\s*[+\-*/]\s*\d/.test(combined);
}

function inferTargetVariable(question: string): string | null {
  const solveForMatch = text(question).match(/\bsolve\s+for\s+([a-z])\b/i);
  if (solveForMatch) {
    return solveForMatch[1].toLowerCase();
  }

  const findMatch = text(question).match(/\bfind\s+([a-z])\b/i);
  if (findMatch) {
    return findMatch[1].toLowerCase();
  }

  return null;
}

function hintAsksForFinalTarget(hint: string, targetVariable: string | null): boolean {
  if (!targetVariable) return false;
  const normalizedHint = lower(hint);
  return new RegExp(`\\bwhat\\s+is\\s+${targetVariable}\\b|\\bfind\\s+${targetVariable}\\b|\\bsolve\\s+for\\s+${targetVariable}\\b|\\bvalue\\s+of\\s+${targetVariable}\\b`).test(normalizedHint);
}

function descriptionLooksFullySolved(description: string, targetVariable: string | null): boolean {
  if (!targetVariable) return false;
  const normalizedDescription = lower(description);
  return new RegExp(`\\b${targetVariable}\\s*=\\s*[-+]?\\d`).test(normalizedDescription)
    && !/\bstart with\b|\bset up\b|\bsubstitute\b|\busing\b|\bfrom\b/.test(normalizedDescription);
}

export function assessSolutionQuality(question: string, steps: any[], topicInfo?: TopicInfo): {
  allValid: boolean;
  issues: StepIssue[];
  validCount: number;
  invalidCount: number;
} {
  const issues: StepIssue[] = [];
  const expectedTerms = inferExpectedTerms(question, topicInfo);
  const simpleMathQuestion = isSimpleMathQuestion(question, topicInfo);
  const targetVariable = inferTargetVariable(question);

  if (steps.length < 3 && simpleMathQuestion) {
    issues.push({ stepIndex: 0, issue: "Simple math problem is not broken into enough distinct steps" });
  }

  steps.forEach((step, index) => {
    const description = text(step.description);
    const formula = text(step.formula);
    const hint = text(step.hint);
    const combined = lower(`${step.title || ""} ${description} ${hint} ${formula}`);

    if (!formula.trim()) {
      issues.push({ stepIndex: index, issue: "Formula field is empty" });
    } else {
      if (!hasLatexDelimiter(formula)) {
        issues.push({ stepIndex: index, issue: "Formula field is missing LaTeX delimiters" });
      }
      if (formulaHasProse(formula)) {
        issues.push({ stepIndex: index, issue: "Formula field contains prose instead of equations only" });
      }
    }

    if (!hint.trim().endsWith("?")) {
      issues.push({ stepIndex: index, issue: "Hint should end as a question for the student" });
    }

    if (hintGivesAwayAnswer(hint)) {
      issues.push({ stepIndex: index, issue: "Hint appears to give away the final answer" });
    }

    if (simpleMathQuestion && index < Math.max(steps.length - 1, 1) && hintAsksForFinalTarget(hint, targetVariable)) {
      issues.push({ stepIndex: index, issue: "Hint asks for the final target too early instead of the next partial step" });
    }

    if (simpleMathQuestion && index < Math.max(steps.length - 1, 1) && descriptionLooksFullySolved(description, targetVariable)) {
      issues.push({ stepIndex: index, issue: "Description appears to solve for the final target too early" });
    }

    if (/(engineering|physics|mechanical|electrical|civil|chemical)/i.test(`${topicInfo?.domain || ""}`) && /\d/.test(description) && !hasUnits(description)) {
      issues.push({ stepIndex: index, issue: "Engineering/physics step has numbers but no clear units" });
    }

    if (expectedTerms.length > 0 && !expectedTerms.some((term) => combined.includes(term))) {
      issues.push({ stepIndex: index, issue: `Step language does not reflect expected domain terms (${expectedTerms.slice(0, 3).join(", ")})` });
    }

    if (isStaticsLike(question, topicInfo)) {
      const allText = `${step.title || ""} ${description} ${formula} ${hint}`;
      if (!/\\sum\s*F_x|\\sum\s*F_y|\\sum\s*M/.test(allText)) {
        issues.push({ stepIndex: index, issue: "Statics step should reference an equilibrium equation such as \\sum F_x = 0, \\sum F_y = 0, or \\sum M = 0" });
      }
      if (/joint|member|truss/i.test(allText) && !/(\\sin|\\cos|component|angle|member)/.test(allText)) {
        issues.push({ stepIndex: index, issue: "Joint/member statics step should show force components or member-direction relationships" });
      }
    }

    if (/x\s\d|\btimes\b|sum[a-z_]|ÃƒÂ¢|ÃƒÂ°/.test(`${description} ${formula} ${hint}`)) {
      issues.push({ stepIndex: index, issue: "Step still contains unprofessional math text or encoding artifacts" });
    }

    if (index > 0) {
      const previousStep = steps[index - 1] || {};
      const titleOverlap = wordOverlapRatio(text(step.title), text(previousStep.title));
      const descriptionOverlap = wordOverlapRatio(description, text(previousStep.description));

      if (titleOverlap > 0.8 && descriptionOverlap > 0.72) {
        issues.push({ stepIndex: index, issue: "Step repeats the previous step instead of advancing the solution" });
      }
    }

    if (wordOverlapRatio(description, hint) > 0.8) {
      issues.push({ stepIndex: index, issue: "Hint is too similar to the description and does not create a distinct next action" });
    }
  });

  const uniqueIssues = issues.filter((issue, issueIndex) =>
    issues.findIndex((candidate) => candidate.stepIndex === issue.stepIndex && candidate.issue === issue.issue) === issueIndex
  );

  const invalidSteps = new Set(uniqueIssues.map((issue) => issue.stepIndex));
  return {
    allValid: uniqueIssues.length === 0,
    issues: uniqueIssues,
    validCount: steps.length - invalidSteps.size,
    invalidCount: invalidSteps.size
  };
}
