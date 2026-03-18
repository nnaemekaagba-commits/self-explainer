// Session management for data isolation
// Each authenticated user gets a unique session ID based on their user ID
// Guest users get a browser-specific session ID

const SESSION_KEY = 'learning_app_session_id';
const USER_SESSION_PREFIX = 'user_session_';

export function getSessionId(userId?: string | null): string {
  // If user is authenticated, use their user ID as the session identifier
  if (userId) {
    const userSessionId = `${USER_SESSION_PREFIX}${userId}`;
    console.log('🆔 Using authenticated user session:', {
      userId,
      sessionId: userSessionId
    });
    return userSessionId;
  }
  
  // For guest users, use browser-specific session ID
  let sessionId = localStorage.getItem(SESSION_KEY);
  
  if (!sessionId) {
    // Generate a new guest session ID
    sessionId = `guest_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
    console.log('🆔 New guest session created:', sessionId);
  } else {
    console.log('🆔 Using existing guest session:', sessionId);
  }
  
  return sessionId;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  console.log('🗑️ Guest session cleared');
}

export function resetSession(userId?: string | null): string {
  if (!userId) {
    clearSession();
  }
  return getSessionId(userId);
}