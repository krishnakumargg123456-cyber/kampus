import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Flag,
  KeyRound,
  Lock,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  X,
} from 'lucide-react';
import { useCampusPulse } from '../../context/CampusPulseContext';
import {
  formatPulseDateTime,
  formatPulseFileSize,
  formatPulseShortDate,
  getPulseCategoryLabel,
  PULSE_REPORT_REASONS,
} from '../../data/campusPulseData';
import type {
  CampusAnnouncement,
  PulseAiAction,
  PulseNotificationPrefs,
} from '../../types/campusPulse';

interface NoticeDetailModalProps {
  notice: CampusAnnouncement | null;
  onClose: () => void;
  onSelectNotice: (notice: CampusAnnouncement) => void;
  onOpenReport: (target: {
    targetType: 'announcement' | 'lost-found' | 'poll' | 'submission';
    targetId: string;
    targetTitle: string;
  }) => void;
}

export const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({
  notice,
  onClose,
  onSelectNotice,
  onOpenReport,
}) => {
  const {
    announcements,
    savedNoticeIds,
    toggleSavedNotice,
    recordAnnouncementView,
    askCampusAiOnNotice,
    roleInfo,
    modifyAnnouncement,
    showToast,
  } = useCampusPulse();

  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // KAMPUS AI contextual notice tools
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiActionLabel, setAiActionLabel] = useState<string>('');
  const [aiQuestion, setAiQuestion] = useState('');

  useEffect(() => {
    if (!notice) return;
    setAiResponse(null);
    setAiError(null);
    setAiQuestion('');
    const firstPdf = notice.attachments.find((a) => a.kind === 'pdf');
    setPreviewPdfUrl(firstPdf ? firstPdf.url : null);
    recordAnnouncementView(notice.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice?.id]);

  if (!notice) return null;

  const isSaved = savedNoticeIds.includes(notice.id);
  const relatedNotices = announcements
    .filter(
      (a) =>
        a.id !== notice.id &&
        a.institutionId === notice.institutionId &&
        a.status !== 'Archived' &&
        (a.departmentId === notice.departmentId || a.categoryId === notice.categoryId)
    )
    .slice(0, 3);

  const handleShare = async () => {
    const shareText = `${notice.title}\nSource: ${notice.publishingAuthority} (${notice.departmentName})\nPublished: ${formatPulseShortDate(notice.publishedAt)}`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      showToast('Notice reference copied to clipboard.');
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      showToast('Ready to share notice details.');
    }
  };

  const runAiTool = async (action: PulseAiAction, label: string) => {
    if (action === 'ask-question' && !aiQuestion.trim()) return;
    setAiOpen(true);
    setAiLoading(true);
    setAiError(null);
    setAiActionLabel(label);
    const result = await askCampusAiOnNotice(notice, action, aiQuestion);
    setAiLoading(false);
    if (result.error) {
      setAiError(result.error);
    } else {
      setAiResponse(result.text);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={notice.title}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden my-auto">
        {/* Sticky Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-900">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
              <span
                className={`font-semibold inline-flex items-center gap-1 ${
                  notice.isOfficial
                    ? 'text-[#172554] dark:text-blue-300'
                    : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {notice.isOfficial ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>{notice.verificationLabel}</span>
              </span>
              {notice.circularCode && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {notice.circularCode}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>Status: {notice.status}</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  notice.priority === 'Critical'
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : notice.priority === 'High'
                      ? 'text-[#F97316] font-semibold'
                      : ''
                }
              >
                {notice.priority} Priority
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#172033] dark:text-slate-100 mt-1.5 leading-snug">
              {notice.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 shrink-0"
            aria-label="Close notice detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Attribution Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Issuing Authority</span>
              <span className="font-semibold text-[#172033] dark:text-slate-100 mt-0.5 block">
                {notice.publishingAuthority}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Department</span>
              <span className="font-semibold text-[#172033] dark:text-slate-100 mt-0.5 block">
                {notice.departmentName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">
                Published {notice.deadlineAt ? '& Deadline' : 'Timestamp'}
              </span>
              <span className="font-semibold text-[#172033] dark:text-slate-100 mt-0.5 block tabular-nums">
                {formatPulseDateTime(notice.publishedAt)}
              </span>
              {notice.deadlineAt && (
                <span className="text-[#F97316] font-semibold mt-0.5 block tabular-nums">
                  Deadline: {formatPulseDateTime(notice.deadlineAt)}
                </span>
              )}
            </div>
          </div>

          {/* Unverified / Restricted Warning Banner if applicable */}
          {!notice.isOfficial && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Student-Submitted Update: </span>
                Reviewed for campus community sharing, not an official institutional circular.
              </div>
            </div>
          )}

          {notice.isRestricted && (
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <Lock className="w-4 h-4 text-[#172554] dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Restricted Audience Scope: </span>
                Intended for {notice.restrictedAudienceLabel || notice.departmentName}.
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => toggleSavedNotice(notice.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors ${
                isSaved
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved' : 'Save Notice'}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {copiedShare ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>{copiedShare ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => setAiOpen((p) => !p)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-[#172554] text-white hover:bg-blue-950"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>KAMPUS AI Notice Assistant</span>
            </button>

            <button
              onClick={() =>
                onOpenReport({
                  targetType: 'announcement',
                  targetId: notice.id,
                  targetTitle: notice.title,
                })
              }
              className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 ml-auto"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report Inaccuracy</span>
            </button>
          </div>

          {/* KAMPUS AI Contextual Notice Panel */}
          {aiOpen && (
            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-blue-200 dark:border-blue-900/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#172554] dark:text-blue-300">
                  <Bot className="w-4 h-4 text-[#2563EB]" />
                  <span>KAMPUS AI Notice Breakdown</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    · Strictly grounded in {notice.circularCode || notice.id}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'summarize' as PulseAiAction, label: 'Summarize Notice' },
                  { id: 'simple-explain' as PulseAiAction, label: 'Simple Language' },
                  { id: 'extract-deadlines' as PulseAiAction, label: 'Extract Dates & Docs' },
                  { id: 'bullet-summary' as PulseAiAction, label: 'Action Bullets' },
                  { id: 'translate-hindi' as PulseAiAction, label: 'Hindi Summary' },
                  { id: 'translate-hinglish' as PulseAiAction, label: 'Hinglish Summary' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => runAiTool(btn.id, btn.label)}
                    disabled={aiLoading}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] disabled:opacity-50"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runAiTool('ask-question', 'Answer from Notice');
                  }}
                  placeholder="Ask a question about eligibility, deadlines, or documents in this notice..."
                  className="flex-1 px-3 py-2 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <button
                  onClick={() => runAiTool('ask-question', 'Answer from Notice')}
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Ask AI
                </button>
              </div>

              {aiLoading && (
                <div className="text-xs text-slate-500 dark:text-slate-400 py-2">
                  Analyzing notice text via KAMPUS AI...
                </div>
              )}

              {aiError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                  {aiError}
                </div>
              )}

              {aiResponse && !aiLoading && (
                <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#2563EB]">
                      AI Generated · {aiActionLabel}
                    </span>
                    <span>Refer to original notice for authoritative confirmation</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {aiResponse}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Notice Content */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Full Notice Content
            </h3>
            <div className="text-sm text-[#172033] dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {notice.content}
            </div>
          </div>

          {/* Attachments & Inline PDF Preview */}
          {notice.attachments.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Attached Official Documents ({notice.attachments.length})
              </h3>
              <div className="space-y-2">
                {notice.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {att.fileName}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                          {att.mimeType} · {formatPulseFileSize(att.sizeBytes)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {att.kind === 'pdf' && (
                        <button
                          onClick={() =>
                            setPreviewPdfUrl((cur) => (cur === att.url ? null : att.url))
                          }
                          className="px-3 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB]"
                        >
                          {previewPdfUrl === att.url ? 'Hide PDF Preview' : 'Preview PDF'}
                        </button>
                      )}
                      <a
                        href={att.url}
                        download={att.fileName}
                        className="px-3 py-1.5 rounded-lg font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        aria-label="Open document in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {previewPdfUrl && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-950">
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>Document Preview (PDF)</span>
                    <a
                      href={previewPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline"
                    >
                      Open full screen
                    </a>
                  </div>
                  <iframe
                    src={previewPdfUrl}
                    title="Official Notice PDF Preview"
                    className="w-full h-72 sm:h-96 bg-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* Staff Controls when authorized */}
          {roleInfo.role !== 'Student' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Staff Controls ({roleInfo.role})
              </span>
              <div className="flex items-center gap-2">
                {roleInfo.role === 'Institutional Admin' && (
                  <button
                    onClick={() => modifyAnnouncement(notice.id, 'toggle-pin')}
                    className="px-3 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB]"
                  >
                    {notice.isPinned ? 'Unpin Notice' : 'Pin Notice'}
                  </button>
                )}
                <button
                  onClick={() => modifyAnnouncement(notice.id, 'archive')}
                  className="px-3 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#F97316]"
                >
                  {notice.status === 'Archived' ? 'Restore Notice' : 'Archive Notice'}
                </button>
              </div>
            </div>
          )}

          {/* Related Notices */}
          {relatedNotices.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Related Notices
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {relatedNotices.map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => onSelectNotice(rel)}
                    className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] transition-colors bg-white dark:bg-slate-900"
                  >
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {getPulseCategoryLabel(rel.categoryId)} · {formatPulseShortDate(rel.publishedAt)}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1 line-clamp-2">
                      {rel.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const StaffRolePortalModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { roleInfo, switchStaffSession } = useCampusPulse();
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await switchStaffSession(passkey, false);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Invalid passkey.');
    } else {
      setPasskey('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Institutional Role Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current Active Role: <span className="font-semibold">{roleInfo.role}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Official notice publishing, submission moderation, and publishing analytics are strictly
          enforced on the backend. Authorized campus staff can unlock publishing permissions using
          their institutional passkey.
        </p>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
          <div className="font-semibold text-slate-800 dark:text-slate-100">
            Sandbox Verification Codes
          </div>
          <div>
            Institutional Admin: <code className="font-mono font-semibold">IITB-REG-2026</code>
          </div>
          <div>
            Department Admin (CSE): <code className="font-mono font-semibold">IITB-CSE-2026</code>
          </div>
          <div>
            Authorized Publisher (Services):{' '}
            <code className="font-mono font-semibold">IITB-PUB-2026</code>
          </div>
        </div>

        <form onSubmit={handleActivate} className="space-y-3">
          <input
            type="text"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            placeholder="Enter staff authorization code..."
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex items-center justify-between gap-2 pt-1">
            {roleInfo.role !== 'Student' ? (
              <button
                type="button"
                onClick={async () => {
                  await switchStaffSession(undefined, true);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Switch to Student View
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={submitting || !passkey.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Verify Role Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PulseReportModal: React.FC<{
  target: {
    targetType: 'announcement' | 'lost-found' | 'poll' | 'submission';
    targetId: string;
    targetTitle: string;
  } | null;
  onClose: () => void;
}> = ({ target, onClose }) => {
  const { submitReport } = useCampusPulse();
  const [reason, setReason] = useState(PULSE_REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await submitReport({
      ...target,
      reason,
      details,
    });
    setSubmitting(false);
    if (res.ok) {
      setDetails('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Report Incorrect or Suspicious Post
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {target.targetTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            >
              {PULSE_REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Additional Context
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain what needs correction or verification..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PulseNotificationPrefsModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { notificationPrefs, updateNotificationPrefs } = useCampusPulse();
  const [draft, setDraft] = useState<PulseNotificationPrefs>(notificationPrefs);

  useEffect(() => {
    setDraft(notificationPrefs);
  }, [notificationPrefs, open]);

  if (!open) return null;

  const items: Array<{ key: keyof PulseNotificationPrefs; label: string; desc: string }> = [
    { key: 'officialNotices', label: 'Official Notices', desc: 'Institutional circulars & policies' },
    { key: 'examAlerts', label: 'Examination Alerts', desc: 'Exam dates, admit cards & results' },
    { key: 'upcomingDeadlines', label: 'Upcoming Deadlines', desc: 'Planner-synced academic deadlines' },
    { key: 'departmentUpdates', label: 'Followed Departments', desc: 'Updates from followed departments' },
    { key: 'classChanges', label: 'Schedule & Class Changes', desc: 'Rescheduled lectures or labs' },
    { key: 'facilityDisruptions', label: 'Facility Disruptions', desc: 'Library, hostel, bus & utility alerts' },
    { key: 'pollReminders', label: 'Campus Polls', desc: 'New institutional & student feedback polls' },
    { key: 'moderationUpdates', label: 'Submission Moderation', desc: 'Approval or review status changes' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Campus Notification Preferences
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {items.map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 cursor-pointer"
            >
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={draft[item.key]}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [item.key]: e.target.checked }))
                }
                className="w-4 h-4 accent-[#2563EB]"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await updateNotificationPrefs(draft);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
