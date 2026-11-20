import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AuthErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  message,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-2.5 p-3.5 rounded-xl text-xs sm:text-sm font-medium
        bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60
        text-rose-800 dark:text-rose-200 shadow-xs transition-all ${className}
      `}
    >
      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
      <span className="flex-1 leading-relaxed text-left">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 rounded text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
          aria-label="Dismiss message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
