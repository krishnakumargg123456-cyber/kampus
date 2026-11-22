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
import { Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useTheme } from '../../theme/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../theme/tokens';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState<1 | 2>(1); // 1: Enter Email, 2: Code + New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  /**
   * Step 1: Send Password Reset Code via Clerk
   */
  const handleSendResetCode = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid student email address.');
      return;
    }

    if (!isSignInLoaded || !signIn) {
      setErrorMessage('Authentication service initializing. Please retry in a moment.');
      return;
    }

    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: cleanEmail,
      });

      setSuccessMessage(`A password reset code has been sent to ${cleanEmail}`);
      setStep(2);
      startResendTimer();
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      if (clerkErr) {
        if (clerkErr.code === 'form_identifier_not_found') {
          setErrorMessage('No student account found with this email.');
        } else {
          setErrorMessage(clerkErr.longMessage || clerkErr.message || 'Could not send reset code.');
        }
      } else {
        setErrorMessage(err.message || 'Could not send reset code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend Reset Code safely
   */
  const handleResendResetCode = async () => {
    if (timer > 0 || loading || !isSignInLoaded || !signIn) return;
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      // Re-prepare or recreate reset code
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: cleanEmail,
      });

      setSuccessMessage(`A fresh reset code has been dispatched to ${cleanEmail}`);
      startResendTimer();
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      setErrorMessage(clerkErr?.longMessage || clerkErr?.message || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verify Code and Set New Password via Clerk
   */
  const handleResetPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const cleanCode = code.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!isSignInLoaded || !signIn) {
      setErrorMessage('Authentication service initializing.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: cleanCode,
        password: newPassword,
      });

      if (result.status === 'complete') {
        // Automatically activate session with new password
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
      } else {
        setSuccessMessage('Password reset successfully! Please sign in with your new password.');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      }
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      if (clerkErr) {
        if (clerkErr.code === 'form_code_incorrect') {
          setErrorMessage('Incorrect verification code. Please check your email.');
        } else if (clerkErr.code === 'verification_expired') {
          setErrorMessage('Verification code has expired. Please tap Resend Code.');
        } else if (clerkErr.code === 'form_password_pwned') {
          setErrorMessage('This password was detected in a public leak. Please choose a more unique password.');
        } else {
          setErrorMessage(clerkErr.longMessage || clerkErr.message || 'Password reset failed.');
        }
      } else {
        setErrorMessage(err.message || 'Password reset failed. Please retry.');
      }
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
            <KeyRound size={28} color={colors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
            {step === 1
              ? 'Enter your student email to receive a password recovery code.'
              : `Enter the 6-digit code sent to ${email} and set your new password.`}
          </Text>
        </View>

        {/* Alerts */}
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

        {step === 1 ? (
          <View style={styles.formContainer}>
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

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSendResetCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Send Reset Code</Text>
                  <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>6-Digit Verification Code</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ShieldCheck size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, letterSpacing: 6, fontSize: 18, fontWeight: '700' }]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.textMuted}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.resendRow}>
              <Text style={[styles.resendText, { color: colors.textMuted }]}>Didn't receive code?</Text>
              <TouchableOpacity onPress={handleResendResetCode} disabled={timer > 0 || loading}>
                <Text style={[styles.resendLink, { color: timer > 0 ? colors.textMuted : colors.primary }]}>
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>New Password (Min 8 chars)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter new password"
                placeholderTextColor={colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Confirm New Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                {showConfirmPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Reset Password & Log In</Text>
                  <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Back to Login */}
        <TouchableOpacity
          style={[styles.backRow, { borderColor: colors.border }]}
          onPress={() => navigation.navigate('Login')}
        >
          <ArrowLeft size={16} color={colors.textSecondary} />
          <Text style={[styles.backText, { color: colors.textSecondary }]}>Return to Login</Text>
        </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    textAlign: 'center',
    marginTop: 6,
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
    width: '100%',
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
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
