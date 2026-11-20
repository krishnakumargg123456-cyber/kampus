export type ProfileVisibility = 'Public' | 'KAMPUS Members' | 'Private';

export type SkillCategory =
  | 'Technical'
  | 'Communication'
  | 'Creative'
  | 'Academic'
  | 'Professional';

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type InterestCategory =
  | 'Technology'
  | 'Science'
  | 'Business'
  | 'Research'
  | 'Design'
  | 'Sports'
  | 'Literature'
  | 'Entrepreneurship'
  | 'Other';

export type AchievementCategory =
  | 'Academic'
  | 'Competition'
  | 'Certifications'
  | 'Projects'
  | 'Leadership'
  | 'Volunteering'
  | 'Sports & Extracurricular';

export interface EducationRecord {
  id: string;
  institution: string;
  university: string;
  courseProgram: string;
  stream: string;
  specialization: string;
  academicYear: string;
  semesterOrClass: string;
  enrollmentYear: string;
  graduationYear: string;
  academicInterests: string;
  description: string;
  isCurrent: boolean;
}

export interface StudentSkill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
}

export interface StudentAchievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  issuer: string;
  dateISO: string;
  imageUrl?: string;
  lockerDocId?: string;
  lockerDocTitle?: string;
  verified: boolean;
  reported?: boolean;
}

export interface StudentProject {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  imageUrl?: string;
  repoUrl?: string;
  liveUrl?: string;
  completionDateISO: string;
  teamMode: 'Individual' | 'Team';
  orderIndex: number;
}

export interface ProfilePrivacySettings {
  visibility: ProfileVisibility;
  showPhoto: boolean;
  showBio: boolean;
  showAcademic: boolean;
  showSkills: boolean;
  showAchievements: boolean;
  showProjects: boolean;
  showActivity: boolean;
  showContactInfo: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showDob: boolean;
  showGender: boolean;
}

export interface StudentProfileRecord {
  userId: string;
  fullName: string;
  username: string;
  headline: string;
  avatarUrl: string;
  coverUrl: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  preferredLanguage: string;
  bio: string;
  careerGoals: string;
  college: string;
  university: string;
  course: string;
  specialization: string;
  semester: string;
  enrollmentNo: string;
  isVerified: boolean;
  verificationSource: string | null;
  educationRecords: EducationRecord[];
  skills: StudentSkill[];
  interests: Array<{ name: string; category: InterestCategory }>;
  achievements: StudentAchievement[];
  projects: StudentProject[];
  privacy: ProfilePrivacySettings;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletionSummary {
  percentage: number;
  missingSections: string[];
  suggestedActions: string[];
}

export interface RealProfileStats {
  notesUploaded: number;
  communityContributions: number;
  eventsParticipated: number;
  projectsCompleted: number;
  achievementsEarned: number;
  studyGoalsCompleted: number;
}

export interface ConsolidatedActivityItem {
  id: string;
  category: 'Community' | 'Notes' | 'Events' | 'Career' | 'Study' | 'Rewards' | 'Projects';
  title: string;
  subtitle: string;
  dateISO: string;
  linkRoute: string;
}

export interface EligibleLockerCertificate {
  id: string;
  title: string;
  category: string;
  uploadedAt: string;
}

export interface UnlockedRewardBadge {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
}

export interface ProfileReportRecord {
  id: string;
  targetUserId: string;
  targetName: string;
  targetType: 'Profile' | 'Achievement' | 'Project';
  targetItemId?: string;
  reason: string;
  reporterId: string;
  status: 'Open' | 'Resolved' | 'Removed';
  createdAt: string;
}

// ==================================================
// SETTINGS & PREFERENCES MODELS (FEATURE 21)
// ==================================================

export interface UserSettingsRecord {
  userId: string;
  account: {
    status: 'Active' | 'Deactivated' | 'Deletion Requested';
    emailVerified: boolean;
    phoneVerified: boolean;
    passwordLastChangedAt: string | null;
    loginMethods: string[];
    createdAt: string;
  };
  privacy: {
    profileVisibility: ProfileVisibility;
    activityVisibility: {
      community: boolean;
      notes: boolean;
      achievements: boolean;
      events: boolean;
      projects: boolean;
    };
    discovery: {
      searchableByStudents: boolean;
      studyPartnerDiscovery: boolean;
      allowProfileSharing: boolean;
      allowMentions: boolean;
    };
    messaging: {
      messageRequestsFrom: 'Everyone' | 'College Peers' | 'Connections Only';
      postInteractionsFrom: 'Everyone' | 'KAMPUS Members';
    };
    blockedUsers: Array<{ id: string; name: string }>;
    mutedUsers: Array<{ id: string; name: string }>;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    density: 'comfortable' | 'compact';
    reduceMotion: boolean;
    sidebarBehavior: 'expanded' | 'collapsed';
  };
  languageRegion: {
    language: 'en' | 'hi';
    country: string;
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
    weekStartDay: 'Monday' | 'Sunday';
  };
  accessibility: {
    textSize: 'default' | 'large' | 'xlarge';
    highContrast: boolean;
    reduceMotion: boolean;
    enhancedFocusIndicators: boolean;
    screenReaderHints: boolean;
  };
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  deviceLabel: string;
  browserLabel: string;
  lastActiveAt: string;
  isCurrent: boolean;
  active: boolean;
}

export interface SecurityAuditEvent {
  id: string;
  userId: string;
  eventType: string;
  description: string;
  timestamp: string;
}

export interface ConnectedServiceItem {
  id: string;
  name: string;
  status: 'Connected' | 'Available' | 'Not Configured';
  permissions: string;
  accountLabel: string;
  lastSyncedAt: string | null;
  canDisconnect: boolean;
}

export interface StorageOverview {
  lockerBytes: number;
  lockerDocumentsCount: number;
  profileItemsCount: number;
  notificationsCount: number;
}

export interface DeletionRequestRecord {
  id: string;
  userId: string;
  reason: string;
  status: 'Submitted' | 'In Review' | 'Cancelled';
  requestedAt: string;
}

export interface SupportTicketRecord {
  id: string;
  userId: string;
  category: 'Bug Report' | 'Account Issue' | 'Privacy & Safety' | 'Feature Feedback' | 'General Help';
  subject: string;
  description: string;
  attachmentName?: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
}
