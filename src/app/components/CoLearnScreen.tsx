import { ArrowLeft, UserPlus, Archive, Home, MessageCircle, CalendarClock, Share2, Send, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as colearnerChatService from '../../services/colearnerChatService';
import { updateConnectionStudyTime, type CoLearnerConnection } from '../../services/colearnerConnectionService';

interface CoLearnScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  problemContext?: string;
  activityLogId?: string;
  currentUserName?: string;
  selectedCoLearner?: CoLearnerConnection | null;
}

export const CoLearnScreen = ({
  onBack,
  onHomeClick,
  onArchiveClick,
  onInviteClick,
  problemContext,
  activityLogId,
  currentUserName = 'You',
  selectedCoLearner = null,
}: CoLearnScreenProps) => {
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [chatMessages, setChatMessages] = useState<colearnerChatService.CoLearnerMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [studyTime, setStudyTime] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSharingProblem, setIsSharingProblem] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const participantList = useMemo(() => {
    if (!selectedCoLearner) {
      return [currentUserName];
    }
    return [currentUserName, selectedCoLearner.name];
  }, [currentUserName, selectedCoLearner]);

  useEffect(() => {
    const initializeChatSession = async () => {
      if (isInitializing) return;

      setIsInitializing(true);
      try {
        const existingSessions = await colearnerChatService.getAllSessions();
        const existingMatch = selectedCoLearner
          ? existingSessions.find((session) =>
              session.participants.includes(currentUserName) &&
              (session.participants.includes(selectedCoLearner.name) || session.participants.includes(selectedCoLearner.contact))
            )
          : existingSessions.find((session) => session.participants.includes(currentUserName));

        if (existingMatch) {
          const fullSession = await colearnerChatService.getChatSession(existingMatch.id);
          setChatSessionId(fullSession.id);
          setChatMessages(fullSession.messages || []);
          return;
        }

        const { chatId, session } = await colearnerChatService.createChatSession(
          participantList,
          problemContext || 'Choose a topic to study together',
          activityLogId
        );

        setChatSessionId(chatId);
        setChatMessages(session.messages || []);
      } catch (error) {
        console.error('Failed to initialize co-learner chat session:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChatSession();
  }, [activityLogId, currentUserName, isInitializing, participantList, problemContext, selectedCoLearner]);

  const pushMessage = async (message: string) => {
    if (!chatSessionId) {
      return;
    }

    const saved = await colearnerChatService.addMessage(chatSessionId, currentUserName, message, 'text');
    setChatMessages((prev) => [...prev, saved]);
  };

  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !chatSessionId) return;

    setIsSendingMessage(true);
    try {
      await pushMessage(newChatMessage.trim());
      setNewChatMessage('');
    } catch (error) {
      console.error('Failed to send co-learner message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleScheduleStudyTime = async () => {
    if (!studyTime || !selectedCoLearner || !chatSessionId) {
      return;
    }

    setIsScheduling(true);
    try {
      const formatted = new Date(studyTime).toLocaleString();
      await pushMessage(`Let's learn this topic together at ${formatted}.`);
      updateConnectionStudyTime(selectedCoLearner.id, studyTime);
    } catch (error) {
      console.error('Failed to schedule study time:', error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleShareProblem = async () => {
    if (!problemContext || !chatSessionId) {
      return;
    }

    setIsSharingProblem(true);
    try {
      await pushMessage(`Let's work on this together: ${problemContext}`);
    } catch (error) {
      console.error('Failed to share current problem:', error);
    } finally {
      setIsSharingProblem(false);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <button onClick={onInviteClick} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <UserPlus size={22} className="text-black fill-black" strokeWidth={2} />
          </button>
        </div>
        <h1 className="text-[18px] font-semibold text-gray-900">Co-Learn</h1>
        <div className="flex items-center gap-3">
          <button onClick={onHomeClick} className="p-1">
            <Home size={20} className="text-gray-700" />
          </button>
          <button onClick={onArchiveClick} className="p-1">
            <Archive size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 bg-purple-50 border-b border-purple-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-purple-900">
              {selectedCoLearner ? `Learning with ${selectedCoLearner.name}` : 'Choose a co-learner from Invite'}
            </p>
            <p className="text-[12px] text-purple-700 mt-1">
              Use this space to discuss the topic, agree on a study time, and share the current problem so you can solve it together.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Study plan</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-gray-600 block mb-1">Set a time to learn together</label>
              <input
                type="datetime-local"
                value={studyTime}
                onChange={(event) => setStudyTime(event.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-purple-500"
                disabled={!selectedCoLearner}
              />
            </div>
            <button
              onClick={handleScheduleStudyTime}
              disabled={!selectedCoLearner || !studyTime || isScheduling}
              className="w-full bg-purple-600 text-white py-2.5 px-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarClock size={15} />
              {isScheduling ? 'Saving study time...' : 'Share Study Time'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Current problem</h3>
          <p className="text-[13px] text-gray-700 leading-relaxed">
            {problemContext || 'Open a guided problem first, then share it here to study together.'}
          </p>
          <button
            onClick={handleShareProblem}
            disabled={!selectedCoLearner || !problemContext || isSharingProblem}
            className="mt-4 w-full bg-blue-600 text-white py-2.5 px-3 rounded-lg text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 size={15} />
            {isSharingProblem ? 'Sharing problem...' : 'Share This Problem with Co-Learner'}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Study chat</h3>

          {!selectedCoLearner ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 text-center">
              <p className="text-[13px] font-medium text-gray-700">No co-learner selected yet</p>
              <p className="text-[12px] text-gray-500 mt-1">
                Go to the invite icon, add a connected co-learner, then open their study chat.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {chatMessages.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-5 text-center">
                    <p className="text-[13px] font-medium text-gray-700">No messages yet</p>
                    <p className="text-[12px] text-gray-500 mt-1">
                      Start by sharing the topic, asking a question, or agreeing on a time to meet.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <p className="text-[12px] font-semibold text-gray-900">{msg.sender}</p>
                        <p className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <textarea
                  value={newChatMessage}
                  onChange={(event) => setNewChatMessage(event.target.value)}
                  placeholder={`Message ${selectedCoLearner.name} about the topic you want to learn...`}
                  rows={3}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-purple-500 resize-none"
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={!newChatMessage.trim() || isSendingMessage}
                  className="self-end bg-gray-900 text-white py-2.5 px-4 rounded-lg text-[13px] font-medium flex items-center gap-2 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={15} />
                  {isSendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>

        {isInitializing && (
          <div className="text-center text-[12px] text-gray-500 pb-2">
            Preparing your co-learning space...
          </div>
        )}
      </div>
    </div>
  );
};
