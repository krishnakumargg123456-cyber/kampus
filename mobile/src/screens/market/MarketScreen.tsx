import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Platform,
  Dimensions,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import {
  ShoppingBag,
  Search,
  Plus,
  Tag,
  MessageCircle,
  Bookmark,
  ShieldCheck,
  Check,
  X,
  Camera,
  Filter,
  ArrowUpDown,
  Heart,
  Share2,
  MapPin,
  SlidersHorizontal,
  Trash2,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  Package,
  ChevronRight,
  ChevronLeft,
  User,
  RefreshCw,
  CreditCard,
  ArrowLeft,
  Phone,
  ExternalLink,
  Eye,
  Gift,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';
import { MarketApi } from '../../services/marketApi';
import type {
  MarketListing,
  MarketCategory,
  MarketCondition,
  MarketListingType,
  MarketCartItem,
  MarketOrder,
  MarketOrderStatus,
  MarketPaymentMethod,
} from '../../../../src/types/market';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;

const CATEGORIES: { label: string; value: string; iconName: string }[] = [
  { label: 'All Items', value: 'All', iconName: 'all' },
  { label: 'Books & Study', value: 'Books & Study', iconName: 'books' },
  { label: 'Electronics', value: 'Electronics', iconName: 'laptop' },
  { label: 'Stationery', value: 'Stationery', iconName: 'pen' },
  { label: 'Hostel Essentials', value: 'Hostel Essentials', iconName: 'lamp' },
  { label: 'Fashion', value: 'Fashion', iconName: 'shirt' },
  { label: 'Furniture', value: 'Furniture', iconName: 'armchair' },
  { label: 'Lab Equipment', value: 'Lab Equipment', iconName: 'flask' },
  { label: 'Sports & Fitness', value: 'Sports & Fitness', iconName: 'dumbbell' },
];

const STOCK_IMAGE_PRESETS = [
  { id: 'books', label: 'Textbooks', key: 'books' },
  { id: 'calculator', label: 'Calculator', key: 'calculator' },
  { id: 'lamp', label: 'Desk Lamp', key: 'lamp' },
  { id: 'backpack', label: 'Backpack', key: 'backpack' },
  { id: 'headphones', label: 'Headphones', key: 'headphones' },
  { id: 'drawing_kit', label: 'Drawing Kit', key: 'drawing_kit' },
  { id: 'study_table', label: 'Desk Table', key: 'study_table' },
  { id: 'sports', label: 'Sports Kit', key: 'sports' },
];

const CAMPUS_LOCATIONS = [
  'All Campuses',
  'Main Campus (North)',
  'Main Campus (South)',
  'Hostel Complex Block A',
  'Hostel Complex Block B',
  'Central Library Foyer',
  'Student Activity Centre',
  'Campus Canteen Courtyard',
];

export const MarketScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const currentUserId = (user as any)?.userId || (user as any)?.id || 'stu_guest';
  const currentUserName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'Campus Student');
  const currentUserCampus = user?.college || 'IIT Bombay';

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [cart, setCart] = useState<MarketCartItem[]>([]);
  const [orders, setOrders] = useState<MarketOrder[]>([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCampus, setSelectedCampus] = useState('All Campuses');
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'For Sale' | 'Giveaway'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  // Modals
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [ordersVisible, setOrdersVisible] = useState(false);
  const [ordersActiveTab, setOrdersActiveTab] = useState<'purchases' | 'seller'>('purchases');
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [campusPickerVisible, setCampusPickerVisible] = useState(false);

  // Sell Form States
  const [sellTitle, setSellTitle] = useState('');
  const [sellCategory, setSellCategory] = useState<MarketCategory>('Books & Study');
  const [sellCondition, setSellCondition] = useState<MarketCondition>('Like New');
  const [sellType, setSellType] = useState<MarketListingType>('For Sale');
  const [sellPrice, setSellPrice] = useState('');
  const [sellOriginalPrice, setSellOriginalPrice] = useState('');
  const [sellDescription, setSellDescription] = useState('');
  const [sellPickupPoint, setSellPickupPoint] = useState('Main Library Gate / Central Canteen');
  const [sellDeliveryAvailable, setSellDeliveryAvailable] = useState(false);
  const [sellImages, setSellImages] = useState<string[]>(['books']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Checkout Form States
  const [checkoutPhone, setCheckoutPhone] = useState((user as any)?.phone || '');
  const [checkoutLocation, setCheckoutLocation] = useState('Campus Central Library Foyer');
  const [checkoutNote, setCheckoutNote] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'Cash on Pickup' | 'UPI at Pickup'>('Cash on Pickup');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Initial Load
  const loadMarketData = useCallback(async () => {
    try {
      const data = await MarketApi.bootstrap(currentUserId);
      setListings(data.listings || []);
      setWishlistIds(data.wishlistIds || []);
      setCart(data.cart || []);
      setOrders(data.orders || []);
    } catch (err: any) {
      console.warn('[MarketScreen] Bootstrap failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMarketData();
  }, [loadMarketData]);

  // Wishlist Toggle
  const handleToggleWishlist = async (listingId: string) => {
    const isSaved = wishlistIds.includes(listingId);
    setWishlistIds((prev) => (isSaved ? prev.filter((id) => id !== listingId) : [...prev, listingId]));
    try {
      await MarketApi.toggleWishlist(listingId, currentUserId);
    } catch (err: any) {
      // Revert on error
      setWishlistIds((prev) => (isSaved ? [...prev, listingId] : prev.filter((id) => id !== listingId)));
      Alert.alert('Error', 'Unable to update wishlist');
    }
  };

  // Add To Cart
  const handleAddToCart = async (listing: MarketListing) => {
    if (listing.sellerId === currentUserId) {
      Alert.alert('Own Listing', 'You cannot purchase or add your own listing to cart.');
      return;
    }
    try {
      const updatedCart = await MarketApi.addToCart(currentUserId, listing.id, 1);
      setCart(updatedCart.items || []);
      Alert.alert('Added to Cart', `"${listing.title}" is in your KAMPUS cart.`, [
        { text: 'Continue Browsing', style: 'cancel' },
        { text: 'View Cart', onPress: () => setCartVisible(true) },
      ]);
    } catch (err: any) {
      Alert.alert('Cart Error', err.message || 'Could not add to cart.');
    }
  };

  // Update Cart Quantity
  const handleUpdateCartQty = async (listingId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    try {
      if (newQty <= 0) {
        const updated = await MarketApi.removeFromCart(currentUserId, listingId);
        setCart(updated.items || []);
      } else {
        const updated = await MarketApi.addToCart(currentUserId, listingId, delta);
        setCart(updated.items || []);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update quantity');
    }
  };

  // Clear Cart
  const handleClearCart = async () => {
    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await MarketApi.clearCart(currentUserId);
            setCart([]);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not clear cart');
          }
        },
      },
    ]);
  };

  // Cart Calculations
  const cartSubtotalINR = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemListing = item.listing || listings.find((l) => l.id === item.listingId);
      return sum + (itemListing?.priceINR || 0) * item.quantity;
    }, 0);
  }, [cart, listings]);

  // Place Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }
    const cleanPhone = checkoutPhone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      Alert.alert('Contact Phone Required', 'Please provide a valid phone number so the seller can coordinate meetup.');
      return;
    }
    if (!checkoutLocation.trim()) {
      Alert.alert('Pickup Spot Required', 'Please specify where you prefer to meet on campus.');
      return;
    }

    try {
      setIsPlacingOrder(true);
      const itemsPayload = cart.map((item) => ({ listingId: item.listingId, quantity: item.quantity }));
      const createdOrders = await MarketApi.placeOrder({
        buyerId: currentUserId,
        buyerName: currentUserName,
        buyerEmail: user?.email || '',
        buyerPhone: cleanPhone,
        items: itemsPayload,
        fulfillmentMethod: 'Campus Pickup',
        pickupLocation: checkoutLocation.trim(),
        buyerNote: checkoutNote.trim(),
        paymentMethod: checkoutPaymentMethod,
      });

      // Clear cart locally and refresh orders
      setCart([]);
      setOrders((prev) => [...createdOrders, ...prev]);
      setCheckoutVisible(false);
      setCartVisible(false);

      Alert.alert(
        'Order Placed Successfully!',
        `Order confirmed with ${createdOrders.length} seller(s). Track the meetup in Orders & Seller Hub.`,
        [
          {
            text: 'Track Order',
            onPress: () => {
              setOrdersActiveTab('purchases');
              setOrdersVisible(true);
            },
          },
          { text: 'Done', style: 'cancel' },
        ]
      );
      // Reload bootstrap to sync listing availability
      loadMarketData();
    } catch (err: any) {
      Alert.alert('Order Failed', err.message || 'Unable to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Direct Buy Now (Single item)
  const handleBuyNow = (listing: MarketListing) => {
    if (listing.sellerId === currentUserId) {
      Alert.alert('Own Listing', 'You cannot purchase your own listing.');
      return;
    }
    // Set cart to just this item temporarily or open checkout
    handleAddToCart(listing);
    setSelectedListing(null);
  };

  // Update Order Status (Seller / Buyer)
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: MarketOrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      const updatedOrder = await MarketApi.updateOrderStatus(orderId, currentUserId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      Alert.alert('Order Updated', `Status changed to "${nextStatus}".`);
      loadMarketData(); // refresh listing statuses (e.g. marked Sold)
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Document Picker for Listing Photo
  const handlePickListingPhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsUploadingPhoto(false);
        return;
      }

      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const uploadRes = await MarketApi.uploadPhoto(
            currentUserId,
            asset.name || 'product.jpg',
            base64Data,
            asset.mimeType || 'image/jpeg'
          );
          setSellImages((prev) => [uploadRes.imageUrl, ...prev]);
          Alert.alert('Photo Added', 'Image uploaded successfully!');
        } catch (uploadErr: any) {
          Alert.alert('Upload Error', uploadErr.message || 'Could not upload image.');
        } finally {
          setIsUploadingPhoto(false);
        }
      };

      reader.onerror = () => {
        setIsUploadingPhoto(false);
        Alert.alert('Error', 'Failed to read image.');
      };

      reader.readAsDataURL(blob);
    } catch (err: any) {
      setIsUploadingPhoto(false);
      Alert.alert('Error', err.message || 'Image selection failed.');
    }
  };

  // Submit Listing
  const handlePublishListing = async () => {
    if (!sellTitle.trim()) {
      Alert.alert('Required Field', 'Please provide a title for your item.');
      return;
    }
    if (sellType === 'For Sale' && (!sellPrice.trim() || Number(sellPrice) <= 0)) {
      Alert.alert('Invalid Price', 'Please enter a valid price in INR.');
      return;
    }
    if (!sellDescription.trim()) {
      Alert.alert('Required Field', 'Please provide an honest description of item condition and history.');
      return;
    }

    try {
      setIsPublishing(true);
      const parsedPrice = sellType === 'For Sale' ? Number(sellPrice) : null;
      const parsedOriginal = sellOriginalPrice.trim() ? Number(sellOriginalPrice) : null;

      const newListing = await MarketApi.createListing({
        title: sellTitle.trim(),
        description: sellDescription.trim(),
        category: sellCategory,
        listingType: sellType,
        condition: sellCondition,
        priceINR: parsedPrice,
        originalPriceINR: parsedOriginal,
        negotiable: false,
        images: sellImages.length > 0 ? sellImages : ['books'],
        coverIndex: 0,
        sellerId: currentUserId,
        sellerName: currentUserName,
        sellerCampus: currentUserCampus,
        pickupPoint: sellPickupPoint.trim() || 'Central Library Foyer',
        deliveryAvailable: sellDeliveryAvailable,
      });

      setListings((prev) => [newListing, ...prev]);
      setSellModalVisible(false);
      // Reset form
      setSellTitle('');
      setSellPrice('');
      setSellOriginalPrice('');
      setSellDescription('');
      setSellImages(['books']);

      Alert.alert('Listing Live!', `"${newListing.title}" is now visible to all students on KAMPUS Market.`);
    } catch (err: any) {
      Alert.alert('Publish Failed', err.message || 'Could not publish listing.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Filtered & Sorted Listings
  const filteredListings = useMemo(() => {
    let result = listings.filter((item) => {
      // Exclude inactive unless owned
      if (item.status !== 'Active' && item.sellerId !== currentUserId) return false;

      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Campus filter
      if (selectedCampus !== 'All Campuses' && item.sellerCampus && item.sellerCampus !== selectedCampus) {
        return false;
      }

      // Listing Type filter
      if (listingTypeFilter !== 'all' && item.listingType !== listingTypeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesSeller = item.sellerName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesDesc && !matchesSeller) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'price_low') {
        const priceA = a.priceINR ?? 0;
        const priceB = b.priceINR ?? 0;
        return priceA - priceB;
      }
      if (sortOrder === 'price_high') {
        const priceA = a.priceINR ?? 0;
        const priceB = b.priceINR ?? 0;
        return priceB - priceA;
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [listings, selectedCategory, selectedCampus, listingTypeFilter, searchQuery, sortOrder, currentUserId]);

  // Active Orders Count (for badge)
  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.buyerId === currentUserId || o.sellerId === currentUserId) &&
        ['Pending', 'Accepted', 'Ready for Pickup'].includes(o.status)
    ).length;
  }, [orders, currentUserId]);

  const buyerOrders = useMemo(() => orders.filter((o) => o.buyerId === currentUserId), [orders, currentUserId]);
  const sellerOrders = useMemo(() => orders.filter((o) => o.sellerId === currentUserId), [orders, currentUserId]);
  const myListings = useMemo(() => listings.filter((l) => l.sellerId === currentUserId), [listings, currentUserId]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#050a18' : '#f8fafc', paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={[styles.brandTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
              KAMPUS <Text style={{ color: '#38bdf8' }}>Market</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.campusBadge,
                { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.15)' },
              ]}
              onPress={() => setCampusPickerVisible(true)}
            >
              <MapPin size={12} color="#0284c7" />
              <Text style={styles.campusBadgeText} numberOfLines={1}>
                {selectedCampus}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            {/* Wishlist Button */}
            <TouchableOpacity
              style={[
                styles.actionIconBtn,
                { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1f2937' : '#e2e8f0' },
              ]}
              onPress={() => {
                Alert.alert(
                  'Saved Items',
                  `You have ${wishlistIds.length} item(s) saved in your campus wishlist.`
                );
              }}
            >
              <Heart size={20} color={wishlistIds.length > 0 ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} fill={wishlistIds.length > 0 ? '#ef4444' : 'none'} />
              {wishlistIds.length > 0 && (
                <View style={[styles.badgeDot, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.badgeText}>{wishlistIds.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Cart Button */}
            <TouchableOpacity
              style={[
                styles.actionIconBtn,
                { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1f2937' : '#e2e8f0' },
              ]}
              onPress={() => setCartVisible(true)}
            >
              <ShoppingBag size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
              {cart.length > 0 && (
                <View style={[styles.badgeDot, { backgroundColor: '#38bdf8' }]}>
                  <Text style={[styles.badgeText, { color: '#000000' }]}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Orders & Seller Hub Button */}
            <TouchableOpacity
              style={[
                styles.actionIconBtn,
                { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1f2937' : '#e2e8f0' },
              ]}
              onPress={() => setOrdersVisible(true)}
            >
              <Package size={20} color={isDark ? '#e2e8f0' : '#334155'} />
              {activeOrdersCount > 0 && (
                <View style={[styles.badgeDot, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.badgeText}>{activeOrdersCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Sell CTA */}
            <TouchableOpacity style={styles.sellBtn} onPress={() => setSellModalVisible(true)}>
              <Plus size={16} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.sellBtnText}>Sell</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
          ]}
        >
          <Search size={18} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="Search books, calculators, lab coats, drafters..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          )}
        </View>

        {/* CATEGORY CAROUSEL */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected
                      ? '#38bdf8'
                      : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : '#ffffff',
                    borderColor: isSelected
                      ? '#38bdf8'
                      : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : '#e2e8f0',
                  },
                ]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: isSelected ? '#000000' : isDark ? '#cbd5e1' : '#475569',
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FILTER & SORT ROW */}
        <View style={styles.filterRow}>
          {/* Type Filter */}
          <View style={styles.typeToggleGroup}>
            <TouchableOpacity
              style={[
                styles.typeToggleItem,
                listingTypeFilter === 'all' && styles.typeToggleActive,
                { borderColor: isDark ? '#1e293b' : '#e2e8f0' },
              ]}
              onPress={() => setListingTypeFilter('all')}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  { color: listingTypeFilter === 'all' ? '#38bdf8' : isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeToggleItem,
                listingTypeFilter === 'For Sale' && styles.typeToggleActive,
                { borderColor: isDark ? '#1e293b' : '#e2e8f0' },
              ]}
              onPress={() => setListingTypeFilter('For Sale')}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  { color: listingTypeFilter === 'For Sale' ? '#38bdf8' : isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                For Sale
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeToggleItem,
                listingTypeFilter === 'Giveaway' && styles.typeToggleActive,
                { borderColor: isDark ? '#1e293b' : '#e2e8f0' },
              ]}
              onPress={() => setListingTypeFilter('Giveaway')}
            >
              <Text
                style={[
                  styles.typeToggleText,
                  { color: listingTypeFilter === 'Giveaway' ? '#10b981' : isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                Free Corner
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sort Menu Button */}
          <TouchableOpacity
            style={[
              styles.sortBtn,
              { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
            ]}
            onPress={() => {
              if (sortOrder === 'newest') setSortOrder('price_low');
              else if (sortOrder === 'price_low') setSortOrder('price_high');
              else setSortOrder('newest');
            }}
          >
            <ArrowUpDown size={13} color="#38bdf8" />
            <Text style={[styles.sortBtnText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
              {sortOrder === 'newest' ? 'Newest' : sortOrder === 'price_low' ? 'Price: Low' : 'Price: High'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PRODUCT GRID FEED */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Loading Campus Marketplace...
          </Text>
        </View>
      ) : filteredListings.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        >
          <Package size={48} color={isDark ? '#334155' : '#cbd5e1'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>No Listings Found</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {searchQuery
              ? `No items matching "${searchQuery}". Try a different keyword.`
              : 'Be the first to list a textbook or hostel gear for fellow students!'}
          </Text>
          <TouchableOpacity style={styles.emptyCta} onPress={() => setSellModalVisible(true)}>
            <Plus size={18} color="#ffffff" />
            <Text style={styles.emptyCtaText}>Create First Listing</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
          renderItem={({ item }) => {
            const isSaved = wishlistIds.includes(item.id);
            const isSold = item.status === 'Sold';
            const imageUrl = MarketApi.resolveImageUrl(item.images[item.coverIndex || 0]);
            const isOwner = item.sellerId === currentUserId;

            return (
              <TouchableOpacity
                style={[
                  styles.productCard,
                  {
                    backgroundColor: isDark ? '#0b1329' : '#ffffff',
                    borderColor: isDark ? '#1a2647' : '#e2e8f0',
                  },
                ]}
                activeOpacity={0.88}
                onPress={() => setSelectedListing(item)}
              >
                {/* Photo & Overlays */}
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                  {/* Condition Badge */}
                  <View style={styles.conditionBadge}>
                    <Text style={styles.conditionBadgeText}>{item.condition}</Text>
                  </View>

                  {/* Wishlist Button */}
                  <TouchableOpacity
                    style={styles.cardWishlistBtn}
                    onPress={() => handleToggleWishlist(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Heart
                      size={15}
                      color={isSaved ? '#ef4444' : '#ffffff'}
                      fill={isSaved ? '#ef4444' : 'rgba(0,0,0,0.4)'}
                    />
                  </TouchableOpacity>

                  {/* Sold Overlay */}
                  {isSold && (
                    <View style={styles.soldOverlay}>
                      <Text style={styles.soldOverlayText}>SOLD</Text>
                    </View>
                  )}
                </View>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <Text
                    style={[styles.cardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  {/* Pricing Row */}
                  <View style={styles.priceRow}>
                    {item.listingType === 'Giveaway' || item.priceINR === null || item.priceINR === 0 ? (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>FREE</Text>
                      </View>
                    ) : (
                      <View style={styles.priceWithDiscount}>
                        <Text style={[styles.cardPrice, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                          ₹{item.priceINR.toLocaleString('en-IN')}
                        </Text>
                        {item.originalPriceINR && item.originalPriceINR > item.priceINR && (
                          <Text style={styles.originalPrice}>₹{item.originalPriceINR.toLocaleString('en-IN')}</Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Location & Seller */}
                  <View style={styles.locationRow}>
                    <MapPin size={11} color={isDark ? '#64748b' : '#94a3b8'} />
                    <Text
                      style={[styles.locationText, { color: isDark ? '#94a3b8' : '#64748b' }]}
                      numberOfLines={1}
                    >
                      {item.pickupPoint || item.sellerCampus}
                    </Text>
                  </View>

                  {/* Action Button */}
                  {!isSold && (
                    <TouchableOpacity
                      style={[
                        styles.cardActionBtn,
                        {
                          backgroundColor: isOwner
                            ? isDark
                              ? '#1e293b'
                              : '#f1f5f9'
                            : isDark
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'rgba(2, 132, 199, 0.08)',
                          borderColor: isOwner
                            ? isDark
                              ? '#334155'
                              : '#cbd5e1'
                            : isDark
                            ? 'rgba(56, 189, 248, 0.3)'
                            : 'rgba(2, 132, 199, 0.25)',
                        },
                      ]}
                      onPress={() => {
                        if (isOwner) {
                          setSelectedListing(item);
                        } else {
                          handleAddToCart(item);
                        }
                      }}
                    >
                      {isOwner ? (
                        <Text style={[styles.cardActionBtnText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          Manage Listing
                        </Text>
                      ) : (
                        <>
                          <ShoppingBag size={13} color={isDark ? '#38bdf8' : '#0284c7'} />
                          <Text style={[styles.cardActionBtnText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                            Add to Cart
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ======================================================== */}
      {/* 1. PRODUCT DETAIL MODAL (PDP)                            */}
      {/* ======================================================== */}
      <Modal
        visible={selectedListing !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedListing(null)}
      >
        {selectedListing && (
          <View
            style={[
              styles.pdpContainer,
              { backgroundColor: isDark ? '#050a18' : '#f8fafc', paddingTop: insets.top },
            ]}
          >
            {/* PDP Top Bar */}
            <View style={[styles.pdpHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
              <TouchableOpacity
                style={styles.pdpBackBtn}
                onPress={() => setSelectedListing(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ArrowLeft size={22} color={isDark ? '#ffffff' : '#0f172a'} />
              </TouchableOpacity>
              <Text style={[styles.pdpHeaderTitle, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                {selectedListing.title}
              </Text>
              <View style={styles.pdpHeaderActions}>
                <TouchableOpacity
                  style={styles.pdpIconBtn}
                  onPress={() => handleToggleWishlist(selectedListing.id)}
                >
                  <Heart
                    size={20}
                    color={wishlistIds.includes(selectedListing.id) ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')}
                    fill={wishlistIds.includes(selectedListing.id) ? '#ef4444' : 'none'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pdpIconBtn}
                  onPress={() => {
                    Share.share({
                      title: selectedListing.title,
                      message: `Check out "${selectedListing.title}" on KAMPUS Market: ₹${selectedListing.priceINR ?? 'Free'} at ${selectedListing.pickupPoint}`,
                    });
                  }}
                >
                  <Share2 size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.pdpScroll}>
              {/* Product Image */}
              <View style={styles.pdpImageWrapper}>
                <Image
                  source={{ uri: MarketApi.resolveImageUrl(selectedListing.images[0]) }}
                  style={styles.pdpImage}
                  resizeMode="cover"
                />
                <View style={styles.pdpConditionTag}>
                  <Text style={styles.pdpConditionTagText}>{selectedListing.condition}</Text>
                </View>
                {selectedListing.status === 'Sold' && (
                  <View style={styles.pdpSoldBanner}>
                    <Text style={styles.pdpSoldBannerText}>ITEM HAS BEEN SOLD</Text>
                  </View>
                )}
              </View>

              {/* Title & Price Section */}
              <View
                style={[
                  styles.pdpCard,
                  { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
                ]}
              >
                <View style={styles.pdpCategoryPill}>
                  <Text style={styles.pdpCategoryPillText}>{selectedListing.category}</Text>
                  {selectedListing.deliveryAvailable && (
                    <View style={styles.deliveryBadge}>
                      <Truck size={12} color="#10b981" />
                      <Text style={styles.deliveryBadgeText}>Delivery Available</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.pdpTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {selectedListing.title}
                </Text>

                <View style={styles.pdpPriceContainer}>
                  {selectedListing.listingType === 'Giveaway' || selectedListing.priceINR === null ? (
                    <Text style={[styles.pdpPriceFree, { color: '#10b981' }]}>FREE DONATION</Text>
                  ) : (
                    <View style={styles.pdpPriceWithMrp}>
                      <Text style={[styles.pdpPrice, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                        ₹{selectedListing.priceINR.toLocaleString('en-IN')}
                      </Text>
                      {selectedListing.originalPriceINR &&
                        selectedListing.originalPriceINR > selectedListing.priceINR && (
                          <View style={styles.mrpContainer}>
                            <Text style={styles.pdpMrp}>
                              ₹{selectedListing.originalPriceINR.toLocaleString('en-IN')}
                            </Text>
                            <Text style={styles.pdpDiscount}>
                              {Math.round(
                                ((selectedListing.originalPriceINR - selectedListing.priceINR) /
                                  selectedListing.originalPriceINR) *
                                  100
                              )}
                              % OFF
                            </Text>
                          </View>
                        )}
                    </View>
                  )}
                </View>
              </View>

              {/* Description Card */}
              <View
                style={[
                  styles.pdpCard,
                  { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
                ]}
              >
                <Text style={[styles.pdpSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  Description & Condition Notes
                </Text>
                <Text style={[styles.pdpDescriptionText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  {selectedListing.description || 'No additional description provided by the seller.'}
                </Text>
              </View>

              {/* Handover & Location Card */}
              <View
                style={[
                  styles.pdpCard,
                  { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
                ]}
              >
                <Text style={[styles.pdpSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  Campus Handover Point
                </Text>
                <View style={styles.pdpLocationRow}>
                  <MapPin size={18} color="#38bdf8" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pdpLocationTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {selectedListing.pickupPoint}
                    </Text>
                    <Text style={[styles.pdpLocationCampus, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Campus: {selectedListing.sellerCampus}
                    </Text>
                  </View>
                </View>
                <View style={styles.safetyNoticeBox}>
                  <ShieldCheck size={16} color="#10b981" />
                  <Text style={styles.safetyNoticeText}>
                    KAMPUS Verified Handover: Inspect item in person before making payment.
                  </Text>
                </View>
              </View>

              {/* Seller Card */}
              <View
                style={[
                  styles.pdpCard,
                  { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
                ]}
              >
                <Text style={[styles.pdpSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  Seller Information
                </Text>
                <View style={styles.sellerRow}>
                  <View style={styles.sellerAvatarCircle}>
                    <Text style={styles.sellerAvatarText}>
                      {selectedListing.sellerName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.sellerName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                        {selectedListing.sellerName}
                      </Text>
                      <View style={styles.verifiedTag}>
                        <ShieldCheck size={11} color="#0284c7" />
                        <Text style={styles.verifiedTagText}>Student</Text>
                      </View>
                    </View>
                    <Text style={[styles.sellerCollege, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {selectedListing.sellerCampus}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Sticky Action Bar */}
            <View
              style={[
                styles.pdpBottomBar,
                {
                  backgroundColor: isDark ? '#0b1329' : '#ffffff',
                  borderTopColor: isDark ? '#1a2647' : '#e2e8f0',
                  paddingBottom: Math.max(insets.bottom, 14),
                },
              ]}
            >
              {selectedListing.sellerId === currentUserId ? (
                // Owner Controls
                <View style={styles.pdpOwnerRow}>
                  <TouchableOpacity
                    style={[styles.pdpOwnerBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                    onPress={async () => {
                      const nextStatus = selectedListing.status === 'Active' ? 'Sold' : 'Active';
                      try {
                        const updated = await MarketApi.updateListing(selectedListing.id, currentUserId, {
                          status: nextStatus,
                        });
                        setSelectedListing(updated);
                        setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
                        Alert.alert('Status Updated', `Listing marked as ${nextStatus}.`);
                      } catch (err: any) {
                        Alert.alert('Error', err.message || 'Could not update status');
                      }
                    }}
                  >
                    <CheckCircle2 size={16} color="#10b981" />
                    <Text style={[styles.pdpOwnerBtnText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {selectedListing.status === 'Active' ? 'Mark as Sold' : 'Reactivate'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.pdpOwnerBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                    onPress={() => {
                      Alert.alert('Delete Listing', 'Permanently remove this listing from KAMPUS Market?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await MarketApi.deleteListing(selectedListing.id, currentUserId);
                              setListings((prev) => prev.filter((l) => l.id !== selectedListing.id));
                              setSelectedListing(null);
                              Alert.alert('Deleted', 'Listing removed successfully.');
                            } catch (err: any) {
                              Alert.alert('Error', err.message || 'Failed to delete listing.');
                            }
                          },
                        },
                      ]);
                    }}
                  >
                    <Trash2 size={16} color="#ef4444" />
                    <Text style={[styles.pdpOwnerBtnText, { color: '#ef4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ) : selectedListing.status === 'Sold' ? (
                <View style={styles.soldNoticeBar}>
                  <Text style={styles.soldNoticeBarText}>This item has already been purchased.</Text>
                </View>
              ) : (
                // Buyer Actions
                <View style={styles.pdpBuyerRow}>
                  <TouchableOpacity
                    style={[
                      styles.pdpAddToCartBtn,
                      {
                        backgroundColor: isDark ? '#111e3b' : '#e0f2fe',
                        borderColor: isDark ? '#1d3557' : '#bae6fd',
                      },
                    ]}
                    onPress={() => handleAddToCart(selectedListing)}
                  >
                    <ShoppingBag size={18} color="#0284c7" />
                    <Text style={styles.pdpAddToCartText}>Add to Cart</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pdpBuyNowBtn}
                    onPress={() => handleBuyNow(selectedListing)}
                  >
                    <Text style={styles.pdpBuyNowText}>
                      {selectedListing.listingType === 'Giveaway' ? 'Claim for Free' : 'Buy Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* 2. CART MODAL                                            */}
      {/* ======================================================== */}
      <Modal
        visible={cartVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCartVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? '#050a18' : '#f8fafc', paddingTop: insets.top },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <TouchableOpacity onPress={() => setCartVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ArrowLeft size={22} color={isDark ? '#ffffff' : '#0f172a'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
              Campus Cart ({cart.length})
            </Text>
            {cart.length > 0 ? (
              <TouchableOpacity onPress={handleClearCart}>
                <Text style={styles.clearCartText}>Clear</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <ShoppingBag size={56} color={isDark ? '#334155' : '#cbd5e1'} />
              <Text style={[styles.emptyCartTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Your cart is empty
              </Text>
              <Text style={[styles.emptyCartSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Discover textbooks, gadgets, and hostel accessories from other students.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => setCartVisible(false)}
              >
                <Text style={styles.browseBtnText}>Explore KAMPUS Market</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.cartList}>
                {cart.map((item) => {
                  const itemListing = item.listing || listings.find((l) => l.id === item.listingId);
                  const title = itemListing?.title || 'Campus Item';
                  const sellerName = itemListing?.sellerName || 'Student Seller';
                  const priceINR = itemListing?.priceINR;
                  const imageKey = itemListing?.images?.[0] || 'books';

                  return (
                    <View
                      key={item.listingId}
                      style={[
                        styles.cartItemCard,
                        { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
                      ]}
                    >
                      <Image
                        source={{ uri: MarketApi.resolveImageUrl(imageKey) }}
                        style={styles.cartItemImage}
                        resizeMode="cover"
                      />
                      <View style={styles.cartItemDetails}>
                        <Text
                          style={[styles.cartItemTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                          numberOfLines={2}
                        >
                          {title}
                        </Text>
                        <Text style={[styles.cartItemSeller, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          Seller: {sellerName}
                        </Text>
                        <Text style={[styles.cartItemPrice, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                          {priceINR ? `₹${priceINR.toLocaleString('en-IN')}` : 'FREE'}
                        </Text>

                        {/* Quantity Modifier */}
                        <View style={styles.qtyRow}>
                          <TouchableOpacity
                            style={[styles.qtyBtn, { borderColor: isDark ? '#1e293b' : '#cbd5e1' }]}
                            onPress={() => handleUpdateCartQty(item.listingId, item.quantity, -1)}
                          >
                            <Text style={[styles.qtyBtnText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>-</Text>
                          </TouchableOpacity>
                          <Text style={[styles.qtyText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            {item.quantity}
                          </Text>
                          <TouchableOpacity
                            style={[styles.qtyBtn, { borderColor: isDark ? '#1e293b' : '#cbd5e1' }]}
                            onPress={() => handleUpdateCartQty(item.listingId, item.quantity, 1)}
                          >
                            <Text style={[styles.qtyBtnText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>+</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cartDeleteBtn}
                            onPress={() => handleUpdateCartQty(item.listingId, item.quantity, -item.quantity)}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Price Breakdown */}
                <View
                  style={[
                    styles.orderSummaryCard,
                    { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
                  ]}
                >
                  <Text style={[styles.summaryTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Price Breakdown
                  </Text>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Items Subtotal
                    </Text>
                    <Text style={[styles.summaryValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      ₹{cartSubtotalINR.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Campus Handover / Pickup
                    </Text>
                    <Text style={[styles.summaryValue, { color: '#10b981' }]}>FREE</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: isDark ? '#1a2647' : '#e2e8f0' }]} />
                  <View style={styles.summaryRow}>
                    <Text style={[styles.totalLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      Total Amount
                    </Text>
                    <Text style={[styles.totalValue, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                      ₹{cartSubtotalINR.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Sticky Checkout CTA */}
              <View
                style={[
                  styles.checkoutStickyBar,
                  {
                    backgroundColor: isDark ? '#0b1329' : '#ffffff',
                    borderTopColor: isDark ? '#1a2647' : '#e2e8f0',
                    paddingBottom: Math.max(insets.bottom, 16),
                  },
                ]}
              >
                <View>
                  <Text style={[styles.barTotalLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Total</Text>
                  <Text style={[styles.barTotalValue, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                    ₹{cartSubtotalINR.toLocaleString('en-IN')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.proceedCheckoutBtn}
                  onPress={() => setCheckoutVisible(true)}
                >
                  <Text style={styles.proceedCheckoutText}>Proceed to Checkout</Text>
                  <ChevronRight size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 3. CHECKOUT MODAL                                        */}
      {/* ======================================================== */}
      <Modal
        visible={checkoutVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? '#050a18' : '#f8fafc', paddingTop: insets.top },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <TouchableOpacity onPress={() => setCheckoutVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ArrowLeft size={22} color={isDark ? '#ffffff' : '#0f172a'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
              Campus Handover Details
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.checkoutScroll}>
            {/* Delivery / Contact Details */}
            <View
              style={[
                styles.checkoutCard,
                { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
              ]}
            >
              <Text style={[styles.checkoutCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                1. Handover Contact Phone
              </Text>
              <Text style={[styles.checkoutHelper, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                The seller will call or WhatsApp this number to confirm the pickup timing.
              </Text>
              <View
                style={[
                  styles.checkoutInputRow,
                  { backgroundColor: isDark ? '#050a18' : '#f1f5f9', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
              >
                <Phone size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                <TextInput
                  style={[styles.checkoutTextInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                  placeholder="e.g. +91 9876543210"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={checkoutPhone}
                  onChangeText={setCheckoutPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Pickup Location */}
            <View
              style={[
                styles.checkoutCard,
                { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
              ]}
            >
              <Text style={[styles.checkoutCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                2. Preferred Campus Pickup Spot
              </Text>
              <View
                style={[
                  styles.checkoutInputRow,
                  { backgroundColor: isDark ? '#050a18' : '#f1f5f9', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
              >
                <MapPin size={18} color="#38bdf8" />
                <TextInput
                  style={[styles.checkoutTextInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                  placeholder="e.g. Library Entrance / Hostel 12 Gate"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={checkoutLocation}
                  onChangeText={setCheckoutLocation}
                />
              </View>
              {/* Quick Preset Location Chips */}
              <View style={styles.locationChipRow}>
                {['Library Front', 'Hostel Gate', 'Central Canteen'].map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.locChip,
                      { backgroundColor: isDark ? '#111827' : '#f1f5f9', borderColor: isDark ? '#1e293b' : '#cbd5e1' },
                    ]}
                    onPress={() => setCheckoutLocation(loc)}
                  >
                    <Text style={[styles.locChipText, { color: isDark ? '#cbd5e1' : '#475569' }]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Method */}
            <View
              style={[
                styles.checkoutCard,
                { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
              ]}
            >
              <Text style={[styles.checkoutCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                3. Payment Method
              </Text>
              <Text style={[styles.checkoutHelper, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Safe campus settlement: Pay only when you meet and inspect the product in person.
              </Text>

              <TouchableOpacity
                style={[
                  styles.paymentChoiceCard,
                  checkoutPaymentMethod === 'Cash on Pickup' && styles.paymentChoiceActive,
                  { backgroundColor: isDark ? '#050a18' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
                onPress={() => setCheckoutPaymentMethod('Cash on Pickup')}
              >
                <View style={styles.paymentRadio}>
                  {checkoutPaymentMethod === 'Cash on Pickup' && <View style={styles.paymentRadioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Cash on Campus Handover
                  </Text>
                  <Text style={[styles.paymentSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Hand over physical cash to the student seller after verifying condition.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentChoiceCard,
                  checkoutPaymentMethod === 'UPI at Pickup' && styles.paymentChoiceActive,
                  { backgroundColor: isDark ? '#050a18' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
                onPress={() => setCheckoutPaymentMethod('UPI at Pickup')}
              >
                <View style={styles.paymentRadio}>
                  {checkoutPaymentMethod === 'UPI at Pickup' && <View style={styles.paymentRadioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    UPI at Handover
                  </Text>
                  <Text style={[styles.paymentSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Scan the seller's GPay/PhonePe/Paytm QR code during the campus meetup.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Note to Seller */}
            <View
              style={[
                styles.checkoutCard,
                { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
              ]}
            >
              <Text style={[styles.checkoutCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                4. Note to Seller (Optional)
              </Text>
              <TextInput
                style={[
                  styles.checkoutTextArea,
                  {
                    backgroundColor: isDark ? '#050a18' : '#f1f5f9',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                  },
                ]}
                placeholder="e.g. Free after 4:30 PM lab; meet near front stairs."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={checkoutNote}
                onChangeText={setCheckoutNote}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Confirm Button */}
          <View
            style={[
              styles.checkoutStickyBar,
              {
                backgroundColor: isDark ? '#0b1329' : '#ffffff',
                borderTopColor: isDark ? '#1a2647' : '#e2e8f0',
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View>
              <Text style={[styles.barTotalLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Payable</Text>
              <Text style={[styles.barTotalValue, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                ₹{cartSubtotalINR.toLocaleString('en-IN')}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmOrderBtn, isPlacingOrder && { opacity: 0.7 }]}
              onPress={handlePlaceOrder}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={18} color="#ffffff" strokeWidth={2.5} />
                  <Text style={styles.confirmOrderText}>Place Campus Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 4. ORDERS & SELLER HUB MODAL                             */}
      {/* ======================================================== */}
      <Modal
        visible={ordersVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setOrdersVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? '#050a18' : '#f8fafc', paddingTop: insets.top },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <TouchableOpacity onPress={() => setOrdersVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ArrowLeft size={22} color={isDark ? '#ffffff' : '#0f172a'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
              Orders & Seller Hub
            </Text>
            <TouchableOpacity onPress={loadMarketData}>
              <RefreshCw size={18} color={isDark ? '#38bdf8' : '#0284c7'} />
            </TouchableOpacity>
          </View>

          {/* Segment Tabs */}
          <View style={styles.hubTabRow}>
            <TouchableOpacity
              style={[
                styles.hubTabItem,
                ordersActiveTab === 'purchases' && styles.hubTabActive,
                { borderBottomColor: ordersActiveTab === 'purchases' ? '#38bdf8' : 'transparent' },
              ]}
              onPress={() => setOrdersActiveTab('purchases')}
            >
              <Text
                style={[
                  styles.hubTabText,
                  { color: ordersActiveTab === 'purchases' ? '#38bdf8' : isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                My Purchases ({buyerOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.hubTabItem,
                ordersActiveTab === 'seller' && styles.hubTabActive,
                { borderBottomColor: ordersActiveTab === 'seller' ? '#38bdf8' : 'transparent' },
              ]}
              onPress={() => setOrdersActiveTab('seller')}
            >
              <Text
                style={[
                  styles.hubTabText,
                  { color: ordersActiveTab === 'seller' ? '#38bdf8' : isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                Seller Hub ({sellerOrders.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.hubScroll}>
            {ordersActiveTab === 'purchases' ? (
              buyerOrders.length === 0 ? (
                <View style={styles.emptyHubBox}>
                  <Package size={48} color={isDark ? '#334155' : '#cbd5e1'} />
                  <Text style={[styles.emptyHubTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    No Purchases Yet
                  </Text>
                  <Text style={[styles.emptyHubSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Orders you place on KAMPUS Market will show up here for live handover tracking.
                  </Text>
                </View>
              ) : (
                buyerOrders.map((order) => {
                  const statusColors: Record<string, string> = {
                    Pending: '#f59e0b',
                    Accepted: '#38bdf8',
                    'Ready for Pickup': '#a855f7',
                    Completed: '#10b981',
                    Cancelled: '#ef4444',
                    Rejected: '#64748b',
                  };
                  const color = statusColors[order.status] || '#64748b';

                  return (
                    <View
                      key={order.id}
                      style={[
                        styles.orderCard,
                        { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
                      ]}
                    >
                      <View style={styles.orderCardHeader}>
                        <View>
                          <Text style={[styles.orderIdText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            ORDER #{order.id.slice(-6).toUpperCase()}
                          </Text>
                          <Text style={[styles.orderDateText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
                          <Text style={[styles.statusBadgeText, { color }]}>{order.status}</Text>
                        </View>
                      </View>

                      {/* Items */}
                      <View style={styles.orderItemsList}>
                        {order.items.map((it, idx) => (
                          <View key={idx} style={styles.orderItemRow}>
                            <Text
                              style={[styles.orderItemTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                              numberOfLines={1}
                            >
                              {it.title} × {it.quantity}
                            </Text>
                            <Text style={[styles.orderItemPrice, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                              {it.priceINR ? `₹${(it.priceINR * it.quantity).toLocaleString('en-IN')}` : 'FREE'}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Handover Details */}
                      <View style={[styles.orderDetailBox, { backgroundColor: isDark ? '#050a18' : '#f8fafc' }]}>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailKey, { color: isDark ? '#94a3b8' : '#64748b' }]}>Seller:</Text>
                          <Text style={[styles.detailVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            {order.sellerName}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailKey, { color: isDark ? '#94a3b8' : '#64748b' }]}>Meetup Spot:</Text>
                          <Text style={[styles.detailVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            {order.pickupLocation}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailKey, { color: isDark ? '#94a3b8' : '#64748b' }]}>Payment:</Text>
                          <Text style={[styles.detailVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                            {order.paymentMethod} ({order.paymentStatus})
                          </Text>
                        </View>
                      </View>

                      {/* Buyer Actions */}
                      {order.status === 'Pending' && (
                        <TouchableOpacity
                          style={[styles.cancelOrderBtn, updatingOrderId === order.id && { opacity: 0.6 }]}
                          onPress={() => handleUpdateOrderStatus(order.id, 'Cancelled')}
                          disabled={updatingOrderId === order.id}
                        >
                          <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )
            ) : (
              // Seller Hub Tab
              <View>
                <Text style={[styles.sellerSectionHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  Incoming Orders ({sellerOrders.length})
                </Text>
                {sellerOrders.length === 0 ? (
                  <View style={styles.emptyHubBox}>
                    <Package size={48} color={isDark ? '#334155' : '#cbd5e1'} />
                    <Text style={[styles.emptyHubTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      No Orders Received Yet
                    </Text>
                    <Text style={[styles.emptyHubSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      When other students order your listings, their requests will appear here.
                    </Text>
                  </View>
                ) : (
                  sellerOrders.map((order) => {
                    const isUpdating = updatingOrderId === order.id;

                    return (
                      <View
                        key={order.id}
                        style={[
                          styles.orderCard,
                          { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
                        ]}
                      >
                        <View style={styles.orderCardHeader}>
                          <View>
                            <Text style={[styles.orderIdText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                              BUYER: {order.buyerName}
                            </Text>
                            <Text style={[styles.orderDateText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                              Phone: {order.buyerPhone || 'Not provided'}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                            <Text style={[styles.statusBadgeText, { color: '#38bdf8' }]}>{order.status}</Text>
                          </View>
                        </View>

                        {/* Items */}
                        <View style={styles.orderItemsList}>
                          {order.items.map((it, idx) => (
                            <View key={idx} style={styles.orderItemRow}>
                              <Text
                                style={[styles.orderItemTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                                numberOfLines={1}
                              >
                                {it.title} × {it.quantity}
                              </Text>
                              <Text style={[styles.orderItemPrice, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                                {it.priceINR ? `₹${(it.priceINR * it.quantity).toLocaleString('en-IN')}` : 'FREE'}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {/* Handover Details */}
                        <View style={[styles.orderDetailBox, { backgroundColor: isDark ? '#050a18' : '#f8fafc' }]}>
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailKey, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                              Meetup Location:
                            </Text>
                            <Text style={[styles.detailVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                              {order.pickupLocation}
                            </Text>
                          </View>
                          {order.buyerNote ? (
                            <View style={styles.detailRow}>
                              <Text style={[styles.detailKey, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                Buyer Note:
                              </Text>
                              <Text style={[styles.detailVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                                {order.buyerNote}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Seller Action Buttons */}
                        <View style={styles.sellerActionsRow}>
                          {order.status === 'Pending' && (
                            <>
                              <TouchableOpacity
                                style={[styles.acceptOrderBtn, isUpdating && { opacity: 0.6 }]}
                                onPress={() => handleUpdateOrderStatus(order.id, 'Accepted')}
                                disabled={isUpdating}
                              >
                                <Check size={16} color="#ffffff" />
                                <Text style={styles.acceptOrderText}>Accept Order</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.rejectOrderBtn, isUpdating && { opacity: 0.6 }]}
                                onPress={() => handleUpdateOrderStatus(order.id, 'Rejected')}
                                disabled={isUpdating}
                              >
                                <X size={16} color="#ef4444" />
                                <Text style={styles.rejectOrderText}>Decline</Text>
                              </TouchableOpacity>
                            </>
                          )}

                          {order.status === 'Accepted' && (
                            <TouchableOpacity
                              style={[styles.readyOrderBtn, isUpdating && { opacity: 0.6 }]}
                              onPress={() => handleUpdateOrderStatus(order.id, 'Ready for Pickup')}
                              disabled={isUpdating}
                            >
                              <Package size={16} color="#ffffff" />
                              <Text style={styles.readyOrderText}>Mark Ready for Meetup</Text>
                            </TouchableOpacity>
                          )}

                          {order.status === 'Ready for Pickup' && (
                            <TouchableOpacity
                              style={[styles.completeOrderBtn, isUpdating && { opacity: 0.6 }]}
                              onPress={() => handleUpdateOrderStatus(order.id, 'Completed')}
                              disabled={isUpdating}
                            >
                              <CheckCircle2 size={16} color="#ffffff" />
                              <Text style={styles.completeOrderText}>Complete Handover & Mark Sold</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}

                {/* My Listings Section */}
                <Text style={[styles.sellerSectionHeading, { color: isDark ? '#f8fafc' : '#0f172a', marginTop: 24 }]}>
                  My Active Listings ({myListings.length})
                </Text>
                {myListings.map((l) => (
                  <View
                    key={l.id}
                    style={[
                      styles.myListingCard,
                      { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
                    ]}
                  >
                    <Image
                      source={{ uri: MarketApi.resolveImageUrl(l.images[0]) }}
                      style={styles.myListingImg}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[styles.myListingTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                        numberOfLines={1}
                      >
                        {l.title}
                      </Text>
                      <Text style={[styles.myListingPrice, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                        {l.priceINR ? `₹${l.priceINR.toLocaleString('en-IN')}` : 'FREE'} • {l.status}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.myListingManageBtn}
                      onPress={() => {
                        setOrdersVisible(false);
                        setSelectedListing(l);
                      }}
                    >
                      <Text style={styles.myListingManageText}>Manage</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 5. "SELL ON KAMPUS" MODAL                                */}
      {/* ======================================================== */}
      <Modal
        visible={sellModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSellModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? '#050a18' : '#f8fafc', paddingTop: insets.top },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
            <TouchableOpacity onPress={() => setSellModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ArrowLeft size={22} color={isDark ? '#ffffff' : '#0f172a'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
              List Item on KAMPUS
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.sellFormScroll}>
            {/* Photos Section */}
            <View
              style={[
                styles.sellCard,
                { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
              ]}
            >
              <Text style={[styles.sellCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                1. Item Photo
              </Text>
              <Text style={[styles.sellCardSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Upload a real photo from your device or choose a representative student stock image.
              </Text>

              {/* Upload Button */}
              <TouchableOpacity
                style={[
                  styles.uploadPhotoBtn,
                  { borderColor: isDark ? '#1e293b' : '#cbd5e1', backgroundColor: isDark ? '#050a18' : '#f1f5f9' },
                ]}
                onPress={handlePickListingPhoto}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="#38bdf8" />
                ) : (
                  <>
                    <Camera size={22} color="#38bdf8" />
                    <Text style={[styles.uploadPhotoText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Pick Photo from Gallery / Camera
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Stock Photo Presets */}
              <Text style={[styles.presetLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Or select stock template:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
                {STOCK_IMAGE_PRESETS.map((pst) => (
                  <TouchableOpacity
                    key={pst.id}
                    style={[
                      styles.presetChip,
                      sellImages[0] === pst.key && styles.presetChipActive,
                      { backgroundColor: isDark ? '#111827' : '#f1f5f9', borderColor: isDark ? '#1f2937' : '#e2e8f0' },
                    ]}
                    onPress={() => setSellImages([pst.key])}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        { color: sellImages[0] === pst.key ? '#38bdf8' : isDark ? '#cbd5e1' : '#475569' },
                      ]}
                    >
                      {pst.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Listing Type & Details */}
            <View
              style={[
                styles.sellCard,
                { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
              ]}
            >
              <Text style={[styles.sellCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                2. Listing Details
              </Text>

              {/* Type Switcher */}
              <View style={styles.sellTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.sellTypeOption,
                    sellType === 'For Sale' && styles.sellTypeOptionActive,
                    { borderColor: isDark ? '#1e293b' : '#e2e8f0' },
                  ]}
                  onPress={() => setSellType('For Sale')}
                >
                  <Tag size={16} color={sellType === 'For Sale' ? '#38bdf8' : (isDark ? '#94a3b8' : '#64748b')} />
                  <Text
                    style={[
                      styles.sellTypeText,
                      { color: sellType === 'For Sale' ? '#38bdf8' : (isDark ? '#cbd5e1' : '#475569') },
                    ]}
                  >
                    For Sale
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sellTypeOption,
                    sellType === 'Giveaway' && styles.sellTypeOptionActive,
                    { borderColor: isDark ? '#1e293b' : '#e2e8f0' },
                  ]}
                  onPress={() => setSellType('Giveaway')}
                >
                  <Gift size={16} color={sellType === 'Giveaway' ? '#10b981' : (isDark ? '#94a3b8' : '#64748b')} />
                  <Text
                    style={[
                      styles.sellTypeText,
                      { color: sellType === 'Giveaway' ? '#10b981' : (isDark ? '#cbd5e1' : '#475569') },
                    ]}
                  >
                    Free Donation
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Title Input */}
              <Text style={[styles.fieldLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>Item Title *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  { backgroundColor: isDark ? '#050a18' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#cbd5e1', color: isDark ? '#f8fafc' : '#0f172a' },
                ]}
                placeholder="e.g. Higher Engineering Mathematics by B.S. Grewal (44th Ed)"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={sellTitle}
                onChangeText={setSellTitle}
              />

              {/* Category Picker */}
              <Text style={[styles.fieldLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categorySelectScroll}>
                {CATEGORIES.filter((c) => c.value !== 'All').map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.catSelectChip,
                      sellCategory === cat.value && styles.catSelectChipActive,
                      { backgroundColor: isDark ? '#050a18' : '#f1f5f9', borderColor: isDark ? '#1e293b' : '#cbd5e1' },
                    ]}
                    onPress={() => setSellCategory(cat.value as MarketCategory)}
                  >
                    <Text
                      style={[
                        styles.catSelectText,
                        { color: sellCategory === cat.value ? '#38bdf8' : isDark ? '#cbd5e1' : '#475569' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Condition Picker */}
              <Text style={[styles.fieldLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>Condition *</Text>
              <View style={styles.conditionRow}>
                {(['Brand New', 'Like New', 'Good', 'Fair'] as MarketCondition[]).map((cond) => (
                  <TouchableOpacity
                    key={cond}
                    style={[
                      styles.condChip,
                      sellCondition === cond && styles.condChipActive,
                      { backgroundColor: isDark ? '#050a18' : '#f1f5f9', borderColor: isDark ? '#1e293b' : '#cbd5e1' },
                    ]}
                    onPress={() => setSellCondition(cond)}
                  >
                    <Text
                      style={[
                        styles.condText,
                        { color: sellCondition === cond ? '#38bdf8' : isDark ? '#cbd5e1' : '#475569' },
                      ]}
                    >
                      {cond}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pricing Inputs */}
              {sellType === 'For Sale' && (
                <View style={styles.priceInputsRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.fieldLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>Selling Price (₹) *</Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        { backgroundColor: isDark ? '#050a18' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#cbd5e1', color: isDark ? '#f8fafc' : '#0f172a' },
                      ]}
                      placeholder="e.g. 450"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      value={sellPrice}
                      onChangeText={setSellPrice}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.fieldLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>Original MRP (₹)</Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        { backgroundColor: isDark ? '#050a18' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#cbd5e1', color: isDark ? '#f8fafc' : '#0f172a' },
                      ]}
                      placeholder="e.g. 950"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      value={sellOriginalPrice}
                      onChangeText={setSellOriginalPrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {/* Description */}
              <Text style={[styles.fieldLabel, { color: isDark ? '#cbd5e1' : '#334155' }]}>Honest Description *</Text>
              <TextInput
                style={[
                  styles.formTextArea,
                  { backgroundColor: isDark ? '#050a18' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#cbd5e1', color: isDark ? '#f8fafc' : '#0f172a' },
                ]}
                placeholder="Include details about marks, highlights, accessories included, and history of the item..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={sellDescription}
                onChangeText={setSellDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Handover Spot */}
            <View
              style={[
                styles.sellCard,
                { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
              ]}
            >
              <Text style={[styles.sellCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                3. Campus Handover Location
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  { backgroundColor: isDark ? '#050a18' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#cbd5e1', color: isDark ? '#f8fafc' : '#0f172a' },
                ]}
                placeholder="e.g. Hostel 12 Mess / Main Library Gate"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={sellPickupPoint}
                onChangeText={setSellPickupPoint}
              />
            </View>
          </ScrollView>

          {/* Sticky Submit Bar */}
          <View
            style={[
              styles.checkoutStickyBar,
              {
                backgroundColor: isDark ? '#0b1329' : '#ffffff',
                borderTopColor: isDark ? '#1a2647' : '#e2e8f0',
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.publishListingBtn, isPublishing && { opacity: 0.7 }]}
              onPress={handlePublishListing}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={18} color="#ffffff" strokeWidth={2.5} />
                  <Text style={styles.publishListingText}>Publish Listing Live</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 6. CAMPUS LOCATION PICKER MODAL                          */}
      {/* ======================================================== */}
      <Modal
        visible={campusPickerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCampusPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setCampusPickerVisible(false)}
        >
          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: isDark ? '#0b1329' : '#ffffff', borderColor: isDark ? '#1a2647' : '#e2e8f0' },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Select Campus Location
            </Text>
            {CAMPUS_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.pickerItem,
                  selectedCampus === loc && styles.pickerItemActive,
                  { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' },
                ]}
                onPress={() => {
                  setSelectedCampus(loc);
                  setCampusPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    {
                      color: selectedCampus === loc ? '#38bdf8' : isDark ? '#cbd5e1' : '#334155',
                      fontWeight: selectedCampus === loc ? '700' : '500',
                    },
                  ]}
                >
                  {loc}
                </Text>
                {selectedCampus === loc && <Check size={16} color="#38bdf8" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Clean, Modern Styles inspired by Flipkart / Amazon
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  campusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 3,
  },
  campusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284c7',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
  },
  sellBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  typeToggleGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  typeToggleItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeToggleActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  typeToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyCtaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#1e293b',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  conditionBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  cardWishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOverlayText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cardBody: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    marginBottom: 6,
    minHeight: 34,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceWithDiscount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  originalPrice: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  freeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 10,
    flex: 1,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // PDP Styles
  pdpContainer: {
    flex: 1,
  },
  pdpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pdpBackBtn: {
    paddingRight: 12,
  },
  pdpHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  pdpHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pdpIconBtn: {
    padding: 4,
  },
  pdpScroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  pdpImageWrapper: {
    width: '100%',
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1e293b',
  },
  pdpImage: {
    width: '100%',
    height: '100%',
  },
  pdpConditionTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pdpConditionTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  pdpSoldBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  pdpSoldBannerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  pdpCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  pdpCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pdpCategoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deliveryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  pdpTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 12,
  },
  pdpPriceContainer: {
    marginTop: 4,
  },
  pdpPriceWithMrp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdpPrice: {
    fontSize: 26,
    fontWeight: '900',
  },
  mrpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pdpMrp: {
    fontSize: 15,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  pdpDiscount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pdpPriceFree: {
    fontSize: 22,
    fontWeight: '900',
  },
  pdpSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  pdpDescriptionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  pdpLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pdpLocationTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pdpLocationCampus: {
    fontSize: 12,
    marginTop: 2,
  },
  safetyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 10,
    borderRadius: 10,
  },
  safetyNoticeText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    flex: 1,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
  },
  sellerCollege: {
    fontSize: 12,
    marginTop: 2,
  },
  pdpBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  pdpBuyerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pdpAddToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  pdpAddToCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284c7',
  },
  pdpBuyNowBtn: {
    flex: 1.2,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
  },
  pdpBuyNowText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  pdpOwnerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pdpOwnerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
  },
  pdpOwnerBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  soldNoticeBar: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  soldNoticeBarText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },

  // Modal Common Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  clearCartText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },

  // Cart Modal Styles
  emptyCartBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyCartTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCartSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  browseBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  browseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cartList: {
    padding: 16,
    gap: 12,
  },
  cartItemCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  cartItemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cartItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  cartItemSeller: {
    fontSize: 11,
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cartDeleteBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  orderSummaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 10,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  checkoutStickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  barTotalLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  barTotalValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  proceedCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    height: 46,
    borderRadius: 14,
  },
  proceedCheckoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Checkout Modal Styles
  checkoutScroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  checkoutCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  checkoutCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  checkoutHelper: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkoutInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  checkoutTextInput: {
    flex: 1,
    fontSize: 14,
  },
  locationChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  locChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  locChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paymentChoiceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentChoiceActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  paymentRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  paymentRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  paymentSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  checkoutTextArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  confirmOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 22,
    height: 46,
    borderRadius: 14,
  },
  confirmOrderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Orders & Hub Styles
  hubTabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  hubTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  hubTabActive: {},
  hubTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  hubScroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  emptyHubBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyHubTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyHubSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  orderCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderDateText: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  orderItemsList: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  orderDetailBox: {
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailKey: {
    fontSize: 11,
  },
  detailVal: {
    fontSize: 11,
    fontWeight: '600',
  },
  cancelOrderBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  cancelOrderBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  sellerSectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  sellerActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptOrderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptOrderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectOrderBtn: {
    flex: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 8,
    borderRadius: 10,
  },
  rejectOrderText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  readyOrderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#a855f7',
    paddingVertical: 10,
    borderRadius: 10,
  },
  readyOrderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  completeOrderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
  },
  completeOrderText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  myListingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  myListingImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  myListingTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  myListingPrice: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  myListingManageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 8,
  },
  myListingManageText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },

  // Sell Form Styles
  sellFormScroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  sellCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  sellCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sellCardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  uploadPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  uploadPhotoText: {
    fontSize: 13,
    fontWeight: '700',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  presetScroll: {
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sellTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sellTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sellTypeOptionActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  sellTypeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  formInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
  },
  categorySelectScroll: {
    gap: 6,
    paddingVertical: 4,
  },
  catSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  catSelectChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  catSelectText: {
    fontSize: 11,
    fontWeight: '600',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  condChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  condChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  condText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceInputsRow: {
    flexDirection: 'row',
  },
  formTextArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  publishListingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    height: 48,
    borderRadius: 14,
  },
  publishListingText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  // Location Picker Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pickerContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    maxHeight: 400,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pickerItemActive: {},
  pickerItemText: {
    fontSize: 13,
  },
});
