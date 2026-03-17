import { ArrowLeft, UserPlus, Archive, User, MessageCircle, ThumbsUp, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as colearnerChatService from '../../services/colearnerChatService';

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

  // Initialize chat session when component mounts
  useEffect(() => {
    const initializeChatSession = async () => {
      if (chatSessionId || isInitializing) return;
      
      setIsInitializing(true);
      try {
        console.log('🔵 Initializing co-learner chat session...');
        
        // Create a new chat session with mock participants
        const participants = [currentUserName, "Obi E.", "Agu C.", "Jordan T."];
        const { chatId, session } = await colearnerChatService.createChatSession(
          participants,
          problemContext || "Step 2: Plan your approach and method",
          activityLogId
        );
        
        setChatSessionId(chatId);
        console.log('✅ Co-learner chat session created:', chatId);
        
        // Log initial mock messages to the backend
        await colearnerChatService.addMessage(
          chatId,
          "Obi E.",
          "I solved this by isolating the variable. First, I added 3 to both sides, then divided by 2.",
          "text"
        );
        
        await colearnerChatService.addMessage(
          chatId,
          "Agu C.",
          "Used the distributive property to simplify, then combined like terms before solving for x.",
          "text"
        );
        
        await colearnerChatService.addMessage(
          chatId,
          "Jordan T.",
          "I approached it differently by factoring first, which made it easier to see the solution.",
          "text"
        );
        
        console.log('✅ Initial messages logged to backend');
      } catch (error) {
        console.error('❌ Error initializing co-learner chat session:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeChatSession();
  }, [chatSessionId, isInitializing, problemContext, activityLogId, currentUserName]);

  // Function to log user's response when they share
  const handleShareResponse = async (answer: string, explanation: string) => {
    if (!chatSessionId) {
      console.error('❌ No chat session ID - cannot log message');
      return;
    }
    
    try {
      await colearnerChatService.addMessage(
        chatSessionId,
        currentUserName,
        `Answer: ${answer}\nExplanation: ${explanation}`,
        "text"
      );
      console.log('✅ User response logged to backend');
    } catch (error) {
      console.error('❌ Error logging user response:', error);
    }
  };

  const responses = [
    {
      id: 1,
      user: "Obi E.",
      userColor: "from-blue-500 to-cyan-500",
      answer: "x = 5",
      explanation: "I solved this by isolating the variable. First, I added 3 to both sides, then divided by 2.",
      likes: 12,
      timestamp: "2 min ago"
    },
    {
      id: 2,
      user: "Agu C.",
      userColor: "from-purple-500 to-pink-500",
      answer: "x = 5",
      explanation: "Used the distributive property to simplify, then combined like terms before solving for x.",
      likes: 8,
      timestamp: "5 min ago"
    },
    {
      id: 3,
      user: "Jordan T.",
      userColor: "from-green-500 to-emerald-500",
      answer: "x = 5",
      explanation: "I approached it differently by factoring first, which made it easier to see the solution.",
      likes: 15,
      timestamp: "8 min ago"
    },
    {
      id: 4,
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
                      />
                    </div>
                    <button className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity">
                      Share with Co-Learners
                    </button>
                  </div>
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
            <p className="text-[24px] font-bold text-purple-600 leading-none">4</p>
            <p className="text-[10px] text-gray-500 mt-1">Total students</p>
          </div>
          <div className="w-px h-12 bg-gray-300 mt-1"></div>
          <div className="text-center">
            <p className="text-[24px] font-bold text-green-600 leading-none">3/4</p>
            <p className="text-[10px] text-gray-500 mt-1">Have shared</p>
          </div>
          <div className="w-px h-12 bg-gray-300 mt-1"></div>
          <div className="text-center">
            <p className="text-[24px] font-bold text-blue-600 leading-none">3/3</p>
            <p className="text-[10px] text-gray-500 mt-1">Got same answer</p>
          </div>
        </div>
      </div>
    </div>
  );
};