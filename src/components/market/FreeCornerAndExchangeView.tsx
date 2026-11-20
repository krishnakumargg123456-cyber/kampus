import React, { useMemo, useState } from 'react';
import { Gift, MessageSquare, Repeat, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import {
  FREE_CORNER_TYPES,
  MARKET_CONDITIONS,
  formatMarketDate,
  resolveMarketImage,
} from '../../data/marketData';
import type { MarketCondition, MarketListing } from '../../types/market';

interface FreeCornerAndExchangeViewProps {
  mode: 'free-corner' | 'exchange-hub';
  onOpenProductDetail: (listing: MarketListing) => void;
}

export const FreeCornerAndExchangeView: React.FC<FreeCornerAndExchangeViewProps> = ({
  mode,
  onOpenProductDetail,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'usr_22b030149';
  const {
    listings,
    giveawayRequests,
    exchangeProposals,
    submitGiveawayRequest,
    respondToGiveawayRequest,
    submitExchangeProposal,
    respondToExchangeProposal,
    contactSellerInChat,
  } = useMarket();

  const [freeSubFilter, setFreeSubFilter] = useState('All');
  const [requestTarget, setRequestTarget] = useState<MarketListing | null>(null);
  const [requestMsg, setRequestMsg] = useState('');

  const [exchangeTarget, setExchangeTarget] = useState<MarketListing | null>(null);
  const [proposedItemTitle, setProposedItemTitle] = useState('');
  const [proposedCondition, setProposedCondition] = useState<MarketCondition>('Good');
  const [exchangeMsg, setExchangeMsg] = useState('');

  const giveawayListings = useMemo(() => {
    return listings.filter((l) => {
      if (l.listingType !== 'Giveaway' || l.status !== 'Active') return false;
      if (freeSubFilter === 'All') return true;
      if (freeSubFilter === 'Free Books') return l.category === 'Books & Study';
      if (freeSubFilter === 'Free Stationery') return l.category === 'Stationery';
      if (freeSubFilter === 'Hostel Items')
        return l.category === 'Hostel Essentials' || l.category === 'Furniture';
      if (freeSubFilter === 'Study Materials')
        return l.category === 'Books & Study' || l.category === 'Lab Equipment';
      return true;
    });
  }, [listings, freeSubFilter]);

  const exchangeListings = useMemo(
    () => listings.filter((l) => l.listingType === 'Exchange' && l.status === 'Active'),
    [listings]
  );

  const handleGiveawaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTarget) return;
    const ok = await submitGiveawayRequest(
      requestTarget,
      requestMsg.trim() || 'Interested in picking this up safely on campus.'
    );
    if (ok) {
      setRequestTarget(null);
      setRequestMsg('');
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeTarget || !proposedItemTitle.trim()) return;
    const ok = await submitExchangeProposal({
      listing: exchangeTarget,
      proposedItemTitle: proposedItemTitle.trim(),
      proposedItemCondition: proposedCondition,
      message: exchangeMsg.trim(),
    });
    if (ok) {
      setExchangeTarget(null);
      setProposedItemTitle('');
      setExchangeMsg('');
    }
  };

  if (mode === 'free-corner') {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-600" />
                <span>Give It a Second Life.</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Pass on things you no longer need and help another student.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['All', ...FREE_CORNER_TYPES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFreeSubFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
                  freeSubFilter === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {giveawayListings.map((item) => {
            const coverImg = resolveMarketImage(item.images[item.coverIndex] || item.images[0]);
            const isOwner = item.sellerId === currentUserId;
            return (
              <article
                key={item.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => onOpenProductDetail(item)}
                    className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={coverImg}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-1.5">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {item.category} · {item.condition} · Free Giveaway
                    </p>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                      Pickup: {item.pickupPoint} · {item.sellerCampus}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Owner: {item.sellerName} · Available
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onOpenProductDetail(item)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    View Item
                  </button>
                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => setRequestTarget(item)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      Request Item
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => contactSellerInChat(item)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold inline-flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Contact Owner</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Giveaway Requests Tracking */}
        {giveawayRequests.length > 0 && (
          <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Giveaway Requests Activity ({giveawayRequests.length})
            </h3>
            <div className="space-y-2">
              {giveawayRequests.map((g) => {
                const isOwner = g.ownerId === currentUserId;
                return (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {g.listingTitle} · Status: {g.status}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {isOwner ? `Requested by ${g.requesterName}` : `Owner: ${g.ownerName}`} ·{' '}
                        {g.message} · {formatMarketDate(g.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner && g.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => respondToGiveawayRequest(g, 'Accepted')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToGiveawayRequest(g, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {isOwner && g.status === 'Accepted' && (
                        <button
                          type="button"
                          onClick={() => respondToGiveawayRequest(g, 'Completed')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold"
                        >
                          Mark Completed
                        </button>
                      )}
                      {!isOwner && g.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => respondToGiveawayRequest(g, 'Cancelled')}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 font-semibold"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Request Modal */}
        {requestTarget && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
            <form
              onSubmit={handleGiveawaySubmit}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Request Giveaway Item
                </h3>
                <button type="button" onClick={() => setRequestTarget(null)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Item: {requestTarget.title}
              </p>
              <textarea
                rows={3}
                value={requestMsg}
                onChange={(e) => setRequestMsg(e.target.value)}
                placeholder="Share a quick note about when you can meet at the pickup point..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Send Giveaway Request
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // EXCHANGE HUB
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Repeat className="w-5 h-5 text-blue-600" />
          <span>Swap Something. Discover Something.</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Exchange useful things with other students instead of buying everything new.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exchangeListings.map((item) => {
          const coverImg = resolveMarketImage(item.images[item.coverIndex] || item.images[0]);
          const isOwner = item.sellerId === currentUserId;
          return (
            <article
              key={item.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div
                  onClick={() => onOpenProductDetail(item)}
                  className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 cursor-pointer overflow-hidden"
                >
                  <img
                    src={coverImg}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 space-y-2 text-xs">
                  <p className="font-medium text-blue-600 dark:text-blue-400">
                    {item.category} · {item.condition} · Exchange
                  </p>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 space-y-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block">
                      Preferred in Exchange:
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {item.preferredExchangeItem || 'Open to student study/hostel items'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                    {item.exchangeDescription || item.description}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {item.sellerName} · {item.sellerCampus}, {item.sellerCity}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onOpenProductDetail(item)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  View Exchange
                </button>
                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => setExchangeTarget(item)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Propose an Exchange
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => contactSellerInChat(item)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold inline-flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Contact Student</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Exchange Proposals Activity */}
      {exchangeProposals.length > 0 && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Exchange Proposals ({exchangeProposals.length})
          </h3>
          <div className="space-y-2">
            {exchangeProposals.map((p) => {
              const isOwner = p.ownerId === currentUserId;
              return (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {p.listingTitle} ⇄ {p.proposedItemTitle} ({p.proposedItemCondition})
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Status: <strong>{p.status}</strong> ·{' '}
                      {isOwner ? `From ${p.proposerName}` : `To ${p.ownerName}`}
                      {p.message ? ` — "${p.message}"` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && p.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => respondToExchangeProposal(p, 'Accepted')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                        >
                          Accept Swap
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToExchangeProposal(p, 'Rejected')}
                          className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {!isOwner && p.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => respondToExchangeProposal(p, 'Cancelled')}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Propose Exchange Modal */}
      {exchangeTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleExchangeSubmit}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Propose an Exchange
              </h3>
              <button type="button" onClick={() => setExchangeTarget(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Swapping for: <strong className="text-slate-900 dark:text-slate-100">{exchangeTarget.title}</strong>
            </p>
            <input
              type="text"
              required
              value={proposedItemTitle}
              onChange={(e) => setProposedItemTitle(e.target.value)}
              placeholder="Your item to offer in exchange *"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <select
              value={proposedCondition}
              onChange={(e) => setProposedCondition(e.target.value as MarketCondition)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {MARKET_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  Condition: {c}
                </option>
              ))}
            </select>
            <textarea
              rows={3}
              value={exchangeMsg}
              onChange={(e) => setExchangeMsg(e.target.value)}
              placeholder="Optional message (item age, meetup availability)..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Exchange Proposal</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
