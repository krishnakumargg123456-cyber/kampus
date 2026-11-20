import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  BellRing,
  Briefcase,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLocker } from '../../context/LockerContext';
import {
  LOCKER_REMINDER_REPEATS,
  LOCKER_REMINDER_TYPES,
  formatLockerDateTime,
} from '../../data/lockerData';
import type { LockerReminderRepeat, LockerReminderType } from '../../types/locker';

interface LockerRemindersAndIntegrationsViewProps {
  mode: 'reminders' | 'integrations' | 'activity';
}

export const LockerRemindersAndIntegrationsView: React.FC<
  LockerRemindersAndIntegrationsViewProps
> = ({ mode }) => {
  const {
    documents,
    reminders,
    activity,
    crossModule,
    createReminder,
    toggleReminderComplete,
    deleteReminder,
    toggleAdmissionAttachment,
  } = useLocker();

  const [remTitle, setRemTitle] = useState('');
  const [remType, setRemType] = useState<LockerReminderType>('Document submission');
  const [remDocId, setRemDocId] = useState('');
  const [remDue, setRemDue] = useState('');
  const [remRepeat, setRemRepeat] = useState<LockerReminderRepeat>('None');
  const [remNotes, setRemNotes] = useState('');
  const [syncToPlanner, setSyncToPlanner] = useState(true);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim() || !remDue) return;
    const ok = await createReminder({
      title: remTitle.trim(),
      reminderType: remType,
      documentId: remDocId || null,
      dueAtISO: remDue,
      repeat: remRepeat,
      notes: remNotes.trim(),
      syncToPlanner,
    });
    if (ok) {
      setRemTitle('');
      setRemDue('');
      setRemNotes('');
    }
  };

  if (mode === 'activity') {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Document Activity &amp; Sharing Audit History</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Recorded chronologically from actual uploads, previews, downloads, shares, and
            revocations.
          </p>
        </div>

        {activity.length === 0 ? (
          <p className="text-slate-500 py-4">No recorded activity events yet.</p>
        ) : (
          <div className="space-y-2">
            {activity.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {ev.action} · {ev.targetName}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">{ev.details}</p>
                </div>
                <span className="text-slate-400 tabular-nums">
                  {formatLockerDateTime(ev.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'integrations') {
    const careerDocsInLocker = documents.filter((d) => d.category === 'Career Documents');
    return (
      <div className="space-y-5 text-xs">
        {/* KAMPUS ID Connection */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>KAMPUS ID &amp; Student Achievements</span>
            </h2>
            <Link
              to="/campus/kampus-id"
              className="text-blue-600 font-semibold hover:underline"
            >
              Open KAMPUS ID
            </Link>
          </div>
          {crossModule?.kampusId.kampusIdNumber ? (
            <div className="space-y-2">
              <p className="text-slate-700 dark:text-slate-300">
                Linked KAMPUS ID:{' '}
                <strong className="font-mono">{crossModule.kampusId.kampusIdNumber}</strong> ·{' '}
                {crossModule.kampusId.isVerified ? 'Platform Verified' : 'Unverified'}
              </p>
              {crossModule.kampusId.achievements.length > 0 && (
                <p className="text-slate-500">
                  Recorded KAMPUS ID Achievements: {crossModule.kampusId.achievements.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-slate-500">
              No KAMPUS ID record provisioned yet for this user. Visit KAMPUS ID to initialize your
              digital card.
            </p>
          )}
        </div>

        {/* College Explorer Admission Checklists */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>College Explorer Admission Checklists</span>
            </h2>
            <Link
              to="/campus/college-explorer"
              className="text-blue-600 font-semibold hover:underline"
            >
              Open College Explorer
            </Link>
          </div>
          {!crossModule || crossModule.admissions.length === 0 ? (
            <p className="text-slate-500">
              Add a college to your Admission Tracker in College Explorer to attach required
              Digital Locker documents directly to its checklist.
            </p>
          ) : (
            <div className="space-y-3">
              {crossModule.admissions.map((adm) => (
                <div
                  key={adm.admissionId}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {adm.collegeName} — {adm.courseName} ({adm.status})
                  </p>
                  {documents.length === 0 ? (
                    <p className="text-slate-400">
                      Upload documents in Digital Locker first to attach them here.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {documents.map((doc) => {
                        const attached = adm.attachedDocumentIds.includes(doc.id);
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() =>
                              toggleAdmissionAttachment(adm.admissionId, doc.id, attached)
                            }
                            className={`px-3 py-1 rounded-lg border font-semibold inline-flex items-center gap-1 ${
                              attached
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {attached && <CheckCircle2 className="w-3 h-3" />}
                            <span>{doc.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Career Resume Integration */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Career Resume &amp; Portfolio Files</span>
            </h2>
            <Link to="/career" className="text-blue-600 font-semibold hover:underline">
              Open Career Hub
            </Link>
          </div>
          <p className="text-slate-500">
            Resumes stored in your Digital Locker ({careerDocsInLocker.length}):{' '}
            {careerDocsInLocker.map((d) => d.title).join(', ') || 'None uploaded yet'}
          </p>
          {crossModule && crossModule.careerResumes.length > 0 && (
            <div className="space-y-1.5">
              {crossModule.careerResumes.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {r.title} ({r.targetRole})
                  </span>
                  <span className="text-slate-400 tabular-nums">
                    Updated {formatLockerDateTime(r.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // REMINDERS VIEW
  return (
    <div className="space-y-5 text-xs">
      <form
        onSubmit={handleAddReminder}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-orange-500" />
            <span>Schedule Document Deadline Reminder</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Track renewals, admission submissions, or scholarship proofs and sync straight to KAMPUS
            Planner &amp; Notification Center.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            type="text"
            required
            value={remTitle}
            onChange={(e) => setRemTitle(e.target.value)}
            placeholder="Reminder title (e.g., Renew Bonafide Certificate) *"
            className="sm:col-span-2 lg:col-span-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <select
            value={remType}
            onChange={(e) => setRemType(e.target.value as LockerReminderType)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {LOCKER_REMINDER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            required
            value={remDue}
            onChange={(e) => setRemDue(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
          />
          <select
            value={remDocId}
            onChange={(e) => setRemDocId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="">Attach Document (Optional)</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
          <select
            value={remRepeat}
            onChange={(e) => setRemRepeat(e.target.value as LockerReminderRepeat)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {LOCKER_REMINDER_REPEATS.map((r) => (
              <option key={r} value={r}>
                Repeat: {r}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={remNotes}
            onChange={(e) => setRemNotes(e.target.value)}
            placeholder="Reminder notes..."
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={syncToPlanner}
              onChange={(e) => setSyncToPlanner(e.target.checked)}
            />
            <span>Sync reminder to KAMPUS Planner &amp; Notification Center</span>
          </label>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Reminder</span>
          </button>
        </div>
      </form>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Scheduled Reminders ({reminders.length})
        </h3>
        {reminders.length === 0 ? (
          <p className="text-slate-500">No document reminders scheduled yet.</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={r.completed}
                    onChange={(e) => toggleReminderComplete(r.id, e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p
                      className={`font-bold ${
                        r.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {r.title}
                    </p>
                    <p className="text-slate-500 tabular-nums">
                      {r.reminderType} · Due {formatLockerDateTime(r.dueAtISO)} · Repeat: {r.repeat}
                      {r.documentTitle ? ` · File: ${r.documentTitle}` : ''}
                    </p>
                    {r.notes && <p className="text-slate-400">{r.notes}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteReminder(r.id)}
                  aria-label="Delete reminder"
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
