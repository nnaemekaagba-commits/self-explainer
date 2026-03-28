import { getAuthState } from './authService';

export interface CoLearnerConnection {
  id: string;
  name: string;
  contact: string;
  type: 'email' | 'username';
  addedAt: string;
  lastStudyTime?: string;
}

function getStorageKey() {
  const authState = getAuthState();
  if (!authState.user?.id) {
    return null;
  }

  return `colearner_connections_${authState.user.id}`;
}

export function getConnections(): CoLearnerConnection[] {
  const key = getStorageKey();
  if (!key) {
    return [];
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read co-learner connections:', error);
    return [];
  }
}

function saveConnections(connections: CoLearnerConnection[]) {
  const key = getStorageKey();
  if (!key) {
    throw new Error('Sign in to manage co-learners.');
  }

  localStorage.setItem(key, JSON.stringify(connections));
}

export function addConnection(contact: string): CoLearnerConnection {
  const trimmed = contact.trim();
  if (!trimmed) {
    throw new Error('Enter an email address or username first.');
  }

  const type: 'email' | 'username' = trimmed.includes('@') ? 'email' : 'username';
  const normalizedContact = type === 'username' && !trimmed.startsWith('@') ? `@${trimmed}` : trimmed;
  const displayName = type === 'email' ? trimmed.split('@')[0] : normalizedContact.replace(/^@/, '');

  const existing = getConnections();
  const duplicate = existing.find((item) => item.contact.toLowerCase() === normalizedContact.toLowerCase());
  if (duplicate) {
    return duplicate;
  }

  const connection: CoLearnerConnection = {
    id: `colearner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: displayName,
    contact: normalizedContact,
    type,
    addedAt: new Date().toISOString(),
  };

  saveConnections([connection, ...existing]);
  return connection;
}

export function removeConnection(connectionId: string) {
  const existing = getConnections();
  saveConnections(existing.filter((item) => item.id !== connectionId));
}

export function updateConnectionStudyTime(connectionId: string, studyTime?: string) {
  const existing = getConnections();
  saveConnections(
    existing.map((item) =>
      item.id === connectionId
        ? {
            ...item,
            lastStudyTime: studyTime,
          }
        : item
    )
  );
}
