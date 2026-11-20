import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthFormContainer } from '../../components/auth/AuthFormContainer';
import { AuthInput } from '../../components/auth/AuthInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { PasswordStrengthIndicator, evaluatePassword } from '../../components/auth/PasswordStrengthIndicator';
import { PrimaryAuthButton } from '../../components/auth/PrimaryAuthButton';
import { AuthErrorMessage } from '../../components/auth/AuthErrorMessage';
import { ClerkSetupNotice } from '../../components/auth/ClerkSetupNotice';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { resetPasswordWithCode, pendingEmail, isClerkConfigured } = useAuth();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter the 6-digit reset code sent to your email.');
      return;
    }

    if (!newPassword) {
      setError('Please choose a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const analysis = evaluatePassword(newPassword);
    if (analysis.score < 2) {
      setError('Please choose a stronger password with uppercase letters, numbers, or symbols.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordWithCode(code.trim(), newPassword);
      setIsLoading(false);

      if (result.success) {
        setIsSuccess(true);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to update password. Please check your reset code.');
    }
  };

  return (
    <AuthLayout
      brandQuote="Maintain continuous access to your course modules, campus locker, and study squads."
      brandAuthor="KAMPUS Account Recovery"
      highlightTag="Password Reset"
    >
      <AuthFormContainer
        heading="Reset your password"
        subheading={
          pendingEmail
            ? `Enter the code sent to ${pendingEmail} and choose a strong new password.`
            : 'Enter the recovery code sent to your email and set your new password.'
        }
        backTo={{
          label: 'Back to sign in',
          href: '/login',
        }}
      >
        <ClerkSetupNotice isConfigured={isClerkConfigured} />

        <AuthErrorMessage message={error} onDismiss={() => setError('')} />

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Password updated successfully!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your credentials have been securely updated. You can now sign in to your KAMPUS account.
              </p>
            </div>

            <div className="pt-4">
              <PrimaryAuthButton
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign in to KAMPUS
              </PrimaryAuthButton>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AuthInput
              label="6-Digit Reset Code"
              placeholder="e.g. 849201"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError('');
              }}
              required
              autoFocus
            />

            <PasswordInput
              label="New password"
              placeholder="Enter at least 8 characters"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError('');
              }}
              autoComplete="new-password"
              required
            />

            <PasswordStrengthIndicator password={newPassword} />

            <PasswordInput
              label="Confirm new password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              autoComplete="new-password"
              required
            />

            <div className="pt-2">
              <PrimaryAuthButton
                type="submit"
                isLoading={isLoading}
                loadingText="Updating password..."
              >
                Reset Password & Continue
              </PrimaryAuthButton>
            </div>
          </form>
        )}
      </AuthFormContainer>
    </AuthLayout>
  );
};
