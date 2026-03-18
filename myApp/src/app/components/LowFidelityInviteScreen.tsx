import { ArrowLeft, UserPlus, Archive } from 'lucide-react';

interface LowFidelityInviteScreenProps {
  onBack: () => void;
}

export const LowFidelityInviteScreen = ({ onBack }: LowFidelityInviteScreenProps) => {
  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-gray-300">
        <div className="w-6 h-6 border-2 border-gray-400"></div>
        <span className="text-[14px] font-bold text-gray-700">Invite Friends</span>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-400"></div>
          <div className="w-5 h-5 border-2 border-gray-400"></div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Icon */}
        <div className="w-24 h-24 border-4 border-gray-400 rounded-full flex items-center justify-center mb-6">
          <UserPlus size={48} className="text-black fill-black" strokeWidth={2} />
        </div>

        {/* Title */}
        <h2 className="text-[16px] font-bold text-gray-700 mb-3">LEARN TOGETHER</h2>

        {/* Description */}
        <p className="text-[11px] text-gray-600 text-center mb-8 max-w-[240px]">
          Share with friends to co-learn with them
        </p>

        {/* Link Box */}
        <div className="w-full border-2 border-gray-300 rounded-lg p-4 mb-4">
          <p className="text-[9px] font-bold text-gray-500 mb-2">YOUR INVITE LINK</p>
          <p className="text-[10px] text-gray-700 break-all font-mono">
            https://app.learning.ai/invite/abc123xyz
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button className="w-full h-10 border-2 border-gray-400 rounded-lg text-[11px] font-bold hover:bg-gray-50">
            COPY LINK
          </button>
          <button className="w-full h-10 border-2 border-gray-400 rounded-lg text-[11px] font-bold hover:bg-gray-50">
            SHARE
          </button>
        </div>

        {/* Info Text */}
        <p className="text-[10px] text-gray-500 text-center mt-6 max-w-[240px]">
          Friends who join through your link will be added to your learning network
        </p>
      </div>
    </div>
  );
};
