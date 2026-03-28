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

async function fetchActivities(includeSessionId: boolean): Promise<Activity[]> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${publicAnonKey}`,
  };

  if (includeSessionId) {
    headers['X-Session-Id'] = getCurrentSessionId();
  }

  const response = await fetch(`${API_BASE_URL}/activities`, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }

  const data = await response.json();
  return data.activities || [];
}

export interface Activity {
  id: string;
  question: string;
  date: string;
  status: 'Completed' | 'In Progress';
  aiData?: any;
  completedSteps?: number;
  totalSteps?: number;
}

// Get all archived activities
export async function getActivities(): Promise<Activity[]> {
  try {
    const activities = await fetchActivities(true);
    if (activities.length === 0 && isGuestMode()) {
      return await fetchActivities(false);
    }
    return activities;
  } catch (error) {
    console.error('Error fetching activities:', error);
    // Return empty array if backend fails
    return [];
  }
}

// Save a new activity
export async function saveActivity(activity: Omit<Activity, 'id' | 'date'>): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      },
      body: JSON.stringify({
        question: activity.question,
        status: activity.status,
        aiData: activity.aiData,
        completedSteps: activity.completedSteps,
        totalSteps: activity.totalSteps
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save activity');
    }

    console.log('✅ Activity saved to archive');
  } catch (error) {
    console.error('Error saving activity:', error);
  }
}

// Update activity status
export async function updateActivityStatus(id: string, status: 'Completed' | 'In Progress', completedSteps?: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      },
      body: JSON.stringify({ status, completedSteps })
    });

    if (!response.ok) {
      throw new Error('Failed to update activity');
    }

    console.log('✅ Activity status updated');
  } catch (error) {
    console.error('Error updating activity:', error);
  }
}

// Delete an activity
export async function deleteActivity(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete activity');
    }

    console.log('✅ Activity deleted');
  } catch (error) {
    console.error('Error deleting activity:', error);
  }
}
