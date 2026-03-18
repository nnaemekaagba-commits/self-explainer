// Aggressive unescape function to fix LaTeX with multiple levels of escaping
export function aggressiveUnescape(text: string): string {
  let fixed = text;
  let iterations = 0;
  const maxIterations = 10;
  
  // Keep replacing \\ with \ until no more double backslashes
  while (fixed.includes('\\\\') && iterations < maxIterations) {
    fixed = fixed.replace(/\\\\/g, '\\');
    iterations++;
  }
  
  // Remove trailing backslashes at the end of strings
  fixed = fixed.replace(/\\+$/g, '');
  
  return fixed;
}
