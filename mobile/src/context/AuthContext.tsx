import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  useSignIn,
  useSignUp,
} from '@clerk/clerk-expo';
import API_BASE_URL from '../config/api';
import { parseClerkAuthError } from '../components/common/PasswordRequirementsView';

export interface StudentUser {
  userId: string;
  clerkId?: string;
  fullName: string;
  email: string;
  mobile: string;
  college: string;
  course: string;
  branch?: string;
  semester: string;
  enrollmentNo: string;
  avatarUrl: string;
  bio?: string;
  interests?: string[];
  skills?: string[];
  careerPreferences?: string[];
  verifiedBadge?: boolean;
  hasCompletedOnboarding?: boolean;
  role?: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  createdSessionId?: string | null;
  status?: string;
  verificationToken?: string;
}

export interface AuthContextType {
  user: StudentUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithPassword: (email: string, password: string) => Promise<AuthResult>;
  sendEmailOtp: (email: string, purpose?: string) => Promise<AuthResult>;
  verifyOtpAndLogin: (email: string, code: string) => Promise<AuthResult>;
  verifyRegistrationOtp: (email: string, code: string) => Promise<AuthResult>;
  registerStudent: (formData: any) => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, code: string, newPass: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<StudentUser>) => Promise<void>;
  syncBackendProfile: (profileData?: Partial<StudentUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapClerkUserToStudent(clerkUser: any): StudentUser {
  const meta = clerkUser?.unsafeMetadata || {};
  const primaryEmail = clerkUser?.primaryEmailAddress?.emailAddress || '';
  const firstName = clerkUser?.firstName || '';
  const lastName = clerkUser?.lastName || '';
  const derivedName = `${firstName} ${lastName}`.trim() || primaryEmail.split('@')[0] || 'KAMPUS Student';

  return {
    userId: clerkUser?.id || 'usr_unknown',
    clerkId: clerkUser?.id || '',
    fullName: (meta.fullName as string) || clerkUser?.fullName || derivedName,
    email: primaryEmail,
    mobile: (meta.mobile as string) || clerkUser?.phoneNumbers?.[0]?.phoneNumber || '',
    college: (meta.college as string) || '',
    course: (meta.course as string) || '',
    branch: (meta.branch as string) || '',
    semester: (meta.semester as string) || '1',
    enrollmentNo: (meta.enrollmentNo as string) || '',
    avatarUrl:
      clerkUser?.imageUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: (meta.bio as string) || 'Passionate student navigating campus life & academic excellence.',
    interests: Array.isArray(meta.interests) ? meta.interests : ['Technology', 'Campus Life'],
    skills: Array.isArray(meta.skills) ? meta.skills : ['Problem Solving'],
    careerPreferences: Array.isArray(meta.careerPreferences) ? meta.careerPreferences : [],
    verifiedBadge: true,
    hasCompletedOnboarding: Boolean(meta.college && meta.course),
    role: 'student',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: isAuthLoaded, isSignedIn, userId, getToken, signOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useClerkUser();
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const [user, setUser] = useState<StudentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInternalLoading, setIsInternalLoading] = useState(false);
  const isSyncingRef = useRef(false);

  // Synchronize student profile and JWT whenever Clerk auth state updates
  useEffect(() => {
    let isMounted = true;

    async function syncClerkSession() {
      if (!isAuthLoaded) return;

      if (!isSignedIn) {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
        return;
      }

      try {
        const sessionToken = await getToken();
        if (!isMounted) return;

        setToken(sessionToken);

        // If Clerk user is available, map it. Otherwise create a minimal valid user profile
        if (clerkUser) {
          const mapped = mapClerkUserToStudent(clerkUser);
          if (isMounted) setUser(mapped);

          // Synchronize profile with backend non-blockingly
          if (!isSyncingRef.current) {
            isSyncingRef.current = true;
            void syncBackendProfileInternal(mapped, sessionToken).finally(() => {
              isSyncingRef.current = false;
            });
          }
        } else if (userId && !user) {
          // Provide instant fallback so the student is never blocked
          setUser({
            userId,
            clerkId: userId,
            fullName: 'KAMPUS Student',
            email: '',
            mobile: '',
            college: '',
            course: '',
            semester: '1',
            enrollmentNo: '',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            verifiedBadge: true,
            hasCompletedOnboarding: false,
            role: 'student',
          });
        }
      } catch (err: any) {
        console.warn('[AuthContext Session Init Warning]:', err.message);
      }
    }

    void syncClerkSession();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoaded, isSignedIn, clerkUser, userId, getToken]);

  const syncBackendProfileInternal = async (
    profileData: Partial<StudentUser>,
    jwtToken?: string | null
  ) => {
    try {
      const activeToken = jwtToken || token || (await getToken());
      const payload = {
        clerkId: profileData.clerkId || userId || clerkUser?.id,
        email: profileData.email || clerkUser?.primaryEmailAddress?.emailAddress,
        fullName: profileData.fullName,
        mobile: profileData.mobile,
        college: profileData.college,
        course: profileData.course,
        branch: profileData.branch,
        semester: profileData.semester,
        enrollmentNo: profileData.enrollmentNo,
        bio: profileData.bio,
        interests: profileData.interests,
        skills: profileData.skills,
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/sync-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
        }
      }
    } catch (err: any) {
      // Background sync fault tolerance — never break active Clerk session
      console.warn('[Profile Backend Sync Notice]:', err.message);
    }
  };

  const syncBackendProfile = async (profileData?: Partial<StudentUser>) => {
    if (profileData) {
      await syncBackendProfileInternal(profileData);
    } else if (user) {
      await syncBackendProfileInternal(user);
    }
  };

  /**
   * Fast, reliable Clerk email/password login
   */
  const loginWithPassword = async (email: string, password: string): Promise<AuthResult> => {
    if (!isSignInLoaded || !signIn) {
      return { success: false, error: 'Authentication engine is initializing. Please retry in a moment.' };
    }

    setIsInternalLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });

      if (result.status === 'complete') {
        if (setSignInActive) {
          await setSignInActive({ session: result.createdSessionId });
        }
        return { success: true, createdSessionId: result.createdSessionId };
      }

      if (result.status === 'needs_first_factor') {
        return { success: false, error: 'Additional verification required for this account.', status: result.status };
      }

      return { success: false, error: `Login status: ${result.status}` };
    } catch (err: any) {
      return { success: false, error: parseClerkAuthError(err) };
    } finally {
      setIsInternalLoading(false);
    }
  };

  /**
   * Send Email OTP for Login via Clerk
   */
  const sendEmailOtp = async (email: string): Promise<AuthResult> => {
    if (!isSignInLoaded || !signIn) {
      return { success: false, error: 'Authentication engine is initializing.' };
    }

    setIsInternalLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await signIn.create({ identifier: cleanEmail });
      const emailFactor: any = res.supportedFirstFactors?.find(
        (f: any) => f.strategy === 'email_code'
      );

      if (!emailFactor) {
        return { success: false, error: 'Email code login is not enabled for this account. Please use password login.' };
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      return { success: true, message: 'Verification code sent.' };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      return { success: false, error: clerkErr?.longMessage || clerkErr?.message || err.message || 'Could not send OTP.' };
    } finally {
      setIsInternalLoading(false);
    }
  };

  /**
   * Verify Login OTP via Clerk
   */
  const verifyOtpAndLogin = async (email: string, code: string): Promise<AuthResult> => {
    if (!isSignInLoaded || !signIn) {
      return { success: false, error: 'Authentication engine is initializing.' };
    }

    setIsInternalLoading(true);
    try {
      const res = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: code.trim(),
      });

      if (res.status === 'complete') {
        if (setSignInActive) {
          await setSignInActive({ session: res.createdSessionId });
        }
        return { success: true, createdSessionId: res.createdSessionId };
      }

      return { success: false, error: `Verification status: ${res.status}` };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      return { success: false, error: clerkErr?.longMessage || clerkErr?.message || err.message || 'OTP verification failed.' };
    } finally {
      setIsInternalLoading(false);
    }
  };

  /**
   * Register a new student via Clerk
   */
  const registerStudent = async (formData: any): Promise<AuthResult> => {
    if (!isSignUpLoaded || !signUp) {
      return { success: false, error: 'Registration engine is initializing.' };
    }

    setIsInternalLoading(true);
    try {
      const emailClean = formData.email.trim().toLowerCase();
      const parts = (formData.fullName || '').trim().split(' ');
      const firstName = parts[0] || 'KAMPUS';
      const lastName = parts.slice(1).join(' ') || 'Student';

      await signUp.create({
        emailAddress: emailClean,
        password: formData.password,
        firstName,
        lastName,
        unsafeMetadata: {
          fullName: formData.fullName,
          mobile: formData.mobile,
          college: formData.college,
          course: formData.course,
          branch: formData.branch,
          semester: formData.semester,
          enrollmentNo: formData.enrollmentNo,
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      return { success: true, message: 'Verification code dispatched to your email.' };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      return { success: false, error: clerkErr?.longMessage || clerkErr?.message || err.message || 'Registration failed.' };
    } finally {
      setIsInternalLoading(false);
    }
  };

  /**
   * Verify Registration OTP and Complete Account Setup via Clerk
   */
  const verifyRegistrationOtp = async (email: string, code: string): Promise<AuthResult> => {
    if (!isSignUpLoaded || !signUp) {
      return { success: false, error: 'Registration engine is initializing.' };
    }

    setIsInternalLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === 'complete') {
        if (setSignUpActive) {
          await setSignUpActive({ session: completeSignUp.createdSessionId });
        }
        return { success: true, createdSessionId: completeSignUp.createdSessionId };
      }

      return { success: false, error: `Verification status: ${completeSignUp.status}` };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      return { success: false, error: clerkErr?.longMessage || clerkErr?.message || err.message || 'OTP verification failed.' };
    } finally {
      setIsInternalLoading(false);
    }
  };

  /**
   * Initiate Password Reset via Clerk
   */
  const forgotPassword = async (email: string): Promise<AuthResult> => {
    if (!isSignInLoaded || !signIn) {
      return { success: false, error: 'Authentication engine is initializing.' };
    }

    setIsInternalLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim().toLowerCase(),
      });
      return { success: true, message: 'Password reset code sent to your email.' };
    } catch (err: any) {
      return { success: false, error: parseClerkAuthError(err) };
    } finally {
      setIsInternalLoading(false);
    }
  };

  /**
   * Complete Password Reset with New Password via Clerk
   */
  const resetPassword = async (email: string, code: string, newPass: string): Promise<AuthResult> => {
    if (!isSignInLoaded || !signIn) {
      return { success: false, error: 'Authentication engine is initializing.' };
    }

    setIsInternalLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: newPass,
      });

      if (result.status === 'complete') {
        if (setSignInActive) {
          await setSignInActive({ session: result.createdSessionId });
        }
        return { success: true, createdSessionId: result.createdSessionId };
      }

      return { success: true, message: 'Password updated. Please sign in.' };
    } catch (err: any) {
      return { success: false, error: parseClerkAuthError(err) };
    } finally {
      setIsInternalLoading(false);
    }
  };

  /**
   * Secure Logout from Clerk Session
   */
  const logout = async () => {
    try {
      setIsInternalLoading(true);
      await signOut();
      setUser(null);
      setToken(null);
    } catch (err: any) {
      console.warn('[Logout Notice]:', err.message);
    } finally {
      setIsInternalLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<StudentUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
    await syncBackendProfile(updates);
  };

  // Single authoritative source of truth: Clerk session determines authentication
  const isLoading = !isAuthLoaded || isInternalLoading || (isSignedIn && !isUserLoaded && !user);
  const isAuthenticated = Boolean(isAuthLoaded && isSignedIn);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        loginWithPassword,
        sendEmailOtp,
        verifyOtpAndLogin,
        verifyRegistrationOtp,
        registerStudent,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
        syncBackendProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
