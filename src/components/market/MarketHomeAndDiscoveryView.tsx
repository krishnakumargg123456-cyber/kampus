import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Heart,
  Laptop,
  MapPin,
  PackagePlus,
  Shield,
  Tag,
} from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import {
  ALL_MARKET_CATEGORIES,
  CAMPUS_DIRECTORY,
  MARKET_HERO_IMAGE,
  formatMarketINR,
  resolveMarketImage,
} from '../../data/marketData';
import type { MarketCategory, MarketListing } from '../../types/market';

interface MarketHomeAndDiscoveryViewProps {
  onOpenProductDetail: (listing: MarketListing) => void;
  onExploreFiltered: (opts?: {
    category?: MarketCategory | 'all';
    subcategory?: string;
    maxPrice?: number;
  }) => void;
  onStartSelling: () => void;
}

type DealTrack = 'all' | 'books-budget' | 'hostel' | 'electronics' | 'study-setup';

export const MarketHomeAndDiscoveryView: React.FC<MarketHomeAndDiscoveryViewProps> = ({
  onOpenProductDetail,
  onExploreFiltered,
  onStartSelling,
}) => {
  const {
    listings,
    categories,
    wishlistIds,
    selectedCampusLocation,
    setSelectedCampusLocation,
    toggleWishlist,
  } = useMarket();

  const [dealTrack, setDealTrack] = useState<DealTrack>('all');
  const [dealMaxPrice, setDealMaxPrice] = useState<number>(1500);

  const activeListings = useMemo(
    () => listings.filter((l) => l.status === 'Active'),
    [listings]
  );

  const discoverListings = useMemo(() => {
    return activeListings.slice(0, 8);
  }, [activeListings]);

  const budgetFinds = useMemo(() => {
    return activeListings
      .filter((item) => {
        if (item.listingType === 'For Sale' && item.priceINR !== null && item.priceINR > dealMaxPrice) {
          return false;
        }
        if (dealTrack === 'books-budget') {
          return item.category === 'Books & Study' && (item.priceINR ?? 0) <= 350;
        }
        if (dealTrack === 'hostel') {
          return item.category === 'Hostel Essentials' || item.category === 'Furniture';
        }
        if (dealTrack === 'electronics') {
          return item.category === 'Electronics';
        }
        if (dealTrack === 'study-setup') {
          return ['Hostel Essentials', 'Stationery', 'Furniture', 'Electronics'].includes(
            item.category
          );
        }
        return item.listingType === 'For Sale' && (item.priceINR ?? 99999) <= dealMaxPrice;
      })
      .slice(0, 4);
  }, [activeListings, dealTrack, dealMaxPrice]);

  const campusPicks = useMemo(() => {
    if (selectedCampusLocation === 'All') {
      return activeListings.filter((l) => l.pickupPoint).slice(0, 4);
    }
    return activeListings
      .filter(
        (l) =>
          l.sellerCampus.toLowerCase().includes(selectedCampusLocation.toLowerCase()) ||
          l.sellerCity.toLowerCase().includes(selectedCampusLocation.toLowerCase())
      )
      .slice(0, 4);
  }, [activeListings, selectedCampusLocation]);

  const renderProductCard = (item: MarketListing) => {
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
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(item.id);
              }}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                wishlisted
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-orange-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate font-medium text-blue-600 dark:text-blue-400">
                {item.category} · {item.condition}
              </span>
              <span className="shrink-0 font-semibold text-slate-600 dark:text-slate-300">
                {item.listingType}
              </span>
            </div>

            <h3
              onClick={() => onOpenProductDetail(item)}
              className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 cursor-pointer hover:text-blue-600"
            >
              {item.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {item.description}
            </p>

            <div className="pt-1 flex items-baseline gap-2">
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
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

            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {item.sellerName} · {item.sellerCampus}, {item.sellerCity}
            </p>
          </div>
        </div>

        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 truncate">
            {item.isDemoRecord ? 'Demo Listing' : item.pickupPoint}
          </span>
          <button
            type="button"
            onClick={() => onOpenProductDetail(item)}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
          >
            View Details
          </button>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-10">
      {/* 1. Hero Section */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              KAMPUS MARKET · Campus Commerce
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-balance leading-tight">
              Everything Students Need. All in One Market.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Discover affordable essentials, find second-hand treasures and give your unused items a
              new home.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onExploreFiltered({ category: 'all' })}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onStartSelling}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Start Selling
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Made for student communities.</span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 min-h-[260px] bg-slate-100 dark:bg-slate-800">
          <img
            src={MARKET_HERO_IMAGE}
            alt="Organized sunlit student desk with textbooks, laptop, headphones, and stationery"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* 2. Discover Marketplace */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Find Your Next Favourite
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Useful products, student-friendly prices. Demo listings are explicitly labeled until
              live student listings replace them.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExploreFiltered({ category: 'all' })}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All {activeListings.length} Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {discoverListings.map((item) => renderProductCard(item))}
        </div>
      </section>

      {/* 3. Shop by Category */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select any category or specialized student subcategory to open filtered browsing
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ALL_MARKET_CATEGORIES.map((catName) => {
            const cfg = categories.find((c) => c.category === catName);
            const subs = cfg?.subcategories || [];
            const catCount = activeListings.filter((l) => l.category === catName).length;
            return (
              <div
                key={catName}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/80 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onExploreFiltered({ category: catName })}
                      className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 text-left"
                    >
                      {catName}
                    </button>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {catCount}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
                    {subs.map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() =>
                          onExploreFiltered({ category: catName, subcategory: sub })
                        }
                        className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline-offset-2 hover:underline text-left"
                      >
                        {sub}
                        <span className="text-slate-300 dark:text-slate-600 ml-1">·</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onExploreFiltered({ category: catName })}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline self-start"
                >
                  Browse {catName}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Student Deals & Budget Finds */}
      <section className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Good Finds. Better Prices.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Discover useful products without stretching your student budget.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { id: 'all', label: 'Budget Finds' },
              { id: 'books-budget', label: 'Books Under Budget' },
              { id: 'hostel', label: 'Hostel Essentials' },
              { id: 'electronics', label: 'Pre-loved Electronics' },
              { id: 'study-setup', label: 'Study Setup Essentials' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDealTrack(t.id as DealTrack)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  dealTrack === t.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}

            <select
              value={dealMaxPrice}
              onChange={(e) => setDealMaxPrice(Number(e.target.value))}
              aria-label="Filter deals by max price"
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 tabular-nums"
            >
              <option value={300}>Up to ₹300</option>
              <option value={600}>Up to ₹600</option>
              <option value={1000}>Up to ₹1,000</option>
              <option value={1500}>Up to ₹1,500</option>
              <option value={5000}>Up to ₹5,000</option>
            </select>
          </div>
        </div>

        {budgetFinds.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
            No items match this price ceiling right now. Widen the price limit above to see more finds.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {budgetFinds.map((item) => renderProductCard(item))}
          </div>
        )}
      </section>

      {/* 5. Campus Picks */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Discover What&apos;s Around Your Campus
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Find useful products listed by students in your college community. Public campus pickup
              points only — exact private locations are never exposed.
            </p>
          </div>

          <select
            value={selectedCampusLocation}
            onChange={(e) => setSelectedCampusLocation(e.target.value)}
            aria-label="Select campus location"
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            {CAMPUS_DIRECTORY.map((loc) => (
              <option key={loc.campus} value={loc.campus}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {campusPicks.length === 0 ? (
            <p className="text-xs text-slate-500 col-span-full py-4">
              No active listings for the selected campus yet. Switch to All Campuses to view nearby
              student listings.
            </p>
          ) : (
            campusPicks.map((item) => renderProductCard(item))
          )}
        </div>
      </section>

      {/* 6. Sell on KAMPUS Promotional Banner */}
      <section className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-400">
            Student Seller Program
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-balance">
            Turn Your Unused Items Into Someone&apos;s Next Favourite.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            List your books, gadgets and college essentials in just a few simple steps.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartSelling}
          className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shrink-0 transition-colors"
        >
          <PackagePlus className="w-4 h-4" />
          <span>Sell an Item</span>
        </button>
      </section>
    </div>
  );
};
