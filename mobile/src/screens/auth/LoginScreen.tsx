import React, { useState, useEffect, useRef } from 'react';
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
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight, Chrome } from 'lucide-react-native';
import { useSignIn, useOAuth, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../theme/tokens';
import { parseClerkAuthError } from '../../components/common/PasswordRequirementsView';

export const LoginScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeEmailAddressId, setActiveEmailAddressId] = useState<string | null>(null);

  const actionLock = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Warm up the browser on Android for ultra-fast Google OAuth
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
   * 1. Email + Password Login via Clerk
   */
  const handlePasswordLogin = async () => {
    if (actionLock.current || loading) return;
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter your valid college or personal email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    if (!isSignInLoaded || !signIn) {
      setErrorMessage('Authentication service initializing. Please retry in a moment.');
      return;
    }

    actionLock.current = true;
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: cleanEmail,
        password,
      });

      if (result.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
      } else if (result.status === 'needs_first_factor') {
        const factor: any = result.supportedFirstFactors?.find(
          (f: any) => f.strategy === 'email_code'
        );
        if (factor) {
          setActiveEmailAddressId(factor.emailAddressId);
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: factor.emailAddressId,
          });
          setActiveTab('otp');
          setOtpSent(true);
          startResendTimer();
          setSuccessMessage(`Email verification required. A 6-digit code was sent to ${cleanEmail}`);
        } else {
          setErrorMessage(`Additional verification required (${result.status}).`);
        }
      } else {
        setErrorMessage(`Login status: ${result.status}. Additional verification required.`);
      }
    } catch (err: any) {
      setErrorMessage(parseClerkAuthError(err));
    } finally {
      setLoading(false);
      actionLock.current = false;
    }
  };

  /**
   * 2. Send Email OTP for Passwordless Login via Clerk
   */
  const handleSendOtp = async () => {
    if (actionLock.current || loading) return;
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid student email address.');
      return;
    }

    if (!isSignInLoaded || !signIn) {
      setErrorMessage('Authentication service initializing.');
      return;
    }

    actionLock.current = true;
    setLoading(true);

    try {
      const res = await signIn.create({
        identifier: cleanEmail,
      });

      const emailFactor: any = res.supportedFirstFactors?.find(
        (f: any) => f.strategy === 'email_code'
      );

      if (!emailFactor) {
        setErrorMessage('Email code login is not enabled for this account. Please use password login.');
        return;
      }

      setActiveEmailAddressId(emailFactor.emailAddressId);

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setOtpSent(true);
      setSuccessMessage(`A 6-digit verification code has been dispatched to ${cleanEmail}`);
      setOtpCode('');
      startResendTimer();
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      if (clerkErr) {
        if (clerkErr.code === 'form_identifier_not_found') {
          setErrorMessage('No student account found with this email. Please register first.');
        } else {
          setErrorMessage(clerkErr.longMessage || clerkErr.message || 'Failed to dispatch verification code.');
        }
      } else {
        setErrorMessage(err.message || 'Could not send verification code.');
      }
    } finally {
      setLoading(false);
      actionLock.current = false;
    }
  };

  /**
   * 3. Resend OTP on Active Sign-In Attempt (Fix for Bug 3)
   */
  const handleResendLoginOtp = async () => {
    if (timer > 0 || loading || !isSignInLoaded || !signIn) return;
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (activeEmailAddressId && signIn.status === 'needs_first_factor') {
        // Resend on active existing sign-in attempt without destroying state
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: activeEmailAddressId,
        });
      } else {
        // Restart fresh sign-in attempt if previous expired
        const cleanEmail = email.trim().toLowerCase();
        const res = await signIn.create({ identifier: cleanEmail });
        const emailFactor: any = res.supportedFirstFactors?.find(
          (f: any) => f.strategy === 'email_code'
        );
        if (emailFactor) {
          setActiveEmailAddressId(emailFactor.emailAddressId);
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          });
        }
      }

      setSuccessMessage(`A fresh 6-digit code has been sent to ${email.trim()}`);
      startResendTimer();
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      setErrorMessage(clerkErr?.longMessage || clerkErr?.message || 'Could not resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 4. Verify OTP and Complete Login via Clerk
   */
  const handleVerifyOtp = async () => {
    if (actionLock.current || loading) return;
    setErrorMessage('');

    const cleanCode = otpCode.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setErrorMessage('Please enter the complete 6-digit code.');
      return;
    }

    if (!isSignInLoaded || !signIn) {
      setErrorMessage('Authentication service initializing.');
      return;
    }

    actionLock.current = true;
    setLoading(true);

    try {
      const res = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: cleanCode,
      });

      if (res.status === 'complete') {
        if (setActive) {
          await setActive({ session: res.createdSessionId });
        }
      } else {
        setErrorMessage(`Verification status: ${res.status}.`);
      }
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      if (clerkErr) {
        if (clerkErr.code === 'form_code_incorrect') {
          setErrorMessage('Incorrect verification code. Please check your email.');
        } else if (clerkErr.code === 'verification_expired') {
          setErrorMessage('Verification code has expired. Please tap Resend Code.');
        } else {
          setErrorMessage(clerkErr.longMessage || clerkErr.message || 'OTP verification failed.');
        }
      } else {
        setErrorMessage(err.message || 'Verification failed. Please retry.');
      }
    } finally {
      setLoading(false);
      actionLock.current = false;
    }
  };

  /**
   * 5. Google Sign-In via Clerk with Native Redirect & Device Compatibility Fallback
   */
  const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setErrorMessage('');
    setGoogleLoading(true);

    try {
      // Use standardized kampus scheme redirect URL
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'kampus',
        path: 'oauth-native-callback',
      });

      let targetSessionId: string | null = null;
      let targetSetActive = setActive;
      let flowSucceeded = false;

      // 1. Try SSO Flow (modern Clerk SDK standard)
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
          // If user voluntarily closed or cancelled, do not trigger fallback or error
          if (ssoErr?.message && (ssoErr.message.includes('dismissed') || ssoErr.message.includes('cancel'))) {
            return;
          }
          // Log non-sensitive flow info and proceed to OAuth fallback
          if (__DEV__) {
            console.log('[Auth] SSO flow error, falling back to OAuth flow:', ssoErr?.message || ssoErr);
          }
        }
      }

      // 2. Fallback to startOAuthFlow if SSO did not yield a session
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
          'Google authentication finished, but additional profile details may be required. Please sign in with email or check Clerk Dashboard settings.'
        );
      }
    } catch (err: any) {
      if (err?.message && (err.message.includes('dismissed') || err.message.includes('cancel'))) {
        // User voluntarily closed the Google prompt
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Branding Header */}
        <View style={styles.header}>
          <View style={[styles.brandBadge, { backgroundColor: colors.primaryLight }]}>
            <ShieldCheck size={28} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>KAMPUS</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            Your Student Life, Connected.
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'password' && [styles.activeTab, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              setActiveTab('password');
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'password' ? colors.primary : colors.textMuted },
              ]}
            >
              Email + Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'otp' && [styles.activeTab, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              setActiveTab('otp');
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'otp' ? colors.primary : colors.textMuted },
              ]}
            >
              Email OTP Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Alerts */}
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

        {/* Form Body */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>College / Student Email</Text>
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

          {activeTab === 'password' ? (
            <>
              {/* Password Input */}
              <View style={styles.passwordLabelRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Account Password</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your secret password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} accessibilityLabel="Toggle password visibility">
                  {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handlePasswordLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Secure Student Login</Text>
                    <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* OTP Login Form */}
              {!otpSent ? (
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary, marginTop: Spacing.md }]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send 6-Digit Verification Code</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                    Enter 6-Digit Verification Code
                  </Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ShieldCheck size={18} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text, letterSpacing: 6, fontSize: 18, fontWeight: '700' }]}
                      placeholder="• • • • • •"
                      placeholderTextColor={colors.textMuted}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <View style={styles.resendRow}>
                    <Text style={[styles.resendText, { color: colors.textMuted }]}>Didn't receive code?</Text>
                    <TouchableOpacity onPress={handleResendLoginOtp} disabled={timer > 0 || loading}>
                      <Text style={[styles.resendLink, { color: timer > 0 ? colors.textMuted : colors.primary }]}>
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Verify & Login to KAMPUS</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* Social Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR CONTINUE WITH</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleGoogleLogin}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Chrome size={20} color="#ea4335" style={{ marginRight: 10 }} />
                <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Registration Redirect Footer */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>New to KAMPUS student life?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Create Account</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: Spacing.xl,
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
    fontSize: Typography.bodyMedium.fontSize,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '700',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  googleButtonText: {
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
  registerLink: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
});
