import React, { useEffect, useState } from 'react';
import {
  CalendarPlus,
  CheckCircle2,
  Circle,
  Compass,
  Plus,
} from 'lucide-react';
import { useCareer } from '../../context/CareerContext';
import { CAREER_PATHS } from '../../data/careerData';
import type { CareerPathItem, CareerRoadmap } from '../../types/career';

const FIELDS: Array<CareerPathItem['field']> = [
  'Technology',
  'Business',
  'Creative',
  'Science & Research',
  'Healthcare',
  'Education',
];

const STAGE_TITLES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Stage 1: Foundation',
  2: 'Stage 2: Skill Development',
  3: 'Stage 3: Portfolio & Experience',
  4: 'Stage 4: Career Preparation',
  5: 'Stage 5: Opportunities',
};

export const CareerPathsAndRoadmapView: React.FC = () => {
  const { roadmap, updateRoadmap, scheduleCareerPlannerSession, showToast } = useCareer();

  const [subTab, setSubTab] = useState<'explorer' | 'roadmap'>('explorer');
  const [selectedField, setSelectedField] = useState<CareerPathItem['field'] | 'All'>('All');
  const [selectedPath, setSelectedPath] = useState<CareerPathItem>(CAREER_PATHS[0]);

  // Personalized Roadmap Draft
  const [rmDraft, setRmDraft] = useState<CareerRoadmap | null>(roadmap);
  const [newTaskStage, setNewTaskStage] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');

  useEffect(() => {
    if (roadmap) setRmDraft(JSON.parse(JSON.stringify(roadmap)));
  }, [roadmap]);

  const filteredPaths =
    selectedField === 'All'
      ? CAREER_PATHS
      : CAREER_PATHS.filter((p) => p.field === selectedField);

  const handleAdoptPathToRoadmap = async (cp: CareerPathItem) => {
    if (!rmDraft) return;
    const updated: CareerRoadmap = {
      ...rmDraft,
      careerInterest: cp.field,
      desiredRole: cp.title,
      milestones: [
        ...rmDraft.milestones,
        ...cp.learningRoadmap.map((step, i) => ({
          id: `rm_cp_${Date.now()}_${i}`,
          stage: (Math.min(5, i + 1) as 1 | 2 | 3 | 4 | 5),
          title: `${cp.title}: ${step}`,
          description: `Focus skills: ${cp.importantSkills.slice(0, 3).join(', ')}`,
          completed: false,
          isCustomTask: true,
        })),
      ],
    };
    setRmDraft(updated);
    await updateRoadmap(updated);
    setSubTab('roadmap');
  };

  const handleToggleMilestone = async (id: string) => {
    if (!rmDraft) return;
    const updated: CareerRoadmap = {
      ...rmDraft,
      milestones: rmDraft.milestones.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m
      ),
    };
    setRmDraft(updated);
    await updateRoadmap(updated);
  };

  const handleAddCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rmDraft || !newTaskTitle.trim()) return;
    const updated: CareerRoadmap = {
      ...rmDraft,
      milestones: [
        ...rmDraft.milestones,
        {
          id: `rm_custom_${Date.now()}`,
          stage: newTaskStage,
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim() || 'Personal milestone task',
          completed: false,
          isCustomTask: true,
        },
      ],
    };
    setRmDraft(updated);
    setNewTaskTitle('');
    setNewTaskDesc('');
    await updateRoadmap(updated);
  };

  const handleSyncToPlanner = (milestoneTitle: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    scheduleCareerPlannerSession({
      title: `Roadmap Milestone: ${milestoneTitle}`,
      targetName: rmDraft?.desiredRole || 'Career Goal',
      subject: rmDraft?.careerInterest || 'Career Roadmap',
      dateISO: tomorrow.toISOString().slice(0, 10),
      timeSlot: '06:00 PM',
      durationMinutes: 60,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Career Path Explorer & Personalized Roadmap
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Compare all 6 career domains ({CAREER_PATHS.length} detailed tracks) and manage your 5-stage personal preparation roadmap synced with KAMPUS Planner.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('explorer')}
            className={`px-3.5 py-1.5 rounded-lg cursor-pointer ${
              subTab === 'explorer' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Career Path Explorer ({CAREER_PATHS.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('roadmap')}
            className={`px-3.5 py-1.5 rounded-lg cursor-pointer ${
              subTab === 'roadmap' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            My 5-Stage Roadmap
          </button>
        </div>
      </div>

      {subTab === 'explorer' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedField('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                selectedField === 'All'
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              All Fields ({CAREER_PATHS.length})
            </button>
            {FIELDS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedField(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  selectedField === f
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredPaths.map((cp) => (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => setSelectedPath(cp)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    selectedPath.id === cp.id
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-[#2563EB]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-[#2563EB]">{cp.field}</div>
                  <div className="text-sm font-bold text-[#172033] dark:text-slate-100 mt-0.5">
                    {cp.title}
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 line-clamp-2">
                    {cp.overview}
                  </p>
                </button>
              ))}
            </div>

            <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-semibold text-[#2563EB]">{selectedPath.field}</div>
                  <h3 className="text-xl font-bold text-[#172033] dark:text-slate-100 mt-0.5">
                    {selectedPath.title}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-300 mt-1">
                    {selectedPath.overview}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAdoptPathToRoadmap(selectedPath)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shrink-0 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Add to My Roadmap</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1">
                  <div className="font-bold text-[#172033] dark:text-slate-100">
                    Formal Qualifications vs Hiring Reality
                  </div>
                  <p className="text-[#64748B] dark:text-slate-300 leading-relaxed">
                    {selectedPath.formalQualificationsNote}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 space-y-1">
                  <div className="font-bold text-[#172033] dark:text-slate-100">
                    General Career Guidance
                  </div>
                  <p className="text-[#64748B] dark:text-slate-300 leading-relaxed">
                    {selectedPath.generalGuidanceNote}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-[#172033] dark:text-slate-100 mb-1">
                    Typical Responsibilities
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-[#64748B] dark:text-slate-300">
                    {selectedPath.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#172033] dark:text-slate-100 mb-1">
                    Important Skills
                  </h4>
                  <p className="text-[#64748B] dark:text-slate-300">
                    {selectedPath.importantSkills.join(' · ')}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-[#172033] dark:text-slate-100 mb-1">
                    Suggested Learning Sequence
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1 text-[#64748B] dark:text-slate-300">
                    {selectedPath.learningRoadmap.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <h4 className="font-bold text-[#172033] dark:text-slate-100 mb-1">
                      Relevant Portfolio Projects
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-[#64748B] dark:text-slate-300">
                      {selectedPath.relevantProjects.map((pr, i) => (
                        <li key={i}>{pr}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#172033] dark:text-slate-100 mb-1">
                      Entry-Level Roles & Progression
                    </h4>
                    <p className="text-[#64748B] dark:text-slate-300">
                      Entry: {selectedPath.entryLevelRoles.join(', ')}
                    </p>
                    <p className="text-[#64748B] dark:text-slate-300 mt-1">
                      Growth: {selectedPath.progressionPaths.join('; ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'roadmap' && rmDraft && (
        <div className="space-y-6">
          {/* Student Inputs */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                  Your Study & Career Roadmap Inputs
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                  Roadmaps organize learning milestones — completion supports preparation and does not guarantee employment outcomes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void updateRoadmap(rmDraft)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
              >
                Save Roadmap Settings
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-semibold">Desired Career Role</span>
                <input
                  value={rmDraft.desiredRole}
                  onChange={(e) => setRmDraft({ ...rmDraft, desiredRole: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Education Level</span>
                <input
                  value={rmDraft.educationLevel}
                  onChange={(e) => setRmDraft({ ...rmDraft, educationLevel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Weekly Study Hours</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={rmDraft.weeklyHours}
                  onChange={(e) => setRmDraft({ ...rmDraft, weeklyHours: Number(e.target.value) || 6 })}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Academic Background</span>
                <input
                  value={rmDraft.academicBackground}
                  onChange={(e) => setRmDraft({ ...rmDraft, academicBackground: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Learning Preference</span>
                <input
                  value={rmDraft.learningPreference}
                  onChange={(e) => setRmDraft({ ...rmDraft, learningPreference: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Current Skills (comma separated)</span>
                <input
                  value={rmDraft.currentSkills.join(', ')}
                  onChange={(e) =>
                    setRmDraft({
                      ...rmDraft,
                      currentSkills: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
            </div>
          </div>

          {/* Add Custom Task */}
          <form
            onSubmit={(e) => void handleAddCustomTask(e)}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 text-xs"
          >
            <select
              value={newTaskStage}
              onChange={(e) => setNewTaskStage(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {([1, 2, 3, 4, 5] as const).map((s) => (
                <option key={s} value={s}>
                  {STAGE_TITLES[s]}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add personal milestone or skill task..."
              className="flex-1 min-w-48 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="text"
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              placeholder="Notes (optional)"
              className="w-48 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#2563EB] text-white font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </form>

          {/* Stages 1 to 5 */}
          <div className="space-y-4">
            {([1, 2, 3, 4, 5] as const).map((stageNum) => {
              const items = rmDraft.milestones.filter((m) => m.stage === stageNum);
              return (
                <div
                  key={stageNum}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      {STAGE_TITLES[stageNum]}
                    </h4>
                    <span className="text-xs font-semibold tabular-nums text-[#64748B]">
                      {items.filter((i) => i.completed).length}/{items.length} done
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400">No tasks in this stage yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {items.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <button
                            type="button"
                            onClick={() => void handleToggleMilestone(m.id)}
                            className="flex items-start gap-2.5 text-left cursor-pointer"
                          >
                            {m.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <div
                                className={`text-xs font-bold ${
                                  m.completed
                                    ? 'line-through text-slate-400'
                                    : 'text-[#172033] dark:text-slate-100'
                                }`}
                              >
                                {m.title}
                              </div>
                              <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                                {m.description}
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSyncToPlanner(m.title)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold shrink-0 cursor-pointer hover:border-[#2563EB]"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span>Sync to Planner</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
