import React from 'react';
import {
  Play,
  BookOpen,
  Clock,
  CheckCircle2,
  TrendingUp,
  Target,
  FileText,
  BookMarked,
  ScrollText,
  HelpCircle,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  Plus,
  Calendar,
} from 'lucide-react';
import { useStudyHub } from '../../context/StudyHubContext';
import { useLanguage } from '../../context/LanguageContext';
import { STUDY_HUB_IMAGES } from '../../data/studyHubData';

interface StudyHubDashboardProps {
  onOpenAi?: (prompt?: string) => void;
}

export const StudyHubDashboard: React.FC<StudyHubDashboardProps> = ({ onOpenAi }) => {
  const {
    state,
    setActiveTab,
    setLibraryInitialCategory,
    openSubjectChapterTopic,
    toggleReminderComplete,
    logStudyMinutes,
  } = useStudyHub();
  const { language } = useLanguage();

  // Compute subject & chapter metrics
  const allChapters = state.subjects.flatMap((s) =>
    s.chapters.map((c) => ({ subject: s, chapter: c }))
  );
  const totalChapters = allChapters.length;
  const completedChapters = allChapters.filter((item) => item.chapter.completed).length;

  const allTopics = allChapters.flatMap((item) =>
    item.chapter.topics.map((t) => ({ ...item, topic: t }))
  );
  const completedTopics = allTopics.filter((t) => t.topic.completed).length;
  const overallProgress =
    allTopics.length > 0 ? Math.round((completedTopics / allTopics.length) * 100) : 0;

  const totalStudyMinutesWeek = state.weeklyLogs.reduce((acc, d) => acc + d.minutes, 0);
  const totalStudyHoursLabel = (totalStudyMinutesWeek / 60).toFixed(1);
  const todayMinutes = state.weeklyLogs[state.weeklyLogs.length - 1]?.minutes || 0;
  const dailyProgressPct = Math.min(
    100,
    Math.round((todayMinutes / Math.max(1, state.dailyGoalMinutes)) * 100)
  );

  // Active reading position
  const activeSubject =
    state.subjects.find((s) => s.id === state.activeReadingPosition.subjectId) ||
    state.subjects[0];
  const activeChapter =
    activeSubject?.chapters.find((c) => c.id === state.activeReadingPosition.chapterId) ||
    activeSubject?.chapters[0];
  const activeTopic =
    activeChapter?.topics.find((t) => t.id === state.activeReadingPosition.topicId) ||
    activeChapter?.topics[0];

  const activeChapterCompletedTopics =
    activeChapter?.topics.filter((t) => t.completed).length || 0;
  const activeChapterPct =
    activeChapter && activeChapter.topics.length > 0
      ? Math.round((activeChapterCompletedTopics / activeChapter.topics.length) * 100)
      : 0;

  // Pending chapters & upcoming reminders
  const pendingChapters = allChapters.filter((x) => !x.chapter.completed).slice(0, 3);
  const activeReminders = state.reminders.filter((r) => !r.completed).slice(0, 3);
  const recentSubjects = [...state.subjects]
    .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
    .slice(0, 3);

  const maxWeeklyMinutes = Math.max(180, ...state.weeklyLogs.map((l) => l.minutes));

  const resourceShortcuts = [
    {
      title: 'Notes',
      sub: `${state.notes.length} Personal + Shared`,
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      action: () => setActiveTab('notes'),
    },
    {
      title: 'Reference Books',
      sub: 'Curated Textbook Guides',
      icon: <BookMarked className="w-5 h-5 text-orange-500" />,
      action: () => {
        setLibraryInitialCategory('Reference Books');
        setActiveTab('library');
      },
    },
    {
      title: 'PDFs & Sheets',
      sub: `${state.materials.length} Verified Resources`,
      icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
      action: () => {
        setLibraryInitialCategory('PDF Notes');
        setActiveTab('library');
      },
    },
    {
      title: 'Previous Year Papers',
      sub: `${state.papers.length} Archive Sets`,
      icon: <ScrollText className="w-5 h-5 text-emerald-600" />,
      action: () => setActiveTab('pyqs'),
    },
    {
      title: 'Question Bank',
      sub: `${state.questions.length} Multi-format Qs`,
      icon: <HelpCircle className="w-5 h-5 text-blue-600" />,
      action: () => setActiveTab('qbank'),
    },
    {
      title: 'Practice Tests',
      sub: 'Timed & Custom Quizzes',
      icon: <ClipboardCheck className="w-5 h-5 text-orange-500" />,
      action: () => setActiveTab('tests'),
    },
  ];

  const popularMaterials = [...state.materials]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 3);

  const importantTopics = allTopics.filter((item) => !item.topic.completed).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* SECTION A: CONTINUE LEARNING */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{language === 'hi' ? 'पढ़ाई जारी रखें (Continue Learning)' : 'A · Continue Learning'}</span>
              </div>

              {activeSubject && activeChapter ? (
                <>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {activeSubject.code}
                    </span>
                    <span>·</span>
                    <span>{activeSubject.name}</span>
                    <span>·</span>
                    <span>{activeSubject.semesterOrClass}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1.5 tracking-tight">
                    Chapter {activeChapter.number}: {activeChapter.title}
                  </h2>

                  {activeTopic && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2">
                      Last reading position:{' '}
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {activeTopic.title}
                      </span>{' '}
                      <span className="text-slate-400">({activeTopic.estimatedMinutes} min read)</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500 mt-2">Select a subject to start studying.</p>
              )}
            </div>

            {activeSubject && activeChapter && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Chapter Progress ({activeChapterCompletedTopics}/{activeChapter.topics.length} topics)
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {activeChapterPct}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${activeChapterPct}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={() =>
                      openSubjectChapterTopic(activeSubject.id, activeChapter.id, activeTopic?.id)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Continue Learning</span>
                  </button>

                  {onOpenAi && (
                    <button
                      onClick={() =>
                        onOpenAi(
                          `Explain "${activeTopic?.title || activeChapter.title}" from ${activeSubject.name} with key exam takeaways`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                      <span>Ask KAMPUS AI</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 relative min-h-[200px] lg:min-h-full bg-slate-100 dark:bg-slate-800">
            <img
              src={activeSubject?.imageUrl || STUDY_HUB_IMAGES.deskHero}
              alt={activeSubject?.name || 'Study Hub Desk'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover max-h-64 lg:max-h-none"
            />
            <div className="p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-slate-800 lg:absolute lg:bottom-3 lg:left-3 lg:right-3 lg:rounded-xl">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Recently Opened Subjects
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {recentSubjects.map((subj) => (
                  <button
                    key={subj.id}
                    onClick={() => openSubjectChapterTopic(subj.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200/80 dark:border-slate-700 text-left shrink-0 cursor-pointer transition-colors"
                  >
                    <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {subj.code}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{subj.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B & C: MY LEARNING + TODAY'S STUDY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* B. MY LEARNING */}
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                B · My Learning
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {language === 'hi' ? 'मेरी शैक्षणिक प्रगति' : 'Academic Overview & Weekly Activity'}
              </h3>
            </div>
            <button
              onClick={() => logStudyMinutes(30)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log +30m Study</span>
            </button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Enrolled Subjects
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {state.subjects.length}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Completed Chapters
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {completedChapters}
                <span className="text-xs font-semibold text-slate-400">/{totalChapters}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Weekly Hours
              </div>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
                {totalStudyHoursLabel}h
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Syllabus Progress
              </div>
              <div className="text-2xl font-extrabold text-orange-500 mt-1 tabular-nums">
                {overallProgress}%
              </div>
            </div>
          </div>

          {/* Weekly Learning Activity Bars */}
          <div>
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Weekly Learning Activity (Minutes / Day)
              </span>
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Full Analytics →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2 items-end h-28 pt-2">
              {state.weeklyLogs.map((log) => {
                const heightPct = Math.max(10, Math.round((log.minutes / maxWeeklyMinutes) * 100));
                const isToday = log.dayLabel === 'Today';
                return (
                  <div key={log.dayLabel} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {log.minutes}m
                    </span>
                    <div className="w-full max-w-[32px] flex-1 flex items-end bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isToday ? 'bg-orange-500' : 'bg-blue-600/85'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        isToday ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {log.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* C. TODAY'S STUDY */}
        <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-500">
                C · Today&apos;s Study
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                Daily Targets & Pending Queue
              </h3>
            </div>
            <Target className="w-5 h-5 text-orange-500" />
          </div>

          {/* Daily Progress Indicator */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Daily Study Goal
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {todayMinutes} / {state.dailyGoalMinutes} min ({dailyProgressPct}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${dailyProgressPct}%` }}
              />
            </div>
          </div>

          {/* Pending Chapters */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Pending Chapters
            </div>
            <div className="space-y-1.5">
              {pendingChapters.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-700 dark:text-emerald-300">
                  All enrolled chapters completed! Add a new subject or start a practice test.
                </div>
              ) : (
                pendingChapters.map(({ subject, chapter }) => (
                  <button
                    key={chapter.id}
                    onClick={() => openSubjectChapterTopic(subject.id, chapter.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {subject.code} · Ch {chapter.number}: {chapter.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {chapter.topics.filter((t) => !t.completed).length} topics remaining
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Today's Targets / Upcoming Tests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Upcoming Study Reminders & Tests
              </span>
              <button
                onClick={() => setActiveTab('reminders')}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>
            <div className="space-y-1.5">
              {activeReminders.length === 0 ? (
                <p className="text-xs text-slate-400">No active reminders today.</p>
              ) : (
                activeReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800"
                  >
                    <button
                      onClick={() => toggleReminderComplete(rem.id)}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                      title="Mark completed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {rem.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 text-orange-500" />
                        <span>{rem.dueDateTime}</span>
                        <span>·</span>
                        <span>{rem.type}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* SECTION D: EXPLORE STUDY RESOURCES */}
      <section className="space-y-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            D · Explore Study Resources
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {language === 'hi' ? 'अध्ययन संसाधन एक्सप्लोर करें' : 'Jump Directly to Any Learning Tool'}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {resourceShortcuts.map((item) => (
            <button
              key={item.title}
              onClick={item.action}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-left transition-all shadow-2xs group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</div>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION E: RECOMMENDED FOR YOU */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-500">
              E · Recommended For You
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              Suggested Chapters, High-Yield Topics & Popular Materials
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Suggested Chapters & Important Topics */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Suggested Next Topics
            </div>
            {importantTopics.map(({ subject, chapter, topic }) => (
              <button
                key={topic.id}
                onClick={() => openSubjectChapterTopic(subject.id, chapter.id, topic.id)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    {subject.code} · Ch {chapter.number}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                    {topic.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {topic.summary}
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums">
                  {topic.estimatedMinutes}m
                </span>
              </button>
            ))}
          </div>

          {/* Popular & Recent Materials */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Popular & Recently Uploaded Study Materials
            </div>
            {popularMaterials.map((mat) => (
              <button
                key={mat.id}
                onClick={() => {
                  setLibraryInitialCategory(mat.category);
                  setActiveTab('library');
                }}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                    {mat.category} · {mat.fileType} · {mat.fileSize}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                    {mat.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {mat.subjectName} · {mat.downloads} downloads
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
