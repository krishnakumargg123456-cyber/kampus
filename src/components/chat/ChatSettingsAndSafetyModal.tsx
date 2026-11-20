import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Database,
  Flag,
  Lock,
  Sliders,
  X,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { CHAT_REPORT_REASONS, formatBytes } from '../../data/chatData';
import { ChatSafetyReport, WhoCanMessagePref } from '../../types/chat';

/* ----------------------------------------------------------
   1. CHAT SETTINGS VIEW (Screen 6 / Modal)
---------------------------------------------------------- */
interface ChatSettingsViewProps {
  onBack: () => void;
}

export const ChatSettingsView: React.FC<ChatSettingsViewProps> = ({ onBack }) => {
  const {
    currentUserId,
    settings,
    updateSettings,
    blockedUserIds,
    students,
    toggleBlockUser,
    conversations,
    messagesByConv,
    reports,
  } = useChat();

  const storageStats = useMemo(() => {
    let mediaCount = 0;
    let docCount = 0;
    let totalBytes = 0;
    Object.values(messagesByConv).forEach((list) => {
      list.forEach((m) => {
        if (m.attachment) {
          totalBytes += m.attachment.sizeBytes || 0;
          if (m.attachment.kind === 'image') mediaCount += 1;
          else docCount += 1;
        }
      });
    });
    return { mediaCount, docCount, totalBytes };
  }, [messagesByConv]);

  const mutedCount = conversations.filter((c) => c.userPrefs[currentUserId]?.muted).length;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Chat Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Privacy */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600" /> Privacy
          </h3>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Who can message me
                </p>
                <p className="text-xs text-slate-500">Controls incoming direct chat &amp; request permissions</p>
              </div>
              <select
                value={settings.whoCanMessage}
                onChange={(e) =>
                  updateSettings({ whoCanMessage: e.target.value as WhoCanMessagePref })
                }
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100"
              >
                <option value="everyone">Everyone on KAMPUS</option>
                <option value="study-partners">Study Partners only</option>
                <option value="group-members">Shared Group Members</option>
                <option value="nobody">No one (disable requests)</option>
              </select>
            </div>

            {(
              [
                ['showOnlineStatus', 'Show online status when connected'],
                ['showLastSeen', 'Show last seen timestamp'],
                ['sendReadReceipts', 'Send read receipts when viewing chats'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm cursor-pointer">
                <span className="text-slate-700 dark:text-slate-200">{label}</span>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => updateSettings({ [key]: e.target.checked })}
                  className="accent-blue-600"
                />
              </label>
            ))}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Blocked Users ({blockedUserIds.length})
              </p>
              {blockedUserIds.length === 0 ? (
                <p className="text-xs text-slate-500">No blocked users.</p>
              ) : (
                <div className="space-y-1.5">
                  {blockedUserIds.map((uid) => {
                    const stu = students.find((s) => s.id === uid);
                    return (
                      <div key={uid} className="flex items-center justify-between text-xs">
                        <span className="text-slate-800 dark:text-slate-200">{stu?.name || uid}</span>
                        <button
                          type="button"
                          onClick={() => toggleBlockUser(uid)}
                          className="text-blue-600 font-semibold hover:underline cursor-pointer"
                        >
                          Unblock
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 inline-flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-orange-500" /> Notifications
          </h3>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="text-slate-700 dark:text-slate-200">Direct message alerts</span>
              <input
                type="checkbox"
                checked={settings.messageAlerts}
                onChange={(e) => updateSettings({ messageAlerts: e.target.checked })}
                className="accent-blue-600"
              />
            </label>
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="text-slate-700 dark:text-slate-200">Group &amp; study alerts</span>
              <input
                type="checkbox"
                checked={settings.groupAlerts}
                onChange={(e) => updateSettings({ groupAlerts: e.target.checked })}
                className="accent-blue-600"
              />
            </label>
            <p className="text-xs text-slate-500 tabular-nums">
              Muted conversations: {mutedCount}
            </p>
          </div>
        </section>

        {/* Storage */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 inline-flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" /> Shared Media &amp; Storage
          </h3>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-3 gap-3 text-center tabular-nums">
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{storageStats.mediaCount}</p>
              <p className="text-[11px] text-slate-500">Media files</p>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">{storageStats.docCount}</p>
              <p className="text-[11px] text-slate-500">Docs &amp; Audio</p>
            </div>
            <div>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                {formatBytes(storageStats.totalBytes)}
              </p>
              <p className="text-[11px] text-slate-500">Uploaded size</p>
            </div>
          </div>
        </section>

        {/* Preferences & Honest Security Disclosure */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 inline-flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-500" /> Chat Preferences
          </h3>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="text-slate-700 dark:text-slate-200">Compact conversation list</span>
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(e) => updateSettings({ compactMode: e.target.checked })}
                className="accent-blue-600"
              />
            </label>
            <label className="flex items-center justify-between text-sm cursor-pointer">
              <span className="text-slate-700 dark:text-slate-200">Auto-preview shared media</span>
              <input
                type="checkbox"
                checked={settings.autoDownloadMedia}
                onChange={(e) => updateSettings({ autoDownloadMedia: e.target.checked })}
                className="accent-blue-600"
              />
            </label>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800">
              Security note: Messages are access-controlled per conversation participant on the KAMPUS server. End-to-end client key encryption is not enabled. Submitted safety reports: {reports.length}.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   2. CHAT REPORT MODAL
---------------------------------------------------------- */
interface ChatReportModalProps {
  target: {
    targetType: ChatSafetyReport['targetType'];
    targetId: string;
    targetSummary: string;
  } | null;
  onClose: () => void;
}

export const ChatReportModal: React.FC<ChatReportModalProps> = ({ target, onClose }) => {
  const { submitReport } = useChat();
  const [reason, setReason] = useState(CHAT_REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitReport({
      ...target,
      reason,
      details,
    });
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-orange-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Report {target.targetType}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 truncate">
            {target.targetSummary}
          </p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          >
            {CHAT_REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Additional details for moderation..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   3. CONFIRM DESTRUCTIVE ACTION MODAL
---------------------------------------------------------- */
interface ConfirmActionModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
