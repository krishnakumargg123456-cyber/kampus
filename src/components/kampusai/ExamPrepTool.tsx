import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Loader2,
  Sparkles,
  ShieldAlert,
  Calendar,
  BookOpen,
  CheckCircle2,
  Bookmark,
  Check,
} from 'lucide-react';
import { useKampusAi } from '../../context/KampusAiContext';
import { AiLearningLevel, ExamPrepOutput } from '../../types/kampusAi';
import { runStructuredAiTool } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';

const EXAM_PRESETS = ['School', 'Board (CBSE/ICSE/State)', 'NEET', 'JEE', 'CUET', 'University', 'Other'];

export const ExamPrepTool: React.FC = () => {
  const {
    preferences,
    addHistoryEntry,
    saveItem,
    pendingReopenData,
    clearPendingReopenData,
  } = useKampusAi();

  const [examType, setExamType] = useState('University');
  const [customExamName, setCustomExamName] = useState('B.Tech Mid-Semester Examinations');
  const [subject, setSubject] = useState('Database Management Systems & Algorithms');
  const [topics, setTopics] = useState('Normalization, B+ Trees, Dynamic Programming on Trees, Graph Algorithms');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [dailyHours, setDailyHours] = useState('4');
  const [prepLevel, setPrepLevel] = useState<AiLearningLevel>(preferences.learningLevel);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExamPrepOutput | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (pendingReopenData?.toolId === 'exam-prep') {
      const p = pendingReopenData.payload || {};
      if (p.examName) setCustomExamName(p.examName);
      if (p.subject) setSubject(p.subject);
      if (p.result) setResult(p.result);
      clearPendingReopenData();
    }
  }, [pendingReopenData]);

  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSaved(false);
    const fullExam = `${examType}${customExamName.trim() ? ` - ${customExamName.trim()}` : ''}`;
    try {
      const data = await runStructuredAiTool<ExamPrepOutput>('exam-prep', {
        examName: fullExam,
        subject: subject.trim(),
        topics: topics.trim(),
        examDate,
        dailyHours: `${dailyHours} hours/day`,
        prepLevel,
        language: preferences.language,
      });
      setResult(data);
      addHistoryEntry({
        category: 'Study Plans',
        toolId: 'exam-prep',
        title: `Exam Prep: ${fullExam}`,
        subtitle: `${subject} · Target ${examDate}`,
        payload: { examName: customExamName, subject, result: data },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to generate exam preparation roadmap.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AiStatusBanner compact={!error} errorOverride={error} />

      <form
        onSubmit={generateRoadmap}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              AI Exam Preparation Assistant
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily targets, weekly study timetable, revision milestones, and practice priorities for Indian & university exams.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Category
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            >
              {EXAM_PRESETS.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Name / Paper
            </label>
            <input
              type="text"
              required
              value={customExamName}
              onChange={(e) => setCustomExamName(e.target.value)}
              placeholder="e.g. JEE Main Session 2, Class 12 Physics Board, Sem 6 Mid-Sem"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject(s)
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Date
            </label>
            <input
              type="date"
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Hours
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prep Level
              </label>
              <select
                value={prepLevel}
                onChange={(e) => setPrepLevel(e.target.value as AiLearningLevel)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Syllabus / Topics to Cover
            </label>
            <textarea
              rows={2}
              required
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            AI distinguishes general syllabus scope from study priority suggestions—never guarantees exam questions.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Building Prep Plan...' : 'Build Exam Roadmap'}</span>
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          {/* Integrity & Syllabus Distinction Notice */}
          <div className="rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-orange-950 dark:text-orange-200">
                  Official Syllabus vs. AI Recommendations
                </div>
                <p className="text-orange-900 dark:text-orange-300 leading-relaxed">
                  {result.officialSyllabusBoundaryNote}
                </p>
                <p className="font-semibold text-orange-800 dark:text-orange-200">
                  Academic Disclaimer: {result.disclaimer}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Personalized Preparation Plan · {customExamName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  saveItem({
                    collection: 'Study Plans',
                    title: `Exam Prep: ${customExamName}`,
                    summary: `${subject} · Exam ${examDate}`,
                    toolId: 'exam-prep',
                    data: { examName: customExamName, subject, result },
                  });
                  setSaved(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {saved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-orange-500" />}
                <span>{saved ? 'Saved Plan' : 'Save Roadmap'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Weekly Timetable */}
              <div className="lg:col-span-7 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Weekly Study Timetable</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 font-bold">
                      <tr>
                        <th className="px-3.5 py-2.5">Day</th>
                        <th className="px-3.5 py-2.5">Focus Areas</th>
                        <th className="px-3.5 py-2.5">Target Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {result.weeklyTimetable.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {row.day}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300">
                            {row.focus}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-blue-600 whitespace-nowrap">
                            {row.hours}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Daily Study Targets
                  </h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    {result.dailyTargets.map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Topics, Revision, Practice */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Recommended High-Yield Topics (AI Guidance)</span>
                  </h4>
                  <ul className="list-disc ml-4 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {result.importantTopics.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                    Revision Schedule
                  </h4>
                  <ul className="list-disc ml-4 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {result.revisionSchedule.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">
                    Practice Recommendations
                  </h4>
                  <ul className="list-disc ml-4 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {result.practiceRecommendations.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
