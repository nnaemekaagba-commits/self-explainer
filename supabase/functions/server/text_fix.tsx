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
  
  // IMPORTANT: Don't split words that are already properly formatted
  // Check if text contains consecutive uppercase letters (likely acronyms or emphasis)
  const hasConsecutiveUppercase = /[A-Z]{2,}/.test(text);
  
  // Add space between lowercase and uppercase letters (word boundaries)
  // Only apply this if we don't have long uppercase sequences
  if (!hasConsecutiveUppercase) {
    fixed = fixed.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  
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
  
  return fixed;
}