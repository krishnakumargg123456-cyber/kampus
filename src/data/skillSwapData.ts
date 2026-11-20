import heroEditorialImg from '../assets/images/skillswap_hero_editorial_1794563089389.jpg';
import portfolioPreviewImg from '../assets/images/skillswap_portfolio_preview_1794563089640.jpg';
import {
  DeliveryMode,
  ExchangePreference,
  ExperienceDuration,
  GroupTeachingMode,
  SharedResourceKind,
  SkillCategoryDef,
  SkillCategoryId,
  SkillListing,
  SkillProficiency,
  StudentSkillProfile,
} from '../types/skillSwap';

export const SKILLSWAP_ILLUSTRATIONS = {
  heroEditorial: heroEditorialImg,
  portfolioPreview: portfolioPreviewImg,
};

export const SKILL_CATEGORIES: SkillCategoryDef[] = [
  {
    id: 'technology',
    name: 'Technology',
    description: 'Programming languages, software architecture, AI, and security',
    skills: [
      'Python',
      'Java',
      'C and C++',
      'Web Development',
      'App Development',
      'UI/UX Design',
      'Artificial Intelligence',
      'Data Science',
      'Cybersecurity',
      'Database Management',
    ],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Visual design, storytelling, video editing, and digital media',
    skills: [
      'Graphic Design',
      'Video Editing',
      'Photography',
      'Illustration',
      'Animation',
      'Content Creation',
      'Digital Art',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Ventures, growth marketing, strategy, and financial planning',
    skills: [
      'Entrepreneurship',
      'Marketing',
      'Digital Marketing',
      'Business Strategy',
      'Financial Literacy',
      'Project Management',
    ],
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Speaking fluency, writing clarity, and interview readiness',
    skills: [
      'English Speaking',
      'Public Speaking',
      'Communication Skills',
      'Creative Writing',
      'Presentation Skills',
      'Interview Preparation',
    ],
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Core sciences, quantitative reasoning, research, and exam prep',
    skills: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Research Skills',
      'Competitive Exam Preparation',
    ],
  },
  {
    id: 'practical',
    name: 'Practical',
    description: 'Everyday productivity software, portfolios, and career readiness',
    skills: [
      'Excel',
      'PowerPoint',
      'Coding Projects',
      'Resume Building',
      'Freelancing',
      'Basic Computer Skills',
    ],
  },
  {
    id: 'personal-development',
    name: 'Personal Development',
    description: 'Leadership habits, focus systems, and structured problem solving',
    skills: [
      'Leadership',
      'Time Management',
      'Productivity',
      'Problem Solving',
    ],
  },
];

export const SKILL_PROFICIENCIES: SkillProficiency[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Mentor-Ready',
];

export const EXPERIENCE_DURATIONS: ExperienceDuration[] = [
  '< 6 Months',
  '6-12 Months',
  '1-2 Years',
  '2+ Years',
];

export const DELIVERY_MODES: DeliveryMode[] = ['Online', 'In-Person', 'Hybrid'];

export const GROUP_TEACHING_MODES: GroupTeachingMode[] = [
  'Individual (1-on-1)',
  'Small Group',
  'Both',
];

export const EXCHANGE_PREFERENCES: ExchangePreference[] = [
  'Skill Exchange',
  'Teaching Only',
  'Learning Collaboration',
];

export const SHARED_RESOURCE_KINDS: SharedResourceKind[] = [
  'PDF Document',
  'Study Notes',
  'Presentation',
  'Image',
  'Project Link',
  'Video Link',
  'Practice Assignment',
  'Useful Website',
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SKILLSWAP_LANGUAGES = [
  'English',
  'Hindi',
  'English & Hindi',
  'Marathi',
  'Tamil',
  'Telugu',
  'Bengali',
];

export const SKILLSWAP_REPORT_REASONS = [
  'Misleading skill claims or spam listing',
  'Harassment or disrespectful behavior',
  'No-show or repeated unannounced cancellations',
  'Soliciting paid services outside academic peer exchange',
  'Inappropriate content or privacy violation',
];

export function getCategoryName(categoryId: SkillCategoryId): string {
  return SKILL_CATEGORIES.find((c) => c.id === categoryId)?.name || 'General';
}

export function getStudentInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export interface SkillMatchAssessment {
  kind: 'Great Match' | 'Learning Match' | 'Teaching Match' | 'Shared Interest';
  headline: string;
  explanation: string;
  sharedLanguages: string[];
  sharedDays: string[];
  formatCompatible: boolean;
}

/**
 * Deterministic matching using actual student skill preferences and availability.
 * Never fabricates compatibility percentages.
 */
export function assessSkillMatch(
  me: StudentSkillProfile | undefined,
  peer: StudentSkillProfile,
  peerListings: SkillListing[]
): SkillMatchAssessment | null {
  if (!me || me.userId === peer.userId) return null;

  const myTeach = new Set([
    ...me.skillsToTeach.map((s) => s.skillName.toLowerCase()),
  ]);
  const myLearn = new Set([
    ...me.skillsToLearn.map((s) => s.skillName.toLowerCase()),
  ]);

  const peerTeach = [
    ...peer.skillsToTeach.map((s) => s.skillName),
    ...peerListings.filter((l) => l.intent === 'Teaching Offer').map((l) => l.skillName),
  ];
  const peerLearn = [
    ...peer.skillsToLearn.map((s) => s.skillName),
    ...peerListings.map((l) => l.desiredSkill).filter(Boolean),
  ];

  const peerTeachesWhatIWant = peerTeach.find((sk) =>
    Array.from(myLearn).some(
      (ml) => sk.toLowerCase().includes(ml) || ml.includes(sk.toLowerCase())
    )
  );
  const peerWantsWhatITeach = peerLearn.find((sk) =>
    Array.from(myTeach).some(
      (mt) => sk.toLowerCase().includes(mt) || mt.includes(sk.toLowerCase())
    )
  );

  const sharedLanguages = me.languages.filter((l) =>
    peer.languages.some((pl) => pl.toLowerCase() === l.toLowerCase())
  );
  const sharedDays = me.availability.days.filter((d) =>
    peer.availability.days.includes(d)
  );
  const formatCompatible =
    me.learningPreferences.format === peer.learningPreferences.format ||
    me.learningPreferences.format === 'Hybrid' ||
    peer.learningPreferences.format === 'Hybrid';

  if (peerTeachesWhatIWant && peerWantsWhatITeach) {
    return {
      kind: 'Great Match',
      headline: 'Great Match',
      explanation: `You can teach ${peerWantsWhatITeach} and learn ${peerTeachesWhatIWant} in return.`,
      sharedLanguages,
      sharedDays,
      formatCompatible,
    };
  }

  if (peerTeachesWhatIWant) {
    return {
      kind: 'Learning Match',
      headline: 'Teaches a Skill You Want',
      explanation: `${peer.name} offers ${peerTeachesWhatIWant}, which matches your learning list.`,
      sharedLanguages,
      sharedDays,
      formatCompatible,
    };
  }

  if (peerWantsWhatITeach) {
    return {
      kind: 'Teaching Match',
      headline: 'Wants to Learn Your Skill',
      explanation: `${peer.name} is looking to learn ${peerWantsWhatITeach}, which you can teach.`,
      sharedLanguages,
      sharedDays,
      formatCompatible,
    };
  }

  const sharedInterest = me.learningInterests.find((i) =>
    peer.learningInterests.some((pi) => pi.toLowerCase() === i.toLowerCase())
  );
  if (sharedInterest) {
    return {
      kind: 'Shared Interest',
      headline: 'Collaborative Learning Fit',
      explanation: `Both interested in ${sharedInterest} for structured peer study.`,
      sharedLanguages,
      sharedDays,
      formatCompatible,
    };
  }

  return null;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
