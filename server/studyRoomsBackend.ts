import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import type {
  PomodoroPhase,
  PomodoroState,
  RoomDoubt,
  RoomMessage,
  RoomParticipant,
  RoomResource,
  RoomRole,
  RoomTask,
  SessionSummaryRecord,
  SharedNoteItem,
  StudyRoom,
  StudyRoomsReport,
  WhiteboardElement,
} from '../src/types/studyRooms.ts';

interface StoredRoomFile {
  fileId: string;
  ownerId: string;
  roomId?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'document';
  base64Data: string;
  createdAt: string;
}

interface StudyRoomsDatabase {
  rooms: StudyRoom[];
  summaries: SessionSummaryRecord[];
  blockedByUser: Record<string, string[]>;
  reports: StudyRoomsReport[];
  files: Record<string, StoredRoomFile>;
}

const DB_PATH = path.resolve(process.cwd(), '.kampus_study_rooms_db.json');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `KMP-${suffix}`;
}

function defaultPomodoro(focusMin = 25, shortMin = 5, longMin = 15): PomodoroState {
  return {
    phase: 'focus',
    focusMinutes: focusMin,
    shortBreakMinutes: shortMin,
    longBreakMinutes: longMin,
    status: 'idle',
    remainingSeconds: focusMin * 60,
    lastUpdatedAt: new Date().toISOString(),
    completedFocusSessions: 0,
    autoBreakReminders: true,
  };
}

function createSeedDatabase(): StudyRoomsDatabase {
  const now = Date.now();
  const isoAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();
  const isoAhead = (mins: number) => new Date(now + mins * 60_000).toISOString();

  const rooms: StudyRoom[] = [
    {
      id: 'room_turing_pomodoro',
      name: 'Turing Hall Silent Pomodoro',
      description:
        'Distraction-free 25/5 Pomodoro focus blocks for graph algorithms, dynamic programming, and lab sheets.',
      subject: 'CS-302 Algorithms',
      courseCategory: 'Computer Science & Engineering',
      topic: 'DP on Trees & Network Flow',
      coverKey: 'algorithms',
      rules:
        'Keep discussions concise during break intervals. Pin shared theorems in Notes so peers can revise smoothly.',
      privacy: 'Public',
      visibility: 'Listed',
      maxCapacity: 25,
      allowJoinRequests: true,
      hostApprovalRequired: false,
      allowResourceSharing: true,
      enableGroupDiscussion: true,
      enableWorkspace: true,
      studyMode: 'Pomodoro Study',
      status: 'Live',
      durationMinutes: 75,
      breakIntervalMinutes: 5,
      remindersEnabled: true,
      objectives: [
        { id: 'obj_1', label: 'Complete Problem Set 4 Q1–Q3', done: true },
        { id: 'obj_2', label: 'Verify treewidth base case recurrence', done: false },
        { id: 'obj_3', label: 'Summarize time complexity bounds in Shared Notes', done: false },
      ],
      instructions:
        'Work silently during each 25-minute focus interval. Drop doubts on the Doubt Board for break-time discussion.',
      hostId: 'stu_aditya',
      hostName: 'Aditya Sharma',
      roomCode: 'KMP-302A',
      invitation: {
        id: 'inv_turing',
        code: 'KMP-302A',
        token: 'tok_turing_302a',
        createdBy: 'stu_aditya',
        revoked: false,
        createdAt: isoAgo(120),
      },
      participants: [
        {
          userId: 'stu_aditya',
          name: 'Aditya Sharma',
          avatarKey: 'aditya',
          course: 'B.Tech Computer Science',
          role: 'Owner',
          joinedAt: isoAgo(90),
          activeStatus: 'Away',
          canShareResources: true,
          canUseWorkspace: true,
        },
        {
          userId: 'stu_rohan',
          name: 'Rohan Kulkarni',
          avatarKey: 'rohan',
          course: 'B.Tech ECE',
          role: 'Moderator',
          joinedAt: isoAgo(65),
          activeStatus: 'Away',
          canShareResources: true,
          canUseWorkspace: true,
        },
      ],
      activeParticipantIds: [],
      joinRequests: [],
      pomodoro: {
        ...defaultPomodoro(25, 5, 15),
        completedFocusSessions: 1,
      },
      notes: [
        {
          id: 'note_tree_dp',
          topic: 'DP on Trees',
          title: 'Subtree Rerooting Template',
          content:
            '1. Run bottom-up DFS to compute dpDown[u].\n2. Run top-down DFS to propagate parent contribution excluding subtree u.\n3. Total complexity stays O(V + E).',
          updatedBy: 'Aditya Sharma',
          updatedAt: isoAgo(35),
        },
      ],
      whiteboard: [],
      resources: [
        {
          id: 'res_cs302_link',
          kind: 'Notes',
          title: 'CS-302 Lecture 11: Treewidth & Bipartite Matching',
          url: '/learn/notes-exchange',
          sharedBy: 'Aditya Sharma',
          sharedById: 'stu_aditya',
          createdAt: isoAgo(40),
        },
      ],
      tasks: [
        {
          id: 'task_1',
          title: 'Derive Edmonds-Karp augmenting path bound',
          assigneeName: 'Aditya Sharma',
          done: true,
          createdBy: 'stu_aditya',
          createdAt: isoAgo(70),
        },
        {
          id: 'task_2',
          title: 'Solve 2 rerooting practice problems',
          assigneeName: 'Rohan Kulkarni',
          done: false,
          createdBy: 'stu_rohan',
          createdAt: isoAgo(50),
        },
      ],
      messages: [
        {
          id: 'rmsg_1',
          roomId: 'room_turing_pomodoro',
          senderId: 'stu_aditya',
          senderName: 'Aditya Sharma',
          senderRole: 'Owner',
          text: 'Welcome to Turing Hall! Our first 25-min focus block focuses on Problem Set 4. Share doubts in the Doubt Board.',
          reactions: [{ emoji: '👍', userIds: ['stu_rohan'] }],
          isPinned: true,
          isAnnouncement: true,
          createdAt: isoAgo(80),
        },
      ],
      doubts: [
        {
          id: 'dbt_1',
          roomId: 'room_turing_pomodoro',
          title: 'Handling disconnected forests during rerooting DP?',
          explanation:
            'Should we run the second DFS independently per connected component and reset parent accumulator to 0?',
          subject: 'CS-302 Algorithms',
          topic: 'DP on Trees',
          authorId: 'stu_rohan',
          authorName: 'Rohan Kulkarni',
          answers: [
            {
              id: 'ans_1',
              authorId: 'stu_aditya',
              authorName: 'Aditya Sharma',
              text: 'Yes — iterate over all unvisited vertices and run both DFS passes per component independently.',
              createdAt: isoAgo(25),
            },
          ],
          resolved: true,
          createdAt: isoAgo(45),
        },
      ],
      savedByIds: ['usr_22b030149'],
      visitedByIds: [],
      startedAt: isoAgo(90),
      isDemoRoom: true,
      createdAt: isoAgo(120),
      updatedAt: isoAgo(15),
    },
    {
      id: 'room_dbms_collab',
      name: 'DBMS Concurrency & Recovery Lab',
      description:
        'Interactive group whiteboard and doubt-solving table for ARIES recovery, B+ trees, and 2PL schedules.',
      subject: 'CS-304 DBMS',
      courseCategory: 'Computer Science & Engineering',
      topic: 'Serializable Schedules & WAL Recovery',
      coverKey: 'stem',
      rules:
        'Be constructive when reviewing peer schedules on the whiteboard. Mark resolved doubts cleanly.',
      privacy: 'Public',
      visibility: 'Listed',
      maxCapacity: 20,
      allowJoinRequests: true,
      hostApprovalRequired: false,
      allowResourceSharing: true,
      enableGroupDiscussion: true,
      enableWorkspace: true,
      studyMode: 'Doubt Solving',
      status: 'Live',
      durationMinutes: 60,
      breakIntervalMinutes: 10,
      remindersEnabled: true,
      objectives: [
        { id: 'obj_db_1', label: 'Trace ARIES Analysis/Redo/Undo log passes', done: false },
        { id: 'obj_db_2', label: 'Test conflict-serializability precedence graphs', done: false },
      ],
      instructions:
        'Use the Whiteboard tab to draw precedence graphs and post edge-case questions on the Doubt Board.',
      hostId: 'stu_ananya',
      hostName: 'Ananya Verma',
      roomCode: 'KMP-304D',
      invitation: {
        id: 'inv_dbms',
        code: 'KMP-304D',
        token: 'tok_dbms_304d',
        createdBy: 'stu_ananya',
        revoked: false,
        createdAt: isoAgo(95),
      },
      participants: [
        {
          userId: 'stu_ananya',
          name: 'Ananya Verma',
          avatarKey: 'ananya',
          course: 'B.Sc / CS Minor',
          role: 'Owner',
          joinedAt: isoAgo(80),
          activeStatus: 'Away',
          canShareResources: true,
          canUseWorkspace: true,
        },
      ],
      activeParticipantIds: [],
      joinRequests: [],
      pomodoro: defaultPomodoro(30, 10, 15),
      notes: [
        {
          id: 'note_aries',
          topic: 'Recovery',
          title: 'ARIES 3-Pass Summary',
          content:
            'Analysis: Reconstructs dirty page table & active transaction table.\nRedo: Repeats history from smallest recLSN.\nUndo: Rolls back loser transactions in reverse LSN order writing CLRs.',
          updatedBy: 'Ananya Verma',
          updatedAt: isoAgo(22),
        },
      ],
      whiteboard: [],
      resources: [],
      tasks: [
        {
          id: 'task_db_1',
          title: 'Dry-run B+ tree order-4 deletion case',
          assigneeName: 'Ananya Verma',
          done: false,
          createdBy: 'stu_ananya',
          createdAt: isoAgo(50),
        },
      ],
      messages: [
        {
          id: 'rmsg_db_1',
          roomId: 'room_dbms_collab',
          senderId: 'stu_ananya',
          senderName: 'Ananya Verma',
          senderRole: 'Owner',
          text: 'Drop any tricky precedence graph or strict 2PL deadlock doubts here!',
          reactions: [],
          isPinned: true,
          createdAt: isoAgo(55),
        },
      ],
      doubts: [
        {
          id: 'dbt_db_open',
          roomId: 'room_dbms_collab',
          title: 'Difference between Cascadeless and Strict schedules?',
          explanation:
            'Why does Strict 2PL prevent dirty writes in addition to dirty reads compared to basic cascadeless schedules?',
          subject: 'CS-304 DBMS',
          topic: 'Concurrency Control',
          authorId: 'stu_ananya',
          authorName: 'Ananya Verma',
          answers: [],
          resolved: false,
          createdAt: isoAgo(18),
        },
      ],
      savedByIds: [],
      visitedByIds: [],
      startedAt: isoAgo(80),
      isDemoRoom: true,
      createdAt: isoAgo(95),
      updatedAt: isoAgo(18),
    },
    {
      id: 'room_gate_upcoming',
      name: 'GATE CS Discrete Math & Probability Revision',
      description:
        'Scheduled problem-solving session covering Bayes theorem, generating functions, and lattice properties.',
      subject: 'Discrete Mathematics',
      courseCategory: 'GATE / Competitive Exams',
      topic: 'Combinatorics & Bayes Theorem',
      coverKey: 'exam',
      rules: 'Arrive with PYQ sheet ready. We will spend 45 mins solving and 15 mins reviewing.',
      privacy: 'Public',
      visibility: 'Listed',
      maxCapacity: 30,
      allowJoinRequests: true,
      hostApprovalRequired: false,
      allowResourceSharing: true,
      enableGroupDiscussion: true,
      enableWorkspace: true,
      studyMode: 'Exam Preparation',
      status: 'Upcoming',
      scheduledStartAt: isoAhead(90),
      durationMinutes: 60,
      breakIntervalMinutes: 10,
      remindersEnabled: true,
      objectives: [
        { id: 'obj_g_1', label: 'Solve 12 previous year GATE combinatorics MCQs', done: false },
        { id: 'obj_g_2', label: 'Compile common probability pitfalls', done: false },
      ],
      instructions:
        'Timed exam-condition solving for the first 40 minutes, followed by collaborative explanation.',
      hostId: 'stu_kabir',
      hostName: 'Kabir Malhotra',
      roomCode: 'KMP-GATE',
      invitation: {
        id: 'inv_gate',
        code: 'KMP-GATE',
        token: 'tok_gate_math',
        createdBy: 'stu_kabir',
        revoked: false,
        createdAt: isoAgo(180),
      },
      participants: [
        {
          userId: 'stu_kabir',
          name: 'Kabir Malhotra',
          avatarKey: 'kabir',
          course: 'M.Sc Applied Mathematics',
          role: 'Owner',
          joinedAt: isoAgo(180),
          activeStatus: 'Away',
          canShareResources: true,
          canUseWorkspace: true,
        },
      ],
      activeParticipantIds: [],
      joinRequests: [],
      pomodoro: defaultPomodoro(45, 10, 15),
      notes: [],
      whiteboard: [],
      resources: [],
      tasks: [],
      messages: [],
      doubts: [],
      savedByIds: [],
      visitedByIds: [],
      isDemoRoom: true,
      createdAt: isoAgo(180),
      updatedAt: isoAgo(180),
    },
    {
      id: 'room_private_raft',
      name: 'Distributed Systems Seminar & Paper Reading',
      description:
        'Invite-only private reading room for Raft consensus invariants and Paxos proofs.',
      subject: 'CS-410 Distributed Systems',
      courseCategory: 'Computer Science & Engineering',
      topic: 'Leader Election & Log Matching Safety',
      coverKey: 'coding',
      rules: 'Private room: requires room code or host approval before workspace access.',
      privacy: 'Private',
      visibility: 'Listed',
      maxCapacity: 8,
      allowJoinRequests: true,
      hostApprovalRequired: true,
      allowResourceSharing: true,
      enableGroupDiscussion: true,
      enableWorkspace: true,
      studyMode: 'Collaborative Learning',
      status: 'Live',
      durationMinutes: 50,
      breakIntervalMinutes: 10,
      remindersEnabled: true,
      objectives: [
        { id: 'obj_p_1', label: 'Verify Raft Section 5.4 election restriction', done: false },
      ],
      instructions: 'Private peer seminar room. Share annotated proofs in Resources.',
      hostId: 'stu_meera',
      hostName: 'Meera Iyer',
      roomCode: 'KMP-PRIV',
      invitation: {
        id: 'inv_priv',
        code: 'KMP-PRIV',
        token: 'tok_priv_raft',
        createdBy: 'stu_meera',
        revoked: false,
        createdAt: isoAgo(60),
      },
      participants: [
        {
          userId: 'stu_meera',
          name: 'Meera Iyer',
          avatarKey: 'meera',
          course: 'B.Com & Systems',
          role: 'Owner',
          joinedAt: isoAgo(60),
          activeStatus: 'Away',
          canShareResources: true,
          canUseWorkspace: true,
        },
      ],
      activeParticipantIds: [],
      joinRequests: [],
      pomodoro: defaultPomodoro(25, 5, 15),
      notes: [],
      whiteboard: [],
      resources: [],
      tasks: [],
      messages: [],
      doubts: [],
      savedByIds: [],
      visitedByIds: [],
      startedAt: isoAgo(60),
      isDemoRoom: true,
      createdAt: isoAgo(60),
      updatedAt: isoAgo(30),
    },
  ];

  return {
    rooms,
    summaries: [],
    blockedByUser: {},
    reports: [],
    files: {},
  };
}

function loadDatabase(): StudyRoomsDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as StudyRoomsDatabase;
      if (parsed && Array.isArray(parsed.rooms)) {
        // Clear stale active sockets on fresh server boot
        parsed.rooms.forEach((r) => {
          r.activeParticipantIds = [];
          r.participants.forEach((p) => {
            p.activeStatus = 'Away';
          });
        });
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return createSeedDatabase();
}

export function registerStudyRoomsBackend(app: Express): WebSocketServer {
  const db: StudyRoomsDatabase = loadDatabase();
  // Map of roomId -> Set of { ws, userId }
  const roomSockets = new Map<string, Set<{ ws: WebSocket; userId: string }>>();
  // Global room listeners (dashboard live updates)
  const allClients = new Set<{ ws: WebSocket; userId: string }>();

  const saveDatabase = () => {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    } catch {
      // ignore disk errors
    }
  };

  const getParticipantRole = (room: StudyRoom, userId: string): RoomRole | null => {
    if (room.hostId === userId) return 'Owner';
    const found = room.participants.find((p) => p.userId === userId);
    return found ? found.role : null;
  };

  const isPrivileged = (role: RoomRole | null) =>
    role === 'Owner' || role === 'Co-host' || role === 'Moderator';

  const isOwnerOrCohost = (role: RoomRole | null) => role === 'Owner' || role === 'Co-host';

  const isMember = (room: StudyRoom, userId: string) =>
    room.hostId === userId || room.participants.some((p) => p.userId === userId);

  const computeEffectivePomodoro = (p: PomodoroState): PomodoroState => {
    if (p.status !== 'running' || !p.lastUpdatedAt) return p;
    const elapsed = Math.floor((Date.now() - new Date(p.lastUpdatedAt).getTime()) / 1000);
    const remaining = Math.max(0, p.remainingSeconds - elapsed);
    return {
      ...p,
      remainingSeconds: remaining,
      status: remaining === 0 ? 'paused' : p.status,
    };
  };

  const sanitizeRoomForUser = (room: StudyRoom, userId: string): StudyRoom => {
    const member = isMember(room, userId);
    const livePomodoro = computeEffectivePomodoro(room.pomodoro);
    const updatedStatus = (() => {
      if (room.status === 'Upcoming' && room.scheduledStartAt) {
        const diffMs = new Date(room.scheduledStartAt).getTime() - Date.now();
        if (diffMs <= 15 * 60_000 && diffMs > 0) return 'Starting Soon';
      }
      return room.status;
    })();

    if (room.privacy === 'Private' && !member) {
      return {
        ...room,
        status: updatedStatus,
        pomodoro: livePomodoro,
        roomCode: 'PRIVATE',
        invitation: { ...room.invitation, code: 'PRIVATE', token: '' },
        notes: [],
        whiteboard: [],
        resources: [],
        tasks: [],
        messages: [],
        doubts: [],
        joinRequests: room.joinRequests.filter((jr) => jr.userId === userId),
      };
    }

    return {
      ...room,
      status: updatedStatus,
      pomodoro: livePomodoro,
    };
  };

  const broadcastRoomEvent = (roomId: string, event: string, payload: unknown) => {
    const subs = roomSockets.get(roomId);
    if (!subs) return;
    const msg = JSON.stringify({ event, roomId, payload });
    subs.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
  };

  const broadcastGlobalRoomUpdate = (room: StudyRoom) => {
    const msg = JSON.stringify({
      event: 'room:meta',
      roomId: room.id,
      payload: {
        roomId: room.id,
        status: room.status,
        activeParticipantIds: room.activeParticipantIds,
        participantsCount: room.participants.length,
        updatedAt: room.updatedAt,
      },
    });
    allClients.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
  };

  const syncActivePresenceForRoom = (roomId: string) => {
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room) return;
    const subs = roomSockets.get(roomId);
    const activeIds = new Set<string>();
    subs?.forEach((c) => activeIds.add(c.userId));
    room.activeParticipantIds = Array.from(activeIds);
    room.participants.forEach((p) => {
      p.activeStatus = activeIds.has(p.userId) ? 'Active' : 'Away';
    });
    broadcastRoomEvent(roomId, 'room:presence', {
      activeParticipantIds: room.activeParticipantIds,
      participants: room.participants,
    });
    broadcastGlobalRoomUpdate(room);
  };

  // WebSocket Hub (/ws/study-rooms)
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/ws/study-rooms', 'http://localhost');
    const userId = url.searchParams.get('userId') || 'usr_22b030149';
    const clientEntry = { ws, userId };
    allClients.add(clientEntry);
    let subscribedRoomId: string | null = null;

    const unsubscribeCurrent = () => {
      if (!subscribedRoomId) return;
      const set = roomSockets.get(subscribedRoomId);
      if (set) {
        set.delete(clientEntry);
        if (set.size === 0) roomSockets.delete(subscribedRoomId);
      }
      const prevId = subscribedRoomId;
      subscribedRoomId = null;
      syncActivePresenceForRoom(prevId);
    };

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(String(data)) as { event: string; roomId?: string };
        if (parsed.event === 'room:subscribe' && parsed.roomId) {
          const room = db.rooms.find((r) => r.id === parsed.roomId);
          if (!room) return;
          if (room.privacy === 'Private' && !isMember(room, userId)) return;
          unsubscribeCurrent();
          subscribedRoomId = room.id;
          if (!roomSockets.has(room.id)) roomSockets.set(room.id, new Set());
          roomSockets.get(room.id)!.add(clientEntry);
          syncActivePresenceForRoom(room.id);
        } else if (parsed.event === 'room:unsubscribe') {
          unsubscribeCurrent();
        } else if (parsed.event === 'ping') {
          ws.send(JSON.stringify({ event: 'pong', payload: { ts: Date.now() } }));
        }
      } catch {
        // ignore malformed frames
      }
    });

    ws.on('close', () => {
      allClients.delete(clientEntry);
      unsubscribeCurrent();
    });
  });

  // 1. Bootstrap Study Rooms workspace
  app.get('/api/study-rooms/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    const blocked = db.blockedByUser[userId] || [];

    const visibleRooms = db.rooms
      .filter((r) => {
        if (blocked.includes(r.hostId)) return false;
        if (r.visibility === 'Unlisted' && !isMember(r, userId)) return false;
        return true;
      })
      .map((r) => sanitizeRoomForUser(r, userId));

    return res.json({
      rooms: visibleRooms,
      summaries: db.summaries,
      blockedUserIds: blocked,
      reports: db.reports.filter((rp) => rp.reporterId === userId),
    });
  });

  // 2. Create or Schedule a Study Room
  app.post('/api/study-rooms', (req: Request, res: Response) => {
    const {
      userId,
      userName,
      userCourse,
      name,
      description,
      subject,
      courseCategory,
      topic,
      coverKey,
      rules,
      privacy,
      visibility,
      maxCapacity,
      allowJoinRequests,
      hostApprovalRequired,
      allowResourceSharing,
      enableGroupDiscussion,
      enableWorkspace,
      studyMode,
      startMode,
      scheduledStartAt,
      durationMinutes,
      breakIntervalMinutes,
      remindersEnabled,
      objectives,
      instructions,
      invitedEmailsOrNames,
    } = req.body as any;

    if (!userId || !name?.trim() || !subject?.trim()) {
      return res.status(400).json({ message: 'Room name and subject are required.' });
    }
    const cap = Math.min(100, Math.max(2, Number(maxCapacity) || 20));
    const dur = Math.min(240, Math.max(10, Number(durationMinutes) || 50));
    const brk = Math.min(30, Math.max(3, Number(breakIntervalMinutes) || 5));

    const nowIso = new Date().toISOString();
    const code = generateRoomCode();
    const token = `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const isScheduled = startMode === 'later' && Boolean(scheduledStartAt);

    const hostParticipant: RoomParticipant = {
      userId,
      name: userName || 'Student Host',
      avatarKey: 'priya',
      course: userCourse || 'KAMPUS Scholar',
      role: 'Owner',
      joinedAt: nowIso,
      activeStatus: 'Away',
      canShareResources: true,
      canUseWorkspace: true,
    };

    const newRoom: StudyRoom = {
      id: `room_${Date.now()}`,
      name: name.trim(),
      description: String(description || '').trim() || `Collaborative ${studyMode || 'Pomodoro Study'} room for ${subject.trim()}.`,
      subject: subject.trim(),
      courseCategory: courseCategory || 'Computer Science & Engineering',
      topic: String(topic || subject).trim(),
      coverKey: coverKey || 'desk',
      rules: String(rules || 'Stay focused, share helpful academic notes, and keep discussions respectful.').trim(),
      privacy: privacy === 'Private' ? 'Private' : 'Public',
      visibility: visibility === 'Unlisted' ? 'Unlisted' : 'Listed',
      maxCapacity: cap,
      allowJoinRequests: allowJoinRequests !== false,
      hostApprovalRequired: Boolean(hostApprovalRequired),
      allowResourceSharing: allowResourceSharing !== false,
      enableGroupDiscussion: enableGroupDiscussion !== false,
      enableWorkspace: enableWorkspace !== false,
      studyMode: studyMode || 'Pomodoro Study',
      status: isScheduled ? 'Upcoming' : 'Live',
      scheduledStartAt: isScheduled ? scheduledStartAt : undefined,
      durationMinutes: dur,
      breakIntervalMinutes: brk,
      remindersEnabled: remindersEnabled !== false,
      objectives: Array.isArray(objectives)
        ? objectives
            .filter((o: any) => String(o?.label || o).trim())
            .map((o: any, i: number) => ({
              id: `obj_${Date.now()}_${i}`,
              label: String(typeof o === 'string' ? o : o.label).trim(),
              done: false,
            }))
        : [],
      instructions:
        String(instructions || '').trim() ||
        'Review the room objectives and synchronize focus blocks with the host.',
      hostId: userId,
      hostName: userName || 'Student Host',
      roomCode: code,
      invitation: {
        id: `inv_${Date.now()}`,
        code,
        token,
        createdBy: userId,
        revoked: false,
        createdAt: nowIso,
      },
      invitedEmailsOrNames: Array.isArray(invitedEmailsOrNames) ? invitedEmailsOrNames : [],
      participants: [hostParticipant],
      activeParticipantIds: [],
      joinRequests: [],
      pomodoro: defaultPomodoro(25, brk, 15),
      notes: [],
      whiteboard: [],
      resources: [],
      tasks: [],
      messages: [],
      doubts: [],
      savedByIds: [userId],
      visitedByIds: [userId],
      startedAt: isScheduled ? undefined : nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.rooms.unshift(newRoom);
    saveDatabase();
    broadcastGlobalRoomUpdate(newRoom);
    return res.json({ room: newRoom });
  });

  // 3. Edit Room Information / Schedule / Cancel
  app.patch('/api/study-rooms/:id', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, ...updates } = req.body as any;
    const role = getParticipantRole(room, userId);
    if (!isOwnerOrCohost(role)) {
      return res.status(403).json({ message: 'Only room owner or co-host can edit room settings.' });
    }

    if (updates.name?.trim()) room.name = updates.name.trim();
    if (updates.description !== undefined) room.description = String(updates.description).trim();
    if (updates.subject?.trim()) room.subject = updates.subject.trim();
    if (updates.topic !== undefined) room.topic = String(updates.topic).trim();
    if (updates.courseCategory) room.courseCategory = updates.courseCategory;
    if (updates.coverKey) room.coverKey = updates.coverKey;
    if (updates.rules !== undefined) room.rules = String(updates.rules).trim();
    if (updates.instructions !== undefined) room.instructions = String(updates.instructions).trim();
    if (updates.privacy === 'Public' || updates.privacy === 'Private') room.privacy = updates.privacy;
    if (updates.visibility === 'Listed' || updates.visibility === 'Unlisted') room.visibility = updates.visibility;
    if (updates.maxCapacity) room.maxCapacity = Math.min(100, Math.max(2, Number(updates.maxCapacity)));
    if (updates.allowJoinRequests !== undefined) room.allowJoinRequests = Boolean(updates.allowJoinRequests);
    if (updates.hostApprovalRequired !== undefined) room.hostApprovalRequired = Boolean(updates.hostApprovalRequired);
    if (updates.allowResourceSharing !== undefined) room.allowResourceSharing = Boolean(updates.allowResourceSharing);
    if (updates.enableGroupDiscussion !== undefined) room.enableGroupDiscussion = Boolean(updates.enableGroupDiscussion);
    if (updates.enableWorkspace !== undefined) room.enableWorkspace = Boolean(updates.enableWorkspace);
    if (updates.studyMode) room.studyMode = updates.studyMode;
    if (updates.scheduledStartAt !== undefined) room.scheduledStartAt = updates.scheduledStartAt;
    if (updates.durationMinutes) room.durationMinutes = Math.min(240, Math.max(10, Number(updates.durationMinutes)));
    if (updates.remindersEnabled !== undefined) room.remindersEnabled = Boolean(updates.remindersEnabled);
    if (updates.status === 'Cancelled' || updates.status === 'Live' || updates.status === 'Upcoming') {
      room.status = updates.status;
    }

    room.updatedAt = new Date().toISOString();
    saveDatabase();
    const safe = sanitizeRoomForUser(room, userId);
    broadcastRoomEvent(room.id, 'room:updated', { room: safe });
    broadcastGlobalRoomUpdate(room);
    return res.json({ room: safe });
  });

  // 4. Join by Room Code or Invitation Token
  app.post('/api/study-rooms/join-code', (req: Request, res: Response) => {
    const { userId, userName, userCourse, codeOrToken } = req.body as any;
    const clean = String(codeOrToken || '').trim();
    if (!userId || !clean) {
      return res.status(400).json({ message: 'Please enter a valid room code or invite link.' });
    }

    const tokenMatch = clean.includes('tok_')
      ? clean.slice(clean.indexOf('tok_')).split(/[&#\s]/)[0]
      : clean;

    const room = db.rooms.find(
      (r) =>
        r.roomCode.toUpperCase() === clean.toUpperCase() ||
        (!r.invitation.revoked &&
          (r.invitation.code.toUpperCase() === clean.toUpperCase() ||
            r.invitation.token === tokenMatch))
    );

    if (!room) {
      return res.status(404).json({ message: 'No active study room matches that code or invite.' });
    }

    if (room.invitation.revoked && room.roomCode.toUpperCase() !== clean.toUpperCase()) {
      return res.status(403).json({ message: 'This room invitation link has been revoked.' });
    }
    if (
      room.invitation.expiresAt &&
      new Date(room.invitation.expiresAt).getTime() < Date.now()
    ) {
      return res.status(403).json({ message: 'This room invitation has expired.' });
    }
    if (room.status === 'Cancelled' || room.status === 'Ended') {
      return res.status(400).json({ message: `This study room session is ${room.status.toLowerCase()}.` });
    }

    if (!isMember(room, userId)) {
      if (room.participants.length >= room.maxCapacity) {
        return res.status(409).json({ message: 'This study room has reached maximum capacity.' });
      }
      room.participants.push({
        userId,
        name: userName || 'Student',
        avatarKey: 'priya',
        course: userCourse || 'KAMPUS Scholar',
        role: 'Participant',
        joinedAt: new Date().toISOString(),
        activeStatus: 'Away',
        canShareResources: room.allowResourceSharing,
        canUseWorkspace: room.enableWorkspace,
      });
    }
    if (!room.visitedByIds.includes(userId)) room.visitedByIds.push(userId);
    room.updatedAt = new Date().toISOString();
    saveDatabase();
    const safe = sanitizeRoomForUser(room, userId);
    broadcastRoomEvent(room.id, 'room:updated', { room: safe });
    return res.json({ room: safe });
  });

  // 5. Join Public Room (or authorized Private Room)
  app.post('/api/study-rooms/:id/join', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, userName, userCourse } = req.body as any;
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const already = isMember(room, userId);
    if (!already) {
      if (room.privacy === 'Private') {
        return res.status(403).json({
          message: 'This is a Private Study Room. Join via room code, invite link, or request approval.',
        });
      }
      if (room.hostApprovalRequired) {
        return res.status(403).json({
          message: 'Host approval is enabled for this room. Please submit a join request.',
        });
      }
      if (room.participants.length >= room.maxCapacity) {
        return res.status(409).json({ message: 'Room has reached maximum participant capacity.' });
      }
      room.participants.push({
        userId,
        name: userName || 'Student',
        avatarKey: 'priya',
        course: userCourse || 'KAMPUS Scholar',
        role: 'Participant',
        joinedAt: new Date().toISOString(),
        activeStatus: 'Away',
        canShareResources: room.allowResourceSharing,
        canUseWorkspace: room.enableWorkspace,
      });
    }
    if (!room.visitedByIds.includes(userId)) room.visitedByIds.push(userId);
    room.updatedAt = new Date().toISOString();
    saveDatabase();
    const safe = sanitizeRoomForUser(room, userId);
    broadcastRoomEvent(room.id, 'room:updated', { room: safe });
    broadcastGlobalRoomUpdate(room);
    return res.json({ room: safe });
  });

  // 6. Request Join & Approve/Reject Join Requests
  app.post('/api/study-rooms/:id/request-join', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, userName, userCourse, message } = req.body as any;
    if (!room.allowJoinRequests) {
      return res.status(403).json({ message: 'This room is not accepting join requests.' });
    }
    if (isMember(room, userId)) {
      return res.json({ room: sanitizeRoomForUser(room, userId) });
    }
    const existing = room.joinRequests.find((jr) => jr.userId === userId && jr.status === 'pending');
    if (existing) {
      return res.status(409).json({ message: 'Your join request is already pending host approval.' });
    }
    room.joinRequests.unshift({
      id: `jr_${Date.now()}`,
      roomId: room.id,
      userId,
      userName: userName || 'Student',
      userCourse: userCourse || 'KAMPUS Scholar',
      avatarKey: 'priya',
      message: String(message || 'Requesting to join study session.').trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:updated', { room });
    return res.json({ room: sanitizeRoomForUser(room, userId) });
  });

  app.post('/api/study-rooms/:id/join-requests/:reqId', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, decision } = req.body as any;
    const role = getParticipantRole(room, userId);
    if (!isPrivileged(role)) {
      return res.status(403).json({ message: 'Only hosts or moderators can review join requests.' });
    }
    const jr = room.joinRequests.find((item) => item.id === req.params.reqId);
    if (!jr) return res.status(404).json({ message: 'Join request not found.' });

    jr.status = decision === 'accept' ? 'accepted' : 'rejected';
    if (decision === 'accept' && !isMember(room, jr.userId)) {
      if (room.participants.length >= room.maxCapacity) {
        return res.status(409).json({ message: 'Room is at maximum capacity.' });
      }
      room.participants.push({
        userId: jr.userId,
        name: jr.userName,
        avatarKey: jr.avatarKey,
        course: jr.userCourse,
        role: 'Participant',
        joinedAt: new Date().toISOString(),
        activeStatus: 'Away',
        canShareResources: room.allowResourceSharing,
        canUseWorkspace: room.enableWorkspace,
      });
    }
    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:updated', { room });
    return res.json({ room, updatedRequest: jr });
  });

  // 7. Leave Room & Save Bookmark
  app.post('/api/study-rooms/:id/leave', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId } = req.body as any;
    room.activeParticipantIds = room.activeParticipantIds.filter((id) => id !== userId);
    if (room.hostId !== userId) {
      room.participants = room.participants.filter((p) => p.userId !== userId);
    }
    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:updated', { room });
    broadcastGlobalRoomUpdate(room);
    return res.json({ ok: true });
  });

  app.post('/api/study-rooms/:id/save', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId } = req.body as any;
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    const exists = room.savedByIds.includes(userId);
    room.savedByIds = exists
      ? room.savedByIds.filter((id) => id !== userId)
      : [...room.savedByIds, userId];
    saveDatabase();
    return res.json({ savedByIds: room.savedByIds });
  });

  // 8. Invitation Link / Code Management
  app.post('/api/study-rooms/:id/invite/regenerate', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, expiresInHours } = req.body as any;
    if (!isOwnerOrCohost(getParticipantRole(room, userId))) {
      return res.status(403).json({ message: 'Host permission required.' });
    }
    const newCode = generateRoomCode();
    const expiresAt =
      expiresInHours && Number(expiresInHours) > 0
        ? new Date(Date.now() + Number(expiresInHours) * 3600_000).toISOString()
        : undefined;
    room.roomCode = newCode;
    room.invitation = {
      id: `inv_${Date.now()}`,
      code: newCode,
      token: `tok_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      createdBy: userId,
      expiresAt,
      revoked: false,
      createdAt: new Date().toISOString(),
    };
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:updated', { room });
    return res.json({ room });
  });

  app.post('/api/study-rooms/:id/invite/revoke', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId } = req.body as any;
    if (!isOwnerOrCohost(getParticipantRole(room, userId))) {
      return res.status(403).json({ message: 'Host permission required.' });
    }
    room.invitation.revoked = true;
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:updated', { room });
    return res.json({ room });
  });

  // 9. Participant Role & Permission Management
  app.patch('/api/study-rooms/:id/participants/:targetUserId', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, action, role, canShareResources, canUseWorkspace } = req.body as any;
    const actorRole = getParticipantRole(room, userId);
    const targetId = req.params.targetUserId;
    const target = room.participants.find((p) => p.userId === targetId);
    if (!target) return res.status(404).json({ message: 'Participant not found.' });

    if (action === 'remove') {
      if (!isPrivileged(actorRole) || target.role === 'Owner') {
        return res.status(403).json({ message: 'Cannot remove this participant.' });
      }
      room.participants = room.participants.filter((p) => p.userId !== targetId);
      room.activeParticipantIds = room.activeParticipantIds.filter((id) => id !== targetId);
    } else if (action === 'setRole') {
      if (actorRole !== 'Owner' && actorRole !== 'Co-host') {
        return res.status(403).json({ message: 'Owner or Co-host required to assign roles.' });
      }
      if (target.role === 'Owner') {
        return res.status(403).json({ message: 'Cannot change room owner role.' });
      }
      target.role = role;
    } else if (action === 'permissions') {
      if (!isPrivileged(actorRole)) {
        return res.status(403).json({ message: 'Host or moderator permission required.' });
      }
      if (canShareResources !== undefined) target.canShareResources = Boolean(canShareResources);
      if (canUseWorkspace !== undefined) target.canUseWorkspace = Boolean(canUseWorkspace);
    }

    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:updated', { room });
    return res.json({ room });
  });

  // 10. Live Session Controls & Authentic Session Summary Generation
  app.post('/api/study-rooms/:id/session', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, action } = req.body as { userId?: string; action?: 'start' | 'pause' | 'resume' | 'end' };
    if (!userId || !isOwnerOrCohost(getParticipantRole(room, userId))) {
      return res.status(403).json({ message: 'Only room owners or co-hosts control session state.' });
    }

    const nowIso = new Date().toISOString();
    let summary: SessionSummaryRecord | undefined;

    if (action === 'start' || action === 'resume') {
      room.status = 'Live';
      if (!room.startedAt) room.startedAt = nowIso;
    } else if (action === 'pause') {
      room.status = 'Paused';
      if (room.pomodoro.status === 'running') {
        room.pomodoro = { ...computeEffectivePomodoro(room.pomodoro), status: 'paused', lastUpdatedAt: nowIso };
      }
    } else if (action === 'end') {
      room.status = 'Ended';
      room.endedAt = nowIso;
      if (room.pomodoro.status === 'running') {
        room.pomodoro = { ...computeEffectivePomodoro(room.pomodoro), status: 'paused', lastUpdatedAt: nowIso };
      }

      const startedMs = room.startedAt ? new Date(room.startedAt).getTime() : new Date(room.createdAt).getTime();
      const recordedDuration = Math.max(1, Math.round((Date.now() - startedMs) / 60_000));
      summary = {
        id: `sum_${Date.now()}`,
        roomId: room.id,
        roomName: room.name,
        subject: room.subject,
        studyMode: room.studyMode,
        sessionDate: nowIso,
        totalDurationMinutes: recordedDuration,
        participantCount: room.participants.length,
        participantNames: room.participants.map((p) => p.name),
        completedFocusSessions: room.pomodoro.completedFocusSessions,
        tasksCompleted: room.tasks.filter((t) => t.done).length,
        totalTasks: room.tasks.length,
        sharedResourcesCount: room.resources.length,
        messagesCount: room.messages.length,
        doubtsResolvedCount: room.doubts.filter((d) => d.resolved).length,
        objectivesCompleted: room.objectives.filter((o) => o.done).length,
        totalObjectives: room.objectives.length,
        discussionHighlights: room.messages
          .filter((m) => m.isPinned || m.isAnnouncement)
          .slice(0, 4)
          .map((m) => m.text),
        createdByUserId: userId,
      };
      db.summaries.unshift(summary);
    }

    room.updatedAt = nowIso;
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:updated', { room });
    broadcastGlobalRoomUpdate(room);
    return res.json({ room, summary });
  });

  // 11. Shared Synchronized Pomodoro Timer Controls
  app.post('/api/study-rooms/:id/pomodoro', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const {
      userId,
      action,
      phase,
      focusMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      autoBreakReminders,
    } = req.body as any;

    if (!userId || !isOwnerOrCohost(getParticipantRole(room, userId))) {
      return res.status(403).json({
        message: 'Only room owners or co-hosts can control the shared Pomodoro timer.',
      });
    }

    const current = computeEffectivePomodoro(room.pomodoro);
    const nowIso = new Date().toISOString();

    const phaseDuration = (ph: PomodoroPhase, st: PomodoroState) => {
      if (ph === 'short-break') return st.shortBreakMinutes * 60;
      if (ph === 'long-break') return st.longBreakMinutes * 60;
      return st.focusMinutes * 60;
    };

    if (action === 'configure') {
      if (focusMinutes) current.focusMinutes = Math.min(90, Math.max(5, Number(focusMinutes)));
      if (shortBreakMinutes) current.shortBreakMinutes = Math.min(30, Math.max(1, Number(shortBreakMinutes)));
      if (longBreakMinutes) current.longBreakMinutes = Math.min(45, Math.max(5, Number(longBreakMinutes)));
      if (autoBreakReminders !== undefined) current.autoBreakReminders = Boolean(autoBreakReminders);
      if (current.status === 'idle') {
        current.remainingSeconds = phaseDuration(current.phase, current);
      }
    } else if (action === 'start') {
      if (current.remainingSeconds <= 0) {
        current.remainingSeconds = phaseDuration(current.phase, current);
      }
      current.status = 'running';
      current.lastUpdatedAt = nowIso;
    } else if (action === 'pause') {
      current.status = 'paused';
      current.lastUpdatedAt = nowIso;
    } else if (action === 'reset') {
      current.status = 'idle';
      current.remainingSeconds = phaseDuration(current.phase, current);
      current.lastUpdatedAt = nowIso;
    } else if (action === 'switch-phase' && phase) {
      current.phase = phase;
      current.status = 'idle';
      current.remainingSeconds = phaseDuration(phase, current);
      current.lastUpdatedAt = nowIso;
    } else if (action === 'complete-cycle') {
      if (current.phase === 'focus') {
        current.completedFocusSessions += 1;
        const nextPhase: PomodoroPhase =
          current.completedFocusSessions % 4 === 0 ? 'long-break' : 'short-break';
        current.phase = nextPhase;
        current.remainingSeconds = phaseDuration(nextPhase, current);
      } else {
        current.phase = 'focus';
        current.remainingSeconds = phaseDuration('focus', current);
      }
      current.status = 'idle';
      current.lastUpdatedAt = nowIso;
    }

    room.pomodoro = current;
    room.updatedAt = nowIso;
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:pomodoro', { pomodoro: current });
    return res.json({ pomodoro: current });
  });

  // 12. Objectives
  app.post('/api/study-rooms/:id/objectives', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, action, objectiveId, label } = req.body as any;
    if (!isMember(room, userId)) return res.status(403).json({ message: 'Join room first.' });

    if (action === 'add' && label?.trim()) {
      room.objectives.push({ id: `obj_${Date.now()}`, label: label.trim(), done: false });
    } else if (action === 'toggle' && objectiveId) {
      room.objectives = room.objectives.map((o) =>
        o.id === objectiveId ? { ...o, done: !o.done } : o
      );
    }
    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:updated', { room });
    return res.json({ objectives: room.objectives });
  });

  // 13. Shared Notes
  app.post('/api/study-rooms/:id/notes', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, userName, action, noteId, topic, title, content } = req.body as any;
    const participant = room.participants.find((p) => p.userId === userId);
    if (!isMember(room, userId) || (participant && !participant.canUseWorkspace && !isPrivileged(participant.role))) {
      return res.status(403).json({ message: 'Workspace permission required.' });
    }

    if (action === 'delete' && noteId) {
      room.notes = room.notes.filter((n) => n.id !== noteId);
    } else if (title?.trim() || content?.trim()) {
      const nowIso = new Date().toISOString();
      if (noteId && room.notes.some((n) => n.id === noteId)) {
        room.notes = room.notes.map((n) =>
          n.id === noteId
            ? {
                ...n,
                topic: String(topic || n.topic).trim(),
                title: String(title || n.title).trim(),
                content: String(content ?? n.content),
                updatedBy: userName || 'Student',
                updatedAt: nowIso,
              }
            : n
        );
      } else {
        const created: SharedNoteItem = {
          id: `note_${Date.now()}`,
          topic: String(topic || room.topic || 'General').trim(),
          title: String(title || 'Untitled Note').trim(),
          content: String(content || ''),
          updatedBy: userName || 'Student',
          updatedAt: nowIso,
        };
        room.notes.unshift(created);
      }
    }

    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:notes', { notes: room.notes });
    return res.json({ notes: room.notes });
  });

  // 14. Shared Whiteboard
  app.post('/api/study-rooms/:id/whiteboard', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, action, element } = req.body as {
      userId: string;
      action: 'add' | 'undo' | 'clear';
      element?: WhiteboardElement;
    };
    const participant = room.participants.find((p) => p.userId === userId);
    if (!isMember(room, userId) || (participant && !participant.canUseWorkspace && !isPrivileged(participant.role))) {
      return res.status(403).json({ message: 'Whiteboard permission required.' });
    }

    if (action === 'add' && element) {
      room.whiteboard.push(element);
    } else if (action === 'undo') {
      const idx = [...room.whiteboard]
        .reverse()
        .findIndex((el) => el.authorId === userId || isPrivileged(getParticipantRole(room, userId)));
      if (idx !== -1) {
        const actualIdx = room.whiteboard.length - 1 - idx;
        room.whiteboard.splice(actualIdx, 1);
      }
    } else if (action === 'clear') {
      if (!isPrivileged(getParticipantRole(room, userId)) && room.whiteboard.length > 0) {
        // Non-mods clear only their own drawings; hosts/mods clear all
        room.whiteboard = room.whiteboard.filter((el) => el.authorId !== userId);
      } else {
        room.whiteboard = [];
      }
    }

    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:whiteboard', { whiteboard: room.whiteboard });
    return res.json({ whiteboard: room.whiteboard });
  });

  // 15. File Upload & Retrieval (<= 5 MB)
  app.post('/api/study-rooms/upload', (req: Request, res: Response) => {
    const { userId, roomId, fileName, mimeType, base64Data, kind } = req.body as any;
    if (!userId || !fileName || !base64Data) {
      return res.status(400).json({ message: 'Invalid file upload request.' });
    }
    const cleanBase64 = String(base64Data).includes(',')
      ? String(base64Data).split(',')[1]
      : String(base64Data);
    const approxBytes = Math.floor((cleanBase64.length * 3) / 4);
    if (approxBytes <= 0 || approxBytes > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ message: 'File exceeds the 5 MB size limit or is empty.' });
    }
    const fileId = `srfile_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    db.files[fileId] = {
      fileId,
      ownerId: userId,
      roomId,
      fileName: path.basename(fileName),
      mimeType: mimeType || 'application/octet-stream',
      sizeBytes: approxBytes,
      kind: kind === 'image' ? 'image' : 'document',
      base64Data: cleanBase64,
      createdAt: new Date().toISOString(),
    };
    saveDatabase();
    return res.json({
      file: {
        fileId,
        fileName: db.files[fileId].fileName,
        mimeType: db.files[fileId].mimeType,
        sizeBytes: approxBytes,
        url: `/api/study-rooms/files/${fileId}`,
        kind: db.files[fileId].kind,
      },
    });
  });

  app.get('/api/study-rooms/files/:fileId', (req: Request, res: Response) => {
    const stored = db.files[req.params.fileId];
    if (!stored) return res.status(404).json({ message: 'File not found.' });
    const buf = Buffer.from(stored.base64Data, 'base64');
    res.setHeader('Content-Type', stored.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${stored.fileName}"`);
    return res.send(buf);
  });

  // 16. Shared Resources
  app.post('/api/study-rooms/:id/resources', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, userName, action, resourceId, kind, title, url, fileName, sizeBytes } = req.body as any;
    const participant = room.participants.find((p) => p.userId === userId);
    if (!isMember(room, userId)) return res.status(403).json({ message: 'Join room first.' });

    if (action === 'delete' && resourceId) {
      const target = room.resources.find((r) => r.id === resourceId);
      if (target && (target.sharedById === userId || isPrivileged(getParticipantRole(room, userId)))) {
        room.resources = room.resources.filter((r) => r.id !== resourceId);
      }
    } else {
      if (!room.allowResourceSharing && !isPrivileged(getParticipantRole(room, userId))) {
        return res.status(403).json({ message: 'Resource sharing is restricted to hosts in this room.' });
      }
      if (participant && !participant.canShareResources && !isPrivileged(participant.role)) {
        return res.status(403).json({ message: 'Your resource sharing permission is disabled.' });
      }
      if (!title?.trim() || !url?.trim()) {
        return res.status(400).json({ message: 'Resource title and URL/file are required.' });
      }
      const created: RoomResource = {
        id: `res_${Date.now()}`,
        kind: kind || 'Link',
        title: title.trim(),
        url: url.trim(),
        fileName,
        sizeBytes,
        sharedBy: userName || 'Student',
        sharedById: userId,
        createdAt: new Date().toISOString(),
      };
      room.resources.unshift(created);
    }

    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:resources', { resources: room.resources });
    return res.json({ resources: room.resources });
  });

  // 17. Task Board
  app.post('/api/study-rooms/:id/tasks', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, action, taskId, title, assigneeName } = req.body as any;
    if (!isMember(room, userId)) return res.status(403).json({ message: 'Join room first.' });

    if (action === 'add' && title?.trim()) {
      const created: RoomTask = {
        id: `task_${Date.now()}`,
        title: title.trim(),
        assigneeName: assigneeName || 'Room Group',
        done: false,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      };
      room.tasks.push(created);
    } else if (action === 'toggle' && taskId) {
      room.tasks = room.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
    } else if (action === 'delete' && taskId) {
      room.tasks = room.tasks.filter((t) => t.id !== taskId);
    }

    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:tasks', { tasks: room.tasks });
    return res.json({ tasks: room.tasks });
  });

  // 18. Room Discussion Messages
  app.post('/api/study-rooms/:id/messages', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, userName, text, replyToId, attachment, isAnnouncement } = req.body as any;
    if (!isMember(room, userId)) return res.status(403).json({ message: 'Join room first.' });
    if (!room.enableGroupDiscussion && !isPrivileged(getParticipantRole(room, userId))) {
      return res.status(403).json({ message: 'Discussion is currently disabled by host.' });
    }
    if (!String(text || '').trim() && !attachment) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const role = getParticipantRole(room, userId) || 'Participant';
    const replyTarget = replyToId ? room.messages.find((m) => m.id === replyToId) : undefined;
    const created: RoomMessage = {
      id: `rmsg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      roomId: room.id,
      senderId: userId,
      senderName: userName || 'Student',
      senderRole: role,
      text: String(text || '').trim() || (attachment ? `Shared ${attachment.fileName}` : ''),
      replyToId,
      replyPreview: replyTarget
        ? { senderName: replyTarget.senderName, text: replyTarget.text }
        : undefined,
      attachment,
      reactions: [],
      isAnnouncement: Boolean(isAnnouncement) && isPrivileged(role),
      createdAt: new Date().toISOString(),
    };

    room.messages.push(created);
    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:messages', { messages: room.messages });
    return res.json({ message: created, messages: room.messages });
  });

  app.post('/api/study-rooms/:id/messages/:msgId/react', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, emoji } = req.body as any;
    const msg = room.messages.find((m) => m.id === req.params.msgId);
    if (!msg || !emoji) return res.status(404).json({ message: 'Message not found.' });

    const existing = msg.reactions.find((r) => r.emoji === emoji);
    if (existing) {
      if (existing.userIds.includes(userId)) {
        existing.userIds = existing.userIds.filter((id) => id !== userId);
        if (existing.userIds.length === 0) {
          msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existing.userIds.push(userId);
      }
    } else {
      msg.reactions.push({ emoji, userIds: [userId] });
    }
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:messages', { messages: room.messages });
    return res.json({ messages: room.messages });
  });

  app.post('/api/study-rooms/:id/messages/:msgId/pin', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId } = req.body as any;
    if (!isPrivileged(getParticipantRole(room, userId))) {
      return res.status(403).json({ message: 'Host or moderator permission required to pin.' });
    }
    const msg = room.messages.find((m) => m.id === req.params.msgId);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });
    msg.isPinned = !msg.isPinned;
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:messages', { messages: room.messages });
    return res.json({ messages: room.messages });
  });

  app.delete('/api/study-rooms/:id/messages/:msgId', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const userId = String(req.query.userId || '');
    const msg = room.messages.find((m) => m.id === req.params.msgId);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });
    if (msg.senderId !== userId && !isPrivileged(getParticipantRole(room, userId))) {
      return res.status(403).json({ message: 'Cannot delete another participant message.' });
    }
    room.messages = room.messages.filter((m) => m.id !== msg.id);
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:messages', { messages: room.messages });
    return res.json({ messages: room.messages });
  });

  // 19. Dedicated Doubt Board
  app.post('/api/study-rooms/:id/doubts', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, userName, title, explanation, subject, topic, attachment } = req.body as any;
    if (!isMember(room, userId)) return res.status(403).json({ message: 'Join room first.' });
    if (!title?.trim()) return res.status(400).json({ message: 'Doubt title is required.' });

    const created: RoomDoubt = {
      id: `dbt_${Date.now()}`,
      roomId: room.id,
      title: title.trim(),
      explanation: String(explanation || '').trim(),
      subject: String(subject || room.subject).trim(),
      topic: String(topic || room.topic).trim(),
      attachment,
      authorId: userId,
      authorName: userName || 'Student',
      answers: [],
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    room.doubts.unshift(created);
    room.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:doubts', { doubts: room.doubts });
    return res.json({ doubts: room.doubts });
  });

  app.post('/api/study-rooms/:id/doubts/:doubtId/answer', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId, userName, text } = req.body as any;
    if (!isMember(room, userId) || !text?.trim()) {
      return res.status(400).json({ message: 'Valid answer required.' });
    }
    const doubt = room.doubts.find((d) => d.id === req.params.doubtId);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found.' });
    doubt.answers.push({
      id: `dans_${Date.now()}`,
      authorId: userId,
      authorName: userName || 'Student',
      text: text.trim(),
      createdAt: new Date().toISOString(),
    });
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:doubts', { doubts: room.doubts });
    return res.json({ doubts: room.doubts });
  });

  app.post('/api/study-rooms/:id/doubts/:doubtId/resolve', (req: Request, res: Response) => {
    const room = db.rooms.find((r) => r.id === req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    const { userId } = req.body as any;
    const doubt = room.doubts.find((d) => d.id === req.params.doubtId);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found.' });
    if (doubt.authorId !== userId && !isPrivileged(getParticipantRole(room, userId))) {
      return res.status(403).json({ message: 'Only the asker or moderators can mark resolved.' });
    }
    doubt.resolved = !doubt.resolved;
    saveDatabase();
    broadcastRoomEvent(room.id, 'room:doubts', { doubts: room.doubts });
    return res.json({ doubts: room.doubts });
  });

  // 20. Safety Block & Report
  app.post('/api/study-rooms/safety/block', (req: Request, res: Response) => {
    const { userId, targetUserId } = req.body as any;
    if (!userId || !targetUserId) return res.status(400).json({ message: 'Invalid block request.' });
    const existing = db.blockedByUser[userId] || [];
    db.blockedByUser[userId] = existing.includes(targetUserId)
      ? existing.filter((id) => id !== targetUserId)
      : [...existing, targetUserId];
    saveDatabase();
    return res.json({ blockedUserIds: db.blockedByUser[userId] });
  });

  app.post('/api/study-rooms/safety/report', (req: Request, res: Response) => {
    const { reporterId, roomId, targetType, targetId, targetSummary, reason, details } = req.body as any;
    if (!reporterId || !targetId || !reason) {
      return res.status(400).json({ message: 'Incomplete safety report.' });
    }
    const report: StudyRoomsReport = {
      id: `sr_rep_${Date.now()}`,
      reporterId,
      roomId: roomId || '',
      targetType: targetType || 'room',
      targetId,
      targetSummary: String(targetSummary || '').slice(0, 120),
      reason,
      details: String(details || '').trim(),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(report);
    saveDatabase();
    return res.json({ report });
  });

  return wss;
}
