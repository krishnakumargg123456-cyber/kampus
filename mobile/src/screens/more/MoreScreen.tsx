import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Compass,
  Briefcase,
  GraduationCap,
  ShoppingBag,
  Wrench,
  CreditCard,
  Settings,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  User,
  Bell,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const MoreScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const MORE_ITEMS = [
    {
      id: 'notifications',
      title: '3. Notification Center',
      subtitle: 'Campus alerts, circulars, exam notices & deadlines',
      icon: <Bell size={22} color="#0284c7" />,
      route: 'Notifications',
    },
    {
      id: 'campus_life',
      title: '4. Campus Life',
      subtitle: 'Official notices, events, student clubs & voice',
      icon: <Compass size={22} color={colors.primary} />,
      route: 'CampusLife',
    },
    {
      id: 'career',
      title: '5. Career & Placement',
      subtitle: 'Internships, jobs, ATS resume builder & roadmaps',
      icon: <Briefcase size={22} color="#10b981" />,
      route: 'Career',
    },
    {
      id: 'college_explorer',
      title: '6. College Explorer',
      subtitle: 'Search NIRF ranked colleges, cutoffs & reviews',
      icon: <GraduationCap size={22} color="#8b5cf6" />,
      route: 'CollegeExplorer',
    },
    {
      id: 'market',
      title: '7. KAMPUS Market',
      subtitle: 'Student buy & sell, textbooks, free corner',
      icon: <ShoppingBag size={22} color="#f59e0b" />,
      route: 'Market',
    },
    {
      id: 'toolkit',
      title: '8. Student Toolkit',
      subtitle: 'Timetable, tasks, focus timer & digital locker',
      icon: <Wrench size={22} color="#06b6d4" />,
      route: 'StudentToolkit',
    },
    {
      id: 'student_profile',
      title: '9. Student Profile',
      subtitle: 'Academic details, bio, interests & badges',
      icon: <User size={22} color="#38bdf8" />,
      route: 'Profile',
    },
    {
      id: 'kampus_id',
      title: '10. KAMPUS ID Card',
      subtitle: 'Digital student identity card & QR verify',
      icon: <CreditCard size={22} color="#ec4899" />,
      route: 'KampusId',
    },
    {
      id: 'settings',
      title: '11. Settings & Privacy',
      subtitle: 'Security, appearance, notifications & data export',
      icon: <Settings size={22} color={colors.textSecondary} />,
      route: 'Settings',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>More Features</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Campus Services, Marketplace & Platform Tools
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Features List */}
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }, Shadows.card]}>
          {MORE_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.itemRow,
                idx < MORE_ITEMS.length - 1 && [styles.itemBorder, { borderBottomColor: colors.borderLight }],
              ]}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceElevated }]}>
                {item.icon}
              </View>
              <View style={styles.textBox}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.itemSub, { color: colors.textMuted }]}>{item.subtitle}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Super Admin Control Center Entry */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.adminBanner, { backgroundColor: colors.secondary }, Shadows.card]}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <View style={styles.adminBannerLeft}>
            <View style={styles.adminIconBox}>
              <ShieldAlert size={22} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminTitle}>Super Admin Control Center</Text>
              <Text style={styles.adminSub}>
                14 Modules: RBAC, Homepage Builder, Branding, Users & Logs
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#ffffff" />
        </TouchableOpacity>
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
  groupCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 4,
  },
  textBox: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  adminBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  adminIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  adminSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
});
