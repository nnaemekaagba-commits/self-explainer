import { ArrowLeft, CheckCircle2, Edit3 } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { ScreenNavigation } from './ScreenNavigation';
import { useState } from 'react';

interface ScaffoldedSolutionScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  onStartLearning?: () => void;
  onCorrectQuestion?: () => void;
  onMarkAsCorrect?: () => void;
  aiData?: any;
  userQuestion?: string;
  uploadedImageUrl?: string | null;
}

export function ScaffoldedSolutionScreen({ onBack, onHomeClick, onArchiveClick, onInviteClick, onStartLearning, onCorrectQuestion, onMarkAsCorrect, aiData, userQuestion, uploadedImageUrl }: ScaffoldedSolutionScreenProps) {
  console.log('🖼️ ScaffoldedSolutionScreen - uploadedImageUrl:', uploadedImageUrl);
  console.log('📝 ScaffoldedSolutionScreen - userQuestion:', userQuestion);
  
  const [isQuestionConfirmed, setIsQuestionConfirmed] = useState(false);

  const handleMarkAsCorrect = () => {
    setIsQuestionConfirmed(true);
    if (onMarkAsCorrect) {
      onMarkAsCorrect();
    }
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
        <span className="text-[15px] font-medium text-gray-900">Solution Strategy</span>
        <div className="w-16"></div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h3 className="text-[15px] font-semibold text-blue-900 mb-2">Your Problem</h3>
            
            {/* Display uploaded image if available */}
            {uploadedImageUrl && (
              <div className="mb-3 flex justify-center">
                <img 
                  src={uploadedImageUrl} 
                  alt="Problem" 
                  className="max-w-[400px] w-full h-auto rounded-xl border border-blue-300 shadow-sm object-contain"
                />
              </div>
            )}
            
            {/* Display auto-generated diagram from AI */}
            {aiData?.diagram?.svg && (
              <div className="mb-4 bg-white border-2 border-blue-400 rounded-xl p-4 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <h4 className="text-[12px] font-semibold text-blue-900">
                    AI-Generated Diagram
                  </h4>
                </div>
                <div 
                  className="flex justify-center"
                  dangerouslySetInnerHTML={{ __html: aiData.diagram.svg }}
                />
                {aiData.diagram.description && (
                  <p className="text-[10px] text-gray-600 mt-2 text-center italic">
                    {aiData.diagram.description}
                  </p>
                )}
              </div>
            )}
            
            {/* Display AI-extracted question with diagram description */}
            <div className="text-[13px] text-blue-800 mb-3">
              {aiData?.extractedQuestion ? (
                <MathRenderer content={aiData.extractedQuestion} />
              ) : userQuestion ? (
                <MathRenderer content={userQuestion} />
              ) : (
                'No question provided'
              )}
            </div>
            
            {/* Show info if diagram was analyzed */}
            {uploadedImageUrl && aiData?.extractedQuestion && (
              <div className="bg-white/50 rounded-lg p-2 mb-3">
                <p className="text-[11px] text-blue-700 font-medium">
                  ✓ Diagram analyzed and description included above
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={onCorrectQuestion}
                className="px-4 py-2 bg-blue-600 text-white text-[13px] font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit3 size={14} />
                <span>Correct Question</span>
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

          {isQuestionConfirmed && (
            <>
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-gray-900">Learning Steps</h3>

                {aiData?.strategy && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
                    <p className="text-[13px] text-blue-900 font-medium mb-1">🎯 Strategy</p>
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