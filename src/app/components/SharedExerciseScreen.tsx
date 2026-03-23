import { ArrowLeft, Home, Archive, Users, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MathRenderer } from './MathRenderer';

interface SharedQuestion {
  id: string;
  question: string;
  imageUrl?: string;
  sharedBy: string;
  sharedAt: string;
}

interface SharedExerciseScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onArchiveClick?: () => void;
  onStartQuestion: (question: string, imageUrl?: string) => void;
  sessionId?: string;
}

export const SharedExerciseScreen = ({ 
  onBack, 
  onHomeClick, 
  onArchiveClick,
  onStartQuestion,
  sessionId 
}: SharedExerciseScreenProps) => {
  const [sharedQuestions, setSharedQuestions] = useState<SharedQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedQuestions();
  }, [sessionId]);

  const loadSharedQuestions = async () => {
    try {
      setLoading(true);
      // Get shared questions from localStorage for now
      const stored = localStorage.getItem(`shared_questions_${sessionId || 'default'}`);
      if (stored) {
        const questions = JSON.parse(stored);
        setSharedQuestions(questions);
      }
      console.log('✅ Loaded shared questions');
    } catch (error) {
      console.error('❌ Error loading shared questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = sharedQuestions.filter(q => q.id !== id);
    setSharedQuestions(updated);
    localStorage.setItem(`shared_questions_${sessionId || 'default'}`, JSON.stringify(updated));
    console.log('✅ Deleted shared question:', id);
  };

  const handleStartQuestion = (question: SharedQuestion) => {
    onStartQuestion(question.question, question.imageUrl);
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <Users size={20} className="text-purple-600" />
        </div>
        <h1 className="text-[18px] font-semibold text-gray-900">Shared Exercise</h1>
        <div className="flex items-center gap-3">
          <button onClick={onHomeClick} className="p-1">
            <Home size={20} className="text-gray-700" />
          </button>
          <button onClick={onArchiveClick} className="p-1">
            <Archive size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
        <p className="text-[13px] font-semibold text-purple-900 mb-1">
          📚 Questions Shared With You
        </p>
        <p className="text-[12px] text-purple-700">
          These are questions your friends have shared with you. Click to start solving!
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading shared questions...</p>
          </div>
        ) : sharedQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <Users size={48} className="text-gray-300 mb-4" />
            <p className="text-[16px] font-semibold text-gray-900 mb-2">
              No Shared Questions Yet
            </p>
            <p className="text-[14px] text-gray-600 max-w-md">
              When friends share questions with you, they'll appear here. Ask a friend to share their question link with you!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharedQuestions.map((question) => (
              <div
                key={question.id}
                role="button"
                tabIndex={0}
                onClick={() => handleStartQuestion(question)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleStartQuestion(question);
                  }
                }}
                className="border-2 border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-blue-50 hover:shadow-md transition-all cursor-pointer"
              >
                {/* Header with shared info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Users size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-gray-900">
                        {question.sharedBy}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {question.sharedAt}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteQuestion(question.id);
                    }}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>

                {/* Question content */}
                <div className="bg-white rounded-lg p-3 mb-3 border border-purple-100">
                  {question.imageUrl ? (
                    <div className="space-y-2">
                      {question.question && (
                        <div className="text-[14px] text-gray-700 mb-2">
                          <MathRenderer content={question.question} />
                        </div>
                      )}
                      <img
                        src={question.imageUrl}
                        alt="Question"
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                      />
                    </div>
                  ) : (
                    <div className="text-[14px] text-gray-700">
                      <MathRenderer content={question.question} />
                    </div>
                  )}
                </div>

                {/* Action button */}
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleStartQuestion(question);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-[14px] font-medium hover:shadow-lg transition-all active:scale-95"
                >
                  Start Solving
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
