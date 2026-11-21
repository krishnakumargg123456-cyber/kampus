import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AuthFormContainer } from '../../components/auth/AuthFormContainer';
import { AuthInput } from '../../components/auth/AuthInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { PrimaryAuthButton } from '../../components/auth/PrimaryAuthButton';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { AuthDivider } from '../../components/auth/AuthDivider';
import { AuthErrorMessage } from '../../components/auth/AuthErrorMessage';
import { ClerkSetupNotice } from '../../components/auth/ClerkSetupNotice';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signInWithGoogle, isClerkConfigured, isAuthenticated, isLoaded } = useAuth();
  const { config } = usePlatformConfig();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Destination redirect after successful login
  const rawFrom = (location.state as any)?.from?.pathname;
  const from = (rawFrom && rawFrom !== '/login' && rawFrom !== '/register' && rawFrom !== '/sign-in' && rawFrom !== '/sign-up') ? rawFrom : '/';

  // Automatically redirect if already authenticated
  React.useEffect(() => {
    if (isLoaded && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isLoaded, isAuthenticated, navigate, from]);

  const validateForm = () => {
    if (!emailOrPhone.trim()) {
      setError('Please enter your college or personal email address.');
      return false;
    }
    if (!password) {
      setError('Please enter your account password.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (config?.website?.allowLogin === false) {
      setError('Student portal sign-in is temporarily paused by platform administration.');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Optional pre-check student access if backend is reachable
      try {
        const checkRes = await fetch('/api/public/check-student-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailOrPhone.trim() }),
        });
        if (checkRes.ok) {
          const access = await checkRes.json();
          if (access.allowLogin === false) {
            setIsLoading(false);
            setError('Student portal sign-in is temporarily disabled by platform administration.');
            return;
          }
          if (access.suspended) {
            setIsLoading(false);
            setError('This student account is currently suspended. Please contact KAMPUS Support.');
            return;
          }
        }
      } catch {
        // Continue to primary auth flow
      }

      const result = await login(emailOrPhone.trim(), password, rememberMe);
      setIsLoading(false);

      if (result.success) {
        if ((result as any).requiresVerification) {
          navigate('/verify-email');
        } else {
          navigate(from, { replace: true });
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Unable to complete sign-in. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (config?.website?.allowLogin === false) {
      setError('Student portal sign-in is temporarily paused by platform administration.');
      return;
    }

    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    setIsGoogleLoading(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <AuthLayout
      brandQuote="Your single gateway to academic resources, student communities, and verified campus credentials."
      brandAuthor="KAMPUS Technology Services"
      highlightTag="Official Student Portal"
    >
      <AuthFormContainer
        heading="Welcome back"
        subheading="Sign in to continue your KAMPUS experience."
        footer={
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
            >
              Create your student account
            </Link>
          </p>
        }
      >
        {/* Developer / Deployment Setup Notice */}
        <ClerkSetupNotice isConfigured={isClerkConfigured} />

        {/* Error Alert */}
        <AuthErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Google OAuth Button */}
        <GoogleSignInButton
          isLoading={isGoogleLoading}
          onClick={handleGoogleSignIn}
        />

        {/* Divider */}
        <AuthDivider text="or sign in with email" />

        {/* Standard Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthInput
            label="Email address"
            type="email"
            placeholder="Enter your college or personal email"
            value={emailOrPhone}
            onChange={(e) => {
              setEmailOrPhone(e.target.value);
              if (error) setError('');
            }}
            icon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            required
            autoFocus
          />

          <div>
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              autoComplete="current-password"
              required
            />
            <div className="flex items-center justify-between mt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Remember this device
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <PrimaryAuthButton
              type="submit"
              isLoading={isLoading}
              loadingText="Signing in..."
            >
              Sign in
            </PrimaryAuthButton>
          </div>
        </form>

        {/* Institutional Trust Footer Note */}
        <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-3">
          Secured with 256-bit institutional authentication encryption.
        </p>
      </AuthFormContainer>
    </AuthLayout>
  );
};
