import { useState, useEffect } from 'react';
import { StatusBar } from './components/StatusBar';
import { HomeIndicator } from './components/HomeIndicator';
import { TopActions } from './components/TopActions';
import { MessageInput } from './components/MessageInput';
import { ActionButton } from './components/ActionButton';
import { MathBackground } from './components/MathBackground';
import { ScaffoldedSolutionScreen } from './components/ScaffoldedSolutionScreen';
import { ScaffoldedSolutionScreenActive } from './components/ScaffoldedSolutionScreenActive';
import { ArchiveScreen } from './components/ArchiveScreen';
import { InviteFriendScreen } from './components/InviteFriendScreen';
import { CoLearnScreen } from './components/CoLearnScreen';
import { StepFeedbackScreen } from './components/StepFeedbackScreen';
import { BothWrongScreen } from './components/BothWrongScreen';
import { PartiallyCorrectScreen } from './components/PartiallyCorrectScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { InteractiveGuidedSolution } from './components/InteractiveGuidedSolution';
import { SelfExplanationModal } from './components/SelfExplanationModal';
import { SelfExplanationLearningScreen } from './components/SelfExplanationLearningScreen';
import { QuestionCorrectionModal } from './components/QuestionCorrectionModal';
import { solveProblem, testConnection } from '../services/aiService';

interface DesignConfig {
  heading: string;
  placeholder: string;
  button1Label: string;
  button2Label: string;
  iconBgColors: {
    from: string;
    via: string;
    to: string;
  };
  buttonBorderColor: string;
  inputBgColor: string;
}

export default function EngineeringThinking() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'scaffolded' | 'scaffolded-active' | 'archive' | 'guided' | 'invite' | 'colearn' | 'feedback-correct' | 'feedback-wrong' | 'feedback-both-wrong' | 'feedback-partial' | 'profile' | 'self-explanation'>('home');
  const [aiData, setAiData] = useState<any>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [showSelfExplanationModal, setShowSelfExplanationModal] = useState<boolean>(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [getCurrentInput, setGetCurrentInput] = useState<(() => string) | null>(null);
  const [config] = useState<DesignConfig>({
    heading: 'What are we learning this time?',
    placeholder: 'Type your question or paste your problem here...',
    button1Label: 'Generate Full Solution',
    button2Label: 'Generate Guided Solution',
    iconBgColors: {
      from: 'purple-500',
      via: 'pink-500',
      to: 'orange-400',
    },
    buttonBorderColor: 'gray-300',
    inputBgColor: '#ffffff',
  });

  // Test backend connection on mount
  useEffect(() => {
    testConnection().then(connected => {
      console.log('Backend connection test:', connected ? 'SUCCESS' : 'FAILED');
    });
  }, []);

  // Handle question correction submission
  const handleQuestionCorrection = async (correctedQuestion: string, file?: File) => {
    console.log('Question correction received:', correctedQuestion, file);
    
    // Update the question
    setUserQuestion(correctedQuestion);
    
    // TODO: If file is provided, upload it to backend
    if (file) {
      console.log('File to upload:', file.name, file.size);
      // In a real implementation, you would upload the file here
    }
    
    // Regenerate the solution with the corrected question
    try {
      const aiResponse = await solveProblem(correctedQuestion);
      setAiData(aiResponse);
      console.log('Solution regenerated successfully');
    } catch (error) {
      console.error('Failed to regenerate solution:', error);
      setAiData({
        solution: `Unable to generate solution. Please check your connection.`,
        strategy: 'Try again or check if the backend is configured.',
        steps: []
      });
    }
  };

  return (
    <div className="size-full bg-white flex flex-col overflow-hidden">
      {currentScreen === 'home' ? (
        <>
          <StatusBar />
          <TopActions
            onArchiveClick={() => setCurrentScreen('archive')}
            onInviteClick={() => setCurrentScreen('invite')}
            onProfileClick={() => setCurrentScreen('profile')}
          />

          {/* Main content area */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 bg-gray-100 relative overflow-auto">
            <MathBackground />
            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center py-8">
              <h2 className="text-2xl md:text-3xl text-gray-900 mb-8 font-semibold">
                {config.heading}
              </h2>

              <MessageInput
                placeholder={config.placeholder}
                bgColor={config.inputBgColor}
                onNavigate={() => setCurrentScreen('scaffolded')}
                onProblemSolved={(data) => setAiData(data)}
                onQuestionSubmit={(question) => setUserQuestion(question)}
                onGetCurrentInput={(getter) => setGetCurrentInput(() => getter)}
              />

              {/* Action buttons */}
              <div className="w-full flex flex-col gap-3">
                <ActionButton
                  label={config.button2Label}
                  onClick={async () => {
                    // Get current input from MessageInput
                    const question = getCurrentInput?.() || '';
                    if (question.trim()) {
                      setUserQuestion(question.trim());
                      // Call AI service to get problem-specific solution
                      try {
                        const aiResponse = await solveProblem(question.trim());
                        setAiData(aiResponse);
                      } catch (error) {
                        console.error('Failed to generate solution:', error);
                        // Fallback to basic demo if there's an error
                        setAiData({
                          solution: `Unable to generate solution. Please check your connection.`,
                          strategy: 'Try again or check if the backend is configured.',
                          steps: []
                        });
                      }
                    }
                    setCurrentScreen('scaffolded');
                  }}
                />
                
                <button
                  onClick={() => setShowSelfExplanationModal(true)}
                  className="w-full h-[48px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-medium text-[15px] shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  💡 Self-Explanation Hints
                </button>
              </div>
            </div>
          </div>

          {/* Self-Explanation Modal */}
          <SelfExplanationModal
            isOpen={showSelfExplanationModal}
            onClose={() => setShowSelfExplanationModal(false)}
            onLearnInApp={() => {
              setShowSelfExplanationModal(false);
              setCurrentScreen('self-explanation');
            }}
          />

          <HomeIndicator />
        </>
      ) : currentScreen === 'scaffolded' ? (
        <>
          <StatusBar />
          <ScaffoldedSolutionScreen
            onBack={() => setCurrentScreen('home')}
            onHomeClick={() => setCurrentScreen('home')}
            onArchiveClick={() => setCurrentScreen('archive')}
            onInviteClick={() => setCurrentScreen('invite')}
            onStartLearning={() => setCurrentScreen('guided')}
            onCorrectQuestion={() => setShowCorrectionModal(true)}
            onMarkAsCorrect={() => setCurrentScreen('scaffolded-active')}
            aiData={aiData}
            userQuestion={userQuestion}
          />
          
          {/* Question Correction Modal */}
          <QuestionCorrectionModal
            isOpen={showCorrectionModal}
            onClose={() => setShowCorrectionModal(false)}
            currentQuestion={userQuestion}
            onSubmitCorrection={handleQuestionCorrection}
          />
          
          <HomeIndicator />
        </>
      ) : currentScreen === 'scaffolded-active' ? (
        <>
          <StatusBar />
          <ScaffoldedSolutionScreenActive
            onBack={() => setCurrentScreen('home')}
            onHomeClick={() => setCurrentScreen('home')}
            onArchiveClick={() => setCurrentScreen('archive')}
            onInviteClick={() => setCurrentScreen('invite')}
            onStartLearning={() => setCurrentScreen('guided')}
            aiData={aiData}
            userQuestion={userQuestion}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'guided' ? (
        <>
          <StatusBar />
          <InteractiveGuidedSolution
            onBack={() => setCurrentScreen('scaffolded-active')}
            onCoLearnClick={() => setCurrentScreen('colearn')}
            onHomeClick={() => setCurrentScreen('home')}
            onArchiveClick={() => setCurrentScreen('archive')}
            onInviteClick={() => setCurrentScreen('invite')}
            onNavigateToFeedback={(feedbackType, data) => {
              setFeedbackData(data);
              if (feedbackType === 'both-wrong') {
                setCurrentScreen('feedback-both-wrong');
              } else if (feedbackType === 'partial') {
                setCurrentScreen('feedback-partial');
              }
            }}
            aiData={aiData}
            userQuestion={userQuestion}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'archive' ? (
        <>
          <StatusBar />
          <ArchiveScreen
            onBack={() => setCurrentScreen('home')}
            onHomeClick={() => setCurrentScreen('home')}
            onInviteClick={() => setCurrentScreen('invite')}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'invite' ? (
        <>
          <StatusBar />
          <InviteFriendScreen
            onBack={() => setCurrentScreen('home')}
            onHomeClick={() => setCurrentScreen('home')}
            onArchiveClick={() => setCurrentScreen('archive')}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'colearn' ? (
        <>
          <StatusBar />
          <CoLearnScreen
            onBack={() => setCurrentScreen('guided')}
            onHomeClick={() => setCurrentScreen('home')}
            onArchiveClick={() => setCurrentScreen('archive')}
            onInviteClick={() => setCurrentScreen('invite')}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'feedback-correct' ? (
        <>
          <StatusBar />
          <StepFeedbackScreen
            answerCorrect={true}
            explanationCorrect={true}
            onBack={() => setCurrentScreen('guided')}
            onHomeClick={() => setCurrentScreen('home')}
            onArchiveClick={() => setCurrentScreen('archive')}
            onInviteClick={() => setCurrentScreen('invite')}
            onCoLearnClick={() => setCurrentScreen('colearn')}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'feedback-wrong' ? (
        <>
          <StatusBar />
          <StepFeedbackScreen
            answerCorrect={false}
            explanationCorrect={false}
            onBack={() => setCurrentScreen('guided')}
            onHomeClick={() => setCurrentScreen('home')}
            onArchiveClick={() => setCurrentScreen('archive')}
            onInviteClick={() => setCurrentScreen('invite')}
            onCoLearnClick={() => setCurrentScreen('colearn')}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'feedback-both-wrong' ? (
        <>
          <StatusBar />
          <BothWrongScreen
            onBack={() => setCurrentScreen('guided')}
            onTryAgain={() => setCurrentScreen('guided')}
            stepNumber={feedbackData?.stepNumber}
            hint={feedbackData?.hint}
            userAnswer={feedbackData?.userAnswer}
            userExplanation={feedbackData?.userExplanation}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'feedback-partial' ? (
        <>
          <StatusBar />
          <PartiallyCorrectScreen
            onBack={() => setCurrentScreen('guided')}
            onTryAgain={() => setCurrentScreen('guided')}
            stepNumber={feedbackData?.stepNumber}
            hint={feedbackData?.hint}
            userAnswer={feedbackData?.userAnswer}
            userExplanation={feedbackData?.userExplanation}
            answerCorrect={feedbackData?.answerCorrect}
            explanationCorrect={feedbackData?.explanationCorrect}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'profile' ? (
        <>
          <StatusBar />
          <ProfileScreen
            onBack={() => setCurrentScreen('home')}
          />
          <HomeIndicator />
        </>
      ) : currentScreen === 'self-explanation' ? (
        <>
          <StatusBar />
          <SelfExplanationLearningScreen
            onBack={() => setCurrentScreen('home')}
          />
          <HomeIndicator />
        </>
      ) : (
        <>
          <StatusBar />
          <StepFeedbackScreen
            answerCorrect={false}
            explanationCorrect={false}
            onBack={() => setCurrentScreen('guided')}
            onHomeClick={() => setCurrentScreen('home')}
            onArchiveClick={() => setCurrentScreen('archive')}
            onInviteClick={() => setCurrentScreen('invite')}
            onCoLearnClick={() => setCurrentScreen('colearn')}
          />
          <HomeIndicator />
        </>
      )}
    </div>
  );
}
