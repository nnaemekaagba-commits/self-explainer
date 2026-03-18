import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

type MathToken =
  | { type: 'text'; value: string }
  | { type: 'inline-math' | 'display-math'; value: string };

function normalizeLatex(latex: string): string {
  return latex
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/−/g, '-')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/≠/g, '\\neq ')
    .replace(/≈/g, '\\approx ')
    .replace(/°/g, '^{\\circ}')
    .trim();
}

function probablyMath(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  return /\\[a-zA-Z]+|[=^_{}]|\\frac|\\sqrt|\\sum|\\int|\\theta|\\pi|\\alpha|\\beta|\\gamma|\\Delta|\\sin|\\cos|\\tan|\d\s*[+\-*/]\s*\d|[A-Za-z]\^\d/.test(trimmed);
}

function tokenizeContent(content: string): MathToken[] {
  const tokens: MathToken[] = [];
  let i = 0;
  let currentText = '';

  const flushText = () => {
    if (currentText) {
      tokens.push({ type: 'text', value: currentText });
      currentText = '';
    }
  };

  while (i < content.length) {
    if (content.startsWith('\\[', i)) {
      const end = content.indexOf('\\]', i + 2);
      if (end !== -1) {
        flushText();
        tokens.push({
          type: 'display-math',
          value: normalizeLatex(content.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    if (content.startsWith('\\(', i)) {
      const end = content.indexOf('\\)', i + 2);
      if (end !== -1) {
        flushText();
        tokens.push({
          type: 'inline-math',
          value: normalizeLatex(content.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    if (content.startsWith('$$', i)) {
      const end = content.indexOf('$$', i + 2);
      if (end !== -1) {
        flushText();
        tokens.push({
          type: 'display-math',
          value: normalizeLatex(content.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    if (content[i] === '$' && !content.startsWith('$$', i)) {
      let end = i + 1;
      while (end < content.length) {
        if (content[end] === '$' && content[end - 1] !== '\\') {
          break;
        }
        end += 1;
      }

      if (end < content.length) {
        const candidate = content.slice(i + 1, end);
        if (probablyMath(candidate)) {
          flushText();
          tokens.push({
            type: 'inline-math',
            value: normalizeLatex(candidate),
          });
          i = end + 1;
          continue;
        }
      }
    }

    currentText += content[i];
    i += 1;
  }

  flushText();
  return tokens;
}

function appendText(container: HTMLDivElement, text: string) {
  if (!text) return;

  const pieces = text.split(/(\n+)/);
  pieces.forEach((piece) => {
    if (!piece) return;

    if (/^\n+$/.test(piece)) {
      for (let i = 0; i < piece.length; i += 1) {
        container.appendChild(document.createElement('br'));
      }
      return;
    }

    const span = document.createElement('span');
    span.className = 'math-text';
    span.textContent = piece;
    container.appendChild(span);
  });
}

function appendMath(container: HTMLDivElement, latex: string, displayMode: boolean) {
  const element = document.createElement(displayMode ? 'div' : 'span');
  element.className = displayMode ? 'math-block' : 'inline-math';

  try {
    katex.render(latex, element, {
      displayMode,
      throwOnError: false,
      trust: true,
      strict: false,
      output: 'htmlAndMathml',
    });
  } catch (error) {
    console.error(`KaTeX ${displayMode ? 'display' : 'inline'} math error:`, error);
    element.textContent = displayMode ? `$$${latex}$$` : `$${latex}$`;
    element.classList.add('math-fallback');
  }

  container.appendChild(element);
}

export function MathRenderer({ content, className }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    if (!content) return;

    try {
      const tokens = tokenizeContent(content);

      tokens.forEach((token) => {
        if (token.type === 'text') {
          appendText(container, token.value);
          return;
        }

        appendMath(container, token.value, token.type === 'display-math');
      });
    } catch (error) {
      console.error('MathRenderer error:', error);
      container.textContent = content;
    }
  }, [content]);

  return <div ref={containerRef} className={`math-content ${className || ''}`} />;
}
