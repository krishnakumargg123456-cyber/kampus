import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useLanguage } from './LanguageContext';
import type {
  ConnectedServiceItem,
  ConsolidatedActivityItem,
  DeletionRequestRecord,
  EligibleLockerCertificate,
  ProfileCompletionSummary,
  ProfileReportRecord,
  RealProfileStats,
  SecurityAuditEvent,
  SessionRecord,
  StorageOverview,
  StudentProfileRecord,
  SupportTicketRecord,
  UnlockedRewardBadge,
  UserSettingsRecord,
} from '../types/accountProfileSettings';

interface RoleInfo {
  role: 'Student' | 'Moderator Admin';
  label: string | null;
}

interface SettingsBootstrapProfileSummary {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  college: string;
}

interface AccountProfileSettingsContextValue {
  loading: boolean;
  saving: boolean;
  error: string | null;
  profileRecord: StudentProfileRecord | null;
  completion: ProfileCompletionSummary | null;
  stats: RealProfileStats | null;
  activity: ConsolidatedActivityItem[];
  eligibleCertificates: EligibleLockerCertificate[];
  unlockedBadges: UnlockedRewardBadge[];
  roleInfo: RoleInfo;
  reports: ProfileReportRecord[];

  settings: UserSettingsRecord | null;
  profileSummary: SettingsBootstrapProfileSummary | null;
  sessions: SessionRecord[];
  securityAudit: SecurityAuditEvent[];
  connectedServices: ConnectedServiceItem[];
  storageOverview: StorageOverview | null;
  deletionRequest: DeletionRequestRecord | null;
  supportTickets: SupportTicketRecord[];

  refreshAll: () => Promise<void>;
  saveProfilePatch: (patch: Partial<StudentProfileRecord>) => Promise<{ ok: boolean; error?: string }>;
  toggleModeratorRole: (passkey?: string, revert?: boolean) => Promise<{ ok: boolean; error?: string }>;
  submitModerationAction: (payload: {
    reportId?: string;
    action: string;
    targetUserId?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  reportPublicItem: (payload: {
    targetUserId: string;
    targetType: 'Profile' | 'Achievement' | 'Project';
    targetItemId?: string;
    reason: string;
  }) => Promise<{ ok: boolean; error?: string }>;

  saveSettingsPatch: (patch: Partial<UserSettingsRecord>) => Promise<{ ok: boolean; error?: string }>;
  performSensitiveAccountAction: (payload: {
    currentPassword: string;
    action: 'update-email' | 'update-phone' | 'update-username' | 'change-password' | 'toggle-deactivate';
    email?: string;
    phone?: string;
    username?: string;
    newPassword?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  revokeSessions: (opts: { sessionId?: string; revokeAllOther?: boolean }) => Promise<{ ok: boolean; error?: string }>;
  disconnectService: (serviceId: string) => Promise<{ ok: boolean; error?: string }>;
  exportUserDataJson: () => Promise<{ ok: boolean; data?: unknown; error?: string }>;
  submitDeletionRequest: (payload: {
    reauthPassword?: string;
    confirmationPhrase?: string;
    reason?: string;
    cancel?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  submitSupportTicket: (payload: {
    category: SupportTicketRecord['category'];
    subject: string;
    description: string;
    attachmentName?: string;
  }) => Promise<{ ok: boolean; ticket?: SupportTicketRecord; error?: string }>;
}

const AccountProfileSettingsContext = createContext<AccountProfileSettingsContextValue | undefined>(undefined);

function applyDomPreferences(settings: UserSettingsRecord | null, setTheme: (t: 'light' | 'dark') => void, setLanguage: (l: 'en' | 'hi') => void) {
  if (!settings || typeof document === 'undefined') return;
  const root = document.documentElement;

  // Appearance Theme
  if (settings.appearance?.theme === 'system') {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  } else if (settings.appearance?.theme === 'dark' || settings.appearance?.theme === 'light') {
    setTheme(settings.appearance.theme);
  }

  // Language
  if (settings.languageRegion?.language === 'en' || settings.languageRegion?.language === 'hi') {
    setLanguage(settings.languageRegion.language);
  }

  // Density & Accessibility attributes
  root.setAttribute('data-density', settings.appearance?.density || 'comfortable');
  root.setAttribute('data-text-size', settings.accessibility?.textSize || 'default');
  root.setAttribute('data-high-contrast', String(Boolean(settings.accessibility?.highContrast)));
  const reduceMotion = Boolean(settings.appearance?.reduceMotion || settings.accessibility?.reduceMotion);
  root.setAttribute('data-reduce-motion', String(reduceMotion));
  root.setAttribute('data-focus-rings', String(Boolean(settings.accessibility?.enhancedFocusIndicators)));
}

export const AccountProfileSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile: authProfile, updateProfile } = useAuth();
  const { setTheme } = useTheme();
  const { setLanguage } = useLanguage();

  const userId = (user?.id && user.id !== 'usr_22b030149') ? user.id : (user?.clerkId ? user.clerkId : (user?.id || 'usr_guest'));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileRecord, setProfileRecord] = useState<StudentProfileRecord | null>(null);
  const [completion, setCompletion] = useState<ProfileCompletionSummary | null>(null);
  const [stats, setStats] = useState<RealProfileStats | null>(null);
  const [activity, setActivity] = useState<ConsolidatedActivityItem[]>([]);
  const [eligibleCertificates, setEligibleCertificates] = useState<EligibleLockerCertificate[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<UnlockedRewardBadge[]>([]);
  const [roleInfo, setRoleInfo] = useState<RoleInfo>({ role: 'Student', label: null });
  const [reports, setReports] = useState<ProfileReportRecord[]>([]);

  const [settings, setSettings] = useState<UserSettingsRecord | null>(null);
  const [profileSummary, setProfileSummary] = useState<SettingsBootstrapProfileSummary | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [securityAudit, setSecurityAudit] = useState<SecurityAuditEvent[]>([]);
  const [connectedServices, setConnectedServices] = useState<ConnectedServiceItem[]>([]);
  const [storageOverview, setStorageOverview] = useState<StorageOverview | null>(null);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequestRecord | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicketRecord[]>([]);

  const syncToAuthContext = useCallback(
    (p: StudentProfileRecord) => {
      updateProfile({
        name: p.fullName,
        email: p.email,
        mobile: p.phone,
        college: p.college,
        course: p.course,
        semester: p.semester,
        enrollmentNo: p.enrollmentNo,
        avatarUrl: p.avatarUrl || authProfile.avatarUrl,
        bio: p.bio,
        city: p.city,
        state: p.state,
        interests: p.interests.map((i) => i.name),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const seedPayload = {
        userId,
        name: (user?.name && user.name !== 'Priya Sharma') ? user.name : (authProfile.name && authProfile.name !== 'Priya Sharma' ? authProfile.name : 'Student'),
        email: (user?.email && user.email !== 'priya.sharma@cse.iitb.ac.in') ? user.email : (authProfile.email && authProfile.email !== 'priya.sharma@cse.iitb.ac.in' ? authProfile.email : ''),
        mobile: user?.mobile || authProfile.mobile,
        college: (user?.college && user.college !== 'Indian Institute of Technology, Bombay') ? user.college : (authProfile.college && authProfile.college !== 'Indian Institute of Technology, Bombay' ? authProfile.college : ''),
        course: user?.course || authProfile.course,
        semester: user?.semester || authProfile.semester,
        enrollmentNo: (user?.enrollmentNo && user.enrollmentNo !== '22B030149') ? user.enrollmentNo : (authProfile.enrollmentNo && authProfile.enrollmentNo !== '22B030149' ? authProfile.enrollmentNo : ''),
        avatarUrl: user?.avatarUrl || authProfile.avatarUrl,
        bio: authProfile.bio,
        city: authProfile.city,
        state: authProfile.state,
        isVerified: user?.isVerified,
      };

      const [profRes, settRes] = await Promise.all([
        fetch('/api/profile/bootstrap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seedPayload),
        }),
        fetch('/api/settings/bootstrap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seedPayload),
        }),
      ]);

      if (profRes.ok) {
        const pd = await profRes.json();
        setProfileRecord(pd.profile);
        setCompletion(pd.completion);
        setStats(pd.stats);
        setActivity(pd.activity || []);
        setEligibleCertificates(pd.eligibleCertificates || []);
        setUnlockedBadges(pd.unlockedBadges || []);
        setRoleInfo(pd.roleInfo || { role: 'Student', label: null });
        setReports(pd.reports || []);
      }

      if (settRes.ok) {
        const sd = await settRes.json();
        setSettings(sd.settings);
        setProfileSummary(sd.profileSummary);
        setSessions(sd.sessions || []);
        setSecurityAudit(sd.securityAudit || []);
        setConnectedServices(sd.connectedServices || []);
        setStorageOverview(sd.storageOverview || null);
        setDeletionRequest(sd.deletionRequest || null);
        setSupportTickets(sd.supportTickets || []);
        applyDomPreferences(sd.settings, setTheme, setLanguage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load account settings and profile.');
    } finally {
      setLoading(false);
    }
  }, [userId, user?.name, user?.email, user?.mobile, user?.college, user?.course, user?.semester, user?.enrollmentNo, user?.avatarUrl, user?.isVerified, authProfile.name, authProfile.email, authProfile.mobile, authProfile.college, authProfile.course, authProfile.semester, authProfile.enrollmentNo, authProfile.avatarUrl, authProfile.bio, authProfile.city, authProfile.state, setTheme, setLanguage]);

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const saveProfilePatch = async (patch: Partial<StudentProfileRecord>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profile: patch }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.message || 'Failed to save profile changes.' };
      }
      setProfileRecord(data.profile);
      setCompletion(data.completion);
      if (data.stats) setStats(data.stats);
      if (data.activity) setActivity(data.activity);
      if (data.eligibleCertificates) setEligibleCertificates(data.eligibleCertificates);
      if (data.unlockedBadges) setUnlockedBadges(data.unlockedBadges);
      syncToAuthContext(data.profile);

      // Sync visibility into settings state if open
      if (settings && data.profile?.privacy?.visibility) {
        setSettings({
          ...settings,
          privacy: { ...settings.privacy, profileVisibility: data.profile.privacy.visibility },
        });
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Network error.' };
    } finally {
      setSaving(false);
    }
  };

  const toggleModeratorRole = async (passkey?: string, revert?: boolean) => {
    try {
      const res = await fetch('/api/profile/auth/role-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, passkey, revert }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Invalid moderation passkey.' };
      setRoleInfo(data.roleInfo);
      setReports(data.reports || []);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Failed to update moderation session.' };
    }
  };

  const submitModerationAction = async (payload: { reportId?: string; action: string; targetUserId?: string }) => {
    try {
      const res = await fetch('/api/profile/admin/moderation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Moderation action failed.' };
      setReports(data.reports || []);
      await refreshAll();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    }
  };

  const reportPublicItem = async (payload: {
    targetUserId: string;
    targetType: 'Profile' | 'Achievement' | 'Project';
    targetItemId?: string;
    reason: string;
  }) => {
    try {
      const res = await fetch('/api/profile/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterId: userId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Failed to submit report.' };
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    }
  };

  const saveSettingsPatch = async (patch: Partial<UserSettingsRecord>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, patch }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Failed to update settings.' };
      setSettings(data.settings);
      applyDomPreferences(data.settings, setTheme, setLanguage);
      if (patch.privacy?.profileVisibility && profileRecord) {
        setProfileRecord({
          ...profileRecord,
          privacy: { ...profileRecord.privacy, visibility: patch.privacy.profileVisibility },
        });
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error saving settings.' };
    } finally {
      setSaving(false);
    }
  };

  const performSensitiveAccountAction = async (payload: {
    currentPassword: string;
    action: 'update-email' | 'update-phone' | 'update-username' | 'change-password' | 'toggle-deactivate';
    email?: string;
    phone?: string;
    username?: string;
    newPassword?: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/account/sensitive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Account update failed.' };
      setSettings(data.settings);
      setProfileSummary(data.profileSummary);
      setSecurityAudit(data.securityAudit || []);
      await refreshAll();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error updating account.' };
    } finally {
      setSaving(false);
    }
  };

  const revokeSessions = async (opts: { sessionId?: string; revokeAllOther?: boolean }) => {
    try {
      const res = await fetch('/api/settings/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...opts }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Failed to revoke session.' };
      setSessions(data.sessions || []);
      await refreshAll();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    }
  };

  const disconnectService = async (serviceId: string) => {
    try {
      const res = await fetch('/api/settings/services/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, serviceId }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Failed to disconnect service.' };
      await refreshAll();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    }
  };

  const exportUserDataJson = async () => {
    try {
      const res = await fetch(`/api/settings/export?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Export failed.' };
      return { ok: true, data };
    } catch {
      return { ok: false, error: 'Failed to export data.' };
    }
  };

  const submitDeletionRequest = async (payload: {
    reauthPassword?: string;
    confirmationPhrase?: string;
    reason?: string;
    cancel?: boolean;
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Request failed.' };
      setDeletionRequest(data.deletionRequest || null);
      if (data.settings) setSettings(data.settings);
      await refreshAll();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    } finally {
      setSaving(false);
    }
  };

  const submitSupportTicket = async (payload: {
    category: SupportTicketRecord['category'];
    subject: string;
    description: string;
    attachmentName?: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || 'Ticket submission failed.' };
      setSupportTickets((prev) => [data.ticket, ...prev]);
      return { ok: true, ticket: data.ticket as SupportTicketRecord };
    } catch {
      return { ok: false, error: 'Network error.' };
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountProfileSettingsContext.Provider
      value={{
        loading,
        saving,
        error,
        profileRecord,
        completion,
        stats,
        activity,
        eligibleCertificates,
        unlockedBadges,
        roleInfo,
        reports,
        settings,
        profileSummary,
        sessions,
        securityAudit,
        connectedServices,
        storageOverview,
        deletionRequest,
        supportTickets,
        refreshAll,
        saveProfilePatch,
        toggleModeratorRole,
        submitModerationAction,
        reportPublicItem,
        saveSettingsPatch,
        performSensitiveAccountAction,
        revokeSessions,
        disconnectService,
        exportUserDataJson,
        submitDeletionRequest,
        submitSupportTicket,
      }}
    >
      {children}
    </AccountProfileSettingsContext.Provider>
  );
};

export const useAccountProfileSettings = () => {
  const ctx = useContext(AccountProfileSettingsContext);
  if (!ctx) {
    throw new Error('useAccountProfileSettings must be used within AccountProfileSettingsProvider');
  }
  return ctx;
};
