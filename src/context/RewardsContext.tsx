import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import type {
  AchievementDefinition,
  ChallengeDefinition,
  ChallengeParticipation,
  LeaderboardEntry,
  LeaderboardPeriod,
  PointEarningRule,
  PointTransaction,
  RedemptionRecord,
  RedemptionStatus,
  ReferralRecord,
  ReferralStatus,
  RewardCatalogItem,
  RewardLevelConfig,
  RewardsAdminAuditLog,
  RewardsAnalytics,
  RewardsRole,
  StudentPointsWallet,
  UnlockedAchievement,
} from '../types/rewards';

interface RoleInfo {
  role: RewardsRole;
  label: string | null;
}

interface RewardsContextType {
  loading: boolean;
  error: string | null;
  actionBanner: string | null;
  clearError: () => void;
  clearBanner: () => void;
  wallet: StudentPointsWallet | null;
  currentLevel: RewardLevelConfig | null;
  nextLevel: RewardLevelConfig | null;
  levels: RewardLevelConfig[];
  rules: PointEarningRule[];
  achievements: AchievementDefinition[];
  unlockedAchievements: UnlockedAchievement[];
  challenges: ChallengeDefinition[];
  challengeParticipations: ChallengeParticipation[];
  catalog: RewardCatalogItem[];
  transactions: PointTransaction[];
  redemptions: RedemptionRecord[];
  referrals: ReferralRecord[];
  leaderboard: LeaderboardEntry[];
  leaderboardPeriod: LeaderboardPeriod;
  roleInfo: RoleInfo;
  auditLogs: RewardsAdminAuditLog[];
  analytics: RewardsAnalytics | null;
  allTransactions: PointTransaction[];
  refreshBootstrap: (period?: LeaderboardPeriod) => Promise<void>;
  switchRoleSession: (passkey?: string, revert?: boolean) => Promise<{ ok: boolean; error?: string }>;
  refreshLeaderboard: (period: LeaderboardPeriod) => Promise<void>;
  toggleLeaderboardPrivacy: (show: boolean) => Promise<boolean>;
  joinChallenge: (challengeId: string) => Promise<boolean>;
  claimChallenge: (challengeId: string) => Promise<boolean>;
  redeemReward: (
    rewardId: string,
    idempotencyKey: string
  ) => Promise<{ ok: boolean; redemption?: RedemptionRecord; error?: string }>;
  submitReferral: (referredIdentifier: string) => Promise<{ ok: boolean; error?: string }>;
  adminUpdateRule: (
    ruleId: string,
    payload: { points?: number; dailyLimit?: number; active?: boolean; reason?: string }
  ) => Promise<boolean>;
  adminUpdateLevel: (levelNumber: number, minPoints: number) => Promise<boolean>;
  adminAddCatalogItem: (payload: {
    name: string;
    category: RewardCatalogItem['category'];
    description: string;
    requiredPoints: number;
    requiredLevel: number;
    stockRemaining: number;
    imageKey?: string;
    isPartnerOffer?: boolean;
    partnerName?: string;
  }) => Promise<boolean>;
  adminAddChallenge: (payload: {
    cadence: 'Daily' | 'Weekly';
    name: string;
    description: string;
    rewardPoints: number;
    targetCount: number;
    metricKey: string;
    deadlineISO: string;
  }) => Promise<boolean>;
  adminAdjustPoints: (payload: {
    targetUserId: string;
    pointsDelta: number;
    reason: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  adminReverseTransaction: (
    txId: string,
    reason: string
  ) => Promise<{ ok: boolean; error?: string }>;
  adminUpdateRedemption: (
    redemptionId: string,
    status: RedemptionStatus,
    note?: string
  ) => Promise<boolean>;
  adminVerifyReferral: (referralId: string, status?: ReferralStatus) => Promise<boolean>;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export const RewardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();

  const userId = user?.id || 'usr_22b030149';
  const userName = user?.name || profile?.name || 'KAMPUS Student';
  const college = user?.college || profile?.college || 'Campus Member';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const [wallet, setWallet] = useState<StudentPointsWallet | null>(null);
  const [currentLevel, setCurrentLevel] = useState<RewardLevelConfig | null>(null);
  const [nextLevel, setNextLevel] = useState<RewardLevelConfig | null>(null);
  const [levels, setLevels] = useState<RewardLevelConfig[]>([]);
  const [rules, setRules] = useState<PointEarningRule[]>([]);
  const [achievements, setAchievements] = useState<AchievementDefinition[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [challenges, setChallenges] = useState<ChallengeDefinition[]>([]);
  const [challengeParticipations, setChallengeParticipations] = useState<ChallengeParticipation[]>([]);
  const [catalog, setCatalog] = useState<RewardCatalogItem[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('All Time');
  const [roleInfo, setRoleInfo] = useState<RoleInfo>({ role: 'Student', label: null });
  const [auditLogs, setAuditLogs] = useState<RewardsAdminAuditLog[]>([]);
  const [analytics, setAnalytics] = useState<RewardsAnalytics | null>(null);
  const [allTransactions, setAllTransactions] = useState<PointTransaction[]>([]);

  const clearError = useCallback(() => setError(null), []);
  const clearBanner = useCallback(() => setActionBanner(null), []);

  const refreshBootstrap = useCallback(
    async (period?: LeaderboardPeriod) => {
      try {
        setLoading(true);
        const activePeriod = period || leaderboardPeriod;
        const res = await fetch('/api/rewards/bootstrap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userName,
            college,
            leaderboardPeriod: activePeriod,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to load KAMPUS Rewards.');

        setWallet(data.wallet);
        setCurrentLevel(data.currentLevel);
        setNextLevel(data.nextLevel);
        setLevels(data.levels || []);
        setRules(data.rules || []);
        setAchievements(data.achievements || []);
        setUnlockedAchievements(data.unlockedAchievements || []);
        setChallenges(data.challenges || []);
        setChallengeParticipations(data.challengeParticipations || []);
        setCatalog(data.catalog || []);
        setTransactions(data.transactions || []);
        setRedemptions(data.redemptions || []);
        setReferrals(data.referrals || []);
        setLeaderboard(data.leaderboard || []);
        setRoleInfo(data.roleInfo || { role: 'Student', label: null });
        setAuditLogs(data.auditLogs || []);
        setAnalytics(data.analytics || null);
        setAllTransactions(data.allTransactions || []);

        if (data.newlyAwardedCount > 0) {
          addNotification({
            title: 'K-Points Credited from Verified Activity',
            description: `${data.newlyAwardedCount} verified campus action(s) added K-Points to your wallet.`,
            time: 'Just now',
            type: 'system',
            linkRoute: '/tools/rewards',
          });
        }
        if (data.newlyUnlockedCount > 0) {
          addNotification({
            title: 'New Achievement Badge Unlocked',
            description: `You unlocked ${data.newlyUnlockedCount} new milestone badge(s) in KAMPUS Rewards.`,
            time: 'Just now',
            type: 'campus',
            linkRoute: '/tools/rewards',
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to sync rewards workspace.');
      } finally {
        setLoading(false);
      }
    },
    [userId, userName, college, leaderboardPeriod, addNotification]
  );

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const switchRoleSession = useCallback(
    async (passkey?: string, revert?: boolean) => {
      try {
        const res = await fetch('/api/rewards/auth/role-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, passkey, revert }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.message || 'Authorization failed.' };
        }
        setRoleInfo(data.roleInfo);
        await refreshBootstrap();
        setActionBanner(
          revert
            ? 'Returned to Student Rewards view.'
            : 'Rewards Admin session enabled.'
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Role update failed.' };
      }
    },
    [userId, refreshBootstrap]
  );

  const refreshLeaderboard = useCallback(async (period: LeaderboardPeriod) => {
    try {
      setLeaderboardPeriod(period);
      const res = await fetch(
        `/api/rewards/leaderboard?period=${encodeURIComponent(period)}`
      );
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch {
      // keep existing entries on transient failure
    }
  }, []);

  const toggleLeaderboardPrivacy = useCallback(
    async (show: boolean) => {
      try {
        const res = await fetch('/api/rewards/privacy', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, showOnLeaderboard: show }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not update leaderboard visibility.');
        setWallet(data.wallet);
        await refreshLeaderboard(leaderboardPeriod);
        setActionBanner(
          show
            ? 'Your name is visible on the KAMPUS leaderboard.'
            : 'Your profile is now hidden from the public leaderboard.'
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update privacy setting.');
        return false;
      }
    },
    [userId, leaderboardPeriod, refreshLeaderboard]
  );

  const joinChallenge = useCallback(
    async (challengeId: string) => {
      try {
        const res = await fetch(`/api/rewards/challenges/${challengeId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not join challenge.');
        setChallengeParticipations((prev) => [...prev, data.participation]);
        setActionBanner('Challenge joined. Verified KAMPUS activity will track automatically.');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to join challenge.');
        return false;
      }
    },
    [userId]
  );

  const claimChallenge = useCallback(
    async (challengeId: string) => {
      try {
        const res = await fetch(`/api/rewards/challenges/${challengeId}/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to claim challenge reward.');

        addNotification({
          title: 'Challenge Reward Claimed',
          description: `${data.transaction?.activityName || 'Challenge'} credited +${data.transaction?.points || 0} K-Points.`,
          time: 'Just now',
          type: 'system',
          linkRoute: '/tools/rewards',
        });

        await refreshBootstrap();
        setActionBanner(
          `Credited +${data.transaction?.points || 0} K-Points for verified challenge completion.`
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Challenge claim failed.');
        return false;
      }
    },
    [userId, addNotification, refreshBootstrap]
  );

  const redeemReward = useCallback(
    async (rewardId: string, idempotencyKey: string) => {
      try {
        const res = await fetch('/api/rewards/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userName,
            rewardId,
            idempotencyKey,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.message || 'Redemption failed.' };
        }

        addNotification({
          title: 'Reward Redemption Processed',
          description: `"${data.redemption?.rewardName}" is ${data.redemption?.status}. Check My Rewards for access details.`,
          time: 'Just now',
          type: 'system',
          linkRoute: '/tools/rewards',
        });

        await refreshBootstrap();
        setActionBanner(`Redeemed "${data.redemption?.rewardName}" (${data.redemption?.status}).`);
        return { ok: true, redemption: data.redemption };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Redemption error.' };
      }
    },
    [userId, userName, addNotification, refreshBootstrap]
  );

  const submitReferral = useCallback(
    async (referredIdentifier: string) => {
      try {
        const res = await fetch('/api/rewards/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userName,
            referredIdentifier,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.message || 'Referral could not be submitted.' };
        }
        setReferrals((prev) => [data.referral, ...prev]);
        setActionBanner('Peer referral logged. Points are awarded once verified.');
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Referral failed.' };
      }
    },
    [userId, userName]
  );

  const adminUpdateRule = useCallback(
    async (
      ruleId: string,
      payload: { points?: number; dailyLimit?: number; active?: boolean; reason?: string }
    ) => {
      try {
        const res = await fetch(`/api/rewards/admin/rules/${ruleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Rule update failed.');
        setRules(data.rules);
        setAuditLogs(data.auditLogs);
        setActionBanner('Point rule configuration saved.');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update rule.');
        return false;
      }
    },
    [userId]
  );

  const adminUpdateLevel = useCallback(
    async (levelNumber: number, minPoints: number) => {
      try {
        const res = await fetch(`/api/rewards/admin/levels/${levelNumber}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, minPoints }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Level update failed.');
        await refreshBootstrap();
        setActionBanner(`Updated Level ${levelNumber} threshold to ${minPoints} K-Points.`);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update level.');
        return false;
      }
    },
    [userId, refreshBootstrap]
  );

  const adminAddCatalogItem = useCallback(
    async (payload: {
      name: string;
      category: RewardCatalogItem['category'];
      description: string;
      requiredPoints: number;
      requiredLevel: number;
      stockRemaining: number;
      imageKey?: string;
      isPartnerOffer?: boolean;
      partnerName?: string;
    }) => {
      try {
        const res = await fetch('/api/rewards/admin/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not add catalog reward.');
        await refreshBootstrap();
        setActionBanner(`Added "${data.item?.name}" to Rewards Store.`);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create reward item.');
        return false;
      }
    },
    [userId, refreshBootstrap]
  );

  const adminAddChallenge = useCallback(
    async (payload: {
      cadence: 'Daily' | 'Weekly';
      name: string;
      description: string;
      rewardPoints: number;
      targetCount: number;
      metricKey: string;
      deadlineISO: string;
    }) => {
      try {
        const res = await fetch('/api/rewards/admin/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not add challenge.');
        await refreshBootstrap();
        setActionBanner(`Published challenge "${data.challenge?.name}".`);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to publish challenge.');
        return false;
      }
    },
    [userId, refreshBootstrap]
  );

  const adminAdjustPoints = useCallback(
    async (payload: { targetUserId: string; pointsDelta: number; reason: string }) => {
      try {
        const res = await fetch('/api/rewards/admin/adjust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.message || 'Point adjustment failed.' };
        }
        await refreshBootstrap();
        setActionBanner('Audited manual point adjustment recorded.');
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Adjustment error.' };
      }
    },
    [userId, refreshBootstrap]
  );

  const adminReverseTransaction = useCallback(
    async (txId: string, reason: string) => {
      try {
        const res = await fetch(`/api/rewards/admin/transactions/${txId}/reverse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, reason }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.message || 'Transaction reversal failed.' };
        }
        await refreshBootstrap();
        setActionBanner('Transaction reversed with audit log.');
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Reversal failed.' };
      }
    },
    [userId, refreshBootstrap]
  );

  const adminUpdateRedemption = useCallback(
    async (redemptionId: string, status: RedemptionStatus, note?: string) => {
      try {
        const res = await fetch(`/api/rewards/admin/redemptions/${redemptionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status, note }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not update redemption status.');
        await refreshBootstrap();
        setActionBanner(`Redemption updated to ${status}.`);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Redemption update failed.');
        return false;
      }
    },
    [userId, refreshBootstrap]
  );

  const adminVerifyReferral = useCallback(
    async (referralId: string, status: ReferralStatus = 'Rewarded') => {
      try {
        const res = await fetch(`/api/rewards/admin/referrals/${referralId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not verify referral.');
        await refreshBootstrap();
        setActionBanner('Referral verified and bonus processed.');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Referral verification failed.');
        return false;
      }
    },
    [userId, refreshBootstrap]
  );

  return (
    <RewardsContext.Provider
      value={{
        loading,
        error,
        actionBanner,
        clearError,
        clearBanner,
        wallet,
        currentLevel,
        nextLevel,
        levels,
        rules,
        achievements,
        unlockedAchievements,
        challenges,
        challengeParticipations,
        catalog,
        transactions,
        redemptions,
        referrals,
        leaderboard,
        leaderboardPeriod,
        roleInfo,
        auditLogs,
        analytics,
        allTransactions,
        refreshBootstrap,
        switchRoleSession,
        refreshLeaderboard,
        toggleLeaderboardPrivacy,
        joinChallenge,
        claimChallenge,
        redeemReward,
        submitReferral,
        adminUpdateRule,
        adminUpdateLevel,
        adminAddCatalogItem,
        adminAddChallenge,
        adminAdjustPoints,
        adminReverseTransaction,
        adminUpdateRedemption,
        adminVerifyReferral,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
};

export const useRewards = (): RewardsContextType => {
  const ctx = useContext(RewardsContext);
  if (!ctx) throw new Error('useRewards must be used within a RewardsProvider');
  return ctx;
};
