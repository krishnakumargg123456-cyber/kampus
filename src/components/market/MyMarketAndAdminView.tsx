import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Heart,
  KeyRound,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  PlusCircle,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import {
  ALL_MARKET_CATEGORIES,
  formatMarketDate,
  formatMarketINR,
  resolveMarketImage,
} from '../../data/marketData';
import type { MarketCategory, MarketListing, MarketOffer } from '../../types/market';

interface MyMarketAndAdminViewProps {
  mode: 'my-market' | 'wishlist' | 'admin';
  onOpenProductDetail: (listing: MarketListing) => void;
  onBrowseMarketplace: () => void;
  onStartSelling: () => void;
}

type MyMarketTab =
  | 'overview'
  | 'all'
  | 'active'
  | 'pending'
  | 'sold'
  | 'paused'
  | 'wishlist'
  | 'offers'
  | 'exchanges'
  | 'giveaways';

export const MyMarketAndAdminView: React.FC<MyMarketAndAdminViewProps> = ({
  mode,
  onOpenProductDetail,
  onBrowseMarketplace,
  onStartSelling,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'usr_22b030149';

  const {
    listings,
    categories,
    wishlistIds,
    offers,
    giveawayRequests,
    exchangeProposals,
    roleInfo,
    reports,
    analytics,
    switchRoleSession,
    updateListing,
    deleteListing,
    toggleWishlist,
    respondToOffer,
    respondToGiveawayRequest,
    respondToExchangeProposal,
    contactSellerInChat,
    adminModerateListing,
    adminAddSubcategory,
    adminToggleRestrictUser,
    adminResolveReport,
  } = useMarket();

  const [myTab, setMyTab] = useState<MyMarketTab>('overview');
  const [editingListing, setEditingListing] = useState<MarketListing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [counterTarget, setCounterTarget] = useState<MarketOffer | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNote, setCounterNote] = useState('');

  // Admin state
  const [passkey, setPasskey] = useState('');
  const [newSubcatCategory, setNewSubcatCategory] = useState<MarketCategory>('Books & Study');
  const [newSubcatName, setNewSubcatName] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const myListings = useMemo(
    () => listings.filter((l) => l.sellerId === currentUserId),
    [listings, currentUserId]
  );

  const wishlistListings = useMemo(
    () => listings.filter((l) => wishlistIds.includes(l.id)),
    [listings, wishlistIds]
  );

  const myOffers = useMemo(
    () => offers.filter((o) => o.buyerId === currentUserId || o.sellerId === currentUserId),
    [offers, currentUserId]
  );

  const myExchanges = useMemo(
    () =>
      exchangeProposals.filter(
        (p) => p.proposerId === currentUserId || p.ownerId === currentUserId
      ),
    [exchangeProposals, currentUserId]
  );

  const myGiveaways = useMemo(
    () =>
      giveawayRequests.filter(
        (g) => g.requesterId === currentUserId || g.ownerId === currentUserId
      ),
    [giveawayRequests, currentUserId]
  );

  const openEditModal = (item: MarketListing) => {
    setEditingListing(item);
    setEditTitle(item.title);
    setEditPrice(item.priceINR !== null ? String(item.priceINR) : '');
    setEditDescription(item.description);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    const ok = await updateListing(editingListing.id, {
      title: editTitle.trim(),
      priceINR:
        editingListing.listingType === 'For Sale' ? Number(editPrice) || 0 : editingListing.priceINR,
      description: editDescription.trim(),
    });
    if (ok) setEditingListing(null);
  };

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterTarget) return;
    const ok = await respondToOffer(
      counterTarget,
      'Countered',
      Number(counterPrice) || counterTarget.offerPriceINR,
      counterNote.trim()
    );
    if (ok) {
      setCounterTarget(null);
      setCounterPrice('');
      setCounterNote('');
    }
  };

  // ==================== WISHLIST VIEW ====================
  if (mode === 'wishlist') {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Heart className="w-5 h-5 text-orange-500 fill-current" />
              <span>Saved Wishlist ({wishlistListings.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compare saved items, monitor availability status, and message sellers anytime.
            </p>
          </div>
          <button
            type="button"
            onClick={onBrowseMarketplace}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Browse Marketplace
          </button>
        </div>

        {wishlistListings.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">
              Your Wishlist is empty
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Tap the heart icon on any book, gadget, hostel essential, or giveaway to bookmark it
              here.
            </p>
            <button
              type="button"
              onClick={onBrowseMarketplace}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlistListings.map((item) => (
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
                      src={resolveMarketImage(item.images[item.coverIndex] || item.images[0])}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-blue-600">{item.category}</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Status: {item.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatMarketINR(item.priceINR, item.listingType)}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {item.sellerName} · {item.sellerCampus}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onOpenProductDetail(item)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => contactSellerInChat(item)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold inline-flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Contact Seller</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(item.id)}
                    className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold ml-auto"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==================== ADMIN & MODERATION VIEW ====================
  if (mode === 'admin') {
    const isAdminOrMod = roleInfo.role !== 'Student';

    return (
      <div className="space-y-6 text-xs">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Marketplace Safety &amp; Admin Console</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              Active session role: <strong>{roleInfo.role}</strong>
              {roleInfo.label ? ` (${roleInfo.label})` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isAdminOrMod ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const ok = await switchRoleSession(passkey.trim());
                  if (ok) setPasskey('');
                }}
                className="flex items-center gap-2"
              >
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Moderator / Admin passkey"
                    className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
                >
                  Unlock Console
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => switchRoleSession(undefined, true)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
              >
                Return to Student Mode
              </button>
            )}
          </div>
        </div>

        {!isAdminOrMod ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-2">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Restricted to Marketplace Moderators &amp; Platform Admins
            </p>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Students cannot moderate other sellers&apos; listings or access reported user queues.
              Authorized moderators can unlock this console using a valid moderation passkey (
              <code className="font-mono text-blue-600">KMP-MARKET-MOD-2026</code> or{' '}
              <code className="font-mono text-blue-600">KMP-MARKET-ADMIN-2026</code>).
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Genuine Analytics Summary */}
            {analytics && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Listings', val: analytics.totalListings },
                  { label: 'Active Listings', val: analytics.activeListings },
                  { label: 'Sold Items', val: analytics.soldItems },
                  { label: 'Open Safety Reports', val: analytics.openReports },
                  { label: 'Restricted Accounts', val: analytics.restrictedAccounts },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <p className="text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                      {stat.val}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Category & Subcategory Manager */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Manage Marketplace Subcategories
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newSubcatName.trim()) return;
                  const ok = await adminAddSubcategory(newSubcatCategory, newSubcatName.trim());
                  if (ok) setNewSubcatName('');
                }}
                className="flex flex-wrap gap-2"
              >
                <select
                  value={newSubcatCategory}
                  onChange={(e) => setNewSubcatCategory(e.target.value as MarketCategory)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {ALL_MARKET_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newSubcatName}
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  placeholder="New subcategory name..."
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Subcategory</span>
                </button>
              </form>
              <div className="text-slate-500 dark:text-slate-400">
                Active subcategories in {newSubcatCategory}:{' '}
                {(categories.find((c) => c.category === newSubcatCategory)?.subcategories || []).join(
                  ', '
                )}
              </div>
            </div>

            {/* Safety Reports Queue */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Reported Listings &amp; Users ({reports.length})
              </h3>
              {reports.length === 0 ? (
                <p className="text-slate-500">No safety reports filed yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          [{rep.status}] {rep.targetTitle} — {rep.reason}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          Reported by {rep.reporterName}: {rep.details} ({formatMarketDate(rep.createdAt)})
                        </p>
                      </div>
                      {rep.status === 'Open' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              adminResolveReport(rep.id, 'Resolved', 'Reviewed by campus moderator.')
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                          >
                            Mark Resolved
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              adminResolveReport(rep.id, 'Dismissed', 'No policy violation found.')
                            }
                            className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All Listings Moderation */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Listing Approval &amp; Moderation ({listings.length})
                </h3>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Optional moderation note..."
                  className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {listings.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.title} · <span className="text-blue-600">{item.status}</span>
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Seller: {item.sellerName} ({item.sellerId}) · {item.category} ·{' '}
                        {formatMarketINR(item.priceINR, item.listingType)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          adminModerateListing(item.id, 'Active', adminNote || 'Approved')
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          adminModerateListing(
                            item.id,
                            'Rejected',
                            adminNote || 'Rejected by moderator'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          adminModerateListing(
                            item.id,
                            'Removed',
                            adminNote || 'Removed for safety policy'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold"
                      >
                        Remove
                      </button>
                      {item.sellerId !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => adminToggleRestrictUser(item.sellerId)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 font-semibold"
                        >
                          Restrict Seller
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== MY MARKET DASHBOARD ====================
  const activeCount = myListings.filter((l) => l.status === 'Active').length;
  const soldCount = myListings.filter((l) => l.status === 'Sold').length;
  const pendingOffersCount = myOffers.filter((o) => o.status === 'Pending').length;

  const filteredMyListings = myListings.filter((l) => {
    if (myTab === 'active') return l.status === 'Active';
    if (myTab === 'pending') return l.status === 'Pending Approval' || l.status === 'Rejected';
    if (myTab === 'sold') return l.status === 'Sold';
    if (myTab === 'paused') return l.status === 'Paused';
    return true;
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Header & Tabs */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              My Market Dashboard
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Manage your listings, incoming/outgoing offers, wishlist, and swap requests.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartSelling}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            + Sell New Item
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'all', label: `My Listings (${myListings.length})` },
            { id: 'active', label: `Active (${activeCount})` },
            { id: 'pending', label: 'Pending' },
            { id: 'sold', label: `Sold (${soldCount})` },
            { id: 'paused', label: 'Paused' },
            { id: 'offers', label: `Offers (${myOffers.length})` },
            { id: 'exchanges', label: `Exchanges (${myExchanges.length})` },
            { id: 'giveaways', label: `Giveaways (${myGiveaways.length})` },
            { id: 'wishlist', label: `Wishlist (${wishlistListings.length})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMyTab(t.id as MyMarketTab)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
                myTab === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      {myTab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Your Active Listings', val: activeCount },
            { label: 'Pending Offers', val: pendingOffersCount },
            { label: 'Saved Wishlist Items', val: wishlistListings.length },
            { label: 'Completed Sales', val: soldCount },
          ].map((s) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <p className="text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {s.val}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* My Listings Grid */}
      {['overview', 'all', 'active', 'pending', 'sold', 'paused'].includes(myTab) && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Your Listings ({filteredMyListings.length})
          </h3>
          {filteredMyListings.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                No listings in this status yet
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Publish a textbook, calculator, hostel essential, or giveaway to start selling.
              </p>
              <button
                type="button"
                onClick={onStartSelling}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Create Your First Listing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMyListings.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex gap-4"
                >
                  <img
                    src={resolveMarketImage(item.images[item.coverIndex] || item.images[0])}
                    alt={item.title}
                    onClick={() => onOpenProductDetail(item)}
                    className="w-24 h-24 rounded-xl object-cover shrink-0 cursor-pointer bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-blue-600">{item.status}</span>
                      <span className="text-slate-400 tabular-nums">
                        {formatMarketDate(item.createdAt)}
                      </span>
                    </div>
                    <h4
                      onClick={() => onOpenProductDetail(item)}
                      className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer hover:text-blue-600"
                    >
                      {item.title}
                    </h4>
                    <p className="font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatMarketINR(item.priceINR, item.listingType)}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {item.status === 'Active' && (
                        <button
                          type="button"
                          onClick={() => updateListing(item.id, { status: 'Paused' })}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
                        >
                          <PauseCircle className="w-3 h-3" />
                          <span>Pause</span>
                        </button>
                      )}

                      {item.status === 'Paused' && (
                        <button
                          type="button"
                          onClick={() => updateListing(item.id, { status: 'Active' })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold inline-flex items-center gap-1"
                        >
                          <PlayCircle className="w-3 h-3" />
                          <span>Activate</span>
                        </button>
                      )}

                      {item.status !== 'Sold' && (
                        <button
                          type="button"
                          onClick={() => updateListing(item.id, { status: 'Sold' })}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Sold</span>
                        </button>
                      )}

                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteListing(item.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-600 text-white font-semibold"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded-lg border border-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offers Tab */}
      {myTab === 'offers' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Structured Offers &amp; Counteroffers ({myOffers.length})
          </h3>
          {myOffers.length === 0 ? (
            <p className="text-slate-500">No offers sent or received yet.</p>
          ) : (
            <div className="space-y-2.5">
              {myOffers.map((off) => {
                const isSeller = off.sellerId === currentUserId;
                return (
                  <div
                    key={off.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {off.listingTitle} · Offer ₹{off.offerPriceINR.toLocaleString('en-IN')}
                        {off.counterPriceINR
                          ? ` (Counter ₹${off.counterPriceINR.toLocaleString('en-IN')})`
                          : ''}
                        {' · '}
                        <span className="text-blue-600">{off.status}</span>
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {isSeller ? `Buyer: ${off.buyerName}` : `Seller: ${off.sellerName}`} ·{' '}
                        {off.buyerMessage || 'No message'}
                        {off.sellerMessage ? ` · Seller note: ${off.sellerMessage}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {isSeller && (off.status === 'Pending' || off.status === 'Countered') && (
                        <>
                          <button
                            type="button"
                            onClick={() => respondToOffer(off, 'Accepted')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCounterTarget(off);
                              setCounterPrice(String(off.offerPriceINR + 50));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold"
                          >
                            Counteroffer
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToOffer(off, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {!isSeller && (off.status === 'Pending' || off.status === 'Countered') && (
                        <button
                          type="button"
                          onClick={() => respondToOffer(off, 'Withdrawn')}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 font-semibold"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Exchanges Tab */}
      {myTab === 'exchanges' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Exchange Requests ({myExchanges.length})
          </h3>
          {myExchanges.length === 0 ? (
            <p className="text-slate-500">No exchange proposals yet.</p>
          ) : (
            <div className="space-y-2">
              {myExchanges.map((p) => {
                const isOwner = p.ownerId === currentUserId;
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {p.listingTitle} ⇄ {p.proposedItemTitle} ({p.status})
                      </p>
                      <p className="text-slate-500">
                        {isOwner ? `From ${p.proposerName}` : `To ${p.ownerName}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isOwner && p.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => respondToExchangeProposal(p, 'Accepted')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                          >
                            Accept
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
                      {isOwner && p.status === 'Accepted' && (
                        <button
                          type="button"
                          onClick={() => respondToExchangeProposal(p, 'Completed')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Giveaways Tab */}
      {myTab === 'giveaways' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Free Corner Requests ({myGiveaways.length})
          </h3>
          {myGiveaways.length === 0 ? (
            <p className="text-slate-500">No giveaway requests yet.</p>
          ) : (
            <div className="space-y-2">
              {myGiveaways.map((g) => {
                const isOwner = g.ownerId === currentUserId;
                return (
                  <div
                    key={g.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {g.listingTitle} · {g.status}
                      </p>
                      <p className="text-slate-500">{g.message}</p>
                    </div>
                    {isOwner && g.status === 'Pending' && (
                      <div className="flex gap-2">
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inline Wishlist inside My Market */}
      {myTab === 'wishlist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistListings.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center">
              <p className="font-bold text-slate-900 dark:text-slate-100">
                No wishlisted products yet.
              </p>
            </div>
          ) : (
            wishlistListings.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3"
              >
                <img
                  src={resolveMarketImage(item.images[item.coverIndex] || item.images[0])}
                  alt={item.title}
                  onClick={() => onOpenProductDetail(item)}
                  className="w-16 h-16 rounded-xl object-cover cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p
                    onClick={() => onOpenProductDetail(item)}
                    className="font-bold text-slate-900 dark:text-slate-100 truncate cursor-pointer"
                  >
                    {item.title}
                  </p>
                  <p className="font-extrabold text-blue-600 tabular-nums">
                    {formatMarketINR(item.priceINR, item.listingType)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleWishlist(item.id)}
                  className="text-red-500 font-semibold"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Edit Listing
              </h3>
              <button type="button" onClick={() => setEditingListing(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            {editingListing.listingType === 'For Sale' && (
              <input
                type="number"
                min={1}
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
              />
            )}
            <textarea
              rows={3}
              required
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Counteroffer Modal */}
      {counterTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCounterSubmit}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Send Counteroffer
              </h3>
              <button type="button" onClick={() => setCounterTarget(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-slate-500">
              Buyer offered ₹{counterTarget.offerPriceINR.toLocaleString('en-IN')} for{' '}
              {counterTarget.listingTitle}
            </p>
            <input
              type="number"
              min={1}
              required
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
              placeholder="Your counter price (₹)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
            />
            <input
              type="text"
              value={counterNote}
              onChange={(e) => setCounterNote(e.target.value)}
              placeholder="Optional note to buyer..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold"
            >
              Send Counteroffer
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
