import { useState } from 'react';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { requestPasswordReset } from '../../services/authService';
import { SupabaseSetupGuide } from './SupabaseSetupGuide';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordScreen({ onBackToLogin }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('🔄 Requesting password reset for:', email);
    const result = await requestPasswordReset(email);
    console.log('Password reset request result:', result);

    setIsLoading(false);

    if (result.success) {
      console.log('✅ Password reset email sent successfully');
      setSuccess(true);
    } else {
      console.error('❌ Password reset failed:', result.error);
      setError(result.error || 'Failed to send reset email. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="size-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col items-center justify-center px-6">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="size-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl">
            <CheckCircle className="text-white" size={48} />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">Check Your Email</h1>
        <p className="text-gray-600 mb-2 text-center max-w-md">
          We've sent a password reset link to:
        </p>
        <p className="text-purple-600 font-semibold mb-6 text-center">
          {email}
        </p>
        <p className="text-gray-600 mb-8 text-center max-w-md text-sm">
          Click the link in the email to reset your password. The link will expire in 1 hour.
        </p>

        {/* Back to Login */}
        <button
          onClick={onBackToLogin}
          className="w-full max-w-sm h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl font-semibold text-[16px] shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          Back to Login
        </button>

        {/* Resend Option */}
        <button
          onClick={() => {
            setSuccess(false);
            setEmail('');
          }}
          className="mt-4 text-purple-600 font-medium hover:text-purple-700"
        >
          Send to a different email
        </button>
      </div>
    );
  }

  return (
    <div className="size-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col items-center justify-center px-6">
      {/* Back Button */}
      <button
        onClick={onBackToLogin}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back</span>
      </button>

      {/* Lock Icon */}
      <div className="mb-8">
        <div className="size-20 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-xl">
          <span className="text-4xl">🔒</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Forgot Password?</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        No worries! Enter your email address and we'll send you a link to reset your password.
      </p>

      {/* Reset Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl font-semibold text-[16px] shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      {/* Additional Info */}
      <div className="mt-8 text-center max-w-sm">
        <p className="text-sm text-gray-600 mb-4">
          Remember your password?{' '}
          <button
            onClick={onBackToLogin}
            className="text-purple-600 font-semibold hover:text-purple-700"
          >
            Sign In
          </button>
        </p>
        <p className="text-xs text-gray-500">
          💡 Tip: Check your spam folder if you don't see the email within a few minutes.
        </p>
      </div>
    </div>
  );
}