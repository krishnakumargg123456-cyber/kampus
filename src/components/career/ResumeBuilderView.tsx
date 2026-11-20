import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { CareerAiSuggestion, useCareer } from '../../context/CareerContext';
import { RESUME_SECTION_LABELS, RESUME_TEMPLATES } from '../../data/careerData';
import type { ResumeDocument, ResumeSectionKey, ResumeTemplateId } from '../../types/career';

export const ResumeBuilderView: React.FC = () => {
  const {
    resumes,
    createResume,
    updateResume,
    deleteResume,
    uploadResumePdf,
    runCareerAiResumeAssistant,
    showToast,
  } = useCareer();

  const [selectedId, setSelectedId] = useState<string>(resumes[0]?.id || '');
  const [draft, setDraft] = useState<ResumeDocument | null>(resumes[0] || null);
  const [newSkill, setNewSkill] = useState('');
  const [newVersionTitle, setNewVersionTitle] = useState('');
  const [targetRoleForAi, setTargetRoleForAi] = useState('Software Engineering Intern');
  const [aiSuggestions, setAiSuggestions] = useState<CareerAiSuggestion[]>([]);
  const [aiSourceLabel, setAiSourceLabel] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    const found = resumes.find((r) => r.id === selectedId) || resumes[0] || null;
    setDraft(found ? JSON.parse(JSON.stringify(found)) : null);
    if (found && !selectedId) setSelectedId(found.id);
  }, [resumes, selectedId]);

  if (!draft) {
    return (
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
        Initializing your Resume Builder...
      </div>
    );
  }

  const handleSave = async () => {
    await updateResume(draft.id, draft);
  };

  const handleCreateVersion = async () => {
    const title = newVersionTitle.trim() || `Resume Version ${resumes.length + 1}`;
    const created = await createResume({
      ...draft,
      id: undefined,
      versionName: title,
    });
    if (created) {
      setSelectedId(created.id);
      setNewVersionTitle('');
    }
  };

  const moveSection = (sec: ResumeSectionKey, dir: -1 | 1) => {
    const order = [...draft.sectionOrder];
    const idx = order.indexOf(sec);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= order.length) return;
    [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
    setDraft({ ...draft, sectionOrder: order });
  };

  const toggleSectionHidden = (sec: ResumeSectionKey) => {
    const hidden = draft.hiddenSections.includes(sec)
      ? draft.hiddenSections.filter((s) => s !== sec)
      : [...draft.hiddenSections, sec];
    setDraft({ ...draft, hiddenSections: hidden });
  };

  const handleAddSkill = () => {
    const clean = newSkill.trim();
    if (!clean || draft.skills.includes(clean)) return;
    setDraft({ ...draft, skills: [...draft.skills, clean] });
    setNewSkill('');
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('error', 'Please select a .pdf file only.');
      return;
    }
    await uploadResumePdf(file, draft.id);
    e.target.value = '';
  };

  const handleRunAi = async (
    mode: 'improve-summary' | 'rewrite-bullets' | 'suggest-verbs' | 'review-structure' | 'missing-sections'
  ) => {
    setAiBusy(true);
    try {
      const res = await runCareerAiResumeAssistant(mode, draft, targetRoleForAi);
      setAiSuggestions(res.suggestions);
      setAiSourceLabel(res.sourceLabel);
    } finally {
      setAiBusy(false);
    }
  };

  const applyAiSuggestion = (sug: CareerAiSuggestion) => {
    if (sug.mode === 'improve-summary') {
      setDraft({ ...draft, summary: sug.proposedText });
    } else if (sug.mode === 'rewrite-bullets') {
      if (draft.projects.length > 0) {
        const updatedProjects = [...draft.projects];
        updatedProjects[0] = {
          ...updatedProjects[0],
          bullets: [sug.proposedText, ...updatedProjects[0].bullets.slice(1)],
        };
        setDraft({ ...draft, projects: updatedProjects });
      } else {
        setDraft({
          ...draft,
          projects: [
            { title: 'Student Project (Verify Title)', tech: draft.skills.slice(0, 3).join(', '), link: '', bullets: [sug.proposedText] },
          ],
        });
      }
    }
    setAiSuggestions((prev) =>
      prev.map((x) => (x.id === sug.id ? { ...x, status: 'accepted' } : x))
    );
    showToast('info', 'Suggestion inserted into your draft. Click Save Resume to persist.');
  };

  return (
    <div className="space-y-6">
      {/* Top Version Bar & Export */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            ATS Resume Builder & AI Assistant
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Create role-specific resume versions, reorder or hide any of the 13 sections, export ATS-clean PDFs, or upload an external PDF (max 5 MB).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={draft.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.versionName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => void handleSave()}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Save Resume
          </button>

          <a
            href={`/api/career/resumes/${draft.id}/pdf`}
            download={`${draft.versionName.replace(/[^a-z0-9_-]/gi, '_')}.pdf`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#172554] hover:bg-slate-800 text-white text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export ATS PDF</span>
          </a>

          {resumes.length > 1 && (
            <button
              type="button"
              onClick={() => void deleteResume(draft.id)}
              aria-label="Delete resume version"
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Create New Version + Upload PDF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newVersionTitle}
            onChange={(e) => setNewVersionTitle(e.target.value)}
            placeholder="New version name (e.g., Data Analyst CV)..."
            className="flex-1 min-w-44 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
          />
          <button
            type="button"
            onClick={() => void handleCreateVersion()}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Version</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs">
            <div className="font-semibold text-[#172033] dark:text-slate-100">
              Upload External Resume PDF (max 5 MB, private)
            </div>
            <div className="text-[#64748B] dark:text-slate-400">
              {draft.uploadedPdfName ? `Attached: ${draft.uploadedPdfName}` : 'No external PDF attached'}
            </div>
          </div>
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-100">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload PDF</span>
            <input type="file" accept="application/pdf,.pdf" onChange={(e) => void handlePdfUpload(e)} className="hidden" />
          </label>
        </div>
      </div>

      {/* Main Split: Editor + Live ATS Preview + AI Assistant */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Form Editor */}
        <div className="xl:col-span-7 space-y-5">
          {/* Template Selector */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Choose Template (6 ATS-Clean Layouts)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RESUME_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, templateId: tpl.id as ResumeTemplateId })}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    draft.templateId === tpl.id
                      ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-[#172033] dark:text-slate-100">
                    {tpl.id}
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 line-clamp-2">
                    {tpl.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Personal Information */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
              1. Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <input
                type="text"
                value={draft.personalInfo.fullName}
                onChange={(e) =>
                  setDraft({ ...draft, personalInfo: { ...draft.personalInfo, fullName: e.target.value } })
                }
                placeholder="Full Name"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={draft.personalInfo.headline}
                onChange={(e) =>
                  setDraft({ ...draft, personalInfo: { ...draft.personalInfo, headline: e.target.value } })
                }
                placeholder="Headline (e.g., B.Tech CS Student)"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="email"
                value={draft.personalInfo.email}
                onChange={(e) =>
                  setDraft({ ...draft, personalInfo: { ...draft.personalInfo, email: e.target.value } })
                }
                placeholder="Email"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={draft.personalInfo.phone}
                onChange={(e) =>
                  setDraft({ ...draft, personalInfo: { ...draft.personalInfo, phone: e.target.value } })
                }
                placeholder="Phone"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={draft.personalInfo.location}
                onChange={(e) =>
                  setDraft({ ...draft, personalInfo: { ...draft.personalInfo, location: e.target.value } })
                }
                placeholder="City / State"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={draft.personalInfo.github}
                onChange={(e) =>
                  setDraft({ ...draft, personalInfo: { ...draft.personalInfo, github: e.target.value } })
                }
                placeholder="GitHub URL"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={draft.personalInfo.linkedin}
                onChange={(e) =>
                  setDraft({ ...draft, personalInfo: { ...draft.personalInfo, linkedin: e.target.value } })
                }
                placeholder="LinkedIn URL"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={draft.personalInfo.portfolioUrl}
                onChange={(e) =>
                  setDraft({ ...draft, personalInfo: { ...draft.personalInfo, portfolioUrl: e.target.value } })
                }
                placeholder="Portfolio URL"
                className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Section Order & Visibility + Editable Sections */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Section Order, Visibility & Content (12 Reorderable Sections)
            </div>

            <div className="space-y-3">
              {draft.sectionOrder.map((sec, idx) => {
                const isHidden = draft.hiddenSections.includes(sec);
                return (
                  <div
                    key={sec}
                    className={`p-4 rounded-xl border ${
                      isHidden
                        ? 'border-dashed border-slate-300 dark:border-slate-700 opacity-65'
                        : 'border-slate-200 dark:border-slate-700 bg-[#F8FAFC]/60 dark:bg-slate-800/40'
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#172033] dark:text-slate-100">
                        {RESUME_SECTION_LABELS[sec]}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSection(sec, -1)}
                          disabled={idx === 0}
                          aria-label="Move section up"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(sec, 1)}
                          disabled={idx === draft.sectionOrder.length - 1}
                          aria-label="Move section down"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSectionHidden(sec)}
                          aria-label={isHidden ? 'Show section' : 'Hide section'}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {!isHidden && sec === 'summary' && (
                      <textarea
                        rows={3}
                        value={draft.summary}
                        onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                        placeholder="Write a concise, factual summary of your coursework, tools, and learning focus..."
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    )}

                    {!isHidden && sec === 'education' && (
                      <div className="space-y-2">
                        {draft.education.map((ed, eIdx) => (
                          <div key={eIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <input
                              value={ed.institution}
                              onChange={(e) => {
                                const next = [...draft.education];
                                next[eIdx] = { ...ed, institution: e.target.value };
                                setDraft({ ...draft, education: next });
                              }}
                              placeholder="Institution"
                              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                            <input
                              value={ed.degree}
                              onChange={(e) => {
                                const next = [...draft.education];
                                next[eIdx] = { ...ed, degree: e.target.value };
                                setDraft({ ...draft, education: next });
                              }}
                              placeholder="Degree"
                              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                            <input
                              value={ed.period}
                              onChange={(e) => {
                                const next = [...draft.education];
                                next[eIdx] = { ...ed, period: e.target.value };
                                setDraft({ ...draft, education: next });
                              }}
                              placeholder="Years / Sem"
                              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                            <input
                              value={ed.grade}
                              onChange={(e) => {
                                const next = [...draft.education];
                                next[eIdx] = { ...ed, grade: e.target.value };
                                setDraft({ ...draft, education: next });
                              }}
                              placeholder="CGPA / Grade"
                              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              education: [...draft.education, { institution: '', degree: '', period: '', grade: '' }],
                            })
                          }
                          className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          + Add Education Entry
                        </button>
                      </div>
                    )}

                    {!isHidden && sec === 'skills' && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                            placeholder="Add verified skill (e.g., TypeScript, SQL)..."
                            className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddSkill}
                            className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {draft.skills.map((sk) => (
                            <span
                              key={sk}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            >
                              <span>{sk}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraft({ ...draft, skills: draft.skills.filter((s) => s !== sk) })
                                }
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isHidden && (sec === 'experience' || sec === 'internships') && (
                      <div className="space-y-2">
                        {draft[sec].map((item, iIdx) => (
                          <div key={iIdx} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                value={item.role}
                                onChange={(e) => {
                                  const next = [...draft[sec]];
                                  next[iIdx] = { ...item, role: e.target.value };
                                  setDraft({ ...draft, [sec]: next });
                                }}
                                placeholder="Role"
                                className="px-2.5 py-1.5 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              />
                              <input
                                value={item.organization}
                                onChange={(e) => {
                                  const next = [...draft[sec]];
                                  next[iIdx] = { ...item, organization: e.target.value };
                                  setDraft({ ...draft, [sec]: next });
                                }}
                                placeholder="Organization"
                                className="px-2.5 py-1.5 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              />
                              <input
                                value={item.period}
                                onChange={(e) => {
                                  const next = [...draft[sec]];
                                  next[iIdx] = { ...item, period: e.target.value };
                                  setDraft({ ...draft, [sec]: next });
                                }}
                                placeholder="Dates"
                                className="px-2.5 py-1.5 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={item.bullets.join('\n')}
                              onChange={(e) => {
                                const next = [...draft[sec]];
                                next[iIdx] = {
                                  ...item,
                                  bullets: e.target.value.split('\n').filter(Boolean),
                                };
                                setDraft({ ...draft, [sec]: next });
                              }}
                              placeholder="One factual bullet per line..."
                              className="w-full px-2.5 py-1.5 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              [sec]: [...draft[sec], { role: '', organization: '', period: '', bullets: [] }],
                            })
                          }
                          className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          + Add {sec === 'internships' ? 'Internship' : 'Experience'}
                        </button>
                      </div>
                    )}

                    {!isHidden && sec === 'projects' && (
                      <div className="space-y-2">
                        {draft.projects.map((proj, pIdx) => (
                          <div key={pIdx} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                value={proj.title}
                                onChange={(e) => {
                                  const next = [...draft.projects];
                                  next[pIdx] = { ...proj, title: e.target.value };
                                  setDraft({ ...draft, projects: next });
                                }}
                                placeholder="Project Title"
                                className="px-2.5 py-1.5 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              />
                              <input
                                value={proj.tech}
                                onChange={(e) => {
                                  const next = [...draft.projects];
                                  next[pIdx] = { ...proj, tech: e.target.value };
                                  setDraft({ ...draft, projects: next });
                                }}
                                placeholder="Tech Stack"
                                className="px-2.5 py-1.5 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              />
                              <input
                                value={proj.link}
                                onChange={(e) => {
                                  const next = [...draft.projects];
                                  next[pIdx] = { ...proj, link: e.target.value };
                                  setDraft({ ...draft, projects: next });
                                }}
                                placeholder="GitHub / Demo URL"
                                className="px-2.5 py-1.5 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={proj.bullets.join('\n')}
                              onChange={(e) => {
                                const next = [...draft.projects];
                                next[pIdx] = {
                                  ...proj,
                                  bullets: e.target.value.split('\n').filter(Boolean),
                                };
                                setDraft({ ...draft, projects: next });
                              }}
                              placeholder="One bullet per line..."
                              className="w-full px-2.5 py-1.5 rounded bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              projects: [...draft.projects, { title: '', tech: '', link: '', bullets: [] }],
                            })
                          }
                          className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          + Add Project
                        </button>
                      </div>
                    )}

                    {!isHidden && sec === 'certifications' && (
                      <div className="space-y-2">
                        {draft.certifications.map((cert, cIdx) => (
                          <div key={cIdx} className="grid grid-cols-3 gap-2 text-xs">
                            <input
                              value={cert.title}
                              onChange={(e) => {
                                const next = [...draft.certifications];
                                next[cIdx] = { ...cert, title: e.target.value };
                                setDraft({ ...draft, certifications: next });
                              }}
                              placeholder="Certification"
                              className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                            <input
                              value={cert.issuer}
                              onChange={(e) => {
                                const next = [...draft.certifications];
                                next[cIdx] = { ...cert, issuer: e.target.value };
                                setDraft({ ...draft, certifications: next });
                              }}
                              placeholder="Issuer"
                              className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                            <input
                              value={cert.year}
                              onChange={(e) => {
                                const next = [...draft.certifications];
                                next[cIdx] = { ...cert, year: e.target.value };
                                setDraft({ ...draft, certifications: next });
                              }}
                              placeholder="Year"
                              className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              certifications: [...draft.certifications, { title: '', issuer: '', year: '' }],
                            })
                          }
                          className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          + Add Certification
                        </button>
                      </div>
                    )}

                    {!isHidden && sec === 'positions' && (
                      <div className="space-y-2">
                        {draft.positions.map((pos, pIdx) => (
                          <div key={pIdx} className="grid grid-cols-3 gap-2 text-xs">
                            <input
                              value={pos.role}
                              onChange={(e) => {
                                const next = [...draft.positions];
                                next[pIdx] = { ...pos, role: e.target.value };
                                setDraft({ ...draft, positions: next });
                              }}
                              placeholder="Role (e.g., Club Lead)"
                              className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                            <input
                              value={pos.organization}
                              onChange={(e) => {
                                const next = [...draft.positions];
                                next[pIdx] = { ...pos, organization: e.target.value };
                                setDraft({ ...draft, positions: next });
                              }}
                              placeholder="Club / Committee"
                              className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                            <input
                              value={pos.period}
                              onChange={(e) => {
                                const next = [...draft.positions];
                                next[pIdx] = { ...pos, period: e.target.value };
                                setDraft({ ...draft, positions: next });
                              }}
                              placeholder="Year"
                              className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              positions: [...draft.positions, { role: '', organization: '', period: '' }],
                            })
                          }
                          className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          + Add Position
                        </button>
                      </div>
                    )}

                    {!isHidden && (sec === 'achievements' || sec === 'extracurricular' || sec === 'languages') && (
                      <textarea
                        rows={2}
                        value={draft[sec].join('\n')}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [sec]: e.target.value.split('\n').filter(Boolean),
                          })
                        }
                        placeholder={`One ${sec} item per line...`}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    )}

                    {!isHidden && sec === 'links' && (
                      <div className="space-y-2">
                        {draft.links.map((lk, lIdx) => (
                          <div key={lIdx} className="grid grid-cols-2 gap-2 text-xs">
                            <input
                              value={lk.label}
                              onChange={(e) => {
                                const next = [...draft.links];
                                next[lIdx] = { ...lk, label: e.target.value };
                                setDraft({ ...draft, links: next });
                              }}
                              placeholder="Label (e.g., LeetCode)"
                              className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                            <input
                              value={lk.url}
                              onChange={(e) => {
                                const next = [...draft.links];
                                next[lIdx] = { ...lk, url: e.target.value };
                                setDraft({ ...draft, links: next });
                              }}
                              placeholder="https://..."
                              className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({ ...draft, links: [...draft.links, { label: '', url: '' }] })
                          }
                          className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          + Add Link
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: AI Resume Assistant + Live Formatted Preview */}
        <div className="xl:col-span-5 space-y-5">
          {/* AI Resume Assistant */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                  KAMPUS AI Resume Assistant
                </h3>
              </div>
              <span className="text-[11px] text-[#64748B]">Never invents fake claims</span>
            </div>

            <input
              type="text"
              value={targetRoleForAi}
              onChange={(e) => setTargetRoleForAi(e.target.value)}
              placeholder="Target role (e.g., Data Analyst Intern)"
              className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['improve-summary', 'Improve Summary'],
                  ['rewrite-bullets', 'Rewrite Bullets'],
                  ['suggest-verbs', 'Action Verbs'],
                  ['review-structure', 'Review Formatting'],
                  ['missing-sections', 'Missing Checks'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  disabled={aiBusy}
                  onClick={() => void handleRunAi(mode)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#2563EB] hover:text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>

            {aiSourceLabel && (
              <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                Source: {aiSourceLabel} (AI-generated suggestions — no guaranteed ATS score)
              </div>
            )}

            {aiSuggestions.length > 0 && (
              <div className="space-y-2.5">
                {aiSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="font-bold text-[#172033] dark:text-slate-100">{sug.title}</div>
                    <textarea
                      rows={3}
                      value={sug.proposedText}
                      onChange={(e) =>
                        setAiSuggestions((prev) =>
                          prev.map((x) =>
                            x.id === sug.id ? { ...x, proposedText: e.target.value, status: 'edited' } : x
                          )
                        )
                      }
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                    <div className="text-[11px] text-[#64748B] dark:text-slate-400">{sug.rationale}</div>
                    <div className="flex items-center gap-2">
                      {(sug.mode === 'improve-summary' || sug.mode === 'rewrite-bullets') && (
                        <button
                          type="button"
                          onClick={() => applyAiSuggestion(sug)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept Into Draft</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setAiSuggestions((prev) => prev.filter((x) => x.id !== sug.id))
                        }
                        className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-[11px] font-semibold cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Formatted ATS Resume Preview */}
          <div className="p-6 rounded-xl bg-white text-slate-900 border border-slate-300 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Live Preview · {draft.templateId} Template</span>
              </span>
              <span>Single-Column ATS Safe</span>
            </div>

            <div
              className={`border-b pb-3 ${
                draft.templateId === 'Modern' ? 'border-[#172554]' : 'border-slate-300'
              }`}
            >
              <div className="text-lg font-extrabold tracking-tight text-[#172554]">
                {draft.personalInfo.fullName || 'Your Name'}
              </div>
              {draft.personalInfo.headline && (
                <div className="text-xs font-medium text-slate-600">{draft.personalInfo.headline}</div>
              )}
              <div className="text-[11px] text-slate-600 mt-1">
                {[
                  draft.personalInfo.email,
                  draft.personalInfo.phone,
                  draft.personalInfo.location,
                  draft.personalInfo.github,
                  draft.personalInfo.linkedin,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>

            {draft.sectionOrder.map((sec) => {
              if (draft.hiddenSections.includes(sec)) return null;
              if (sec === 'summary' && draft.summary.trim()) {
                return (
                  <div key={sec} className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#172554]">
                      Summary
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{draft.summary}</p>
                  </div>
                );
              }
              if (sec === 'education' && draft.education.length > 0) {
                return (
                  <div key={sec} className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#172554]">
                      Education
                    </div>
                    {draft.education.map((e, i) => (
                      <div key={i} className="text-xs text-slate-700 flex justify-between">
                        <span>
                          <strong>{e.institution}</strong> — {e.degree} {e.grade && `(${e.grade})`}
                        </span>
                        <span className="text-slate-500">{e.period}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              if (sec === 'skills' && draft.skills.length > 0) {
                return (
                  <div key={sec} className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#172554]">
                      Skills
                    </div>
                    <p className="text-xs text-slate-700">{draft.skills.join(' · ')}</p>
                  </div>
                );
              }
              if ((sec === 'projects') && draft.projects.length > 0) {
                return (
                  <div key={sec} className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#172554]">
                      Projects
                    </div>
                    {draft.projects.map((p, i) => (
                      <div key={i} className="text-xs text-slate-700">
                        <div className="font-bold">
                          {p.title} {p.tech && <span className="font-normal text-slate-500">({p.tech})</span>}
                        </div>
                        <ul className="list-disc pl-4 text-[11px]">
                          {p.bullets.map((b, bi) => (
                            <li key={bi}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              }
              if ((sec === 'internships' || sec === 'experience') && draft[sec].length > 0) {
                return (
                  <div key={sec} className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#172554]">
                      {RESUME_SECTION_LABELS[sec]}
                    </div>
                    {draft[sec].map((item, i) => (
                      <div key={i} className="text-xs text-slate-700">
                        <div className="flex justify-between font-bold">
                          <span>
                            {item.role} — {item.organization}
                          </span>
                          <span className="font-normal text-slate-500">{item.period}</span>
                        </div>
                        <ul className="list-disc pl-4 text-[11px]">
                          {item.bullets.map((b, bi) => (
                            <li key={bi}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              }
              if (sec === 'certifications' && draft.certifications.length > 0) {
                return (
                  <div key={sec} className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#172554]">
                      Certifications
                    </div>
                    {draft.certifications.map((c, i) => (
                      <div key={i} className="text-xs text-slate-700">
                        {c.title} — {c.issuer} ({c.year})
                      </div>
                    ))}
                  </div>
                );
              }
              if (sec === 'positions' && draft.positions.length > 0) {
                return (
                  <div key={sec} className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#172554]">
                      Positions of Responsibility
                    </div>
                    {draft.positions.map((p, i) => (
                      <div key={i} className="text-xs text-slate-700">
                        {p.role} · {p.organization} ({p.period})
                      </div>
                    ))}
                  </div>
                );
              }
              if ((sec === 'achievements' || sec === 'extracurricular' || sec === 'languages') && draft[sec].length > 0) {
                return (
                  <div key={sec} className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#172554]">
                      {RESUME_SECTION_LABELS[sec]}
                    </div>
                    <p className="text-xs text-slate-700">{draft[sec].join(' · ')}</p>
                  </div>
                );
              }
              if (sec === 'links' && draft.links.length > 0) {
                return (
                  <div key={sec} className="space-y-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#172554]">
                      Links
                    </div>
                    {draft.links.map((l, i) => (
                      <div key={i} className="text-xs text-slate-700">
                        {l.label}: {l.url}
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
