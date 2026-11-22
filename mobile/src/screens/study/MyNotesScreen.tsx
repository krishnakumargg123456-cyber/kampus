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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  Plus,
  Pin,
  Trash2,
  Edit3,
  BookOpen,
  Tag,
  Check,
  X,
  FileText,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { notesApi, StudyNote } from '../../services/studyHubApi';

const SUBJECT_OPTIONS = [
  'All',
  'Data Structures & Algorithms',
  'Database Management Systems',
  'Operating Systems',
  'Computer Networks',
  'Artificial Intelligence',
  'General Studies',
];

export const MyNotesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();

  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('Data Structures & Algorithms');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const data = await notesApi.getNotes(
        { search: searchQuery, subject: selectedSubject },
        token,
        user?.userId
      );
      setNotes(data);
    } catch (err: any) {
      console.warn('Failed to load notes:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedSubject, token, user?.userId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotes();
  };

  const openCreateModal = () => {
    setEditingNoteId(null);
    setFormTitle('');
    setFormSubject('Data Structures & Algorithms');
    setFormContent('');
    setFormTags('');
    setFormPinned(false);
    setModalVisible(true);
  };

  const openEditModal = (note: StudyNote) => {
    setEditingNoteId(note.id);
    setFormTitle(note.title);
    setFormSubject(note.subject || 'General Studies');
    setFormContent(note.content);
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setFormPinned(Boolean(note.pinned));
    setModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your note.');
      return;
    }
    if (!formContent.trim()) {
      Alert.alert('Missing Content', 'Please enter note content.');
      return;
    }

    setSubmitting(true);
    try {
      const tagList = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingNoteId) {
        await notesApi.updateNote(
          editingNoteId,
          {
            title: formTitle,
            subject: formSubject,
            content: formContent,
            tags: tagList,
            pinned: formPinned,
          },
          token,
          user?.userId
        );
      } else {
        await notesApi.createNote(
          {
            title: formTitle,
            subject: formSubject,
            content: formContent,
            tags: tagList,
            pinned: formPinned,
          },
          token,
          user?.userId
        );
      }
      setModalVisible(false);
      loadNotes();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (note: StudyNote) => {
    try {
      await notesApi.togglePin(note.id, token, user?.userId);
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update note pin status');
    }
  };

  const handleDeleteNote = (id: string, title: string) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notesApi.deleteNote(id, token, user?.userId);
              setNotes((prev) => prev.filter((n) => n.id !== id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete note');
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

  const renderNoteCard = ({ item }: { item: StudyNote }) => {
    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.subjectBadge, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe' }]}>
              <Text style={styles.subjectText}>{item.subject}</Text>
            </View>
            {item.pinned && (
              <View style={styles.pinnedBadge}>
                <Pin size={12} color="#f59e0b" fill="#f59e0b" />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => handleTogglePin(item)}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Pin
                size={16}
                color={item.pinned ? '#f59e0b' : textSecondary}
                fill={item.pinned ? '#f59e0b' : 'none'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={16} color="#38bdf8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteNote(item.id, item.title)}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.noteTitle, { color: textPrimary }]}>{item.title}</Text>
        <Text style={[styles.noteContent, { color: textSecondary }]} numberOfLines={3}>
          {item.content}
        </Text>

        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((t, idx) => (
              <View key={idx} style={[styles.tagPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}>
                <Tag size={10} color={textSecondary} />
                <Text style={[styles.tagText, { color: textSecondary }]}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={[styles.dateText, { color: textSecondary }]}>
            Updated {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>My Notes</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved
          </Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.addBtn}>
          <Plus size={18} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Search size={18} color={textSecondary} />
          <TextInput
            placeholder="Search notes by title, topic, or tag..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Subject Filter Pills */}
      <View style={styles.subjectPillsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectPillsList}>
          {SUBJECT_OPTIONS.map((sub) => {
            const active = selectedSubject === sub;
            return (
              <TouchableOpacity
                key={sub}
                onPress={() => setSelectedSubject(sub)}
                style={[
                  styles.subjectPill,
                  {
                    backgroundColor: active ? '#38bdf8' : isDark ? '#141e33' : '#e2e8f0',
                    borderColor: active ? '#38bdf8' : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.subjectPillText,
                    { color: active ? '#080d1a' : textSecondary, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notes List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Loading notes...</Text>
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#e0f2fe' }]}>
            <FileText size={36} color="#38bdf8" />
          </View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No notes found</Text>
          <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
            {searchQuery || selectedSubject !== 'All'
              ? 'Try modifying your search or subject filter.'
              : 'Create your first study note to organize key formulas and concepts.'}
          </Text>
          <TouchableOpacity onPress={openCreateModal} style={styles.emptyActionBtn}>
            <Plus size={16} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.emptyActionBtnText}>Create Note</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create / Edit Note Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                {editingNoteId ? 'Edit Study Note' : 'Create New Note'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: textSecondary }]}>NOTE TITLE *</Text>
              <TextInput
                placeholder="e.g., Graph Dijkstra Algorithm Cheatsheet"
                placeholderTextColor={textSecondary}
                value={formTitle}
                onChangeText={setFormTitle}
                style={[styles.inputField, { backgroundColor: bg, borderColor: cardBorder, color: textPrimary }]}
              />

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

              <Text style={[styles.inputLabel, { color: textSecondary }]}>TAGS (COMMA SEPARATED)</Text>
              <TextInput
                placeholder="e.g., graphs, exam-prep, algorithms"
                placeholderTextColor={textSecondary}
                value={formTags}
                onChangeText={setFormTags}
                style={[styles.inputField, { backgroundColor: bg, borderColor: cardBorder, color: textPrimary }]}
              />

              <Text style={[styles.inputLabel, { color: textSecondary }]}>NOTE CONTENT *</Text>
              <TextInput
                placeholder="Write your study notes, formulas, theorems, and explanations here..."
                placeholderTextColor={textSecondary}
                value={formContent}
                onChangeText={setFormContent}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                style={[
                  styles.textAreaField,
                  { backgroundColor: bg, borderColor: cardBorder, color: textPrimary },
                ]}
              />

              <TouchableOpacity
                onPress={() => setFormPinned(!formPinned)}
                style={[styles.pinToggleRow, { borderColor: cardBorder }]}
              >
                <Pin
                  size={18}
                  color={formPinned ? '#f59e0b' : textSecondary}
                  fill={formPinned ? '#f59e0b' : 'none'}
                />
                <Text style={[styles.pinToggleText, { color: textPrimary }]}>
                  Pin this note to the top of your Study Hub
                </Text>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: formPinned ? '#f59e0b' : textSecondary,
                      backgroundColor: formPinned ? '#f59e0b' : 'transparent',
                    },
                  ]}
                >
                  {formPinned && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.footerBtn, styles.cancelBtn, { borderColor: cardBorder }]}
              >
                <Text style={[styles.cancelBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNote}
                disabled={submitting}
                style={[styles.footerBtn, styles.saveBtn]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Note</Text>
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
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  subjectPillsContainer: {
    paddingVertical: 8,
  },
  subjectPillsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subjectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  subjectPillText: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  subjectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  pinnedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    padding: 4,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  noteContent: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  dateText: {
    fontSize: 11,
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
    marginTop: 12,
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
  textAreaField: {
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  pinToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  pinToggleText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
