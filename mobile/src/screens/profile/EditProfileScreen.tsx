import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  Camera,
  Check,
  X,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { profileApi, StudentProfile } from '../../services/profileSettingsApi';

export const EditProfileScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, token, updateProfile: updateAuthProfile } = useAuth();

  const initialProfile: StudentProfile | undefined = route?.params?.profile;

  // Form State
  const [fullName, setFullName] = useState(initialProfile?.fullName || user?.fullName || '');
  const [username, setUsername] = useState(
    initialProfile?.username || (user?.email ? user.email.split('@')[0] : '')
  );
  const [headline, setHeadline] = useState(initialProfile?.headline || 'Verified Scholar');
  const [college, setCollege] = useState(initialProfile?.college || user?.college || '');
  const [course, setCourse] = useState(initialProfile?.course || user?.course || '');
  const [semester, setSemester] = useState(initialProfile?.semester || user?.semester || '1');
  const [enrollmentNo, setEnrollmentNo] = useState(initialProfile?.enrollmentNo || user?.enrollmentNo || '');
  const [bio, setBio] = useState(initialProfile?.bio || user?.bio || '');
  const [interests, setInterests] = useState<string[]>(
    initialProfile?.academicInterests || user?.interests || ['Computer Science', 'Campus Life']
  );
  const [newInterestInput, setNewInterestInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || user?.avatarUrl || '');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Live username uniqueness validation
  useEffect(() => {
    const clean = username.trim();
    if (!clean || clean.length < 3) {
      setUsernameStatus({ checking: false, available: undefined });
      return;
    }

    if (initialProfile && clean.toLowerCase() === initialProfile.username.toLowerCase()) {
      setUsernameStatus({ checking: false, available: true, message: 'Current username' });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ checking: true });
      try {
        const res = await profileApi.checkUsername(clean, token, user?.userId);
        setUsernameStatus({
          checking: false,
          available: res.available,
          message: res.message || (res.available ? 'Username is available' : 'Username is already taken'),
        });
      } catch (err) {
        setUsernameStatus({ checking: false, available: true });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [username, initialProfile, token, user?.userId]);

  // Photo Picker & Upload via DocumentPicker
  const handlePickAndUploadAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingPhoto(true);

      // Convert local URI to Base64 using fetch + blob + FileReader
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const uploadedUrl = await profileApi.uploadAvatar(
            base64Data,
            asset.name || 'avatar.jpg',
            token,
            user?.userId
          );

          setAvatarUrl(uploadedUrl);
          await updateAuthProfile({ avatarUrl: uploadedUrl });
          Alert.alert('Success', 'Profile photo updated successfully!');
        } catch (uploadErr: any) {
          Alert.alert('Upload Failed', uploadErr.message || 'Could not upload photo.');
        } finally {
          setIsUploadingPhoto(false);
        }
      };

      reader.onerror = () => {
        setIsUploadingPhoto(false);
        Alert.alert('Error', 'Could not read image file.');
      };

      reader.readAsDataURL(blob);
    } catch (err: any) {
      setIsUploadingPhoto(false);
      Alert.alert('Error', err.message || 'Photo selection failed.');
    }
  };

  const handleRemoveAvatar = async () => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsUploadingPhoto(true);
            await profileApi.removeAvatar(token, user?.userId);
            setAvatarUrl('');
            await updateAuthProfile({ avatarUrl: '' });
            Alert.alert('Photo Removed', 'Default initials avatar will now be shown.');
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not remove photo.');
          } finally {
            setIsUploadingPhoto(false);
          }
        },
      },
    ]);
  };

  const handleAddInterest = () => {
    const trimmed = newInterestInput.trim();
    if (!trimmed) return;
    if (interests.includes(trimmed)) {
      setNewInterestInput('');
      return;
    }
    setInterests([...interests, trimmed]);
    setNewInterestInput('');
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter((i) => i !== item));
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      Alert.alert('Validation Error', 'Username must be at least 3 characters.');
      return;
    }
    if (usernameStatus.available === false) {
      Alert.alert('Validation Error', 'Please choose an available username.');
      return;
    }

    try {
      setIsSaving(true);
      const patchData = {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        headline: headline.trim(),
        college: college.trim(),
        course: course.trim(),
        semester: semester.trim(),
        enrollmentNo: enrollmentNo.trim(),
        bio: bio.trim(),
        academicInterests: interests,
      };

      // 1. Update backend DB
      await profileApi.updateProfile(patchData, token, user?.userId);

      // 2. Sync to local Auth context for instant UI propagation across the whole app
      await updateAuthProfile({
        fullName: patchData.fullName,
        college: patchData.college,
        course: patchData.course,
        semester: patchData.semester,
        enrollmentNo: patchData.enrollmentNo,
        bio: patchData.bio,
        interests: patchData.academicInterests,
      });

      Alert.alert('Profile Updated', 'Your student profile details have been saved successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusBarHeight = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0;
  const safeTopPadding = Platform.OS === 'ios'
    ? Math.max(insets.top, 44)
    : Math.max(insets.top, statusBarHeight, 38) + 8;

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" backgroundColor="#070d1e" translucent={true} />

      {/* Navigation Bar */}
      <View
        style={[
          styles.navBar,
          {
            paddingTop: safeTopPadding,
            backgroundColor: '#070d1e',
            borderBottomColor: 'rgba(255,255,255,0.08)',
          },
        ]}
      >
        <TouchableOpacity
          style={styles.navIconButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#f8fafc" />
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitleText}>Edit Profile</Text>
          <Text style={styles.navSubtitleText}>Update Academic Information</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveNavButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Check size={16} color="#ffffff" />
              <Text style={styles.saveNavButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={[styles.avatarSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarFallbackText}>{initials || 'KS'}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.cameraIconBadge}
              onPress={handlePickAndUploadAvatar}
              disabled={isUploadingPhoto}
              activeOpacity={0.8}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Camera size={16} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.photoActionsRow}>
            <TouchableOpacity
              style={[styles.photoActionButton, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}
              onPress={handlePickAndUploadAvatar}
              disabled={isUploadingPhoto}
              activeOpacity={0.7}
            >
              <Text style={[styles.photoActionText, { color: '#38bdf8' }]}>
                {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>

            {avatarUrl ? (
              <TouchableOpacity
                style={[styles.photoActionButton, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                onPress={handleRemoveAvatar}
                disabled={isUploadingPhoto}
                activeOpacity={0.7}
              >
                <Text style={[styles.photoActionText, { color: '#ef4444' }]}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* 1. Basic Identity Fields */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>BASIC IDENTITY</Text>
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>FULL NAME *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Priya Sharma"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelWithStatusRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>USERNAME *</Text>
              {usernameStatus.checking ? (
                <Text style={[styles.statusHint, { color: colors.textMuted }]}>Checking availability...</Text>
              ) : usernameStatus.available === true ? (
                <Text style={[styles.statusHint, { color: '#10b981' }]}>✓ Available</Text>
              ) : usernameStatus.available === false ? (
                <Text style={[styles.statusHint, { color: '#ef4444' }]}>✗ Taken</Text>
              ) : null}
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceElevated,
                  color: colors.text,
                  borderColor:
                    usernameStatus.available === true
                      ? '#10b981'
                      : usernameStatus.available === false
                      ? '#ef4444'
                      : colors.borderLight,
                },
              ]}
              value={username}
              onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="e.g. priyasharma"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
          </View>

          {/* Headline */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>HEADLINE / STATUS</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight }]}
              value={headline}
              onChangeText={setHeadline}
              placeholder="e.g. Computer Science Undergrad | AI Enthusiast"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* 2. Academic Information */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>ACADEMIC INFORMATION</Text>
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* College */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>COLLEGE / UNIVERSITY</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight }]}
              value={college}
              onChangeText={setCollege}
              placeholder="e.g. IIT Bombay"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Course */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>COURSE / DEGREE</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight }]}
              value={course}
              onChangeText={setCourse}
              placeholder="e.g. B.Tech Computer Science & Engineering"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Semester & Enrollment Row */}
          <View style={styles.twoColumnRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>SEMESTER</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight }]}
                value={semester}
                onChangeText={setSemester}
                placeholder="e.g. 5"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1.5, marginLeft: 8 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>ENROLLMENT NO.</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight }]}
                value={enrollmentNo}
                onChangeText={setEnrollmentNo}
                placeholder="e.g. 22B030149"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* 3. Bio & Academic Interests */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>ABOUT & INTERESTS</Text>
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Bio */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelWithStatusRow}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>STUDENT BIO</Text>
              <Text style={[styles.statusHint, { color: colors.textMuted }]}>{bio.length}/300</Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight },
              ]}
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, 300))}
              placeholder="Share your academic passions, projects, or study goals..."
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Academic Interests */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>ACADEMIC INTERESTS</Text>

            <View style={styles.tagsContainer}>
              {interests.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.tagPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                >
                  <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
                  <TouchableOpacity onPress={() => handleRemoveInterest(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.addTagRow}>
              <TextInput
                style={[
                  styles.addTagInput,
                  { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.borderLight },
                ]}
                value={newInterestInput}
                onChangeText={setNewInterestInput}
                placeholder="Add interest (e.g. Machine Learning)..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleAddInterest}
              />
              <TouchableOpacity
                style={[styles.addTagButton, { backgroundColor: colors.primary }]}
                onPress={handleAddInterest}
                activeOpacity={0.7}
              >
                <Plus size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 4. Bottom Save Action Button */}
        <TouchableOpacity
          style={[styles.saveActionButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={styles.saveActionButtonText}>Save Profile Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navBar: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  navTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  navSubtitleText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  saveNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveNavButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  avatarSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  avatarFallbackText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0284c7',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#070d1e',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  labelWithStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  twoColumnRow: {
    flexDirection: 'row',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTagInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  addTagButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    marginTop: 8,
  },
  saveActionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
