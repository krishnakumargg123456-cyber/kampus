import React, { useState } from 'react';
import {
  Award,
  Bell,
  Gift,
  LayoutDashboard,
  PackageCheck,
  RefreshCw,
  Shield,
  Store,
  Target,
  Trophy,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import { RewardsProvider, useRewards } from '../../context/RewardsContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  RewardsDashboardAndWalletView,
  type RewardsTabId,
} from '../../components/rewards/RewardsDashboardAndWalletView';
import { ChallengesAndBadgesView } from '../../components/rewards/ChallengesAndBadgesView';
import { RewardsStoreAndRedemptionView } from '../../components/rewards/RewardsStoreAndRedemptionView';
import { LeaderboardReferralAdminView } from '../../components/rewards/LeaderboardReferralAdminView';

interface RewardsPageProps {
  onOpenNotifications?: () => void;
}

const NAV_TABS: Array<{ id: RewardsTabId; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'wallet', label: 'Points Wallet', icon: Wallet },
  { id: 'challenges', label: 'Challenges', icon: Target },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'store', label: 'Rewards Store', icon: Store },
  { id: 'my-rewards', label: 'My Rewards', icon: PackageCheck },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'referrals', label: 'Referrals', icon: UserPlus },
  { id: 'admin', label: 'Admin', icon: Shield },
];

const RewardsWorkspaceInner: React.FC<RewardsPageProps> = ({ onOpenNotifications }) => {
  const {
    loading,
    error,
    actionBanner,
    clearError,
    clearBanner,
    wallet,
    roleInfo,
    refreshBootstrap,
  } = useRewards();
  const { unreadCount } = useNotifications();
  const [activeTab, setActiveTab] = useState<RewardsTabId>('dashboard');

  return (
    <div className="space-y-6 pb-8">
      {/* Module Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Gift className="w-4 h-4" />
            <span>KAMPUS REWARDS · Learn. Participate. Achieve. Get Rewarded.</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Student Engagement & Loyalty Ecosystem
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white tabular-nums">
            Balance: {wallet?.availableBalance ?? 0} K-Pts
          </div>

          <button
            onClick={() => refreshBootstrap()}
            disabled={loading}
            title="Sync verified KAMPUS activity"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 border transition-colors ${
              roleInfo.role === 'Rewards Admin'
                ? 'bg-slate-900 text-amber-400 border-slate-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {roleInfo.role}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors shrink-0 ${
                active
                  ? 'bg-slate-900 dark:bg-amber-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Status & Error Banners */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200 flex items-center justify-between gap-3">
          <span className="font-medium">{error}</span>
          <button onClick={clearError} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3">
          <span className="font-medium">{actionBanner}</span>
          <button onClick={clearBanner} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workspace Body */}
      {loading && !wallet ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          Syncing verified KAMPUS activity and K-Points ledger...
        </div>
      ) : (
        <>
          {(activeTab === 'dashboard' || activeTab === 'wallet') && (
            <RewardsDashboardAndWalletView mode={activeTab} onNavigate={setActiveTab} />
          )}
          {(activeTab === 'challenges' || activeTab === 'badges') && (
            <ChallengesAndBadgesView mode={activeTab} />
          )}
          {(activeTab === 'store' || activeTab === 'my-rewards') && (
            <RewardsStoreAndRedemptionView mode={activeTab} onNavigate={setActiveTab} />
          )}
          {(activeTab === 'leaderboard' || activeTab === 'referrals' || activeTab === 'admin') && (
            <LeaderboardReferralAdminView mode={activeTab} />
          )}
        </>
      )}
    </div>
  );
};

export const RewardsPage: React.FC<RewardsPageProps> = ({ onOpenNotifications }) => {
  return (
    <RewardsProvider>
      <RewardsWorkspaceInner onOpenNotifications={onOpenNotifications} />
    </RewardsProvider>
  );
};
