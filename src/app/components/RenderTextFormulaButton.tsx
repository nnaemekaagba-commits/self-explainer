import { Wand2 } from 'lucide-react';

interface RenderTextFormulaButtonProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export function RenderTextFormulaButton({
  enabled,
  onToggle,
  className = '',
}: RenderTextFormulaButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
        enabled
          ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
          : 'border-purple-200 bg-white text-purple-700 hover:border-purple-300 hover:bg-purple-50'
      } ${className}`}
      title="Render text and formulas more cleanly"
    >
      <Wand2 size={14} />
      <span>{enabled ? 'Rendered' : 'Render Text + Formula'}</span>
    </button>
  );
}
