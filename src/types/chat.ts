export type ChatFilterTab = 'All' | 'Unread' | 'Personal' | 'Groups' | 'Archived';

export type GroupCategory =
  | 'Study Group'
  | 'Class Group'
  | 'Project Team'
  | 'College Friends'
  | 'Subject Discussion'
  | 'Exam Preparation';

export type GroupRole = 'Owner' | 'Admin' | 'Member';

export type MessageKind =
  | 'text'
  | 'image'
  | 'document'
  | 'voice'
  | 'link'
  | 'study-session'
  | 'study-resource'
  | 'study-goal'
  | 'system';

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type WhoCanMessagePref = 'everyone' | 'study-partners' | 'group-members' | 'nobody';

export type MobileChatScreen =
  | 'list'
  | 'conversation'
  | 'info'
  | 'new-message'
  | 'requests'
  | 'settings';

export type RightPanelTab =
  | 'Overview'
  | 'Members'
  | 'Media'
  | 'Documents'
  | 'Links'
  | 'Study Resources'
  | 'Pinned Messages';

export interface PublicChatStudent {
  id: string;
  name: string;
  avatarKey: string;
  course: string;
  semester: string;
  college: string;
  relationship: 'Study Partner' | 'Recent Contact' | 'Following' | 'Group Member' | 'Suggested';
  sharedInterests: string[];
  allowMessagesFrom: WhoCanMessagePref;
  isDemoUser?: boolean;
}

export interface ChatAttachmentMeta {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  kind: 'image' | 'document' | 'audio';
  durationSec?: number;
  waveformPeaks?: number[];
}

export interface SharedStudySessionPayload {
  sessionId: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  durationMinutes: number;
  objective: string;
  acceptedByIds: string[];
}

export interface SharedStudyResourcePayload {
  sourceModule: 'Study Hub' | 'Notes Exchange' | 'Custom';
  resourceType: 'Notes' | 'PDF' | 'PYQ' | 'Study Guide' | 'Flashcards';
  title: string;
  subject: string;
  summary: string;
  route: string;
}

export interface SharedStudyGoalPayload {
  goalType: 'Daily Goal' | 'Weekly Target' | 'Revision Plan';
  title: string;
  items: Array<{ id: string; label: string; done: boolean }>;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  clientMsgId?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  kind: MessageKind;
  text: string;
  createdAt: string;
  editedAt?: string;
  deletedForAll?: boolean;
  hiddenForUserIds?: string[];
  replyToId?: string;
  replyPreview?: {
    senderName: string;
    text: string;
    kind: MessageKind;
  };
  forwardedFrom?: string;
  isAnnouncement?: boolean;
  isPinned?: boolean;
  reactions: MessageReaction[];
  readByIds: string[];
  status: MessageDeliveryStatus;
  attachment?: ChatAttachmentMeta;
  linkUrl?: string;
  linkTitle?: string;
  studySession?: SharedStudySessionPayload;
  studyResource?: SharedStudyResourcePayload;
  studyGoal?: SharedStudyGoalPayload;
}

export interface GroupMember {
  userId: string;
  role: GroupRole;
  joinedAt: string;
}

export interface ConversationUserPrefs {
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  markedUnread: boolean;
  clearedBeforeIso?: string;
  deletedLocally?: boolean;
}

export interface ChatConversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  description?: string;
  category?: GroupCategory;
  avatarKey?: string;
  participantIds: string[];
  members?: GroupMember[];
  onlyAdminsCanPost?: boolean;
  onlyAdminsCanInvite?: boolean;
  isDemoConversation?: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
  lastMessageAt: string;
  userPrefs: Record<string, ConversationUserPrefs>;
}

export interface MessageRequest {
  id: string;
  fromUserId: string;
  fromName: string;
  fromAvatarKey: string;
  fromCourse: string;
  toUserId: string;
  toName: string;
  messagePreview: string;
  sharedInterests: string[];
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ChatSafetyReport {
  id: string;
  reporterId: string;
  targetType: 'message' | 'user' | 'group' | 'request';
  targetId: string;
  targetSummary: string;
  reason: string;
  details: string;
  status: 'Submitted';
  createdAt: string;
}

export interface ChatUserSettings {
  whoCanMessage: WhoCanMessagePref;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  sendReadReceipts: boolean;
  messageAlerts: boolean;
  groupAlerts: boolean;
  autoDownloadMedia: boolean;
  compactMode: boolean;
}

export interface PresenceInfo {
  userId: string;
  online: boolean;
  lastSeen?: string;
}

export interface ChatBootstrapResponse {
  conversations: ChatConversation[];
  messagesByConv: Record<string, ChatMessage[]>;
  hasMoreByConv: Record<string, boolean>;
  requests: MessageRequest[];
  students: PublicChatStudent[];
  blockedUserIds: string[];
  settings: ChatUserSettings;
  presence: Record<string, PresenceInfo>;
  reports: ChatSafetyReport[];
}
