import { ArrowLeft, Copy, Share, Check, Users, Archive, Home, Mail, AtSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { copyToClipboard } from '../../utils/clipboard';
import { generateInviteCode } from '../../services/inviteService';

interface InviteFriendScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  inviteCode?: string;
}

export const InviteFriendScreen = ({ onBack, onHomeClick, onArchiveClick, inviteCode }: InviteFriendScreenProps) => {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteTarget, setInviteTarget] = useState('');
  const [targetError, setTargetError] = useState('');

  useEffect(() => {
    const initInviteCode = async () => {
      if (inviteCode) {
        setInviteLink(`${window.location.origin}?invite=${inviteCode}`);
        return;
      }

      try {
        const result = await generateInviteCode();
        setInviteLink(result.link);
      } catch (error) {
        console.error('Failed to generate invite code:', error);
      }
    };

    initInviteCode();
  }, [inviteCode]);

  const trimmedTarget = inviteTarget.trim();
  const isEmailInvite = trimmedTarget.includes('@');

  const getNormalizedUsername = () => {
    if (!trimmedTarget) {
      return '';
    }

    return trimmedTarget.startsWith('@') ? trimmedTarget : `@${trimmedTarget}`;
  };

  const validateTarget = () => {
    if (!trimmedTarget) {
      setTargetError('Enter your friend’s email address or username.');
      return false;
    }

    if (isEmailInvite) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(trimmedTarget)) {
        setTargetError('Enter a valid email address.');
        return false;
      }
    } else {
      const usernamePattern = /^@?[a-zA-Z0-9._-]{3,30}$/;
      if (!usernamePattern.test(trimmedTarget)) {
        setTargetError('Enter a valid username with 3-30 letters, numbers, dots, dashes, or underscores.');
        return false;
      }
    }

    setTargetError('');
    return true;
  };

  const buildInviteMessage = () => {
    if (!trimmedTarget) {
      return `Join me on Learning AI: ${inviteLink}`;
    }

    if (isEmailInvite) {
      return `Hi ${trimmedTarget},\n\nI’d like to invite you to join me on Learning AI so we can learn together.\n\nUse this invite link to join:\n${inviteLink}`;
    }

    return `${getNormalizedUsername()}, join me on Learning AI so we can learn together: ${inviteLink}`;
  };

  const handleCopyLink = async () => {
    if (!validateTarget()) {
      return;
    }

    try {
      await copyToClipboard(buildInviteMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite message:', error);
      prompt('Copy this invite message:', buildInviteMessage());
    }
  };

  const handleShare = async () => {
    if (!validateTarget()) {
      return;
    }

    try {
      if (isEmailInvite) {
        const subject = encodeURIComponent('Join me on Learning AI');
        const body = encodeURIComponent(buildInviteMessage());
        window.location.href = `mailto:${encodeURIComponent(trimmedTarget)}?subject=${subject}&body=${body}`;
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Join me on Learning AI',
          text: buildInviteMessage(),
          url: inviteLink
        });
      } else {
        await handleCopyLink();
      }
    } catch (error) {
      console.error('Failed to share link:', error);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <Users size={20} className="text-blue-600" />
        </div>
        <h1 className="text-[18px] font-semibold text-gray-900">Invite Friends</h1>
        <div className="flex items-center gap-3">
          <button onClick={onHomeClick} className="p-1">
            <Home size={20} className="text-gray-700" />
          </button>
          <button onClick={onArchiveClick} className="p-1">
            <Archive size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 pb-12">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
          <Users size={48} className="text-white" strokeWidth={2} />
        </div>

        <h2 className="text-[20px] font-bold text-gray-900 mb-3 text-center">
          Learn Together
        </h2>

        <p className="text-[14px] text-gray-600 text-center mb-8 max-w-[280px]">
          Invite a friend using their email address or username
        </p>

        <div className="w-full bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          <label className="text-[11px] text-gray-500 mb-2 font-medium block">
            INVITEE EMAIL OR USERNAME
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            {isEmailInvite ? (
              <Mail size={18} className="text-gray-400" />
            ) : (
              <AtSign size={18} className="text-gray-400" />
            )}
            <input
              value={inviteTarget}
              onChange={(event) => {
                setInviteTarget(event.target.value);
                if (targetError) {
                  setTargetError('');
                }
              }}
              placeholder="friend@example.com or username"
              className="w-full text-[14px] text-gray-900 outline-none placeholder:text-gray-400"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          {targetError ? (
            <p className="mt-2 text-[12px] text-red-600">{targetError}</p>
          ) : (
            <p className="mt-2 text-[12px] text-gray-500">
              Use email to open an email invite, or use a username to share a personal invite message.
            </p>
          )}
        </div>

        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-[11px] text-gray-500 mb-2 font-medium">INVITE LINK</p>
          <p className="text-[13px] text-gray-900 break-all font-mono">
            {inviteLink}
          </p>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={handleCopyLink}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Invite Message
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="w-full bg-white border border-gray-300 text-gray-900 py-3 px-4 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <Share size={18} />
            {isEmailInvite ? 'Send Email Invite' : 'Share Invite'}
          </button>
        </div>

        <p className="text-[12px] text-gray-500 text-center mt-6 max-w-[260px]">
          The add-friend flow now creates a direct invite using the friend’s email address or username
        </p>
      </div>
    </div>
  );
};
