import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;

export interface SharedQuestion {
  id: string;
  question: string;
  imageUrl?: string | null;
  sharedBy: string;
  sharedAt: string;
  activityLogId?: string | null;
  sharedSessionId?: string | null;
}

interface CreateSharedQuestionInput {
  question: string;
  imageUrl?: string | null;
  sharedBy: string;
  activityLogId?: string | null;
  sharedSessionId?: string | null;
}

export async function createSharedQuestion(input: CreateSharedQuestionInput): Promise<{ sharedQuestion: SharedQuestion; link: string }> {
  const response = await fetch(`${API_BASE_URL}/shared-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error('Failed to create shared question');
  }

  const data = await response.json();
  const sharedQuestion: SharedQuestion = data.sharedQuestion;

  return {
    sharedQuestion,
    link: `${window.location.origin}?s=${sharedQuestion.id}`
  };
}

export async function getSharedQuestion(id: string): Promise<SharedQuestion | null> {
  const response = await fetch(`${API_BASE_URL}/shared-questions/${id}`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.sharedQuestion || null;
}
