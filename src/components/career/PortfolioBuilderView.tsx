import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCareer } from '../../context/CareerContext';
import { CAREER_MEDIA, isSafeHttpUrl } from '../../data/careerData';
import type { PortfolioDocument, PortfolioProject } from '../../types/career';

const PORTFOLIO_SECTION_LABELS: Record<PortfolioDocument['sectionOrder'][number], string> = {
  about: 'About Me',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects Showcase',
  experience: 'Experience Summary',
  certifications: 'Certifications',
  achievements: 'Achievements',
  resume: 'Resume Attachment',
  contact: 'Contact & Social Links',
};

export const PortfolioBuilderView: React.FC = () => {
  const { profile } = useAuth();
  const { portfolio, resumes, crossModule, updatePortfolio, showToast } = useCareer();

  const [draft, setDraft] = useState<PortfolioDocument | null>(portfolio);
  const [newSkill, setNewSkill] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Project form
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTech, setProjTech] = useState('');
  const [projRole, setProjRole] = useState('');
  const [projGithub, setProjGithub] = useState('');
  const [projDemo, setProjDemo] = useState('');
  const [projOutcomes, setProjOutcomes] = useState('');

  useEffect(() => {
    if (portfolio) setDraft(JSON.parse(JSON.stringify(portfolio)));
  }, [portfolio]);

  if (!draft) {
    return (
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
        Initializing Portfolio Builder...
      </div>
    );
  }

  const moveSection = (sec: PortfolioDocument['sectionOrder'][number], dir: -1 | 1) => {
    const order = [...draft.sectionOrder];
    const idx = order.indexOf(sec);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= order.length) return;
    [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
    setDraft({ ...draft, sectionOrder: order });
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !projDesc.trim()) {
      showToast('error', 'Project title and description are required.');
      return;
    }
    if (!isSafeHttpUrl(projGithub) || !isSafeHttpUrl(projDemo)) {
      showToast('error', 'GitHub and Demo links must start with https:// or http://.');
      return;
    }
    const item: PortfolioProject = {
      id: `pproj_${Date.now()}`,
      title: projTitle.trim(),
      description: projDesc.trim(),
      technologies: projTech
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      role: projRole.trim() || 'Contributor',
      githubUrl: projGithub.trim() || undefined,
      liveDemoUrl: projDemo.trim() || undefined,
      outcomes: projOutcomes.trim() || 'Documented implementation & verification.',
    };
    setDraft({ ...draft, projects: [item, ...draft.projects] });
    setProjTitle('');
    setProjDesc('');
    setProjTech('');
    setProjRole('');
    setProjGithub('');
    setProjDemo('');
    setProjOutcomes('');
    showToast('info', 'Project added to draft. Click Save Portfolio to persist.');
  };

  const handleSave = async () => {
    if (!isSafeHttpUrl(draft.githubUrl) || !isSafeHttpUrl(draft.linkedinUrl)) {
      showToast('error', 'GitHub and LinkedIn URLs must use http:// or https://.');
      return;
    }
    await updatePortfolio(draft);
  };

  const handleSyncFromProfile = () => {
    setDraft({
      ...draft,
      educationSummary: `${profile.course} · ${profile.college} (${profile.semester})${
        crossModule.kampusIdNumber ? ` · KAMPUS ID ${crossModule.kampusIdNumber}` : ''
      }`,
      contactEmail: profile.email || draft.contactEmail,
    });
    showToast('info', 'Synced academic profile & KAMPUS ID info into portfolio draft.');
  };

  const publicUrl = `${window.location.origin}/#/career?portfolio=${encodeURIComponent(draft.publicSlug)}`;

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast('success', 'Public portfolio URL copied to clipboard.');
    } catch {
      showToast('info', publicUrl);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Student Portfolio Builder
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Showcase real projects, code repositories, and academic credentials with explicit Public / Private visibility control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDraft({ ...draft, isPublic: !draft.isPublic })}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              draft.isPublic
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {draft.isPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{draft.isPublic ? 'Public Portfolio' : 'Private (Hidden)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewOpen((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewOpen ? 'Hide Preview' : 'Preview Portfolio'}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSave()}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Save Portfolio
          </button>
        </div>
      </div>

      {/* Share Link & Theme Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#172033] dark:text-slate-100">
              Shareable Portfolio Link ({draft.isPublic ? 'Published' : 'Save as Public to unlock'})
            </span>
            <button
              type="button"
              onClick={handleSyncFromProfile}
              className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
            >
              Sync Profile & KAMPUS ID
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft.publicSlug}
              onChange={(e) => setDraft({ ...draft, publicSlug: e.target.value })}
              aria-label="Portfolio slug"
              className="w-40 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
            <button
              type="button"
              onClick={() => void handleCopyPublicLink()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Public URL</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-[#172033] dark:text-slate-100">Portfolio Theme</div>
          <div className="flex flex-wrap gap-2">
            {(['Editorial Clean', 'Minimal Slate', 'Technical Grid'] as const).map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => setDraft({ ...draft, theme: th })}
                className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                  draft.theme === th
                    ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/30 text-[#2563EB]'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {th}
              </button>
            ))}
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[#2563EB] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#2563EB]">
                Public Portfolio Preview · Theme: {draft.theme}
              </div>
              <h3 className="text-2xl font-extrabold text-[#172033] dark:text-slate-100">
                {profile.name}
              </h3>
              <div className="text-xs text-[#64748B] dark:text-slate-400">
                {draft.educationSummary}
              </div>
            </div>
            <img
              src={CAREER_MEDIA.portfolio}
              alt="Student project showcase preview"
              className="w-28 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
            />
          </div>

          {draft.sectionOrder.map((sec) => {
            if (sec === 'about' && draft.aboutMe) {
              return (
                <div key={sec} className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">About</h4>
                  <p className="text-sm text-[#172033] dark:text-slate-200">{draft.aboutMe}</p>
                </div>
              );
            }
            if (sec === 'skills' && draft.skills.length > 0) {
              return (
                <div key={sec} className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Skills</h4>
                  <p className="text-sm text-[#172033] dark:text-slate-200">{draft.skills.join(' · ')}</p>
                </div>
              );
            }
            if (sec === 'projects' && draft.projects.length > 0) {
              return (
                <div key={sec} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Projects</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {draft.projects.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <div className="text-sm font-bold text-[#172033] dark:text-slate-100">{p.title}</div>
                        <div className="text-xs text-[#2563EB] font-semibold">
                          Role: {p.role} · {p.technologies.join(', ')}
                        </div>
                        <p className="text-xs text-[#64748B] dark:text-slate-300">{p.description}</p>
                        <p className="text-xs text-[#172033] dark:text-slate-200">Outcome: {p.outcomes}</p>
                        <div className="flex gap-3 text-xs pt-1">
                          {p.githubUrl && isSafeHttpUrl(p.githubUrl) && (
                            <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] inline-flex items-center gap-1 hover:underline">
                              <ExternalLink className="w-3 h-3" /> GitHub
                            </a>
                          )}
                          {p.liveDemoUrl && isSafeHttpUrl(p.liveDemoUrl) && (
                            <a href={p.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] inline-flex items-center gap-1 hover:underline">
                              <ExternalLink className="w-3 h-3" /> Live Demo
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (sec === 'contact' && draft.showContactLinks) {
              return (
                <div key={sec} className="space-y-1 text-xs text-[#64748B]">
                  <h4 className="font-bold uppercase tracking-wider">Contact Links</h4>
                  <div>
                    {[draft.contactEmail, draft.githubUrl, draft.linkedinUrl].filter(Boolean).join(' · ')}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Main Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          {/* Core Details */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
              About, Education, Skills & Contact
            </h3>
            <textarea
              rows={3}
              value={draft.aboutMe}
              onChange={(e) => setDraft({ ...draft, aboutMe: e.target.value })}
              placeholder="Write a concise, genuine introduction about your academic focus and interests..."
              className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="text"
              value={draft.educationSummary}
              onChange={(e) => setDraft({ ...draft, educationSummary: e.target.value })}
              placeholder="Education summary"
              className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <textarea
              rows={2}
              value={draft.experienceSummary}
              onChange={(e) => setDraft({ ...draft, experienceSummary: e.target.value })}
              placeholder="Internships, lab work, or leadership summary..."
              className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add portfolio skill..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => {
                  const s = newSkill.trim();
                  if (!s || draft.skills.includes(s)) return;
                  setDraft({ ...draft, skills: [...draft.skills, s] });
                  setNewSkill('');
                }}
                className="px-3 py-2 rounded-lg bg-[#2563EB] text-white font-semibold cursor-pointer"
              >
                Add Skill
              </button>
            </div>
            {draft.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {draft.skills.map((s) => (
                  <span key={s} className="px-2 py-1 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                    {s}
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, skills: draft.skills.filter((x) => x !== s) })}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <textarea
                rows={2}
                value={draft.certifications.join('\n')}
                onChange={(e) =>
                  setDraft({ ...draft, certifications: e.target.value.split('\n').filter(Boolean) })
                }
                placeholder="Certifications (one per line)"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <textarea
                rows={2}
                value={draft.achievements.join('\n')}
                onChange={(e) =>
                  setDraft({ ...draft, achievements: e.target.value.split('\n').filter(Boolean) })
                }
                placeholder="Achievements (one per line)"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="email"
                value={draft.contactEmail || ''}
                onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
                placeholder="Public Contact Email"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="url"
                value={draft.githubUrl || ''}
                onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
                placeholder="GitHub Profile URL"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="url"
                value={draft.linkedinUrl || ''}
                onChange={(e) => setDraft({ ...draft, linkedinUrl: e.target.value })}
                placeholder="LinkedIn Profile URL"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.showContactLinks}
                  onChange={(e) => setDraft({ ...draft, showContactLinks: e.target.checked })}
                />
                <span>Allow contact links when portfolio is Public</span>
              </label>

              <select
                value={draft.resumeVersionId || ''}
                onChange={(e) => setDraft({ ...draft, resumeVersionId: e.target.value || undefined })}
                className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="">Attach resume version (optional)</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.versionName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section Order */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
              Reorder 9 Portfolio Sections
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {draft.sectionOrder.map((sec, idx) => (
                <div
                  key={sec}
                  className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <span className="font-semibold">{PORTFOLIO_SECTION_LABELS[sec]}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(sec, -1)}
                      className="p-0.5 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === draft.sectionOrder.length - 1}
                      onClick={() => moveSection(sec, 1)}
                      className="p-0.5 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Add & Manage Projects */}
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleAddProject}
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
              Add Project Case Study
            </h3>
            <input
              type="text"
              required
              value={projTitle}
              onChange={(e) => setProjTitle(e.target.value)}
              placeholder="Project title *"
              className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <textarea
              rows={2}
              required
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Problem & implementation summary *"
              className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={projTech}
                onChange={(e) => setProjTech(e.target.value)}
                placeholder="Tech (comma separated)"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={projRole}
                onChange={(e) => setProjRole(e.target.value)}
                placeholder="Your role"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="url"
                value={projGithub}
                onChange={(e) => setProjGithub(e.target.value)}
                placeholder="GitHub URL"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="url"
                value={projDemo}
                onChange={(e) => setProjDemo(e.target.value)}
                placeholder="Live Demo URL"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <input
              type="text"
              value={projOutcomes}
              onChange={(e) => setProjOutcomes(e.target.value)}
              placeholder="Measurable outcomes or test results"
              className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project to Portfolio</span>
            </button>
          </form>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
              Portfolio Projects ({draft.projects.length})
            </h3>
            {draft.projects.length === 0 ? (
              <p className="text-[#64748B]">No projects added yet.</p>
            ) : (
              <div className="space-y-2.5">
                {draft.projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-[#172033] dark:text-slate-100">{p.title}</div>
                      <div className="text-[#64748B] dark:text-slate-400">
                        {p.role} · {p.technologies.join(', ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({ ...draft, projects: draft.projects.filter((x) => x.id !== p.id) })
                      }
                      aria-label="Remove project"
                      className="text-rose-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
