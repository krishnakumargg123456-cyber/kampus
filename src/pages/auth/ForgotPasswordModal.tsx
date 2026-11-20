import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Lock, ArrowRight, KeyRound } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailOrPhone.trim()) {
      setError('Please enter your registered student email or mobile number.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('reset');
    }, 700);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
    }, 700);
  };

  const handleFinish = () => {
    onClose();
    setStep('request');
    setEmailOrPhone('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              {step === 'request' && 'Reset Password'}
              {step === 'reset' && 'Create New Password'}
              {step === 'success' && 'Password Updated!'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequestSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your registered college email or 10-digit mobile number. We will send a secure password reset link or SMS code.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                College Email or Mobile
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. priya.sharma@cse.iitb.ac.in"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Sending verification...' : 'Send Reset Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A temporary authorization token was verified for <strong className="text-slate-700 dark:text-slate-200">{emailOrPhone}</strong>. Choose a strong new password.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
            >
              {isLoading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="mt-4 text-center space-y-3 py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Password Changed Successfully
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your KAMPUS security credentials have been updated. You can now log in with your new password.
            </p>
            <button
              onClick={handleFinish}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
