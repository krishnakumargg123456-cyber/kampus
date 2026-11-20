import React, { useEffect } from 'react';
import { AuthenticateWithRedirectCallback } from "@clerk/react";
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SsoCallbackPage: React.FC = () => {
  const { isClerkConfigured } = useAuth();
  const navigate = useNavigate();

  if (isClerkConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/"
          signUpForceRedirectUrl="/onboarding"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/onboarding"
          continueSignUpUrl="/onboarding"
        />
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Completing your secure campus sign in...</span>
        </div>
      </div>
    );
  }

  // Fallback if accessed without Clerk
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg mb-4">
        <GraduationCap className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
        Redirecting to KAMPUS
      </h2>
      <p className="mt-2 text-xs text-slate-500 max-w-sm">
        Completing authentication. Click below if you are not automatically redirected.
      </p>
      <button
        onClick={() => navigate('/')}
        className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
      >
        Go to Student Dashboard
      </button>
    </div>
  );
};
