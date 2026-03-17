export function StatusBar() {
  return (
    <div className="h-[50px] flex items-center justify-between px-8 pt-2">
      <span className="text-[15px]">9:41</span>
      <div className="flex items-center gap-1.5">
        <svg className="w-[17px] h-[12px]" viewBox="0 0 17 12" fill="none">
          <rect x="0.5" y="0.5" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1"/>
          <rect x="16" y="3.5" width="1" height="5" rx="0.5" fill="currentColor"/>
        </svg>
      </div>
    </div>
  );
}
