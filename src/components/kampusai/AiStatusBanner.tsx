import React from 'react';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';

interface AiStatusBannerProps {
  compact?: boolean;
  errorOverride?: string | null;
  onRetry?: () => void;
}

export const AiStatusBanner: React.FC<AiStatusBannerProps> = ({
  compact = false,
  errorOverride,
  onRetry,
}) => {
  const { serviceStatus, statusLoading, refreshStatus } = useKampusAi();

  if (statusLoading && !serviceStatus) {
    return (
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
        <span>Checking KAMPUS AI service status...</span>
      </div>
    );
  }

  if (errorOverride) {
    return (
      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <span className="font-bold">AI Request Error: </span>
            <span>{errorOverride}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry || refreshStatus}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-200 font-semibold hover:bg-rose-100 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (serviceStatus && !serviceStatus.available) {
    return (
      <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-xs text-orange-900 dark:text-orange-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-orange-600 dark:text-orange-400" />
          <div>
            <span className="font-bold">AI Service Configuration Required: </span>
            <span>{serviceStatus.message}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={refreshStatus}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-200 font-semibold hover:bg-orange-100 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Recheck Status</span>
        </button>
      </div>
    );
  }

  if (compact || !serviceStatus) return null;

  return (
    <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          KAMPUS AI Ready
        </span>
        <span className="text-slate-400">·</span>
        <span>{serviceStatus.provider}</span>
        <span className="text-slate-400">·</span>
        <span>Max upload 10 MB ({serviceStatus.supportedFormats.join(', ')})</span>
      </div>
      {serviceStatus.checkedAt && (
        <span className="text-[11px] text-slate-400 tabular-nums">
          Checked {serviceStatus.checkedAt}
        </span>
      )}
    </div>
  );
};
