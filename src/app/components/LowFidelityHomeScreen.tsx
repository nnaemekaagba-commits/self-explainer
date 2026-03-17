interface LowFidelityHomeScreenProps {
  heading: string;
  placeholder: string;
  button1Label: string;
  button2Label: string;
  onButton2Click: () => void;
}

export function LowFidelityHomeScreen({
  heading,
  placeholder,
  button1Label,
  button2Label,
  onButton2Click,
}: LowFidelityHomeScreenProps) {
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

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-[17px] text-gray-700 mb-8 border-b-2 border-gray-400 pb-1">
          {heading}
        </h2>

        {/* Input field - wireframe */}
        <div className="w-full flex items-start gap-2.5 px-0 mb-5">
          <div className="w-9 h-9 border-2 border-gray-400 rounded-full flex items-center justify-center flex-shrink-0 mt-2">
            <span className="text-[16px] text-gray-600">+</span>
          </div>
          <div className="flex-1 relative">
            <div className="w-full h-[72px] border-2 border-gray-400 rounded-3xl p-3 bg-gray-50">
              <p className="text-[11px] text-gray-500 italic">{placeholder}</p>
            </div>
          </div>
        </div>

        {/* Action buttons - wireframe */}
        <div className="w-full flex flex-col gap-3">
          <div className="w-full h-[48px] border-2 border-gray-400 rounded-full flex items-center justify-center bg-white">
            <span className="text-[15px] text-gray-700">{button1Label}</span>
          </div>
          <div
            onClick={onButton2Click}
            className="w-full h-[48px] border-2 border-gray-400 rounded-full flex items-center justify-center bg-white cursor-pointer hover:bg-gray-50"
          >
            <span className="text-[15px] text-gray-700">{button2Label}</span>
          </div>
        </div>
      </div>
    </>
  );
}
