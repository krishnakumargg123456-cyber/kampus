import React, { useRef, useEffect } from 'react';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  hasError?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  hasError = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array of digits based on length
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) {
      // Cleared
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      return;
    }

    const char = val[val.length - 1]; // take the last typed digit
    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('');
    onChange(combined);

    // Auto-advance to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 py-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => {
        const isFilled = !!digits[index];
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digits[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            aria-label={`Digit ${index + 1} of verification code`}
            className={`
              w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl
              bg-white dark:bg-slate-900 border transition-all duration-150 outline-hidden select-all
              ${
                hasError
                  ? 'border-rose-400 dark:border-rose-600 text-rose-600 dark:text-rose-400 focus:ring-3 focus:ring-rose-500/20'
                  : isFilled
                  ? 'border-blue-600 dark:border-blue-500 text-slate-900 dark:text-slate-100 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/20'
                  : 'border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-700 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-950' : ''}
            `}
          />
        );
      })}
    </div>
  );
};
