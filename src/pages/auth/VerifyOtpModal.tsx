import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';

interface VerifyOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<{ success: boolean; error?: string }>;
  emailOrPhone: string;
}

export const VerifyOtpModal: React.FC<VerifyOtpModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  emailOrPhone,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleAutoFill = () => {
    setDigits(['8', '4', '2', '1', '0', '9']);
    setError('');
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the OTP code.');
      return;
    }
    setIsVerifying(true);
    const result = await onVerify(code);
    setIsVerifying(false);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Verify Student Identity
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We sent a 6-digit verification code to <strong className="text-slate-800 dark:text-slate-200">{emailOrPhone || 'your mobile / university email'}</strong>.
          </p>

          {/* 6-Digit input boxes */}
          <div className="flex items-center justify-between gap-2 pt-2">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            ))}
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-600 dark:text-rose-400 text-center">
              {error}
            </div>
          )}

          {/* Demo helper quick fill */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={handleAutoFill}
              type="button"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Auto-fill Demo Code (842109)
            </button>
            <span className="text-slate-400">
              {timer > 0 ? `Resend in ${timer}s` : (
                <button
                  onClick={() => setTimer(45)}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </span>
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Verify & Proceed to Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
