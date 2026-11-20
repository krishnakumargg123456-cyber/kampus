import adityaAvatarImg from '../assets/images/peer_aditya_avatar_1794550951152.jpg';
import ananyaAvatarImg from '../assets/images/peer_ananya_avatar_1794551403770.jpg';
import rohanAvatarImg from '../assets/images/peer_rohan_avatar_1794550952719.jpg';
import meeraAvatarImg from '../assets/images/peer_meera_avatar_1794551404021.jpg';
import kabirAvatarImg from '../assets/images/peer_kabir_avatar_1794551403960.jpg';
import priyaAvatarImg from '../assets/images/avatar_priya_1794407582447.jpg';

import deskHeroImg from '../assets/images/studyhub_desk_hero_1794549223041.jpg';
import csAlgoImg from '../assets/images/studyhub_cs_algorithms_1794549223031.jpg';
import examPrepImg from '../assets/images/studyhub_exam_prep_1794549223106.jpg';
import stemImg from '../assets/images/studyhub_science_stem_1794549223458.jpg';
import collabImg from '../assets/images/studypartner_hero_collab_1794551403758.jpg';
import codingHubImg from '../assets/images/community_coding_hub_1794552225706.jpg';

import { StudyMode } from '../types/studyRooms';

export const ROOM_COVER_OPTIONS: Array<{ key: string; label: string; src: string }> = [
  { key: 'desk', label: 'Quiet Study Desk', src: deskHeroImg },
  { key: 'algorithms', label: 'CS & Algorithms Lab', src: csAlgoImg },
  { key: 'exam', label: 'Exam Library Prep', src: examPrepImg },
  { key: 'stem', label: 'STEM Research Table', src: stemImg },
  { key: 'collab', label: 'Collaborative Group', src: collabImg },
  { key: 'coding', label: 'Coding Sprint Hub', src: codingHubImg },
];

export const ROOM_AVATAR_MAP: Record<string, string> = {
  priya: priyaAvatarImg,
  aditya: adityaAvatarImg,
  ananya: ananyaAvatarImg,
  rohan: rohanAvatarImg,
  meera: meeraAvatarImg,
  kabir: kabirAvatarImg,
};

export function resolveRoomCover(coverKey?: string): string {
  const found = ROOM_COVER_OPTIONS.find((c) => c.key === coverKey);
  return found ? found.src : deskHeroImg;
}

export function resolveRoomAvatar(avatarKey?: string): string {
  if (avatarKey && ROOM_AVATAR_MAP[avatarKey]) return ROOM_AVATAR_MAP[avatarKey];
  return priyaAvatarImg;
}

export const STUDY_MODE_LIST: StudyMode[] = [
  'Silent Study',
  'Pomodoro Study',
  'Group Discussion',
  'Doubt Solving',
  'Exam Preparation',
  'Revision Session',
  'Collaborative Learning',
];

export const COURSE_CATEGORIES: string[] = [
  'Computer Science & Engineering',
  'Mathematics & Data Science',
  'Electronics & Electrical',
  'Science & Pre-Med',
  'Commerce & Economics',
  'GATE / Competitive Exams',
  'General Semester Prep',
];

export const ROOM_REPORT_REASONS: string[] = [
  'Disruptive or off-topic behavior',
  'Harassment or disrespectful conduct',
  'Spam or unauthorized promotion',
  'Inappropriate shared file or whiteboard content',
  'Academic integrity concern',
];

export const ROOM_QUICK_REACTIONS: string[] = ['👍', '💡', '🔥', '✅', '🙏'];

export const WHITEBOARD_COLORS: string[] = [
  '#172033',
  '#2563EB',
  '#F97316',
  '#16A34A',
  '#DC2626',
  '#7C3AED',
];

export function formatTimerSeconds(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatRoomDateTime(iso?: string): string {
  if (!iso) return 'Immediate';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Scheduled';
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
