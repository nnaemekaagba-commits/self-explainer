import { ReactNode } from 'react';

interface PhoneContainerProps {
  children: ReactNode;
}

export function PhoneContainer({ children }: PhoneContainerProps) {
  return (
    <div className="relative w-[360px] h-[720px] bg-black rounded-[48px] shadow-2xl p-3">
      {/* iPhone notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[130px] h-[26px] bg-black rounded-b-3xl z-10"></div>

      {/* iPhone screen */}
      <div className="w-full h-full bg-white rounded-[40px] overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
