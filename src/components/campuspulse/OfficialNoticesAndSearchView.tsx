import React, { useMemo, useState } from 'react';
import {
  Archive,
  Bookmark,
  Calendar,
  Clock,
  FileText,
  Pin,
  Search,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { useCampusPulse } from '../../context/CampusPulseContext';
import {
  ALERT_PRIORITIES,
  formatPulseDateTime,
  formatPulseShortDate,
  getPulseCategoryLabel,
  PULSE_CATEGORIES,
} from '../../data/campusPulseData';
import type {
  AlertPriority,
  CampusAnnouncement,
  PulseCategoryId,
} from '../../types/campusPulse';

type OfficialCenterTab =
  | 'latest'
  | 'pinned'
  | 'important'
  | 'department'
  | 'examination'
  | 'administrative'
  | 'archived';

export const OfficialNoticesView: React.FC<{
  onOpenNotice: (notice: CampusAnnouncement) => void;
}> = ({ onOpenNotice }) => {
  const {
    selectedInstitution,
    announcements,
    departments,
    savedNoticeIds,
    toggleSavedNotice,
  } = useCampusPulse();

  const [subTab, setSubTab] = useState<OfficialCenterTab>('latest');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');

  const instId = selectedInstitution?.id || 'inst_iitb';
  const instDepts = departments.filter((d) => d.institutionId === instId);

  const officialList = useMemo(() => {
    // Strictly official announcements only in Official Notice Center
    let base = announcements.filter(
      (a) => a.institutionId === instId && a.isOfficial
    );

    if (subTab === 'archived') {
      base = base.filter((a) => a.status === 'Archived');
    } else {
      base = base.filter((a) => a.status !== 'Archived');
      if (subTab === 'pinned') {
        base = base.filter((a) => a.isPinned);
      } else if (subTab === 'important') {
        base = base.filter(
          (a) =>
            a.status === 'Important' ||
            a.status === 'Urgent' ||
            a.priority === 'Critical' ||
            a.priority === 'High'
        );
      } else if (subTab === 'department') {
        base = base.filter(
          (a) =>
            a.verificationLabel === 'Authorized Department Notice' ||
            a.categoryId === 'academic-updates'
        );
      } else if (subTab === 'examination') {
        base = base.filter((a) => a.categoryId === 'examination-updates');
      } else if (subTab === 'administrative') {
        base = base.filter(
          (a) =>
            a.categoryId === 'official-notices' ||
            a.categoryId === 'admission-registration'
        );
      }
    }

    if (selectedDeptId !== 'all') {
      base = base.filter((a) => a.departmentId === selectedDeptId);
    }

    return [...base].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [announcements, instId, subTab, selectedDeptId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Official Notice Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Authorized institutional circulars, examination directives, and departmental orders.
          </p>
        </div>

        <select
          value={selectedDeptId}
          onChange={(e) => setSelectedDeptId(e.target.value)}
          aria-label="Filter notices by department"
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
        >
          <option value="all">All Issuing Departments</option>
          {instDepts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
        {[
          { id: 'latest', label: 'Latest' },
          { id: 'pinned', label: 'Pinned' },
          { id: 'important', label: 'Important & Urgent' },
          { id: 'department', label: 'Department' },
          { id: 'examination', label: 'Examination' },
          { id: 'administrative', label: 'Administrative' },
          { id: 'archived', label: 'Archived' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as OfficialCenterTab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === t.id
                ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {officialList.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Archive className="w-6 h-6 text-slate-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No official notices in this view.
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch tabs or select All Issuing Departments to see active circulars.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {officialList.map((n) => {
            const isSaved = savedNoticeIds.includes(n.id);
            return (
              <div
                key={n.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#172554] dark:text-blue-300 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>{n.circularCode || 'Official Circular'}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{n.departmentName}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        n.status === 'Urgent'
                          ? 'text-red-600 dark:text-red-400 font-semibold'
                          : n.status === 'Important'
                            ? 'text-[#F97316] font-semibold'
                            : ''
                      }
                    >
                      {n.status}
                    </span>
                    {n.isPinned && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#2563EB] font-semibold inline-flex items-center gap-1">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenNotice(n)}
                    className="text-left text-base font-bold text-[#172033] dark:text-slate-100 hover:text-[#2563EB] transition-colors block"
                  >
                    {n.title}
                  </button>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {n.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1 tabular-nums">
                    <span>Authority: {n.publishingAuthority}</span>
                    <span>Published: {formatPulseDateTime(n.publishedAt)}</span>
                    {n.deadlineAt && (
                      <span className="text-[#F97316] font-semibold">
                        Deadline: {formatPulseShortDate(n.deadlineAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleSavedNotice(n.id)}
                    aria-label="Save official notice"
                    className={`p-2 rounded-lg border ${
                      isSaved
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-[#2563EB]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenNotice(n)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open & PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CampusSearchView: React.FC<{
  initialQuery?: string;
  onOpenNotice: (notice: CampusAnnouncement) => void;
}> = ({ initialQuery = '', onOpenNotice }) => {
  const {
    selectedInstitution,
    announcements,
    deadlines,
    facilities,
    departments,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  } = useCampusPulse();

  const [query, setQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState<PulseCategoryId | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'official' | 'student'>('all');
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority | 'all'>('all');
  const [dateAfter, setDateAfter] = useState<string>('');

  const instId = selectedInstitution?.id || 'inst_iitb';
  const instDepts = departments.filter((d) => d.institutionId === instId);

  const suggestions = [
    'Mid-Semester Admit Card',
    'CS-304 DBMS Lab',
    'Central Library Hours',
    'Elective Drop Deadline',
    'Hostel Water Maintenance',
  ];

  const handleApplyQuery = (q: string) => {
    setQuery(q);
    if (q.trim().length >= 2) addRecentSearch(q.trim());
  };

  const clearAllFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setDepartmentFilter('all');
    setSourceFilter('all');
    setPriorityFilter('all');
    setDateAfter('');
  };

  const qLower = query.trim().toLowerCase();

  const matchedNotices = useMemo(() => {
    return announcements.filter((a) => {
      if (a.institutionId !== instId) return false;
      if (categoryFilter !== 'all' && a.categoryId !== categoryFilter) return false;
      if (departmentFilter !== 'all' && a.departmentId !== departmentFilter) return false;
      if (sourceFilter === 'official' && !a.isOfficial) return false;
      if (sourceFilter === 'student' && a.isOfficial) return false;
      if (priorityFilter !== 'all' && a.priority !== priorityFilter) return false;
      if (dateAfter && a.publishedAt.slice(0, 10) < dateAfter) return false;
      if (!qLower) return true;
      return (
        a.title.toLowerCase().includes(qLower) ||
        a.summary.toLowerCase().includes(qLower) ||
        a.content.toLowerCase().includes(qLower) ||
        a.departmentName.toLowerCase().includes(qLower) ||
        (a.circularCode || '').toLowerCase().includes(qLower)
      );
    });
  }, [
    announcements,
    instId,
    categoryFilter,
    departmentFilter,
    sourceFilter,
    priorityFilter,
    dateAfter,
    qLower,
  ]);

  const matchedDeadlines = useMemo(() => {
    if (sourceFilter === 'student') return [];
    return deadlines.filter((d) => {
      if (d.institutionId !== instId) return false;
      if (departmentFilter !== 'all' && d.departmentId !== departmentFilter) return false;
      if (dateAfter && d.dateISO < dateAfter) return false;
      if (!qLower) return true;
      return (
        d.title.toLowerCase().includes(qLower) ||
        d.description.toLowerCase().includes(qLower) ||
        d.departmentName.toLowerCase().includes(qLower)
      );
    });
  }, [deadlines, instId, departmentFilter, sourceFilter, dateAfter, qLower]);

  const matchedFacilities = useMemo(() => {
    if (sourceFilter === 'student') return [];
    if (categoryFilter !== 'all' && categoryFilter !== 'facility-updates') return [];
    return facilities.filter((f) => {
      if (f.institutionId !== instId) return false;
      if (!qLower) return true;
      return (
        f.title.toLowerCase().includes(qLower) ||
        f.facilityName.toLowerCase().includes(qLower) ||
        f.details.toLowerCase().includes(qLower)
      );
    });
  }, [facilities, instId, sourceFilter, categoryFilter, qLower]);

  const totalMatches =
    matchedNotices.length + matchedDeadlines.length + matchedFacilities.length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
          Global Campus Pulse Search
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Search across official notices, exams, deadlines, departments, campus news, and facility
          updates.
        </p>
      </div>

      {/* Search Bar & Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) addRecentSearch(query.trim());
              }}
              placeholder="Search notices, exam schedules, circular numbers, facilities..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={clearAllFilters}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          >
            Clear Filters
          </button>
        </div>

        {/* Multi-facet Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as PulseCategoryId | 'all')}
            aria-label="Filter by category"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">All Categories</option>
            {PULSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Filter by department"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">All Departments</option>
            {instDepts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) =>
              setSourceFilter(e.target.value as 'all' | 'official' | 'student')
            }
            aria-label="Filter by publishing source"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">Official & Student Posts</option>
            <option value="official">Official Authorized Only</option>
            <option value="student">Student-Submitted Only</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as AlertPriority | 'all')}
            aria-label="Filter by priority"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">All Priorities</option>
            {ALERT_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateAfter}
            onChange={(e) => setDateAfter(e.target.value)}
            aria-label="Published after date"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* Suggestions & Recent Searches */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 mr-1">Suggestions:</span>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleApplyQuery(s)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-200"
              >
                {s}
              </button>
            ))}
          </div>

          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {recentSearches.slice(0, 4).map((rs) => (
                <button
                  key={rs}
                  onClick={() => handleApplyQuery(rs)}
                  className="text-[#2563EB] hover:underline"
                >
                  {rs}
                </button>
              ))}
              <button
                onClick={clearRecentSearches}
                className="text-slate-400 hover:text-slate-700 ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {totalMatches === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <Search className="w-6 h-6 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No matching campus updates found
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Try removing date constraints or clearing category filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white"
          >
            Reset Search & Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            Showing {totalMatches} matching records ({matchedNotices.length} notices ·{' '}
            {matchedDeadlines.length} deadlines · {matchedFacilities.length} facility notices)
          </div>

          {matchedNotices.map((n) => (
            <button
              key={n.id}
              onClick={() => onOpenNotice(n)}
              className="w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] transition-colors space-y-1.5"
            >
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 font-semibold text-[#172554] dark:text-blue-300">
                  {n.isOfficial ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>{n.verificationLabel}</span>
                </span>
                <span>·</span>
                <span>{getPulseCategoryLabel(n.categoryId)}</span>
                <span>·</span>
                <span>{n.departmentName}</span>
                <span>·</span>
                <span>{formatPulseShortDate(n.publishedAt)}</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{n.title}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                {n.summary}
              </div>
            </button>
          ))}

          {matchedDeadlines.map((dl) => (
            <div
              key={dl.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
            >
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>
                    Academic Deadline · {dl.kind} · {dl.departmentName}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {dl.title}
                </div>
              </div>
              <div className="text-right text-xs tabular-nums shrink-0">
                <div className="font-bold text-[#2563EB]">{formatPulseShortDate(dl.dateISO)}</div>
                <div className="text-slate-500">
                  {dl.isConfirmedOfficial ? 'Confirmed' : 'Tentative'}
                </div>
              </div>
            </div>
          ))}

          {matchedFacilities.map((fc) => (
            <div
              key={fc.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Facility Update · {fc.facilityCategory} · {fc.facilityName}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{fc.title}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">{fc.details}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
