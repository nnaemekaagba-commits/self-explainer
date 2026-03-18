import { ArrowLeft, Home, TrendingUp, CheckCircle, XCircle, MessageCircle, Clock, Trash2, FileText, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAllActivityLogs, ActivityLog, clearAllActivityLogs } from '../../services/activityLogService';

interface ActivityLogScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onStudentWorkClick?: () => void;
}

export function ActivityLogScreen({ onBack, onHomeClick, onStudentWorkClick }: ActivityLogScreenProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const fetchedLogs = await getAllActivityLogs();
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '< 1 min';
    if (diffMins < 60) return `${diffMins} mins`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  // Group logs by learning thread
  const groupedLogs = logs.reduce((acc, log) => {
    const threadId = log.learningThreadId || log.id;
    if (!acc[threadId]) {
      acc[threadId] = [];
    }
    acc[threadId].push(log);
    return acc;
  }, {} as Record<string, ActivityLog[]>);

  // Sort each thread by date and determine if it has multiple questions
  const sortedThreads = Object.entries(groupedLogs).map(([threadId, threadLogs]) => {
    const sorted = threadLogs.sort((a, b) => 
      new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );
    return {
      threadId,
      logs: sorted,
      hasMultiple: sorted.length > 1
    };
  }).sort((a, b) => 
    new Date(b.logs[0].startedAt).getTime() - new Date(a.logs[0].startedAt).getTime()
  );

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      await clearAllActivityLogs();
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear activity logs:', error);
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  if (selectedLog) {
    return (
      <div className="h-full bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={() => setSelectedLog(null)} className="p-1">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h1 className="text-[18px] font-semibold text-gray-900">Activity Details</h1>
          <button onClick={onHomeClick} className="p-1">
            <Home size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Activity Summary */}
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
          <p className="text-[12px] font-semibold text-purple-900 mb-1">
            {selectedLog.question}
          </p>
          <div className="flex gap-4 text-[10px] text-purple-700">
            <span>Started: {formatDate(selectedLog.startedAt)}</span>
            {selectedLog.completedAt && (
              <span>Completed: {formatDate(selectedLog.completedAt)}</span>
            )}
          </div>
          {selectedLog.isPractice && (
            <div className="mt-2 flex items-center gap-1">
              <Link2 size={12} className="text-blue-600" />
              <span className="text-[10px] text-blue-700 font-semibold">Practice Problem</span>
            </div>
          )}
        </div>

        {/* Overall Stats */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-[20px] font-bold text-green-600">
                {selectedLog.totalCorrectResponses}
              </p>
              <p className="text-[9px] text-gray-600">Correct Answers</p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-bold text-blue-600">
                {selectedLog.totalAttempts}
              </p>
              <p className="text-[9px] text-gray-600">Total Attempts</p>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-bold text-purple-600">
                {selectedLog.totalAIQueriesUsed}
              </p>
              <p className="text-[9px] text-gray-600">AI Queries</p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Breakdown */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <h3 className="text-[13px] font-semibold text-gray-900 mb-3">Step Breakdown</h3>
          
          {selectedLog.steps.map((step) => (
            <div key={step.stepNumber} className="mb-4 bg-white border border-gray-200 rounded-lg p-3">
              {/* Step Header */}
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[12px] font-semibold text-gray-900">
                  Step {step.stepNumber}
                </h4>
                {step.completed ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <Clock size={16} className="text-gray-400" />
                )}
              </div>

              {/* Step Stats */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-blue-50 rounded p-2 text-center">
                  <p className="text-[14px] font-bold text-blue-600">
                    {step.attempts.length}
                  </p>
                  <p className="text-[8px] text-blue-700">Attempts</p>
                </div>
                <div className="bg-purple-50 rounded p-2 text-center">
                  <p className="text-[14px] font-bold text-purple-600">
                    {step.totalAIQueries}
                  </p>
                  <p className="text-[8px] text-purple-700">AI Queries</p>
                </div>
                <div className={`rounded p-2 text-center ${
                  step.completed ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <p className={`text-[14px] font-bold ${
                    step.completed ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {step.correctAttemptNumber || '-'}
                  </p>
                  <p className={`text-[8px] ${
                    step.completed ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    Correct At
                  </p>
                </div>
              </div>

              {/* Attempt History */}
              {step.attempts.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-semibold text-gray-700 mb-1">Attempt History:</p>
                  <div className="space-y-1">
                    {step.attempts.map((attempt, idx) => (
                      <div key={idx} className="text-[9px] flex items-center gap-2 pl-2">
                        <span className="text-gray-500">#{attempt.attemptNumber}</span>
                        {attempt.answerCorrect ? (
                          <CheckCircle size={10} className="text-green-600" />
                        ) : (
                          <XCircle size={10} className="text-red-600" />
                        )}
                        <span className={attempt.answerCorrect ? 'text-green-700' : 'text-red-700'}>
                          Answer
                        </span>
                        {attempt.explanationCorrect ? (
                          <CheckCircle size={10} className="text-green-600" />
                        ) : (
                          <XCircle size={10} className="text-red-600" />
                        )}
                        <span className={attempt.explanationCorrect ? 'text-green-700' : 'text-red-700'}>
                          Explanation
                        </span>
                        {attempt.aiQueriesUsed > 0 && (
                          <>
                            <MessageCircle size={10} className="text-purple-600" />
                            <span className="text-purple-700">{attempt.aiQueriesUsed} AI</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View Student Work Button */}
        {onStudentWorkClick && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onStudentWorkClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-[14px] hover:shadow-lg transition-all active:scale-95"
            >
              <FileText size={18} />
              <span>View Student Work and Chats</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
        <h1 className="text-[18px] font-semibold text-gray-900">Activity Log</h1>
        <button onClick={onHomeClick} className="p-1">
          <Home size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-gray-500">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <TrendingUp size={48} className="text-gray-300 mb-3" />
            <p className="text-[14px] font-semibold text-gray-700 mb-1">No Activities Yet</p>
            <p className="text-[12px] text-gray-500 text-center">
              Your learning progress will appear here once you start solving problems.
            </p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-4">
            {sortedThreads.map((thread) => (
              <div key={thread.threadId} className={thread.hasMultiple ? 'border-2 border-purple-200 rounded-lg p-3 bg-purple-50/30' : ''}>
                {thread.hasMultiple && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200">
                    <Link2 size={14} className="text-purple-600" />
                    <span className="text-[11px] font-semibold text-purple-900">
                      Learning Thread ({thread.logs.length} questions)
                    </span>
                  </div>
                )}
                
                <div className={thread.hasMultiple ? 'space-y-2' : 'space-y-3'}>
                  {thread.logs.map((log, idx) => (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`w-full text-left bg-white border rounded-lg p-3 hover:border-purple-300 hover:shadow-sm transition-all ${
                        thread.hasMultiple 
                          ? idx === 0 
                            ? 'border-purple-300' 
                            : 'border-blue-200 ml-4' 
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Question */}
                      <div className="flex items-start gap-2 mb-2">
                        {thread.hasMultiple && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                            log.isPractice 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {log.isPractice ? 'Practice' : 'Original'}
                          </span>
                        )}
                        <p className="text-[12px] font-semibold text-gray-900 flex-1">
                          {log.question}
                        </p>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-green-600">
                            {log.totalCorrectResponses}
                          </p>
                          <p className="text-[8px] text-gray-600">Correct</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-blue-600">
                            {log.totalAttempts}
                          </p>
                          <p className="text-[8px] text-gray-600">Attempts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-purple-600">
                            {log.totalAIQueriesUsed}
                          </p>
                          <p className="text-[8px] text-gray-600">AI Help</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-gray-600">
                            {getDuration(log.startedAt, log.completedAt)}
                          </p>
                          <p className="text-[8px] text-gray-600">Duration</p>
                        </div>
                      </div>

                      {/* Status and Date */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                          log.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          {formatDate(log.startedAt)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Logs Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-[16px] font-bold text-gray-900 mb-2">Clear All Activity Logs?</h3>
            <p className="text-[13px] text-gray-600 mb-6">
              This will permanently delete all activity logs and learning progress. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-semibold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearLogs}
                disabled={clearing}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-[13px] font-semibold hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Button */}
      {logs.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-300 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-400 transition-all active:scale-95"
          >
            <Trash2 size={16} />
            <span className="text-[13px] font-semibold">Clear All Activity Logs</span>
          </button>
        </div>
      )}
    </div>
  );
}
