export type CollegeType =
  | 'University'
  | 'Government College'
  | 'Private College'
  | 'Deemed University'
  | 'Autonomous College'
  | 'Medical College'
  | 'Engineering College'
  | 'Pharmacy College'
  | 'Management College'
  | 'Arts and Science College'
  | 'Law College'
  | 'Nursing College'
  | 'Polytechnic Institution';

export type DegreeLevel =
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Diploma'
  | 'Professional'
  | 'Certificate';

export type AdmissionStatus =
  | 'Open'
  | 'Closing Soon'
  | 'Upcoming'
  | 'Closed'
  | 'Check Official Portal';

export type DataVerificationStatus =
  | 'Sample Development Record'
  | 'Verified Provider Record'
  | 'Admin Managed Record';

export type ExplorerRole =
  | 'Student'
  | 'Education Data Editor'
  | 'Moderator'
  | 'Platform Admin';

export type TrackerApplicationStatus =
  | 'Interested'
  | 'Researching'
  | 'Preparing Documents'
  | 'Application Started'
  | 'Applied'
  | 'Entrance Examination'
  | 'Interview'
  | 'Selected'
  | 'Waitlisted'
  | 'Rejected';

export type ReviewCategory =
  | 'Academics'
  | 'Faculty'
  | 'Campus Facilities'
  | 'Hostel'
  | 'Infrastructure'
  | 'Student Support'
  | 'Placement Support'
  | 'Campus Environment';

export type ScholarshipCategory =
  | 'Government'
  | 'University'
  | 'Merit-Based'
  | 'Need-Based'
  | 'Category-Specific'
  | 'Private';

export interface CollegeCourseOffering {
  courseId: string;
  name: string;
  degreeType: DegreeLevel;
  degreeShort: string;
  stream: string;
  department: string;
  duration: string;
  eligibility: string;
  entranceExams: string[];
  annualTuitionFeeINR: number | null;
  intakeSeats?: number | null;
}

export interface CollegeFeeInfo {
  tuitionRangeLabel: string;
  minAnnualTuitionINR: number | null;
  maxAnnualTuitionINR: number | null;
  admissionFeeLabel: string;
  hostelFeeLabel: string;
  otherChargesLabel: string;
  scholarshipsSummary: string;
  sourceName: string;
  lastUpdatedISO: string;
}

export interface CollegeFacilities {
  library: boolean;
  laboratories: boolean;
  hostel: boolean;
  sports: boolean;
  cafeteria: boolean;
  wifi: boolean;
  transportation: boolean;
  medical: boolean;
  accessibility: boolean;
  highlights: string[];
}

export interface CollegePlacementInfo {
  hasPlacementSupport: boolean;
  supportDescription: string;
  recruiterExamples: string[];
  placementReportSummary: string;
  internshipOpportunities: string;
  averagePackageLabel: string | null;
  highestPackageLabel: string | null;
  reportingYear: string | null;
  sourceCitation: string | null;
}

export interface CollegeRecord {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  address: string;
  nearbyTransport: string;
  mapCoordinates?: { lat: number; lng: number };
  collegeTypes: CollegeType[];
  primaryCategory: CollegeType;
  establishmentYear: number;
  officialWebsite: string;
  affiliatedUniversity: string;
  accreditation: string;
  contactEmail: string;
  contactPhone: string;
  overview: string;
  photoKey: string;
  galleryPhotoKeys: string[];
  featured: boolean;
  admissionStatus: AdmissionStatus;
  admissionProcess: string[];
  applicationProcedure: string;
  importantDates: Array<{ label: string; dateISO: string }>;
  nextDeadlineISO?: string;
  requiredDocuments: string[];
  entranceExams: string[];
  officialApplicationUrl: string;
  courses: CollegeCourseOffering[];
  feeInfo: CollegeFeeInfo;
  facilities: CollegeFacilities;
  placementInfo: CollegePlacementInfo;
  scholarshipAvailable: boolean;
  dataVerificationStatus: DataVerificationStatus;
  dataSourceLabel: string;
  providerId: string;
  lastUpdatedISO: string;
}

export interface StandaloneCourse {
  id: string;
  name: string;
  degreeType: DegreeLevel;
  degreeShort: string;
  stream: string;
  duration: string;
  eligibility: string;
  requiredSubjects: string[];
  entranceExams: string[];
  careerOpportunities: string[];
  typicalFeeRangeLabel: string;
  description: string;
}

export interface ExplorerScholarship {
  id: string;
  title: string;
  provider: string;
  category: ScholarshipCategory;
  eligibility: string;
  benefits: string;
  deadlineISO: string;
  requiredDocuments: string[];
  officialSourceUrl: string;
  lastUpdatedISO: string;
  dataVerificationStatus: DataVerificationStatus;
}

export interface AdmissionUpdateItem {
  id: string;
  title: string;
  collegeId?: string;
  collegeName: string;
  summary: string;
  publishedISO: string;
  sourceLabel: string;
}

export interface CollegeReview {
  id: string;
  collegeId: string;
  collegeName: string;
  authorId: string;
  authorName: string;
  isVerifiedStudent: boolean;
  verificationBasis: string;
  category: ReviewCategory;
  rating: number;
  title: string;
  experienceText: string;
  helpfulVoterIds: string[];
  moderationStatus: 'Published' | 'Pending Moderation' | 'Flagged' | 'Removed';
  createdAt: string;
}

export interface ReviewReportItem {
  id: string;
  reviewId: string;
  collegeId: string;
  reviewTitle: string;
  reporterId: string;
  reason: string;
  details: string;
  status: 'Open' | 'Reviewed';
  createdAt: string;
}

export interface ShortlistCollection {
  id: string;
  name: string;
  createdAt: string;
}

export interface SavedCollegeEntry {
  collegeId: string;
  collectionName: string;
  personalNote: string;
  reminderDateISO?: string;
  savedAt: string;
}

export interface AdmissionTrackerEntry {
  id: string;
  userId: string;
  collegeId: string;
  collegeName: string;
  courseName: string;
  status: TrackerApplicationStatus;
  deadlineISO?: string;
  reminderDateISO?: string;
  notes: string;
  checklist: Array<{ id: string; label: string; completed: boolean }>;
  documents: Array<{ id: string; fileName: string; url: string; sizeBytes: number }>;
  updatedAt: string;
}

export interface ComparisonHistoryItem {
  id: string;
  shareCode: string;
  title: string;
  collegeIds: string[];
  createdAt: string;
}
