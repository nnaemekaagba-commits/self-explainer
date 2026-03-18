import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getSessionId } from './sessionService';
import { getAuthState } from './authService';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;

// Helper to get the current session ID based on auth state
function getCurrentSessionId(): string {
  const authState = getAuthState();
  return getSessionId(authState.user?.id);
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
    const response = await fetch(`${API_BASE_URL}/activities`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Session-Id': getCurrentSessionId()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    const data = await response.json();
    return data.activities || [];
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