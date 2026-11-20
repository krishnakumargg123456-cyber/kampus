import React, { useState } from 'react';
import { KeyRound, ExternalLink, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface ClerkSetupNoticeProps {
  isConfigured: boolean;
}

export const ClerkSetupNotice: React.FC<ClerkSetupNoticeProps> = ({ isConfigured }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isConfigured) {
    return (
      <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Clerk Cloud Auth Connected</span>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-3.5 text-left text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-semibold">
          <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Clerk Authentication Ready</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1 font-medium text-[11px]"
        >
          {isOpen ? (
            <>
              Hide setup <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Setup guide <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      </div>

      <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
        KAMPUS is fully integrated with Clerk. Add your publishable key in <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-mono text-[11px]">.env</code> to activate live Cloud & Google OAuth.
      </p>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/60 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
          <ol className="list-decimal pl-4 space-y-1">
            <li>Create an application at <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium inline-flex items-center gap-0.5">dashboard.clerk.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
            <li>Enable Email + Password, Email Verification Code, and Google OAuth</li>
            <li>Copy your keys into <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded">.env</code>:
              <pre className="mt-1 p-2 rounded bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto">
{`VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...`}
              </pre>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
