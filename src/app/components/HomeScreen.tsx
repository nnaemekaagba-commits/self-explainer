import { StatusBar } from './StatusBar';
import { TopActions } from './TopActions';
import { MessageInput } from './MessageInput';
import { ActionButton } from './ActionButton';
import { HomeIndicator } from './HomeIndicator';
import { MathBackground } from './MathBackground';
import { AppIcon } from './AppIcon';
import { SelfExplanationModal } from './SelfExplanationModal';
import { Info } from 'lucide-react';
import { useState } from 'react';

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
  onGenerateSolution: () => Promise<void>;
  onQuestionSubmit: (question: string, imageUrl: string | null) => void;
  onGetCurrentInput: (getter: () => string) => void;
  isGeneratingSolution: boolean;
  getCurrentInput: (() => string) | null;
  uploadedImageUrl: string | null;
}

export function HomeScreen({
  config,
  onArchiveClick,
  onInviteClick,
  onProfileClick,
  onGenerateSolution,
  onQuestionSubmit,
  onGetCurrentInput,
  isGeneratingSolution,
  getCurrentInput,
  uploadedImageUrl,
}: HomeScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <StatusBar />
      <TopActions
        onArchiveClick={onArchiveClick}
        onInviteClick={onInviteClick}
        onProfileClick={onProfileClick}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-auto">
        <MathBackground />
        <div className="relative z-10 w-full max-w-2xl flex flex-col items-center py-8">
          {/* Heading */}
          <h2 className="text-2xl md:text-3xl text-gray-900 mb-3 font-semibold text-center">
            {config.heading}
          </h2>
          
          {/* Instructions */}
          <div className="mb-6 text-justify max-w-xl">
            <p className="text-[14px] text-gray-600 leading-relaxed">
              <strong>Paste or type your math problem</strong> below, or upload an image of it. Then click <strong>"{config.button2Label}"</strong> to get step-by-step help with hints and explanations!
            </p>
          </div>

          <MessageInput
            placeholder={config.placeholder}
            bgColor={config.inputBgColor}
            onNavigate={() => {}}
            onProblemSolved={(data) => {}}
            onQuestionSubmit={onQuestionSubmit}
            onGetCurrentInput={onGetCurrentInput}
          />

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-3">
            <ActionButton
              label={isGeneratingSolution ? '🔄 Generating...' : config.button2Label}
              onClick={async () => {
                // Prevent double-click
                if (isGeneratingSolution) return;
                
                // Get current input from MessageInput
                const question = getCurrentInput?.() || '';
                
                // ⚠️ VALIDATION: Check if there's a question or image
                if (!question.trim() && !uploadedImageUrl) {
                  alert('Please type a question or upload an image before generating a solution!');
                  console.warn('⚠️ No question or image provided');
                  return;
                }
                
                await onGenerateSolution();
              }}
            />
            
            {/* Self-Explanation Info Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 inline-flex items-center justify-center gap-3 text-base text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-semibold transition-all rounded-xl border-2 border-purple-200 hover:border-purple-300 group"
            >
              <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
              What is self-explanation and why does it help learning?
            </button>
          </div>
        </div>
      </div>

      <HomeIndicator />
      <SelfExplanationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}