import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;
const supabaseUrl = `https://${projectId}.supabase.co`;

const tabId = sessionStorage.getItem('__tabId') || `tab_${Date.now()}_${Math.random().toString(36).substring(7)}`;
if (!sessionStorage.getItem('__tabId')) {
  sessionStorage.setItem('__tabId', tabId);
}

// @ts-ignore
if (!globalThis.__supabaseClient) {
  // @ts-ignore
  globalThis.__supabaseClient = createClient(supabaseUrl, publicAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `sb-${projectId}-auth-${tabId}`,
      storage: {
        getItem: (key: string) => sessionStorage.getItem(key),
        setItem: (key: string, value: string) => sessionStorage.setItem(key, value),
        removeItem: (key: string) => sessionStorage.removeItem(key),
      }
    }
  });
}

// @ts-ignore
const supabase = globalThis.__supabaseClient;

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export async function signUp(email: string, password: string, name?: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, name })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to sign up' };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: 'Network error during sign up' };
  }
}

export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User; token?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.session) {
      return { success: false, error: 'No session created' };
    }

    const user: User = {
      id: data.user?.id || '',
      email: data.user?.email || '',
      name: data.user?.user_metadata?.name || data.user?.email?.split('@')[0]
    };

    sessionStorage.setItem('auth_token', data.session.access_token);
    sessionStorage.setItem('auth_user', JSON.stringify(user));

    return {
      success: true,
      user,
      token: data.session.access_token
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'Network error during sign in' };
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    const redirectTo = window.location.href;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    console.log('Google OAuth initiated successfully', data);
    return { success: true };
  } catch (error) {
    console.error('Google sign in exception:', error);
    return { success: false, error: 'Failed to initiate Google sign in. Make sure Google OAuth is enabled in your Supabase project settings.' };
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const redirectUrl = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset request exception:', error);
    return { success: false, error: 'Network error during password reset request' };
  }
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Password update exception:', error);
    return { success: false, error: 'Network error during password update' };
  }
}

export function getAuthState(): AuthState {
  const token = sessionStorage.getItem('auth_token');
  const userStr = sessionStorage.getItem('auth_user');

  if (!token || !userStr) {
    return { user: null, token: null };
  }

  try {
    const user = JSON.parse(userStr);
    return { user, token };
  } catch (error) {
    console.error('Error parsing user from sessionStorage:', error);
    return { user: null, token: null };
  }
}

export async function checkSession(): Promise<AuthState> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      return { user: null, token: null };
    }

    const user: User = {
      id: data.session.user?.id || '',
      email: data.session.user?.email || '',
      name: data.session.user?.user_metadata?.name || data.session.user?.email?.split('@')[0]
    };

    sessionStorage.setItem('auth_token', data.session.access_token);
    sessionStorage.setItem('auth_user', JSON.stringify(user));

    return { user, token: data.session.access_token };
  } catch (error) {
    console.error('Session check error:', error);
    return { user: null, token: null };
  }
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem('auth_token');
}
