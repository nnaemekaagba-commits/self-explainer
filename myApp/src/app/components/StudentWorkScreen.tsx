import { ArrowLeft, Home, Archive, MessageSquare, FileText, Clock, Trash2, XCircle, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAllActivityLogs, ActivityLog, clearAllActivityLogs, deleteActivityLogs } from '../../services/activityLogService';
import { MathRenderer } from './MathRenderer';
import * as XLSX from 'xlsx';

interface StudentWorkScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
}

export function StudentWorkScreen({ onBack, onHomeClick }: StudentWorkScreenProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [expandedChat, setExpandedChat] = useState<string | null>(null); // Track which chat is expanded
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadActivityLogs();
  }, []);

  const loadActivityLogs = async () => {
    setLoading(true);
    try {
      const logs = await getAllActivityLogs();
      console.log('📊 Loaded activity logs:', logs);
      
      // Debug: Check if any attempts have chat messages
      logs.forEach(log => {
        log.steps.forEach(step => {
          step.attempts.forEach(attempt => {
            if (attempt.chatMessages && attempt.chatMessages.length > 0) {
              console.log(`✅ Found chat messages in log ${log.id}, step ${step.stepNumber}, attempt ${attempt.attemptNumber}:`, attempt.chatMessages);
            } else {
              console.log(`❌ No chat messages in log ${log.id}, step ${step.stepNumber}, attempt ${attempt.attemptNumber}`);
            }
          });
        });
      });
      
      // Sort by most recent first
      const sortedLogs = logs.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
      setActivityLogs(sortedLogs);
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await clearAllActivityLogs();
      setActivityLogs([]);
    } catch (error) {
      console.error('Failed to clear activity logs:', error);
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      await deleteActivityLogs(Array.from(selectedLogs));
      setActivityLogs(prevLogs => prevLogs.filter(log => !selectedLogs.has(log.id)));
      setSelectedLogs(new Set());
    } catch (error) {
      console.error('Failed to delete selected activity logs:', error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setSelectionMode(false);
    }
  };

  const toggleSelection = (logId: string) => {
    const newSelection = new Set(selectedLogs);
    if (newSelection.has(logId)) {
      newSelection.delete(logId);
    } else {
      newSelection.add(logId);
    }
    setSelectedLogs(newSelection);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (!selectionMode) {
      setSelectedLogs(new Set());
    }
  };

  const exportToExcel = () => {
    const worksheetData: any[] = [
      ['ID', 'Status', 'Started At', 'Question', 'Total Attempts', 'Total AI Queries Used', 'Total Correct Responses']
    ];

    activityLogs.forEach(log => {
      worksheetData.push([
        log.id,
        log.status,
        log.startedAt,
        log.question,
        log.totalAttempts,
        log.totalAIQueriesUsed,
        log.totalCorrectResponses
      ]);

      log.steps.forEach(step => {
        step.attempts.forEach(attempt => {
          worksheetData.push([
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            `Step ${step.stepNumber}`,
            attempt.attemptNumber,
            attempt.timestamp,
            attempt.answerCorrect ? '✓ Answer' : '✗ Answer',
            attempt.explanationCorrect ? '✓ Explanation' : '✗ Explanation',
            attempt.userAnswer || "(No answer provided)",
            attempt.userExplanation || "(No explanation provided)",
            attempt.chatMessages ? attempt.chatMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n') : '',
            attempt.aiQueriesUsed
          ]);
        });
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Work');
    XLSX.writeFile(workbook, 'student_work.xlsx');
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
        </div>
        <h1 className="text-[18px] font-semibold text-gray-900">Student Work</h1>
        <div className="flex items-center gap-3">
          <button onClick={onHomeClick} className="p-1">
            <Home size={20} className="text-gray-700" />
          </button>
          <FileText size={20} className="text-blue-600" />
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] text-gray-700">
            📝 Complete record of student answers, explanations, and AI conversations
          </p>
          {activityLogs.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={loadActivityLogs}
                className="text-[12px] font-semibold px-3 py-1 rounded-lg transition-all bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-1"
              >
                🔄 Reload
              </button>
              <button
                onClick={exportToExcel}
                className="text-[12px] font-semibold px-3 py-1 rounded-lg transition-all bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
              >
                <Download size={14} />
                Export
              </button>
              <button
                onClick={toggleSelectionMode}
                className={`text-[12px] font-semibold px-3 py-1 rounded-lg transition-all ${
                  selectionMode
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {selectionMode ? 'Cancel' : 'Select'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="ml-3 text-[14px] text-gray-600">Loading student work...</span>
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText size={48} className="text-gray-300 mb-3" />
            <p className="text-[15px] text-gray-500 font-medium">No student work yet</p>
            <p className="text-[13px] text-gray-400 mt-1">Complete some problems to see work here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activityLogs.map((log) => {
              const isExpanded = expandedActivity === log.id;
              const hasAttempts = log.steps.some(step => step.attempts.length > 0);

              return (
                <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Activity Header */}
                  <div className="flex items-center">
                    {selectionMode && (
                      <div className="pl-4">
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log.id)}
                          onChange={() => toggleSelection(log.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedActivity(isExpanded ? null : log.id)}
                      className="w-full px-4 py-3 flex items-start justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.status === 'completed' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {log.status === 'completed' ? '✓ COMPLETED' : '⏳ IN PROGRESS'}
                          </span>
                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(log.startedAt)}
                          </span>
                        </div>
                        <MathRenderer content={log.question} className="text-[14px] font-medium text-gray-900 line-clamp-2" />
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-600">
                          <span>📊 {log.totalAttempts} attempts</span>
                          <span>💬 {log.totalAIQueriesUsed} AI queries</span>
                          <span>✅ {log.totalCorrectResponses} correct</span>
                        </div>
                      </div>
                      <div className={`ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        <span className="text-gray-400">▼</span>
                      </div>
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 space-y-3">
                      {!hasAttempts ? (
                        <p className="text-[12px] text-gray-500 italic py-2">
                          No attempts recorded yet for this activity
                        </p>
                      ) : (
                        log.steps.map((step) => {
                          if (step.attempts.length === 0) return null;
                          
                          const stepKey = `${log.id}-step-${step.stepNumber}`;
                          const isStepExpanded = expandedStep === stepKey;

                          return (
                            <div key={stepKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              {/* Step Header */}
                              <button
                                onClick={() => setExpandedStep(isStepExpanded ? null : stepKey)}
                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-bold text-blue-600">
                                    Step {step.stepNumber}
                                  </span>
                                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                                    step.completed 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {step.attempts.length} attempt{step.attempts.length !== 1 ? 's' : ''}
                                  </span>
                                  <span className="text-[11px] text-gray-500">
                                    💬 {step.totalAIQueries} AI queries
                                  </span>
                                </div>
                                <div className={`transition-transform ${isStepExpanded ? 'rotate-180' : ''}`}>
                                  <span className="text-gray-400 text-[12px]">▼</span>
                                </div>
                              </button>

                              {/* Step Attempts */}
                              {isStepExpanded && (
                                <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-3">
                                  {step.attempts.map((attempt, attemptIndex) => {
                                    const chatKey = `${stepKey}-attempt-${attemptIndex}`;
                                    const isChatExpanded = expandedChat === chatKey;
                                    
                                    // 🔍 DEBUG: Log attempt data to see what we have
                                    console.log('🔍 RENDERING ATTEMPT:', {
                                      stepNumber: step.stepNumber,
                                      attemptNumber: attempt.attemptNumber,
                                      aiQueriesUsed: attempt.aiQueriesUsed,
                                      hasChatMessages: !!attempt.chatMessages,
                                      chatMessagesLength: attempt.chatMessages?.length,
                                      chatMessages: attempt.chatMessages,
                                      fullAttempt: attempt
                                    });
                                    
                                    return (
                                    <div key={attemptIndex} className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
                                      {/* Attempt Header */}
                                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[12px] font-bold text-gray-700">
                                            Attempt #{attempt.attemptNumber}
                                          </span>
                                          <span className="text-[10px] text-gray-500">
                                            {formatTime(attempt.timestamp)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {attempt.answerCorrect ? (
                                            <span className="text-[9px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                              ✓ Answer
                                            </span>
                                          ) : (
                                            <span className="text-[9px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                              ✗ Answer
                                            </span>
                                          )}
                                          {attempt.explanationCorrect ? (
                                            <span className="text-[9px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                              ✓ Explanation
                                            </span>
                                          ) : (
                                            <span className="text-[9px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                              ✗ Explanation
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Student Answer */}
                                      <div>
                                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                          📝 Student Answer
                                        </p>
                                        <div className={`p-2 rounded-lg border ${
                                          attempt.answerCorrect 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-red-50 border-red-200'
                                        }`}>
                                          {attempt.answerImageUrl ? (
                                            <div>
                                              <p className="text-[9px] text-gray-600 mb-1">📸 Uploaded answer:</p>
                                              <img 
                                                src={attempt.answerImageUrl} 
                                                alt="Student's answer" 
                                                className="max-w-full h-auto rounded border border-gray-300"
                                              />
                                            </div>
                                          ) : (
                                            <MathRenderer 
                                              content={attempt.userAnswer || "(No answer provided)"} 
                                              className="text-[12px] text-gray-800"
                                            />
                                          )}
                                        </div>
                                      </div>

                                      {/* Student Explanation */}
                                      <div>
                                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                          💭 Student Explanation
                                        </p>
                                        <div className={`p-2 rounded-lg border ${
                                          attempt.explanationCorrect 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-red-50 border-red-200'
                                        }`}>
                                          {attempt.explanationImageUrl ? (
                                            <div>
                                              <p className="text-[9px] text-gray-600 mb-1">📸 Uploaded explanation:</p>
                                              <img 
                                                src={attempt.explanationImageUrl} 
                                                alt="Student's explanation" 
                                                className="max-w-full h-auto rounded border border-gray-300"
                                              />
                                            </div>
                                          ) : (
                                            <MathRenderer 
                                              content={attempt.userExplanation || "(No explanation provided)"} 
                                              className="text-[12px] text-gray-800"
                                            />
                                          )}
                                        </div>
                                      </div>

                                      {/* AI Query Count - Clickable */}
                                      {attempt.aiQueriesUsed > 0 && (
                                        <div className="pt-2 border-t border-gray-100">
                                          <button
                                            onClick={() => setExpandedChat(isChatExpanded ? null : chatKey)}
                                            className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-purple-50 transition-colors group"
                                          >
                                            <div className="flex items-center gap-2">
                                              <MessageSquare size={14} className="text-purple-600" />
                                              <span className="text-[11px] font-semibold text-purple-600">
                                                {attempt.aiQueriesUsed} AI {attempt.aiQueriesUsed === 1 ? 'query' : 'queries'}
                                              </span>
                                              <span className="text-[9px] text-gray-500 group-hover:text-purple-600">
                                                (Click to {isChatExpanded ? 'hide' : 'view'} conversation)
                                              </span>
                                            </div>
                                            <div className={`transition-transform ${isChatExpanded ? 'rotate-180' : ''}`}>
                                              <span className="text-purple-400 text-[10px]">▼</span>
                                            </div>
                                          </button>

                                          {/* AI Conversation - Expandable */}
                                          {isChatExpanded && (
                                            <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto p-2 bg-purple-50 rounded-lg border border-purple-100">
                                              {attempt.chatMessages && attempt.chatMessages.length > 0 ? (
                                                <>
                                                  <p className="text-[9px] font-bold text-purple-700 uppercase tracking-wide mb-2">
                                                    💬 AI Conversation ({attempt.chatMessages.length} messages)
                                                  </p>
                                                  {attempt.chatMessages.map((msg, msgIndex) => (
                                                    <div 
                                                      key={msgIndex} 
                                                      className={`p-2 rounded-lg ${
                                                        msg.role === 'ai' 
                                                          ? 'bg-white border border-purple-200' 
                                                          : 'bg-blue-50 border border-blue-200'
                                                      }`}
                                                    >
                                                      <div className="flex items-center justify-between mb-1">
                                                        <p className="font-semibold text-[10px]">
                                                          {msg.role === 'ai' ? '🤖 AI Tutor' : '👤 Student'}
                                                        </p>
                                                        <span className="text-[9px] text-gray-500">
                                                          {msg.timestamp ? formatTime(msg.timestamp) : ''}
                                                        </span>
                                                      </div>
                                                      <MathRenderer 
                                                        content={msg.content} 
                                                        className="text-[11px] text-gray-700"
                                                      />
                                                    </div>
                                                  ))}
                                                </>
                                              ) : (
                                                <div className="p-3 text-center">
                                                  <p className="text-[11px] text-gray-600 italic">
                                                    ⚠️ No chat messages found for this attempt
                                                  </p>
                                                  <p className="text-[10px] text-gray-500 mt-1">
                                                    This might be due to a bug in the logging system
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Button */}
      {activityLogs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-2 bg-red-50 border-t border-gray-200 z-10">
          {selectionMode ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedLogs.size === 0}
              className={`w-full py-2 bg-orange-600 text-white rounded-lg font-semibold text-[13px] shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 ${
                selectedLogs.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Trash2 size={16} />
              Delete Selected ({selectedLogs.size})
            </button>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold text-[13px] shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Clear All Student Work & Chats
            </button>
          )}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-gray-900">Clear All Student Work</h2>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle size={20} className="text-gray-500" />
              </button>
            </div>
            <p className="text-[13px] text-gray-600 mb-6">
              Are you sure you want to clear all student work and chats? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold text-[14px] hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className={`py-2 px-4 bg-red-600 text-white rounded-xl font-semibold text-[14px] hover:bg-red-700 transition-colors flex items-center gap-2 ${clearing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {clearing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Clear All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-gray-900">Delete Selected Student Work</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle size={20} className="text-gray-500" />
              </button>
            </div>
            <p className="text-[13px] text-gray-600 mb-6">
              Are you sure you want to delete the selected student work and chats? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold text-[14px] hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className={`py-2 px-4 bg-red-600 text-white rounded-xl font-semibold text-[14px] hover:bg-red-700 transition-colors flex items-center gap-2 ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Selected</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}