export type CampusPulseRole =
  | 'Institutional Admin'
  | 'Department Admin'
  | 'Authorized Publisher'
  | 'Student';

export type PulseCategoryId =
  | 'official-notices'
  | 'academic-updates'
  | 'examination-updates'
  | 'admission-registration'
  | 'campus-news'
  | 'facility-updates'
  | 'student-information';

export type NoticeStatus = 'New' | 'Important' | 'Urgent' | 'Archived';

export type AlertPriority = 'Critical' | 'High' | 'Normal' | 'Informational';

export type AlertType =
  | 'Examination deadline'
  | 'Registration deadline'
  | 'Class cancellation'
  | 'Schedule changes'
  | 'Campus closure'
  | 'Important administrative update'
  | 'Facility disruption'
  | 'Emergency campus announcement';

export type FacilityCategory =
  | 'Library'
  | 'Hostel'
  | 'Transport'
  | 'Cafeteria'
  | 'Laboratories'
  | 'Other Facilities';

export type LostFoundCategory =
  | 'ID Cards'
  | 'Books'
  | 'Electronics'
  | 'Bags'
  | 'Documents'
  | 'Accessories'
  | 'Other';

export type SubmissionPostType =
  | 'Campus Information'
  | 'Lost & Found'
  | 'Student Update'
  | 'Facility Information'
  | 'Campus Suggestion';

export type ModerationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected';

export type DeadlineKind =
  | 'Examination'
  | 'Assignment'
  | 'Registration'
  | 'Academic Event'
  | 'Application'
  | 'Holiday'
  | 'Semester Date';

export type PollPurpose =
  | 'Student Preferences'
  | 'Campus Improvement'
  | 'Facility Feedback'
  | 'Academic Experience'
  | 'General Opinion';

export interface CampusInstitution {
  id: string;
  name: string;
  shortName: string;
  location: string;
  institutionType: string;
  verificationStatus: 'Verified Institutional Source' | 'Self-Described Directory Entry';
  verificationNote: string;
  description: string;
  academicSession: string;
}

export interface CampusDepartment {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  description: string;
  officeLocation: string;
  officeHours: string;
  restrictedPolicyNote: string;
}

export interface PulseAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  kind: 'pdf' | 'image' | 'document';
}

export interface CampusAnnouncement {
  id: string;
  institutionId: string;
  circularCode?: string;
  title: string;
  summary: string;
  content: string;
  categoryId: PulseCategoryId;
  subcategory: string;
  departmentId: string;
  departmentName: string;
  targetCourse?: string;
  targetSemester?: string;
  targetYear?: string;
  authorId: string;
  authorName: string;
  authorRole: CampusPulseRole;
  publishingAuthority: string;
  isOfficial: boolean;
  verificationLabel:
    | 'Authorized Institutional Notice'
    | 'Authorized Department Notice'
    | 'Approved Student Submission';
  status: NoticeStatus;
  priority: AlertPriority;
  isPinned: boolean;
  isRestricted?: boolean;
  restrictedAudienceLabel?: string;
  publishedAt: string;
  deadlineAt?: string;
  expiresAt?: string;
  attachments: PulseAttachment[];
  viewCount: number;
  moderationStatus: 'Approved' | 'Under Review' | 'Rejected';
}

export interface CampusAlert {
  id: string;
  institutionId: string;
  alertType: AlertType;
  title: string;
  priority: AlertPriority;
  description: string;
  publishingSource: string;
  departmentName: string;
  publishedAt: string;
  expiresAt?: string;
  isOfficial: boolean;
  relatedAnnouncementId?: string;
}

export interface AcademicDeadline {
  id: string;
  institutionId: string;
  title: string;
  kind: DeadlineKind;
  dateISO: string;
  timeLabel?: string;
  departmentId: string;
  departmentName: string;
  targetSemester?: string;
  description: string;
  source: string;
  isConfirmedOfficial: boolean;
  relatedAnnouncementId?: string;
}

export interface FacilityUpdate {
  id: string;
  institutionId: string;
  facilityCategory: FacilityCategory;
  facilityName: string;
  title: string;
  details: string;
  operatingInfo: string;
  statusNote: string;
  source: string;
  isOfficial: boolean;
  lastUpdatedAt: string;
}

export interface LostFoundPost {
  id: string;
  institutionId: string;
  postType: 'Lost Item' | 'Found Item';
  itemName: string;
  category: LostFoundCategory;
  description: string;
  imageUrl?: string;
  approximateLocation: string;
  dateISO: string;
  posterId: string;
  posterName: string;
  posterDepartment: string;
  status: 'Open' | 'Recovered';
  createdAt: string;
}

export interface CampusPollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface CampusPoll {
  id: string;
  institutionId: string;
  question: string;
  purpose: PollPurpose;
  options: CampusPollOption[];
  votedUserIds: string[];
  closesAt: string;
  isAnonymous: boolean;
  createdById: string;
  createdByName: string;
  createdByRole: CampusPulseRole;
  createdAt: string;
}

export interface StudentSubmission {
  id: string;
  institutionId: string;
  postType: SubmissionPostType;
  title: string;
  categoryId: PulseCategoryId;
  departmentId: string;
  departmentName: string;
  description: string;
  supportingInfo: string;
  attachments: PulseAttachment[];
  authorId: string;
  authorName: string;
  moderationStatus: ModerationStatus;
  moderatorNote?: string;
  publishedAnnouncementId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PulseReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'announcement' | 'lost-found' | 'poll' | 'submission';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  status: 'Submitted' | 'Reviewed' | 'Dismissed';
  createdAt: string;
}

export interface PulseNotificationPrefs {
  officialNotices: boolean;
  examAlerts: boolean;
  upcomingDeadlines: boolean;
  departmentUpdates: boolean;
  classChanges: boolean;
  facilityDisruptions: boolean;
  pollReminders: boolean;
  moderationUpdates: boolean;
}

export interface ReadingHistoryItem {
  announcementId: string;
  title: string;
  categoryId: PulseCategoryId;
  viewedAt: string;
}

export interface PublisherRecord {
  userId: string;
  name: string;
  role: CampusPulseRole;
  assignedDepartmentId?: string;
  assignedDepartmentName?: string;
  grantedBy: string;
  grantedAt: string;
}

export interface PulseAnalyticsSnapshot {
  totalPublishedAnnouncements: number;
  officialCount: number;
  studentApprovedCount: number;
  byCategory: Array<{ categoryId: PulseCategoryId; label: string; count: number }>;
  recentPublishingActivity: Array<{
    id: string;
    title: string;
    authorName: string;
    isOfficial: boolean;
    publishedAt: string;
  }>;
  mostViewedAnnouncements: Array<{
    id: string;
    title: string;
    categoryId: PulseCategoryId;
    viewCount: number;
  }>;
  studentSubmissionsSummary: {
    total: number;
    drafts: number;
    submittedOrReview: number;
    approved: number;
    rejected: number;
  };
  pendingModerationRequests: number;
  pendingReportsCount: number;
  pollParticipation: Array<{
    pollId: string;
    question: string;
    totalVotes: number;
  }>;
}

export type PulseAiAction =
  | 'summarize'
  | 'simple-explain'
  | 'extract-deadlines'
  | 'bullet-summary'
  | 'translate-hindi'
  | 'translate-hinglish'
  | 'ask-question';
