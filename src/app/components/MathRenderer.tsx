import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

type Token =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; displayMode: boolean; raw: string };

function isEscaped(text: string, index: number): boolean {
  let backslashCount = 0;
  let i = index - 1;
  while (i >= 0 && text[i] === '\\') {
    backslashCount++;
    i--;
  }
  return backslashCount % 2 === 1;
}

function findClosingDelimiter(text: string, start: number, delimiter: string): number {
  let i = start;
  while (i <= text.length - delimiter.length) {
    if (text.slice(i, i + delimiter.length) === delimiter && !isEscaped(text, i)) {
      return i;
    }
    i++;
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

function normalizeContent(raw: string): string {
  return raw
    .replace(/```(?:latex|math)?\s*([\s\S]*?)```/gi, '$1')
    .replace(/\\\$/g, '$')
    .replace(/\r\n/g, '\n');
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

function appendTextWithLineBreaks(container: HTMLElement, text: string) {
  const segments = text.split('\n');

  segments.forEach((segment, index) => {
    if (segment.length > 0) {
      const span = document.createElement('span');
      span.textContent = segment;
      container.appendChild(span);
    }

    if (index < segments.length - 1) {
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

    if (!content) return;

    try {
      const tokens = tokenizeMathContent(content);

      tokens.forEach((token) => {
        if (token.type === 'text') {
          appendTextWithLineBreaks(container, token.value);
          return;
        }

        const wrapper = document.createElement(token.displayMode ? 'div' : 'span');
        wrapper.className = token.displayMode ? 'math-display-block' : 'math-inline-block';

        try {
          katex.render(token.value, wrapper, {
            displayMode: token.displayMode,
            throwOnError: false,
            strict: false,
            trust: true,
            output: 'htmlAndMathml',
          });
        } catch (error) {
          console.error('KaTeX render error:', error);
          wrapper.textContent = token.raw;
          wrapper.className += ' math-render-fallback';
        }

        container.appendChild(wrapper);
      });
    } catch (error) {
      console.error('MathRenderer error:', error);
      container.textContent = content;
    }
  }, [content]);

  return <div ref={containerRef} className={`math-content ${className || ''}`} />;
}
