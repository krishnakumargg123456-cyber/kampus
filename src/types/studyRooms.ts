export type StudyMode =
  | 'Silent Study'
  | 'Pomodoro Study'
  | 'Group Discussion'
  | 'Doubt Solving'
  | 'Exam Preparation'
  | 'Revision Session'
  | 'Collaborative Learning';

export type RoomPrivacy = 'Public' | 'Private';

export type RoomVisibility = 'Listed' | 'Unlisted';

export type RoomStatus =
  | 'Live'
  | 'Upcoming'
  | 'Starting Soon'
  | 'Paused'
  | 'Ended'
  | 'Cancelled';

export type RoomRole = 'Owner' | 'Co-host' | 'Moderator' | 'Participant';

export type RoomDiscoveryCategory =
  | 'All Rooms'
  | 'Recommended'
  | 'Live Now'
  | 'Upcoming'
  | 'My Rooms'
  | 'Private Rooms';

export type PomodoroPhase = 'focus' | 'short-break' | 'long-break';

export interface PomodoroState {
  phase: PomodoroPhase;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  status: 'idle' | 'running' | 'paused';
  remainingSeconds: number;
  lastUpdatedAt: string;
  completedFocusSessions: number;
  autoBreakReminders: boolean;
}

export interface RoomParticipant {
  userId: string;
  name: string;
  avatarKey: string;
  course: string;
  role: RoomRole;
  joinedAt: string;
  activeStatus: 'Active' | 'Away';
  canShareResources: boolean;
  canUseWorkspace: boolean;
}

export interface RoomInvitation {
  id: string;
  code: string;
  token: string;
  createdBy: string;
  expiresAt?: string;
  revoked: boolean;
  createdAt: string;
}

export interface RoomJoinRequest {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userCourse: string;
  avatarKey: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface SharedNoteItem {
  id: string;
  topic: string;
  title: string;
  content: string;
  updatedBy: string;
  updatedAt: string;
}

export type WhiteboardTool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'text';

export interface WhiteboardElement {
  id: string;
  tool: WhiteboardTool;
  color: string;
  strokeWidth: number;
  points?: Array<{ x: number; y: number }>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface RoomResource {
  id: string;
  kind: 'PDF' | 'Notes' | 'Document' | 'Link';
  title: string;
  url: string;
  fileName?: string;
  sizeBytes?: number;
  sharedBy: string;
  sharedById: string;
  createdAt: string;
}

export interface RoomTask {
  id: string;
  title: string;
  assigneeName: string;
  done: boolean;
  createdBy: string;
  createdAt: string;
}

export interface RoomMessageAttachment {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  kind: 'image' | 'document';
}

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: RoomRole;
  text: string;
  replyToId?: string;
  replyPreview?: {
    senderName: string;
    text: string;
  };
  attachment?: RoomMessageAttachment;
  reactions: Array<{ emoji: string; userIds: string[] }>;
  isPinned?: boolean;
  isAnnouncement?: boolean;
  createdAt: string;
}

export interface RoomDoubtAnswer {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface RoomDoubt {
  id: string;
  roomId: string;
  title: string;
  explanation: string;
  subject: string;
  topic: string;
  attachment?: RoomMessageAttachment;
  authorId: string;
  authorName: string;
  answers: RoomDoubtAnswer[];
  resolved: boolean;
  createdAt: string;
}

export interface RoomObjective {
  id: string;
  label: string;
  done: boolean;
}

export interface StudyRoom {
  id: string;
  name: string;
  description: string;
  subject: string;
  courseCategory: string;
  topic: string;
  coverKey: string;
  rules: string;
  privacy: RoomPrivacy;
  visibility: RoomVisibility;
  maxCapacity: number;
  allowJoinRequests: boolean;
  hostApprovalRequired: boolean;
  allowResourceSharing: boolean;
  enableGroupDiscussion: boolean;
  enableWorkspace: boolean;
  studyMode: StudyMode;
  status: RoomStatus;
  scheduledStartAt?: string;
  durationMinutes: number;
  breakIntervalMinutes: number;
  remindersEnabled: boolean;
  objectives: RoomObjective[];
  instructions: string;
  hostId: string;
  hostName: string;
  roomCode: string;
  invitation: RoomInvitation;
  invitedEmailsOrNames?: string[];
  participants: RoomParticipant[];
  activeParticipantIds: string[];
  joinRequests: RoomJoinRequest[];
  pomodoro: PomodoroState;
  notes: SharedNoteItem[];
  whiteboard: WhiteboardElement[];
  resources: RoomResource[];
  tasks: RoomTask[];
  messages: RoomMessage[];
  doubts: RoomDoubt[];
  savedByIds: string[];
  visitedByIds: string[];
  startedAt?: string;
  endedAt?: string;
  isDemoRoom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummaryRecord {
  id: string;
  roomId: string;
  roomName: string;
  subject: string;
  studyMode: StudyMode;
  sessionDate: string;
  totalDurationMinutes: number;
  participantCount: number;
  participantNames: string[];
  completedFocusSessions: number;
  tasksCompleted: number;
  totalTasks: number;
  sharedResourcesCount: number;
  messagesCount: number;
  doubtsResolvedCount: number;
  objectivesCompleted: number;
  totalObjectives: number;
  discussionHighlights: string[];
  createdByUserId: string;
}

export interface StudyRoomsReport {
  id: string;
  reporterId: string;
  roomId: string;
  targetType: 'room' | 'participant' | 'message' | 'doubt';
  targetId: string;
  targetSummary: string;
  reason: string;
  details: string;
  status: 'Submitted';
  createdAt: string;
}

export interface StudyRoomsBootstrapResponse {
  rooms: StudyRoom[];
  summaries: SessionSummaryRecord[];
  blockedUserIds: string[];
  reports: StudyRoomsReport[];
}
