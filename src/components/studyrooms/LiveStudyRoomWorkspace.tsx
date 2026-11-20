import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Bot,
  CheckSquare,
  Clock,
  FileText,
  Flag,
  FolderOpen,
  HelpCircle,
  LogOut,
  Maximize2,
  MessageSquare,
  Minimize2,
  PauseCircle,
  PenTool,
  PlayCircle,
  Power,
  Settings,
  Timer,
  Users,
} from 'lucide-react';
import { StudyRoom, StudyRoomsReport } from '../../types/studyRooms';
import { useStudyRooms } from '../../context/StudyRoomsContext';
import { formatTimerSeconds } from '../../data/studyRoomsData';
import {
  PomodoroFocusPanel,
  SharedNotesPanel,
  SharedResourcesPanel,
  TaskBoardPanel,
} from './RoomWorkspacePanels';
import { RoomWhiteboard } from './RoomWhiteboard';
import {
  RoomAiAssistPanel,
  RoomDiscussionPanel,
  RoomDoubtBoardPanel,
  RoomParticipantsAndInvitePanel,
} from './RoomRightDockPanels';

type WorkspaceTab = 'focus' | 'notes' | 'whiteboard' | 'resources' | 'tasks';
type DockTab = 'discussion' | 'doubts' | 'people' | 'ai';

interface LiveStudyRoomWorkspaceProps {
  room: StudyRoom;
  onEditRoom: (room: StudyRoom) => void;
  onReportTarget: (target: {
    roomId: string;
    targetType: StudyRoomsReport['targetType'];
    targetId: string;
    targetSummary: string;
  }) => void;
}

export const LiveStudyRoomWorkspace: React.FC<LiveStudyRoomWorkspaceProps> = ({
  room,
  onEditRoom,
  onReportTarget,
}) => {
  const {
    currentUserId,
    wsStatus,
    mutedRoomIds,
    exitRoomView,
    leaveRoom,
    toggleMuteRoom,
    controlSession,
  } = useStudyRooms();

  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('focus');
  const [dockTab, setDockTab] = useState<DockTab>('discussion');
  const [mobileSection, setMobileSection] = useState<'workspace' | 'dock'>('workspace');
  const [focusMode, setFocusMode] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const me = useMemo(
    () => room.participants.find((p) => p.userId === currentUserId),
    [room.participants, currentUserId]
  );

  const isOwner = me?.role === 'Owner' || room.hostId === currentUserId;
  const isHostOrCoHost = me?.role === 'Owner' || me?.role === 'Co-host' || room.hostId === currentUserId;
  const isHostOrMod = isHostOrCoHost || me?.role === 'Moderator';
  const canEditWorkspace = Boolean(me?.canUseWorkspace ?? true);
  const canShareResources = Boolean(me?.canShareResources ?? true);
  const isMuted = mutedRoomIds.includes(room.id);

  // Synchronized compact timer value for the top bar
  const [miniTimerSeconds, setMiniTimerSeconds] = useState(room.pomodoro.remainingSeconds);
  useEffect(() => {
    const compute = () => {
      if (room.pomodoro.status !== 'running') return room.pomodoro.remainingSeconds;
      const elapsed = Math.floor((Date.now() - new Date(room.pomodoro.lastUpdatedAt).getTime()) / 1000);
      return Math.max(0, room.pomodoro.remainingSeconds - Math.max(0, elapsed));
    };
    setMiniTimerSeconds(compute());
    if (room.pomodoro.status !== 'running') return;
    const id = window.setInterval(() => setMiniTimerSeconds(compute()), 1000);
    return () => window.clearInterval(id);
  }, [room.pomodoro]);

  const openDoubtsCount = room.doubts.filter((d) => !d.resolved).length;
  const pendingRequestsCount = room.joinRequests.filter((jr) => jr.status === 'pending').length;

  const workspaceTabs: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode }> = [
    { id: 'focus', label: 'Focus & Goals', icon: <Timer className="w-3.5 h-3.5" /> },
    { id: 'notes', label: 'Shared Notes', icon: <FileText className="w-3.5 h-3.5" /> },
    ...(room.enableWorkspace
      ? [{ id: 'whiteboard' as WorkspaceTab, label: 'Whiteboard', icon: <PenTool className="w-3.5 h-3.5" /> }]
      : []),
    { id: 'resources', label: 'Resources', icon: <FolderOpen className="w-3.5 h-3.5" /> },
    { id: 'tasks', label: 'Task Board', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  ];

  const dockTabs: Array<{ id: DockTab; label: string; badge?: number; icon: React.ReactNode }> = [
    { id: 'discussion', label: 'Chat', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    {
      id: 'doubts',
      label: 'Doubts',
      badge: openDoubtsCount || undefined,
      icon: <HelpCircle className="w-3.5 h-3.5" />,
    },
    {
      id: 'people',
      label: 'People',
      badge: isHostOrMod && pendingRequestsCount ? pendingRequestsCount : undefined,
      icon: <Users className="w-3.5 h-3.5" />,
    },
    { id: 'ai', label: 'KAMPUS AI', icon: <Bot className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-14">
      {/* Distraction-Free Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back + Room Metadata */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={exitRoomView}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rooms</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {room.name}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0 ${
                    room.status === 'Live'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : room.status === 'Paused'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {room.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {room.subject} · {room.studyMode} · Code{' '}
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  {room.roomCode}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Live Timer, Participant Count & Room Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{formatTimerSeconds(miniTimerSeconds)}</span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {room.activeParticipantIds.length} active / {room.participants.length} joined
              </span>
            </div>

            <span
              className={`hidden md:inline-block text-[11px] font-medium px-2 py-1 rounded-lg ${
                wsStatus === 'connected'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-amber-600 bg-amber-50 dark:bg-amber-950/40'
              }`}
            >
              {wsStatus === 'connected' ? 'Synced' : 'Reconnecting'}
            </span>

            <button
              type="button"
              onClick={() => setFocusMode((f) => !f)}
              title="Toggle Focus Mode"
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                focusMode
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleMuteRoom(room.id)}
              title={isMuted ? 'Unmute timer alerts' : 'Mute timer alerts'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {isMuted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            </button>

            {isHostOrCoHost && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    controlSession(room.id, room.status === 'Paused' ? 'resume' : 'pause')
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {room.status === 'Paused' ? (
                    <>
                      <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden md:inline">Resume</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="hidden md:inline">Pause</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onEditRoom(room)}
                  title="Room settings"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() =>
                onReportTarget({
                  roomId: room.id,
                  targetType: 'room',
                  targetId: room.id,
                  targetSummary: room.name,
                })
              }
              title="Report room"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-orange-500 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>

            {isHostOrCoHost && !confirmEnd && (
              <button
                type="button"
                onClick={() => setConfirmEnd(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>End Session</span>
              </button>
            )}

            {isHostOrCoHost && confirmEnd && (
              <div className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 px-2.5 py-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => controlSession(room.id, 'end')}
                  className="text-xs font-bold text-red-600 dark:text-red-300 cursor-pointer"
                >
                  Confirm End
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmEnd(false)}
                  className="text-[11px] text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => leaveRoom(room.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile View Switcher */}
      {!focusMode && (
        <div className="lg:hidden max-w-7xl mx-auto px-4 pt-3">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMobileSection('workspace')}
              className={`py-2 rounded-lg cursor-pointer ${
                mobileSection === 'workspace'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Study Workspace
            </button>
            <button
              type="button"
              onClick={() => setMobileSection('dock')}
              className={`py-2 rounded-lg cursor-pointer ${
                mobileSection === 'dock'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Chat, Doubts & AI ({room.participants.length})
            </button>
          </div>
        </div>
      )}

      {/* Main Split Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 flex flex-col lg:flex-row gap-5 items-start">
        {/* Left/Main Study Workspace */}
        <section
          className={`flex-1 w-full min-w-0 space-y-4 ${
            mobileSection === 'dock' && !focusMode ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Workspace Tool Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
            {workspaceTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWorkspaceTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  workspaceTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {workspaceTab === 'focus' && (
            <PomodoroFocusPanel room={room} isHostOrCoHost={isHostOrCoHost} />
          )}
          {workspaceTab === 'notes' && (
            <SharedNotesPanel room={room} canEditWorkspace={canEditWorkspace} />
          )}
          {workspaceTab === 'whiteboard' && <RoomWhiteboard room={room} />}
          {workspaceTab === 'resources' && (
            <SharedResourcesPanel
              room={room}
              canShare={canShareResources}
              isHostOrMod={isHostOrMod}
            />
          )}
          {workspaceTab === 'tasks' && (
            <TaskBoardPanel room={room} canEditWorkspace={canEditWorkspace} />
          )}
        </section>

        {/* Right Collaboration Dock (Hidden in Focus Mode) */}
        {!focusMode && (
          <aside
            className={`w-full lg:w-96 xl:w-[400px] shrink-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden ${
              mobileSection === 'workspace' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              {dockTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDockTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-[11px] font-semibold cursor-pointer border-b-2 transition-colors ${
                    dockTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="relative">
                    {tab.icon}
                    {tab.badge && (
                      <span className="absolute -top-1.5 -right-2.5 px-1 min-w-[14px] h-[14px] rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>

            {dockTab === 'discussion' && (
              <RoomDiscussionPanel
                room={room}
                isHostOrMod={isHostOrMod}
                onReport={onReportTarget}
              />
            )}
            {dockTab === 'doubts' && (
              <RoomDoubtBoardPanel
                room={room}
                isHostOrMod={isHostOrMod}
                onReport={onReportTarget}
              />
            )}
            {dockTab === 'people' && (
              <RoomParticipantsAndInvitePanel
                room={room}
                isOwner={isOwner}
                isHostOrMod={isHostOrMod}
                onReport={onReportTarget}
              />
            )}
            {dockTab === 'ai' && <RoomAiAssistPanel room={room} />}
          </aside>
        )}
      </div>
    </div>
  );
};
