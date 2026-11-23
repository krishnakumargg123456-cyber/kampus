import API_BASE_URL from '../config/api';
import type {
  MarketListing,
  MarketCategory,
  MarketCondition,
  MarketListingType,
  MarketCartItem,
  MarketOrder,
  MarketOrderStatus,
  MarketCategoryConfig,
} from '../../../src/types/market';

export interface BootstrapResponse {
  listings: MarketListing[];
  categories: MarketCategoryConfig[];
  wishlistIds: string[];
  recentSearches: string[];
  cart: MarketCartItem[];
  orders: MarketOrder[];
  blockedUserIds: string[];
  roleInfo: { role: string; label: string | null };
}

export interface CreateListingPayload {
  title: string;
  description: string;
  category: MarketCategory;
  subcategory?: string;
  brand?: string;
  listingType: MarketListingType;
  condition: MarketCondition;
  priceINR: number | null;
  originalPriceINR?: number | null;
  negotiable: boolean;
  images: string[];
  coverIndex?: number;
  sellerId: string;
  sellerName: string;
  sellerAvatarKey?: string;
  sellerCampus: string;
  sellerCity?: string;
  sellerArea?: string;
  pickupPoint: string;
  deliveryAvailable: boolean;
}

export interface PlaceOrderPayload {
  buyerId: string;
  buyerName: string;
  buyerEmail?: string;
  buyerPhone?: string;
  items: { listingId: string; quantity: number }[];
  fulfillmentMethod: 'Campus Pickup' | 'Seller Delivery';
  pickupLocation: string;
  buyerNote?: string;
  paymentMethod: 'Cash on Pickup' | 'UPI at Pickup';
}

const DEFAULT_TIMEOUT_MS = 12000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const MarketApi = {
  /**
   * 1. Bootstrap all marketplace data for the user
   */
  async bootstrap(userId: string): Promise<BootstrapResponse> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        throw new Error(`Bootstrap failed: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.warn('[MarketApi] bootstrap network error:', err.message);
      throw err;
    }
  },

  /**
   * 2. Upload Product Photo (Base64)
   */
  async uploadPhoto(
    userId: string,
    fileName: string,
    base64Data: string,
    mimeType = 'image/jpeg'
  ): Promise<{ imageUrl: string; id: string }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        fileName,
        mimeType,
        base64Data,
      }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to upload product image');
    }
    return await res.json();
  },

  /**
   * 3. Publish Listing
   */
  async createListing(payload: CreateListingPayload): Promise<MarketListing> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to publish listing');
    }
    const data = await res.json();
    return data.listing;
  },

  /**
   * 4. Update Listing
   */
  async updateListing(
    id: string,
    userId: string,
    patch: Partial<MarketListing> & { statusNote?: string }
  ): Promise<MarketListing> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...patch, userId }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to update listing');
    }
    const data = await res.json();
    return data.listing;
  },

  /**
   * 5. Delete Listing
   */
  async deleteListing(id: string, userId: string): Promise<boolean> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/listings/${id}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  /**
   * 6. Toggle Wishlist
   */
  async toggleWishlist(userId: string, listingId: string): Promise<string[]> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, listingId }),
    });
    if (!res.ok) throw new Error('Failed to update wishlist');
    const data = await res.json();
    return data.wishlistIds || [];
  },

  /**
   * 7. Cart Operations
   */
  async getCart(userId: string): Promise<{ items: MarketCartItem[]; subtotalINR: number }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/cart?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to load cart');
    return await res.json();
  },

  async addToCart(
    userId: string,
    listingId: string,
    quantity = 1
  ): Promise<{ items: MarketCartItem[]; subtotalINR: number }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, listingId, quantity }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to add to cart');
    }
    return await res.json();
  },

  async removeFromCart(
    userId: string,
    listingId: string
  ): Promise<{ items: MarketCartItem[]; subtotalINR: number }> {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/market/cart/${encodeURIComponent(listingId)}?userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
    if (!res.ok) throw new Error('Failed to remove item from cart');
    return await res.json();
  },

  async clearCart(userId: string): Promise<void> {
    await fetchWithTimeout(`${API_BASE_URL}/api/market/cart?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  },

  /**
   * 8. Orders Operations
   */
  async placeOrder(payload: PlaceOrderPayload): Promise<MarketOrder[]> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to place order');
    }
    const data = await res.json();
    return data.orders || [];
  },

  async getOrders(userId: string, role: 'buyer' | 'seller' | 'all' = 'all'): Promise<MarketOrder[]> {
    const res = await fetchWithTimeout(
      `${API_BASE_URL}/api/market/orders?userId=${encodeURIComponent(userId)}&role=${role}`
    );
    if (!res.ok) throw new Error('Failed to load orders');
    const data = await res.json();
    return data.orders || [];
  },

  async updateOrderStatus(
    orderId: string,
    userId: string,
    status: MarketOrderStatus,
    note?: string
  ): Promise<MarketOrder> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/market/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status, note }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to update order status');
    }
    const data = await res.json();
    return data.order;
  },

  /**
   * Helper to resolve listing image URL
   */
  resolveImageUrl(imageKey: string): string {
    if (!imageKey) {
      return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80';
    }
    if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
      return imageKey;
    }
    if (imageKey.startsWith('/api/')) {
      return `${API_BASE_URL}${imageKey}`;
    }
    // Static keys fallback
    const staticMap: Record<string, string> = {
      books: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
      calculator: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
      lamp: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
      drawing_kit: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
      backpack: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      study_table: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
      bundle_books: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
      headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      lab_gear: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
      sports: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
    };
    return (
      staticMap[imageKey] ||
      `${API_BASE_URL}/api/market/media/${imageKey}`
    );
  },
};
