import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Award,
  GraduationCap,
  Sparkles,
  Share2,
  Lock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';

export const KampusIdScreen = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [showQrCode, setShowQrCode] = useState(false);

  const ACHIEVEMENTS = [
    { title: 'Winner: National Hackathon 2025', date: 'Oct 2025', issuer: 'Govt of India' },
    { title: 'Top 1% Global LeetCode Scholar', date: 'Aug 2025', issuer: 'LeetCode Community' },
    { title: 'Academic Excellence Dean List', date: 'May 2025', issuer: 'IIT Bombay Senate' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Digital KAMPUS ID</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Verified Student Identity & Academic Profile
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.qrToggleBtn, { backgroundColor: colors.primaryLight }]}
          onPress={() => setShowQrCode(!showQrCode)}
        >
          <QrCode size={18} color={colors.primary} />
          <Text style={[styles.qrToggleText, { color: colors.primary }]}>
            {showQrCode ? 'View ID Card' : 'Show QR'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Digital Student Identity Card */}
        {!showQrCode ? (
          <View style={[styles.idCard, { backgroundColor: colors.secondary }, Shadows.modal]}>
            <View style={styles.idCardHeader}>
              <View>
                <Text style={styles.idCardBrand}>KAMPUS DIGITAL ID</Text>
                <Text style={styles.idCardCollege}>{user?.college || 'IIT Bombay'}</Text>
              </View>
              <View style={styles.verifiedStamp}>
                <ShieldCheck size={14} color="#10b981" />
                <Text style={styles.verifiedStampText}>OFFICIALLY VERIFIED</Text>
              </View>
            </View>

            <View style={styles.idCardMiddle}>
              <Image
                source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' }}
                style={styles.idCardAvatar}
              />
              <View style={styles.idCardDetails}>
                <Text style={styles.studentName}>{user?.fullName || 'Priya Sharma'}</Text>
                <Text style={styles.studentCourse}>{user?.course || 'B.Tech Computer Science'}</Text>
                <Text style={styles.studentEnrollment}>
                  ID: {user?.enrollmentNo || '22B030149'} • Sem {user?.semester || '6'}
                </Text>
                <Text style={styles.studentEmail}>{user?.email || 'priya@iitb.ac.in'}</Text>
              </View>
            </View>

            <View style={styles.idCardFooter}>
              <Text style={styles.idValidity}>VALID THRU: JULY 2027</Text>
              <Text style={styles.idSecurityHash}>HASH: 9A8F-4B22-C019-E8B1</Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.qrDisplayCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Shadows.card,
            ]}
          >
            <View style={[styles.qrContainer, { backgroundColor: '#ffffff' }]}>
              {/* Simulated high-density QR representation */}
              <View style={styles.mockQrCode}>
                <QrCode size={180} color="#0f172a" />
              </View>
            </View>
            <Text style={[styles.qrLabel, { color: colors.text }]}>Secure Campus Check-in Pass</Text>
            <Text style={[styles.qrSub, { color: colors.textMuted }]}>
              Scan at Library turnstiles, Cafeteria counters, and Exam Hall entrances. Dynamic token refreshes every 60s.
            </Text>
          </View>
        )}

        {/* Academic Achievements Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Verified Student Credentials</Text>
        </View>

        {ACHIEVEMENTS.map((ach, idx) => (
          <View
            key={idx}
            style={[
              styles.achievementCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Shadows.card,
            ]}
          >
            <Award size={20} color="#f59e0b" style={{ marginRight: Spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>{ach.title}</Text>
              <Text style={[styles.achievementIssuer, { color: colors.textMuted }]}>
                {ach.issuer} • Issued {ach.date}
              </Text>
            </View>
            <CheckCircle2 size={16} color={colors.success} />
          </View>
        ))}

        {/* Skills & Portfolio */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Endorsed Skills</Text>
        </View>
        <View style={styles.skillsContainer}>
          {(user?.skills || ['React Native', 'TypeScript', 'Node.js', 'Distributed Systems', 'Python']).map(
            (skill, idx) => (
              <View key={idx} style={[styles.skillBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
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
  qrToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  qrToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  idCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  idCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  idCardBrand: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  idCardCollege: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  verifiedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  verifiedStampText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  idCardMiddle: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  idCardAvatar: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  idCardDetails: {
    flex: 1,
  },
  studentName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  studentCourse: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  studentEnrollment: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 3,
  },
  studentEmail: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  idValidity: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  idSecurityHash: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  qrDisplayCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  qrContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  mockQrCode: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  qrSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  achievementIssuer: {
    fontSize: 11,
    marginTop: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
