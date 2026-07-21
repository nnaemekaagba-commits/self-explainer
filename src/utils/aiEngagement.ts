import type { ChatMessage } from '../services/activityLogService';

const MS_PER_MINUTE = 60000;

function roundMinutes(milliseconds: number): number {
  return Math.round((milliseconds / MS_PER_MINUTE) * 100) / 100;
}

function normalizeAiEngagement<T extends ChatMessage>(message: T, now = Date.now()): T {
  if (message.role !== 'ai') {
    return message;
  }

  const timestamp = message.timestamp || new Date(now).toISOString();
  const engagementStartedAt = message.engagementStartedAt || new Date(now).toISOString();

  return {
    ...message,
    timestamp,
    engagementStartedAt,
    engagementMs: typeof message.engagementMs === 'number' ? message.engagementMs : 0,
    engagementMinutes: typeof message.engagementMinutes === 'number' ? message.engagementMinutes : 0,
  };
}

export function getAiEngagementMs(message: ChatMessage, now = Date.now()): number {
  const savedMs = typeof message.engagementMs === 'number' ? message.engagementMs : 0;

  if (message.role !== 'ai' || !message.engagementStartedAt || message.engagementEndedAt) {
    return savedMs;
  }

  const startedAt = new Date(message.engagementStartedAt).getTime();

  if (!Number.isFinite(startedAt)) {
    return savedMs;
  }

  return savedMs + Math.max(0, now - startedAt);
}

export function formatAiEngagementMinutes(message: ChatMessage): string {
  if (message.role !== 'ai') {
    return 'Not applicable';
  }

  const engagementMs = getAiEngagementMs(message);
  const fallbackMinutes = typeof message.engagementMinutes === 'number' ? message.engagementMinutes : undefined;
  const minutes = engagementMs > 0 ? roundMinutes(engagementMs) : fallbackMinutes;

  return `${(typeof minutes === 'number' ? minutes : 0).toFixed(2)} min`;
}

export function snapshotAiEngagement<T extends ChatMessage>(messages: T[], now = Date.now()): T[] {
  const checkpoint = new Date(now).toISOString();

  return messages.map((rawMessage) => {
    const message = normalizeAiEngagement(rawMessage, now);

    if (message.role !== 'ai') {
      return message;
    }

    const engagementMs = getAiEngagementMs(message, now);

    return {
      ...message,
      engagementMs,
      engagementMinutes: roundMinutes(engagementMs),
      engagementStartedAt: message.engagementEndedAt ? message.engagementStartedAt : checkpoint,
    };
  });
}

export function hasActiveAiEngagement(messages: ChatMessage[]): boolean {
  return messages.some((message) => message.role === 'ai' && !message.engagementEndedAt);
}

export function finalizeAiEngagement<T extends ChatMessage>(messages: T[], now = Date.now()): T[] {
  const endedAt = new Date(now).toISOString();

  return messages.map((rawMessage) => {
    const message = normalizeAiEngagement(rawMessage, now);

    if (message.role !== 'ai') {
      return message;
    }

    const engagementMs = getAiEngagementMs(message, now);

    return {
      ...message,
      engagementMs,
      engagementMinutes: roundMinutes(engagementMs),
      engagementEndedAt: message.engagementEndedAt || endedAt,
    };
  });
}

export function createUserChatMessage(content: string): ChatMessage {
  return {
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  };
}

export function createAiChatMessage(content: string): ChatMessage {
  const timestamp = new Date().toISOString();

  return {
    role: 'ai',
    content,
    timestamp,
    engagementStartedAt: timestamp,
    engagementMs: 0,
    engagementMinutes: 0,
  };
}

export function appendUserChatMessage<T extends ChatMessage>(messages: T[], content: string): T[] {
  return [...finalizeAiEngagement(messages), createUserChatMessage(content) as T];
}
