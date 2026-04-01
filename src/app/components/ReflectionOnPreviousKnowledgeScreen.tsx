import { ArrowLeft, Brain, Lightbulb, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ScreenNavigation } from './ScreenNavigation';
import { RenderableMathBlock } from './RenderableMathBlock';

interface ReflectionOnPreviousKnowledgeScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  question?: string;
  priorKnowledgePrompt: string;
  transferPrompt: string;
  initialPriorKnowledgeAnswer?: string;
  initialTransferAnswer?: string;
  onSubmit: (priorKnowledgeAnswer: string, transferAnswer: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function ReflectionOnPreviousKnowledgeScreen({
  onBack,
  onHomeClick,
  onArchiveClick,
  onInviteClick,
  question,
  priorKnowledgePrompt,
  transferPrompt,
  initialPriorKnowledgeAnswer = '',
  initialTransferAnswer = '',
  onSubmit,
  isSubmitting = false,
}: ReflectionOnPreviousKnowledgeScreenProps) {
  const [priorKnowledgeAnswer, setPriorKnowledgeAnswer] = useState(initialPriorKnowledgeAnswer);
  const [transferAnswer, setTransferAnswer] = useState(initialTransferAnswer);
  const [showTransferPrompt, setShowTransferPrompt] = useState(Boolean(initialTransferAnswer.trim()));

  const handleRevealTransferPrompt = () => {
    if (!priorKnowledgeAnswer.trim()) {
      return;
    }
    setShowTransferPrompt(true);
  };

  const handleSubmit = async () => {
    if (!priorKnowledgeAnswer.trim() || !transferAnswer.trim()) {
      return;
    }
    await onSubmit(priorKnowledgeAnswer.trim(), transferAnswer.trim());
  };

  return (
    <>
      <ScreenNavigation
        onInviteClick={onInviteClick}
        onHomeClick={onHomeClick}
        onArchiveClick={onArchiveClick}
        showHomeIcon={true}
      />

      <div className="h-[50px] flex items-center justify-between px-6 pt-2 border-b border-gray-200">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ArrowLeft size={20} strokeWidth={2} />
          <span className="text-[15px] font-medium">Back</span>
        </button>
        <span className="text-[15px] font-medium text-gray-900">Reflection on Previous Knowledge</span>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8 bg-slate-50">
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-[14px] font-semibold text-blue-900 mb-2">Why this step matters</p>
            <p className="text-[13px] leading-relaxed text-blue-800">
              Before the guided solution starts, reflect on what you already know and how you would build a rule for a harder version.
              The tutor will use your responses to adjust the partial steps and pacing.
            </p>
          </div>

          {question ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">Current Problem</p>
              <div className="text-[14px] text-slate-800">
                <RenderableMathBlock content={question} />
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                <Brain size={18} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Be reflective</h3>
                <div className="text-[13px] leading-relaxed text-slate-700 mt-1">
                  <RenderableMathBlock content={priorKnowledgePrompt} buttonClassName="justify-start" />
                </div>
              </div>
            </div>

            <textarea
              value={priorKnowledgeAnswer}
              onChange={(event) => setPriorKnowledgeAnswer(event.target.value)}
              placeholder="Describe what you already know, what seems familiar, and where you feel unsure."
              className="w-full min-h-[140px] rounded-xl border border-purple-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />

            {!showTransferPrompt ? (
              <button
                onClick={handleRevealTransferPrompt}
                disabled={!priorKnowledgeAnswer.trim()}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            ) : null}
          </div>

          {showTransferPrompt ? (
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Lightbulb size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-900">Be Inventive</h3>
                  <div className="text-[13px] leading-relaxed text-slate-700 mt-1">
                    <RenderableMathBlock content={transferPrompt} buttonClassName="justify-start" />
                  </div>
                </div>
              </div>

              <textarea
                value={transferAnswer}
                onChange={(event) => setTransferAnswer(event.target.value)}
                placeholder="Propose a rule, pattern, or strategy you would try, even if you are not fully sure yet."
                className="w-full min-h-[160px] rounded-xl border border-amber-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              <button
                onClick={handleSubmit}
                disabled={!priorKnowledgeAnswer.trim() || !transferAnswer.trim() || isSubmitting}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Preparing Guided Solution...
                  </>
                ) : (
                  'Start Guided Solution'
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
