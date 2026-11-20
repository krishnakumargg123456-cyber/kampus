import React, { useState } from 'react';
import { AlertTriangle, KeyRound, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEventsClubs } from '../../context/EventsClubsContext';
import { EVENTS_CLUBS_REPORT_REASONS } from '../../data/eventsClubsData';

interface PasskeyModalProps {
  open: boolean;
  onClose: () => void;
}

export const OrganizerPasskeyModal: React.FC<PasskeyModalProps> = ({ open, onClose }) => {
  const { authInfo, verifyOrganizerPasskey, revertToStudent } = useEventsClubs();
  const [passkey, setPasskey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await verifyOrganizerPasskey(passkey);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Invalid organizer credential.');
      return;
    }
    setPasskey('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#172554] text-white flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                Organizer & Leadership Access
              </h3>
              <p className="text-xs text-slate-500">
                Backend-enforced role authorization for creating events & scanning QR passes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Current Session: {authInfo.organizerRole || 'Student Participant'}
          </div>
          {authInfo.staffLabel && (
            <div className="text-[#2563EB] font-medium">{authInfo.staffLabel}</div>
          )}
          <div className="text-[11px] text-slate-500 pt-1">
            Authorized institution code: <span className="font-mono font-semibold">KMP-INST-EVT-2026</span> · Club
            Lead code: <span className="font-mono font-semibold">KMP-CLUB-LEAD-2026</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Enter Organizer / Club Lead Authorization Code
            </label>
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              placeholder="e.g. KMP-INST-EVT-2026"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>

          {error && <div className="text-xs font-semibold text-red-600">{error}</div>}

          <div className="flex items-center justify-end gap-2 pt-1">
            {authInfo.organizerRole && (
              <button
                type="button"
                onClick={async () => {
                  await revertToStudent();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Revert to Student View
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{submitting ? 'Verifying...' : 'Verify Role Access'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ReportModalProps {
  target: {
    targetType: 'event' | 'club' | 'content';
    targetId: string;
    targetTitle: string;
  } | null;
  onClose: () => void;
}

export const EventsClubsReportModal: React.FC<ReportModalProps> = ({ target, onClose }) => {
  const { submitReport } = useEventsClubs();
  const [reason, setReason] = useState(EVENTS_CLUBS_REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await submitReport({
      targetType: target.targetType,
      targetId: target.targetId,
      targetTitle: target.targetTitle,
      reason,
      details,
    });
    setSubmitting(false);
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F97316]" />
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                Report {target.targetType === 'club' ? 'Club' : 'Event'}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{target.targetTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {EVENTS_CLUBS_REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Additional Details
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain what needs moderation review..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
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
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F97316] text-white hover:bg-orange-600"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EventsAiModalProps {
  open: boolean;
  onClose: () => void;
}

export const EventsClubsAiModal: React.FC<EventsAiModalProps> = ({ open, onClose }) => {
  const { runEventsAiHelper } = useEventsClubs();
  const [mode, setMode] = useState<'recommend-events' | 'recommend-clubs' | 'draft-event-content'>(
    'recommend-events'
  );
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await runEventsAiHelper(
      mode,
      prompt.trim() || 'Looking for practical coding, AI, or career workshops this semester.'
    );
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'AI service unavailable.');
      return;
    }
    setReply(res.text || '');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                KAMPUS AI · Events & Clubs Assistant
              </h3>
              <p className="text-xs text-slate-500">
                AI-generated suggestions based strictly on real campus listings
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'recommend-events', label: 'Recommend Events' },
            { id: 'recommend-clubs', label: 'Suggest Clubs' },
            { id: 'draft-event-content', label: 'Organizer Content Helper' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id as typeof mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                mode === t.id
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-[#F8FAFC] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleAsk} className="space-y-3">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'draft-event-content'
                ? 'Describe your event idea (e.g. 2-day Web Security Workshop for 2nd year students)...'
                : 'Tell KAMPUS AI your interests, free time, or skills you want to explore...'
            }
            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Generating AI Suggestions...' : 'Generate AI Suggestion'}
          </button>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {reply && (
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
              AI-Generated Suggestion · Always verify final schedule in event listing
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {reply}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
