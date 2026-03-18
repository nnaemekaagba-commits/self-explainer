import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getSessionId } from './sessionService';
import { getAuthState } from './authService';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;

// Helper to get the current session ID based on auth state
function getCurrentSessionId(): string {
  const authState = getAuthState();
  const sessionId = getSessionId(authState.user?.id);
  console.log('🔑 getCurrentSessionId called:', {
    userId: authState.user?.id,
    userEmail: authState.user?.email,
    sessionId: sessionId
  });
  return sessionId;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface StepAttempt {
  attemptNumber: number;
  userAnswer: string;
  userExplanation: string;
  answerCorrect: boolean;
  explanationCorrect: boolean;
  aiQueriesUsed: number;
  chatMessages: ChatMessage[]; // Add chat messages to each attempt
  answerImageUrl?: string; // Image URL if answer was uploaded as image
  explanationImageUrl?: string; // Image URL if explanation was uploaded as image
  timestamp: string;
}

export interface StepLog {
  stepNumber: number;
  attempts: StepAttempt[];
  correctAttemptNumber?: number; // Which attempt was correct
  totalAIQueries: number;
  completed: boolean;
}

export interface ActivityLog {
  id: string;
  activityId: string;
  question: string;
  startedAt: string;
  completedAt?: string;
  steps: StepLog[];
  totalCorrectResponses: number;
  totalAttempts: number;
  totalAIQueriesUsed: number;
  status: 'in-progress' | 'completed';
  learningThreadId?: string; // ID to group related questions (guided solution + practice problems)
  isPractice?: boolean; // Whether this is a practice problem
  isShared?: boolean; // Whether this is a shared/collaborative question
  sharedSessionId?: string; // Co-learner chat session ID if shared
}

// Create a new activity log
export async function createActivityLog(
  activityId: string, 
  question: string, 
  totalSteps: number,
  learningThreadId?: string,
  isPractice?: boolean,
  isShared?: boolean,
  sharedSessionId?: string
): Promise<string> {
  try {
    console.log('🏗️ createActivityLog called with:', {
      activityId,
      question,
      totalSteps,
      learningThreadId,
      isPractice,
      isShared,
      sharedSessionId
    });
    
    const log: ActivityLog = {
      id: `log:${Date.now()}`,
      activityId,
      question,
      startedAt: new Date().toISOString(),
      steps: Array.from({ length: totalSteps }, (_, i) => ({
        stepNumber: i + 1,
        attempts: [],
        totalAIQueries: 0,
        completed: false
      })),
      totalCorrectResponses: 0,
      totalAttempts: 0,
      totalAIQueriesUsed: 0,
      status: 'in-progress',
      ...(learningThreadId && { learningThreadId }),
      ...(isPractice && { isPractice }),
      ...(isShared && { isShared }),
      ...(sharedSessionId && { sharedSessionId })
    };
    
    console.log('📝 Activity log object created:', JSON.stringify(log, null, 2));
    console.log('🌐 API URL:', `${API_BASE_URL}/activity-logs`);
    console.log('🔑 Using publicAnonKey:', publicAnonKey.substring(0, 20) + '...');

    const response = await fetch(`${API_BASE_URL}/activity-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      },
      body: JSON.stringify(log)
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create activity log. Status:', response.status);
      console.error('❌ Error response:', errorText);
      throw new Error(`Failed to create activity log: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Activity log created successfully!');
    console.log('📋 Response data:', data);
    console.log('🆔 Returning log ID:', data.id);
    
    return data.id;
  } catch (error) {
    console.error('❌ ERROR in createActivityLog:');
    console.error('  Error message:', error.message);
    console.error('  Error stack:', error.stack);
    console.error('  Full error:', error);
    throw error;
  }
}

// Record a step attempt
export async function recordStepAttempt(
  logId: string,
  stepNumber: number,
  userAnswer: string,
  userExplanation: string,
  answerCorrect: boolean,
  explanationCorrect: boolean,
  aiQueriesUsed: number,
  chatMessages: ChatMessage[] = [],
  answerImageUrl?: string,
  explanationImageUrl?: string
): Promise<void> {
  try {
    console.log('📤 recordStepAttempt called with:', {
      logId,
      stepNumber,
      userAnswer,
      userExplanation,
      answerCorrect,
      explanationCorrect,
      aiQueriesUsed,
      chatMessages,
      chatMessagesCount: chatMessages.length,
      answerImageUrl,
      explanationImageUrl
    });
    
    const response = await fetch(`${API_BASE_URL}/activity-logs/${logId}/steps/${stepNumber}/attempt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      },
      body: JSON.stringify({
        userAnswer,
        userExplanation,
        answerCorrect,
        explanationCorrect,
        aiQueriesUsed,
        chatMessages,
        answerImageUrl,
        explanationImageUrl
      })
    });

    if (!response.ok) {
      throw new Error('Failed to record step attempt');
    }
    
    console.log('✅ Step attempt recorded successfully');
  } catch (error) {
    console.error('Error recording step attempt:', error);
    throw error;
  }
}

// Record AI query usage
export async function recordAIQuery(logId: string, stepNumber: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/activity-logs/${logId}/steps/${stepNumber}/ai-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to record AI query');
    }
  } catch (error) {
    console.error('Error recording AI query:', error);
    throw error;
  }
}

// Update the last attempt with chat messages
export async function updateLastAttemptChatMessages(
  logId: string,
  stepNumber: number,
  chatMessages: ChatMessage[]
): Promise<void> {
  try {
    console.log('🔄 updateLastAttemptChatMessages called with:', {
      logId,
      stepNumber,
      chatMessages,
      chatMessagesCount: chatMessages.length,
      url: `${API_BASE_URL}/activity-logs/${logId}/steps/${stepNumber}/update-chat`
    });
    
    const response = await fetch(`${API_BASE_URL}/activity-logs/${logId}/steps/${stepNumber}/update-chat`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      },
      body: JSON.stringify({ chatMessages })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to update chat messages:', errorText);
      throw new Error('Failed to update chat messages');
    }
    
    console.log('✅ Chat messages updated successfully');
  } catch (error) {
    console.error('Error updating chat messages:', error);
    throw error;
  }
}

// Get all activity logs
export async function getAllActivityLogs(): Promise<ActivityLog[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/activity-logs`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activity logs');
    }

    const data = await response.json();
    return data.logs || [];
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}

// Clear all activity logs
export async function clearAllActivityLogs(): Promise<{ success: boolean; deletedCount: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/activity-logs/clear-all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to clear activity logs');
    }

    const data = await response.json();
    return { success: data.success, deletedCount: data.deletedCount };
  } catch (error) {
    console.error('Error clearing activity logs:', error);
    throw error;
  }
}

// Delete selected activity logs
export async function deleteActivityLogs(logIds: string[]): Promise<{ success: boolean; deletedCount: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/activity-logs/delete-selected`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      },
      body: JSON.stringify({ logIds })
    });

    if (!response.ok) {
      throw new Error('Failed to delete selected activity logs');
    }

    const data = await response.json();
    return { success: data.success, deletedCount: data.deletedCount };
  } catch (error) {
    console.error('Error deleting selected activity logs:', error);
    throw error;
  }
}

// Mark an activity log as shared (for when someone opens a shared link)
export async function markActivityAsShared(activityLogId: string, sharedSessionId?: string): Promise<void> {
  try {
    console.log('🔗 Marking activity as shared:', activityLogId);
    
    const response = await fetch(`${API_BASE_URL}/activity-logs/${activityLogId}/mark-shared`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      },
      body: JSON.stringify({ 
        sharedSessionId: sharedSessionId || null 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to mark activity as shared');
    }

    console.log('✅ Activity marked as shared successfully');
  } catch (error) {
    console.error('Error marking activity as shared:', error);
    throw error;
  }
}

// Get a specific activity log
export async function getActivityLog(logId: string): Promise<ActivityLog | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/activity-logs/${logId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.log;
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return null;
  }
}

// Mark activity as completed
export async function markActivityCompleted(logId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/activity-logs/${logId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark activity as completed');
    }
  } catch (error) {
    console.error('Error marking activity as completed:', error);
    throw error;
  }
}