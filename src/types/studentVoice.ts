export type VoiceRole =
  | 'Student'
  | 'Authorized Reviewer'
  | 'Department Admin'
  | 'Institution Admin'
  | 'Platform Admin';

export type FeedbackType =
  | 'General Feedback'
  | 'Complaint'
  | 'Suggestion'
  | 'Appreciation'
  | 'Improvement Request';

export type PrivacyMode = 'Identified' | 'Confidential' | 'Anonymous';

export type SubmissionStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Student Response'
  | 'Resolved'
  | 'Closed'
  | 'Rejected';

export type PriorityLevel = 'Low' | 'Normal' | 'High' | 'Urgent';

export type IdeaStatus =
  | 'Under Review'
  | 'Accepted'
  | 'Planned'
  | 'Implemented'
  | 'Not Approved';

export type PollType =
  | 'Single-Choice Poll'
  | 'Multiple-Choice Poll'
  | 'Rating Survey'
  | 'Text Feedback Survey'
  | 'Department Survey'
  | 'Campus Improvement Survey';

export interface VoiceCategoryGroup {
  id: string;
  groupName: string;
  items: string[];
}

export interface VoiceAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  actorLabel: string;
  message: string;
  createdAt: string;
}

export interface OfficialResponse {
  id: string;
  department: string;
  responderRole: string;
  message: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface InternalAdminNote {
  id: string;
  authorLabel: string;
  note: string;
  createdAt: string;
}

export interface StudentFollowUp {
  id: string;
  message: string;
  createdAt: string;
}

export interface VoiceSubmission {
  id: string;
  referenceNumber: string;
  ownerId: string | null; // null for Anonymous
  submitterTokenHash: string; // lets submitter track own anonymous item if needed, without identity
  visibleAuthorName: string;
  confidentialIdentityMasked?: boolean;
  confidentialRealName?: string; // ONLY populated in API response for Platform Admin / Institution Admin
  confidentialRealEmail?: string;
  title: string;
  feedbackType: FeedbackType;
  categoryGroup: string;
  categoryItem: string;
  department: string;
  description: string;
  location: string;
  incidentDateISO?: string;
  desiredOutcome: string;
  privacyMode: PrivacyMode;
  status: SubmissionStatus;
  priority: PriorityLevel;
  assignedDepartment?: string;
  assignedReviewer?: string;
  escalated: boolean;
  publishedToTransparency: boolean;
  attachments: VoiceAttachment[];
  timeline: TimelineEvent[];
  officialResponses: OfficialResponse[];
  studentFollowUps: StudentFollowUp[];
  internalNotes?: InternalAdminNote[]; // Stripped from Student responses
  createdAt: string;
  updatedAt: string;
  firstRespondedAt?: string;
  resolvedAt?: string;
}

export interface VoiceIdeaComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface VoiceIdea {
  id: string;
  ownerId: string;
  authorName: string;
  title: string;
  description: string;
  category: string;
  expectedBenefits: string;
  attachments: VoiceAttachment[];
  status: IdeaStatus;
  supporterIds: string[];
  comments: VoiceIdeaComment[];
  createdAt: string;
  updatedAt: string;
}

export interface VoicePoll {
  id: string;
  title: string;
  description: string;
  pollType: PollType;
  department: string;
  options: Array<{ id: string; label: string }>;
  closingDateISO: string;
  isAnonymousVoting: boolean;
  showResultsAfterVoting: boolean;
  participationRules: string;
  createdByRole: string;
  createdAt: string;
  status: 'Open' | 'Closed';
}

export interface VoicePollResponse {
  id: string;
  pollId: string;
  voterId: string | null;
  voterHash: string;
  selectedOptionIds: string[];
  ratingValue?: number;
  textAnswer?: string;
  createdAt: string;
}

export interface InstitutionalUpdate {
  id: string;
  title: string;
  department: string;
  summary: string;
  actionTaken: string;
  status: 'Active Initiative' | 'Completed' | 'Notice';
  completionDateISO?: string;
  createdAt: string;
}

export interface VoiceAbuseReport {
  id: string;
  reporterId: string;
  targetType: 'idea' | 'comment';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  status: 'Submitted' | 'Reviewed';
  createdAt: string;
}

export interface VoiceAuditLog {
  id: string;
  actorRole: VoiceRole;
  action: string;
  targetRef: string;
  createdAt: string;
}
