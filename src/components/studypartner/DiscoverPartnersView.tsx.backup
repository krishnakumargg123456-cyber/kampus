import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  EyeOff,
  Filter,
  RotateCcw,
  Send,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useStudyPartner } from '../../context/StudyPartnerContext';
import {
  LearningStyle,
  SmartMatchSection,
  StudentPeerProfile,
  StudyLevel,
  StudyMode,
  StudyPartnerLanguage,
  StudyTimeSlot,
} from '../../types/studyPartner';

interface DiscoverPartnersViewProps {
  searchQuery: string;
}

const TIME_FILTERS: Array<StudyTimeSlot | 'All'> = [
  'All',
  'Morning Study',
  'Afternoon Study',
  'Evening Study',
  'Night Study',
];

const MODE_FILTERS: Array<StudyMode | 'All'> = [
  'All',
  'Online Study',
  'Offline Study',
  'Individual Focus',
  'Group Learning',
];

const STYLE_FILTERS: Array<LearningStyle | 'All'> = [
  'All',
  'Concept-Based Learning',
  'Practice & Questions',
  'Revision',
  'Discussion',
  'Doubt Solving',
  'Exam Preparation',
];

const LANGUAGE_FILTERS: Array<StudyPartnerLanguage | 'All'> = [
  'All',
  'English',
  'Hindi',
  'Bilingual (EN/HI)',
];

const LEVEL_FILTERS: Array<StudyLevel | 'All'> = [
  'All',
  'School',
  'Class 11–12',
  'Undergraduate',
  'Postgraduate',
  'Competitive Exams',
];

export const DiscoverPartnersView: React.FC<DiscoverPartnersViewProps> = ({
  searchQuery,
}) => {
  const {
    state,
    getMatchForPeer,
    getSortedDiscoveryPeers,
    canSendRequestToPeer,
    sendStudyRequest,
    toggleSavePeer,
    ignorePeerRecommendation,
    restoreIgnoredPeers,
    setSelectedPeerId,
  } = useStudyPartner();

  const [matchSection, setMatchSection] =
    useState<SmartMatchSection>('recommended');
  const [showFilters, setShowFilters] = useState(true);
  const [streamFilter, setStreamFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const [examFilter, setExamFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState<StudyTimeSlot | 'All'>('All');
  const [modeFilter, setModeFilter] = useState<StudyMode | 'All'>('All');
  const [styleFilter, setStyleFilter] = useState<LearningStyle | 'All'>('All');
  const [langFilter, setLangFilter] = useState<StudyPartnerLanguage | 'All'>(
    'All'
  );
  const [levelFilter, setLevelFilter] = useState<StudyLevel | 'All'>('All');
  const [savedOnly, setSavedOnly] = useState(false);

  const [requestTarget, setRequestTarget] = useState<StudentPeerProfile | null>(
    null
  );
  const [requestMsg, setRequestMsg] = useState('');

  const streams = useMemo(
    () => ['All', ...Array.from(new Set(state.peers.map((p) => p.stream)))],
    [state.peers]
  );
  const semesters = useMemo(
    () => ['All', ...Array.from(new Set(state.peers.map((p) => p.semester)))],
    [state.peers]
  );
  const exams = useMemo(
    () => [
      'All',
      ...Array.from(new Set(state.peers.map((p) => p.examPreparation))),
    ],
    [state.peers]
  );

  const sortedPeers = getSortedDiscoveryPeers(matchSection);

  const filteredPeers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedPeers.filter((p) => {
      if (matchSection === 'similar-goals') {
        const match = getMatchForPeer(p);
        const hasGoalSignal =
          match.reasons.some(
            (r) => r.includes('preparing for') || r.includes('Aligned study goal')
          ) || p.examPreparation === state.preferences.examPreparation;
        if (!hasGoalSignal && q === '') {
          // keep ordered fallback if exact goal filter yields few, only prioritize
        }
      }
      if (streamFilter !== 'All' && p.stream !== streamFilter) return false;
      if (semesterFilter !== 'All' && p.semester !== semesterFilter)
        return false;
      if (examFilter !== 'All' && p.examPreparation !== examFilter) return false;
      if (timeFilter !== 'All' && !p.preferredTimes.includes(timeFilter))
        return false;
      if (modeFilter !== 'All' && !p.studyModes.includes(modeFilter))
        return false;
      if (styleFilter !== 'All' && !p.learningStyles.includes(styleFilter))
        return false;
      if (langFilter !== 'All' && p.preferredLanguage !== langFilter)
        return false;
      if (levelFilter !== 'All' && p.studyLevel !== levelFilter) return false;
      if (savedOnly && !state.savedPeerIds.includes(p.id)) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.course.toLowerCase().includes(q) ||
        p.stream.toLowerCase().includes(q) ||
        p.college.toLowerCase().includes(q) ||
        p.university.toLowerCase().includes(q) ||
        p.examPreparation.toLowerCase().includes(q) ||
        p.subjects.some((s) => s.toLowerCase().includes(q)) ||
        p.learningGoals.some((g) => g.toLowerCase().includes(q))
      );
    });
  }, [
    sortedPeers,
    matchSection,
    streamFilter,
    semesterFilter,
    examFilter,
    timeFilter,
    modeFilter,
    styleFilter,
    langFilter,
    levelFilter,
    savedOnly,
    state.savedPeerIds,
    searchQuery,
  ]);

  const resetAllFilters = () => {
    setStreamFilter('All');
    setSemesterFilter('All');
    setExamFilter('All');
    setTimeFilter('All');
    setModeFilter('All');
    setStyleFilter('All');
    setLangFilter('All');
    setLevelFilter('All');
    setSavedOnly(false);
  };

  const openRequestDialog = (peer: StudentPeerProfile) => {
    const match = getMatchForPeer(peer);
    setRequestTarget(peer);
    setRequestMsg(
      `Hi ${peer.name.split(' ')[0]}, we both study ${match.commonSubjects[0] || peer.subjects[0]}. Would you like to partner up for weekly study sprints?`
    );
  };

  const submitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTarget) return;
    sendStudyRequest(requestTarget.id, requestMsg);
    setRequestTarget(null);
    setRequestMsg('');
  };

  const sections: Array<{ id: SmartMatchSection; label: string }> = [
    { id: 'recommended', label: 'Recommended For You' },
    { id: 'best-subjects', label: 'Best Subject Matches' },
    { id: 'similar-goals', label: 'Similar Study Goals' },
    { id: 'recently-active', label: 'Recently Active Students' },
  ];

  return (
    <div className="space-y-5">
      {/* Smart Match Section Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setMatchSection(sec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                matchSection === sec.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {state.ignoredPeerIds.length > 0 && (
            <button
              type="button"
              onClick={restoreIgnoredPeers}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Hidden ({state.ignoredPeerIds.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Facet Academic & Study Preference Filters */}
      {showFilters && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Stream / Discipline
              </label>
              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                {streams.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Streams' : s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Semester / Class
              </label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Semesters' : s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Exam Preparation
              </label>
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                {exams.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex === 'All' ? 'All Exam Tracks' : ex}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Study Level
              </label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as StudyLevel | 'All')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                {LEVEL_FILTERS.map((l) => (
                  <option key={l} value={l}>
                    {l === 'All' ? 'All Levels' : l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Preferred Study Time
              </label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as StudyTimeSlot | 'All')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                {TIME_FILTERS.map((t) => (
                  <option key={t} value={t}>
                    {t === 'All' ? 'Any Study Time' : t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Study Mode
              </label>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as StudyMode | 'All')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                {MODE_FILTERS.map((m) => (
                  <option key={m} value={m}>
                    {m === 'All' ? 'Any Study Mode' : m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Learning Style
              </label>
              <select
                value={styleFilter}
                onChange={(e) =>
                  setStyleFilter(e.target.value as LearningStyle | 'All')
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                {STYLE_FILTERS.map((st) => (
                  <option key={st} value={st}>
                    {st === 'All' ? 'All Learning Styles' : st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Preferred Language
              </label>
              <select
                value={langFilter}
                onChange={(e) =>
                  setLangFilter(e.target.value as StudyPartnerLanguage | 'All')
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              >
                {LANGUAGE_FILTERS.map((ln) => (
                  <option key={ln} value={ln}>
                    {ln === 'All' ? 'Any Language' : ln}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="inline-flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={savedOnly}
                onChange={(e) => setSavedOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Saved Profiles Only ({state.savedPeerIds.length})</span>
            </label>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 tabular-nums">
                Showing {filteredPeers.length} compatible students (Demo directory)
              </span>
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Results Grid */}
      {filteredPeers.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No study partners matched those exact filters
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Broaden your study time, stream, or subject filters to discover more peers preparing for related exams.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPeers.map((peer) => {
            const match = getMatchForPeer(peer);
            const perm = canSendRequestToPeer(peer);
            const isSaved = state.savedPeerIds.includes(peer.id);
            const isConnected = state.connectedPartnerIds.includes(peer.id);

            return (
              <article
                key={peer.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-3">
                  {/* Profile Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={peer.avatarUrl}
                        alt={peer.name}
                        referrerPolicy="no-referrer"
                        onClick={() => setSelectedPeerId(peer.id)}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <h3
                          onClick={() => setSelectedPeerId(peer.id)}
                          className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 truncate cursor-pointer"
                        >
                          {peer.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {peer.course} · {peer.semester}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {peer.college} · {peer.lastActiveLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleSavePeer(peer.id)}
                        title={isSaved ? 'Remove bookmark' : 'Save profile'}
                        className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                          isSaved
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600'
                        }`}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => ignorePeerRecommendation(peer.id)}
                        title="Hide recommendation"
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Calculated Compatibility Indicator (never random) */}
                  {match.hasEnoughData && match.score !== null && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 tabular-nums">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{match.score}% Rule-Based Match</span>
                        </span>
                        <span className="text-[11px] font-normal text-slate-400">
                          {peer.preferredLanguage}
                        </span>
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                        {match.reasons.slice(0, 2).map((reason, idx) => (
                          <li key={idx}>· {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {peer.intro}
                  </p>

                  {/* Quiet unboxed inline academic details */}
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Subjects:{' '}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {peer.subjects.join(' · ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Goals:{' '}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {peer.learningGoals[0]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Preferred Schedule: {peer.preferredTimes.join(', ')} ({peer.availability})
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPeerId(peer.id)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    View Profile
                  </button>

                  {isConnected ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPeerId(peer.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Connected</span>
                    </button>
                  ) : perm.allowed ? (
                    <button
                      type="button"
                      onClick={() => openRequestDialog(peer)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Send Study Request</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold cursor-not-allowed truncate"
                      title={perm.reason}
                    >
                      {perm.reason}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Personal Message Modal for Sending Study Request */}
      {requestTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Send Study Request to {requestTarget.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Demo directory · Recorded locally in your Study Requests
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestTarget(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Personal Note (Subjects, Goals & Schedule)
                </label>
                <textarea
                  rows={4}
                  required
                  value={requestMsg}
                  onChange={(e) => setRequestMsg(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
