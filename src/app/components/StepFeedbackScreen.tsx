import { ArrowLeft, UserPlus, Archive, CheckCircle, XCircle, Lightbulb, RotateCcw, Home, Send, MessageCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { askAIForHelp, generateDiagram } from '../../services/aiService';
import { MathRenderer } from './MathRenderer';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  diagram?: { svg?: string; imageUrl?: string; concept: string };
}

interface StepFeedbackScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onInviteClick?: () => void;
  onCoLearnClick?: () => void;
  answerCorrect?: boolean;
  explanationCorrect?: boolean;
  feedbackData?: {
    stepNumber: number;
    hint: string;
    userAnswer: string;
    userExplanation: string;
    answerCorrect: boolean;
    explanationCorrect: boolean;
    feedback?: string;
    answerFeedback?: string;
    explanationFeedback?: string;
    answerImageUrl?: string;
    explanationImageUrl?: string;
    diagram?: { svg?: string; imageUrl?: string; concept: string };
  };
  onAIQueryUsed?: () => void;
  onChatMessagesChange?: (messages: ChatMessage[]) => void;
  onContinueToNextStep?: () => void;
}

export const StepFeedbackScreen = ({ 
  onBack, 
  onHomeClick, 
  onArchiveClick, 
  onInviteClick, 
  onCoLearnClick, 
  answerCorrect = true, 
  explanationCorrect = true,
  feedbackData,
  onAIQueryUsed,
  onChatMessagesChange,
  onContinueToNextStep
}: StepFeedbackScreenProps) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [queriesRemaining, setQueriesRemaining] = useState(4);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const allCorrect = answerCorrect && explanationCorrect;
  const allWrong = !answerCorrect && !explanationCorrect;


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (onChatMessagesChange) {
      onChatMessagesChange(chatMessages);
    }
  }, [chatMessages, onChatMessagesChange]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || queriesRemaining <= 0 || isAskingAI) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setQueriesRemaining(prev => prev - 1);
    if (onAIQueryUsed) onAIQueryUsed();
    
    setIsAskingAI(true);
    
    try {
      const aiResponse = await askAIForHelp(userMessage, {
        stepNumber: feedbackData?.stepNumber || 1,
        hint: feedbackData?.hint || '',
        userAnswer: feedbackData?.userAnswer || '',
        userExplanation: feedbackData?.userExplanation || '',
        answerCorrect: feedbackData?.answerCorrect || false,
        explanationCorrect: feedbackData?.explanationCorrect || false
      });
      
      const needsDiagram = shouldGenerateDiagram(userMessage, aiResponse);
      let diagramData = undefined;
      
      if (needsDiagram) {
        try {
          console.log('🎨 Generating diagram for concept:', needsDiagram);
          diagramData = await generateDiagram(needsDiagram, userMessage);
        } catch (diagramError) {
          console.error('Failed to generate diagram:', diagramError);
        }
      }
      
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: aiResponse,
        diagram: diagramData
      }]);
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

  const shouldGenerateDiagram = (question: string, response: string): string | null => {
    const combined = `${question} ${response}`.toLowerCase();
    
    const diagramKeywords = [
      { keywords: ['free body diagram', 'fbd', 'forces on'], concept: 'free body diagram' },
      { keywords: ['friction', 'normal force', 'friction force'], concept: 'friction forces and normal force' },
      { keywords: ['projectile', 'trajectory', 'parabolic motion'], concept: 'projectile motion' },
      { keywords: ['incline', 'ramp', 'slope'], concept: 'forces on an inclined plane' },
      { keywords: ['tension', 'rope', 'pulley'], concept: 'tension forces system' },
      { keywords: ['circular motion', 'centripetal'], concept: 'circular motion forces' },
      { keywords: ['vector', 'component'], concept: 'vector components' },
      { keywords: ['angle', 'triangle', 'right triangle'], concept: 'triangle with angles and sides' },
      { keywords: ['velocity', 'acceleration', 'displacement'], concept: 'kinematics diagram' },
      { keywords: ['torque', 'moment', 'lever'], concept: 'torque and lever arm' }
    ];
    
    for (const { keywords, concept } of diagramKeywords) {
      if (keywords.some(keyword => combined.includes(keyword))) {
        return concept;
      }
    }
    
    return null;
  };

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
        <h1 className="text-[18px] font-semibold text-gray-900">Step Feedback</h1>
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
      <div className="px-4 py-1.5 bg-purple-50 border-b border-purple-100">
        <p className="text-[11px] font-semibold text-purple-900">
          Step {feedbackData?.stepNumber || 2}: {feedbackData?.hint || 'Plan your approach'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-4">
        {/* Header Icon */}
        <div className="flex flex-col items-center justify-center text-center mb-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1.5 ${
            allCorrect ? 'bg-green-100' : allWrong ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            {allCorrect ? (
              <CheckCircle size={24} className="text-green-600" strokeWidth={2} />
            ) : allWrong ? (
              <XCircle size={24} className="text-red-600" strokeWidth={2} />
            ) : (
              <div className="flex gap-0.5">
                <CheckCircle size={18} className="text-green-600" strokeWidth={2} />
                <XCircle size={18} className="text-red-600" strokeWidth={2} />
              </div>
            )}
          </div>
          <h2 className="text-[13px] font-bold text-gray-900 mb-0.5">
            {allCorrect ? 'Great Job!' : allWrong ? 'Not Quite Right' : 'Almost There!'}
          </h2>
          <p className="text-[10px] text-gray-600 max-w-[260px] leading-tight">
            {allCorrect
              ? "Ready to move to the next step."
              : allWrong
              ? "Your answer needs adjustments. Learning from mistakes is part of the process!"
              : answerCorrect
              ? "Your answer is correct, but your explanation needs improvement."
              : "Your explanation is correct, but check your final answer."
            }
          </p>
        </div>

        {/* Answer Section */}
        <div className={`rounded-md p-2 mb-2 ${
          answerCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            {answerCorrect ? (
              <CheckCircle size={14} className="text-green-600" strokeWidth={2} />
            ) : (
              <XCircle size={14} className="text-red-600" strokeWidth={2} />
            )}
            <p className={`text-[9px] font-medium ${
              answerCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              YOUR ANSWER {answerCorrect ? '(CORRECT)' : '(INCORRECT)'}
            </p>
          </div>
          {feedbackData?.userAnswer && feedbackData.userAnswer !== '[See uploaded image]' ? (
            <MathRenderer 
              content={feedbackData.userAnswer} 
              className="text-[12px] font-semibold text-gray-900 mb-0.5"
            />
          ) : feedbackData?.answerImageUrl ? (
            <div className="mt-1">
              <p className="text-[9px] text-gray-600 mb-1">Uploaded answer:</p>
              <img 
                src={feedbackData.answerImageUrl} 
                alt="Student's answer" 
                className="max-w-full h-auto rounded border border-gray-300"
              />
            </div>
          ) : (
            <p className="text-[12px] font-semibold text-gray-400 mb-0.5 italic">Not provided</p>
          )}

          {(feedbackData?.answerFeedback || feedbackData?.feedback) && (
            <div className={`bg-white border rounded-md p-1.5 mt-1 ${
              answerCorrect ? 'border-green-200' : 'border-orange-200'
            }`}>
              <p className={`text-[9px] font-medium mb-0.5 ${
                answerCorrect ? 'text-green-600' : 'text-orange-600'
              }`}>
                {answerCorrect ? 'Feedback' : 'Review'}
              </p>
              <MathRenderer content={feedbackData.answerFeedback || feedbackData.feedback || ''} className="text-[10px] text-gray-700 leading-tight" />
              {feedbackData.diagram && (
                <div className="mt-2 border border-gray-200 rounded p-2 bg-gray-50">
                  <p className="text-[8px] text-gray-600 mb-1">Explanatory diagram: {feedbackData.diagram.concept}</p>
                  {feedbackData.diagram.imageUrl ? (
                    <img
                      src={feedbackData.diagram.imageUrl}
                      alt={feedbackData.diagram.concept}
                      className="w-full h-auto rounded border border-gray-200 bg-white"
                    />
                  ) : feedbackData.diagram.svg ? (
                    <div dangerouslySetInnerHTML={{ __html: feedbackData.diagram.svg }} className="w-full" />
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explanation Section */}
        <div className={`rounded-md p-2 mb-2 ${
          explanationCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            {explanationCorrect ? (
              <CheckCircle size={14} className="text-green-600" strokeWidth={2} />
            ) : (
              <XCircle size={14} className="text-red-600" strokeWidth={2} />
            )}
            <p className={`text-[9px] font-medium ${
              explanationCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              YOUR EXPLANATION {explanationCorrect ? '(CORRECT)' : '(NEEDS WORK)'}
            </p>
          </div>
          {feedbackData?.userExplanation && feedbackData.userExplanation !== '[See uploaded image]' ? (
            <MathRenderer content={feedbackData.userExplanation} className="text-[10px] text-gray-700 leading-tight mb-0.5" />
          ) : feedbackData?.explanationImageUrl ? (
            <div className="mt-1">
              <p className="text-[9px] text-gray-600 mb-1">Uploaded explanation:</p>
              <img 
                src={feedbackData.explanationImageUrl} 
                alt="Student's explanation" 
                className="max-w-full h-auto rounded border border-gray-300"
              />
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 leading-tight mb-0.5 italic">Not provided</p>
          )}

          {(feedbackData?.explanationFeedback || feedbackData?.feedback) && (
            <div className={`bg-white border rounded-md p-1.5 mt-1 ${
              explanationCorrect ? 'border-green-200' : 'border-orange-200'
            }`}>
              <p className={`text-[9px] font-medium mb-0.5 ${
                explanationCorrect ? 'text-green-600' : 'text-orange-600'
              }`}>
                {explanationCorrect ? 'Feedback' : 'Review'}
              </p>
              <MathRenderer content={feedbackData.explanationFeedback || feedbackData.feedback || ''} className="text-[10px] text-gray-700 leading-tight" />
              {feedbackData.diagram && (
                <div className="mt-2 border border-gray-200 rounded p-2 bg-gray-50">
                  <p className="text-[8px] text-gray-600 mb-1">Explanatory diagram: {feedbackData.diagram.concept}</p>
                  {feedbackData.diagram.imageUrl ? (
                    <img
                      src={feedbackData.diagram.imageUrl}
                      alt={feedbackData.diagram.concept}
                      className="w-full h-auto rounded border border-gray-200 bg-white"
                    />
                  ) : feedbackData.diagram.svg ? (
                    <div dangerouslySetInnerHTML={{ __html: feedbackData.diagram.svg }} className="w-full" />
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions based on status */}
        {allCorrect ? (
          <>
            {/* AI Chat Section */}
            <div className="mb-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-purple-600" />
                  <p className="text-[11px] font-semibold text-purple-900">Ask AI for More Insights</p>
                </div>
                <span className="text-[9px] font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {queriesRemaining}/4 queries left
                </span>
              </div>

              {chatMessages.length > 0 && (
                <div className="bg-white rounded-md p-2 mb-2 max-h-[200px] overflow-y-auto space-y-2">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`text-[10px] ${msg.role === 'ai' ? 'bg-gray-50' : 'bg-blue-50'} p-2 rounded`}>
                      <p className="font-semibold mb-0.5 text-[9px]">
                        {msg.role === 'ai' ? '🤖 AI Tutor' : '👤 You'}
                      </p>
                      <MathRenderer content={msg.content} className="text-[10px]" />
                      {msg.diagram && (
                        <div className="mt-2 border border-gray-200 rounded p-2 bg-white">
                          <p className="text-[8px] text-gray-600 mb-1">📊 Diagram: {msg.diagram.concept}</p>
                          {msg.diagram.imageUrl ? (
                            <img
                              src={msg.diagram.imageUrl}
                              alt={msg.diagram.concept}
                              className="w-full h-auto rounded border border-gray-200 bg-white"
                            />
                          ) : msg.diagram.svg ? (
                            <div dangerouslySetInnerHTML={{ __html: msg.diagram.svg }} className="w-full" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about alternative methods or concepts..."
                  disabled={queriesRemaining <= 0 || isAskingAI}
                  className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-md text-[11px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isAskingAI || queriesRemaining <= 0 || !chatInput.trim()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md text-[11px] font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isAskingAI ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      Send
                    </>
                  )}
                </button>
              </div>

              {queriesRemaining === 0 && (
                <p className="text-[9px] text-red-600 mt-1">
                  You've used all 4 queries for this step.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <button 
                onClick={onContinueToNextStep || onBack}
                className="w-full py-2 bg-green-600 text-white rounded-md text-[12px] font-medium hover:bg-green-700 transition-colors"
              >
                Continue to Next Step
              </button>

              <button onClick={onCoLearnClick} className="w-full py-2 bg-white border border-gray-300 text-gray-900 rounded-md text-[12px] font-medium hover:bg-gray-50 transition-colors">
                View Co-Learners' Explanations
              </button>
            </div>

            <div className="p-2 bg-blue-50 border border-blue-200 rounded-md mt-2">
              <p className="text-[9px] text-blue-600 font-medium mb-0.5">💡 TIP</p>
              <p className="text-[9px] text-gray-700 leading-tight">
                Check co-learn to see how peers approached this!
              </p>
            </div>
          </>
        ) : (
          <>
            {/* AI Chat Section */}
            <div className="mb-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-purple-600" />
                  <p className="text-[11px] font-semibold text-purple-900">Ask AI for Help</p>
                </div>
                <span className="text-[9px] font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {queriesRemaining}/4 queries left
                </span>
              </div>

              {chatMessages.length > 0 && (
                <div className="bg-white rounded-md p-2 mb-2 max-h-[200px] overflow-y-auto space-y-2">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`text-[10px] ${msg.role === 'ai' ? 'bg-gray-50' : 'bg-blue-50'} p-2 rounded`}>
                      <p className="font-semibold mb-0.5 text-[9px]">
                        {msg.role === 'ai' ? '🤖 AI Tutor' : '👤 You'}
                      </p>
                      <MathRenderer content={msg.content} className="text-[10px]" />
                      {msg.diagram && (
                        <div className="mt-2 border border-gray-200 rounded p-2 bg-white">
                          <p className="text-[8px] text-gray-600 mb-1">📊 Diagram: {msg.diagram.concept}</p>
                          {msg.diagram.imageUrl ? (
                            <img
                              src={msg.diagram.imageUrl}
                              alt={msg.diagram.concept}
                              className="w-full h-auto rounded border border-gray-200 bg-white"
                            />
                          ) : msg.diagram.svg ? (
                            <div dangerouslySetInnerHTML={{ __html: msg.diagram.svg }} className="w-full" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question to get scaffolding help..."
                  disabled={queriesRemaining <= 0 || isAskingAI}
                  className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-md text-[11px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isAskingAI || queriesRemaining <= 0 || !chatInput.trim()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md text-[11px] font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isAskingAI ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      Send
                    </>
                  )}
                </button>
              </div>

              {queriesRemaining === 0 && (
                <p className="text-[9px] text-red-600 mt-1">
                  You've used all 4 queries for this step. Try solving on your own!
                </p>
              )}
            </div>

            {!allCorrect && (
              <div className="bg-white border border-gray-200 rounded-md p-2 mb-2">
                <div className="flex items-center gap-1 mb-1">
                  <Lightbulb size={12} className="text-yellow-600" />
                  <p className="text-[10px] font-semibold text-gray-900">Need a hint?</p>
                </div>
                <p className="text-[9px] text-gray-600 mb-1.5 leading-tight">
                  Get a helpful hint to guide you.
                </p>
                <button className="w-full py-1.5 bg-yellow-500 text-white rounded-md text-[10px] font-medium hover:bg-yellow-600 transition-colors">
                  Get Hint
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <button 
                onClick={onBack}
                className="w-full py-2 bg-purple-600 text-white rounded-md text-[12px] font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                {!answerCorrect && !explanationCorrect
                  ? 'Try Again'
                  : !answerCorrect
                  ? 'Recalculate Answer'
                  : 'Revise Explanation'}
              </button>

              <button onClick={onCoLearnClick} className="w-full py-2 bg-white border border-gray-300 text-gray-900 rounded-md text-[12px] font-medium hover:bg-gray-50 transition-colors">
                View Co-Learners' Explanations
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


