import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  useClerk,
  useSignIn,
  useSignUp,
} from '@clerk/clerk-expo';
import API_BASE_URL from '../config/api';

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

  // Sync token and initial student profile whenever Clerk auth state changes
  useEffect(() => {
    let isMounted = true;

    async function syncClerkSession() {
      if (!isAuthLoaded) return;

      if (!isSignedIn || !clerkUser) {
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
        const mapped = mapClerkUserToStudent(clerkUser);
        setUser(mapped);

        // Synchronize with backend profile non-blockingly
        if (!isSyncingRef.current) {
          isSyncingRef.current = true;
          void syncBackendProfileInternal(mapped, sessionToken).finally(() => {
            isSyncingRef.current = false;
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
  }, [isAuthLoaded, isSignedIn, clerkUser, getToken]);

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
      // Background sync retry tolerance — never block the user
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
        await setSignInActive({ session: result.createdSessionId });
        return { success: true, createdSessionId: result.createdSessionId };
      }

      if (result.status === 'needs_first_factor') {
        return { success: false, error: 'Additional verification required for this account.', status: result.status };
      }

      return { success: false, error: `Login status: ${result.status}` };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      const msg = clerkErr?.longMessage || clerkErr?.message || err.message || 'Login failed. Please check your credentials.';
      return { success: false, error: msg };
    } finally {
      setIsInternalLoading(false);
    }
  };

  /**
   * Clerk Email OTP Dispatch (For login or password reset)
   */
  const sendEmailOtp = async (email: string, purpose = 'login'): Promise<AuthResult> => {
    if (!isSignInLoaded || !signIn) {
      return { success: false, error: 'Authentication service initializing. Please retry.' };
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (purpose === 'forgot_password') {
        await signIn.create({
          strategy: 'reset_password_email_code',
          identifier: normalizedEmail,
        });
        return { success: true, message: `Password reset code sent to ${normalizedEmail}` };
      }

      const res = await signIn.create({
        identifier: normalizedEmail,
      });

      const emailFactor: any = res.supportedFirstFactors?.find(
        (f: any) => f.strategy === 'email_code'
      );

      if (!emailFactor) {
        return { success: false, error: 'Email verification code is not supported for this account.' };
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      return { success: true, message: `6-digit verification code dispatched to ${normalizedEmail}` };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      const msg = clerkErr?.longMessage || clerkErr?.message || err.message || 'Could not send verification code.';
      return { success: false, error: msg };
    }
  };

  /**
   * Verify OTP and Login via Clerk
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
        await setSignInActive({ session: res.createdSessionId });
        return { success: true, createdSessionId: res.createdSessionId };
      }

      return { success: false, error: `Verification status: ${res.status}` };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      const msg = clerkErr?.longMessage || clerkErr?.message || err.message || 'Invalid or expired verification code.';
      return { success: false, error: msg };
    } finally {
      setIsInternalLoading(false);
    }
  };

  /**
   * Registration OTP verification compatibility wrapper
   */
  const verifyRegistrationOtp = async (email: string, code: string): Promise<AuthResult> => {
    if (!isSignUpLoaded || !signUp) {
      return { success: false, error: 'Registration engine is initializing.' };
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === 'complete') {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        return { success: true, verificationToken: 'clerk_verified' };
      }

      return { success: false, error: `Verification status: ${completeSignUp.status}` };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      const msg = clerkErr?.longMessage || clerkErr?.message || err.message || 'Invalid verification code.';
      return { success: false, error: msg };
    }
  };

  /**
   * Complete student registration compatibility wrapper
   */
  const registerStudent = async (formData: any): Promise<AuthResult> => {
    if (!isSignUpLoaded || !signUp) {
      return { success: false, error: 'Registration service initializing.' };
    }

    setIsInternalLoading(true);
    try {
      const parts = (formData.fullName || '').trim().split(' ');
      const firstName = parts[0] || 'KAMPUS';
      const lastName = parts.slice(1).join(' ') || 'Student';

      await signUp.create({
        emailAddress: formData.email.trim().toLowerCase(),
        password: formData.password,
        firstName,
        lastName,
        unsafeMetadata: {
          mobile: formData.mobile || '',
          college: formData.college || '',
          course: formData.course || '',
          branch: formData.branch || '',
          semester: formData.semester || '1',
          enrollmentNo: formData.enrollmentNo || '',
          interests: formData.interests || [],
          skills: formData.skills || [],
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      return { success: true, message: 'Verification code sent.' };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      const msg = clerkErr?.longMessage || clerkErr?.message || err.message || 'Registration failed.';
      return { success: false, error: msg };
    } finally {
      setIsInternalLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    return sendEmailOtp(email, 'forgot_password');
  };

  const resetPassword = async (
    email: string,
    code: string,
    newPass: string
  ): Promise<AuthResult> => {
    if (!isSignInLoaded || !signIn) {
      return { success: false, error: 'Authentication engine is initializing.' };
    }

    try {
      const res = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password: newPass,
      });

      if (res.status === 'complete') {
        await setSignInActive({ session: res.createdSessionId });
        return { success: true, message: 'Password reset successful.' };
      }

      return { success: false, error: `Password reset status: ${res.status}` };
    } catch (err: any) {
      const clerkErr = err.errors?.[0];
      const msg = clerkErr?.longMessage || clerkErr?.message || err.message || 'Password reset failed.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setToken(null);
    } catch (err: any) {
      console.warn('[Logout Warning]:', err.message);
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (updates: Partial<StudentUser>) => {
    if (!clerkUser) return;
    try {
      await clerkUser.update({
        unsafeMetadata: {
          ...clerkUser.unsafeMetadata,
          ...updates,
        },
      });
      setUser((prev) => (prev ? { ...prev, ...updates } : null));
      void syncBackendProfile(updates);
    } catch (err: any) {
      console.warn('[Profile Update Warning]:', err.message);
    }
  };

  const isLoading = !isAuthLoaded || isInternalLoading || (isSignedIn && !isUserLoaded);
  const isAuthenticated = Boolean(isAuthLoaded && isSignedIn && user);

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
