import {
  AlertPriority,
  AlertType,
  FacilityCategory,
  LostFoundCategory,
  PollPurpose,
  PulseCategoryId,
  PulseNotificationPrefs,
  SubmissionPostType,
} from '../types/campusPulse';

export interface PulseCategoryMeta {
  id: PulseCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  subcategories: string[];
}

export const PULSE_CATEGORIES: PulseCategoryMeta[] = [
  {
    id: 'official-notices',
    label: 'Official Notices',
    shortLabel: 'Official',
    description: 'College circulars, administrative instructions, and institutional policy notices.',
    subcategories: [
      'College notices',
      'Administrative announcements',
      'Institutional circulars',
      'Important instructions',
      'Policy updates',
    ],
  },
  {
    id: 'academic-updates',
    label: 'Academic Updates',
    shortLabel: 'Academics',
    description: 'Class schedules, academic calendar revisions, syllabus, assignments, and labs.',
    subcategories: [
      'Class schedule changes',
      'Academic calendar updates',
      'Syllabus updates',
      'Assignment deadlines',
      'Department announcements',
      'Practical and laboratory updates',
    ],
  },
  {
    id: 'examination-updates',
    label: 'Examination Updates',
    shortLabel: 'Exams',
    description: 'Exam schedules, admit cards, registration windows, results, and revaluation.',
    subcategories: [
      'Examination schedules',
      'Admit card announcements',
      'Exam registration deadlines',
      'Result announcements',
      'Internal assessment updates',
      'Revaluation information',
    ],
  },
  {
    id: 'admission-registration',
    label: 'Admission & Registration',
    shortLabel: 'Registration',
    description: 'Course registration, fee deadlines, document verification, and scholarships.',
    subcategories: [
      'Admission notifications',
      'Application deadlines',
      'Document verification',
      'Fee submission deadlines',
      'Course registration',
      'Scholarship application updates',
    ],
  },
  {
    id: 'campus-news',
    label: 'Campus News',
    shortLabel: 'News',
    description: 'Institutional milestones, student achievements, and department highlights.',
    subcategories: [
      'College achievements',
      'Student achievements',
      'Institutional announcements',
      'Campus developments',
      'Department highlights',
    ],
  },
  {
    id: 'facility-updates',
    label: 'Facility Updates',
    shortLabel: 'Facilities',
    description: 'Library, hostel, transport, cafeteria, lab, and campus maintenance updates.',
    subcategories: [
      'Library announcements',
      'Laboratory updates',
      'Hostel information',
      'Transport updates',
      'Cafeteria announcements',
      'Campus maintenance alerts',
    ],
  },
  {
    id: 'student-information',
    label: 'Student Information',
    shortLabel: 'Student Info',
    description: 'Lost & found reports, student reminders, and peer-submitted campus updates.',
    subcategories: [
      'Lost and found',
      'Important reminders',
      'Student-submitted campus information',
      'Campus service updates',
    ],
  },
];

export const ALERT_TYPES: AlertType[] = [
  'Examination deadline',
  'Registration deadline',
  'Class cancellation',
  'Schedule changes',
  'Campus closure',
  'Important administrative update',
  'Facility disruption',
  'Emergency campus announcement',
];

export const ALERT_PRIORITIES: AlertPriority[] = [
  'Critical',
  'High',
  'Normal',
  'Informational',
];

export const FACILITY_CATEGORIES: FacilityCategory[] = [
  'Library',
  'Hostel',
  'Transport',
  'Cafeteria',
  'Laboratories',
  'Other Facilities',
];

export const LOST_FOUND_CATEGORIES: LostFoundCategory[] = [
  'ID Cards',
  'Books',
  'Electronics',
  'Bags',
  'Documents',
  'Accessories',
  'Other',
];

export const POLL_PURPOSES: PollPurpose[] = [
  'Student Preferences',
  'Campus Improvement',
  'Facility Feedback',
  'Academic Experience',
  'General Opinion',
];

export const SUBMISSION_POST_TYPES: SubmissionPostType[] = [
  'Campus Information',
  'Student Update',
  'Facility Information',
  'Campus Suggestion',
  'Lost & Found',
];

export const PULSE_REPORT_REASONS: string[] = [
  'Outdated or inaccurate institutional detail',
  'Misleading or unverified claim',
  'Contains private phone number or sensitive personal info',
  'Duplicate or spam submission',
  'Suspicious Lost & Found item listing',
];

export const DEFAULT_PULSE_NOTIFICATION_PREFS: PulseNotificationPrefs = {
  officialNotices: true,
  examAlerts: true,
  upcomingDeadlines: true,
  departmentUpdates: true,
  classChanges: true,
  facilityDisruptions: true,
  pollReminders: true,
  moderationUpdates: true,
};

export function getPulseCategoryLabel(categoryId: PulseCategoryId): string {
  return PULSE_CATEGORIES.find((c) => c.id === categoryId)?.label || 'Campus Update';
}

export function formatPulseDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatPulseShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatPulseFileSize(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getDaysRemainingLabel(dateISO?: string): string | null {
  if (!dateISO) return null;
  const target = new Date(dateISO);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Deadline passed';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return '1 day left';
  return `${diffDays} days left`;
}

export function priorityWeight(priority: AlertPriority): number {
  switch (priority) {
    case 'Critical':
      return 4;
    case 'High':
      return 3;
    case 'Normal':
      return 2;
    case 'Informational':
    default:
      return 1;
  }
}

export function containsPrivateContactPattern(text: string): boolean {
  const phoneRegex = /(\+?\d[\d\s-]{8,}\d)/;
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  return phoneRegex.test(text) || emailRegex.test(text);
}
