interface AppIconProps {
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export function AppIcon({
  gradientFrom = 'purple-500',
  gradientVia = 'pink-500',
  gradientTo = 'orange-400'
}: AppIconProps) {
  return (
    <div className={`w-14 h-14 mb-3 rounded-2xl bg-gradient-to-br from-${gradientFrom} via-${gradientVia} to-${gradientTo} shadow-lg flex items-center justify-center`}>
      <div className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm"></div>
    </div>
  );
}
