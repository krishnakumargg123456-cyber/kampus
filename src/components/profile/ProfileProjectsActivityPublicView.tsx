import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Eye,
  Flag,
  FolderGit2,
  Globe,
  ImagePlus,
  KeyRound,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccountProfileSettings } from '../../context/AccountProfileSettingsContext';
import { useAuth } from '../../context/AuthContext';
import type { ConsolidatedActivityItem, StudentProject } from '../../types/accountProfileSettings';
import { resolveAssetUrl } from '../../utils/assetResolver';

interface Props {
  section: 'projects' | 'activity' | 'public';
  standaloneIdentifier?: string;
}

export const ProfileProjectsActivityPublicView: React.FC<Props> = ({ section, standaloneIdentifier }) => {
  const { user } = useAuth();
  const {
    profileRecord,
    stats,
    activity,
    roleInfo,
    reports,
    saving,
    saveProfilePatch,
    toggleModeratorRole,
    submitModerationAction,
    reportPublicItem,
  } = useAccountProfileSettings();

  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Portfolio project form state
  const [projFormOpen, setProjFormOpen] = useState(false);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [previewProject, setPreviewProject] = useState<StudentProject | null>(null);
  const [projForm, setProjForm] = useState<Omit<StudentProject, 'id' | 'orderIndex'>>({
    title: '',
    description: '',
    category: 'Software & AI',
    technologies: [],
    imageUrl: '',
    repoUrl: '',
    liveUrl: '',
    completionDateISO: new Date().toISOString().slice(0, 10),
    teamMode: 'Individual',
  });
  const [techInput, setTechInput] = useState('');

  // Activity filter
  const [actFilter, setActFilter] = useState<'All' | ConsolidatedActivityItem['category']>('All');

  // Public profile lookup state
  const [publicData, setPublicData] = useState<any>(null);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Moderator access state
  const [modPasskey, setModPasskey] = useState('');
  const [showModConsole, setShowModConsole] = useState(false);

  const lookupIdentifier = standaloneIdentifier || profileRecord?.username || '';

  useEffect(() => {
    if (section !== 'public' || !lookupIdentifier) return;
    setPublicError(null);
    fetch(
      `/api/profile/public/${encodeURIComponent(lookupIdentifier)}?viewerId=${encodeURIComponent(
        user?.id || ''
      )}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setPublicData(null);
          setPublicError(data.message || 'Unable to load public profile.');
        } else {
          setPublicData(data.publicProfile);
        }
      })
      .catch(() => setPublicError('Unable to load public profile.'));
  }, [section, lookupIdentifier, user?.id, profileRecord?.updatedAt]);

  // ==================================================
  // PORTFOLIO PROJECTS HANDLERS
  // ==================================================
  const openNewProject = () => {
    setEditingProjId(null);
    setProjForm({
      title: '',
      description: '',
      category: 'Software & AI',
      technologies: [],
      imageUrl: '',
      repoUrl: '',
      liveUrl: '',
      completionDateISO: new Date().toISOString().slice(0, 10),
      teamMode: 'Individual',
    });
    setTechInput('');
    setProjFormOpen(true);
  };

  const openEditProject = (p: StudentProject) => {
    setEditingProjId(p.id);
    setProjForm({
      title: p.title,
      description: p.description,
      category: p.category,
      technologies: p.technologies,
      imageUrl: p.imageUrl || '',
      repoUrl: p.repoUrl || '',
      liveUrl: p.liveUrl || '',
      completionDateISO: p.completionDateISO,
      teamMode: p.teamMode,
    });
    setTechInput(p.technologies.join(', '));
    setProjFormOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileRecord) return;
    if (!projForm.title.trim()) {
      setNotice({ type: 'err', text: 'Project title is required.' });
      return;
    }

    for (const u of [projForm.repoUrl, projForm.liveUrl]) {
      const clean = (u || '').trim();
      if (clean && !/^https?:\/\//i.test(clean)) {
        setNotice({ type: 'err', text: 'Repository and live URLs must start with https:// or http://.' });
        return;
      }
    }

    const techs = techInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let next = [...profileRecord.projects];
    if (editingProjId) {
      next = next.map((p) => (p.id === editingProjId ? { ...p, ...projForm, technologies: techs } : p));
    } else {
      next.push({
        id: `proj_${Date.now()}`,
        ...projForm,
        technologies: techs,
        orderIndex: next.length,
      });
    }

    const res = await saveProfilePatch({ projects: next });
    if (res.ok) {
      setProjFormOpen(false);
      setNotice({ type: 'ok', text: 'Portfolio project saved.' });
    } else {
      setNotice({ type: 'err', text: res.error || 'Could not save project.' });
    }
  };

  const handleMoveProject = async (index: number, delta: -1 | 1) => {
    if (!profileRecord) return;
    const target = index + delta;
    if (target < 0 || target >= profileRecord.projects.length) return;
    const copy = [...profileRecord.projects];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    const reindexed = copy.map((p, idx) => ({ ...p, orderIndex: idx }));
    await saveProfilePatch({ projects: reindexed });
  };

  const handleDeleteProject = async (id: string) => {
    if (!profileRecord) return;
    const next = profileRecord.projects
      .filter((p) => p.id !== id)
      .map((p, idx) => ({ ...p, orderIndex: idx }));
    await saveProfilePatch({ projects: next });
  };

  const handleProjectImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setNotice({ type: 'err', text: 'Preview image must be under 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProjForm((p) => ({ ...p, imageUrl: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  // ==================================================
  // RENDER: PROJECTS SECTION
  // ==================================================
  if (section === 'projects' && profileRecord) {
    return (
      <div className="space-y-6">
        {notice && (
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
              notice.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-blue-600" />
              <span>Portfolio & Projects</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Showcase real academic builds, research implementations, and validated repository or live demo links.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </div>

        {projFormOpen && (
          <form
            onSubmit={handleSaveProject}
            className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingProjId ? 'Edit Project' : 'New Portfolio Project'}
              </h3>
              <button type="button" onClick={() => setProjFormOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={projForm.title}
                  onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={projForm.category}
                  onChange={(e) => setProjForm({ ...projForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Technologies (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="React, TypeScript, Node.js"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={projForm.completionDateISO}
                    onChange={(e) => setProjForm({ ...projForm, completionDateISO: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Collaboration</label>
                  <select
                    value={projForm.teamMode}
                    onChange={(e) => setProjForm({ ...projForm, teamMode: e.target.value as 'Individual' | 'Team' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Team">Team</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Repository URL (https://...)
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={projForm.repoUrl}
                  onChange={(e) => setProjForm({ ...projForm, repoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Live Demo / Paper URL (https://...)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={projForm.liveUrl}
                  onChange={(e) => setProjForm({ ...projForm, liveUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={projForm.description}
                  onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <ImagePlus className="w-4 h-4 text-blue-600" />
                  <span>{projForm.imageUrl ? 'Screenshot attached' : 'Upload Preview Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleProjectImage(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProjFormOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                {saving ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </form>
        )}

        {profileRecord.projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center">
            <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No portfolio projects yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Add projects with real technologies, completion dates, and repository links.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileRecord.projects.map((p, idx) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                    <span className="font-bold text-blue-600 uppercase tracking-wider">{p.category}</span>
                    <span>
                      {p.teamMode} · {p.completionDateISO}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">{p.description}</p>
                  {p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewProject(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    {p.repoUrl && (
                      <a
                        href={p.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-semibold inline-flex items-center gap-0.5 hover:underline"
                      >
                        <span>Repo</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {p.liveUrl && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 font-semibold inline-flex items-center gap-0.5 hover:underline"
                      >
                        <span>Live</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveProject(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveProject(idx, 1)}
                      disabled={idx === profileRecord.projects.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditProject(p)}
                      className="px-2 py-1 rounded-lg text-blue-600 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(p.id)}
                      className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {previewProject && (
          <div
            onClick={() => setPreviewProject(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{previewProject.title}</h3>
                <button onClick={() => setPreviewProject(null)}>
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              {previewProject.imageUrl && (
                <img
                  src={previewProject.imageUrl}
                  alt={previewProject.title}
                  className="w-full h-48 object-cover rounded-xl"
                />
              )}
              <p className="text-xs text-slate-500 tabular-nums">
                {previewProject.category} · {previewProject.teamMode} · Completed {previewProject.completionDateISO}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {previewProject.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {previewProject.technologies.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                {previewProject.repoUrl && (
                  <a
                    href={previewProject.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <span>Open Repository</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {previewProject.liveUrl && (
                  <a
                    href={previewProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <span>Live Preview</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================================================
  // RENDER: REAL STATS & ACTIVITY SECTION
  // ==================================================
  if (section === 'activity') {
    const categories: Array<'All' | ConsolidatedActivityItem['category']> = [
      'All',
      'Community',
      'Notes',
      'Events',
      'Career',
      'Study',
      'Rewards',
      'Projects',
    ];
    const filtered = activity.filter((a) => actFilter === 'All' || a.category === actFilter);

    const statCards = [
      { label: 'Community Contributions', value: stats?.communityContributions ?? 0 },
      { label: 'Events Participated', value: stats?.eventsParticipated ?? 0 },
      { label: 'Projects Completed', value: stats?.projectsCompleted ?? 0 },
      { label: 'Achievements & Badges', value: stats?.achievementsEarned ?? 0 },
      { label: 'Study Goals Completed', value: stats?.studyGoalsCompleted ?? 0 },
      { label: 'Notes Uploaded', value: stats?.notesUploaded ?? 0 },
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Real KAMPUS Activity & Statistics</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Every metric below is calculated live from your actual KAMPUS records across Community, Events, Planner, Rewards, and Portfolio.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            {statCards.map((c) => (
              <div
                key={c.label}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">{c.label}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  actFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No recorded activity yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Participate in Community discussions, Campus Events, Planner goals, or add Portfolio projects to build your timeline.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 tabular-nums">{item.dateISO || '—'}</span>
                    <Link to={item.linkRoute} className="text-xs font-semibold text-blue-600 hover:underline">
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================================================
  // RENDER: PUBLIC PROFILE VIEW + MODERATION CONSOLE
  // ==================================================
  return (
    <div className="space-y-6">
      {!standaloneIdentifier && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Public Profile View & Safety Controls</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Preview exactly how peers see your public identity. Private contact info, DOB, and hidden sections are strictly stripped by the server.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModConsole((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <KeyRound className="w-3.5 h-3.5 text-orange-500" />
            <span>{roleInfo.role === 'Moderator Admin' ? 'Moderation Console' : 'Moderator Access'}</span>
          </button>
        </div>
      )}

      {/* Role-Protected Moderation Console */}
      {showModConsole && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                <span>Profile Moderation & Verification Console</span>
              </h3>
              <p className="text-xs text-slate-500">
                Active Role: <strong>{roleInfo.role}</strong>
              </p>
            </div>
            {roleInfo.role === 'Moderator Admin' ? (
              <button
                type="button"
                onClick={() => toggleModeratorRole(undefined, true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Revert to Student Role
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="Enter Moderator Passkey"
                  value={modPasskey}
                  onChange={(e) => setModPasskey(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const res = await toggleModeratorRole(modPasskey);
                    if (!res.ok) setNotice({ type: 'err', text: res.error || 'Invalid passkey.' });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  Unlock
                </button>
              </div>
            )}
          </div>

          {roleInfo.role === 'Moderator Admin' && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {profileRecord && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      submitModerationAction({ action: 'verify-profile', targetUserId: profileRecord.userId })
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                  >
                    Approve Student Verification
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      submitModerationAction({ action: 'revoke-verification', targetUserId: profileRecord.userId })
                    }
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    Revoke Verification
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Reported Profiles & Items ({reports.length})
                </p>
                {reports.length === 0 ? (
                  <p className="text-xs text-slate-500">No moderation reports submitted.</p>
                ) : (
                  reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {rep.targetName} · {rep.targetType} ({rep.status})
                        </p>
                        <p className="text-slate-500">Reason: {rep.reason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => submitModerationAction({ reportId: rep.id, action: 'resolve' })}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 font-semibold"
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => submitModerationAction({ reportId: rep.id, action: 'remove-content' })}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold"
                        >
                          Remove Content
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {publicError ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{publicError}</p>
        </div>
      ) : publicData ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="h-32 bg-blue-950">
            {publicData.coverUrl && (
              <img src={resolveAssetUrl(publicData.coverUrl)} alt="Cover" className="w-full h-full object-cover opacity-90" />
            )}
          </div>
          <div className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-14">
              <div className="flex items-end gap-4">
                {publicData.avatarUrl ? (
                  <img
                    src={resolveAssetUrl(publicData.avatarUrl)}
                    alt={publicData.fullName}
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl ring-4 ring-white dark:ring-slate-900 bg-blue-600 text-white flex items-center justify-center text-2xl font-extrabold">
                    {(publicData.fullName || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{publicData.fullName}</h3>
                    {publicData.isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    @{publicData.username} · {publicData.headline}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                <Flag className="w-3.5 h-3.5 text-rose-500" />
                <span>Report Profile</span>
              </button>
            </div>

            {publicData.college && (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {publicData.college} · {publicData.course} {publicData.semester ? `· ${publicData.semester}` : ''}
              </p>
            )}

            {publicData.bio && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {publicData.bio}
              </p>
            )}

            {publicData.skills?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {publicData.skills.map((s: any) => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
                    >
                      {s.name} · {s.level}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {publicData.projects?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Portfolio Projects</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {publicData.projects.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
          Loading public profile preview...
        </div>
      )}

      {reportOpen && publicData && (
        <div
          onClick={() => setReportOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Report Profile Content</h3>
            <textarea
              rows={3}
              placeholder="Describe why this profile or item violates KAMPUS guidelines..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!reportReason.trim()) return;
                  const res = await reportPublicItem({
                    targetUserId: publicData.userId,
                    targetType: 'Profile',
                    reason: reportReason,
                  });
                  setReportOpen(false);
                  setReportReason('');
                  setNotice(
                    res.ok
                      ? { type: 'ok', text: 'Report submitted for moderation review.' }
                      : { type: 'err', text: res.error || 'Could not submit report.' }
                  );
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
