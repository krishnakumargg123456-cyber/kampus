import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { REPORT_REASONS } from '../../data/communityData';
import { ReportReason, SafetyReport } from '../../types/community';
import { useCommunity } from '../../context/CommunityContext';

interface ReportSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: SafetyReport['targetType'];
  targetId: string;
  targetTitle: string;
}

export const ReportSafetyModal: React.FC<ReportSafetyModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { submitSafetyReport } = useCommunity();
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSafetyReport({
      targetType,
      targetId,
      targetTitle,
      reason,
      details,
    });
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-orange-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Report Content</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3">
            Reporting {targetType}: <span className="font-semibold text-slate-900 dark:text-slate-100">{targetTitle}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Reason
            </label>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((item) => (
                <label
                  key={item}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                    reason === item
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={reason === item}
                    onChange={() => setReason(item)}
                    className="accent-blue-600"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Additional Context (Optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain what happened so community moderators can review..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reports are recorded with status <strong className="text-slate-700 dark:text-slate-200">Submitted</strong> until reviewed by community moderators.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
