export type InstitutionalVerificationState =
  | 'Not Submitted'
  | 'Pending Review'
  | 'Verified'
  | 'Verification Not Available'
  | 'Rejected';

export type KampusIdRole = 'Student' | 'Authorized Verifier' | 'Platform Admin';

export interface KampusIdPrivacySettings {
  profileVisibility: 'Public' | 'Platform Only' | 'Private';
  photoVisibility: boolean;
  collegeVisibility: boolean;
  academicVisibility: boolean;
  skillsVisibility: boolean;
  achievementsVisibility: boolean;
  clubsVisibility: boolean;
}

export interface KampusIdActivityEntry {
  id: string;
  action:
    | 'ID Created'
    | 'Profile Updated'
    | 'QR Regenerated'
    | 'Verification Requested'
    | 'Verification Reviewed'
    | 'Privacy Updated'
    | 'PDF Downloaded';
  detail: string;
  timestamp: string;
}

export interface VerificationStatusBreakdown {
  kampusAccount: 'Active' | 'Suspended';
  profileCompleted: boolean;
  emailVerified: boolean;
  institutionalInfoProvided: boolean;
  institutionalVerification: InstitutionalVerificationState;
  institutionalNote?: string;
}

export interface KampusIdentityRecord {
  kampusIdNumber: string; // Immutable KMP-26-XXXXXX
  publicSlug: string; // Safe shareable slug
  userId: string; // Owner-only internal key (never exposed publicly or in QR)
  fullName: string;
  avatarUrl: string;
  college: string;
  department: string;
  course: string;
  academicYearOrSemester: string;
  enrollmentNo: string;
  bio: string;
  skills: string[];
  interests: string[];
  accountStatus: 'Active' | 'Inactive';
  cardVersion: string;
  issuedAt: string;
  updatedAt: string;
  verification: VerificationStatusBreakdown;
  privacy: KampusIdPrivacySettings;
  activityHistory: KampusIdActivityEntry[];
}

export interface VerificationReviewRequest {
  id: string;
  kampusIdNumber: string;
  userId: string;
  studentName: string;
  college: string;
  course: string;
  enrollmentNo: string;
  institutionEmailDomain: string;
  supportingNote: string;
  status: 'Pending Review' | 'Verified' | 'Verification Not Available' | 'Rejected';
  reviewerNote?: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface GenuineConnectedSummary {
  eventsRegisteredCount: number;
  eventsCheckedInCount: number;
  certificates: Array<{
    certificateRef: string;
    eventTitle: string;
    certificateType: string;
    issuedAt: string;
  }>;
  clubsJoined: Array<{
    clubName: string;
    category: string;
    role: string;
  }>;
  skillSwapCompletedCount: number;
  skillsOffered: string[];
}

export interface PublicVerifiedIdentityPayload {
  status: 'Valid' | 'Expired' | 'Invalid' | 'Private';
  message: string;
  kampusIdNumber?: string;
  fullName?: string;
  avatarUrl?: string;
  college?: string;
  course?: string;
  department?: string;
  academicYearOrSemester?: string;
  accountStatus?: 'Active' | 'Inactive';
  verificationState?: InstitutionalVerificationState;
  profileCompleted?: boolean;
  emailVerified?: boolean;
  skills?: string[];
  achievementsCount?: number;
  clubsCount?: number;
  issuedAt?: string;
  expiresAt?: string;
  disclaimer: string;
}
