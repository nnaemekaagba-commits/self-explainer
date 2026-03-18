import { ArrowLeft, UserPlus, Archive, User, MessageCircle, ThumbsUp, Home, Share2, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as colearnerChatService from '../../services/colearnerChatService';
import { copyToClipboard } from '../../utils/clipboard';

interface CoLearnScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  problemContext?: string;
  activityLogId?: string;
  currentUserName?: string;
}

export const CoLearnScreen = ({ 
  onBack, 
  onHomeClick, 
  onArchiveClick, 
  onInviteClick,
  problemContext,
  activityLogId,
  currentUserName = "You"
}: CoLearnScreenProps) => {
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [userExplanation, setUserExplanation] = useState('');
  const [hasShared, setHasShared] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{sender: string; message: string; timestamp: string}>>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Initialize chat session when component mounts
  useEffect(() => {
    const initializeChatSession = async () => {
      if (chatSessionId || isInitializing) return;
      
      setIsInitializing(true);
      try {
        console.log('🔵 Initializing co-learner chat session...');
        
        // Create a new chat session with current user only
        const participants = [currentUserName];
        const { chatId, session } = await colearnerChatService.createChatSession(
          participants,
          problemContext || "Step 2: Plan your approach and method",
          activityLogId
        );
        
        setChatSessionId(chatId);
        console.log('✅ Co-learner chat session created:', chatId);
      } catch (error) {
        console.error('❌ Error initializing co-learner chat session:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeChatSession();
  }, [chatSessionId, isInitializing, problemContext, activityLogId, currentUserName]);

  // Function to log user's response when they share
  const handleShareResponse = async () => {
    if (!chatSessionId) {
      console.error('❌ No chat session ID - cannot log message');
      return;
    }
    
    setIsSharing(true);
    try {
      await colearnerChatService.addMessage(
        chatSessionId,
        currentUserName,
        `Answer: ${userAnswer}\\nExplanation: ${userExplanation}`,
        "text"
      );
      console.log('✅ User response logged to backend');
      setHasShared(true);
    } catch (error) {
      console.error('❌ Error logging user response:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Function to send chat message
  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !chatSessionId) return;

    const newMessage = {
      sender: currentUserName,
      message: newChatMessage,
      timestamp: "Just now"
    };

    setChatMessages([...chatMessages, newMessage]);
    
    // Log to backend
    try {
      await colearnerChatService.addMessage(
        chatSessionId,
        currentUserName,
        newChatMessage,
        "text"
      );
      console.log('✅ Chat message logged to backend');
    } catch (error) {
      console.error('❌ Error logging chat message:', error);
    }

    setNewChatMessage('');
  };

  // Function to copy share link
  const handleCopyShareLink = async () => {
    if (!chatSessionId || !activityLogId) return;

    const shareLink = `${window.location.origin}?shared=${activityLogId}&session=${chatSessionId}`;
    
    try {
      await copyToClipboard(shareLink);
      setLinkCopied(true);
      console.log('✅ Share link copied:', shareLink);
      
      // Reset after 2 seconds
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('❌ Failed to copy link:', error);
    }
  };

  const responses = [
    {
      id: 1,
      user: currentUserName,
      userColor: "from-orange-500 to-red-500",
      answer: "",
      explanation: "",
      likes: 0,
      timestamp: "",
      isCurrentUser: true
    }
  ];

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
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

      {/* Step Info */}
      <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
        <p className="text-[13px] font-semibold text-purple-900 mb-1">
          Step 2: Plan your approach and method
        </p>
        <p className="text-[12px] text-purple-700">
          Compare your explanation with your co-learners
        </p>
      </div>

      {/* Responses List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-8">
        <div className="space-y-4">
          {responses.map((response) => (
            <div
              key={response.id}
              className={`rounded-xl p-4 ${
                response.isCurrentUser
                  ? 'bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {/* User Header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${response.userColor} flex items-center justify-center`}
                >
                  <User size={20} className="text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-gray-900">
                    {response.user}
                  </p>
                  {!response.isCurrentUser && (
                    <p className="text-[11px] text-gray-500">{response.timestamp}</p>
                  )}
                </div>
                {!response.isCurrentUser && (
                  <button className="flex items-center gap-1 px-2 py-1 text-[12px] text-gray-600 hover:bg-white rounded-md transition-colors">
                    <ThumbsUp size={14} />
                    <span>{response.likes}</span>
                  </button>
                )}
              </div>

              {response.isCurrentUser ? (
                <>
                  {hasShared ? (
                    <>
                      {/* Your Shared Response */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-[11px] font-medium text-gray-500 mb-1">YOUR ANSWER</p>
                          <p className="text-[14px] font-semibold text-gray-900">{userAnswer}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-gray-500 mb-1">YOUR EXPLANATION</p>
                          <p className="text-[13px] text-gray-700 leading-relaxed">
                            {userExplanation}
                          </p>
                        </div>
                      </div>
                      
                      {/* Success message */}
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-[11px] text-green-700 font-medium">✅ Shared with co-learners!</p>
                      </div>

                      {/* Discussion Section */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button 
                          onClick={() => setShowChat(!showChat)}
                          className="flex items-center gap-2 text-[12px] text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-md transition-colors w-full justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <MessageCircle size={14} />
                            <span>Discussion ({chatMessages.length})</span>
                          </span>
                          <span className="text-[10px]">{showChat ? '▼' : '▶'}</span>
                        </button>

                        {/* Chat Thread */}
                        {showChat && (
                          <div className="mt-3 space-y-3">
                            {/* Chat Messages */}
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {chatMessages.map((msg, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-2 border border-gray-200">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="text-[11px] font-semibold text-gray-900">{msg.sender}</p>
                                    <p className="text-[9px] text-gray-400">{msg.timestamp}</p>
                                  </div>
                                  <p className="text-[12px] text-gray-700">{msg.message}</p>
                                </div>
                              ))}
                            </div>

                            {/* Chat Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Reply to co-learners..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[12px] focus:outline-none focus:border-purple-500 bg-white"
                                value={newChatMessage}
                                onChange={(e) => setNewChatMessage(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && newChatMessage.trim()) {
                                    handleSendChatMessage();
                                  }
                                }}
                              />
                              <button
                                onClick={handleSendChatMessage}
                                disabled={!newChatMessage.trim()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-[12px] font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Your Input */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[12px] font-medium text-gray-700 mb-1 block">
                            Your Answer
                          </label>
                          <input
                            type="text"
                            placeholder="Enter your answer"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-orange-500 bg-white"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[12px] font-medium text-gray-700 mb-1 block">
                            Your Explanation
                          </label>
                          <textarea
                            placeholder="Explain your approach and reasoning"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-orange-500 resize-none bg-white"
                            value={userExplanation}
                            onChange={(e) => setUserExplanation(e.target.value)}
                          />
                        </div>
                        <button
                          className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleShareResponse}
                          disabled={isSharing || !userAnswer.trim() || !userExplanation.trim()}
                        >
                          {isSharing ? 'Sharing...' : 'Share with Co-Learners'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Other's Response */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-[11px] font-medium text-gray-500 mb-1">ANSWER</p>
                      <p className="text-[14px] font-semibold text-gray-900">{response.answer}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-gray-500 mb-1">EXPLANATION</p>
                      <p className="text-[13px] text-gray-700 leading-relaxed">
                        {response.explanation}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button className="flex items-center gap-2 text-[12px] text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-md transition-colors">
                      <MessageCircle size={14} />
                      <span>Discuss this approach</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-4 pt-4 pb-6 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start justify-around">
          <div className="text-center">
            <p className="text-[24px] font-bold text-purple-600 leading-none">1</p>
            <p className="text-[10px] text-gray-500 mt-1">Total students</p>
          </div>
          <div className="w-px h-12 bg-gray-300 mt-1"></div>
          <div className="text-center">
            <p className="text-[24px] font-bold text-green-600 leading-none">{hasShared ? '1/1' : '0/1'}</p>
            <p className="text-[10px] text-gray-500 mt-1">Have shared</p>
          </div>
          <div className="w-px h-12 bg-gray-300 mt-1"></div>
          <div className="text-center">
            <p className="text-[24px] font-bold text-blue-600 leading-none">-</p>
            <p className="text-[10px] text-gray-500 mt-1">Got same answer</p>
          </div>
        </div>
      </div>
    </div>
  );
};