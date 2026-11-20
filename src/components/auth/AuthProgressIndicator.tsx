import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  title: string;
  shortTitle?: string;
}

interface AuthProgressIndicatorProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export const AuthProgressIndicator: React.FC<AuthProgressIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = onStepClick && step.id < currentStep;

          return (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-2 ${
                  isClickable ? 'cursor-pointer hover:opacity-80' : ''
                }`}
                onClick={() => isClickable && onStepClick(step.id)}
              >
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${
                      isCompleted
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                </div>
                <span
                  className={`hidden sm:inline text-xs font-semibold ${
                    isCurrent
                      ? 'text-slate-900 dark:text-white'
                      : isCompleted
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-3 transition-colors ${
                    step.id < currentStep
                      ? 'bg-blue-600'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
