import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { AuthInput, AuthInputProps } from './AuthInput';

export interface PasswordInputProps extends Omit<AuthInputProps, 'type' | 'rightElement'> {
  showToggle?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label = 'Password', showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleButton = showToggle ? (
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword(!showPassword)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    ) : undefined;

    return (
      <AuthInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        label={label}
        icon={<Lock className="w-4 h-4" />}
        rightElement={toggleButton}
        autoComplete={props.autoComplete || 'current-password'}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
