import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sliders,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { useRewards } from '../../context/RewardsContext';
import {
  LEADERBOARD_PERIODS,
  REWARD_STORE_CATEGORIES,
  formatRewardsDateTime,
} from '../../data/rewardsData';
import type { RedemptionStatus, RewardStoreCategory } from '../../types/rewards';

interface Props {
  mode: 'leaderboard' | 'referrals' | 'admin';
}

export const LeaderboardReferralAdminView: React.FC<Props> = ({ mode }) => {
  const {
    wallet,
    leaderboard,
    leaderboardPeriod,
    refreshLeaderboard,
    toggleLeaderboardPrivacy,
    referrals,
    submitReferral,
    roleInfo,
    switchRoleSession,
    rules,
    levels,
    redemptions,
    auditLogs,
    analytics,
    allTransactions,
    adminUpdateRule,
    adminUpdateLevel,
    adminAddCatalogItem,
    adminAddChallenge,
    adminAdjustPoints,
    adminReverseTransaction,
    adminUpdateRedemption,
    adminVerifyReferral,
  } = useRewards();

  // Referral state
  const [peerInput, setPeerInput] = useState('');
  const [refError, setRefError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Admin unlock state
  const [passkey, setPasskey] = useState('');
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'rules' | 'catalog' | 'adjust' | 'fulfillment'>('rules');

  // Admin forms
  const [newItemName, setNewItemName] = useState('');
  const [newItemCat, setNewItemCat] = useState<RewardStoreCategory>('Campus Rewards');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPts, setNewItemPts] = useState(60);
  const [newItemLvl, setNewItemLvl] = useState(1);
  const [newItemStock, setNewItemStock] = useState(25);
  const [newItemPartner, setNewItemPartner] = useState('');

  const [newChCadence, setNewChCadence] = useState<'Daily' | 'Weekly'>('Weekly');
  const [newChName, setNewChName] = useState('');
  const [newChDesc, setNewChDesc] = useState('');
  const [newChPts, setNewChPts] = useState(30);
  const [newChTarget, setNewChTarget] = useState(1);
  const [newChMetric, setNewChMetric] = useState('voice_contributions');

  const [adjUserId, setAdjUserId] = useState('');
  const [adjDelta, setAdjDelta] = useState(25);
  const [adjReason, setAdjReason] = useState('');
  const [adjError, setAdjError] = useState<string | null>(null);

  const [revReasons, setRevReasons] = useState<Record<string, string>>({});

  if (mode === 'leaderboard') {
    const isVisible = wallet?.showOnLeaderboard ?? true;
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-600" />
              KAMPUS Leaderboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rankings are calculated transparently from verified ledger activity. Opt out anytime.
            </p>
          </div>

          <button
            onClick={() => toggleLeaderboardPrivacy(!isVisible)}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition-colors self-start sm:self-auto ${
              isVisible
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {isVisible ? 'Visible on Leaderboard' : 'Hidden from Leaderboard'}
          </button>
        </div>

        {/* Period & Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {LEADERBOARD_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => refreshLeaderboard(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                leaderboardPeriod === p
                  ? 'bg-slate-900 dark:bg-amber-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No opted-in participants with earned points for {leaderboardPeriod} yet
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Students who enable leaderboard visibility and earn verified K-Points in this category appear here in real time.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-5">Rank</th>
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-5">Level</th>
                    <th className="py-3.5 px-5">Badges</th>
                    <th className="py-3.5 px-5 text-right">K-Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {leaderboard.map((entry) => {
                    const isMe = entry.userId === wallet?.userId;
                    return (
                      <tr
                        key={entry.userId}
                        className={isMe ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''}
                      >
                        <td className="py-3.5 px-5 font-extrabold text-slate-900 dark:text-white tabular-nums">
                          #{entry.rank}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {entry.displayName} {isMe && '(You)'}
                          </div>
                          <div className="text-[11px] text-slate-500">{entry.college}</div>
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-amber-600 dark:text-amber-400">
                          {entry.levelName}
                        </td>
                        <td className="py-3.5 px-5 tabular-nums text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            {entry.unlockedBadgesCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-extrabold text-slate-900 dark:text-white tabular-nums">
                          {entry.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'referrals') {
    const code = wallet?.referralCode || '';
    const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      setRefError(null);
      const res = await submitReferral(peerInput);
      if (!res.ok) {
        setRefError(res.error || 'Could not submit referral.');
      } else {
        setPeerInput('');
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                Campus Peer Referral Program
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invite classmates to KAMPUS. Bonuses (+50 K-Points) release only after admin onboarding verification.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Your Unique Referral Code
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-base font-mono font-extrabold text-slate-900 dark:text-white">
                  {code || 'Generating...'}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 1800);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                  Peer Campus Email or Enrollment ID
                </label>
                <input
                  type="text"
                  value={peerInput}
                  onChange={(e) => setPeerInput(e.target.value)}
                  placeholder="e.g. ananya.verma@iitb.ac.in or 22B030201"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {refError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {refError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white text-xs font-bold"
              >
                Send Verified Referral Invite
              </button>
            </form>

            <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Self-referrals and duplicate peer registrations are automatically blocked server-side.
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Referral Status Tracker
            </h3>

            {referrals.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                No peer referrals recorded yet. Invited classmates and their verification milestones appear here.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {referrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="py-3.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {ref.referredIdentifier}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        Invited {formatRewardsDateTime(ref.createdAt)} · Code {ref.referralCodeUsed}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-bold ${
                          ref.status === 'Rewarded'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {ref.status}
                      </span>
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        {ref.pointsAwarded > 0 ? `+${ref.pointsAwarded} K-Pts` : 'Pending review'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin Console Mode
  if (roleInfo.role !== 'Rewards Admin') {
    const unlockAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasskeyError(null);
      const res = await switchRoleSession(passkey.trim(), false);
      if (!res.ok) {
        setPasskeyError(res.error || 'Authorization denied.');
      } else {
        setPasskey('');
      }
    };

    return (
      <div className="max-w-lg mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-amber-600 text-white flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              KAMPUS Rewards Admin Authorization
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Student accounts receive HTTP 403 on all configuration, audit, and fulfillment APIs. Enter the administrator passkey to elevate your session.
            </p>
          </div>
        </div>

        <form onSubmit={unlockAdmin} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Administrator Passkey
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey (KMP-REWARDS-ADMIN-2026)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {passkeyError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {passkeyError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-amber-500"
          >
            Authorize Rewards Admin Session
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Role-Protected Governance Console
          </div>
          <h2 className="text-lg font-bold mt-0.5">{roleInfo.label || 'Rewards Admin Console'}</h2>
        </div>
        <button
          onClick={() => switchRoleSession(undefined, true)}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold self-start sm:self-auto"
        >
          Exit Admin View
        </button>
      </div>

      {/* Real Analytics Grid */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Active Wallets', val: analytics.totalWallets },
            { label: 'Points Issued', val: analytics.totalPointsIssued },
            { label: 'Points Redeemed', val: analytics.totalPointsRedeemed },
            { label: 'Redemptions', val: analytics.totalRedemptions },
            { label: 'Active Challenges', val: analytics.activeChallenges },
            { label: 'Reversed Entries', val: analytics.flaggedOrReversedCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <span className="text-[11px] font-semibold text-slate-400 block">{stat.label}</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5 block">
                {stat.val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Admin Subtabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(
          [
            { id: 'rules', label: 'Point Rules & Levels', icon: Sliders },
            { id: 'catalog', label: 'Store & Challenges', icon: Plus },
            { id: 'adjust', label: 'Audit & Adjustments', icon: BarChart3 },
            { id: 'fulfillment', label: 'Redemptions & Referrals', icon: ShieldCheck },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setAdminTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                adminTab === t.id
                  ? 'bg-slate-900 dark:bg-amber-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {adminTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Configure Point Rules & Daily Caps
            </h3>
            <div className="space-y-3">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{r.actionName}</span>
                    <button
                      onClick={() => adminUpdateRule(r.id, { active: !r.active })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        r.active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {r.active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1.5 text-slate-500">
                      Points:
                      <input
                        type="number"
                        defaultValue={r.points}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v !== r.points) {
                            adminUpdateRule(r.id, { points: v });
                          }
                        }}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-slate-500">
                      Daily Limit:
                      <input
                        type="number"
                        min={1}
                        defaultValue={r.dailyLimit}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v >= 1 && v !== r.dailyLimit) {
                            adminUpdateRule(r.id, { dailyLimit: v });
                          }
                        }}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reward Level Thresholds
            </h3>
            <div className="space-y-3">
              {levels.map((lvl) => (
                <div
                  key={lvl.levelNumber}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Level {lvl.levelNumber}: {lvl.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{lvl.tagline}</div>
                  </div>
                  <label className="flex items-center gap-1.5 text-slate-500 shrink-0">
                    Min Pts:
                    <input
                      type="number"
                      min={0}
                      defaultValue={lvl.minPoints}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v >= 0 && v !== lvl.minPoints) {
                          adminUpdateLevel(lvl.levelNumber, v);
                        }
                      }}
                      className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adminTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newItemName.trim()) return;
              const ok = await adminAddCatalogItem({
                name: newItemName,
                category: newItemCat,
                description: newItemDesc || 'Verified student catalog reward.',
                requiredPoints: newItemPts,
                requiredLevel: newItemLvl,
                stockRemaining: newItemStock,
                imageKey: newItemCat === 'Career Rewards' ? 'career_kit' : newItemCat === 'Study Rewards' ? 'study_pack' : 'campus_pass',
                isPartnerOffer: newItemCat === 'Partner Offers',
                partnerName: newItemCat === 'Partner Offers' ? newItemPartner || 'Campus Partner' : undefined,
              });
              if (ok) {
                setNewItemName('');
                setNewItemDesc('');
                setNewItemPartner('');
              }
            }}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Add Store Reward or Partner Offer
            </h3>
            <input
              type="text"
              required
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Reward Title"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newItemCat}
                onChange={(e) => setNewItemCat(e.target.value as RewardStoreCategory)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {REWARD_STORE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={5}
                value={newItemPts}
                onChange={(e) => setNewItemPts(Number(e.target.value))}
                placeholder="Points"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
            </div>
            {newItemCat === 'Partner Offers' && (
              <input
                type="text"
                value={newItemPartner}
                onChange={(e) => setNewItemPartner(e.target.value)}
                placeholder="Verified Partner Organization Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1}
                max={5}
                value={newItemLvl}
                onChange={(e) => setNewItemLvl(Number(e.target.value))}
                placeholder="Min Level (1-5)"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
              <input
                type="number"
                min={-1}
                value={newItemStock}
                onChange={(e) => setNewItemStock(Number(e.target.value))}
                placeholder="Stock (-1 unlimited)"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
            </div>
            <textarea
              rows={2}
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              placeholder="Clear description & fulfillment details"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 text-white font-bold"
            >
              Publish Store Reward
            </button>
          </form>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newChName.trim()) return;
              const ok = await adminAddChallenge({
                cadence: newChCadence,
                name: newChName,
                description: newChDesc || 'Complete verified student participation.',
                rewardPoints: newChPts,
                targetCount: newChTarget,
                metricKey: newChMetric,
                deadlineISO: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
              });
              if (ok) {
                setNewChName('');
                setNewChDesc('');
              }
            }}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Create Daily or Weekly Challenge
            </h3>
            <input
              type="text"
              required
              value={newChName}
              onChange={(e) => setNewChName(e.target.value)}
              placeholder="Challenge Name"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newChCadence}
                onChange={(e) => setNewChCadence(e.target.value as 'Daily' | 'Weekly')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
              <input
                type="number"
                min={5}
                value={newChPts}
                onChange={(e) => setNewChPts(Number(e.target.value))}
                placeholder="Bonus Pts"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
              <input
                type="number"
                min={1}
                value={newChTarget}
                onChange={(e) => setNewChTarget(Number(e.target.value))}
                placeholder="Target Count"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
            </div>
            <select
              value={newChMetric}
              onChange={(e) => setNewChMetric(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="voice_contributions">Verified Student Voice Polls / Feedback</option>
              <option value="locker_docs">Digital Locker Uploads</option>
              <option value="study_sessions">Study Room Participations</option>
              <option value="career_total">Career Assessments + Resumes</option>
              <option value="campus_total">Events Check-ins + Club Joins</option>
            </select>
            <textarea
              rows={2}
              value={newChDesc}
              onChange={(e) => setNewChDesc(e.target.value)}
              placeholder="Challenge instructions"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 text-white font-bold"
            >
              Publish Verified Challenge
            </button>
          </form>
        </div>
      )}

      {adminTab === 'adjust' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setAdjError(null);
              const res = await adminAdjustPoints({
                targetUserId: adjUserId.trim() || wallet?.userId || '',
                pointsDelta: adjDelta,
                reason: adjReason.trim(),
              });
              if (!res.ok) {
                setAdjError(res.error || 'Adjustment failed.');
              } else {
                setAdjReason('');
              }
            }}
            className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Audited Manual Point Adjustment
            </h3>
            <p className="text-[11px] text-slate-500">
              Every adjustment requires an explicit audit reason and writes to the permanent admin log.
            </p>
            <input
              type="text"
              value={adjUserId}
              onChange={(e) => setAdjUserId(e.target.value)}
              placeholder={`Target User ID (default: ${wallet?.userId || 'usr_22b030149'})`}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <input
              type="number"
              value={adjDelta}
              onChange={(e) => setAdjDelta(Number(e.target.value))}
              placeholder="Point Delta (positive or negative)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
            />
            <input
              type="text"
              required
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="Mandatory audit reason (e.g. Hackathon Prize Recognition)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            {adjError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-medium">
                {adjError}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 text-white font-bold"
            >
              Record Audited Adjustment
            </button>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Recent Audit Logs</h4>
              {auditLogs.length === 0 ? (
                <p className="text-[11px] text-slate-400">No admin actions recorded yet.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {auditLogs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-[11px]"
                    >
                      <div className="font-bold text-slate-900 dark:text-white">{log.action}</div>
                      <div className="text-slate-600 dark:text-slate-300">{log.details}</div>
                      <div className="text-slate-400 tabular-nums">
                        Reason: {log.reason} · {formatRewardsDateTime(log.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Ledger Oversight & Reversals
            </h3>
            {allTransactions.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">No global transactions yet.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {allTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {tx.activityName} ({tx.points > 0 ? `+${tx.points}` : tx.points} K-Pts)
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        User: {tx.userId} · {tx.status} · {formatRewardsDateTime(tx.createdAt)}
                      </div>
                    </div>
                    {tx.status !== 'Reversed' && tx.module !== 'Admin Adjustment' && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={revReasons[tx.id] || ''}
                          onChange={(e) =>
                            setRevReasons((prev) => ({ ...prev, [tx.id]: e.target.value }))
                          }
                          placeholder="Reversal reason"
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] w-36"
                        />
                        <button
                          onClick={async () => {
                            const r = (revReasons[tx.id] || '').trim() || 'Admin compliance reversal';
                            await adminReverseTransaction(tx.id, r);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reverse
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'fulfillment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Redemption Fulfillment Queue
            </h3>
            {redemptions.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">No redemptions pending or completed.</p>
            ) : (
              redemptions.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{rec.rewardName}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {rec.userName} ({rec.userId}) · {rec.status} · {rec.pointsSpent} K-Pts
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(['Fulfilled', 'Rejected'] as RedemptionStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => adminUpdateRedemption(rec.id, st)}
                        disabled={rec.status === st}
                        className={`px-2.5 py-1 rounded-lg font-bold disabled:opacity-40 ${
                          st === 'Fulfilled'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {st === 'Fulfilled' ? 'Fulfill' : 'Reject'}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Peer Referral Verification
            </h3>
            {referrals.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">No referrals awaiting review.</p>
            ) : (
              referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {ref.referredIdentifier}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Referrer: {ref.referrerName} · Status: {ref.status}
                    </div>
                  </div>
                  {ref.status !== 'Rewarded' && (
                    <button
                      onClick={() => adminVerifyReferral(ref.id, 'Rewarded')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                    >
                      Verify & Award +50
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
