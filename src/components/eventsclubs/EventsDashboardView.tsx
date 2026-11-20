import React from 'react';
import {
  ArrowRight,
  Award,
  Bookmark,
  Calendar,
  Compass,
  MapPin,
  Plus,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEventsClubs } from '../../context/EventsClubsContext';
import { EVENT_COVER_ASSETS, formatEventDate } from '../../data/eventsClubsData';
import type { CampusClub, CampusEvent } from '../../types/eventsClubs';

export type EventsClubsTab =
  | 'dashboard'
  | 'explore-events'
  | 'clubs'
  | 'my-activities'
  | 'create-event'
  | 'organizer';

interface EventsDashboardViewProps {
  onNavigateTab: (tab: EventsClubsTab) => void;
  onOpenEvent: (ev: CampusEvent) => void;
  onOpenClub: (club: CampusClub) => void;
  onOpenAiModal: () => void;
  onOpenPasskeyModal: () => void;
}

export const EventsDashboardView: React.FC<EventsDashboardViewProps> = ({
  onNavigateTab,
  onOpenEvent,
  onOpenClub,
  onOpenAiModal,
  onOpenPasskeyModal,
}) => {
  const {
    events,
    confirmedCounts,
    registrations,
    clubs,
    memberships,
    clubAnnouncements,
    savedEventIds,
    currentUserId,
    authInfo,
    toggleSaveEvent,
  } = useEventsClubs();

  const liveEvents = events.filter((e) => e.status !== 'Draft' && e.status !== 'Pending Approval');
  const featuredEvents = liveEvents.filter((e) => e.isFeatured).slice(0, 3);
  const trendingEvents = [...liveEvents]
    .sort((a, b) => (confirmedCounts[b.id] || 0) - (confirmedCounts[a.id] || 0))
    .slice(0, 4);
  const workshops = liveEvents.filter(
    (e) => e.subType === 'Workshops' || e.subType === 'AI Workshops' || e.subType === 'Resume Workshops'
  );
  const hackathons = liveEvents.filter(
    (e) => e.subType === 'Hackathons' || e.subType === 'Coding Competitions'
  );
  const fests = liveEvents.filter((e) => e.category === 'Cultural' || e.subType === 'College Fests');
  const recentEvents = [...liveEvents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const popularClubs = [...clubs]
    .sort((a, b) => {
      const ca = memberships.filter((m) => m.clubId === a.id && m.status === 'Member').length;
      const cb = memberships.filter((m) => m.clubId === b.id && m.status === 'Member').length;
      return cb - ca;
    })
    .slice(0, 4);

  const myActiveRegs = registrations.filter(
    (r) => r.userId === currentUserId && r.status !== 'Cancelled' && r.status !== 'Rejected'
  );

  const renderEventTile = (ev: CampusEvent) => {
    const reg = registrations.find(
      (r) => r.eventId === ev.id && r.userId === currentUserId && r.status !== 'Cancelled'
    );
    const saved = savedEventIds.includes(ev.id);
    const count = confirmedCounts[ev.id] || 0;

    return (
      <div
        key={ev.id}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-[#2563EB]/60 transition-colors"
      >
        <div>
          <div className="relative h-36 bg-slate-900 overflow-hidden">
            <img
              src={ev.coverImageUrl || EVENT_COVER_ASSETS[ev.coverKey]}
              alt={ev.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/75 text-white text-[11px] font-semibold">
              {ev.category} · {ev.subType}
            </div>
            <button
              onClick={() => toggleSaveEvent(ev.id)}
              aria-label={saved ? 'Remove bookmark' : 'Save event'}
              className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg border ${
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
              {ev.organizerName} · {ev.originType}
            </div>
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100 line-clamp-2">
              {ev.title}
            </h3>
            <div className="space-y-1 text-xs text-[#64748B] dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {formatEventDate(ev.startDateISO)} · {ev.startTime}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {ev.format} · {ev.venue}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-1">
          <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 tabular-nums">
            {ev.entryFeeInr === 0 ? 'Free' : `Rs. ${ev.entryFeeInr}`} · {count}/{ev.maxSeats} seats
          </div>
          <button
            onClick={() => onOpenEvent(ev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              reg
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-[#2563EB] text-white hover:bg-blue-700'
            }`}
          >
            {reg ? reg.status : 'View & Register'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <section className="rounded-2xl bg-[#172554] text-white p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            Campus Engagement & Communities
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Make Your Campus Life Count.
          </h2>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Discover events, join clubs, compete and grow. Verified QR attendance passes, team
            entries, club communities, and event certificates connected with your KAMPUS profile.
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-3">
            <button
              onClick={() => onNavigateTab('explore-events')}
              className="px-4 py-2.5 rounded-xl bg-white text-[#172554] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-blue-50"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Events</span>
            </button>
            <button
              onClick={() => onNavigateTab('clubs')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-blue-500 border border-blue-400/40"
            >
              <Users className="w-4 h-4" />
              <span>Discover Clubs</span>
            </button>
            <button
              onClick={() => {
                if (authInfo.canCreateEvent) {
                  onNavigateTab('create-event');
                } else {
                  onOpenPasskeyModal();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white/20 border border-white/20"
            >
              <Plus className="w-4 h-4" />
              <span>{authInfo.canCreateEvent ? 'Create Event' : 'Organizer Sign-In'}</span>
            </button>
            <button
              onClick={() => onNavigateTab('my-activities')}
              className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white/20 border border-white/20"
            >
              <Ticket className="w-4 h-4" />
              <span>My Activities ({myActiveRegs.length})</span>
            </button>
          </div>
        </div>

        {/* AI Discovery Quick Card */}
        <div className="lg:w-72 rounded-2xl bg-white/10 border border-white/15 p-4 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-100">
            <Sparkles className="w-4 h-4 text-[#F97316]" />
            <span>KAMPUS AI Event Matcher</span>
          </div>
          <p className="text-xs text-blue-100/85 leading-relaxed">
            Get recommendations for hackathons, technical workshops, and clubs matched to your
            degree and interests.
          </p>
          <button
            onClick={onOpenAiModal}
            className="w-full py-2 rounded-xl bg-[#F97316] hover:bg-orange-600 text-white text-xs font-bold transition-colors"
          >
            Ask AI for Recommendations
          </button>
        </div>
      </section>

      {/* Main Content + Right Rail */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Featured Events */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                Featured Events
              </h3>
              <button
                onClick={() => onNavigateTab('explore-events')}
                className="text-xs font-semibold text-[#2563EB] inline-flex items-center gap-1 hover:underline"
              >
                <span>Browse all events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredEvents.map(renderEventTile)}
            </div>
          </section>

          {/* Popular Clubs */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                Popular Campus Clubs
              </h3>
              <button
                onClick={() => onNavigateTab('clubs')}
                className="text-xs font-semibold text-[#2563EB] inline-flex items-center gap-1 hover:underline"
              >
                <span>Explore directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {popularClubs.map((club) => {
                const memCount = memberships.filter(
                  (m) => m.clubId === club.id && m.status === 'Member'
                ).length;
                const myMem = memberships.find(
                  (m) => m.clubId === club.id && m.userId === currentUserId
                );
                return (
                  <button
                    key={club.id}
                    onClick={() => onOpenClub(club)}
                    className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#2563EB]">
                        {club.category} · {club.visibility}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                        {memCount} active members
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      {club.name}
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-2">
                      {club.description}
                    </p>
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 pt-1">
                      {myMem && myMem.status !== 'Inactive'
                        ? `Status: ${myMem.status} (${myMem.role})`
                        : 'Open Club Page'}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Focused Curated Strips */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-[#172033] dark:text-slate-100 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Trending & Hackathons</span>
              </div>
              {(hackathons.length > 0 ? hackathons : trendingEvents).slice(0, 2).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onOpenEvent(ev)}
                  className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB]"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatEventDate(ev.startDateISO)} · {confirmedCounts[ev.id] || 0} registered
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-[#172033] dark:text-slate-100 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Workshops & Learning</span>
              </div>
              {workshops.slice(0, 2).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onOpenEvent(ev)}
                  className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB]"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {ev.format} · {ev.startTime}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-[#172033] dark:text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Fests & Recent Additions</span>
              </div>
              {(fests.length > 0 ? fests : recentEvents).slice(0, 2).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onOpenEvent(ev)}
                  className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB]"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatEventDate(ev.startDateISO)} · {ev.venue}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Rail: Upcoming Registered Events + Club Updates */}
        <aside className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                Your Registered Events
              </h3>
              <button
                onClick={() => onNavigateTab('my-activities')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Open Passes
              </button>
            </div>
            {myActiveRegs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                You have no active event registrations yet. Explore upcoming campus events to
                register and receive your QR entry pass.
              </p>
            ) : (
              <div className="space-y-2.5">
                {myActiveRegs.slice(0, 4).map((reg) => {
                  const ev = events.find((e) => e.id === reg.eventId);
                  if (!ev) return null;
                  return (
                    <button
                      key={reg.id}
                      onClick={() => onOpenEvent(ev)}
                      className="w-full text-left p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                        <span className="text-emerald-700 dark:text-emerald-400">{reg.status}</span>
                        <span className="font-mono text-slate-500">{reg.referenceCode}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {ev.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatEventDate(ev.startDateISO)} · {ev.startTime}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
              Latest Club Announcements
            </h3>
            {clubAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-500">No announcements posted yet.</p>
            ) : (
              <div className="space-y-2.5">
                {clubAnnouncements.slice(0, 3).map((ann) => {
                  const club = clubs.find((c) => c.id === ann.clubId);
                  return (
                    <div
                      key={ann.id}
                      className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="text-[11px] font-bold text-[#2563EB]">
                        {club?.shortCode || 'Club'} · {ann.authorName}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {ann.title}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {ann.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
