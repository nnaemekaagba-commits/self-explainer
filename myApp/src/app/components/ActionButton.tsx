import { useState } from 'react';
import { TinyFlippingBook } from './TinyFlippingBook';

interface ActionButtonProps {
  label: string;
  onClick?: () => void;
}

export function ActionButton({ label, onClick }: ActionButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onClick) {
        onClick();
      }
    }, 3000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className="w-full flex items-center justify-center h-[48px] px-4 bg-gradient-to-b from-white to-gray-50 border border-gray-300 rounded-full hover:from-gray-50 hover:to-gray-100 active:from-gray-100 active:to-gray-200 transition-all shadow-sm hover:shadow-md active:shadow-inner cursor-pointer disabled:cursor-not-allowed"
    >
      {isProcessing ? (
        <TinyFlippingBook />
      ) : (
        <span className="text-[15px] text-gray-900 font-medium">{label}</span>
      )}
    </button>
  );
}
