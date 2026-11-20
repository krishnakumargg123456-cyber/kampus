import React, { useState } from 'react';
import {
  Archive,
  CalendarPlus,
  Clock,
  Kanban,
  List,
  Plus,
  X,
} from 'lucide-react';
import { useCareer } from '../../context/CareerContext';
import { formatShortDate, isSafeHttpUrl } from '../../data/careerData';
import type { ApplicationStatus, JobApplication } from '../../types/career';

const ALL_STATUSES: ApplicationStatus[] = [
  'Saved',
  'Planning to Apply',
  'Applied',
  'Assessment',
  'Interview Scheduled',
  'Offer Received',
  'Rejected',
  'Withdrawn',
];

export const ApplicationTrackerView: React.FC = () => {
  const {
    applications,
    resumes,
    createApplication,
    updateApplication,
    scheduleCareerPlannerSession,
    showToast,
  } = useCareer();

  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'timeline'>('list');
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  // Add manual application form
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [opportunityLink, setOpportunityLink] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('Planning to Apply');
  const [deadlineISO, setDeadlineISO] = useState('');
  const [resumeVersionId, setResumeVersionId] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');

  const filteredApps = applications.filter((a) => (showArchived ? a.archived : !a.archived));

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitle.trim() || !companyName.trim()) {
      showToast('error', 'Role title and company/organization name are required.');
      return;
    }
    if (opportunityLink && !isSafeHttpUrl(opportunityLink)) {
      showToast('error', 'Opportunity link must start with https:// or http://.');
      return;
    }
    const chosenResume = resumes.find((r) => r.id === resumeVersionId);
    const ok = await createApplication({
      roleTitle,
      companyName,
      opportunityLink: opportunityLink || undefined,
      applicationMode: 'Manual Entry',
      status,
      deadlineISO: deadlineISO || undefined,
      resumeVersionId: chosenResume?.id,
      resumeVersionName: chosenResume?.versionName,
      personalNotes,
      consentConfirmed: true,
    });
    if (ok) {
      setShowAddModal(false);
      setRoleTitle('');
      setCompanyName('');
      setOpportunityLink('');
      setDeadlineISO('');
      setPersonalNotes('');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    const ok = await updateApplication(editingApp.id, {
      status: editingApp.status,
      interviewDateISO: editingApp.interviewDateISO || '',
      interviewNotes: editingApp.interviewNotes || '',
      personalNotes: editingApp.personalNotes || '',
      feedbackNotes: editingApp.feedbackNotes || '',
      followUpDateISO: editingApp.followUpDateISO || '',
    });
    if (ok) setEditingApp(null);
  };

  const handleAddReminderToPlanner = (app: JobApplication) => {
    const targetDate =
      app.followUpDateISO || app.interviewDateISO || app.deadlineISO || new Date().toISOString().slice(0, 10);
    scheduleCareerPlannerSession({
      title: `Career Follow-Up: ${app.roleTitle}`,
      targetName: app.companyName,
      subject: app.status,
      dateISO: targetDate,
      timeSlot: '10:00 AM',
      durationMinutes: 30,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Application Tracker
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Track KAMPUS-hosted submissions, external portal applications, interviews, feedback, and KAMPUS Planner reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer ${
                viewMode === 'timeline' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Active Applications' : 'Archived'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Application</span>
          </button>
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <p className="text-sm font-semibold text-[#172033] dark:text-slate-100">
            {showArchived
              ? 'No archived applications yet.'
              : 'Your Application Tracker is empty.'}
          </p>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Add applications manually (including external opportunities) or apply inside Opportunity Discovery.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-[#2563EB]">{app.status}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-[#64748B] dark:text-slate-400">{app.applicationMode}</span>
                  {app.resumeVersionName && (
                    <>
                      <span className="text-slate-400">·</span>
                      <span className="text-[#64748B] dark:text-slate-400">
                        Resume: {app.resumeVersionName}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                  {app.roleTitle} — {app.companyName}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748B] dark:text-slate-400 tabular-nums">
                  {app.appliedDateISO && <span>Applied: {formatShortDate(app.appliedDateISO)}</span>}
                  {app.deadlineISO && <span>Deadline: {formatShortDate(app.deadlineISO)}</span>}
                  {app.interviewDateISO && <span>Interview: {formatShortDate(app.interviewDateISO)}</span>}
                  {app.followUpDateISO && <span>Follow-up: {formatShortDate(app.followUpDateISO)}</span>}
                </div>
                {app.personalNotes && (
                  <p className="text-xs text-[#64748B] dark:text-slate-300 pt-1">
                    Notes: {app.personalNotes}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={app.status}
                  onChange={(e) =>
                    void updateApplication(app.id, { status: e.target.value as ApplicationStatus })
                  }
                  aria-label="Update status"
                  className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleAddReminderToPlanner(app)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 text-xs font-semibold text-[#172033] dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Remind in Planner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingApp({ ...app })}
                  className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
                >
                  Details / Notes
                </button>
                <button
                  type="button"
                  onClick={() => void updateApplication(app.id, { archived: !app.archived })}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  {app.archived ? 'Restore' : 'Archive'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALL_STATUSES.map((colStatus) => {
            const items = filteredApps.filter((a) => a.status === colStatus);
            return (
              <div
                key={colStatus}
                className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#172033] dark:text-slate-100">
                  <span>{colStatus}</span>
                  <span className="tabular-nums text-[#64748B]">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <div className="text-[11px] text-slate-400 py-2">No items</div>
                ) : (
                  items.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setEditingApp({ ...app })}
                      className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 cursor-pointer hover:border-[#2563EB]"
                    >
                      <div className="text-xs font-bold text-[#172033] dark:text-slate-100">
                        {app.roleTitle}
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                        {app.companyName}
                      </div>
                      {app.deadlineISO && (
                        <div className="text-[11px] tabular-nums text-[#F97316]">
                          Due {formatShortDate(app.deadlineISO)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          {[...filteredApps]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 last:pb-0"
              >
                <div>
                  <div className="text-xs font-semibold text-[#2563EB] tabular-nums">
                    Updated {formatShortDate(app.updatedAt)} · {app.status}
                  </div>
                  <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                    {app.roleTitle} at {app.companyName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingApp({ ...app })}
                  className="text-xs font-semibold text-[#2563EB] hover:underline self-start sm:self-center cursor-pointer"
                >
                  Open Record
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Add Manual Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void handleAddManual(e)}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100">
                Add Manual or External Application
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Role title *"
                className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Organization / Company *"
                className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {ALL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={deadlineISO}
                onChange={(e) => setDeadlineISO(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <input
              type="url"
              value={opportunityLink}
              onChange={(e) => setOpportunityLink(e.target.value)}
              placeholder="External portal URL (https://...)"
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <select
              value={resumeVersionId}
              onChange={(e) => setResumeVersionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              <option value="">Attach resume version reference (optional)</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.versionName}
                </option>
              ))}
            </select>
            <textarea
              rows={3}
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="Personal notes, referral contact, or key requirements..."
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
              >
                Save to Tracker
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Application Detail Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void handleSaveEdit(e)}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100">
                {editingApp.roleTitle} — {editingApp.companyName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-semibold">Status</span>
                <select
                  value={editingApp.status}
                  onChange={(e) =>
                    setEditingApp({ ...editingApp, status: e.target.value as ApplicationStatus })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="font-semibold">Interview Date</span>
                <input
                  type="date"
                  value={editingApp.interviewDateISO || ''}
                  onChange={(e) =>
                    setEditingApp({ ...editingApp, interviewDateISO: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="font-semibold">Follow-Up Reminder Date</span>
                <input
                  type="date"
                  value={editingApp.followUpDateISO || ''}
                  onChange={(e) =>
                    setEditingApp({ ...editingApp, followUpDateISO: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
            </div>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold">Interview Details & Prep Notes</span>
              <textarea
                rows={2}
                value={editingApp.interviewNotes || ''}
                onChange={(e) => setEditingApp({ ...editingApp, interviewNotes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold">Personal Notes</span>
              <textarea
                rows={2}
                value={editingApp.personalNotes || ''}
                onChange={(e) => setEditingApp({ ...editingApp, personalNotes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold">Recruiter Feedback Notes</span>
              <textarea
                rows={2}
                value={editingApp.feedbackNotes || ''}
                onChange={(e) => setEditingApp({ ...editingApp, feedbackNotes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
              >
                Save Updates
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
