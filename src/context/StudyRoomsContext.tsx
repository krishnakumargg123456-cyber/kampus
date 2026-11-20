import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PomodoroPhase,
  PomodoroState,
  RoomMessageAttachment,
  RoomRole,
  SessionSummaryRecord,
  StudyMode,
  StudyRoom,
  StudyRoomsBootstrapResponse,
  StudyRoomsReport,
  WhiteboardElement,
} from '../types/studyRooms';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sendAiChatMessage } from '../services/kampusAiService';

const HANDOFF_KEY = 'kampus_study_room_handoff_v1';
const PLANNER_SESSIONS_KEY = 'kampus_planner_partner_sessions_v1';
const STUDY_PARTNER_STORAGE_KEY = 'kampus_studypartner_state_v1';

export type RoomsWsStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

interface CreateRoomInput {
  name: string;
  description: string;
  subject: string;
  courseCategory: string;
  topic: string;
  coverKey: string;
  rules: string;
  privacy: 'Public' | 'Private';
  visibility: 'Listed' | 'Unlisted';
  maxCapacity: number;
  allowJoinRequests: boolean;
  hostApprovalRequired: boolean;
  allowResourceSharing: boolean;
  enableGroupDiscussion: boolean;
  enableWorkspace: boolean;
  studyMode: StudyMode;
  startMode: 'now' | 'later';
  scheduledStartAt?: string;
  durationMinutes: number;
  breakIntervalMinutes: number;
  remindersEnabled: boolean;
  objectives: string[];
  instructions: string;
  invitedEmailsOrNames?: string[];
}

interface StudyRoomsContextType {
  currentUserId: string;
  currentUserName: string;
  currentUserCourse: string;
  loading: boolean;
  error: string | null;
  wsStatus: RoomsWsStatus;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  rooms: StudyRoom[];
  summaries: SessionSummaryRecord[];
  blockedUserIds: string[];
  reports: StudyRoomsReport[];
  activeRoomId: string | null;
  activeRoom: StudyRoom | null;
  mutedRoomIds: string[];
  lastSessionSummary: SessionSummaryRecord | null;
  clearLastSessionSummary: () => void;

  refreshBootstrap: () => Promise<void>;
  enterRoom: (roomId: string) => Promise<{ ok: boolean; error?: string }>;
  exitRoomView: () => void;
  leaveRoom: (roomId: string) => Promise<void>;
  createRoom: (input: CreateRoomInput) => Promise<StudyRoom | null>;
  updateRoom: (roomId: string, updates: Record<string, unknown>) => Promise<boolean>;
  joinByCodeOrToken: (codeOrToken: string) => Promise<{ ok: boolean; room?: StudyRoom; error?: string }>;
  requestJoinRoom: (roomId: string, message?: string) => Promise<{ ok: boolean; error?: string }>;
  reviewJoinRequest: (roomId: string, reqId: string, decision: 'accept' | 'reject') => Promise<void>;
  toggleSaveRoom: (roomId: string) => Promise<void>;
  toggleMuteRoom: (roomId: string) => void;

  regenerateInvite: (roomId: string, expiresInHours?: number) => Promise<void>;
  revokeInvite: (roomId: string) => Promise<void>;

  updateParticipantRole: (
    roomId: string,
    targetUserId: string,
    action: 'remove' | 'setRole' | 'permissions',
    payload?: { role?: RoomRole; canShareResources?: boolean; canUseWorkspace?: boolean }
  ) => Promise<void>;

  controlSession: (
    roomId: string,
    action: 'start' | 'pause' | 'resume' | 'end'
  ) => Promise<SessionSummaryRecord | null>;

  controlPomodoro: (
    roomId: string,
    action: 'start' | 'pause' | 'reset' | 'switch-phase' | 'configure' | 'complete-cycle',
    payload?: {
      phase?: PomodoroPhase;
      focusMinutes?: number;
      shortBreakMinutes?: number;
      longBreakMinutes?: number;
      autoBreakReminders?: boolean;
    }
  ) => Promise<void>;

  updateObjective: (
    roomId: string,
    action: 'add' | 'toggle',
    payload: { objectiveId?: string; label?: string }
  ) => Promise<void>;

  saveNote: (
    roomId: string,
    action: 'upsert' | 'delete',
    payload: { noteId?: string; topic?: string; title?: string; content?: string }
  ) => Promise<void>;

  mutateWhiteboard: (
    roomId: string,
    action: 'add' | 'undo' | 'clear',
    element?: WhiteboardElement
  ) => Promise<void>;

  uploadRoomFile: (file: File, roomId: string) => Promise<RoomMessageAttachment>;
  mutateResource: (
    roomId: string,
    action: 'add' | 'delete',
    payload: {
      resourceId?: string;
      kind?: 'PDF' | 'Notes' | 'Document' | 'Link';
      title?: string;
      url?: string;
      fileName?: string;
      sizeBytes?: number;
    }
  ) => Promise<void>;

  mutateTask: (
    roomId: string,
    action: 'add' | 'toggle' | 'delete',
    payload: { taskId?: string; title?: string; assigneeName?: string }
  ) => Promise<void>;

  sendRoomMessage: (
    roomId: string,
    payload: {
      text: string;
      replyToId?: string;
      attachment?: RoomMessageAttachment;
      isAnnouncement?: boolean;
    }
  ) => Promise<boolean>;
  reactRoomMessage: (roomId: string, msgId: string, emoji: string) => Promise<void>;
  pinRoomMessage: (roomId: string, msgId: string) => Promise<void>;
  deleteRoomMessage: (roomId: string, msgId: string) => Promise<void>;

  postDoubt: (
    roomId: string,
    payload: {
      title: string;
      explanation: string;
      subject: string;
      topic: string;
      attachment?: RoomMessageAttachment;
    }
  ) => Promise<boolean>;
  answerDoubt: (roomId: string, doubtId: string, text: string) => Promise<void>;
  toggleResolveDoubt: (roomId: string, doubtId: string) => Promise<void>;

  toggleBlockUser: (targetUserId: string) => Promise<void>;
  submitReport: (payload: {
    roomId: string;
    targetType: StudyRoomsReport['targetType'];
    targetId: string;
    targetSummary: string;
    reason: string;
    details: string;
  }) => Promise<void>;

  askRoomAi: (
    room: StudyRoom,
    action:
      | 'explain-topic'
      | 'practice-questions'
      | 'summarize-notes'
      | 'revision-points'
      | 'discussion-topics'
      | 'session-plan'
      | 'explain-resource',
    customContext?: string
  ) => Promise<{ text: string; error?: string }>;
}

const StudyRoomsContext = createContext<StudyRoomsContextType | undefined>(undefined);

function syncScheduledRoomToPlanner(room: StudyRoom) {
  if (!room.scheduledStartAt) return;
  try {
    const raw = localStorage.getItem(PLANNER_SESSIONS_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const entry = {
      id: `sr_${room.id}`,
      title: `Study Room: ${room.name}`,
      targetName: room.hostName,
      subject: room.subject,
      dateISO: room.scheduledStartAt.slice(0, 10),
      timeSlot: new Date(room.scheduledStartAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      durationMinutes: room.durationMinutes,
      status: room.status,
    };
    const next = [entry, ...list.filter((item) => item.id !== entry.id)];
    localStorage.setItem(PLANNER_SESSIONS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export const StudyRoomsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();

  const currentUserId = user?.id || 'usr_22b030149';
  const currentUserName = profile.name || 'Priya Sharma';
  const currentUserCourse = `${profile.course || 'B.Tech CS'} · ${profile.semester || 'Sem 6'}`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<RoomsWsStatus>('connecting');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [summaries, setSummaries] = useState<SessionSummaryRecord[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [reports, setReports] = useState<StudyRoomsReport[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [mutedRoomIds, setMutedRoomIds] = useState<string[]>([]);
  const [lastSessionSummary, setLastSessionSummary] = useState<SessionSummaryRecord | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const activeRoomIdRef = useRef<string | null>(null);
  const mutedRef = useRef<string[]>([]);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);
  useEffect(() => {
    mutedRef.current = mutedRoomIds;
  }, [mutedRoomIds]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const mergeRoom = useCallback((updated: StudyRoom) => {
    setRooms((prev) => {
      const exists = prev.some((r) => r.id === updated.id);
      return exists ? prev.map((r) => (r.id === updated.id ? updated : r)) : [updated, ...prev];
    });
  }, []);

  const refreshBootstrap = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(
        `/api/study-rooms/bootstrap?userId=${encodeURIComponent(currentUserId)}`
      );
      if (!res.ok) throw new Error('Unable to load Study Rooms workspace.');
      const data = (await res.json()) as StudyRoomsBootstrapResponse;
      setRooms(data.rooms);
      setSummaries(data.summaries || []);
      setBlockedUserIds(data.blockedUserIds || []);
      setReports(data.reports || []);

      // Handle Study Partner / Chat handoff cleanly
      const rawHandoff = localStorage.getItem(HANDOFF_KEY);
      if (rawHandoff) {
        localStorage.removeItem(HANDOFF_KEY);
        const h = JSON.parse(rawHandoff);
        if (h?.roomName) {
          const createRes = await fetch('/api/study-rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUserId,
              userName: currentUserName,
              userCourse: currentUserCourse,
              name: h.roomName,
              subject: h.subject || 'Collaborative Study',
              topic: h.subject || 'Session Sprint',
              description: h.objective || 'Launched from KAMPUS Connect collaboration.',
              studyMode: 'Collaborative Learning',
              durationMinutes: Number(h.durationMinutes) || 50,
              invitedEmailsOrNames: Array.isArray(h.invitedPartners) ? h.invitedPartners : [],
              objectives: h.objective ? [h.objective] : ['Complete collaborative sprint'],
            }),
          });
          if (createRes.ok) {
            const created = await createRes.json();
            if (created.room) {
              setRooms((prev) => [created.room, ...prev]);
              setActiveRoomId(created.room.id);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to Study Rooms server.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentUserName, currentUserCourse]);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const refreshRef = useRef(refreshBootstrap);
  const addNotifRef = useRef(addNotification);
  useEffect(() => {
    refreshRef.current = refreshBootstrap;
  }, [refreshBootstrap]);
  useEffect(() => {
    addNotifRef.current = addNotification;
  }, [addNotification]);

  // Real-time WebSocket connection on /ws/study-rooms
  useEffect(() => {
    let closedByCleanup = false;
    let attempt = 0;
    let reconnectTimer: number | null = null;
    let pingTimer: number | null = null;

    const connect = () => {
      if (closedByCleanup) return;
      setWsStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(
        `${proto}//${window.location.host}/ws/study-rooms?userId=${encodeURIComponent(currentUserId)}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        const wasReconnect = attempt > 0;
        attempt = 0;
        setWsStatus('connected');
        if (wasReconnect) {
          refreshRef.current();
        }
        if (activeRoomIdRef.current) {
          ws.send(JSON.stringify({ event: 'room:subscribe', roomId: activeRoomIdRef.current }));
        }
        pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: 'ping' }));
          }
        }, 25_000);
      };

      ws.onmessage = (evt) => {
        try {
          const { event, roomId, payload } = JSON.parse(evt.data);
          if (event === 'room:meta') {
            setRooms((prev) =>
              prev.map((r) =>
                r.id === payload.roomId
                  ? {
                      ...r,
                      status: payload.status,
                      activeParticipantIds: payload.activeParticipantIds,
                    }
                  : r
              )
            );
          } else if (event === 'room:updated' && payload?.room) {
            mergeRoom(payload.room);
          } else if (event === 'room:presence') {
            setRooms((prev) =>
              prev.map((r) =>
                r.id === roomId
                  ? {
                      ...r,
                      activeParticipantIds: payload.activeParticipantIds,
                      participants: payload.participants,
                    }
                  : r
              )
            );
          } else if (event === 'room:pomodoro') {
            setRooms((prev) =>
              prev.map((r) => (r.id === roomId ? { ...r, pomodoro: payload.pomodoro } : r))
            );
          } else if (event === 'room:notes') {
            setRooms((prev) =>
              prev.map((r) => (r.id === roomId ? { ...r, notes: payload.notes } : r))
            );
          } else if (event === 'room:whiteboard') {
            setRooms((prev) =>
              prev.map((r) => (r.id === roomId ? { ...r, whiteboard: payload.whiteboard } : r))
            );
          } else if (event === 'room:resources') {
            setRooms((prev) =>
              prev.map((r) => (r.id === roomId ? { ...r, resources: payload.resources } : r))
            );
          } else if (event === 'room:tasks') {
            setRooms((prev) =>
              prev.map((r) => (r.id === roomId ? { ...r, tasks: payload.tasks } : r))
            );
          } else if (event === 'room:messages') {
            setRooms((prev) =>
              prev.map((r) => (r.id === roomId ? { ...r, messages: payload.messages } : r))
            );
          } else if (event === 'room:doubts') {
            setRooms((prev) =>
              prev.map((r) => (r.id === roomId ? { ...r, doubts: payload.doubts } : r))
            );
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (pingTimer) window.clearInterval(pingTimer);
        if (!closedByCleanup) {
          attempt += 1;
          setWsStatus(navigator.onLine ? 'reconnecting' : 'offline');
          const delay = Math.min(8000, 1000 * Math.pow(1.5, attempt));
          reconnectTimer = window.setTimeout(connect, delay);
        }
      };
    };

    connect();
    return () => {
      closedByCleanup = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (pingTimer) window.clearInterval(pingTimer);
      wsRef.current?.close();
    };
  }, [currentUserId, mergeRoom]);

  // Subscribe/unsubscribe active room on WebSocket when activeRoomId changes
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (activeRoomId) {
      ws.send(JSON.stringify({ event: 'room:subscribe', roomId: activeRoomId }));
    } else {
      ws.send(JSON.stringify({ event: 'room:unsubscribe' }));
    }
  }, [activeRoomId]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeRoomId) || null,
    [rooms, activeRoomId]
  );

  const enterRoom = async (roomId: string) => {
    const res = await fetch(`/api/study-rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        userName: currentUserName,
        userCourse: currentUserCourse,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.message || 'Unable to enter room.' };
    }
    if (data.room) mergeRoom(data.room);
    setActiveRoomId(roomId);
    return { ok: true };
  };

  const exitRoomView = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'room:unsubscribe' }));
    }
    setActiveRoomId(null);
  };

  const leaveRoom = async (roomId: string) => {
    await fetch(`/api/study-rooms/${roomId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId }),
    });
    if (activeRoomId === roomId) exitRoomView();
    await refreshBootstrap();
    showToast('Left the study room.');
  };

  const createRoom = async (input: CreateRoomInput) => {
    const res = await fetch('/api/study-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        userId: currentUserId,
        userName: currentUserName,
        userCourse: currentUserCourse,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Could not create study room.');
      return null;
    }
    const created = data.room as StudyRoom;
    mergeRoom(created);
    if (created.scheduledStartAt) {
      syncScheduledRoomToPlanner(created);
      if (created.remindersEnabled) {
        addNotifRef.current({
          title: `Scheduled: ${created.name}`,
          description: `${created.subject} · ${new Date(created.scheduledStartAt).toLocaleString()} (synced to Planner)`,
          time: 'Scheduled',
          type: 'academic',
          linkRoute: '/connect/study-rooms',
        });
      }
      showToast('Session scheduled and synced to KAMPUS Planner.');
    } else {
      setActiveRoomId(created.id);
      showToast(`Room "${created.name}" created! Code: ${created.roomCode}`);
    }
    return created;
  };

  const updateRoom = async (roomId: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/study-rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, ...updates }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Unable to update room.');
      return false;
    }
    if (data.room) {
      mergeRoom(data.room);
      if (data.room.scheduledStartAt) syncScheduledRoomToPlanner(data.room);
      if (updates.status === 'Cancelled') {
        addNotifRef.current({
          title: `Session Cancelled: ${data.room.name}`,
          description: 'Scheduled study room session was cancelled by the host.',
          time: 'Just now',
          type: 'academic',
          linkRoute: '/connect/study-rooms',
        });
      }
    }
    showToast('Room updated.');
    return true;
  };

  const joinByCodeOrToken = async (codeOrToken: string) => {
    const res = await fetch('/api/study-rooms/join-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        userName: currentUserName,
        userCourse: currentUserCourse,
        codeOrToken,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.message || 'Invalid room code or invite.' };
    }
    if (data.room) {
      mergeRoom(data.room);
      setActiveRoomId(data.room.id);
      showToast(`Joined "${data.room.name}"!`);
    }
    return { ok: true, room: data.room };
  };

  const requestJoinRoom = async (roomId: string, message?: string) => {
    const res = await fetch(`/api/study-rooms/${roomId}/request-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        userName: currentUserName,
        userCourse: currentUserCourse,
        message,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Failed to send request.' };
    if (data.room) mergeRoom(data.room);
    showToast('Join request sent to the room host.');
    return { ok: true };
  };

  const reviewJoinRequest = async (roomId: string, reqId: string, decision: 'accept' | 'reject') => {
    const res = await fetch(`/api/study-rooms/${roomId}/join-requests/${reqId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, decision }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.room) {
      mergeRoom(data.room);
      showToast(decision === 'accept' ? 'Participant approved.' : 'Request declined.');
    }
  };

  const toggleSaveRoom = async (roomId: string) => {
    const res = await fetch(`/api/study-rooms/${roomId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, savedByIds: data.savedByIds } : r))
      );
    }
  };

  const toggleMuteRoom = (roomId: string) => {
    setMutedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const regenerateInvite = async (roomId: string, expiresInHours?: number) => {
    const res = await fetch(`/api/study-rooms/${roomId}/invite/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, expiresInHours }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.room) {
      mergeRoom(data.room);
      showToast(`New invite code generated: ${data.room.roomCode}`);
    }
  };

  const revokeInvite = async (roomId: string) => {
    const res = await fetch(`/api/study-rooms/${roomId}/invite/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.room) {
      mergeRoom(data.room);
      showToast('Invitation link revoked.');
    }
  };

  const updateParticipantRole = async (
    roomId: string,
    targetUserId: string,
    action: 'remove' | 'setRole' | 'permissions',
    payload?: { role?: RoomRole; canShareResources?: boolean; canUseWorkspace?: boolean }
  ) => {
    const res = await fetch(`/api/study-rooms/${roomId}/participants/${targetUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, action, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.room) {
      mergeRoom(data.room);
      showToast('Participant permissions updated.');
    } else {
      showToast(data.message || 'Unable to update participant.');
    }
  };

  const controlSession = async (
    roomId: string,
    action: 'start' | 'pause' | 'resume' | 'end'
  ): Promise<SessionSummaryRecord | null> => {
    const res = await fetch(`/api/study-rooms/${roomId}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Unable to change session state.');
      return null;
    }
    if (data.room) mergeRoom(data.room);
    if (data.summary) {
      const summary = data.summary as SessionSummaryRecord;
      setSummaries((prev) => [summary, ...prev]);
      setLastSessionSummary(summary);
      setActiveRoomId(null);

      // Record genuine logged minutes to Study Partner activity log if initialized
      try {
        const spRaw = localStorage.getItem(STUDY_PARTNER_STORAGE_KEY);
        if (spRaw) {
          const sp = JSON.parse(spRaw);
          const today = new Date().toISOString().slice(0, 10);
          const nextLog = [
            {
              id: `log-sr-${Date.now()}`,
              dateISO: today,
              minutes: summary.totalDurationMinutes,
              type: 'session',
              label: `Study Room: ${summary.roomName}`,
            },
            ...(sp.activityLog || []),
          ];
          localStorage.setItem(STUDY_PARTNER_STORAGE_KEY, JSON.stringify({ ...sp, activityLog: nextLog }));
        }
      } catch {
        // ignore
      }
    }
    return data.summary || null;
  };

  const controlPomodoro = async (
    roomId: string,
    action: 'start' | 'pause' | 'reset' | 'switch-phase' | 'configure' | 'complete-cycle',
    payload?: {
      phase?: PomodoroPhase;
      focusMinutes?: number;
      shortBreakMinutes?: number;
      longBreakMinutes?: number;
      autoBreakReminders?: boolean;
    }
  ) => {
    const res = await fetch(`/api/study-rooms/${roomId}/pomodoro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, action, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Only hosts can update the shared timer.');
      return;
    }
    if (data.pomodoro) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, pomodoro: data.pomodoro as PomodoroState } : r))
      );
      if (action === 'complete-cycle' && !mutedRef.current.includes(roomId)) {
        addNotifRef.current({
          title: 'Pomodoro Interval Completed',
          description: 'Time for a quick stretch before the next focus block.',
          time: 'Just now',
          type: 'academic',
          linkRoute: '/connect/study-rooms',
        });
      }
    }
  };

  const updateObjective = async (
    roomId: string,
    action: 'add' | 'toggle',
    payload: { objectiveId?: string; label?: string }
  ) => {
    const res = await fetch(`/api/study-rooms/${roomId}/objectives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, action, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.objectives) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, objectives: data.objectives } : r))
      );
    }
  };

  const saveNote = async (
    roomId: string,
    action: 'upsert' | 'delete',
    payload: { noteId?: string; topic?: string; title?: string; content?: string }
  ) => {
    const res = await fetch(`/api/study-rooms/${roomId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, userName: currentUserName, action, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.notes) {
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, notes: data.notes } : r)));
      showToast(action === 'delete' ? 'Note removed.' : 'Shared note saved.');
    } else {
      showToast(data.message || 'Unable to save note.');
    }
  };

  const mutateWhiteboard = async (
    roomId: string,
    action: 'add' | 'undo' | 'clear',
    element?: WhiteboardElement
  ) => {
    const res = await fetch(`/api/study-rooms/${roomId}/whiteboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, action, element }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.whiteboard) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, whiteboard: data.whiteboard } : r))
      );
    } else if (!res.ok) {
      showToast(data.message || 'Whiteboard action denied.');
    }
  };

  const uploadRoomFile = (file: File, roomId: string): Promise<RoomMessageAttachment> => {
    return new Promise((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('File exceeds the 5 MB upload limit.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = String(reader.result || '');
          const kind = file.type.startsWith('image/') ? 'image' : 'document';
          const res = await fetch('/api/study-rooms/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUserId,
              roomId,
              fileName: file.name,
              mimeType: file.type || 'application/octet-stream',
              base64Data,
              kind,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.file) {
            reject(new Error(data.message || 'File upload failed.'));
            return;
          }
          resolve(data.file);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Upload failed.'));
        }
      };
      reader.onerror = () => reject(new Error('Could not read selected file.'));
      reader.readAsDataURL(file);
    });
  };

  const mutateResource = async (
    roomId: string,
    action: 'add' | 'delete',
    payload: {
      resourceId?: string;
      kind?: 'PDF' | 'Notes' | 'Document' | 'Link';
      title?: string;
      url?: string;
      fileName?: string;
      sizeBytes?: number;
    }
  ) => {
    const res = await fetch(`/api/study-rooms/${roomId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, userName: currentUserName, action, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.resources) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, resources: data.resources } : r))
      );
      showToast(action === 'delete' ? 'Resource removed.' : 'Shared resource added.');
    } else {
      showToast(data.message || 'Could not update resources.');
    }
  };

  const mutateTask = async (
    roomId: string,
    action: 'add' | 'toggle' | 'delete',
    payload: { taskId?: string; title?: string; assigneeName?: string }
  ) => {
    const res = await fetch(`/api/study-rooms/${roomId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, action, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.tasks) {
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, tasks: data.tasks } : r)));
    }
  };

  const sendRoomMessage = async (
    roomId: string,
    payload: {
      text: string;
      replyToId?: string;
      attachment?: RoomMessageAttachment;
      isAnnouncement?: boolean;
    }
  ) => {
    const res = await fetch(`/api/study-rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, userName: currentUserName, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Unable to send message.');
      return false;
    }
    if (data.messages) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, messages: data.messages } : r))
      );
    }
    return true;
  };

  const reactRoomMessage = async (roomId: string, msgId: string, emoji: string) => {
    const res = await fetch(`/api/study-rooms/${roomId}/messages/${msgId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, emoji }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.messages) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, messages: data.messages } : r))
      );
    }
  };

  const pinRoomMessage = async (roomId: string, msgId: string) => {
    const res = await fetch(`/api/study-rooms/${roomId}/messages/${msgId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.messages) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, messages: data.messages } : r))
      );
    } else {
      showToast(data.message || 'Unable to pin message.');
    }
  };

  const deleteRoomMessage = async (roomId: string, msgId: string) => {
    const res = await fetch(
      `/api/study-rooms/${roomId}/messages/${msgId}?userId=${encodeURIComponent(currentUserId)}`,
      { method: 'DELETE' }
    );
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.messages) {
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, messages: data.messages } : r))
      );
    } else {
      showToast(data.message || 'Cannot delete message.');
    }
  };

  const postDoubt = async (
    roomId: string,
    payload: {
      title: string;
      explanation: string;
      subject: string;
      topic: string;
      attachment?: RoomMessageAttachment;
    }
  ) => {
    const res = await fetch(`/api/study-rooms/${roomId}/doubts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, userName: currentUserName, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Could not post doubt.');
      return false;
    }
    if (data.doubts) {
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, doubts: data.doubts } : r)));
      showToast('Doubt posted to the room Doubt Board.');
    }
    return true;
  };

  const answerDoubt = async (roomId: string, doubtId: string, text: string) => {
    const res = await fetch(`/api/study-rooms/${roomId}/doubts/${doubtId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, userName: currentUserName, text }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.doubts) {
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, doubts: data.doubts } : r)));
    }
  };

  const toggleResolveDoubt = async (roomId: string, doubtId: string) => {
    const res = await fetch(`/api/study-rooms/${roomId}/doubts/${doubtId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.doubts) {
      setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, doubts: data.doubts } : r)));
    } else {
      showToast(data.message || 'Permission required.');
    }
  };

  const toggleBlockUser = async (targetUserId: string) => {
    const res = await fetch('/api/study-rooms/safety/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, targetUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setBlockedUserIds(data.blockedUserIds || []);
      showToast('Updated user block list.');
    }
  };

  const submitReport = async (payload: {
    roomId: string;
    targetType: StudyRoomsReport['targetType'];
    targetId: string;
    targetSummary: string;
    reason: string;
    details: string;
  }) => {
    const res = await fetch('/api/study-rooms/safety/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reporterId: currentUserId, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.report) {
      setReports((prev) => [data.report, ...prev]);
      showToast('Safety report submitted.');
    }
  };

  const askRoomAi = async (
    room: StudyRoom,
    action:
      | 'explain-topic'
      | 'practice-questions'
      | 'summarize-notes'
      | 'revision-points'
      | 'discussion-topics'
      | 'session-plan'
      | 'explain-resource',
    customContext?: string
  ): Promise<{ text: string; error?: string }> => {
    const notesText = room.notes.map((n) => `### ${n.title}\n${n.content}`).join('\n\n');
    const resourcesText = room.resources.map((r) => `- ${r.title} (${r.kind})`).join('\n');
    const context = `Room: ${room.name}\nSubject: ${room.subject}\nTopic: ${room.topic}\nObjectives: ${room.objectives
      .map((o) => o.label)
      .join('; ')}\n\nShared Notes:\n${notesText || 'None yet'}\n\nShared Resources:\n${
      resourcesText || 'None yet'
    }${customContext ? `\n\nSelected Context:\n${customContext}` : ''}`;

    const promptByAction: Record<typeof action, string> = {
      'explain-topic': `Explain the core study topic "${room.topic}" for ${room.subject} clearly with intuition and one worked example.`,
      'practice-questions': `Generate 3 targeted practice questions with brief answer hints based on this room's topic and notes.`,
      'summarize-notes': `Summarize the shared room notes into crisp key takeaways.`,
      'revision-points': `Create 5 high-yield last-minute revision bullet points for ${room.subject} (${room.topic}).`,
      'discussion-topics': `Suggest 3 focused academic discussion questions for students in this room to debate.`,
      'session-plan': `Create a structured ${room.durationMinutes}-minute study session plan matching the room objectives.`,
      'explain-resource': `Explain the selected shared study resource and highlight key concepts to focus on.`,
    };

    try {
      const resp = await sendAiChatMessage({
        messages: [{ role: 'user', content: `${promptByAction[action]}\n\n${context}` }],
        language: 'English',
        learningLevel: 'Intermediate',
        responseStyle: 'Detailed Explanation',
        studentContext: `${currentUserName} (${currentUserCourse})`,
      });
      return { text: resp.reply };
    } catch (err) {
      return {
        text: '',
        error:
          err instanceof Error
            ? err.message
            : 'KAMPUS AI service is currently unavailable. Check server Gemini configuration.',
      };
    }
  };

  return (
    <StudyRoomsContext.Provider
      value={{
        currentUserId,
        currentUserName,
        currentUserCourse,
        loading,
        error,
        wsStatus,
        toastMessage,
        showToast,
        rooms,
        summaries,
        blockedUserIds,
        reports,
        activeRoomId,
        activeRoom,
        mutedRoomIds,
        lastSessionSummary,
        clearLastSessionSummary: () => setLastSessionSummary(null),
        refreshBootstrap,
        enterRoom,
        exitRoomView,
        leaveRoom,
        createRoom,
        updateRoom,
        joinByCodeOrToken,
        requestJoinRoom,
        reviewJoinRequest,
        toggleSaveRoom,
        toggleMuteRoom,
        regenerateInvite,
        revokeInvite,
        updateParticipantRole,
        controlSession,
        controlPomodoro,
        updateObjective,
        saveNote,
        mutateWhiteboard,
        uploadRoomFile,
        mutateResource,
        mutateTask,
        sendRoomMessage,
        reactRoomMessage,
        pinRoomMessage,
        deleteRoomMessage,
        postDoubt,
        answerDoubt,
        toggleResolveDoubt,
        toggleBlockUser,
        submitReport,
        askRoomAi,
      }}
    >
      {children}
    </StudyRoomsContext.Provider>
  );
};

export const useStudyRooms = () => {
  const ctx = useContext(StudyRoomsContext);
  if (!ctx) throw new Error('useStudyRooms must be used within StudyRoomsProvider');
  return ctx;
};
