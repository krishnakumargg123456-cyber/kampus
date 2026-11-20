import React, { useEffect, useMemo, useState } from 'react';
import { Heart, RotateCcw, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import {
  ALL_MARKET_CATEGORIES,
  CAMPUS_DIRECTORY,
  MARKET_CONDITIONS,
  MARKET_LISTING_TYPES,
  formatMarketDate,
  formatMarketINR,
  resolveMarketImage,
} from '../../data/marketData';
import type { MarketCategory, MarketListing } from '../../types/market';

interface MarketExploreViewProps {
  seedSearch?: string;
  seedCategory?: MarketCategory | 'all';
  seedSubcategory?: string;
  seedMaxPrice?: number;
  onOpenProductDetail: (listing: MarketListing) => void;
}

type MarketSortKey = 'relevance' | 'recent' | 'price-asc' | 'price-desc';

export const MarketExploreView: React.FC<MarketExploreViewProps> = ({
  seedSearch,
  seedCategory,
  seedSubcategory,
  seedMaxPrice,
  onOpenProductDetail,
}) => {
  const {
    listings,
    categories,
    wishlistIds,
    recentSearches,
    selectedCampusLocation,
    toggleWishlist,
    recordRecentSearch,
    clearRecentSearches,
  } = useMarket();

  const [query, setQuery] = useState(seedSearch || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(seedCategory || 'all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>(seedSubcategory || 'all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>(
    selectedCampusLocation !== 'All' ? selectedCampusLocation : 'All'
  );
  const [pickupMode, setPickupMode] = useState<'all' | 'pickup' | 'delivery'>('all');
  const [dateWindow, setDateWindow] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>(seedMaxPrice ? String(seedMaxPrice) : '');
  const [sortBy, setSortBy] = useState<MarketSortKey>('relevance');

  useEffect(() => {
    if (seedSearch !== undefined) setQuery(seedSearch);
    if (seedCategory !== undefined) setCategoryFilter(seedCategory);
    if (seedSubcategory !== undefined) setSubcategoryFilter(seedSubcategory);
    if (seedMaxPrice !== undefined) setMaxPrice(String(seedMaxPrice));
  }, [seedSearch, seedCategory, seedSubcategory, seedMaxPrice]);

  const activeSubcategories = useMemo(() => {
    if (categoryFilter === 'all') {
      return Array.from(new Set(categories.flatMap((c) => c.subcategories)));
    }
    return categories.find((c) => c.category === categoryFilter)?.subcategories || [];
  }, [categories, categoryFilter]);

  const resetFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setSubcategoryFilter('all');
    setConditionFilter('all');
    setTypeFilter('all');
    setCampusFilter('All');
    setPickupMode('all');
    setDateWindow('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('relevance');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minP = minPrice ? Number(minPrice) : null;
    const maxP = maxPrice ? Number(maxPrice) : null;
    const nowMs = Date.now();

    const matched = listings.filter((item) => {
      if (item.status !== 'Active') return false;
      if (q) {
        const hay = `${item.title} ${item.description} ${item.category} ${item.subcategory} ${item.brand || ''} ${item.sellerCampus} ${item.sellerCity}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (subcategoryFilter !== 'all' && item.subcategory !== subcategoryFilter) return false;
      if (conditionFilter !== 'all' && item.condition !== conditionFilter) return false;
      if (typeFilter !== 'all' && item.listingType !== typeFilter) return false;
      if (
        campusFilter !== 'All' &&
        !item.sellerCampus.toLowerCase().includes(campusFilter.toLowerCase()) &&
        !item.sellerCity.toLowerCase().includes(campusFilter.toLowerCase())
      ) {
        return false;
      }
      if (pickupMode === 'delivery' && !item.deliveryAvailable) return false;
      if (minP !== null && (item.priceINR === null || item.priceINR < minP)) return false;
      if (maxP !== null && (item.priceINR === null || item.priceINR > maxP)) return false;

      if (dateWindow !== 'all') {
        const createdMs = new Date(item.createdAt).getTime();
        const ageHours = (nowMs - createdMs) / 3600_000;
        if (dateWindow === '24h' && ageHours > 24) return false;
        if (dateWindow === '7d' && ageHours > 24 * 7) return false;
        if (dateWindow === '30d' && ageHours > 24 * 30) return false;
      }

      return true;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'price-asc') {
        const pa = a.priceINR ?? Number.MAX_SAFE_INTEGER;
        const pb = b.priceINR ?? Number.MAX_SAFE_INTEGER;
        return pa - pb;
      }
      if (sortBy === 'price-desc') {
        const pa = a.priceINR ?? -1;
        const pb = b.priceINR ?? -1;
        return pb - pa;
      }
      // Relevance: non-demo live student listings first, then newest
      if (a.isDemoRecord !== b.isDemoRecord) return a.isDemoRecord ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    listings,
    query,
    categoryFilter,
    subcategoryFilter,
    conditionFilter,
    typeFilter,
    campusFilter,
    pickupMode,
    minPrice,
    maxPrice,
    dateWindow,
    sortBy,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) recordRecentSearch(query.trim());
  };

  return (
    <div className="space-y-6">
      {/* Search + Recent Searches Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, electronics, calculators, hostel lamps, backpacks..."
              className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MarketSortKey)}
            aria-label="Sort listings"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="recent">Sort: Recently Listed</option>
            <option value="price-asc">Sort: Price Low to High</option>
            <option value="price-desc">Sort: Price High to Low</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </form>

        {recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-slate-400">Recent searches:</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 font-medium"
              >
                {term}
              </button>
            ))}
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-slate-400 hover:text-red-500 inline-flex items-center gap-1 ml-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Split: Sidebar Filters + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <aside className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Marketplace Filters</span>
            </span>
          </div>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSubcategoryFilter('all');
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">All Categories</option>
              {ALL_MARKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Subcategory</span>
            <select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">All Subcategories</option>
              {activeSubcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300 block">
              Price Range (INR)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min ₹"
                className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max ₹"
                className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
              />
            </div>
          </div>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Condition</span>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">Any Condition</option>
              {MARKET_CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Listing Type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">All Listing Types</option>
              {MARKET_LISTING_TYPES.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              College / Campus
            </span>
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {CAMPUS_DIRECTORY.map((loc) => (
                <option key={loc.campus} value={loc.campus}>
                  {loc.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Pickup / Delivery
            </span>
            <select
              value={pickupMode}
              onChange={(e) => setPickupMode(e.target.value as 'all' | 'pickup' | 'delivery')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">Pickup or Campus Delivery</option>
              <option value="pickup">Local Campus Pickup</option>
              <option value="delivery">Delivery Offered by Seller</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Listing Date</span>
            <select
              value={dateWindow}
              onChange={(e) => setDateWindow(e.target.value as 'all' | '24h' | '7d' | '30d')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">Any Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </label>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              {filtered.length} matching {filtered.length === 1 ? 'listing' : 'listings'}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                No listings matched your current search or filters
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Try clearing price caps or switching campus filters to explore items across other
                categories like Books &amp; Study, Electronics, or Free Corner.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filtered.map((item) => {
                const wishlisted = wishlistIds.includes(item.id);
                const coverImg = resolveMarketImage(item.images[item.coverIndex] || item.images[0]);
                return (
                  <article
                    key={item.id}
                    className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <div
                        onClick={() => onOpenProductDetail(item)}
                        className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={coverImg}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(item.id);
                          }}
                          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center border ${
                            wishlisted
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="p-3.5 sm:p-4 space-y-1.5">
                        <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 truncate">
                          {item.subcategory} · {item.condition}
                        </p>
                        <h3
                          onClick={() => onOpenProductDetail(item)}
                          className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 cursor-pointer hover:text-blue-600"
                        >
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="pt-1 flex items-baseline gap-2">
                          <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                            {formatMarketINR(item.priceINR, item.listingType)}
                          </span>
                          {item.listingType === 'For Sale' &&
                            item.originalPriceINR !== undefined &&
                            item.originalPriceINR !== null &&
                            item.priceINR !== null &&
                            item.originalPriceINR > item.priceINR && (
                              <span className="text-xs text-slate-400 line-through tabular-nums">
                                ₹{item.originalPriceINR.toLocaleString('en-IN')}
                              </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.sellerCampus} · {formatMarketDate(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="px-3.5 sm:px-4 pb-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 truncate">
                        {item.isDemoRecord ? 'Demo' : item.listingType}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenProductDetail(item)}
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
