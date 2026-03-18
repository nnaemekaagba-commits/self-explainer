import { useState, useRef } from 'react';
import { ArrowLeft, Users, Image as ImageIcon, Lightbulb } from 'lucide-react';
import { validateStep, solveProblem } from '../../services/aiService';
import { MathRenderer } from './MathRenderer';
import { ScreenNavigation } from './ScreenNavigation';
import { MessageInput } from './MessageInput';
import { ActionButton } from './ActionButton';
import { MathBackground } from './MathBackground';
import { copyToClipboard } from '../../utils/clipboard';

interface Step {
  stepNumber: number;
  title: string;
  description: string;
  hint: string;
  formula: string;
  diagram?: string;
  diagramUrl?: string;
  diagramGenerated?: boolean;
}

interface InteractiveGuidedSolutionProps {
  onBack: () => void;
  onCoLearnClick?: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  onNavigateToFeedback?: (feedbackType: 'both-wrong' | 'partial' | 'correct', stepData: any) => void;
  onStepAttempt?: (stepNumber: number, userAnswer: string, userExplanation: string, answerCorrect: boolean, explanationCorrect: boolean, chatMessages?: Array<{role: 'user' | 'ai', content: string, timestamp: string}>, answerImageUrl?: string, explanationImageUrl?: string) => void;
  onPracticeClick?: () => void;
  currentStepChatMessages?: Array<{role: 'user' | 'ai', content: string}>;
  aiData?: {
    steps?: any[];
  };
  userQuestion?: string;
  uploadedImageUrl?: string | null;
  // Props to preserve input when navigating back
  savedStepAnswers?: Record<number, string>;
  savedStepExplanations?: Record<number, string>;
  onInputChange?: (stepNumber: number, answer: string, explanation: string) => void;
  // Props to track step progress
  currentStepIndex?: number;
  completedSteps?: Set<number>;
  onStepIndexChange?: (index: number) => void;
  onCompletedStepsChange?: (steps: Set<number>) => void;
  // Activity log ID for sharing
  activityLogId?: string;
}

export function InteractiveGuidedSolution({
  onBack,
  onCoLearnClick,
  onHomeClick,
  onArchiveClick,
  onInviteClick,
  onNavigateToFeedback,
  onStepAttempt,
  onPracticeClick,
  currentStepChatMessages,
  aiData,
  userQuestion,
  uploadedImageUrl,
  savedStepAnswers,
  savedStepExplanations,
  onInputChange,
  currentStepIndex: propCurrentStepIndex = 0,
  completedSteps: propCompletedSteps = new Set(),
  onStepIndexChange,
  onCompletedStepsChange,
  activityLogId,
}: InteractiveGuidedSolutionProps) {
  const [stepAnswers, setStepAnswers] = useState<Record<number, string>>(savedStepAnswers || {});
  const [stepExplanations, setStepExplanations] = useState<Record<number, string>>(savedStepExplanations || {});
  const [uploadedImages, setUploadedImages] = useState<Record<number, string>>({});
  const [uploadedAnswerImages, setUploadedAnswerImages] = useState<Record<number, string>>({});
  const [validating, setValidating] = useState<number | null>(null);
  // Use props for step tracking instead of local state
  const currentStepIndex = propCurrentStepIndex;
  const completedSteps = propCompletedSteps;
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const answerFileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const handleFileUpload = (stepNum: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages({ ...uploadedImages, [stepNum]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnswerFileUpload = (stepNum: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedAnswerImages({ ...uploadedAnswerImages, [stepNum]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to copy share link
  const handleCopyShareLink = async () => {
    if (!activityLogId) {
      alert('Cannot share: Activity not saved yet. Try solving a step first!');
      return;
    }

    const shareLink = `${window.location.origin}?shared=${activityLogId}`;
    
    try {
      await copyToClipboard(shareLink);
      console.log('✅ Share link copied:', shareLink);
    } catch (error) {
      console.error('❌ Failed to copy link:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  const handleSubmitStep = async (stepNumber: number) => {
    const answer = stepAnswers[stepNumber];
    const explanation = stepExplanations[stepNumber];
    const answerImage = uploadedAnswerImages[stepNumber];
    const explanationImage = uploadedImages[stepNumber];

    // Check if student provided at least SOMETHING (text or images)
    if (!answer && !explanation && !answerImage && !explanationImage) {
      alert('Please provide your answer and explanation! You can type them, upload pictures, or both.');
      return;
    }

    // Check if we have at least an answer (text or image)
    if (!answer && !answerImage) {
      alert('Please provide your answer! You can type it or upload a picture of your work.');
      return;
    }

    // Check if we have at least an explanation (text or image)
    if (!explanation && !explanationImage) {
      alert('Please provide your explanation! You can type it or upload a picture of your reasoning.');
      return;
    }

    // Find the step data
    const step = aiData?.steps.find(s => s.stepNumber === stepNumber);
    if (!step) {
      console.error('Step not found');
      return;
    }

    setValidating(stepNumber);

    try {
      const result = await validateStep(
        step, 
        answer || '[See uploaded image]', 
        explanation || '[See uploaded image]', 
        answerImage, 
        explanationImage
      );

      console.log('Validation result:', result);

      // Record the step attempt
      if (onStepAttempt) {
        console.log('🔥 CALLING onStepAttempt with:', {
          stepNumber,
          answer,
          explanation,
          answerCorrect: result.answerCorrect,
          explanationCorrect: result.explanationCorrect,
          currentStepChatMessages,
          chatMessagesCount: currentStepChatMessages?.length || 0,
          answerImage,
          explanationImage
        });
        
        onStepAttempt(
          stepNumber,
          answer || '[See uploaded image]',  // Use fallback text when only image uploaded
          explanation || '[See uploaded image]',  // Use fallback text when only image uploaded
          result.answerCorrect,
          result.explanationCorrect,
          currentStepChatMessages,
          answerImage,
          explanationImage
        );
      }

      // If both answer and explanation are correct, mark step as completed and advance
      if (result.answerCorrect && result.explanationCorrect) {
        // Mark step as completed
        if (onCompletedStepsChange) {
          const newCompletedSteps = new Set(completedSteps);
          newCompletedSteps.add(stepNumber);
          onCompletedStepsChange(newCompletedSteps);
        }
        
        // Navigate to correct feedback screen
        if (onNavigateToFeedback) {
          onNavigateToFeedback('correct', {
            stepNumber,
            hint: step.hint,
            userAnswer: answer,
            userExplanation: explanation,
            answerCorrect: true,
            explanationCorrect: true,
            feedback: result.feedback,
            answerImageUrl: answerImage,
            explanationImageUrl: explanationImage,
            diagram: result.diagram,
            isLastStep: currentStepIndex >= (aiData?.steps?.length || 0) - 1, // Add flag to know if this is the last step
          });
        }
        
        // Advance to next step if not the last one
        if (currentStepIndex < (aiData?.steps?.length || 0) - 1 && onStepIndexChange) {
          onStepIndexChange(currentStepIndex + 1);
        }
      } else if (!result.answerCorrect && !result.explanationCorrect) {
        // Both wrong - navigate to feedback but don't advance
        if (onNavigateToFeedback) {
          onNavigateToFeedback('both-wrong', {
            stepNumber,
            hint: step.hint,
            userAnswer: answer,
            userExplanation: explanation,
            answerCorrect: false,
            explanationCorrect: false,
            feedback: result.feedback,
            answerImageUrl: answerImage,
            explanationImageUrl: explanationImage,
            diagram: result.diagram
          });
        }
      } else {
        // One correct, one wrong - navigate to feedback but don't advance
        if (onNavigateToFeedback) {
          onNavigateToFeedback('partial', {
            stepNumber,
            hint: step.hint,
            userAnswer: answer,
            userExplanation: explanation,
            answerCorrect: result.answerCorrect,
            explanationCorrect: result.explanationCorrect,
            feedback: result.feedback,
            answerImageUrl: answerImage,
            explanationImageUrl: explanationImage,
            diagram: result.diagram
          });
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Failed to validate your answer. Please try again.');
    } finally {
      setValidating(null);
    }
  };

  const renderStep = (step: Step, index: number) => {
    const stepNum = step.stepNumber || index + 1;

    return (
      <div key={stepNum} className="mb-4">
        {/* Step Header */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] text-gray-900">
            <span className="font-semibold">Step {stepNum}:</span> {step.title}
          </p>
          <button
            onClick={onCoLearnClick}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
          >
            <Users size={14} />
            <span>Co-learn</span>
          </button>
        </div>

        <div className="ml-4 space-y-3">
          {/* Description */}
          <div className="text-[12px] text-gray-700">
            <MathRenderer content={step.description} />
          </div>

          {/* Self-Explanation Prompt */}
          {step.hint && (
            <div className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg">
              <p className="text-[11px] text-purple-800 font-semibold mb-2 flex items-center gap-1">
                <Lightbulb size={14} className="text-purple-600" />
                Engineering Thinking:
              </p>
              <div className="text-[13px] text-gray-800 italic">
                <MathRenderer content={step.hint} />
              </div>
            </div>
          )}

          {/* Formula if exists */}
          {step.formula && (
            <div className="p-6 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-100 border-4 border-purple-600 rounded-2xl shadow-xl formula-box">
              <p className="text-[16px] text-purple-900 font-black mb-5 flex items-center gap-2.5" style={{ fontWeight: 900 }}>
                <span className="text-3xl">📐</span> 
                <span className="uppercase tracking-widest">KEY FORMULA</span>
              </p>
              <div className="text-[24px] text-gray-900 font-extrabold bg-white p-7 rounded-2xl shadow-inner border-2 border-purple-300" style={{ fontWeight: 900 }}>
                <MathRenderer content={step.formula} />
              </div>
            </div>
          )}

          {/* Diagram description if exists */}
          {step.diagram && (
            <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg">
              <p className="text-[12px] text-green-900 font-bold mb-2 flex items-center gap-1">
                🎨 Visual Guide:
              </p>
              <div className="text-[13px] text-gray-800 leading-relaxed">
                <MathRenderer content={step.diagram} />
              </div>
            </div>
          )}

          {/* DALL-E Generated Diagram Image */}
          {step.diagramUrl && (
            <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-300 rounded-lg">
              <p className="text-[12px] text-purple-900 font-bold mb-2 flex items-center gap-1">
                🖼️ AI-Generated Diagram:
              </p>
              <div className="rounded-lg overflow-hidden border-2 border-purple-200 bg-white">
                <img 
                  src={step.diagramUrl} 
                  alt="AI-generated diagram for this step"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              {step.diagramGenerated && (
                <p className="text-[10px] text-purple-700 mt-1 italic">
                  Generated by DALL-E 3
                </p>
              )}
            </div>
          )}

          {/* Student Input Fields */}
          <div className="space-y-2">
            {/* Answer Input with Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] text-gray-900 font-medium">Your answer:</span>
                <input
                  type="text"
                  placeholder="Type your answer OR upload an image below"
                  value={stepAnswers[stepNum] || ''}
                  onChange={(e) => {
                    setStepAnswers({ ...stepAnswers, [stepNum]: e.target.value });
                    if (onInputChange) {
                      onInputChange(stepNum, e.target.value, stepExplanations[stepNum] || '');
                    }
                  }}
                  className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Answer Image Upload Button */}
              <div className="flex items-center gap-2 ml-[110px]">
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => (answerFileInputRefs.current[stepNum] = el)}
                  onChange={(e) => handleAnswerFileUpload(stepNum, e)}
                  className="hidden"
                />
                <button
                  onClick={() => answerFileInputRefs.current[stepNum]?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[11px] font-medium hover:bg-gray-50"
                >
                  <ImageIcon size={14} className="text-gray-600" />
                  <span>Upload answer</span>
                </button>
              </div>

              {/* Answer Image Preview */}
              {uploadedAnswerImages[stepNum] && (
                <div className="relative ml-[110px]">
                  <img
                    src={uploadedAnswerImages[stepNum]}
                    alt="Uploaded answer"
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={() => {
                      const newImages = { ...uploadedAnswerImages };
                      delete newImages[stepNum];
                      setUploadedAnswerImages(newImages);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-[11px] hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Explanation Input */}
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-[13px] text-gray-900 font-medium mt-2">Explain why your answer is correct:</span>
              <textarea
                placeholder="Explain why your answer is correct OR upload an image below"
                value={stepExplanations[stepNum] || ''}
                onChange={(e) => {
                  setStepExplanations({ ...stepExplanations, [stepNum]: e.target.value });
                  if (onInputChange) {
                    onInputChange(stepNum, stepAnswers[stepNum] || '', e.target.value);
                  }
                }}
                rows={3}
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-[13px] focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Explanation Image Preview */}
            {uploadedImages[stepNum] && (
              <div className="relative">
                <img
                  src={uploadedImages[stepNum]}
                  alt="Uploaded work"
                  className="max-w-full h-auto rounded-lg border border-gray-300"
                />
                <button
                  onClick={() => {
                    const newImages = { ...uploadedImages };
                    delete newImages[stepNum];
                    setUploadedImages(newImages);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-[11px] hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Upload Button and Submit */}
            <div className="flex gap-2 flex-wrap">
              <input
                type="file"
                accept="image/*"
                ref={(el) => (fileInputRefs.current[stepNum] = el)}
                onChange={(e) => handleFileUpload(stepNum, e)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRefs.current[stepNum]?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-[12px] font-medium hover:bg-gray-50"
              >
                <ImageIcon size={16} className="text-gray-600" />
                <span>Upload explanation picture</span>
              </button>
              <button
                onClick={() => handleSubmitStep(stepNum)}
                disabled={validating === stepNum}
                className={`px-6 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  validating === stepNum
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {validating === stepNum ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </span>
                ) : (
                  `Submit Step ${stepNum}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Divider between steps */}
        {index < (aiData?.steps.length || 0) - 1 && <hr className="my-4 border-gray-200" />}
      </div>
    );
  };

  return (
    <>
      {/* Top action icons */}
      <ScreenNavigation
        onInviteClick={onInviteClick}
        onHomeClick={onHomeClick}
        onArchiveClick={onArchiveClick}
        showHomeIcon={true}
      />

      {/* Header with back button */}
      <div className="h-[50px] flex items-center justify-between px-6 pt-2 border-b border-gray-200">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ArrowLeft size={20} strokeWidth={2} />
          <span className="text-[15px] font-medium">Back</span>
        </button>
        <span className="text-[15px] font-medium text-gray-900">Guided Solution</span>
        <div className="w-[80px]"></div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8 bg-gray-50">
        <div className="space-y-4">
          {/* Instructions Banner */}
          <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4 shadow-sm border-2 border-blue-400">
            <p className="text-[14px] text-blue-900 font-bold mb-2">
              📚 How to Use This Guided Solution
            </p>
            <ul className="text-[12px] text-blue-800 space-y-1">
              <li>🔢 <strong>Steps are revealed one at a time</strong> - complete each step correctly to unlock the next!</li>
              <li>✏️ <strong>Read each step carefully</strong> and think about the engineering thinking prompts</li>
              <li>✍️ <strong>Type your answer</strong> and <strong>explain your reasoning</strong> OR <strong>upload pictures</strong> of your work</li>
              <li>📸 <strong>You can submit text, images, or both!</strong> The AI will read handwritten work from images</li>
              <li>✅ <strong>Get both answer and explanation correct</strong> to proceed to the next step</li>
              <li>💬 Use the <strong>Co-learn</strong> button to chat with study partners</li>
            </ul>
          </div>
          
          {/* Self-Explanation Info Box */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 shadow-sm border-2 border-purple-400">
            <div className="flex items-start gap-3">
              <Lightbulb size={20} className="text-purple-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-purple-900 font-bold mb-1">
                  Engineering Thinking Prompts
                </p>
                <p className="text-[12px] text-purple-800">
                  Each step includes questions to develop your engineering thinking: assumptions, constraints, system behavior, and verification methods. Think like an engineer!
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded Diagram Display - IMPORTANT FOR STUDENTS TO REFERENCE */}
          {uploadedImageUrl && (
            <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
              <p className="text-[13px] text-blue-900 font-semibold mb-2 flex items-center gap-2">
                <ImageIcon size={16} />
                📐 Problem Diagram - Refer to this while working through the steps:
              </p>
              <div className="flex justify-center">
                <img
                  src={uploadedImageUrl}
                  alt="Problem diagram"
                  className="max-w-[400px] w-full h-auto rounded-lg border-2 border-blue-300 shadow-md"
                />
              </div>
            </div>
          )}

          {/* Problem Display */}
          <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
            <p className="text-[14px] text-green-900 mb-2">
              <span className="font-semibold">✓ Problem:</span> {userQuestion || "[Problem statement]"}
            </p>
          </div>

          {/* Interactive Steps */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h2 className="text-[16px] font-bold text-gray-900 mb-4">Guided Steps</h2>

            {/* Progress Indicator */}
            {aiData?.steps && aiData.steps.length > 0 && (
              <div className="mb-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-[13px] text-blue-900 font-semibold">
                  Progress: Step {currentStepIndex + 1} of {aiData.steps.length}
                </p>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / aiData.steps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* DEBUG INFO */}
            {console.log('🔍 InteractiveGuidedSolution - aiData:', aiData)}
            {console.log('🔍 InteractiveGuidedSolution - steps count:', aiData?.steps?.length || 0)}
            {console.log('🔍 InteractiveGuidedSolution - currentStepIndex:', currentStepIndex)}
            {console.log('🔍 InteractiveGuidedSolution - completedSteps:', Array.from(completedSteps))}

            {/* Render completed steps (collapsed) */}
            {aiData?.steps && aiData.steps.length > 0 && completedSteps.size > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-[12px] text-gray-600 font-medium mb-2">✅ Completed Steps:</p>
                {aiData.steps.map((step, index) => {
                  const stepNum = step.stepNumber || index + 1;
                  if (completedSteps.has(stepNum) && index < currentStepIndex) {
                    return (
                      <div key={stepNum} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-[13px] text-green-900 font-medium">
                            Step {stepNum}: {step.title}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}

            {/* Render current step only */}
            {aiData?.steps && aiData.steps.length > 0 ? (
              <>
                {aiData.steps[currentStepIndex] && (
                  <div>
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-2 mb-3">
                      <p className="text-[12px] text-yellow-900 font-bold text-center">
                        🎯 Current Step - Complete this to unlock the next step!
                      </p>
                    </div>
                    {renderStep(aiData.steps[currentStepIndex], currentStepIndex)}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[13px] text-gray-500 italic">No steps generated yet. Try asking a math question and click "Generate Guided Solution"!</p>
            )}
          </div>

          {/* Practice Button - shown only after all steps are completed */}
          {aiData?.steps && aiData.steps.length > 0 && completedSteps.size === aiData.steps.length && onPracticeClick && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 shadow-md border-2 border-purple-300">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-purple-900 mb-2">
                    🎯 Ready to Practice?
                  </h3>
                  <p className="text-[13px] text-gray-700 mb-3 leading-relaxed">
                    Test your understanding! Click below to attempt a similar problem on your own, without hints or guidance. 
                    This is your chance to apply what you've learned!
                  </p>
                  <button
                    onClick={onPracticeClick}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-[14px] hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center gap-2"
                  >
                    <span className="text-lg">🚀</span>
                    Attempt Independent Practice
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}