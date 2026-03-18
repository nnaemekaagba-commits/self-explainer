import { ArrowLeft } from 'lucide-react';

interface LowFidelityCoLearnScreenProps {
  onBack: () => void;
}

export const LowFidelityCoLearnScreen = ({ onBack }: LowFidelityCoLearnScreenProps) => {
  return (
    <div className="flex-1 flex flex-col bg-white border-2 border-gray-400">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-400">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={20} className="text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-[14px] font-bold text-gray-800">CO-LEARN</h1>
        <div className="w-6"></div>
      </div>

      {/* Step Info */}
      <div className="px-4 py-2 bg-gray-100 border-b-2 border-gray-400">
        <p className="text-[11px] font-bold text-gray-800">
          STEP 2: PLAN YOUR APPROACH
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Other Students */}
        <div className="mb-3">
          <div className="border-2 border-gray-400 rounded p-3 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 border-2 border-gray-400 rounded-full"></div>
              <span className="text-[11px] font-bold">STUDENT 1</span>
            </div>
            <div className="text-[10px] text-gray-700 mb-1">ANSWER: [answer text]</div>
            <div className="text-[10px] text-gray-700">EXPLANATION: [explanation text]</div>
          </div>

          <div className="border-2 border-gray-400 rounded p-3 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 border-2 border-gray-400 rounded-full"></div>
              <span className="text-[11px] font-bold">STUDENT 2</span>
            </div>
            <div className="text-[10px] text-gray-700 mb-1">ANSWER: [answer text]</div>
            <div className="text-[10px] text-gray-700">EXPLANATION: [explanation text]</div>
          </div>

          <div className="border-2 border-gray-400 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 border-2 border-gray-400 rounded-full"></div>
              <span className="text-[11px] font-bold">STUDENT 3</span>
            </div>
            <div className="text-[10px] text-gray-700 mb-1">ANSWER: [answer text]</div>
            <div className="text-[10px] text-gray-700">EXPLANATION: [explanation text]</div>
          </div>
        </div>

        {/* Your Response */}
        <div className="border-2 border-gray-400 rounded p-3 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 border-2 border-gray-400 rounded-full bg-gray-200"></div>
            <span className="text-[11px] font-bold">YOU</span>
          </div>
          <div className="mb-2">
            <div className="text-[9px] font-bold mb-1">YOUR ANSWER</div>
            <div className="border-2 border-gray-400 rounded p-2 bg-white">
              <div className="text-[10px] text-gray-400">[Enter your answer]</div>
            </div>
          </div>
          <div className="mb-2">
            <div className="text-[9px] font-bold mb-1">YOUR EXPLANATION</div>
            <div className="border-2 border-gray-400 rounded p-2 h-16 bg-white">
              <div className="text-[10px] text-gray-400">[Enter your explanation]</div>
            </div>
          </div>
          <button className="w-full border-2 border-gray-400 rounded py-2 text-[11px] font-bold hover:bg-gray-100">
            SHARE WITH CO-LEARNERS
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 bg-gray-100 border-t-2 border-gray-400">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-[16px] font-bold">4</p>
            <p className="text-[9px] text-gray-600">TOTAL</p>
          </div>
          <div>
            <p className="text-[16px] font-bold">3/4</p>
            <p className="text-[9px] text-gray-600">SHARED</p>
          </div>
          <div>
            <p className="text-[16px] font-bold">3/3</p>
            <p className="text-[9px] text-gray-600">SAME</p>
          </div>
        </div>
      </div>
    </div>
  );
};
