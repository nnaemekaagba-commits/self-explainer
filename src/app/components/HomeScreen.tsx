import { StatusBar } from './StatusBar';
import { TopActions } from './TopActions';
import { MessageInput } from './MessageInput';
import { Share2, Info, Check } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '../../utils/clipboard';
import { createSharedQuestion } from '../../services/sharedQuestionService';
import { getSessionId } from '../../services/sessionService';
import { MathBackground } from './MathBackground';
import { ActionButton } from './ActionButton';
import { HomeIndicator } from './HomeIndicator';
import { SelfExplanationModal } from './SelfExplanationModal';

type TutorSubject = 'linear-algebra' | 'trigonometry' | 'geometry';

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
  selectedSubject: TutorSubject;
  onSubjectChange: (subject: TutorSubject) => void;
  onGetCurrentInput: (getter: () => string) => void;
  isGeneratingSolution: boolean;
  getCurrentInput: (() => string) | null;
  uploadedImageUrl: string | null;
  prefilledQuestion?: string;
  prefillToken?: string | null;
  currentUserId?: string | null;
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
  selectedSubject,
  onSubjectChange,
  onGetCurrentInput,
  isGeneratingSolution,
  getCurrentInput,
  uploadedImageUrl,
  prefilledQuestion,
  prefillToken,
  currentUserId,
  currentUserName = 'You',
}: HomeScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const subjectLabels: Record<TutorSubject, string> = {
    'linear-algebra': 'Linear Algebra',
    'trigonometry': 'Trigonometry',
    'geometry': 'Geometry',
  };

  const subjectDescriptions: Record<TutorSubject, string> = {
    'linear-algebra': 'Build strategy with systems, matrices, vectors, and transformations.',
    'trigonometry': 'Practice identities, angle reasoning, unit-circle thinking, and trig equations.',
    'geometry': 'Strengthen diagram reading, theorem use, and proof-style justification.',
  };

  const saveToSharerSharedExercises = (sharedQuestion: {
    id: string;
    question: string;
    imageUrl?: string | null;
    sharedBy: string;
    sharedAt: string;
  }) => {
    const sessionId = getSessionId(currentUserId);
    const storageKey = `shared_questions_${sessionId}`;
    const existing = localStorage.getItem(storageKey);
    const questions = existing ? JSON.parse(existing) : [];
    const alreadyExists = questions.some((item: any) => item.id === sharedQuestion.id);

    if (!alreadyExists) {
      questions.unshift(sharedQuestion);
      localStorage.setItem(storageKey, JSON.stringify(questions));
    }
  };

  const buildDirectShareLink = (question: string, imageUrl: string | null) => {
    const fullPayload = {
      question,
      imageUrl: imageUrl || null,
    };
    const fullEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(fullPayload))));
    let url = `${window.location.origin}?shareData=${encodeURIComponent(fullEncoded)}`;

    // Keep URLs practical. If the image makes the URL too large, fall back to question text only.
    if (url.length > 6000) {
      const textOnlyPayload = { question, imageUrl: null };
      const textOnlyEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(textOnlyPayload))));
      url = `${window.location.origin}?shareData=${encodeURIComponent(textOnlyEncoded)}`;
    }

    return url;
  };

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

      saveToSharerSharedExercises({
        id: sharedQuestion.id,
        question: sharedQuestion.question,
        imageUrl: sharedQuestion.imageUrl || null,
        sharedBy: sharedQuestion.sharedBy,
        sharedAt: sharedQuestion.sharedAt,
      });
      await copyToClipboard(link);
      setLinkCopied(true);
      console.log('Shared question stored on backend:', sharedQuestion);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Backend share link failed, using direct-link fallback:', error);

      try {
        const fallbackId = `local-share-${Date.now()}`;
        saveToSharerSharedExercises({
          id: fallbackId,
          question,
          imageUrl: uploadedImageUrl || null,
          sharedBy: currentUserName,
          sharedAt: new Date().toLocaleString(),
        });
        const directLink = buildDirectShareLink(question, uploadedImageUrl);
        await copyToClipboard(directLink);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Failed to create fallback share link:', fallbackError);
        alert(`Failed to create share link: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
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
          {config.heading ? (
            <h2 className="text-2xl md:text-3xl text-gray-900 mb-3 font-semibold text-center">
              {config.heading}
            </h2>
          ) : null}

          <div className="w-full mb-5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-purple-700 mb-3 text-center">
              Choose A Skill Track
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['linear-algebra', 'trigonometry', 'geometry'] as TutorSubject[]).map((subject) => {
                const isActive = selectedSubject === subject;
                return (
                  <button
                    key={subject}
                    onClick={() => onSubjectChange(subject)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                      isActive
                        ? 'border-purple-600 bg-white shadow-md ring-2 ring-purple-200'
                        : 'border-purple-200 bg-white/70 hover:bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="text-[14px] font-semibold text-gray-900">
                      {subjectLabels[subject]}
                    </div>
                    <div className="mt-1 text-[12px] leading-relaxed text-gray-600">
                      {subjectDescriptions[subject]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6 text-justify max-w-xl">
            <p className="text-[14px] text-gray-600 leading-relaxed">
              <strong>Paste or type your {subjectLabels[selectedSubject].toLowerCase()} problem</strong> below, or upload an image of it. The tutor will guide you through understanding the problem, choosing a strategy, and checking your reasoning instead of just giving an answer.
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
            showSendButton={false}
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
