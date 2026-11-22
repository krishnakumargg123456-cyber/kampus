import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  X,
  Target,
  Sparkles,
  BookOpen,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { plannerApi, StudyPlannerSession } from '../../services/studyHubApi';

const SUBJECT_OPTIONS = [
  'Data Structures & Algorithms',
  'Database Management Systems',
  'Operating Systems',
  'Computer Networks',
  'Artificial Intelligence',
  'General Studies',
];

export const StudyPlannerScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();

  const [sessions, setSessions] = useState<StudyPlannerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Generate 7 upcoming dates for daily tab strip
  const dateTabs = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString(undefined, { weekday: 'short' });
    const dayNum = d.getDate();
    return { dateStr, dayName, dayNum };
  });

  const [selectedDate, setSelectedDate] = useState(dateTabs[0].dateStr);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formSubject, setFormSubject] = useState('Data Structures & Algorithms');
  const [formTopic, setFormTopic] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStartTime, setFormStartTime] = useState('16:00');
  const [formEndTime, setFormEndTime] = useState('17:30');
  const [formGoals, setFormGoals] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await plannerApi.getSessions({ date: selectedDate }, token, user?.userId);
      setSessions(data);
    } catch (err: any) {
      console.warn('Failed to load planner sessions:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, token, user?.userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const openCreateModal = () => {
    setFormSubject('Data Structures & Algorithms');
    setFormTopic('');
    setFormDate(selectedDate);
    setFormStartTime('16:00');
    setFormEndTime('17:30');
    setFormGoals('');
    setModalVisible(true);
  };

  const handleSaveSession = async () => {
    if (!formTopic.trim()) {
      Alert.alert('Missing Topic', 'Please describe what you will study during this session.');
      return;
    }
    if (!formStartTime.trim() || !formEndTime.trim()) {
      Alert.alert('Missing Time', 'Please provide start and end times in HH:MM format (e.g., 14:00).');
      return;
    }
    if (formStartTime >= formEndTime) {
      Alert.alert('Invalid Time', 'Start time must be earlier than end time.');
      return;
    }

    setSubmitting(true);
    try {
      await plannerApi.createSession(
        {
          subject: formSubject,
          topic: formTopic.trim(),
          date: formDate,
          startTime: formStartTime.trim(),
          endTime: formEndTime.trim(),
          goals: formGoals.trim(),
        },
        token,
        user?.userId
      );

      setModalVisible(false);
      loadSessions();
      Alert.alert('Session Scheduled', 'Your study session has been added to your timetable.');
    } catch (err: any) {
      Alert.alert('Scheduling Conflict', err.message || 'Failed to schedule study session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (item: StudyPlannerSession) => {
    try {
      const updated = await plannerApi.toggleComplete(item.id, token, user?.userId);
      setSessions((prev) => prev.map((s) => (s.id === item.id ? updated : s)));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update session');
    }
  };

  const handleDeleteSession = (id: string, topic: string) => {
    Alert.alert(
      'Cancel Session',
      `Are you sure you want to remove the session "${topic}"?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await plannerApi.deleteSession(id, token, user?.userId);
              setSessions((prev) => prev.filter((s) => s.id !== id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  const bg = isDark ? '#080d1a' : '#f8fafc';
  const cardBg = isDark ? '#11192d' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  const renderSessionCard = ({ item }: { item: StudyPlannerSession }) => {
    const isDone = item.status === 'Completed';

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.cardHeaderRow}>
          {/* Toggle status button */}
          <TouchableOpacity
            onPress={() => handleToggleComplete(item)}
            style={styles.checkBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isDone ? (
              <CheckCircle2 size={24} color="#10b981" />
            ) : (
              <Circle size={24} color={textSecondary} />
            )}
          </TouchableOpacity>

          <View style={styles.contentWrap}>
            {/* Subject and Time Bar */}
            <View style={styles.topInfoRow}>
              <View style={[styles.subjectTag, { backgroundColor: isDark ? '#1a2642' : '#f1f5f9' }]}>
                <Text style={styles.subjectTagText}>{item.subject}</Text>
              </View>

              <View style={styles.timeBadge}>
                <Clock size={12} color="#38bdf8" />
                <Text style={styles.timeBadgeText}>
                  {item.startTime} – {item.endTime}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.itemTopic,
                { color: textPrimary },
                isDone && styles.completedTopic,
              ]}
              numberOfLines={2}
            >
              {item.topic}
            </Text>

            {item.goals ? (
              <View style={styles.goalRow}>
                <Target size={13} color={textSecondary} />
                <Text style={[styles.goalText, { color: textSecondary }]} numberOfLines={2}>
                  {item.goals}
                </Text>
              </View>
            ) : null}

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text
                style={[
                  styles.statusText,
                  { color: isDone ? '#10b981' : '#f59e0b', fontWeight: '700' },
                ]}
              >
                {isDone ? 'Session Finished' : 'Upcoming Session'}
              </Text>

              <TouchableOpacity
                onPress={() => handleDeleteSession(item.id, item.topic)}
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Study Planner</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Daily study schedule & focus timetable
          </Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.addBtn}>
          <Plus size={18} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Date Selector Tabs */}
      <View style={styles.dateTabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateTabsScroll}>
          {dateTabs.map((tab) => {
            const active = selectedDate === tab.dateStr;
            return (
              <TouchableOpacity
                key={tab.dateStr}
                onPress={() => setSelectedDate(tab.dateStr)}
                style={[
                  styles.dateTab,
                  {
                    backgroundColor: active ? '#0284c7' : cardBg,
                    borderColor: active ? '#0284c7' : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayNameText,
                    { color: active ? '#ffffff' : textSecondary, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {tab.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNumText,
                    { color: active ? '#ffffff' : textPrimary, fontWeight: '800' },
                  ]}
                >
                  {tab.dayNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sessions List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Loading timetable...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#e0f2fe' }]}>
            <Calendar size={36} color="#38bdf8" />
          </View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No study sessions scheduled</Text>
          <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
            Schedule a dedicated study slot for this day to keep yourself on track.
          </Text>
          <TouchableOpacity onPress={openCreateModal} style={styles.emptyActionBtn}>
            <Plus size={16} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.emptyActionBtnText}>Schedule Study Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Schedule Session Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Schedule Study Session</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: textSecondary }]}>STUDY SUBJECT</Text>
              <View style={styles.modalSubjectPills}>
                {SUBJECT_OPTIONS.map((sub) => {
                  const isSel = formSubject === sub;
                  return (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setFormSubject(sub)}
                      style={[
                        styles.modalSubjectChip,
                        {
                          backgroundColor: isSel ? '#38bdf8' : isDark ? '#141e33' : '#e2e8f0',
                          borderColor: isSel ? '#38bdf8' : cardBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalSubjectChipText,
                          { color: isSel ? '#080d1a' : textSecondary, fontWeight: isSel ? '700' : '500' },
                        ]}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: textSecondary }]}>TOPIC & OBJECTIVE *</Text>
              <TextInput
                placeholder="e.g., Dynamic Programming memoization practice"
                placeholderTextColor={textSecondary}
                value={formTopic}
                onChangeText={setFormTopic}
                style={[styles.inputField, { backgroundColor: bg, borderColor: cardBorder, color: textPrimary }]}
              />

              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>START TIME (HH:MM)</Text>
                  <TextInput
                    placeholder="16:00"
                    placeholderTextColor={textSecondary}
                    value={formStartTime}
                    onChangeText={setFormStartTime}
                    style={[styles.inputField, { backgroundColor: bg, borderColor: cardBorder, color: textPrimary }]}
                  />
                </View>
                <View style={styles.timeCol}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>END TIME (HH:MM)</Text>
                  <TextInput
                    placeholder="17:30"
                    placeholderTextColor={textSecondary}
                    value={formEndTime}
                    onChangeText={setFormEndTime}
                    style={[styles.inputField, { backgroundColor: bg, borderColor: cardBorder, color: textPrimary }]}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: textSecondary }]}>SPECIFIC GOALS (OPTIONAL)</Text>
              <TextInput
                placeholder="e.g., Solve 4 Leetcode medium questions, review DP state transitions"
                placeholderTextColor={textSecondary}
                value={formGoals}
                onChangeText={setFormGoals}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={[
                  styles.textAreaField,
                  { backgroundColor: bg, borderColor: cardBorder, color: textPrimary },
                ]}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.footerBtn, styles.cancelBtn, { borderColor: cardBorder }]}
              >
                <Text style={[styles.cancelBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveSession}
                disabled={submitting}
                style={[styles.footerBtn, styles.saveBtn]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Session</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dateTabsWrapper: {
    paddingVertical: 12,
  },
  dateTabsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  dateTab: {
    width: 60,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayNameText: {
    fontSize: 11,
  },
  dayNumText: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkBtn: {
    paddingTop: 2,
  },
  contentWrap: {
    flex: 1,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subjectTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600',
  },
  itemTopic: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  completedTopic: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  goalText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusText: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 12,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  inputField: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  modalSubjectPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalSubjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalSubjectChipText: {
    fontSize: 11,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCol: {
    flex: 1,
  },
  textAreaField: {
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  footerBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#0284c7',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
