export type SkillCategoryId =
  | 'technology'
  | 'creative'
  | 'business'
  | 'communication'
  | 'academic'
  | 'practical'
  | 'personal-development';

export interface SkillCategoryDef {
  id: SkillCategoryId;
  name: string;
  description: string;
  skills: string[];
}

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Mentor-Ready';

export type ExperienceDuration = '< 6 Months' | '6-12 Months' | '1-2 Years' | '2+ Years';

export type DeliveryMode = 'Online' | 'In-Person' | 'Hybrid';

export type GroupTeachingMode = 'Individual (1-on-1)' | 'Small Group' | 'Both';

export type ExchangePreference =
  | 'Skill Exchange'
  | 'Teaching Only'
  | 'Learning Collaboration';

export type ListingIntent = 'Teaching Offer' | 'Learning Request';

export interface SkillListing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerCollege: string;
  ownerCourse: string;
  intent: ListingIntent;
  skillName: string;
  categoryId: SkillCategoryId;
  description: string;
  topics: string[];
  proficiency: SkillProficiency;
  experienceLevel: ExperienceDuration;
  whatStudentsLearn: string;
  teachingApproach: string;
  sessionDurationMinutes: number;
  language: string;
  groupMode: GroupTeachingMode;
  deliveryMode: DeliveryMode;
  exchangePreference: ExchangePreference;
  desiredSkill: string;
  desiredProficiency: SkillProficiency;
  learningGoals: string;
  preferredPartner: string;
  availableDays: string[];
  preferredTime: string;
  weeklyHours: number;
  status: 'active' | 'paused';
  verificationLabel: 'Self-Reported' | 'Campus Project Verified';
  portfolioPreviewUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaughtSkillEntry {
  id: string;
  skillName: string;
  categoryId: SkillCategoryId;
  proficiency: SkillProficiency;
  experience: ExperienceDuration;
  topicsCovered: string[];
  availabilityNote: string;
  verificationLabel: 'Self-Reported' | 'Campus Project Verified';
}

export interface DesiredSkillEntry {
  id: string;
  skillName: string;
  categoryId: SkillCategoryId;
  preferredLevel: SkillProficiency;
  learningGoal: string;
}

export interface SkillPortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  linkUrl?: string;
  imageUrl?: string;
}

export interface StudentSkillProfile {
  userId: string;
  name: string;
  college: string;
  course: string;
  semester: string;
  intro: string;
  languages: string[];
  learningInterests: string[];
  skillsToTeach: TaughtSkillEntry[];
  skillsToLearn: DesiredSkillEntry[];
  portfolio: SkillPortfolioItem[];
  projects: Array<{ id: string; title: string; summary: string; url?: string }>;
  achievements: string[];
  learningPreferences: {
    format: DeliveryMode;
    groupMode: GroupTeachingMode;
    sessionDurationMinutes: number;
  };
  availability: {
    days: string[];
    preferredTime: string;
    weeklyHours: number;
  };
  privacySettings: {
    showCollegeDetails: boolean;
    allowDirectRequests: boolean;
    allowMessagesFromPeers: boolean;
  };
  updatedAt: string;
}

export type SkillRequestType =
  | 'learn-skill'
  | 'teach-requested'
  | 'exchange'
  | 'collaborate';

export type SkillRequestStatus =
  | 'Pending'
  | 'Accepted'
  | 'Declined'
  | 'Cancelled'
  | 'Completed';

export interface SkillExchangeRequest {
  id: string;
  requestType: SkillRequestType;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  listingId?: string;
  requestedSkill: string;
  offeredSkill: string;
  learningGoals: string;
  preferredAvailability: string;
  message: string;
  status: SkillRequestStatus;
  exchangeId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SharedResourceKind =
  | 'PDF Document'
  | 'Study Notes'
  | 'Presentation'
  | 'Image'
  | 'Project Link'
  | 'Video Link'
  | 'Practice Assignment'
  | 'Useful Website';

export interface SharedSkillResource {
  id: string;
  trackId: string;
  kind: SharedResourceKind;
  title: string;
  url: string;
  fileName?: string;
  sizeBytes?: number;
  sharedById: string;
  sharedByName: string;
  createdAt: string;
}

export interface LearningTrack {
  id: string;
  learnerId: string;
  learnerName: string;
  mentorId: string;
  mentorName: string;
  skillName: string;
  objectives: string[];
  topics: Array<{ id: string; title: string; done: boolean }>;
  tasks: Array<{ id: string; title: string; done: boolean }>;
  milestones: Array<{ id: string; title: string; done: boolean }>;
  resources: SharedSkillResource[];
}

export type SkillSessionStatus =
  | 'Scheduled'
  | 'Upcoming'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export interface SkillSession {
  id: string;
  exchangeId: string;
  topic: string;
  dateISO: string;
  timeSlot: string;
  durationMinutes: number;
  objectives: string;
  prepNotes: string;
  status: SkillSessionStatus;
  createdById: string;
  updatedAt: string;
}

export interface SkillExchange {
  id: string;
  requestId: string;
  studentAId: string;
  studentAName: string;
  studentBId: string;
  studentBName: string;
  skillAForB: string;
  skillBForA: string;
  exchangeType: ExchangePreference;
  status: 'Active' | 'Completed' | 'Cancelled';
  objectives: string[];
  tracks: LearningTrack[];
  sessions: SkillSession[];
  createdAt: string;
  completedAt?: string;
}

export interface SkillReview {
  id: string;
  exchangeId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  learningExperience: number;
  communication: number;
  reliability: number;
  teachingClarity: number;
  writtenReview: string;
  createdAt: string;
}

export interface SkillSwapReport {
  id: string;
  reporterId: string;
  targetType: 'profile' | 'listing' | 'review';
  targetId: string;
  targetSummary: string;
  reason: string;
  details: string;
  status: 'Submitted';
  createdAt: string;
}

export interface SkillSwapBootstrapResponse {
  categories: SkillCategoryDef[];
  profiles: StudentSkillProfile[];
  listings: SkillListing[];
  requests: SkillExchangeRequest[];
  exchanges: SkillExchange[];
  reviews: SkillReview[];
  savedStudentIds: string[];
  blockedUserIds: string[];
  reports: SkillSwapReport[];
}
