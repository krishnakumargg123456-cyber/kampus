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
  Search,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  Trash2,
  Edit3,
  X,
  ListTodo,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { assignmentsApi, StudyAssignment } from '../../services/studyHubApi';

const SUBJECT_OPTIONS = [
  'All',
  'Data Structures & Algorithms',
  'Database Management Systems',
  'Operating Systems',
  'Computer Networks',
  'Artificial Intelligence',
  'General Studies',
];

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Completed'];
const PRIORITY_OPTIONS: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];

export const AssignmentsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();

  const [assignments, setAssignments] = useState<StudyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSubject, setFormSubject] = useState('Data Structures & Algorithms');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPriority, setFormPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [formStatus, setFormStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [submitting, setSubmitting] = useState(false);

  const loadAssignments = useCallback(async () => {
    try {
      const data = await assignmentsApi.getAssignments(
        {
          search: searchQuery,
          status: statusFilter,
          subject: subjectFilter,
          sort: 'dueDate',
        },
        token,
        user?.userId
      );
      setAssignments(data);
    } catch (err: any) {
      console.warn('Failed to load assignments:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter, subjectFilter, token, user?.userId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignments();
  };

  const openCreateModal = () => {
    const today = new Date();
    today.setDate(today.getDate() + 5);
    const defaultDate = today.toISOString().slice(0, 10);

    setEditingId(null);
    setFormTitle('');
    setFormDesc('');
    setFormSubject('Data Structures & Algorithms');
    setFormDueDate(defaultDate);
    setFormPriority('Medium');
    setFormStatus('Pending');
    setModalVisible(true);
  };

  const openEditModal = (item: StudyAssignment) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDesc(item.description || '');
    setFormSubject(item.subject);
    setFormDueDate(item.dueDate);
    setFormPriority(item.priority);
    setFormStatus(item.status);
    setModalVisible(true);
  };

  const handleSaveAssignment = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for the assignment.');
      return;
    }
    if (!formDueDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(formDueDate.trim())) {
      Alert.alert('Invalid Date', 'Please specify a valid due date in YYYY-MM-DD format (e.g., 2026-12-05).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await assignmentsApi.updateAssignment(
          editingId,
          {
            title: formTitle.trim(),
            description: formDesc.trim(),
            subject: formSubject,
            dueDate: formDueDate.trim(),
            priority: formPriority,
            status: formStatus,
          },
          token,
          user?.userId
        );
      } else {
        await assignmentsApi.createAssignment(
          {
            title: formTitle.trim(),
            description: formDesc.trim(),
            subject: formSubject,
            dueDate: formDueDate.trim(),
            priority: formPriority,
            status: formStatus,
          },
          token,
          user?.userId
        );
      }
      setModalVisible(false);
      loadAssignments();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: StudyAssignment) => {
    const nextStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await assignmentsApi.toggleStatus(item.id, nextStatus, token, user?.userId);
      setAssignments((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, status: nextStatus } : a))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update assignment status');
    }
  };

  const handleDeleteAssignment = (id: string, title: string) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await assignmentsApi.deleteAssignment(id, token, user?.userId);
              setAssignments((prev) => prev.filter((a) => a.id !== id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete assignment');
            }
          },
        },
      ]
    );
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.status === 'Completed').length;
  const pendingCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const bg = isDark ? '#080d1a' : '#f8fafc';
  const cardBg = isDark ? '#11192d' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  const renderAssignmentCard = ({ item }: { item: StudyAssignment }) => {
    const isCompleted = item.status === 'Completed';
    const isOverdue = !isCompleted && item.dueDate < todayStr;
    const isDueToday = !isCompleted && item.dueDate === todayStr;

    const priorityColor =
      item.priority === 'High'
        ? '#ef4444'
        : item.priority === 'Medium'
        ? '#f59e0b'
        : '#10b981';

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.cardHeaderRow}>
          {/* Checkbox */}
          <TouchableOpacity
            onPress={() => handleToggleStatus(item)}
            style={styles.checkBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isCompleted ? (
              <CheckCircle2 size={24} color="#10b981" />
            ) : (
              <Circle size={24} color={textSecondary} />
            )}
          </TouchableOpacity>

          {/* Details */}
          <View style={styles.contentWrap}>
            <View style={styles.badgeRow}>
              <View style={[styles.subjectTag, { backgroundColor: isDark ? '#1a2642' : '#f1f5f9' }]}>
                <Text style={styles.subjectTagText}>{item.subject}</Text>
              </View>

              <View style={[styles.priorityPill, { backgroundColor: `${priorityColor}1A` }]}>
                <Text style={[styles.priorityPillText, { color: priorityColor }]}>
                  {item.priority}
                </Text>
              </View>

              {item.status === 'In Progress' && (
                <View style={[styles.statusPill, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Text style={styles.statusPillText}>In Progress</Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.itemTitle,
                { color: textPrimary },
                isCompleted && styles.completedTitle,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            {item.description ? (
              <Text style={[styles.itemDesc, { color: textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            {/* Due date info */}
            <View style={styles.footerRow}>
              <View style={styles.dueDateWrap}>
                <Calendar
                  size={13}
                  color={isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : textSecondary}
                />
                <Text
                  style={[
                    styles.dueDateText,
                    {
                      color: isOverdue ? '#ef4444' : isDueToday ? '#f59e0b' : textSecondary,
                      fontWeight: isOverdue || isDueToday ? '700' : '500',
                    },
                  ]}
                >
                  {isOverdue
                    ? `Overdue (${item.dueDate})`
                    : isDueToday
                    ? `Due Today`
                    : `Due: ${item.dueDate}`}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsWrap}>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Edit3 size={16} color="#38bdf8" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteAssignment(item.id, item.title)}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Assignments & Tasks</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            {pendingCount} pending • {completedCount} completed
          </Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.addBtn}>
          <Plus size={18} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Metric Banner */}
      <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricNumber, { color: '#38bdf8' }]}>{totalCount}</Text>
            <Text style={[styles.metricLabel, { color: textSecondary }]}>Total</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNumber, { color: '#f59e0b' }]}>{pendingCount}</Text>
            <Text style={[styles.metricLabel, { color: textSecondary }]}>Pending</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNumber, { color: '#10b981' }]}>{completedCount}</Text>
            <Text style={[styles.metricLabel, { color: textSecondary }]}>Done</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricNumber, { color: textPrimary }]}>{completionRate}%</Text>
            <Text style={[styles.metricLabel, { color: textSecondary }]}>Progress</Text>
          </View>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
          <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatusFilter(s)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? '#0284c7' : isDark ? '#141e33' : '#e2e8f0',
                    borderColor: active ? '#0284c7' : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: active ? '#ffffff' : textSecondary, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Assignments List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Loading tasks...</Text>
        </View>
      ) : assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#e0f2fe' }]}>
            <ListTodo size={36} color="#38bdf8" />
          </View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No assignments found</Text>
          <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
            {statusFilter !== 'All' || subjectFilter !== 'All'
              ? 'Try resetting your status or subject filters.'
              : 'Add coursework deadlines, lab submissions, and study goals here.'}
          </Text>
          <TouchableOpacity onPress={openCreateModal} style={styles.emptyActionBtn}>
            <Plus size={16} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.emptyActionBtnText}>Create Assignment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={(item) => item.id}
          renderItem={renderAssignmentCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                {editingId ? 'Edit Assignment' : 'New Assignment'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: textSecondary }]}>ASSIGNMENT TITLE *</Text>
              <TextInput
                placeholder="e.g., Red-Black Tree Implementation & Report"
                placeholderTextColor={textSecondary}
                value={formTitle}
                onChangeText={setFormTitle}
                style={[styles.inputField, { backgroundColor: bg, borderColor: cardBorder, color: textPrimary }]}
              />

              <Text style={[styles.inputLabel, { color: textSecondary }]}>DUE DATE (YYYY-MM-DD) *</Text>
              <TextInput
                placeholder="2026-12-05"
                placeholderTextColor={textSecondary}
                value={formDueDate}
                onChangeText={setFormDueDate}
                style={[styles.inputField, { backgroundColor: bg, borderColor: cardBorder, color: textPrimary }]}
              />

              <Text style={[styles.inputLabel, { color: textSecondary }]}>PRIORITY LEVEL</Text>
              <View style={styles.prioritySelectorRow}>
                {PRIORITY_OPTIONS.map((p) => {
                  const isSel = formPriority === p;
                  const col = p === 'High' ? '#ef4444' : p === 'Medium' ? '#f59e0b' : '#10b981';
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setFormPriority(p)}
                      style={[
                        styles.prioritySelectBtn,
                        {
                          backgroundColor: isSel ? `${col}25` : isDark ? '#141e33' : '#f1f5f9',
                          borderColor: isSel ? col : cardBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.prioritySelectText, { color: isSel ? col : textSecondary }]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: textSecondary }]}>ACADEMIC SUBJECT</Text>
              <View style={styles.modalSubjectPills}>
                {SUBJECT_OPTIONS.filter((s) => s !== 'All').map((sub) => {
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

              <Text style={[styles.inputLabel, { color: textSecondary }]}>DESCRIPTION & REQUIREMENTS</Text>
              <TextInput
                placeholder="Details, submission guidelines, test cases to cover..."
                placeholderTextColor={textSecondary}
                value={formDesc}
                onChangeText={setFormDesc}
                multiline
                numberOfLines={4}
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
                onPress={handleSaveAssignment}
                disabled={submitting}
                style={[styles.footerBtn, styles.saveBtn]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Task</Text>
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
  metricCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  filtersWrapper: {
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
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
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  dueDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dueDateText: {
    fontSize: 11,
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
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
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prioritySelectBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prioritySelectText: {
    fontSize: 12,
    fontWeight: '700',
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
  textAreaField: {
    height: 90,
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
