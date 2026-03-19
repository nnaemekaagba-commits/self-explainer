import { ArrowLeft, CheckCircle2, Send, Lightbulb, Trophy, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MathRenderer } from './MathRenderer';
import { ScreenNavigation } from './ScreenNavigation';
import { generateSimilarQuestion, validatePracticeAnswer } from '../../services/aiService';
import { FlippingBookLoader } from './FlippingBookLoader';

interface Step {
  stepNumber: number;
  title: string;
  description: string;
  expectedAnswer?: string;
}

interface PracticeQuestion {
  question: string;
  steps: Step[];
  fullSolution?: string;
}

interface IndependentPracticeScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  originalQuestion?: string;
  originalAIData?: any;
  learningThreadId?: string;
}

export function IndependentPracticeScreen({
  onBack,
  onHomeClick,
  onArchiveClick,
  onInviteClick,
  originalQuestion,
  originalAIData,
  learningThreadId,
}: IndependentPracticeScreenProps) {
  const [practiceQuestion, setPracticeQuestion] = useState<PracticeQuestion | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepAnswers, setStepAnswers] = useState<Record<number, string>>({});
  const [stepExplanations, setStepExplanations] = useState<Record<number, string>>({});
  const [submittedSteps, setSubmittedSteps] = useState<Set<number>>(new Set());
  const [stepResults, setStepResults] = useState<Record<number, { answerCorrect: boolean; explanationCorrect: boolean; answerFeedback: string; explanationFeedback: string }>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [allStepsCompleted, setAllStepsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Generate similar question on mount
  useEffect(() => {
    const generateQuestion = async () => {
      setIsGenerating(true);
      try {
        console.log('🎯 Generating similar practice question...');
        console.log('📝 Original question:', originalQuestion);
        console.log('📊 Original AI data:', originalAIData);
        const result = await generateSimilarQuestion(originalQuestion || '', originalAIData);
        console.log('✅ Practice question generated:', result);
        setPracticeQuestion(result);
      } catch (error) {
        console.error('❌ Error generating practice question:', error);
        console.error('❌ Error message:', error?.message);
        console.error('❌ Error stack:', error?.stack);
        console.error('❌ Error type:', typeof error);
        console.error('❌ Error name:', error?.name);
        
        // Provide a demo practice problem as fallback
        setPracticeQuestion({
          question: `📝 Demo Practice Problem: Solve for x: \\(3x + 7 = 22\\)\n\n(Note: Unable to generate a custom practice problem based on your original question. This is a demo problem to let you practice the interface.)`,
          steps: [
            {
              stepNumber: 1,
              title: 'Isolate the variable term',
              description: 'Subtract 7 from both sides to isolate the term with x',
              expectedAnswer: '3x = 15'
            },
            {
              stepNumber: 2,
              title: 'Solve for x',
              description: 'Divide both sides by 3 to find the value of x',
              expectedAnswer: 'x = 5'
            }
          ],
        });
      } finally {
        setIsGenerating(false);
      }
    };

    generateQuestion();
  }, [originalQuestion, originalAIData]);

  const handleSubmitStep = async (stepNumber: number) => {
    const answer = stepAnswers[stepNumber];
    const explanation = stepExplanations[stepNumber];
    
    if (!answer || !answer.trim()) {
      alert('Please provide your answer before submitting!');
      return;
    }

    if (!practiceQuestion?.steps) return;

    const step = practiceQuestion.steps.find(s => s.stepNumber === stepNumber);
    if (!step) return;

    setIsValidating(true);

    try {
      console.log('🔍 Validating step:', stepNumber, 'Answer:', answer, 'Explanation:', explanation);
      
      // Validate the answer
      const result = await validatePracticeAnswer(
        practiceQuestion.question,
        step,
        answer,
        explanation
      );
      
      console.log('✅ Validation result:', result);

      // Store the result
      setStepResults(prev => ({
        ...prev,
        [stepNumber]: {
          answerCorrect: result.answerCorrect,
          explanationCorrect: result.explanationCorrect,
          answerFeedback: result.answerFeedback,
          explanationFeedback: result.explanationFeedback,
        },
      }));

      // Mark as submitted
      setSubmittedSteps(prev => new Set([...prev, stepNumber]));

      // Check if all steps are completed and correct
      const allSubmitted = practiceQuestion.steps.every(s => 
        submittedSteps.has(s.stepNumber) || s.stepNumber === stepNumber
      );
      
      if (allSubmitted) {
        const allCorrect = practiceQuestion.steps.every(s => {
          if (s.stepNumber === stepNumber) return result.answerCorrect && result.explanationCorrect;
          return stepResults[s.stepNumber]?.answerCorrect && stepResults[s.stepNumber]?.explanationCorrect;
        });

        if (allCorrect) {
          setAllStepsCompleted(true);
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      }

    } catch (error) {
      console.error('❌ Error validating answer:', error);
      alert('Error validating your answer. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const getStepStatus = (stepNumber: number): 'pending' | 'correct' | 'incorrect' => {
    if (!submittedSteps.has(stepNumber)) return 'pending';
    return stepResults[stepNumber]?.answerCorrect && stepResults[stepNumber]?.explanationCorrect ? 'correct' : 'incorrect';
  };

  if (isGenerating) {
    return (
      <div className="h-full bg-white flex flex-col">
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
          <span className="text-[15px] font-medium text-gray-900">Practice Attempt</span>
          <div className="w-16"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <FlippingBookLoader />
          <p className="text-[15px] text-gray-600 mt-6 text-center">
            Generating a similar practice question for you...
          </p>
          <p className="text-[13px] text-gray-500 mt-2 text-center">
            This will help you apply what you've learned!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md mx-4 text-center animate-scale-in">
            <div className="mb-4">
              <Trophy size={64} className="text-yellow-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Excellent Work! 🎉
            </h2>
            <p className="text-gray-600">
              You've successfully completed all steps independently!
            </p>
          </div>
        </div>
      )}

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
        <span className="text-[15px] font-medium text-gray-900">Practice Attempt</span>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        <div className="space-y-5">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5">
            <h3 className="text-[15px] font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Lightbulb size={20} className="text-purple-600" />
              Independent Practice Challenge
            </h3>
            <p className="text-[13px] text-gray-700 leading-relaxed">
              Now it's your turn! Try to solve this similar problem step-by-step on your own. 
              No hints this time - apply what you learned from the guided solution!
            </p>
          </div>

          {/* Practice Question */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <h3 className="text-[14px] font-semibold text-blue-900 mb-3">Your Practice Problem:</h3>
            <div className="text-[14px] text-gray-800 leading-relaxed">
              <MathRenderer content={practiceQuestion?.question || ''} />
            </div>
          </div>

          {/* Progress Indicator */}
          {practiceQuestion && practiceQuestion.steps && practiceQuestion.steps.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-gray-700">Your Progress</span>
                <span className="text-[13px] text-gray-600">
                  {submittedSteps.size} / {practiceQuestion.steps.length} steps
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(submittedSteps.size / practiceQuestion.steps.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-4">
            <h3 className="text-[15px] font-semibold text-gray-900">Solve Each Step:</h3>

            {practiceQuestion?.steps && practiceQuestion.steps.map((step, index) => {
              const status = getStepStatus(step.stepNumber);
              const isSubmitted = submittedSteps.has(step.stepNumber);

              return (
                <div
                  key={step.stepNumber}
                  className={`border rounded-xl shadow-sm transition-all ${
                    status === 'correct'
                      ? 'bg-green-50 border-green-300'
                      : status === 'incorrect'
                      ? 'bg-red-50 border-red-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      {status === 'correct' ? (
                        <CheckCircle2 size={24} className="text-green-600 mt-0.5 flex-shrink-0" />
                      ) : status === 'incorrect' ? (
                        <XCircle size={24} className="text-red-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-purple-500 flex items-center justify-center mt-0.5 flex-shrink-0 bg-purple-50">
                          <span className="text-[11px] font-bold text-purple-600">{index + 1}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-[14px] font-semibold text-gray-900 mb-2">
                          Step {step.stepNumber}: {step.title}
                        </h4>
                        <div className="text-[13px] text-gray-700 mb-3">
                          <MathRenderer content={step.description} />
                        </div>

                        {/* Answer input */}
                        {!isSubmitted && (
                          <div className="space-y-3">
                            <textarea
                              value={stepAnswers[step.stepNumber] || ''}
                              onChange={(e) =>
                                setStepAnswers(prev => ({
                                  ...prev,
                                  [step.stepNumber]: e.target.value,
                                }))
                              }
                              placeholder="Type your answer here... (Use LaTeX for math: $x^2$, $\frac{1}{2}$, etc.)"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              rows={3}
                              disabled={isValidating}
                            />
                            <textarea
                              value={stepExplanations[step.stepNumber] || ''}
                              onChange={(e) =>
                                setStepExplanations(prev => ({
                                  ...prev,
                                  [step.stepNumber]: e.target.value,
                                }))
                              }
                              placeholder="Explain your answer here..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              rows={3}
                              disabled={isValidating}
                            />
                            <button
                              onClick={() => handleSubmitStep(step.stepNumber)}
                              disabled={isValidating || !stepAnswers[step.stepNumber]?.trim()}
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium text-[14px] hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            >
                              {isValidating ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <Send size={16} />
                                  Submit Answer
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Feedback */}
                        {isSubmitted && stepResults[step.stepNumber] && (
                          <div
                            className={`mt-3 p-4 rounded-lg ${
                              status === 'correct'
                                ? 'bg-green-100 border border-green-300'
                                : 'bg-red-100 border border-red-300'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {status === 'correct' ? (
                                <CheckCircle2 size={18} className="text-green-700 mt-0.5 flex-shrink-0" />
                              ) : (
                                <XCircle size={18} className="text-red-700 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p
                                  className={`text-[13px] font-medium mb-1 ${
                                    status === 'correct' ? 'text-green-900' : 'text-red-900'
                                  }`}
                                >
                                  {status === 'correct' ? 'Correct!' : 'Not quite right'}
                                </p>
                                <div
                                  className={`text-[13px] ${
                                    status === 'correct' ? 'text-green-800' : 'text-red-800'
                                  }`}
                                >
                                  <MathRenderer content={stepResults[step.stepNumber].answerFeedback} />
                                </div>
                                <div
                                  className={`text-[13px] ${
                                    status === 'correct' ? 'text-green-800' : 'text-red-800'
                                  }`}
                                >
                                  <MathRenderer content={stepResults[step.stepNumber].explanationFeedback} />
                                </div>
                              </div>
                            </div>

                            {/* Show student's answer */}
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <p className="text-[12px] font-medium text-gray-700 mb-1">Your answer:</p>
                              <div className="text-[13px] text-gray-800 bg-white p-2 rounded">
                                <MathRenderer content={stepAnswers[step.stepNumber]} />
                              </div>
                            </div>
                            
                            {/* Show student's explanation if provided */}
                            {stepExplanations[step.stepNumber] && (
                              <div className="mt-2">
                                <p className="text-[12px] font-medium text-gray-700 mb-1">Your explanation:</p>
                                <div className="text-[13px] text-gray-800 bg-white p-2 rounded">
                                  <MathRenderer content={stepExplanations[step.stepNumber]} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion message */}
          {allStepsCompleted && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <Trophy size={48} className="text-yellow-500 flex-shrink-0" />
                <div>
                  <h3 className="text-[16px] font-bold text-green-900 mb-2">
                    Congratulations! 🎉
                  </h3>
                  <p className="text-[14px] text-green-800 leading-relaxed">
                    You've successfully solved all steps independently! You're really getting the hang of this. 
                    Keep practicing to strengthen your problem-solving skills!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
