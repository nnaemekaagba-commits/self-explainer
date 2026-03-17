import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

export function MathRenderer({ content, className }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    const container = containerRef.current;
    container.innerHTML = '';

    try {
      // Process the content character by character to find math delimiters
      let i = 0;
      let currentText = '';

      while (i < content.length) {
        // Check for display math: \\[ ... \\]
        if (i < content.length - 1 && content[i] === '\\' && content[i + 1] === '[') {
          // Flush any accumulated text
          if (currentText) {
            const p = document.createElement('span');
            p.textContent = currentText;
            container.appendChild(p);
            currentText = '';
          }

          // Find the closing \\]
          let end = i + 2;
          while (end < content.length - 1) {
            if (content[end] === '\\' && content[end + 1] === ']') {
              break;
            }
            end++;
          }

          if (end < content.length - 1) {
            const latex = content.slice(i + 2, end);
            const div = document.createElement('div');
            div.className = 'katex-display my-4';
            try {
              katex.render(latex, div, { 
                displayMode: true, 
                throwOnError: false,
                trust: true,
                strict: false
              });
              container.appendChild(div);
            } catch (e) {
              console.error('KaTeX display math error:', e);
              const fallback = document.createElement('div');
              fallback.textContent = content.slice(i, end + 2);
              fallback.className = 'text-red-600';
              container.appendChild(fallback);
            }
            i = end + 2;
            continue;
          }
        }

        // Check for inline math: \\( ... \\)
        if (i < content.length - 1 && content[i] === '\\' && content[i + 1] === '(') {
          // Flush any accumulated text
          if (currentText) {
            const span = document.createElement('span');
            span.textContent = currentText;
            container.appendChild(span);
            currentText = '';
          }

          // Find the closing \\)
          let end = i + 2;
          while (end < content.length - 1) {
            if (content[end] === '\\' && content[end + 1] === ')') {
              break;
            }
            end++;
          }

          if (end < content.length - 1) {
            const latex = content.slice(i + 2, end);
            const span = document.createElement('span');
            span.className = 'inline-math';
            try {
              katex.render(latex, span, { 
                displayMode: false, 
                throwOnError: false,
                trust: true,
                strict: false
              });
              container.appendChild(span);
            } catch (e) {
              console.error('KaTeX inline math error:', e);
              const fallback = document.createElement('span');
              fallback.textContent = content.slice(i, end + 2);
              fallback.className = 'text-red-600';
              container.appendChild(fallback);
            }
            i = end + 2;
            continue;
          }
        }

        // Check for display math: $$ ... $$
        if (i < content.length - 1 && content[i] === '$' && content[i + 1] === '$') {
          // Flush any accumulated text
          if (currentText) {
            const span = document.createElement('span');
            span.textContent = currentText;
            container.appendChild(span);
            currentText = '';
          }

          // Find the closing $$
          let end = i + 2;
          while (end < content.length - 1) {
            if (content[end] === '$' && content[end + 1] === '$') {
              break;
            }
            end++;
          }

          if (end < content.length - 1) {
            const latex = content.slice(i + 2, end);
            const div = document.createElement('div');
            div.className = 'katex-display my-4';
            try {
              katex.render(latex, div, { 
                displayMode: true, 
                throwOnError: false,
                trust: true,
                strict: false
              });
              container.appendChild(div);
            } catch (e) {
              console.error('KaTeX display math error:', e);
              const fallback = document.createElement('div');
              fallback.textContent = content.slice(i, end + 2);
              fallback.className = 'text-red-600';
              container.appendChild(fallback);
            }
            i = end + 2;
            continue;
          }
        }

        // Check for inline math: $ ... $
        if (content[i] === '$' && (i === 0 || content[i - 1] !== '$')) {
          // Make sure it's not $$
          if (i + 1 < content.length && content[i + 1] === '$') {
            currentText += content[i];
            i++;
            continue;
          }

          // Flush any accumulated text
          if (currentText) {
            const span = document.createElement('span');
            span.textContent = currentText;
            container.appendChild(span);
            currentText = '';
          }

          // Find the closing $
          let end = i + 1;
          while (end < content.length) {
            if (content[end] === '$' && content[end - 1] !== '\\') {
              break;
            }
            end++;
          }

          if (end < content.length) {
            const latex = content.slice(i + 1, end);
            const span = document.createElement('span');
            span.className = 'inline-math';
            try {
              katex.render(latex, span, { 
                displayMode: false, 
                throwOnError: false,
                trust: true,
                strict: false
              });
              container.appendChild(span);
            } catch (e) {
              console.error('KaTeX inline math error:', e);
              const fallback = document.createElement('span');
              fallback.textContent = content.slice(i, end + 1);
              fallback.className = 'text-red-600';
              container.appendChild(fallback);
            }
            i = end + 1;
            continue;
          }
        }

        // Regular character
        currentText += content[i];
        i++;
      }

      // Flush any remaining text
      if (currentText) {
        const span = document.createElement('span');
        span.textContent = currentText;
        container.appendChild(span);
      }
    } catch (error) {
      // If anything goes wrong, just display the content as plain text
      console.error('MathRenderer error:', error);
      if (containerRef.current) {
        containerRef.current.textContent = content;
      }
    }
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`math-content ${className || ''}`}
    >
      {content}
    </div>
  );
}