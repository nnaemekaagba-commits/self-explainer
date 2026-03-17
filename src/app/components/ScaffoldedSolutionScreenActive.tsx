import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { MathRenderer } from './MathRenderer';
import { ScreenNavigation } from './ScreenNavigation';

interface ScaffoldedSolutionScreenActiveProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  onStartLearning?: () => void;
  aiData?: any;
  userQuestion?: string;
}

export function ScaffoldedSolutionScreenActive({ onBack, onHomeClick, onArchiveClick, onInviteClick, onStartLearning, aiData, userQuestion }: ScaffoldedSolutionScreenActiveProps) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev =>
      prev.includes(stepNumber)
        ? prev.filter(s => s !== stepNumber)
        : [...prev, stepNumber]
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
        <span className="text-[15px] font-medium text-gray-900">Solution Strategy</span>
        <div className="w-16"></div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        <div className="space-y-4">
          {/* Problem Verification - Verified State */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <h3 className="text-[15px] font-semibold text-green-900 mb-2">✓ Problem Verified</h3>
            <div className="text-[13px] text-green-800 mb-2">
              {userQuestion ? (
                <MathRenderer content={userQuestion} />
              ) : (
                "The problem you've entered will appear here. This is a step-by-step breakdown to help you learn."
              )}
            </div>
            <p className="text-[12px] text-green-700">
              Problem statement confirmed. You can now begin the learning steps below.
            </p>
          </div>

          {/* Learning Steps - Active State */}
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
              <div key={index} className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <button
                  onClick={() => toggleStep(index + 1)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {index === 0 ? (
                    <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 mt-0.5 flex-shrink-0 bg-blue-50"></div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-[14px] font-medium text-gray-900 mb-1">
                      Step {index + 1}: {step.title}
                    </h4>
                    <div className="text-[13px] text-gray-600">
                      <MathRenderer content={step.description} />
                    </div>
                  </div>
                  {expandedSteps.includes(index + 1) ? (
                    <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedSteps.includes(index + 1) && (
                  <div className="px-4 pb-4 pt-0 ml-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-[12px] text-blue-900 font-medium mb-2">📝 Details:</p>
                      <div className="text-[12px] text-blue-800">
                        <MathRenderer content={step.description} />
                      </div>
                      {step.hint && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded">
                          <p className="text-[11px] text-yellow-700 font-medium mb-1">💡 Hint:</p>
                          <div className="text-[12px] text-gray-700">
                            <MathRenderer content={step.hint} />
                          </div>
                        </div>
                      )}
                      {step.formula && (
                        <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-300 shadow-sm">
                          <p className="text-[13px] text-purple-900 font-black mb-2 flex items-center gap-1" style={{ fontWeight: 900 }}>
                            <span>📐</span> Key Formula:
                          </p>
                          <div className="text-[17px] font-bold" style={{ fontWeight: 800 }}>
                            <MathRenderer content={step.formula} />
                          </div>
                        </div>
                      )}
                      {step.diagram && (
                        <div className="mt-2 p-2 bg-green-50 rounded border border-green-300">
                          <p className="text-[10px] text-green-900 font-bold mb-1">🎨 Visual Guide:</p>
                          <div className="text-[11px] text-gray-700">
                            <MathRenderer content={step.diagram} />
                          </div>
                        </div>
                      )}
                      
                      {/* DALL-E Generated Diagram Image */}
                      {step.diagramUrl && (
                        <div className="mt-2 p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded border-2 border-purple-300">
                          <p className="text-[10px] text-purple-900 font-bold mb-1">🖼️ AI-Generated Diagram:</p>
                          <div className="rounded overflow-hidden border border-purple-200 bg-white">
                            <img 
                              src={step.diagramUrl} 
                              alt="AI-generated diagram"
                              className="w-full h-auto"
                              loading="lazy"
                            />
                          </div>
                          {step.diagramGenerated && (
                            <p className="text-[9px] text-purple-700 mt-1 italic">
                              Generated by DALL-E 3
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )) || (
              <>
                {/* Step 1 - Default fallback */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <button
                    onClick={() => toggleStep(1)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <CheckCircle2 size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-[14px] font-medium text-gray-900 mb-1">Step 1: Understand the Problem</h4>
                      <p className="text-[13px] text-gray-600">
                        Break down what the question is asking and identify key concepts.
                      </p>
                    </div>
                    {expandedSteps.includes(1) ? (
                      <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedSteps.includes(1) && (
                    <div className="px-4 pb-4 pt-0 ml-8">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-[12px] text-blue-900 font-medium mb-2">What you'll do in this step:</p>
                        <ul className="text-[12px] text-blue-800 space-y-1 list-disc list-inside">
                          <li>Read and analyze the problem statement carefully</li>
                          <li>Identify what information is given</li>
                          <li>Determine what you need to find or solve for</li>
                          <li>Note any constraints or special conditions</li>
                          <li>Clarify any terms or concepts you're unsure about</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2 - Default fallback */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <button
                    onClick={() => toggleStep(2)}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 mt-0.5 flex-shrink-0 bg-blue-50"></div>
                    <div className="flex-1">
                      <h4 className="text-[14px] font-medium text-gray-900 mb-1">Step 2: Plan Your Approach</h4>
                      <p className="text-[13px] text-gray-600">
                        Outline the steps you'll take to solve this problem.
                      </p>
                    </div>
                    {expandedSteps.includes(2) ? (
                      <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedSteps.includes(2) && (
                    <div className="px-4 pb-4 pt-0 ml-8">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-[12px] text-blue-900 font-medium mb-2">What you'll do in this step:</p>
                        <ul className="text-[12px] text-blue-800 space-y-1 list-disc list-inside">
                          <li>Decide which method or formula to use</li>
                          <li>Break the problem into smaller, manageable parts</li>
                          <li>Determine the order of operations needed</li>
                          <li>Consider alternative approaches if needed</li>
                          <li>Sketch diagrams or write out your plan</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

            {/* Step 3 - Default fallback */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <button
                onClick={() => toggleStep(3)}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 mt-0.5 flex-shrink-0 bg-blue-50"></div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-gray-900 mb-1">Step 3: Work Through the Solution</h4>
                  <p className="text-[13px] text-gray-600">
                    Follow guided hints and solve each part step by step.
                  </p>
                </div>
                {expandedSteps.includes(3) ? (
                  <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              {expandedSteps.includes(3) && (
                <div className="px-4 pb-4 pt-0 ml-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-[12px] text-blue-900 font-medium mb-2">What you'll do in this step:</p>
                    <ul className="text-[12px] text-blue-800 space-y-1 list-disc list-inside">
                      <li>Execute your plan step by step</li>
                      <li>Show all your work and calculations</li>
                      <li>Use AI hints when you get stuck</li>
                      <li>Check intermediate results as you go</li>
                      <li>Adjust your approach if something isn't working</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <button
                onClick={() => toggleStep(4)}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 mt-0.5 flex-shrink-0 bg-blue-50"></div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-gray-900 mb-1">Step 4: Review & Practice</h4>
                  <p className="text-[13px] text-gray-600">
                    Check your understanding with similar practice problems.
                  </p>
                </div>
                {expandedSteps.includes(4) ? (
                  <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              {expandedSteps.includes(4) && (
                <div className="px-4 pb-4 pt-0 ml-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-[12px] text-blue-900 font-medium mb-2">What you'll do in this step:</p>
                    <ul className="text-[12px] text-blue-800 space-y-1 list-disc list-inside">
                      <li>Verify your answer makes sense</li>
                      <li>Check units and significant figures</li>
                      <li>Compare with the original question to ensure you answered what was asked</li>
                      <li>Try similar practice problems to reinforce learning</li>
                      <li>Reflect on what you learned and any mistakes made</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
              </>
            )}
          </div>

          {/* Active "Start Learning" Button */}
          <button
            onClick={onStartLearning}
            className="w-full mt-4 h-[48px] bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-full font-medium text-[15px] shadow-md hover:shadow-lg active:shadow-inner transition-all"
          >
            Start Learning
          </button>
        </div>
      </div>
    </>
  );
}