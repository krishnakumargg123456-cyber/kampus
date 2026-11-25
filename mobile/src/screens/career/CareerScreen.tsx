import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  TrendingUp,
  Bookmark,
  Building2,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  GraduationCap,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';
import { careerApi } from '../../services/careerApi';
import type { CareerOpportunity, JobApplication, ResumeDocument } from '../../../../src/types/career';

export const CareerScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<'internships' | 'jobs' | 'applications' | 'resumes'>('internships');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Backend state
  const [opportunities, setOpportunities] = useState<CareerOpportunity[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // New Resume Modal
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState('');
  const [newResumeSummary, setNewResumeSummary] = useState('');
  const [newResumeSkills, setNewResumeSkills] = useState('');
  const [creatingResume, setCreatingResume] = useState(false);

  const loadCareerData = useCallback(async () => {
    try {
      const data = await careerApi.getBootstrap(token, user?.userId);
      setOpportunities(data.opportunities || []);
      setApplications(data.applications || []);
      setSavedJobIds(data.savedOpportunityIds || []);
      setResumes(data.resumes || []);
    } catch (err: any) {
      console.warn('[CareerScreen] Load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    loadCareerData();
  }, [loadCareerData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCareerData();
  };

  const handleApply = async (opp: CareerOpportunity) => {
    if (opp.applicationMode === 'External Link' && opp.externalApplyUrl) {
      Linking.openURL(opp.externalApplyUrl);
      return;
    }

    const alreadyApplied = applications.some((a) => a.opportunityId === opp.id);
    if (alreadyApplied) {
      Alert.alert('Already Applied', 'Your application is already on file for this opportunity.');
      return;
    }

    setApplyingId(opp.id);
    try {
      const newApp = await careerApi.applyToOpportunity(
        opp.id,
        opp.title,
        opp.organizationName,
        'Applied via KAMPUS Student Portal',
        token,
        user?.userId
      );
      setApplications((prev) => [newApp, ...prev]);
      Alert.alert(
        'Application Submitted! 🎉',
        `Your verified academic profile has been sent to ${opp.organizationName} for the ${opp.title} role.`
      );
    } catch (err: any) {
      Alert.alert('Application Notice', err.message || 'Could not complete application.');
    } finally {
      setApplyingId(null);
    }
  };

  const handleToggleSave = async (oppId: string) => {
    try {
      const updated = await careerApi.toggleSavedOpportunity(oppId, token, user?.userId);
      setSavedJobIds(updated);
    } catch {
      setSavedJobIds((prev) =>
        prev.includes(oppId) ? prev.filter((id) => id !== oppId) : [...prev, oppId]
      );
    }
  };

  const handleCreateResume = async () => {
    if (!newResumeTitle.trim()) {
      Alert.alert('Required', 'Please enter a title for your resume.');
      return;
    }
    setCreatingResume(true);
    try {
      const skillList = newResumeSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const created = await careerApi.createResume(
        newResumeTitle.trim(),
        newResumeSummary.trim(),
        skillList,
        token,
        user?.userId
      );
      setResumes((prev) => [created, ...prev]);
      setShowResumeModal(false);
      setNewResumeTitle('');
      setNewResumeSummary('');
      setNewResumeSkills('');
      Alert.alert('Success', 'Resume version created successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create resume.');
    } finally {
      setCreatingResume(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    Alert.alert('Delete Resume', 'Are you sure you want to remove this resume version?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await careerApi.deleteResume(resumeId, token, user?.userId);
            setResumes((prev) => prev.filter((r) => r.id !== resumeId));
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not delete resume.');
          }
        },
      },
    ]);
  };

  const filteredOpportunities = opportunities.filter((o) => {
    const isInternship = o.opportunityType === 'Internship';
    const matchesTab = activeTab === 'internships' ? isInternship : !isInternship;
    if (!matchesTab) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.organizationName.toLowerCase().includes(q) ||
        o.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Career & Placement</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Verified Internships, Placement Drives & Resume Hub
          </Text>
        </View>
        <View style={styles.badge}>
          <Briefcase size={14} color="#3b82f6" />
          <Text style={styles.badgeText}>Recruiting '26</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'internships' && styles.activeTabItem]}
          onPress={() => setActiveTab('internships')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'internships' ? '#3b82f6' : colors.textMuted }]}>
            Internships ({opportunities.filter((o) => o.opportunityType === 'Internship').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'jobs' && styles.activeTabItem]}
          onPress={() => setActiveTab('jobs')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'jobs' ? '#3b82f6' : colors.textMuted }]}>
            Full-Time Jobs ({opportunities.filter((o) => o.opportunityType !== 'Internship').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'applications' && styles.activeTabItem]}
          onPress={() => setActiveTab('applications')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'applications' ? '#3b82f6' : colors.textMuted }]}>
            Tracker ({applications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'resumes' && styles.activeTabItem]}
          onPress={() => setActiveTab('resumes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'resumes' ? '#3b82f6' : colors.textMuted }]}>
            Resumes ({resumes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar for Listings */}
      {(activeTab === 'internships' || activeTab === 'jobs') && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search roles, companies, tech stacks..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading verified career opportunities...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          {/* Opportunities View */}
          {(activeTab === 'internships' || activeTab === 'jobs') && (
            <>
              {filteredOpportunities.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Building2 size={44} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No opportunities found</Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    Try adjusting your search criteria or check back soon for campus placement updates.
                  </Text>
                </View>
              ) : (
                filteredOpportunities.map((opp) => {
                  const isSaved = savedJobIds.includes(opp.id);
                  const isApplied = applications.some((a) => a.opportunityId === opp.id);
                  const isPending = applyingId === opp.id;

                  return (
                    <View
                      key={opp.id}
                      style={[
                        styles.card,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderLight,
                        },
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.companyRow}>
                          <View style={styles.avatarPlaceholder}>
                            <Building2 size={20} color="#3b82f6" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.roleTitle, { color: colors.text }]}>{opp.title}</Text>
                            <Text style={[styles.companyText, { color: colors.textMuted }]}>
                              {opp.organizationName} • {opp.location} ({opp.workFormat})
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleToggleSave(opp.id)}>
                            <Bookmark
                              size={22}
                              color={isSaved ? '#3b82f6' : colors.textMuted}
                              fill={isSaved ? '#3b82f6' : 'transparent'}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Details */}
                      <View style={styles.detailRow}>
                        <View style={styles.pill}>
                          <DollarSign size={13} color="#10b981" />
                          <Text style={styles.pillText}>{opp.compensationLabel}</Text>
                        </View>
                        <View style={styles.pill}>
                          <Clock size={13} color="#f59e0b" />
                          <Text style={styles.pillText}>Deadline: {opp.deadlineISO}</Text>
                        </View>
                      </View>

                      {/* Skills */}
                      <View style={styles.skillsRow}>
                        {opp.requiredSkills.slice(0, 4).map((skill, idx) => (
                          <View key={idx} style={[styles.skillTag, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                            <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Footer Actions */}
                      <View style={[styles.cardFooter, { borderTopColor: colors.borderLight }]}>
                        <Text style={[styles.footerEligibility, { color: colors.textMuted }]} numberOfLines={1}>
                          {opp.educationRequirement}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.applyBtn,
                            isApplied && styles.appliedBtn,
                            isPending && { opacity: 0.7 },
                          ]}
                          disabled={isApplied || isPending}
                          onPress={() => handleApply(opp)}
                        >
                          {isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Text style={styles.applyBtnText}>
                                {isApplied ? 'Applied ✓' : opp.applicationMode === 'External Link' ? 'Apply External ↗' : 'Apply Now'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* Applications Tracker View */}
          {activeTab === 'applications' && (
            <>
              {applications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <CheckCircle2 size={44} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No applications yet</Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    When you apply for internships or campus jobs, your real-time review progress will appear here.
                  </Text>
                </View>
              ) : (
                applications.map((app) => (
                  <View
                    key={app.id}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roleTitle, { color: colors.text }]}>{app.roleTitle}</Text>
                        <Text style={[styles.companyText, { color: colors.textMuted }]}>{app.companyName}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: app.status === 'Applied' ? '#eff6ff' : '#f0fdf4' }]}>
                        <Text style={[styles.statusText, { color: app.status === 'Applied' ? '#2563eb' : '#16a34a' }]}>
                          {app.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.appDate, { color: colors.textMuted }]}>
                      Applied on: {app.appliedDateISO ? new Date(app.appliedDateISO).toLocaleDateString() : 'Recent'}
                    </Text>
                    {Boolean(app.personalNotes) && (
                      <Text style={[styles.appNotes, { color: colors.textMuted }]}>
                        Notes: {app.personalNotes}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </>
          )}

          {/* Resumes View */}
          {activeTab === 'resumes' && (
            <>
              <TouchableOpacity style={styles.createResumeBtn} onPress={() => setShowResumeModal(true)}>
                <Plus size={18} color="#fff" />
                <Text style={styles.createResumeBtnText}>Create New Resume Version</Text>
              </TouchableOpacity>

              {resumes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <FileText size={44} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved resumes</Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    Build targeted resumes for software, data, or product roles.
                  </Text>
                </View>
              ) : (
                resumes.map((resume) => (
                  <View
                    key={resume.id}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roleTitle, { color: colors.text }]}>
                          {resume.versionName || (resume as any).title || 'Resume Profile'}
                        </Text>
                        <Text style={[styles.companyText, { color: colors.textMuted }]}>
                          Updated: {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : 'Recently'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteResume(resume.id)}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    {Boolean(resume.summary) && (
                      <Text style={[styles.resumeSummary, { color: colors.text }]} numberOfLines={2}>
                        {resume.summary}
                      </Text>
                    )}
                    <View style={styles.skillsRow}>
                      {(resume.skills || []).slice(0, 5).map((s: string, idx: number) => (
                        <View key={idx} style={[styles.skillTag, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                          <Text style={[styles.skillText, { color: colors.text }]}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Create Resume Modal */}
      <Modal visible={showResumeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Resume Profile</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
              placeholder="Resume Title (e.g. Frontend React SDE)"
              placeholderTextColor={colors.textMuted}
              value={newResumeTitle}
              onChangeText={setNewResumeTitle}
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight, height: 80 }]}
              placeholder="Professional Summary"
              placeholderTextColor={colors.textMuted}
              multiline
              value={newResumeSummary}
              onChangeText={setNewResumeSummary}
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.borderLight }]}
              placeholder="Skills (comma-separated, e.g. React, Node, Python)"
              placeholderTextColor={colors.textMuted}
              value={newResumeSkills}
              onChangeText={setNewResumeSkills}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.borderLight }]}
                onPress={() => setShowResumeModal(false)}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                disabled={creatingResume}
                onPress={handleCreateResume}
              >
                {creatingResume ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Create Resume</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
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
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  companyRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  companyText: {
    fontSize: 11,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 2,
  },
  footerEligibility: {
    fontSize: 10,
    flex: 1,
    marginRight: 8,
  },
  applyBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  appliedBtn: {
    backgroundColor: '#10b981',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  appDate: {
    fontSize: 10,
  },
  appNotes: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  createResumeBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  createResumeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  resumeSummary: {
    fontSize: 11,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 14,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalSubmitBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
