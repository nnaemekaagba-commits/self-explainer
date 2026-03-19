/**
 * Validates that step descriptions contain actual calculations, not just instructions
 * If they don't, attempts to enhance them with calculations
 */

/**
 * Checks if a description contains actual calculations
 */
export function hasActualCalculations(description: string): boolean {
  if (!description) return false;
  
  // Check for equals signs with numbers (strong indicator of calculations)
  const hasEqualsWithNumbers = /=\s*[-+]?\d+/.test(description);
  
  // Check for multiplication/division operations
  const hasMathOps = /\d+\s*[*x/]\s*\d+/.test(description);
  
  // Check for common calculation patterns in LaTeX
  const hasLatexCalc = /\\[\\(].*\d+.*[)=].*\d+.*[\\)\\]]/.test(description);
  
  // Check for parenthetical calculations like (60)(9.8)
  const hasParenthCalc = /\(\d+\)\s*\(\d+\.?\d*\)/.test(description);
  
  // Check for fraction calculations
  const hasFractionCalc = /\\frac{.*\d+.*}{.*\d+.*}/.test(description);

  // Check for substituted values inside equations, such as (60 kg)(9.8 m/s^2)
  const hasSubstitutionChain = /\\\(.+\d.+(?:=|\\Rightarrow).+\d.+\\\)/.test(description);

  // Check for common engineering equalities with units
  const hasUnitsWithCalculation = /\d+\.?\d*\s*,?\s*\\text\{[^}]+\}.*=\s*[-+]?\d+/.test(description);
  
  return hasEqualsWithNumbers || hasMathOps || hasLatexCalc || hasParenthCalc || hasFractionCalc || hasSubstitutionChain || hasUnitsWithCalculation;
}

/**
 * Checks if description is just instructions (bad)
 */
export function isJustInstructions(description: string): boolean {
  if (!description) return true;
  
  // Common instruction phrases that indicate AI is NOT doing work
  const instructionPatterns = [
    /^calculate\s+(?:the|a)\s+/i,
    /^find\s+(?:the|a)\s+/i,
    /^determine\s+(?:the|a)\s+/i,
    /^solve\s+for\s+/i,
    /^apply\s+(?:the|a)\s+/i,
    /^use\s+(?:the|a)\s+/i,
    /using\s+(?:the\s+)?formula/i,
    /substitute.*into.*equation/i,
    /plug.*into/i
  ];
  
  // If it starts with instruction phrases AND is short, it's probably just instructions
  const startsWithInstruction = instructionPatterns.some(pattern => pattern.test(description));
  const isShort = description.length < 150; // Slightly increased threshold
  
  return startsWithInstruction && isShort && !hasActualCalculations(description);
}

/**
 * Extracts numbers from formula and hint fields to use in description enhancement
 */
export function extractNumbersFromContext(step: any): {
  variables: string[],
  numbers: string[],
  formulas: string[]
} {
  const variables: string[] = [];
  const numbers: string[] = [];
  const formulas: string[] = [];
  
  // Extract from formula field
  if (step.formula) {
    // Find equations like "F = ma" or "W = mg"
    const formulaMatches = step.formula.match(/[A-Za-z_]+\s*=\s*[^=\n]+/g);
    if (formulaMatches) {
      formulas.push(...formulaMatches);
    }
    
    // Find numbers
    const numberMatches = step.formula.match(/\d+\.?\d*/g);
    if (numberMatches) {
      numbers.push(...numberMatches);
    }
  }
  
  // Extract from hint
  if (step.hint) {
    const hintNumbers = step.hint.match(/\d+\.?\d*/g);
    if (hintNumbers) {
      numbers.push(...hintNumbers);
    }
  }
  
  return { variables, numbers, formulas };
}

/**
 * Validates and potentially enhances a step description
 * Returns enhanced description if needed, or original if already good
 */
export function validateAndEnhanceDescription(step: any, stepIndex: number, fullProblem: string): {
  description: string,
  wasEnhanced: boolean,
  reason?: string
} {
  const originalDescription = step.description || "";
  
  // Check if description already has calculations
  if (hasActualCalculations(originalDescription)) {
    return {
      description: originalDescription,
      wasEnhanced: false
    };
  }
  
  // Check if it's just instructions
  if (isJustInstructions(originalDescription)) {
    console.warn(`WARNING: Step ${stepIndex + 1} description is just instructions, attempting enhancement...`);
    
    // Try to build a better description from available context
    const context = extractNumbersFromContext(step);
    
    // If we have formula and numbers, attempt to create a calculation
    if (context.formulas.length > 0 && context.numbers.length >= 2) {
      const enhancedDescription = buildCalculationDescription(
        originalDescription,
        step.formula,
        step.hint,
        context
      );
      
      return {
        description: enhancedDescription,
        wasEnhanced: true,
        reason: "Description was just instructions, enhanced with calculations from formula"
      };
    }
    
    // If we can't enhance, at least add a warning note
    return {
        description: `${originalDescription}\n\nWARNING: This step requires you to perform the calculations described above.`,
        wasEnhanced: true,
        reason: "Could not auto-enhance, added clarification note"
      };
  }
  
  // Description exists but is weak - return original with warning
  return {
    description: originalDescription,
    wasEnhanced: false
  };
}

/**
 * Attempts to build a calculation-based description from formula and context
 */
function buildCalculationDescription(
  originalDescription: string,
  formula: string,
  hint: string,
  context: { variables: string[], numbers: string[], formulas: string[] }
): string {
  // This is a simple enhancement - in a real scenario, you'd need more sophisticated parsing
  
  let enhanced = "Let's work through this step:\n\n";
  
  // Add the formulas
  if (context.formulas.length > 0) {
    enhanced += "We'll use: " + context.formulas.join(", ") + "\n\n";
  }
  
  // Add a note about what to calculate
  enhanced += originalDescription;
  
  // If we have numbers, suggest showing the substitution
  if (context.numbers.length >= 2) {
    enhanced += `\n\nSubstituting the values: `;
    const [num1, num2] = context.numbers;
    enhanced += `(${num1})(${num2})`;
  }
  
  return enhanced;
}

/**
 * Main validation function - checks all steps and reports issues
 */
export function validateStepsHaveCalculations(steps: any[]): {
  allValid: boolean,
  issues: Array<{ stepIndex: number, issue: string }>,
  validCount: number,
  invalidCount: number
} {
  const issues: Array<{ stepIndex: number, issue: string }> = [];
  let validCount = 0;
  let invalidCount = 0;
  
  steps.forEach((step, index) => {
    if (!step.description) {
      issues.push({
        stepIndex: index,
        issue: "Missing description entirely"
      });
      invalidCount++;
      return;
    }
    
    if (isJustInstructions(step.description)) {
      issues.push({
        stepIndex: index,
        issue: `Description is just instructions: "${step.description.substring(0, 100)}..."`
      });
      invalidCount++;
      return;
    }
    
    if (!hasActualCalculations(step.description)) {
      issues.push({
        stepIndex: index,
        issue: "Description lacks actual calculations"
      });
      invalidCount++;
      return;
    }

    if (!step.formula || !/\\\(|\\\[/.test(step.formula)) {
      issues.push({
        stepIndex: index,
        issue: "Formula field is missing or lacks LaTeX delimiters"
      });
      invalidCount++;
      return;
    }
    
    validCount++;
  });
  
  return {
    allValid: issues.length === 0,
    issues,
    validCount,
    invalidCount
  };
}
