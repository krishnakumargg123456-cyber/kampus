import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Lock,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { useStudentVoice } from '../../context/StudentVoiceContext';
import {
  CAMPUS_DEPARTMENTS,
  PRIORITY_LEVELS,
  SUBMISSION_STATUSES,
  formatVoiceDate,
} from '../../data/studentVoiceData';
import type {
  IdeaStatus,
  PollType,
  PriorityLevel,
  SubmissionStatus,
  VoiceSubmission,
} from '../../types/studentVoice';

export const VoiceAdminDashboardView: React.FC = () => {
  const {
    roleInfo,
    categories,
    adminSubmissions,
    ideas,
    reports,
    auditLogs,
    analytics,
    switchRoleSession,
    adminUpdateSubmission,
    adminUpdateIdeaStatus,
    adminCreatePoll,
    adminAddCategory,
    adminPublishUpdate,
    adminReviewReport,
  } = useStudentVoice();

  const [passkey, setPasskey] = useState('');
  const [adminTab, setAdminTab] = useState<'queue' | 'analytics' | 'campaigns' | 'config'>('queue');

  // Queue filters
  const [searchFilter, setSearchFilter] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [privacyFilter, setPrivacyFilter] = useState('All');

  // Selected case editor
  const [activeCase, setActiveCase] = useState<VoiceSubmission | null>(null);
  const [assignDept, setAssignDept] = useState(CAMPUS_DEPARTMENTS[0]);
  const [assignReviewer, setAssignReviewer] = useState('');
  const [nextStatus, setNextStatus] = useState<SubmissionStatus>('Under Review');
  const [nextPriority, setNextPriority] = useState<PriorityLevel>('Normal');
  const [officialMsg, setOfficialMsg] = useState('');
  const [resNotes, setResNotes] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [pubTransparency, setPubTransparency] = useState(false);

  // Create Poll Form
  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollType, setPollType] = useState<PollType>('Single-Choice Poll');
  const [pollDept, setPollDept] = useState(CAMPUS_DEPARTMENTS[0]);
  const [pollOptsCsv, setPollOptsCsv] = useState('Option A, Option B, Option C');
  const [pollAnon, setPollAnon] = useState(true);

  // Publish Update Form
  const [updTitle, setUpdTitle] = useState('');
  const [updDept, setUpdDept] = useState(CAMPUS_DEPARTMENTS[0]);
  const [updSummary, setUpdSummary] = useState('');
  const [updAction, setUpdAction] = useState('');
  const [updStatus, setUpdStatus] = useState<'Active Initiative' | 'Completed' | 'Notice'>('Active Initiative');

  // Configure Category Form
  const [newGroupName, setNewGroupName] = useState('Student Services');
  const [newItemName, setNewItemName] = useState('');

  const isPrivileged = roleInfo.role !== 'Student';
  const isInstitutionOrPlatform =
    roleInfo.role === 'Platform Admin' || roleInfo.role === 'Institution Admin';

  const filteredCases = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return adminSubmissions.filter((s) => {
      if (catFilter !== 'All' && s.categoryGroup !== catFilter) return false;
      if (deptFilter !== 'All' && (s.assignedDepartment || s.department) !== deptFilter) return false;
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && s.priority !== priorityFilter) return false;
      if (privacyFilter !== 'All' && s.privacyMode !== privacyFilter) return false;
      if (q) {
        const hay = `${s.referenceNumber} ${s.title} ${s.department} ${s.visibleAuthorName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [adminSubmissions, catFilter, deptFilter, statusFilter, priorityFilter, privacyFilter, searchFilter]);

  const openCase = (sub: VoiceSubmission) => {
    setActiveCase(sub);
    setAssignDept(sub.assignedDepartment || sub.department);
    setAssignReviewer(sub.assignedReviewer || '');
    setNextStatus(sub.status);
    setNextPriority(sub.priority);
    setOfficialMsg('');
    setResNotes('');
    setInternalNote('');
    setPubTransparency(sub.publishedToTransparency);
  };

  return (
    <div className="space-y-6">
      {/* Role Access Switcher */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
            <ShieldCheck className="w-4 h-4" />
            <span>
              Active Institutional Role: {roleInfo.role}
              {roleInfo.department ? ` (${roleInfo.department})` : ''}
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#172033] dark:text-slate-100">
            Institutional Review, Escalation & Analytics Console
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Backend RBAC strictly enforces Student isolation, Confidential identity protection (Platform/Institution Admin only), and private internal admin notes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isPrivileged ? (
            <button
              type="button"
              onClick={() => void switchRoleSession(undefined, true)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Return to Student Role
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void switchRoleSession(passkey);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Admin / Reviewer passkey..."
                className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#172554] text-white text-xs font-semibold cursor-pointer"
              >
                Authenticate Role
              </button>
            </form>
          )}
        </div>
      </div>

      {!isPrivileged ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-[#64748B]">
          <div className="flex items-center gap-2 font-bold text-sm text-[#172033] dark:text-slate-100">
            <Lock className="w-4 h-4 text-[#2563EB]" />
            <span>Administrative Dashboard Restricted</span>
          </div>
          <p>
            Student sessions cannot access other students' complaints, confidential identities, or institutional management tools (`403 Forbidden` enforced on backend).
          </p>
          <p>
            Staging verification passkeys: <code>KMP-VOICE-PLATFORM-2026</code> (Platform Admin),{' '}
            <code>KMP-VOICE-INST-2026</code> (Institution Admin),{' '}
            <code>KMP-VOICE-DEPT-2026</code> (Department Admin),{' '}
            <code>KMP-VOICE-REV-2026</code> (Authorized Reviewer).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sub-navigation */}
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {(
              [
                ['queue', `Submissions Queue (${adminSubmissions.length})`],
                ['analytics', 'Genuine Analytics & Workload'],
                ['campaigns', 'Polls, Ideas & Transparency'],
                ['config', `Categories, Moderation (${reports.length}) & Audit`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAdminTab(id)}
                className={`px-3.5 py-2 rounded-xl cursor-pointer ${
                  adminTab === id
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#64748B]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {adminTab === 'queue' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Filter & Table */}
              <div className={`${activeCase ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4`}>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search ref or title..."
                    className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-3"
                  />
                  <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="All">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.groupName}>
                        {c.groupName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="All">All Departments</option>
                    {CAMPUS_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="All">All Statuses</option>
                    {SUBMISSION_STATUSES.filter((s) => s !== 'Draft').map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="All">All Priorities</option>
                    {PRIORITY_LEVELS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <select
                    value={privacyFilter}
                    onChange={(e) => setPrivacyFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="All">All Privacy Modes</option>
                    <option value="Identified">Identified</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Anonymous">Anonymous</option>
                  </select>
                </div>

                {filteredCases.length === 0 ? (
                  <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-[#64748B]">
                    No submitted feedback or complaints match active filters.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredCases.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => openCase(sub)}
                        className={`p-4 rounded-xl border cursor-pointer space-y-1 text-xs ${
                          activeCase?.id === sub.id
                            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-[#2563EB]'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#2563EB] tabular-nums">
                            {sub.referenceNumber} · {sub.status} · Priority: {sub.priority}
                          </span>
                          {sub.escalated && (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Escalated
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                          {sub.title}
                        </div>
                        <div className="text-[#64748B]">
                          Submitter:{' '}
                          {sub.confidentialRealName
                            ? `${sub.confidentialRealName} (Unsealed Confidential)`
                            : sub.visibleAuthorName}{' '}
                          · Dept: {sub.assignedDepartment || sub.department}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Case Review Panel */}
              {activeCase && (
                <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <div className="font-bold text-[#2563EB] tabular-nums">
                        {activeCase.referenceNumber} · {activeCase.feedbackType} · {activeCase.privacyMode}
                      </div>
                      <h3 className="text-base font-bold text-[#172033] dark:text-slate-100 mt-0.5">
                        {activeCase.title}
                      </h3>
                      <div className="text-[#64748B] mt-0.5">
                        {activeCase.confidentialIdentityMasked
                          ? 'Confidential Identity Masked (Requires Institution/Platform Admin)'
                          : activeCase.confidentialRealName
                          ? `Confidential Identity Unsealed: ${activeCase.confidentialRealName} (${activeCase.confidentialRealEmail})`
                          : `Submitter: ${activeCase.visibleAuthorName}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveCase(null)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <p className="text-sm text-[#172033] dark:text-slate-200 whitespace-pre-wrap">
                    {activeCase.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <label className="space-y-1">
                      <span className="font-semibold">Assign Department</span>
                      <select
                        value={assignDept}
                        onChange={(e) => setAssignDept(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        {CAMPUS_DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-semibold">Assigned Reviewer</span>
                      <input
                        value={assignReviewer}
                        onChange={(e) => setAssignReviewer(e.target.value)}
                        placeholder="Reviewer name/office"
                        className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="font-semibold">Update Status</span>
                      <select
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value as SubmissionStatus)}
                        className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        {SUBMISSION_STATUSES.filter((s) => s !== 'Draft').map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="font-semibold">Priority Level</span>
                      <select
                        value={nextPriority}
                        onChange={(e) => setNextPriority(e.target.value as PriorityLevel)}
                        className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        {PRIORITY_LEVELS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <textarea
                    rows={3}
                    value={officialMsg}
                    onChange={(e) => setOfficialMsg(e.target.value)}
                    placeholder="Official institutional response (visible to student)..."
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />

                  <input
                    value={resNotes}
                    onChange={(e) => setResNotes(e.target.value)}
                    placeholder="Resolution notes / approved public action summary (optional)"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />

                  <textarea
                    rows={2}
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Internal administrative note (STRICTLY hidden from students)..."
                    className="w-full px-3 py-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                  />

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pubTransparency}
                      onChange={(e) => setPubTransparency(e.target.checked)}
                    />
                    <span>Approve anonymized summary for Public Transparency Board once resolved</span>
                  </label>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await adminUpdateSubmission(activeCase.id, {
                          assignedDepartment: assignDept,
                          assignedReviewer: assignReviewer,
                          status: nextStatus,
                          priority: nextPriority,
                          officialMessage: officialMsg,
                          resolutionNotes: resNotes,
                          internalNote,
                          publishedToTransparency: pubTransparency,
                        });
                        if (ok) {
                          setOfficialMsg('');
                          setInternalNote('');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
                    >
                      Save Review & Response
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void adminUpdateSubmission(activeCase.id, {
                          escalated: !activeCase.escalated,
                          priority: !activeCase.escalated ? 'High' : activeCase.priority,
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold cursor-pointer"
                    >
                      {activeCase.escalated ? 'Clear Escalation' : 'Escalate Overdue Case'}
                    </button>
                  </div>

                  {(activeCase.internalNotes || []).length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-1">
                      <div className="font-bold text-amber-800 dark:text-amber-300">
                        Internal Notes (Never Exposed to Students)
                      </div>
                      {activeCase.internalNotes?.map((n) => (
                        <div key={n.id}>
                          <strong>{n.authorLabel}:</strong> {n.note} ({formatVoiceDate(n.createdAt)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {adminTab === 'analytics' && analytics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[#64748B]">Total Submissions</div>
                  <div className="text-2xl font-bold tabular-nums mt-1">{analytics.totalSubmissions}</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[#64748B]">Pending Review</div>
                  <div className="text-2xl font-bold tabular-nums mt-1">{analytics.pendingReviews}</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[#64748B]">In-Progress Complaints</div>
                  <div className="text-2xl font-bold tabular-nums mt-1">{analytics.inProgressComplaints}</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[#64748B]">Resolved Cases</div>
                  <div className="text-2xl font-bold tabular-nums mt-1">{analytics.resolvedSubmissions}</div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[#64748B]">Avg First Response</div>
                  <div className="text-xl font-bold tabular-nums mt-1">
                    {analytics.avgFirstResponseHours !== null ? `${analytics.avgFirstResponseHours}h` : 'N/A'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[#64748B]">Avg Resolution</div>
                  <div className="text-xl font-bold tabular-nums mt-1">
                    {analytics.avgResolutionHours !== null ? `${analytics.avgResolutionHours}h` : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                    <span>Category Distribution (Real DB Records)</span>
                  </div>
                  {Object.keys(analytics.byCategory).length === 0 ? (
                    <p className="text-[#64748B]">No submissions recorded yet.</p>
                  ) : (
                    Object.entries(analytics.byCategory).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span>{k}</span>
                        <span className="font-bold tabular-nums">{v}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-sm">Department Workload & Survey Participation</div>
                  <div className="text-[#64748B] tabular-nums">
                    Total recorded student survey/poll votes: <strong>{analytics.totalSurveyResponses}</strong>
                  </div>
                  {Object.entries(analytics.byDepartment).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span>{k}</span>
                      <span className="font-bold tabular-nums">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === 'campaigns' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await adminCreatePoll({
                    title: pollTitle,
                    description: pollDesc,
                    pollType,
                    department: pollDept,
                    options: pollOptsCsv.split(',').map((s) => s.trim()).filter(Boolean),
                    closingDateISO: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
                    isAnonymousVoting: pollAnon,
                    showResultsAfterVoting: true,
                    participationRules: 'One response per enrolled student account.',
                  });
                  if (ok) {
                    setPollTitle('');
                    setPollDesc('');
                  }
                }}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <h3 className="text-sm font-bold">Launch New Student Poll or Survey</h3>
                <input
                  required
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="Poll question / campaign title *"
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={pollType}
                    onChange={(e) => setPollType(e.target.value as PollType)}
                    className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="Single-Choice Poll">Single-Choice Poll</option>
                    <option value="Multiple-Choice Poll">Multiple-Choice Poll</option>
                    <option value="Rating Survey">Rating Survey</option>
                    <option value="Text Feedback Survey">Text Feedback Survey</option>
                    <option value="Department Survey">Department Survey</option>
                    <option value="Campus Improvement Survey">Campus Improvement Survey</option>
                  </select>
                  <select
                    value={pollDept}
                    onChange={(e) => setPollDept(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {CAMPUS_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  value={pollOptsCsv}
                  onChange={(e) => setPollOptsCsv(e.target.value)}
                  placeholder="Options (comma separated)"
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <textarea
                  rows={2}
                  value={pollDesc}
                  onChange={(e) => setPollDesc(e.target.value)}
                  placeholder="Campaign description..."
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pollAnon}
                    onChange={(e) => setPollAnon(e.target.checked)}
                  />
                  <span>Anonymous Voting (hide voter attribution)</span>
                </label>
                <button
                  type="submit"
                  className="block px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
                >
                  Publish Poll Campaign
                </button>
              </form>

              <div className="space-y-4">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await adminPublishUpdate({
                      title: updTitle,
                      department: updDept,
                      summary: updSummary,
                      actionTaken: updAction,
                      status: updStatus,
                    });
                    if (ok) {
                      setUpdTitle('');
                      setUpdSummary('');
                      setUpdAction('');
                    }
                  }}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <h3 className="text-sm font-bold">Publish Campus Update / Initiative</h3>
                  <input
                    required
                    value={updTitle}
                    onChange={(e) => setUpdTitle(e.target.value)}
                    placeholder="Update / Initiative title *"
                    className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={updDept}
                      onChange={(e) => setUpdDept(e.target.value)}
                      className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      {CAMPUS_DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <select
                      value={updStatus}
                      onChange={(e) => setUpdStatus(e.target.value as any)}
                      className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Active Initiative">Active Initiative</option>
                      <option value="Completed">Completed</option>
                      <option value="Notice">Notice</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={updSummary}
                    onChange={(e) => setUpdSummary(e.target.value)}
                    placeholder="Summary *"
                    className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    value={updAction}
                    onChange={(e) => setUpdAction(e.target.value)}
                    placeholder="Concrete action taken"
                    className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#172554] text-white font-semibold cursor-pointer"
                  >
                    Publish Update
                  </button>
                </form>

                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h3 className="text-sm font-bold">Manage Student Ideas Status ({ideas.length})</h3>
                  {ideas.length === 0 ? (
                    <p className="text-[#64748B]">No ideas posted yet.</p>
                  ) : (
                    ideas.map((idea) => (
                      <div key={idea.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-semibold truncate">{idea.title}</span>
                        <select
                          value={idea.status}
                          onChange={(e) =>
                            void adminUpdateIdeaStatus(idea.id, e.target.value as IdeaStatus)
                          }
                          className="px-2 py-1 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          {['Under Review', 'Accepted', 'Planned', 'Implemented', 'Not Approved'].map(
                            (st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {adminTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                {isInstitutionOrPlatform && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const ok = await adminAddCategory(newGroupName, newItemName);
                      if (ok) setNewItemName('');
                    }}
                    className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <h3 className="text-sm font-bold">Configure Additional Category</h3>
                    <div className="flex gap-2">
                      <input
                        required
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Category group"
                        className="w-1/2 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        required
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Subcategory name"
                        className="w-1/2 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Category</span>
                    </button>
                  </form>
                )}

                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h3 className="text-sm font-bold">Abuse & Moderation Reports ({reports.length})</h3>
                  {reports.length === 0 ? (
                    <p className="text-[#64748B]">No moderation reports submitted.</p>
                  ) : (
                    reports.map((rp) => (
                      <div key={rp.id} className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>{rp.targetTitle}</span>
                          <span>{rp.status}</span>
                        </div>
                        <div className="text-rose-600">{rp.reason}</div>
                        {rp.status !== 'Reviewed' && (
                          <button
                            type="button"
                            onClick={() => void adminReviewReport(rp.id)}
                            className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold cursor-pointer"
                          >
                            Mark Reviewed
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h3 className="text-sm font-bold">Administrative Audit History ({auditLogs.length})</h3>
                {auditLogs.length === 0 ? (
                  <p className="text-[#64748B]">No audit entries recorded yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 flex justify-between gap-2"
                      >
                        <div>
                          <span className="font-bold text-[#2563EB]">{log.actorRole}</span> ·{' '}
                          <span>{log.action}</span> ({log.targetRef})
                        </div>
                        <span className="tabular-nums text-[#64748B]">
                          {formatVoiceDate(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
