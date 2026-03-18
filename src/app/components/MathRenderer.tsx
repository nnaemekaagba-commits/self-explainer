import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

type Token =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; display: boolean; raw: string };

const KATEX_OPTIONS = {
  throwOnError: false,
  trust: true,
  strict: false as const,
  output: 'html' as const,
};

function normalizeContent(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\\\\[/g, '\\[')
    .replace(/\\\\\]/g, '\\]')
    .replace(/\\\\\(/g, '\\(')
    .replace(/\\\\\)/g, '\\)')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function findClosingDelimiter(content: string, start: number, delimiter: string): number {
  for (let index = start; index < content.length; index += 1) {
    if (content.startsWith(delimiter, index)) {
      if (delimiter === '$' || delimiter === '$$') {
        if (index > 0 && content[index - 1] === '\\') {
          continue;
        }
      }
      return index;
    }
  }
  return -1;
}

function tokenizeContent(content: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  let textBuffer = '';

  const flushText = () => {
    if (!textBuffer) return;
    tokens.push({ type: 'text', value: textBuffer });
    textBuffer = '';
  };

  while (cursor < content.length) {
    if (content.startsWith('\\[', cursor)) {
      const end = findClosingDelimiter(content, cursor + 2, '\\]');
      if (end !== -1) {
        flushText();
        tokens.push({
          type: 'math',
          value: content.slice(cursor + 2, end).trim(),
          display: true,
          raw: content.slice(cursor, end + 2),
        });
        cursor = end + 2;
        continue;
      }
    }

    if (content.startsWith('\\(', cursor)) {
      const end = findClosingDelimiter(content, cursor + 2, '\\)');
      if (end !== -1) {
        flushText();
        tokens.push({
          type: 'math',
          value: content.slice(cursor + 2, end).trim(),
          display: false,
          raw: content.slice(cursor, end + 2),
        });
        cursor = end + 2;
        continue;
      }
    }

    if (content.startsWith('$$', cursor)) {
      const end = findClosingDelimiter(content, cursor + 2, '$$');
      if (end !== -1) {
        flushText();
        tokens.push({
          type: 'math',
          value: content.slice(cursor + 2, end).trim(),
          display: true,
          raw: content.slice(cursor, end + 2),
        });
        cursor = end + 2;
        continue;
      }
    }

    if (content[cursor] === '$' && !content.startsWith('$$', cursor)) {
      const end = findClosingDelimiter(content, cursor + 1, '$');
      if (end !== -1) {
        flushText();
        tokens.push({
          type: 'math',
          value: content.slice(cursor + 1, end).trim(),
          display: false,
          raw: content.slice(cursor, end + 1),
        });
        cursor = end + 1;
        continue;
      }
    }

    textBuffer += content[cursor];
    cursor += 1;
  }

  flushText();
  return tokens;
}

function appendTextWithLineBreaks(parent: HTMLElement, text: string) {
  const segments = text.split(/\n/);
  segments.forEach((segment, index) => {
    if (segment.length > 0) {
      parent.appendChild(document.createTextNode(segment));
    }
    if (index < segments.length - 1) {
      parent.appendChild(document.createElement('br'));
    }
  });
}

function buildTextBlock(text: string): HTMLElement {
  const block = document.createElement('span');
  block.className = 'math-text-block';
  appendTextWithLineBreaks(block, text);
  return block;
}

function buildMathNode(token: Extract<Token, { type: 'math' }>): HTMLElement {
  const wrapper = document.createElement(token.display ? 'div' : 'span');
  wrapper.className = token.display ? 'math-display-block' : 'math-inline-block';

  try {
    katex.render(token.value, wrapper, {
      ...KATEX_OPTIONS,
      displayMode: token.display,
    });
  } catch (error) {
    console.error('KaTeX render error:', error);
    wrapper.className = token.display ? 'math-display-fallback' : 'math-inline-fallback';
    wrapper.textContent = token.raw;
  }

  return wrapper;
}

function buildDom(container: HTMLDivElement, rawContent: string) {
  const normalizedContent = normalizeContent(rawContent);
  const paragraphBlocks = normalizedContent.split(/\n{2,}/);

  paragraphBlocks.forEach((paragraphText) => {
    const paragraph = document.createElement('div');
    paragraph.className = 'math-paragraph';

    const tokens = tokenizeContent(paragraphText);

    if (tokens.length === 0) {
      paragraph.appendChild(document.createElement('br'));
      container.appendChild(paragraph);
      return;
    }

    tokens.forEach((token) => {
      if (token.type === 'text') {
        paragraph.appendChild(buildTextBlock(token.value));
      } else {
        paragraph.appendChild(buildMathNode(token));
      }
    });

    container.appendChild(paragraph);
  });
}

export function MathRenderer({ content, className }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    if (!content?.trim()) {
      return;
    }

    try {
      buildDom(container, content);
    } catch (error) {
      console.error('MathRenderer error:', error);
      container.textContent = content;
    }
  }, [content]);

  return <div ref={containerRef} className={`math-content ${className || ''}`} />;
}
