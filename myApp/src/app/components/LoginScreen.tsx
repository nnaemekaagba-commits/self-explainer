import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { signIn, signInWithGoogle } from '../../services/authService';

interface LoginScreenProps {
  onLoginSuccess: (user: any, token: string) => void;
  onSignUpClick: () => void;
  onGuestContinue: () => void;
  onDevBypass?: () => void; // New bypass for developer
  onForgotPasswordClick: () => void;
}

export function LoginScreen({ onLoginSuccess, onSignUpClick, onGuestContinue, onDevBypass, onForgotPasswordClick }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDevBypass, setShowDevBypass] = useState(false);

  // Check if running on localhost or via shared URL
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';
  
  // Check if accessed via shared URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isSharedUrl = urlParams.has('shared') || urlParams.has('invite') || urlParams.has('s');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await signIn(email, password);

    setIsLoading(false);

    if (result.success && result.user && result.token) {
      onLoginSuccess(result.user, result.token);
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    console.log('👆 Google sign-in button clicked');
    const result = await signInWithGoogle();
    console.log('Google sign-in result:', result);

    if (!result.success) {
      setError(result.error || 'Google sign in failed. Please ensure Google OAuth is enabled in your Supabase project.');
      setIsLoading(false);
      console.error('❌ Google sign-in failed:', result.error);
    } else {
      console.log('✅ Google OAuth window should open now...');
      // If successful, the OAuth flow will redirect and handle the session
      // Don't set isLoading to false here - let the redirect happen
    }
  };

  return (
    <div className="size-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col items-center justify-center px-6">
      {/* App Icon - Removed */}

      {/* Welcome Text */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome Back</h1>
      <p className="text-gray-600 mb-8 text-center">Sign in to continue your learning journey</p>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        {/* Email Input */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-[16px] bg-white"
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full h-14 pl-12 pr-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-[16px] bg-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl font-semibold text-[16px] shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-sm text-purple-600 font-medium hover:text-purple-700 hover:underline"
          >
            Forgot password?
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="w-full max-w-sm flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-gray-500 text-sm">OR</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      {/* Google Sign In */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full max-w-sm h-14 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <svg className="size-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Guest Continue */}
      <button
        onClick={onGuestContinue}
        className="w-full max-w-sm h-14 bg-gray-100 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-200 active:scale-95 transition-all mt-3"
      >
        Continue as Guest
      </button>

      {/* Sign Up Link */}
      <p className="mt-6 text-gray-600 text-center">
        Don't have an account?{' '}
        <button
          onClick={onSignUpClick}
          className="text-purple-600 font-semibold hover:text-purple-700"
        >
          Sign Up
        </button>
      </p>

      {/* Developer Bypass - Only show on localhost and when NOT via shared URL */}
      {isLocalhost && !isSharedUrl && onDevBypass && (
        <div className="mt-6 w-full max-w-sm">
          {!showDevBypass ? (
            <button
              onClick={() => setShowDevBypass(true)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Developer Options
            </button>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
              <p className="text-xs text-yellow-800 font-semibold mb-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>Developer Mode</span>
              </p>
              <button
                onClick={onDevBypass}
                className="w-full h-12 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 active:scale-95 transition-all"
              >
                🔓 Bypass Authentication
              </button>
              <p className="text-[10px] text-yellow-700 mt-2">
                This bypasses authentication for development/testing. Only available on localhost.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Privacy Note */}
      <p className="mt-8 text-xs text-gray-500 text-center max-w-sm">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}