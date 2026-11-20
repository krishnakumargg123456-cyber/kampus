import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, hint, icon, rightElement, id, className = '', disabled, ...props }, ref) => {
    const inputId = id || `auth-input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
          {hint && !error && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</span>
          )}
        </div>

        <div className="relative rounded-xl shadow-xs transition-all">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`
              w-full rounded-xl bg-white dark:bg-slate-900 border text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500
              transition-all duration-150 outline-hidden
              ${icon ? 'pl-10' : 'pl-3.5'}
              ${rightElement ? 'pr-11' : 'pr-3.5'}
              py-2.5 sm:py-3
              ${
                error
                  ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15'
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-3 focus:ring-blue-600/15'
              }
              ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : ''}
              ${className}
            `}
            {...props}
          />

          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <div
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 mt-1"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
