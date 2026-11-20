export type StudyTimeSlot =
  | 'Morning Study'
  | 'Afternoon Study'
  | 'Evening Study'
  | 'Night Study';

export type StudyMode =
  | 'Online Study'
  | 'Offline Study'
  | 'Individual Focus'
  | 'Group Learning';

export type LearningStyle =
  | 'Concept-Based Learning'
  | 'Practice & Questions'
  | 'Revision'
  | 'Discussion'
  | 'Doubt Solving'
  | 'Exam Preparation';

export type StudyPartnerLanguage =
  | 'English'
  | 'Hindi'
  | 'Bilingual (EN/HI)'
  | 'Marathi'
  | 'Tamil'
  | 'Telugu';

export type StudyLevel =
  | 'School'
  | 'Class 11–12'
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Competitive Exams';

export type ProfileVisibility = 'campus-peers' | 'college-only' | 'hidden';
export type RequestPermission = 'everyone' | 'same-course-or-exam' | 'connections-only';

export type StudyPartnerTab =
  | 'home'
  | 'discover'
  | 'requests'
  | 'partners'
  | 'groups'
  | 'sessions'
  | 'preferences';

export type SmartMatchSection =
  | 'recommended'
  | 'best-subjects'
  | 'similar-goals'
  | 'recently-active';

export interface MyStudyPreferences {
  stream: string;
  academicYear: string;
  examPreparation: string;
  subjects: string[];
  learningGoals: string[];
  preferredTimes: StudyTimeSlot[];
  studyModes: StudyMode[];
  learningStyles: LearningStyle[];
  preferredLanguage: StudyPartnerLanguage;
  studyLevel: StudyLevel;
  availability: string;
  collaborationInterests: string[];
  visibility: ProfileVisibility;
  allowRequestsFrom: RequestPermission;
  hideCollegeName: boolean;
  notifyOnRequests: boolean;
  notifyOnSessions: boolean;
  notifyOnGoals: boolean;
}

export interface StudentPeerProfile {
  id: string;
  name: string;
  avatarUrl: string;
  isDemoProfile: boolean;
  intro: string;
  course: string;
  stream: string;
  college: string;
  university: string;
  semester: string;
  academicYear: string;
  subjects: string[];
  examPreparation: string;
  learningGoals: string[];
  preferredTimes: StudyTimeSlot[];
  studyModes: StudyMode[];
  learningStyles: LearningStyle[];
  preferredLanguage: StudyPartnerLanguage;
  studyLevel: StudyLevel;
  availability: string;
  collaborationInterests: string[];
  visibility: ProfileVisibility;
  allowRequestsFrom: RequestPermission;
  isRecentlyActive: boolean;
  lastActiveLabel: string;
  lastCollaborationLabel?: string;
}

export interface MatchCompatibility {
  score: number | null;
  hasEnoughData: boolean;
  reasons: string[];
  commonSubjects: string[];
}

export type StudyRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface StudyRequest {
  id: string;
  direction: 'received' | 'sent';
  peerId: string;
  message: string;
  sharedInterests: string[];
  status: StudyRequestStatus;
  createdAt: string;
  dateLabel: string;
}

export type GroupVisibility = 'Public' | 'Course Only' | 'Invite Only';
export type GroupRole = 'owner' | 'moderator' | 'member';

export interface GroupMember {
  id: string;
  name: string;
  avatarUrl: string;
  role: GroupRole;
  courseLabel: string;
}

export interface GroupDiscussionPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  dateLabel: string;
  isReported?: boolean;
}

export interface GroupSharedResource {
  id: string;
  title: string;
  type: 'Notes' | 'PYQ Paper' | 'Formula Sheet' | 'Link';
  addedByName: string;
  noteSummary: string;
  addedAt: string;
}

export interface GroupTaskItem {
  id: string;
  title: string;
  assignedTo: string;
  completed: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subjects: string[];
  goals: string[];
  visibility: GroupVisibility;
  ownerId: string;
  members: GroupMember[];
  discussions: GroupDiscussionPost[];
  resources: GroupSharedResource[];
  tasks: GroupTaskItem[];
  createdAt: string;
}

export type StudySessionStatus = 'Upcoming' | 'Live' | 'Completed' | 'Cancelled';

export interface StudySession {
  id: string;
  title: string;
  targetType: 'partner' | 'group';
  targetId: string;
  targetName: string;
  subject: string;
  dateISO: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "18:30"
  durationMinutes: number;
  objectives: string;
  prepNotes: string;
  status: StudySessionStatus;
  actualMinutesLogged?: number;
  createdAt: string;
}

export interface GoalChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CollaborativeGoal {
  id: string;
  title: string;
  description: string;
  subject: string;
  targetDate: string;
  assignedMemberIds: string[];
  assignedMemberNames: string[];
  tasks: GoalChecklistItem[];
  status: 'active' | 'completed';
  createdAt: string;
}

export interface SafetyReportEntry {
  id: string;
  targetType: 'profile' | 'group-post';
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  createdAt: string;
}

export interface CollaborationLogEntry {
  id: string;
  dateISO: string;
  minutes: number;
  type: 'session' | 'goal';
  label: string;
}

export interface StudyPartnerState {
  preferences: MyStudyPreferences;
  peers: StudentPeerProfile[];
  connectedPartnerIds: string[];
  savedPeerIds: string[];
  ignoredPeerIds: string[];
  blockedPeerIds: string[];
  requests: StudyRequest[];
  groups: StudyGroup[];
  sessions: StudySession[];
  goals: CollaborativeGoal[];
  reports: SafetyReportEntry[];
  activityLog: CollaborationLogEntry[];
}
