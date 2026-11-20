import React, { useMemo, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  History,
  Lock,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Target,
  X,
} from 'lucide-react';
import { useRewards } from '../../context/RewardsContext';
import {
  REWARD_STORE_CATEGORIES,
  formatRewardsDate,
  formatRewardsDateTime,
  resolveRewardImage,
} from '../../data/rewardsData';
import type { RedemptionRecord, RewardCatalogItem, RewardStoreCategory } from '../../types/rewards';
import type { RewardsTabId } from './RewardsDashboardAndWalletView';

interface Props {
  mode: 'store' | 'my-rewards';
  onNavigate: (tab: RewardsTabId) => void;
}

export const RewardsStoreAndRedemptionView: React.FC<Props> = ({ mode, onNavigate }) => {
  const {
    wallet,
    currentLevel,
    catalog,
    redemptions,
    achievements,
    unlockedAchievements,
    challenges,
    challengeParticipations,
    transactions,
    redeemReward,
  } = useRewards();

  const [storeCategory, setStoreCategory] = useState<'All' | RewardStoreCategory>('All');
  const [myTab, setMyTab] = useState<'redemptions' | 'badges' | 'challenges' | 'coupons' | 'history'>('redemptions');
  const [checkoutItem, setCheckoutItem] = useState<RewardCatalogItem | null>(null);
  const [checkoutKey, setCheckoutKey] = useState<string>('');
  const [checkoutStep, setCheckoutStep] = useState<'confirm' | 'processing' | 'done'>('confirm');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedRedemption, setCompletedRedemption] = useState<RedemptionRecord | null>(null);
  const [inspectedRedemption, setInspectedRedemption] = useState<RedemptionRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => storeCategory === 'All' || item.category === storeCategory);
  }, [catalog, storeCategory]);

  const activeCoupons = useMemo(() => {
    return redemptions.filter((r) => Boolean(r.couponCode) && r.status !== 'Rejected' && r.status !== 'Cancelled');
  }, [redemptions]);

  const openCheckout = (item: RewardCatalogItem) => {
    setCheckoutItem(item);
    setCheckoutKey(`rdm_${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
    setCheckoutStep('confirm');
    setCheckoutError(null);
    setCompletedRedemption(null);
  };

  const confirmRedemption = async () => {
    if (!checkoutItem) return;
    setCheckoutStep('processing');
    setCheckoutError(null);
    const result = await redeemReward(checkoutItem.id, checkoutKey);
    if (!result.ok) {
      setCheckoutStep('confirm');
      setCheckoutError(result.error || 'Unable to process redemption.');
      return;
    }
    setCompletedRedemption(result.redemption || null);
    setCheckoutStep('done');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (mode === 'my-rewards') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-amber-600" />
              My Rewards & Fulfillments
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access unlocked digital toolkits, track campus passes, and review badges or challenges.
            </p>
          </div>
          <button
            onClick={() => onNavigate('store')}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-600 text-white text-xs font-bold self-start sm:self-auto"
          >
            Browse Rewards Store
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {(
            [
              { id: 'redemptions', label: `Redeemed Rewards (${redemptions.length})` },
              { id: 'badges', label: `My Badges (${unlockedAchievements.length})` },
              { id: 'challenges', label: `My Challenges (${challengeParticipations.length})` },
              { id: 'coupons', label: `Active Coupons (${activeCoupons.length})` },
              { id: 'history', label: `Points History (${transactions.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setMyTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                myTab === t.id
                  ? 'bg-slate-900 dark:bg-amber-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {myTab === 'redemptions' && (
          <div className="space-y-3">
            {redemptions.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Gift className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No rewards redeemed yet
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When you redeem K-Points in the Rewards Store, your fulfilled study blueprints, career kits, and campus passes appear here.
                </p>
              </div>
            ) : (
              redemptions.map((rec) => {
                const catalogMatch = catalog.find((c) => c.id === rec.rewardId);
                return (
                  <div
                    key={rec.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-amber-600 dark:text-amber-400">{rec.category}</span>
                        <span className="text-slate-300">·</span>
                        <span
                          className={
                            rec.status === 'Fulfilled'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : rec.status === 'Rejected' || rec.status === 'Cancelled'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }
                        >
                          {rec.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {rec.rewardName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        ID: {rec.id} · Spent {rec.pointsSpent} K-Pts · {formatRewardsDateTime(rec.createdAt)}
                      </p>
                      {rec.note && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                          Admin Note: {rec.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(rec.status === 'Fulfilled' || rec.status === 'Confirmed') &&
                        (catalogMatch?.digitalContent || rec.usageInstructions) && (
                          <button
                            onClick={() => setInspectedRedemption(rec)}
                            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-600 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-amber-500"
                          >
                            View Access Details
                          </button>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {myTab === 'badges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.length === 0 ? (
              <div className="col-span-full p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No badges unlocked yet. Complete verified activities in KAMPUS to unlock achievement badges.
              </div>
            ) : (
              unlockedAchievements.map((u) => {
                const def = achievements.find((a) => a.id === u.achievementId);
                if (!def) return null;
                return (
                  <div
                    key={u.achievementId}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Award className="w-5 h-5 text-amber-600" />
                      <span className="text-[11px] font-semibold text-emerald-600 tabular-nums">
                        Unlocked {formatRewardsDate(u.unlockedAt)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{def.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{def.description}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {myTab === 'challenges' && (
          <div className="space-y-3">
            {challengeParticipations.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                You have not joined any challenges yet. Open the Challenges tab to join active sprints.
              </div>
            ) : (
              challengeParticipations.map((p) => {
                const ch = challenges.find((c) => c.id === p.challengeId);
                if (!ch) return null;
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{ch.name}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        Progress: {p.currentProgress} / {ch.targetCount} · +{ch.rewardPoints} K-Pts
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        p.claimed ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {p.claimed ? 'Claimed' : 'Active'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {myTab === 'coupons' && (
          <div className="space-y-3">
            {activeCoupons.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No active partner coupons. Verified partner vouchers configured by institution admins and redeemed by you will appear here.
              </div>
            ) : (
              activeCoupons.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {rec.rewardName}
                    </div>
                    <div className="text-xs text-slate-500 tabular-nums mt-0.5">
                      Valid through {formatRewardsDate(rec.couponValidity || undefined)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {rec.couponCode}
                    </code>
                    <button
                      onClick={() => handleCopy(rec.couponCode || '', rec.id)}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      {copiedId === rec.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {myTab === 'history' && (
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No ledger history recorded yet.
              </div>
            ) : (
              transactions.slice(0, 20).map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{tx.activityName}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {tx.module} · {formatRewardsDateTime(tx.createdAt)}
                    </div>
                  </div>
                  <span
                    className={`font-bold tabular-nums ${
                      tx.points > 0 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {tx.points > 0 ? `+${tx.points}` : tx.points} K-Pts
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Access & Blueprint Modal */}
        {inspectedRedemption && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    {inspectedRedemption.status} Access Pass
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {inspectedRedemption.rewardName}
                  </h3>
                </div>
                <button
                  onClick={() => setInspectedRedemption(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(() => {
                const match = catalog.find((c) => c.id === inspectedRedemption.rewardId);
                return (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-2 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {match?.digitalContent?.title || 'Redemption Instructions'}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {match?.digitalContent?.instructions || inspectedRedemption.usageInstructions}
                      </p>
                      {match?.digitalContent?.resourceText && (
                        <pre className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-200 leading-relaxed">
                          {match.digitalContent.resourceText}
                        </pre>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between tabular-nums">
                      <span>Redemption Reference: {inspectedRedemption.id}</span>
                      <span>{formatRewardsDateTime(inspectedRedemption.createdAt)}</span>
                    </div>
                  </div>
                );
              })()}
              <button
                onClick={() => setInspectedRedemption(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Store Mode
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-600" />
            Redeem Your Efforts.
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Exchange earned KAMPUS Points for study toolkits, career kits, campus workshop passes, and verified themes.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold tabular-nums self-start sm:self-auto">
          Available: {wallet?.availableBalance ?? 0} K-Pts
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(['All', ...REWARD_STORE_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setStoreCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              storeCategory === cat
                ? 'bg-slate-900 dark:bg-amber-600 text-white'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      {filteredCatalog.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {storeCategory === 'Partner Offers'
              ? 'No verified campus partner offers configured yet'
              : 'No rewards currently available in this category'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {storeCategory === 'Partner Offers'
              ? 'Official institutional partner perks only appear here once verified and published by a KAMPUS Rewards Administrator.'
              : 'Check back soon or select another category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCatalog.map((item) => {
            const levelNum = currentLevel?.levelNumber ?? 1;
            const balance = wallet?.availableBalance ?? 0;
            const meetsLevel = levelNum >= item.requiredLevel;
            const canAfford = balance >= item.requiredPoints;
            const inStock = item.stockRemaining !== 0;
            const eligible = meetsLevel && canAfford && inStock;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <img
                      src={resolveRewardImage(item.imageKey)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-amber-600 dark:text-amber-400">{item.category}</span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        {item.stockRemaining < 0
                          ? 'Digital Instant'
                          : `${item.stockRemaining} left`}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                    {item.isPartnerOffer && item.partnerName && (
                      <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                        Verified Partner: {item.partnerName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {item.requiredPoints} K-Points
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      Requires Level {item.requiredLevel}+
                    </span>
                  </div>
                  <button
                    onClick={() => openCheckout(item)}
                    disabled={!eligible}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                      eligible
                        ? 'bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {!inStock ? (
                      'Out of Stock'
                    ) : !meetsLevel ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Requires Level {item.requiredLevel}
                      </>
                    ) : !canAfford ? (
                      `Need ${item.requiredPoints - balance} more K-Pts`
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Redeem Reward
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6-Step Atomic Redemption Modal */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                  {checkoutStep === 'done' ? 'Redemption Recorded' : 'Confirm K-Points Redemption'}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {checkoutItem.name}
                </h3>
              </div>
              <button
                onClick={() => setCheckoutItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {checkoutStep !== 'done' ? (
              <>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Balance</span>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      {wallet?.availableBalance ?? 0} K-Pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reward Cost</span>
                    <span className="font-bold text-amber-600 tabular-nums">
                      -{checkoutItem.requiredPoints} K-Pts
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Remaining After Redemption
                    </span>
                    <span className="font-extrabold text-emerald-600 tabular-nums">
                      {Math.max(0, (wallet?.availableBalance ?? 0) - checkoutItem.requiredPoints)} K-Pts
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Protected by atomic server-side idempotency. Points cannot be double-spent on repeated clicks.
                  </span>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                    {checkoutError}
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    onClick={() => setCheckoutItem(null)}
                    disabled={checkoutStep === 'processing'}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRedemption}
                    disabled={checkoutStep === 'processing'}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {checkoutStep === 'processing' ? 'Verifying...' : 'Confirm & Redeem'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-emerald-900 dark:text-emerald-200">
                      Status: {completedRedemption?.status}
                    </div>
                    <p className="text-emerald-800 dark:text-emerald-300">
                      Reference ID: <span className="font-mono">{completedRedemption?.id}</span>
                    </p>
                  </div>
                </div>

                {checkoutItem.digitalContent && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-2 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {checkoutItem.digitalContent.title}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {checkoutItem.digitalContent.instructions}
                    </p>
                    <pre className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-200">
                      {checkoutItem.digitalContent.resourceText}
                    </pre>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setCheckoutItem(null);
                      onNavigate('my-rewards');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-600 text-white text-xs font-bold"
                  >
                    Open My Rewards
                  </button>
                  <button
                    onClick={() => setCheckoutItem(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
