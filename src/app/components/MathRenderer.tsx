import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

type Token =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; displayMode: boolean; raw: string };

type Block =
  | { type: 'paragraph'; value: string }
  | { type: 'list-item'; value: string }
  | { type: 'math'; value: string; raw: string };

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
  ['â€²', '′'],
  ['Â²', '²'],
  ['Â³', '³'],
  ['Â¹', '¹'],
  ['Â°', '°'],
  ['Â·', '·'],
  ['Âπ', 'π'],
  ['Â', ''],
];

const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁺': '+',
  '⁻': '-',
  '⁽': '(',
  '⁾': ')',
  'ⁿ': 'n',
  'ᵃ': 'a',
  'ᵇ': 'b',
  'ᶜ': 'c',
  'ᵈ': 'd',
  'ᵉ': 'e',
  'ᶠ': 'f',
  'ᵍ': 'g',
  'ʰ': 'h',
  'ᶦ': 'i',
  'ʲ': 'j',
  'ᵏ': 'k',
  'ˡ': 'l',
  'ᵐ': 'm',
  'ᵒ': 'o',
  'ᵖ': 'p',
  'ʳ': 'r',
  'ˢ': 's',
  'ᵗ': 't',
  'ᵘ': 'u',
  'ᵛ': 'v',
  'ʷ': 'w',
  'ˣ': 'x',
  'ʸ': 'y',
  'ᶻ': 'z',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  '₊': '+',
  '₋': '-',
  '₍': '(',
  '₎': ')',
  'ₐ': 'a',
  'ₑ': 'e',
  'ₕ': 'h',
  'ᵢ': 'i',
  'ⱼ': 'j',
  'ₖ': 'k',
  'ₗ': 'l',
  'ₘ': 'm',
  'ₙ': 'n',
  'ₒ': 'o',
  'ₚ': 'p',
  'ᵣ': 'r',
  'ₛ': 's',
  'ₜ': 't',
  'ᵤ': 'u',
  'ᵥ': 'v',
  'ₓ': 'x',
};

const GREEK_LATEX_MAP: Record<string, string> = {
  alpha: '\\alpha',
  beta: '\\beta',
  gamma: '\\gamma',
  delta: '\\delta',
  theta: '\\theta',
  lambda: '\\lambda',
  mu: '\\mu',
  pi: '\\pi',
  sigma: '\\sigma',
  omega: '\\omega',
};

function isEscaped(text: string, index: number): boolean {
  let backslashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && text[cursor] === '\\') {
    backslashCount++;
    cursor--;
  }

  return backslashCount % 2 === 1;
}

function findClosingDelimiter(text: string, start: number, delimiter: string): number {
  let cursor = start;

  while (cursor <= text.length - delimiter.length) {
    if (text.slice(cursor, cursor + delimiter.length) === delimiter && !isEscaped(text, cursor)) {
      return cursor;
    }

    cursor++;
  }

  return -1;
}

function shouldTreatAsInlineMath(text: string, index: number): boolean {
  const nextChar = text[index + 1];
  const prevChar = text[index - 1];

  if (!nextChar) return false;
  if (nextChar === '$' || /\s/.test(nextChar)) return false;

  // Avoid treating currency-like values such as $5 or $20.50 as math.
  if (/[0-9]/.test(nextChar) && (!prevChar || /\s|[(\[{=:;,]/.test(prevChar))) {
    return false;
  }

  return true;
}

function fixBrokenSymbols(raw: string): string {
  return BROKEN_SYMBOL_MAP.reduce((fixed, [broken, replacement]) => {
    return fixed.replaceAll(broken, replacement);
  }, raw);
}

function aggressivelyUnescapeLatex(raw: string): string {
  let fixed = raw;
  let previous = '';
  let iterations = 0;

  while (fixed !== previous && iterations < 6) {
    previous = fixed;
    fixed = fixed
      .replace(/\\\\\(/g, '\\(')
      .replace(/\\\\\)/g, '\\)')
      .replace(/\\\\\[/g, '\\[')
      .replace(/\\\\\]/g, '\\]')
      .replace(/\\\\([A-Za-z])/g, '\\$1')
      .replace(/\\\\,/g, '\\,')
      .replace(/\\\\;/g, '\\;')
      .replace(/\\\\:/g, '\\:')
      .replace(/\\\\!/g, '\\!');
    iterations++;
  }

  return fixed;
}

function repairLatexDelimiters(raw: string): string {
  let fixed = raw;

  fixed = fixed
    .replace(/(^|[\n\r]\s*|,\s*)(\\(?:sum|frac|sqrt|theta|alpha|beta|gamma|delta|lambda|mu|sigma|omega|sin|cos|tan)\b[\s\S]*?\\\))/g, '$1\\($2')
    .replace(/(^|[\n\r]\s*)(\\sum\s+F_[xy]\s*=\s*0\s*[:=]\s*)/g, '$1\\($2\\)')
    .replace(/(^|[\n\r]\s*)(\\sum\s+M_?[A-Za-z]?\s*=\s*0\s*[:=]\s*)/g, '$1\\($2\\)')
    .replace(/\b(we have|the equations become|this gives|therefore)\s+=\s+/gi, '$1 ');

  return fixed;
}

function normalizeContent(raw: string): string {
  return repairLatexDelimiters(aggressivelyUnescapeLatex(fixBrokenSymbols(raw)))
    .replace(/\\t(?=imes|ext)/g, '\\')
    .replace(/\t(?=imes|ext)/g, '\\')
    .replace(/```(?:latex|math)?\s*([\s\S]*?)```/gi, '$1')
    .replace(/\\\$/g, '$')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r\n/g, '\n');
}

function decodeMappedSequence(sequence: string, map: Record<string, string>): string {
  return Array.from(sequence)
    .map((character) => map[character] || character)
    .join('');
}

function replaceSquareRootCalls(expression: string): string {
  let updated = expression;
  const patterns = [/sqrt\s*\(/gi, /√\s*\(/g];

  patterns.forEach((pattern) => {
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(updated)) !== null) {
      const openParenIndex = match.index + match[0].length - 1;
      let depth = 0;
      let closeParenIndex = -1;

      for (let cursor = openParenIndex; cursor < updated.length; cursor++) {
        if (updated[cursor] === '(') depth++;
        if (updated[cursor] === ')') {
          depth--;
          if (depth === 0) {
            closeParenIndex = cursor;
            break;
          }
        }
      }

      if (closeParenIndex === -1) {
        continue;
      }

      const inner = updated.slice(openParenIndex + 1, closeParenIndex).trim();
      const latex = `\\sqrt{${inner}}`;
      updated = `${updated.slice(0, match.index)}${latex}${updated.slice(closeParenIndex + 1)}`;
      pattern.lastIndex = match.index + latex.length;
    }
  });

  return updated;
}

function normalizePlainMathExpression(expression: string): string {
  let normalized = normalizeContent(expression.trim())
    .replace(/([A-Za-z0-9)\]}])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰᶦʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]+)/g, (_, base, power) => {
      return `${base}^{${decodeMappedSequence(power, SUPERSCRIPT_MAP)}}`;
    })
    .replace(/([A-Za-z0-9)\]}])([₀₁₂₃₄₅₆₇₈₉₊₋₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ]+)/g, (_, base, subscript) => {
      return `${base}_{${decodeMappedSequence(subscript, SUBSCRIPT_MAP)}}`;
    })
    .replace(/≤/g, ' \\leq ')
    .replace(/≥/g, ' \\geq ')
    .replace(/≠/g, ' \\neq ')
    .replace(/≈/g, ' \\approx ')
    .replace(/±/g, ' \\pm ')
    .replace(/→/g, ' \\to ')
    .replace(/←/g, ' \\leftarrow ')
    .replace(/×/g, ' \\times ')
    .replace(/÷/g, ' \\div ')
    .replace(/·/g, ' \\cdot ')
    .replace(/∞/g, ' \\infty ')
    .replace(/π/g, ' \\pi ')
    .replace(/∑/g, ' \\sum ')
    .replace(/\b(sum|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega)\b/gi, (match) => {
      return GREEK_LATEX_MAP[match.toLowerCase()] || match;
    })
    .replace(/>=/g, ' \\geq ')
    .replace(/<=/g, ' \\leq ')
    .replace(/!=/g, ' \\neq ')
    .replace(/\+-/g, ' \\pm ')
    .replace(/->/g, ' \\to ')
    .replace(/\*/g, ' \\cdot ');

  normalized = replaceSquareRootCalls(normalized);

  return normalized.replace(/\s+/g, ' ').trim();
}

function sanitizeLatexExpression(expression: string): string {
  let sanitized = normalizeContent(expression.trim())
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
    .replace(/\\([A-Za-z]+)\]/g, '\\$1]')
    .replace(/\{\s*([A-Za-z]{1,4})\s*\}/g, '{$1}')
    .replace(/\\sum\s+F_([xy])\s*=\s*0\s*:/g, '\\sum F_$1 = ')
    .replace(/\\sum\s+M_?([A-Za-z])\s*=\s*0\s*:/g, '\\sum M_$1 = ')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\,/g, '\\,');

  if (sanitized.startsWith('\\(') && sanitized.endsWith('\\)')) {
    sanitized = sanitized.slice(2, -2).trim();
  }

  if (sanitized.startsWith('\\[') && sanitized.endsWith('\\]')) {
    sanitized = sanitized.slice(2, -2).trim();
  }

  return sanitized.replace(/\s+/g, ' ').trim();
}

function prettifyPlainText(text: string): string {
  return text
    .replace(/>=/g, '≥')
    .replace(/<=/g, '≤')
    .replace(/!=/g, '≠')
    .replace(/\+-/g, '±')
    .replace(/->/g, '→');
}

function tokenizeMathContent(rawContent: string): Token[] {
  const content = normalizeContent(rawContent);
  const tokens: Token[] = [];
  let cursor = 0;
  let textBuffer = '';

  const flushText = () => {
    if (textBuffer) {
      tokens.push({ type: 'text', value: textBuffer });
      textBuffer = '';
    }
  };

  while (cursor < content.length) {
    const slice = content.slice(cursor);

    if (slice.startsWith('\\[')) {
      const end = findClosingDelimiter(content, cursor + 2, '\\]');
      if (end !== -1) {
        flushText();
        const raw = content.slice(cursor, end + 2);
        tokens.push({
          type: 'math',
          value: content.slice(cursor + 2, end).trim(),
          displayMode: true,
          raw,
        });
        cursor = end + 2;
        continue;
      }
    }

    if (slice.startsWith('\\(')) {
      const end = findClosingDelimiter(content, cursor + 2, '\\)');
      if (end !== -1) {
        flushText();
        const raw = content.slice(cursor, end + 2);
        tokens.push({
          type: 'math',
          value: content.slice(cursor + 2, end).trim(),
          displayMode: false,
          raw,
        });
        cursor = end + 2;
        continue;
      }
    }

    if (slice.startsWith('$$') && !isEscaped(content, cursor)) {
      const end = findClosingDelimiter(content, cursor + 2, '$$');
      if (end !== -1) {
        flushText();
        const raw = content.slice(cursor, end + 2);
        tokens.push({
          type: 'math',
          value: content.slice(cursor + 2, end).trim(),
          displayMode: true,
          raw,
        });
        cursor = end + 2;
        continue;
      }
    }

    if (content[cursor] === '$' && !isEscaped(content, cursor) && shouldTreatAsInlineMath(content, cursor)) {
      const end = findClosingDelimiter(content, cursor + 1, '$');
      if (end !== -1 && end > cursor + 1) {
        flushText();
        const raw = content.slice(cursor, end + 1);
        tokens.push({
          type: 'math',
          value: content.slice(cursor + 1, end).trim(),
          displayMode: false,
          raw,
        });
        cursor = end + 1;
        continue;
      }
    }

    textBuffer += content[cursor];
    cursor++;
  }

  flushText();
  return tokens;
}

function looksLikeDisplayMathLine(line: string): boolean {
  const trimmed = line.trim();

  if (!trimmed) return false;
  if ((trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) || (trimmed.startsWith('$$') && trimmed.endsWith('$$'))) {
    return true;
  }
  if ((trimmed.match(/\\\(/g) || []).length > 1) {
    return false;
  }

  const hasMathMarkers =
    /[=<>≤≥≈±→÷×√∑π]/.test(trimmed) ||
    /\\(frac|sqrt|sum|pi|theta|alpha|beta|gamma|delta|lambda|mu|sigma|omega|times|cdot|leq|geq|neq|to)/.test(trimmed) ||
    /[A-Za-z]\d|\d[A-Za-z]|[A-Za-z][²³ⁿ]/.test(trimmed);
  const sentenceWordCount = (trimmed.match(/\b[A-Za-z]{4,}\b/g) || []).length;

  return hasMathMarkers && sentenceWordCount <= 4 && trimmed.length <= 160 && !/[!?]/.test(trimmed);
}

function extractStandaloneMath(line: string): { value: string; raw: string } {
  const trimmed = line.trim();

  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
    return { value: trimmed.slice(2, -2).trim(), raw: trimmed };
  }

  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
    return { value: trimmed.slice(2, -2).trim(), raw: trimmed };
  }

  if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) {
    return { value: trimmed.slice(2, -2).trim(), raw: trimmed };
  }

  return { value: normalizePlainMathExpression(trimmed), raw: trimmed };
}

function buildBlocks(rawContent: string): Block[] {
  const content = normalizeContent(rawContent);
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      blocks.push({ type: 'paragraph', value: paragraphBuffer.join('\n').trim() });
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (listBuffer.length > 0) {
      listBuffer.forEach((item) => blocks.push({ type: 'list-item', value: item }));
      listBuffer = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const bulletMatch = trimmed.match(/^(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      listBuffer.push(bulletMatch[1].trim());
      return;
    }

    if (looksLikeDisplayMathLine(trimmed)) {
      flushParagraph();
      flushList();
      const math = extractStandaloneMath(trimmed);
      blocks.push({ type: 'math', value: math.value, raw: math.raw });
      return;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  });

  flushParagraph();
  flushList();

  return blocks;
}

function isInlineMathCandidate(candidate: string): boolean {
  const trimmed = candidate.trim();
  const longWordCount = (trimmed.match(/\b[A-Za-z]{4,}\b/g) || []).length;

  return (
    trimmed.includes('=') &&
    trimmed.length >= 3 &&
    trimmed.length <= 80 &&
    !trimmed.includes('\n') &&
    /[0-9A-Za-z]/.test(trimmed) &&
    longWordCount <= 2
  );
}

function findInlineEquationRanges(text: string): Array<{ start: number; end: number; value: string; raw: string }> {
  const ranges: Array<{ start: number; end: number; value: string; raw: string }> = [];

  for (let cursor = 0; cursor < text.length; cursor++) {
    if (text[cursor] !== '=') continue;

    let start = cursor;
    while (start > 0 && !/[\n:;,.!?]/.test(text[start - 1])) {
      start--;
    }

    let end = cursor + 1;
    while (end < text.length && !/[\n;,.!?]/.test(text[end])) {
      end++;
    }

    const segment = text.slice(start, end);
    const leadingWhitespace = segment.match(/^\s*/)?.[0].length || 0;
    const trailingWhitespace = segment.match(/\s*$/)?.[0].length || 0;
    const raw = segment.slice(leadingWhitespace, segment.length - trailingWhitespace);
    const actualStart = start + leadingWhitespace;
    const actualEnd = end - trailingWhitespace;

    if (!isInlineMathCandidate(raw)) {
      continue;
    }

    const previousRange = ranges[ranges.length - 1];
    if (previousRange && actualStart < previousRange.end) {
      continue;
    }

    ranges.push({
      start: actualStart,
      end: actualEnd,
      raw,
      value: normalizePlainMathExpression(raw),
    });

    cursor = actualEnd - 1;
  }

  return ranges;
}

function renderMathIntoElement(container: HTMLElement, value: string, raw: string, displayMode: boolean) {
  container.className = displayMode ? 'math-display-block' : 'math-inline-block';
  const sanitizedValue = sanitizeLatexExpression(value);

  try {
    katex.render(sanitizedValue, container, {
      displayMode,
      throwOnError: true,
      strict: false,
      trust: true,
      output: 'htmlAndMathml',
    });
  } catch (error) {
    try {
      const normalizedValue = normalizePlainMathExpression(sanitizedValue);
      katex.render(normalizedValue, container, {
        displayMode,
        throwOnError: true,
        strict: false,
        trust: true,
        output: 'htmlAndMathml',
      });
    } catch (retryError) {
      console.error('KaTeX render error:', error);
      console.error('KaTeX retry error:', retryError);
      container.textContent = prettifyPlainText(sanitizeLatexExpression(raw));
      container.className += ' math-render-fallback';
    }
  }
}

function appendTextWithInlineEquations(container: HTMLElement, text: string) {
  const segments = text.split('\n');

  segments.forEach((segment, lineIndex) => {
    const ranges = findInlineEquationRanges(segment);
    let cursor = 0;

    ranges.forEach((range) => {
      if (range.start > cursor) {
        const span = document.createElement('span');
        span.textContent = prettifyPlainText(segment.slice(cursor, range.start));
        container.appendChild(span);
      }

      const wrapper = document.createElement('span');
      renderMathIntoElement(wrapper, range.value, range.raw, false);
      container.appendChild(wrapper);
      cursor = range.end;
    });

    if (cursor < segment.length) {
      const span = document.createElement('span');
      span.textContent = prettifyPlainText(segment.slice(cursor));
      container.appendChild(span);
    }

    if (lineIndex < segments.length - 1) {
      container.appendChild(document.createElement('br'));
    }
  });
}

function appendInlineContent(container: HTMLElement, text: string) {
  const tokens = tokenizeMathContent(text);

  tokens.forEach((token) => {
    if (token.type === 'text') {
      appendTextWithInlineEquations(container, token.value);
      return;
    }

    const wrapper = document.createElement(token.displayMode ? 'div' : 'span');
    renderMathIntoElement(wrapper, token.value, token.raw, token.displayMode);
    container.appendChild(wrapper);
  });
}

export function MathRenderer({ content, className }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    if (!content) return;

    try {
      const blocks = buildBlocks(content);
      let listElement: HTMLUListElement | null = null;

      blocks.forEach((block) => {
        if (block.type !== 'list-item') {
          listElement = null;
        }

        if (block.type === 'paragraph') {
          const paragraph = document.createElement('p');
          paragraph.className = 'math-paragraph';
          appendInlineContent(paragraph, block.value);
          container.appendChild(paragraph);
          return;
        }

        if (block.type === 'list-item') {
          if (!listElement) {
            listElement = document.createElement('ul');
            listElement.className = 'math-list';
            container.appendChild(listElement);
          }

          const listItem = document.createElement('li');
          listItem.className = 'math-list-item';
          appendInlineContent(listItem, block.value);
          listElement.appendChild(listItem);
          return;
        }

        const wrapper = document.createElement('div');
        renderMathIntoElement(wrapper, block.value, block.raw, true);
        container.appendChild(wrapper);
      });
    } catch (error) {
      console.error('MathRenderer error:', error);
      container.textContent = content;
    }
  }, [content]);

  return <div ref={containerRef} className={`math-content ${className || ''}`} />;
}
