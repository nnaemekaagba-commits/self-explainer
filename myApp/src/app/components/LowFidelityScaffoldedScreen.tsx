interface LowFidelityScaffoldedScreenProps {
  onBack: () => void;
}

export function LowFidelityScaffoldedScreen({ onBack }: LowFidelityScaffoldedScreenProps) {
  return (
    <>
      {/* Top action icons - wireframe style */}
      <div className="flex justify-between items-center px-6 py-2">
        <div className="w-11 h-11 border-2 border-gray-400 rounded-full flex items-center justify-center">
          <span className="text-[10px] text-gray-600">User+</span>
        </div>
        <div className="w-11 h-11 border-2 border-gray-400 rounded-full flex items-center justify-center">
          <span className="text-[10px] text-gray-600">Arc</span>
        </div>
      </div>

      {/* Header with back button */}
      <div className="h-[50px] flex items-center justify-between px-6 pt-2 border-b-2 border-gray-300">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
          <span className="text-[15px]">← Back</span>
        </button>
        <span className="text-[15px] font-medium text-gray-700">Scaffolded Solution</span>
        <div className="w-16"></div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        <div className="space-y-4">
          <div className="border-2 border-gray-400 rounded-2xl p-4 bg-gray-50">
            <h3 className="text-[13px] font-semibold text-gray-700 mb-2 border-b border-gray-400 pb-1">YOUR PROBLEM</h3>
            <div className="bg-white border border-gray-300 rounded mb-3 p-2">
              <p className="text-[10px] text-gray-700">The problem you've entered will appear here. This is a step-by-step breakdown to help you learn.</p>
            </div>
            <p className="text-[11px] text-gray-700 mb-2 font-bold">CORRECT?</p>
            <div className="bg-white border-2 border-gray-400 rounded-xl p-2">
              <p className="text-[9px] text-gray-400 italic">Correct the problem statement</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-gray-700 border-b border-gray-400 pb-1">LEARNING STEPS</h3>

            {/* Step 1 */}
            <div className="border-2 border-gray-400 rounded-xl p-3 bg-white">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-green-500 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-[12px] text-green-600">✓</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-[12px] font-medium text-gray-700 mb-1">STEP 1: UNDERSTAND THE PROBLEM</h4>
                  <p className="text-[10px] text-gray-600">Break down what the question is asking and identify key concepts.</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-2 border-gray-400 rounded-xl p-3 bg-white">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-gray-400 rounded flex-shrink-0"></div>
                <div className="flex-1">
                  <h4 className="text-[12px] font-medium text-gray-700 mb-1">STEP 2: PLAN YOUR APPROACH</h4>
                  <p className="text-[10px] text-gray-600">Outline the steps you'll take to solve this problem.</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border-2 border-gray-400 rounded-xl p-3 bg-white">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-gray-400 rounded flex-shrink-0"></div>
                <div className="flex-1">
                  <h4 className="text-[12px] font-medium text-gray-700 mb-1">STEP 3: WORK THROUGH THE SOLUTION</h4>
                  <p className="text-[10px] text-gray-600">Follow guided hints and solve each part step by step.</p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border-2 border-gray-400 rounded-xl p-3 bg-white">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-gray-400 rounded flex-shrink-0"></div>
                <div className="flex-1">
                  <h4 className="text-[12px] font-medium text-gray-700 mb-1">STEP 4: REVIEW & PRACTICE</h4>
                  <p className="text-[10px] text-gray-600">Check your understanding with similar practice problems.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-[48px] border-2 border-gray-400 rounded-full flex items-center justify-center bg-gray-700 text-white cursor-pointer hover:bg-gray-800">
            <span className="text-[13px] font-bold">START LEARNING</span>
          </div>
        </div>
      </div>
    </>
  );
}
