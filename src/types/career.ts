export type OpportunityType =
  | 'Internship'
  | 'Full-Time Job'
  | 'Part-Time Job'
  | 'Remote Opportunity'
  | 'Freelance Project'
  | 'Apprenticeship'
  | 'Graduate Trainee Program'
  | 'Research Opportunity'
  | 'Campus Placement'
  | 'Volunteer Opportunity';

export type JobCategory =
  | 'Software Development'
  | 'Artificial Intelligence'
  | 'Data Science'
  | 'Cybersecurity'
  | 'Business'
  | 'Marketing'
  | 'Finance'
  | 'Design'
  | 'Healthcare'
  | 'Education'
  | 'Engineering'
  | 'Research'
  | 'Content and Media'
  | 'Human Resources'
  | 'Operations';

export type WorkFormat = 'Remote' | 'Hybrid' | 'Onsite';

export type ExperienceLevel =
  | 'Fresher / Student'
  | '0-1 Years'
  | '1-2 Years'
  | 'Research Track';

export type ApplicationStatus =
  | 'Saved'
  | 'Planning to Apply'
  | 'Applied'
  | 'Assessment'
  | 'Interview Scheduled'
  | 'Offer Received'
  | 'Rejected'
  | 'Withdrawn';

export type CareerRole =
  | 'Student'
  | 'Authorized Recruiter'
  | 'Career Team'
  | 'Platform Admin';

export interface OrganizationProfile {
  id: string;
  name: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  verificationStatus: 'Verified Organization' | 'Unverified Listing Source';
  createdById?: string;
}

export interface CareerOpportunity {
  id: string;
  title: string;
  organizationId: string;
  organizationName: string;
  organizationVerified: boolean;
  location: string;
  workFormat: WorkFormat;
  opportunityType: OpportunityType;
  category: JobCategory;
  experienceLevel: ExperienceLevel;
  educationRequirement: string;
  requiredSkills: string[];
  preferredSkills: string[];
  isPaid: boolean;
  compensationLabel: string;
  deadlineISO: string;
  publishedAtISO: string;
  listingSource:
    | 'Sample Development Listing'
    | 'KAMPUS Authorized Recruiter'
    | 'Official External Portal';
  applicationMode: 'KAMPUS-Hosted' | 'External Link';
  externalApplyUrl?: string;
  aboutOrganization: string;
  roleDescription: string;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  applicationProcess: string[];
  importantDates: string[];
  status: 'Open' | 'Closed' | 'Removed';
  createdById: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  opportunityId?: string;
  roleTitle: string;
  companyName: string;
  opportunityLink?: string;
  applicationMode: 'KAMPUS-Hosted' | 'External Link' | 'Manual Entry';
  status: ApplicationStatus;
  appliedDateISO?: string;
  deadlineISO?: string;
  resumeVersionId?: string;
  resumeVersionName?: string;
  interviewDateISO?: string;
  interviewNotes?: string;
  personalNotes?: string;
  feedbackNotes?: string;
  followUpDateISO?: string;
  archived: boolean;
  consentConfirmed: boolean;
  updatedAt: string;
}

export type ResumeSectionKey =
  | 'summary'
  | 'education'
  | 'skills'
  | 'experience'
  | 'internships'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'positions'
  | 'extracurricular'
  | 'languages'
  | 'links';

export type ResumeTemplateId =
  | 'Professional'
  | 'Minimal'
  | 'Modern'
  | 'Technical'
  | 'Fresher'
  | 'Academic';

export interface ResumeDocument {
  id: string;
  userId: string;
  versionName: string;
  templateId: ResumeTemplateId;
  sectionOrder: ResumeSectionKey[];
  hiddenSections: ResumeSectionKey[];
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    headline: string;
    linkedin: string;
    github: string;
    portfolioUrl: string;
  };
  summary: string;
  education: Array<{ institution: string; degree: string; period: string; grade: string }>;
  skills: string[];
  experience: Array<{ role: string; organization: string; period: string; bullets: string[] }>;
  internships: Array<{ role: string; organization: string; period: string; bullets: string[] }>;
  projects: Array<{ title: string; tech: string; link: string; bullets: string[] }>;
  certifications: Array<{ title: string; issuer: string; year: string }>;
  achievements: string[];
  positions: Array<{ role: string; organization: string; period: string }>;
  extracurricular: string[];
  languages: string[];
  links: Array<{ label: string; url: string }>;
  uploadedPdfName?: string;
  uploadedPdfUrl?: string;
  updatedAt: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  role: string;
  imageUrl?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  outcomes: string;
}

export interface PortfolioDocument {
  userId: string;
  publicSlug: string;
  isPublic: boolean;
  theme: 'Editorial Clean' | 'Minimal Slate' | 'Technical Grid';
  sectionOrder: Array<
    'about' | 'education' | 'skills' | 'projects' | 'experience' | 'certifications' | 'achievements' | 'resume' | 'contact'
  >;
  aboutMe: string;
  educationSummary: string;
  skills: string[];
  projects: PortfolioProject[];
  experienceSummary: string;
  certifications: string[];
  achievements: string[];
  resumeVersionId?: string;
  showContactLinks: boolean;
  contactEmail?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  updatedAt: string;
}

export interface CareerPathItem {
  id: string;
  field:
    | 'Technology'
    | 'Business'
    | 'Creative'
    | 'Science & Research'
    | 'Healthcare'
    | 'Education';
  title: string;
  overview: string;
  responsibilities: string[];
  formalQualificationsNote: string;
  generalGuidanceNote: string;
  importantSkills: string[];
  learningRoadmap: string[];
  relevantProjects: string[];
  entryLevelRoles: string[];
  progressionPaths: string[];
}

export interface RoadmapMilestone {
  id: string;
  stage: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  completed: boolean;
  isCustomTask?: boolean;
}

export interface CareerRoadmap {
  userId: string;
  educationLevel: string;
  academicBackground: string;
  careerInterest: string;
  currentSkills: string[];
  desiredRole: string;
  learningPreference: string;
  weeklyHours: number;
  milestones: RoadmapMilestone[];
  updatedAt: string;
}

export type InterviewType =
  | 'HR Interview'
  | 'Technical Interview'
  | 'Behavioral Interview'
  | 'Internship Interview'
  | 'Campus Placement Interview'
  | 'General Fresher Interview';

export interface InterviewQuestion {
  id: string;
  role: string;
  industry: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topic: string;
  interviewType: InterviewType;
  prompt: string;
  suggestedStructure: string[];
}

export interface InterviewPracticeEntry {
  id: string;
  userId: string;
  questionId: string;
  questionPrompt: string;
  interviewType: InterviewType;
  answerText: string;
  aiFeedback?: {
    clarity: string;
    structureSuggestions: string[];
    missingConcepts: string[];
    improvementAreas: string[];
    followUpQuestions: string[];
  };
  createdAt: string;
}

export type AssessmentCategory =
  | 'Programming'
  | 'Aptitude'
  | 'Logical Reasoning'
  | 'Quantitative Ability'
  | 'Communication'
  | 'Domain Knowledge'
  | 'Problem Solving';

export interface AssessmentQuestion {
  id: string;
  category: AssessmentCategory;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceLabel: string;
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  category: AssessmentCategory;
  mode: 'Timed' | 'Untimed';
  totalQuestions: number;
  correctCount: number;
  weakTopics: string[];
  durationSeconds: number;
  createdAt: string;
}

export interface CareerLearningResource {
  id: string;
  category:
    | 'Resume Writing'
    | 'Interview Preparation'
    | 'Communication Skills'
    | 'Professional Etiquette'
    | 'Workplace Readiness'
    | 'Technical Skills'
    | 'Career Planning'
    | 'Portfolio Development'
    | 'Freelancing Basics'
    | 'Entrepreneurship';
  title: string;
  summary: string;
  keyTakeaways: string[];
  estimatedMinutes: number;
  relatedOpportunityCategory: JobCategory;
}

export interface ScholarshipProgram {
  id: string;
  title: string;
  programType:
    | 'Scholarship'
    | 'Fellowship'
    | 'Research Program'
    | 'Graduate Program'
    | 'Training Program'
    | 'Professional Development'
    | 'Career Workshop';
  organization: string;
  eligibility: string;
  requirements: string[];
  deadlineISO: string;
  benefits: string;
  officialSourceName: string;
  officialSourceUrl: string;
  lastUpdatedISO: string;
  isSampleListing: boolean;
}

export interface CareerAlertRule {
  id: string;
  roleKeyword: string;
  industry: string;
  location: string;
  opportunityType: string;
  workFormat: string;
  deadlineWithinDays: number;
  createdAt: string;
}

export interface CareerPreferences {
  userId: string;
  interests: string[];
  preferredIndustries: string[];
  targetRoles: string[];
  skills: string[];
  learningGoals: string[];
  visibilityToRecruiters: 'Private' | 'With Consent Only';
  alerts: CareerAlertRule[];
}

export interface CareerReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'opportunity' | 'organization';
  targetId: string;
  targetTitle: string;
  reason: string;
  details: string;
  status: 'Submitted' | 'Reviewed';
  createdAt: string;
}
