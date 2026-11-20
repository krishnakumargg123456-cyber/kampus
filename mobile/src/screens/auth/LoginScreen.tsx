import React, { useState } from 'react';
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
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography } from '../../theme/tokens';

export const LoginScreen = ({ navigation }: any) => {
  const { colors, isDark } = useTheme();
  const { loginWithPassword, sendEmailOtp, verifyOtpAndLogin, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePasswordLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your college email and password.');
      return;
    }
    const res = await loginWithPassword(email.trim(), password);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleSendOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid college or personal email address.');
      return;
    }
    const res = await sendEmailOtp(email.trim(), 'login');
    if (res.success) {
      setOtpSent(true);
      setSuccessMessage(res.message || 'A 6-digit verification code has been dispatched.');
      setTimer(60);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setErrorMessage(res.error || 'Failed to dispatch OTP. Please retry.');
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    if (otpCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
      return;
    }
    const res = await verifyOtpAndLogin(email.trim(), otpCode.trim());
    if (!res.success) {
      setErrorMessage(res.error || 'Invalid or expired OTP code.');
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
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handlePasswordLogin}
                disabled={isLoading}
              >
                {isLoading ? (
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
                  disabled={isLoading}
                >
                  {isLoading ? (
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
                    <TouchableOpacity onPress={handleSendOtp} disabled={timer > 0}>
                      <Text style={[styles.resendLink, { color: timer > 0 ? colors.textMuted : colors.primary }]}>
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleVerifyOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Verify & Login to KAMPUS</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* Registration Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>New to KAMPUS?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Create Student Account</Text>
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
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  alertBox: {
    padding: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '500',
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
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 12,
  },
  resendLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
