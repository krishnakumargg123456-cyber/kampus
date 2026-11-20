export type RewardsRole = 'Student' | 'Rewards Admin';

export type PointRuleModule =
  | 'Study Hub'
  | 'Notes Exchange'
  | 'Student Community'
  | 'Events & Clubs'
  | 'Career'
  | 'Student Voice';

export type PointTransactionCategory = 'Earned' | 'Redeemed' | 'Pending' | 'Reversed';

export type RedemptionStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Fulfilled'
  | 'Rejected'
  | 'Cancelled';

export type RewardStoreCategory =
  | 'Study Rewards'
  | 'Career Rewards'
  | 'Campus Rewards'
  | 'Digital Rewards'
  | 'Partner Offers';

export type BadgeCategory =
  | 'Academic'
  | 'Community'
  | 'Career'
  | 'Campus'
  | 'Personal Growth';

export type ReferralStatus =
  | 'Invited'
  | 'Registered'
  | 'Verified'
  | 'Reward Eligible'
  | 'Rewarded';

export type LeaderboardPeriod =
  | 'All Time'
  | 'Weekly'
  | 'Monthly'
  | 'Academic'
  | 'Community'
  | 'Career'
  | 'Campus';

export interface StudentPointsWallet {
  userId: string;
  userName: string;
  college: string;
  availableBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  pendingPoints: number;
  showOnLeaderboard: boolean;
  referralCode: string;
  activeDigitalTheme?: string | null;
  updatedAt: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  activityName: string;
  module: PointRuleModule | 'Challenge' | 'Referral' | 'Rewards Store' | 'Admin Adjustment';
  category: PointTransactionCategory;
  points: number; // positive for earned, negative for redeemed/reversed
  status: 'Completed' | 'Pending' | 'Reversed';
  description: string;
  sourceEventKey?: string;
  reversedByTxId?: string;
  createdAt: string;
}

export interface PointEarningRule {
  id: string;
  module: PointRuleModule;
  actionName: string;
  description: string;
  points: number;
  dailyLimit: number;
  active: boolean;
}

export interface RewardLevelConfig {
  levelNumber: number;
  name: string;
  tagline: string;
  minPoints: number;
  benefits: string[];
}

export interface AchievementDefinition {
  id: string;
  name: string;
  category: BadgeCategory;
  description: string;
  criteriaText: string;
  criteriaKey: string;
  threshold: number;
}

export interface UnlockedAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface ChallengeDefinition {
  id: string;
  cadence: 'Daily' | 'Weekly';
  name: string;
  description: string;
  rewardPoints: number;
  targetCount: number;
  metricKey: string;
  deadlineISO: string;
  active: boolean;
}

export interface ChallengeParticipation {
  id: string;
  userId: string;
  challengeId: string;
  joinedAt: string;
  currentProgress: number;
  claimed: boolean;
  claimedAt?: string;
}

export interface RewardCatalogItem {
  id: string;
  name: string;
  category: RewardStoreCategory;
  description: string;
  requiredPoints: number;
  requiredLevel: number;
  stockRemaining: number; // -1 for unlimited digital items
  imageKey: string;
  isPartnerOffer: boolean;
  partnerName?: string;
  digitalContent?: {
    title: string;
    instructions: string;
    resourceText: string;
  };
  active: boolean;
}

export interface RedemptionRecord {
  id: string;
  idempotencyKey: string;
  userId: string;
  userName: string;
  rewardId: string;
  rewardName: string;
  category: RewardStoreCategory;
  pointsSpent: number;
  status: RedemptionStatus;
  couponCode?: string | null;
  couponValidity?: string | null;
  usageInstructions?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerUserId: string;
  referrerName: string;
  referredIdentifier: string;
  referralCodeUsed: string;
  status: ReferralStatus;
  pointsAwarded: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  college: string;
  levelName: string;
  unlockedBadgesCount: number;
  points: number;
}

export interface RewardsAdminAuditLog {
  id: string;
  actorId: string;
  actorRole: RewardsRole;
  action: string;
  targetUserId?: string;
  reason: string;
  details: string;
  createdAt: string;
}

export interface RewardsAnalytics {
  totalWallets: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalRedemptions: number;
  activeChallenges: number;
  flaggedOrReversedCount: number;
}
