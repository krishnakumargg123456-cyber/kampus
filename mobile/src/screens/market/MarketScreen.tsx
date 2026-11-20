import React, { useState } from 'react';
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
} from 'react-native';
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
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const MarketScreen = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<'All' | 'Books' | 'Electronics' | 'Hostel' | 'Free'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedListings, setSavedListings] = useState<string[]>(['item_1']);
  const [sellModalVisible, setSellModalVisible] = useState(false);

  // Form states for listing item
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState('Used Books');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCondition, setItemCondition] = useState('Like New');

  const MARKET_ITEMS = [
    {
      id: 'item_1',
      title: 'Introduction to Algorithms (CLRS 4th Edition)',
      category: 'Books',
      price: '₹750',
      originalPrice: '₹1,800',
      condition: 'Like New (Unmarked)',
      seller: 'Kavita Joshi (Year 3)',
      college: 'Hostel 12, IIT Bombay',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'item_2',
      title: 'Casio fx-991EX Scientific Calculator (ClassWiz)',
      category: 'Electronics',
      price: '₹850',
      originalPrice: '₹1,500',
      condition: 'Excellent Working State',
      seller: 'Deepak Rao (Year 2)',
      college: 'Hostel 15, IIT Bombay',
      image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'item_3',
      title: 'Engineering Mini Drafter + Drawing Board with Clips',
      category: 'Hostel',
      price: '₹350',
      originalPrice: '₹950',
      condition: 'Good',
      seller: 'Aryan S.',
      college: 'Hostel 3, IIT Bombay',
      image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'item_4',
      title: 'Gate Previous 15 Years Physics & Maths Pocket Notes',
      category: 'Free',
      price: 'FREE',
      originalPrice: '₹0',
      condition: 'Handwritten',
      seller: 'Priya Sharma (Year 4)',
      college: 'Campus Library Pickup',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const toggleSave = (id: string) => {
    setSavedListings((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSellSubmit = () => {
    if (!itemTitle.trim() || !itemPrice.trim()) {
      Alert.alert('Incomplete Fields', 'Please specify an item title and price.');
      return;
    }
    setSellModalVisible(false);
    setItemTitle('');
    setItemPrice('');
    Alert.alert('Listing Active', 'Your product has been published to the student marketplace.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>KAMPUS Market</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Student-to-Student Buy, Sell & Free Corner
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.sellBtn, { backgroundColor: colors.primary }]}
          onPress={() => setSellModalVisible(true)}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.sellBtnText}>Sell Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search books, drafters, calculators, cycles..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {['All', 'Books', 'Electronics', 'Hostel', 'Free'].map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveCategory(cat as any)}
              >
                <Text style={[styles.catText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {cat === 'Free' ? 'Free Corner' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Safety Disclaimer Banner */}
        <View style={[styles.safetyBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <ShieldCheck size={18} color={colors.success} />
          <Text style={[styles.safetyText, { color: colors.textSecondary }]}>
            Meet safely in designated campus public spots (Library, Cafeteria). Never transfer money upfront.
          </Text>
        </View>

        {/* Product Cards Grid */}
        <View style={styles.itemsGrid}>
          {MARKET_ITEMS.map((item) => {
            const isSaved = savedListings.includes(item.id);
            return (
              <View
                key={item.id}
                style={[
                  styles.productCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  Shadows.card,
                ]}
              >
                <View style={styles.productImgWrapper}>
                  <Image source={{ uri: item.image }} style={styles.productImg} />
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: colors.surface }]}
                    onPress={() => toggleSave(item.id)}
                  >
                    <Bookmark
                      size={16}
                      color={isSaved ? colors.primary : colors.textMuted}
                      fill={isSaved ? colors.primary : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.productDetails}>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceText, { color: item.price === 'FREE' ? colors.success : colors.text }]}>
                      {item.price}
                    </Text>
                    {item.price !== 'FREE' && (
                      <Text style={[styles.origPrice, { color: colors.textMuted }]}>{item.originalPrice}</Text>
                    )}
                  </View>

                  <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.conditionText, { color: colors.textMuted }]}>{item.condition}</Text>

                  <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                    <Text style={[styles.sellerInfo, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.seller}
                    </Text>
                    <TouchableOpacity
                      style={[styles.chatSellerBtn, { backgroundColor: colors.primaryLight }]}
                      onPress={() => Alert.alert('Chat Initiated', `Opening direct message with ${item.seller}`)}
                    >
                      <MessageCircle size={14} color={colors.primary} />
                      <Text style={[styles.chatSellerText, { color: colors.primary }]}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sell Modal */}
      <Modal visible={sellModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>List an Item on Market</Text>
              <TouchableOpacity onPress={() => setSellModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Product Title</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Casio fx-991EX Calculator"
              placeholderTextColor={colors.textMuted}
              value={itemTitle}
              onChangeText={setItemTitle}
            />

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.sm }]}>Selling Price (₹)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. 500 (or enter 0 for Free Corner)"
              placeholderTextColor={colors.textMuted}
              value={itemPrice}
              onChangeText={setItemPrice}
              keyboardType="number-pad"
            />

            <View style={[styles.photoBox, { borderColor: colors.primary, backgroundColor: colors.primaryLight + '30' }]}>
              <Camera size={24} color={colors.primary} />
              <Text style={[styles.photoText, { color: colors.primary }]}>Add Product Photos (Max 3)</Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmListingBtn, { backgroundColor: colors.primary }]}
              onPress={handleSellSubmit}
            >
              <Text style={styles.confirmListingText}>Publish Listing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  sellBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  catRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.md,
  },
  safetyText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  itemsGrid: {
    gap: Spacing.md,
  },
  productCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  productImgWrapper: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  saveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    padding: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
  },
  origPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 11,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  sellerInfo: {
    fontSize: 11,
    flex: 1,
  },
  chatSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  chatSellerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    fontSize: 14,
  },
  photoBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: 4,
  },
  photoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmListingBtn: {
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  confirmListingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
