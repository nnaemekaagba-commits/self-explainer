// Helper function to fix math content inside LaTeX delimiters
function fixMathContent(mathContent: string): string {
  let fixed = mathContent;
  
  // CRITICAL: Fix "sum" appearing as text in math mode
  // This is the most common issue - AI writes "sumF_y" instead of "\sum F_y"
  fixed = fixed.replace(/\bsum([A-Z_])/g, '\\sum $1'); // sumF_y -> \sum F_y
  fixed = fixed.replace(/\bSum([A-Z_])/g, '\\sum $1'); // SumM_A -> \sum M_A
  fixed = fixed.replace(/\bsum\b/g, '\\sum'); // standalone sum
  fixed = fixed.replace(/\bSum\b/g, '\\sum'); // standalone Sum
  
  // Fix other common text operators that should be symbols
  fixed = fixed.replace(/\bprod\b/gi, '\\prod');
  fixed = fixed.replace(/\bint\b/g, '\\int');
  fixed = fixed.replace(/\blim\b/g, '\\lim');
  
  // Fix "times" written as text
  fixed = fixed.replace(/\btimes\b/g, '\\times');
  
  // Fix broken LaTeX commands (missing backslash)
  fixed = fixed.replace(/imes\b/g, '\\times'); // "imes" -> "\times"
  
  return fixed;
}

// Helper function to wrap LaTeX that's not already wrapped
export function wrapUnwrappedLatex(text: string): string {
  // Check if this text segment contains LaTeX commands
  // Common LaTeX indicators: \command, subscripts, superscripts
  const hasLatexCommands = /\\[a-zA-Z]+|[_^]/.test(text);
  
  if (!hasLatexCommands) {
    return text; // No LaTeX, return as-is
  }
  
  // Trim whitespace from edges before wrapping
  const trimmed = text.trim();
  const leadingSpace = text.match(/^\s*/)?.[0] || '';
  const trailingSpace = text.match(/\s*$/)?.[0] || '';
  
  // This text has LaTeX but isn't wrapped - wrap it
  return `${leadingSpace}\\(${trimmed}\\)${trailingSpace}`;
}

// Helper function to validate and fix LaTeX formatting
export function validateAndFixLatex(text: string): string {
  if (!text) return text;
  
  let fixed = text;
  
  // CRITICAL: First aggressively unescape any double/triple/multiple backslashes
  let iterations = 0;
  while (fixed.includes('\\\\') && iterations < 10) {
    fixed = fixed.replace(/\\\\/g, '\\');
    iterations++;
  }
  // Remove trailing backslashes
  fixed = fixed.replace(/\\+$/g, '');
  
  console.log('LATEX FIX - validateAndFixLatex input:', text.substring(0, 200));
  if (iterations > 0) {
    console.log(`🔧 AGGRESSIVE UNESCAPE: Fixed ${iterations} levels of backslash escaping`);
    console.log('   After unescape:', fixed.substring(0, 200));
  }
  
  // Find all existing math regions to fix their content
  const mathRegions: Array<{start: number, end: number, original: string, fixed: string}> = [];
  
  // Process \(...\) regions - use single backslash as it appears in the string
  let regex = /\\(\([^)]*\))/g;
  let match;
  while ((match = regex.exec(fixed)) !== null) {
    const innerContent = match[0].slice(2, -2); // Remove \( and \)
    const fixedContent = fixMathContent(innerContent);
    mathRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      fixed: `\\(${fixedContent}\\)`
    });
  }
  
  // Process \[...\] regions
  regex = /\\\[[\s\S]*?\\\]/g;
  while ((match = regex.exec(fixed)) !== null) {
    const innerContent = match[0].slice(2, -2); // Remove \[ and \]
    const fixedContent = fixMathContent(innerContent);
    mathRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      fixed: `\\[${fixedContent}\\]`
    });
  }
  
  // Process $$...$$ regions  
  regex = /\$\$[\s\S]*?\$\$/g;
  while ((match = regex.exec(fixed)) !== null) {
    const innerContent = match[0].slice(2, -2); // Remove $$ and $$
    const fixedContent = fixMathContent(innerContent);
    mathRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      fixed: `\$\$${fixedContent}\$\$`
    });
  }
  
  // Process $...$ regions (be careful not to match $$)
  regex = /\$([^$]+)\$/g;
  while ((match = regex.exec(fixed)) !== null) {
    const innerContent = match[1];
    const fixedContent = fixMathContent(innerContent);
    mathRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      fixed: `$${fixedContent}$`
    });
  }
  
  // Replace all math regions with their fixed versions (in reverse order to maintain positions)
  mathRegions.sort((a, b) => b.start - a.start);
  for (const region of mathRegions) {
    if (region.original !== region.fixed) {
      console.log('🔧 Fixed math content:', region.original, '->', region.fixed);
      fixed = fixed.substring(0, region.start) + region.fixed + fixed.substring(region.end);
    }
  }
  
  console.log('SUCCESS - LaTeX validation complete');
  if (fixed !== text) {
    console.log('WARNING - Fixed LaTeX formatting');
    console.log('   Original:', text.substring(0, 150));
    console.log('   Fixed:', fixed.substring(0, 150));
  }
  
  return fixed;
}