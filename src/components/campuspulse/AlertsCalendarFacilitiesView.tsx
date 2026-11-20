import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Building,
  Building2,
  Bus,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FlaskConical,
  Home,
  Info,
  Library,
  Lock,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { useCampusPulse } from '../../context/CampusPulseContext';
import {
  ALERT_PRIORITIES,
  ALERT_TYPES,
  FACILITY_CATEGORIES,
  formatPulseDateTime,
  formatPulseShortDate,
  priorityWeight,
} from '../../data/campusPulseData';
import type {
  AlertPriority,
  AlertType,
  CampusAnnouncement,
  FacilityCategory,
} from '../../types/campusPulse';

export const CampusAlertsView: React.FC<{
  onOpenNoticeById: (id: string) => void;
}> = ({ onOpenNoticeById }) => {
  const { selectedInstitution, alerts } = useCampusPulse();
  const [priorityFilter, setPriorityFilter] = useState<AlertPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');

  const instId = selectedInstitution?.id || 'inst_iitb';

  const filtered = useMemo(() => {
    return alerts
      .filter((a) => a.institutionId === instId)
      .filter((a) => (priorityFilter === 'all' ? true : a.priority === priorityFilter))
      .filter((a) => (typeFilter === 'all' ? true : a.alertType === typeFilter))
      .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
  }, [alerts, instId, priorityFilter, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Important Campus Alerts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Priority-calibrated advisories for examinations, class schedule changes, and facility
            disruptions.
          </p>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AlertType | 'all')}
          aria-label="Filter by alert type"
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
        >
          <option value="all">All Alert Types</option>
          {ALERT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
        <button
          onClick={() => setPriorityFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            priorityFilter === 'all'
              ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          All Priorities
        </button>
        {ALERT_PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              priorityFilter === p
                ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          No campus alerts match the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((al) => {
            const toneClass =
              al.priority === 'Critical'
                ? 'border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20'
                : al.priority === 'High'
                  ? 'border-orange-300 dark:border-orange-900 bg-orange-50/30 dark:bg-orange-950/15'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900';

            const prioText =
              al.priority === 'Critical'
                ? 'text-red-700 dark:text-red-400'
                : al.priority === 'High'
                  ? 'text-[#F97316]'
                  : al.priority === 'Normal'
                    ? 'text-[#2563EB]'
                    : 'text-slate-600 dark:text-slate-400';

            return (
              <div key={al.id} className={`p-5 rounded-2xl border ${toneClass} space-y-2`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {al.priority === 'Critical' || al.priority === 'High' ? (
                      <AlertTriangle className={`w-4 h-4 ${prioText}`} />
                    ) : (
                      <Info className={`w-4 h-4 ${prioText}`} />
                    )}
                    <span className={`font-bold ${prioText}`}>{al.priority}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {al.alertType}
                    </span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    Issued {formatPulseDateTime(al.publishedAt)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                  {al.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {al.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-x-3">
                    <span>Source: {al.publishingSource}</span>
                    {al.expiresAt && (
                      <span className="tabular-nums">
                        Valid until {formatPulseShortDate(al.expiresAt)}
                      </span>
                    )}
                  </div>
                  {al.relatedAnnouncementId && (
                    <button
                      onClick={() => onOpenNoticeById(al.relatedAnnouncementId!)}
                      className="font-semibold text-[#2563EB] hover:underline"
                    >
                      Open Related Circular
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AcademicCalendarView: React.FC<{
  onOpenNoticeById: (id: string) => void;
}> = ({ onOpenNoticeById }) => {
  const { selectedInstitution, deadlines, savedDeadlineIds, toggleSavedDeadline } =
    useCampusPulse();

  const [viewMode, setViewMode] = useState<'list' | 'month' | 'timeline'>('list');
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const instId = selectedInstitution?.id || 'inst_iitb';

  const instDeadlines = useMemo(
    () =>
      deadlines
        .filter((d) => d.institutionId === instId)
        .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime()),
    [deadlines, instId]
  );

  // Month grid calculation
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = monthCursor.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const calendarCells = useMemo(() => {
    const cells: Array<{ day: number | null; iso?: string }> = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, iso: `${year}-${mm}-${dd}` });
    }
    return cells;
  }, [firstWeekday, daysInMonth, year, month]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Academic Calendar & Deadlines
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Official examination dates, registration windows, holidays, and assignments. Save any
            item to sync directly with KAMPUS Planner.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
          {[
            { id: 'list', label: 'Upcoming List' },
            { id: 'month', label: 'Monthly Calendar' },
            { id: 'timeline', label: 'Deadline Timeline' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id as 'list' | 'month' | 'timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                viewMode === m.id
                  ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="space-y-3">
          {instDeadlines.map((dl) => {
            const isSaved = savedDeadlineIds.includes(dl.id);
            return (
              <div
                key={dl.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#172554] dark:text-blue-300">
                      {dl.kind}
                    </span>
                    <span>·</span>
                    <span>{dl.departmentName}</span>
                    <span>·</span>
                    <span
                      className={
                        dl.isConfirmedOfficial
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-[#F97316] font-semibold'
                      }
                    >
                      {dl.isConfirmedOfficial ? 'Confirmed Official Date' : 'Tentative Schedule'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                    {dl.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{dl.description}</p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3">
                    <span>Source: {dl.source}</span>
                    {dl.relatedAnnouncementId && (
                      <button
                        onClick={() => onOpenNoticeById(dl.relatedAnnouncementId!)}
                        className="text-[#2563EB] font-semibold hover:underline"
                      >
                        View Related Notice
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="text-right tabular-nums">
                    <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      {formatPulseShortDate(dl.dateISO)}
                    </div>
                    {dl.timeLabel && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {dl.timeLabel}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleSavedDeadline(dl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border ${
                      isSaved
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#2563EB]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{isSaved ? 'Synced to Planner' : 'Save to Planner'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'month' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">{monthLabel}</h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              const items = cell.iso
                ? instDeadlines.filter((dl) => dl.dateISO === cell.iso)
                : [];
              return (
                <div
                  key={idx}
                  className={`min-h-20 p-1.5 rounded-xl border text-xs ${
                    cell.day
                      ? 'bg-[#F8FAFC] dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                      : 'border-transparent'
                  }`}
                >
                  {cell.day && (
                    <>
                      <div className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                        {cell.day}
                      </div>
                      <div className="space-y-1 mt-1">
                        {items.map((it) => (
                          <button
                            key={it.id}
                            onClick={() => toggleSavedDeadline(it)}
                            title={`${it.title} (${it.isConfirmedOfficial ? 'Confirmed' : 'Tentative'})`}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold truncate ${
                              it.isConfirmedOfficial
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-[#F97316] text-white'
                            }`}
                          >
                            {it.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          {instDeadlines.map((dl) => (
            <div
              key={dl.id}
              className="flex items-start gap-4 pb-4 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
            >
              <div className="w-24 shrink-0 text-xs font-bold text-[#2563EB] tabular-nums pt-0.5">
                {formatPulseShortDate(dl.dateISO)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#172033] dark:text-slate-100">
                  {dl.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {dl.kind} · {dl.departmentName} ·{' '}
                  {dl.isConfirmedOfficial ? 'Confirmed' : 'Tentative'}
                </div>
              </div>
              <button
                onClick={() => toggleSavedDeadline(dl)}
                className="text-xs font-semibold text-[#2563EB] hover:underline shrink-0"
              >
                {savedDeadlineIds.includes(dl.id) ? 'Saved' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const DepartmentsView: React.FC<{
  onOpenNotice: (notice: CampusAnnouncement) => void;
}> = ({ onOpenNotice }) => {
  const {
    selectedInstitution,
    departments,
    announcements,
    deadlines,
    followedDepartmentIds,
    toggleFollowDepartment,
    roleInfo,
  } = useCampusPulse();

  const instId = selectedInstitution?.id || 'inst_iitb';
  const instDepts = departments.filter((d) => d.institutionId === instId);
  const [activeDeptId, setActiveDeptId] = useState<string>(instDepts[0]?.id || '');

  const selectedDept =
    instDepts.find((d) => d.id === activeDeptId) || instDepts[0] || null;

  const deptNotices = useMemo(
    () =>
      announcements.filter(
        (a) =>
          a.institutionId === instId &&
          selectedDept &&
          a.departmentId === selectedDept.id &&
          a.status !== 'Archived'
      ),
    [announcements, instId, selectedDept]
  );

  const deptDeadlines = useMemo(
    () =>
      deadlines.filter(
        (d) =>
          d.institutionId === instId && selectedDept && d.departmentId === selectedDept.id
      ),
    [deadlines, instId, selectedDept]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
          Department Updates
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Follow academic and administrative departments for course schedules, labs, and circulars.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Department List */}
        <div className="lg:col-span-4 space-y-2.5">
          {instDepts.map((d) => {
            const isSelected = selectedDept?.id === d.id;
            const isFollowing = followedDepartmentIds.includes(d.id);
            return (
              <div
                key={d.id}
                className={`p-4 rounded-2xl border transition-colors ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-[#2563EB]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => setActiveDeptId(d.id)}
                    className="text-left min-w-0 flex-1"
                  >
                    <div className="text-[11px] font-mono text-[#2563EB] font-semibold">
                      {d.code}
                    </div>
                    <div className="text-sm font-bold text-[#172033] dark:text-slate-100 mt-0.5">
                      {d.name}
                    </div>
                  </button>
                  <button
                    onClick={() => toggleFollowDepartment(d.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border shrink-0 ${
                      isFollowing
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Department Page */}
        {selectedDept && (
          <div className="lg:col-span-8 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-mono font-semibold text-[#2563EB]">
                    {selectedDept.code}
                  </span>
                  <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100">
                    {selectedDept.name}
                  </h3>
                </div>
                <button
                  onClick={() => toggleFollowDepartment(selectedDept.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${
                    followedDepartmentIds.includes(selectedDept.id)
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {followedDepartmentIds.includes(selectedDept.id)
                    ? 'Following Department'
                    : 'Follow Department'}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {selectedDept.description}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Office: {selectedDept.officeLocation}</span>
                <span>Hours: {selectedDept.officeHours}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#172554] dark:text-blue-400 shrink-0" />
                <span>
                  {selectedDept.restrictedPolicyNote} (Your access level: {roleInfo.role})
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Department Notices & Academic Updates ({deptNotices.length})
              </h4>
              {deptNotices.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  No active announcements published for this department.
                </div>
              ) : (
                deptNotices.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onOpenNotice(n)}
                    className="w-full text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] space-y-1.5"
                  >
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="font-semibold text-[#172554] dark:text-blue-300">
                        {n.verificationLabel}
                      </span>
                      <span>·</span>
                      <span>{n.subcategory}</span>
                      <span>·</span>
                      <span>{formatPulseShortDate(n.publishedAt)}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {n.title}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">{n.summary}</div>
                  </button>
                ))
              )}
            </div>

            {deptDeadlines.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Upcoming Department Deadlines
                </h4>
                {deptDeadlines.map((dl) => (
                  <div
                    key={dl.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b last:border-b-0 border-slate-100 dark:border-slate-800"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dl.title}
                    </span>
                    <span className="tabular-nums text-[#2563EB] font-semibold">
                      {formatPulseShortDate(dl.dateISO)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const FacilityUpdatesView: React.FC = () => {
  const { selectedInstitution, facilities } = useCampusPulse();
  const [catFilter, setCatFilter] = useState<FacilityCategory | 'all'>('all');

  const instId = selectedInstitution?.id || 'inst_iitb';
  const filtered = useMemo(
    () =>
      facilities
        .filter((f) => f.institutionId === instId)
        .filter((f) => (catFilter === 'all' ? true : f.facilityCategory === catFilter)),
    [facilities, instId, catFilter]
  );

  const iconForCategory = (cat: FacilityCategory) => {
    switch (cat) {
      case 'Library':
        return Library;
      case 'Hostel':
        return Home;
      case 'Transport':
        return Bus;
      case 'Cafeteria':
        return Utensils;
      case 'Laboratories':
        return FlaskConical;
      default:
        return Building;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
          Campus Facility Updates
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Official operating hour updates, maintenance advisories, and published schedules with
          verified source attribution and timestamps.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
        <button
          onClick={() => setCatFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            catFilter === 'all'
              ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          All Facilities
        </button>
        {FACILITY_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              catFilter === c
                ? 'bg-white dark:bg-slate-900 text-[#2563EB] shadow-2xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((fc) => {
          const Icon = iconForCategory(fc.facilityCategory);
          return (
            <div
              key={fc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[#2563EB]">
                      {fc.facilityCategory}
                    </div>
                    <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      {fc.facilityName}
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#F97316]">
                  {fc.statusNote}
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {fc.title}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {fc.details}
              </p>

              <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-200">
                {fc.operatingInfo}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Source: {fc.source}</span>
                </span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock className="w-3 h-3" />
                  <span>Updated {formatPulseDateTime(fc.lastUpdatedAt)}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
