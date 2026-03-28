import { ArrowLeft, Copy, Share, Check, Users, Archive, Home, Mail, AtSign, MessageCircle, UserPlus, Trash2, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { copyToClipboard } from '../../utils/clipboard';
import { generateInviteCode } from '../../services/inviteService';
import {
  addConnection,
  getConnections,
  removeConnection,
  type CoLearnerConnection,
} from '../../services/colearnerConnectionService';

interface InviteFriendScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  inviteCode?: string;
  isAuthenticated?: boolean;
  currentUserName?: string;
  onOpenCoLearner?: (connection: CoLearnerConnection) => void;
}

export const InviteFriendScreen = ({
  onBack,
  onHomeClick,
  onArchiveClick,
  inviteCode,
  isAuthenticated = false,
  currentUserName = 'You',
  onOpenCoLearner,
}: InviteFriendScreenProps) => {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteTarget, setInviteTarget] = useState('');
  const [targetError, setTargetError] = useState('');
  const [connections, setConnections] = useState<CoLearnerConnection[]>([]);

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

  useEffect(() => {
    if (isAuthenticated) {
      setConnections(getConnections());
    } else {
      setConnections([]);
    }
  }, [isAuthenticated]);

  const trimmedTarget = inviteTarget.trim();
  const isEmailInvite = trimmedTarget.includes('@');

  const refreshConnections = () => {
    setConnections(getConnections());
  };

  const getNormalizedUsername = () => {
    if (!trimmedTarget) {
      return '';
    }

    return trimmedTarget.startsWith('@') ? trimmedTarget : `@${trimmedTarget}`;
  };

  const validateTarget = () => {
    if (!trimmedTarget) {
      setTargetError('Enter your friend\'s email address or username.');
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
      return `Hi ${trimmedTarget},\n\nI'd like to invite you to join me on Learning AI so we can learn together.\n\nUse this invite link to join:\n${inviteLink}`;
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
          url: inviteLink,
        });
      } else {
        await handleCopyLink();
      }
    } catch (error) {
      console.error('Failed to share link:', error);
    }
  };

  const handleAddCoLearner = () => {
    if (!isAuthenticated) {
      setTargetError('Sign in to add and manage co-learners.');
      return;
    }

    if (!validateTarget()) {
      return;
    }

    try {
      addConnection(trimmedTarget);
      setInviteTarget('');
      setTargetError('');
      refreshConnections();
    } catch (error: any) {
      setTargetError(error?.message || 'Failed to add co-learner.');
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

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-12">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Users size={48} className="text-white" strokeWidth={2} />
          </div>

          <h2 className="text-[20px] font-bold text-gray-900 mb-3 text-center">
            Learn Together
          </h2>

          <p className="text-[14px] text-gray-600 text-center mb-8 max-w-[320px]">
            Invite a friend by email or username, then keep a reusable list of connected co-learners for future study chats.
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
                Use email to send an invite, or use a username to share a direct co-learning message.
              </p>
            )}

            <button
              onClick={handleAddCoLearner}
              className="mt-4 w-full bg-gray-900 text-white py-3 px-4 rounded-xl font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              <UserPlus size={16} />
              Add to Connected Co-Learners
            </button>
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

          <div className="w-full mt-8 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900">Connected Co-Learners</h3>
                <p className="text-[12px] text-gray-500 mt-1">
                  Click a co-learner to chat about a topic, set a time to learn together, and share a problem to solve side by side.
                </p>
              </div>
              {isAuthenticated ? (
                <span className="text-[11px] font-medium px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full">
                  Signed in
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                  Account required
                </span>
              )}
            </div>

            {!isAuthenticated ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Lock size={18} className="text-amber-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-amber-900">Sign up or sign in first</p>
                  <p className="text-[12px] text-amber-800 mt-1">
                    Connected co-learners are available only for learners with an account, so your list stays attached to you.
                  </p>
                </div>
              </div>
            ) : connections.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 text-center">
                <p className="text-[13px] font-medium text-gray-700">No connected co-learners yet</p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Add one above and they will appear here for quick study chats.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-slate-50 to-blue-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[14px] font-semibold text-gray-900">{connection.name}</p>
                        <p className="text-[12px] text-gray-600 mt-1">{connection.contact}</p>
                        <p className="text-[11px] text-gray-500 mt-2">
                          Added {new Date(connection.addedAt).toLocaleDateString()}
                          {connection.lastStudyTime ? ` • Last study time ${new Date(connection.lastStudyTime).toLocaleString()}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          removeConnection(connection.id);
                          refreshConnections();
                        }}
                        className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => onOpenCoLearner?.(connection)}
                        className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                      >
                        <MessageCircle size={15} />
                        Open Study Chat
                      </button>
                      <button
                        onClick={async () => {
                          const message = `Hi ${connection.name}, ${currentUserName} invited you to co-learn on Learning AI: ${inviteLink}`;
                          try {
                            await copyToClipboard(message);
                          } catch (error) {
                            console.error('Failed to copy co-learner invite:', error);
                          }
                        }}
                        className="bg-white border border-gray-300 text-gray-900 py-2.5 px-3 rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors"
                      >
                        Copy Invite
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
