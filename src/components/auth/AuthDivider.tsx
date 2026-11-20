import React from 'react';

interface AuthDividerProps {
  text?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text = 'or continue with email' }) => {
  return (
    <div className="relative my-6 select-none">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-slate-50 dark:bg-slate-950 px-3 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
          {text}
        </span>
      </div>
    </div>
  );
};
