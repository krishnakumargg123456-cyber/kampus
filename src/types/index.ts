export type NavigationTab = 
  | 'home' 
  | 'learn' 
  | 'connect' 
  | 'campus' 
  | 'career' 
  | 'market' 
  | 'tools' 
  | 'account' 
  | 'profile';

export interface StudentProfile {
  name: string;
  email: string;
  mobile: string;
  avatarUrl: string;
  college: string;
  course: string;
  semester: string;
  enrollmentNo: string;
  isVerified: boolean;
  cgpa: number;
  learningProgress: number; // percentage
  studyStreakDays: number;
  todayStudyHours: number;
  karmaPoints: number;
  bio?: string;
  interests?: string[];
  hostel?: string;
  city?: string;
  state?: string;
}

export interface UserAuthData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  college: string;
  course: string;
  semester: string;
  enrollmentNo: string;
  avatarUrl: string;
  hasCompletedOnboarding: boolean;
  isVerified: boolean;
  clerkId?: string;
  role?: string;
}

export interface AcademicStat {
  id: string;
  label: string;
  value: string;
  subtext: string;
  status?: 'normal' | 'success' | 'warning' | 'alert';
  icon: string;
}

export interface ClassScheduleItem {
  id: string;
  subject: string;
  code: string;
  time: string;
  room: string;
  professor: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface ContinueLearningCourse {
  subject: string;
  code: string;
  chapter: string;
  progressPercent: number;
  currentLesson: string;
  totalLessons: number;
  completedLessons: number;
  estimatedMinutesLeft: number;
  thumbnailUrl: string;
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  publisher: string;
  date: string;
  category: 'Official' | 'Academics' | 'Events' | 'Placements';
  isVerified: boolean;
  summary: string;
  actionUrl?: string;
}

export interface RecommendationItem {
  id: string;
  type: 'study' | 'internship' | 'event';
  title: string;
  provider: string;
  meta: string;
  highlight: string;
  rating?: number;
  actionText: string;
}

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  section: 'learn' | 'connect' | 'campus' | 'career' | 'market' | 'tools' | 'account';
  route: string;
  iconName: string;
  badge?: string;
  features: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'academic' | 'campus' | 'career' | 'system';
  read: boolean;
  linkRoute?: string;
  category?: string;
  priority?: 'Urgent' | 'High' | 'Normal' | 'Low';
  sourceModule?: string;
  subType?: string;
  details?: string;
  isMention?: boolean;
  isReminder?: boolean;
  idempotencyKey?: string;
}
