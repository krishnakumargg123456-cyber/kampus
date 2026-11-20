import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sendAiChatMessage } from '../services/kampusAiService';
import {
  DEFAULT_PULSE_NOTIFICATION_PREFS,
  containsPrivateContactPattern,
} from '../data/campusPulseData';
import type {
  AcademicDeadline,
  AlertPriority,
  AlertType,
  CampusAlert,
  CampusAnnouncement,
  CampusDepartment,
  CampusInstitution,
  CampusPoll,
  CampusPulseRole,
  DeadlineKind,
  FacilityCategory,
  FacilityUpdate,
  LostFoundCategory,
  LostFoundPost,
  PollPurpose,
  PublisherRecord,
  PulseAiAction,
  PulseAnalyticsSnapshot,
  PulseAttachment,
  PulseCategoryId,
  PulseNotificationPrefs,
  PulseReport,
  ReadingHistoryItem,
  StudentSubmission,
  SubmissionPostType,
} from '../types/campusPulse';

const PLANNER_SESSIONS_KEY = 'kampus_planner_partner_sessions_v1';
const CHAT_HANDOFF_KEY = 'kampus_chat_handoff_v1';
const RECENT_SEARCHES_KEY = 'kampus_pulse_recent_searches_v1';
const NOTIFIED_ALERTS_KEY = 'kampus_pulse_notified_ids_v1';

interface RoleInfo {
  role: CampusPulseRole;
  assignedDepartmentId?: string;
  staffTitle?: string;
}

interface CampusPulseContextType {
  loading: boolean;
  error: string | null;
  toastMessage: string | null;
  currentUserId: string;
  currentUserName: string;
  currentUserCourse: string;
  currentUserSemester: string;
  currentUserInterests: string[];
  roleInfo: RoleInfo;
  institutions: CampusInstitution[];
  selectedInstitution: CampusInstitution | null;
  departments: CampusDepartment[];
  announcements: CampusAnnouncement[];
  alerts: CampusAlert[];
  deadlines: AcademicDeadline[];
  facilities: FacilityUpdate[];
  lostFound: LostFoundPost[];
  polls: CampusPoll[];
  submissions: StudentSubmission[];
  reports: PulseReport[];
  publishers: PublisherRecord[];
  analytics: PulseAnalyticsSnapshot | null;
  savedNoticeIds: string[];
  savedDeadlineIds: string[];
  followedDepartmentIds: string[];
  readingHistory: ReadingHistoryItem[];
  notificationPrefs: PulseNotificationPrefs;
  recentSearches: string[];
  refresh: () => Promise<void>;
  selectInstitution: (institutionId: string) => Promise<void>;
  switchStaffSession: (passkey?: string, revertToStudent?: boolean) => Promise<{ ok: boolean; error?: string }>;
  recordAnnouncementView: (announcementId: string) => Promise<void>;
  toggleSavedNotice: (announcementId: string) => Promise<void>;
  toggleSavedDeadline: (deadline: AcademicDeadline) => Promise<void>;
  toggleFollowDepartment: (departmentId: string) => Promise<void>;
  uploadAttachment: (file: File) => Promise<{ attachment?: PulseAttachment; error?: string }>;
  publishOfficialAnnouncement: (payload: {
    institutionId: string;
    circularCode?: string;
    title: string;
    summary: string;
    content: string;
    categoryId: PulseCategoryId;
    subcategory: string;
    departmentId: string;
    targetCourse?: string;
    targetSemester?: string;
    status: 'New' | 'Important' | 'Urgent';
    priority: AlertPriority;
    isPinned?: boolean;
    isRestricted?: boolean;
    deadlineAt?: string;
    attachments?: PulseAttachment[];
  }) => Promise<{ ok: boolean; error?: string }>;
  modifyAnnouncement: (
    announcementId: string,
    action: 'toggle-pin' | 'archive' | 'edit',
    updates?: Partial<CampusAnnouncement>
  ) => Promise<{ ok: boolean; error?: string }>;
  createAlert: (payload: {
    institutionId: string;
    alertType: AlertType;
    title: string;
    priority: AlertPriority;
    description: string;
    departmentName: string;
    expiresAt?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  createDeadline: (payload: {
    institutionId: string;
    title: string;
    kind: DeadlineKind;
    dateISO: string;
    timeLabel?: string;
    departmentId: string;
    targetSemester?: string;
    description: string;
    isConfirmedOfficial: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  createFacilityUpdate: (payload: {
    institutionId: string;
    facilityCategory: FacilityCategory;
    facilityName: string;
    title: string;
    details: string;
    operatingInfo: string;
    statusNote: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  createLostFoundPost: (payload: {
    institutionId: string;
    postType: 'Lost Item' | 'Found Item';
    itemName: string;
    category: LostFoundCategory;
    description: string;
    approximateLocation: string;
    dateISO: string;
    imageUrl?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  updateLostFoundStatus: (postId: string, status: 'Open' | 'Recovered') => Promise<void>;
  contactPosterInChat: (post: LostFoundPost) => void;
  createPoll: (payload: {
    institutionId: string;
    question: string;
    purpose: PollPurpose;
    options: string[];
    closesAt: string;
    isAnonymous: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  votePoll: (pollId: string, optionId: string) => Promise<{ ok: boolean; error?: string }>;
  saveSubmission: (payload: {
    id?: string;
    institutionId: string;
    postType: SubmissionPostType;
    title: string;
    categoryId: PulseCategoryId;
    departmentId: string;
    description: string;
    supportingInfo: string;
    attachments: PulseAttachment[];
    saveAsDraft: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  moderateSubmission: (
    submissionId: string,
    decision: 'Under Review' | 'Approved' | 'Rejected',
    note?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  submitReport: (payload: {
    targetType: 'announcement' | 'lost-found' | 'poll' | 'submission';
    targetId: string;
    targetTitle: string;
    reason: string;
    details: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  resolveReport: (reportId: string, status: 'Reviewed' | 'Dismissed') => Promise<void>;
  updateNotificationPrefs: (prefs: PulseNotificationPrefs) => Promise<void>;
  assignPublisher: (payload: {
    targetUserId: string;
    targetName: string;
    role: CampusPulseRole;
    assignedDepartmentId?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  loadAnalytics: () => Promise<void>;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  askCampusAiOnNotice: (
    notice: CampusAnnouncement,
    action: PulseAiAction,
    question?: string
  ) => Promise<{ text: string; error?: string }>;
  showToast: (msg: string) => void;
}

const CampusPulseContext = createContext<CampusPulseContextType | undefined>(undefined);

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export const CampusPulseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const currentUserId = user?.id || 'usr_22b030149';
  const currentUserName = profile.name || user?.name || 'KAMPUS Student';
  const currentUserCourse = profile.course || user?.course || 'B.Tech in Computer Science & AI';
  const currentUserSemester = profile.semester || user?.semester || 'Semester 6';
  const currentUserInterests = profile.interests || [];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [institutions, setInstitutions] = useState<CampusInstitution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('inst_iitb');
  const [departments, setDepartments] = useState<CampusDepartment[]>([]);
  const [roleInfo, setRoleInfo] = useState<RoleInfo>({ role: 'Student' });
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>([]);
  const [alerts, setAlerts] = useState<CampusAlert[]>([]);
  const [deadlines, setDeadlines] = useState<AcademicDeadline[]>([]);
  const [facilities, setFacilities] = useState<FacilityUpdate[]>([]);
  const [lostFound, setLostFound] = useState<LostFoundPost[]>([]);
  const [polls, setPolls] = useState<CampusPoll[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [reports, setReports] = useState<PulseReport[]>([]);
  const [publishers, setPublishers] = useState<PublisherRecord[]>([]);
  const [analytics, setAnalytics] = useState<PulseAnalyticsSnapshot | null>(null);
  const [savedNoticeIds, setSavedNoticeIds] = useState<string[]>([]);
  const [savedDeadlineIds, setSavedDeadlineIds] = useState<string[]>([]);
  const [followedDepartmentIds, setFollowedDepartmentIds] = useState<string[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<PulseNotificationPrefs>(
    DEFAULT_PULSE_NOTIFICATION_PREFS
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const addNotifRef = useRef(addNotification);
  addNotifRef.current = addNotification;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const notifyIfAllowed = useCallback(
    (
      dedupeKey: string,
      enabled: boolean,
      payload: {
        title: string;
        description: string;
        type: 'academic' | 'campus' | 'career' | 'system';
      }
    ) => {
      if (!enabled) return;
      try {
        const raw = localStorage.getItem(NOTIFIED_ALERTS_KEY);
        const seen: string[] = raw ? JSON.parse(raw) : [];
        if (seen.includes(dedupeKey)) return;
        localStorage.setItem(NOTIFIED_ALERTS_KEY, JSON.stringify([...seen.slice(-80), dedupeKey]));
      } catch {
        // ignore storage errors
      }
      addNotifRef.current({
        title: payload.title,
        description: payload.description,
        time: 'Just now',
        type: payload.type,
        linkRoute: '/campus/campus-pulse',
      });
    },
    []
  );

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/campus-pulse/analytics?userId=${encodeURIComponent(currentUserId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics || null);
      } else {
        setAnalytics(null);
      }
    } catch {
      setAnalytics(null);
    }
  }, [currentUserId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/campus-pulse/bootstrap?userId=${encodeURIComponent(currentUserId)}&college=${encodeURIComponent(profile.college || '')}`
      );
      if (!res.ok) {
        throw new Error('Failed to load Campus Pulse data.');
      }
      const data = await res.json();
      setInstitutions(data.institutions || []);
      setDepartments(data.departments || []);
      setSelectedInstitutionId(data.selectedInstitutionId || 'inst_iitb');
      setRoleInfo(data.roleInfo || { role: 'Student' });
      setAnnouncements(data.announcements || []);
      setAlerts(data.alerts || []);
      setDeadlines(data.deadlines || []);
      setFacilities(data.facilities || []);
      setLostFound(data.lostFound || []);
      setPolls(data.polls || []);
      setSubmissions(data.submissions || []);
      setReports(data.reports || []);
      setPublishers(data.publishers || []);
      setSavedNoticeIds(data.savedNoticeIds || []);
      setSavedDeadlineIds(data.savedDeadlineIds || []);
      setFollowedDepartmentIds(data.followedDepartmentIds || []);
      setReadingHistory(data.readingHistory || []);
      const prefs: PulseNotificationPrefs =
        data.notificationPrefs || DEFAULT_PULSE_NOTIFICATION_PREFS;
      setNotificationPrefs(prefs);

      // Push single deduplicated critical alert to Notification Center on first visit if enabled
      const topCritical = (data.alerts || []).find(
        (al: CampusAlert) => al.priority === 'Critical' && al.institutionId === (data.selectedInstitutionId || 'inst_iitb')
      );
      if (topCritical && prefs.examAlerts) {
        notifyIfAllowed(`alert_${topCritical.id}`, true, {
          title: `Campus Alert: ${topCritical.title}`,
          description: topCritical.description,
          type: 'campus',
        });
      }

      if (data.roleInfo?.role && data.roleInfo.role !== 'Student') {
        const aRes = await fetch(
          `/api/campus-pulse/analytics?userId=${encodeURIComponent(currentUserId)}`
        );
        if (aRes.ok) {
          const aData = await aRes.json();
          setAnalytics(aData.analytics || null);
        }
      } else {
        setAnalytics(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Campus Pulse service.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, profile.college, notifyIfAllowed]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedInstitution = useMemo(
    () => institutions.find((i) => i.id === selectedInstitutionId) || institutions[0] || null,
    [institutions, selectedInstitutionId]
  );

  const selectInstitution = async (institutionId: string) => {
    setSelectedInstitutionId(institutionId);
    await fetch('/api/campus-pulse/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, selectedInstitutionId: institutionId }),
    });
    showToast('Switched campus institution view.');
  };

  const switchStaffSession = async (
    passkey?: string,
    revertToStudent?: boolean
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch('/api/campus-pulse/auth/role-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, passkey, revertToStudent }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.message || 'Authorization failed.' };
    }
    setRoleInfo(data.roleInfo);
    await refresh();
    showToast(
      revertToStudent
        ? 'Returned to Student view.'
        : `Authorized session active: ${data.roleInfo.role}`
    );
    return { ok: true };
  };

  const recordAnnouncementView = async (announcementId: string) => {
    try {
      const res = await fetch(`/api/campus-pulse/announcements/${announcementId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcementId ? { ...a, viewCount: data.viewCount } : a))
        );
        if (Array.isArray(data.readingHistory)) {
          setReadingHistory(data.readingHistory);
        }
      }
    } catch {
      // ignore telemetry drop
    }
  };

  const toggleSavedNotice = async (announcementId: string) => {
    const res = await fetch('/api/campus-pulse/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, kind: 'notice', targetId: announcementId }),
    });
    if (res.ok) {
      const data = await res.json();
      setSavedNoticeIds(data.savedNoticeIds || []);
      const savedNow = (data.savedNoticeIds || []).includes(announcementId);
      showToast(savedNow ? 'Notice saved to Saved Information.' : 'Notice removed from saved.');
    }
  };

  const toggleSavedDeadline = async (deadline: AcademicDeadline) => {
    const res = await fetch('/api/campus-pulse/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, kind: 'deadline', targetId: deadline.id }),
    });
    if (res.ok) {
      const data = await res.json();
      const nextSaved: string[] = data.savedDeadlineIds || [];
      setSavedDeadlineIds(nextSaved);
      const isNowSaved = nextSaved.includes(deadline.id);

      // Sync with existing KAMPUS Planner (no duplicate personal planner)
      try {
        const raw = localStorage.getItem(PLANNER_SESSIONS_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        const plannerEntryId = `cp_dl_${deadline.id}`;
        const filtered = Array.isArray(existing)
          ? existing.filter((e: { id: string }) => e.id !== plannerEntryId)
          : [];
        if (isNowSaved) {
          filtered.unshift({
            id: plannerEntryId,
            title: `${deadline.title}${deadline.isConfirmedOfficial ? '' : ' (Tentative)'}`,
            targetName: `Campus Pulse · ${deadline.source}`,
            subject: deadline.departmentName,
            dateISO: deadline.dateISO,
            timeSlot: deadline.timeLabel || '5:00 PM',
            durationMinutes: 45,
            status: 'Scheduled',
          });
        }
        localStorage.setItem(PLANNER_SESSIONS_KEY, JSON.stringify(filtered));
      } catch {
        // ignore storage failure
      }

      if (isNowSaved) {
        notifyIfAllowed(`dl_saved_${deadline.id}`, notificationPrefs.upcomingDeadlines, {
          title: `Deadline synced to KAMPUS Planner`,
          description: `${deadline.title} (${deadline.dateISO})`,
          type: 'academic',
        });
      }
      showToast(
        isNowSaved
          ? 'Deadline saved & synced to KAMPUS Planner.'
          : 'Deadline removed from saved & KAMPUS Planner.'
      );
    }
  };

  const toggleFollowDepartment = async (departmentId: string) => {
    const res = await fetch('/api/campus-pulse/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        kind: 'department',
        targetId: departmentId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setFollowedDepartmentIds(data.followedDepartmentIds || []);
      const nowFollowing = (data.followedDepartmentIds || []).includes(departmentId);
      showToast(nowFollowing ? 'Following department updates.' : 'Unfollowed department.');
    }
  };

  const uploadAttachment = async (
    file: File
  ): Promise<{ attachment?: PulseAttachment; error?: string }> => {
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'Attachment exceeds 5 MB upload limit.' };
    }
    try {
      const base64Data = await readFileAsDataUrl(file);
      const res = await fetch('/api/campus-pulse/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          fileName: file.name,
          mimeType: file.type,
          base64Data,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.message || 'Upload failed.' };
      return { attachment: data.attachment };
    } catch {
      return { error: 'Failed to read or upload file.' };
    }
  };

  const publishOfficialAnnouncement: CampusPulseContextType['publishOfficialAnnouncement'] = async (
    payload
  ) => {
    const res = await fetch('/api/campus-pulse/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        userId: currentUserId,
        authorName: roleInfo.staffTitle || currentUserName,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Could not publish notice.' };
    setAnnouncements((prev) => [data.announcement, ...prev]);
    if (roleInfo.role !== 'Student') loadAnalytics();

    const shouldNotify =
      (payload.categoryId === 'official-notices' && notificationPrefs.officialNotices) ||
      (payload.categoryId === 'examination-updates' && notificationPrefs.examAlerts) ||
      (followedDepartmentIds.includes(payload.departmentId) &&
        notificationPrefs.departmentUpdates);

    notifyIfAllowed(`ann_${data.announcement.id}`, shouldNotify, {
      title: `Official Notice: ${data.announcement.title}`,
      description: data.announcement.summary,
      type: 'campus',
    });

    showToast('Official notice published.');
    return { ok: true };
  };

  const modifyAnnouncement: CampusPulseContextType['modifyAnnouncement'] = async (
    announcementId,
    action,
    updates
  ) => {
    const res = await fetch(`/api/campus-pulse/announcements/${announcementId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, action, ...updates }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Update failed.' };
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === announcementId ? data.announcement : a))
    );
    showToast(
      action === 'toggle-pin'
        ? data.announcement.isPinned
          ? 'Notice pinned.'
          : 'Notice unpinned.'
        : action === 'archive'
          ? `Notice status updated to ${data.announcement.status}.`
          : 'Notice updated.'
    );
    return { ok: true };
  };

  const createAlert: CampusPulseContextType['createAlert'] = async (payload) => {
    const res = await fetch('/api/campus-pulse/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Could not publish alert.' };
    setAlerts((prev) => [data.alert, ...prev]);
    const allow =
      payload.alertType === 'Examination deadline'
        ? notificationPrefs.examAlerts
        : payload.alertType === 'Facility disruption'
          ? notificationPrefs.facilityDisruptions
          : notificationPrefs.classChanges;
    notifyIfAllowed(`alt_${data.alert.id}`, allow, {
      title: `${data.alert.priority} Alert: ${data.alert.title}`,
      description: data.alert.description,
      type: 'campus',
    });
    showToast('Campus alert issued.');
    return { ok: true };
  };

  const createDeadline: CampusPulseContextType['createDeadline'] = async (payload) => {
    const res = await fetch('/api/campus-pulse/deadlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Could not create deadline.' };
    setDeadlines((prev) => [data.deadline, ...prev]);
    showToast('Academic calendar deadline added.');
    return { ok: true };
  };

  const createFacilityUpdate: CampusPulseContextType['createFacilityUpdate'] = async (payload) => {
    const res = await fetch('/api/campus-pulse/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Could not post facility update.' };
    setFacilities((prev) => [data.facility, ...prev]);
    notifyIfAllowed(`fac_${data.facility.id}`, notificationPrefs.facilityDisruptions, {
      title: `Facility Update: ${data.facility.facilityName}`,
      description: data.facility.title,
      type: 'campus',
    });
    showToast('Facility notice published.');
    return { ok: true };
  };

  const createLostFoundPost: CampusPulseContextType['createLostFoundPost'] = async (payload) => {
    const combined = `${payload.itemName} ${payload.description} ${payload.approximateLocation}`;
    if (containsPrivateContactPattern(combined)) {
      return {
        ok: false,
        error:
          'Do not include phone numbers or email addresses for privacy. Peers will contact you via KAMPUS Chat.',
      };
    }
    const res = await fetch('/api/campus-pulse/lost-found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        userId: currentUserId,
        posterName: currentUserName,
        posterDepartment: currentUserCourse,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Could not post item.' };
    setLostFound((prev) => [data.post, ...prev]);
    showToast(`${payload.postType} posted.`);
    return { ok: true };
  };

  const updateLostFoundStatus = async (postId: string, status: 'Open' | 'Recovered') => {
    const res = await fetch(`/api/campus-pulse/lost-found/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, status }),
    });
    if (res.ok) {
      const data = await res.json();
      setLostFound((prev) => prev.map((p) => (p.id === postId ? data.post : p)));
      showToast(status === 'Recovered' ? 'Item marked as recovered!' : 'Post reopened.');
    }
  };

  const contactPosterInChat = (post: LostFoundPost) => {
    try {
      localStorage.setItem(
        CHAT_HANDOFF_KEY,
        JSON.stringify({
          name: post.posterName,
          partnerId: post.posterId,
          initialNotice: `Campus Pulse Lost & Found (${post.postType}): ${post.itemName} near ${post.approximateLocation}`,
        })
      );
    } catch {
      // ignore storage failure
    }
    navigate('/connect/chat');
  };

  const createPoll: CampusPulseContextType['createPoll'] = async (payload) => {
    const res = await fetch('/api/campus-pulse/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId, userName: currentUserName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Could not create poll.' };
    setPolls((prev) => [data.poll, ...prev]);
    notifyIfAllowed(`poll_${data.poll.id}`, notificationPrefs.pollReminders, {
      title: 'New Campus Poll Open',
      description: data.poll.question,
      type: 'campus',
    });
    showToast('Campus poll created.');
    return { ok: true };
  };

  const votePoll = async (
    pollId: string,
    optionId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/campus-pulse/polls/${pollId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, optionId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Vote failed.' };
    setPolls((prev) => prev.map((p) => (p.id === pollId ? data.poll : p)));
    if (roleInfo.role !== 'Student') loadAnalytics();
    showToast('Your vote has been recorded.');
    return { ok: true };
  };

  const saveSubmission: CampusPulseContextType['saveSubmission'] = async (payload) => {
    const res = await fetch('/api/campus-pulse/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId, userName: currentUserName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Could not save submission.' };
    setSubmissions((prev) => {
      const exists = prev.some((s) => s.id === data.submission.id);
      return exists
        ? prev.map((s) => (s.id === data.submission.id ? data.submission : s))
        : [data.submission, ...prev];
    });
    showToast(
      payload.saveAsDraft
        ? 'Submission saved as Draft.'
        : 'Submitted for institutional moderation review.'
    );
    return { ok: true };
  };

  const moderateSubmission = async (
    submissionId: string,
    decision: 'Under Review' | 'Approved' | 'Rejected',
    note?: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const res = await fetch(`/api/campus-pulse/submissions/${submissionId}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, decision, note }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Moderation action failed.' };
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? data.submission : s))
    );
    if (data.announcement) {
      setAnnouncements((prev) => [data.announcement, ...prev]);
    }
    notifyIfAllowed(`mod_${submissionId}_${decision}`, notificationPrefs.moderationUpdates, {
      title: `Submission ${decision}`,
      description: data.submission.title,
      type: 'campus',
    });
    if (roleInfo.role !== 'Student') loadAnalytics();
    showToast(`Submission marked as ${decision}.`);
    return { ok: true };
  };

  const submitReport: CampusPulseContextType['submitReport'] = async (payload) => {
    const res = await fetch('/api/campus-pulse/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId, userName: currentUserName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Report failed.' };
    setReports((prev) => [data.report, ...prev]);
    showToast('Report submitted for moderation review.');
    return { ok: true };
  };

  const resolveReport = async (reportId: string, status: 'Reviewed' | 'Dismissed') => {
    const res = await fetch(`/api/campus-pulse/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, status }),
    });
    if (res.ok) {
      const data = await res.json();
      setReports((prev) => prev.map((r) => (r.id === reportId ? data.report : r)));
      showToast(`Report marked as ${status}.`);
    }
  };

  const updateNotificationPrefs = async (prefs: PulseNotificationPrefs) => {
    setNotificationPrefs(prefs);
    await fetch('/api/campus-pulse/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, notificationPrefs: prefs }),
    });
    showToast('Notification preferences updated.');
  };

  const assignPublisher: CampusPulseContextType['assignPublisher'] = async (payload) => {
    const res = await fetch('/api/campus-pulse/publishers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, userId: currentUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.message || 'Could not update publisher.' };
    setPublishers(data.publishers || []);
    showToast('Publisher permissions updated.');
    return { ok: true };
  };

  const addRecentSearch = useCallback((q: string) => {
    const clean = q.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((i) => i.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        8
      );
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  }, []);

  const askCampusAiOnNotice = async (
    notice: CampusAnnouncement,
    action: PulseAiAction,
    question?: string
  ): Promise<{ text: string; error?: string }> => {
    const noticeContext = [
      `Notice Title: ${notice.title}`,
      `Reference: ${notice.circularCode || notice.id}`,
      `Issuing Authority: ${notice.publishingAuthority}`,
      `Department: ${notice.departmentName}`,
      `Published: ${notice.publishedAt}`,
      notice.deadlineAt ? `Deadline: ${notice.deadlineAt}` : '',
      `Official Source: ${notice.isOfficial ? 'Yes (Authorized Official Notice)' : 'No (Approved Student Submission)'}`,
      `Notice Body:\n${notice.content}`,
    ]
      .filter(Boolean)
      .join('\n');

    const instructions: Record<PulseAiAction, string> = {
      summarize:
        'Provide a crisp, strictly accurate executive summary of this campus notice without altering or inventing any dates, rules, or fees.',
      'simple-explain':
        'Explain what this notice requires from students in clear, plain everyday language without changing any official requirement.',
      'extract-deadlines':
        'Extract ONLY explicitly stated important dates, deadlines, required documents, and eligibility details from this notice. If a field is not stated in the notice, explicitly write "Not stated in notice".',
      'bullet-summary':
        'Create 4-6 concise action-focused bullet points summarizing this notice accurately.',
      'translate-hindi':
        'Translate the key summary, requirements, and deadlines of this notice accurately into natural Hindi (Devanagari script) keeping official reference codes intact.',
      'translate-hinglish':
        'Explain the key summary, requirements, and deadlines of this notice clearly in Hinglish (conversational Roman Hindi + English academic terms).',
      'ask-question': `Answer this student question strictly based on the notice text above. If the notice does not contain the answer, state that clearly instead of guessing.\n\nStudent Question: ${question || ''}`,
    };

    try {
      const resp = await sendAiChatMessage({
        messages: [
          {
            role: 'user',
            content: `${instructions[action]}\n\n---\n${noticeContext}`,
          },
        ],
        language: action === 'translate-hinglish' ? 'Hinglish' : 'English',
        learningLevel: 'Intermediate',
        responseStyle: 'Detailed Explanation',
        studentContext: `Campus Pulse Notice Analysis (${notice.circularCode || notice.id})`,
      });
      return { text: resp.reply };
    } catch (err) {
      return {
        text: '',
        error:
          err instanceof Error
            ? err.message
            : 'KAMPUS AI could not analyze this notice right now.',
      };
    }
  };

  const value: CampusPulseContextType = {
    loading,
    error,
    toastMessage,
    currentUserId,
    currentUserName,
    currentUserCourse,
    currentUserSemester,
    currentUserInterests,
    roleInfo,
    institutions,
    selectedInstitution,
    departments,
    announcements,
    alerts,
    deadlines,
    facilities,
    lostFound,
    polls,
    submissions,
    reports,
    publishers,
    analytics,
    savedNoticeIds,
    savedDeadlineIds,
    followedDepartmentIds,
    readingHistory,
    notificationPrefs,
    recentSearches,
    refresh,
    selectInstitution,
    switchStaffSession,
    recordAnnouncementView,
    toggleSavedNotice,
    toggleSavedDeadline,
    toggleFollowDepartment,
    uploadAttachment,
    publishOfficialAnnouncement,
    modifyAnnouncement,
    createAlert,
    createDeadline,
    createFacilityUpdate,
    createLostFoundPost,
    updateLostFoundStatus,
    contactPosterInChat,
    createPoll,
    votePoll,
    saveSubmission,
    moderateSubmission,
    submitReport,
    resolveReport,
    updateNotificationPrefs,
    assignPublisher,
    loadAnalytics,
    addRecentSearch,
    clearRecentSearches,
    askCampusAiOnNotice,
    showToast,
  };

  return (
    <CampusPulseContext.Provider value={value}>{children}</CampusPulseContext.Provider>
  );
};

export const useCampusPulse = () => {
  const ctx = useContext(CampusPulseContext);
  if (!ctx) throw new Error('useCampusPulse must be used within a CampusPulseProvider');
  return ctx;
};
