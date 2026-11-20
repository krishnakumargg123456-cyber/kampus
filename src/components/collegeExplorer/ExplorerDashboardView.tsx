import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BellPlus,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  GitCompare,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollegeExplorer } from '../../context/CollegeExplorerContext';
import {
  ALL_COLLEGE_TYPES,
  formatExplorerDate,
  resolveCollegePhoto,
} from '../../data/collegeExplorerData';
import type { CollegeRecord, CollegeType } from '../../types/collegeExplorer';

interface ExplorerDashboardViewProps {
  onOpenCollegeDetail: (collegeId: string) => void;
  onNavigateExplore: (opts?: { query?: string; state?: string; city?: string; type?: CollegeType }) => void;
  onNavigateTab: (
    tab: 'explore' | 'courses' | 'compare' | 'admissions' | 'scholarships' | 'shortlist'
  ) => void;
  onOpenAi: (presetPrompt?: string) => void;
}

export const ExplorerDashboardView: React.FC<ExplorerDashboardViewProps> = ({
  onOpenCollegeDetail,
  onNavigateExplore,
  onNavigateTab,
  onOpenAi,
}) => {
  const { profile } = useAuth();
  const {
    colleges,
    courses,
    admissionUpdates,
    recentlyViewedIds,
    savedColleges,
    compareIds,
    admissions,
    crossModule,
    toggleCompareCollege,
    saveOrUpdateShortlist,
    scheduleDeadlineReminder,
  } = useCollegeExplorer();

  const [heroSearch, setHeroSearch] = useState('');

  const featuredColleges = useMemo(
    () => colleges.filter((c) => c.featured).slice(0, 4),
    [colleges]
  );

  const recentlyViewedColleges = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => colleges.find((c) => c.id === id))
        .filter((c): c is CollegeRecord => Boolean(c))
        .slice(0, 4),
    [recentlyViewedIds, colleges]
  );

  const recommendedColleges = useMemo(() => {
    const terms = [
      profile.course || '',
      ...(profile.interests || []),
      ...(crossModule.careerTargetRoles || []),
    ]
      .join(' ')
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length >= 3);

    if (terms.length === 0) {
      return colleges.slice(0, 3);
    }

    const scored = colleges.map((c) => {
      const hay = `${c.name} ${c.primaryCategory} ${c.overview} ${c.courses
        .map((cr) => `${cr.name} ${cr.stream}`)
        .join(' ')}`.toLowerCase();
      let score = c.featured ? 1 : 0;
      for (const term of terms) {
        if (hay.includes(term)) score += 3;
      }
      return { college: c, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.college);
  }, [colleges, profile.course, profile.interests, crossModule.careerTargetRoles]);

  const locationSummary = useMemo(() => {
    const counts = new Map<string, { city: string; state: string; count: number }>();
    for (const c of colleges) {
      const key = `${c.city}|${c.state}`;
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { city: c.city, state: c.state, count: 1 });
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }, [colleges]);

  const categoryCounts = useMemo(() => {
    return ALL_COLLEGE_TYPES.map((type) => ({
      type,
      count: colleges.filter((c) => c.collegeTypes.includes(type) || c.primaryCategory === type)
        .length,
    }));
  }, [colleges]);

  const upcomingDeadlines = useMemo(() => {
    return colleges
      .filter((c) => Boolean(c.nextDeadlineISO))
      .sort((a, b) => String(a.nextDeadlineISO).localeCompare(String(b.nextDeadlineISO)))
      .slice(0, 4);
  }, [colleges]);

  const isSaved = (id: string) => savedColleges.some((s) => s.collegeId === id);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateExplore({ query: heroSearch.trim() });
  };

  return (
    <div className="space-y-8">
      {/* Editorial Hero & Omni-Search */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            KAMPUS College Discovery · Admission Research Desk
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-2">
            Find the Right College for Your Future
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Compare degree programs, tuition structures, admission portals, and scholarship
            opportunities across institutions. Records clearly state data provenance and flag
            unpublished items honestly.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder="Search by college name, course (B.Tech, MBBS, MBA...), city, state, or university..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600/30"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>Explore Colleges</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpenAi()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Ask KAMPUS AI</span>
          </button>
        </form>

        {/* Functional Shortcuts Row */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('shortlist')}
            className="text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Saved Shortlist</span>
              <BookmarkCheck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {savedColleges.length} Saved
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('compare')}
            className="text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Compare Tray</span>
              <GitCompare className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {compareIds.length} / 4 Selected
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('admissions')}
            className="text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>My Admissions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {admissions.length} Tracked
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('courses')}
            className="text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Course Directory</span>
              <GraduationCap className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {courses.length} Programs
            </p>
          </button>
        </div>
      </section>

      {/* Featured Colleges */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Featured Institutions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Curated catalog highlights across engineering, medicine, management, and liberal studies
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateExplore()}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Browse all {colleges.length} colleges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredColleges.map((col) => {
            const saved = isSaved(col.id);
            const compared = compareIds.includes(col.id);
            return (
              <article
                key={col.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <img
                      src={resolveCollegePhoto(col.photoKey)}
                      alt={col.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {col.primaryCategory}
                      </span>
                      <span className="tabular-nums">{col.dataVerificationStatus}</span>
                    </div>
                    <h4
                      onClick={() => onOpenCollegeDetail(col.id)}
                      className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      {col.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {col.city}, {col.state} · Est. {col.establishmentYear}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                      {col.overview}
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                        {col.feeInfo.tuitionRangeLabel}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400 font-semibold">
                        Admission: {col.admissionStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenCollegeDetail(col.id)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Full Profile
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCompareCollege(col.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        compared
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {compared ? 'Comparing' : 'Compare'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        saveOrUpdateShortlist({
                          collegeId: col.id,
                          action: saved ? 'remove' : 'save',
                          collectionName: 'Target List',
                        })
                      }
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1 transition-colors ${
                        saved
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {saved ? (
                        <BookmarkCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                      <span>{saved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Recommended & Recently Viewed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recommended for Your Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Matched using your KAMPUS course ({profile.course || 'General'}) and Career interests
            </p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recommendedColleges.map((col) => (
              <div key={col.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenCollegeDetail(col.id)}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 text-left truncate block max-w-full"
                  >
                    {col.name}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {col.city}, {col.state} · {col.courses.length} listed program(s) · {col.admissionStatus}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenCollegeDetail(col.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white shrink-0 transition-colors"
                >
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recently Viewed Colleges
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quickly resume researching colleges you opened earlier
              </p>
            </div>
          </div>

          {recentlyViewedColleges.length === 0 ? (
            <div className="py-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No colleges viewed yet in this session. Open any college profile to record history.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentlyViewedColleges.map((col) => (
                <div key={col.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenCollegeDetail(col.id)}
                      className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 text-left truncate block max-w-full"
                    >
                      {col.name}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {col.primaryCategory} · {col.city}, {col.state}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCompareCollege(col.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                  >
                    {compareIds.includes(col.id) ? 'Comparing' : 'Compare'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Popular Courses & Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Popular Courses & Tracks
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Explore eligibility, required subjects, entrance exams, and offering colleges
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('courses')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              All Courses
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.slice(0, 6).map((crs) => (
              <button
                key={crs.id}
                type="button"
                onClick={() => onNavigateExplore({ query: crs.degreeShort })}
                className="text-left p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {crs.degreeType}
                  </span>
                  <span className="tabular-nums">{crs.duration}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {crs.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  Exams: {crs.entranceExams.slice(0, 2).join(', ')}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Browse by Location
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filter institutions by city or state
            </p>
          </div>
          <div className="space-y-2">
            {locationSummary.map((loc) => (
              <button
                key={`${loc.city}-${loc.state}`}
                type="button"
                onClick={() => onNavigateExplore({ state: loc.state, city: loc.city })}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 border border-slate-200/70 dark:border-slate-700 text-xs transition-colors"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {loc.city}, {loc.state}
                </span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                  {loc.count} {loc.count === 1 ? 'college' : 'colleges'}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Browse All 13 Categories */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Browse by Institution Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              All 13 supported institution types across Universities, Autonomous, Medical, Law, Pharmacy, Nursing, and Polytechnics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {categoryCounts.map(({ type, count }) => (
            <button
              key={type}
              type="button"
              onClick={() => onNavigateExplore({ type })}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700 text-left transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{type}</span>
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums ml-2">
                {count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Admission Updates & Deadline Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Admission Updates & Notices
          </h3>
          <div className="space-y-3">
            {admissionUpdates.map((upd) => (
              <div
                key={upd.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {upd.sourceLabel}
                  </span>
                  <span className="tabular-nums">{formatExplorerDate(upd.publishedISO)}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {upd.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {upd.summary}
                </p>
                {upd.collegeId && (
                  <button
                    type="button"
                    onClick={() => onOpenCollegeDetail(upd.collegeId!)}
                    className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Open Institution Details
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Application Deadline Reminders
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sync dates directly into KAMPUS Planner and Notification Center
              </p>
            </div>
            <CalendarClock className="w-4 h-4 text-orange-500" />
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.map((col) => (
              <div
                key={col.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {col.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                    Target Date: {formatExplorerDate(col.nextDeadlineISO)} · {col.admissionStatus}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    scheduleDeadlineReminder({
                      title: 'College Application Deadline Review',
                      collegeName: col.name,
                      dateISO: col.nextDeadlineISO || new Date().toISOString().slice(0, 10),
                      notes: `Verify official portal (${col.admissionStatus})`,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 shrink-0"
                >
                  <BellPlus className="w-3.5 h-3.5 text-orange-500" />
                  <span>Remind Me</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
