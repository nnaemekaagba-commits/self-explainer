/**
 * Formula Fixer - Ensures professional mathematical notation in all formulas
 * Converts plain text symbols to proper LaTeX commands.
 */

const BROKEN_SYMBOL_MAP: Array<[string, string]> = [
  ['âˆ’', '−'],
  ['âˆš', '√'],
  ['Â±', '±'],
  ['Ã—', '×'],
  ['Ã·', '÷'],
  ['â‰¤', '≤'],
  ['â‰¥', '≥'],
  ['â‰ ', '≠'],
  ['â‰ˆ', '≈'],
  ['â†’', '→'],
  ['â†', '←'],
  ['Â²', '²'],
  ['Â³', '³'],
  ['Â°', '°'],
  ['Â·', '·'],
  ['Âπ', 'π'],
  ['Â', ''],
];

function normalizeBrokenSymbols(text: string): string {
  return BROKEN_SYMBOL_MAP.reduce((fixed, [broken, replacement]) => {
    return fixed.replaceAll(broken, replacement);
  }, text)
    .replace(/\\t(?=imes|ext)/g, '\\')
    .replace(/\t(?=imes|ext)/g, '\\');
}

function repairMalformedLatex(text: string): string {
  return text
    .replace(/\\thet(?![a-zA-Z])/g, '\\theta')
    .replace(/\\alph(?![a-zA-Z])/g, '\\alpha')
    .replace(/\\bet(?![a-zA-Z])/g, '\\beta')
    .replace(/\\gamm(?![a-zA-Z])/g, '\\gamma')
    .replace(/\\delt(?![a-zA-Z])/g, '\\delta')
    .replace(/\\lambd(?![a-zA-Z])/g, '\\lambda')
    .replace(/\\sigm(?![a-zA-Z])/g, '\\sigma')
    .replace(/\\omeg(?![a-zA-Z])/g, '\\omega')
    .replace(/\\ph(?![a-zA-Z])/g, '\\phi')
    .replace(/\\epsilo(?![a-zA-Z])/g, '\\epsilon')
    .replace(/\\([A-Za-z]+)\{/g, '\\$1{')
    .replace(/\\([A-Za-z]+)\(/g, '\\$1(')
    .replace(/\\([A-Za-z]+)\)/g, '\\$1)')
    .replace(/\\sum\s+F_([xy])\s*=\s*0\s*:/g, '\\sum F_$1 = ')
    .replace(/\\sum\s+M_?([A-Za-z])\s*=\s*0\s*:/g, '\\sum M_$1 = ');
}

function repairStaticsEquationText(text: string): string {
  return text
    .replace(/\\sum\s*F_x\s*=\s*0\s*[:=]\s*/g, '\\sum F_x = ')
    .replace(/\\sum\s*F_y\s*=\s*0\s*[:=]\s*/g, '\\sum F_y = ')
    .replace(/\\sum\s*M_?([A-Za-z])\s*=\s*0\s*[:=]\s*/g, '\\sum M_$1 = ')
    .replace(/F_\[([A-Za-z0-9]+)\]/g, 'F_{$1}')
    .replace(/N_\[([A-Za-z0-9]+)\]/g, 'N_{$1}')
    .replace(/R_\[([A-Za-z0-9]+)\]/g, 'R_{$1}')
    .replace(/\\cos\s*\(\s*\\theta\s*\\\)/g, '\\cos(\\theta)')
    .replace(/\\sin\s*\(\s*\\theta\s*\\\)/g, '\\sin(\\theta)')
    .replace(/\\cos\s*\(\s*\\theta\s*\)/g, '\\cos(\\theta)')
    .replace(/\\sin\s*\(\s*\\theta\s*\)/g, '\\sin(\\theta)')
    .replace(/\\cos\s*\(\s*theta\s*\)/gi, '\\cos(\\theta)')
    .replace(/\\sin\s*\(\s*theta\s*\)/gi, '\\sin(\\theta)')
    .replace(/cos\s*\(\s*theta\s*\)/gi, '\\cos(\\theta)')
    .replace(/sin\s*\(\s*theta\s*\)/gi, '\\sin(\\theta)')
    .replace(/\\cos\s*\(\s*\\thet(?![a-zA-Z])/g, '\\cos(\\theta')
    .replace(/\\sin\s*\(\s*\\thet(?![a-zA-Z])/g, '\\sin(\\theta')
    .replace(/\\cos\s*\\theta/g, '\\cos(\\theta)')
    .replace(/\\sin\s*\\theta/g, '\\sin(\\theta)')
    .replace(/\s+=\s+(\\\[|\\\()/g, ' $1')
    .replace(/\b(we have|the equations become|this gives|therefore)\s+=\s+/gi, '$1 ');
}

function looksLikeStandaloneFormula(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(\\\[.*\\\]|\\\(.*\\\)|\$\$.*\$\$|\$.*\$)$/.test(trimmed)) return false;

  const textWordCount = (trimmed.match(/\b[A-Za-z]{4,}\b/g) || []).length;
  const hasMathMarkers =
    /[=<>≤≥≈±→÷×√∑π]/.test(trimmed) ||
    /\\(frac|sqrt|sum|pi|theta|alpha|beta|gamma|delta|lambda|mu|sigma|omega|times|cdot|leq|geq|neq|to)/.test(trimmed);

  return hasMathMarkers && textWordCount <= 4 && trimmed.length <= 180;
}

function wrapFormulaLines(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!looksLikeStandaloneFormula(trimmed)) {
        return line;
      }

      return `\\[${trimmed}\\]`;
    })
    .join('\n');
}

export function fixFormulaNotation(text: string): string {
  if (!text) return text;

  let fixed = repairStaticsEquationText(repairMalformedLatex(normalizeBrokenSymbols(text)));

  // Fix "Sum" written as text.
  fixed = fixed.replace(/\b[Ss]um([A-Z_])/g, '\\sum $1');
  fixed = fixed.replace(/\b[Ss]um\b/g, '\\sum');
  fixed = fixed.replace(/\\text\{[Ss]um\}/g, '\\sum');
  fixed = fixed.replace(/\\mathrm\{[Ss]um\}/g, '\\sum');
  fixed = fixed.replace(/ext[Ss]um/g, '\\sum');
  fixed = fixed.replace(/Î£[Ss]um/g, '\\sum');

  // Fix other common text operators.
  fixed = fixed.replace(/\bProduct\b/gi, '\\prod');
  fixed = fixed.replace(/\bIntegral\b/gi, '\\int');
  fixed = fixed.replace(/\bLimit\b/gi, '\\lim');

  // Fix multiplication symbols.
  fixed = fixed.replace(/(\d+)\s+times\s+(\d+)/gi, '$1 \\times $2');
  fixed = fixed.replace(/\btimes\b/g, '\\times');
  fixed = fixed.replace(/\\text\{times\}/gi, '\\times');
  fixed = fixed.replace(/(\d+)\s*x\s*(\d+)/g, '$1 \\times $2');
  fixed = fixed.replace(/(\d+)x(\d+)/g, '$1 \\times $2');
  fixed = fixed.replace(/(\d+)\s*\*\s*(\d+)/g, '$1 \\times $2');
  fixed = fixed.replace(/imes/g, '\\times');
  fixed = fixed.replace(/×/g, '\\times ');
  fixed = fixed.replace(/·/g, '\\cdot ');

  // Fix division wording.
  fixed = fixed.replace(/(\w+)\s+divided\s+by\s+(\w+)/gi, '\\frac{$1}{$2}');
  fixed = fixed.replace(/÷/g, '\\div ');

  // Fix Greek letters written as words.
  const greekMap: Record<string, string> = {
    alpha: '\\alpha',
    beta: '\\beta',
    gamma: '\\gamma',
    delta: '\\Delta',
    Delta: '\\Delta',
    epsilon: '\\epsilon',
    theta: '\\theta',
    lambda: '\\lambda',
    mu: '\\mu',
    pi: '\\pi',
    rho: '\\rho',
    sigma: '\\sigma',
    tau: '\\tau',
    phi: '\\phi',
    omega: '\\omega',
    Omega: '\\Omega',
  };

  for (const [word, latex] of Object.entries(greekMap)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    fixed = fixed.replace(regex, latex);
  }

  // Fix square root and comparison operators.
  fixed = fixed.replace(/sqrt\s*\(([^)]+)\)/g, '\\sqrt{$1}');
  fixed = fixed.replace(/√\s*([A-Za-z0-9]+)/g, '\\sqrt{$1}');
  fixed = fixed.replace(/<=|≤/g, '\\leq');
  fixed = fixed.replace(/>=|≥/g, '\\geq');
  fixed = fixed.replace(/!=|≠/g, '\\neq');
  fixed = fixed.replace(/~=|≈/g, '\\approx');
  fixed = fixed.replace(/\+\/-|±/g, '\\pm');

  // Fix arrows.
  fixed = fixed.replace(/->|→/g, '\\rightarrow');
  fixed = fixed.replace(/<-|←/g, '\\leftarrow');

  fixed = repairStaticsEquationText(repairMalformedLatex(fixed));
  return fixed.replace(/[ \t]+/g, ' ').trim();
}

/**
 * Ensures all formulas are wrapped in LaTeX delimiters.
 */
export function ensureLatexWrapping(text: string): string {
  if (!text) return text;

  if (text.match(/^\\\[[\s\S]*\\\]$/) || text.match(/^\\\([\s\S]*\\\)$/) || text.match(/^\$\$[\s\S]*\$\$$/)) {
    return text;
  }

  const hasLatexCommands = /\\[a-zA-Z]+|\\times|\\frac|\\sqrt|\\sum|\\int/.test(text);

  if (hasLatexCommands) {
    if (text.includes('=') || text.includes('\\frac') || text.includes('\\sum')) {
      return `\\[${text.trim()}\\]`;
    }

    return `\\(${text.trim()}\\)`;
  }

  return text;
}

/**
 * Main function to fix all formulas in a step.
 */
export function fixStepFormulas(step: any): any {
  const fixed = { ...step };

  if (fixed.formula) {
    console.log('🔧 Fixing formula notation...');
    console.log('   Original:', fixed.formula.substring(0, 100));
    fixed.formula = wrapFormulaLines(fixFormulaNotation(fixed.formula));
    console.log('   Fixed:', fixed.formula.substring(0, 100));
  }

  if (fixed.description) {
    const lines = fixed.description.split('\n');
    fixed.description = lines
      .map((line: string) => {
        if (line.match(/[=+\-*/^≤≥≈±→÷×√]/) || line.match(/\d/)) {
          return fixFormulaNotation(line);
        }
        return normalizeBrokenSymbols(line);
      })
      .join('\n');
  }

  if (fixed.hint) {
    const lines = fixed.hint.split('\n');
    fixed.hint = lines
      .map((line: string) => {
        if (line.match(/[=+\-*/^≤≥≈±→÷×√]/) || line.match(/\d/)) {
          return fixFormulaNotation(line);
        }
        return normalizeBrokenSymbols(line);
      })
      .join('\n');
  }

  return fixed;
}

/**
 * Fix all formulas in all steps of a solution.
 */
export function fixAllFormulas(solution: any): any {
  const fixed = { ...solution };

  if (fixed.steps && Array.isArray(fixed.steps)) {
    console.log(`🔧 Fixing formulas in ${fixed.steps.length} steps...`);
    fixed.steps = fixed.steps.map((step: any) => fixStepFormulas(step));
  }

  if (fixed.extractedQuestion) {
    fixed.extractedQuestion = normalizeBrokenSymbols(fixed.extractedQuestion);
  }

  if (fixed.solution) {
    fixed.solution = normalizeBrokenSymbols(fixed.solution);
  }

  if (fixed.strategy) {
    fixed.strategy = normalizeBrokenSymbols(fixed.strategy);
  }

  return fixed;
}
