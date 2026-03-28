import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

type Token =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; raw: string; displayMode: boolean };

type Block =
  | { type: 'paragraph'; value: string }
  | { type: 'list-item'; value: string }
  | { type: 'math'; value: string; raw: string };

const BROKEN_SYMBOL_MAP: Array<[string, string]> = [
  ['Ã¢Ë†â€™', '\\u2212'],
  ['Ã¢Ë†Å¡', '\\u221a'],
  ['Ã‚Â±', '\\u00b1'],
  ['Ãƒâ€”', '\\u00d7'],
  ['ÃƒÂ·', '\\u00f7'],
  ['Ã¢â€°Â¤', '\\u2264'],
  ['Ã¢â€°Â¥', '\\u2265'],
  ['Ã¢â€° ', '\\u2260'],
  ['Ã¢â€°Ë†', '\\u2248'],
  ['Ã¢â€ â€™', '\\u2192'],
  ['Ã¢â€ Â', '\\u2190'],
  ['Ã¢â‚¬Â²', '\\u2032'],
  ['Ã‚Â²', '\\u00b2'],
  ['Ã‚Â³', '\\u00b3'],
  ['Ã‚Â¹', '\\u00b9'],
  ['Ã‚Â°', '\\u00b0'],
  ['Ã‚Â·', '\\u00b7'],
  ['Ã‚Ï€', '\\u03c0'],
  ['Ã‚', ''],
];

const INLINE_DELIMITERS = [
  { open: '\\[', close: '\\]', displayMode: true },
  { open: '\\(', close: '\\)', displayMode: false },
  { open: '$$', close: '$$', displayMode: true },
  { open: '$', close: '$', displayMode: false },
] as const;

const INLINE_MATH_CANDIDATE =
  /(^|[\s(:;,])([A-Za-z0-9\\][A-Za-z0-9\\^_{}()[\].,+\-*/=<>| ]{1,80}[=<>+\-*/^][A-Za-z0-9\\^_{}()[\].,+\-*/=<>| ]{1,80})(?=$|[\s),;:.!?])/g;

function replaceUnicodeEscapes(value: string): string {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

function fixBrokenSymbols(raw: string): string {
  return replaceUnicodeEscapes(
    BROKEN_SYMBOL_MAP.reduce((fixed, [broken, replacement]) => fixed.replaceAll(broken, replacement), raw),
  );
}

function unescapeLatexDelimiters(raw: string): string {
  let fixed = raw;
  let previous = '';
  let iterations = 0;

  while (fixed !== previous && iterations < 4) {
    previous = fixed;
    fixed = fixed
      .replace(/\\\\\(/g, '\\(')
      .replace(/\\\\\)/g, '\\)')
      .replace(/\\\\\[/g, '\\[')
      .replace(/\\\\\]/g, '\\]')
      .replace(/\\\\,/g, '\\,')
      .replace(/\\\\;/g, '\\;')
      .replace(/\\\\:/g, '\\:')
      .replace(/\\\\!/g, '\\!')
      .replace(/\\\\([A-Za-z]+)/g, '\\$1');
    iterations++;
  }

  return fixed;
}

function normalizeContent(raw: string): string {
  return unescapeLatexDelimiters(fixBrokenSymbols(raw))
    .replace(/```(?:latex|math)?\s*([\s\S]*?)```/gi, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\r\n/g, '\n')
    .trim();
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && text[cursor] === '\\') {
    slashCount++;
    cursor--;
  }

  return slashCount % 2 === 1;
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

  if (!nextChar || nextChar === '$' || /\s/.test(nextChar)) {
    return false;
  }

  if (/[0-9]/.test(nextChar) && (!prevChar || /\s|[(\[{=:;,]/.test(prevChar))) {
    return false;
  }

  return true;
}

function tokenizeExplicitMath(content: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  let textBuffer = '';

  const flushText = () => {
    if (!textBuffer) return;
    tokens.push({ type: 'text', value: textBuffer });
    textBuffer = '';
  };

  while (cursor < content.length) {
    let matched = false;

    for (const delimiter of INLINE_DELIMITERS) {
      if (content.slice(cursor, cursor + delimiter.open.length) !== delimiter.open) {
        continue;
      }

      if (delimiter.open === '$' && !shouldTreatAsInlineMath(content, cursor)) {
        continue;
      }

      const end = findClosingDelimiter(content, cursor + delimiter.open.length, delimiter.close);
      if (end === -1) {
        continue;
      }

      flushText();
      const raw = content.slice(cursor, end + delimiter.close.length);
      tokens.push({
        type: 'math',
        value: content.slice(cursor + delimiter.open.length, end).trim(),
        raw,
        displayMode: delimiter.displayMode,
      });
      cursor = end + delimiter.close.length;
      matched = true;
      break;
    }

    if (matched) {
      continue;
    }

    textBuffer += content[cursor];
    cursor++;
  }

  flushText();
  return tokens;
}

function looksLikeMathLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  if (
    (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) ||
    (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) ||
    (trimmed.startsWith('$$') && trimmed.endsWith('$$'))
  ) {
    return true;
  }

  const longWordCount = (trimmed.match(/\b[A-Za-z]{4,}\b/g) || []).length;
  const containsMathSyntax =
    /\\(frac|sqrt|sum|int|lim|pi|theta|alpha|beta|gamma|delta|lambda|mu|sigma|omega|times|cdot|leq|geq|neq|approx|text)\b/.test(trimmed) ||
    /[=<>+\-*/^_]/.test(trimmed) ||
    /[\u2212\u221a\u00b1\u00d7\u00f7\u2264\u2265\u2260\u2248\u2192\u03c0]/.test(trimmed);
  const mostlyMathCharacters = /^[A-Za-z0-9\s=<>+\-*/^_()[\]{}.,:;\\|\u2212\u221a\u00b1\u00d7\u00f7\u2264\u2265\u2260\u2248\u2192\u03c0]+$/.test(trimmed);

  return containsMathSyntax && longWordCount <= 2 && mostlyMathCharacters && trimmed.length <= 180;
}

function looksLikeInlineMathSegment(segment: string): boolean {
  const trimmed = segment.trim();
  if (!trimmed || trimmed.length > 120) return false;

  const longWordCount = (trimmed.match(/\b[A-Za-z]{4,}\b/g) || []).length;
  const containsMathSyntax =
    /\\(frac|sqrt|sum|int|lim|pi|theta|alpha|beta|gamma|delta|lambda|mu|sigma|omega|times|cdot|leq|geq|neq|approx|text|sin|cos|tan)\b/.test(trimmed) ||
    /[=<>+\-*/^_]/.test(trimmed) ||
    /[\u2212\u221a\u00b1\u00d7\u00f7\u2264\u2265\u2260\u2248\u2192\u03c0]/.test(trimmed);
  const hasMathAtoms = /[A-Za-z]/.test(trimmed) || /\d/.test(trimmed);
  const mostlyMathCharacters = /^[A-Za-z0-9\s=<>+\-*/^_()[\]{}.,:;\\|]+$/.test(trimmed);

  return containsMathSyntax && hasMathAtoms && longWordCount <= 2 && mostlyMathCharacters;
}

function sanitizeLatexExpression(expression: string): string {
  let sanitized = expression.trim();

  if (sanitized.startsWith('\\(') && sanitized.endsWith('\\)')) {
    sanitized = sanitized.slice(2, -2).trim();
  }
  if (sanitized.startsWith('\\[') && sanitized.endsWith('\\]')) {
    sanitized = sanitized.slice(2, -2).trim();
  }
  if (sanitized.startsWith('$$') && sanitized.endsWith('$$')) {
    sanitized = sanitized.slice(2, -2).trim();
  }

  return sanitized
    .replace(/\\imes\b/g, '\\times')
    .replace(/\\ext\b/g, '\\text')
    .replace(/\\thet(?![a-zA-Z])/g, '\\theta')
    .replace(/\\alph(?![a-zA-Z])/g, '\\alpha')
    .replace(/\\bet(?![a-zA-Z])/g, '\\beta')
    .replace(/\\gamm(?![a-zA-Z])/g, '\\gamma')
    .replace(/\\delt(?![a-zA-Z])/g, '\\delta')
    .replace(/\\lambd(?![a-zA-Z])/g, '\\lambda')
    .replace(/\\sigm(?![a-zA-Z])/g, '\\sigma')
    .replace(/\\omeg(?![a-zA-Z])/g, '\\omega')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\u2212/g, '-')
    .replace(/\u221a/g, '\\sqrt')
    .replace(/\u00b1/g, '\\pm')
    .replace(/\u00d7/g, '\\times')
    .replace(/\u00f7/g, '\\div')
    .replace(/\u2264/g, '\\leq')
    .replace(/\u2265/g, '\\geq')
    .replace(/\u2260/g, '\\neq')
    .replace(/\u2248/g, '\\approx')
    .replace(/\u2192/g, '\\to')
    .replace(/\u03c0/g, '\\pi')
    .replace(/\u00b7/g, '\\cdot')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePlainMathExpression(expression: string): string {
  return sanitizeLatexExpression(expression)
    .replace(/\bpi\b/gi, '\\pi')
    .replace(/\bsqrt\s*\(([^)]+)\)/gi, '\\sqrt{$1}')
    .replace(/>=/g, '\\geq')
    .replace(/<=/g, '\\leq')
    .replace(/!=/g, '\\neq')
    .replace(/->/g, '\\to')
    .replace(/\*/g, '\\cdot ')
    .trim();
}

function tokenizeImplicitMath(text: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_MATH_CANDIDATE)) {
    const fullMatch = match[0];
    const prefix = match[1] || '';
    const candidate = match[2];
    const matchIndex = match.index ?? 0;
    const candidateStart = matchIndex + prefix.length;

    if (!looksLikeInlineMathSegment(candidate)) {
      continue;
    }

    if (candidateStart > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, candidateStart) });
    }

    tokens.push({
      type: 'math',
      value: normalizePlainMathExpression(candidate),
      raw: candidate,
      displayMode: false,
    });

    lastIndex = candidateStart + candidate.length;

    if (fullMatch.endsWith(prefix) && prefix) {
      lastIndex = matchIndex + fullMatch.length;
    }
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens.length ? tokens : [{ type: 'text', value: text }];
}

function buildBlocks(rawContent: string): Block[] {
  const content = normalizeContent(rawContent);
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    blocks.push({ type: 'paragraph', value: paragraphBuffer.join('\n').trim() });
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!listBuffer.length) return;
    listBuffer.forEach((value) => blocks.push({ type: 'list-item', value }));
    listBuffer = [];
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

    if (looksLikeMathLine(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'math',
        value: normalizePlainMathExpression(trimmed),
        raw: trimmed,
      });
      return;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  });

  flushParagraph();
  flushList();

  return blocks;
}

function renderMathIntoElement(container: HTMLElement, value: string, raw: string, displayMode: boolean) {
  container.className = displayMode ? 'math-display-block' : 'math-inline-block';
  const sanitizedValue = sanitizeLatexExpression(value);

  try {
    katex.renderToString(sanitizedValue, {
      displayMode,
      throwOnError: true,
      strict: false,
      trust: false,
      output: 'htmlAndMathml',
    });

    katex.render(sanitizedValue, container, {
      displayMode,
      throwOnError: true,
      strict: false,
      trust: false,
      output: 'htmlAndMathml',
    });
  } catch (error) {
    console.error('KaTeX render error:', error);
    container.textContent = raw;
    container.className += ' math-render-fallback';
  }
}

function appendInlineContent(container: HTMLElement, text: string) {
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    const tokens = tokenizeExplicitMath(line).flatMap((token) =>
      token.type === 'text' ? tokenizeImplicitMath(token.value) : [token],
    );

    tokens.forEach((token) => {
      if (token.type === 'text') {
        const span = document.createElement('span');
        span.textContent = token.value;
        container.appendChild(span);
        return;
      }

      const wrapper = document.createElement(token.displayMode ? 'div' : 'span');
      renderMathIntoElement(wrapper, token.value, token.raw, token.displayMode);
      container.appendChild(wrapper);
    });

    if (lineIndex < lines.length - 1) {
      container.appendChild(document.createElement('br'));
    }
  });
}

export function MathRenderer({ content, className }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    if (!content) {
      return;
    }

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

          const item = document.createElement('li');
          item.className = 'math-list-item';
          appendInlineContent(item, block.value);
          listElement.appendChild(item);
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

  return <div ref={containerRef} className={`math-content antialiased ${className || ''}`} />;
}
