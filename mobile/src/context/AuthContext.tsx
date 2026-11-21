import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';

export interface StudentUser {
  userId: string;
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

interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  verificationToken?: string;
}

interface AuthContextType {
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@kampus_token';
const USER_KEY = '@kampus_user';

async function apiPost(endpoint: string, body: object) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StudentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadPersistedAuth();
  }, []);

  const persistAuth = async (newToken: string, newUser: StudentUser) => {
    if (!newToken || !newUser?.userId) {
      throw new Error('Server returned an invalid authentication response.');
    }

    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const clearAuth = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  };

  const loadPersistedAuth = async () => {
    try {
      const [savedToken, savedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (!savedToken || !savedUser) {
        await clearAuth();
        return;
      }

      const cachedUser: StudentUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(cachedUser);

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (response.status === 401) {
          await clearAuth();
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
            setUser(data.user);
          }
        }
      } catch {
        // Retain cached session during temporary network outages.
      }
    } catch {
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPassword = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const data = await apiPost('/api/auth/login-password', { email, password });
      await persistAuth(data.token, data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailOtp = async (email: string, purpose = 'login'): Promise<AuthResult> => {
    try {
      const data = await apiPost('/api/auth/send-otp', { email, purpose });
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: error.message || 'Could not send OTP.' };
    }
  };

  const verifyOtpAndLogin = async (email: string, code: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const data = await apiPost('/api/auth/verify-otp', {
        email,
        code,
        purpose: 'login',
      });

      if (!data.token || !data.user) {
        return { success: false, error: 'Server did not return a valid login session.' };
      }

      await persistAuth(data.token, data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'OTP verification failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyRegistrationOtp = async (email: string, code: string): Promise<AuthResult> => {
    try {
      const data = await apiPost('/api/auth/verify-otp', {
        email,
        code,
        purpose: 'register',
      });

      if (!data.verificationToken) {
        return { success: false, error: 'Verification token was not returned by server.' };
      }

      return {
        success: true,
        verificationToken: data.verificationToken,
        message: data.message,
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'OTP verification failed.' };
    }
  };

  const registerStudent = async (formData: any): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      if (!formData.verificationToken) {
        return { success: false, error: 'Please verify your email before registering.' };
      }

      const data = await apiPost('/api/auth/register', formData);

      if (!data.token || !data.user) {
        return { success: false, error: 'Registration response is incomplete.' };
      }

      await persistAuth(data.token, data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    try {
      const data = await apiPost('/api/auth/forgot-password', { email });
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: error.message || 'Request failed.' };
    }
  };

  const resetPassword = async (
    email: string,
    code: string,
    newPass: string,
  ): Promise<AuthResult> => {
    try {
      const data = await apiPost('/api/auth/reset-password', {
        email,
        code,
        newPassword: newPass,
      });
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: error.message || 'Password reset failed.' };
    }
  };

  const logout = async () => {
    await clearAuth();
  };

  const updateProfile = async (updates: Partial<StudentUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        loginWithPassword,
        sendEmailOtp,
        verifyOtpAndLogin,
        verifyRegistrationOtp,
        registerStudent,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
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
