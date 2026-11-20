import type {
  LockerCategory,
  LockerFileFormat,
  LockerReminderRepeat,
  LockerReminderType,
} from '../types/locker';

export const LOCKER_CATEGORIES: LockerCategory[] = [
  'Academic Records',
  'Identity Documents',
  'Certificates',
  'Admission Documents',
  'Examination Documents',
  'Career Documents',
  'Personal Documents',
  'Other Documents',
];

export const LOCKER_SUBTYPES_BY_CATEGORY: Record<LockerCategory, string[]> = {
  'Academic Records': [
    'Class 10 Marksheet',
    'Class 12 Marksheet',
    'Semester Marksheet',
    'Academic Transcripts',
    'Migration Certificate',
    'Transfer Certificate',
    'Character Certificate',
    'Bonafide Certificate',
  ],
  'Identity Documents': [
    'Identity Document',
    'Student ID',
    'College ID',
    'Other Personal Identification',
  ],
  Certificates: [
    'Course Completion',
    'Internship Certificate',
    'Achievement Certificate',
    'Competition Certificate',
    'Workshop Certificate',
    'Skill Certificate',
  ],
  'Admission Documents': [
    'Admission Letter',
    'Application Document',
    'Fee Receipt',
    'Counselling Document',
    'Allotment Letter',
  ],
  'Examination Documents': [
    'Admit Card',
    'Exam Result',
    'Registration Document',
    'Entrance Exam Document',
  ],
  'Career Documents': [
    'Resume',
    'Cover Letter',
    'Portfolio Document',
    'Internship Record',
    'Experience Certificate',
  ],
  'Personal Documents': ['Important Personal File', 'Other Private Document'],
  'Other Documents': ['General Academic File', 'Miscellaneous Document'],
};

export const LOCKER_SUPPORTED_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
];

export const LOCKER_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per document
export const LOCKER_QUOTA_BYTES = 100 * 1024 * 1024; // 100 MB personal vault quota

export const LOCKER_REMINDER_TYPES: LockerReminderType[] = [
  'Certificate renewal',
  'Admission deadlines',
  'Examination documents',
  'Application deadlines',
  'Document submission',
  'Scholarship documents',
];

export const LOCKER_REMINDER_REPEATS: LockerReminderRepeat[] = [
  'None',
  'Monthly',
  'Quarterly',
  'Yearly',
];

export const KAMPUS_SHARE_PEERS = [
  { id: 'stu_ananya', name: 'Ananya Verma (Delhi University)', department: 'CS' },
  { id: 'stu_rohan', name: 'Rohan Kulkarni (NIT Surathkal)', department: 'ECE' },
  { id: 'stu_meera', name: 'Meera Iyer (COEP Pune)', department: 'Design & Mech' },
  { id: 'stu_kabir', name: 'Kabir Malhotra (IIT Roorkee)', department: 'Applied Sci' },
  { id: 'faculty_advisor', name: 'Faculty Academic Advisor', department: 'Academic Office' },
];

export function formatLockerBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatLockerDate(iso?: string): string {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatLockerDateTime(iso?: string): string {
  if (!iso) return 'Recently';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isImageFormat(format: LockerFileFormat): boolean {
  return format === 'JPG' || format === 'JPEG' || format === 'PNG';
}

export function isPdfFormat(format: LockerFileFormat): boolean {
  return format === 'PDF';
}
