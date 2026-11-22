import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Zap,
  Activity,
  BarChart2,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { studyHubApi, StudyProgressData } from '../../services/studyHubApi';

export const StudyProgressScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();

  const [progress, setProgress] = useState<StudyProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const data = await studyHubApi.getProgress(token, user?.userId);
      setProgress(data);
    } catch (err: any) {
      console.warn('Failed to load study progress:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProgress();
  };

  const bg = isDark ? '#080d1a' : '#f8fafc';
  const cardBg = isDark ? '#11192d' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Screen Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}
        >
          <ArrowLeft size={20} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Study Progress</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Academic metrics & live activity tracking
          </Text>
        </View>
      </View>

      {loading && !progress ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Aggregating your study metrics...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner: Overall Momentum */}
          <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={[styles.heroGreeting, { color: textSecondary }]}>
                  {user?.fullName ? `${user.fullName}'s Academic Hub` : 'Your Academic Hub'}
                </Text>
                <Text style={[styles.heroTitle, { color: textPrimary }]}>Consistent Momentum</Text>
              </View>
              <View style={styles.sparkleIconBg}>
                <Zap size={22} color="#f59e0b" fill="#f59e0b" />
              </View>
            </View>

            <View style={styles.heroStatsGrid}>
              <View style={styles.heroStatItem}>
                <Text style={[styles.heroStatVal, { color: '#38bdf8' }]}>
                  {progress?.planner.estimatedStudyMinutes || 0}
                </Text>
                <Text style={[styles.heroStatLabel, { color: textSecondary }]}>Focus Mins</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={[styles.heroStatVal, { color: '#10b981' }]}>
                  {progress?.assignments.completionRate || 0}%
                </Text>
                <Text style={[styles.heroStatLabel, { color: textSecondary }]}>Tasks Done</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={[styles.heroStatVal, { color: '#f59e0b' }]}>
                  {progress?.quiz.averageScore || 0}%
                </Text>
                <Text style={[styles.heroStatLabel, { color: textSecondary }]}>Quiz Avg</Text>
              </View>
            </View>
          </View>

          {/* Module 1 & 2 Cards: Notes & Materials */}
          <View style={styles.metricsRow}>
            <View style={[styles.miniMetricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.miniCardHeader}>
                <FileText size={18} color="#38bdf8" />
                <Text style={[styles.miniMetricTitle, { color: textSecondary }]}>My Notes</Text>
              </View>
              <Text style={[styles.miniMetricVal, { color: textPrimary }]}>
                {progress?.notes.total || 0}
              </Text>
              <Text style={[styles.miniMetricSub, { color: textSecondary }]}>
                {progress?.notes.pinned || 0} pinned notes
              </Text>
            </View>

            <View style={[styles.miniMetricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.miniCardHeader}>
                <BookOpen size={18} color="#10b981" />
                <Text style={[styles.miniMetricTitle, { color: textSecondary }]}>Materials</Text>
              </View>
              <Text style={[styles.miniMetricVal, { color: textPrimary }]}>
                {progress?.materials.total || 0}
              </Text>
              <Text style={[styles.miniMetricSub, { color: textSecondary }]}>
                Imported documents
              </Text>
            </View>
          </View>

          {/* Module 3: Assignments Breakdown */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionTitleRow}>
                <CheckCircle2 size={18} color="#10b981" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>Assignments Completion</Text>
              </View>
              <Text style={[styles.sectionRateText, { color: '#10b981' }]}>
                {progress?.assignments.completionRate || 0}%
              </Text>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress?.assignments.completionRate || 0}%` },
                ]}
              />
            </View>

            <View style={styles.statBreakdownRow}>
              <Text style={[styles.statDetailText, { color: textSecondary }]}>
                Completed: <Text style={{ color: '#10b981', fontWeight: '700' }}>{progress?.assignments.completed || 0}</Text>
              </Text>
              <Text style={[styles.statDetailText, { color: textSecondary }]}>
                Pending: <Text style={{ color: '#f59e0b', fontWeight: '700' }}>{progress?.assignments.pending || 0}</Text>
              </Text>
              <Text style={[styles.statDetailText, { color: textSecondary }]}>
                Total: <Text style={{ color: textPrimary, fontWeight: '700' }}>{progress?.assignments.total || 0}</Text>
              </Text>
            </View>
          </View>

          {/* Module 4: Study Planner Breakdown */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionTitleRow}>
                <Clock size={18} color="#38bdf8" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>Timetable & Sessions</Text>
              </View>
            </View>

            <View style={styles.plannerGrid}>
              <View style={[styles.plannerPill, { backgroundColor: isDark ? '#141e33' : '#f1f5f9' }]}>
                <Text style={[styles.plannerPillVal, { color: '#38bdf8' }]}>
                  {progress?.planner.completed || 0}
                </Text>
                <Text style={[styles.plannerPillLabel, { color: textSecondary }]}>Finished</Text>
              </View>
              <View style={[styles.plannerPill, { backgroundColor: isDark ? '#141e33' : '#f1f5f9' }]}>
                <Text style={[styles.plannerPillVal, { color: '#f59e0b' }]}>
                  {progress?.planner.upcoming || 0}
                </Text>
                <Text style={[styles.plannerPillLabel, { color: textSecondary }]}>Upcoming</Text>
              </View>
              <View style={[styles.plannerPill, { backgroundColor: isDark ? '#141e33' : '#f1f5f9' }]}>
                <Text style={[styles.plannerPillVal, { color: '#10b981' }]}>
                  {progress?.planner.total || 0}
                </Text>
                <Text style={[styles.plannerPillLabel, { color: textSecondary }]}>Total Slots</Text>
              </View>
            </View>
          </View>

          {/* Module 5: Quiz Performance Breakdown */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionTitleRow}>
                <Award size={18} color="#f59e0b" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>Quiz & Practice Mastery</Text>
              </View>
            </View>

            <View style={styles.quizStatsRow}>
              <View style={styles.quizStatCol}>
                <Text style={[styles.quizStatBigVal, { color: '#38bdf8' }]}>
                  {progress?.quiz.totalAttempts || 0}
                </Text>
                <Text style={[styles.quizStatLabel, { color: textSecondary }]}>Tests Taken</Text>
              </View>
              <View style={styles.quizStatCol}>
                <Text style={[styles.quizStatBigVal, { color: '#f59e0b' }]}>
                  {progress?.quiz.averageScore || 0}%
                </Text>
                <Text style={[styles.quizStatLabel, { color: textSecondary }]}>Average Score</Text>
              </View>
              <View style={styles.quizStatCol}>
                <Text style={[styles.quizStatBigVal, { color: '#10b981' }]}>
                  {progress?.quiz.bestScore || 0}%
                </Text>
                <Text style={[styles.quizStatLabel, { color: textSecondary }]}>Best Score</Text>
              </View>
            </View>
          </View>

          {/* Chronological Activity Feed */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionTitleRow}>
                <Activity size={18} color="#8b5cf6" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>Recent Study Activity</Text>
              </View>
            </View>

            {progress?.activityFeed && progress.activityFeed.length > 0 ? (
              <View style={styles.activityList}>
                {progress.activityFeed.map((act) => {
                  return (
                    <View key={act.id} style={styles.activityItem}>
                      <View style={[styles.activityDot, { backgroundColor: '#38bdf8' }]} />
                      <View style={styles.activityTextWrap}>
                        <Text style={[styles.activityTitle, { color: textPrimary }]}>{act.title}</Text>
                        <View style={styles.activitySubRow}>
                          <Text style={[styles.activitySub, { color: textSecondary }]}>{act.subtitle}</Text>
                          <Text style={[styles.activityTime, { color: textSecondary }]}>
                            {new Date(act.timestamp).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.noActivityText, { color: textSecondary }]}>
                No recent study activity recorded yet.
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroGreeting: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sparkleIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  heroStatLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniMetricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  miniMetricTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  miniMetricVal: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
  },
  miniMetricSub: {
    fontSize: 11,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionRateText: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  statBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statDetailText: {
    fontSize: 12,
  },
  plannerGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  plannerPill: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  plannerPillVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  plannerPillLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  quizStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  quizStatCol: {
    alignItems: 'center',
  },
  quizStatBigVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  quizStatLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  activitySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  activitySub: {
    fontSize: 11,
  },
  activityTime: {
    fontSize: 11,
  },
  noActivityText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
});
