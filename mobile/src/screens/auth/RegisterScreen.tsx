import React, { useState, useRef } from 'react';
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
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Spacing, BorderRadius, Typography } from '../../theme/tokens';

export const RegisterScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { sendEmailOtp, verifyRegistrationOtp, registerStudent } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Personal
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  // Step 2: Academic
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('1');
  const [enrollmentNo, setEnrollmentNo] = useState('');

  // Step 3: Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 4: OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const actionLock = useRef(false);

  // Step 5: Interests & Skills
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const INTERESTS_LIST = [
    'Artificial Intelligence',
    'Full Stack Web',
    'Mobile Development',
    'Cybersecurity',
    'Cloud Computing',
    'Blockchain',
    'Data Structures & Algorithms',
    'Machine Learning',
  ];

  const SKILLS_LIST = [
    'Python',
    'JavaScript',
    'TypeScript',
    'React Native',
    'Node.js',
    'Java',
    'C++',
    'SQL / PostgreSQL',
    'Docker',
    'Figma',
  ];

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleSkill = (item: string) => {
    setSelectedSkills((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleNextStep = async () => {
    if (actionLock.current || loading) return;
    setErrorMessage('');

    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !email.includes('@')) {
        setErrorMessage('Please provide your full legal name and valid email.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!college.trim() || !course.trim()) {
        setErrorMessage('Please fill in your college and course details.');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      actionLock.current = true;
      setLoading(true);
      try {
        const res = await sendEmailOtp(email.trim().toLowerCase(), 'register');
        if (res.success) {
          setOtpSent(true);
          setOtpCode('');
          setVerificationToken('');
          setStep(4);
        } else {
          setErrorMessage(res.error || 'Failed to send OTP.');
        }
      } catch (e) {
        setErrorMessage('Could not send OTP. Please try again.');
      } finally {
        setLoading(false);
        actionLock.current = false;
      }
      return;
    }

    if (step === 4) {
      if (!/^\\d{6}$/.test(otpCode)) {
        setErrorMessage('Enter the complete 6-digit OTP.');
        return;
      }

      actionLock.current = true;
      setLoading(true);
      try {
        const res = await verifyRegistrationOtp(email.trim().toLowerCase(), otpCode);
        if (res.success && res.verificationToken) {
          setVerificationToken(res.verificationToken);
          setStep(5);
        } else {
          setErrorMessage(res.error || 'OTP verification failed.');
        }
      } catch (e) {
        setErrorMessage('OTP verification failed. Please retry.');
      } finally {
        setLoading(false);
        actionLock.current = false;
      }
      return;
    }

    if (step === 5) {
      if (!verificationToken) {
        setErrorMessage('Verify your email before registration.');
        setStep(4);
        return;
      }

      actionLock.current = true;
      setLoading(true);
      try {
        const payload = {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
          college: college.trim(),
          course: course.trim(),
          branch: branch.trim(),
          semester: semester.trim(),
          enrollmentNo: enrollmentNo.trim(),
          password,
          interests: selectedInterests,
          skills: selectedSkills,
          verificationToken,
        };

        const res = await registerStudent(payload);
        if (!res.success) {
          setErrorMessage(res.error || 'Registration failed.');
        }
      } catch (e) {
        setErrorMessage('Registration failed. Please try again.');
      } finally {
        setLoading(false);
        actionLock.current = false;
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Step Indicator */}
        <View style={styles.stepperContainer}>
          <Text style={[styles.stepLabel, { color: colors.primary }]}>
            STEP {step} OF 5
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.borderLight }]}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.primary, width: `${(step / 5) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {step === 1 && 'Personal Information'}
          {step === 2 && 'Academic Background'}
          {step === 3 && 'Account Security'}
          {step === 4 && 'Verify College Email'}
          {step === 5 && 'Tailor Your Experience'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === 1 && 'Let’s start with your contact profile.'}
          {step === 2 && 'Connect with your campus community & classmates.'}
          {step === 3 && 'Create a strong password to protect your student locker.'}
          {step === 4 && `Enter the 6-digit code sent to ${email}`}
          {step === 5 && 'Select topics and skills to personalize your feeds.'}
        </Text>

        {errorMessage ? (
          <View style={[styles.alertBox, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
            <Text style={[styles.alertText, { color: colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Step 1 Fields */}
        {step === 1 && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <User size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>College Email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. rahul@iitb.ac.in"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(value) => { setEmail(value); setOtpCode(''); setVerificationToken(''); setOtpSent(false); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Mobile Number (Optional)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Phone size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textMuted}
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        )}

        {/* Step 2 Fields */}
        {step === 2 && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>College / University Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <GraduationCap size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. Indian Institute of Technology, Bombay"
                placeholderTextColor={colors.textMuted}
                value={college}
                onChangeText={setCollege}
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Course / Degree</Text>
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

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Branch / Dept</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="CSE"
                    placeholderTextColor={colors.textMuted}
                    value={branch}
                    onChangeText={setBranch}
                  />
                </View>
              </View>

              <View style={{ width: 100 }}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Semester</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="6"
                    placeholderTextColor={colors.textMuted}
                    value={semester}
                    onChangeText={setSemester}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 3 Fields */}
        {step === 3 && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Create Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Minimum 6 characters"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>Confirm Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Re-enter password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>
        )}

        {/* Step 4 Fields */}
        {step === 4 && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Enter 6-Digit Email OTP</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ShieldCheck size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: 8 }]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.textMuted}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              Code dispatched via KAMPUS email gateway. Valid for 10 minutes.
            </Text>
          </View>
        )}

        {/* Step 5 Fields */}
        {step === 5 && (
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 8 }]}>Academic Interests</Text>
            <View style={styles.chipRow}>
              {INTERESTS_LIST.map((item) => {
                const selected = selectedInterests.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => toggleInterest(item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: selected ? '#ffffff' : colors.text }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md, marginBottom: 8 }]}>
              Key Skills
            </Text>
            <View style={styles.chipRow}>
              {SKILLS_LIST.map((skill) => {
                const selected = selectedSkills.includes(skill);
                return (
                  <TouchableOpacity
                    key={skill}
                    onPress={() => toggleSkill(skill)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: selected ? '#ffffff' : colors.text }]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Navigation Buttons */}
        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.backButton, { borderColor: colors.border }]}
              onPress={() => setStep(step - 1)}
            >
              <ArrowLeft size={18} color={colors.text} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={handleNextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step === 5 ? 'Finish & Launch KAMPUS' : 'Continue'}
                </Text>
                <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Existing account link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account?</Text>
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
    padding: Spacing.lg,
    flexGrow: 1,
  },
  stepperContainer: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
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
    height: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
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
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
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
    marginTop: Spacing.xl,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
