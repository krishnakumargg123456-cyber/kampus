import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import {
  ShieldAlert,
  Users,
  Settings,
  Palette,
  Layout,
  Layers,
  Database,
  Bell,
  Activity,
  FileCheck,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const AdminDashboardScreen = () => {
  const { colors, isDark, updateAdminColors } = useTheme();

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'features' | 'branding' | 'users' | 'security'>('overview');

  // Feature Toggle states for all 10 main features
  const [featuresState, setFeaturesState] = useState([
    { id: 'f1', name: '1. Study Hub', enabled: true, maintenance: false },
    { id: 'f2', name: '2. KAMPUS AI', enabled: true, maintenance: false },
    { id: 'f3', name: '3. Student Community', enabled: true, maintenance: false },
    { id: 'f4', name: '4. Campus Life', enabled: true, maintenance: false },
    { id: 'f5', name: '5. Career & Placement', enabled: true, maintenance: false },
    { id: 'f6', name: '6. College Explorer', enabled: true, maintenance: false },
    { id: 'f7', name: '7. KAMPUS Market', enabled: true, maintenance: false },
    { id: 'f8', name: '8. Student Toolkit', enabled: true, maintenance: false },
    { id: 'f9', name: '9. KAMPUS ID & Profile', enabled: true, maintenance: false },
    { id: 'f10', name: '10. Settings & Privacy', enabled: true, maintenance: false },
  ]);

  // Dynamic branding state
  const [primaryBrandHex, setPrimaryBrandHex] = useState('#2563eb');
  const [appNameText, setAppNameText] = useState('KAMPUS');

  const toggleFeature = (id: string) => {
    setFeaturesState((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
    Alert.alert('Configuration Saved', 'Feature visibility updated across all client apps in real-time.');
  };

  const applyBranding = () => {
    if (primaryBrandHex.length === 7 && primaryBrandHex.startsWith('#')) {
      updateAdminColors({ primary: primaryBrandHex });
      Alert.alert('Branding Published', `Global primary theme color set to ${primaryBrandHex}.`);
    } else {
      Alert.alert('Invalid HEX', 'Please specify a valid 7-character HEX color code (e.g. #2563eb).');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Admin Top Header */}
      <View style={[styles.header, { backgroundColor: colors.secondary }]}>
        <View style={styles.headerLeft}>
          <ShieldAlert size={24} color="#ffffff" />
          <View>
            <Text style={styles.headerTitle}>SUPER ADMIN CENTER</Text>
            <Text style={styles.headerSubtitle}>Role: Master Administrator • 2FA Active</Text>
          </View>
        </View>
      </View>

      {/* Admin Module Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      >
        <TouchableOpacity
          style={[styles.tabBtn, activeAdminTab === 'overview' && [styles.activeTabBtn, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveAdminTab('overview')}
        >
          <Activity size={14} color={activeAdminTab === 'overview' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.tabBtnText, { color: activeAdminTab === 'overview' ? '#ffffff' : colors.textSecondary }]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeAdminTab === 'features' && [styles.activeTabBtn, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveAdminTab('features')}
        >
          <Layers size={14} color={activeAdminTab === 'features' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.tabBtnText, { color: activeAdminTab === 'features' ? '#ffffff' : colors.textSecondary }]}>
            10 Features
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeAdminTab === 'branding' && [styles.activeTabBtn, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveAdminTab('branding')}
        >
          <Palette size={14} color={activeAdminTab === 'branding' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.tabBtnText, { color: activeAdminTab === 'branding' ? '#ffffff' : colors.textSecondary }]}>
            Design & Branding
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeAdminTab === 'users' && [styles.activeTabBtn, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveAdminTab('users')}
        >
          <Users size={14} color={activeAdminTab === 'users' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.tabBtnText, { color: activeAdminTab === 'users' ? '#ffffff' : colors.textSecondary }]}>
            Users & Roles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeAdminTab === 'security' && [styles.activeTabBtn, { backgroundColor: colors.primary }]]}
          onPress={() => setActiveAdminTab('security')}
        >
          <Lock size={14} color={activeAdminTab === 'security' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.tabBtnText, { color: activeAdminTab === 'security' ? '#ffffff' : colors.textSecondary }]}>
            Audit & Security
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeAdminTab === 'overview' && (
          <View>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Registered Students</Text>
                <Text style={[styles.kpiValue, { color: colors.text }]}>12,480</Text>
                <Text style={[styles.kpiSub, { color: colors.success }]}>↑ +14% this month</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Daily Active Users</Text>
                <Text style={[styles.kpiValue, { color: colors.text }]}>8,920</Text>
                <Text style={[styles.kpiSub, { color: colors.success }]}>↑ 71% Engagement</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Study Materials</Text>
                <Text style={[styles.kpiValue, { color: colors.text }]}>3,420</Text>
                <Text style={[styles.kpiSub, { color: colors.primary }]}>99.4% Approved</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
                <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Gemini AI Queries</Text>
                <Text style={[styles.kpiValue, { color: colors.text }]}>45,120</Text>
                <Text style={[styles.kpiSub, { color: colors.info }]}>Avg Latency 1.2s</Text>
              </View>
            </View>

            {/* Quick Administrative Broadcast */}
            <View style={[styles.adminActionCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Emergency Push Broadcast</Text>
              <Text style={[styles.actionCardSub, { color: colors.textMuted }]}>
                Send targeted campus push announcement to all connected devices.
              </Text>
              <TouchableOpacity
                style={[styles.broadcastBtn, { backgroundColor: colors.secondary }]}
                onPress={() => Alert.alert('Broadcast Dispatched', 'Push notification sent to all active students.')}
              >
                <Bell size={16} color="#ffffff" />
                <Text style={styles.broadcastBtnText}>Dispatch Urgent Notice</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeAdminTab === 'features' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>10 Primary Features Management</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Enable, disable, or toggle maintenance mode for each of the 10 core systems.
            </Text>

            {featuresState.map((f) => (
              <View
                key={f.id}
                style={[
                  styles.featureRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  Shadows.card,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureName, { color: colors.text }]}>{f.name}</Text>
                  <Text style={[styles.featureStatus, { color: f.enabled ? colors.success : colors.error }]}>
                    {f.enabled ? 'Live & Operational' : 'Disabled by Admin'}
                  </Text>
                </View>
                <Switch
                  value={f.enabled}
                  onValueChange={() => toggleFeature(f.id)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
            ))}
          </View>
        )}

        {activeAdminTab === 'branding' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Global Design & Branding Control</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Changes apply instantly to the mobile app theme without recompiling code.
            </Text>

            <View style={[styles.brandingBox, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Application Display Name</Text>
              <TextInput
                style={[styles.adminInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                value={appNameText}
                onChangeText={setAppNameText}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                Primary Theme Brand Color (HEX)
              </Text>
              <View style={styles.colorRow}>
                <TextInput
                  style={[styles.adminInput, { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={primaryBrandHex}
                  onChangeText={setPrimaryBrandHex}
                />
                <View style={[styles.colorPreview, { backgroundColor: primaryBrandHex }]} />
              </View>

              <TouchableOpacity
                style={[styles.saveBrandingBtn, { backgroundColor: colors.primary }]}
                onPress={applyBranding}
              >
                <Text style={styles.saveBrandingText}>Publish Branding Tokens</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeAdminTab === 'users' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>User & RBAC Management</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Assign administrative roles: Super Admin, Moderator, Content Manager.
            </Text>

            <View style={[styles.userItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userNameText, { color: colors.text }]}>Priya Sharma (Current User)</Text>
                <Text style={[styles.userRoleText, { color: colors.primary }]}>Role: Super Admin</Text>
              </View>
              <View style={[styles.activePill, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.activePillText, { color: colors.success }]}>ACTIVE</Text>
              </View>
            </View>
          </View>
        )}

        {activeAdminTab === 'security' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Audit Logs</Text>
            <View style={[styles.auditBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.auditEntry, { color: colors.textSecondary }]}>
                [2026-11-18 23:25] Super Admin login authenticated from 127.0.0.1 (2FA verified)
              </Text>
              <Text style={[styles.auditEntry, { color: colors.textSecondary }]}>
                [2026-11-18 23:30] PostgreSQL schema migrations verified. 21 database tables ready.
              </Text>
              <Text style={[styles.auditEntry, { color: colors.textSecondary }]}>
                [2026-11-18 23:36] Node.js Express Auth gateway initialized with 6-digit real OTP engine.
              </Text>
            </View>
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  activeTabBtn: {},
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    width: '47%',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  adminActionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionCardSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: BorderRadius.md,
  },
  broadcastBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '700',
  },
  featureStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  brandingBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  adminInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    fontSize: 14,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  colorPreview: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveBrandingBtn: {
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  saveBrandingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userRoleText: {
    fontSize: 12,
    marginTop: 2,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  auditBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 8,
  },
  auditEntry: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'monospace',
  },
});
