import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography } from '../../theme/tokens';

export const RegisterScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { isLoaded: isSignUpLoaded, signUp, setActive } = useSignUp();
  const { syncBackendProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  // Step 2: Academic Details
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('1');
  const [enrollmentNo, setEnrollmentNo] = useState('');

  // Step 3: Password & Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 4: OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(0);

  const actionLock = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    setTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNextStep = async () => {
    if (actionLock.current || loading) return;
    setErrorMessage('');
    setSuccessMessage('');

    // STEP 1 VALIDATION
    if (step === 1) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMessage('Please enter your full legal name.');
        return;
      }
      const emailTrimmed = email.trim().toLowerCase();
      if (!emailTrimmed || !emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
        setErrorMessage('Please enter a valid student or personal email address.');
        return;
      }
      setStep(2);
      return;
    }

    // STEP 2 VALIDATION
    if (step === 2) {
      if (!college.trim()) {
        setErrorMessage('Please enter your college or university name.');
        return;
      }
      if (!course.trim()) {
        setErrorMessage('Please enter your degree or course of study.');
        return;
      }
      setStep(3);
      return;
    }

    // STEP 3: CREATE CLERK ACCOUNT & SEND OTP
    if (step === 3) {
      if (!password || password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long for security.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please retype carefully.');
        return;
      }

      if (!isSignUpLoaded || !signUp) {
        setErrorMessage('Authentication engine is initializing. Please retry in a moment.');
        return;
      }

      actionLock.current = true;
      setLoading(true);

      try {
        const parts = fullName.trim().split(' ');
        const firstName = parts[0] || 'KAMPUS';
        const lastName = parts.slice(1).join(' ') || 'Student';

        // 1. Create Account in Clerk
        await signUp.create({
          emailAddress: email.trim().toLowerCase(),
          password,
          firstName,
          lastName,
          unsafeMetadata: {
            fullName: fullName.trim(),
            mobile: mobile.trim(),
            college: college.trim(),
            course: course.trim(),
            branch: branch.trim(),
            semester: semester.trim(),
            enrollmentNo: enrollmentNo.trim(),
          },
        });

        // 2. Dispatch Clerk's official Email Code
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });

        setSuccessMessage(`A 6-digit verification code has been dispatched to ${email.trim()}`);
        setOtpCode('');
        setStep(4);
        startResendTimer();
      } catch (err: any) {
        const clerkErr = err.errors?.[0];
        if (clerkErr) {
          if (clerkErr.code === 'form_identifier_exists') {
            setErrorMessage('An account with this email already exists. Please log in.');
          } else if (clerkErr.code === 'form_password_pwned') {
            setErrorMessage('This password was detected in a public leak. Please choose a more unique password.');
          } else if (clerkErr.code === 'form_password_length_too_short') {
            setErrorMessage('Password must be at least 8 characters long.');
          } else {
            setErrorMessage(clerkErr.longMessage || clerkErr.message || 'Registration failed.');
          }
        } else {
          setErrorMessage(err.message || 'Could not complete registration. Please retry.');
        }
      } finally {
        setLoading(false);
        actionLock.current = false;
      }
      return;
    }

    // STEP 4: VERIFY OTP AND COMPLETE AUTHENTICATION
    if (step === 4) {
      const cleanCode = otpCode.trim();
      if (!/^\d{6}$/.test(cleanCode)) {
        setErrorMessage('Please enter the complete 6-digit verification code.');
        return;
      }

      if (!isSignUpLoaded || !signUp) {
        setErrorMessage('Authentication service is initializing.');
        return;
      }

      actionLock.current = true;
      setLoading(true);

      try {
        // Clerk verifies email code
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code: cleanCode,
        });

        if (completeSignUp.status === 'complete') {
          // Activate Clerk session immediately
          await setActive({ session: completeSignUp.createdSessionId });

          // Synchronize profile with KAMPUS backend asynchronously
          void syncBackendProfile({
            clerkId: completeSignUp.createdUserId || signUp.createdUserId || '',
            email: email.trim().toLowerCase(),
            fullName: fullName.trim(),
            mobile: mobile.trim(),
            college: college.trim(),
            course: course.trim(),
            branch: branch.trim(),
            semester: semester.trim(),
            enrollmentNo: enrollmentNo.trim(),
          });

          // Authenticated state in Clerk automatically navigates to MainTabs via RootNavigator!
        } else {
          setErrorMessage(`Verification status: ${completeSignUp.status}. Please check your details.`);
        }
      } catch (err: any) {
        const clerkErr = err.errors?.[0];
        if (clerkErr) {
          if (clerkErr.code === 'form_code_incorrect') {
            setErrorMessage('Incorrect verification code. Please check your email.');
          } else if (clerkErr.code === 'verification_expired') {
            setErrorMessage('Verification code has expired. Please tap Resend Code.');
          } else {
            setErrorMessage(clerkErr.longMessage || clerkErr.message || 'Verification failed.');
          }
        } else {
          setErrorMessage(err.message || 'Verification failed. Please retry.');
        }
      } finally {
        setLoading(false);
        actionLock.current = false;
      }
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0 || loading || !isSignUpLoaded || !signUp) return;
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setSuccessMessage(`A fresh 6-digit code has been sent to ${email.trim()}`);
      startResendTimer();
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      setErrorMessage(clerkErr?.longMessage || clerkErr?.message || 'Could not resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Stepper Header */}
        <View style={styles.stepperContainer}>
          <Text style={[styles.stepLabel, { color: colors.primary }]}>STEP {step} OF 4</Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.primary, width: `${(step / 4) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Dynamic Titles */}
        <Text style={[styles.title, { color: colors.text }]}>
          {step === 1 && 'Personal Information'}
          {step === 2 && 'Academic Background'}
          {step === 3 && 'Account Security'}
          {step === 4 && 'Verify College Email'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === 1 && 'Let’s start with your verified student contact details.'}
          {step === 2 && 'Connect with your campus community & classmates.'}
          {step === 3 && 'Create a strong password to protect your student account.'}
          {step === 4 && `Enter the 6-digit code dispatched to ${email}`}
        </Text>

        {/* Feedback Alerts */}
        {errorMessage ? (
          <View style={[styles.alertBox, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
            <Text style={[styles.alertText, { color: colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={[styles.alertBox, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
            <Text style={[styles.alertText, { color: colors.success }]}>{successMessage}</Text>
          </View>
        ) : null}

        {/* STEP 1: PERSONAL INFORMATION */}
        {step === 1 && (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Legal Name *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <User size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Student / College Email *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. rahul.sharma@iitb.ac.in"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Mobile Number (Optional)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Phone size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor={colors.textMuted}
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {/* STEP 2: ACADEMIC BACKGROUND */}
        {step === 2 && (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>College / University Name *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <GraduationCap size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. IIT Bombay"
                placeholderTextColor={colors.textMuted}
                value={college}
                onChangeText={setCollege}
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Degree & Course *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <BookOpen size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. B.Tech Computer Science"
                placeholderTextColor={colors.textMuted}
                value={course}
                onChangeText={setCourse}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: Spacing.xs }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Branch / Stream</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. CSE"
                    placeholderTextColor={colors.textMuted}
                    value={branch}
                    onChangeText={setBranch}
                  />
                </View>
              </View>

              <View style={{ width: 100, marginLeft: Spacing.xs }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Semester</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. 6"
                    placeholderTextColor={colors.textMuted}
                    value={semester}
                    onChangeText={setSemester}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Enrollment / Roll Number (Optional)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. 2024CS0142"
                placeholderTextColor={colors.textMuted}
                value={enrollmentNo}
                onChangeText={setEnrollmentNo}
                autoCapitalize="characters"
              />
            </View>
          </View>
        )}

        {/* STEP 3: ACCOUNT SECURITY */}
        {step === 3 && (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Account Password *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ShieldCheck size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Retype your password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                {showConfirmPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <View style={[styles.securityNotice, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <CheckCircle2 size={16} color={colors.success} style={{ marginRight: 8 }} />
              <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                Your account is protected by Clerk enterprise-grade identity security.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 4: EMAIL OTP VERIFICATION */}
        {step === 4 && (
          <View style={styles.formContainer}>
            <View style={[styles.emailSummaryCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Verification Sent To</Text>
                <Text style={[styles.summaryEmail, { color: colors.text }]}>{email}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setStep(1);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                <Text style={[styles.editEmailLink, { color: colors.primary }]}>Change Email</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>
              Enter 6-Digit Code *
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ShieldCheck size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, letterSpacing: 8, fontSize: 20, fontWeight: '700' },
                ]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.textMuted}
                value={otpCode}
                onChangeText={(text) => {
                  setOtpCode(text);
                  if (text.length === 6) {
                    setErrorMessage('');
                  }
                }}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.resendRow}>
              <Text style={[styles.resendText, { color: colors.textMuted }]}>Didn't receive the code?</Text>
              <TouchableOpacity onPress={handleResendOtp} disabled={timer > 0 || loading}>
                <Text
                  style={[
                    styles.resendLink,
                    { color: timer > 0 ? colors.textMuted : colors.primary },
                  ]}
                >
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Controls */}
        <View style={styles.actionRow}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.backButton, { borderColor: colors.border }]}
              onPress={() => {
                setErrorMessage('');
                setSuccessMessage('');
                setStep((prev) => prev - 1);
              }}
              disabled={loading}
            >
              <ArrowLeft size={18} color={colors.text} />
              <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: colors.primary, flex: step === 1 ? 1 : 2 },
            ]}
            onPress={handleNextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step === 1 && 'Continue to Academic Details'}
                  {step === 2 && 'Continue to Security'}
                  {step === 3 && 'Send Verification Code'}
                  {step === 4 && 'Verify & Launch KAMPUS'}
                </Text>
                <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Existing Member Link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have a KAMPUS account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  stepperContainer: {
    marginBottom: Spacing.lg,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  alertBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  noticeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  emailSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryEmail: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  editEmailLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resendText: {
    fontSize: 13,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
