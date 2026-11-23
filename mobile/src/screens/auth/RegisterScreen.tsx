import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Chrome,
} from 'lucide-react-native';
import { useSignUp, useSignIn, useOAuth, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography } from '../../theme/tokens';
import {
  PasswordRequirementsView,
  validatePassword,
  parseClerkAuthError,
} from '../../components/common/PasswordRequirementsView';

export const RegisterScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { isLoaded: isSignUpLoaded, signUp, setActive } = useSignUp();
  const { syncBackendProfile } = useAuth();
  const { startSSOFlow } = useSSO();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // Single authoritative password validation evaluation
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const isPasswordValid = passwordValidation.isValid;
  const isConfirmMatch = confirmPassword.length > 0 && password === confirmPassword;
  const isConfirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmitStep3 = isPasswordValid && isConfirmMatch;

  // Real-time reactive error clearing: dismiss stale password validation errors immediately as requirements are met
  useEffect(() => {
    if (
      errorMessage &&
      isPasswordValid &&
      /character|letter|number|password requirement|must contain/i.test(errorMessage)
    ) {
      setErrorMessage('');
    }
  }, [isPasswordValid, errorMessage]);

  // Real-time reactive error clearing: dismiss password mismatch error immediately when passwords match
  useEffect(() => {
    if (errorMessage && isConfirmMatch && /match/i.test(errorMessage)) {
      setErrorMessage('');
    }
  }, [isConfirmMatch, errorMessage]);

  useEffect(() => {
    // Warm up the browser on Android for Google OAuth
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
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

  /**
   * Google Sign-Up via Clerk with Native Redirect & Multi-device Fallback
   */
  const handleGoogleSignUp = async () => {
    if (googleLoading || loading) return;
    setErrorMessage('');
    setGoogleLoading(true);

    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'kampus',
        path: 'oauth-native-callback',
      });

      let targetSessionId: string | null = null;
      let targetSetActive = setActive;
      let flowSucceeded = false;

      // 1. Try SSO Flow
      if (startSSOFlow) {
        try {
          const result = await startSSOFlow({
            strategy: 'oauth_google',
            redirectUrl,
            authSessionOptions: {
              showInRecents: false,
            },
          });

          if (result.authSessionResult?.type === 'cancel' || result.authSessionResult?.type === 'dismiss') {
            return;
          }

          targetSessionId =
            result.createdSessionId ||
            result.signIn?.createdSessionId ||
            result.signUp?.createdSessionId ||
            null;

          if (result.setActive) targetSetActive = result.setActive;
          if (targetSessionId) flowSucceeded = true;
        } catch (ssoErr: any) {
          if (ssoErr?.message && (ssoErr.message.includes('dismissed') || ssoErr.message.includes('cancel'))) {
            return;
          }
          if (__DEV__) {
            console.log('[Auth] SSO flow error on sign-up, falling back to OAuth flow:', ssoErr?.message || ssoErr);
          }
        }
      }

      // 2. Fallback to startOAuthFlow
      if (!flowSucceeded && startOAuthFlow) {
        const result = await startOAuthFlow({
          redirectUrl,
        });

        if (result.authSessionResult?.type === 'cancel' || result.authSessionResult?.type === 'dismiss') {
          return;
        }

        targetSessionId =
          result.createdSessionId ||
          result.signIn?.createdSessionId ||
          result.signUp?.createdSessionId ||
          null;

        if (result.setActive) targetSetActive = result.setActive;
        if (targetSessionId) flowSucceeded = true;
      }

      if (targetSessionId && targetSetActive) {
        await targetSetActive({ session: targetSessionId });
      } else if (!targetSessionId) {
        setErrorMessage(
          'Google authentication completed, but additional profile information is needed. Please register using the form.'
        );
      }
    } catch (err: any) {
      if (err?.message && (err.message.includes('dismissed') || err.message.includes('cancel'))) {
        return;
      }
      const clerkErr = err?.errors?.[0];
      setErrorMessage(
        clerkErr?.longMessage ||
          clerkErr?.message ||
          err?.message ||
          'Google authentication requires Google OAuth provider configured in Clerk Dashboard.'
      );
    } finally {
      setGoogleLoading(false);
    }
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
      if (!passwordValidation.isValid) {
        setErrorMessage(passwordValidation.firstMissingError || 'Please meet all password requirements.');
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
        setErrorMessage(parseClerkAuthError(err));
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
          if (setActive) {
            await setActive({ session: completeSignUp.createdSessionId });
          }

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
        } else {
          const missing = (completeSignUp as any)?.missingFields || (signUp as any)?.missingFields;
          if (missing && missing.includes('phone_number')) {
            setErrorMessage('Email verified! However, Clerk Dashboard requires Phone Number. In Clerk Dashboard under User & Authentication > Email, phone, username, set Phone number to Optional.');
          } else {
            setErrorMessage(`Verification status: ${completeSignUp.status}. ${missing?.length ? `Missing: ${missing.join(', ')}` : 'Please check your details.'}`);
          }
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
      setErrorMessage(clerkErr?.longMessage || clerkErr?.message || 'Could not resend verification code. Please step back to re-enter details.');
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
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.brandBadge, { backgroundColor: colors.primaryLight }]}>
            <ShieldCheck size={28} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>Join KAMPUS</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Step {step} of 4: {step === 1 ? 'Personal Profile' : step === 2 ? 'Academic Details' : step === 3 ? 'Security' : 'Email Verification'}
          </Text>

          {/* Step Dots */}
          <View style={styles.dotsRow}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  {
                    backgroundColor: s <= step ? colors.primary : colors.border,
                    width: s === step ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Alerts: Automatically cleared when criteria are satisfied */}
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

        {/* STEP 1: PERSONAL DETAILS */}
        {step === 1 && (
          <View style={styles.formContainer}>
            {/* Quick Google Sign-Up Option */}
            <TouchableOpacity
              style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleGoogleSignUp}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Chrome size={20} color="#ea4335" style={{ marginRight: 10 }} />
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>Sign up with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR ENTER DETAILS</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <User size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  setErrorMessage('');
                }}
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>College / Student Email *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. rahul.sharma@iitb.ac.in"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Mobile Number (Optional)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Phone size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor={colors.textMuted}
                value={mobile}
                onChangeText={(val) => {
                  setMobile(val);
                  setErrorMessage('');
                }}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {/* STEP 2: ACADEMIC DETAILS */}
        {step === 2 && (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>College / University *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <GraduationCap size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. IIT Bombay / Delhi University"
                placeholderTextColor={colors.textMuted}
                value={college}
                onChangeText={(val) => {
                  setCollege(val);
                  setErrorMessage('');
                }}
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Degree / Course *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <BookOpen size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. B.Tech / B.Sc / MBA"
                placeholderTextColor={colors.textMuted}
                value={course}
                onChangeText={(val) => {
                  setCourse(val);
                  setErrorMessage('');
                }}
              />
            </View>

            <View style={styles.splitRow}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Branch / Stream</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="e.g. CSE / ECE"
                    placeholderTextColor={colors.textMuted}
                    value={branch}
                    onChangeText={(val) => {
                      setBranch(val);
                      setErrorMessage('');
                    }}
                  />
                </View>
              </View>

              <View style={{ width: 100 }}>
                <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Semester</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text, textAlign: 'center' }]}
                    placeholder="1"
                    placeholderTextColor={colors.textMuted}
                    value={semester}
                    onChangeText={(val) => {
                      setSemester(val);
                      setErrorMessage('');
                    }}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Enrollment / Roll No (Optional)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. 22B030149"
                placeholderTextColor={colors.textMuted}
                value={enrollmentNo}
                onChangeText={(val) => {
                  setEnrollmentNo(val);
                  setErrorMessage('');
                }}
                autoCapitalize="characters"
              />
            </View>
          </View>
        )}

        {/* STEP 3: PASSWORD & SECURITY */}
        {step === 3 && (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Create Password *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Choose a password (e.g. campus2026)"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} accessibilityLabel="Toggle password visibility">
                {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </TouchableOpacity>
            </View>

            {/* Live Requirements Checklist & Strength Meter */}
            <PasswordRequirementsView password={password} showStrength={true} />

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Confirm Password *</Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: isConfirmMatch ? '#22c55e' : isConfirmMismatch ? '#f59e0b' : colors.border,
                },
              ]}
            >
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Re-enter your password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  setErrorMessage('');
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon} accessibilityLabel="Toggle confirm password visibility">
                {showConfirmPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </TouchableOpacity>
            </View>

            {/* Live Confirm Status Feedback */}
            {confirmPassword.length > 0 && (
              <View style={styles.confirmStatusRow}>
                {isConfirmMatch ? (
                  <>
                    <CheckCircle2 size={14} color="#22c55e" style={{ marginRight: 5 }} />
                    <Text style={[styles.confirmStatusText, { color: '#22c55e' }]}>Passwords match</Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} color="#f59e0b" style={{ marginRight: 5 }} />
                    <Text style={[styles.confirmStatusText, { color: '#f59e0b' }]}>Passwords do not match</Text>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* STEP 4: OTP VERIFICATION */}
        {step === 4 && (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Enter 6-Digit Code sent to {email}
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ShieldCheck size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, letterSpacing: 6, fontSize: 18, fontWeight: '700' }]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.textMuted}
                value={otpCode}
                onChangeText={(val) => {
                  setOtpCode(val);
                  setErrorMessage('');
                }}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.resendRow}>
              <Text style={[styles.resendText, { color: colors.textMuted }]}>Didn't receive code?</Text>
              <TouchableOpacity onPress={handleResendOtp} disabled={timer > 0 || loading}>
                <Text style={[styles.resendLink, { color: timer > 0 ? colors.textMuted : colors.primary }]}>
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
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
              {
                backgroundColor: colors.primary,
                flex: step === 1 ? 1 : 2,
                opacity: (step === 3 && !canSubmitStep3) ? 0.65 : 1,
              },
            ]}
            onPress={handleNextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step === 3 ? 'Send Verification Code' : step === 4 ? 'Verify & Enter KAMPUS' : 'Next Step'}
                </Text>
                <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have a student account?</Text>
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
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
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
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: Spacing.md,
    letterSpacing: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
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
  input: {
    flex: 1,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 6,
  },
  confirmStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  confirmStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: BorderRadius.md,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
});
