import React from 'react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Compass,
  Radio,
  Sparkles,
  Target,
  UserCheck,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudyPartner } from '../../context/StudyPartnerContext';
import { STUDY_PARTNER_IMAGES } from '../../data/studyPartnerData';

export const StudyPartnerHomeView: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    state,
    setActiveTab,
    setSelectedPeerId,
    getMatchForPeer,
    getSortedDiscoveryPeers,
    acceptStudyRequest,
    declineStudyRequest,
    launchSessionInStudyRoom,
  } = useStudyPartner();

  const firstName = profile.name.split(' ')[0] || 'Scholar';
  const connectedPartners = state.peers.filter((p) =>
    state.connectedPartnerIds.includes(p.id)
  );
  const recommendedPeers = getSortedDiscoveryPeers('recommended')
    .filter((p) => !state.connectedPartnerIds.includes(p.id))
    .slice(0, 3);
  const upcomingSessions = state.sessions
    .filter((s) => s.status === 'Upcoming' || s.status === 'Live')
    .slice(0, 3);
  const pendingReceived = state.requests
    .filter((r) => r.direction === 'received' && r.status === 'pending')
    .slice(0, 2);

  // Honest, non-invented collaboration metrics derived strictly from recorded activity
  const completedSessionsCount = state.sessions.filter(
    (s) => s.status === 'Completed'
  ).length;
  const completedGoalsCount = state.goals.filter(
    (g) => g.status === 'completed'
  ).length;
  const totalLoggedMinutes = state.activityLog.reduce(
    (sum, item) => sum + (item.minutes || 0),
    0
  );

  // Build 7-day honest activity bars from actual state.activityLog
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const mins = state.activityLog
      .filter((l) => l.dateISO === iso)
      .reduce((sum, l) => sum + l.minutes, 0);
    const events = state.activityLog.filter((l) => l.dateISO === iso).length;
    return { iso, label, mins, events };
  });
  const maxWeekMinutes = Math.max(60, ...weekDays.map((w) => w.mins));

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between gap-5">
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Welcome back, {firstName} · {profile.course}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              Match with peers sharing your syllabus, exam timeline, and daily study rhythm.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
              Discover verified batchmates for problem-solving sprints, schedule sessions synced with KAMPUS Planner, launch collaborative Study Rooms, and track real shared goals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Find My Study Partner</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CalendarClock className="w-4 h-4 text-orange-500" />
              <span>Schedule Study Session</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Create Study Group</span>
            </button>
          </div>

          {/* Quiet summary strip */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300 tabular-nums">
            <span>
              <strong className="text-slate-900 dark:text-slate-100">
                {connectedPartners.length}
              </strong>{' '}
              Active Partners
            </span>
            <span>
              <strong className="text-slate-900 dark:text-slate-100">
                {upcomingSessions.length}
              </strong>{' '}
              Upcoming Sessions
            </span>
            <span>
              <strong className="text-slate-900 dark:text-slate-100">
                {state.groups.length}
              </strong>{' '}
              Study Groups
            </span>
            <span>
              <strong className="text-slate-900 dark:text-slate-100">
                {state.requests.filter((r) => r.direction === 'received' && r.status === 'pending').length}
              </strong>{' '}
              Incoming Requests
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-52 lg:min-h-full bg-slate-100 dark:bg-slate-800">
          <img
            src={STUDY_PARTNER_IMAGES.heroCollab}
            alt="Students collaborating on notebooks and laptops in campus library"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-slate-950/80 via-slate-950/35 to-transparent text-white text-xs flex items-center justify-between">
            <span className="font-semibold">Rule-Based Transparent Matching</span>
            <span className="text-slate-200">Zero Private Contact Exposure</span>
          </div>
        </div>
      </section>

      {/* Main Balanced Two-Column Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Primary Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recommended Partners */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Recommended Partners
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Matched transparently from your subjects, study schedule, and exam goals
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('discover')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recommendedPeers.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
                No unmatched peers right now. Visit Find Partners to adjust filters or restore hidden profiles.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recommendedPeers.map((peer) => {
                  const match = getMatchForPeer(peer);
                  return (
                    <div
                      key={peer.id}
                      className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={peer.avatarUrl}
                          alt={peer.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {peer.name}
                            </span>
                            {match.hasEnoughData && match.score !== null && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {match.score}% Match
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {peer.course} · {peer.semester} · {peer.preferredTimes[0]}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            {match.reasons[0]}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedPeerId(peer.id)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
                      >
                        View Profile
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Upcoming Study Sessions */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Upcoming Study Sessions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synced with KAMPUS Planner and launchable in Virtual Study Rooms
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('sessions')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Manage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No upcoming study sessions scheduled yet.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('sessions')}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Schedule Your First Session
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                        {session.dateISO} at {session.timeSlot} · {session.durationMinutes} min · {session.subject}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {session.title}
                      </h4>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        With {session.targetName}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        launchSessionInStudyRoom({
                          roomName: session.title,
                          subject: session.subject,
                          objective: session.objectives,
                          durationMinutes: session.durationMinutes,
                          invitedPartners: [session.targetName],
                          sessionId: session.id,
                        });
                        navigate('/connect/study-rooms');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Join Study Room</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Secondary Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Incoming Study Requests */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Study Requests ({pendingReceived.length})
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                All Requests
              </button>
            </div>

            {pendingReceived.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                You are all caught up on incoming partner requests.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingReceived.map((req) => {
                  const peer = state.peers.find((p) => p.id === req.peerId);
                  if (!peer) return null;
                  return (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={peer.avatarUrl}
                          alt={peer.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {peer.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {peer.course} · {req.dateLabel}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        &ldquo;{req.message}&rdquo;
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => acceptStudyRequest(req.id)}
                          className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => declineStudyRequest(req.id)}
                          className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* My Active Partners & Groups Snapshot */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Active Partners & Groups
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('partners')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              {connectedPartners.map((partner) => (
                <div
                  key={partner.id}
                  onClick={() => setSelectedPeerId(partner.id)}
                  className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 flex items-center justify-between gap-2.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={partner.avatarUrl}
                      alt={partner.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {partner.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {partner.subjects.slice(0, 2).join(' · ')}
                      </div>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              ))}

              {state.groups.slice(0, 2).map((grp) => (
                <div
                  key={grp.id}
                  onClick={() => setActiveTab('groups')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 flex items-center justify-between gap-2.5 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {grp.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate tabular-nums">
                      {grp.members.length} members · {grp.visibility}
                    </div>
                  </div>
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                </div>
              ))}
            </div>
          </section>

          {/* Honest Weekly Collaboration Activity */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Weekly Collaboration Activity
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recorded strictly from completed sessions & shared goals
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-orange-500" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                  {completedSessionsCount}
                </div>
                <div className="text-[11px] text-slate-500">Sessions Done</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                  {completedGoalsCount}
                </div>
                <div className="text-[11px] text-slate-500">Goals Done</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                  {totalLoggedMinutes > 0
                    ? `${(totalLoggedMinutes / 60).toFixed(1)}h`
                    : '0h'}
                </div>
                <div className="text-[11px] text-slate-500">Logged Hours</div>
              </div>
            </div>

            <div className="flex items-end justify-between gap-2 h-24 pt-2 border-t border-slate-100 dark:border-slate-800">
              {weekDays.map((day) => {
                const heightPct =
                  day.mins > 0
                    ? Math.max(18, Math.round((day.mins / maxWeekMinutes) * 100))
                    : 8;
                return (
                  <div
                    key={day.iso}
                    className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full"
                    title={`${day.label}: ${day.mins} min logged`}
                  >
                    <div className="w-full flex-1 flex items-end">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          day.mins > 0
                            ? 'bg-blue-600 dark:bg-blue-500'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {totalLoggedMinutes === 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Target className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Complete a scheduled session or Study Room sprint to log real collaboration hours here.
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
