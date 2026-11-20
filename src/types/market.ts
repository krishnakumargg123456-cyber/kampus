export type MarketCategory =
  | 'Books & Study'
  | 'Electronics'
  | 'Stationery'
  | 'Hostel Essentials'
  | 'Fashion'
  | 'Furniture'
  | 'Lab Equipment'
  | 'Sports & Fitness';

export type MarketListingType = 'For Sale' | 'Giveaway' | 'Exchange';

export type MarketCondition = 'Brand New' | 'Like New' | 'Good' | 'Used';

export type MarketListingStatus =
  | 'Active'
  | 'Pending Approval'
  | 'Paused'
  | 'Sold'
  | 'Rejected'
  | 'Removed';

export type OfferStatus =
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'Countered'
  | 'Withdrawn'
  | 'Expired';

export type RequestWorkflowStatus =
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'Completed'
  | 'Cancelled';

export type MarketRole = 'Student' | 'Marketplace Moderator' | 'Platform Admin';

export interface ListingStatusHistoryItem {
  status: MarketListingStatus;
  changedBy: string;
  note: string;
  changedAt: string;
}

export interface MarketListing {
  id: string;
  title: string;
  description: string;
  category: MarketCategory;
  subcategory: string;
  brand?: string;
  listingType: MarketListingType;
  condition: MarketCondition;
  priceINR: number | null; // null or 0 for Giveaway/Exchange
  originalPriceINR?: number | null; // optional, only when legitimately provided
  negotiable: boolean;
  preferredExchangeItem?: string;
  exchangeDescription?: string;
  images: string[]; // image keys or /api/market/media/:id URLs
  coverIndex: number;
  sellerId: string;
  sellerName: string;
  sellerAvatarKey: string;
  sellerCampus: string;
  sellerCity: string;
  sellerArea: string;
  pickupPoint: string;
  deliveryAvailable: boolean;
  status: MarketListingStatus;
  isDemoRecord: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  statusHistory: ListingStatusHistoryItem[];
}

export interface SellerVerificationMap {
  [sellerId: string]: {
    isVerifiedKampusId: boolean;
    verificationLabel: string;
    isRestricted: boolean;
  };
}

export interface MarketOffer {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  offerPriceINR: number;
  counterPriceINR?: number;
  buyerMessage: string;
  sellerMessage?: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GiveawayRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  requesterId: string;
  requesterName: string;
  ownerId: string;
  ownerName: string;
  message: string;
  status: RequestWorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeProposal {
  id: string;
  listingId: string;
  listingTitle: string;
  proposerId: string;
  proposerName: string;
  ownerId: string;
  ownerName: string;
  proposedItemTitle: string;
  proposedItemCondition: MarketCondition;
  message: string;
  status: RequestWorkflowStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MarketReport {
  id: string;
  targetType: 'listing' | 'user';
  targetId: string;
  targetTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details: string;
  status: 'Open' | 'Resolved' | 'Dismissed';
  resolutionNote?: string;
  createdAt: string;
}

export interface MarketCategoryConfig {
  category: MarketCategory;
  subcategories: string[];
}

export interface MarketAnalytics {
  totalListings: number;
  activeListings: number;
  pendingApproval: number;
  soldItems: number;
  giveawaysCount: number;
  exchangesCount: number;
  totalOffers: number;
  openReports: number;
  restrictedAccounts: number;
}
