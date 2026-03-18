import { ArrowLeft, Camera, LogOut, User, Mail } from 'lucide-react';
import { useState, useRef } from 'react';
import { getSessionId } from '../../services/sessionService';
import { getAuthState } from '../../services/authService';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  user?: { id: string; email: string; name?: string } | null;
}

export function ProfileScreen({ onBack, onLogout, user }: ProfileScreenProps) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Header with back button */}
      <div className="h-[50px] flex items-center justify-between px-6 pt-2 border-b border-gray-200 bg-white">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ArrowLeft size={20} strokeWidth={2} />
          <span className="text-[15px] font-medium">Back</span>
        </button>
        <span className="text-[15px] font-medium text-gray-900">Profile</span>
        <div className="w-16"></div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50">
        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Profile Picture */}
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center overflow-hidden shadow-lg">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-white" strokeWidth={2} />
                )}
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Camera Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors border-4 border-white"
              >
                <Camera size={18} className="text-white" />
              </button>
            </div>

            <p className="text-[11px] text-gray-500 mt-3">Tap to change profile picture</p>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            {/* Full Name */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Full Name
              </label>
              <input
                type="text"
                defaultValue={user?.name || "Emeka Agba"}
                className="w-full text-[15px] text-gray-900 font-medium outline-none"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                Email
              </label>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400" />
                <input
                  type="email"
                  defaultValue={user?.email || "emeka.agba@example.com"}
                  className="flex-1 text-[15px] text-gray-900 font-medium outline-none"
                  placeholder="Enter email"
                />
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-gray-700 px-1">Account Settings</h3>

            <button className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="text-[14px] text-gray-900">Change Password</span>
              <ArrowLeft size={18} className="text-gray-400 rotate-180" />
            </button>

            <button className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="text-[14px] text-gray-900">Notification Settings</span>
              <ArrowLeft size={18} className="text-gray-400 rotate-180" />
            </button>

            <button className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="text-[14px] text-gray-900">Privacy & Security</span>
              <ArrowLeft size={18} className="text-gray-400 rotate-180" />
            </button>
          </div>

          {/* Logout Button */}
          <button className="w-full mt-6 h-[48px] bg-red-600 text-white rounded-xl font-medium text-[15px] shadow-md hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2" onClick={onLogout}>
            <LogOut size={20} />
            <span>Log Out</span>
          </button>

          {/* Session ID Display - For Privacy Verification */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
            <h3 className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-2">
              Session ID (Privacy)
            </h3>
            <p className="text-[10px] text-blue-600 font-mono break-all">
              {getSessionId(user?.id)}
            </p>
            <p className="text-[10px] text-blue-600 mt-2">
              🔒 Your data is isolated by this unique session ID. {user ? 'Each authenticated user has a unique ID based on their account.' : 'Guest users have a browser-specific ID.'} This ensures your activities are completely private and separate from other users.
            </p>
          </div>

          {/* App Version */}
          <p className="text-center text-[11px] text-gray-400 mt-4">
            Version 1.0.0
          </p>
        </div>
      </div>
    </>
  );
}