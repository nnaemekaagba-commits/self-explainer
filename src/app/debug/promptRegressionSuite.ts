export interface PromptRegressionCase {
  id: string;
  label: string;
  question: string;
  expectedDomain: string;
}

export interface PromptRegressionIssue {
  severity: 'error' | 'warning';
  message: string;
}

export interface PromptRegressionResult {
  id: string;
  label: string;
  question: string;
  expectedDomain: string;
  passed: boolean;
  issues: PromptRegressionIssue[];
  stepCount: number;
}

interface SolveProblemStepLike {
  title?: string;
  description?: string;
  hint?: string;
  formula?: string;
}

interface SolveProblemResponseLike {
  strategy?: string;
  extractedQuestion?: string;
  steps?: SolveProblemStepLike[];
}

export const PROMPT_REGRESSION_CASES: PromptRegressionCase[] = [
  {
    id: 'statics-table-load',
    label: 'Statics Load Sharing',
    expectedDomain: 'Mechanical Engineering / Statics',
    question: 'A 60 kg person stands at the center of a table with four legs. Find the normal force on each leg.',
  },
  {
    id: 'statics-joint-equilibrium',
    label: 'Statics Joint Equilibrium',
    expectedDomain: 'Mechanical Engineering / Statics',
    question: 'At joint A of a truss, a 300 N horizontal load acts to the right and a 520 N force acts along member AD. Determine the forces in members AB and AC by applying joint equilibrium.',
  },
  {
    id: 'quadratic-equation',
    label: 'Quadratic Formula',
    expectedDomain: 'Mathematics / Algebra',
    question: 'Solve the quadratic equation x^2 - 6x + 8 = 0 using the quadratic formula.',
  },
  {
    id: 'power-rule-derivative',
    label: 'Derivative Power Rule',
    expectedDomain: 'Mathematics / Calculus',
    question: 'Differentiate f(x) = 3x^4 - 5x^2 + 7x - 9.',
  },
  {
    id: 'series-circuit',
    label: 'Series Circuit KVL',
    expectedDomain: 'Electrical Engineering / Circuit Analysis',
    question: 'A 12 V source is connected to two series resistors, R1 = 100 ohms and R2 = 200 ohms. Find the current and the voltage drop across each resistor.',
  },
];

const MOJIBAKE_PATTERN = /â|Â|Î|Ã|ðŸ|���/;
const BAD_PLAIN_MATH_PATTERNS = [
  /\bsum[A-Za-z_]/,
  /\bsum\b/i,
  /\bsqrt\(/i,
  /\btimes\b/i,
  /\btheta\b/i,
  /\balpha\b/i,
  /\bomega\b/i,
  /\bpi\b/i,
  /\b\d+\s*x\s*\d+\b/i,
  /\b[A-Za-z]\w*\s*=\s*[-+]?[\w(]/,
];

function stripLatexRegions(text: string): string {
  return text
    .replace(/\\\([\s\S]*?\\\)/g, ' ')
    .replace(/\\\[[\s\S]*?\\\]/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$]+\$/g, ' ');
}

function containsLatexDelimiter(text: string): boolean {
  return /\\\(|\\\[|\$\$|\$[^$]+\$/.test(text);
}

function validateMathText(text: string, location: string, issues: PromptRegressionIssue[]) {
  if (!text) return;

  if (MOJIBAKE_PATTERN.test(text)) {
    issues.push({ severity: 'error', message: `${location}: contains encoding artifacts` });
  }

  const plainText = stripLatexRegions(text);
  for (const pattern of BAD_PLAIN_MATH_PATTERNS) {
    if (pattern.test(plainText)) {
      issues.push({ severity: 'warning', message: `${location}: possible plain-text math leak -> ${pattern}` });
      break;
    }
  }
}

export function evaluatePromptRegressionCase(
  testCase: PromptRegressionCase,
  response: SolveProblemResponseLike,
): PromptRegressionResult {
  const issues: PromptRegressionIssue[] = [];
  const steps = response.steps || [];

  if (steps.length < 3 || steps.length > 6) {
    issues.push({
      severity: 'warning',
      message: `Expected 3-6 steps, received ${steps.length}`,
    });
  }

  if (response.strategy && !containsLatexDelimiter(response.strategy)) {
    issues.push({
      severity: 'warning',
      message: 'Strategy does not appear to include any LaTeX math',
    });
  }

  validateMathText(response.strategy || '', 'strategy', issues);
  validateMathText(response.extractedQuestion || '', 'extractedQuestion', issues);

  steps.forEach((step, index) => {
    const stepLabel = `step ${index + 1}`;

    if (!step.formula || !step.formula.trim()) {
      issues.push({ severity: 'error', message: `${stepLabel}: formula field is empty` });
    } else {
      if (!containsLatexDelimiter(step.formula)) {
        issues.push({ severity: 'error', message: `${stepLabel}: formula lacks LaTeX delimiters` });
      }
      validateMathText(step.formula, `${stepLabel} formula`, issues);
    }

    if (!step.description || !step.description.trim()) {
      issues.push({ severity: 'error', message: `${stepLabel}: description is empty` });
    } else {
      if (!containsLatexDelimiter(step.description)) {
        issues.push({ severity: 'warning', message: `${stepLabel}: description may be missing LaTeX math` });
      }
      validateMathText(step.description, `${stepLabel} description`, issues);
    }

    if (!step.hint || !step.hint.trim()) {
      issues.push({ severity: 'warning', message: `${stepLabel}: hint is empty` });
    } else {
      if (!step.hint.includes('?')) {
        issues.push({ severity: 'warning', message: `${stepLabel}: hint is not phrased as a question` });
      }
      validateMathText(step.hint, `${stepLabel} hint`, issues);
    }
  });

  if (testCase.id === 'statics-joint-equilibrium') {
    const allText = steps
      .map((step) => `${step.title || ''} ${step.description || ''} ${step.hint || ''} ${step.formula || ''}`)
      .join(' ');

    if (!/\\sum\s*F_x|\\sum\s*F_y/.test(allText)) {
      issues.push({
        severity: 'error',
        message: 'Statics joint case should include explicit equilibrium equations such as \\sum F_x = 0 and \\sum F_y = 0',
      });
    }

    if (!/F_\{AB\}|F_\{AC\}/.test(allText)) {
      issues.push({
        severity: 'error',
        message: 'Statics joint case should use proper member-force notation like F_{AB} and F_{AC}',
      });
    }

    if (!/\\sin|\\cos/.test(allText)) {
      issues.push({
        severity: 'warning',
        message: 'Statics joint case should usually show component resolution with \\sin or \\cos when members are inclined',
      });
    }
  }

  return {
    id: testCase.id,
    label: testCase.label,
    question: testCase.question,
    expectedDomain: testCase.expectedDomain,
    passed: !issues.some((issue) => issue.severity === 'error'),
    issues,
    stepCount: steps.length,
  };
}
