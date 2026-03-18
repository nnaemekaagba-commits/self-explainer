import { UserPlus, Archive, User, Menu, Home, Users } from 'lucide-react';
import { useState } from 'react';

interface ScreenNavigationProps {
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  onProfileClick?: () => void;
  onHomeClick?: () => void;
  onSharedExerciseClick?: () => void;
  showProfileIcon?: boolean;
  showHomeIcon?: boolean;
}

export function ScreenNavigation({ 
  onArchiveClick, 
  onInviteClick, 
  onProfileClick, 
  onHomeClick,
  onSharedExerciseClick,
  showProfileIcon = false,
  showHomeIcon = false
}: ScreenNavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex justify-between items-center px-6 py-2">
      {/* Left: Hamburger Menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <Menu size={22} className="text-gray-700" strokeWidth={2} />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <>
            {/* Backdrop to close menu */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setMenuOpen(false)}
            />
            
            {/* Menu Items */}
            <div className="absolute left-0 top-12 w-56 bg-white rounded-2xl shadow-lg border border-gray-200 py-2 z-20">
              {showProfileIcon && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onProfileClick?.();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                    <User size={18} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[15px] font-medium text-gray-900">Profile</span>
                </button>
              )}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onArchiveClick?.();
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <Archive size={20} className="text-gray-700" strokeWidth={2} />
                <span className="text-[15px] font-medium text-gray-900">Archive</span>
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onSharedExerciseClick?.();
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <Users size={20} className="text-gray-700" strokeWidth={2} />
                <span className="text-[15px] font-medium text-gray-900">Shared Exercises</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Center: API Toggle */}
      {/* Removed - OpenAI is now the only provider */}

      {/* Right: Invite + Home */}
      <div className="flex gap-2 items-center">
        {/* Invite button */}
        <button
          onClick={onInviteClick}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
        >
          <UserPlus size={22} className="text-black fill-black" strokeWidth={2} />
        </button>

        {/* Home icon (optional) */}
        {showHomeIcon && (
          <button
            onClick={onHomeClick}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <Home size={22} className="text-gray-700" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}