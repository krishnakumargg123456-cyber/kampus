import techCoverImg from '../assets/images/events_tech_hackathon_1794564537496.jpg';
import culturalCoverImg from '../assets/images/events_cultural_fest_1794564537193.jpg';
import workshopCoverImg from '../assets/images/events_workshop_seminar_1794564537593.jpg';
import type { ClubCategoryId, EventCategoryId } from '../types/eventsClubs';

export const EVENT_COVER_ASSETS: Record<'tech' | 'cultural' | 'workshop', string> = {
  tech: techCoverImg,
  cultural: culturalCoverImg,
  workshop: workshopCoverImg,
};

export interface EventCategoryMeta {
  id: EventCategoryId;
  subTypes: string[];
}

export const EVENT_CATEGORIES: EventCategoryMeta[] = [
  {
    id: 'Academic',
    subTypes: ['Seminars', 'Conferences', 'Guest Lectures', 'Workshops', 'Research Events'],
  },
  {
    id: 'Technology',
    subTypes: [
      'Hackathons',
      'Coding Competitions',
      'Robotics',
      'AI Workshops',
      'Technical Fests',
      'Project Exhibitions',
    ],
  },
  {
    id: 'Cultural',
    subTypes: [
      'College Fests',
      'Music',
      'Dance',
      'Drama',
      'Art Exhibitions',
      'Photography',
    ],
  },
  {
    id: 'Sports',
    subTypes: ['Tournaments', 'Athletics', 'Indoor Games', 'Fitness Activities'],
  },
  {
    id: 'Career',
    subTypes: [
      'Placement Drives',
      'Career Fairs',
      'Industry Sessions',
      'Resume Workshops',
      'Networking Events',
    ],
  },
  {
    id: 'Social',
    subTypes: [
      'Volunteering',
      'Student Meetups',
      'Cultural Celebrations',
      'Community Activities',
    ],
  },
];

export interface ClubCategoryMeta {
  id: ClubCategoryId;
  subClubs: string[];
}

export const CLUB_CATEGORIES: ClubCategoryMeta[] = [
  {
    id: 'Technical',
    subClubs: [
      'Coding Club',
      'Robotics Club',
      'AI & Innovation Club',
      'Web Development Club',
      'Electronics Club',
    ],
  },
  {
    id: 'Creative',
    subClubs: [
      'Photography Club',
      'Design Club',
      'Art Club',
      'Music Club',
      'Dance Club',
      'Drama Club',
    ],
  },
  {
    id: 'Academic',
    subClubs: [
      'Science Club',
      'Mathematics Club',
      'Literature Club',
      'Research Club',
      'Debate Society',
    ],
  },
  {
    id: 'Career & Entrepreneurship',
    subClubs: [
      'Entrepreneurship Club',
      'Finance Club',
      'Marketing Club',
      'Placement Preparation Club',
    ],
  },
  {
    id: 'Sports & Wellness',
    subClubs: [
      'Cricket Club',
      'Football Club',
      'Badminton Club',
      'Fitness Club',
      'Yoga Club',
    ],
  },
  {
    id: 'Social',
    subClubs: ['Environmental Club', 'Volunteering Club', 'Social Impact Club'],
  },
];

export const EVENTS_CLUBS_REPORT_REASONS: string[] = [
  'Misleading registration fee or fake organizer claim',
  'Unsafe or suspicious external event link',
  'Inappropriate event/club content',
  'Duplicate or spam event listing',
];

export function formatEventDate(iso: string): string {
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

export function isRegistrationOpen(deadlineISO: string): boolean {
  const t = new Date(deadlineISO).getTime();
  return !Number.isNaN(t) && t >= Date.now();
}

export function isSafeExternalUrl(raw?: string): boolean {
  if (!raw || !raw.trim()) return true;
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
