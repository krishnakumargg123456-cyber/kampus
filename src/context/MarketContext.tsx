import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { formatMarketINR, resolveMarketImage } from '../data/marketData';
import type {
  ExchangeProposal,
  GiveawayRequest,
  MarketAnalytics,
  MarketCategory,
  MarketCategoryConfig,
  MarketCondition,
  MarketListing,
  MarketListingStatus,
  MarketListingType,
  MarketOffer,
  MarketReport,
  MarketRole,
  OfferStatus,
  RequestWorkflowStatus,
  SellerVerificationMap,
  MarketCartItem,
  MarketOrder,
  MarketOrderStatus,
} from '../types/market';

const CHAT_HANDOFF_KEY = 'kampus_chat_handoff_v1';

export interface MarketContextType {
  loading: boolean;
  statusToast: { type: 'success' | 'error' | 'info'; message: string } | null;
  clearToast: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  listings: MarketListing[];
  categories: MarketCategoryConfig[];
  wishlistIds: string[];
  recentSearches: string[];
  offers: MarketOffer[];
  giveawayRequests: GiveawayRequest[];
  exchangeProposals: ExchangeProposal[];
  cart: MarketCartItem[];
  orders: MarketOrder[];
  blockedUserIds: string[];
  sellerVerification: SellerVerificationMap;
  roleInfo: { role: MarketRole; label: string | null };
  isRestricted: boolean;
  reports: MarketReport[];
  analytics: MarketAnalytics | null;
  selectedCampusLocation: string;
  setSelectedCampusLocation: (loc: string) => void;
  reload: () => Promise<void>;
  addToCart: (listingId: string, quantity?: number) => Promise<boolean>;
  removeFromCart: (listingId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  placeOrder: (payload: {
    items: { listingId: string; quantity: number }[];
    fulfillmentMethod?: 'Campus Pickup' | 'Seller Delivery';
    pickupLocation?: string;
    buyerNote?: string;
    paymentMethod?: 'Cash on Pickup' | 'UPI at Pickup';
  }) => Promise<MarketOrder[] | null>;
  updateOrderStatus: (
    orderId: string,
    status: MarketOrderStatus,
    note?: string
  ) => Promise<boolean>;
  switchRoleSession: (passkey?: string, revert?: boolean) => Promise<boolean>;
  recordRecentSearch: (query: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;
  uploadProductImage: (file: File) => Promise<string | null>;
  createListing: (payload: {
    title: string;
    description: string;
    category: MarketCategory;
    subcategory: string;
    brand?: string;
    listingType: MarketListingType;
    condition: MarketCondition;
    priceINR: number | null;
    originalPriceINR?: number | null;
    negotiable: boolean;
    preferredExchangeItem?: string;
    exchangeDescription?: string;
    images: string[];
    coverIndex: number;
    sellerCampus: string;
    sellerCity: string;
    sellerArea: string;
    pickupPoint: string;
    deliveryAvailable: boolean;
  }) => Promise<MarketListing | null>;
  updateListing: (
    id: string,
    patch: Partial<MarketListing> & { statusNote?: string }
  ) => Promise<boolean>;
  deleteListing: (id: string) => Promise<boolean>;
  toggleWishlist: (listingId: string) => Promise<void>;
  submitOffer: (payload: {
    listing: MarketListing;
    offerPriceINR: number;
    buyerMessage: string;
  }) => Promise<boolean>;
  respondToOffer: (
    offer: MarketOffer,
    status: OfferStatus,
    counterPriceINR?: number,
    sellerMessage?: string
  ) => Promise<boolean>;
  submitGiveawayRequest: (listing: MarketListing, message: string) => Promise<boolean>;
  respondToGiveawayRequest: (
    reqItem: GiveawayRequest,
    status: RequestWorkflowStatus
  ) => Promise<boolean>;
  submitExchangeProposal: (payload: {
    listing: MarketListing;
    proposedItemTitle: string;
    proposedItemCondition: MarketCondition;
    message: string;
  }) => Promise<boolean>;
  respondToExchangeProposal: (
    prop: ExchangeProposal,
    status: RequestWorkflowStatus
  ) => Promise<boolean>;
  submitReport: (payload: {
    targetType: 'listing' | 'user';
    targetId: string;
    targetTitle: string;
    reason: string;
    details: string;
  }) => Promise<boolean>;
  toggleBlockSeller: (targetUserId: string, sellerName: string) => Promise<boolean>;
  contactSellerInChat: (listing: MarketListing, customNote?: string) => void;
  adminModerateListing: (
    listingId: string,
    status: MarketListingStatus,
    note?: string
  ) => Promise<boolean>;
  adminAddSubcategory: (category: MarketCategory, subcategory: string) => Promise<boolean>;
  adminToggleRestrictUser: (targetId: string) => Promise<boolean>;
  adminResolveReport: (
    reportId: string,
    status: 'Resolved' | 'Dismissed',
    resolutionNote?: string
  ) => Promise<boolean>;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.readAsDataURL(file);
  });
}

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const userId = user?.id || 'usr_22b030149';
  const userName = user?.name || profile.name || 'KAMPUS Student';

  const [loading, setLoading] = useState(true);
  const [statusToast, setStatusToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [categories, setCategories] = useState<MarketCategoryConfig[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [offers, setOffers] = useState<MarketOffer[]>([]);
  const [giveawayRequests, setGiveawayRequests] = useState<GiveawayRequest[]>([]);
  const [exchangeProposals, setExchangeProposals] = useState<ExchangeProposal[]>([]);
  const [cart, setCart] = useState<MarketCartItem[]>([]);
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [sellerVerification, setSellerVerification] = useState<SellerVerificationMap>({});
  const [roleInfo, setRoleInfo] = useState<{ role: MarketRole; label: string | null }>({
    role: 'Student',
    label: null,
  });
  const [isRestricted, setIsRestricted] = useState(false);
  const [reports, setReports] = useState<MarketReport[]>([]);
  const [analytics, setAnalytics] = useState<MarketAnalytics | null>(null);
  const [selectedCampusLocation, setSelectedCampusLocation] = useState<string>('All');

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      setStatusToast({ type, message });
    },
    []
  );

  const clearToast = useCallback(() => setStatusToast(null), []);

  useEffect(() => {
    if (!statusToast) return;
    const t = setTimeout(() => setStatusToast(null), 4800);
    return () => clearTimeout(t);
  }, [statusToast]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/market/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load KAMPUS Market.');

      setListings(data.listings || []);
      setCategories(data.categories || []);
      setWishlistIds(data.wishlistIds || []);
      setRecentSearches(data.recentSearches || []);
      setOffers(data.offers || []);
      setGiveawayRequests(data.giveawayRequests || []);
      setExchangeProposals(data.exchangeProposals || []);
      setCart(data.cart || []);
      setOrders(data.orders || []);
      setBlockedUserIds(data.blockedUserIds || []);
      setSellerVerification(data.sellerVerification || {});
      setRoleInfo(data.roleInfo || { role: 'Student', label: null });
      setIsRestricted(Boolean(data.isRestricted));
      setReports(data.reports || []);
      setAnalytics(data.analytics || null);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Unable to connect to KAMPUS Market backend.'
      );
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const switchRoleSession = useCallback(
    async (passkey?: string, revert?: boolean): Promise<boolean> => {
      try {
        const res = await fetch('/api/market/auth/role-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, passkey, revert }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Invalid moderation passkey.');
          return false;
        }
        await reload();
        showToast(
          'success',
          revert
            ? 'Returned to standard Student marketplace mode.'
            : `Activated role: ${data.roleInfo?.role}`
        );
        return true;
      } catch {
        showToast('error', 'Failed to switch role session.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const recordRecentSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      try {
        const res = await fetch('/api/market/recent-searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, query: trimmed }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.recentSearches)) {
          setRecentSearches(data.recentSearches);
        }
      } catch {
        // non-fatal
      }
    },
    [userId]
  );

  const clearRecentSearches = useCallback(async () => {
    try {
      const res = await fetch('/api/market/recent-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, clear: true }),
      });
      if (res.ok) setRecentSearches([]);
    } catch {
      // ignore
    }
  }, [userId]);

  const uploadProductImage = useCallback(
    async (file: File): Promise<string | null> => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        showToast('error', 'Only PNG, JPG, JPEG, and WEBP product photos are supported.');
        return null;
      }
      if (file.size === 0 || file.size > 5 * 1024 * 1024) {
        showToast('error', 'Image must be non-empty and under 5 MB.');
        return null;
      }
      try {
        const base64Data = await readFileAsBase64(file);
        const res = await fetch('/api/market/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            fileName: file.name,
            mimeType: file.type,
            base64Data,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Image upload validation failed.');
          return null;
        }
        return data.imageUrl;
      } catch {
        showToast('error', 'Image upload failed.');
        return null;
      }
    },
    [userId, showToast]
  );

  const createListing = useCallback(
    async (payload: {
      title: string;
      description: string;
      category: MarketCategory;
      subcategory: string;
      brand?: string;
      listingType: MarketListingType;
      condition: MarketCondition;
      priceINR: number | null;
      originalPriceINR?: number | null;
      negotiable: boolean;
      preferredExchangeItem?: string;
      exchangeDescription?: string;
      images: string[];
      coverIndex: number;
      sellerCampus: string;
      sellerCity: string;
      sellerArea: string;
      pickupPoint: string;
      deliveryAvailable: boolean;
    }): Promise<MarketListing | null> => {
      try {
        const res = await fetch('/api/market/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            sellerId: userId,
            sellerName: userName,
            sellerAvatarKey: 'aditya',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Unable to publish listing.');
          return null;
        }
        setListings((prev) => [data.listing, ...prev]);
        addNotification({
          title: 'Listing Published on KAMPUS Market',
          description: `"${data.listing.title}" is now visible in ${data.listing.category}.`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/market',
        });
        showToast('success', `"${data.listing.title}" is live in KAMPUS Market!`);
        return data.listing;
      } catch {
        showToast('error', 'Failed to publish listing.');
        return null;
      }
    },
    [userId, userName, addNotification, showToast]
  );

  const updateListing = useCallback(
    async (
      id: string,
      patch: Partial<MarketListing> & { statusNote?: string }
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/market/listings/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...patch }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to update listing.');
          return false;
        }
        setListings((prev) => prev.map((l) => (l.id === id ? data.listing : l)));
        if (patch.status) {
          addNotification({
            title: `Listing Status Updated: ${patch.status}`,
            description: `"${data.listing.title}" changed status to ${patch.status}.`,
            time: 'Just now',
            type: 'campus',
            linkRoute: '/market',
          });
        }
        showToast('success', 'Listing updated.');
        return true;
      } catch {
        showToast('error', 'Error updating listing.');
        return false;
      }
    },
    [userId, addNotification, showToast]
  );

  const deleteListing = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/market/listings/${id}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast('error', data.message || 'Could not delete listing.');
          return false;
        }
        setListings((prev) => prev.filter((l) => l.id !== id));
        showToast('info', 'Listing removed from KAMPUS Market.');
        return true;
      } catch {
        showToast('error', 'Error deleting listing.');
        return false;
      }
    },
    [userId, showToast]
  );

  const toggleWishlist = useCallback(
    async (listingId: string) => {
      try {
        const res = await fetch('/api/market/wishlist/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, listingId }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.wishlistIds)) {
          const added = data.wishlistIds.includes(listingId);
          setWishlistIds(data.wishlistIds);
          showToast('info', added ? 'Saved to your Wishlist.' : 'Removed from Wishlist.');
        }
      } catch {
        showToast('error', 'Unable to update Wishlist.');
      }
    },
    [userId, showToast]
  );

  const submitOffer = useCallback(
    async (payload: {
      listing: MarketListing;
      offerPriceINR: number;
      buyerMessage: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch('/api/market/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: payload.listing.id,
            buyerId: userId,
            buyerName: userName,
            offerPriceINR: payload.offerPriceINR,
            buyerMessage: payload.buyerMessage,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Offer could not be sent.');
          return false;
        }
        setOffers((prev) => [data.offer, ...prev]);
        addNotification({
          title: `Offer Sent: ₹${payload.offerPriceINR.toLocaleString('en-IN')}`,
          description: `Your offer on "${payload.listing.title}" was sent to ${payload.listing.sellerName}.`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/market',
        });
        showToast('success', 'Offer submitted to seller.');
        return true;
      } catch {
        showToast('error', 'Network error sending offer.');
        return false;
      }
    },
    [userId, userName, addNotification, showToast]
  );

  const respondToOffer = useCallback(
    async (
      offer: MarketOffer,
      status: OfferStatus,
      counterPriceINR?: number,
      sellerMessage?: string
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/market/offers/${offer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            status,
            counterPriceINR,
            sellerMessage,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Unable to update offer.');
          return false;
        }
        setOffers((prev) => prev.map((o) => (o.id === offer.id ? data.offer : o)));
        addNotification({
          title: `Offer ${status}: ${offer.listingTitle}`,
          description:
            status === 'Countered' && counterPriceINR
              ? `Counteroffer set to ₹${counterPriceINR.toLocaleString('en-IN')}.`
              : `Offer status changed to ${status}. Coordinate meetup cleanly via KAMPUS Chat.`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/market',
        });
        showToast('success', `Offer marked as ${status}.`);
        return true;
      } catch {
        showToast('error', 'Error updating offer.');
        return false;
      }
    },
    [userId, addNotification, showToast]
  );

  const submitGiveawayRequest = useCallback(
    async (listing: MarketListing, message: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/market/giveaway-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: listing.id,
            requesterId: userId,
            requesterName: userName,
            message,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not submit giveaway request.');
          return false;
        }
        setGiveawayRequests((prev) => [data.request, ...prev]);
        addNotification({
          title: 'Free Corner Request Sent',
          description: `Requested "${listing.title}" from ${listing.sellerName}.`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/market',
        });
        showToast('success', 'Giveaway request submitted.');
        return true;
      } catch {
        showToast('error', 'Failed to submit request.');
        return false;
      }
    },
    [userId, userName, addNotification, showToast]
  );

  const respondToGiveawayRequest = useCallback(
    async (reqItem: GiveawayRequest, status: RequestWorkflowStatus): Promise<boolean> => {
      try {
        const res = await fetch(`/api/market/giveaway-requests/${reqItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not update request.');
          return false;
        }
        setGiveawayRequests((prev) => prev.map((g) => (g.id === reqItem.id ? data.request : g)));
        addNotification({
          title: `Giveaway Request ${status}`,
          description: `"${reqItem.listingTitle}" request is now ${status}.`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/market',
        });
        showToast('success', `Request updated to ${status}.`);
        return true;
      } catch {
        showToast('error', 'Error updating giveaway request.');
        return false;
      }
    },
    [userId, addNotification, showToast]
  );

  const submitExchangeProposal = useCallback(
    async (payload: {
      listing: MarketListing;
      proposedItemTitle: string;
      proposedItemCondition: MarketCondition;
      message: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch('/api/market/exchange-proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: payload.listing.id,
            proposerId: userId,
            proposerName: userName,
            proposedItemTitle: payload.proposedItemTitle,
            proposedItemCondition: payload.proposedItemCondition,
            message: payload.message,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Exchange proposal failed.');
          return false;
        }
        setExchangeProposals((prev) => [data.proposal, ...prev]);
        addNotification({
          title: 'Exchange Proposal Sent',
          description: `Offered "${payload.proposedItemTitle}" for "${payload.listing.title}".`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/market',
        });
        showToast('success', 'Exchange proposal submitted.');
        return true;
      } catch {
        showToast('error', 'Failed to propose exchange.');
        return false;
      }
    },
    [userId, userName, addNotification, showToast]
  );

  const respondToExchangeProposal = useCallback(
    async (prop: ExchangeProposal, status: RequestWorkflowStatus): Promise<boolean> => {
      try {
        const res = await fetch(`/api/market/exchange-proposals/${prop.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not update proposal.');
          return false;
        }
        setExchangeProposals((prev) => prev.map((x) => (x.id === prop.id ? data.proposal : x)));
        addNotification({
          title: `Exchange Proposal ${status}`,
          description: `Swap for "${prop.listingTitle}" marked ${status}.`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/market',
        });
        showToast('success', `Exchange proposal ${status}.`);
        return true;
      } catch {
        showToast('error', 'Error updating exchange proposal.');
        return false;
      }
    },
    [userId, addNotification, showToast]
  );

  const submitReport = useCallback(
    async (payload: {
      targetType: 'listing' | 'user';
      targetId: string;
      targetTitle: string;
      reason: string;
      details: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch('/api/market/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            reporterId: userId,
            reporterName: userName,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to submit safety report.');
          return false;
        }
        showToast('info', 'Safety report submitted to marketplace moderators.');
        return true;
      } catch {
        showToast('error', 'Network error reporting item.');
        return false;
      }
    },
    [userId, userName, showToast]
  );

  const toggleBlockSeller = useCallback(
    async (targetUserId: string, sellerName: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/market/block-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, targetUserId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Unable to update block status.');
          return false;
        }
        await reload();
        showToast(
          'info',
          (data.blockedUserIds || []).includes(targetUserId)
            ? `Blocked ${sellerName}. Their listings are now hidden.`
            : `Unblocked ${sellerName}.`
        );
        return true;
      } catch {
        showToast('error', 'Error blocking user.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const contactSellerInChat = useCallback(
    (listing: MarketListing, customNote?: string) => {
      const coverKeyOrUrl = listing.images[listing.coverIndex] || listing.images[0];
      const resolvedUrl = resolveMarketImage(coverKeyOrUrl);
      const priceLabel = formatMarketINR(listing.priceINR, listing.listingType);
      const handoffPayload = {
        partnerId: listing.sellerId,
        name: listing.sellerName,
        avatarKey: listing.sellerAvatarKey || 'aditya',
        marketListing: {
          listingId: listing.id,
          title: listing.title,
          priceLabel,
          imageUrl: resolvedUrl,
          linkUrl: `${window.location.origin}/#/market?item=${listing.id}`,
          inquiryText:
            customNote ||
            `Hi ${listing.sellerName}, I saw "${listing.title}" (${priceLabel}) on KAMPUS Market. Is it still available for meetup at ${listing.pickupPoint}?`,
        },
      };
      try {
        localStorage.setItem(CHAT_HANDOFF_KEY, JSON.stringify(handoffPayload));
      } catch {
        // non-fatal
      }
      addNotification({
        title: `Chat Started: ${listing.title}`,
        description: `Connected to ${listing.sellerName} in KAMPUS Chat with product card attached.`,
        time: 'Just now',
        type: 'campus',
        linkRoute: '/connect/chat',
      });
      navigate('/connect/chat');
    },
    [addNotification, navigate]
  );

  const adminModerateListing = useCallback(
    async (
      listingId: string,
      status: MarketListingStatus,
      note?: string
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/market/admin/listings/${listingId}/moderate`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status, note }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Moderation denied.');
          return false;
        }
        setListings((prev) => prev.map((l) => (l.id === listingId ? data.listing : l)));
        if (data.analytics) setAnalytics(data.analytics);
        addNotification({
          title: `Marketplace Moderation: ${status}`,
          description: `"${data.listing.title}" marked ${status}.`,
          time: 'Just now',
          type: 'system',
          linkRoute: '/market',
        });
        showToast('success', `Listing moderated to "${status}".`);
        return true;
      } catch {
        showToast('error', 'Moderation request failed.');
        return false;
      }
    },
    [userId, addNotification, showToast]
  );

  const adminAddSubcategory = useCallback(
    async (category: MarketCategory, subcategory: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/market/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, category, subcategory }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not add subcategory.');
          return false;
        }
        setCategories(data.categories || []);
        showToast('success', `Added "${subcategory}" under ${category}.`);
        return true;
      } catch {
        showToast('error', 'Failed to update categories.');
        return false;
      }
    },
    [userId, showToast]
  );

  const adminToggleRestrictUser = useCallback(
    async (targetId: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/market/admin/users/${targetId}/restrict`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Permission denied.');
          return false;
        }
        await reload();
        showToast(
          'info',
          data.restricted ? `Restricted account ${targetId}.` : `Unrestricted account ${targetId}.`
        );
        return true;
      } catch {
        showToast('error', 'Account action failed.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const adminResolveReport = useCallback(
    async (
      reportId: string,
      status: 'Resolved' | 'Dismissed',
      resolutionNote?: string
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/market/admin/reports/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status, resolutionNote }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Unable to update report.');
          return false;
        }
        setReports((prev) => prev.map((r) => (r.id === reportId ? data.report : r)));
        if (data.analytics) setAnalytics(data.analytics);
        showToast('success', `Report marked ${status}.`);
        return true;
      } catch {
        showToast('error', 'Error resolving report.');
        return false;
      }
    },
    [userId, showToast]
  );

  const addToCart = useCallback(
    async (listingId: string, quantity = 1) => {
      try {
        const res = await fetch('/api/market/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, listingId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to add to cart.');
        setCart(data.items || []);
        showToast('success', 'Added to KAMPUS Market cart.');
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Could not add to cart.');
        return false;
      }
    },
    [userId, showToast]
  );

  const removeFromCart = useCallback(
    async (listingId: string) => {
      try {
        const res = await fetch(`/api/market/cart/${encodeURIComponent(listingId)}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to remove from cart.');
        setCart(data.items || []);
        showToast('info', 'Item removed from cart.');
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Could not remove item.');
        return false;
      }
    },
    [userId, showToast]
  );

  const clearCart = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/cart?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to clear cart.');
      setCart([]);
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Could not clear cart.');
      return false;
    }
  }, [userId, showToast]);

  const placeOrder = useCallback(
    async (payload: {
      items: { listingId: string; quantity: number }[];
      fulfillmentMethod?: 'Campus Pickup' | 'Seller Delivery';
      pickupLocation?: string;
      buyerNote?: string;
      paymentMethod?: 'Cash on Pickup' | 'UPI at Pickup';
    }) => {
      try {
        const res = await fetch('/api/market/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerId: userId,
            buyerName: userName,
            buyerEmail: user?.email || '',
            buyerPhone: (user as any)?.mobile || '',
            ...payload,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to place order.');
        setOrders((prev) => [...(data.orders || []), ...prev]);
        showToast('success', data.message || 'Order placed successfully!');
        void reload();
        return data.orders || [];
      } catch (err: any) {
        showToast('error', err.message || 'Order placement failed.');
        return null;
      }
    },
    [userId, userName, user, showToast, reload]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: MarketOrderStatus, note?: string) => {
      try {
        const res = await fetch(`/api/market/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status, note }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update order status.');
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.order : o))
        );
        showToast('success', `Order status updated to ${status}.`);
        void reload();
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Could not update status.');
        return false;
      }
    },
    [userId, showToast, reload]
  );

  const value = useMemo<MarketContextType>(
    () => ({
      loading,
      statusToast,
      clearToast,
      showToast,
      listings,
      categories,
      wishlistIds,
      recentSearches,
      offers,
      giveawayRequests,
      exchangeProposals,
      cart,
      orders,
      blockedUserIds,
      sellerVerification,
      roleInfo,
      isRestricted,
      reports,
      analytics,
      selectedCampusLocation,
      setSelectedCampusLocation,
      reload,
      switchRoleSession,
      recordRecentSearch,
      clearRecentSearches,
      uploadProductImage,
      createListing,
      updateListing,
      deleteListing,
      toggleWishlist,
      addToCart,
      removeFromCart,
      clearCart,
      placeOrder,
      updateOrderStatus,
      submitOffer,
      respondToOffer,
      submitGiveawayRequest,
      respondToGiveawayRequest,
      submitExchangeProposal,
      respondToExchangeProposal,
      submitReport,
      toggleBlockSeller,
      contactSellerInChat,
      adminModerateListing,
      adminAddSubcategory,
      adminToggleRestrictUser,
      adminResolveReport,
    }),
    [
      loading,
      statusToast,
      clearToast,
      showToast,
      listings,
      categories,
      wishlistIds,
      recentSearches,
      offers,
      giveawayRequests,
      exchangeProposals,
      cart,
      orders,
      blockedUserIds,
      sellerVerification,
      roleInfo,
      isRestricted,
      reports,
      analytics,
      selectedCampusLocation,
      setSelectedCampusLocation,
      reload,
      switchRoleSession,
      recordRecentSearch,
      clearRecentSearches,
      uploadProductImage,
      createListing,
      updateListing,
      deleteListing,
      toggleWishlist,
      addToCart,
      removeFromCart,
      clearCart,
      placeOrder,
      updateOrderStatus,
      submitOffer,
      respondToOffer,
      submitGiveawayRequest,
      respondToGiveawayRequest,
      submitExchangeProposal,
      respondToExchangeProposal,
      submitReport,
      toggleBlockSeller,
      contactSellerInChat,
      adminModerateListing,
      adminAddSubcategory,
      adminToggleRestrictUser,
      adminResolveReport,
    ]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
};

export const useMarket = () => {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used within a MarketProvider');
  return ctx;
};
