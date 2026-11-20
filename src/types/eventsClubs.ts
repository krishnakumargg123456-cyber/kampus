export type EventCategoryId =
  | 'Academic'
  | 'Technology'
  | 'Cultural'
  | 'Sports'
  | 'Career'
  | 'Social';

export type ClubCategoryId =
  | 'Technical'
  | 'Creative'
  | 'Academic'
  | 'Career & Entrepreneurship'
  | 'Sports & Wellness'
  | 'Social';

export type EventFormat = 'Offline' | 'Online' | 'Hybrid';

export type EventOriginType =
  | 'Official Institutional Event'
  | 'Verified Organizer Event'
  | 'Student-Organized Event'
  | 'External Event';

export type RegistrationStatus =
  | 'Not Registered'
  | 'Registration Pending'
  | 'Confirmed'
  | 'Waitlisted'
  | 'Rejected'
  | 'Cancelled';

export type CheckInStatus =
  | 'Not Checked In'
  | 'Checked In'
  | 'Invalid Credential'
  | 'Already Used';

export type ClubRole =
  | 'Club President'
  | 'Vice President'
  | 'Club Admin'
  | 'Event Coordinator'
  | 'Faculty Coordinator'
  | 'Member';

export type MembershipStatus =
  | 'Not Joined'
  | 'Request Pending'
  | 'Approved'
  | 'Rejected'
  | 'Member'
  | 'Inactive';

export type CertificateType =
  | 'Participation'
  | 'Winner'
  | 'Volunteer'
  | 'Organizer';

export interface EventScheduleItem {
  time: string;
  title: string;
  speakerOrLead?: string;
}

export interface EventSpeaker {
  name: string;
  role: string;
  organization: string;
}

export interface EventFaq {
  question: string;
  answer: string;
}

export interface EventAnnouncement {
  id: string;
  title: string;
  message: string;
  authorName: string;
  createdAt: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  highlights: string[];
  category: EventCategoryId;
  subType: string;
  coverKey: 'tech' | 'cultural' | 'workshop';
  coverImageUrl?: string;
  college: string;
  department: string;
  organizerId: string;
  organizerName: string;
  organizerClubId?: string;
  originType: EventOriginType;
  format: EventFormat;
  startDateISO: string;
  endDateISO: string;
  startTime: string;
  endTime: string;
  venue: string;
  onlineMeetingInfo?: string;
  externalUrl?: string;
  registrationDeadlineISO: string;
  eligibility: string;
  participationMode: 'Individual' | 'Team' | 'Both';
  minTeamSize: number;
  maxTeamSize: number;
  maxSeats: number;
  entryFeeInr: number;
  requiresApproval: boolean;
  requiredQuestions: string[];
  schedule: EventScheduleItem[];
  speakers: EventSpeaker[];
  organizingTeam: Array<{ name: string; role: string }>;
  rules: string[];
  requiredMaterials: string[];
  faqs: EventFaq[];
  status: 'Draft' | 'Pending Approval' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  isFeatured?: boolean;
  announcements: EventAnnouncement[];
  createdById: string;
  createdAt: string;
}

export interface EventTeamMember {
  userId?: string;
  name: string;
  email: string;
  role: 'Leader' | 'Member';
  inviteStatus: 'Accepted' | 'Pending' | 'Rejected';
}

export interface EventTeam {
  id: string;
  eventId: string;
  teamName: string;
  leaderId: string;
  leaderName: string;
  members: EventTeamMember[];
  createdAt: string;
}

export interface EventRegistration {
  id: string;
  referenceCode: string;
  eventId: string;
  userId: string;
  studentName: string;
  kampusIdRef?: string;
  college: string;
  course: string;
  department: string;
  email: string;
  contactInfo?: string;
  participationType: 'Individual' | 'Team';
  teamId?: string;
  teamName?: string;
  answers: Record<string, string>;
  status: RegistrationStatus;
  checkInStatus: CheckInStatus;
  checkedInAt?: string;
  checkedInBy?: string;
  registeredAt: string;
}

export interface EventCertificate {
  id: string;
  certificateRef: string;
  eventId: string;
  eventTitle: string;
  organizerName: string;
  userId: string;
  studentName: string;
  certificateType: CertificateType;
  issuedBy: string;
  issuedAt: string;
}

export interface CampusClub {
  id: string;
  name: string;
  shortCode: string;
  category: ClubCategoryId;
  subCategory: string;
  college: string;
  description: string;
  mission: string;
  objectives: string[];
  mainActivities: string[];
  meetingSchedule: string;
  facultyCoordinator?: string;
  visibility: 'Public' | 'Private';
  coverKey: 'tech' | 'cultural' | 'workshop';
  createdAt: string;
}

export interface ClubMembership {
  id: string;
  clubId: string;
  userId: string;
  studentName: string;
  course: string;
  semester: string;
  role: ClubRole;
  status: MembershipStatus;
  joinReason: string;
  interests: string[];
  skills: string[];
  previousExperience: string;
  portfolioUrl?: string;
  showInPublicMembers: boolean;
  invitedBy?: string;
  updatedAt: string;
}

export interface ClubActivity {
  id: string;
  clubId: string;
  title: string;
  description: string;
  dateISO: string;
  location: string;
  kind: 'Upcoming' | 'Past';
  createdAt: string;
}

export interface ClubAnnouncement {
  id: string;
  clubId: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface ClubGalleryItem {
  id: string;
  clubId: string;
  caption: string;
  imageUrl: string;
  uploadedByName: string;
  createdAt: string;
}

export interface EventFeedback {
  id: string;
  eventId: string;
  userId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface EventsClubsReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'event' | 'club' | 'content';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  status: 'Submitted' | 'Reviewed';
  createdAt: string;
}
