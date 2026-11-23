import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  Platform,
  StatusBar as RNStatusBar,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings,
  Shield,
  Moon,
  Sun,
  Smartphone,
  Bell,
  Lock,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Globe,
  Eye,
  HelpCircle,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  FileText,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';
import {
  settingsApi,
  accountApi,
  profileApi,
  UserSettings,
  NotificationPreferences,
  ProfileVisibility,
} from '../../services/profileSettingsApi';

export const SettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, themePreference, setThemePreference } = useTheme();
  const { user, token, logout } = useAuth();

  // Settings State
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    studyReminders: true,
    assignmentDeadlines: true,
    campusEvents: true,
    communityAlerts: true,
    announcements: true,
    general: true,
  });

  // Privacy
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('KAMPUS Members');
  const [showNotes, setShowNotes] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [searchableByStudents, setSearchableByStudents] = useState(true);

  // App & Regional
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Modals
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteReason, setDeleteReason] = useState('Graduating');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  // Load Settings from Backend
  const loadSettings = useCallback(async () => {
    try {
      const [data, notifs] = await Promise.all([
        settingsApi.getSettings(token, user?.userId).catch(() => null),
        settingsApi.getNotifications(token, user?.userId).catch(() => null),
      ]);
      if (notifs) {
        setNotifications((prev) => ({ ...prev, ...notifs }));
      }
      if (data) {
        if (data.privacy?.profileVisibility) {
          setProfileVisibility(data.privacy.profileVisibility);
        }
        if (data.privacy?.activityVisibility) {
          setShowNotes(Boolean(data.privacy.activityVisibility.notes));
          setShowAchievements(Boolean(data.privacy.activityVisibility.achievements));
          setShowEvents(Boolean(data.privacy.activityVisibility.events));
        }
        if (data.privacy?.discovery) {
          setSearchableByStudents(Boolean(data.privacy.discovery.searchableByStudents));
        }
        if (data.appearance?.reduceMotion !== undefined) {
          setReduceMotion(Boolean(data.appearance.reduceMotion));
        }
      }
    } catch (err: any) {
      console.warn('Failed to load settings:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Handle Notification Toggle
  const handleToggleNotification = async (key: keyof NotificationPreferences) => {
    const updated = !notifications[key];
    const newPrefs = { ...notifications, [key]: updated };
    setNotifications(newPrefs);

    try {
      setSavingField(key);
      await settingsApi.updateNotifications({ [key]: updated }, token, user?.userId);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update notification preference.');
      setNotifications(notifications); // revert
    } finally {
      setSavingField(null);
    }
  };

  // Handle Privacy Change
  const handleChangeVisibility = async (val: ProfileVisibility) => {
    setProfileVisibility(val);
    try {
      setSavingField('visibility');
      await settingsApi.updatePrivacy({ profileVisibility: val }, token, user?.userId);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile visibility.');
    } finally {
      setSavingField(null);
    }
  };

  const handleToggleActivity = async (key: 'notes' | 'achievements' | 'events', currentVal: boolean) => {
    const nextVal = !currentVal;
    if (key === 'notes') setShowNotes(nextVal);
    if (key === 'achievements') setShowAchievements(nextVal);
    if (key === 'events') setShowEvents(nextVal);

    try {
      setSavingField(key);
      await settingsApi.updatePrivacy(
        { activityVisibility: { [key]: nextVal } as any },
        token,
        user?.userId
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to update activity visibility.');
    } finally {
      setSavingField(null);
    }
  };

  const handleToggleSearchable = async () => {
    const nextVal = !searchableByStudents;
    setSearchableByStudents(nextVal);
    try {
      setSavingField('discovery');
      await settingsApi.updatePrivacy(
        { discovery: { searchableByStudents: nextVal } as any },
        token,
        user?.userId
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to update discovery settings.');
    } finally {
      setSavingField(null);
    }
  };

  // Export User Data
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await accountApi.exportData(token, user?.userId);
      const jsonString = JSON.stringify(data, null, 2);

      await Share.share({
        title: 'KAMPUS_Student_Data_Export.json',
        message: jsonString,
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export account data.');
    } finally {
      setIsExporting(false);
    }
  };

  // Account Deletion
  const handleConfirmDelete = async () => {
    if (deleteConfirmationInput.trim() !== 'DELETE MY ACCOUNT') {
      Alert.alert('Validation Error', 'Please type "DELETE MY ACCOUNT" exactly as shown.');
      return;
    }

    try {
      setIsDeletingAccount(true);
      await accountApi.deleteAccount('DELETE MY ACCOUNT', deleteReason, token, user?.userId);
      setDeleteModalVisible(false);
      Alert.alert(
        'Account Deleted',
        'Your KAMPUS account and all associated data have been permanently removed.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Deletion Failed', err.message || 'Could not delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Support Submission
  const handleSubmitSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      Alert.alert('Error', 'Please provide a subject and description.');
      return;
    }

    setIsSubmittingSupport(true);
    setTimeout(() => {
      setIsSubmittingSupport(false);
      setSupportModalVisible(false);
      setSupportSubject('');
      setSupportMessage('');
      Alert.alert('Ticket Submitted', 'Our student support team will review your query within 24 hours.');
    }, 1000);
  };

  // Logout
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of KAMPUS?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;
  const safeTopPadding = Platform.OS === 'ios'
    ? Math.max(insets.top, 44)
    : Math.max(insets.top, statusBarHeight, 38) + 8;

  const displayName = user?.fullName || 'KAMPUS Student';
  const displayEmail = user?.email || 'student@kampus.edu';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style="light" backgroundColor="#070d1e" translucent={true} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: safeTopPadding,
            backgroundColor: '#070d1e',
            borderBottomColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        <View>
          <Text style={styles.headerTitle}>Settings & Privacy</Text>
          <Text style={styles.headerSubtitle}>
            Account Security, Display Preferences & Data Controls
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. User Identity Header Card */}
        <View style={[styles.identityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.identityRow}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.identityAvatar} />
            ) : (
              <View style={[styles.identityAvatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.identityAvatarFallbackText}>{initials || 'KS'}</Text>
              </View>
            )}

            <View style={styles.identityTexts}>
              <View style={styles.identityNameRow}>
                <Text style={[styles.identityName, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <ShieldCheck size={16} color="#10b981" />
              </View>
              <Text style={[styles.identityEmail, { color: colors.textMuted }]} numberOfLines={1}>
                {displayEmail}
              </Text>
              <View style={styles.identityVerifiedPill}>
                <Text style={styles.identityVerifiedPillText}>Verified Student Account</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.viewProfileBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.7}
          >
            <User size={16} color={colors.primary} />
            <Text style={[styles.viewProfileBtnText, { color: colors.primary }]}>Manage Student Profile</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 2. Appearance Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.groupSubtitle, { color: colors.textMuted }]}>Choose your preferred color theme</Text>
          <View style={styles.themeSelectorRow}>
            {/* System */}
            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                themePreference === 'system' && [styles.themeOptionBtnActive, { borderColor: colors.primary }],
              ]}
              onPress={() => setThemePreference('system')}
              activeOpacity={0.7}
            >
              <Smartphone size={20} color={themePreference === 'system' ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.themeOptionText,
                  { color: themePreference === 'system' ? colors.primary : colors.text },
                ]}
              >
                System
              </Text>
            </TouchableOpacity>

            {/* Dark */}
            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                themePreference === 'dark' && [styles.themeOptionBtnActive, { borderColor: colors.primary }],
              ]}
              onPress={() => setThemePreference('dark')}
              activeOpacity={0.7}
            >
              <Moon size={20} color={themePreference === 'dark' ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.themeOptionText,
                  { color: themePreference === 'dark' ? colors.primary : colors.text },
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>

            {/* Light */}
            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                themePreference === 'light' && [styles.themeOptionBtnActive, { borderColor: colors.primary }],
              ]}
              onPress={() => setThemePreference('light')}
              activeOpacity={0.7}
            >
              <Sun size={20} color={themePreference === 'light' ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.themeOptionText,
                  { color: themePreference === 'light' ? colors.primary : colors.text },
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Sparkles size={20} color="#c084fc" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Reduce Animations</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Minimizes motion effects across transitions
                </Text>
              </View>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={setReduceMotion}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* 3. Account Security Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>ACCOUNT & SECURITY</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <ShieldCheck size={20} color="#10b981" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Email Verification</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  {displayEmail} (Verified)
                </Text>
              </View>
            </View>
            <CheckCircle2 size={18} color="#10b981" />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              Alert.alert(
                'Password Security',
                'Your account is secured via Clerk SSO. To update your password, use the "Forgot Password" link on the sign-in screen or request a password reset email.',
                [{ text: 'OK' }]
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Lock size={20} color={colors.primary} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Password & Authentication</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Protected via Clerk secure auth
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 4. Notifications Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>CAMPUS NOTIFICATIONS</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Study Reminders */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <BookOpen size={20} color="#38bdf8" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Study Reminders</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Planner alerts & daily flashcard notifications
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.studyReminders}
              onValueChange={() => handleToggleNotification('studyReminders')}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* Assignment Deadlines */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <AlertTriangle size={20} color="#f59e0b" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Assignment Deadlines</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Urgent submission and exam reminders
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.assignmentDeadlines}
              onValueChange={() => handleToggleNotification('assignmentDeadlines')}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* Campus Events */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Bell size={20} color="#ec4899" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Campus Events & Clubs</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Hackathons, cultural fests & workshops
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.campusEvents}
              onValueChange={() => handleToggleNotification('campusEvents')}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* Community Alerts */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Globe size={20} color="#10b981" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Community Replies</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Responses to your notes & discussions
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.communityAlerts}
              onValueChange={() => handleToggleNotification('communityAlerts')}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* System Announcements */}
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <ShieldCheck size={20} color="#38bdf8" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>System Announcements</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Platform updates and security notices
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.announcements}
              onValueChange={() => handleToggleNotification('announcements')}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* 5. Privacy & DPDP Act Controls */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>PRIVACY & DATA PROTECTION</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.groupSubtitle, { color: colors.textMuted }]}>Profile Visibility</Text>
          <View style={styles.visibilityOptionsRow}>
            {(['Public', 'KAMPUS Members', 'Private'] as ProfileVisibility[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.visibilityBtn,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                  profileVisibility === mode && [styles.visibilityBtnActive, { borderColor: colors.primary }],
                ]}
                onPress={() => handleChangeVisibility(mode)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.visibilityBtnText,
                    { color: profileVisibility === mode ? colors.primary : colors.text },
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Eye size={20} color="#38bdf8" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Share Notes in Profile</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Display shared study notes to classmates
                </Text>
              </View>
            </View>
            <Switch
              value={showNotes}
              onValueChange={() => handleToggleActivity('notes', showNotes)}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Shield size={20} color="#818cf8" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Discoverable by Students</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Allow classmates to search by name or branch
                </Text>
              </View>
            </View>
            <Switch
              value={searchableByStudents}
              onValueChange={handleToggleSearchable}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* 6. Language & Regional */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>LANGUAGE & REGION</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Globe size={20} color={colors.primary} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>App Language</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  {language === 'en' ? 'English (India)' : 'हिन्दी (Hindi)'}
                </Text>
              </View>
            </View>
            <View style={styles.langButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === 'en' && [styles.langBtnActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langBtnText, { color: language === 'en' ? '#fff' : colors.textMuted }]}>
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  language === 'hi' && [styles.langBtnActive, { backgroundColor: colors.primary }],
                ]}
                onPress={() => setLanguage('hi')}
              >
                <Text style={[styles.langBtnText, { color: language === 'hi' ? '#fff' : colors.textMuted }]}>
                  HI
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 7. Support & About */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>SUPPORT & ABOUT</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setSupportModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <HelpCircle size={20} color="#38bdf8" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Help & Student Support</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>Submit queries or report issues</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() =>
              Alert.alert(
                'Privacy Policy',
                'KAMPUS is compliant with India’s Digital Personal Data Protection (DPDP) Act 2023. Student data is never sold and is strictly utilized for academic collaboration and campus services.',
                [{ text: 'Close' }]
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <FileText size={20} color="#94a3b8" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Privacy Policy</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>DPDP Act 2023 Compliant</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Shield size={20} color="#94a3b8" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>KAMPUS Application</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>Version 2.4.0 (Build 2026.11)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 8. Data Export & Danger Zone */}
        <Text style={[styles.sectionHeading, { color: colors.error }]}>DATA & ACCOUNT ACTIONS</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Download My Data */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleExportData}
            disabled={isExporting}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Download size={20} color={colors.primary} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Download My Data</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  {isExporting ? 'Compiling JSON archive...' : 'Export verified notes, timetable & logs'}
                </Text>
              </View>
            </View>
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ChevronRight size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* Sign Out */}
          <TouchableOpacity style={styles.settingRow} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <LogOut size={20} color="#f59e0b" />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: '#f59e0b' }]}>Sign Out</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Log out of this device session
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* Delete Account */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              setDeleteConfirmationInput('');
              setDeleteModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Trash2 size={20} color={colors.error} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.error }]}>Permanently Delete Account</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Irreversible removal of all student data
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.dangerIconBadge}>
                <AlertTriangle size={24} color="#ef4444" />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Delete KAMPUS Account?</Text>
              <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
                This action is permanent and cannot be undone. All notes, digital locker certificates, and verified ID records will be erased.
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
                Type <Text style={{ color: '#ef4444', fontWeight: '700' }}>DELETE MY ACCOUNT</Text> to confirm:
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight },
                ]}
                value={deleteConfirmationInput}
                onChangeText={setDeleteConfirmationInput}
                placeholder="DELETE MY ACCOUNT"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeletingAccount}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalDeleteBtn,
                  deleteConfirmationInput.trim() !== 'DELETE MY ACCOUNT' && styles.modalDeleteBtnDisabled,
                ]}
                onPress={handleConfirmDelete}
                disabled={deleteConfirmationInput.trim() !== 'DELETE MY ACCOUNT' || isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalDeleteBtnText}>Delete Permanently</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Support Ticket Modal */}
      <Modal
        visible={supportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Help & Support</Text>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>SUBJECT</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight },
                ]}
                value={supportSubject}
                onChangeText={setSupportSubject}
                placeholder="Brief summary of your issue..."
                placeholderTextColor={colors.textMuted}
              />

              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 12 }]}>MESSAGE</Text>
              <TextInput
                style={[
                  styles.modalTextArea,
                  { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight },
                ]}
                value={supportMessage}
                onChangeText={setSupportMessage}
                placeholder="Describe what happened or request assistance..."
                placeholderTextColor={colors.textMuted}
                multiline={true}
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmitSupport}
                disabled={isSubmittingSupport}
              >
                {isSubmittingSupport ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Send size={16} color="#ffffff" />
                    <Text style={styles.modalSubmitBtnText}>Submit Query</Text>
                  </>
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
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  identityCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  identityAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#38bdf8',
    marginRight: 14,
  },
  identityAvatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
    marginRight: 14,
  },
  identityAvatarFallbackText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  identityTexts: {
    flex: 1,
  },
  identityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  identityName: {
    fontSize: 17,
    fontWeight: '700',
  },
  identityEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  identityVerifiedPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  identityVerifiedPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  groupSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionBtnActive: {
    borderWidth: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  visibilityOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  visibilityBtnActive: {
    borderWidth: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  visibilityBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  rowTexts: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    marginVertical: 12,
  },
  langButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  langBtnActive: {
    backgroundColor: '#38bdf8',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dangerIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalBody: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  modalTextArea: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteBtnDisabled: {
    opacity: 0.5,
  },
  modalDeleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalSubmitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
