import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, RefreshCw, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthFormContainer } from '../../components/auth/AuthFormContainer';
import { OTPInput } from '../../components/auth/OTPInput';
import { PrimaryAuthButton } from '../../components/auth/PrimaryAuthButton';
import { AuthErrorMessage } from '../../components/auth/AuthErrorMessage';
import { AuthSuccessMessage } from '../../components/auth/AuthSuccessMessage';
import { ClerkSetupNotice } from '../../components/auth/ClerkSetupNotice';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { verifyOtp, sendOtp, pendingEmail, isClerkConfigured, isAuthenticated, isLoaded } = useAuth();

  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Automatically redirect if already verified and authenticated
  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      setSuccessMessage('Your student account is verified! Navigating to setup...');
      const timer = setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isAuthenticated, navigate]);

  // Resend countdown timer
  useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const targetEmail = pendingEmail || 'your registered email';

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOtp(otpCode, targetEmail);
      setIsLoading(false);

      if (result.success) {
        setSuccessMessage(
          (result as any).alreadyVerified
            ? 'Email already verified! Redirecting to student onboarding...'
            : 'Email verified successfully! Redirecting to setup...'
        );
        setTimeout(() => {
          navigate('/onboarding', { replace: true });
        }, 800);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Verification failed. Please check the code and retry.');
    }
  };

  const handleResendCode = async () => {
    if (!canResend || isResending) return;
    setError('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      const result = await sendOtp(targetEmail, 'register');
      setIsResending(false);

      if (result.success) {
        setSuccessMessage(result.message || `A fresh 6-digit code has been sent to ${targetEmail}.`);
        setCountdown(60);
        setCanResend(false);
        setOtpCode('');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setIsResending(false);
      setError(err?.message || 'Failed to dispatch a new code. Please try again.');
    }
  };

  return (
    <AuthLayout
      brandQuote="Verification keeps our campus discussions, digital lockers, and study rooms secure and trusted."
      brandAuthor="KAMPUS Trust & Safety"
      highlightTag="Identity Verification"
    >
      <AuthFormContainer
        heading="Verify your email"
        subheading="We've sent a 6-digit verification code to your email. Enter the code below to verify your account."
        backTo={{
          label: 'Back to registration',
          href: '/register',
        }}
        footer={
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Already verified?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
            >
              Sign in to your account
            </Link>
          </p>
        }
      >
        <ClerkSetupNotice isConfigured={isClerkConfigured} />

        {/* Target Email Capsule with Change Link */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-semibold truncate max-w-[220px] sm:max-w-xs">{targetEmail}</span>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            <Edit3 className="w-3 h-3" />
            <span>Change</span>
          </Link>
        </div>

        <AuthErrorMessage message={error} onDismiss={() => setError('')} />
        {error.toLowerCase().includes('already been verified') && (
          <div className="pt-2 pb-1 space-y-2">
            <button
              type="button"
              onClick={() => navigate('/onboarding', { replace: true })}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              Continue to Student Onboarding →
            </button>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Sign In to Your Account →
            </button>
          </div>
        )}
        <AuthSuccessMessage message={successMessage} onDismiss={() => setSuccessMessage('')} />

        <form onSubmit={handleVerify} className="space-y-6 pt-2">
          {/* 6-Digit Auto-Advancing OTP Input */}
          <div className="space-y-2 text-center">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Enter 6-Digit Code
            </label>
            <OTPInput
              value={otpCode}
              onChange={(code) => {
                setOtpCode(code);
                if (error) setError('');
                if (code.length === 6) {
                  // Optional auto-submit when all 6 digits entered
                }
              }}
              hasError={!!error}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <PrimaryAuthButton
            type="submit"
            isLoading={isLoading}
            loadingText="Verifying code..."
            disabled={otpCode.length !== 6}
          >
            Verify & Continue
          </PrimaryAuthButton>

          {/* Resend Code Section with Countdown */}
          <div className="text-center pt-2">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend verification code</span>
              </button>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Didn't receive the email? Resend code in{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  {countdown}s
                </span>
              </p>
            )}
          </div>
        </form>

        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-3">
          Tip: Check your spam or institutional promotions folder if the email does not appear in 30 seconds.
        </p>
      </AuthFormContainer>
    </AuthLayout>
  );
};
