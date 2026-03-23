import { StatusBar } from './StatusBar';
import { TopActions } from './TopActions';
import { MessageInput } from './MessageInput';
import { Share2, Info, Check } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '../../utils/clipboard';
import { createSharedQuestion } from '../../services/sharedQuestionService';
import { MathBackground } from './MathBackground';
import { ActionButton } from './ActionButton';
import { HomeIndicator } from './HomeIndicator';
import { SelfExplanationModal } from './SelfExplanationModal';

interface HomeScreenProps {
  config: {
    heading: string;
    placeholder: string;
    button2Label: string;
    iconBgColors: {
      from: string;
      via: string;
      to: string;
    };
    inputBgColor: string;
  };
  onArchiveClick: () => void;
  onInviteClick: () => void;
  onProfileClick: () => void;
  onSharedExerciseClick?: () => void;
  onGenerateSolution: () => Promise<void>;
  onQuestionSubmit: (question: string, imageUrl: string | null) => void;
  onGetCurrentInput: (getter: () => string) => void;
  isGeneratingSolution: boolean;
  getCurrentInput: (() => string) | null;
  uploadedImageUrl: string | null;
  prefilledQuestion?: string;
  prefillToken?: string | null;
  currentUserName?: string;
}

export function HomeScreen({
  config,
  onArchiveClick,
  onInviteClick,
  onProfileClick,
  onSharedExerciseClick,
  onGenerateSolution,
  onQuestionSubmit,
  onGetCurrentInput,
  isGeneratingSolution,
  getCurrentInput,
  uploadedImageUrl,
  prefilledQuestion,
  prefillToken,
  currentUserName = 'You',
}: HomeScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleShareQuestion = async () => {
    const question = getCurrentInput?.() || '';

    if (!question.trim() && !uploadedImageUrl) {
      alert('Please type a question or upload an image before sharing!');
      return;
    }

    try {
      const { sharedQuestion, link } = await createSharedQuestion({
        question,
        imageUrl: uploadedImageUrl,
        sharedBy: currentUserName,
      });

      await copyToClipboard(link);
      setLinkCopied(true);
      console.log('Shared question stored on backend:', sharedQuestion);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to create share link:', error);
      alert(`Failed to create share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <>
      <StatusBar />
      <TopActions
        onArchiveClick={onArchiveClick}
        onInviteClick={onInviteClick}
        onProfileClick={onProfileClick}
        onSharedExerciseClick={onSharedExerciseClick}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-auto">
        <MathBackground />
        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center py-8">
          <h2 className="text-2xl md:text-3xl text-gray-900 mb-3 font-semibold text-center">
            {config.heading}
          </h2>

          <div className="mb-6 text-justify max-w-xl">
            <p className="text-[14px] text-gray-600 leading-relaxed">
              <strong>Paste or type your math problem</strong> below, or upload an image of it. Then click <strong>"{config.button2Label}"</strong> to get step-by-step help with hints and explanations!
            </p>
          </div>

          <MessageInput
            placeholder={config.placeholder}
            bgColor={config.inputBgColor}
            onNavigate={() => {}}
            onProblemSolved={() => {}}
            onQuestionSubmit={onQuestionSubmit}
            onGetCurrentInput={onGetCurrentInput}
            initialQuestion={prefilledQuestion}
            initialImageUrl={uploadedImageUrl}
            prefillToken={prefillToken}
          />

          <div className="w-full flex flex-col gap-3">
            <ActionButton
              label={isGeneratingSolution ? 'Generating...' : config.button2Label}
              onClick={async () => {
                if (isGeneratingSolution) return;

                const question = getCurrentInput?.() || '';
                if (!question.trim() && !uploadedImageUrl) {
                  alert('Please type a question or upload an image before generating a solution!');
                  return;
                }

                await onGenerateSolution();
              }}
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 inline-flex items-center justify-center gap-3 text-base text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-semibold transition-all rounded-xl border-2 border-purple-200 hover:border-purple-300 group"
            >
              <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
              What is self-explanation and why does it help learning?
            </button>

            <button
              onClick={handleShareQuestion}
              className="w-full py-4 inline-flex items-center justify-center gap-3 text-base text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-semibold transition-all rounded-xl border-2 border-purple-600 hover:border-purple-700 group shadow-md hover:shadow-lg"
            >
              {linkCopied ? (
                <>
                  <Check className="w-5 h-5" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Share Question with Friend
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <HomeIndicator />
      <SelfExplanationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
