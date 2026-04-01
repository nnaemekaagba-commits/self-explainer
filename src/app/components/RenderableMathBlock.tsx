import { useState } from 'react';
import { MathRenderer } from './MathRenderer';
import { RenderTextFormulaButton } from './RenderTextFormulaButton';

interface RenderableMathBlockProps {
  content: string;
  className?: string;
  buttonClassName?: string;
  wrapperClassName?: string;
}

export function RenderableMathBlock({
  content,
  className,
  buttonClassName = '',
  wrapperClassName = '',
}: RenderableMathBlockProps) {
  const [normalizeContent, setNormalizeContent] = useState(false);

  return (
    <div className={wrapperClassName}>
      <div className={`mb-2 flex justify-end ${buttonClassName}`.trim()}>
        <RenderTextFormulaButton
          enabled={normalizeContent}
          onToggle={() => setNormalizeContent((prev) => !prev)}
        />
      </div>
      <MathRenderer content={content} className={className} normalizeContent={normalizeContent} />
    </div>
  );
}
