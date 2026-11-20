import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
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
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const CareerScreen = () => {
  const { colors, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'internships' | 'jobs' | 'resume' | 'roadmaps'>('internships');
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const OPPORTUNITIES = [
    {
      id: 'job_1',
      title: 'Software Development Engineering Intern (Summer 2026)',
      company: 'Google Cloud Platform',
      logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80',
      type: 'Internship',
      location: 'Bengaluru / Hybrid',
      stipend: '₹1,25,000 / month',
      deadline: 'Dec 15, 2026',
      eligibility: 'B.Tech/Dual Degree (CS/IT/ECE) graduating in 2027',
      skills: ['C++', 'Java', 'Distributed Systems'],
    },
    {
      id: 'job_2',
      title: 'Machine Learning Research Fellow',
      company: 'Microsoft Research India',
      logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80',
      type: 'Internship',
      location: 'Bengaluru / On-site',
      stipend: '₹1,10,000 / month',
      deadline: 'Dec 20, 2026',
      eligibility: 'Pre-final or Final Year with strong Linear Algebra background',
      skills: ['PyTorch', 'Transformers', 'NLP'],
    },
    {
      id: 'job_3',
      title: 'Associate Product Manager (APM)',
      company: 'Razorpay Technologies',
      logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80',
      type: 'Full-time',
      location: 'Bengaluru',
      stipend: '₹22,00,000 CTC',
      deadline: 'Jan 10, 2027',
      eligibility: 'All Engineering & Tech Streams (Graduating Batch 2026)',
      skills: ['Product Analytics', 'System Design', 'User Empathy'],
    },
  ];

  const ROADMAPS = [
    {
      id: 'rm_1',
      title: 'Full Stack AI Engineering Roadmap',
      duration: '16 Weeks',
      topics: ['Python & FastApi', 'React Native & Expo', 'RAG & Vector DBs', 'LLM Deployment'],
      enrolled: 1840,
    },
    {
      id: 'rm_2',
      title: 'High-Frequency Trading & Systems Roadmap',
      duration: '12 Weeks',
      topics: ['Modern C++20', 'Linux Kernel Optimization', 'Lock-Free Queues', 'Network Sockets'],
      enrolled: 920,
    },
  ];

  const handleApply = (id: string, title: string, company: string) => {
    if (appliedJobs.includes(id)) {
      Alert.alert('Already Submitted', 'Your application is currently Under Review by the recruiting team.');
      return;
    }
    setAppliedJobs((prev) => [...prev, id]);
    Alert.alert(
      'Application Dispatched!',
      `Successfully applied to ${title} at ${company}. Your verified KAMPUS Student Portfolio has been transmitted.`
    );
  };

  const toggleSave = (id: string) => {
    setSavedJobs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Career & Placement</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Verified Internships, Placement Drives & Career Roadmaps
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'internships' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('internships')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'internships' ? colors.primary : colors.textMuted }]}>
            Opportunities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'resume' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('resume')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'resume' ? colors.primary : colors.textMuted }]}>
            Resume Builder
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'roadmaps' && [styles.activeTabItem, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTab('roadmaps')}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'roadmaps' ? colors.primary : colors.textMuted }]}>
            Roadmaps
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'internships' && (
          <View>
            {/* Search Box */}
            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by role, company, or tech stack..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Opportunities List */}
            {OPPORTUNITIES.map((job) => {
              const isApplied = appliedJobs.includes(job.id);
              const isSaved = savedJobs.includes(job.id);
              return (
                <View
                  key={job.id}
                  style={[
                    styles.jobCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    Shadows.card,
                  ]}
                >
                  <View style={styles.jobTopRow}>
                    <Image source={{ uri: job.logo }} style={styles.companyLogo} />
                    <View style={styles.jobMainInfo}>
                      <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
                      <Text style={[styles.companyName, { color: colors.primary }]}>{job.company}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleSave(job.id)}>
                      <Bookmark
                        size={20}
                        color={isSaved ? colors.primary : colors.textMuted}
                        fill={isSaved ? colors.primary : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.jobDetailsGrid}>
                    <View style={styles.detailItem}>
                      <MapPin size={13} color={colors.textMuted} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>{job.location}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <DollarSign size={13} color={colors.success} />
                      <Text style={[styles.detailText, { color: colors.success, fontWeight: '700' }]}>{job.stipend}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Clock size={13} color={colors.textMuted} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>Deadline: {job.deadline}</Text>
                    </View>
                  </View>

                  <View style={styles.skillsRow}>
                    {job.skills.map((skill, idx) => (
                      <View key={idx} style={[styles.skillTag, { backgroundColor: colors.surfaceElevated }]}>
                        <Text style={[styles.skillText, { color: colors.textSecondary }]}>{skill}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.jobFooter, { borderTopColor: colors.borderLight }]}>
                    <View style={[styles.typePill, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.typePillText, { color: colors.primary }]}>{job.type}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.applyBtn,
                        { backgroundColor: isApplied ? colors.success : colors.primary },
                      ]}
                      onPress={() => handleApply(job.id, job.title, job.company)}
                    >
                      <Text style={styles.applyBtnText}>
                        {isApplied ? 'Application Sent ✓' : 'Instant Apply'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'resume' && (
          <View>
            <View style={[styles.resumeCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
              <View style={styles.resumeHeader}>
                <View style={[styles.resumeIconBadge, { backgroundColor: colors.primaryLight }]}>
                  <FileText size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resumeTitle, { color: colors.text }]}>ATS-Optimized Student Resume</Text>
                  <Text style={[styles.resumeSubtitle, { color: colors.textMuted }]}>
                    Auto-generated from your verified KAMPUS achievements and coursework.
                  </Text>
                </View>
              </View>

              <View style={styles.atsScoreRow}>
                <Text style={[styles.atsLabel, { color: colors.textSecondary }]}>ATS Compatibility Score:</Text>
                <Text style={[styles.atsScore, { color: colors.success }]}>94 / 100</Text>
              </View>

              <TouchableOpacity
                style={[styles.downloadResumeBtn, { backgroundColor: colors.primary }]}
                onPress={() => Alert.alert('Resume Exported', 'Downloaded single-page PDF to your documents folder.')}
              >
                <Text style={styles.downloadResumeText}>Export PDF Resume</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'roadmaps' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Curated Career Roadmaps</Text>
            </View>

            {ROADMAPS.map((rm) => (
              <View
                key={rm.id}
                style={[
                  styles.roadmapCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  Shadows.card,
                ]}
              >
                <View style={styles.roadmapTop}>
                  <Text style={[styles.roadmapTitle, { color: colors.text }]}>{rm.title}</Text>
                  <Text style={[styles.roadmapDuration, { color: colors.primary }]}>{rm.duration}</Text>
                </View>
                <View style={styles.modulesGrid}>
                  {rm.topics.map((t, idx) => (
                    <View key={idx} style={[styles.topicPill, { backgroundColor: colors.surfaceElevated }]}>
                      <CheckCircle2 size={12} color={colors.success} />
                      <Text style={[styles.topicText, { color: colors.textSecondary }]}>{t}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.enrollBtn, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Roadmap Joined', `Enrolled in "${rm.title}". Daily curriculum unlocked!`)}
                >
                  <Text style={styles.enrollBtnText}>Start Roadmap</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
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
  scrollContent: {
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
  jobCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  jobTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  jobMainInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  jobDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  skillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  resumeCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  resumeHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resumeIconBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  resumeSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  atsScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  atsLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  atsScore: {
    fontSize: 18,
    fontWeight: '800',
  },
  downloadResumeBtn: {
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadResumeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  roadmapCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  roadmapTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  roadmapTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  roadmapDuration: {
    fontSize: 12,
    fontWeight: '700',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  topicText: {
    fontSize: 11,
    fontWeight: '500',
  },
  enrollBtn: {
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
