import { ArrowLeft, CheckCircle2, Edit3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MathRenderer } from './MathRenderer';
import { ScreenNavigation } from './ScreenNavigation';

interface ScaffoldedSolutionScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  onStartLearning?: () => void;
  onSubmitCorrection?: (correctedQuestion: string) => void;
  onMarkAsCorrect?: () => void;
  aiData?: any;
  userQuestion?: string;
  uploadedImageUrl?: string | null;
}

export function ScaffoldedSolutionScreen({
  onBack,
  onHomeClick,
  onArchiveClick,
  onInviteClick,
  onStartLearning,
  onSubmitCorrection,
  onMarkAsCorrect,
  aiData,
  userQuestion,
  uploadedImageUrl,
}: ScaffoldedSolutionScreenProps) {
  const [isQuestionConfirmed, setIsQuestionConfirmed] = useState(false);
  const currentQuestionText = aiData?.extractedQuestion || userQuestion || '';
  const [correctionText, setCorrectionText] = useState(currentQuestionText);

  useEffect(() => {
    setCorrectionText(currentQuestionText);
  }, [currentQuestionText]);

  const handleMarkAsCorrect = () => {
    setIsQuestionConfirmed(true);
    onMarkAsCorrect?.();
  };

  const handleSubmitCorrection = () => {
    const trimmedCorrection = correctionText.trim();
    if (!trimmedCorrection) return;

    setIsQuestionConfirmed(false);
    onSubmitCorrection?.(trimmedCorrection);
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
        <span className="text-[15px] font-medium text-gray-900">Solution Strategy</span>
        <div className="w-16"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h3 className="text-[15px] font-semibold text-blue-900 mb-2">Your Problem</h3>

            {uploadedImageUrl && (
              <div className="mb-3 flex justify-center">
                <img
                  src={uploadedImageUrl}
                  alt="Problem"
                  className="max-w-[400px] w-full h-auto rounded-xl border border-blue-300 shadow-sm object-contain"
                />
              </div>
            )}

            {aiData?.diagram?.svg && (
              <div className="mb-4 bg-white border-2 border-blue-400 rounded-xl p-4 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <h4 className="text-[12px] font-semibold text-blue-900">AI-Generated Diagram Hint</h4>
                </div>
                <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: aiData.diagram.svg }} />
                {aiData.diagram.description && (
                  <p className="text-[10px] text-gray-600 mt-2 text-center italic">
                    Visual hint only: use the diagram to orient yourself without treating it as a full solution.
                  </p>
                )}
              </div>
            )}

            <div className="text-[13px] text-blue-800 mb-3">
              {currentQuestionText ? <MathRenderer content={currentQuestionText} /> : 'No question provided'}
            </div>

            {uploadedImageUrl && aiData?.extractedQuestion && (
              <div className="bg-white/50 rounded-lg p-2 mb-3">
                <p className="text-[11px] text-blue-700 font-medium">
                  Diagram analyzed and converted into a visual hint above
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-blue-900 mb-2">
                  Correction Field
                </label>
                <textarea
                  value={correctionText}
                  onChange={(event) => setCorrectionText(event.target.value)}
                  placeholder="Type any corrections to the problem here."
                  className="w-full min-h-[110px] rounded-xl border border-blue-300 bg-white px-4 py-3 text-[13px] text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-2 text-[11px] text-blue-700">
                  Edit the problem here, then update it so the system regenerates the strategy from your correction.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmitCorrection}
                  disabled={!correctionText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-[13px] font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit3 size={14} />
                  <span>Update Question</span>
                </button>
                <button
                  onClick={() => setCorrectionText(currentQuestionText)}
                  className="px-4 py-2 bg-white text-blue-700 text-[13px] font-medium rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleMarkAsCorrect}
                  className="px-4 py-2 bg-green-600 text-white text-[13px] font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  <span>Correct</span>
                </button>
              </div>
            </div>
          </div>

          {isQuestionConfirmed && (
            <>
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-gray-900">Learning Steps</h3>

                {aiData?.strategy && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
                    <p className="text-[13px] text-blue-900 font-medium mb-1">Strategy</p>
                    <div className="text-[13px] text-gray-700">
                      <MathRenderer content={aiData.strategy} />
                    </div>
                  </div>
                )}

                {aiData?.steps?.map((step: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      {index === 0 ? (
                        <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0"></div>
                      )}
                      <div>
                        <h4 className="text-[14px] font-medium text-gray-900 mb-1">
                          Step {index + 1}: {step.title}
                        </h4>
                        <div className="text-[13px] text-gray-600">
                          <MathRenderer content={step.description} />
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-[14px] font-medium text-gray-900 mb-1">Step 1: Understand the Problem</h4>
                          <p className="text-[13px] text-gray-600">
                            Break down what the question is asking and identify key concepts.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-[14px] font-medium text-gray-900 mb-1">Step 2: Plan Your Approach</h4>
                          <p className="text-[13px] text-gray-600">
                            Outline the steps you'll take to solve this problem.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0"></div>
                        <div>
                          <h4 className="text-[14px] font-medium text-gray-900 mb-1">Step 3: Work Through the Solution</h4>
                          <p className="text-[13px] text-gray-600">
                            Follow guided hints and solve each part step by step.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-[14px] font-medium text-gray-900 mb-1">Step 4: Review & Practice</h4>
                      <p className="text-[13px] text-gray-600">
                        Check your understanding with similar practice problems.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={onStartLearning}
                className="w-full mt-4 h-[48px] bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-full font-medium text-[15px] shadow-md hover:shadow-lg active:shadow-inner transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Learning
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
