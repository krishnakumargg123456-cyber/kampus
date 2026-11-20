import campusLifeHeroImg from '../assets/images/campus_life_activities_1794488255584.jpg';
import campusQuadImg from '../assets/images/hero_students_campus_1794449577723.jpg';
import type {
  FeedbackType,
  PriorityLevel,
  SubmissionStatus,
  VoiceCategoryGroup,
} from '../types/studentVoice';

export const VOICE_MEDIA = {
  hero: campusLifeHeroImg,
  campus: campusQuadImg,
};

export const DEFAULT_VOICE_CATEGORIES: VoiceCategoryGroup[] = [
  {
    id: 'cat_academic',
    groupName: 'Academic',
    items: [
      'Teaching Quality',
      'Course Curriculum',
      'Examination Experience',
      'Assignment Workload',
      'Academic Resources',
      'Faculty Feedback',
    ],
  },
  {
    id: 'cat_facilities',
    groupName: 'Campus Facilities',
    items: [
      'Library',
      'Laboratories',
      'Classrooms',
      'Drinking Water',
      'Washrooms',
      'Electricity',
      'Internet Connectivity',
      'Campus Cleanliness',
    ],
  },
  {
    id: 'cat_services',
    groupName: 'Student Services',
    items: [
      'Administrative Support',
      'Student Helpdesk',
      'Scholarships',
      'Admission Support',
      'Document Services',
    ],
  },
  {
    id: 'cat_hostel_transport',
    groupName: 'Hostel & Transport',
    items: [
      'Hostel Facilities',
      'Food Services',
      'Transport',
      'Bus Facilities',
      'Campus Safety',
    ],
  },
  {
    id: 'cat_experience',
    groupName: 'Student Experience',
    items: [
      'Campus Environment',
      'Events and Activities',
      'Clubs and Societies',
      'Accessibility',
      'Student Wellbeing',
    ],
  },
  {
    id: 'cat_suggestions',
    groupName: 'Suggestions',
    items: [
      'New Campus Facilities',
      'Academic Improvements',
      'Technology Improvements',
      'Student Engagement Ideas',
      'General Suggestions',
    ],
  },
];

export const CAMPUS_DEPARTMENTS: string[] = [
  'Academic Affairs & Dean Office',
  'Estate, Maintenance & Campus Facilities',
  'IT & Network Services',
  'Central Library Administration',
  'Hostel & Dining Services',
  'Transport & Campus Security',
  'Student Affairs & Wellbeing',
  'Examinations & Document Services',
  'Scholarships & Financial Aid Office',
];

export const FEEDBACK_TYPES: FeedbackType[] = [
  'General Feedback',
  'Complaint',
  'Suggestion',
  'Appreciation',
  'Improvement Request',
];

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  'Draft',
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Awaiting Student Response',
  'Resolved',
  'Closed',
  'Rejected',
];

export const PRIORITY_LEVELS: PriorityLevel[] = ['Low', 'Normal', 'High', 'Urgent'];

export const VOICE_REPORT_REASONS: string[] = [
  'Harassment, hate speech, or personal attack',
  'Doxxing or exposing private student/staff information',
  'Spam or repetitive duplicate posting',
  'Misleading or abusive content',
];

export function formatVoiceDate(iso?: string): string {
  if (!iso) return 'Not set';
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
