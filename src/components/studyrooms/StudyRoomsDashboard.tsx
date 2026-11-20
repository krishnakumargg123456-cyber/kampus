import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Globe,
  History,
  KeyRound,
  Lock,
  Play,
  Plus,
  Search,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import {
  RoomDiscoveryCategory,
  SessionSummaryRecord,
  StudyRoom,
} from '../../types/studyRooms';
import { useStudyRooms } from '../../context/StudyRoomsContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  COURSE_CATEGORIES,
  formatRoomDateTime,
  resolveRoomAvatar,
  resolveRoomCover,
} from '../../data/studyRoomsData';

type DashboardTab = 'discover' | 'upcoming' | 'my-rooms' | 'summaries';

const DISCOVERY_CATEGORIES: RoomDiscoveryCategory[] = [
  'All Rooms',
  'Recommended',
  'Live Now',
  'Upcoming',
  'My Rooms',
  'Private Rooms',
];

interface StudyRoomsDashboardProps {
  onOpenNotifications?: () => void;
  onOpenCreate: (scheduleLater: boolean) => void;
  onEditRoom: (room: StudyRoom) => void;
  onOpenJoinCode: () => void;
  onOpenRequestJoin: (room: StudyRoom) => void;
  onOpenSummary: (summary: SessionSummaryRecord) => void;
}

export const StudyRoomsDashboard: React.FC<StudyRoomsDashboardProps> = ({
  onOpenNotifications,
  onOpenCreate,
  onEditRoom,
  onOpenJoinCode,
  onOpenRequestJoin,
  onOpenSummary,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    currentUserId,
    currentUserCourse,
    rooms,
    summaries,
    loading,
    error,
    enterRoom,
    toggleSaveRoom,
    controlSession,
    updateRoom,
    showToast,
  } = useStudyRooms();

  const [tab, setTab] = useState<DashboardTab>('discover');
  const [category, setCategory] = useState<RoomDiscoveryCategory>('All Rooms');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [enteringRoomId, setEnteringRoomId] = useState<string | null>(null);

  const isParticipant = (r: StudyRoom) =>
    r.hostId === currentUserId || r.participants.some((p) => p.userId === currentUserId);

  const visibleRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (r.visibility === 'Unlisted' && !isParticipant(r)) return false;
      if (r.status === 'Cancelled' && tab === 'discover') return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, currentUserId, tab]);

  const filteredDiscoveryRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const courseKeyword = currentUserCourse.split(' ')[0]?.toLowerCase() || '';

    return visibleRooms.filter((r) => {
      if (subjectFilter !== 'All' && r.courseCategory !== subjectFilter) return false;

      if (q) {
        const hay = `${r.name} ${r.subject} ${r.topic} ${r.hostName} ${r.studyMode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (category === 'Live Now') return r.status === 'Live' || r.status === 'Paused';
      if (category === 'Upcoming')
        return r.status === 'Upcoming' || r.status === 'Starting Soon';
      if (category === 'My Rooms') return isParticipant(r);
      if (category === 'Private Rooms') return r.privacy === 'Private';
      if (category === 'Recommended') {
        const matchCourse =
          courseKeyword &&
          `${r.courseCategory} ${r.subject} ${r.topic}`.toLowerCase().includes(courseKeyword);
        return matchCourse || r.status === 'Live';
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRooms, searchQuery, subjectFilter, category, currentUserCourse]);

  const upcomingRooms = useMemo(
    () =>
      rooms.filter(
        (r) =>
          Boolean(r.scheduledStartAt) ||
          r.status === 'Upcoming' ||
          r.status === 'Starting Soon'
      ),
    [rooms]
  );

  // 6 My Study Rooms sections
  const myRoomSections = useMemo(() => {
    const created = rooms.filter((r) => r.hostId === currentUserId);
    const joined = rooms.filter(
      (r) => r.hostId !== currentUserId && r.participants.some((p) => p.userId === currentUserId)
    );
    const priv = rooms.filter((r) => r.privacy === 'Private' && isParticipant(r));
    const upcoming = rooms.filter(
      (r) =>
        isParticipant(r) &&
        (r.status === 'Upcoming' || r.status === 'Starting Soon')
    );
    const visited = rooms.filter((r) => r.visitedByIds.includes(currentUserId));
    const saved = rooms.filter((r) => r.savedByIds.includes(currentUserId));

    return [
      { key: 'created', title: 'Rooms I Created', items: created },
      { key: 'joined', title: 'Rooms I Joined', items: joined },
      { key: 'private', title: 'Private Rooms', items: priv },
      { key: 'upcoming', title: 'Upcoming Sessions', items: upcoming },
      { key: 'visited', title: 'Recently Visited', items: visited },
      { key: 'saved', title: 'Saved Rooms', items: saved },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms, currentUserId]);

  const handleRoomPrimaryAction = async (room: StudyRoom) => {
    const joined = isParticipant(room);
    if (!joined && room.privacy === 'Private') {
      if (room.allowJoinRequests) {
        onOpenRequestJoin(room);
      } else {
        showToast('This private room requires an invite code from the host.');
        onOpenJoinCode();
      }
      return;
    }

    setEnteringRoomId(room.id);
    const res = await enterRoom(room.id);
    setEnteringRoomId(null);
    if (!res.ok) {
      if (room.hostApprovalRequired && room.allowJoinRequests) {
        onOpenRequestJoin(room);
      } else {
        showToast(res.error || 'Unable to enter room.');
      }
    }
  };

  const renderRoomCard = (room: StudyRoom) => {
    const joined = isParticipant(room);
    const saved = room.savedByIds.includes(currentUserId);
    const hasPendingReq = room.joinRequests.some(
      (jr) => jr.userId === currentUserId && jr.status === 'pending'
    );
    const isHost = room.hostId === currentUserId;

    return (
      <article
        key={room.id}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
      >
        {/* Cover Banner */}
        <div className="relative h-32 bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <img
            src={resolveRoomCover(room.coverKey)}
            alt={room.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />

          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                room.status === 'Live'
                  ? 'bg-emerald-600 text-white'
                  : room.status === 'Upcoming' || room.status === 'Starting Soon'
                    ? 'bg-blue-600 text-white'
                    : room.status === 'Cancelled'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-100'
              }`}
            >
              {room.status}
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleSaveRoom(room.id)}
            title={saved ? 'Remove bookmark' : 'Save room'}
            className={`absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-sm cursor-pointer ${
              saved
                ? 'bg-orange-500 text-white'
                : 'bg-slate-900/50 text-white hover:bg-slate-900/80'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
            <span className="font-semibold truncate">{room.subject}</span>
            <span className="inline-flex items-center gap-1 shrink-0 opacity-90">
              {room.privacy === 'Private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {room.privacy}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
              {room.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {room.description}
            </p>
          </div>

          <div className="space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {room.studyMode}
              </span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="w-3 h-3" /> {room.durationMinutes} min
              </span>
            </div>

            {room.scheduledStartAt && (
              <div className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <Calendar className="w-3 h-3" />
                <span>{formatRoomDateTime(room.scheduledStartAt)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={resolveRoomAvatar('aditya')}
                  alt={room.hostName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
                <span className="truncate">{room.hostName}</span>
              </div>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200 tabular-nums shrink-0">
                <Users className="w-3 h-3 text-blue-600" />
                {room.activeParticipantIds.length} active · {room.participants.length}/{room.maxCapacity}
              </span>
            </div>
          </div>

          {/* Primary Action Row */}
          <div className="flex items-center gap-2 pt-1">
            {room.status === 'Ended' || room.status === 'Cancelled' ? (
              <span className="w-full text-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-500">
                Session {room.status}
              </span>
            ) : hasPendingReq ? (
              <span className="w-full text-center py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-xs font-semibold text-amber-700 dark:text-amber-300">
                Approval Pending
              </span>
            ) : (
              <button
                type="button"
                disabled={enteringRoomId === room.id}
                onClick={() => handleRoomPrimaryAction(room)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {enteringRoomId === room.id
                    ? 'Entering...'
                    : joined
                      ? 'Enter Room'
                      : room.privacy === 'Private' || room.hostApprovalRequired
                        ? 'Request Access'
                        : 'Join Room'}
                </span>
              </button>
            )}

            {isHost && room.status !== 'Ended' && room.status !== 'Cancelled' && (
              <button
                type="button"
                onClick={() => onEditRoom(room)}
                title="Edit room settings"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Study Rooms
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Virtual libraries, synchronized Pomodoro timers, shared whiteboards, and collaborative study sessions.
              </p>
            </div>

            {/* Search, Notification Center & User Profile */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rooms, subjects, hosts..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/account/profile')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <img
                  src={resolveRoomAvatar('priya')}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {profile.name}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight">{profile.course}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Primary Actions + Main Workspace Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenCreate(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Create a Room
              </button>
              <button
                type="button"
                onClick={onOpenJoinCode}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-orange-500" /> Join with Room Code
              </button>
              <button
                type="button"
                onClick={() => onOpenCreate(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Schedule a Session
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              {(
                [
                  { id: 'discover', label: 'Discover Rooms' },
                  { id: 'upcoming', label: `Scheduled (${upcomingRooms.length})` },
                  { id: 'my-rooms', label: 'My Study Rooms' },
                  { id: 'summaries', label: `Session Summaries (${summaries.length})` },
                ] as Array<{ id: DashboardTab; label: string }>
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    tab === t.id
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* TAB 1: DISCOVER ROOMS */}
        {tab === 'discover' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {DISCOVERY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      category === cat
                        ? 'bg-slate-900 dark:bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium"
              >
                <option value="All">All Course Categories</option>
                {COURSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4"
                  />
                ))}
              </div>
            ) : filteredDiscoveryRooms.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-blue-600 mx-auto opacity-70" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No matching study rooms found
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Start a new public or private study room for your subject, or join a friend&apos;s room using their 6-character code.
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenCreate(false)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Create a Room
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDiscoveryRooms.map(renderRoomCard)}
              </div>
            )}
          </>
        )}

        {/* TAB 2: SCHEDULED SESSIONS */}
        {tab === 'upcoming' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Scheduled Study Sessions
                </h2>
                <p className="text-xs text-slate-500">
                  Scheduled sessions automatically sync to your KAMPUS Planner and Notification reminders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenCreate(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" /> Schedule New Session
              </button>
            </div>

            {upcomingRooms.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-xs text-slate-400">
                No study sessions scheduled yet. Click &ldquo;Schedule New Session&rdquo; to plan a group sprint.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingRooms.map((r) => {
                  const isHost = r.hostId === currentUserId;
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            {r.status}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {r.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500">
                          {r.subject} · {r.studyMode} · {formatRoomDateTime(r.scheduledStartAt)} ({r.durationMinutes} min)
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {r.status !== 'Cancelled' && r.status !== 'Ended' && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                if (isHost && (r.status === 'Upcoming' || r.status === 'Starting Soon')) {
                                  await controlSession(r.id, 'start');
                                }
                                await handleRoomPrimaryAction(r);
                              }}
                              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              {isHost && r.status !== 'Live' ? 'Launch Live' : 'Enter Room'}
                            </button>
                            {isHost && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onEditRoom(r)}
                                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateRoom(r.id, { status: 'Cancelled' })}
                                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Cancel
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY STUDY ROOMS (6 SECTIONS) */}
        {tab === 'my-rooms' && (
          <div className="space-y-8">
            {myRoomSections.map((sec) => (
              <section key={sec.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {sec.title} ({sec.items.length})
                  </h2>
                </div>
                {sec.items.length === 0 ? (
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 text-xs text-slate-400">
                    No rooms in this section yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sec.items.map(renderRoomCard)}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        {/* TAB 4: SESSION SUMMARIES & REAL PARTICIPATION LOGS */}
        {tab === 'summaries' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Recorded Study Session Summaries
              </h2>
              <p className="text-xs text-slate-500">
                Real session outcomes generated automatically when a study room session ends.
              </p>
            </div>

            {summaries.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
                <History className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No completed study room sessions yet
                </p>
                <p className="text-xs text-slate-400">
                  When a host clicks &ldquo;End Session&rdquo; inside a room, your genuine Pomodoro cycles, duration, completed tasks, and resolved doubts are archived here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summaries.map((sum) => (
                  <div
                    key={sum.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {sum.roomName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {sum.subject} · {sum.studyMode}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold tabular-nums">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {sum.totalDurationMinutes} min
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-center">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                        <p className="text-[11px] text-slate-400">Cycles</p>
                        <p className="font-bold tabular-nums">{sum.completedFocusSessions}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                        <p className="text-[11px] text-slate-400">Tasks</p>
                        <p className="font-bold tabular-nums">
                          {sum.tasksCompleted}/{sum.totalTasks}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70">
                        <p className="text-[11px] text-slate-400">Doubts Solved</p>
                        <p className="font-bold tabular-nums">{sum.doubtsResolvedCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-400">
                        {new Date(sum.sessionDate).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenSummary(sum)}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        View Full Summary
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
