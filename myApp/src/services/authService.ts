import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9063c65e`;

// Create Supabase client for auth (singleton pattern to avoid multiple instances)
const supabaseUrl = `https://${projectId}.supabase.co`;

// Use a global variable to ensure only one client is created
// Add a unique storage key per tab to avoid "Multiple GoTrueClient instances" warning
const tabId = sessionStorage.getItem('__tabId') || `tab_${Date.now()}_${Math.random().toString(36).substring(7)}`;
if (!sessionStorage.getItem('__tabId')) {
  sessionStorage.setItem('__tabId', tabId);
}

// @ts-ignore
if (!globalThis.__supabaseClient) {
  // @ts-ignore
  globalThis.__supabaseClient = createClient(supabaseUrl, publicAnonKey, {
    auth: {
      persistSession: false, // We handle session persistence manually via sessionStorage
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `sb-${projectId}-auth-${tabId}`, // Unique storage key per tab
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

// Sign up a new user
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

    console.log('✅ User signed up successfully');
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: 'Network error during sign up' };
  }
}

// Sign in an existing user
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string; user?: User; token?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('Sign in error:', error);
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

    // Store auth state
    sessionStorage.setItem('auth_token', data.session.access_token);
    sessionStorage.setItem('auth_user', JSON.stringify(user));

    console.log('✅ User signed in successfully');
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

// Sign in with Google OAuth
export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔵 Starting Google OAuth flow...');
    console.log('🔵 Redirect URL will be:', window.location.origin);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('❌ Google sign in error:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      return { success: false, error: error.message };
    }

    console.log('✅ Google OAuth initiated successfully');
    console.log('OAuth data:', data);
    return { success: true };
  } catch (error) {
    console.error('❌ Google sign in exception:', error);
    return { success: false, error: 'Failed to initiate Google sign in. Make sure Google OAuth is enabled in your Supabase project settings.' };
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    console.log('✅ User signed out');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// Request password reset email
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const redirectUrl = window.location.origin;
    console.log('🔗 Password reset redirect URL:', redirectUrl);
    console.log('');
    console.log('⚙️  SUPABASE CONFIGURATION REQUIRED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Click: Authentication → URL Configuration');
    console.log('4. Find: "Redirect URLs" section');
    console.log('5. Click: "Add URL" button');
    console.log('6. Add this EXACT URL:', redirectUrl);
    console.log('7. Click: "Save"');
    console.log('8. Request a NEW password reset (old emails won\'t work!)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Password reset email sent');
    console.log('📧 User will receive link redirecting to:', redirectUrl);
    return { success: true };
  } catch (error) {
    console.error('Password reset request exception:', error);
    return { success: false, error: 'Network error during password reset request' };
  }
}

// Update password (after clicking reset link)
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Password updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Password update exception:', error);
    return { success: false, error: 'Network error during password update' };
  }
}

// Get current auth state from sessionStorage (tab-isolated)
export function getAuthState(): AuthState {
  const token = sessionStorage.getItem('auth_token');
  const userStr = sessionStorage.getItem('auth_user');
  
  console.log('🔍 getAuthState called:', {
    hasToken: !!token,
    hasUser: !!userStr,
    token: token ? token.substring(0, 20) + '...' : null,
    userStr: userStr
  });
  
  if (!token || !userStr) {
    console.log('⚠️ No auth state found in sessionStorage');
    return { user: null, token: null };
  }
  
  try {
    const user = JSON.parse(userStr);
    console.log('✅ Auth state retrieved:', {
      userId: user.id,
      userEmail: user.email
    });
    return { user, token };
  } catch (error) {
    console.error('❌ Error parsing user from sessionStorage:', error);
    return { user: null, token: null };
  }
}

// Check if user has an active session
export async function checkSession(): Promise<AuthState> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      // Clear local storage if session is invalid
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      return { user: null, token: null };
    }

    const user: User = {
      id: data.session.user?.id || '',
      email: data.session.user?.email || '',
      name: data.session.user?.user_metadata?.name || data.session.user?.email?.split('@')[0]
    };

    // Update local storage with fresh token
    sessionStorage.setItem('auth_token', data.session.access_token);
    sessionStorage.setItem('auth_user', JSON.stringify(user));

    return { user, token: data.session.access_token };
  } catch (error) {
    console.error('Session check error:', error);
    return { user: null, token: null };
  }
}

// Get the current access token (for API calls)
export function getAccessToken(): string | null {
  return sessionStorage.getItem('auth_token');
}