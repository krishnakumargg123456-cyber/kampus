import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { studyHubApi, StudyOverviewData } from '../../services/studyHubApi';

export const StudyHubScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();

  const [overview, setOverview] = useState<StudyOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const SIX_MODULES = [
    {
      id: 'notes',
      title: 'My Notes',
      subtitle: 'Personal notes, formulas & cheatsheets',
      route: 'StudyNotes',
      countText: `${overview?.notesCount ?? 0} Saved`,
      icon: FileText,
      color: '#38bdf8',
      bgLight: 'rgba(56, 189, 248, 0.12)',
    },
    {
      id: 'materials',
      title: 'Study Materials',
      subtitle: 'Syllabus, PYQs, slides & textbooks',
      route: 'StudyMaterials',
      countText: `${overview?.materialsCount ?? 0} Docs`,
      icon: FolderDown,
      color: '#10b981',
      bgLight: 'rgba(16, 185, 129, 0.12)',
    },
    {
      id: 'assignments',
      title: 'Assignments & Tasks',
      subtitle: 'Coursework deadlines & priorities',
      route: 'StudyAssignments',
      countText: `${overview?.pendingAssignmentsCount ?? 0} Due`,
      icon: ListTodo,
      color: '#f59e0b',
      bgLight: 'rgba(245, 158, 11, 0.12)',
    },
    {
      id: 'planner',
      title: 'Study Planner',
      subtitle: 'Daily focus timetable & study slots',
      route: 'StudyPlanner',
      countText: `${overview?.todaySessionsCount ?? 0} Today`,
      icon: Calendar,
      color: '#8b5cf6',
      bgLight: 'rgba(139, 92, 246, 0.12)',
    },
    {
      id: 'quiz',
      title: 'Quiz & Practice',
      subtitle: 'Mock tests, auto-grading & review',
      route: 'StudyQuiz',
      countText: `${overview?.totalQuizAttempts ?? 0} Tests`,
      icon: Award,
      color: '#ec4899',
      bgLight: 'rgba(236, 72, 153, 0.12)',
    },
    {
      id: 'progress',
      title: 'Study Progress',
      subtitle: 'Activity feed & academic metrics',
      route: 'StudyProgress',
      countText: `${overview?.averageQuizScore ?? 0}% Avg`,
      icon: TrendingUp,
      color: '#06b6d4',
      bgLight: 'rgba(6, 182, 212, 0.12)',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <View>
          <View style={styles.brandRow}>
            <Text style={[styles.brandText, { color: '#38bdf8' }]}>KAMPUS</Text>
            <View style={styles.proPill}>
              <Text style={styles.proText}>STUDY HUB</Text>
            </View>
          </View>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Your complete academic command center
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('StudyProgress')}
          style={[styles.headerProgressBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <TrendingUp size={18} color="#38bdf8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Search Bar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('StudyNotes')}
          style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <Search size={18} color={textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: textSecondary }]}>
            Search notes, syllabus, assignments...
          </Text>
        </TouchableOpacity>

        {/* Live Academic Momentum Card */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={[styles.summaryGreeting, { color: textSecondary }]}>
                {user?.fullName ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Welcome back'}
              </Text>
              <Text style={[styles.summaryTitle, { color: textPrimary }]}>Today's Study Status</Text>
            </View>
            <View style={styles.summaryIconCircle}>
              <Zap size={20} color="#f59e0b" fill="#f59e0b" />
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: '#38bdf8' }]}>
                {overview?.notesCount ?? 0}
              </Text>
              <Text style={[styles.metricLabel, { color: textSecondary }]}>Notes</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: '#f59e0b' }]}>
                {overview?.pendingAssignmentsCount ?? 0}
              </Text>
              <Text style={[styles.metricLabel, { color: textSecondary }]}>Pending</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: '#8b5cf6' }]}>
                {overview?.todaySessionsCount ?? 0}
              </Text>
              <Text style={[styles.metricLabel, { color: textSecondary }]}>Sessions</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: '#10b981' }]}>
                {overview?.averageQuizScore ?? 0}%
              </Text>
              <Text style={[styles.metricLabel, { color: textSecondary }]}>Quiz Avg</Text>
            </View>
          </View>
        </View>

        {/* Six Core Modules Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: textPrimary }]}>Core Modules</Text>
          <Text style={[styles.sectionSub, { color: textSecondary }]}>Verified & Functional</Text>
        </View>

        <View style={styles.modulesGrid}>
          {SIX_MODULES.map((item) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(item.route)}
                style={[
                  styles.moduleCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                <View style={styles.moduleCardTop}>
                  <View style={[styles.moduleIconBox, { backgroundColor: item.bgLight }]}>
                    <IconComp size={22} color={item.color} />
                  </View>
                  <View style={[styles.countPill, { backgroundColor: item.bgLight }]}>
                    <Text style={[styles.countPillText, { color: item.color }]}>{item.countText}</Text>
                  </View>
                </View>

                <Text style={[styles.moduleTitle, { color: textPrimary }]}>{item.title}</Text>
                <Text style={[styles.moduleSubtitle, { color: textSecondary }]} numberOfLines={2}>
                  {item.subtitle}
                </Text>

                <View style={styles.moduleFooter}>
                  <Text style={[styles.openText, { color: item.color }]}>Open Module</Text>
                  <ArrowRight size={14} color={item.color} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Urgent Assignments Alert (if any pending) */}
        {overview?.urgentAssignments && overview.urgentAssignments.length > 0 && (
          <View style={[styles.urgentSection, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.urgentHeader}>
              <View style={styles.urgentTitleWrap}>
                <AlertCircle size={18} color="#ef4444" />
                <Text style={[styles.urgentTitle, { color: textPrimary }]}>Urgent Coursework</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('StudyAssignments')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {overview.urgentAssignments.slice(0, 2).map((asgn) => (
              <TouchableOpacity
                key={asgn.id}
                onPress={() => navigation.navigate('StudyAssignments')}
                style={[styles.urgentItem, { borderTopColor: cardBorder }]}
              >
                <View style={styles.urgentItemLeft}>
                  <Text style={[styles.urgentItemTitle, { color: textPrimary }]} numberOfLines={1}>
                    {asgn.title}
                  </Text>
                  <Text style={[styles.urgentItemSub, { color: textSecondary }]}>
                    {asgn.subject} • Due {asgn.dueDate}
                  </Text>
                </View>
                <View style={[styles.urgentPriorityBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={styles.urgentPriorityText}>{asgn.priority}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Today's Study Sessions (if any scheduled) */}
        {overview?.todaySessions && overview.todaySessions.length > 0 && (
          <View style={[styles.urgentSection, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.urgentHeader}>
              <View style={styles.urgentTitleWrap}>
                <Clock size={18} color="#38bdf8" />
                <Text style={[styles.urgentTitle, { color: textPrimary }]}>Today's Focus Slots</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('StudyPlanner')}>
                <Text style={styles.seeAllText}>View Timetable</Text>
              </TouchableOpacity>
            </View>

            {overview.todaySessions.map((sess) => (
              <TouchableOpacity
                key={sess.id}
                onPress={() => navigation.navigate('StudyPlanner')}
                style={[styles.urgentItem, { borderTopColor: cardBorder }]}
              >
                <View style={styles.urgentItemLeft}>
                  <Text style={[styles.urgentItemTitle, { color: textPrimary }]} numberOfLines={1}>
                    {sess.topic}
                  </Text>
                  <Text style={[styles.urgentItemSub, { color: textSecondary }]}>
                    {sess.subject} • {sess.startTime} - {sess.endTime}
                  </Text>
                </View>
                <ChevronRight size={18} color={textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  proPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerProgressBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 13,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryGreeting: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricBlock: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
  },
  modulesGrid: {
    gap: 12,
  },
  moduleCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
  },
  moduleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  moduleSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  moduleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  openText: {
    fontSize: 12,
    fontWeight: '700',
  },
  urgentSection: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  urgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgentTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '700',
  },
  urgentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  urgentItemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  urgentItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  urgentItemSub: {
    fontSize: 11,
  },
  urgentPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgentPriorityText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
});
