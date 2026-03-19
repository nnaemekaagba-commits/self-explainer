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

function fixMathContent(mathContent: string): string {
  let fixed = repairStaticsEquationText(repairMalformedLatex(normalizeBrokenSymbols(mathContent)));

  fixed = fixed.replace(/\bsum([A-Z_])/g, '\\sum $1');
  fixed = fixed.replace(/\bSum([A-Z_])/g, '\\sum $1');
  fixed = fixed.replace(/\bsum\b/g, '\\sum');
  fixed = fixed.replace(/\bSum\b/g, '\\sum');
  fixed = fixed.replace(/\bprod\b/gi, '\\prod');
  fixed = fixed.replace(/\bint\b/g, '\\int');
  fixed = fixed.replace(/\blim\b/g, '\\lim');
  fixed = fixed.replace(/\btimes\b/g, '\\times');
  fixed = fixed.replace(/imes\b/g, '\\times');
  fixed = fixed.replace(/×/g, '\\times ');
  fixed = fixed.replace(/·/g, '\\cdot ');
  fixed = fixed.replace(/÷/g, '\\div ');
  fixed = fixed.replace(/<=|≤/g, '\\leq ');
  fixed = fixed.replace(/>=|≥/g, '\\geq ');
  fixed = fixed.replace(/!=|≠/g, '\\neq ');
  fixed = fixed.replace(/~=|≈/g, '\\approx ');
  fixed = fixed.replace(/\+\/-|±/g, '\\pm ');
  fixed = fixed.replace(/->|→/g, '\\to ');
  fixed = fixed.replace(/<-|←/g, '\\leftarrow ');
  fixed = fixed.replace(/sqrt\s*\(([^)]+)\)/g, '\\sqrt{$1}');
  fixed = fixed.replace(/√\s*([A-Za-z0-9]+)/g, '\\sqrt{$1}');
  fixed = fixed.replace(/π/g, '\\pi ');

  fixed = repairStaticsEquationText(repairMalformedLatex(fixed));
  return fixed.replace(/[ \t]+/g, ' ').trim();
}

function wrapEquationLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return line;
  if (/^(\\\[.*\\\]|\\\(.*\\\)|\$\$.*\$\$|\$.*\$)$/.test(trimmed)) return line;

  const hasMathMarkers =
    /[=<>≤≥≈±→÷×√∑π]/.test(trimmed) ||
    /\\(frac|sqrt|sum|pi|theta|alpha|beta|gamma|delta|lambda|mu|sigma|omega|times|cdot|leq|geq|neq|to)/.test(trimmed);
  const textWordCount = (trimmed.match(/\b[A-Za-z]{4,}\b/g) || []).length;

  if (hasMathMarkers && textWordCount <= 4 && trimmed.length <= 180) {
    return `\\[${fixMathContent(trimmed)}\\]`;
  }

  return normalizeBrokenSymbols(line);
}

export function wrapUnwrappedLatex(text: string): string {
  const normalized = normalizeBrokenSymbols(text);
  const hasLatexCommands = /\\[a-zA-Z]+|[_^]/.test(normalized);

  if (!hasLatexCommands) {
    return normalized;
  }

  const trimmed = normalized.trim();
  const leadingSpace = normalized.match(/^\s*/)?.[0] || '';
  const trailingSpace = normalized.match(/\s*$/)?.[0] || '';

  return `${leadingSpace}\\(${trimmed}\\)${trailingSpace}`;
}

export function validateAndFixLatex(text: string): string {
  if (!text) return text;

  let fixed = repairStaticsEquationText(repairMalformedLatex(normalizeBrokenSymbols(text)));

  let iterations = 0;
  while (fixed.includes('\\\\') && iterations < 10) {
    fixed = fixed.replace(/\\\\/g, '\\');
    iterations++;
  }
  fixed = fixed.replace(/\\+$/g, '');

  console.log('LATEX FIX - validateAndFixLatex input:', text.substring(0, 200));
  if (iterations > 0) {
    console.log(`🔧 AGGRESSIVE UNESCAPE: Fixed ${iterations} levels of backslash escaping`);
    console.log('   After unescape:', fixed.substring(0, 200));
  }

  const mathRegions: Array<{ start: number; end: number; original: string; fixed: string }> = [];
  let regex = /\\(\([^)]*\))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(fixed)) !== null) {
    const innerContent = match[0].slice(2, -2);
    const repaired = fixMathContent(innerContent);
    mathRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      fixed: `\\(${repaired}\\)`,
    });
  }

  regex = /\\\[[\s\S]*?\\\]/g;
  while ((match = regex.exec(fixed)) !== null) {
    const innerContent = match[0].slice(2, -2);
    const repaired = fixMathContent(innerContent);
    mathRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      fixed: `\\[${repaired}\\]`,
    });
  }

  regex = /\$\$[\s\S]*?\$\$/g;
  while ((match = regex.exec(fixed)) !== null) {
    const innerContent = match[0].slice(2, -2);
    const repaired = fixMathContent(innerContent);
    mathRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      fixed: `$$${repaired}$$`,
    });
  }

  regex = /\$([^$]+)\$/g;
  while ((match = regex.exec(fixed)) !== null) {
    const innerContent = match[1];
    const repaired = fixMathContent(innerContent);
    mathRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      fixed: `$${repaired}$`,
    });
  }

  mathRegions.sort((a, b) => b.start - a.start);
  for (const region of mathRegions) {
    if (region.original !== region.fixed) {
      console.log('🔧 Fixed math content:', region.original, '->', region.fixed);
      fixed = fixed.substring(0, region.start) + region.fixed + fixed.substring(region.end);
    }
  }

  fixed = fixed
    .split('\n')
    .map((line) => wrapEquationLine(line))
    .join('\n');

  console.log('SUCCESS - LaTeX validation complete');
  if (fixed !== text) {
    console.log('WARNING - Fixed LaTeX formatting');
    console.log('   Original:', text.substring(0, 150));
    console.log('   Fixed:', fixed.substring(0, 150));
  }

  return fixed;
}
