import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Gift,
  Heart,
  MapPin,
  MessageSquare,
  Repeat,
  Share2,
  ShieldCheck,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';
import {
  MARKET_CONDITIONS,
  formatMarketDate,
  formatMarketINR,
  resolveMarketImage,
} from '../../data/marketData';
import type { MarketCondition, MarketListing } from '../../types/market';

interface ProductDetailAndChatModalProps {
  listing: MarketListing;
  onClose: () => void;
  onSelectListing: (listing: MarketListing) => void;
}

const REPORT_REASONS = [
  'Prohibited or Restricted Item',
  'Misleading Description / Photos',
  'Suspicious Pricing / Scam Risk',
  'Duplicate or Spam Listing',
  'Inappropriate Content',
];

export const ProductDetailAndChatModal: React.FC<ProductDetailAndChatModalProps> = ({
  listing,
  onClose,
  onSelectListing,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'usr_22b030149';

  const {
    listings,
    wishlistIds,
    sellerVerification,
    blockedUserIds,
    toggleWishlist,
    contactSellerInChat,
    submitOffer,
    submitGiveawayRequest,
    submitExchangeProposal,
    submitReport,
    toggleBlockSeller,
    showToast,
  } = useMarket();

  const images = listing.images.length > 0 ? listing.images : ['books'];
  const [activeIdx, setActiveIdx] = useState<number>(
    listing.coverIndex >= 0 && listing.coverIndex < images.length ? listing.coverIndex : 0
  );

  // Action sub-modals inside PDP
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState(
    listing.priceINR ? String(Math.max(10, Math.round(listing.priceINR * 0.9))) : ''
  );
  const [offerNote, setOfferNote] = useState('');

  const [showGiveawayForm, setShowGiveawayForm] = useState(false);
  const [giveawayNote, setGiveawayNote] = useState('');

  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [exchangeItemTitle, setExchangeItemTitle] = useState('');
  const [exchangeCondition, setExchangeCondition] = useState<MarketCondition>('Good');
  const [exchangeNote, setExchangeNote] = useState('');

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');

  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const isOwner = listing.sellerId === currentUserId;
  const isWishlisted = wishlistIds.includes(listing.id);
  const isBlocked = blockedUserIds.includes(listing.sellerId);
  const verification = sellerVerification[listing.sellerId];

  const relatedProducts = useMemo(() => {
    return listings
      .filter(
        (item) =>
          item.id !== listing.id &&
          item.status === 'Active' &&
          (item.category === listing.category || item.sellerCampus === listing.sellerCampus)
      )
      .slice(0, 4);
  }, [listings, listing]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/#/market?item=${listing.id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('success', 'Listing link copied to clipboard.');
      } else {
        showToast('info', `Share link ready: ${shareUrl}`);
      }
    } catch {
      showToast('info', `Share link ready: ${shareUrl}`);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(offerPrice);
    if (!Number.isFinite(num) || num <= 0) {
      showToast('error', 'Enter a valid offer amount in INR.');
      return;
    }
    const ok = await submitOffer({
      listing,
      offerPriceINR: num,
      buyerMessage: offerNote.trim(),
    });
    if (ok) {
      setShowOfferForm(false);
      setOfferNote('');
    }
  };

  const handleGiveawaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submitGiveawayRequest(
      listing,
      giveawayNote.trim() || 'Interested in picking this up safely at the campus pickup point.'
    );
    if (ok) {
      setShowGiveawayForm(false);
      setGiveawayNote('');
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeItemTitle.trim()) return;
    const ok = await submitExchangeProposal({
      listing,
      proposedItemTitle: exchangeItemTitle.trim(),
      proposedItemCondition: exchangeCondition,
      message: exchangeNote.trim(),
    });
    if (ok) {
      setShowExchangeForm(false);
      setExchangeItemTitle('');
      setExchangeNote('');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submitReport({
      targetType: 'listing',
      targetId: listing.id,
      targetTitle: listing.title,
      reason: reportReason,
      details: reportDetails.trim() || 'Flagged from product detail view.',
    });
    if (ok) {
      setShowReportForm(false);
      setReportDetails('');
    }
  };

  const activePhoto = resolveMarketImage(images[activeIdx] || images[0]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex items-start justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={listing.title}
    >
      <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4">
        {/* Top bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {listing.category}
            </span>
            <span>/</span>
            <span className="truncate">{listing.subcategory}</span>
            {listing.isDemoRecord && (
              <>
                <span>·</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Demo Listing
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-8">
          {/* Primary Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Left: Image Gallery */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative aspect-[4/3] w-full rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={activePhoto}
                  alt={`${listing.title} view ${activeIdx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIdx((prev) => (prev - 1 + images.length) % images.length)
                      }
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveIdx((prev) => (prev + 1) % images.length)}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((imgKey, idx) => (
                    <button
                      key={`${imgKey}-${idx}`}
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                        idx === activeIdx
                          ? 'border-blue-600'
                          : 'border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={resolveMarketImage(imgKey)}
                        alt={`Thumbnail ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Safety Reminder Box */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Safe Campus Meetup Guidance
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    Before completing an offline exchange, inspect the item and meet in a safe
                    public location.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Purchase / Inquiry Details */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                    {listing.listingType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Condition: {listing.condition}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md ${
                      listing.status === 'Active'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {listing.status}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                  {listing.title}
                </h1>

                <div className="flex flex-wrap items-baseline gap-3 pt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatMarketINR(listing.priceINR, listing.listingType)}
                  </span>
                  {listing.listingType === 'For Sale' &&
                    listing.originalPriceINR !== undefined &&
                    listing.originalPriceINR !== null &&
                    listing.priceINR !== null &&
                    listing.originalPriceINR > listing.priceINR && (
                      <span className="text-sm text-slate-400 line-through tabular-nums">
                        MRP ₹{listing.originalPriceINR.toLocaleString('en-IN')}
                      </span>
                    )}
                  {listing.listingType === 'For Sale' && listing.negotiable && (
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Negotiable
                    </span>
                  )}
                </div>
              </div>

              {listing.listingType === 'Exchange' && listing.preferredExchangeItem && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-blue-600" />
                    <span>Preferred in Exchange</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {listing.preferredExchangeItem}
                  </p>
                </div>
              )}

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {listing.description}
              </p>

              {/* Specs & Details Table */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Category</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {listing.category} · {listing.subcategory}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Brand / Publisher</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {listing.brand || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Listed On</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatMarketDate(listing.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Delivery Option</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {listing.deliveryAvailable
                        ? 'Campus Delivery Available'
                        : 'Public Pickup Only'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isOwner}
                    onClick={() => contactSellerInChat(listing)}
                    className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{isOwner ? 'Your Listing' : 'Contact Seller'}</span>
                  </button>

                  {!isOwner && listing.listingType === 'For Sale' && listing.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => setShowOfferForm((v) => !v)}
                      className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Tag className="w-4 h-4" />
                      <span>Make an Offer</span>
                    </button>
                  )}

                  {!isOwner && listing.listingType === 'Giveaway' && listing.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => setShowGiveawayForm((v) => !v)}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Request Giveaway</span>
                    </button>
                  )}

                  {!isOwner && listing.listingType === 'Exchange' && listing.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => setShowExchangeForm((v) => !v)}
                      className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Repeat className="w-4 h-4" />
                      <span>Propose Exchange</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(listing.id)}
                    className={`px-3.5 py-2 rounded-xl border font-semibold inline-flex items-center gap-1.5 ${
                      isWishlisted
                        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300 text-orange-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                    <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold inline-flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Listing</span>
                  </button>

                  {!isOwner && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowReportForm((v) => !v)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 font-semibold inline-flex items-center gap-1.5"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowBlockConfirm((v) => !v)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 font-semibold inline-flex items-center gap-1.5"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{isBlocked ? 'Unblock Seller' : 'Block Seller'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inline Offer Form */}
              {showOfferForm && (
                <form
                  onSubmit={handleOfferSubmit}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Send Structured Offer to {listing.sellerName}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="number"
                      min={1}
                      required
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="Offer ₹"
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums"
                    />
                    <input
                      type="text"
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                      placeholder="Optional note on pickup time..."
                      className="sm:col-span-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowOfferForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"
                    >
                      Submit Offer
                    </button>
                  </div>
                </form>
              )}

              {/* Inline Giveaway Request Form */}
              {showGiveawayForm && (
                <form
                  onSubmit={handleGiveawaySubmit}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Request Free Corner Item
                  </p>
                  <textarea
                    rows={2}
                    value={giveawayNote}
                    onChange={(e) => setGiveawayNote(e.target.value)}
                    placeholder="Let the student owner know when you can meet at the pickup point..."
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGiveawayForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                    >
                      Send Request
                    </button>
                  </div>
                </form>
              )}

              {/* Inline Exchange Form */}
              {showExchangeForm && (
                <form
                  onSubmit={handleExchangeSubmit}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Propose an Item Exchange
                  </p>
                  <input
                    type="text"
                    required
                    value={exchangeItemTitle}
                    onChange={(e) => setExchangeItemTitle(e.target.value)}
                    placeholder="What item are you offering in exchange? *"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={exchangeCondition}
                      onChange={(e) => setExchangeCondition(e.target.value as MarketCondition)}
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      {MARKET_CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          Condition: {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={exchangeNote}
                      onChange={(e) => setExchangeNote(e.target.value)}
                      placeholder="Short meetup note..."
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowExchangeForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"
                    >
                      Submit Proposal
                    </button>
                  </div>
                </form>
              )}

              {/* Inline Safety Report Form */}
              {showReportForm && (
                <form
                  onSubmit={handleReportSubmit}
                  className="p-4 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 space-y-3 text-xs"
                >
                  <p className="font-bold text-red-700 dark:text-red-300">
                    Report Listing to Campus Moderators
                  </p>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <textarea
                    rows={2}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe the issue clearly..."
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReportForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-semibold"
                    >
                      Submit Report
                    </button>
                  </div>
                </form>
              )}

              {/* Inline Block Seller Confirmation */}
              {showBlockConfirm && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <p className="text-slate-700 dark:text-slate-200">
                    {isBlocked
                      ? `Unblock ${listing.sellerName} to see their listings again?`
                      : `Block ${listing.sellerName}? All their listings will be hidden from your feed.`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBlockConfirm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleBlockSeller(listing.sellerId, listing.sellerName);
                        setShowBlockConfirm(false);
                        if (!isBlocked) onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold"
                    >
                      {isBlocked ? 'Confirm Unblock' : 'Confirm Block'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seller & Pickup Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Seller Information
              </h3>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {listing.sellerName}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {listing.sellerCampus} · {listing.sellerCity}
                  </p>
                </div>
                {verification?.isVerifiedKampusId ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{verification.verificationLabel}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{verification?.verificationLabel || 'Student Account'}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Pickup Information</span>
              </h3>
              <p className="text-slate-700 dark:text-slate-200 font-semibold">
                {listing.pickupPoint}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Area: {listing.sellerArea}, {listing.sellerCity} · Only public campus pickup points
                are shown for privacy.
              </p>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Related Campus Products
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedProducts.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => {
                      onSelectListing(rel);
                      setActiveIdx(rel.coverIndex || 0);
                    }}
                    className="text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-500 transition-colors"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800">
                      <img
                        src={resolveMarketImage(rel.images[rel.coverIndex] || rel.images[0])}
                        alt={rel.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2.5 space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {rel.title}
                      </p>
                      <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatMarketINR(rel.priceINR, rel.listingType)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
