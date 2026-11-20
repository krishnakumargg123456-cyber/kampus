import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Armchair,
  Bell,
  BookOpen,
  Compass,
  Dumbbell,
  FlaskConical,
  Gift,
  Heart,
  Home,
  Lamp,
  Laptop,
  MapPin,
  PackagePlus,
  PenTool,
  Repeat,
  Search,
  Shield,
  Shirt,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { MarketProvider, useMarket } from '../../context/MarketContext';
import { CAMPUS_DIRECTORY } from '../../data/marketData';
import type { MarketCategory, MarketListing } from '../../types/market';
import { MarketHomeAndDiscoveryView } from '../../components/market/MarketHomeAndDiscoveryView';
import { MarketExploreView } from '../../components/market/MarketExploreView';
import { FreeCornerAndExchangeView } from '../../components/market/FreeCornerAndExchangeView';
import { ProductDetailAndChatModal } from '../../components/market/ProductDetailAndChatModal';
import { SellItemWizardView } from '../../components/market/SellItemWizardView';
import { MyMarketAndAdminView } from '../../components/market/MyMarketAndAdminView';

interface MarketPageProps {
  onOpenNotifications?: () => void;
}

type MarketViewMode =
  | 'home'
  | 'explore'
  | 'free-corner'
  | 'exchange-hub'
  | 'sell'
  | 'wishlist'
  | 'my-market'
  | 'admin';

const CATEGORY_NAV: {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  kind: 'all' | 'category' | 'free-corner' | 'exchange-hub';
  category?: MarketCategory;
}[] = [
  { id: 'all', label: 'All Items', icon: ShoppingBag, kind: 'all' },
  {
    id: 'Books & Study',
    label: 'Books & Study',
    icon: BookOpen,
    kind: 'category',
    category: 'Books & Study',
  },
  {
    id: 'Electronics',
    label: 'Electronics',
    icon: Laptop,
    kind: 'category',
    category: 'Electronics',
  },
  {
    id: 'Stationery',
    label: 'Stationery',
    icon: PenTool,
    kind: 'category',
    category: 'Stationery',
  },
  {
    id: 'Hostel Essentials',
    label: 'Hostel Essentials',
    icon: Lamp,
    kind: 'category',
    category: 'Hostel Essentials',
  },
  { id: 'Fashion', label: 'Fashion', icon: Shirt, kind: 'category', category: 'Fashion' },
  {
    id: 'Furniture',
    label: 'Furniture',
    icon: Armchair,
    kind: 'category',
    category: 'Furniture',
  },
  {
    id: 'Lab Equipment',
    label: 'Lab Equipment',
    icon: FlaskConical,
    kind: 'category',
    category: 'Lab Equipment',
  },
  {
    id: 'Sports & Fitness',
    label: 'Sports & Fitness',
    icon: Dumbbell,
    kind: 'category',
    category: 'Sports & Fitness',
  },
  { id: 'free-corner', label: 'Free Corner', icon: Gift, kind: 'free-corner' },
  { id: 'exchange-hub', label: 'Exchange Hub', icon: Repeat, kind: 'exchange-hub' },
];

const MarketWorkspaceInner: React.FC<MarketPageProps> = ({ onOpenNotifications }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { unreadCount } = useNotifications();

  const {
    loading,
    statusToast,
    clearToast,
    listings,
    wishlistIds,
    recentSearches,
    selectedCampusLocation,
    setSelectedCampusLocation,
    recordRecentSearch,
  } = useMarket();

  const [viewMode, setViewMode] = useState<MarketViewMode>('home');
  const [activeCatNav, setActiveCatNav] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<MarketListing | null>(null);

  const [headerSearch, setHeaderSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [exploreSeed, setExploreSeed] = useState<{
    search?: string;
    category?: MarketCategory | 'all';
    subcategory?: string;
    maxPrice?: number;
  }>({});

  // Handle ?item=<id> deep links
  useEffect(() => {
    const itemParam = searchParams.get('item');
    if (!itemParam || listings.length === 0) return;
    const found = listings.find((l) => l.id === itemParam);
    if (found) {
      setSelectedProduct(found);
    }
  }, [searchParams, listings]);

  const closeProductModal = () => {
    setSelectedProduct(null);
    if (searchParams.has('item')) {
      const next = new URLSearchParams(searchParams);
      next.delete('item');
      setSearchParams(next, { replace: true });
    }
  };

  const searchSuggestions = useMemo(() => {
    const q = headerSearch.trim().toLowerCase();
    if (!q) return [];
    return listings
      .filter(
        (l) =>
          l.status === 'Active' &&
          (l.title.toLowerCase().includes(q) ||
            l.category.toLowerCase().includes(q) ||
            l.subcategory.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [headerSearch, listings]);

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = headerSearch.trim();
    if (trimmed) recordRecentSearch(trimmed);
    setShowSuggestions(false);
    setExploreSeed({ search: trimmed, category: 'all' });
    setViewMode('explore');
  };

  const handleCategoryNavClick = (navItem: (typeof CATEGORY_NAV)[number]) => {
    setActiveCatNav(navItem.id);
    if (navItem.kind === 'free-corner') {
      setViewMode('free-corner');
      return;
    }
    if (navItem.kind === 'exchange-hub') {
      setViewMode('exchange-hub');
      return;
    }
    if (navItem.kind === 'all') {
      setExploreSeed({ category: 'all', subcategory: 'all', search: '' });
      setViewMode('explore');
      return;
    }
    if (navItem.category) {
      setExploreSeed({ category: navItem.category, subcategory: 'all', search: '' });
      setViewMode('explore');
    }
  };

  const handleExploreFiltered = (opts?: {
    category?: MarketCategory | 'all';
    subcategory?: string;
    maxPrice?: number;
  }) => {
    setExploreSeed({
      category: opts?.category || 'all',
      subcategory: opts?.subcategory || 'all',
      maxPrice: opts?.maxPrice,
      search: '',
    });
    setActiveCatNav(opts?.category || 'all');
    setViewMode('explore');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 lg:pb-10">
      {/* Status Toast */}
      {statusToast && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 ${
            statusToast.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : statusToast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <span>{statusToast.message}</span>
          <button type="button" onClick={clearToast} aria-label="Dismiss message">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Marketplace Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left Brand + Tagline */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setViewMode('home');
                  setActiveCatNav('all');
                }}
                className="text-left"
              >
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 block">
                  KAMPUS <span className="text-blue-600">MARKET</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Buy Smart. Sell Easy. Campus Life Made Better.
                </span>
              </button>

              <div className="flex lg:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('wishlist')}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 ${
                    viewMode === 'wishlist'
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Wishlist</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('sell')}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold"
                >
                  + Sell Item
                </button>
              </div>
            </div>

            {/* Center Search */}
            <div className="relative flex-1 max-w-xl">
              <form onSubmit={handleHeaderSearchSubmit} className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={headerSearch}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                  onChange={(e) => {
                    setHeaderSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Search books, electronics, stationery, essentials..."
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Search
                </button>
              </form>

              {showSuggestions &&
                (searchSuggestions.length > 0 || recentSearches.length > 0) && (
                  <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-30 p-2 text-xs space-y-1">
                    {searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={() => {
                          setSelectedProduct(item);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold truncate">{item.title}</span>
                        <span className="text-blue-600 shrink-0">{item.category}</span>
                      </button>
                    ))}
                    {headerSearch.trim() === '' && recentSearches.length > 0 && (
                      <div className="px-2 py-1">
                        <p className="text-[11px] text-slate-400 mb-1">Recent searches</p>
                        <div className="flex flex-wrap gap-1.5">
                          {recentSearches.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onMouseDown={() => {
                                setHeaderSearch(term);
                                setExploreSeed({ search: term, category: 'all' });
                                setViewMode('explore');
                                setShowSuggestions(false);
                              }}
                              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-medium"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Right Controls */}
            <div className="hidden lg:flex items-center gap-2.5 text-xs shrink-0">
              <div className="relative flex items-center">
                <MapPin className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 pointer-events-none" />
                <select
                  value={selectedCampusLocation}
                  onChange={(e) => setSelectedCampusLocation(e.target.value)}
                  aria-label="Campus selector"
                  className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  {CAMPUS_DIRECTORY.map((loc) => (
                    <option key={loc.campus} value={loc.campus}>
                      {loc.campus === 'All' ? 'All Campuses' : loc.campus}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('wishlist')}
                aria-label="Open wishlist"
                className={`px-3 py-2 rounded-xl border font-semibold inline-flex items-center gap-1.5 ${
                  viewMode === 'wishlist'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${wishlistIds.length > 0 ? 'text-orange-500 fill-current' : ''}`}
                />
                <span className="tabular-nums">{wishlistIds.length}</span>
              </button>

              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  aria-label="Open Notification Center"
                  className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              <Link
                to="/account/profile"
                aria-label="Open Student Profile"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <User className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setViewMode('sell')}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <PackagePlus className="w-4 h-4" />
                <span>Sell Item</span>
              </button>
            </div>
          </div>

          {/* Horizontal Category & Workspace Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <nav
              aria-label="Marketplace categories"
              className="flex items-center gap-1 overflow-x-auto py-1 text-xs"
            >
              {CATEGORY_NAV.map((nav) => {
                const Icon = nav.icon;
                const active =
                  (viewMode === 'free-corner' && nav.id === 'free-corner') ||
                  (viewMode === 'exchange-hub' && nav.id === 'exchange-hub') ||
                  ((viewMode === 'home' || viewMode === 'explore') && activeCatNav === nav.id);
                return (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => handleCategoryNavClick(nav)}
                    className={`px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-1.5 text-xs shrink-0">
              {[
                { id: 'home', label: 'Home' },
                { id: 'explore', label: 'Explore' },
                { id: 'my-market', label: 'My Market' },
                { id: 'admin', label: 'Admin' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id as MarketViewMode)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap ${
                    viewMode === tab.id
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.id === 'admin' ? (
                    <span className="inline-flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>{tab.label}</span>
                    </span>
                  ) : (
                    tab.label
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading && listings.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
            Loading KAMPUS Market catalog...
          </div>
        ) : (
          <>
            {viewMode === 'home' && (
              <MarketHomeAndDiscoveryView
                onOpenProductDetail={setSelectedProduct}
                onExploreFiltered={handleExploreFiltered}
                onStartSelling={() => setViewMode('sell')}
              />
            )}

            {viewMode === 'explore' && (
              <MarketExploreView
                seedSearch={exploreSeed.search}
                seedCategory={exploreSeed.category}
                seedSubcategory={exploreSeed.subcategory}
                seedMaxPrice={exploreSeed.maxPrice}
                onOpenProductDetail={setSelectedProduct}
              />
            )}

            {(viewMode === 'free-corner' || viewMode === 'exchange-hub') && (
              <FreeCornerAndExchangeView
                mode={viewMode}
                onOpenProductDetail={setSelectedProduct}
              />
            )}

            {viewMode === 'sell' && (
              <SellItemWizardView
                onPublished={() => setViewMode('my-market')}
                onCancel={() => setViewMode('home')}
              />
            )}

            {(viewMode === 'my-market' || viewMode === 'wishlist' || viewMode === 'admin') && (
              <MyMarketAndAdminView
                mode={viewMode}
                onOpenProductDetail={setSelectedProduct}
                onBrowseMarketplace={() => setViewMode('explore')}
                onStartSelling={() => setViewMode('sell')}
              />
            )}
          </>
        )}
      </main>

      {/* Product Detail View Modal */}
      {selectedProduct && (
        <ProductDetailAndChatModal
          listing={selectedProduct}
          onClose={closeProductModal}
          onSelectListing={(next) => setSelectedProduct(next)}
        />
      )}

      {/* Compact Tablet Bottom Navigation (avoids overlapping global mobile nav < md) */}
      <nav
        aria-label="Tablet market navigation"
        className="hidden md:grid lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid-cols-5 py-2 text-[11px] font-semibold"
      >
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'explore', label: 'Explore', icon: Compass },
          { id: 'sell', label: 'Sell', icon: PackagePlus },
          { id: 'wishlist', label: 'Wishlist', icon: Heart },
          { id: 'my-market', label: 'My Market', icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const active = viewMode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setViewMode(item.id as MarketViewMode)}
              className={`flex flex-col items-center justify-center gap-0.5 ${
                active ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export const MarketPage: React.FC<MarketPageProps> = ({ onOpenNotifications }) => {
  return (
    <MarketProvider>
      <MarketWorkspaceInner onOpenNotifications={onOpenNotifications} />
    </MarketProvider>
  );
};

export default MarketPage;
