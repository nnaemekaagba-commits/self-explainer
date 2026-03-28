import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getSessionId } from './sessionService';
import { getAuthState } from './authService';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;

// Helper to get the current session ID based on auth state
function getCurrentSessionId(): string {
  const authState = getAuthState();
  return getSessionId(authState.user?.id);
}

function isGuestMode(): boolean {
  return !getAuthState().user?.id;
}

async function fetchChatSessions(includeSessionId: boolean): Promise<CoLearnerChatSession[]> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${publicAnonKey}`,
  };

  if (includeSessionId) {
    headers['X-Session-Id'] = getCurrentSessionId();
  }

  const response = await fetch(`${API_BASE_URL}/colearner-chats`, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch chat sessions');
  }

  const data = await response.json();
  return data.chats || [];
}

export interface CoLearnerMessage {
  id: string;
  sender: string;
  message: string;
  messageType: 'text' | 'code' | 'latex' | 'diagram';
  timestamp: string;
}

export interface CoLearnerChatSession {
  id: string;
  participants: string[];
  problemContext?: string;
  activityLogId?: string;
  messages: CoLearnerMessage[];
  startedAt: string;
  lastMessageAt: string;
  totalMessages: number;
  status: 'active' | 'archived' | 'ended';
  endedAt?: string;
}

export interface ChatStats {
  totalSessions: number;
  activeSessions: number;
  archivedSessions: number;
  endedSessions: number;
  totalMessages: number;
  averageMessagesPerSession: string;
}

// Create a new co-learner chat session
export async function createChatSession(
  participants: string[],
  problemContext?: string,
  activityLogId?: string
): Promise<{ chatId: string; session: CoLearnerChatSession }> {
  const response = await fetch(`${API_BASE_URL}/colearner-chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Session-Id': getCurrentSessionId()
    },
    body: JSON.stringify({
      participants,
      problemContext,
      activityLogId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create chat session');
  }

  return response.json();
}

// Get all co-learner chat sessions
export async function getAllChatSessions(): Promise<CoLearnerChatSession[]> {
  const chats = await fetchChatSessions(true);
  if (chats.length === 0 && isGuestMode()) {
    return fetchChatSessions(false);
  }
  return chats;
}

// Alias for consistency
export const getAllSessions = getAllChatSessions;

// Get a specific chat session
export async function getChatSession(chatId: string): Promise<CoLearnerChatSession> {
  const response = await fetch(`${API_BASE_URL}/colearner-chats/${chatId}`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Session-Id': getCurrentSessionId()
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch chat session');
  }

  const data = await response.json();
  return data.chat;
}

// Add a message to a chat session
export async function addMessage(
  chatId: string,
  sender: string,
  message: string,
  messageType: 'text' | 'code' | 'latex' | 'diagram' = 'text'
): Promise<CoLearnerMessage> {
  const response = await fetch(`${API_BASE_URL}/colearner-chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Session-Id': getCurrentSessionId()
    },
    body: JSON.stringify({
      sender,
      message,
      messageType
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add message');
  }

  const data = await response.json();
  return data.message;
}

// Update chat session status
export async function updateChatStatus(
  chatId: string,
  status: 'active' | 'archived' | 'ended'
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/colearner-chats/${chatId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Session-Id': getCurrentSessionId()
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    throw new Error('Failed to update chat status');
  }
}

// Delete a chat session
export async function deleteChatSession(chatId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/colearner-chats/${chatId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Session-Id': getCurrentSessionId()
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete chat session');
  }
}

// Clear all chat sessions
export async function clearAllChats(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/colearner-chats/clear-all`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Session-Id': getCurrentSessionId()
    }
  });

  if (!response.ok) {
    throw new Error('Failed to clear chats');
  }

  const data = await response.json();
  return data.deletedCount;
}

// Search chats by participant
export async function searchChatsByParticipant(participantName: string): Promise<CoLearnerChatSession[]> {
  const response = await fetch(
    `${API_BASE_URL}/colearner-chats/search/participant/${encodeURIComponent(participantName)}`,
    {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search chats');
  }

  const data = await response.json();
  return data.chats;
}

// Get chat statistics
export async function getChatStats(): Promise<ChatStats> {
  const response = await fetch(`${API_BASE_URL}/colearner-chats/stats`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-Session-Id': getCurrentSessionId()
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get chat stats');
  }

  const data = await response.json();
  return data.stats;
}
