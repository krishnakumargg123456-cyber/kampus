import React from 'react';
import { Loader2 } from 'lucide-react';

interface PrimaryAuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
}

export const PrimaryAuthButton: React.FC<PrimaryAuthButtonProps> = ({
  children,
  isLoading = false,
  loadingText = 'Please wait...',
  variant = 'primary',
  icon,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-150 focus:outline-hidden focus:ring-3 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-600/25 border border-blue-500/30 focus:ring-blue-500/20',
    secondary:
      'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-800 dark:border-slate-700 focus:ring-slate-500/20',
    outline:
      'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus:ring-slate-400/20',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-600/20 border border-rose-500/30 focus:ring-rose-500/20',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
