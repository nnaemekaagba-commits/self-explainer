/**
 * Formula Fixer - Ensures professional mathematical notation in all formulas
 * Converts plain text symbols to proper LaTeX commands
 */

export function fixFormulaNotation(text: string): string {
  if (!text) return text;
  
  let fixed = text;
  
  // Fix "Sum" written as text (CRITICAL FIX)
  // Match variations like "Sum", "sum", "sumF", "sumM", "ΣSum", "extSum" etc.
  
  // MOST IMPORTANT: Fix "sumF_y", "sumM_A" patterns (sum directly attached to variable)
  fixed = fixed.replace(/\b[Ss]um([A-Z_])/g, '\\sum $1');
  
  // Fix standalone "sum" or "Sum" as words
  fixed = fixed.replace(/\b[Ss]um\b/g, '\\sum');
  
  // Fix LaTeX text wrapping of sum
  fixed = fixed.replace(/\\text\{[Ss]um\}/g, '\\sum');
  fixed = fixed.replace(/\\mathrm\{[Ss]um\}/g, '\\sum');
  
  // Fix broken variations
  fixed = fixed.replace(/ext[Ss]um/g, '\\sum');
  fixed = fixed.replace(/Σ[Ss]um/g, '\\sum');
  
  // Fix other common text operators
  fixed = fixed.replace(/\bProduct\b/gi, '\\prod');
  fixed = fixed.replace(/\bIntegral\b/gi, '\\int');
  fixed = fixed.replace(/\bLimit\b/gi, '\\lim');
  
  // Fix multiplication symbols (MOST COMMON ISSUE)
  // Replace "times" word with \times
  fixed = fixed.replace(/(\d+)\s+times\s+(\d+)/gi, '$1 \\times $2');
  fixed = fixed.replace(/\btimes\b/g, '\\times');
  fixed = fixed.replace(/\\text\{times\}/gi, '\\times');
  
  // Replace "x" used as multiplication (but not variables)
  fixed = fixed.replace(/(\d+)\s*x\s*(\d+)/g, '$1 \\times $2');
  fixed = fixed.replace(/(\d+)x(\d+)/g, '$1 \\times $2');
  
  // Replace "*" with \times
  fixed = fixed.replace(/(\d+)\s*\*\s*(\d+)/g, '$1 \\times $2');
  
  // Fix "imes" (broken \times)
  fixed = fixed.replace(/imes/g, '\\times');
  
  // Fix "divided by" to \frac
  fixed = fixed.replace(/(\w+)\s+divided\s+by\s+(\w+)/gi, '\\frac{$1}{$2}');
  
  // Fix Greek letters written as words
  const greekMap: Record<string, string> = {
    'alpha': '\\alpha',
    'beta': '\\beta',
    'gamma': '\\gamma',
    'delta': '\\Delta',
    'Delta': '\\Delta',
    'epsilon': '\\epsilon',
    'theta': '\\theta',
    'lambda': '\\lambda',
    'mu': '\\mu',
    'pi': '\\pi',
    'rho': '\\rho',
    'sigma': '\\sigma',
    'tau': '\\tau',
    'phi': '\\phi',
    'omega': '\\omega',
    'Omega': '\\Omega'
  };
  
  for (const [word, latex] of Object.entries(greekMap)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    fixed = fixed.replace(regex, latex);
  }
  
  // Fix square root
  fixed = fixed.replace(/sqrt\s*\(([^)]+)\)/g, '\\sqrt{$1}');
  fixed = fixed.replace(/√(\w+)/g, '\\sqrt{$1}');
  
  // Fix comparison operators
  fixed = fixed.replace(/<=|≤/g, '\\leq');
  fixed = fixed.replace(/>=|≥/g, '\\geq');
  fixed = fixed.replace(/!=/g, '\\neq');
  fixed = fixed.replace(/~=/g, '\\approx');
  fixed = fixed.replace(/\+\/-/g, '\\pm');
  
  // Fix arrows
  fixed = fixed.replace(/->/g, '\\rightarrow');
  fixed = fixed.replace(/<-/g, '\\leftarrow');
  
  return fixed;
}

/**
 * Ensures all formulas are wrapped in LaTeX delimiters
 */
export function ensureLatexWrapping(text: string): string {
  if (!text) return text;
  
  // If already wrapped in \( \) or \[ \] or $ $, return as-is
  if (text.match(/^\\[(\\[].*\\[)\\]]$/)) {
    return text;
  }
  
  // Check if text contains LaTeX commands
  const hasLatexCommands = /\\[a-zA-Z]+|\\times|\\frac|\\sqrt|\\sum|\\int/.test(text);
  
  if (hasLatexCommands) {
    // Wrap in display mode if it's a standalone formula
    if (text.includes('=') || text.includes('\\frac') || text.includes('\\sum')) {
      return `\\[${text.trim()}\\]`;
    }
    // Otherwise inline mode
    return `\\(${text.trim()}\\)`;
  }
  
  return text;
}

/**
 * Main function to fix all formulas in a step
 */
export function fixStepFormulas(step: any): any {
  const fixed = { ...step };
  
  // Fix formula field
  if (fixed.formula) {
    console.log('🔧 Fixing formula notation...');
    console.log('   Original:', fixed.formula.substring(0, 100));
    
    fixed.formula = fixFormulaNotation(fixed.formula);
    
    console.log('   Fixed:', fixed.formula.substring(0, 100));
  }
  
  // Fix description - process each line separately
  if (fixed.description) {
    const lines = fixed.description.split('\n');
    fixed.description = lines.map((line: string) => {
      // Only fix lines that look like they contain math
      if (line.match(/[=+\-*/^]/) || line.match(/\d/)) {
        return fixFormulaNotation(line);
      }
      return line;
    }).join('\n');
  }
  
  // Fix hint
  if (fixed.hint) {
    const lines = fixed.hint.split('\n');
    fixed.hint = lines.map((line: string) => {
      if (line.match(/[=+\-*/^]/) || line.match(/\d/)) {
        return fixFormulaNotation(line);
      }
      return line;
    }).join('\n');
  }
  
  return fixed;
}

/**
 * Fix all formulas in all steps of a solution
 */
export function fixAllFormulas(solution: any): any {
  const fixed = { ...solution };
  
  if (fixed.steps && Array.isArray(fixed.steps)) {
    console.log(`🔧 Fixing formulas in ${fixed.steps.length} steps...`);
    fixed.steps = fixed.steps.map((step: any) => fixStepFormulas(step));
  }
  
  // Also fix the extracted question
  if (fixed.extractedQuestion) {
    fixed.extractedQuestion = fixFormulaNotation(fixed.extractedQuestion);
  }
  
  return fixed;
}