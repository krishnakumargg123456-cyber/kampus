import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import {
  GraduationCap,
  Search,
  Star,
  MapPin,
  Building,
  Award,
  Bookmark,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const CollegeExplorerScreen = () => {
  const { colors, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'IIT' | 'NIT' | 'BITS' | 'State'>('All');
  const [shortlisted, setShortlisted] = useState<string[]>(['col_1']);

  const COLLEGES = [
    {
      id: 'col_1',
      name: 'Indian Institute of Technology, Bombay',
      state: 'Maharashtra',
      city: 'Powai, Mumbai',
      nirf: 3,
      rating: 4.9,
      established: 1958,
      type: 'IIT',
      courses: ['B.Tech CS', 'AI & Data Science', 'Dual Degree', 'M.Tech'],
      fees: '₹2.4L / year',
      medianPackage: '₹21.8 LPA',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'col_2',
      name: 'Indian Institute of Technology, Delhi',
      state: 'Delhi NCR',
      city: 'Hauz Khas, New Delhi',
      nirf: 2,
      rating: 4.9,
      established: 1961,
      type: 'IIT',
      courses: ['B.Tech CSE', 'Electrical', 'Math & Computing'],
      fees: '₹2.35L / year',
      medianPackage: '₹22.5 LPA',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'col_3',
      name: 'BITS Pilani (Pilani Campus)',
      state: 'Rajasthan',
      city: 'Pilani, Vidya Vihar',
      nirf: 25,
      rating: 4.8,
      established: 1964,
      type: 'BITS',
      courses: ['B.E. Computer Science', 'Economics', 'Electronics'],
      fees: '₹5.4L / year',
      medianPackage: '₹19.2 LPA',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const toggleShortlist = (id: string) => {
    setShortlisted((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>College Explorer</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Colleges Directory, NIRF Rankings & Admission Guides
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search colleges by name, state or degree..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {['All', 'IIT', 'NIT', 'BITS', 'State'].map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedFilter(filter as any)}
              >
                <Text style={[styles.filterText, { color: isSelected ? '#ffffff' : colors.textSecondary }]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Colleges List */}
        {COLLEGES.map((col) => {
          const isSaved = shortlisted.includes(col.id);
          return (
            <View
              key={col.id}
              style={[
                styles.collegeCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                Shadows.card,
              ]}
            >
              <View style={styles.imageWrapper}>
                <Image source={{ uri: col.image }} style={styles.collegeImage} />
                <View style={[styles.nirfBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.nirfText}>NIRF #{col.nirf}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.bookmarkBtn, { backgroundColor: colors.surface }]}
                  onPress={() => toggleShortlist(col.id)}
                >
                  <Bookmark
                    size={18}
                    color={isSaved ? colors.primary : colors.textMuted}
                    fill={isSaved ? colors.primary : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.collegeContent}>
                <View style={styles.collegeNameRow}>
                  <Text style={[styles.collegeName, { color: colors.text }]}>{col.name}</Text>
                </View>

                <View style={styles.locationRow}>
                  <MapPin size={13} color={colors.textMuted} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                    {col.city}, {col.state}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>{col.rating}</Text>
                  </View>
                </View>

                {/* Key Metrics */}
                <View style={[styles.metricsGrid, { backgroundColor: colors.surfaceElevated }]}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Fees (Approx)</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>{col.fees}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Median CTC</Text>
                    <Text style={[styles.metricValue, { color: colors.success }]}>{col.medianPackage}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Est. Year</Text>
                    <Text style={[styles.metricValue, { color: colors.text }]}>{col.established}</Text>
                  </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                  <TouchableOpacity
                    style={[styles.compareBtn, { borderColor: colors.border }]}
                    onPress={() => Alert.alert('Compare Tool', `Added ${col.name} to side-by-side comparison matrix.`)}
                  >
                    <Text style={[styles.compareBtnText, { color: colors.textSecondary }]}>Compare</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.viewDetailsBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Alert.alert('College Profile', `Opening official overview and cutoffs for ${col.name}`)}
                  >
                    <Text style={styles.viewDetailsText}>View Profile</Text>
                    <ArrowRight size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  collegeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  imageWrapper: {
    position: 'relative',
    height: 130,
    width: '100%',
  },
  collegeImage: {
    width: '100%',
    height: '100%',
  },
  nirfBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  nirfText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collegeContent: {
    padding: Spacing.md,
  },
  collegeNameRow: {
    marginBottom: 4,
  },
  collegeName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  locationText: {
    fontSize: 12,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  compareBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetailsBtn: {
    flex: 2,
    height: 38,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewDetailsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
