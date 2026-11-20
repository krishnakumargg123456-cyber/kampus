import React from 'react';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  text?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  isLoading = false,
  text = 'Continue with Google',
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 rounded-xl
        bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80
        text-slate-800 dark:text-slate-100 text-sm font-semibold
        border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700
        shadow-xs transition-all duration-150 focus:outline-hidden focus:ring-3 focus:ring-slate-400/20
        disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          <span>Connecting to Google...</span>
        </>
      ) : (
        <>
          {/* Official Google 4-color G SVG */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.25 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          <span>{text}</span>
        </>
      )}
    </button>
  );
};
