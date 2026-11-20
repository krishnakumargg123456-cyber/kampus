import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export const AdminCard: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, children, className = '' }) => (
  <section
    className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${className}`}
  >
    {(title || action) && (
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && (
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </section>
);

export const AdminMetricTile: React.FC<{
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'blue';
}> = ({ label, value, detail, tone = 'default' }) => {
  const toneBorder =
    tone === 'blue'
      ? 'border-t-2 border-t-blue-600'
      : tone === 'success'
      ? 'border-t-2 border-t-emerald-600'
      : tone === 'warning'
      ? 'border-t-2 border-t-amber-600'
      : tone === 'danger'
      ? 'border-t-2 border-t-red-600'
      : '';

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 ${toneBorder}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
        {value}
      </div>
      {detail && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{detail}</div>
      )}
    </div>
  );
};

export const StatusLabel: React.FC<{
  status: string;
}> = ({ status }) => {
  const norm = status.toLowerCase();
  const color =
    norm.includes('active') ||
    norm.includes('publish') ||
    norm.includes('approv') ||
    norm.includes('connect') ||
    norm.includes('healthy') ||
    norm.includes('success') ||
    norm.includes('resolved') ||
    norm.includes('verified')
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900'
      : norm.includes('suspend') ||
        norm.includes('reject') ||
        norm.includes('danger') ||
        norm.includes('fail') ||
        norm.includes('denied') ||
        norm.includes('urgent') ||
        norm.includes('remove') ||
        norm.includes('offline')
      ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900'
      : norm.includes('maint') ||
        norm.includes('pending') ||
        norm.includes('review') ||
        norm.includes('draft') ||
        norm.includes('sched') ||
        norm.includes('warn') ||
        norm.includes('unverified') ||
        norm.includes('degraded')
      ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900'
      : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${color}`}
    >
      {status}
    </span>
  );
};

export const AdminFeedbackBanner: React.FC<{
  notice: { kind: 'success' | 'error' | 'info'; message: string } | null;
  onDismiss: () => void;
}> = ({ notice, onDismiss }) => {
  if (!notice) return null;
  const Icon = notice.kind === 'success' ? CheckCircle2 : notice.kind === 'error' ? AlertTriangle : Info;
  const styles =
    notice.kind === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
      : notice.kind === 'error'
      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
      : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300';

  return (
    <div className={`px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${styles}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" />
        <span>{notice.message}</span>
      </div>
      <button type="button" onClick={onDismiss} className="p-1 rounded-md hover:bg-black/5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const AdminConfirmModal: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, description, confirmLabel = 'Confirm Action', danger = false, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              danger
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export function formatShortDate(iso?: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
