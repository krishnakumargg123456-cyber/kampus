import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
} from 'react-native';
import {
  BookOpen,
  Search,
  Download,
  Star,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Filter,
  Bookmark,
  Share2,
  ArrowRight,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const StudyHubScreen = () => {
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'notes' | 'pyq' | 'practice' | 'upload'>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [downloadedCount, setDownloadedCount] = useState<Record<string, number>>({});
  const [savedNotes, setSavedNotes] = useState<string[]>(['note_1']);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form states for upload
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadCategory, setUploadCategory] = useState('PDF Notes');

  const SUBJECTS = [
    { id: 'sub_1', name: 'Data Structures & Algorithms', code: 'CS301', notes: 42, color: '#3b82f6' },
    { id: 'sub_2', name: 'Database Management Systems', code: 'CS302', notes: 35, color: '#10b981' },
    { id: 'sub_3', name: 'Operating Systems & Architecture', code: 'CS303', notes: 28, color: '#8b5cf6' },
    { id: 'sub_4', name: 'Computer Networks & Protocols', code: 'CS304', notes: 31, color: '#f59e0b' },
    { id: 'sub_5', name: 'Artificial Intelligence & Neural Nets', code: 'CS305', notes: 49, color: '#ec4899' },
  ];

  const NOTES_LIST = [
    {
      id: 'note_1',
      title: 'Complete Graph Algorithms & Dynamic Programming Cheatsheet',
      subject: 'Data Structures & Algorithms',
      semester: 'Semester 4',
      author: 'Aarav Gupta (IITB Alumni)',
      downloads: 1420,
      rating: 4.9,
      size: '4.2 MB',
      type: 'PDF',
    },
    {
      id: 'note_2',
      title: 'DBMS Normalization (1NF to BCNF) & SQL Transactions Masterclass',
      subject: 'Database Management Systems',
      semester: 'Semester 5',
      author: 'Prof. S. R. Kulkarni',
      downloads: 980,
      rating: 4.8,
      size: '2.8 MB',
      type: 'PDF',
    },
    {
      id: 'note_3',
      title: 'Operating Systems: CPU Scheduling, Virtual Memory & Deadlocks',
      subject: 'Operating Systems',
      semester: 'Semester 5',
      author: 'Priya Sharma (Rank 1)',
      downloads: 1250,
      rating: 4.95,
      size: '5.1 MB',
      type: 'PDF',
    },
    {
      id: 'note_4',
      title: 'Computer Networks: TCP/IP Stack, Subnetting & Socket Programming',
      subject: 'Computer Networks',
      semester: 'Semester 6',
      author: 'Vikram Mehta',
      downloads: 740,
      rating: 4.7,
      size: '3.4 MB',
      type: 'PDF',
    },
  ];

  const PYQ_LIST = [
    {
      id: 'pyq_1',
      title: 'Mid-Sem Examination 2025 – Algorithms & Complexity',
      year: '2025',
      college: 'IIT Bombay',
      subject: 'CS301',
      solutionsIncluded: true,
    },
    {
      id: 'pyq_2',
      title: 'End-Sem Final Examination 2024 – Distributed Systems',
      year: '2024',
      college: 'IIT Delhi',
      subject: 'CS402',
      solutionsIncluded: true,
    },
    {
      id: 'pyq_3',
      title: 'Gate CS 10-Year Subjectwise Solved Question Bank',
      year: '2015-2025',
      college: 'All IITs Joint',
      subject: 'Core CS',
      solutionsIncluded: true,
    },
  ];

  const handleDownload = (id: string, title: string) => {
    setDownloadedCount((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
    Alert.alert('Download Started', `Downloading "${title}" to your device storage.`);
  };

  const toggleBookmark = (id: string) => {
    setSavedNotes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleUploadSubmit = () => {
    if (!uploadTitle.trim() || !uploadSubject.trim()) {
      Alert.alert('Incomplete Form', 'Please enter a title and select a subject.');
      return;
    }
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadModalVisible(false);
      setUploadTitle('');
      setUploadSubject('');
      Alert.alert('Upload Approved', 'Your study material has been verified and added to the Campus Library!');
    }, 1200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Study Hub</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            University Study Library, PYQs & Practice Tests
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.primary }]}
          onPress={() => setUploadModalVisible(true)}
        >
          <Upload size={16} color="#ffffff" />
          <Text style={styles.uploadButtonText}>Upload Notes</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'notes' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'notes' ? colors.primary : colors.textMuted }]}>
            Shared Notes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'pyq' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('pyq')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'pyq' ? colors.primary : colors.textMuted }]}>
            Previous Papers (PYQ)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'practice' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('practice')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'practice' ? colors.primary : colors.textMuted }]}>
            Practice Tests
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Search & Semester Filters */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search notes by topic, author, or subject..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Subjects Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Subjects</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRow}>
          {SUBJECTS.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={[
                styles.subjectCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                Shadows.card,
              ]}
            >
              <View style={[styles.subjectColorBar, { backgroundColor: sub.color }]} />
              <Text style={[styles.subjectCode, { color: colors.primary }]}>{sub.code}</Text>
              <Text style={[styles.subjectName, { color: colors.text }]} numberOfLines={2}>
                {sub.name}
              </Text>
              <Text style={[styles.subjectNotesCount, { color: colors.textMuted }]}>
                {sub.notes} verified documents
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content based on Active Tab */}
        {activeTab === 'notes' && (
          <View style={{ marginTop: Spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Verified Study Materials</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{NOTES_LIST.length} Resources</Text>
            </View>

            {NOTES_LIST.map((note) => {
              const isSaved = savedNotes.includes(note.id);
              const extraDownloads = downloadedCount[note.id] || 0;
              return (
                <View
                  key={note.id}
                  style={[
                    styles.noteCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    Shadows.card,
                  ]}
                >
                  <View style={styles.noteTopRow}>
                    <View style={[styles.pdfBadge, { backgroundColor: colors.primaryLight }]}>
                      <FileText size={16} color={colors.primary} />
                      <Text style={[styles.pdfBadgeText, { color: colors.primary }]}>{note.type}</Text>
                    </View>
                    <View style={styles.noteMetaRight}>
                      <View style={styles.ratingRow}>
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <Text style={[styles.ratingText, { color: colors.text }]}>{note.rating}</Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleBookmark(note.id)}>
                        <Bookmark
                          size={18}
                          color={isSaved ? colors.primary : colors.textMuted}
                          fill={isSaved ? colors.primary : 'transparent'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
                  <Text style={[styles.noteAuthor, { color: colors.textSecondary }]}>
                    {note.subject} • {note.author}
                  </Text>

                  <View style={[styles.noteFooter, { borderTopColor: colors.borderLight }]}>
                    <Text style={[styles.noteSize, { color: colors.textMuted }]}>
                      {note.size} • {note.downloads + extraDownloads} downloads
                    </Text>
                    <TouchableOpacity
                      style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleDownload(note.id, note.title)}
                    >
                      <Download size={14} color="#ffffff" />
                      <Text style={styles.downloadBtnText}>Download PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'pyq' && (
          <View style={{ marginTop: Spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Previous Year Question Papers</Text>
            </View>

            {PYQ_LIST.map((pyq) => (
              <View
                key={pyq.id}
                style={[
                  styles.pyqCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  Shadows.card,
                ]}
              >
                <View style={styles.pyqHeader}>
                  <Text style={[styles.pyqSubject, { color: colors.primary }]}>{pyq.subject} • {pyq.college}</Text>
                  <Text style={[styles.pyqYear, { color: colors.textMuted }]}>{pyq.year}</Text>
                </View>
                <Text style={[styles.pyqTitle, { color: colors.text }]}>{pyq.title}</Text>
                <View style={styles.pyqFooter}>
                  <View style={[styles.solutionsTag, { backgroundColor: colors.success + '20' }]}>
                    <CheckCircle2 size={12} color={colors.success} />
                    <Text style={[styles.solutionsText, { color: colors.success }]}>With Detailed Solutions</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleDownload(pyq.id, pyq.title)}
                  >
                    <Download size={14} color="#ffffff" />
                    <Text style={styles.downloadBtnText}>View PYQ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'practice' && (
          <View style={{ marginTop: Spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Adaptive Mock Tests</Text>
            </View>

            <View style={[styles.practiceBanner, { backgroundColor: colors.secondary }]}>
              <Text style={styles.practiceBannerTitle}>GATE & Semester Practice Arena</Text>
              <Text style={styles.practiceBannerSub}>
                Timed MCQ assessments curated by subject toppers with real-time score ranking.
              </Text>
              <TouchableOpacity
                style={[styles.startTestBtn, { backgroundColor: colors.accent }]}
                onPress={() => Alert.alert('Test Initiated', 'Good luck! 30 Questions - 45 Minutes timer started.')}
              >
                <Text style={styles.startTestBtnText}>Launch 30-Min Test</Text>
                <ArrowRight size={16} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Upload Notes Modal */}
      <Modal visible={uploadModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Share Study Material</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Help fellow scholars. Upload handwritten notes, summaries, or formula sheets.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Document Title</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Unit 3 OS Memory Management Notes"
              placeholderTextColor={colors.textMuted}
              value={uploadTitle}
              onChangeText={setUploadTitle}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Subject / Course</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. CS303 Operating Systems"
              placeholderTextColor={colors.textMuted}
              value={uploadSubject}
              onChangeText={setUploadSubject}
            />

            <View style={[styles.fakeUploadBox, { borderColor: colors.primary, backgroundColor: colors.primaryLight + '40' }]}>
              <Upload size={24} color={colors.primary} />
              <Text style={[styles.fakeUploadText, { color: colors.primary }]}>
                PDF Document Selected: (Notes_Unit3_verified.pdf)
              </Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setUploadModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleUploadSubmit}
              >
                <Text style={styles.modalSubmitText}>Submit for Approval</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  contentContainer: {
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
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  subjectCard: {
    width: 160,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  subjectColorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 18,
  },
  subjectNotesCount: {
    fontSize: 11,
    marginTop: 8,
  },
  noteCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  noteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  pdfBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  noteMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  noteAuthor: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  noteSize: {
    fontSize: 11,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  pyqCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  pyqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pyqSubject: {
    fontSize: 12,
    fontWeight: '700',
  },
  pyqYear: {
    fontSize: 12,
  },
  pyqTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  pyqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  solutionsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  solutionsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  practiceBanner: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  practiceBannerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  practiceBannerSub: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  startTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  startTestBtnText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    fontSize: 14,
  },
  fakeUploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: 6,
  },
  fakeUploadText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 2,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
