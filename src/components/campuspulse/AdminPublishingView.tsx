import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { useCampusPulse } from '../../context/CampusPulseContext';
import {
  ALERT_PRIORITIES,
  ALERT_TYPES,
  FACILITY_CATEGORIES,
  formatPulseDateTime,
  PULSE_CATEGORIES,
} from '../../data/campusPulseData';
import type {
  AlertPriority,
  AlertType,
  CampusPulseRole,
  DeadlineKind,
  FacilityCategory,
  PulseAttachment,
  PulseCategoryId,
} from '../../types/campusPulse';

export const AdminPublishingView: React.FC<{
  onOpenRoleModal: () => void;
}> = ({ onOpenRoleModal }) => {
  const {
    roleInfo,
    selectedInstitution,
    departments,
    submissions,
    reports,
    publishers,
    analytics,
    publishOfficialAnnouncement,
    createAlert,
    createDeadline,
    createFacilityUpdate,
    moderateSubmission,
    resolveReport,
    assignPublisher,
    uploadAttachment,
  } = useCampusPulse();

  const instId = selectedInstitution?.id || 'inst_iitb';
  const instDepts = departments.filter((d) => d.institutionId === instId);

  const [adminTab, setAdminTab] = useState<
    'publish' | 'moderation' | 'analytics' | 'publishers'
  >('publish');

  // Publish Notice state
  const [title, setTitle] = useState('');
  const [circularCode, setCircularCode] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<PulseCategoryId>('academic-updates');
  const [subcategory, setSubcategory] = useState('Class schedule changes');
  const [departmentId, setDepartmentId] = useState(
    roleInfo.assignedDepartmentId || instDepts[0]?.id || 'dept_acad'
  );
  const [status, setStatus] = useState<'New' | 'Important' | 'Urgent'>('Important');
  const [priority, setPriority] = useState<AlertPriority>('High');
  const [isPinned, setIsPinned] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [deadlineAt, setDeadlineAt] = useState('');
  const [attachments, setAttachments] = useState<PulseAttachment[]>([]);
  const [pubMsg, setPubMsg] = useState<string | null>(null);

  // Quick Alert / Facility / Deadline inline tabs
  const [extraForm, setExtraForm] = useState<'alert' | 'deadline' | 'facility'>('alert');
  const [alType, setAlType] = useState<AlertType>('Schedule changes');
  const [alTitle, setAlTitle] = useState('');
  const [alPrio, setAlPrio] = useState<AlertPriority>('High');
  const [alDesc, setAlDesc] = useState('');

  const [dlTitle, setDlTitle] = useState('');
  const [dlKind, setDlKind] = useState<DeadlineKind>('Examination');
  const [dlDate, setDlDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dlConfirmed, setDlConfirmed] = useState(true);

  const [facCat, setFacCat] = useState<FacilityCategory>('Library');
  const [facName, setFacName] = useState('Central Library');
  const [facTitle, setFacTitle] = useState('');
  const [facDetails, setFacDetails] = useState('');
  const [facHours, setFacHours] = useState('');

  // Publisher assignment state
  const [pubUserId, setPubUserId] = useState('');
  const [pubName, setPubName] = useState('');
  const [pubRole, setPubRole] = useState<CampusPulseRole>('Authorized Publisher');
  const [pubDeptId, setPubDeptId] = useState(instDepts[0]?.id || 'dept_cse');

  if (roleInfo.role === 'Student') {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 max-w-xl mx-auto my-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[#172554] dark:text-blue-300 flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-[#172033] dark:text-slate-100">
          Campus Publishing & Analytics Restricted
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Official notice publishing, student submission moderation, and campus analytics are
          restricted on the backend to Institutional Admins, Department Admins, and Authorized
          Publishers.
        </p>
        <button
          onClick={onOpenRoleModal}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
        >
          <KeyRound className="w-4 h-4" />
          <span>Verify Institutional Staff Access</span>
        </button>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(
    (s) => s.moderationStatus === 'Submitted' || s.moderationStatus === 'Under Review'
  );

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setPubMsg(null);
    const res = await publishOfficialAnnouncement({
      institutionId: instId,
      circularCode: circularCode || undefined,
      title,
      summary: summary || content.slice(0, 160),
      content,
      categoryId,
      subcategory,
      departmentId,
      status,
      priority,
      isPinned,
      isRestricted,
      deadlineAt: deadlineAt ? `${deadlineAt}T17:00:00.000Z` : undefined,
      attachments,
    });
    if (!res.ok) {
      setPubMsg(res.error || 'Publishing failed.');
    } else {
      setTitle('');
      setCircularCode('');
      setSummary('');
      setContent('');
      setAttachments([]);
      setPubMsg('Notice published cleanly to Campus Pulse.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-[#2563EB]">
            Authorized Workspace · {roleInfo.role}
            {roleInfo.staffTitle ? ` (${roleInfo.staffTitle})` : ''}
          </div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Campus Information Management
          </h2>
        </div>

        <button
          onClick={onOpenRoleModal}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Switch Role / Return to Student
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
        {[
          { id: 'publish', label: 'Publish Official Updates' },
          {
            id: 'moderation',
            label: `Moderation & Reports (${pendingSubmissions.length + reports.filter((r) => r.status === 'Submitted').length})`,
          },
          { id: 'analytics', label: 'Campus Analytics' },
          ...(roleInfo.role === 'Institutional Admin'
            ? [{ id: 'publishers', label: 'Publishers & Permissions' }]
            : []),
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAdminTab(t.id as typeof adminTab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              adminTab === t.id
                ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Official Notice & Auxiliary Publishing */}
      {adminTab === 'publish' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handlePublishNotice}
            className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Publish Official Notice or Circular</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-semibold block mb-1">Notice Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Official notice headline..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Circular Reference Code</label>
                <input
                  type="text"
                  value={circularCode}
                  onChange={(e) => setCircularCode(e.target.value)}
                  placeholder="e.g., ACAD/2026-49"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="font-semibold block mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    const cid = e.target.value as PulseCategoryId;
                    setCategoryId(cid);
                    const meta = PULSE_CATEGORIES.find((c) => c.id === cid);
                    if (meta?.subcategories[0]) setSubcategory(meta.subcategories[0]);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  {PULSE_CATEGORIES.filter((c) => c.id !== 'student-information').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  {instDepts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AlertPriority)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  {ALERT_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-semibold block mb-1">Notice Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'New' | 'Important' | 'Urgent')}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  <option value="New">New</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">Relevant Deadline (Optional)</label>
                <input
                  type="date"
                  value={deadlineAt}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Short Summary</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="1-2 line overview shown in the campus feed..."
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Full Official Notice Content</label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write complete instructions, eligibility, required documents..."
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {roleInfo.role === 'Institutional Admin' && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="accent-[#2563EB]"
                  />
                  <span>Pin to Notice Center</span>
                </label>
              )}
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRestricted}
                  onChange={(e) => setIsRestricted(e.target.checked)}
                  className="accent-[#2563EB]"
                />
                <span>Department-Restricted Audience</span>
              </label>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer ml-auto">
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Attach PDF ({attachments.length})</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = await uploadAttachment(f);
                    if (r.attachment) setAttachments((prev) => [...prev, r.attachment!]);
                  }}
                />
              </label>
            </div>

            {pubMsg && (
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200">
                {pubMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
            >
              Publish Official Notice
            </button>
          </form>

          {/* Right Column: Alerts / Deadlines / Facilities Quick Issuer */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {[
                { id: 'alert', label: 'Issue Alert' },
                { id: 'deadline', label: 'Add Deadline' },
                { id: 'facility', label: 'Facility Notice' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setExtraForm(m.id as typeof extraForm)}
                  className={`flex-1 py-1.5 rounded-lg font-semibold ${
                    extraForm === m.id
                      ? 'bg-white dark:bg-slate-900 text-[#2563EB]'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {extraForm === 'alert' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const r = await createAlert({
                    institutionId: instId,
                    alertType: alType,
                    title: alTitle,
                    priority: alPrio,
                    description: alDesc,
                    departmentName:
                      instDepts.find((d) => d.id === departmentId)?.name || 'Academic Office',
                  });
                  if (r.ok) {
                    setAlTitle('');
                    setAlDesc('');
                  }
                }}
                className="space-y-3"
              >
                <select
                  value={alType}
                  onChange={(e) => setAlType(e.target.value as AlertType)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  {ALERT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={alPrio}
                  onChange={(e) => setAlPrio(e.target.value as AlertPriority)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  {ALERT_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  required
                  type="text"
                  value={alTitle}
                  onChange={(e) => setAlTitle(e.target.value)}
                  placeholder="Alert headline..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <textarea
                  required
                  rows={3}
                  value={alDesc}
                  onChange={(e) => setAlDesc(e.target.value)}
                  placeholder="Clear alert details..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#172554] text-white font-semibold"
                >
                  Publish Campus Alert
                </button>
              </form>
            )}

            {extraForm === 'deadline' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const r = await createDeadline({
                    institutionId: instId,
                    title: dlTitle,
                    kind: dlKind,
                    dateISO: dlDate,
                    departmentId,
                    description: 'Published via Academic Calendar Office',
                    isConfirmedOfficial: dlConfirmed,
                  });
                  if (r.ok) setDlTitle('');
                }}
                className="space-y-3"
              >
                <input
                  required
                  type="text"
                  value={dlTitle}
                  onChange={(e) => setDlTitle(e.target.value)}
                  placeholder="Deadline or exam title..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <select
                  value={dlKind}
                  onChange={(e) => setDlKind(e.target.value as DeadlineKind)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  {[
                    'Examination',
                    'Assignment',
                    'Registration',
                    'Academic Event',
                    'Application',
                    'Holiday',
                    'Semester Date',
                  ].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <input
                  required
                  type="date"
                  value={dlDate}
                  onChange={(e) => setDlDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dlConfirmed}
                    onChange={(e) => setDlConfirmed(e.target.checked)}
                    className="accent-[#2563EB]"
                  />
                  <span>Confirmed Official Date (unchecked = Tentative)</span>
                </label>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold"
                >
                  Add to Academic Calendar
                </button>
              </form>
            )}

            {extraForm === 'facility' && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const r = await createFacilityUpdate({
                    institutionId: instId,
                    facilityCategory: facCat,
                    facilityName: facName,
                    title: facTitle,
                    details: facDetails,
                    operatingInfo: facHours || 'Refer to facility desk',
                    statusNote: 'Updated Official Schedule',
                  });
                  if (r.ok) {
                    setFacTitle('');
                    setFacDetails('');
                  }
                }}
                className="space-y-3"
              >
                <select
                  value={facCat}
                  onChange={(e) => setFacCat(e.target.value as FacilityCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  {FACILITY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  required
                  type="text"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  placeholder="Facility name..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <input
                  required
                  type="text"
                  value={facTitle}
                  onChange={(e) => setFacTitle(e.target.value)}
                  placeholder="Notice headline..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  value={facHours}
                  onChange={(e) => setFacHours(e.target.value)}
                  placeholder="Operating hours or route timing..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <textarea
                  required
                  rows={2}
                  value={facDetails}
                  onChange={(e) => setFacDetails(e.target.value)}
                  placeholder="Detailed facility update..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold"
                >
                  Post Facility Update
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Student Submissions Moderation & Safety Reports */}
      {adminTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Pending Student Submissions ({pendingSubmissions.length})
            </h3>
            {pendingSubmissions.length === 0 ? (
              <p className="text-xs text-slate-500">All student submissions have been reviewed.</p>
            ) : (
              pendingSubmissions.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span>
                      {s.postType} · {s.authorName} · {s.departmentName}
                    </span>
                    <span className="font-semibold text-[#F97316]">{s.moderationStatus}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {s.title}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{s.description}</p>
                  {s.supportingInfo && (
                    <div className="text-[11px] text-slate-500">
                      Context: {s.supportingInfo}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => moderateSubmission(s.id, 'Approved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve (As Student Submission)</span>
                    </button>
                    <button
                      onClick={() =>
                        moderateSubmission(
                          s.id,
                          'Rejected',
                          'Could not verify supporting information.'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold inline-flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Reported Inaccuracies & Moderation Reports ({reports.length})
            </h3>
            {reports.length === 0 ? (
              <p className="text-xs text-slate-500">No reports filed.</p>
            ) : (
              reports.map((rp) => (
                <div
                  key={rp.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-red-600">{rp.reason}</span>
                    <span className="text-slate-500">{rp.status}</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {rp.targetTitle}
                  </div>
                  {rp.details && <p className="text-slate-600 dark:text-slate-300">{rp.details}</p>}
                  {rp.status === 'Submitted' && roleInfo.role === 'Institutional Admin' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => resolveReport(rp.id, 'Reviewed')}
                        className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => resolveReport(rp.id, 'Dismissed')}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 font-semibold"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {/* Tab 3: Restricted Real Analytics */}
      {adminTab === 'analytics' && analytics && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Published Announcements',
                value: analytics.totalPublishedAnnouncements,
                sub: `${analytics.officialCount} official · ${analytics.studentApprovedCount} student-approved`,
              },
              {
                label: 'Pending Moderation',
                value: analytics.pendingModerationRequests,
                sub: `${analytics.studentSubmissionsSummary.total} total submissions`,
              },
              {
                label: 'Pending Accuracy Reports',
                value: analytics.pendingReportsCount,
                sub: 'Moderation queue',
              },
              {
                label: 'Total Poll Votes Recorded',
                value: analytics.pollParticipation.reduce((a, b) => a + b.totalVotes, 0),
                sub: `${analytics.pollParticipation.length} campus polls`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
                <div className="text-2xl font-bold text-[#172033] dark:text-slate-100 mt-1 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                <span>Notices by Category</span>
              </div>
              {analytics.byCategory.map((row) => (
                <div
                  key={row.categoryId}
                  className="flex items-center justify-between text-xs py-1.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                >
                  <span>{row.label}</span>
                  <span className="font-bold tabular-nums text-[#2563EB]">{row.count}</span>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-sm font-bold">
                Most Viewed Notices (Real Recorded Opens)
              </div>
              {analytics.mostViewedAnnouncements.map((mv) => (
                <div
                  key={mv.id}
                  className="flex items-center justify-between gap-3 text-xs py-1.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                >
                  <span className="truncate">{mv.title}</span>
                  <span className="font-bold tabular-nums shrink-0">{mv.viewCount} views</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Publishers Management (Institutional Admin Only) */}
      {adminTab === 'publishers' && roleInfo.role === 'Institutional Admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await assignPublisher({
                targetUserId: pubUserId,
                targetName: pubName,
                role: pubRole,
                assignedDepartmentId: pubDeptId,
              });
              if (r.ok) {
                setPubUserId('');
                setPubName('');
              }
            }}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Plus className="w-4 h-4 text-[#2563EB]" />
              <span>Assign or Update Authorized Publisher</span>
            </div>
            <input
              required
              type="text"
              value={pubUserId}
              onChange={(e) => setPubUserId(e.target.value)}
              placeholder="Staff / User ID (e.g., usr_faculty_21)"
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
            <input
              required
              type="text"
              value={pubName}
              onChange={(e) => setPubName(e.target.value)}
              placeholder="Official Office or Faculty Name"
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={pubRole}
                onChange={(e) => setPubRole(e.target.value as CampusPulseRole)}
                className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                <option value="Department Admin">Department Admin</option>
                <option value="Authorized Publisher">Authorized Publisher</option>
                <option value="Institutional Admin">Institutional Admin</option>
              </select>
              <select
                value={pubDeptId}
                onChange={(e) => setPubDeptId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                {instDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold"
            >
              Grant Publishing Role
            </button>
          </form>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <span>Active Authorized Publishers ({publishers.length})</span>
            </div>
            {publishers.map((p) => (
              <div
                key={p.userId}
                className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{p.name}</div>
                  <div className="text-slate-500">
                    {p.role}
                    {p.assignedDepartmentName ? ` · ${p.assignedDepartmentName}` : ''}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {formatPulseDateTime(p.grantedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
