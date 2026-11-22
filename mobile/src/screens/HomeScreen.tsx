import React, { useState, useRef } from 'react';
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
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Flame,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Compass,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_CARD_WIDTH = SCREEN_WIDTH - Spacing.md * 2;
const EVENT_CARD_WIDTH = SCREEN_WIDTH * 0.78;

export const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // 10 Core Modules Data
  const modules = [
    {
      id: 'study-hub',
      title: 'Study Hub',
      subtitle: 'Notes & Rooms',
      icon: BookOpen,
      iconColor: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.12)',
      route: 'StudyHub',
      badge: 'POPULAR',
      badgeColor: '#2563eb',
    },
    {
      id: 'kampus-ai',
      title: 'KAMPUS AI',
      subtitle: '24/7 Smart Tutor',
      icon: Bot,
      iconColor: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.12)',
      route: 'KampusAi',
      badge: 'AI BOT',
      badgeColor: '#9333ea',
    },
    {
      id: 'community',
      title: 'Community',
      subtitle: 'Peer Groups',
      icon: Users,
      iconColor: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.12)',
      route: 'Community',
    },
    {
      id: 'campus-life',
      title: 'Campus Life',
      subtitle: 'Events & Clubs',
      icon: Calendar,
      iconColor: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.12)',
      route: 'CampusLife',
      badge: 'LIVE',
      badgeColor: '#ea580c',
    },
    {
      id: 'career',
      title: 'Career Hub',
      subtitle: 'Jobs & Internships',
      icon: Briefcase,
      iconColor: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      route: 'Career',
    },
    {
      id: 'college-explorer',
      title: 'College Map',
      subtitle: 'Campus Directory',
      icon: GraduationCap,
      iconColor: '#6366f1',
      bgColor: 'rgba(99, 102, 241, 0.12)',
      route: 'CollegeExplorer',
    },
    {
      id: 'market',
      title: 'Marketplace',
      subtitle: 'Buy & Sell',
      icon: Store,
      iconColor: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      route: 'Market',
    },
    {
      id: 'toolkit',
      title: 'Student Tools',
      subtitle: 'GPA & Timetable',
      icon: CheckSquare,
      iconColor: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.12)',
      route: 'StudentToolkit',
    },
    {
      id: 'kampus-id',
      title: 'KAMPUS ID',
      subtitle: 'Digital Student Card',
      icon: CreditCard,
      iconColor: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.12)',
      route: 'KampusId',
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Preferences',
      icon: Settings,
      iconColor: '#64748b',
      bgColor: 'rgba(100, 116, 139, 0.12)',
      route: 'Settings',
    },
  ];

  // Hero Banners
  const heroBanners = [
    {
      title1: 'Dream Bigger',
      title2: 'Achieve More',
      subtitle: 'Your Academic Hub. Your Campus Community.',
      btnText: 'Explore Study Hub',
      route: 'StudyHub',
      badgeText: 'KAMPUS PRO',
      bgImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
    },
    {
      title1: 'AI Study Assistant',
      title2: 'Instant Answers',
      subtitle: 'Summarize lectures, solve formulas & prep for exams.',
      btnText: 'Ask KAMPUS AI',
      route: 'KampusAi',
      badgeText: 'GEN-AI 2.0',
      bgImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop&q=80',
    },
    {
      title1: 'Annual Tech Fest',
      title2: 'Registrations Open',
      subtitle: 'Hackathons, RoboWars & ₹1,00,000 in student prizes.',
      btnText: 'Register Free',
      route: 'CampusLife',
      badgeText: 'FEST 2026',
      bgImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80',
    },
  ];

  // Upcoming Events
  const upcomingEvents = [
    {
      id: 'evt-1',
      title: 'Tech Fest 2026: CodeStorm',
      venue: 'Main Auditorium',
      time: '10:00 AM',
      day: '25',
      month: 'APR',
      attendees: '380+ Students',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
      category: 'Hackathon',
    },
    {
      id: 'evt-2',
      title: 'Placement Workshop & Resume Masterclass',
      venue: 'Seminar Hall 3',
      time: '02:00 PM',
      day: '28',
      month: 'APR',
      attendees: '240+ Registered',
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=80',
      category: 'Career',
    },
    {
      id: 'evt-3',
      title: 'Campus Band Night & Open Mic',
      venue: 'Open Air Amphitheatre',
      time: '06:30 PM',
      day: '02',
      month: 'MAY',
      attendees: '500+ Attending',
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
      category: 'Cultural',
    },
  ];

  // Quick categories
  const categories = ['All', 'Academic', 'Campus', 'Career', 'Tools'];

  // Calculate clean top padding ensuring status bar icons never overlap
  const safeTopPadding = Math.max(insets.top, Platform.OS === 'android' ? 36 : 44);

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.background : '#0b1329' }]}>
      {/* 
        Status Bar: Set solid dark background with light icons. 
        Translucent is false so the OS reserves status space and never collides with header.
      */}
      <StatusBar style="light" backgroundColor="#0b1329" translucent={false} />

      {/* 1. TOP HEADER (Safe-Area Protected & Never Overlapping Phone Icons) */}
      <View style={[styles.topHeader, { paddingTop: Platform.OS === 'ios' ? insets.top : 12 }]}>
        <View style={styles.headerLeft}>
          {/* Logo Mark: Graduation cap + stylish K */}
          <View style={styles.logoBadgeWrapper}>
            <GraduationCap size={16} color="#38bdf8" style={styles.logoCapIcon} />
            <Text style={styles.logoLetterK}>K</Text>
          </View>

          <View style={styles.brandTitleCol}>
            <View style={styles.appNameRow}>
              <Text style={styles.brandTitle}>KAMPUS</Text>
              <View style={styles.verifiedPill}>
                <ShieldCheck size={11} color="#38bdf8" />
                <Text style={styles.verifiedPillText}>CAMPUS</Text>
              </View>
            </View>
            <Text style={styles.brandTagline} numberOfLines={1}>
              {user?.fullName ? `Hey, ${user.fullName.split(' ')[0]} 👋` : 'Your Student Life, Connected.'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Live Campus Pulse Beacon */}
          <TouchableOpacity
            style={styles.pulsePill}
            onPress={() => navigation.navigate('Community')}
            activeOpacity={0.8}
          >
            <View style={styles.pulseDot} />
            <Text style={styles.pulseText}>Live</Text>
          </TouchableOpacity>

          {/* Notification Bell with Badge */}
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => navigation.navigate('More', { screen: 'Notifications' })}
            activeOpacity={0.7}
          >
            <Bell size={20} color="#f1f5f9" />
            <View style={styles.redBadge}>
              <Text style={styles.redBadgeText}>3</Text>
            </View>
          </TouchableOpacity>

          {/* Student Profile Avatar */}
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate('KampusId')}
            activeOpacity={0.85}
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

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with Glass Glow */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, events, clubs, campus AI..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('KampusId')}
            activeOpacity={0.7}
          >
            <Scan size={18} color="#38bdf8" />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills (Smooth Horizontal Slider) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categorySlider}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.activeCategoryChip,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.activeCategoryChipText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 3. HERO BANNER CAROUSEL (Sliding with Momentum) */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / HERO_CARD_WIDTH);
            setActiveHeroIndex(index);
          }}
          scrollEventThrottle={16}
          style={styles.heroCarouselContainer}
          contentContainerStyle={{ paddingHorizontal: Spacing.md }}
        >
          {heroBanners.map((banner, index) => (
            <View key={index} style={[styles.heroCard, { width: HERO_CARD_WIDTH }]}>
              <Image source={{ uri: banner.bgImage }} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.heroGradientOverlay}>
                <View style={styles.crownBadge}>
                  <Crown size={11} color="#facc15" fill="#facc15" />
                  <Text style={styles.crownBadgeText}>{banner.badgeText}</Text>
                </View>

                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroHeading1}>{banner.title1}</Text>
                  <Text style={styles.heroHeading2}>{banner.title2}</Text>
                  <Text style={styles.heroSubtitle}>{banner.subtitle}</Text>

                  <TouchableOpacity
                    style={styles.heroExploreBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate(banner.route)}
                  >
                    <Text style={styles.heroExploreText}>{banner.btnText}</Text>
                    <ArrowRight size={13} color="#0b1329" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>

                {/* Pagination Dots */}
                <View style={styles.paginationDots}>
                  {heroBanners.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === activeHeroIndex ? styles.activeDot : styles.inactiveDot,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 4. SLIDING FEATURES DECK ("sliding type do nicha se") */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleLeft}>
            <Compass size={18} color="#38bdf8" />
            <Text style={styles.sectionTitle}>Campus Hub & Services</Text>
          </View>
          <Text style={styles.sectionBadge}>10 Modules</Text>
        </View>

        {/* Horizontal Sliding Modules Container */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalModulesContainer}
        >
          {modules.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.moduleCard}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.82}
              >
                {item.badge && (
                  <View style={[styles.moduleItemBadge, { backgroundColor: item.badgeColor }]}>
                    <Text style={styles.moduleItemBadgeText}>{item.badge}</Text>
                  </View>
                )}
                <View style={[styles.moduleIconWrapper, { backgroundColor: item.bgColor }]}>
                  <IconComponent size={24} color={item.iconColor} />
                </View>
                <Text style={styles.moduleTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.moduleSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
                <View style={styles.moduleArrowPill}>
                  <ChevronRight size={12} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. SLIDING UPCOMING EVENTS CAROUSEL (Full Width & Sliding) */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleLeft}>
            <Calendar size={18} color="#f97316" />
            <Text style={styles.sectionTitle}>Upcoming Campus Events</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('CampusLife')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalEventsContainer}
        >
          {upcomingEvents.map((evt) => (
            <View key={evt.id} style={[styles.eventSlideCard, { width: EVENT_CARD_WIDTH }]}>
              <View style={styles.eventImageCoverWrapper}>
                <Image source={{ uri: evt.image }} style={styles.eventSlideImage} />
                <View style={styles.eventDateBadge}>
                  <Text style={styles.eventDateDay}>{evt.day}</Text>
                  <Text style={styles.eventDateMonth}>{evt.month}</Text>
                </View>
                <View style={styles.eventCategoryTag}>
                  <Text style={styles.eventCategoryText}>{evt.category}</Text>
                </View>
              </View>

              <View style={styles.eventSlideBody}>
                <Text style={styles.eventSlideTitle} numberOfLines={1}>
                  {evt.title}
                </Text>

                <View style={styles.eventMetaRow}>
                  <View style={styles.eventMetaItem}>
                    <MapPin size={12} color="#94a3b8" />
                    <Text style={styles.eventMetaLabel}>{evt.venue}</Text>
                  </View>
                  <View style={styles.eventMetaItem}>
                    <Clock size={12} color="#94a3b8" />
                    <Text style={styles.eventMetaLabel}>{evt.time}</Text>
                  </View>
                </View>

                <View style={styles.eventFooterRow}>
                  <Text style={styles.eventAttendeesText}>👥 {evt.attendees}</Text>
                  <TouchableOpacity
                    style={styles.eventRegisterBtn}
                    onPress={() => navigation.navigate('CampusLife')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.eventRegisterBtnText}>Register Now</Text>
                    <ArrowRight size={12} color="#ffffff" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 6. ACADEMIC & STUDY PROGRESS DASHBOARD WIDGET */}
        <View style={styles.studyProgressBanner}>
          <View style={styles.studyBannerTopRow}>
            <View style={styles.studyBannerTitleGroup}>
              <View style={styles.studyIconBox}>
                <BarChart2 size={18} color="#38bdf8" />
              </View>
              <View>
                <Text style={styles.studyBannerHeading}>Academic Study Progress</Text>
                <Text style={styles.studyBannerSubheading}>Semester 4 • On Track for Distinction</Text>
              </View>
            </View>
            <View style={styles.streakBadge}>
              <Flame size={14} color="#f97316" fill="#f97316" />
              <Text style={styles.streakBadgeText}>5 Day Streak</Text>
            </View>
          </View>

          <View style={styles.studyMetricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>72%</Text>
              <Text style={styles.metricLabel}>Syllabus Covered</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>18</Text>
              <Text style={styles.metricLabel}>Notes Saved</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>14.5h</Text>
              <Text style={styles.metricLabel}>Study Time</Text>
            </View>
          </View>

          <View style={styles.studyProgressBarTrack}>
            <View style={[styles.studyProgressBarFill, { width: '72%' }]} />
          </View>

          <View style={styles.studyBannerActionRow}>
            <Text style={styles.studyEncouragement}>Keep pushing! Next exam in 12 days 💪</Text>
            <TouchableOpacity
              style={styles.openStudyHubPill}
              onPress={() => navigation.navigate('StudyHub')}
              activeOpacity={0.8}
            >
              <Text style={styles.openStudyHubText}>Open Study Hub</Text>
              <ChevronRight size={14} color="#38bdf8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. SLIDING QUICK ACTIONS CHIPS */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleLeft}>
            <Zap size={18} color="#facc15" fill="#facc15" />
            <Text style={styles.sectionTitle}>Quick Shortcuts</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickShortcutsContainer}
        >
          <TouchableOpacity
            style={styles.shortcutChip}
            onPress={() => navigation.navigate('StudyHub')}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <FileEdit size={16} color="#3b82f6" />
            </View>
            <Text style={styles.shortcutLabel}>Add Note</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutChip}
            onPress={() => navigation.navigate('StudentToolkit')}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Check size={16} color="#10b981" />
            </View>
            <Text style={styles.shortcutLabel}>Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutChip}
            onPress={() => navigation.navigate('StudentToolkit')}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Bell size={16} color="#f59e0b" />
            </View>
            <Text style={styles.shortcutLabel}>Reminders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutChip}
            onPress={() => navigation.navigate('StudentToolkit')}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Lock size={16} color="#a855f7" />
            </View>
            <Text style={styles.shortcutLabel}>Doc Locker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutChip}
            onPress={() => navigation.navigate('Community')}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Users size={16} color="#06b6d4" />
            </View>
            <Text style={styles.shortcutLabel}>Study Buddy</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 8. REWARDS & ACHIEVEMENTS BANNER */}
        <TouchableOpacity
          style={styles.rewardsBanner}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('StudentToolkit')}
        >
          <View style={styles.trophyIconCol}>
            <Award size={36} color="#f59e0b" />
          </View>
          <View style={styles.rewardsTextCol}>
            <Text style={styles.rewardsTitle}>Earn Rewards & Badges</Text>
            <Text style={styles.rewardsSubText}>
              Complete study goals, help peers & unlock verified campus honors!
            </Text>
          </View>
          <View style={styles.viewRewardsBtn}>
            <Text style={styles.viewRewardsText}>View</Text>
            <ChevronRight size={14} color="#0b1329" />
          </View>
        </TouchableOpacity>

        {/* Extra Bottom Spacing for Tab Bar */}
        <View style={{ height: Spacing.xl + 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0b1329',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadgeWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoCapIcon: {
    position: 'absolute',
    top: 3,
    left: 4,
  },
  logoLetterK: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38bdf8',
    marginTop: 6,
  },
  brandTitleCol: {
    justifyContent: 'center',
    flex: 1,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedPillText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
  },
  pulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  pulseText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  bellButton: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  greenOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#0b1329',
  },
  scrollContent: {
    paddingTop: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm + 4,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    paddingVertical: 0,
  },
  scanButton: {
    padding: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 16,
  },
  categorySlider: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    paddingBottom: Spacing.sm + 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  activeCategoryChip: {
    backgroundColor: '#2563eb',
    borderColor: '#38bdf8',
  },
  categoryChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  activeCategoryChipText: {
    color: '#ffffff',
  },
  heroCarouselContainer: {
    marginBottom: Spacing.lg,
  },
  heroCard: {
    height: 172,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginRight: Spacing.md,
    ...Shadows.card,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 19, 41, 0.78)',
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroHeading2: {
    color: '#facc15',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
    maxWidth: '85%',
  },
  heroExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  heroExploreText: {
    color: '#0b1329',
    fontSize: 12,
    fontWeight: '800',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#38bdf8',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm + 4,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  viewAllText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalModulesContainer: {
    paddingHorizontal: Spacing.md,
    gap: 10,
    paddingBottom: Spacing.lg,
  },
  moduleCard: {
    width: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  moduleItemBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moduleItemBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  moduleIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  moduleSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 6,
  },
  moduleArrowPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    padding: 3,
  },
  horizontalEventsContainer: {
    paddingHorizontal: Spacing.md,
    gap: 12,
    paddingBottom: Spacing.lg,
  },
  eventSlideCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Shadows.card,
  },
  eventImageCoverWrapper: {
    height: 120,
    position: 'relative',
  },
  eventSlideImage: {
    width: '100%',
    height: '100%',
  },
  eventDateBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(11, 19, 41, 0.88)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventDateDay: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  eventDateMonth: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
  },
  eventCategoryTag: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.88)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  eventCategoryText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  eventSlideBody: {
    padding: 12,
  },
  eventSlideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  eventFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  eventAttendeesText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  eventRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  eventRegisterBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  studyProgressBanner: {
    marginHorizontal: Spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  studyBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  studyBannerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  studyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studyBannerHeading: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  studyBannerSubheading: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  streakBadgeText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '800',
  },
  studyMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  studyProgressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  studyProgressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 3,
  },
  studyBannerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studyEncouragement: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  openStudyHubPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  openStudyHubText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  quickShortcutsContainer: {
    paddingHorizontal: Spacing.md,
    gap: 10,
    paddingBottom: Spacing.lg,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shortcutIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rewardsBanner: {
    marginHorizontal: Spacing.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophyIconCol: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsTextCol: {
    flex: 1,
  },
  rewardsTitle: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '800',
  },
  rewardsSubText: {
    color: '#e2e8f0',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  viewRewardsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#facc15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  viewRewardsText: {
    color: '#0b1329',
    fontSize: 11,
    fontWeight: '800',
  },
});
