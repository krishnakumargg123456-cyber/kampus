import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FileText,
  FolderDown,
  ListTodo,
  Calendar,
  Award,
  TrendingUp,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  ChevronRight,
  Plus,
  X,
  BookOpen,
  Compass,
  Flame,
  Check,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { studyHubApi, StudyOverviewData } from '../../services/studyHubApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 300);

export const StudyHubScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();

  const [overview, setOverview] = useState<StudyOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickActionVisible, setQuickActionVisible] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const data = await studyHubApi.getOverview(token, user?.userId);
      setOverview(data);
    } catch (err: any) {
      console.warn('Failed to load study overview:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOverview();
  };

  const bg = isDark ? '#080d1a' : '#f8fafc';
  const cardBg = isDark ? '#11192d' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  // Compute urgent assignments and upcoming sessions for the horizontal slider
  const horizontalItems = [
    ...(overview?.urgentAssignments || []).map((asgn) => ({
      id: `asgn_${asgn.id}`,
      type: 'assignment' as const,
      title: asgn.title,
      subject: asgn.subject,
      badge: `Due ${asgn.dueDate}`,
      badgeColor: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.15)',
      priority: asgn.priority,
      route: 'StudyAssignments',
    })),
    ...(overview?.todaySessions || []).map((sess) => ({
      id: `sess_${sess.id}`,
      type: 'session' as const,
      title: sess.topic,
      subject: sess.subject,
      badge: `${sess.startTime} - ${sess.endTime}`,
      badgeColor: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.15)',
      priority: 'Today',
      route: 'StudyPlanner',
    })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 12 : 0) }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={bg} />

      {/* 1. Header: Elegant & Compact with Safe-Area Respect */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <View style={styles.headerLeft}>
          <View style={styles.brandBadgeRow}>
            <Text style={[styles.brandText, { color: textPrimary }]}>Study Hub</Text>
            <View style={styles.proTag}>
              <Text style={styles.proTagText}>ACADEMICS</Text>
            </View>
          </View>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Your personal learning space
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('StudyNotes')}
            style={[styles.headerIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Search size={18} color={textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('StudyProgress')}
            style={[styles.headerIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <TrendingUp size={18} color="#38bdf8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Featured Study Hero Card: "Make today count." */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('StudyPlanner')}
          style={styles.heroCardContainer}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1000&auto=format&fit=crop&q=80',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(8, 13, 26, 0.45)', 'rgba(8, 13, 26, 0.94)']}
            style={styles.heroGradient}
          >
            <View style={styles.heroBadge}>
              <Flame size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.heroBadgeText}>DAILY FOCUS</Text>
            </View>

            <Text style={styles.heroTitle}>Make today count.</Text>
            <Text style={styles.heroSubtitle}>
              Stay focused, keep learning, and reach your academic goals.
            </Text>

            <View style={styles.heroCtaRow}>
              <View style={styles.heroCtaBtn}>
                <Text style={styles.heroCtaBtnText}>Start Studying</Text>
                <ArrowRight size={14} color="#ffffff" />
              </View>
              <Text style={styles.heroSessionIndicator}>
                {overview?.todaySessionsCount
                  ? `${overview.todaySessionsCount} sessions planned`
                  : 'Timetable ready'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 3. Today's Overview: 3 Compact Statistical Metric Cards */}
        <View style={styles.overviewRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('StudyAssignments')}
            style={[styles.overviewCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={styles.overviewTop}>
              <View style={[styles.overviewIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <ListTodo size={16} color="#f59e0b" />
              </View>
              <Text style={[styles.overviewVal, { color: '#f59e0b' }]}>
                {overview?.pendingAssignmentsCount ?? 0}
              </Text>
            </View>
            <Text style={[styles.overviewTitle, { color: textPrimary }]}>Tasks Due</Text>
            <Text style={[styles.overviewSub, { color: textSecondary }]}>Coursework pending</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('StudyPlanner')}
            style={[styles.overviewCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={styles.overviewTop}>
              <View style={[styles.overviewIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Calendar size={16} color="#8b5cf6" />
              </View>
              <Text style={[styles.overviewVal, { color: '#8b5cf6' }]}>
                {overview?.todaySessionsCount ?? 0}
              </Text>
            </View>
            <Text style={[styles.overviewTitle, { color: textPrimary }]}>Sessions</Text>
            <Text style={[styles.overviewSub, { color: textSecondary }]}>Today's focus slots</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('StudyQuiz')}
            style={[styles.overviewCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={styles.overviewTop}>
              <View style={[styles.overviewIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Award size={16} color="#10b981" />
              </View>
              <Text style={[styles.overviewVal, { color: '#10b981' }]}>
                {overview?.averageQuizScore ? `${overview.averageQuizScore}%` : '—'}
              </Text>
            </View>
            <Text style={[styles.overviewTitle, { color: textPrimary }]}>Quiz Avg</Text>
            <Text style={[styles.overviewSub, { color: textSecondary }]}>Practice score</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Core Modules: Asymmetrical Visual Hierarchy (Wide Card + 2x2 Grid + Wide Card) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Academic Modules</Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>Fully connected & saved</Text>
        </View>

        {/* 4A. Featured Wider Card: MY NOTES */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('StudyNotes')}
          style={[styles.wideModuleCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <View style={styles.wideCardLeft}>
            <View style={[styles.moduleIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <FileText size={24} color="#38bdf8" />
            </View>
            <View style={styles.wideCardTextWrap}>
              <View style={styles.badgeLine}>
                <Text style={[styles.wideCardTitle, { color: textPrimary }]}>My Notes</Text>
                <View style={[styles.countTag, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Text style={[styles.countTagText, { color: '#38bdf8' }]}>
                    {overview?.notesCount ?? 0} saved
                  </Text>
                </View>
              </View>
              <Text style={[styles.wideCardDesc, { color: textSecondary }]} numberOfLines={2}>
                Personal study notes, dynamic formulas, exam cheatsheets & tags.
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={textSecondary} />
        </TouchableOpacity>

        {/* 4B. 2x2 Compact Grid: Materials, Assignments, Planner, Quiz */}
        <View style={styles.compactGrid}>
          {/* Module 2: Study Materials */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StudyMaterials')}
            style={[styles.compactModuleCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={styles.compactCardTop}>
              <View style={[styles.smallIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <FolderDown size={20} color="#10b981" />
              </View>
              <View style={[styles.miniPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Text style={[styles.miniPillText, { color: '#10b981' }]}>
                  {overview?.materialsCount ?? 0} Docs
                </Text>
              </View>
            </View>
            <Text style={[styles.compactCardTitle, { color: textPrimary }]}>Study Materials</Text>
            <Text style={[styles.compactCardDesc, { color: textSecondary }]} numberOfLines={2}>
              Syllabus, PYQs, slides & verified textbooks
            </Text>
          </TouchableOpacity>

          {/* Module 3: Assignments & Tasks */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StudyAssignments')}
            style={[styles.compactModuleCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={styles.compactCardTop}>
              <View style={[styles.smallIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <ListTodo size={20} color="#f59e0b" />
              </View>
              <View style={[styles.miniPill, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Text style={[styles.miniPillText, { color: '#f59e0b' }]}>
                  {overview?.pendingAssignmentsCount ?? 0} Due
                </Text>
              </View>
            </View>
            <Text style={[styles.compactCardTitle, { color: textPrimary }]}>Assignments</Text>
            <Text style={[styles.compactCardDesc, { color: textSecondary }]} numberOfLines={2}>
              Coursework deadlines, priority & submissions
            </Text>
          </TouchableOpacity>

          {/* Module 4: Study Planner */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StudyPlanner')}
            style={[styles.compactModuleCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={styles.compactCardTop}>
              <View style={[styles.smallIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Calendar size={20} color="#8b5cf6" />
              </View>
              <View style={[styles.miniPill, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <Text style={[styles.miniPillText, { color: '#8b5cf6' }]}>
                  {overview?.todaySessionsCount ?? 0} Today
                </Text>
              </View>
            </View>
            <Text style={[styles.compactCardTitle, { color: textPrimary }]}>Study Planner</Text>
            <Text style={[styles.compactCardDesc, { color: textSecondary }]} numberOfLines={2}>
              Timetable, focus slots & conflict validation
            </Text>
          </TouchableOpacity>

          {/* Module 5: Quiz & Practice */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StudyQuiz')}
            style={[styles.compactModuleCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={styles.compactCardTop}>
              <View style={[styles.smallIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Award size={20} color="#ec4899" />
              </View>
              <View style={[styles.miniPill, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
                <Text style={[styles.miniPillText, { color: '#ec4899' }]}>
                  {overview?.totalQuizAttempts ?? 0} Tests
                </Text>
              </View>
            </View>
            <Text style={[styles.compactCardTitle, { color: textPrimary }]}>Quiz & Practice</Text>
            <Text style={[styles.compactCardDesc, { color: textSecondary }]} numberOfLines={2}>
              Curated mock tests, instant grading & review
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4C. Featured Wider Card: STUDY PROGRESS */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('StudyProgress')}
          style={[styles.wideModuleCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <View style={styles.wideCardLeft}>
            <View style={[styles.moduleIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <TrendingUp size={24} color="#06b6d4" />
            </View>
            <View style={styles.wideCardTextWrap}>
              <View style={styles.badgeLine}>
                <Text style={[styles.wideCardTitle, { color: textPrimary }]}>Study Progress</Text>
                <View style={[styles.countTag, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                  <Text style={[styles.countTagText, { color: '#06b6d4' }]}>
                    {overview?.averageQuizScore ? `${overview.averageQuizScore}% Mastery` : 'Analytics'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.wideCardDesc, { color: textSecondary }]} numberOfLines={2}>
                Aggregated focus minutes, task completion rates & chronological study timeline.
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={textSecondary} />
        </TouchableOpacity>

        {/* 5. Horizontal Slider: Upcoming Deadlines & Sessions */}
        {horizontalItems.length > 0 && (
          <View style={styles.horizontalSection}>
            <View style={styles.horizontalSectionHeader}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>Upcoming & Focus</Text>
              <Text style={[styles.horizontalHint, { color: textSecondary }]}>Swipe horizontally</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              snapToInterval={HORIZONTAL_CARD_WIDTH + 12}
              decelerationRate="fast"
            >
              {horizontalItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(item.route)}
                  style={[
                    styles.horizontalItemCard,
                    { width: HORIZONTAL_CARD_WIDTH, backgroundColor: cardBg, borderColor: cardBorder },
                  ]}
                >
                  <View style={styles.hItemTop}>
                    <View style={[styles.hBadge, { backgroundColor: item.badgeBg }]}>
                      <Text style={[styles.hBadgeText, { color: item.badgeColor }]}>{item.badge}</Text>
                    </View>
                    <View style={styles.hTypeTag}>
                      <Text style={[styles.hTypeText, { color: textSecondary }]}>
                        {item.type === 'assignment' ? 'TASK' : 'SESSION'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.hTitle, { color: textPrimary }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.hSubject, { color: textSecondary }]} numberOfLines={1}>
                    {item.subject}
                  </Text>

                  <View style={[styles.hFooter, { borderTopColor: cardBorder }]}>
                    <Text style={styles.hActionText}>Open Details</Text>
                    <ArrowRight size={12} color="#38bdf8" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 6. Quick Recommendation Card */}
        <View style={[styles.tipCard, { backgroundColor: isDark ? '#0d1527' : '#f0f9ff', borderColor: cardBorder }]}>
          <View style={styles.tipIconBox}>
            <Sparkles size={20} color="#38bdf8" />
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={[styles.tipTitle, { color: textPrimary }]}>Pro Study Strategy</Text>
            <Text style={[styles.tipDesc, { color: textSecondary }]}>
              Schedule focused 45-minute blocks using the Study Planner. Students following scheduled timetable slots retain 35% more knowledge for mid-terms.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 7. Quick Action Floating Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setQuickActionVisible(true)}
        style={[styles.floatingActionBtn, { bottom: insets.bottom + 20 }]}
      >
        <Plus size={24} color="#ffffff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Quick Action Modal Sheet */}
      <Modal visible={quickActionVisible} animationType="fade" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setQuickActionVisible(false)}
          style={styles.modalBackdrop}
        >
          <View style={[styles.sheetCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: textPrimary }]}>Quick Academic Actions</Text>
              <TouchableOpacity onPress={() => setQuickActionVisible(false)} style={styles.sheetCloseBtn}>
                <X size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetActionsList}>
              <TouchableOpacity
                onPress={() => {
                  setQuickActionVisible(false);
                  navigation.navigate('StudyNotes');
                }}
                style={[styles.sheetActionItem, { borderColor: cardBorder }]}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <FileText size={18} color="#38bdf8" />
                </View>
                <View style={styles.sheetActionTextWrap}>
                  <Text style={[styles.sheetActionTitle, { color: textPrimary }]}>Create Study Note</Text>
                  <Text style={[styles.sheetActionSub, { color: textSecondary }]}>
                    Save formulas, code snippets & cheatsheets
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setQuickActionVisible(false);
                  navigation.navigate('StudyAssignments');
                }}
                style={[styles.sheetActionItem, { borderColor: cardBorder }]}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <ListTodo size={18} color="#f59e0b" />
                </View>
                <View style={styles.sheetActionTextWrap}>
                  <Text style={[styles.sheetActionTitle, { color: textPrimary }]}>Add Assignment</Text>
                  <Text style={[styles.sheetActionSub, { color: textSecondary }]}>
                    Track submission deadline & priority
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setQuickActionVisible(false);
                  navigation.navigate('StudyPlanner');
                }}
                style={[styles.sheetActionItem, { borderColor: cardBorder }]}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Calendar size={18} color="#8b5cf6" />
                </View>
                <View style={styles.sheetActionTextWrap}>
                  <Text style={[styles.sheetActionTitle, { color: textPrimary }]}>Schedule Focus Session</Text>
                  <Text style={[styles.sheetActionSub, { color: textSecondary }]}>
                    Reserve dedicated timetable study slots
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setQuickActionVisible(false);
                  navigation.navigate('StudyMaterials');
                }}
                style={[styles.sheetActionItem, { borderColor: cardBorder }]}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <FolderDown size={18} color="#10b981" />
                </View>
                <View style={styles.sheetActionTextWrap}>
                  <Text style={[styles.sheetActionTitle, { color: textPrimary }]}>Import Material</Text>
                  <Text style={[styles.sheetActionSub, { color: textSecondary }]}>
                    Select and store PDF syllabus & past papers
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setQuickActionVisible(false);
                  navigation.navigate('StudyQuiz');
                }}
                style={[styles.sheetActionItem, { borderColor: cardBorder }]}
              >
                <View style={[styles.sheetIconCircle, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                  <Award size={18} color="#ec4899" />
                </View>
                <View style={styles.sheetActionTextWrap}>
                  <Text style={[styles.sheetActionTitle, { color: textPrimary }]}>Take Practice Quiz</Text>
                  <Text style={[styles.sheetActionSub, { color: textSecondary }]}>
                    Test your understanding with auto-grading
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  proTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proTagText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  heroCardContainer: {
    height: 155,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'space-between',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroBadgeText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },
  heroCtaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  heroCtaBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroSessionIndicator: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  overviewIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  overviewTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  overviewSub: {
    fontSize: 10,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  wideModuleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  wideCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  moduleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideCardTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  wideCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  countTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  wideCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  compactModuleCard: {
    width: (SCREEN_WIDTH - 32 - 12) / 2,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  compactCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  smallIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  compactCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  compactCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  horizontalSection: {
    marginTop: 4,
  },
  horizontalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  horizontalHint: {
    fontSize: 11,
  },
  horizontalScrollContent: {
    gap: 12,
  },
  horizontalItemCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  hItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  hTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  hTypeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  hTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 3,
  },
  hSubject: {
    fontSize: 11,
    marginBottom: 10,
  },
  hFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  hActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  tipCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  tipDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  floatingActionBtn: {
    position: 'absolute',
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  sheetActionsList: {
    gap: 10,
    paddingBottom: 16,
  },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  sheetIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionTextWrap: {
    flex: 1,
  },
  sheetActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  sheetActionSub: {
    fontSize: 11,
  },
});
