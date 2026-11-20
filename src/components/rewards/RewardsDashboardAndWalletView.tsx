import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Flame,
  History,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Trophy,
  Wallet,
  X,
} from 'lucide-react';
import { useRewards } from '../../context/RewardsContext';
import { formatRewardsDate, formatRewardsDateTime } from '../../data/rewardsData';
import type { PointTransaction, PointTransactionCategory } from '../../types/rewards';

export type RewardsTabId =
  | 'dashboard'
  | 'wallet'
  | 'challenges'
  | 'badges'
  | 'store'
  | 'my-rewards'
  | 'leaderboard'
  | 'referrals'
  | 'admin';

interface Props {
  mode: 'dashboard' | 'wallet';
  onNavigate: (tab: RewardsTabId) => void;
}

export const RewardsDashboardAndWalletView: React.FC<Props> = ({ mode, onNavigate }) => {
  const {
    wallet,
    currentLevel,
    nextLevel,
    levels,
    rules,
    transactions,
    achievements,
    unlockedAchievements,
  } = useRewards();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | PointTransactionCategory>('All');
  const [dateWindow, setDateWindow] = useState<'all' | '7d' | '30d'>('all');
  const [selectedTx, setSelectedTx] = useState<PointTransaction | null>(null);

  const isNavyTheme = wallet?.activeDigitalTheme === 'navy-honours';

  const levelProgress = useMemo(() => {
    if (!wallet || !currentLevel) return 0;
    if (!nextLevel) return 100;
    const span = nextLevel.minPoints - currentLevel.minPoints;
    if (span <= 0) return 100;
    const gained = wallet.totalEarned - currentLevel.minPoints;
    return Math.max(0, Math.min(100, Math.round((gained / span) * 100)));
  }, [wallet, currentLevel, nextLevel]);

  const pointsNeeded = useMemo(() => {
    if (!wallet || !nextLevel) return 0;
    return Math.max(0, nextLevel.minPoints - wallet.totalEarned);
  }, [wallet, nextLevel]);

  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    return transactions.filter((tx) => {
      if (categoryFilter !== 'All' && tx.category !== categoryFilter) return false;
      if (dateWindow !== 'all') {
        const days = dateWindow === '7d' ? 7 : 30;
        const ts = new Date(tx.createdAt).getTime();
        if (Number.isFinite(ts) && now - ts > days * 86400_000) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          tx.activityName.toLowerCase().includes(q) ||
          tx.module.toLowerCase().includes(q) ||
          tx.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [transactions, categoryFilter, dateWindow, searchQuery]);

  if (mode === 'wallet') {
    return (
      <div className="space-y-6">
        {/* Wallet Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Available Balance
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
              {wallet?.availableBalance ?? 0} K-Pts
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Earned
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              +{wallet?.totalEarned ?? 0}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Redeemed
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
              {wallet?.totalRedeemed ?? 0}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Points
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-700 dark:text-slate-300 mt-1 tabular-nums">
              {wallet?.pendingPoints ?? 0}
            </div>
          </div>
        </div>

        {/* Ledger Filter Controls */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                Audited K-Points Transaction Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every point credit, redemption, and administrative adjustment is permanently recorded.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search activity or module..."
                  className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <select
                value={dateWindow}
                onChange={(e) => setDateWindow(e.target.value as 'all' | '7d' | '30d')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Dates</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            {(['All', 'Earned', 'Redeemed', 'Pending', 'Reversed'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 dark:bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Wallet className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching K-Points transactions yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Participate in Study Rooms, upload documents in Digital Locker, finish Career assessments, or vote in Student Voice to earn verified points.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.points > 0;
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setSelectedTx(tx)}
                    className="w-full py-3.5 px-3 flex items-center justify-between gap-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.status === 'Reversed'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            : isPositive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {tx.activityName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span>{tx.module}</span>
                          <span>·</span>
                          <span>{tx.category}</span>
                          <span>·</span>
                          <span className="tabular-nums">{formatRewardsDateTime(tx.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-bold tabular-nums ${
                          tx.status === 'Reversed'
                            ? 'text-slate-400 line-through'
                            : isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isPositive ? `+${tx.points}` : tx.points} K-Pts
                      </div>
                      <div className="text-[11px] font-medium text-slate-400">{tx.status}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Ledger Receipt
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTx.activityName}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-2.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Transaction ID</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    {selectedTx.id}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Module</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedTx.module}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Points Impact</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {selectedTx.points > 0 ? `+${selectedTx.points}` : selectedTx.points} K-Points
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Status</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {selectedTx.status}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Timestamp</span>
                  <span className="text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatRewardsDateTime(selectedTx.createdAt)}
                  </span>
                </div>
                {selectedTx.sourceEventKey && (
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Source Reference</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                      {selectedTx.sourceEventKey}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedTx.description}
              </p>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-700"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard Mode
  return (
    <div className="space-y-6">
      {/* Editorial Hero Card */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border transition-colors ${
          isNavyTheme
            ? 'bg-[#0B1B3B] border-[#1D3566] text-white'
            : 'bg-slate-900 dark:bg-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>
                Level {currentLevel?.levelNumber ?? 1} · {currentLevel?.name ?? 'STARTER'}
              </span>
              {isNavyTheme && (
                <span className="text-sky-300 font-semibold">· Navy Honours Theme Active</span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Your Efforts Deserve Recognition.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every meaningful step in your student journey can unlock new achievements.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => onNavigate('store')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Store className="w-4 h-4" />
                Explore Rewards
              </button>
              <button
                onClick={() => onNavigate('wallet')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <History className="w-4 h-4" />
                View Points History
              </button>
              <button
                onClick={() => onNavigate('challenges')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Target className="w-4 h-4" />
                Complete Challenges
              </button>
            </div>
          </div>

          {/* Main Rewards Balance Panel */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-w-[280px] lg:min-w-[340px] space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Available KAMPUS Points
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white mt-0.5 tabular-nums">
                  {wallet?.availableBalance ?? 0}{' '}
                  <span className="text-base font-bold text-amber-400">K-Pts</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Earned</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {wallet?.totalEarned ?? 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Redeemed</span>
                <span className="font-bold text-amber-300 tabular-nums">
                  {wallet?.totalRedeemed ?? 0}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Badges</span>
                <span className="font-bold text-white tabular-nums">
                  {unlockedAchievements.length}/{achievements.length}
                </span>
              </div>
            </div>

            {/* Level Progression Meter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">
                  {nextLevel
                    ? `Progress to ${nextLevel.name}`
                    : 'Highest Campus Level Reached'}
                </span>
                <span className="text-amber-300 font-bold tabular-nums">
                  {nextLevel ? `${pointsNeeded} pts left` : `${levelProgress}%`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Honest Zero-State Welcome for New Accounts */}
      {(wallet?.totalEarned ?? 0) === 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-600" />
              Your K-Points Wallet Starts Clean at 0
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
              KAMPUS Rewards only credits points from verified student actions. Join a Study Room, upload a study record to Digital Locker, finish a Career assessment, check in at an Event, or vote in Student Voice to unlock your first K-Points.
            </p>
          </div>
          <button
            onClick={() => onNavigate('challenges')}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-600 text-white text-xs font-semibold shrink-0 hover:bg-slate-800 dark:hover:bg-amber-500"
          >
            View Starter Challenges
          </button>
        </div>
      )}

      {/* 5 Reward Levels Progression Track */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              Student Achievement Levels
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your level advances automatically based on verified cumulative K-Points earned.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
            Current Cumulative Earned: {wallet?.totalEarned ?? 0} K-Pts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {levels.map((lvl) => {
            const isCurrent = currentLevel?.levelNumber === lvl.levelNumber;
            const isUnlocked = (wallet?.totalEarned ?? 0) >= lvl.minPoints;
            return (
              <div
                key={lvl.levelNumber}
                className={`p-4 rounded-xl border transition-colors ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30'
                    : isUnlocked
                    ? 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50'
                    : 'border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span className={isCurrent ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}>
                    Level {lvl.levelNumber}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {lvl.minPoints}+ pts
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {lvl.name}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {lvl.tagline}
                </p>
                <ul className="mt-3 space-y-1">
                  {lvl.benefits.map((b, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          isUnlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Earning Rules + Recent Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Point Earning Rules
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Server-validated cross-module triggers with transparent daily limits.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="py-3 flex items-start justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {rule.actionName}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">{rule.description}</div>
                  <div className="text-[11px] text-slate-400 pt-0.5">
                    Module: {rule.module} · Daily cap: {rule.dailyLimit}x/day
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`font-bold tabular-nums ${
                      rule.active
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {rule.active ? `+${rule.points} K-Pts` : 'Paused'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              Recent Rewards Timeline
            </h3>
            <button
              onClick={() => onNavigate('wallet')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Full Ledger
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-4">
              <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No reward activity yet. Verified achievements and K-Point credits will appear here automatically.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {tx.activityName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {tx.module} · {formatRewardsDate(tx.createdAt)}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold tabular-nums shrink-0 ${
                      tx.points > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {tx.points > 0 ? `+${tx.points}` : tx.points}
                  </span>
                </div>
              ))}
            </div>
          )}

          {unlockedAchievements.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Latest Unlocked Badges
                </span>
                <button
                  onClick={() => onNavigate('badges')}
                  className="text-[11px] font-semibold text-amber-600 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="space-y-1.5">
                {unlockedAchievements.slice(0, 3).map((u) => {
                  const def = achievements.find((a) => a.id === u.achievementId);
                  if (!def) return null;
                  return (
                    <div
                      key={u.achievementId}
                      className="text-xs flex items-center justify-between text-slate-600 dark:text-slate-300"
                    >
                      <span className="font-medium truncate">{def.name}</span>
                      <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                        {formatRewardsDate(u.unlockedAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
