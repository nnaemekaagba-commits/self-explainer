// Helper function to fix text that has missing spaces between words
export function fixMissingSpaces(text: string): string {
  if (!text) return text;
  
  console.log('TEXT FIX - fixMissingSpaces - Input length:', text?.length || 0);
  console.log('TEXT FIX - First 200 chars:', text?.substring(0, 200) || '(empty)');
  
  // Preserve LaTeX regions - don't add spaces inside math
  const mathRegions: Array<{start: number, end: number, content: string}> = [];
  
  // Find all LaTeX regions to preserve
  const patterns = [
    /\\\\?\([^)]*\\\\?\)/g,  // \(...\) or (...) 
    /\\\\?\[[^\]]*\\\\?\]/g,  // \[...\] or [...]
    /\$\$[^$]*\$\$/g,        // $$...$$
    /\$[^$]+\$/g             // $...$
  ];
  
  let workingText = text;
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      mathRegions.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[0]
      });
    }
  }
  
  // Sort by start position
  mathRegions.sort((a, b) => a.start - b.start);
  
  // Remove overlapping regions
  const nonOverlapping: typeof mathRegions = [];
  for (const region of mathRegions) {
    const overlaps = nonOverlapping.some(existing => 
      (region.start >= existing.start && region.start < existing.end) ||
      (region.end > existing.start && region.end <= existing.end)
    );
    if (!overlaps) {
      nonOverlapping.push(region);
    }
  }
  
  // Process text segments between math regions
  let result = '';
  let lastEnd = 0;
  
  for (const region of nonOverlapping) {
    // Process text before this math region
    if (region.start > lastEnd) {
      const segment = text.substring(lastEnd, region.start);
      result += addSpacesToText(segment);
    }
    // Add the math region unchanged
    result += region.content;
    lastEnd = region.end;
  }
  
  // Process remaining text
  if (lastEnd < text.length) {
    const segment = text.substring(lastEnd);
    result += addSpacesToText(segment);
  }
  
  console.log('SUCCESS - fixMissingSpaces complete');
  if (result !== text) {
    console.log('WARNING - Added spaces to text');
    console.log('   Fixed first 200 chars:', result.substring(0, 200));
  }
  
  return result;
}

// Add spaces to plain text (not math)
function addSpacesToText(text: string): string {
  if (!text) return text;
  
  let fixed = text;

  const phraseFixes: Array<[RegExp, string]> = [
    [/solve\s*the\s*equation/gi, 'Solve the equation'],
    [/for\s*the\s*variable/gi, 'for the variable'],
    [/solve\s*for/gi, 'solve for'],
    [/find\s*the\s*value/gi, 'find the value'],
    [/evaluate\s*the\s*expression/gi, 'evaluate the expression'],
    [/simplify\s*the\s*expression/gi, 'simplify the expression'],
    [/with\s*respect\s*to/gi, 'with respect to'],
  ];

  phraseFixes.forEach(([pattern, replacement]) => {
    fixed = fixed.replace(pattern, replacement);
  });
  
  // IMPORTANT: Don't split words that are already properly formatted
  // Check if text contains consecutive uppercase letters (likely acronyms or emphasis)
  const hasConsecutiveUppercase = /[A-Z]{2,}/.test(text);
  
  // Add space between lowercase and uppercase letters (word boundaries)
  // Only apply this if we don't have long uppercase sequences
  if (!hasConsecutiveUppercase) {
    fixed = fixed.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  // Add spaces between numbers and letters in OCR-like strings
  fixed = fixed.replace(/(\d)([A-Za-z])/g, '$1 $2');
  fixed = fixed.replace(/([A-Za-z])(\d)/g, '$1 $2');

  // Add spaces around common math operators in plain text regions
  fixed = fixed
    .replace(/\s*([=+\-−])\s*/g, ' $1 ')
    .replace(/\s{2,}/g, ' ');

  // Separate common trig/function names from following variables
  fixed = fixed.replace(/\b(sin|cos|tan|cot|sec|csc|log|ln)(?=[A-Za-z(])/gi, '$1 ');
  
  // Add space after period followed by capital letter (sentence boundary)
  fixed = fixed.replace(/\.([A-Z])/g, '. $1');
  
  // Add space after comma followed by capital letter
  fixed = fixed.replace(/,([A-Z])/g, ', $1');
  
  // Add space after period followed by lowercase (sentences without capitalization)
  fixed = fixed.replace(/\.([a-z])/g, '. $1');
  
  // REMOVED: The aggressive word-splitting logic that was breaking words
  // The previous regex patterns with 'gi' flag were too aggressive and
  // would split words like "FORCE" into "FOR CE" by matching common words
  // within larger words. This fix has been removed to prevent word-splitting.
  
  return fixed.trim();
}
