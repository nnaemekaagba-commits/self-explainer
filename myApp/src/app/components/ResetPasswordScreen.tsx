import { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { updatePassword } from '../../services/authService';

interface ResetPasswordScreenProps {
  onResetSuccess: () => void;
  onBackToLogin: () => void;
}

export function ResetPasswordScreen({ onResetSuccess, onBackToLogin }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    console.log('🔄 Attempting to update password...');
    const result = await updatePassword(password);
    console.log('Password update result:', result);

    setIsLoading(false);

    if (result.success) {
      console.log('✅ Password updated successfully');
      setSuccess(true);
      setTimeout(() => {
        onResetSuccess();
      }, 2000);
    } else {
      console.error('❌ Password update failed:', result.error);
      setError(result.error || 'Failed to update password. The reset link may have expired. Please request a new one.');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">Password Updated!</h1>
        <p className="text-gray-600 mb-8 text-center max-w-md">
          Your password has been successfully updated. Redirecting you to login...
        </p>

        {/* Loading Animation */}
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col items-center justify-center px-6">
      {/* Icon */}
      <div className="mb-8">
        <div className="size-20 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-xl">
          <span className="text-4xl">🔑</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Set New Password</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Please enter your new password below
      </p>

      {/* Reset Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* New Password Input */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
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

        {/* Confirm Password Input */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className="w-full h-14 pl-12 pr-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-[16px] bg-white"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-900 mb-2">Password Requirements:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li className="flex items-center gap-2">
              <span className={password.length >= 6 ? 'text-green-600' : 'text-gray-400'}>
                {password.length >= 6 ? '✓' : '○'}
              </span>
              At least 6 characters
            </li>
            <li className="flex items-center gap-2">
              <span className={password === confirmPassword && password.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                {password === confirmPassword && password.length > 0 ? '✓' : '○'}
              </span>
              Passwords match
            </li>
          </ul>
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
          {isLoading ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>

      {/* Back to Login */}
      <button
        onClick={onBackToLogin}
        className="mt-6 text-gray-600 hover:text-gray-900 font-medium"
      >
        Back to Login
      </button>
    </div>
  );
}