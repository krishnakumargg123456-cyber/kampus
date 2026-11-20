import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAdminAuth();

  const [email, setEmail] = useState('admin@kampus.edu.in');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.ok) {
      navigate('/admin/dashboard');
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  const quickFillRole = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('KampusAdmin@2026');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-2 text-center">
        <div className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#172554] text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              KAMPUS Control Center
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Super Admin Portal
            </div>
          </div>
        </div>
        <h1 className="pt-3 text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Administrator Sign In
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Centralized governance, CMS publishing, feature toggles, moderation, and platform analytics.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-medium">
              {error}
            </div>
          )}

          {/* Quick Role Verification Bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Demo Administrator Credentials
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickFillRole('admin@kampus.edu.in')}
                className="px-2.5 py-1.5 rounded-lg bg-[#172554] hover:bg-blue-700 text-white text-[11px] font-semibold text-left transition-colors"
              >
                Super Admin
                <span className="block text-[10px] text-blue-200 font-normal truncate">
                  admin@kampus.edu.in
                </span>
              </button>
              <button
                type="button"
                onClick={() => quickFillRole('content@kampus.edu.in')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 text-[11px] font-semibold text-left transition-colors"
              >
                Content Manager
                <span className="block text-[10px] text-slate-400 font-normal truncate">
                  content@kampus.edu.in
                </span>
              </button>
              <button
                type="button"
                onClick={() => quickFillRole('mod@kampus.edu.in')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 text-[11px] font-semibold text-left transition-colors"
              >
                Moderator
                <span className="block text-[10px] text-slate-400 font-normal truncate">
                  mod@kampus.edu.in
                </span>
              </button>
              <button
                type="button"
                onClick={() => quickFillRole('support@kampus.edu.in')}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200 text-[11px] font-semibold text-left transition-colors"
              >
                Support Admin
                <span className="block text-[10px] text-slate-400 font-normal truncate">
                  support@kampus.edu.in
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <span>{submitting ? 'Verifying Session...' : 'Sign In to Control Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <Link to="/" className="hover:text-blue-600 font-medium">
              Back to Student App
            </Link>
            <span className="font-mono text-[11px]">RBAC Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
