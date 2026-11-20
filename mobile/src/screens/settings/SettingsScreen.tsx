import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {
  Settings,
  Shield,
  Moon,
  Sun,
  Bell,
  Lock,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Globe,
  Eye,
  Smartphone,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const SettingsScreen = ({ navigation }: any) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);
  const [anonymousVoice, setAnonymousVoice] = useState(false);

  const handleExportData = () => {
    Alert.alert(
      'Export Student Data',
      'A secure archive containing your study history, digital locker files, and activity logs has been compiled and emailed to your address.'
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete KAMPUS Account',
      'Are you sure you want to permanently delete your account? All notes, tokens, and verified credentials will be revoked.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings & Privacy</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Account Security, Display Preferences & Data Controls
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              {isDark ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.accent} />}
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  {isDark ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Notifications Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Bell size={20} color={colors.primary} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Push Notifications</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Urgent exam notices, events & message alerts
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Privacy Section */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>STUDENT PRIVACY</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
          <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}>
            <View style={styles.rowLeft}>
              <Eye size={20} color={colors.primary} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Public Student Profile</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Allow classmates to find your portfolio
                </Text>
              </View>
            </View>
            <Switch
              value={profilePublic}
              onValueChange={setProfilePublic}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.rowLeft}>
              <Shield size={20} color={colors.primary} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Anonymous Grievance Mode</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
                  Hide name on Campus Voice posts
                </Text>
              </View>
            </View>
            <Switch
              value={anonymousVoice}
              onValueChange={setAnonymousVoice}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Security & Sessions */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>SECURITY & DATA</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
          <TouchableOpacity
            style={[styles.touchRow, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
            onPress={() => Alert.alert('Active Sessions', 'Active Session: Android Expo Go (Current Device) • Verified IP')}
          >
            <View style={styles.rowLeft}>
              <Smartphone size={20} color={colors.primary} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Active Device Sessions</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>1 Device logged in</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.touchRow, { borderBottomWidth: 1, borderBottomColor: colors.borderLight }]}
            onPress={handleExportData}
          >
            <View style={styles.rowLeft}>
              <Download size={20} color={colors.primary} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Export Academic Data (DPDP Act)</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>Download JSON/ZIP copy of all data</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.touchRow} onPress={handleDeleteAccount}>
            <View style={styles.rowLeft}>
              <Trash2 size={20} color={colors.error} />
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: colors.error }]}>Delete Student Account</Text>
                <Text style={[styles.rowDesc, { color: colors.textMuted }]}>Permanent removal of profile & files</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign out Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <LogOut size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out of KAMPUS</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          KAMPUS Student App v1.0.0 (Production Build 2026.11)
        </Text>
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs + 2,
    paddingHorizontal: 4,
  },
  cardGroup: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  touchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
    flex: 1,
  },
  rowTexts: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: Spacing.lg,
  },
});
