import React, { useMemo, useState } from 'react';
import { Bookmark, Calendar, Filter, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useEventsClubs } from '../../context/EventsClubsContext';
import {
  EVENT_CATEGORIES,
  EVENT_COVER_ASSETS,
  formatEventDate,
  isRegistrationOpen,
} from '../../data/eventsClubsData';
import type { CampusEvent, EventCategoryId, EventFormat } from '../../types/eventsClubs';

interface ExploreEventsViewProps {
  initialQuery?: string;
  onOpenEvent: (ev: CampusEvent) => void;
}

export const ExploreEventsView: React.FC<ExploreEventsViewProps> = ({
  initialQuery = '',
  onOpenEvent,
}) => {
  const {
    events,
    confirmedCounts,
    registrations,
    savedEventIds,
    currentUserId,
    toggleSaveEvent,
  } = useEventsClubs();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategoryId>('All');
  const [selectedSubType, setSelectedSubType] = useState<string>('All');
  const [selectedFormat, setSelectedFormat] = useState<'All' | EventFormat>('All');
  const [feeFilter, setFeeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [onlyRegOpen, setOnlyRegOpen] = useState(false);
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [sortBy, setSortBy] = useState<'recommended' | 'latest' | 'upcoming' | 'popular'>('upcoming');

  const activeCategoryMeta = EVENT_CATEGORIES.find((c) => c.id === selectedCategory);

  const departments = useMemo(() => {
    const set = new Set(events.map((e) => e.department).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const weekMs = 7 * 86400_000;
    const monthMs = 30 * 86400_000;

    const list = events.filter((ev) => {
      if (ev.status === 'Draft' || ev.status === 'Pending Approval') return false;
      if (selectedCategory !== 'All' && ev.category !== selectedCategory) return false;
      if (selectedSubType !== 'All' && ev.subType !== selectedSubType) return false;
      if (selectedFormat !== 'All' && ev.format !== selectedFormat) return false;
      if (feeFilter === 'free' && ev.entryFeeInr > 0) return false;
      if (feeFilter === 'paid' && ev.entryFeeInr === 0) return false;
      if (departmentFilter !== 'All' && ev.department !== departmentFilter) return false;
      if (onlyRegOpen && (!isRegistrationOpen(ev.registrationDeadlineISO) || ev.status === 'Cancelled')) {
        return false;
      }
      if (onlyUpcoming && (ev.status === 'Completed' || ev.status === 'Cancelled')) return false;

      if (dateFilter !== 'all') {
        const diff = new Date(ev.startDateISO).getTime() - now;
        if (dateFilter === 'week' && (diff < -86400_000 || diff > weekMs)) return false;
        if (dateFilter === 'month' && (diff < -86400_000 || diff > monthMs)) return false;
      }

      if (q) {
        const blob =
          `${ev.title} ${ev.description} ${ev.organizerName} ${ev.category} ${ev.subType} ${ev.department} ${ev.venue}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'popular') {
        return (confirmedCounts[b.id] || 0) - (confirmedCounts[a.id] || 0);
      }
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'recommended') {
        return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
      }
      return new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime();
    });
  }, [
    confirmedCounts,
    dateFilter,
    departmentFilter,
    events,
    feeFilter,
    onlyRegOpen,
    onlyUpcoming,
    query,
    selectedCategory,
    selectedFormat,
    selectedSubType,
    sortBy,
  ]);

  return (
    <div className="space-y-5">
      {/* Category Selector */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedSubType('All');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              selectedCategory === 'All'
                ? 'bg-[#172554] text-white border-[#172554]'
                : 'bg-[#F8FAFC] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            All Categories
          </button>
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedSubType('All');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-[#F8FAFC] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat.id}
            </button>
          ))}
        </div>

        {activeCategoryMeta && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Type:</span>
            <button
              onClick={() => setSelectedSubType('All')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                selectedSubType === 'All'
                  ? 'bg-blue-100 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All {activeCategoryMeta.id}
            </button>
            {activeCategoryMeta.subTypes.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedSubType(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                  selectedSubType === st
                    ? 'bg-blue-100 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search & Detailed Filters */}
      <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, clubs, venues, topics..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as 'All' | EventFormat)}
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <option value="All">All Formats</option>
          <option value="Offline">Offline (In-Person)</option>
          <option value="Online">Online</option>
          <option value="Hybrid">Hybrid</option>
        </select>

        <select
          value={feeFilter}
          onChange={(e) => setFeeFilter(e.target.value as 'all' | 'free' | 'paid')}
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <option value="all">Free & Paid</option>
          <option value="free">Free Entry Only</option>
          <option value="paid">Paid Entry Only</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as 'all' | 'week' | 'month')}
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <option value="all">Any Date</option>
          <option value="week">Next 7 Days</option>
          <option value="month">Next 30 Days</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as 'recommended' | 'latest' | 'upcoming' | 'popular')
          }
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
        >
          <option value="upcoming">Sort: Upcoming Date</option>
          <option value="popular">Sort: Most Popular</option>
          <option value="recommended">Sort: Featured</option>
          <option value="latest">Sort: Latest Added</option>
        </select>

        <div className="sm:col-span-2 lg:col-span-6 flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={onlyRegOpen}
                onChange={(e) => setOnlyRegOpen(e.target.checked)}
                className="rounded border-slate-300 text-[#2563EB]"
              />
              <span>Registration Open</span>
            </label>
            <label className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUpcoming}
                onChange={(e) => setOnlyUpcoming(e.target.checked)}
                className="rounded border-slate-300 text-[#2563EB]"
              />
              <span>Hide Cancelled/Completed</span>
            </label>
            <div className="inline-flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-2 py-1 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Departments' : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500 tabular-nums">
            Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredEvents.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <SlidersHorizontal className="w-6 h-6 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No matching campus events found
          </div>
          <p className="text-xs text-slate-500">
            Try clearing your category or date filters to view all scheduled events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((ev) => {
            const reg = registrations.find(
              (r) => r.eventId === ev.id && r.userId === currentUserId && r.status !== 'Cancelled'
            );
            const saved = savedEventIds.includes(ev.id);
            const count = confirmedCounts[ev.id] || 0;
            const open = isRegistrationOpen(ev.registrationDeadlineISO) && ev.status !== 'Cancelled';

            return (
              <div
                key={ev.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-[#2563EB]/60 transition-colors"
              >
                <div>
                  <div className="relative h-40 bg-slate-900 overflow-hidden">
                    <img
                      src={ev.coverImageUrl || EVENT_COVER_ASSETS[ev.coverKey]}
                      alt={ev.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/75 text-white text-[11px] font-semibold">
                      {ev.category} · {ev.subType}
                    </div>
                    <button
                      onClick={() => toggleSaveEvent(ev.id)}
                      aria-label={saved ? 'Unsave event' : 'Save event'}
                      className={`absolute top-3 right-3 p-1.5 rounded-lg border ${
                        saved
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-white/90 text-slate-800 border-white/60'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[11px] font-semibold text-[#2563EB]">
                      {ev.originType}
                    </div>
                    <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100 line-clamp-2">
                      {ev.title}
                    </h3>
                    <div className="text-xs text-[#64748B] dark:text-slate-400">
                      By {ev.organizerName}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {formatEventDate(ev.startDateISO)} · {ev.startTime} - {ev.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {ev.format} · {ev.venue}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {ev.entryFeeInr === 0 ? 'Free' : `Rs. ${ev.entryFeeInr}`}
                    <span className="text-slate-400 font-normal">
                      {' '}
                      · {Math.max(0, ev.maxSeats - count)} left
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenEvent(ev)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      reg
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : open
                          ? 'bg-[#2563EB] hover:bg-blue-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {reg ? reg.status : open ? 'Register' : 'View Details'}
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
