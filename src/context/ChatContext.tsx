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
  ChatAttachmentMeta,
  ChatBootstrapResponse,
  ChatConversation,
  ChatMessage,
  ChatSafetyReport,
  ChatUserSettings,
  GroupCategory,
  GroupRole,
  MessageKind,
  MessageRequest,
  PresenceInfo,
  PublicChatStudent,
  SharedStudyGoalPayload,
  SharedStudyResourcePayload,
  SharedStudySessionPayload,
} from '../types/chat';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sendAiChatMessage } from '../services/kampusAiService';
import { resolveChatAvatar } from '../data/chatData';

const CHAT_HANDOFF_KEY = 'kampus_chat_handoff_v1';
const RECENT_SEARCHES_KEY = 'kampus_chat_recent_searches_v1';

export type WsConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

interface TypingPeer {
  userId: string;
  userName: string;
  expiresAt: number;
}

export interface SendMessagePayload {
  conversationId: string;
  kind?: MessageKind;
  text: string;
  replyToId?: string;
  forwardedFrom?: string;
  isAnnouncement?: boolean;
  attachment?: ChatAttachmentMeta;
  linkUrl?: string;
  linkTitle?: string;
  studySession?: SharedStudySessionPayload;
  studyResource?: SharedStudyResourcePayload;
  studyGoal?: SharedStudyGoalPayload;
}

interface ChatContextType {
  currentUserId: string;
  currentUserName: string;
  loading: boolean;
  error: string | null;
  wsStatus: WsConnectionStatus;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  conversations: ChatConversation[];
  messagesByConv: Record<string, ChatMessage[]>;
  hasMoreByConv: Record<string, boolean>;
  requests: MessageRequest[];
  students: PublicChatStudent[];
  blockedUserIds: string[];
  settings: ChatUserSettings;
  presence: Record<string, PresenceInfo>;
  reports: ChatSafetyReport[];
  recentSearches: string[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  typingByConv: Record<string, TypingPeer[]>;

  // Helpers
  getStudentById: (id: string) => PublicChatStudent | undefined;
  getConversationDisplay: (conv: ChatConversation) => {
    title: string;
    avatarUrl: string;
    subtitle: string;
    isOnline: boolean;
    lastSeen?: string;
    peerId?: string;
  };
  getUnreadCount: (conv: ChatConversation) => number;
  getGroupRole: (conv: ChatConversation, uid?: string) => GroupRole | null;

  // Actions
  refreshBootstrap: () => Promise<void>;
  loadOlderMessages: (conversationId: string) => Promise<void>;
  sendMessage: (payload: SendMessagePayload) => Promise<boolean>;
  retryFailedMessage: (conversationId: string, clientMsgId: string) => Promise<void>;
  editMessage: (messageId: string, text: string) => Promise<void>;
  deleteMessage: (messageId: string, scope: 'me' | 'everyone') => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePinMessage: (messageId: string) => Promise<void>;
  acceptStudySession: (messageId: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  emitTyping: (conversationId: string, active: boolean) => void;

  uploadAttachment: (
    params: {
      conversationId?: string;
      fileName: string;
      mimeType: string;
      base64Data: string;
      kind: 'image' | 'document' | 'audio';
      durationSec?: number;
      waveformPeaks?: number[];
    },
    onProgress?: (pct: number) => void,
    onCancelRegister?: (cancelFn: () => void) => void
  ) => Promise<ChatAttachmentMeta>;

  startDirectChat: (target: { id: string; name?: string; avatarKey?: string }) => Promise<string | null>;
  createGroup: (payload: {
    title: string;
    description: string;
    category: GroupCategory;
    avatarKey: string;
    memberIds: string[];
  }) => Promise<string | null>;
  updateConversationAction: (
    conversationId: string,
    payload: Record<string, unknown>
  ) => Promise<boolean>;

  sendMessageRequest: (targetUserId: string, messagePreview: string) => Promise<{ ok: boolean; error?: string }>;
  respondToRequest: (requestId: string, decision: 'accept' | 'decline' | 'delete') => Promise<string | null>;

  toggleBlockUser: (targetUserId: string) => Promise<void>;
  submitReport: (payload: {
    targetType: ChatSafetyReport['targetType'];
    targetId: string;
    targetSummary: string;
    reason: string;
    details: string;
  }) => Promise<void>;
  updateSettings: (updates: Partial<ChatUserSettings>) => Promise<void>;

  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;

  askKampusAi: (
    mode: 'summarize-conv' | 'explain-msg' | 'quiz-notes' | 'summarize-doc' | 'revision-points',
    contextText: string
  ) => Promise<{ text: string; error?: string }>;
}

const DEFAULT_SETTINGS: ChatUserSettings = {
  whoCanMessage: 'everyone',
  showOnlineStatus: true,
  showLastSeen: true,
  sendReadReceipts: true,
  messageAlerts: true,
  groupAlerts: true,
  autoDownloadMedia: true,
  compactMode: false,
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();

  const currentUserId = user?.id || 'usr_22b030149';
  const currentUserName = profile.name || 'Priya Sharma';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WsConnectionStatus>('connecting');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, ChatMessage[]>>({});
  const [hasMoreByConv, setHasMoreByConv] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [students, setStudents] = useState<PublicChatStudent[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<ChatUserSettings>(DEFAULT_SETTINGS);
  const [presence, setPresence] = useState<Record<string, PresenceInfo>>({});
  const [reports, setReports] = useState<ChatSafetyReport[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [typingByConv, setTypingByConv] = useState<Record<string, TypingPeer[]>>({});

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const wsRef = useRef<WebSocket | null>(null);
  const activeConvRef = useRef<string | null>(null);
  const settingsRef = useRef<ChatUserSettings>(settings);
  const conversationsRef = useRef<ChatConversation[]>(conversations);
  const messagesByConvRef = useRef<Record<string, ChatMessage[]>>(messagesByConv);

  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  useEffect(() => {
    messagesByConvRef.current = messagesByConv;
  }, [messagesByConv]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const refreshBootstrap = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(
        `/api/chat/bootstrap?userId=${encodeURIComponent(currentUserId)}&userName=${encodeURIComponent(currentUserName)}`
      );
      if (!res.ok) throw new Error('Could not load chat workspace from server.');
      const data = (await res.json()) as ChatBootstrapResponse;
      setConversations(data.conversations);
      setMessagesByConv(data.messagesByConv);
      setHasMoreByConv(data.hasMoreByConv);
      setRequests(data.requests);
      setStudents(data.students);
      setBlockedUserIds(data.blockedUserIds);
      setSettings(data.settings);
      setPresence(data.presence);
      setReports(data.reports || []);

      // Handle Study Partner & KAMPUS Market -> Chat handoff cleanly
      const rawHandoff = localStorage.getItem(CHAT_HANDOFF_KEY);
      if (rawHandoff) {
        localStorage.removeItem(CHAT_HANDOFF_KEY);
        const h = JSON.parse(rawHandoff);
        if (h?.name) {
          let resolvedConvId: string | null = null;
          const match = data.conversations.find(
            (c) =>
              c.title?.toLowerCase() === String(h.name).toLowerCase() ||
              c.participantIds.some((pid) => {
                const stu = data.students.find((s) => s.id === pid);
                return stu?.name.toLowerCase() === String(h.name).toLowerCase();
              })
          );
          if (match) {
            resolvedConvId = match.id;
            setActiveConversationId(match.id);
          } else {
            const targetId = h.partnerId || `stu_${String(h.name).toLowerCase().replace(/\W+/g, '_')}`;
            const startRes = await fetch('/api/chat/conversations/direct', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: currentUserId,
                targetUserId: targetId,
                targetName: h.name,
                targetAvatarKey: h.avatarKey || 'aditya',
              }),
            });
            if (startRes.ok) {
              const created = await startRes.json();
              if (created.conversation) {
                resolvedConvId = created.conversation.id;
                setConversations((prev) => [
                  created.conversation,
                  ...prev.filter((c) => c.id !== created.conversation.id),
                ]);
                setActiveConversationId(created.conversation.id);
              }
            }
          }

          if (resolvedConvId && h.marketListing?.title) {
            const msgPayload = {
              userId: currentUserId,
              userName: currentUserName,
              conversationId: resolvedConvId,
              clientMsgId: `mkt_handoff_${Date.now()}`,
              kind: h.marketListing.imageUrl ? 'image' : 'link',
              text:
                h.marketListing.inquiryText ||
                `Hi! I am interested in "${h.marketListing.title}" (${h.marketListing.priceLabel || 'KAMPUS Market'}).`,
              linkUrl: h.marketListing.linkUrl,
              linkTitle: `${h.marketListing.title} · ${h.marketListing.priceLabel || ''}`,
              attachment: h.marketListing.imageUrl
                ? {
                    fileId: `mkt_${h.marketListing.listingId || Date.now()}`,
                    fileName: h.marketListing.title,
                    mimeType: 'image/jpeg',
                    sizeBytes: 0,
                    url: h.marketListing.imageUrl,
                    kind: 'image' as const,
                  }
                : undefined,
            };
            const sendRes = await fetch('/api/chat/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(msgPayload),
            });
            if (sendRes.ok) {
              const sent = await sendRes.json();
              if (sent.message) {
                setMessagesByConv((prev) => ({
                  ...prev,
                  [resolvedConvId!]: [...(prev[resolvedConvId!] || []), sent.message],
                }));
              }
            }
          }
        }
      } else if (!activeConvRef.current && data.conversations.length > 0 && window.innerWidth >= 1024) {
        setActiveConversationId(data.conversations[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to chat server.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentUserName]);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const refreshBootstrapRef = useRef(refreshBootstrap);
  const addNotificationRef = useRef(addNotification);
  useEffect(() => {
    refreshBootstrapRef.current = refreshBootstrap;
  }, [refreshBootstrap]);
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  // Real-time WebSocket connection with reconnect & state sync
  useEffect(() => {
    let closedByCleanup = false;
    let reconnectAttempt = 0;
    let reconnectTimer: number | null = null;
    let pingTimer: number | null = null;

    const connect = () => {
      if (closedByCleanup) return;
      setWsStatus(reconnectAttempt === 0 ? 'connecting' : 'reconnecting');
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(
        `${proto}//${window.location.host}/ws/chat?userId=${encodeURIComponent(currentUserId)}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        const wasReconnect = reconnectAttempt > 0;
        reconnectAttempt = 0;
        setWsStatus('connected');
        if (wasReconnect) {
          refreshBootstrapRef.current();
        }
        pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: 'ping' }));
          }
        }, 25_000);
      };

      ws.onmessage = (evt) => {
        try {
          const { event, payload } = JSON.parse(evt.data);
          if (event === 'presence:update') {
            setPresence(payload);
          } else if (event === 'typing:start') {
            const { conversationId, userId, userName } = payload;
            setTypingByConv((prev) => {
              const existing = (prev[conversationId] || []).filter((t) => t.userId !== userId);
              return {
                ...prev,
                [conversationId]: [...existing, { userId, userName, expiresAt: Date.now() + 3500 }],
              };
            });
          } else if (event === 'typing:stop') {
            const { conversationId, userId } = payload;
            setTypingByConv((prev) => ({
              ...prev,
              [conversationId]: (prev[conversationId] || []).filter((t) => t.userId !== userId),
            }));
          } else if (event === 'message:new') {
            const { message, conversation } = payload as {
              message: ChatMessage;
              conversation: ChatConversation;
            };
            setMessagesByConv((prev) => {
              const list = prev[message.conversationId] || [];
              if (list.some((m) => m.id === message.id || (m.clientMsgId && m.clientMsgId === message.clientMsgId))) {
                return {
                  ...prev,
                  [message.conversationId]: list.map((m) =>
                    m.id === message.id || (m.clientMsgId && m.clientMsgId === message.clientMsgId)
                      ? message
                      : m
                  ),
                };
              }
              return { ...prev, [message.conversationId]: [...list, message] };
            });

            if (conversation) {
              setConversations((prev) => {
                const rest = prev.filter((c) => c.id !== conversation.id);
                return [conversation, ...rest];
              });
            }

            if (message.senderId !== currentUserId) {
              const conv = conversationsRef.current.find((c) => c.id === message.conversationId);
              const muted = conv?.userPrefs[currentUserId]?.muted;
              const isGroup = conv?.type === 'group';
              const prefs = settingsRef.current;
              if (!muted && ((isGroup && prefs.groupAlerts) || (!isGroup && prefs.messageAlerts))) {
                addNotificationRef.current({
                  title: isGroup ? `${conv?.title || 'Group'}` : message.senderName,
                  description: message.text || `Sent a ${message.kind}`,
                  time: 'Just now',
                  type: 'academic',
                  linkRoute: '/connect/chat',
                });
              }
            }
          } else if (event === 'message:updated') {
            const { message } = payload as { message: ChatMessage };
            setMessagesByConv((prev) => ({
              ...prev,
              [message.conversationId]: (prev[message.conversationId] || []).map((m) =>
                m.id === message.id ? message : m
              ),
            }));
          } else if (event === 'message:read') {
            const { conversationId, readerId } = payload as { conversationId: string; readerId: string };
            setMessagesByConv((prev) => ({
              ...prev,
              [conversationId]: (prev[conversationId] || []).map((m) =>
                m.readByIds.includes(readerId)
                  ? m
                  : { ...m, readByIds: [...m.readByIds, readerId], status: 'read' }
              ),
            }));
          } else if (event === 'conversation:updated') {
            const { conversation, systemMessage } = payload as {
              conversation: ChatConversation;
              systemMessage?: ChatMessage;
            };
            setConversations((prev) => {
              const exists = prev.some((c) => c.id === conversation.id);
              return exists
                ? prev.map((c) => (c.id === conversation.id ? conversation : c))
                : [conversation, ...prev];
            });
            if (systemMessage) {
              setMessagesByConv((prev) => {
                const list = prev[conversation.id] || [];
                if (list.some((m) => m.id === systemMessage.id)) return prev;
                return { ...prev, [conversation.id]: [...list, systemMessage] };
              });
            }
          } else if (event === 'request:updated') {
            const { request } = payload as { request: MessageRequest };
            setRequests((prev) => [request, ...prev.filter((r) => r.id !== request.id)]);
            addNotificationRef.current({
              title: 'New Message Request',
              description: `${request.fromName}: ${request.messagePreview.slice(0, 60)}`,
              time: 'Just now',
              type: 'academic',
              linkRoute: '/connect/chat',
            });
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (pingTimer) window.clearInterval(pingTimer);
        if (!closedByCleanup) {
          reconnectAttempt += 1;
          setWsStatus(navigator.onLine ? 'reconnecting' : 'offline');
          const delay = Math.min(8000, 1000 * Math.pow(1.5, reconnectAttempt));
          reconnectTimer = window.setTimeout(connect, delay);
        }
      };
    };

    connect();

    const pruneTyping = window.setInterval(() => {
      const now = Date.now();
      setTypingByConv((prev) => {
        let changed = false;
        const next: Record<string, TypingPeer[]> = {};
        Object.entries(prev).forEach(([cid, list]) => {
          const valid = list.filter((t) => t.expiresAt > now);
          if (valid.length !== list.length) changed = true;
          if (valid.length > 0) next[cid] = valid;
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      closedByCleanup = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (pingTimer) window.clearInterval(pingTimer);
      window.clearInterval(pruneTyping);
      wsRef.current?.close();
    };
  }, [currentUserId]);

  const getStudentById = useCallback(
    (id: string) => students.find((s) => s.id === id),
    [students]
  );

  const getGroupRole = useCallback(
    (conv: ChatConversation, uid: string = currentUserId): GroupRole | null => {
      const member = conv.members?.find((m) => m.userId === uid);
      return member ? member.role : null;
    },
    [currentUserId]
  );

  const getConversationDisplay = useCallback(
    (conv: ChatConversation) => {
      if (conv.type === 'group') {
        return {
          title: conv.title || 'Study Group',
          avatarUrl: resolveChatAvatar(conv.avatarKey, undefined),
          subtitle: `${conv.participantIds.length} members · ${conv.category || 'Group'}`,
          isOnline: false,
        };
      }
      const peerId = conv.participantIds.find((id) => id !== currentUserId);
      const peer = peerId ? getStudentById(peerId) : undefined;
      const pInfo = peerId ? presence[peerId] : undefined;
      const isOnline = Boolean(pInfo?.online && settings.showOnlineStatus);
      return {
        title: peer?.name || 'Student',
        avatarUrl: resolveChatAvatar(peer?.avatarKey),
        subtitle: peer ? `${peer.course} · ${peer.semester}` : 'KAMPUS Student',
        isOnline,
        lastSeen: settings.showLastSeen ? pInfo?.lastSeen : undefined,
        peerId,
      };
    },
    [currentUserId, getStudentById, presence, settings.showOnlineStatus, settings.showLastSeen]
  );

  const getUnreadCount = useCallback(
    (conv: ChatConversation) => {
      const prefs = conv.userPrefs[currentUserId];
      const msgs = messagesByConv[conv.id] || [];
      const unreadMsgs = msgs.filter(
        (m) => m.senderId !== currentUserId && m.senderId !== 'system' && !m.readByIds.includes(currentUserId)
      ).length;
      if (unreadMsgs > 0) return unreadMsgs;
      return prefs?.markedUnread ? 1 : 0;
    },
    [currentUserId, messagesByConv]
  );

  const loadOlderMessages = async (conversationId: string) => {
    const existing = messagesByConv[conversationId] || [];
    const earliest = existing[0]?.id;
    const res = await fetch(
      `/api/chat/conversations/${conversationId}/messages?userId=${encodeURIComponent(currentUserId)}&limit=25${
        earliest ? `&before=${encodeURIComponent(earliest)}` : ''
      }`
    );
    if (!res.ok) return;
    const data = await res.json();
    setMessagesByConv((prev) => ({
      ...prev,
      [conversationId]: [...(data.messages || []), ...(prev[conversationId] || [])],
    }));
    setHasMoreByConv((prev) => ({ ...prev, [conversationId]: Boolean(data.hasMore) }));
  };

  const emitTyping = (conversationId: string, active: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: active ? 'typing:start' : 'typing:stop',
          payload: { conversationId, userName: currentUserName },
        })
      );
    }
  };

  const sendMessage = async (payload: SendMessagePayload): Promise<boolean> => {
    const clientMsgId = `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimistic: ChatMessage = {
      id: clientMsgId,
      clientMsgId,
      conversationId: payload.conversationId,
      senderId: currentUserId,
      senderName: currentUserName,
      kind: payload.kind || 'text',
      text: payload.text,
      createdAt: new Date().toISOString(),
      replyToId: payload.replyToId,
      forwardedFrom: payload.forwardedFrom,
      isAnnouncement: payload.isAnnouncement,
      reactions: [],
      readByIds: [currentUserId],
      status: 'sending',
      attachment: payload.attachment,
      linkUrl: payload.linkUrl,
      linkTitle: payload.linkTitle,
      studySession: payload.studySession,
      studyResource: payload.studyResource,
      studyGoal: payload.studyGoal,
    };

    setMessagesByConv((prev) => ({
      ...prev,
      [payload.conversationId]: [...(prev[payload.conversationId] || []), optimistic],
    }));

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          userId: currentUserId,
          userName: currentUserName,
          clientMsgId,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || 'Failed to send message');
      }
      const data = await res.json();
      setMessagesByConv((prev) => ({
        ...prev,
        [payload.conversationId]: (prev[payload.conversationId] || []).map((m) =>
          m.clientMsgId === clientMsgId ? data.message : m
        ),
      }));
      if (data.conversation) {
        setConversations((prev) => [
          data.conversation,
          ...prev.filter((c) => c.id !== data.conversation.id),
        ]);
      }
      return true;
    } catch (err) {
      setMessagesByConv((prev) => ({
        ...prev,
        [payload.conversationId]: (prev[payload.conversationId] || []).map((m) =>
          m.clientMsgId === clientMsgId ? { ...m, status: 'failed' } : m
        ),
      }));
      showToast(err instanceof Error ? err.message : 'Message failed to send. Tap Retry.');
      return false;
    }
  };

  const retryFailedMessage = async (conversationId: string, clientMsgId: string) => {
    const msg = (messagesByConv[conversationId] || []).find((m) => m.clientMsgId === clientMsgId);
    if (!msg) return;
    setMessagesByConv((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).filter((m) => m.clientMsgId !== clientMsgId),
    }));
    await sendMessage({
      conversationId,
      kind: msg.kind,
      text: msg.text,
      replyToId: msg.replyToId,
      forwardedFrom: msg.forwardedFrom,
      isAnnouncement: msg.isAnnouncement,
      attachment: msg.attachment,
      linkUrl: msg.linkUrl,
      linkTitle: msg.linkTitle,
      studySession: msg.studySession,
      studyResource: msg.studyResource,
      studyGoal: msg.studyGoal,
    });
  };

  const editMessage = async (messageId: string, text: string) => {
    const res = await fetch(`/api/chat/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, text }),
    });
    if (res.ok) showToast('Message edited.');
  };

  const deleteMessage = async (messageId: string, scope: 'me' | 'everyone') => {
    const res = await fetch(
      `/api/chat/messages/${messageId}?userId=${encodeURIComponent(currentUserId)}&scope=${scope}`,
      { method: 'DELETE' }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.message || 'Could not delete message.');
      return;
    }
    if (scope === 'me') {
      setMessagesByConv((prev) => {
        const next: Record<string, ChatMessage[]> = {};
        Object.entries(prev).forEach(([cid, list]) => {
          next[cid] = list.filter((m) => m.id !== messageId);
        });
        return next;
      });
      showToast('Removed from your view.');
    } else {
      showToast('Message deleted for all participants.');
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    await fetch(`/api/chat/messages/${messageId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, emoji }),
    });
  };

  const togglePinMessage = async (messageId: string) => {
    const res = await fetch(`/api/chat/messages/${messageId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId }),
    });
    if (res.ok) showToast('Updated pinned messages.');
  };

  const acceptStudySession = async (messageId: string) => {
    const res = await fetch(`/api/chat/messages/${messageId}/accept-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId }),
    });
    if (res.ok) showToast('Accepted study session invitation!');
  };

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      const conv = conversationsRef.current.find((c) => c.id === conversationId);
      const msgs = messagesByConvRef.current[conversationId] || [];
      const hasUnreadMsgs = msgs.some(
        (m) => m.senderId !== currentUserId && m.senderId !== 'system' && !m.readByIds.includes(currentUserId)
      );
      const isMarkedUnread = Boolean(conv?.userPrefs[currentUserId]?.markedUnread);
      if (!hasUnreadMsgs && !isMarkedUnread) return;

      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const prefs = c.userPrefs[currentUserId] || {
            pinned: false,
            muted: false,
            archived: false,
            markedUnread: false,
          };
          return {
            ...c,
            userPrefs: {
              ...c.userPrefs,
              [currentUserId]: { ...prefs, markedUnread: false },
            },
          };
        })
      );
      setMessagesByConv((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((m) =>
          m.readByIds.includes(currentUserId)
            ? m
            : { ...m, readByIds: [...m.readByIds, currentUserId] }
        ),
      }));
    },
    [currentUserId]
  );

  // Real XHR upload with progress & cancellation
  const uploadAttachment = (
    params: {
      conversationId?: string;
      fileName: string;
      mimeType: string;
      base64Data: string;
      kind: 'image' | 'document' | 'audio';
      durationSec?: number;
      waveformPeaks?: number[];
    },
    onProgress?: (pct: number) => void,
    onCancelRegister?: (cancelFn: () => void) => void
  ): Promise<ChatAttachmentMeta> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/chat/upload', true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      if (onCancelRegister) {
        onCancelRegister(() => xhr.abort());
      }

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.attachment) {
            onProgress?.(100);
            resolve(data.attachment);
          } else {
            reject(new Error(data.message || 'Upload failed.'));
          }
        } catch {
          reject(new Error('Invalid upload server response.'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error while uploading attachment.'));
      xhr.onabort = () => reject(new Error('Upload cancelled.'));

      xhr.send(JSON.stringify({ ...params, userId: currentUserId }));
    });
  };

  const startDirectChat = async (target: { id: string; name?: string; avatarKey?: string }) => {
    const res = await fetch('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        targetUserId: target.id,
        targetName: target.name,
        targetAvatarKey: target.avatarKey,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.message || 'Cannot start chat.');
      return null;
    }
    const data = await res.json();
    const conv = data.conversation as ChatConversation;
    setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
    setActiveConversationId(conv.id);
    return conv.id;
  };

  const createGroup = async (payload: {
    title: string;
    description: string;
    category: GroupCategory;
    avatarKey: string;
    memberIds: string[];
  }) => {
    const res = await fetch('/api/chat/conversations/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.message || 'Failed to create group.');
      return null;
    }
    const data = await res.json();
    const conv = data.conversation as ChatConversation;
    setConversations((prev) => [conv, ...prev]);
    if (data.systemMessage) {
      setMessagesByConv((prev) => ({ ...prev, [conv.id]: [data.systemMessage] }));
    }
    setActiveConversationId(conv.id);
    showToast(`Created group "${conv.title}"`);
    return conv.id;
  };

  const updateConversationAction = async (
    conversationId: string,
    payload: Record<string, unknown>
  ): Promise<boolean> => {
    const res = await fetch(`/api/chat/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.message || 'Action failed.');
      return false;
    }
    const data = await res.json();
    if (data.deletedGroupId || payload.action === 'deleteLocal') {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) setActiveConversationId(null);
      showToast(
        data.deletedGroupId
          ? 'Group deleted for all members.'
          : 'Conversation deleted from your local view.'
      );
      return true;
    }
    if (payload.action === 'clearLocal') {
      setMessagesByConv((prev) => ({ ...prev, [conversationId]: [] }));
      showToast('Chat history cleared from your view.');
    }
    if (data.conversation) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? data.conversation : c))
      );
    }
    return true;
  };

  const sendMessageRequest = async (targetUserId: string, messagePreview: string) => {
    const res = await fetch('/api/chat/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUserId: currentUserId,
        fromName: currentUserName,
        fromAvatarKey: 'priya',
        fromCourse: profile.course,
        toUserId: targetUserId,
        messagePreview,
        sharedInterests: profile.interests || [],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Could not send request.' };
    setRequests((prev) => [data.request, ...prev]);
    showToast('Message request sent.');
    return { ok: true };
  };

  const respondToRequest = async (requestId: string, decision: 'accept' | 'decline' | 'delete') => {
    const res = await fetch(`/api/chat/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, decision }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (decision === 'delete') {
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      showToast('Request deleted.');
      return null;
    }
    setRequests((prev) => prev.map((r) => (r.id === requestId ? data.request : r)));
    if (decision === 'accept' && data.conversation) {
      await refreshBootstrap();
      setActiveConversationId(data.conversation.id);
      showToast('Message request accepted!');
      return data.conversation.id as string;
    }
    showToast('Message request declined.');
    return null;
  };

  const toggleBlockUser = async (targetUserId: string) => {
    const res = await fetch('/api/chat/safety/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, targetUserId }),
    });
    if (res.ok) {
      const data = await res.json();
      setBlockedUserIds(data.blockedUserIds);
      const isNowBlocked = data.blockedUserIds.includes(targetUserId);
      showToast(isNowBlocked ? 'User blocked.' : 'User unblocked.');
    }
  };

  const submitReport = async (payload: {
    targetType: ChatSafetyReport['targetType'];
    targetId: string;
    targetSummary: string;
    reason: string;
    details: string;
  }) => {
    const res = await fetch('/api/chat/safety/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, reporterId: currentUserId }),
    });
    if (res.ok) {
      const data = await res.json();
      setReports((prev) => [data.report, ...prev]);
      showToast('Report submitted for moderation review.');
    }
  };

  const updateSettings = async (updates: Partial<ChatUserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    const res = await fetch('/api/chat/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, updates }),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      showToast('Chat settings saved.');
    }
  };

  const addRecentSearch = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const askKampusAi = async (
    mode: 'summarize-conv' | 'explain-msg' | 'quiz-notes' | 'summarize-doc' | 'revision-points',
    contextText: string
  ) => {
    const prompts: Record<typeof mode, string> = {
      'summarize-conv': `Summarize this student study conversation clearly with action items and key takeaways:\n\n${contextText}`,
      'explain-msg': `Explain this academic concept or student message step by step with clarity:\n\n${contextText}`,
      'quiz-notes': `Generate 4 concise conceptual questions (with brief answers) from this shared study material:\n\n${contextText}`,
      'summarize-doc': `Summarize the shared document or study resource below into key takeaways:\n\n${contextText}`,
      'revision-points': `Create compact bullet-point revision notes from this conversation/resource:\n\n${contextText}`,
    };
    try {
      const res = await sendAiChatMessage({
        messages: [{ role: 'user', content: prompts[mode] }],
        language: 'English',
        learningLevel: 'Intermediate',
        responseStyle: mode === 'explain-msg' ? 'Exam-Oriented Answer' : 'Simple Explanation',
      });
      return { text: res.reply };
    } catch (err) {
      return {
        text: '',
        error: err instanceof Error ? err.message : 'KAMPUS AI service is currently unavailable.',
      };
    }
  };

  const value = useMemo<ChatContextType>(
    () => ({
      currentUserId,
      currentUserName,
      loading,
      error,
      wsStatus,
      toastMessage,
      showToast,
      conversations,
      messagesByConv,
      hasMoreByConv,
      requests,
      students,
      blockedUserIds,
      settings,
      presence,
      reports,
      recentSearches,
      activeConversationId,
      setActiveConversationId,
      typingByConv,
      getStudentById,
      getConversationDisplay,
      getUnreadCount,
      getGroupRole,
      refreshBootstrap,
      loadOlderMessages,
      sendMessage,
      retryFailedMessage,
      editMessage,
      deleteMessage,
      toggleReaction,
      togglePinMessage,
      acceptStudySession,
      markConversationRead,
      emitTyping,
      uploadAttachment,
      startDirectChat,
      createGroup,
      updateConversationAction,
      sendMessageRequest,
      respondToRequest,
      toggleBlockUser,
      submitReport,
      updateSettings,
      addRecentSearch,
      clearRecentSearches,
      askKampusAi,
    }),
    [
      currentUserId,
      currentUserName,
      loading,
      error,
      wsStatus,
      toastMessage,
      conversations,
      messagesByConv,
      hasMoreByConv,
      requests,
      students,
      blockedUserIds,
      settings,
      presence,
      reports,
      recentSearches,
      activeConversationId,
      typingByConv,
      getStudentById,
      getConversationDisplay,
      getUnreadCount,
      getGroupRole,
      refreshBootstrap,
      markConversationRead,
      showToast,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
};
