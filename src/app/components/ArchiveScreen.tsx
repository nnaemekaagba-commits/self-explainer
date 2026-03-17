import { ArrowLeft, UserPlus, Archive, Home, BarChart3, FileText, TrendingUp, CheckCircle, XCircle, MessageCircle, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getActivities, Activity } from '../../services/archiveService';
import { getAllActivityLogs, ActivityLog, clearAllActivityLogs } from '../../services/activityLogService';
import { MathRenderer } from './MathRenderer';
import * as colearnerChatService from '../../services/colearnerChatService';
import type { CoLearnerChatSession } from '../../services/colearnerChatService';

interface ArchiveScreenProps {
  onBack: () => void;
  onHomeClick?: () => void;
  onInviteClick?: () => void;
  onStudentWorkClick?: () => void;
  onActivityClick?: (activity: Activity) => void;
}

export const ArchiveScreen = ({ onBack, onHomeClick, onInviteClick, onStudentWorkClick, onActivityClick }: ArchiveScreenProps) => {
  const [activeTab, setActiveTab] = useState<'archive' | 'activity-log' | 'colearner-chats'>('archive');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [colearnerChats, setColearnerChats] = useState<CoLearnerChatSession[]>([]);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [selectedChat, setSelectedChat] = useState<CoLearnerChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [expandedAttempts, setExpandedAttempts] = useState<Set<string>>(new Set());

  const toggleAttempt = (stepNumber: number, attemptNumber: number) => {
    const key = `${stepNumber}-${attemptNumber}`;
    setExpandedAttempts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isAttemptExpanded = (stepNumber: number, attemptNumber: number) => {
    return expandedAttempts.has(`${stepNumber}-${attemptNumber}`);
  };

  useEffect(() => {
    loadActivities();
    loadActivityLogs();
    loadColearnerChats();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await getActivities();
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    setLoading(true);
    try {
      const data = await getAllActivityLogs();
      setActivityLogs(data);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadColearnerChats = async () => {
    setLoading(true);
    try {
      const data = await colearnerChatService.getAllSessions();
      setColearnerChats(data);
    } catch (error) {
      console.error('Failed to load colearner chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (dateString: string) => {
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

  const handleClearLogs = async () => {
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
        <h1 className="text-[18px] font-semibold text-gray-900">Archive</h1>
        <div className="flex items-center gap-3">
          <button onClick={onHomeClick} className="p-1">
            <Home size={20} className="text-gray-700" />
          </button>
          <Archive size={20} className="text-blue-600" />
        </div>
      </div>

      {/* Activity Log Button */}
      {onStudentWorkClick && (
        <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 space-y-2">
          {onStudentWorkClick && (
            <button
              onClick={onStudentWorkClick}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold text-[15px] shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              View Student Work & Chats
            </button>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-4 py-3 bg-gray-100 rounded-t-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('archive')}
            className={`py-2 px-4 rounded-xl ${
              activeTab === 'archive' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Archive
          </button>
          <button
            onClick={() => setActiveTab('activity-log')}
            className={`py-2 px-4 rounded-xl ${
              activeTab === 'activity-log' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Activity Log
          </button>
          <button
            onClick={() => setActiveTab('colearner-chats')}
            className={`py-2 px-4 rounded-xl ${
              activeTab === 'colearner-chats' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Co-Learner Chats
          </button>
        </div>
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-8">
        {activeTab === 'archive' && (
          <>
            {/* Instructions */}
            <div className="mb-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-3 border border-green-200">
              <p className="text-[12px] text-green-900 font-semibold mb-1">
                📂 Your Saved Activities
              </p>
              <p className="text-[11px] text-green-800">
                Click on any activity below to <strong>continue working</strong> on it or <strong>review</strong> your progress. All your work is automatically saved!
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 text-[14px]">Loading activities...</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Archive size={48} className="text-gray-300 mb-3" />
                <h3 className="text-[16px] font-semibold text-gray-900 mb-1">No Activities Yet</h3>
                <p className="text-[13px] text-gray-500">Your completed learning sessions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onActivityClick && onActivityClick(activity)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-2">
                        <div className="text-[13px] text-gray-900 font-medium mb-1 line-clamp-2">
                          <MathRenderer content={activity.question} />
                        </div>
                        {activity.totalSteps > 0 && (
                          <div className="text-[11px] text-gray-500">
                            Progress: {activity.completedSteps || 0}/{activity.totalSteps} steps
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full whitespace-nowrap ${
                          activity.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-gray-400">{formatDate(activity.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'activity-log' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 text-[14px]">Loading activity logs...</div>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Archive size={48} className="text-gray-300 mb-3" />
                <h3 className="text-[16px] font-semibold text-gray-900 mb-1">No Activity Logs Yet</h3>
                <p className="text-[13px] text-gray-500">Your activity logs will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    {/* Question */}
                    <p className="text-[12px] font-semibold text-gray-900 mb-2">
                      {log.question}
                    </p>

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
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full ${
                          log.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {log.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {formatDateTime(log.startedAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Activity Log Details Modal */}
            {selectedLog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-[16px] font-semibold text-gray-900">Activity Details</h3>
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <XCircle size={20} className="text-gray-500" />
                    </button>
                  </div>

                  {/* Activity Summary */}
                  <div className="px-6 py-3 bg-purple-50 border-b border-purple-100">
                    <p className="text-[12px] font-semibold text-purple-900 mb-1">
                      {selectedLog.question}
                    </p>
                    <div className="flex gap-4 text-[10px] text-purple-700">
                      <span>Started: {formatDateTime(selectedLog.startedAt)}</span>
                      {selectedLog.completedAt && (
                        <span>Completed: {formatDateTime(selectedLog.completedAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Overall Stats */}
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
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
                  <div className="flex-1 overflow-y-auto px-6 py-3">
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
                          <div className={`rounded p-2 text-center ${step.completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <p className={`text-[14px] font-bold ${step.completed ? 'text-green-600' : 'text-gray-600'}`}>
                              {step.correctAttemptNumber || '-'}
                            </p>
                            <p className={`text-[8px] ${step.completed ? 'text-green-700' : 'text-gray-700'}`}>
                              Correct At
                            </p>
                          </div>
                        </div>

                        {/* Attempt History */}
                        {step.attempts.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] font-semibold text-gray-700 mb-1">Attempt History:</p>
                            <div className="space-y-2">
                              {step.attempts.map((attempt, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                                  {/* Attempt Header - Clickable */}
                                  <button
                                    onClick={() => toggleAttempt(step.stepNumber, attempt.attemptNumber)}
                                    className="w-full text-[9px] flex items-center gap-2 text-left"
                                  >
                                    <span className="text-gray-500 font-semibold">#{attempt.attemptNumber}</span>
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
                                    <div className="ml-auto">
                                      {isAttemptExpanded(step.stepNumber, attempt.attemptNumber) ? (
                                        <ChevronUp size={12} className="text-gray-500" />
                                      ) : (
                                        <ChevronDown size={12} className="text-gray-500" />
                                      )}
                                    </div>
                                  </button>

                                  {/* Expanded Content - Student Answer & AI Chat */}
                                  {isAttemptExpanded(step.stepNumber, attempt.attemptNumber) && (
                                    <div className="mt-2 space-y-2 border-t border-gray-300 pt-2">
                                      {/* Student Answer */}
                                      <div className="bg-white rounded p-2 border border-blue-200">
                                        <p className="text-[8px] font-semibold text-blue-700 mb-1">Student Answer:</p>
                                        <div className="text-[9px] text-gray-800">
                                          <MathRenderer content={attempt.userAnswer} />
                                        </div>
                                      </div>

                                      {/* Student Explanation */}
                                      <div className="bg-white rounded p-2 border border-green-200">
                                        <p className="text-[8px] font-semibold text-green-700 mb-1">Student Explanation:</p>
                                        <div className="text-[9px] text-gray-800">
                                          <MathRenderer content={attempt.userExplanation} />
                                        </div>
                                      </div>

                                      {/* AI Chat Messages */}
                                      {attempt.chatMessages && attempt.chatMessages.length > 0 && (
                                        <div className="bg-purple-50 rounded p-2 border border-purple-200">
                                          <p className="text-[8px] font-semibold text-purple-700 mb-1 flex items-center gap-1">
                                            <MessageCircle size={10} />
                                            AI Query Log ({attempt.chatMessages.length / 2} exchanges)
                                          </p>
                                          <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                                            {attempt.chatMessages.map((msg, msgIdx) => (
                                              <div
                                                key={msgIdx}
                                                className={`text-[9px] p-1.5 rounded ${
                                                  msg.role === 'user' 
                                                    ? 'bg-blue-100 border border-blue-200' 
                                                    : 'bg-white border border-gray-200'
                                                }`}
                                              >
                                                <p className="font-semibold mb-0.5 text-[8px]">
                                                  {msg.role === 'user' ? '👤 Student Query:' : '🤖 AI Response:'}
                                                </p>
                                                <div className="text-[9px] text-gray-800">
                                                  <MathRenderer content={msg.content} />
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
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
                    <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => {
                          setSelectedLog(null);
                          onStudentWorkClick();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-[14px] hover:shadow-lg transition-all active:scale-95"
                      >
                        <FileText size={18} />
                        <span>View Student Work and Chats</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Clear Activity Logs Confirmation */}
            {showClearConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-xl w-[400px] max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[16px] font-semibold text-gray-900">Clear Activity Logs</h3>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="p-1"
                    >
                      <XCircle size={20} className="text-gray-500" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[13px] text-gray-500">Are you sure you want to clear all activity logs?</p>
                    <div className="flex items-center justify-end mt-4">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="py-2 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold text-[15px] shadow-md hover:shadow-lg active:scale-95 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClearLogs}
                        className={`py-2 px-4 bg-red-600 text-white rounded-xl font-semibold text-[15px] shadow-md hover:shadow-lg active:scale-95 transition-all ${
                          clearing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {clearing ? 'Clearing...' : 'Clear'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clear Activity Logs Button */}
            {activityLogs.length > 0 && (
              <div className="px-4 py-3 bg-red-50 space-y-2">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold text-[15px] shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Clear Activity Logs
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'colearner-chats' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500 text-[14px]">Loading co-learner chats...</div>
              </div>
            ) : colearnerChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <MessageCircle size={48} className="text-gray-300 mb-3" />
                <h3 className="text-[16px] font-semibold text-gray-900 mb-1">No Co-Learner Chats Yet</h3>
                <p className="text-[13px] text-gray-500">Your co-learner collaboration chats will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {colearnerChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    {/* Participants */}
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle size={14} className="text-purple-600" />
                      <p className="text-[11px] font-semibold text-purple-900">
                        {chat.participants.join(', ')}
                      </p>
                    </div>

                    {/* Problem Context */}
                    {chat.problemContext && (
                      <p className="text-[12px] text-gray-900 mb-2 line-clamp-2">
                        {chat.problemContext}
                      </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex gap-4 mb-2">
                      <div className="flex items-center gap-1">
                        <MessageCircle size={12} className="text-blue-600" />
                        <span className="text-[11px] text-blue-700 font-semibold">
                          {chat.totalMessages} messages
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-600" />
                        <span className="text-[11px] text-gray-600">
                          {formatDateTime(chat.lastMessageAt)}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full ${
                          chat.status === 'ended'
                            ? 'bg-gray-100 text-gray-700'
                            : chat.status === 'archived'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {chat.status === 'ended' ? 'Ended' : chat.status === 'archived' ? 'Archived' : 'Active'}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        Started: {formatDateTime(chat.startedAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Co-Learner Chat Details Modal */}
            {selectedChat && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-[16px] font-semibold text-gray-900">Co-Learner Chat</h3>
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <XCircle size={20} className="text-gray-500" />
                    </button>
                  </div>

                  {/* Chat Summary */}
                  <div className="px-6 py-3 bg-purple-50 border-b border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle size={14} className="text-purple-600" />
                      <p className="text-[12px] font-semibold text-purple-900">
                        Participants: {selectedChat.participants.join(', ')}
                      </p>
                    </div>
                    {selectedChat.problemContext && (
                      <p className="text-[11px] text-purple-700 mt-1">
                        {selectedChat.problemContext}
                      </p>
                    )}
                    <div className="flex gap-4 text-[10px] text-purple-700 mt-2">
                      <span>Started: {formatDateTime(selectedChat.startedAt)}</span>
                      <span>Messages: {selectedChat.totalMessages}</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-6 py-3">
                    <h3 className="text-[13px] font-semibold text-gray-900 mb-3">Chat Messages</h3>
                    
                    {selectedChat.messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-[12px]">
                        No messages yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedChat.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                          >
                            {/* Message Header */}
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-semibold text-gray-900">
                                {msg.sender}
                              </p>
                              <span className="text-[9px] text-gray-500">
                                {formatDateTime(msg.timestamp)}
                              </span>
                            </div>

                            {/* Message Content */}
                            <div className="text-[12px] text-gray-800">
                              {msg.messageType === 'latex' || msg.messageType === 'code' ? (
                                <MathRenderer content={msg.message} />
                              ) : (
                                <p>{msg.message}</p>
                              )}
                            </div>

                            {/* Message Type Badge */}
                            {msg.messageType !== 'text' && (
                              <span className="inline-block mt-2 text-[8px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {msg.messageType}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold text-[14px] hover:shadow-lg transition-all active:scale-95"
                    >
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};