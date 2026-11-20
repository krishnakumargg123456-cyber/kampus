import studyPackImg from '../assets/images/rewards_study_pack_1794643814692.jpg';
import careerKitImg from '../assets/images/rewards_career_kit_1794643814961.jpg';
import campusPassImg from '../assets/images/rewards_campus_pass_1794643813947.jpg';
import type { BadgeCategory, LeaderboardPeriod, RewardStoreCategory } from '../types/rewards';

export const REWARDS_IMAGES: Record<string, string> = {
  study_pack: studyPackImg,
  career_kit: careerKitImg,
  campus_pass: campusPassImg,
};

export function resolveRewardImage(key?: string): string {
  if (!key) return studyPackImg;
  return REWARDS_IMAGES[key] || studyPackImg;
}

export const REWARD_STORE_CATEGORIES: RewardStoreCategory[] = [
  'Study Rewards',
  'Career Rewards',
  'Campus Rewards',
  'Digital Rewards',
  'Partner Offers',
];

export const BADGE_CATEGORIES: BadgeCategory[] = [
  'Academic',
  'Community',
  'Career',
  'Campus',
  'Personal Growth',
];

export const LEADERBOARD_PERIODS: LeaderboardPeriod[] = [
  'All Time',
  'Weekly',
  'Monthly',
  'Academic',
  'Community',
  'Career',
  'Campus',
];

export function formatRewardsDate(iso?: string): string {
  if (!iso) return 'Recently';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRewardsDateTime(iso?: string): string {
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
