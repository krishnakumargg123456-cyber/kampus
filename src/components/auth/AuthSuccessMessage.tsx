import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface AuthSuccessMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const AuthSuccessMessage: React.FC<AuthSuccessMessageProps> = ({
  message,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className={`
        flex items-start gap-2.5 p-3.5 rounded-xl text-xs sm:text-sm font-medium
        bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60
        text-emerald-800 dark:text-emerald-200 shadow-xs transition-all ${className}
      `}
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
      <span className="flex-1 leading-relaxed text-left">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-0.5 rounded text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
          aria-label="Dismiss message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
