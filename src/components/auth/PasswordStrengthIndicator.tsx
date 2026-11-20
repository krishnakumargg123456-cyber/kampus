import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
}

export interface PasswordAnalysis {
  score: number; // 0 - 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'None';
  color: string;
  barColor: string;
  criteria: {
    length: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function evaluatePassword(pwd: string): PasswordAnalysis {
  if (!pwd) {
    return {
      score: 0,
      label: 'None',
      color: 'text-slate-400',
      barColor: 'bg-slate-200 dark:bg-slate-800',
      criteria: {
        length: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const length = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  const criteriaCount = [length, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  let score = 0;
  let label: PasswordAnalysis['label'] = 'Weak';
  let color = 'text-rose-600 dark:text-rose-400';
  let barColor = 'bg-rose-500';

  if (criteriaCount <= 2 || pwd.length < 6) {
    score = 1;
    label = 'Weak';
    color = 'text-rose-600 dark:text-rose-400';
    barColor = 'bg-rose-500';
  } else if (criteriaCount === 3) {
    score = 2;
    label = 'Fair';
    color = 'text-amber-600 dark:text-amber-400';
    barColor = 'bg-amber-500';
  } else if (criteriaCount === 4) {
    score = 3;
    label = 'Good';
    color = 'text-blue-600 dark:text-blue-400';
    barColor = 'bg-blue-500';
  } else {
    score = 4;
    label = 'Strong';
    color = 'text-emerald-600 dark:text-emerald-400';
    barColor = 'bg-emerald-500';
  }

  return {
    score,
    label,
    color,
    barColor,
    criteria: {
      length,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
    },
  };
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showCriteria = true,
}) => {
  if (!password) return null;

  const analysis = evaluatePassword(password);

  return (
    <div className="w-full space-y-2 pt-1 text-left">
      {/* 4 Segment Progress Bar */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              analysis.score >= step
                ? analysis.barColor
                : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500 dark:text-slate-400 font-medium">Password strength</span>
        <span className={`font-semibold ${analysis.color}`}>{analysis.label}</span>
      </div>

      {showCriteria && (
        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            {analysis.criteria.length ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className={analysis.criteria.length ? 'text-slate-700 dark:text-slate-300 font-medium' : ''}>
              At least 8 characters
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {analysis.criteria.hasUppercase && analysis.criteria.hasLowercase ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className={analysis.criteria.hasUppercase && analysis.criteria.hasLowercase ? 'text-slate-700 dark:text-slate-300 font-medium' : ''}>
              Upper & lower case
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {analysis.criteria.hasNumber ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className={analysis.criteria.hasNumber ? 'text-slate-700 dark:text-slate-300 font-medium' : ''}>
              At least 1 number
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {analysis.criteria.hasSpecial ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className={analysis.criteria.hasSpecial ? 'text-slate-700 dark:text-slate-300 font-medium' : ''}>
              Special character (!@#$)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
