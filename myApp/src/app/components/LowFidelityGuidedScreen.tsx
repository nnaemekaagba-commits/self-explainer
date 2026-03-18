import { ArrowLeft, UserPlus, Archive } from 'lucide-react';

interface LowFidelityGuidedScreenProps {
  onBack: () => void;
}

export const LowFidelityGuidedScreen = ({ onBack }: LowFidelityGuidedScreenProps) => {
  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-300">
        <div className="w-6 h-6 border-2 border-gray-400"></div>
        <span className="text-[14px] font-bold text-gray-700">Guided solution</span>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-400"></div>
          <div className="w-5 h-5 border-2 border-gray-400"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-8 space-y-4">
        {/* Problem Section */}
        <div className="border-2 border-gray-300 rounded-lg p-3">
          <p className="text-[11px] font-bold text-gray-700 mb-2">VERIFY THE QUESTION</p>
          <p className="text-[10px] text-gray-600 mb-1">
            Solve for x: 2x + 3 = 13
          </p>
          <p className="text-[9px] text-gray-500 mb-2">Not correct? Correct the problem statement below.</p>
          <div className="border-2 border-gray-300 rounded p-2">
            <p className="text-[9px] text-gray-400 italic">[Enter correction here]</p>
          </div>
        </div>

        {/* Solution Steps */}
        <div className="border-2 border-gray-300 rounded-lg p-3">
          <p className="text-[11px] font-bold text-gray-700 mb-3">GUIDED SOLUTION</p>

          {/* Step 1 */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-gray-700 mb-2">STEP 1: UNDERSTAND THE PROBLEM</p>
            <div className="ml-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[10px]">✓</span>
                <p className="text-[9px] text-gray-600">Read problem carefully and identify key information</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px]">✓</span>
                <p className="text-[9px] text-gray-600">Determine what you need to find</p>
              </div>
              <div className="border-2 border-blue-300 bg-blue-50 rounded p-2 mt-2">
                <p className="text-[9px] text-blue-600 font-bold mb-1">✨ AI ANALYSIS:</p>
                <p className="text-[9px] text-gray-700">Key variables identified</p>
              </div>
              <input
                type="text"
                placeholder="Explain in your own words"
                className="w-full border-2 border-gray-300 rounded p-2 text-[9px]"
              />
              <button className="border-2 border-gray-400 rounded px-3 py-1 text-[9px] font-bold">
                UPLOAD IMAGE
              </button>
              <button className="border-2 border-gray-400 rounded px-4 py-1.5 text-[10px] font-bold">
                SUBMIT
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-gray-700 mb-2">STEP 2: PLAN YOUR APPROACH</p>
            <div className="ml-4 space-y-2">
              <div className="border-2 border-blue-300 bg-blue-50 rounded p-2">
                <p className="text-[9px] text-blue-600 font-bold mb-1">✨ AI SUGGESTED APPROACH:</p>
                <p className="text-[9px] text-gray-700">Break into smaller parts and solve sequentially</p>
              </div>
              <div className="flex gap-2">
                <input className="border-2 border-gray-300 rounded w-20 p-1 text-[9px]" placeholder="answer" />
                <input className="border-2 border-gray-300 rounded flex-1 p-1 text-[9px]" placeholder="Explain why" />
              </div>
              <button className="border-2 border-gray-400 rounded px-3 py-1 text-[9px] font-bold">
                UPLOAD IMAGE
              </button>
              <button className="border-2 border-gray-400 rounded px-4 py-1.5 text-[10px] font-bold">
                SUBMIT
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-4">
            <p className="text-[10px] font-bold text-gray-700 mb-2">STEP 3: EXECUTE SOLUTION</p>
            <div className="ml-4 space-y-2">
              <div className="border-2 border-blue-300 bg-blue-50 rounded p-2">
                <p className="text-[9px] text-blue-600 font-bold mb-1">✨ AI STARTED THE WORK:</p>
                <p className="text-[9px] text-gray-700">First step completed</p>
              </div>
              <div className="flex gap-2">
                <input className="border-2 border-gray-300 rounded w-20 p-1 text-[9px]" placeholder="answer" />
                <input className="border-2 border-gray-300 rounded flex-1 p-1 text-[9px]" placeholder="Explain calculation" />
              </div>
              <button className="border-2 border-gray-400 rounded px-3 py-1 text-[9px] font-bold">
                UPLOAD IMAGE
              </button>
              <button className="border-2 border-gray-400 rounded px-4 py-1.5 text-[10px] font-bold">
                SUBMIT
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div>
            <p className="text-[10px] font-bold text-gray-700 mb-2">STEP 4: REVIEW AND VERIFY</p>
            <div className="ml-4 space-y-2">
              <div className="border-2 border-blue-300 bg-blue-50 rounded p-2">
                <p className="text-[9px] text-blue-600 font-bold mb-1">✨ AI VERIFICATION:</p>
                <p className="text-[9px] text-gray-700">✓ Units consistent ✓ Answer reasonable</p>
              </div>
              <div className="flex gap-2">
                <input className="border-2 border-gray-300 rounded w-20 p-1 text-[9px]" placeholder="answer" />
                <input className="border-2 border-gray-300 rounded flex-1 p-1 text-[9px]" placeholder="How you verified" />
              </div>
              <button className="border-2 border-gray-400 rounded px-3 py-1 text-[9px] font-bold">
                UPLOAD IMAGE
              </button>
              <button className="border-2 border-gray-400 rounded px-4 py-1.5 text-[10px] font-bold">
                SUBMIT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
