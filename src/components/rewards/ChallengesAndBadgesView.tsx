import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { useRewards } from '../../context/RewardsContext';
import {
  BADGE_CATEGORIES,
  formatRewardsDate,
  formatRewardsDateTime,
} from '../../data/rewardsData';
import type { BadgeCategory } from '../../types/rewards';

interface Props {
  mode: 'challenges' | 'badges';
}

export const ChallengesAndBadgesView: React.FC<Props> = ({ mode }) => {
  const {
    challenges,
    challengeParticipations,
    joinChallenge,
    claimChallenge,
    achievements,
    unlockedAchievements,
  } = useRewards();

  const [cadenceFilter, setCadenceFilter] = useState<'All' | 'Daily' | 'Weekly'>('All');
  const [badgeCategory, setBadgeCategory] = useState<'All' | BadgeCategory>('All');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => cadenceFilter === 'All' || c.cadence === cadenceFilter);
  }, [challenges, cadenceFilter]);

  const filteredBadges = useMemo(() => {
    return achievements.filter((a) => badgeCategory === 'All' || a.category === badgeCategory);
  }, [achievements, badgeCategory]);

  const handleJoin = async (id: string) => {
    setBusyId(id);
    await joinChallenge(id);
    setBusyId(null);
  };

  const handleClaim = async (id: string) => {
    setBusyId(id);
    await claimChallenge(id);
    setBusyId(null);
  };

  if (mode === 'badges') {
    const unlockedCount = unlockedAchievements.length;
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Achievement Badges Gallery
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Badges unlock automatically when verified KAMPUS milestones are achieved.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 tabular-nums">
            Unlocked: {unlockedCount} / {achievements.length} Badges
          </div>
        </div>

        {/* Badge Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {(['All', ...BADGE_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setBadgeCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                badgeCategory === cat
                  ? 'bg-slate-900 dark:bg-amber-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((ach) => {
            const unlock = unlockedAchievements.find((u) => u.achievementId === ach.id);
            const isUnlocked = Boolean(unlock);
            return (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  isUnlocked
                    ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/70'
                    : 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isUnlocked ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isUnlocked
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {ach.category}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {ach.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Criteria: <strong className="text-slate-700 dark:text-slate-200">{ach.criteriaText}</strong>
                  </span>
                  {isUnlocked && unlock && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums shrink-0">
                      {formatRewardsDateTime(unlock.unlockedAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Challenges Mode
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            Daily & Weekly Participation Challenges
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Join structured challenges and claim bonus K-Points once backend-verified module activity completes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['All', 'Daily', 'Weekly'] as const).map((cad) => (
            <button
              key={cad}
              onClick={() => setCadenceFilter(cad)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                cadenceFilter === cad
                  ? 'bg-slate-900 dark:bg-amber-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cad}
            </button>
          ))}
        </div>
      </div>

      {filteredChallenges.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          No active challenges in this category right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChallenges.map((ch) => {
            const part = challengeParticipations.find((p) => p.challengeId === ch.id);
            const current = part?.currentProgress ?? 0;
            const pct = Math.min(100, Math.round((current / Math.max(1, ch.targetCount)) * 100));
            const isReadyToClaim = Boolean(part && !part.claimed && current >= ch.targetCount);
            const isClaimed = Boolean(part?.claimed);

            return (
              <div
                key={ch.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {ch.cadence} Challenge
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{ch.rewardPoints} K-Points
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{ch.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {ch.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" />
                      Ends {formatRewardsDate(ch.deadlineISO)}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Target: {ch.targetCount} verified action(s)
                    </span>
                  </div>

                  {part && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          Verified Progress
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {current} / {ch.targetCount}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isReadyToClaim || isClaimed ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  {!part ? (
                    <button
                      onClick={() => handleJoin(ch.id)}
                      disabled={busyId === ch.id}
                      className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {busyId === ch.id ? 'Joining...' : 'Join Challenge'}
                    </button>
                  ) : isClaimed ? (
                    <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Reward Claimed
                      </span>
                      <span className="tabular-nums text-[11px]">
                        {formatRewardsDate(part.claimedAt)}
                      </span>
                    </div>
                  ) : isReadyToClaim ? (
                    <button
                      onClick={() => handleClaim(ch.id)}
                      disabled={busyId === ch.id}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      {busyId === ch.id ? 'Claiming...' : `Claim +${ch.rewardPoints} K-Points`}
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Complete activity in KAMPUS to unlock claim
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
