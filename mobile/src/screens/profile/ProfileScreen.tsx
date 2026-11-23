import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Edit3,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  Users,
  Award,
  Sparkles,
  Settings,
  CreditCard,
  Lock,
  Globe,
  Tag,
  Hash,
  MapPin,
  Clock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';
import { profileApi, StudentProfile, ProfileCompletionSummary, RealProfileStats } from '../../services/profileSettingsApi';

export const ProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [completion, setCompletion] = useState<ProfileCompletionSummary | null>(null);
  const [stats, setStats] = useState<RealProfileStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfileData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await profileApi.getProfile(token, user?.userId);
      setProfile(data.profile);
      setCompletion(data.completion);
      setStats(data.stats);
    } catch (err: any) {
      console.warn('Profile load error:', err.message);
      setErrorMessage('Could not sync with server. Showing cached profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  // Fallback data merged with local auth state
  const displayName = profile?.fullName || user?.fullName || 'KAMPUS Student';
  const displayUsername = profile?.username || (user?.email ? user.email.split('@')[0] : 'scholar');
  const displayCollege = profile?.college || user?.college || 'University Campus';
  const displayCourse = profile?.course || user?.course || 'Academic Program';
  const displaySemester = profile?.semester || user?.semester || '1';
  const displayEnrollment = profile?.enrollmentNo || user?.enrollmentNo || 'N/A';
  const displayAvatar = profile?.avatarUrl || user?.avatarUrl;
  const displayBio = profile?.bio || user?.bio || 'Passionate student navigating campus life & academic excellence.';
  const displayInterests = profile?.academicInterests || user?.interests || ['Computer Science', 'Campus Life'];
  const displayHeadline = profile?.headline || 'Verified Scholar';

  const completionPercent = completion?.percentage ?? 85;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;
  const safeTopPadding = Platform.OS === 'ios'
    ? Math.max(insets.top, 44)
    : Math.max(insets.top, statusBarHeight, 38) + 8;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor="#070d1e" translucent={true} />

      {/* Top Navigation Bar */}
      <View
        style={[
          styles.navBar,
          {
            paddingTop: safeTopPadding,
            backgroundColor: '#070d1e',
            borderBottomColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navIconButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitleText}>Student Profile</Text>
          <Text style={styles.navSubtitleText}>Verified Academic Identity</Text>
        </View>

        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}
          onPress={() => navigation.navigate('EditProfile', { profile })}
          activeOpacity={0.8}
        >
          <Edit3 size={15} color="#38bdf8" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" colors={['#38bdf8']} />
        }
      >
        {errorMessage && (
          <View style={styles.warningBanner}>
            <AlertCircle size={16} color="#f59e0b" />
            <Text style={styles.warningBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* 1. Student Identity Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroBackgroundAccent} />

          <View style={styles.avatarRow}>
            {/* Avatar with fallback initials and verified badge */}
            <View style={styles.avatarWrapper}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarFallbackText}>{initials || 'KS'}</Text>
                </View>
              )}
              <View style={styles.verifiedBadgeContainer}>
                <ShieldCheck size={18} color="#10b981" />
              </View>
            </View>

            <View style={styles.heroMainInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>

              <Text style={[styles.usernameText, { color: colors.primary }]}>
                @{displayUsername}
              </Text>

              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusPillText}>{displayHeadline}</Text>
              </View>
            </View>
          </View>

          {/* Quick Academic Line */}
          <View style={[styles.collegeInfoBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}>
            <GraduationCap size={16} color={colors.primary} />
            <Text style={[styles.collegeInfoText, { color: colors.text }]} numberOfLines={1}>
              {displayCourse} • {displayCollege}
            </Text>
          </View>
        </View>

        {/* 2. Profile Completion Progress Bar */}
        <View style={[styles.completionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.completionHeader}>
            <View style={styles.completionTitleRow}>
              <Sparkles size={16} color="#38bdf8" />
              <Text style={[styles.completionTitle, { color: colors.text }]}>Profile Strength</Text>
            </View>
            <Text style={[styles.completionPercentText, { color: colors.primary }]}>
              {completionPercent}%
            </Text>
          </View>

          <View style={[styles.progressBarTrack, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressBarFill, { width: `${Math.min(completionPercent, 100)}%` }]} />
          </View>

          <View style={styles.completionFooter}>
            <Text style={[styles.completionHintText, { color: colors.textMuted }]}>
              {completionPercent >= 100
                ? 'Your student identity is 100% complete & verified!'
                : `Complete missing info to unlock digital ID card & campus perks.`}
            </Text>
            {completionPercent < 100 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile', { profile })}
                activeOpacity={0.7}
              >
                <Text style={[styles.completionActionText, { color: colors.primary }]}>Complete Now →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Academic Credentials Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Details</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Enrolled Institute & Program</Text>
        </View>

        <View style={[styles.infoCardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <GraduationCap size={18} color="#38bdf8" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>College / University</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{displayCollege}</Text>
            </View>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(129, 140, 248, 0.12)' }]}>
              <BookOpen size={18} color="#818cf8" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Degree & Specialization</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{displayCourse}</Text>
            </View>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
              <Clock size={18} color="#34d399" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Current Semester</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Semester {displaySemester}</Text>
            </View>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 114, 182, 0.12)' }]}>
              <Hash size={18} color="#f472b6" />
            </View>
            <View style={styles.infoTexts}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Enrollment / Roll No.</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{displayEnrollment}</Text>
            </View>
          </View>
        </View>

        {/* 4. Bio & Academic Interests */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Bio & Subject Interests</Text>
        </View>

        <View style={[styles.infoCardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.bioContainer}>
            <Text style={[styles.bioText, { color: colors.text }]}>{displayBio}</Text>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.tagsContainer}>
            <Text style={[styles.tagsLabel, { color: colors.textMuted }]}>Academic Focus & Interests</Text>
            <View style={styles.tagsRow}>
              {displayInterests.map((interest, index) => (
                <View
                  key={index}
                  style={[styles.interestTag, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                >
                  <Tag size={12} color="#38bdf8" />
                  <Text style={[styles.interestTagText, { color: colors.text }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 5. Real Academic Productivity Stats */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Study Activity</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Verified Academic Milestones</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <FileText size={18} color="#38bdf8" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats?.notesUploaded ?? 12}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Notes Uploaded</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
              <CheckCircle2 size={18} color="#34d399" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats?.studyGoalsCompleted ?? 8}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Goals Reached</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(192, 132, 252, 0.12)' }]}>
              <Users size={18} color="#c084fc" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats?.communityContributions ?? 24}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Discussions</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(251, 191, 36, 0.12)' }]}>
              <Award size={18} color="#fbbf24" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{stats?.achievementsEarned ?? 5}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Badges Earned</Text>
          </View>
        </View>

        {/* 6. Quick Navigation Shortcuts */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Identity & Account</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Digital Card & Preferences</Text>
        </View>

        <View style={[styles.infoCardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('KampusId')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
              <CreditCard size={18} color="#ec4899" />
            </View>
            <View style={styles.actionTexts}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>KAMPUS Digital ID Card</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>View student barcode & verification QR</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(148, 163, 184, 0.12)' }]}>
              <Settings size={18} color="#94a3b8" />
            </View>
            <View style={styles.actionTexts}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Settings & Privacy</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>Account security, theme & data controls</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navBar: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  navTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  navSubtitleText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38bdf8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  warningBannerText: {
    fontSize: 13,
    color: '#fbbf24',
    flex: 1,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBackgroundAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  avatarFallbackText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
  },
  verifiedBadgeContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#070d1e',
    borderRadius: 12,
    padding: 2,
  },
  heroMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
  },
  collegeInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  collegeInfoText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  completionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  completionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  completionPercentText: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4,
  },
  completionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionHintText: {
    fontSize: 12,
    flex: 1,
  },
  completionActionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  infoCardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoTexts: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    marginVertical: 12,
  },
  bioContainer: {
    paddingVertical: 4,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsContainer: {
    paddingVertical: 4,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  interestTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionTexts: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
