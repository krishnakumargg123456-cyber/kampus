import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookOpen,
  Building2,
  Calendar,
  FileText,
  GraduationCap,
  Landmark,
  MapPin,
  PackageSearch,
  Pin,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useCampusPulse } from '../../context/CampusPulseContext';
import {
  formatPulseDateTime,
  formatPulseShortDate,
  getDaysRemainingLabel,
  getPulseCategoryLabel,
  priorityWeight,
} from '../../data/campusPulseData';
import type { CampusAnnouncement, PulseCategoryId } from '../../types/campusPulse';

export type PulseSectionTab =
  | 'home'
  | 'official'
  | 'alerts'
  | 'calendar'
  | 'departments'
  | 'facilities'
  | 'lost-found'
  | 'polls'
  | 'submissions'
  | 'saved'
  | 'search'
  | 'admin';

interface CampusPulseHomeViewProps {
  onNavigateTab: (tab: PulseSectionTab, filterHint?: { categoryId?: PulseCategoryId }) => void;
  onOpenNotice: (notice: CampusAnnouncement) => void;
}

type FeedFilter =
  | 'all'
  | 'official'
  | 'academics'
  | 'examinations'
  | 'campus-news'
  | 'facilities'
  | 'student-updates';

type FeedSort = 'latest' | 'important' | 'deadlines';

export const CampusPulseHomeView: React.FC<CampusPulseHomeViewProps> = ({
  onNavigateTab,
  onOpenNotice,
}) => {
  const {
    institutions,
    selectedInstitution,
    selectInstitution,
    departments,
    announcements,
    alerts,
    deadlines,
    savedNoticeIds,
    toggleSavedNotice,
    followedDepartmentIds,
    currentUserCourse,
    currentUserSemester,
    currentUserInterests,
  } = useCampusPulse();

  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [feedSort, setFeedSort] = useState<FeedSort>('latest');
  const [personalizedOnly, setPersonalizedOnly] = useState(false);

  const instId = selectedInstitution?.id || 'inst_iitb';

  const activeAlerts = useMemo(
    () =>
      alerts
        .filter((a) => a.institutionId === instId)
        .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority)),
    [alerts, instId]
  );

  const instAnnouncements = useMemo(
    () =>
      announcements.filter(
        (a) => a.institutionId === instId && a.status !== 'Archived'
      ),
    [announcements, instId]
  );

  // Strict personalization: only match actual student profile signals (course, semester, followed depts, interests)
  const personalizedItems = useMemo(() => {
    const courseLower = currentUserCourse.toLowerCase();
    const semLower = currentUserSemester.toLowerCase();
    const interestTokens = currentUserInterests.map((i) => i.toLowerCase());

    return instAnnouncements.filter((a) => {
      if (followedDepartmentIds.includes(a.departmentId)) return true;
      if (a.targetSemester && semLower && a.targetSemester.toLowerCase() === semLower)
        return true;
      if (
        a.targetCourse &&
        courseLower &&
        (courseLower.includes(a.targetCourse.toLowerCase()) ||
          a.targetCourse.toLowerCase().includes(courseLower))
      )
        return true;
      if (
        interestTokens.some(
          (tok) =>
            a.title.toLowerCase().includes(tok) || a.summary.toLowerCase().includes(tok)
        )
      )
        return true;
      return false;
    });
  }, [
    instAnnouncements,
    followedDepartmentIds,
    currentUserCourse,
    currentUserSemester,
    currentUserInterests,
  ]);

  const filteredFeed = useMemo(() => {
    let base = personalizedOnly ? personalizedItems : instAnnouncements;

    if (feedFilter === 'official') {
      base = base.filter((a) => a.isOfficial);
    } else if (feedFilter === 'academics') {
      base = base.filter(
        (a) =>
          a.categoryId === 'academic-updates' || a.categoryId === 'admission-registration'
      );
    } else if (feedFilter === 'examinations') {
      base = base.filter((a) => a.categoryId === 'examination-updates');
    } else if (feedFilter === 'campus-news') {
      base = base.filter((a) => a.categoryId === 'campus-news');
    } else if (feedFilter === 'facilities') {
      base = base.filter((a) => a.categoryId === 'facility-updates');
    } else if (feedFilter === 'student-updates') {
      base = base.filter((a) => !a.isOfficial || a.categoryId === 'student-information');
    }

    return [...base].sort((a, b) => {
      if (feedSort === 'important') {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        const pw = priorityWeight(b.priority) - priorityWeight(a.priority);
        if (pw !== 0) return pw;
      }
      if (feedSort === 'deadlines') {
        if (a.deadlineAt && !b.deadlineAt) return -1;
        if (!a.deadlineAt && b.deadlineAt) return 1;
        if (a.deadlineAt && b.deadlineAt) {
          return new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime();
        }
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [instAnnouncements, personalizedItems, personalizedOnly, feedFilter, feedSort]);

  const upcomingDeadlines = useMemo(
    () =>
      deadlines
        .filter((d) => d.institutionId === instId)
        .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
        .slice(0, 5),
    [deadlines, instId]
  );

  const deptCount = departments.filter((d) => d.institutionId === instId).length;

  return (
    <div className="space-y-6">
      {/* Campus Identity Section */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            {/* Institutional Monogram Seal */}
            <div className="w-14 h-14 rounded-2xl bg-[#172554] text-white flex items-center justify-center shrink-0 font-bold text-lg tracking-tight">
              {selectedInstitution?.shortName
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .slice(0, 3) || 'KMP'}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-[#2563EB]">
                  {selectedInstitution?.academicSession || 'Current Academic Session'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedInstitution?.verificationStatus}</span>
                <span aria-hidden="true">·</span>
                <span>{deptCount} Active Departments</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-slate-100 mt-1">
                {selectedInstitution?.name}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedInstitution?.location}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedInstitution?.institutionType}</span>
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                {selectedInstitution?.verificationNote}
              </p>
            </div>
          </div>

          {/* Institution Selector */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <label
              htmlFor="campus-inst-select"
              className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Selected Institution
            </label>
            <select
              id="campus-inst-select"
              value={instId}
              onChange={(e) => selectInstitution(e.target.value)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Priority Campus Alerts Strip */}
      {activeAlerts.length > 0 && (
        <section className="rounded-2xl bg-[#172554] text-white p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
              <AlertTriangle className="w-4 h-4 text-[#F97316]" />
              <span>Priority Campus Alerts ({activeAlerts.length})</span>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs font-semibold text-blue-200 hover:text-white inline-flex items-center gap-1"
            >
              <span>View All Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAlerts.slice(0, 2).map((al) => (
              <div
                key={al.id}
                className="p-3.5 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-blue-200">
                    <span className="font-semibold text-[#F97316] uppercase">
                      {al.priority} · {al.alertType}
                    </span>
                    <span className="tabular-nums">{formatPulseShortDate(al.publishedAt)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{al.title}</h3>
                  <p className="text-xs text-blue-100/85 mt-1 line-clamp-2">{al.description}</p>
                </div>
                <div className="text-[11px] text-blue-200/80">
                  Source: {al.publishingSource}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Access Navigation Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Official Notices',
            sub: 'Circulars & policies',
            icon: ShieldCheck,
            action: () => onNavigateTab('official'),
          },
          {
            label: 'Academic Updates',
            sub: 'Classes & labs',
            icon: GraduationCap,
            action: () => {
              setFeedFilter('academics');
            },
          },
          {
            label: 'Examination Alerts',
            sub: 'Dates & admit cards',
            icon: AlertCircle,
            action: () => {
              setFeedFilter('examinations');
            },
          },
          {
            label: 'Campus News',
            sub: 'Department highlights',
            icon: BookOpen,
            action: () => {
              setFeedFilter('campus-news');
            },
          },
          {
            label: 'Lost & Found',
            sub: 'Report or recover',
            icon: PackageSearch,
            action: () => onNavigateTab('lost-found'),
          },
          {
            label: 'Campus Facilities',
            sub: 'Library, bus & hostels',
            icon: Building2,
            action: () => onNavigateTab('facilities'),
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] text-left transition-colors"
            >
              <Icon className="w-4 h-4 text-[#2563EB]" />
              <div className="text-xs font-bold text-[#172033] dark:text-slate-100 mt-2">
                {item.label}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {item.sub}
              </div>
            </button>
          );
        })}
      </section>

      {/* Main Content + Right Upcoming Deadlines Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Campus Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#172033] dark:text-slate-100">
                {personalizedOnly
                  ? `Personalized For ${currentUserCourse} (${currentUserSemester})`
                  : 'Campus Information Feed'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {personalizedOnly
                  ? 'Filtered strictly by your enrolled program, semester, and followed departments.'
                  : 'Chronological updates with clear distinction between official notices and student submissions.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPersonalizedOnly((p) => !p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  personalizedOnly
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                {personalizedOnly ? 'Showing Personalized' : 'For My Course & Dept'}
              </button>

              <select
                value={feedSort}
                onChange={(e) => setFeedSort(e.target.value as FeedSort)}
                aria-label="Sort campus feed"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                <option value="latest">Latest First</option>
                <option value="important">Most Important</option>
                <option value="deadlines">Upcoming Deadlines</option>
              </select>
            </div>
          </div>

          {/* Interactive Feed Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            {[
              { id: 'all', label: 'All' },
              { id: 'official', label: 'Official' },
              { id: 'academics', label: 'Academics' },
              { id: 'examinations', label: 'Examinations' },
              { id: 'campus-news', label: 'Campus News' },
              { id: 'facilities', label: 'Facilities' },
              { id: 'student-updates', label: 'Student Updates' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFeedFilter(tab.id as FeedFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  feedFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Feed Cards */}
          {filteredFeed.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No announcements match this filter right now.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try switching back to All updates or following more campus departments.
              </p>
              <button
                onClick={() => {
                  setFeedFilter('all');
                  setPersonalizedOnly(false);
                }}
                className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white"
              >
                Reset Feed Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeed.map((item) => {
                const isSaved = savedNoticeIds.includes(item.id);
                const isUrgent = item.priority === 'Critical' || item.status === 'Urgent';
                const deadlineLabel = getDaysRemainingLabel(item.deadlineAt);

                return (
                  <article
                    key={item.id}
                    className={`rounded-2xl p-5 border transition-colors ${
                      item.isOfficial && isUrgent
                        ? 'bg-[#F8FAFC] dark:bg-slate-900 border-blue-300 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Quiet Typographic Metadata Line (Zero Pill Sandwiches) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span
                          className={`font-semibold inline-flex items-center gap-1 ${
                            item.isOfficial
                              ? 'text-[#172554] dark:text-blue-300'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {item.isOfficial ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>{item.verificationLabel}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{getPulseCategoryLabel(item.categoryId)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.departmentName}</span>
                        {item.isPinned && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#2563EB] font-semibold inline-flex items-center gap-1">
                              <Pin className="w-3 h-3" />
                              Pinned
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 tabular-nums">
                        {isUrgent && (
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {item.status}
                          </span>
                        )}
                        <span>{formatPulseDateTime(item.publishedAt)}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-[#172033] dark:text-slate-100 mt-2 leading-snug">
                      <button
                        onClick={() => onOpenNotice(item)}
                        className="text-left hover:text-[#2563EB] transition-colors"
                      >
                        {item.title}
                      </button>
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400">
                        <span>By {item.publishingAuthority}</span>
                        {item.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium">
                            <FileText className="w-3.5 h-3.5" />
                            <span>
                              {item.attachments.length}{' '}
                              {item.attachments.length === 1 ? 'Document' : 'Documents'}
                            </span>
                          </span>
                        )}
                        {deadlineLabel && (
                          <span className="text-[#F97316] font-semibold tabular-nums">
                            {deadlineLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSavedNotice(item.id)}
                          aria-label={isSaved ? 'Remove bookmark' : 'Bookmark notice'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isSaved
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-[#2563EB]'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenNotice(item)}
                          className="px-3 py-1.5 rounded-lg font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1"
                        >
                          <span>Read More</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Contextual Deadlines & Actions Panel */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                  Upcoming Deadlines
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Full Calendar
              </button>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.map((dl) => (
                <div
                  key={dl.id}
                  className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#172554] dark:text-blue-300">
                      {dl.kind}
                    </span>
                    <span className="tabular-nums">
                      {formatPulseShortDate(dl.dateISO)}
                      {dl.timeLabel ? ` · ${dl.timeLabel}` : ''}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {dl.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span className="truncate">{dl.departmentName}</span>
                    <span
                      className={
                        dl.isConfirmedOfficial
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium shrink-0'
                          : 'text-[#F97316] font-medium shrink-0'
                      }
                    >
                      {dl.isConfirmedOfficial ? 'Confirmed' : 'Tentative'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Followed Departments Summary */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                Followed Departments
              </h3>
              <button
                onClick={() => onNavigateTab('departments')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Manage
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {departments
                .filter((d) => d.institutionId === instId && followedDepartmentIds.includes(d.id))
                .map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => onNavigateTab('departments')}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dept.name}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{dept.code}</span>
                  </button>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
