import priyaAvatar from '../assets/images/avatar_priya_1794407582447.jpg';
import adityaAvatar from '../assets/images/peer_aditya_avatar_1794550951152.jpg';
import rohanAvatar from '../assets/images/peer_rohan_avatar_1794550952719.jpg';
import ananyaAvatar from '../assets/images/peer_ananya_avatar_1794551403770.jpg';
import kabirAvatar from '../assets/images/peer_kabir_avatar_1794551403960.jpg';
import meeraAvatar from '../assets/images/peer_meera_avatar_1794551404021.jpg';
import collabCover from '../assets/images/studypartner_hero_collab_1794551403758.jpg';
import campusCover from '../assets/images/campus_life_activities_1794488255584.jpg';
import codingCover from '../assets/images/community_coding_hub_1794552225706.jpg';
import examCover from '../assets/images/community_exam_prep_1794552225683.jpg';
import booksCover from '../assets/images/community_books_study_1794552226075.jpg';

import { GroupCategory } from '../types/chat';
import { resolveAssetUrl } from '../utils/assetResolver';

export const CHAT_AVATAR_MAP: Record<string, string> = {
  priya: priyaAvatar,
  aditya: adityaAvatar,
  rohan: rohanAvatar,
  ananya: ananyaAvatar,
  kabir: kabirAvatar,
  meera: meeraAvatar,
  collab: collabCover,
  campus: campusCover,
  coding: codingCover,
  exam: examCover,
  books: booksCover,
};

export function resolveChatAvatar(avatarKey?: string, fallbackUrl?: string): string {
  if (avatarKey && CHAT_AVATAR_MAP[avatarKey]) {
    return CHAT_AVATAR_MAP[avatarKey];
  }
  if (avatarKey && (avatarKey.startsWith('data:') || avatarKey.startsWith('http') || avatarKey.startsWith('/'))) {
    return resolveAssetUrl(avatarKey);
  }
  return resolveAssetUrl(fallbackUrl) || adityaAvatar;
}

export const GROUP_CATEGORIES: GroupCategory[] = [
  'Study Group',
  'Class Group',
  'Project Team',
  'College Friends',
  'Subject Discussion',
  'Exam Preparation',
];

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];

export const CHAT_REPORT_REASONS = [
  'Spam or unwanted solicitation',
  'Harassment or bullying',
  'Misleading academic information',
  'Inappropriate or unsafe media',
  'Privacy violation',
  'Other',
];

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateSeparator(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
