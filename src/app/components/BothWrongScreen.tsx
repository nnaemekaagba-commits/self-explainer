import { ArrowLeft, XCircle, Lightbulb, Send, MessageCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { askAIForHelp, generateStepSolution } from '../../services/aiService';
import { MathRenderer } from './MathRenderer';
import { RenderTextFormulaButton } from './RenderTextFormulaButton';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

interface BothWrongScreenProps {
  onBack: () => void;
  onTryAgain?: (chatMessages?: ChatMessage[]) => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  onCoLearnClick?: () => void;
  stepNumber?: number;
  hint?: string;
  userAnswer?: string;
  userExplanation?: string;
  onAIQueryUsed?: () => void;
  onChatMessagesChange?: (messages: ChatMessage[]) => void;
  attemptCount?: number;
  stepData?: {
    stepNumber: number;
    title: string;
    description: string;
    hint: string;
    formula: string;
    diagram?: string;
  };
  originalQuestion?: string;  // The original problem being solved
  answerImageUrl?: string;  // Image of student's answer
  explanationImageUrl?: string;  // Image of student's explanation
}

export function BothWrongScreen({
  onBack,
  onTryAgain,
  stepNumber = 1,
  hint = "Review the problem and think about the correct approach.",
  userAnswer = "Not provided",
  userExplanation = "Not provided",
  onAIQueryUsed,
  attemptCount,
  stepData,
  onChatMessagesChange,
  originalQuestion,
  answerImageUrl,
  explanationImageUrl
}: BothWrongScreenProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [queriesRemaining, setQueriesRemaining] = useState(4);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [normalizeRenderedContent, setNormalizeRenderedContent] = useState(false);
  const [correctSolution, setCorrectSolution] = useState<{answer: string; explanation: string} | null>(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  console.log('🎬 BothWrongScreen rendered with props:', {
    stepNumber,
    hasOnChatMessagesChange: !!onChatMessagesChange,
    chatMessagesCount: chatMessages.length
  });

  // Fetch correct solution when attemptCount >= 3
  useEffect(() => {
    if (attemptCount && attemptCount >= 3 && stepData && !correctSolution && !loadingSolution) {
      console.log('Fetching solution for step:', stepData.stepNumber);
      setLoadingSolution(true);
      generateStepSolution(stepData)
        .then((solution) => {
          console.log('Solution received:', solution);
          setCorrectSolution({
            answer: solution.correctAnswer,
            explanation: solution.correctExplanation
          });
        })
        .catch((error) => {
          console.error('Failed to generate solution:', error);
          // Set a fallback message
          setCorrectSolution({
            answer: 'Unable to generate answer automatically',
            explanation: 'Please ask your teacher or check the textbook for the correct solution. The AI service is temporarily unavailable.'
          });
        })
        .finally(() => {
          setLoadingSolution(false);
        });
    }
  }, [attemptCount, stepData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Notify parent when chat messages change
  useEffect(() => {
    console.log('💬 BothWrongScreen: Chat messages updated, notifying parent:', chatMessages);
    if (onChatMessagesChange) {
      onChatMessagesChange(chatMessages);
    }
  }, [chatMessages, onChatMessagesChange]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || queriesRemaining <= 0 || isAskingAI) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Decrement queries
    setQueriesRemaining(prev => prev - 1);
    if (onAIQueryUsed) onAIQueryUsed();
    
    setIsAskingAI(true);
    
    try {
      // Call AI service with ENHANCED context including original question, step data, images, and chat history
      const aiResponse = await askAIForHelp(userMessage, {
        stepNumber: stepNumber,
        hint: hint,
        userAnswer: userAnswer,
        userExplanation: userExplanation,
        answerCorrect: false,
        explanationCorrect: false,
        originalQuestion: originalQuestion,  // Pass the original problem
        stepData: stepData,  // Pass full step context with formula and diagram
        answerImageUrl: answerImageUrl,  // Pass answer image if exists
        explanationImageUrl: explanationImageUrl,  // Pass explanation image if exists
        previousMessages: chatMessages  // Pass conversation history
      });
      
      // Add AI response to chat
      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('Error asking AI:', error);
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsAskingAI(false);
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
        <span className="text-[15px] font-medium text-gray-900">Step {stepNumber} Feedback</span>
        <div className="w-16"></div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50">
        <div className="space-y-6">
          {/* AI Chat Section - Show first when incorrect */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-purple-600" />
                <p className="text-[13px] font-semibold text-purple-900">Ask AI for Help</p>
              </div>
              <div className="flex items-center gap-2">
                <RenderTextFormulaButton
                  enabled={normalizeRenderedContent}
                  onToggle={() => setNormalizeRenderedContent((prev) => !prev)}
                />
                <span className="text-[11px] font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                  {queriesRemaining}/4 queries left
                </span>
              </div>
            </div>

            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <div className="bg-white rounded-lg p-3 mb-3 max-h-[150px] overflow-y-auto space-y-2">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`text-[12px] ${msg.role === 'ai' ? 'bg-gray-50' : 'bg-blue-50'} p-2.5 rounded-lg`}>
                    <p className="font-semibold mb-1 text-[11px]">
                      {msg.role === 'ai' ? '🤖 AI Tutor' : '👤 You'}
                    </p>
                    <MathRenderer content={msg.content} className="text-[12px]" normalizeContent={normalizeRenderedContent} />
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Chat input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question to get scaffolding help..."
                disabled={queriesRemaining <= 0 || isAskingAI}
                className="flex-1 px-3 py-2.5 bg-white border border-purple-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              />
              <button
                onClick={handleSendMessage}
                disabled={isAskingAI || queriesRemaining <= 0 || !chatInput.trim()}
                className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-[13px] font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isAskingAI ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Send
                  </>
                )}
              </button>
            </div>

            {queriesRemaining === 0 && (
              <p className="text-[11px] text-red-600 mt-2">
                You've used all 4 queries for this step. Try solving on your own!
              </p>
            )}
          </div>

          {/* Error Icon and Message */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle size={48} className="text-red-600" strokeWidth={2} />
            </div>
            <h2 className="text-[20px] font-bold text-gray-900 mb-2">
              Not Quite Right
            </h2>
            <p className="text-[14px] text-gray-600">
              Both your answer and explanation need some work. Let's review and try again!
            </p>
          </div>

          {/* What You Submitted */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-red-200">
            <h3 className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-2">
              <XCircle size={18} className="text-red-600" />
              What You Submitted
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Your Answer ❌
                </p>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <MathRenderer content={userAnswer || "(No answer provided)"} className="text-[13px] text-gray-800" normalizeContent={normalizeRenderedContent} />
                </div>
                <p className="text-[10px] text-red-600 mt-1 italic">
                  This answer needs correction - check your calculations
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Your Explanation ❌
                </p>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <MathRenderer content={userExplanation || "(No explanation provided)"} className="text-[13px] text-gray-800" normalizeContent={normalizeRenderedContent} />
                </div>
                <p className="text-[10px] text-red-600 mt-1 italic">
                  Your reasoning needs improvement - review the hint below
                </p>
              </div>
            </div>
          </div>

          {/* AI Hint */}
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-yellow-600" />
              Hint to Help You
            </h3>
            <MathRenderer content={hint} className="text-[13px] text-gray-700" normalizeContent={normalizeRenderedContent} />
          </div>

          {/* Show Correct Answer After 3 Attempts */}
          {attemptCount && attemptCount >= 3 && stepData && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 shadow-lg border-2 border-green-300">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-green-900 mb-1">
                    📚 Here's the Correct Solution
                  </h3>
                  <p className="text-[11px] text-green-700">
                    You've attempted this step 3 times. Let's learn from the correct approach!
                  </p>
                </div>
              </div>
              
              {loadingSolution ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-8 h-8 border-4 border-green-300 border-t-green-600 rounded-full animate-spin"></div>
                  <span className="ml-3 text-[13px] text-green-700">Generating solution...</span>
                </div>
              ) : correctSolution ? (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-[11px] font-semibold text-green-800 uppercase tracking-wide mb-2">
                      ✅ Correct Answer
                    </p>
                    <MathRenderer content={correctSolution.answer} className="text-[14px] text-gray-900 font-semibold" normalizeContent={normalizeRenderedContent} />
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-[11px] font-semibold text-green-800 uppercase tracking-wide mb-2">
                      📝 Correct Explanation
                    </p>
                    <MathRenderer content={correctSolution.explanation} className="text-[13px] text-gray-800 leading-relaxed" normalizeContent={normalizeRenderedContent} />
                  </div>

                  <div className="bg-green-100 rounded-lg p-3 border border-green-300">
                    <p className="text-[11px] font-semibold text-green-900 mb-2">
                      💡 Study this solution carefully. Compare it with your answer to understand where you went wrong. When you're ready, you can retry this step!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-[12px] text-gray-600">
                    Failed to generate solution. Please try again or contact support.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Encouragement */}
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
            <h3 className="text-[14px] font-bold text-blue-900 mb-2">💡 Tips for Success</h3>
            <ul className="space-y-2 text-[13px] text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Read the hint carefully and think about what it's suggesting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Show your work step-by-step in your explanation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Double-check your calculations before submitting</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* DIAGNOSTIC BUTTON - Remove after debugging */}
            <button
              onClick={() => {
                console.log('🧪 DIAGNOSTIC: Current state:');
                console.log('  - chatMessages:', chatMessages);
                console.log('  - chatMessages.length:', chatMessages.length);
                console.log('  - onChatMessagesChange exists:', !!onChatMessagesChange);
                console.log('  - onTryAgain exists:', !!onTryAgain);
              }}
              className="w-full h-[40px] bg-purple-600 text-white rounded-xl font-medium text-[13px] shadow-md hover:bg-purple-700 active:bg-purple-800 transition-colors"
            >
              🧪 Debug: Show Current State
            </button>
            
            <button
              onClick={() => {
                console.log('🔘 Try Again button clicked, chat messages:', chatMessages);
                onTryAgain?.(chatMessages);
              }}
              className="w-full h-[48px] bg-blue-600 text-white rounded-xl font-medium text-[15px] shadow-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="w-full h-[48px] bg-white text-gray-700 border border-gray-300 rounded-xl font-medium text-[15px] hover:bg-gray-50 transition-colors"
            >
              Review Problem
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
