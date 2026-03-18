import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;

export interface InviteData {
  code: string;
  createdAt: string;
  used: boolean;
  usedBy: string | null;
}

// Generate a new invite code
export async function generateInviteCode(): Promise<{ inviteCode: string; link: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/invite/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to generate invite code');
    }

    const data = await response.json();
    // Use actual app URL instead of placeholder
    const baseUrl = window.location.origin;
    return {
      inviteCode: data.inviteCode,
      link: `${baseUrl}?invite=${data.inviteCode}`
    };
  } catch (error) {
    console.error('Error generating invite code:', error);
    // Fallback to client-side generation if backend fails
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const baseUrl = window.location.origin;
    return {
      inviteCode: code,
      link: `${baseUrl}?invite=${code}`
    };
  }
}

// Validate an invite code
export async function validateInviteCode(code: string): Promise<{ valid: boolean; invite?: InviteData }> {
  try {
    const response = await fetch(`${API_BASE_URL}/invite/${code}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json();
    return {
      valid: data.valid,
      invite: data.invite
    };
  } catch (error) {
    console.error('Error validating invite code:', error);
    return { valid: false };
  }
}

// Mark invite as used
export async function useInviteCode(code: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/invite/${code}/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      return false;
    }

    console.log('✅ Invite code marked as used');
    return true;
  } catch (error) {
    console.error('Error using invite code:', error);
    return false;
  }
}