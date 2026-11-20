import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sendAiChatMessage } from '../services/kampusAiService';
import type {
  GenuineConnectedSummary,
  KampusIdPrivacySettings,
  KampusIdRole,
  KampusIdentityRecord,
  PublicVerifiedIdentityPayload,
  VerificationReviewRequest,
} from '../types/kampusId';

interface KampusIdContextValue {
  loading: boolean;
  error: string | null;
  toastMessage: string | null;
  currentUserId: string;
  currentUserEmail: string;
  identity: KampusIdentityRecord | null;
  connectedSummary: GenuineConnectedSummary;
  communityPostsCount: number;
  qrToken: string | null;
  qrExpiresAt: number;
  roleInfo: { role: KampusIdRole; label: string | null };
  myVerificationRequests: VerificationReviewRequest[];
  adminRequests: VerificationReviewRequest[];
  refresh: () => Promise<void>;
  showToast: (msg: string) => void;
  rotateQrToken: (manual?: boolean) => Promise<void>;
  verifyQrToken: (token: string) => Promise<PublicVerifiedIdentityPayload>;
  lookupPublicProfile: (slugOrId: string) => Promise<PublicVerifiedIdentityPayload>;
  updateIdentityProfile: (payload: {
    fullName: string;
    college: string;
    department: string;
    course: string;
    academicYearOrSemester: string;
    enrollmentNo: string;
    bio: string;
    skills: string[];
    interests: string[];
  }) => Promise<{ ok: boolean; error?: string }>;
  updatePrivacy: (privacy: Partial<KampusIdPrivacySettings>) => Promise<void>;
  submitVerificationRequest: (
    institutionEmailDomain: string,
    supportingNote: string
  ) => Promise<{ ok: boolean; error?: string }>;
  verifyVerifierPasskey: (passkey: string) => Promise<{ ok: boolean; error?: string }>;
  revertToStudent: () => Promise<void>;
  fetchAdminRequests: () => Promise<void>;
  decideAdminRequest: (
    requestId: string,
    decision: 'Verified' | 'Verification Not Available' | 'Rejected',
    reviewerNote: string
  ) => Promise<{ ok: boolean; error?: string }>;
  askKampusIdAi: (question: string) => Promise<{ ok: boolean; text?: string; error?: string }>;
}

const KampusIdContext = createContext<KampusIdContextValue | undefined>(undefined);

export const KampusIdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, updateProfile } = useAuth();
  const { addNotification } = useNotifications();

  const currentUserId = user?.id || (user?.clerkId ? user.clerkId : 'usr_guest');
  const currentUserEmail = (profile.email && profile.email !== 'priya.sharma@cse.iitb.ac.in' ? profile.email : '') || user?.email || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [identity, setIdentity] = useState<KampusIdentityRecord | null>(null);
  const [connectedSummary, setConnectedSummary] = useState<GenuineConnectedSummary>({
    eventsRegisteredCount: 0,
    eventsCheckedInCount: 0,
    certificates: [],
    clubsJoined: [],
    skillSwapCompletedCount: 0,
    skillsOffered: [],
  });
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<number>(0);
  const [roleInfo, setRoleInfo] = useState<{ role: KampusIdRole; label: string | null }>({
    role: 'Student',
    label: null,
  });
  const [myVerificationRequests, setMyVerificationRequests] = useState<
    VerificationReviewRequest[]
  >([]);
  const [adminRequests, setAdminRequests] = useState<VerificationReviewRequest[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  const communityPostsCount = useMemo(() => {
    try {
      const raw = localStorage.getItem('kampus_community_state_v1');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      const posts = Array.isArray(parsed?.posts) ? parsed.posts : [];
      return posts.filter(
        (p: { authorId?: string; authorName?: string }) =>
          p.authorId === currentUserId || p.authorName === profile.name
      ).length;
    } catch {
      return 0;
    }
  }, [currentUserId, profile.name]);

  const rotateQrToken = useCallback(
    async (manual: boolean = false) => {
      try {
        const res = await fetch('/api/kampus-id/qr-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, manualRefresh: manual }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setQrToken(data.token);
        setQrExpiresAt(new Date(data.expiresAt).getTime());
        if (manual) showToast('QR verification token rotated cleanly');
      } catch {
        // ignore transient network
      }
    },
    [currentUserId, showToast]
  );

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/kampus-id/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          fullName: profile.name || user?.name || 'KAMPUS Student',
          avatarUrl: profile.avatarUrl || user?.avatarUrl || '',
          college: profile.college || user?.college || '',
          course: profile.course || user?.course || '',
          academicYearOrSemester: profile.semester || user?.semester || '',
          enrollmentNo: profile.enrollmentNo || user?.enrollmentNo || '',
          bio: profile.bio || '',
          interests: profile.interests || [],
          emailVerified: Boolean(user?.isVerified),
        }),
      });
      if (!res.ok) throw new Error('Unable to load KAMPUS ID.');
      const data = await res.json();
      setIdentity(data.identity || null);
      setConnectedSummary(
        data.connectedSummary || {
          eventsRegisteredCount: 0,
          eventsCheckedInCount: 0,
          certificates: [],
          clubsJoined: [],
          skillSwapCompletedCount: 0,
          skillsOffered: [],
        }
      );
      setMyVerificationRequests(data.verificationRequests || []);
      setRoleInfo(data.roleInfo || { role: 'Student', label: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load KAMPUS ID.');
    } finally {
      setLoading(false);
    }
  }, [
    currentUserId,
    profile.avatarUrl,
    profile.bio,
    profile.college,
    profile.course,
    profile.enrollmentNo,
    profile.interests,
    profile.name,
    profile.semester,
    user?.avatarUrl,
    user?.college,
    user?.course,
    user?.enrollmentNo,
    user?.isVerified,
    user?.name,
    user?.semester,
  ]);

  useEffect(() => {
    refresh().then(() => {
      rotateQrToken(false);
    });
  }, [refresh, rotateQrToken]);

  const verifyQrToken = useCallback(
    async (token: string): Promise<PublicVerifiedIdentityPayload> => {
      try {
        const res = await fetch('/api/kampus-id/verify-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        return data;
      } catch {
        return {
          status: 'Invalid',
          message: 'Network error contacting KAMPUS ID verification server.',
          disclaimer:
            'KAMPUS Platform Digital Identity — Not a Government or Official University ID.',
        };
      }
    },
    []
  );

  const lookupPublicProfile = useCallback(
    async (slugOrId: string): Promise<PublicVerifiedIdentityPayload> => {
      try {
        const res = await fetch(
          `/api/kampus-id/public/${encodeURIComponent(slugOrId.trim())}`
        );
        return await res.json();
      } catch {
        return {
          status: 'Invalid',
          message: 'Unable to fetch public KAMPUS ID profile.',
          disclaimer:
            'KAMPUS Platform Digital Identity — Not a Government or Official University ID.',
        };
      }
    },
    []
  );

  const updateIdentityProfile = useCallback(
    async (payload: {
      fullName: string;
      college: string;
      department: string;
      course: string;
      academicYearOrSemester: string;
      enrollmentNo: string;
      bio: string;
      skills: string[];
      interests: string[];
    }) => {
      try {
        const res = await fetch('/api/kampus-id/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId: currentUserId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Update failed.' };
        setIdentity(data.identity);
        updateProfile({
          name: payload.fullName,
          college: payload.college,
          course: payload.course,
          semester: payload.academicYearOrSemester,
          enrollmentNo: payload.enrollmentNo,
          bio: payload.bio,
          interests: payload.interests,
        });
        showToast('KAMPUS ID academic profile updated');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error updating profile.' };
      }
    },
    [currentUserId, showToast, updateProfile]
  );

  const updatePrivacy = useCallback(
    async (privacy: Partial<KampusIdPrivacySettings>) => {
      const res = await fetch('/api/kampus-id/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, privacy }),
      });
      if (res.ok) {
        const data = await res.json();
        setIdentity(data.identity);
        showToast('Privacy & QR disclosure settings updated');
      }
    },
    [currentUserId, showToast]
  );

  const submitVerificationRequest = useCallback(
    async (institutionEmailDomain: string, supportingNote: string) => {
      try {
        const res = await fetch('/api/kampus-id/verification/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            institutionEmailDomain,
            supportingNote,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Request failed.' };
        await refresh();
        addNotification({
          title: 'KAMPUS ID Verification Requested',
          description:
            'Your institutional profile details are queued for authorized verifier review.',
          time: 'Just now',
          type: 'system',
          linkRoute: '/campus/kampus-id',
        });
        showToast('Institutional review request submitted');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error submitting request.' };
      }
    },
    [addNotification, currentUserId, refresh, showToast]
  );

  const fetchAdminRequests = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/kampus-id/admin/requests?userId=${encodeURIComponent(currentUserId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAdminRequests(data.requests || []);
      } else {
        setAdminRequests([]);
      }
    } catch {
      setAdminRequests([]);
    }
  }, [currentUserId]);

  const verifyVerifierPasskey = useCallback(
    async (passkey: string) => {
      try {
        const res = await fetch('/api/kampus-id/admin/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, passkey }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Invalid verifier code.' };
        await refresh();
        await fetchAdminRequests();
        showToast(`Verified as ${data.roleInfo?.role}`);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, fetchAdminRequests, refresh, showToast]
  );

  const revertToStudent = useCallback(async () => {
    await fetch('/api/kampus-id/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, revert: true }),
    });
    setAdminRequests([]);
    await refresh();
    showToast('Returned to Student role');
  }, [currentUserId, refresh, showToast]);

  const decideAdminRequest = useCallback(
    async (
      requestId: string,
      decision: 'Verified' | 'Verification Not Available' | 'Rejected',
      reviewerNote: string
    ) => {
      try {
        const res = await fetch(
          `/api/kampus-id/admin/requests/${encodeURIComponent(requestId)}/decide`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, decision, reviewerNote }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Decision failed.' };
        await refresh();
        await fetchAdminRequests();
        showToast(`Verification marked ${decision}`);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, fetchAdminRequests, refresh, showToast]
  );

  const askKampusIdAi = useCallback(
    async (question: string) => {
      try {
        const res = await sendAiChatMessage({
          messages: [
            {
              role: 'user',
              content: `You are explaining KAMPUS ID platform identity & privacy controls cleanly. Remember: you NEVER approve identity verification, and KAMPUS ID is strictly a platform identity card (not a government or official university ID). Answer concisely:\n${question}`,
            },
          ],
          language: 'English',
          learningLevel: 'Intermediate',
          responseStyle: 'Detailed Explanation',
          studentContext: identity
            ? `KAMPUS ID ${identity.kampusIdNumber}, Profile Complete: ${identity.verification.profileCompleted}, Institutional Verification: ${identity.verification.institutionalVerification}`
            : 'KAMPUS Student',
        });
        return { ok: true, text: res.reply };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : 'KAMPUS AI assistant unavailable.',
        };
      }
    },
    [identity]
  );

  const value = useMemo(
    () => ({
      loading,
      error,
      toastMessage,
      currentUserId,
      currentUserEmail,
      identity,
      connectedSummary,
      communityPostsCount,
      qrToken,
      qrExpiresAt,
      roleInfo,
      myVerificationRequests,
      adminRequests,
      refresh,
      showToast,
      rotateQrToken,
      verifyQrToken,
      lookupPublicProfile,
      updateIdentityProfile,
      updatePrivacy,
      submitVerificationRequest,
      verifyVerifierPasskey,
      revertToStudent,
      fetchAdminRequests,
      decideAdminRequest,
      askKampusIdAi,
    }),
    [
      loading,
      error,
      toastMessage,
      currentUserId,
      currentUserEmail,
      identity,
      connectedSummary,
      communityPostsCount,
      qrToken,
      qrExpiresAt,
      roleInfo,
      myVerificationRequests,
      adminRequests,
      refresh,
      showToast,
      rotateQrToken,
      verifyQrToken,
      lookupPublicProfile,
      updateIdentityProfile,
      updatePrivacy,
      submitVerificationRequest,
      verifyVerifierPasskey,
      revertToStudent,
      fetchAdminRequests,
      decideAdminRequest,
      askKampusIdAi,
    ]
  );

  return (
    <KampusIdContext.Provider value={value}>{children}</KampusIdContext.Provider>
  );
};

export const useKampusId = () => {
  const ctx = useContext(KampusIdContext);
  if (!ctx) throw new Error('useKampusId must be used within KampusIdProvider');
  return ctx;
};
