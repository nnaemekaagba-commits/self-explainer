import { ArrowLeft } from 'lucide-react';

interface LowFidelityFeedbackScreenProps {
  onBack: () => void;
  answerCorrect?: boolean;
  explanationCorrect?: boolean;
}

export const LowFidelityFeedbackScreen = ({
  onBack,
  answerCorrect = true,
  explanationCorrect = true
}: LowFidelityFeedbackScreenProps) => {
  const allCorrect = answerCorrect && explanationCorrect;
  const allWrong = !answerCorrect && !explanationCorrect;

  return (
    <div className="flex-1 flex flex-col bg-white border-2 border-gray-400">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-400">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={20} className="text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-[14px] font-bold text-gray-800">STEP FEEDBACK</h1>
        <div className="w-6"></div>
      </div>

      {/* Step Info */}
      <div className="px-4 py-2 bg-gray-100 border-b-2 border-gray-400">
        <p className="text-[11px] font-bold text-gray-800">
          STEP 2: PLAN YOUR APPROACH
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-3">
          <div className={`w-12 h-12 border-2 ${
            allCorrect ? 'border-green-600' : allWrong ? 'border-red-600' : 'border-yellow-600'
          } rounded-full flex items-center justify-center mb-2`}>
            {allCorrect ? (
              <span className="text-[20px]">✓</span>
            ) : allWrong ? (
              <span className="text-[20px]">✗</span>
            ) : (
              <span className="text-[16px]">✓✗</span>
            )}
          </div>
          <h2 className="text-[13px] font-bold mb-1">
            {allCorrect ? 'GREAT JOB!' : allWrong ? 'NOT QUITE RIGHT' : 'ALMOST THERE!'}
          </h2>
          <p className="text-[10px] text-gray-600 leading-tight">
            {allCorrect
              ? "Ready to move to next step."
              : allWrong
              ? "Your answer needs adjustments."
              : answerCorrect
              ? "Answer correct, explanation needs work."
              : "Explanation correct, check answer."
            }
          </p>
        </div>

        {/* Answer Section */}
        <div className={`border-2 ${
          answerCorrect ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'
        } rounded p-2 mb-2`}>
          <p className="text-[9px] font-bold mb-1">
            YOUR ANSWER {answerCorrect ? '(CORRECT)' : '(INCORRECT)'}
          </p>
          <p className="text-[11px] font-bold mb-1">
            {answerCorrect ? 'x = 5' : 'x = 3'}
          </p>
          {!answerCorrect && (
            <div className="border-2 border-orange-400 rounded p-1.5 bg-white mt-1">
              <p className="text-[9px] font-bold mb-0.5">⚠️ FEEDBACK</p>
              <p className="text-[9px] text-gray-700 leading-tight">
                {explanationCorrect
                  ? "Check calculations."
                  : "Order of operations matters."
                }
              </p>
            </div>
          )}
        </div>

        {/* Explanation Section */}
        <div className={`border-2 ${
          explanationCorrect ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'
        } rounded p-2 mb-2`}>
          <p className="text-[9px] font-bold mb-1">
            YOUR EXPLANATION {explanationCorrect ? '(CORRECT)' : '(NEEDS WORK)'}
          </p>
          <p className="text-[9px] text-gray-700 leading-tight mb-1">
            {explanationCorrect
              ? "Used quadratic formula correctly."
              : "Divided both sides by 2 first."
            }
          </p>
          {!explanationCorrect && (
            <div className="border-2 border-orange-400 rounded p-1.5 bg-white mt-1">
              <p className="text-[9px] font-bold mb-0.5">⚠️ FEEDBACK</p>
              <p className="text-[9px] text-gray-700 leading-tight">
                {answerCorrect
                  ? "Steps don't match."
                  : "Review approach."
                }
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {allCorrect ? (
          <>
            <button className="w-full border-2 border-gray-400 rounded py-2 text-[11px] font-bold mb-1.5 hover:bg-gray-50">
              CONTINUE TO NEXT STEP
            </button>
            <button className="w-full border-2 border-gray-400 rounded py-2 text-[11px] font-bold mb-2 hover:bg-gray-50">
              VIEW CO-LEARNERS' EXPLANATIONS
            </button>
            <div className="border-2 border-gray-400 rounded p-2 bg-gray-50">
              <p className="text-[9px] font-bold mb-0.5">💡 TIP</p>
              <p className="text-[9px] text-gray-700 leading-tight">
                Check co-learn to see how peers approached this!
              </p>
            </div>
          </>
        ) : (
          <>
            {!allCorrect && (
              <div className="border-2 border-gray-400 rounded p-2 mb-2 bg-gray-50">
                <p className="text-[10px] font-bold mb-1">💡 NEED A HINT?</p>
                <p className="text-[9px] text-gray-600 mb-1.5 leading-tight">
                  Get a helpful hint to guide you.
                </p>
                <button className="w-full border-2 border-gray-400 rounded py-1.5 text-[10px] font-bold hover:bg-gray-100">
                  GET HINT
                </button>
              </div>
            )}
            <button className="w-full border-2 border-gray-400 rounded py-2 text-[11px] font-bold mb-1.5 hover:bg-gray-50">
              {!answerCorrect && !explanationCorrect
                ? 'TRY AGAIN'
                : !answerCorrect
                ? 'RECALCULATE ANSWER'
                : 'REVISE EXPLANATION'}
            </button>
            <button className="w-full border-2 border-gray-400 rounded py-2 text-[11px] font-bold hover:bg-gray-50">
              VIEW CO-LEARNERS' EXPLANATIONS
            </button>
          </>
        )}
      </div>
    </div>
  );
};
