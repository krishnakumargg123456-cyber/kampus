import type { Express, Request, Response } from 'express';
import type { Server as HttpServer } from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { ModuleStorage } from '../database/moduleStorage.ts';
import type {
  ChatAttachmentMeta,
  ChatConversation,
  ChatMessage,
  ChatSafetyReport,
  ChatUserSettings,
  GroupMember,
  GroupRole,
  MessageRequest,
  PresenceInfo,
  PublicChatStudent,
} from '../src/types/chat.ts';

interface StoredFile {
  fileId: string;
  ownerId: string;
  conversationId?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'document' | 'audio';
  base64Data: string;
  createdAt: string;
}

interface ChatDatabase {
  students: PublicChatStudent[];
  conversations: ChatConversation[];
  messages: ChatMessage[];
  requests: MessageRequest[];
  blockedByUser: Record<string, string[]>;
  settingsByUser: Record<string, ChatUserSettings>;
  reports: ChatSafetyReport[];
  files: Record<string, StoredFile>;
  lastSeenByUser: Record<string, string>;
  seededUserIds?: string[];
}

const DB_PATH = path.resolve(process.cwd(), '.kampus_chat_db.json');
const MAX_CHAT_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const DEFAULT_USER_SETTINGS: ChatUserSettings = {
  whoCanMessage: 'everyone',
  showOnlineStatus: true,
  showLastSeen: true,
  sendReadReceipts: true,
  messageAlerts: true,
  groupAlerts: true,
  autoDownloadMedia: true,
  compactMode: false,
};

function createSeedDatabase(): ChatDatabase {
  const now = Date.now();
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();

  const students: PublicChatStudent[] = [
    {
      id: 'stu_aditya',
      name: 'Aditya Sharma',
      avatarKey: 'aditya',
      course: 'B.Tech Computer Science',
      semester: 'Sem 6',
      college: 'Delhi Technological University',
      relationship: 'Study Partner',
      sharedInterests: ['Algorithms', 'Distributed Systems', 'GATE CS'],
      allowMessagesFrom: 'everyone',
      isDemoUser: true,
    },
    {
      id: 'stu_ananya',
      name: 'Ananya Verma',
      avatarKey: 'ananya',
      course: 'B.Sc / Biology & Research',
      semester: 'Year 2',
      college: 'Delhi University',
      relationship: 'Following',
      sharedInterests: ['Academic Writing', 'Flashcards', 'Pomodoro Sprints'],
      allowMessagesFrom: 'everyone',
      isDemoUser: true,
    },
    {
      id: 'stu_rohan',
      name: 'Rohan Kulkarni',
      avatarKey: 'rohan',
      course: 'B.Tech Electronics & Comm.',
      semester: 'Sem 5',
      college: 'NIT Surathkal',
      relationship: 'Group Member',
      sharedInterests: ['Tree DP', 'Linear Algebra', 'Mock Tests'],
      allowMessagesFrom: 'everyone',
      isDemoUser: true,
    },
    {
      id: 'stu_meera',
      name: 'Meera Iyer',
      avatarKey: 'meera',
      course: 'B.Com (Hons) & UI Design',
      semester: 'Sem 4',
      college: 'SRCC Delhi University',
      relationship: 'Recent Contact',
      sharedInterests: ['UI Systems', 'Case Studies', 'Product'],
      allowMessagesFrom: 'study-partners',
      isDemoUser: true,
    },
    {
      id: 'stu_kabir',
      name: 'Kabir Malhotra',
      avatarKey: 'kabir',
      course: 'M.Sc Applied Mathematics',
      semester: 'Sem 2',
      college: 'IIT Roorkee',
      relationship: 'Suggested',
      sharedInterests: ['Probability', 'Graph Theory', 'LaTeX'],
      allowMessagesFrom: 'everyone',
      isDemoUser: true,
    },
  ];

  const conversations: ChatConversation[] = [
    {
      id: 'conv_cs302_group',
      type: 'group',
      title: 'CS-302 Graph Theory Study Group',
      description: 'Weekly problem-solving sprints, tree decomposition proofs, and lab viva prep.',
      category: 'Study Group',
      avatarKey: 'collab',
      participantIds: ['usr_22b030149', 'stu_aditya', 'stu_rohan', 'stu_kabir'],
      members: [
        { userId: 'usr_22b030149', role: 'Owner', joinedAt: iso(2880) },
        { userId: 'stu_aditya', role: 'Admin', joinedAt: iso(2870) },
        { userId: 'stu_rohan', role: 'Member', joinedAt: iso(2800) },
        { userId: 'stu_kabir', role: 'Member', joinedAt: iso(2500) },
      ],
      onlyAdminsCanPost: false,
      onlyAdminsCanInvite: false,
      isDemoConversation: true,
      createdAt: iso(2880),
      updatedAt: iso(18),
      lastMessagePreview: 'Aditya: Did anyone solve problem 4 on tree decomposition?',
      lastMessageAt: iso(18),
      userPrefs: {
        usr_22b030149: { pinned: true, muted: false, archived: false, markedUnread: false },
      },
    },
    {
      id: 'conv_aditya_dm',
      type: 'direct',
      participantIds: ['usr_22b030149', 'stu_aditya'],
      isDemoConversation: true,
      createdAt: iso(1440),
      updatedAt: iso(45),
      lastMessagePreview: 'Let’s meet at the Central Library Hall at 5 PM.',
      lastMessageAt: iso(45),
      userPrefs: {
        usr_22b030149: { pinned: false, muted: false, archived: false, markedUnread: false },
      },
    },
    {
      id: 'conv_exam_sprint',
      type: 'group',
      title: 'Mid-Sem OS & DBMS Revision Squad',
      description: 'Sharing crisp PYQs, Banker’s Algorithm dry-runs, and timed quiz goals.',
      category: 'Exam Preparation',
      avatarKey: 'exam',
      participantIds: ['usr_22b030149', 'stu_ananya', 'stu_rohan'],
      members: [
        { userId: 'stu_ananya', role: 'Owner', joinedAt: iso(4320) },
        { userId: 'usr_22b030149', role: 'Member', joinedAt: iso(4200) },
        { userId: 'stu_rohan', role: 'Member', joinedAt: iso(4100) },
      ],
      onlyAdminsCanPost: false,
      onlyAdminsCanInvite: false,
      isDemoConversation: true,
      createdAt: iso(4320),
      updatedAt: iso(320),
      lastMessagePreview: 'Shared OS Normalization & Deadlocks revision guide.',
      lastMessageAt: iso(320),
      userPrefs: {
        usr_22b030149: { pinned: false, muted: false, archived: false, markedUnread: false },
      },
    },
  ];

  const messages: ChatMessage[] = [
    {
      id: 'msg_demo_1',
      conversationId: 'conv_cs302_group',
      senderId: 'stu_rohan',
      senderName: 'Rohan Kulkarni',
      kind: 'text',
      text: 'Hey team, did anyone review the lecture slides on treewidth and DP on trees?',
      createdAt: iso(95),
      isPinned: true,
      reactions: [{ emoji: '👍', userIds: ['usr_22b030149', 'stu_aditya'] }],
      readByIds: ['usr_22b030149', 'stu_aditya', 'stu_rohan'],
      status: 'read',
    },
    {
      id: 'msg_demo_2',
      conversationId: 'conv_cs302_group',
      senderId: 'usr_22b030149',
      senderName: 'Priya Sharma',
      kind: 'study-resource',
      text: 'Shared a study resource from Notes Exchange.',
      createdAt: iso(62),
      reactions: [{ emoji: '🔥', userIds: ['stu_rohan'] }],
      readByIds: ['usr_22b030149', 'stu_aditya', 'stu_rohan'],
      status: 'read',
      studyResource: {
        sourceModule: 'Notes Exchange',
        resourceType: 'Notes',
        title: 'DP on Trees & Subtree Rerooting Notes',
        subject: 'Algorithms (CS-302)',
        summary: 'Annotated recurrence proofs and O(V) rerooting template for Problem Set 4.',
        route: '/learn/notes-exchange',
      },
    },
    {
      id: 'msg_demo_3',
      conversationId: 'conv_cs302_group',
      senderId: 'stu_aditya',
      senderName: 'Aditya Sharma',
      kind: 'text',
      text: 'Did anyone solve problem 4 on tree decomposition?',
      createdAt: iso(18),
      reactions: [],
      readByIds: ['stu_aditya'],
      status: 'delivered',
    },
    {
      id: 'msg_demo_4',
      conversationId: 'conv_aditya_dm',
      senderId: 'stu_aditya',
      senderName: 'Aditya Sharma',
      kind: 'text',
      text: 'Hey Priya, do you have time to cross-check the Raft consensus proofs before tomorrow’s lab viva?',
      createdAt: iso(80),
      reactions: [],
      readByIds: ['usr_22b030149', 'stu_aditya'],
      status: 'read',
    },
    {
      id: 'msg_demo_5',
      conversationId: 'conv_aditya_dm',
      senderId: 'usr_22b030149',
      senderName: 'Priya Sharma',
      kind: 'text',
      text: 'Definitely! I will be free right after our 4 PM Software Engineering lecture.',
      createdAt: iso(60),
      reactions: [],
      readByIds: ['usr_22b030149', 'stu_aditya'],
      status: 'read',
    },
    {
      id: 'msg_demo_6',
      conversationId: 'conv_aditya_dm',
      senderId: 'stu_aditya',
      senderName: 'Aditya Sharma',
      kind: 'text',
      text: 'Let’s meet at the Central Library Hall at 5 PM.',
      createdAt: iso(45),
      reactions: [{ emoji: '👍', userIds: ['usr_22b030149'] }],
      readByIds: ['usr_22b030149', 'stu_aditya'],
      status: 'read',
    },
    {
      id: 'msg_demo_7',
      conversationId: 'conv_exam_sprint',
      senderId: 'stu_ananya',
      senderName: 'Ananya Verma',
      kind: 'study-session',
      text: 'Scheduled an exam revision sprint session.',
      createdAt: iso(320),
      isAnnouncement: true,
      reactions: [],
      readByIds: ['usr_22b030149', 'stu_ananya'],
      status: 'read',
      studySession: {
        sessionId: 'sess_os_sprint',
        title: 'OS Deadlocks & B+ Tree Sprint',
        subject: 'Operating Systems & DBMS',
        date: 'Tomorrow',
        time: '6:30 PM IST',
        durationMinutes: 50,
        objective: 'Solve 3 Banker Algorithm problems and review B+ tree split rules.',
        acceptedByIds: ['stu_ananya'],
      },
    },
  ];

  const requests: MessageRequest[] = [
    {
      id: 'req_demo_kabir',
      fromUserId: 'stu_kabir',
      fromName: 'Kabir Malhotra',
      fromAvatarKey: 'kabir',
      fromCourse: 'M.Sc Applied Mathematics',
      toUserId: 'usr_22b030149',
      toName: 'Priya Sharma',
      messagePreview: 'Hi Priya! Saw your graph algorithms notes — want to collaborate on our discrete math sheet?',
      sharedInterests: ['Graph Theory', 'Algorithms'],
      status: 'pending',
      createdAt: iso(130),
    },
  ];

  return {
    students,
    conversations,
    messages,
    requests,
    blockedByUser: {},
    settingsByUser: {
      usr_22b030149: { ...DEFAULT_USER_SETTINGS },
    },
    reports: [],
    files: {},
    lastSeenByUser: {
      stu_aditya: iso(12),
      stu_ananya: iso(45),
      stu_rohan: iso(30),
      stu_meera: iso(180),
      stu_kabir: iso(90),
    },
    seededUserIds: ['usr_22b030149'],
  };
}

const chatStorage = new ModuleStorage<ChatDatabase>(
  'chat',
  DB_PATH,
  () => createSeedDatabase()
);

function loadDatabase(): ChatDatabase {
  return chatStorage.get();
}

export function registerChatBackend(app: Express): WebSocketServer {
  const db: ChatDatabase = loadDatabase();
  const socketsByUser = new Map<string, Set<WebSocket>>();

  const saveDatabase = () => {
    chatStorage.saveSync(db);
  };

  const getUserSettings = (userId: string): ChatUserSettings => {
    if (!db.settingsByUser[userId]) {
      db.settingsByUser[userId] = { ...DEFAULT_USER_SETTINGS };
    }
    return db.settingsByUser[userId];
  };

  const getBlockedList = (userId: string): string[] => db.blockedByUser[userId] || [];

  const sendWsToUser = (userId: string, event: string, payload: unknown) => {
    const clients = socketsByUser.get(userId);
    if (!clients) return;
    const raw = JSON.stringify({ event, payload });
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(raw);
      }
    });
  };

  const broadcastToConversation = (conv: ChatConversation, event: string, payload: unknown) => {
    conv.participantIds.forEach((uid) => sendWsToUser(uid, event, payload));
  };

  const buildPresenceSnapshot = (viewerId: string): Record<string, PresenceInfo> => {
    const out: Record<string, PresenceInfo> = {};
    const viewerSettings = getUserSettings(viewerId);
    const knownIds = new Set<string>([
      ...db.students.map((s) => s.id),
      ...Array.from(socketsByUser.keys()),
    ]);
    knownIds.forEach((uid) => {
      const targetSettings = getUserSettings(uid);
      const isOnline =
        (socketsByUser.get(uid)?.size || 0) > 0 &&
        targetSettings.showOnlineStatus &&
        viewerSettings.showOnlineStatus;
      out[uid] = {
        userId: uid,
        online: isOnline,
        lastSeen:
          targetSettings.showLastSeen && viewerSettings.showLastSeen
            ? db.lastSeenByUser[uid]
            : undefined,
      };
    });
    return out;
  };

  const broadcastPresence = () => {
    Array.from(socketsByUser.keys()).forEach((uid) => {
      sendWsToUser(uid, 'presence:update', buildPresenceSnapshot(uid));
    });
  };

  // WebSocket hub routed via central upgrade handler at /ws/chat
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/ws/chat', 'http://localhost');
    const userId = url.searchParams.get('userId') || 'usr_22b030149';

    if (!socketsByUser.has(userId)) {
      socketsByUser.set(userId, new Set());
    }
    socketsByUser.get(userId)!.add(ws);
    broadcastPresence();

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(String(data)) as { event: string; payload: any };
        if (parsed.event === 'typing:start' || parsed.event === 'typing:stop') {
          const { conversationId, userName } = parsed.payload || {};
          const conv = db.conversations.find(
            (c) => c.id === conversationId && c.participantIds.includes(userId)
          );
          if (conv) {
            conv.participantIds
              .filter((pid) => pid !== userId)
              .forEach((pid) =>
                sendWsToUser(pid, parsed.event, { conversationId, userId, userName })
              );
          }
        } else if (parsed.event === 'ping') {
          ws.send(JSON.stringify({ event: 'pong', payload: { ts: Date.now() } }));
        }
      } catch {
        // ignore malformed frames
      }
    });

    ws.on('close', () => {
      const set = socketsByUser.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          socketsByUser.delete(userId);
          db.lastSeenByUser[userId] = new Date().toISOString();
        }
      }
      broadcastPresence();
    });
  });

  // Helper: ensure user is an active participant
  const findAuthorizedConversation = (convId: string, userId: string): ChatConversation | null => {
    const conv = db.conversations.find((c) => c.id === convId);
    if (!conv || !conv.participantIds.includes(userId)) return null;
    return conv;
  };

  const getGroupRole = (conv: ChatConversation, userId: string): GroupRole | null => {
    const member = conv.members?.find((m) => m.userId === userId);
    return member ? member.role : null;
  };

  const ensureUserSeeded = (userId: string, userName?: string) => {
    if (!Array.isArray(db.seededUserIds)) {
      db.seededUserIds = ['usr_22b030149'];
    }
    if (db.seededUserIds.includes(userId)) return;

    const nowIso = new Date().toISOString();
    const firstName = (userName || 'there').trim().split(/\s+/)[0];

    ['conv_cs302_group', 'conv_exam_sprint'].forEach((gid) => {
      const grp = db.conversations.find((c) => c.id === gid);
      if (grp) {
        if (!grp.participantIds.includes(userId)) grp.participantIds.push(userId);
        grp.members = grp.members || [];
        if (!grp.members.some((m) => m.userId === userId)) {
          grp.members.push({ userId, role: 'Member', joinedAt: nowIso });
        }
        if (!grp.userPrefs[userId]) {
          grp.userPrefs[userId] = { pinned: false, muted: false, archived: false, markedUnread: false };
        }
      }
    });

    const hasAdityaDm = db.conversations.some(
      (c) =>
        c.type === 'direct' &&
        c.participantIds.includes(userId) &&
        c.participantIds.includes('stu_aditya')
    );
    if (!hasAdityaDm) {
      const dmId = `conv_dm_${userId}_aditya`;
      const t1 = new Date(Date.now() - 42 * 60_000).toISOString();
      const t2 = new Date(Date.now() - 15 * 60_000).toISOString();
      db.conversations.unshift({
        id: dmId,
        type: 'direct',
        participantIds: [userId, 'stu_aditya'],
        isDemoConversation: true,
        createdAt: t1,
        updatedAt: t2,
        lastMessagePreview: 'Let’s meet at the Central Library Hall at 5 PM.',
        lastMessageAt: t2,
        userPrefs: {
          [userId]: { pinned: false, muted: false, archived: false, markedUnread: true },
        },
      });
      db.messages.push(
        {
          id: `msg_seed_${userId}_1`,
          conversationId: dmId,
          senderId: 'stu_aditya',
          senderName: 'Aditya Sharma',
          kind: 'text',
          text: `Hey ${firstName}! Do you want to cross-check our CS-302 lab viva notes together?`,
          createdAt: t1,
          reactions: [],
          readByIds: ['stu_aditya'],
          status: 'delivered',
        },
        {
          id: `msg_seed_${userId}_2`,
          conversationId: dmId,
          senderId: 'stu_aditya',
          senderName: 'Aditya Sharma',
          kind: 'text',
          text: 'Let’s meet at the Central Library Hall at 5 PM.',
          createdAt: t2,
          reactions: [],
          readByIds: ['stu_aditya'],
          status: 'delivered',
        }
      );
    }

    const hasKabirReq = db.requests.some(
      (r) => r.toUserId === userId && r.fromUserId === 'stu_kabir'
    );
    if (!hasKabirReq) {
      db.requests.unshift({
        id: `req_seed_${userId}_kabir`,
        fromUserId: 'stu_kabir',
        fromName: 'Kabir Malhotra',
        fromAvatarKey: 'kabir',
        fromCourse: 'M.Sc Applied Mathematics',
        toUserId: userId,
        toName: userName || 'Student',
        messagePreview: `Hi ${firstName}! Saw your graph algorithms study focus — want to collaborate on our discrete math problem set?`,
        sharedInterests: ['Graph Theory', 'Algorithms'],
        status: 'pending',
        createdAt: new Date(Date.now() - 90 * 60_000).toISOString(),
      });
    }

    db.seededUserIds.push(userId);
    saveDatabase();
  };

  // 1. Bootstrap full authorized workspace state
  app.get('/api/chat/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    const userName = String(req.query.userName || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    ensureUserSeeded(userId, userName);

    const blocked = getBlockedList(userId);
    const authorizedConvs = db.conversations.filter((c) => {
      if (!c.participantIds.includes(userId)) return false;
      const prefs = c.userPrefs[userId];
      if (prefs?.deletedLocally) return false;
      return true;
    });

    const messagesByConv: Record<string, ChatMessage[]> = {};
    const hasMoreByConv: Record<string, boolean> = {};

    authorizedConvs.forEach((conv) => {
      const clearedIso = conv.userPrefs[userId]?.clearedBeforeIso;
      const all = db.messages.filter((m) => {
        if (m.conversationId !== conv.id) return false;
        if (m.hiddenForUserIds?.includes(userId)) return false;
        if (clearedIso && new Date(m.createdAt).getTime() <= new Date(clearedIso).getTime()) {
          return false;
        }
        return true;
      });
      const limit = 30;
      hasMoreByConv[conv.id] = all.length > limit;
      messagesByConv[conv.id] = all.slice(-limit);
    });

    const userRequests = db.requests.filter(
      (r) =>
        (r.toUserId === userId || r.fromUserId === userId) &&
        !blocked.includes(r.fromUserId)
    );

    return res.json({
      conversations: authorizedConvs,
      messagesByConv,
      hasMoreByConv,
      requests: userRequests,
      students: db.students,
      blockedUserIds: blocked,
      settings: getUserSettings(userId),
      presence: buildPresenceSnapshot(userId),
      reports: db.reports.filter((r) => r.reporterId === userId),
    });
  });

  // 2. Paginated messages fetch
  app.get('/api/chat/conversations/:id/messages', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    const convId = req.params.id;
    const before = req.query.before ? String(req.query.before) : undefined;
    const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 25));

    const conv = findAuthorizedConversation(convId, userId);
    if (!conv) return res.status(403).json({ message: 'Access denied to this conversation.' });

    const clearedIso = conv.userPrefs[userId]?.clearedBeforeIso;
    let all = db.messages.filter((m) => {
      if (m.conversationId !== convId) return false;
      if (m.hiddenForUserIds?.includes(userId)) return false;
      if (clearedIso && new Date(m.createdAt).getTime() <= new Date(clearedIso).getTime()) {
        return false;
      }
      return true;
    });

    if (before) {
      const idx = all.findIndex((m) => m.id === before);
      if (idx >= 0) all = all.slice(0, idx);
    }

    const slice = all.slice(-limit);
    return res.json({
      messages: slice,
      hasMore: all.length > slice.length,
    });
  });

  // 3. Upload attachment (validates file size, type, header)
  app.post('/api/chat/upload', (req: Request, res: Response) => {
    try {
      const { userId, conversationId, fileName, mimeType, base64Data, kind, durationSec, waveformPeaks } =
        req.body as {
          userId?: string;
          conversationId?: string;
          fileName?: string;
          mimeType?: string;
          base64Data?: string;
          kind?: 'image' | 'document' | 'audio';
          durationSec?: number;
          waveformPeaks?: number[];
        };

      if (!userId || !fileName || !base64Data) {
        return res.status(400).json({ message: 'Missing file upload fields.' });
      }
      if (conversationId && !findAuthorizedConversation(conversationId, userId)) {
        return res.status(403).json({ message: 'Not a participant of this conversation.' });
      }

      const ext = path.extname(fileName).toLowerCase();
      const allowedExts = [
        '.pdf',
        '.doc',
        '.docx',
        '.ppt',
        '.pptx',
        '.txt',
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.webm',
        '.ogg',
        '.mp3',
        '.wav',
        '.m4a',
      ];
      if (!allowedExts.includes(ext) && kind !== 'audio') {
        return res.status(400).json({
          message: 'Unsupported file format. Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG, and Audio.',
        });
      }

      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buf = Buffer.from(cleanBase64, 'base64');
      if (buf.length === 0) return res.status(400).json({ message: 'Uploaded file is empty.' });
      if (buf.length > MAX_CHAT_UPLOAD_BYTES) {
        return res.status(400).json({ message: 'File exceeds the 5 MB attachment limit.' });
      }

      const fileId = `cfile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const resolvedKind: 'image' | 'document' | 'audio' =
        kind || (mimeType?.startsWith('image/') ? 'image' : mimeType?.startsWith('audio/') ? 'audio' : 'document');

      db.files[fileId] = {
        fileId,
        ownerId: userId,
        conversationId,
        fileName,
        mimeType: mimeType || 'application/octet-stream',
        sizeBytes: buf.length,
        kind: resolvedKind,
        base64Data: cleanBase64,
        createdAt: new Date().toISOString(),
      };
      saveDatabase();

      const meta: ChatAttachmentMeta = {
        fileId,
        fileName,
        mimeType: db.files[fileId].mimeType,
        sizeBytes: buf.length,
        url: `/api/chat/files/${fileId}`,
        kind: resolvedKind,
        durationSec,
        waveformPeaks,
      };
      return res.json({ attachment: meta });
    } catch {
      return res.status(500).json({ message: 'Attachment upload failed.' });
    }
  });

  // 4. Download / serve attachment with access verification
  app.get('/api/chat/files/:fileId', (req: Request, res: Response) => {
    const file = db.files[req.params.fileId];
    if (!file) return res.status(404).json({ message: 'File not found.' });
    const userId = String(req.query.userId || '');
    if (file.conversationId && userId) {
      const conv = findAuthorizedConversation(file.conversationId, userId);
      if (!conv && file.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized file access.' });
      }
    }
    const buf = Buffer.from(file.base64Data, 'base64');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.fileName)}"`);
    return res.send(buf);
  });

  // 5. Send message (with idempotency, membership & group permission enforcement)
  app.post('/api/chat/messages', (req: Request, res: Response) => {
    const {
      userId,
      userName,
      conversationId,
      clientMsgId,
      kind,
      text,
      replyToId,
      forwardedFrom,
      isAnnouncement,
      attachment,
      linkUrl,
      linkTitle,
      studySession,
      studyResource,
      studyGoal,
    } = req.body as Partial<ChatMessage> & { userId?: string; userName?: string };

    if (!userId || !conversationId) {
      return res.status(400).json({ message: 'userId and conversationId are required.' });
    }

    const conv = findAuthorizedConversation(conversationId, userId);
    if (!conv) return res.status(403).json({ message: 'You are not a member of this conversation.' });

    // Check blocks in direct chats
    if (conv.type === 'direct') {
      const peerId = conv.participantIds.find((id) => id !== userId);
      if (peerId && (getBlockedList(userId).includes(peerId) || getBlockedList(peerId).includes(userId))) {
        return res.status(403).json({ message: 'Messaging unavailable because one participant blocked the other.' });
      }
    }

    // Group posting permissions check
    if (conv.type === 'group' && conv.onlyAdminsCanPost) {
      const role = getGroupRole(conv, userId);
      if (role !== 'Owner' && role !== 'Admin') {
        return res.status(403).json({ message: 'Only group owners or admins can post in this group.' });
      }
    }

    // Idempotent duplicate check
    if (clientMsgId) {
      const existing = db.messages.find((m) => m.clientMsgId === clientMsgId);
      if (existing) return res.json({ message: existing });
    }

    const cleanText = String(text || '').trim();
    if (!cleanText && !attachment && !studySession && !studyResource && !studyGoal && !linkUrl) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    let replyPreview: ChatMessage['replyPreview'];
    if (replyToId) {
      const target = db.messages.find((m) => m.id === replyToId && m.conversationId === conversationId);
      if (target) {
        replyPreview = {
          senderName: target.senderName,
          text: target.deletedForAll ? 'Deleted message' : target.text || target.attachment?.fileName || target.kind,
          kind: target.kind,
        };
      }
    }

    const nowIso = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      clientMsgId,
      conversationId,
      senderId: userId,
      senderName: userName || 'Student',
      kind: kind || 'text',
      text: cleanText,
      createdAt: nowIso,
      replyToId,
      replyPreview,
      forwardedFrom,
      isAnnouncement: Boolean(isAnnouncement),
      reactions: [],
      readByIds: [userId],
      status: 'delivered',
      attachment,
      linkUrl,
      linkTitle,
      studySession,
      studyResource,
      studyGoal,
    };

    db.messages.push(newMsg);

    const previewPrefix = conv.type === 'group' ? `${newMsg.senderName.split(' ')[0]}: ` : '';
    const previewBody =
      newMsg.kind === 'voice'
        ? 'Voice message'
        : newMsg.kind === 'image'
          ? 'Shared an image'
          : newMsg.kind === 'document'
            ? `Document: ${newMsg.attachment?.fileName || 'File'}`
            : newMsg.kind === 'study-session'
              ? `Study Session: ${newMsg.studySession?.title || ''}`
              : newMsg.kind === 'study-resource'
                ? `Study Resource: ${newMsg.studyResource?.title || ''}`
                : newMsg.text;

    conv.lastMessagePreview = `${previewPrefix}${previewBody}`.slice(0, 120);
    conv.lastMessageAt = nowIso;
    conv.updatedAt = nowIso;

    // Restore deletedLocally if someone sends a fresh message
    conv.participantIds.forEach((pid) => {
      if (conv.userPrefs[pid]) {
        conv.userPrefs[pid].deletedLocally = false;
      }
    });

    saveDatabase();
    broadcastToConversation(conv, 'message:new', { message: newMsg, conversation: conv });

    return res.json({ message: newMsg, conversation: conv });
  });

  // 6. Edit own message
  app.patch('/api/chat/messages/:id', (req: Request, res: Response) => {
    const { userId, text } = req.body as { userId?: string; text?: string };
    const msg = db.messages.find((m) => m.id === req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });
    if (msg.senderId !== userId) return res.status(403).json({ message: 'You can only edit your own messages.' });
    if (!text?.trim()) return res.status(400).json({ message: 'Message text is required.' });

    msg.text = text.trim();
    msg.editedAt = new Date().toISOString();
    saveDatabase();

    const conv = db.conversations.find((c) => c.id === msg.conversationId);
    if (conv) broadcastToConversation(conv, 'message:updated', { message: msg });
    return res.json({ message: msg });
  });

  // 7. Delete message (local hide vs delete for everyone when sender authorizes)
  app.delete('/api/chat/messages/:id', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '');
    const scope = String(req.query.scope || 'me') as 'me' | 'everyone';
    const msg = db.messages.find((m) => m.id === req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found.' });
    const conv = findAuthorizedConversation(msg.conversationId, userId);
    if (!conv) return res.status(403).json({ message: 'Access denied.' });

    if (scope === 'everyone') {
      if (msg.senderId !== userId) {
        return res.status(403).json({ message: 'Only the sender can delete a message for everyone.' });
      }
      msg.deletedForAll = true;
      msg.text = 'This message was deleted by the sender.';
      msg.attachment = undefined;
      saveDatabase();
      broadcastToConversation(conv, 'message:updated', { message: msg });
      return res.json({ message: msg, scope: 'everyone' });
    }

    msg.hiddenForUserIds = Array.from(new Set([...(msg.hiddenForUserIds || []), userId]));
    saveDatabase();
    return res.json({ hiddenId: msg.id, scope: 'me' });
  });

  // 8. Toggle reaction / pin / study session acceptance
  app.post('/api/chat/messages/:id/react', (req: Request, res: Response) => {
    const { userId, emoji } = req.body as { userId?: string; emoji?: string };
    const msg = db.messages.find((m) => m.id === req.params.id);
    if (!msg || !userId || !emoji) return res.status(400).json({ message: 'Invalid reaction.' });
    const conv = findAuthorizedConversation(msg.conversationId, userId);
    if (!conv) return res.status(403).json({ message: 'Access denied.' });

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
    broadcastToConversation(conv, 'message:updated', { message: msg });
    return res.json({ message: msg });
  });

  app.post('/api/chat/messages/:id/pin', (req: Request, res: Response) => {
    const { userId } = req.body as { userId?: string };
    const msg = db.messages.find((m) => m.id === req.params.id);
    if (!msg || !userId) return res.status(400).json({ message: 'Invalid pin request.' });
    const conv = findAuthorizedConversation(msg.conversationId, userId);
    if (!conv) return res.status(403).json({ message: 'Access denied.' });

    msg.isPinned = !msg.isPinned;
    saveDatabase();
    broadcastToConversation(conv, 'message:updated', { message: msg });
    return res.json({ message: msg });
  });

  app.post('/api/chat/messages/:id/accept-session', (req: Request, res: Response) => {
    const { userId } = req.body as { userId?: string };
    const msg = db.messages.find((m) => m.id === req.params.id);
    if (!msg?.studySession || !userId) return res.status(400).json({ message: 'Invalid session request.' });
    const conv = findAuthorizedConversation(msg.conversationId, userId);
    if (!conv) return res.status(403).json({ message: 'Access denied.' });

    if (!msg.studySession.acceptedByIds.includes(userId)) {
      msg.studySession.acceptedByIds.push(userId);
    }
    saveDatabase();
    broadcastToConversation(conv, 'message:updated', { message: msg });
    return res.json({ message: msg });
  });

  // 9. Mark conversation as read
  app.post('/api/chat/conversations/:id/read', (req: Request, res: Response) => {
    const { userId } = req.body as { userId?: string };
    if (!userId) return res.status(400).json({ message: 'userId required.' });
    const conv = findAuthorizedConversation(req.params.id, userId);
    if (!conv) return res.status(403).json({ message: 'Access denied.' });

    if (conv.userPrefs[userId]) {
      conv.userPrefs[userId].markedUnread = false;
    }

    const viewerAllowsReceipts = getUserSettings(userId).sendReadReceipts;
    if (viewerAllowsReceipts) {
      db.messages.forEach((m) => {
        if (m.conversationId === conv.id && !m.readByIds.includes(userId)) {
          m.readByIds.push(userId);
          if (m.senderId !== userId) m.status = 'read';
        }
      });
      broadcastToConversation(conv, 'message:read', { conversationId: conv.id, readerId: userId });
    }
    saveDatabase();
    return res.json({ ok: true });
  });

  // 10. Start or retrieve direct conversation (enforces privacy & blocks)
  app.post('/api/chat/conversations/direct', (req: Request, res: Response) => {
    const { userId, targetUserId, targetName, targetAvatarKey } = req.body as {
      userId?: string;
      targetUserId?: string;
      targetName?: string;
      targetAvatarKey?: string;
    };
    if (!userId || !targetUserId) {
      return res.status(400).json({ message: 'userId and targetUserId are required.' });
    }

    if (getBlockedList(userId).includes(targetUserId) || getBlockedList(targetUserId).includes(userId)) {
      return res.status(403).json({ message: 'Cannot message a blocked user.' });
    }

    const existing = db.conversations.find(
      (c) =>
        c.type === 'direct' &&
        c.participantIds.includes(userId) &&
        c.participantIds.includes(targetUserId)
    );
    if (existing) {
      if (existing.userPrefs[userId]) existing.userPrefs[userId].deletedLocally = false;
      saveDatabase();
      return res.json({ conversation: existing });
    }

    // Register external peer (e.g. from Study Partner handoff) if not in student directory
    if (!db.students.some((s) => s.id === targetUserId) && targetName) {
      db.students.push({
        id: targetUserId,
        name: targetName,
        avatarKey: targetAvatarKey || 'aditya',
        course: 'KAMPUS Student',
        semester: 'Active',
        college: 'KAMPUS Network',
        relationship: 'Study Partner',
        sharedInterests: [],
        allowMessagesFrom: 'everyone',
        isDemoUser: true,
      });
    }

    const nowIso = new Date().toISOString();
    const conv: ChatConversation = {
      id: `conv_dm_${Date.now()}`,
      type: 'direct',
      participantIds: [userId, targetUserId],
      createdAt: nowIso,
      updatedAt: nowIso,
      lastMessagePreview: 'Conversation started',
      lastMessageAt: nowIso,
      userPrefs: {
        [userId]: { pinned: false, muted: false, archived: false, markedUnread: false },
      },
    };
    db.conversations.unshift(conv);
    saveDatabase();
    broadcastToConversation(conv, 'conversation:updated', { conversation: conv });
    return res.json({ conversation: conv });
  });

  // 11. Create group conversation
  app.post('/api/chat/conversations/group', (req: Request, res: Response) => {
    const { userId, title, description, category, avatarKey, memberIds } = req.body as {
      userId?: string;
      title?: string;
      description?: string;
      category?: ChatConversation['category'];
      avatarKey?: string;
      memberIds?: string[];
    };
    if (!userId || !title?.trim()) {
      return res.status(400).json({ message: 'Group title is required.' });
    }
    const cleanMembers = Array.from(new Set([userId, ...(memberIds || [])]));
    const nowIso = new Date().toISOString();
    const members: GroupMember[] = cleanMembers.map((uid) => ({
      userId: uid,
      role: uid === userId ? 'Owner' : 'Member',
      joinedAt: nowIso,
    }));

    const conv: ChatConversation = {
      id: `conv_grp_${Date.now()}`,
      type: 'group',
      title: title.trim(),
      description: (description || '').trim(),
      category: category || 'Study Group',
      avatarKey: avatarKey || 'collab',
      participantIds: cleanMembers,
      members,
      onlyAdminsCanPost: false,
      onlyAdminsCanInvite: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastMessagePreview: `Group "${title.trim()}" created`,
      lastMessageAt: nowIso,
      userPrefs: {
        [userId]: { pinned: false, muted: false, archived: false, markedUnread: false },
      },
    };

    const sysMsg: ChatMessage = {
      id: `msg_sys_${Date.now()}`,
      conversationId: conv.id,
      senderId: 'system',
      senderName: 'System',
      kind: 'system',
      text: `${conv.title} was created (${cleanMembers.length} members).`,
      createdAt: nowIso,
      reactions: [],
      readByIds: [userId],
      status: 'delivered',
    };

    db.conversations.unshift(conv);
    db.messages.push(sysMsg);
    saveDatabase();
    broadcastToConversation(conv, 'conversation:updated', { conversation: conv, systemMessage: sysMsg });
    return res.json({ conversation: conv, systemMessage: sysMsg });
  });

  // 12. Manage conversation preferences & group admin controls
  app.patch('/api/chat/conversations/:id', (req: Request, res: Response) => {
    const {
      userId,
      action,
      value,
      title,
      description,
      avatarKey,
      targetUserId,
      role,
      onlyAdminsCanPost,
      onlyAdminsCanInvite,
    } = req.body as any;

    const conv = findAuthorizedConversation(req.params.id, userId);
    if (!conv) return res.status(403).json({ message: 'Access denied.' });

    if (!conv.userPrefs[userId]) {
      conv.userPrefs[userId] = { pinned: false, muted: false, archived: false, markedUnread: false };
    }

    if (action === 'pin') conv.userPrefs[userId].pinned = Boolean(value);
    else if (action === 'mute') conv.userPrefs[userId].muted = Boolean(value);
    else if (action === 'archive') conv.userPrefs[userId].archived = Boolean(value);
    else if (action === 'markUnread') conv.userPrefs[userId].markedUnread = Boolean(value);
    else if (action === 'clearLocal') {
      conv.userPrefs[userId].clearedBeforeIso = new Date().toISOString();
    } else if (action === 'deleteLocal') {
      conv.userPrefs[userId].deletedLocally = true;
      conv.userPrefs[userId].clearedBeforeIso = new Date().toISOString();
    } else if (conv.type === 'group') {
      const actorRole = getGroupRole(conv, userId);
      const isAdmin = actorRole === 'Owner' || actorRole === 'Admin';
      if (!isAdmin) return res.status(403).json({ message: 'Group admin permission required.' });

      if (action === 'editInfo') {
        if (title?.trim()) conv.title = title.trim();
        if (description !== undefined) conv.description = String(description).trim();
        if (avatarKey) conv.avatarKey = avatarKey;
      } else if (action === 'permissions') {
        if (onlyAdminsCanPost !== undefined) conv.onlyAdminsCanPost = Boolean(onlyAdminsCanPost);
        if (onlyAdminsCanInvite !== undefined) conv.onlyAdminsCanInvite = Boolean(onlyAdminsCanInvite);
      } else if (action === 'addMember' && targetUserId) {
        if (!conv.participantIds.includes(targetUserId)) {
          conv.participantIds.push(targetUserId);
          conv.members = [
            ...(conv.members || []),
            { userId: targetUserId, role: 'Member', joinedAt: new Date().toISOString() },
          ];
        }
      } else if (action === 'removeMember' && targetUserId) {
        const targetRole = getGroupRole(conv, targetUserId);
        if (targetRole === 'Owner' && actorRole !== 'Owner') {
          return res.status(403).json({ message: 'Cannot remove the group owner.' });
        }
        conv.participantIds = conv.participantIds.filter((id) => id !== targetUserId);
        conv.members = (conv.members || []).filter((m) => m.userId !== targetUserId);
      } else if (action === 'assignRole' && targetUserId && role) {
        if (actorRole !== 'Owner') {
          return res.status(403).json({ message: 'Only the group owner can assign roles.' });
        }
        conv.members = (conv.members || []).map((m) =>
          m.userId === targetUserId ? { ...m, role } : m
        );
      } else if (action === 'closeGroup') {
        if (actorRole !== 'Owner') {
          return res.status(403).json({ message: 'Only the group owner can delete the group.' });
        }
        db.conversations = db.conversations.filter((c) => c.id !== conv.id);
        saveDatabase();
        return res.json({ deletedGroupId: conv.id });
      }
    }

    conv.updatedAt = new Date().toISOString();
    saveDatabase();
    broadcastToConversation(conv, 'conversation:updated', { conversation: conv });
    return res.json({ conversation: conv });
  });

  // 13. Message requests (Send, Accept, Decline, Delete, duplicate guard)
  app.post('/api/chat/requests', (req: Request, res: Response) => {
    const { fromUserId, fromName, fromAvatarKey, fromCourse, toUserId, messagePreview, sharedInterests } =
      req.body as any;
    if (!fromUserId || !toUserId || !messagePreview?.trim()) {
      return res.status(400).json({ message: 'Request message is required.' });
    }

    if (getBlockedList(toUserId).includes(fromUserId) || getBlockedList(fromUserId).includes(toUserId)) {
      return res.status(403).json({ message: 'Unable to send request due to user block settings.' });
    }

    const recipient = db.students.find((s) => s.id === toUserId);
    const recipientPrefs = getUserSettings(toUserId);
    const effectiveRule = recipient?.allowMessagesFrom || recipientPrefs.whoCanMessage;
    if (effectiveRule === 'nobody') {
      return res.status(403).json({ message: 'This student is not accepting new message requests.' });
    }
    if (effectiveRule === 'study-partners' && recipient?.relationship !== 'Study Partner') {
      return res.status(403).json({ message: 'This student only accepts messages from connected Study Partners.' });
    }

    const duplicate = db.requests.find(
      (r) => r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending'
    );
    if (duplicate) {
      return res.status(409).json({ message: 'A pending message request already exists for this student.' });
    }

    const newReq: MessageRequest = {
      id: `req_${Date.now()}`,
      fromUserId,
      fromName: fromName || 'Student',
      fromAvatarKey: fromAvatarKey || 'priya',
      fromCourse: fromCourse || 'KAMPUS Learner',
      toUserId,
      toName: recipient?.name || 'Student',
      messagePreview: messagePreview.trim(),
      sharedInterests: sharedInterests || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.requests.unshift(newReq);
    saveDatabase();
    sendWsToUser(toUserId, 'request:updated', { request: newReq });
    return res.json({ request: newReq });
  });

  app.patch('/api/chat/requests/:id', (req: Request, res: Response) => {
    const { userId, decision } = req.body as { userId?: string; decision?: 'accept' | 'decline' | 'delete' };
    const reqObj = db.requests.find((r) => r.id === req.params.id);
    if (!reqObj) return res.status(404).json({ message: 'Request not found.' });
    if (reqObj.toUserId !== userId && reqObj.fromUserId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (decision === 'delete') {
      db.requests = db.requests.filter((r) => r.id !== reqObj.id);
      saveDatabase();
      return res.json({ deletedId: reqObj.id });
    }

    if (decision === 'decline') {
      reqObj.status = 'declined';
      saveDatabase();
      return res.json({ request: reqObj });
    }

    if (decision === 'accept') {
      reqObj.status = 'accepted';
      const nowIso = new Date().toISOString();
      let conv = db.conversations.find(
        (c) =>
          c.type === 'direct' &&
          c.participantIds.includes(reqObj.fromUserId) &&
          c.participantIds.includes(reqObj.toUserId)
      );
      if (!conv) {
        conv = {
          id: `conv_dm_${Date.now()}`,
          type: 'direct',
          participantIds: [reqObj.fromUserId, reqObj.toUserId],
          createdAt: nowIso,
          updatedAt: nowIso,
          lastMessagePreview: reqObj.messagePreview,
          lastMessageAt: nowIso,
          userPrefs: {
            [reqObj.toUserId]: { pinned: false, muted: false, archived: false, markedUnread: false },
            [reqObj.fromUserId]: { pinned: false, muted: false, archived: false, markedUnread: false },
          },
        };
        db.conversations.unshift(conv);
        db.messages.push({
          id: `msg_req_${Date.now()}`,
          conversationId: conv.id,
          senderId: reqObj.fromUserId,
          senderName: reqObj.fromName,
          kind: 'text',
          text: reqObj.messagePreview,
          createdAt: reqObj.createdAt,
          reactions: [],
          readByIds: [reqObj.toUserId],
          status: 'read',
        });
      }
      saveDatabase();
      broadcastToConversation(conv, 'conversation:updated', { conversation: conv });
      return res.json({ request: reqObj, conversation: conv });
    }

    return res.status(400).json({ message: 'Unknown decision.' });
  });

  // 14. Safety block & report + Settings
  app.post('/api/chat/safety/block', (req: Request, res: Response) => {
    const { userId, targetUserId } = req.body as { userId?: string; targetUserId?: string };
    if (!userId || !targetUserId) return res.status(400).json({ message: 'Invalid block request.' });
    const list = getBlockedList(userId);
    const exists = list.includes(targetUserId);
    db.blockedByUser[userId] = exists ? list.filter((id) => id !== targetUserId) : [...list, targetUserId];
    saveDatabase();
    return res.json({ blockedUserIds: db.blockedByUser[userId] });
  });

  app.post('/api/chat/safety/report', (req: Request, res: Response) => {
    const { reporterId, targetType, targetId, targetSummary, reason, details } = req.body as any;
    if (!reporterId || !targetId || !reason) {
      return res.status(400).json({ message: 'Incomplete report payload.' });
    }
    const report: ChatSafetyReport = {
      id: `creport_${Date.now()}`,
      reporterId,
      targetType: targetType || 'message',
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

  app.patch('/api/chat/settings', (req: Request, res: Response) => {
    const { userId, updates } = req.body as { userId?: string; updates?: Partial<ChatUserSettings> };
    if (!userId || !updates) return res.status(400).json({ message: 'Invalid settings update.' });
    db.settingsByUser[userId] = { ...getUserSettings(userId), ...updates };
    saveDatabase();
    broadcastPresence();
    return res.json({ settings: db.settingsByUser[userId] });
  });

  return wss;
}
