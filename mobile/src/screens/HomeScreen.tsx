import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import {
  BookOpen,
  Bot,
  Users,
  Calendar,
  Briefcase,
  GraduationCap,
  Store,
  CheckSquare,
  CreditCard,
  Settings,
  Bell,
  Search,
  Scan,
  MapPin,
  Clock,
  ArrowRight,
  Zap,
  Star,
  FileText,
  FileEdit,
  Check,
  Lock,
  BarChart2,
  Award,
  Crown,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? colors.background : '#f8fafc' }}>
      {/* 1. TOP HEADER (Logo + Title + Tagline + Notification with badge + Avatar with green dot) */}
      <View style={[styles.topHeader, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
        <View style={styles.headerLeft}>
          {/* Logo Mark: Graduation cap + stylish K */}
          <View style={styles.logoMarkContainer}>
            <View style={styles.logoCap}>
              <GraduationCap size={18} color="#2563eb" />
            </View>
            <Text style={styles.logoLetterK}>K</Text>
          </View>
          <View style={styles.brandTitleCol}>
            <Text style={[styles.brandTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>KAMPUS</Text>
            <Text style={[styles.brandTagline, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Your Student Life, Connected.
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Notification Bell with Red Badge "3" */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('More', { screen: 'Notifications' })}
            activeOpacity={0.7}
          >
            <Bell size={22} color={isDark ? '#cbd5e1' : '#1e293b'} />
            <View style={styles.redBadge}>
              <Text style={styles.redBadgeText}>3</Text>
            </View>
          </TouchableOpacity>

          {/* Student Profile Avatar with Online Dot */}
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate('KampusId')}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              }}
              style={styles.avatarImage}
            />
            <View style={styles.greenOnlineDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. SEARCH BAR (Pill shape with Search icon & QR Scan icon) */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#ffffff' : '#0f172a' }]}
            placeholder="Search notes, events, or anything..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('KampusId')}
            activeOpacity={0.7}
          >
            <Scan size={18} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* 3. HERO BANNER CAROUSEL CARD */}
        <View style={styles.heroCard}>
          <Image
            source={{
              uri:
                'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Left Dark Gradient Overlay */}
          <View style={styles.heroGradientOverlay}>
            {/* Top Right KAMPUS Crown Badge */}
            <View style={styles.crownBadge}>
              <Crown size={12} color="#facc15" fill="#facc15" />
              <Text style={styles.crownBadgeText}>KAMPUS</Text>
            </View>

            <View style={styles.heroTextContainer}>
              <Text style={styles.heroHeading1}>Dream Bigger</Text>
              <Text style={styles.heroHeading2}>Achieve More</Text>
              <Text style={styles.heroSubtitle}>Your Campus. Your Community.</Text>

              <TouchableOpacity
                style={styles.heroExploreBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('StudyHub')}
              >
                <Text style={styles.heroExploreText}>Explore KAMPUS</Text>
                <ArrowRight size={13} color="#0f172a" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* Pagination Dots */}
            <View style={styles.paginationDots}>
              <View style={styles.activeDot} />
              <View style={styles.inactiveDot} />
              <View style={styles.inactiveDot} />
              <View style={styles.inactiveDot} />
            </View>
          </View>
        </View>

        {/* 4. THE 10 MAIN FEATURES 2x5 GRID */}
        <View style={styles.featuresGrid}>
          {/* Row 1 */}
          <View style={styles.featuresRow}>
            {/* 1. Study Hub */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('StudyHub')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#eff6ff' }]}>
                <BookOpen size={20} color="#2563eb" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                Study{'\n'}Hub <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>

            {/* 2. KAMPUS AI */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('KampusAi')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#f3e8ff' }]}>
                <Bot size={20} color="#9333ea" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                KAMPUS{'\n'}AI <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>

            {/* 3. Student Community */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('Community')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#ecfeff' }]}>
                <Users size={20} color="#0891b2" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                Student{'\n'}Community <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>

            {/* 4. Campus Life */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('CampusLife')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#fff7ed' }]}>
                <Calendar size={20} color="#ea580c" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                Campus{'\n'}Life <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>

            {/* 5. Career & Placement */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('Career')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#ecfdf5' }]}>
                <Briefcase size={20} color="#059669" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                Career &{'\n'}Placement <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.featuresRow}>
            {/* 6. College Explorer */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('CollegeExplorer')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#eff6ff' }]}>
                <GraduationCap size={20} color="#1d4ed8" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                College{'\n'}Explorer <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>

            {/* 7. KAMPUS Market */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('Market')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#fffbeb' }]}>
                <Store size={20} color="#d97706" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                KAMPUS{'\n'}Market <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>

            {/* 8. Student Toolkit */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('StudentToolkit')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#fdf2f8' }]}>
                <CheckSquare size={20} color="#db2777" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                Student{'\n'}Toolkit <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>

            {/* 9. KAMPUS ID */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('KampusId')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#eef2ff' }]}>
                <CreditCard size={20} color="#4f46e5" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                KAMPUS{'\n'}ID <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>

            {/* 10. Settings & Privacy */}
            <TouchableOpacity
              style={[styles.featureSquareCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIconCircle, { backgroundColor: '#f1f5f9' }]}>
                <Settings size={20} color="#475569" />
              </View>
              <Text style={[styles.featureLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                Settings &{'\n'}Privacy <Text style={styles.arrowText}>→</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. MIDDLE ROW: Upcoming Events & Your Study Progress (2 Columns) */}
        <View style={styles.twoColumnRow}>
          {/* Left Card: Upcoming Events (Navy Dark Card) */}
          <View style={styles.navyEventCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleLeft}>
                <View style={styles.calendarIconCircle}>
                  <Calendar size={14} color="#60a5fa" />
                </View>
                <Text style={styles.navyCardTitle}>Upcoming Events</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('CampusLife')}>
                <Text style={styles.navyViewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.eventInnerRow}>
              {/* Event Image with 25 APR badge */}
              <View style={styles.eventImageWrapper}>
                <Image
                  source={{
                    uri:
                      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80',
                  }}
                  style={styles.eventThumb}
                />
                <View style={styles.dateOverlayBadge}>
                  <Text style={styles.dateDayText}>25</Text>
                  <Text style={styles.dateMonthText}>APR</Text>
                </View>
              </View>

              {/* Event Details */}
              <View style={styles.eventDetailsCol}>
                <Text style={styles.eventTitleText}>Tech Fest 2025</Text>
                <View style={styles.eventMetaRow}>
                  <MapPin size={10} color="#94a3b8" />
                  <Text style={styles.eventMetaText}>Main Auditorium</Text>
                </View>
                <View style={styles.eventMetaRow}>
                  <Clock size={10} color="#94a3b8" />
                  <Text style={styles.eventMetaText}>10:00 AM</Text>
                </View>
                <TouchableOpacity
                  style={styles.registerNowBtn}
                  onPress={() => navigation.navigate('CampusLife')}
                >
                  <Text style={styles.registerNowText}>Register Now →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Right Card: Your Study Progress (White Card with Progress Donut) */}
          <View style={[styles.progressCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleLeft}>
                <BarChart2 size={16} color="#0284c7" />
                <Text style={[styles.whiteCardTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  Your Study Progress
                </Text>
              </View>
            </View>

            <View style={styles.progressBodyRow}>
              {/* Circular Gauge Ring */}
              <View style={styles.gaugeContainer}>
                <View style={styles.gaugeOuterCircle}>
                  <View style={styles.gaugeInnerHole}>
                    <Text style={[styles.gaugePercent, { color: isDark ? '#ffffff' : '#0f172a' }]}>72%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressTextCol}>
                <Text style={[styles.progressEncouragement, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  Great Progress!
                </Text>
                <Text style={styles.progressSubText}>Keep it up 💪</Text>
              </View>
            </View>

            {/* Sparkline curve accent */}
            <View style={styles.sparklineTrack}>
              <View style={styles.sparklineWave} />
            </View>
          </View>
        </View>

        {/* 6. SECOND ROW: Recent Activity & Quick Actions (2 Columns) */}
        <View style={styles.twoColumnRow}>
          {/* Left Card: Recent Activity (White Card) */}
          <View style={[styles.recentActivityCard, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleLeft}>
                <Zap size={16} color="#f59e0b" fill="#f59e0b" />
                <Text style={[styles.whiteCardTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  Recent Activity
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('StudyHub')}>
                <Text style={styles.blueViewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {/* 3 Activity Items */}
            <View style={styles.activityItemRow}>
              <View style={[styles.activityIconBox, { backgroundColor: '#eff6ff' }]}>
                <FileText size={14} color="#2563eb" />
              </View>
              <View style={styles.activityTextCol}>
                <Text style={[styles.activityTitle, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                  Downloaded: Data Structures Notes
                </Text>
              </View>
              <Text style={styles.activityTime}>2h ago</Text>
            </View>

            <View style={styles.activityItemRow}>
              <View style={[styles.activityIconBox, { backgroundColor: '#ecfeff' }]}>
                <Users size={14} color="#0891b2" />
              </View>
              <View style={styles.activityTextCol}>
                <Text style={[styles.activityTitle, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                  Joined: Study Partner Group
                </Text>
              </View>
              <Text style={styles.activityTime}>3h ago</Text>
            </View>

            <View style={styles.activityItemRow}>
              <View style={[styles.activityIconBox, { backgroundColor: '#f3e8ff' }]}>
                <Calendar size={14} color="#9333ea" />
              </View>
              <View style={styles.activityTextCol}>
                <Text style={[styles.activityTitle, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                  Registered: Tech Fest 2025
                </Text>
              </View>
              <Text style={styles.activityTime}>4h ago</Text>
            </View>
          </View>

          {/* Right Card: Quick Actions (Navy Dark Card with 4 square action buttons) */}
          <View style={styles.navyQuickActionCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTitleLeft}>
                <Star size={16} color="#facc15" fill="#facc15" />
                <Text style={styles.navyCardTitle}>Quick Actions</Text>
              </View>
            </View>

            <View style={styles.quickActionButtonsGrid}>
              {/* Action 1: Add Note (Purple) */}
              <TouchableOpacity
                style={styles.quickActionSquare}
                onPress={() => navigation.navigate('StudyHub')}
              >
                <View style={[styles.actionSquareIconBox, { backgroundColor: '#8b5cf6' }]}>
                  <FileEdit size={16} color="#ffffff" />
                </View>
                <Text style={styles.quickActionLabel}>Add{'\n'}Note</Text>
              </TouchableOpacity>

              {/* Action 2: Add Task (Teal/Green) */}
              <TouchableOpacity
                style={styles.quickActionSquare}
                onPress={() => navigation.navigate('StudentToolkit')}
              >
                <View style={[styles.actionSquareIconBox, { backgroundColor: '#10b981' }]}>
                  <Check size={16} color="#ffffff" />
                </View>
                <Text style={styles.quickActionLabel}>Add{'\n'}Task</Text>
              </TouchableOpacity>

              {/* Action 3: Set Reminder (Amber/Gold) */}
              <TouchableOpacity
                style={styles.quickActionSquare}
                onPress={() => navigation.navigate('StudentToolkit')}
              >
                <View style={[styles.actionSquareIconBox, { backgroundColor: '#f59e0b' }]}>
                  <Bell size={16} color="#ffffff" />
                </View>
                <Text style={styles.quickActionLabel}>Set{'\n'}Reminder</Text>
              </TouchableOpacity>

              {/* Action 4: Open Locker (Blue) */}
              <TouchableOpacity
                style={styles.quickActionSquare}
                onPress={() => navigation.navigate('StudentToolkit')}
              >
                <View style={[styles.actionSquareIconBox, { backgroundColor: '#3b82f6' }]}>
                  <Lock size={16} color="#ffffff" />
                </View>
                <Text style={styles.quickActionLabel}>Open{'\n'}Locker</Text>
              </TouchableOpacity>
            </View>

            {/* Subtle Open Book Artistic Background Watermark */}
            <View style={styles.bookWatermarkWrapper}>
              <BookOpen size={48} color="rgba(255,255,255,0.06)" />
            </View>
          </View>
        </View>

        {/* 7. REWARDS & ACHIEVEMENTS BANNER (Gradient with 3D Trophy, Gift boxes & View Rewards button) */}
        <TouchableOpacity
          style={styles.rewardsBanner}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('StudentToolkit')}
        >
          <View style={styles.trophyIconCol}>
            <Award size={36} color="#f59e0b" />
          </View>

          <View style={styles.rewardsTextCol}>
            <Text style={styles.rewardsTitle}>Earn Rewards & Unlock Achievements</Text>
            <Text style={styles.rewardsSubText}>
              Complete tasks, participate in events and win exciting rewards!
            </Text>
          </View>

          <View style={styles.viewRewardsBtn}>
            <Text style={styles.viewRewardsText}>View Rewards →</Text>
          </View>
        </TouchableOpacity>

        {/* Extra Bottom Spacing for Tab Bar */}
        <View style={{ height: Spacing.xl + 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : Spacing.md,
    paddingBottom: Spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMarkContainer: {
    position: 'relative',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCap: {
    position: 'absolute',
    top: -2,
    left: -2,
  },
  logoLetterK: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1d4ed8',
    letterSpacing: -1,
    marginTop: 6,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  bellButton: {
    position: 'relative',
    padding: 4,
  },
  redBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarButton: {
    position: 'relative',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  greenOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  scanButton: {
    padding: 4,
  },
  heroCard: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 47, 0.72)',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  crownBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
  crownBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTextContainer: {
    marginTop: 4,
  },
  heroHeading1: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroHeading2: {
    color: '#facc15',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 10,
  },
  heroExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  heroExploreText: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '800',
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeDot: {
    width: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  inactiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  featuresGrid: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  featureSquareCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  featureIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
  arrowText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  navyEventCard: {
    flex: 1,
    backgroundColor: '#0a192f',
    borderRadius: 16,
    padding: 10,
    ...Shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navyCardTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  navyViewAllText: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '700',
  },
  eventInnerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  eventImageWrapper: {
    width: 60,
    height: 76,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  eventThumb: {
    width: '100%',
    height: '100%',
  },
  dateOverlayBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    paddingVertical: 2,
  },
  dateDayText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 14,
  },
  dateMonthText: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '800',
  },
  eventDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  eventMetaText: {
    color: '#94a3b8',
    fontSize: 9,
  },
  registerNowBtn: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  registerNowText: {
    color: '#0f172a',
    fontSize: 9,
    fontWeight: '800',
  },
  progressCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    ...Shadows.card,
  },
  whiteCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeOuterCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: '#0284c7',
    borderTopColor: '#38bdf8',
    borderRightColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeInnerHole: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercent: {
    fontSize: 13,
    fontWeight: '900',
  },
  progressTextCol: {
    flex: 1,
  },
  progressEncouragement: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  sparklineTrack: {
    height: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  sparklineWave: {
    height: 2,
    backgroundColor: '#38bdf8',
    borderRadius: 1,
  },
  recentActivityCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    ...Shadows.card,
  },
  blueViewAllText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '700',
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  activityIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTextCol: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  activityTime: {
    fontSize: 8.5,
    color: '#94a3b8',
  },
  navyQuickActionCard: {
    flex: 1,
    backgroundColor: '#0a192f',
    borderRadius: 16,
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.card,
  },
  quickActionButtonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  quickActionSquare: {
    alignItems: 'center',
    flex: 1,
  },
  actionSquareIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickActionLabel: {
    color: '#cbd5e1',
    fontSize: 8.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 11,
  },
  bookWatermarkWrapper: {
    position: 'absolute',
    bottom: -6,
    right: 4,
    opacity: 0.8,
  },
  rewardsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    ...Shadows.card,
  },
  trophyIconCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsTextCol: {
    flex: 1,
  },
  rewardsTitle: {
    color: '#1e1b4b',
    fontSize: 12,
    fontWeight: '800',
  },
  rewardsSubText: {
    color: '#475569',
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 2,
  },
  viewRewardsBtn: {
    backgroundColor: '#0f172a',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewRewardsText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});
