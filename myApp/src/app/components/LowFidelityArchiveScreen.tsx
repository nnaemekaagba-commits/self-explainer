import { ArrowLeft, UserPlus, Archive } from 'lucide-react';

interface LowFidelityArchiveScreenProps {
  onBack: () => void;
}

export const LowFidelityArchiveScreen = ({ onBack }: LowFidelityArchiveScreenProps) => {
  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-300">
        <div className="w-6 h-6 border-2 border-gray-400"></div>
        <span className="text-[14px] font-bold text-gray-700">Archive</span>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-400"></div>
          <div className="w-5 h-5 border-2 border-gray-400"></div>
        </div>
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-8">
        <div className="space-y-3">
          {['Mathematics - Quadratic Equations', 'Physics - Newton\'s Laws', 'Chemistry - Chemical Bonding', 'Mathematics - Trigonometry', 'Physics - Thermodynamics', 'Chemistry - Organic Reactions'].map((item, index) => (
            <div
              key={index}
              className="border-2 border-gray-300 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-[11px] font-bold text-gray-700">{item}</p>
                <div className="text-[9px] px-2 py-0.5 border-2 border-gray-300 rounded-full">
                  {index % 2 === 0 ? 'COMPLETED' : 'IN PROGRESS'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">{index % 2 === 0 ? 'Guided Solution' : 'Solution Strategy'}</span>
                <span className="text-[10px] text-gray-500">Mar {7 - index}, 2026</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
