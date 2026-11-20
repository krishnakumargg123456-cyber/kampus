import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';

interface AuthFormContainerProps {
  heading: string;
  subheading?: string;
  badge?: string;
  backTo?: {
    label: string;
    href: string;
  };
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AuthFormContainer: React.FC<AuthFormContainerProps> = ({
  heading,
  subheading,
  badge,
  backTo,
  children,
  footer,
  maxWidth = 'md',
}) => {
  const widthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  }[maxWidth];

  return (
    <div className={`w-full ${widthClass} mx-auto px-4 py-8 sm:px-6`}>
      {/* Mobile Brand Bar (Visible on mobile only when brand panel is hidden) */}
      <div className="lg:hidden flex items-center justify-between mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100">
            KAMPUS
          </span>
        </Link>
        {backTo && (
          <Link
            to={backTo.href}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backTo.label}</span>
          </Link>
        )}
      </div>

      {/* Desktop Optional Back Link */}
      {backTo && (
        <div className="hidden lg:block mb-6">
          <Link
            to={backTo.href}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{backTo.label}</span>
          </Link>
        </div>
      )}

      {/* Header Block */}
      <div className="mb-6">
        {badge && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
              {badge}
            </span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {heading}
        </h1>
        {subheading && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {subheading}
          </p>
        )}
      </div>

      {/* Form Content Wrapper */}
      <div className="space-y-5">
        {children}
      </div>

      {/* Footer Content */}
      {footer && (
        <div className="mt-6 pt-6 border-t border-slate-200/70 dark:border-slate-800/80 text-center">
          {footer}
        </div>
      )}
    </div>
  );
};
