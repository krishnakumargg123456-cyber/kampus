import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  Award,
  GraduationCap,
  Sparkles,
  Share2,
  Lock,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Clock,
  Building2,
  AlertCircle,
  FileCheck,
  X,
  ChevronRight,
  Eye,
  Send,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/tokens';
import {
  kampusIdApi,
  KampusIdBootstrapResponse,
} from '../../services/kampusIdApi';
import type { KampusIdRecord } from '../../../../src/types/kampusId';

export const KampusIdScreen = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, token } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [identity, setIdentity] = useState<KampusIdRecord | null>(null);
  const [qrPayload, setQrPayload] = useState<{
    token: string;
    expiresAt: string;
    verifyUrl: string;
    nonce: string;
  } | null>(null);
  const [publicVerificationUrl, setPublicVerificationUrl] = useState('');
  const [isRotatingQr, setIsRotatingQr] = useState(false);
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');

  // Modals
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [evidenceText, setEvidenceText] = useState('');
  const [documentType, setDocumentType] = useState('College ID Card');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Time remaining for QR TTL
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);

  // Load Data
  const loadIdentityData = useCallback(async () => {
    try {
      const data = await kampusIdApi.getBootstrap(token, user?.userId);
      setIdentity(data.identity);
      setQrPayload(data.qrPayload);
      setPublicVerificationUrl(data.publicVerificationUrl);
    } catch (err: any) {
      console.warn('[KampusIdScreen] Bootstrap error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.userId]);

  useEffect(() => {
    loadIdentityData();
  }, [loadIdentityData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadIdentityData();
  };

  // QR TTL Countdown Timer
  useEffect(() => {
    if (!qrPayload?.expiresAt) return;
    const interval = setInterval(() => {
      const diffMs = new Date(qrPayload.expiresAt).getTime() - Date.now();
      const sec = Math.max(0, Math.floor(diffMs / 1000));
      setSecondsRemaining(sec);
      if (sec === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [qrPayload?.expiresAt]);

  // Rotate QR
  const handleRotateQr = async () => {
    setIsRotatingQr(true);
    try {
      const fresh = await kampusIdApi.rotateQr(token, user?.userId);
      setQrPayload(fresh);
      Alert.alert('QR Rotated', 'A fresh security token has been generated. Previous tokens are now revoked.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not rotate QR code.');
    } finally {
      setIsRotatingQr(false);
    }
  };

  // Share Card
  const handleShareCard = async () => {
    if (!identity) return;
    try {
      const urlToShare = publicVerificationUrl || `https://kampus.edu/verify/id/${identity.kampusIdNumber}`;
      await Share.share({
        title: `${identity.fullName} - KAMPUS Digital ID`,
        message: `Verified Student Identity on KAMPUS:\n${identity.fullName} (${identity.kampusIdNumber})\n${identity.college} · ${identity.course}\n\nVerify authentic student status: ${urlToShare}`,
      });
    } catch (err) {
      // User cancelled
    }
  };

  // Submit Verification Request
  const handleSubmitVerification = async () => {
    if (!evidenceText.trim()) {
      Alert.alert('Required', 'Please enter your institutional email or verification document reference.');
      return;
    }

    setIsSubmittingVerification(true);
    try {
      const updated = await kampusIdApi.requestVerification(
        {
          documentType,
          evidenceText: evidenceText.trim(),
          studentNote: 'Submitted via KAMPUS Android Application',
        },
        token,
        user?.userId
      );
      setIdentity(updated);
      setVerificationModalVisible(false);
      setEvidenceText('');
      Alert.alert(
        'Request Submitted',
        'Your institutional student verification request is pending review by campus administration.'
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit verification request.');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  // Safe Display Values
  const displayName = identity?.fullName || user?.fullName || 'Campus Scholar';
  const displayIdNumber = identity?.kampusIdNumber || 'KMP-2026-PENDING';
  const displayCollege = identity?.college || user?.college || 'University Campus';
  const displayCourse = identity?.course || user?.course || 'Academic Program';
  const displayYear = identity?.yearOfStudy || 'Year 2';
  const displaySemester = identity?.semester || user?.semester || 'Semester 3';
  const displayEnrollment = identity?.enrollmentNumber || user?.enrollmentNo || 'N/A';
  const displayAvatar = identity?.avatarUrl || user?.avatarUrl;
  const isVerified = identity?.verificationStatus === 'APPROVED' || identity?.statusBadge === 'Verified Scholar';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 44) : insets.top + 12,
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.headerBadgeRow}>
            <CreditCard size={14} color="#38bdf8" />
            <Text style={styles.headerBadgeText}>KAMPUS DIGITAL ID</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Digital Student Identity</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Permanent cryptographically signed collegiate card
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}
            onPress={handleShareCard}
            activeOpacity={0.7}
          >
            <Share2 size={18} color="#38bdf8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconBtn, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.7}
          >
            <QrCode size={18} color="#c084fc" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Retrieving cryptographic student identity...
            </Text>
          </View>
        ) : (
          <>
            {/* 3D Student ID Card (Front / Back Flip) */}
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => setCardSide((prev) => (prev === 'front' ? 'back' : 'front'))}
              style={[
                styles.idCardContainer,
                {
                  backgroundColor: '#0c1630',
                  borderColor: isVerified ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.12)',
                },
                Shadows.modal,
              ]}
            >
              {/* Card Holographic Top Bar */}
              <View style={styles.cardTopBar}>
                <View style={styles.brandRow}>
                  <Sparkles size={16} color="#38bdf8" />
                  <Text style={styles.cardBrandTitle}>KAMPUS PLATFORM ID</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      borderColor: isVerified ? '#10b981' : '#f59e0b',
                    },
                  ]}
                >
                  {isVerified ? (
                    <ShieldCheck size={12} color="#10b981" />
                  ) : (
                    <AlertCircle size={12} color="#f59e0b" />
                  )}
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isVerified ? '#34d399' : '#fbbf24' },
                    ]}
                  >
                    {identity?.statusBadge || 'Campus Member'}
                  </Text>
                </View>
              </View>

              {cardSide === 'front' ? (
                /* FRONT SIDE */
                <View style={styles.cardFrontContent}>
                  <View style={styles.cardMiddleRow}>
                    <View style={styles.avatarWrapper}>
                      {displayAvatar ? (
                        <Image source={{ uri: displayAvatar }} style={styles.studentAvatar} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarFallbackText}>
                            {displayName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.avatarShieldDot}>
                        <ShieldCheck size={12} color="#ffffff" />
                      </View>
                    </View>

                    <View style={styles.studentMetaColumn}>
                      <Text style={styles.studentNameText} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={styles.idNumberCode}>{displayIdNumber}</Text>
                      <Text style={styles.collegeNameText} numberOfLines={1}>
                        {displayCollege}
                      </Text>
                      <Text style={styles.courseNameText} numberOfLines={1}>
                        {displayCourse}
                      </Text>
                    </View>
                  </View>

                  {/* Card Bottom Meta */}
                  <View style={styles.cardBottomGrid}>
                    <View style={styles.cardMetaBlock}>
                      <Text style={styles.metaLabel}>ACADEMIC STAGE</Text>
                      <Text style={styles.metaValue}>
                        {displayYear} · {displaySemester}
                      </Text>
                    </View>

                    <View style={styles.cardMetaBlock}>
                      <Text style={styles.metaLabel}>ENROLLMENT NO</Text>
                      <Text style={styles.metaValue}>{displayEnrollment}</Text>
                    </View>

                    <View style={styles.cardMetaBlock}>
                      <Text style={styles.metaLabel}>VALID THRU</Text>
                      <Text style={styles.metaValue}>
                        {identity?.validUntil
                          ? new Date(identity.validUntil).toLocaleDateString([], {
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'July 2027'}
                      </Text>
                    </View>
                  </View>

                  {/* Tap to Flip Notice */}
                  <View style={styles.flipNoticeRow}>
                    <RotateCcw size={12} color="#94a3b8" />
                    <Text style={styles.flipNoticeText}>Tap card to flip for security back details</Text>
                  </View>
                </View>
              ) : (
                /* BACK SIDE */
                <View style={styles.cardBackContent}>
                  <Text style={styles.backSectionTitle}>OFFICIAL VERIFICATION DETAILS</Text>

                  <View style={styles.backInfoRow}>
                    <Text style={styles.backInfoLabel}>Issue Date:</Text>
                    <Text style={styles.backInfoValue}>
                      {identity?.issueDate
                        ? new Date(identity.issueDate).toLocaleDateString([], {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'November 2026'}
                    </Text>
                  </View>

                  <View style={styles.backInfoRow}>
                    <Text style={styles.backInfoLabel}>Security Nonce:</Text>
                    <Text style={[styles.backInfoValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                      {qrPayload?.nonce ? qrPayload.nonce.slice(0, 16) : 'SEC-9A8F4B22'}
                    </Text>
                  </View>

                  <View style={styles.backInfoRow}>
                    <Text style={styles.backInfoLabel}>Account Status:</Text>
                    <Text style={[styles.backInfoValue, { color: '#34d399' }]}>
                      {identity?.accountStatus || 'Active'}
                    </Text>
                  </View>

                  <View style={styles.backInfoRow}>
                    <Text style={styles.backInfoLabel}>Institutional Status:</Text>
                    <Text style={[styles.backInfoValue, { color: isVerified ? '#34d399' : '#fbbf24' }]}>
                      {identity?.verificationStatus || 'PENDING_REVIEW'}
                    </Text>
                  </View>

                  {/* Security Disclaimer */}
                  <View style={styles.backNoticeBox}>
                    <AlertCircle size={12} color="#fbbf24" style={{ marginTop: 1 }} />
                    <Text style={styles.backNoticeText}>
                      This card certifies active membership on the KAMPUS platform. Official institutional
                      verification is granted via university administration review.
                    </Text>
                  </View>

                  <View style={styles.flipNoticeRow}>
                    <RotateCcw size={12} color="#94a3b8" />
                    <Text style={styles.flipNoticeText}>Tap card to return to front</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Quick Actions Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#2563eb' }]}
                onPress={() => setQrModalVisible(true)}
                activeOpacity={0.8}
              >
                <QrCode size={18} color="#ffffff" />
                <Text style={styles.primaryActionText}>Show Verification QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setVerificationModalVisible(true)}
                activeOpacity={0.8}
              >
                <FileCheck size={18} color="#38bdf8" />
                <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                  Request Verification
                </Text>
              </TouchableOpacity>
            </View>

            {/* Institutional Verification Status Card */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoCardHeader}>
                <Building2 size={18} color="#38bdf8" />
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                  Institutional Accreditation
                </Text>
              </View>

              <Text style={[styles.infoCardBody, { color: colors.textMuted }]}>
                {isVerified
                  ? 'Your student status has been reviewed and verified by institutional administrators. Your card displays the official Verified Scholar badge.'
                  : 'Submit proof of enrollment (such as your college email or physical student ID) to receive the Verified Scholar badge and unlock full platform campus perks.'}
              </Text>

              {!isVerified && (
                <TouchableOpacity
                  style={[styles.verifyLinkBtn, { borderColor: '#38bdf8' }]}
                  onPress={() => setVerificationModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.verifyLinkText}>Submit Verification Evidence →</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Connected Achievements & Badges */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.infoCardHeader}>
                <Award size={18} color="#f59e0b" />
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                  Campus Badges & Recognition
                </Text>
              </View>

              <View style={styles.badgeList}>
                {(identity?.skills && identity.skills.length > 0
                  ? identity.skills
                  : ['Academic Member', 'Campus Life Explorer', 'Study Hub Scholar']
                ).map((badge: string, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.badgeItem,
                      { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                    ]}
                  >
                    <CheckCircle2 size={14} color="#10b981" />
                    <Text style={[styles.badgeItemText, { color: colors.text }]}>{badge}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* QR Code Modal with Rotating Countdown Timer */}
      <Modal visible={qrModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#070d1e', borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitleText}>Security Verification QR</Text>
                <Text style={styles.modalSubtitleText}>
                  Cryptographically signed • 5-minute dynamic TTL
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setQrModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* QR Visual Box */}
            <View style={styles.qrVisualContainer}>
              <View style={styles.qrCodeFrame}>
                <QrCode size={190} color="#070d1e" />
              </View>

              {/* Countdown Progress */}
              <View style={styles.timerBadge}>
                <Clock size={14} color="#38bdf8" />
                <Text style={styles.timerText}>
                  Rotating in: {Math.floor(secondsRemaining / 60)}:
                  {String(secondsRemaining % 60).padStart(2, '0')}
                </Text>
              </View>
            </View>

            <Text style={styles.qrNoticeText}>
              Scan this code using any campus verifier or visit the public URL to instantly authenticate
              student status. Nonce rotates automatically to prevent unauthorized screenshot sharing.
            </Text>

            <View style={styles.qrModalActions}>
              <TouchableOpacity
                style={[styles.rotateBtn, { opacity: isRotatingQr ? 0.6 : 1 }]}
                onPress={handleRotateQr}
                disabled={isRotatingQr}
                activeOpacity={0.8}
              >
                {isRotatingQr ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <RotateCcw size={16} color="#ffffff" />
                    <Text style={styles.rotateBtnText}>Rotate & Invalidate Prior QR</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalShareBtn}
                onPress={handleShareCard}
                activeOpacity={0.8}
              >
                <Share2 size={16} color="#38bdf8" />
                <Text style={styles.modalShareText}>Share Public Verification Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Institutional Verification Request Modal */}
      <Modal visible={verificationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#070d1e', borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitleText}>Institutional Verification</Text>
                <Text style={styles.modalSubtitleText}>
                  Request official Verified Scholar status
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setVerificationModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>VERIFICATION DOCUMENT / EVIDENCE TYPE</Text>
            <View style={styles.docTypeRow}>
              {['College ID Card', 'Institutional Email', 'Fee Receipt'].map((dt) => (
                <TouchableOpacity
                  key={dt}
                  style={[
                    styles.docTypePill,
                    documentType === dt && styles.docTypePillActive,
                  ]}
                  onPress={() => setDocumentType(dt)}
                >
                  <Text
                    style={[
                      styles.docTypePillText,
                      documentType === dt && styles.docTypePillTextActive,
                    ]}
                  >
                    {dt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.formLabel, { marginTop: 16 }]}>
              DOCUMENT REFERENCE OR COLLEGE EMAIL
            </Text>
            <TextInput
              style={styles.textInputBox}
              value={evidenceText}
              onChangeText={setEvidenceText}
              placeholder="e.g., scholar@iitb.ac.in or Roll No 22B030149"
              placeholderTextColor="#64748b"
            />

            <TouchableOpacity
              style={[
                styles.submitVerificationBtn,
                { opacity: isSubmittingVerification ? 0.6 : 1 },
              ]}
              onPress={handleSubmitVerification}
              disabled={isSubmittingVerification}
              activeOpacity={0.8}
            >
              {isSubmittingVerification ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Send size={16} color="#ffffff" />
                  <Text style={styles.submitVerificationText}>Submit for Administrator Review</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 12,
    fontWeight: '600',
  },
  idCardContainer: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    padding: Spacing.md + 4,
    minHeight: 220,
    marginBottom: Spacing.md,
  },
  cardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardBrandTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardFrontContent: {
    flex: 1,
  },
  cardMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  studentAvatar: {
    width: 70,
    height: 70,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  avatarFallback: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#38bdf8',
    fontSize: 26,
    fontWeight: '800',
  },
  avatarShieldDot: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#10b981',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#0c1630',
  },
  studentMetaColumn: {
    flex: 1,
  },
  studentNameText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  idNumberCode: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 1,
  },
  collegeNameText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  courseNameText: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 1,
  },
  cardBottomGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardMetaBlock: {
    flex: 1,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
  },
  flipNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  flipNoticeText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  cardBackContent: {
    flex: 1,
    paddingVertical: 4,
  },
  backSectionTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  backInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  backInfoLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  backInfoValue: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  },
  backNoticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.sm,
    padding: 8,
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  backNoticeText: {
    color: '#fde68a',
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  primaryActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: BorderRadius.md,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoCardBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  verifyLinkBtn: {
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 8,
  },
  verifyLinkText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  badgeItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitleText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  qrVisualContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  qrCodeFrame: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: 14,
  },
  timerText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  qrNoticeText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  qrModalActions: {
    gap: 10,
  },
  rotateBtn: {
    backgroundColor: '#2563eb',
    height: 44,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rotateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalShareBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    height: 44,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalShareText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  formLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  docTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  docTypePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  docTypePillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  docTypePillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  docTypePillTextActive: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  textInputBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 46,
    color: '#ffffff',
    fontSize: 13,
  },
  submitVerificationBtn: {
    backgroundColor: '#2563eb',
    height: 46,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  submitVerificationText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
