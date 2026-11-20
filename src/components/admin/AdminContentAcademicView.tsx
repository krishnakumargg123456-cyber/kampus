import React, { useEffect, useState } from 'react';
import { Plus, Save, Star, Trash2 } from 'lucide-react';
import type {
  AcademicCourseRecord,
  AcademicResourceRecord,
  AcademicSubjectRecord,
  AdminSupportTicket,
  UnifiedContentItem,
} from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminCard, AdminFeedbackBanner, StatusLabel, formatShortDate } from './AdminShared';

export const AdminContentAcademicView: React.FC<{ mode: 'content' | 'academic' | 'community' }> = ({ mode }) => {
  const { adminFetch, hasPermission } = useAdminAuth();

  const [contentItems, setContentItems] = useState<UnifiedContentItem[]>([]);
  const [moduleFilter, setModuleFilter] = useState('All');

  const [subjects, setSubjects] = useState<AcademicSubjectRecord[]>([]);
  const [courses, setCourses] = useState<AcademicCourseRecord[]>([]);
  const [resources, setResources] = useState<AcademicResourceRecord[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjName, setNewSubjName] = useState('');
  const [newResTitle, setNewResTitle] = useState('');

  const [communityRules, setCommunityRules] = useState({
    requireVerifiedForLinks: true,
    autoFlagThreshold: 3,
    allowAnonymousVoice: true,
    blockedKeywords: [] as string[],
    pinnedNotice: '',
  });
  const [reports, setReports] = useState<AdminSupportTicket[]>([]);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (mode === 'content') {
      adminFetch<{ items: UnifiedContentItem[] }>('/api/admin/content')
        .then((d) => setContentItems(d.items || []))
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    } else if (mode === 'academic') {
      adminFetch<{
        subjects: AcademicSubjectRecord[];
        courses: AcademicCourseRecord[];
        resources: AcademicResourceRecord[];
        streams: string[];
      }>('/api/admin/academic')
        .then((d) => {
          setSubjects(d.subjects || []);
          setCourses(d.courses || []);
          setResources(d.resources || []);
          setStreams(d.streams || []);
        })
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    } else {
      adminFetch<{ rules: typeof communityRules; reports: AdminSupportTicket[] }>('/api/admin/community')
        .then((d) => {
          if (d.rules) setCommunityRules(d.rules);
          setReports(d.reports || []);
        })
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    }
  }, [mode, adminFetch]);

  const handleContentAction = async (
    id: string,
    action: 'publish' | 'unpublish' | 'approve' | 'reject' | 'archive' | 'feature' | 'unfeature'
  ) => {
    try {
      const res = await adminFetch<{ items: UnifiedContentItem[] }>('/api/admin/content/action', {
        method: 'POST',
        body: JSON.stringify({ id, action }),
      });
      setContentItems(res.items);
      setNotice({ kind: 'success', message: `Applied "${action}" to content item.` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Action failed.' });
    }
  };

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjCode.trim() || !newSubjName.trim()) return;
    try {
      const res = await adminFetch<any>('/api/admin/academic/subjects', {
        method: 'POST',
        body: JSON.stringify({
          code: newSubjCode,
          name: newSubjName,
          stream: streams[0] || 'Computer Science',
          semester: 'Semester 5',
          credits: 4,
        }),
      });
      setSubjects(res.subjects);
      setNewSubjCode('');
      setNewSubjName('');
      setNotice({ kind: 'success', message: 'Subject added to academic catalog.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to add subject.' });
    }
  };

  const addResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResTitle.trim()) return;
    try {
      const res = await adminFetch<any>('/api/admin/academic/resources', {
        method: 'POST',
        body: JSON.stringify({
          title: newResTitle,
          subjectCode: subjects[0]?.code || 'CS-301',
          category: 'Notes',
          status: 'Approved',
        }),
      });
      setResources(res.resources);
      setNewResTitle('');
      setNotice({ kind: 'success', message: 'Study resource added.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to add resource.' });
    }
  };

  const deleteAcademic = async (kind: 'subjects' | 'courses' | 'resources', id: string) => {
    try {
      const res = await adminFetch<any>(`/api/admin/academic/${kind}/${id}`, { method: 'DELETE' });
      setSubjects(res.subjects);
      setCourses(res.courses);
      setResources(res.resources);
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Delete failed.' });
    }
  };

  const saveCommunityRules = async () => {
    try {
      const res = await adminFetch<{ rules: typeof communityRules }>('/api/admin/community/rules', {
        method: 'PUT',
        body: JSON.stringify(communityRules),
      });
      setCommunityRules(res.rules);
      setNotice({ kind: 'success', message: 'Community moderation rules saved.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to save rules.' });
    }
  };

  if (mode === 'academic') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Academic Management
          </h1>
          <p className="text-xs text-slate-500">
            Manage streams ({streams.length}), degree courses ({courses.length}), subjects ({subjects.length}), and curated resources ({resources.length}).
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard title={`Subjects Catalog (${subjects.length})`}>
            {hasPermission('create') && (
              <form onSubmit={addSubject} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Code (e.g. CS-402)"
                  value={newSubjCode}
                  onChange={(e) => setNewSubjCode(e.target.value)}
                  className="w-32 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  placeholder="Subject Title"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            )}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {subjects.map((s) => (
                <div key={s.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-600 mr-2">{s.code}</span>
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-slate-500 ml-2">({s.credits} cr)</span>
                  </div>
                  {hasPermission('delete') && (
                    <button
                      type="button"
                      onClick={() => deleteAcademic('subjects', s.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard title={`Study Materials & PYQs (${resources.length})`}>
            {hasPermission('create') && (
              <form onSubmit={addResource} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Resource Title (Notes / PYQ / Formula Sheet)"
                  value={newResTitle}
                  onChange={(e) => setNewResTitle(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            )}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {resources.map((r) => (
                <div key={r.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {r.subjectCode} · {r.category} · {r.uploadedBy}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusLabel status={r.status} />
                    {hasPermission('delete') && (
                      <button
                        type="button"
                        onClick={() => deleteAcademic('resources', r.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    );
  }

  if (mode === 'community') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Community Moderation & Safety Rules
            </h1>
            <p className="text-xs text-slate-500">
              Configure community posting policies, blocked keywords, and review flagged submissions.
            </p>
          </div>
          <button
            type="button"
            disabled={!hasPermission('configure')}
            onClick={saveCommunityRules}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5" />
            Save Community Rules
          </button>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard title="Moderation Guardrails">
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <span>Require Verified Student Status for External Links</span>
                <input
                  type="checkbox"
                  checked={communityRules.requireVerifiedForLinks}
                  onChange={(e) =>
                    setCommunityRules({ ...communityRules, requireVerifiedForLinks: e.target.checked })
                  }
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                <span>Allow Confidential Student Voice Reporting</span>
                <input
                  type="checkbox"
                  checked={communityRules.allowAnonymousVoice}
                  onChange={(e) =>
                    setCommunityRules({ ...communityRules, allowAnonymousVoice: e.target.checked })
                  }
                />
              </label>
              <div>
                <label className="block text-xs font-semibold mb-1">Pinned Campus Notice Banner</label>
                <input
                  type="text"
                  value={communityRules.pinnedNotice}
                  onChange={(e) => setCommunityRules({ ...communityRules, pinnedNotice: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </AdminCard>

          <AdminCard title={`Flagged Content & Safety Reports (${reports.length})`}>
            {reports.length === 0 ? (
              <p className="text-xs text-slate-500">No flagged community items pending moderation.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {reports.map((r) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold">{r.subject}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.sourceModule} · {r.requesterName}
                      </div>
                    </div>
                    <StatusLabel status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </div>
      </div>
    );
  }

  const modules = ['All', 'Study Hub', 'Notes Exchange', 'Community', 'Career', 'College Explorer', 'Events', 'Marketplace'];
  const visibleItems = contentItems.filter((c) => moduleFilter === 'All' || c.module === moduleFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Unified Content Management
          </h1>
          <p className="text-xs text-slate-500">
            Review, approve, feature, archive, or reject live items across 7 platform content modules.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {modules.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModuleFilter(m)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                moduleFilter === m
                  ? 'bg-[#172554] text-white border-[#172554]'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

      <AdminCard title={`Platform Content Index (${visibleItems.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase text-slate-500">
                <th className="py-2 pr-3">Title & Summary</th>
                <th className="py-2 pr-3">Module</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleItems.slice(0, 60).map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 pr-3 max-w-xs">
                    <div className="font-bold truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{item.summary}</div>
                  </td>
                  <td className="py-2.5 pr-3 font-medium">{item.module}</td>
                  <td className="py-2.5 pr-3">
                    <StatusLabel status={item.status} />
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-[11px] tabular-nums">
                    {formatShortDate(item.createdAt)}
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    {hasPermission('approve') && (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleContentAction(item.id, 'approve')}
                          className="px-2 py-1 rounded border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContentAction(item.id, item.featured ? 'unfeature' : 'feature')}
                          className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:text-amber-500"
                          title={item.featured ? 'Unfeature' : 'Feature'}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleContentAction(item.id, 'reject')}
                          className="px-2 py-1 rounded border border-red-200 text-red-700 font-semibold hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
};
