import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  useWindowDimensions,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
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
  SlidersHorizontal,
  TrendingUp,
  LayoutList,
  LayoutGrid,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../services/notificationsApi';
import { Spacing, BorderRadius, Typography, Shadows } from '../theme/tokens';

const PADDING_HORIZONTAL = 20;

// Hardware-accelerated SVG Donut Progress Ring
const DonutProgress = ({
  percentage = 72,
  size = 80,
  strokeWidth = 8,
}: {
  percentage?: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id="donutGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#38bdf8" />
            <Stop offset="100%" stopColor="#818cf8" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#donutGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>{percentage}%</Text>
        <Text style={{ color: '#94a3b8', fontSize: 8.5, fontWeight: '700', textTransform: 'uppercase' }}>Done</Text>
      </View>
    </View>
  );
};

export const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [modulesViewMode, setModulesViewMode] = useState<'slider' | 'grid'>('slider');
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const heroScrollRef = useRef<ScrollView>(null);
  const isInteractingWithHeroRef = useRef(false);

  const loadUnreadCount = React.useCallback(async () => {
    try {
      const c = await notificationsApi.getUnreadCount(null, user?.userId);
      setUnreadNotifs(c);
    } catch {}
  }, [user?.userId]);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  // Time-based student greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const studentFirstName = user?.fullName
    ? user.fullName.trim().split(' ')[0]
    : 'Scholar';

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadUnreadCount();
    setTimeout(() => setRefreshing(false), 800);
  }, [loadUnreadCount]);

  // 4 Premium Hero Slides with relevant university imagery
  const heroSlides = [
    {
      id: 'slide-1',
      title: 'Dream Bigger',
      subtitle: 'Achieve More',
      description: 'Your campus. Your community.',
      cta: 'Explore KAMPUS',
      badge: 'CAMPUS PRO',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1000&auto=format&fit=crop&q=80',
      route: 'StudyHub',
    },
    {
      id: 'slide-2',
      title: 'Your Study Space',
      subtitle: 'Learn Smarter',
      description: 'Notes, resources and academic tools in one place.',
      cta: 'Explore Study Hub',
      badge: 'STUDY HUB',
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1000&auto=format&fit=crop&q=80',
      route: 'StudyHub',
    },
    {
      id: 'slide-3',
      title: 'Build Your Future',
      subtitle: 'Career Ready',
      description: 'Discover opportunities and prepare for placements.',
      cta: 'Explore Careers',
      badge: 'CAREER READY',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&auto=format&fit=crop&q=80',
      route: 'Career',
    },
    {
      id: 'slide-4',
      title: 'Campus Comes Alive',
      subtitle: 'Never Miss Out',
      description: 'Discover events, communities and campus activities.',
      cta: 'Discover Events',
      badge: 'CAMPUS LIFE',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&auto=format&fit=crop&q=80',
      route: 'CampusLife',
    },
  ];

  const HERO_CARD_WIDTH = windowWidth - PADDING_HORIZONTAL * 2;
  const EVENT_CARD_WIDTH = Math.min(windowWidth * 0.82, 340);
  const MODULE_CARD_WIDTH = (windowWidth - PADDING_HORIZONTAL * 2 - 12) / 2;

  // Auto-sliding Hero Carousel with user-pause mechanism
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInteractingWithHeroRef.current) return;
      setActiveHeroIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % heroSlides.length;
        heroScrollRef.current?.scrollTo({
          x: nextIndex * (HERO_CARD_WIDTH + 14),
          animated: true,
        });
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [HERO_CARD_WIDTH, heroSlides.length]);

  // Featured Highlights (Top swipeable cards)
  const featuredHighlights = [
    {
      id: 'feat-ai',
      title: 'KAMPUS AI Tutor',
      desc: '24/7 instant academic explanations & notes summarizer.',
      icon: Sparkles,
      iconColor: '#c084fc',
      badge: 'AI 2.0',
      badgeColor: '#9333ea',
      cta: 'Ask Question →',
      route: 'KampusAi',
      gradientBorder: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.12)',
    },
    {
      id: 'feat-study',
      title: 'Curated Study Notes',
      desc: 'Top student handwritten & verified exam prep notes.',
      icon: BookOpen,
      iconColor: '#38bdf8',
      badge: 'VERIFIED',
      badgeColor: '#0284c7',
      cta: 'Browse Notes →',
      route: 'StudyHub',
      gradientBorder: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.12)',
    },
    {
      id: 'feat-events',
      title: 'Tech Fest 2026',
      desc: 'Hackathons, RoboWars & ₹1,00,000 cash prizes live.',
      icon: Calendar,
      iconColor: '#fb923c',
      badge: 'LIVE FEST',
      badgeColor: '#ea580c',
      cta: 'Join Events →',
      route: 'CampusLife',
      gradientBorder: '#f97316',
      bgGlow: 'rgba(249, 115, 22, 0.12)',
    },
    {
      id: 'feat-career',
      title: 'Placement Drives',
      desc: 'Top tech & core engineering internships for 2026.',
      icon: Briefcase,
      iconColor: '#34d399',
      badge: 'HIRING',
      badgeColor: '#059669',
      cta: 'View Jobs →',
      route: 'Career',
      gradientBorder: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.12)',
    },
  ];

  // The 10 Core Modules (Preserving all existing 10 modules without loss)
  const coreModules = [
    {
      id: 'mod-study-hub',
      title: 'Study Hub',
      subtitle: 'Notes & Study Rooms',
      icon: BookOpen,
      iconColor: '#38bdf8',
      iconBg: 'rgba(56, 189, 248, 0.12)',
      route: 'StudyHub',
    },
    {
      id: 'mod-kampus-ai',
      title: 'KAMPUS AI',
      subtitle: 'Smart Student AI',
      icon: Bot,
      iconColor: '#c084fc',
      iconBg: 'rgba(192, 132, 252, 0.12)',
      route: 'KampusAi',
      isAi: true,
    },
    {
      id: 'mod-community',
      title: 'Community',
      subtitle: 'Peer Groups & Clubs',
      icon: Users,
      iconColor: '#22d3ee',
      iconBg: 'rgba(34, 211, 238, 0.12)',
      route: 'Community',
    },
    {
      id: 'mod-campus-life',
      title: 'Campus Life',
      subtitle: 'Events & Societies',
      icon: Calendar,
      iconColor: '#fb923c',
      iconBg: 'rgba(251, 146, 60, 0.12)',
      route: 'CampusLife',
    },
    {
      id: 'mod-career',
      title: 'Career & Placement',
      subtitle: 'Jobs & Internships',
      icon: Briefcase,
      iconColor: '#34d399',
      iconBg: 'rgba(52, 211, 153, 0.12)',
      route: 'Career',
    },
    {
      id: 'mod-college-explorer',
      title: 'College Explorer',
      subtitle: 'Campus Directory',
      icon: GraduationCap,
      iconColor: '#818cf8',
      iconBg: 'rgba(129, 140, 248, 0.12)',
      route: 'CollegeExplorer',
    },
    {
      id: 'mod-market',
      title: 'KAMPUS Market',
      subtitle: 'Buy & Sell Supplies',
      icon: Store,
      iconColor: '#fbbf24',
      iconBg: 'rgba(251, 191, 36, 0.12)',
      route: 'Market',
    },
    {
      id: 'mod-toolkit',
      title: 'Student Toolkit',
      subtitle: 'GPA, Schedule & Tasks',
      icon: CheckSquare,
      iconColor: '#f472b6',
      iconBg: 'rgba(244, 114, 182, 0.12)',
      route: 'StudentToolkit',
    },
    {
      id: 'mod-kampus-id',
      title: 'KAMPUS ID',
      subtitle: 'Digital Student Card',
      icon: CreditCard,
      iconColor: '#a78bfa',
      iconBg: 'rgba(167, 139, 250, 0.12)',
      route: 'KampusId',
    },
    {
      id: 'mod-settings',
      title: 'Settings & Privacy',
      subtitle: 'Account & Security',
      icon: Settings,
      iconColor: '#94a3b8',
      iconBg: 'rgba(148, 163, 184, 0.12)',
      route: 'Settings',
    },
  ];

  // Upcoming Campus Events
  const upcomingEvents = [
    {
      id: 'evt-techfest',
      title: 'Tech Fest 2026: CodeStorm',
      venue: 'Main Auditorium',
      time: '10:00 AM',
      day: '25',
      month: 'APR',
      attendees: '380+ Students',
      category: 'Hackathon',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'evt-careers',
      title: 'Placement Workshop & Resume Masterclass',
      venue: 'Seminar Hall 3',
      time: '02:00 PM',
      day: '28',
      month: 'APR',
      attendees: '240+ Registered',
      category: 'Career',
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'evt-music',
      title: 'Campus Band Night & Open Mic',
      venue: 'Open Air Amphitheatre',
      time: '06:30 PM',
      day: '02',
      month: 'MAY',
      attendees: '500+ Attending',
      category: 'Cultural',
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    },
  ];

  // Recent Student Activity
  const recentActivities = [
    {
      id: 'act-1',
      title: 'Notes downloaded',
      desc: 'Data Structures & Algorithms (Unit 3 Notes) downloaded',
      time: '2h ago',
      icon: FileText,
      iconColor: '#38bdf8',
      iconBg: 'rgba(56, 189, 248, 0.12)',
    },
    {
      id: 'act-2',
      title: 'Study group joined',
      desc: 'Machine Learning Study Group added to your circles',
      time: '3h ago',
      icon: Users,
      iconColor: '#22d3ee',
      iconBg: 'rgba(34, 211, 238, 0.12)',
    },
    {
      id: 'act-3',
      title: 'Event registered',
      desc: 'Tech Fest 2026 CodeStorm pass saved to calendar',
      time: '4h ago',
      icon: Calendar,
      iconColor: '#c084fc',
      iconBg: 'rgba(192, 132, 252, 0.12)',
    },
  ];

  // Quick Action Shortcuts
  const quickActions = [
    {
      id: 'qa-notes',
      label: 'Find Notes',
      icon: FileEdit,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.14)',
      route: 'StudyHub',
    },
    {
      id: 'qa-colleges',
      label: 'Explore Colleges',
      icon: GraduationCap,
      color: '#818cf8',
      bg: 'rgba(129, 140, 248, 0.14)',
      route: 'CollegeExplorer',
    },
    {
      id: 'qa-events',
      label: 'Campus Events',
      icon: Calendar,
      color: '#fb923c',
      bg: 'rgba(251, 146, 60, 0.14)',
      route: 'CampusLife',
    },
    {
      id: 'qa-ai',
      label: 'Ask KAMPUS AI',
      icon: Bot,
      color: '#c084fc',
      bg: 'rgba(192, 132, 252, 0.14)',
      route: 'KampusAi',
    },
    {
      id: 'qa-id',
      label: 'Digital ID',
      icon: CreditCard,
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.14)',
      route: 'KampusId',
    },
    {
      id: 'qa-locker',
      label: 'Doc Locker',
      icon: Lock,
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.14)',
      route: 'StudentToolkit',
    },
  ];

  // Robust Android & iOS Safe Top Padding
  // Ensures logo, student name, bell, and avatar NEVER sit under the phone's time, network, or punch-hole camera
  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;
  const safeTopPadding = Platform.OS === 'ios'
    ? Math.max(insets.top, 44)
    : Math.max(insets.top, statusBarHeight, 38) + 10;

  return (
    <View style={styles.root}>
      {/* 
        StatusBar: Translucent on Android with light text. 
        Because safeTopPadding begins well below the status bar, the phone's time and network icons
        float cleanly over the dark #070d1e background without touching or obscuring any KAMPUS logo or text!
      */}
      <StatusBar style="light" backgroundColor="#070d1e" translucent={true} />

      {/* 1. TOP HEADER (Fully Protected from Android Status Bar Overlap) */}
      <View
        style={[
          styles.topHeader,
          {
            paddingTop: safeTopPadding,
          },
        ]}
      >
        <View style={styles.headerLeftCol}>
          <View style={styles.headerBrandRow}>
            {/* Logo Mark: Graduation Cap + K Letter */}
            <View style={styles.logoMarkBox}>
              <GraduationCap size={15} color="#38bdf8" style={styles.logoCapIcon} />
              <Text style={styles.logoLetterK}>K</Text>
            </View>

            <View style={styles.brandTitleCol}>
              <View style={styles.titleLine}>
                <Text style={styles.brandTitleText}>KAMPUS</Text>
                <View style={styles.campusBadge}>
                  <ShieldCheck size={10} color="#38bdf8" />
                  <Text style={styles.campusBadgeText}>STUDENT</Text>
                </View>
              </View>

              <Text style={styles.greetingText} numberOfLines={1}>
                {getGreeting()}, <Text style={styles.studentNameHighlight}>{studentFirstName}</Text> 👋
              </Text>
            </View>
          </View>

          <Text style={styles.collegeSubtitleText} numberOfLines={1}>
            {user?.college ? `${user.college} • ` : ''}Your student life, connected.
          </Text>
        </View>

        <View style={styles.headerRightCol}>
          {/* Notification Button with Badge */}
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Bell size={20} color="#f8fafc" />
            {unreadNotifs > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Student Profile Avatar with Online Dot */}
          <TouchableOpacity
            style={styles.profileAvatarBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              }}
              style={styles.profileAvatarImg}
            />
            <View style={styles.avatarOnlineDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MAIN SCROLLABLE DASHBOARD */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with Filter Icon */}
        <View style={styles.searchBarWrapper}>
          <Search size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search campus, notes, events..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => navigation.navigate('StudyHub')}
            activeOpacity={0.7}
          >
            <SlidersHorizontal size={16} color="#38bdf8" />
          </TouchableOpacity>
        </View>

        {/* 3. FEATURED HERO CAROUSEL (Auto-sliding + Gesture Swipe) */}
        <View style={styles.heroCarouselWrapper}>
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onTouchStart={() => {
              isInteractingWithHeroRef.current = true;
            }}
            onTouchEnd={() => {
              setTimeout(() => {
                isInteractingWithHeroRef.current = false;
              }, 4000);
            }}
            onScroll={(e) => {
              const xOffset = e.nativeEvent.contentOffset.x;
              const idx = Math.round(xOffset / (HERO_CARD_WIDTH + 14));
              setActiveHeroIndex(idx);
            }}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL }}
          >
            {heroSlides.map((slide, index) => (
              <View
                key={slide.id}
                style={[
                  styles.heroCard,
                  {
                    width: HERO_CARD_WIDTH,
                    marginRight: index === heroSlides.length - 1 ? 0 : 14,
                  },
                ]}
              >
                <Image source={{ uri: slide.image }} style={styles.heroCardImage} resizeMode="cover" />
                <View style={styles.heroGradientBackdrop}>
                  {/* Badge */}
                  <View style={styles.heroCrownBadge}>
                    <Crown size={11} color="#facc15" fill="#facc15" />
                    <Text style={styles.heroCrownBadgeText}>{slide.badge}</Text>
                  </View>

                  <View style={styles.heroTextContent}>
                    <Text style={styles.heroTitle1}>{slide.title}</Text>
                    <Text style={styles.heroTitle2}>{slide.subtitle}</Text>
                    <Text style={styles.heroDesc} numberOfLines={2}>
                      {slide.description}
                    </Text>

                    <TouchableOpacity
                      style={styles.heroCtaBtn}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate(slide.route)}
                    >
                      <Text style={styles.heroCtaBtnText}>{slide.cta}</Text>
                      <ArrowRight size={13} color="#070d1e" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>

                  {/* Pagination Dots */}
                  <View style={styles.paginationRow}>
                    {heroSlides.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.pageDot,
                          i === activeHeroIndex ? styles.activePageDot : styles.inactivePageDot,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 4. FEATURED HIGHLIGHTS (Horizontal Swipeable Row) */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Sparkles size={17} color="#38bdf8" />
            <Text style={styles.sectionHeading}>Featured Highlights</Text>
          </View>
          <Text style={styles.sectionMetaTag}>Highlights</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredSliderContainer}
        >
          {featuredHighlights.map((feat) => {
            const IconComp = feat.icon;
            return (
              <TouchableOpacity
                key={feat.id}
                style={[
                  styles.featuredCard,
                  {
                    backgroundColor: feat.bgGlow,
                    borderColor: feat.gradientBorder + '50',
                  },
                ]}
                onPress={() => navigation.navigate(feat.route)}
                activeOpacity={0.82}
              >
                <View style={styles.featuredCardTopRow}>
                  <View style={[styles.featuredIconBox, { backgroundColor: feat.gradientBorder + '25' }]}>
                    <IconComp size={20} color={feat.iconColor} />
                  </View>
                  <View style={[styles.featuredBadgePill, { backgroundColor: feat.badgeColor }]}>
                    <Text style={styles.featuredBadgePillText}>{feat.badge}</Text>
                  </View>
                </View>

                <Text style={styles.featuredCardTitle} numberOfLines={1}>
                  {feat.title}
                </Text>
                <Text style={styles.featuredCardDesc} numberOfLines={2}>
                  {feat.desc}
                </Text>

                <View style={styles.featuredCardFooter}>
                  <Text style={[styles.featuredCtaText, { color: feat.iconColor }]}>{feat.cta}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. EXPLORE KAMPUS — THE 10 MODULES (Interactive Slide Deck & Grid View) */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.md }]}>
          <View style={styles.sectionHeaderLeft}>
            <Compass size={18} color="#38bdf8" />
            <Text style={styles.sectionHeading}>Explore KAMPUS</Text>
          </View>
          
          {/* Segmented View Switcher: Slide Deck or Grid View */}
          <View style={styles.viewModeToggleRow}>
            <TouchableOpacity
              style={[styles.modeToggleBtn, modulesViewMode === 'slider' && styles.activeModeToggleBtn]}
              onPress={() => setModulesViewMode('slider')}
              activeOpacity={0.8}
            >
              <LayoutList size={12} color={modulesViewMode === 'slider' ? '#ffffff' : '#94a3b8'} />
              <Text style={[styles.modeToggleText, modulesViewMode === 'slider' && styles.activeModeToggleText]}>
                Slide Deck
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeToggleBtn, modulesViewMode === 'grid' && styles.activeModeToggleBtn]}
              onPress={() => setModulesViewMode('grid')}
              activeOpacity={0.8}
            >
              <LayoutGrid size={12} color={modulesViewMode === 'grid' ? '#ffffff' : '#94a3b8'} />
              <Text style={[styles.modeToggleText, modulesViewMode === 'grid' && styles.activeModeToggleText]}>
                Grid View
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.sectionSubheading}>
          {modulesViewMode === 'slider'
            ? 'Swipe horizontally to explore all 10 campus modules.'
            : 'Spacious 2-column view of all 10 modules.'}
        </Text>

        {modulesViewMode === 'slider' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modulesSliderContainer}
          >
            {coreModules.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.moduleSliderCard,
                    item.isAi && styles.aiModuleCardGlow,
                  ]}
                  onPress={() => navigation.navigate(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.moduleCardTopRow}>
                    <View style={[styles.moduleIconBox, { backgroundColor: item.iconBg }]}>
                      <IconComponent size={22} color={item.iconColor} />
                    </View>
                    {item.isAi ? (
                      <View style={styles.aiBadgeTag}>
                        <Text style={styles.aiBadgeTagText}>SMART</Text>
                      </View>
                    ) : (
                      <ChevronRight size={15} color="#64748b" />
                    )}
                  </View>

                  <Text style={styles.moduleCardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.moduleCardSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.modulesTwoColGrid}>
            {coreModules.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.moduleTwoColCard,
                    { width: MODULE_CARD_WIDTH },
                    item.isAi && styles.aiModuleCardGlow,
                  ]}
                  onPress={() => navigation.navigate(item.route)}
                  activeOpacity={0.8}
                >
                  <View style={styles.moduleCardTopRow}>
                    <View style={[styles.moduleIconBox, { backgroundColor: item.iconBg }]}>
                      <IconComponent size={22} color={item.iconColor} />
                    </View>
                    {item.isAi ? (
                      <View style={styles.aiBadgeTag}>
                        <Text style={styles.aiBadgeTagText}>SMART</Text>
                      </View>
                    ) : (
                      <ChevronRight size={15} color="#64748b" />
                    )}
                  </View>

                  <Text style={styles.moduleCardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.moduleCardSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 6. UPCOMING CAMPUS EVENTS (Horizontal Swipeable Cards) */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.lg }]}>
          <View style={styles.sectionHeaderLeft}>
            <Calendar size={18} color="#f97316" />
            <Text style={styles.sectionHeading}>Upcoming Campus Events</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('CampusLife')}>
            <Text style={styles.viewAllLinkText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsSliderContainer}
        >
          {upcomingEvents.map((evt) => (
            <View key={evt.id} style={[styles.eventCardItem, { width: EVENT_CARD_WIDTH }]}>
              <View style={styles.eventImageContainer}>
                <Image source={{ uri: evt.image }} style={styles.eventImageCover} />
                <View style={styles.eventDateTag}>
                  <Text style={styles.eventDateDayText}>{evt.day}</Text>
                  <Text style={styles.eventDateMonthText}>{evt.month}</Text>
                </View>
                <View style={styles.eventCategoryBadge}>
                  <Text style={styles.eventCategoryBadgeText}>{evt.category}</Text>
                </View>
              </View>

              <View style={styles.eventBodyBox}>
                <Text style={styles.eventTitleHeading} numberOfLines={1}>
                  {evt.title}
                </Text>

                <View style={styles.eventMetaInfoRow}>
                  <View style={styles.metaInfoChip}>
                    <MapPin size={12} color="#94a3b8" />
                    <Text style={styles.metaInfoText}>{evt.venue}</Text>
                  </View>
                  <View style={styles.metaInfoChip}>
                    <Clock size={12} color="#94a3b8" />
                    <Text style={styles.metaInfoText}>{evt.time}</Text>
                  </View>
                </View>

                <View style={styles.eventCardActionRow}>
                  <Text style={styles.eventAttendeesBadge}>{evt.attendees}</Text>
                  <TouchableOpacity
                    style={styles.eventRegisterButton}
                    onPress={() => navigation.navigate('CampusLife')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.eventRegisterButtonText}>Register Now</Text>
                    <ArrowRight size={12} color="#ffffff" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 7. ACADEMIC & STUDY PROGRESS CARD (Donut Progress Gauge) */}
        <View style={styles.studyProgressContainer}>
          <View style={styles.studyProgressHeader}>
            <View style={styles.studyHeaderTitleRow}>
              <View style={styles.progressIconBadge}>
                <BarChart2 size={18} color="#38bdf8" />
              </View>
              <View>
                <Text style={styles.progressCardHeading}>Your Study Progress</Text>
                <Text style={styles.progressCardSubheading}>Semester 4 • On Track for Distinction</Text>
              </View>
            </View>
            <View style={styles.streakIndicatorBadge}>
              <Flame size={14} color="#f97316" fill="#f97316" />
              <Text style={styles.streakIndicatorText}>5 Day Streak</Text>
            </View>
          </View>

          {/* Donut Gauge & Metrics Row */}
          <View style={styles.donutGaugeRow}>
            <DonutProgress percentage={72} size={84} strokeWidth={8} />

            <View style={styles.donutStatsCol}>
              <View style={styles.donutStatItem}>
                <Text style={styles.donutStatValue}>72%</Text>
                <Text style={styles.donutStatLabel}>Syllabus Covered</Text>
              </View>
              <View style={styles.donutStatDivider} />
              <View style={styles.donutStatItem}>
                <Text style={styles.donutStatValue}>18</Text>
                <Text style={styles.donutStatLabel}>Notes Saved</Text>
              </View>
              <View style={styles.donutStatDivider} />
              <View style={styles.donutStatItem}>
                <Text style={styles.donutStatValue}>14.5h</Text>
                <Text style={styles.donutStatLabel}>Study Hours</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressBottomActionRow}>
            <Text style={styles.progressMotivationalQuote}>Great progress! Keep it up 💪</Text>
            <TouchableOpacity
              style={styles.viewProgressBtn}
              onPress={() => navigation.navigate('StudyHub')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewProgressBtnText}>View Schedule</Text>
              <ChevronRight size={14} color="#38bdf8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 8. RECENT ACTIVITY FEED */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.lg }]}>
          <View style={styles.sectionHeaderLeft}>
            <Zap size={18} color="#facc15" fill="#facc15" />
            <Text style={styles.sectionHeading}>Recent Activity</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('StudyHub')}>
            <Text style={styles.viewAllLinkText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentActivityBox}>
          {recentActivities.map((act, idx) => {
            const ActIcon = act.icon;
            const isLast = idx === recentActivities.length - 1;
            return (
              <View key={act.id} style={[styles.activityRowItem, !isLast && styles.activityRowDivider]}>
                <View style={[styles.activityIconCircle, { backgroundColor: act.iconBg }]}>
                  <ActIcon size={16} color={act.iconColor} />
                </View>
                <View style={styles.activityTextCol}>
                  <View style={styles.activityTitleHeaderRow}>
                    <Text style={styles.activityItemTitle}>{act.title}</Text>
                    <Text style={styles.activityTimeText}>{act.time}</Text>
                  </View>
                  <Text style={styles.activityItemDesc} numberOfLines={1}>
                    {act.desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 9. QUICK ACTION SHORTCUTS (Horizontal Slider) */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.lg }]}>
          <View style={styles.sectionHeaderLeft}>
            <Star size={18} color="#facc15" fill="#facc15" />
            <Text style={styles.sectionHeading}>Quick Actions</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsSlider}
        >
          {quickActions.map((qa) => {
            const QaIcon = qa.icon;
            return (
              <TouchableOpacity
                key={qa.id}
                style={styles.quickActionPill}
                onPress={() => navigation.navigate(qa.route)}
                activeOpacity={0.8}
              >
                <View style={[styles.qaIconCircle, { backgroundColor: qa.bg }]}>
                  <QaIcon size={16} color={qa.color} />
                </View>
                <Text style={styles.quickActionLabelText}>{qa.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 10. REWARDS & HONORS CARD */}
        <TouchableOpacity
          style={styles.rewardsCardContainer}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('StudentToolkit')}
        >
          <View style={styles.rewardsTrophyCircle}>
            <Award size={34} color="#f59e0b" />
          </View>
          <View style={styles.rewardsTextDetails}>
            <View style={styles.rewardsTitleBadgeRow}>
              <Text style={styles.rewardsMainTitle}>Earn Campus Rewards</Text>
              <View style={styles.coinsPill}>
                <Text style={styles.coinsPillText}>450 Coins</Text>
              </View>
            </View>
            <Text style={styles.rewardsSubtitle}>
              Complete study goals, share notes and climb the campus leaderboard.
            </Text>
          </View>
          <View style={styles.rewardsActionArrow}>
            <ChevronRight size={18} color="#070d1e" />
          </View>
        </TouchableOpacity>

        {/* Generous Bottom Spacing so content is never covered by bottom navigation */}
        <View style={{ height: Spacing.xl + 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070d1e',
  },
  topHeader: {
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070d1e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  headerLeftCol: {
    flex: 1,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMarkBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
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
    marginTop: 5,
  },
  brandTitleCol: {
    justifyContent: 'center',
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitleText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  campusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  campusBadgeText: {
    color: '#38bdf8',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  studentNameHighlight: {
    color: '#ffffff',
    fontWeight: '700',
  },
  collegeSubtitleText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  headerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  profileAvatarBtn: {
    position: 'relative',
  },
  profileAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#070d1e',
  },
  scrollContent: {
    paddingTop: 16,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    height: 46,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: PADDING_HORIZONTAL,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#ffffff',
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 14,
  },
  heroCarouselWrapper: {
    marginBottom: 20,
  },
  heroCard: {
    height: 172,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.card,
  },
  heroCardImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 13, 30, 0.78)',
    padding: 16,
    justifyContent: 'space-between',
  },
  heroCrownBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
  heroCrownBadgeText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTextContent: {
    marginTop: 2,
  },
  heroTitle1: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroTitle2: {
    color: '#facc15',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  heroDesc: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontWeight: '500',
    marginBottom: 12,
    maxWidth: '85%',
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  heroCtaBtnText: {
    color: '#070d1e',
    fontSize: 11.5,
    fontWeight: '800',
  },
  paginationRow: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    gap: 5,
  },
  pageDot: {
    height: 5,
    borderRadius: 3,
  },
  activePageDot: {
    width: 16,
    backgroundColor: '#38bdf8',
  },
  inactivePageDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 6,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  sectionSubheading: {
    fontSize: 12,
    color: '#94a3b8',
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 12,
  },
  sectionMetaTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  viewAllLinkText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredSliderContainer: {
    paddingHorizontal: PADDING_HORIZONTAL,
    gap: 12,
    paddingBottom: 16,
  },
  featuredCard: {
    width: 200,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  featuredCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  featuredIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredBadgePillText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '900',
  },
  featuredCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  featuredCardDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
    marginBottom: 10,
  },
  featuredCardFooter: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  featuredCtaText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: BorderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  activeModeToggleBtn: {
    backgroundColor: '#2563eb',
  },
  modeToggleText: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '700',
  },
  activeModeToggleText: {
    color: '#ffffff',
  },
  modulesSliderContainer: {
    paddingHorizontal: PADDING_HORIZONTAL,
    gap: 12,
    paddingBottom: 16,
  },
  moduleSliderCard: {
    width: 146,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Shadows.card,
  },
  modulesTwoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PADDING_HORIZONTAL,
    gap: 12,
    marginBottom: 16,
  },
  moduleTwoColCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiModuleCardGlow: {
    borderColor: 'rgba(168, 85, 247, 0.4)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  moduleCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moduleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeTag: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiBadgeTagText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  moduleCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  moduleCardSubtitle: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  eventsSliderContainer: {
    paddingHorizontal: PADDING_HORIZONTAL,
    gap: 12,
    paddingBottom: 16,
  },
  eventCardItem: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Shadows.card,
  },
  eventImageContainer: {
    height: 120,
    position: 'relative',
  },
  eventImageCover: {
    width: '100%',
    height: '100%',
  },
  eventDateTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(7, 13, 30, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  eventDateDayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  eventDateMonthText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
  },
  eventCategoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  eventCategoryBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  eventBodyBox: {
    padding: 13,
  },
  eventTitleHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  eventMetaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  metaInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaInfoText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  eventCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  eventAttendeesBadge: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  eventRegisterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  eventRegisterButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  studyProgressContainer: {
    marginHorizontal: PADDING_HORIZONTAL,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    marginBottom: 16,
    ...Shadows.card,
  },
  studyProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  studyHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  progressIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCardHeading: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  progressCardSubheading: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  streakIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  streakIndicatorText: {
    color: '#f97316',
    fontSize: 11,
    fontWeight: '800',
  },
  donutGaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  donutStatsCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  donutStatItem: {
    alignItems: 'center',
  },
  donutStatValue: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '900',
  },
  donutStatLabel: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  donutStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressMotivationalQuote: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  viewProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  viewProgressBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  recentActivityBox: {
    marginHorizontal: PADDING_HORIZONTAL,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  activityRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  activityRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  activityIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTextCol: {
    flex: 1,
  },
  activityTitleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  activityItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  activityTimeText: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  activityItemDesc: {
    fontSize: 11,
    color: '#94a3b8',
  },
  quickActionsSlider: {
    paddingHorizontal: PADDING_HORIZONTAL,
    gap: 10,
    paddingBottom: 16,
  },
  quickActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  qaIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rewardsCardContainer: {
    marginHorizontal: PADDING_HORIZONTAL,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardsTrophyCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsTextDetails: {
    flex: 1,
  },
  rewardsTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardsMainTitle: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '800',
  },
  coinsPill: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  coinsPillText: {
    color: '#facc15',
    fontSize: 9,
    fontWeight: '900',
  },
  rewardsSubtitle: {
    color: '#e2e8f0',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  rewardsActionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
