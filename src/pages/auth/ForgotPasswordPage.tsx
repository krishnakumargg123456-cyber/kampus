import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthFormContainer } from '../../components/auth/AuthFormContainer';
import { AuthInput } from '../../components/auth/AuthInput';
import { PrimaryAuthButton } from '../../components/auth/PrimaryAuthButton';
import { AuthErrorMessage } from '../../components/auth/AuthErrorMessage';
import { AuthSuccessMessage } from '../../components/auth/AuthSuccessMessage';
import { ClerkSetupNotice } from '../../components/auth/ClerkSetupNotice';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendPasswordReset, isClerkConfigured, setPendingEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid university or personal email address.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendPasswordReset(email.trim());
      setIsLoading(false);

      if (result.success) {
        setPendingEmail(email.trim());
        setIsSubmitted(true);
        setSuccessMessage(result.message || `Password recovery instructions sent to ${email.trim()}.`);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Unable to process password reset request. Please retry.');
    }
  };

  return (
    <AuthLayout
      brandQuote="Campus security is built on verified student ownership and zero credential sharing."
      brandAuthor="KAMPUS Security Protocol"
      highlightTag="Password Recovery"
    >
      <AuthFormContainer
        heading="Forgot your password?"
        subheading="Enter your university or personal email address and we'll help you securely reset your password."
        backTo={{
          label: 'Back to sign in',
          href: '/login',
        }}
        footer={
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Remember your credentials?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
            >
              Sign in now
            </Link>
          </p>
        }
      >
        <ClerkSetupNotice isConfigured={isClerkConfigured} />

        <AuthErrorMessage message={error} onDismiss={() => setError('')} />

        {isSubmitted ? (
          <div className="space-y-4 pt-2">
            <AuthSuccessMessage message={successMessage} />

            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-2 text-left">
              <div className="font-semibold text-blue-900 dark:text-blue-200">What happens next?</div>
              <p className="leading-relaxed">
                Check your inbox for the 6-digit password reset code sent to{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{email}</span>.
              </p>
            </div>

            <PrimaryAuthButton
              type="button"
              onClick={() => navigate('/reset-password')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Enter Reset Code & Choose Password
            </PrimaryAuthButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AuthInput
              label="Email address"
              type="email"
              placeholder="Enter your college or personal email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
              autoFocus
            />

            <div className="pt-2">
              <PrimaryAuthButton
                type="submit"
                isLoading={isLoading}
                loadingText="Sending instructions..."
              >
                Send Reset Instructions
              </PrimaryAuthButton>
            </div>
          </form>
        )}

        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-3">
          For student security, we do not expose whether an email address is registered on public lookups.
        </p>
      </AuthFormContainer>
    </AuthLayout>
  );
};
