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

export function assessSolutionQuality(question: string, steps: any[], topicInfo?: TopicInfo): {
  allValid: boolean;
  issues: StepIssue[];
  validCount: number;
  invalidCount: number;
} {
  const issues: StepIssue[] = [];
  const expectedTerms = inferExpectedTerms(question, topicInfo);

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

    if (/x\s\d|\btimes\b|sum[a-z_]|Ã¢|Ã°/.test(`${description} ${formula} ${hint}`)) {
      issues.push({ stepIndex: index, issue: "Step still contains unprofessional math text or encoding artifacts" });
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
