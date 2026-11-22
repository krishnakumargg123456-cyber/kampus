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
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  Upload,
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Share2,
  Check,
  X,
  File,
  Clock,
  HardDrive,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { materialsApi, StudyMaterial } from '../../services/studyHubApi';
import API_BASE_URL from '../../config/api';

const SUBJECT_OPTIONS = [
  'All',
  'Data Structures & Algorithms',
  'Database Management Systems',
  'Operating Systems',
  'Computer Networks',
  'Artificial Intelligence',
  'General Studies',
];

export const StudyMaterialsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Upload Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('Data Structures & Algorithms');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size?: number;
    uri: string;
    mimeType?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadMaterials = useCallback(async () => {
    try {
      const data = await materialsApi.getMaterials(
        { search: searchQuery, subject: selectedSubject },
        token,
        user?.userId
      );
      setMaterials(data);
    } catch (err: any) {
      console.warn('Failed to load materials:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedSubject, token, user?.userId]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMaterials();
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'image/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          name: asset.name,
          size: asset.size,
          uri: asset.uri,
          mimeType: asset.mimeType,
        });
        if (!uploadTitle.trim()) {
          // Pre-populate title with filename without extension
          const cleanName = asset.name.replace(/\.[^/.]+$/, '');
          setUploadTitle(cleanName);
        }
      }
    } catch (err: any) {
      Alert.alert('Selection Error', err.message || 'Unable to pick document.');
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadTitle.trim()) {
      Alert.alert('Missing Title', 'Please give this material a title.');
      return;
    }

    setUploading(true);
    try {
      const fileName = selectedFile?.name || `${uploadTitle.trim().replace(/\s+/g, '_')}.pdf`;
      const ext = fileName.split('.').pop()?.toUpperCase() || 'PDF';
      const sizeStr = selectedFile?.size
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : '1.2 MB';

      await materialsApi.uploadMaterial(
        {
          title: uploadTitle.trim(),
          subject: uploadSubject,
          fileName,
          fileType: ext,
          fileSize: sizeStr,
          fileUri: selectedFile?.uri || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          uploadedBy: user?.fullName || 'Student',
        },
        token,
        user?.userId
      );

      setModalVisible(false);
      setSelectedFile(null);
      setUploadTitle('');
      loadMaterials();
      Alert.alert('Success', 'Study material has been uploaded and added to your collection.');
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload material.');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenMaterial = async (item: StudyMaterial) => {
    try {
      // Track opened on backend
      materialsApi.markOpened(item.id, token, user?.userId).catch(() => {});

      let fullUrl = item.fileUri;
      if (fullUrl.startsWith('/uploads/')) {
        fullUrl = `${API_BASE_URL}${fullUrl}`;
      }

      if (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) {
        await WebBrowser.openBrowserAsync(fullUrl);
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fullUrl);
      } else {
        Alert.alert('File', `Document path: ${item.fileName}`);
      }
    } catch (err: any) {
      Alert.alert('Open Failed', err.message || 'Unable to open file on your device.');
    }
  };

  const handleShareMaterial = async (item: StudyMaterial) => {
    try {
      let fullUrl = item.fileUri;
      if (fullUrl.startsWith('/uploads/')) {
        fullUrl = `${API_BASE_URL}${fullUrl}`;
      }
      await Share.share({
        title: item.title,
        message: `Check out "${item.title}" for ${item.subject} on KAMPUS Study Hub!\n${fullUrl}`,
      });
    } catch (err: any) {
      console.warn('Share error:', err.message);
    }
  };

  const handleDeleteMaterial = (id: string, title: string) => {
    Alert.alert(
      'Delete Material',
      `Are you sure you want to remove "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await materialsApi.deleteMaterial(id, token, user?.userId);
              setMaterials((prev) => prev.filter((m) => m.id !== id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete material');
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

  const renderMaterialCard = ({ item }: { item: StudyMaterial }) => {
    const isPdf = item.fileType.toUpperCase() === 'PDF';
    const isDoc = ['DOC', 'DOCX'].includes(item.fileType.toUpperCase());

    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.cardMain}>
          {/* File Icon Badge */}
          <View
            style={[
              styles.fileTypeBadge,
              {
                backgroundColor: isPdf
                  ? 'rgba(239, 68, 68, 0.15)'
                  : isDoc
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
              },
            ]}
          >
            <FileText
              size={24}
              color={isPdf ? '#ef4444' : isDoc ? '#3b82f6' : '#10b981'}
            />
            <Text
              style={[
                styles.fileTypeText,
                { color: isPdf ? '#ef4444' : isDoc ? '#3b82f6' : '#10b981' },
              ]}
            >
              {item.fileType.toUpperCase()}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.topInfoRow}>
              <View style={[styles.subjectTag, { backgroundColor: isDark ? '#1a2642' : '#f1f5f9' }]}>
                <Text style={styles.subjectTagText}>{item.subject}</Text>
              </View>
              <Text style={[styles.sizeText, { color: textSecondary }]}>{item.fileSize}</Text>
            </View>

            <Text style={[styles.materialTitle, { color: textPrimary }]} numberOfLines={2}>
              {item.title}
            </Text>

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: textSecondary }]}>
                {item.uploadedBy || 'Academic Repository'}
              </Text>
              {item.lastOpenedAt && (
                <View style={styles.openedBadge}>
                  <Clock size={11} color="#38bdf8" />
                  <Text style={styles.openedText}>Opened recently</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={[styles.cardBottomBar, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}>
          <TouchableOpacity
            onPress={() => handleOpenMaterial(item)}
            style={[styles.primaryActionBtn, { backgroundColor: '#0284c7' }]}
          >
            <ExternalLink size={15} color="#ffffff" />
            <Text style={styles.primaryActionBtnText}>Open Document</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              onPress={() => handleShareMaterial(item)}
              style={[styles.iconActionBtn, { backgroundColor: isDark ? '#1a2642' : '#f1f5f9' }]}
            >
              <Share2 size={16} color={textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDeleteMaterial(item.id, item.title)}
              style={[styles.iconActionBtn, { backgroundColor: isDark ? '#1a2642' : '#f1f5f9' }]}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Study Materials</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            PDF notes, past exams & syllabus repository
          </Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.uploadBtn}>
          <Upload size={18} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.uploadBtnText}>Import</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Search size={18} color={textSecondary} />
          <TextInput
            placeholder="Search syllabus, papers, or slides..."
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

      {/* Materials List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Loading documents...</Text>
        </View>
      ) : materials.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#e0f2fe' }]}>
            <FileText size={36} color="#38bdf8" />
          </View>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>No materials found</Text>
          <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
            {searchQuery || selectedSubject !== 'All'
              ? 'Try modifying your search query or subject filter.'
              : 'Import and organize your lecture slides, textbooks, and past papers here.'}
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.emptyActionBtn}>
            <Upload size={16} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.emptyActionBtnText}>Upload File</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id}
          renderItem={renderMaterialCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Upload Material Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Import Study Material</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Document Picker Box */}
              <TouchableOpacity
                onPress={handlePickDocument}
                style={[
                  styles.pickerBox,
                  {
                    backgroundColor: isDark ? '#141e33' : '#f8fafc',
                    borderColor: selectedFile ? '#38bdf8' : cardBorder,
                  },
                ]}
              >
                {selectedFile ? (
                  <View style={styles.fileSelectedRow}>
                    <Check size={24} color="#10b981" />
                    <View style={styles.fileSelectedTextWrap}>
                      <Text style={[styles.fileSelectedName, { color: textPrimary }]} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={[styles.fileSelectedSize, { color: textSecondary }]}>
                        {selectedFile.size ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Ready to save'}
                      </Text>
                    </View>
                    <Text style={styles.changeFileText}>Change</Text>
                  </View>
                ) : (
                  <View style={styles.pickerPlaceholder}>
                    <HardDrive size={32} color="#38bdf8" />
                    <Text style={[styles.pickerTitle, { color: textPrimary }]}>Select file from device</Text>
                    <Text style={[styles.pickerSubtitle, { color: textSecondary }]}>
                      Supports PDF, DOCX, PPTX, TXT, Images (up to 10MB)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[styles.inputLabel, { color: textSecondary }]}>DOCUMENT TITLE *</Text>
              <TextInput
                placeholder="e.g., DBMS Unit 3 - B+ Trees & Indexing"
                placeholderTextColor={textSecondary}
                value={uploadTitle}
                onChangeText={setUploadTitle}
                style={[styles.inputField, { backgroundColor: bg, borderColor: cardBorder, color: textPrimary }]}
              />

              <Text style={[styles.inputLabel, { color: textSecondary }]}>ACADEMIC SUBJECT</Text>
              <View style={styles.modalSubjectPills}>
                {SUBJECT_OPTIONS.filter((s) => s !== 'All').map((sub) => {
                  const isSel = uploadSubject === sub;
                  return (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setUploadSubject(sub)}
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.footerBtn, styles.cancelBtn, { borderColor: cardBorder }]}
              >
                <Text style={[styles.cancelBtnText, { color: textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUploadSubmit}
                disabled={uploading}
                style={[styles.footerBtn, styles.saveBtn]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save & Add</Text>
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
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  uploadBtnText: {
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
  cardMain: {
    flexDirection: 'row',
    gap: 14,
  },
  fileTypeBadge: {
    width: 52,
    height: 58,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  fileTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailsContainer: {
    flex: 1,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  sizeText: {
    fontSize: 11,
  },
  materialTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    fontSize: 11,
  },
  openedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openedText: {
    fontSize: 10,
    color: '#38bdf8',
    fontWeight: '600',
  },
  cardBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  pickerBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  fileSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  fileSelectedTextWrap: {
    flex: 1,
  },
  fileSelectedName: {
    fontSize: 13,
    fontWeight: '700',
  },
  fileSelectedSize: {
    fontSize: 11,
    marginTop: 2,
  },
  changeFileText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
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
