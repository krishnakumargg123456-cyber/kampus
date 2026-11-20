export type CommunityLanguage = 'en' | 'hi';

export type CommunityCategory =
  | 'Academic'
  | 'Exam Preparation'
  | 'College Life'
  | 'Career & Skills'
  | 'General';

export type PostType =
  | 'General Discussion'
  | 'Ask a Question'
  | 'Share Study Tips'
  | 'Share an Achievement'
  | 'Share a Resource'
  | 'Academic Announcement';

export type QuestionSubject =
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Mathematics'
  | 'Computer Science'
  | 'Commerce'
  | 'Humanities'
  | 'Engineering'
  | 'Medical'
  | 'Pharmacy'
  | 'Other';

export type QuestionStatus = 'Unanswered' | 'Answered' | 'Solved';

export type FeedTab =
  | 'For You'
  | 'Following'
  | 'Trending'
  | 'Latest'
  | 'Questions'
  | 'Discussions'
  | 'Announcements'
  | 'Study Tips'
  | 'Achievements';

export type CommunityWorkspaceTab =
  | 'feed'
  | 'qa'
  | 'communities'
  | 'polls-resources'
  | 'contributors'
  | 'activity';

export type CommunityDetailTab =
  | 'Overview'
  | 'Discussions'
  | 'Questions'
  | 'Members'
  | 'Resources'
  | 'Announcements'
  | 'Rules';

export type CommunityMemberRole = 'Owner' | 'Moderator' | 'Member';

export type BadgeName =
  | 'Helpful Member'
  | 'Knowledge Sharer'
  | 'Discussion Starter'
  | 'Community Supporter'
  | 'Top Contributor';

export type ReportReason =
  | 'Spam'
  | 'Harassment'
  | 'Bullying'
  | 'Misleading information'
  | 'Inappropriate content'
  | 'Copyright violation'
  | 'Other';

export type ReportStatus = 'Submitted' | 'Under Review' | 'Resolved' | 'Dismissed';

export type ActivitySubTab =
  | 'My Posts'
  | 'My Questions'
  | 'My Answers'
  | 'Saved Posts'
  | 'Liked Posts'
  | 'Followed Communities'
  | 'Followed Students'
  | 'My Polls'
  | 'Drafts';

export interface CommunityAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  kind: 'image' | 'document';
  sizeBytes: number;
  dataUrl: string;
  resourceUrl?: string;
}

export interface CommunityReply {
  id: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorCourse: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  upvoterIds: string[];
}

export interface CommunityAnswer {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorCourse: string;
  content: string;
  attachment?: CommunityAttachment;
  createdAt: string;
  updatedAt?: string;
  upvoterIds: string[];
  helpfulVoterIds: string[];
  isAccepted: boolean;
  replies: CommunityReply[];
}

export interface PollOption {
  id: string;
  label: string;
  voterIds: string[];
}

export interface CommunityPoll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorCourse: string;
  authorSemester: string;
  type: PostType;
  title: string;
  content: string;
  subject?: QuestionSubject;
  academicLevel?: string;
  topicTag?: string;
  tags: string[];
  attachment?: CommunityAttachment;
  poll?: CommunityPoll;
  createdAt: string;
  updatedAt?: string;
  upvoterIds: string[];
  helpfulIds: string[];
  bookmarkedByIds: string[];
  answers: CommunityAnswer[];
  comments: CommunityReply[];
  questionStatus?: QuestionStatus;
  acceptedAnswerId?: string;
  isPinned?: boolean;
  isOfficialAnnouncement?: boolean;
  pendingApproval?: boolean;
  isDemoContent?: boolean;
  linkedResourceType?: 'Notes' | 'Book' | 'Guide' | 'PYQ';
  linkedResourceTitle?: string;
  linkedResourceSummary?: string;
}

export interface CommunityPostDraft {
  id: string;
  communityId: string;
  type: PostType;
  title: string;
  content: string;
  subject?: QuestionSubject;
  academicLevel?: string;
  topicTag?: string;
  tags: string[];
  attachment?: CommunityAttachment;
  hasPoll?: boolean;
  pollQuestion?: string;
  pollOptions?: string[];
  pollAllowMultiple?: boolean;
  pollExpiresAt?: string;
  linkedResourceType?: 'Notes' | 'Book' | 'Guide' | 'PYQ';
  linkedResourceTitle?: string;
  savedAt: string;
}

export interface CommunityMemberRecord {
  studentId: string;
  role: CommunityMemberRole;
  joinedAt: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  category: CommunityCategory;
  description: string;
  coverImage: string;
  rules: string[];
  requirePostApproval: boolean;
  members: CommunityMemberRecord[];
  trendingTags: string[];
  createdAt: string;
  isDemoCommunity: boolean;
  upcomingActivity?: {
    title: string;
    dateLabel: string;
    type: 'Discussion' | 'Q&A Session' | 'Study Sprint' | 'Workshop';
  };
}

export interface PublicStudentProfile {
  id: string;
  name: string;
  avatarUrl: string;
  course: string;
  semester: string;
  college: string;
  intro: string;
  interests: string[];
  isDemoProfile: boolean;
}

export interface SafetyReport {
  id: string;
  targetType: 'post' | 'answer' | 'comment' | 'student' | 'community';
  targetId: string;
  targetTitle: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
}

export interface CommunityNotificationPrefs {
  replies: boolean;
  acceptedAnswers: boolean;
  announcements: boolean;
  polls: boolean;
  newPostsInFollowed: boolean;
}

export interface CommunityState {
  communities: CommunityGroup[];
  posts: CommunityPost[];
  drafts: CommunityPostDraft[];
  publicStudents: PublicStudentProfile[];
  followedStudentIds: string[];
  blockedStudentIds: string[];
  mutedCommunityIds: string[];
  mutedPostIds: string[];
  recentSearches: string[];
  reports: SafetyReport[];
  notificationPrefs: CommunityNotificationPrefs;
}
