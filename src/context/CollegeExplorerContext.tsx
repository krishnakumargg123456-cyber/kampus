import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sendAiChatMessage } from '../services/kampusAiService';
import { formatINR } from '../data/collegeExplorerData';
import type {
  AdmissionStatus,
  AdmissionTrackerEntry,
  AdmissionUpdateItem,
  CollegeRecord,
  CollegeReview,
  CollegeType,
  ComparisonHistoryItem,
  DataVerificationStatus,
  ExplorerRole,
  ExplorerScholarship,
  ReviewCategory,
  ReviewReportItem,
  SavedCollegeEntry,
  ScholarshipCategory,
  ShortlistCollection,
  StandaloneCourse,
  TrackerApplicationStatus,
} from '../types/collegeExplorer';

const PLANNER_STORAGE_KEY = 'kampus_planner_partner_sessions_v1';

export type ExplorerAiMode =
  | 'course-fit'
  | 'eligibility'
  | 'compare-colleges'
  | 'admission-steps'
  | 'fee-breakdown'
  | 'prep-checklist'
  | 'scholarship-eligibility';

export interface ExplorerContextType {
  loading: boolean;
  statusToast: { type: 'success' | 'error' | 'info'; message: string } | null;
  clearToast: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  providerInfo: { id: string; name: string; isVerifiedOfficialFeed: boolean } | null;
  colleges: CollegeRecord[];
  courses: StandaloneCourse[];
  scholarships: ExplorerScholarship[];
  admissionUpdates: AdmissionUpdateItem[];
  reviews: CollegeReview[];
  reports: ReviewReportItem[];
  recentlyViewedIds: string[];
  collections: ShortlistCollection[];
  savedColleges: SavedCollegeEntry[];
  admissions: AdmissionTrackerEntry[];
  comparisonHistory: ComparisonHistoryItem[];
  compareIds: string[];
  roleInfo: { role: ExplorerRole; label: string | null };
  crossModule: {
    isKampusIdVerified: boolean;
    kampusIdNumber: string | null;
    careerTargetRoles: string[];
  };
  reload: () => Promise<void>;
  markCollegeViewed: (collegeId: string) => Promise<void>;
  switchRoleSession: (passkey?: string, revert?: boolean) => Promise<boolean>;
  createCollection: (name: string) => Promise<boolean>;
  saveOrUpdateShortlist: (payload: {
    collegeId: string;
    action?: 'save' | 'remove';
    collectionName?: string;
    personalNote?: string;
    reminderDateISO?: string;
  }) => Promise<boolean>;
  toggleCompareCollege: (collegeId: string) => void;
  setCompareCollegeIds: (ids: string[]) => void;
  saveComparison: (title?: string) => Promise<ComparisonHistoryItem | null>;
  loadSharedComparison: (
    code: string
  ) => Promise<{ comparison: ComparisonHistoryItem; colleges: CollegeRecord[] } | null>;
  addToAdmissionTracker: (payload: {
    collegeId: string;
    courseName?: string;
    status?: TrackerApplicationStatus;
    deadlineISO?: string;
    reminderDateISO?: string;
    notes?: string;
  }) => Promise<AdmissionTrackerEntry | null>;
  updateAdmissionTracker: (
    id: string,
    patch: Partial<AdmissionTrackerEntry>
  ) => Promise<boolean>;
  deleteAdmissionTracker: (id: string) => Promise<boolean>;
  uploadAdmissionDoc: (
    file: File
  ) => Promise<{ id: string; fileName: string; url: string; sizeBytes: number } | null>;
  scheduleDeadlineReminder: (payload: {
    title: string;
    collegeName: string;
    dateISO: string;
    notes?: string;
  }) => void;
  submitReview: (payload: {
    collegeId: string;
    category: ReviewCategory;
    rating: number;
    title: string;
    experienceText: string;
  }) => Promise<boolean>;
  toggleHelpfulReview: (reviewId: string) => Promise<void>;
  reportReview: (payload: {
    reviewId: string;
    reason: string;
    details?: string;
  }) => Promise<boolean>;
  adminAddCollege: (payload: {
    name: string;
    shortName?: string;
    city: string;
    state: string;
    primaryCategory: CollegeType;
    collegeTypes?: CollegeType[];
    affiliatedUniversity?: string;
    accreditation?: string;
    officialWebsite?: string;
    officialApplicationUrl?: string;
    overview?: string;
    photoKey?: string;
    admissionStatus?: AdmissionStatus;
    nextDeadlineISO?: string;
    tuitionRangeLabel?: string;
    minAnnualTuitionINR?: number | null;
    maxAnnualTuitionINR?: number | null;
    hostelAvailable?: boolean;
    scholarshipAvailable?: boolean;
    dataVerificationStatus?: DataVerificationStatus;
    featured?: boolean;
  }) => Promise<boolean>;
  adminUpdateCollege: (
    id: string,
    patch: Partial<CollegeRecord> & {
      newCourse?: {
        name: string;
        degreeType: string;
        degreeShort: string;
        stream: string;
        department: string;
        duration: string;
        eligibility: string;
        entranceExams: string[];
        annualTuitionFeeINR: number | null;
      };
    }
  ) => Promise<boolean>;
  adminAddScholarship: (payload: {
    title: string;
    provider: string;
    category: ScholarshipCategory;
    eligibility: string;
    benefits: string;
    deadlineISO: string;
    requiredDocuments?: string[];
    officialSourceUrl?: string;
    dataVerificationStatus?: DataVerificationStatus;
  }) => Promise<boolean>;
  adminModerateReview: (
    id: string,
    moderationStatus: 'Published' | 'Pending Moderation' | 'Flagged' | 'Removed'
  ) => Promise<boolean>;
  adminMarkReportReviewed: (id: string) => Promise<boolean>;
  runExplorerAiAssistant: (
    mode: ExplorerAiMode,
    userQuery: string,
    selectedCollegeIds?: string[]
  ) => Promise<{ reply: string; sourceLabel: string }>;
}

const CollegeExplorerContext = createContext<ExplorerContextType | undefined>(undefined);

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file from device.'));
    reader.readAsDataURL(file);
  });
}

export const CollegeExplorerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const userId = user?.id || 'usr_22b030149';

  const [loading, setLoading] = useState(true);
  const [statusToast, setStatusToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [providerInfo, setProviderInfo] = useState<{
    id: string;
    name: string;
    isVerifiedOfficialFeed: boolean;
  } | null>(null);
  const [colleges, setColleges] = useState<CollegeRecord[]>([]);
  const [courses, setCourses] = useState<StandaloneCourse[]>([]);
  const [scholarships, setScholarships] = useState<ExplorerScholarship[]>([]);
  const [admissionUpdates, setAdmissionUpdates] = useState<AdmissionUpdateItem[]>([]);
  const [reviews, setReviews] = useState<CollegeReview[]>([]);
  const [reports, setReports] = useState<ReviewReportItem[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [collections, setCollections] = useState<ShortlistCollection[]>([]);
  const [savedColleges, setSavedColleges] = useState<SavedCollegeEntry[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionTrackerEntry[]>([]);
  const [comparisonHistory, setComparisonHistory] = useState<ComparisonHistoryItem[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [roleInfo, setRoleInfo] = useState<{ role: ExplorerRole; label: string | null }>({
    role: 'Student',
    label: null,
  });
  const [crossModule, setCrossModule] = useState<{
    isKampusIdVerified: boolean;
    kampusIdNumber: string | null;
    careerTargetRoles: string[];
  }>({
    isKampusIdVerified: false,
    kampusIdNumber: null,
    careerTargetRoles: [],
  });

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      setStatusToast({ type, message });
    },
    []
  );

  const clearToast = useCallback(() => setStatusToast(null), []);

  useEffect(() => {
    if (!statusToast) return;
    const t = setTimeout(() => setStatusToast(null), 4800);
    return () => clearTimeout(t);
  }, [statusToast]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/explorer/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load College Explorer workspace.');

      setProviderInfo(data.providerInfo || null);
      setColleges(data.colleges || []);
      setCourses(data.courses || []);
      setScholarships(data.scholarships || []);
      setAdmissionUpdates(data.admissionUpdates || []);
      setReviews(data.reviews || []);
      setReports(data.reports || []);
      setRecentlyViewedIds(data.recentlyViewedIds || []);
      setCollections(data.collections || []);
      setSavedColleges(data.savedColleges || []);
      setAdmissions(data.admissions || []);
      setComparisonHistory(data.comparisonHistory || []);
      setRoleInfo(data.roleInfo || { role: 'Student', label: null });
      setCrossModule(
        data.crossModule || {
          isKampusIdVerified: false,
          kampusIdNumber: null,
          careerTargetRoles: [],
        }
      );
      setCompareIds((prev) => {
        if (prev.length > 0) return prev;
        const cols: CollegeRecord[] = data.colleges || [];
        return cols.slice(0, 2).map((c) => c.id);
      });
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Unable to reach College Explorer backend.'
      );
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const markCollegeViewed = useCallback(
    async (collegeId: string) => {
      try {
        const res = await fetch('/api/explorer/viewed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, collegeId }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.recentlyViewedIds)) {
          setRecentlyViewedIds(data.recentlyViewedIds);
        }
      } catch {
        // non-fatal
      }
    },
    [userId]
  );

  const switchRoleSession = useCallback(
    async (passkey?: string, revert?: boolean): Promise<boolean> => {
      try {
        const res = await fetch('/api/explorer/auth/role-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, passkey, revert }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Passkey verification failed.');
          return false;
        }
        await reload();
        showToast(
          'success',
          revert
            ? 'Returned to standard Student mode.'
            : `Elevated role active: ${data.roleInfo?.role}`
        );
        return true;
      } catch {
        showToast('error', 'Unable to switch role session.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const createCollection = useCallback(
    async (name: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/explorer/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not create shortlist collection.');
          return false;
        }
        setCollections(data.collections || []);
        showToast('success', `Shortlist collection "${name}" created.`);
        return true;
      } catch {
        showToast('error', 'Failed to create collection.');
        return false;
      }
    },
    [userId, showToast]
  );

  const saveOrUpdateShortlist = useCallback(
    async (payload: {
      collegeId: string;
      action?: 'save' | 'remove';
      collectionName?: string;
      personalNote?: string;
      reminderDateISO?: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch('/api/explorer/shortlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to update shortlist.');
          return false;
        }
        setSavedColleges(data.savedColleges || []);
        showToast(
          'success',
          payload.action === 'remove'
            ? 'Removed from your shortlist.'
            : 'Shortlist updated.'
        );
        return true;
      } catch {
        showToast('error', 'Network error updating shortlist.');
        return false;
      }
    },
    [userId, showToast]
  );

  const toggleCompareCollege = useCallback(
    (collegeId: string) => {
      setCompareIds((prev) => {
        if (prev.includes(collegeId)) {
          showToast('info', 'Removed college from comparison list.');
          return prev.filter((id) => id !== collegeId);
        }
        if (prev.length >= 4) {
          showToast('error', 'You can compare up to 4 colleges at a time. Remove one first.');
          return prev;
        }
        showToast('success', 'Added college to side-by-side comparison.');
        return [...prev, collegeId];
      });
    },
    [showToast]
  );

  const setCompareCollegeIds = useCallback((ids: string[]) => {
    setCompareIds(ids.slice(0, 4));
  }, []);

  const saveComparison = useCallback(
    async (title?: string): Promise<ComparisonHistoryItem | null> => {
      try {
        const res = await fetch('/api/explorer/comparisons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, collegeIds: compareIds, title }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not save comparison.');
          return null;
        }
        setComparisonHistory(data.history || []);
        showToast('success', 'Comparison saved with shareable link.');
        return data.comparison || null;
      } catch {
        showToast('error', 'Network error saving comparison.');
        return null;
      }
    },
    [userId, compareIds, showToast]
  );

  const loadSharedComparison = useCallback(
    async (
      code: string
    ): Promise<{ comparison: ComparisonHistoryItem; colleges: CollegeRecord[] } | null> => {
      try {
        const res = await fetch(`/api/explorer/comparisons/shared/${encodeURIComponent(code)}`);
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Shared comparison link not found.');
          return null;
        }
        return data;
      } catch {
        showToast('error', 'Failed to load shared comparison.');
        return null;
      }
    },
    [showToast]
  );

  const addToAdmissionTracker = useCallback(
    async (payload: {
      collegeId: string;
      courseName?: string;
      status?: TrackerApplicationStatus;
      deadlineISO?: string;
      reminderDateISO?: string;
      notes?: string;
    }): Promise<AdmissionTrackerEntry | null> => {
      try {
        const res = await fetch('/api/explorer/admissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to add to My Admissions.');
          return null;
        }
        setAdmissions((prev) => [data.entry, ...prev]);
        showToast('success', `Added "${data.entry.collegeName}" to My Admissions tracker.`);
        return data.entry;
      } catch {
        showToast('error', 'Failed to create admission tracker item.');
        return null;
      }
    },
    [userId, showToast]
  );

  const updateAdmissionTracker = useCallback(
    async (id: string, patch: Partial<AdmissionTrackerEntry>): Promise<boolean> => {
      try {
        const res = await fetch(`/api/explorer/admissions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...patch }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not update admission record.');
          return false;
        }
        setAdmissions((prev) => prev.map((a) => (a.id === id ? data.entry : a)));
        showToast('success', 'Admission tracker updated.');
        return true;
      } catch {
        showToast('error', 'Error updating admission record.');
        return false;
      }
    },
    [userId, showToast]
  );

  const deleteAdmissionTracker = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(
          `/api/explorer/admissions/${id}?userId=${encodeURIComponent(userId)}`,
          { method: 'DELETE' }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast('error', data.message || 'Unable to delete admission entry.');
          return false;
        }
        setAdmissions((prev) => prev.filter((a) => a.id !== id));
        showToast('info', 'Removed from My Admissions tracker.');
        return true;
      } catch {
        showToast('error', 'Error removing admission entry.');
        return false;
      }
    },
    [userId, showToast]
  );

  const uploadAdmissionDoc = useCallback(
    async (
      file: File
    ): Promise<{ id: string; fileName: string; url: string; sizeBytes: number } | null> => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!['.pdf', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        showToast('error', 'Only PDF, PNG, JPG, and WEBP documents are accepted.');
        return null;
      }
      if (file.size === 0 || file.size > 5 * 1024 * 1024) {
        showToast('error', 'Document must be non-empty and under 5 MB.');
        return null;
      }
      try {
        const base64Data = await readFileAsBase64(file);
        const res = await fetch('/api/explorer/upload-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            fileName: file.name,
            mimeType: file.type,
            base64Data,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Document validation failed.');
          return null;
        }
        showToast('success', `Uploaded "${file.name}".`);
        return data.doc;
      } catch {
        showToast('error', 'Document upload failed.');
        return null;
      }
    },
    [userId, showToast]
  );

  const scheduleDeadlineReminder = useCallback(
    (payload: { title: string; collegeName: string; dateISO: string; notes?: string }) => {
      try {
        const existingRaw = localStorage.getItem(PLANNER_STORAGE_KEY);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newSession = {
          id: `exp_rem_${Date.now()}`,
          title: payload.title,
          targetName: payload.collegeName,
          subject: payload.notes ? `Admission · ${payload.notes}` : 'Admission Deadline Prep',
          dateISO: payload.dateISO,
          timeSlot: '09:00 AM',
          durationMinutes: 45,
          status: 'scheduled',
        };
        const updated = Array.isArray(existing) ? [newSession, ...existing] : [newSession];
        localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // non-fatal
      }

      addNotification({
        title: `Admission Reminder: ${payload.collegeName}`,
        description: `${payload.title} scheduled for ${payload.dateISO} in KAMPUS Planner.`,
        time: 'Just now',
        type: 'academic',
        linkRoute: '/campus/college-explorer',
      });
      showToast(
        'success',
        `Added deadline reminder for ${payload.collegeName} (${payload.dateISO}) to Planner & Notifications.`
      );
    },
    [addNotification, showToast]
  );

  const submitReview = useCallback(
    async (payload: {
      collegeId: string;
      category: ReviewCategory;
      rating: number;
      title: string;
      experienceText: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch('/api/explorer/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            authorName: user?.name || profile.name || 'KAMPUS Student',
            ...payload,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Unable to submit review.');
          return false;
        }
        setReviews((prev) => [data.review, ...prev]);
        showToast('success', 'Student insight submitted.');
        return true;
      } catch {
        showToast('error', 'Failed to submit review.');
        return false;
      }
    },
    [userId, user?.name, profile.name, showToast]
  );

  const toggleHelpfulReview = useCallback(
    async (reviewId: string) => {
      try {
        const res = await fetch(`/api/explorer/reviews/${reviewId}/helpful`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (res.ok && data.review) {
          setReviews((prev) => prev.map((r) => (r.id === reviewId ? data.review : r)));
        }
      } catch {
        // ignore
      }
    },
    [userId]
  );

  const reportReview = useCallback(
    async (payload: { reviewId: string; reason: string; details?: string }): Promise<boolean> => {
      try {
        const res = await fetch(`/api/explorer/reviews/${payload.reviewId}/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            reason: payload.reason,
            details: payload.details,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Unable to submit report.');
          return false;
        }
        await reload();
        showToast('info', 'Report queued for moderation review.');
        return true;
      } catch {
        showToast('error', 'Report submission failed.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const adminAddCollege = useCallback(
    async (payload: {
      name: string;
      shortName?: string;
      city: string;
      state: string;
      primaryCategory: CollegeType;
      collegeTypes?: CollegeType[];
      affiliatedUniversity?: string;
      accreditation?: string;
      officialWebsite?: string;
      officialApplicationUrl?: string;
      overview?: string;
      photoKey?: string;
      admissionStatus?: AdmissionStatus;
      nextDeadlineISO?: string;
      tuitionRangeLabel?: string;
      minAnnualTuitionINR?: number | null;
      maxAnnualTuitionINR?: number | null;
      hostelAvailable?: boolean;
      scholarshipAvailable?: boolean;
      dataVerificationStatus?: DataVerificationStatus;
      featured?: boolean;
    }): Promise<boolean> => {
      try {
        const res = await fetch('/api/explorer/admin/colleges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Permission denied or invalid college fields.');
          return false;
        }
        setColleges((prev) => [data.college, ...prev]);
        showToast('success', `Added "${data.college.name}" to College Explorer catalog.`);
        return true;
      } catch {
        showToast('error', 'Failed to add college.');
        return false;
      }
    },
    [userId, showToast]
  );

  const adminUpdateCollege = useCallback(
    async (
      id: string,
      patch: Partial<CollegeRecord> & {
        newCourse?: {
          name: string;
          degreeType: string;
          degreeShort: string;
          stream: string;
          department: string;
          duration: string;
          eligibility: string;
          entranceExams: string[];
          annualTuitionFeeINR: number | null;
        };
      }
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/explorer/admin/colleges/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...patch }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Update failed.');
          return false;
        }
        setColleges((prev) => prev.map((c) => (c.id === id ? data.college : c)));
        showToast('success', `Updated "${data.college.name}".`);
        return true;
      } catch {
        showToast('error', 'Failed to update college record.');
        return false;
      }
    },
    [userId, showToast]
  );

  const adminAddScholarship = useCallback(
    async (payload: {
      title: string;
      provider: string;
      category: ScholarshipCategory;
      eligibility: string;
      benefits: string;
      deadlineISO: string;
      requiredDocuments?: string[];
      officialSourceUrl?: string;
      dataVerificationStatus?: DataVerificationStatus;
    }): Promise<boolean> => {
      try {
        const res = await fetch('/api/explorer/admin/scholarships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to add scholarship.');
          return false;
        }
        setScholarships((prev) => [data.scholarship, ...prev]);
        showToast('success', `Added scholarship "${data.scholarship.title}".`);
        return true;
      } catch {
        showToast('error', 'Error saving scholarship.');
        return false;
      }
    },
    [userId, showToast]
  );

  const adminModerateReview = useCallback(
    async (
      id: string,
      moderationStatus: 'Published' | 'Pending Moderation' | 'Flagged' | 'Removed'
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/explorer/admin/reviews/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, moderationStatus }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Moderation action denied.');
          return false;
        }
        setReviews((prev) => prev.map((r) => (r.id === id ? data.review : r)));
        showToast('success', `Review marked as "${moderationStatus}".`);
        return true;
      } catch {
        showToast('error', 'Moderation request failed.');
        return false;
      }
    },
    [userId, showToast]
  );

  const adminMarkReportReviewed = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/explorer/admin/reports/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to update report.');
          return false;
        }
        setReports((prev) => prev.map((rp) => (rp.id === id ? data.report : rp)));
        showToast('success', 'Report marked as reviewed.');
        return true;
      } catch {
        showToast('error', 'Failed to update report.');
        return false;
      }
    },
    [userId, showToast]
  );

  const runExplorerAiAssistant = useCallback(
    async (
      mode: ExplorerAiMode,
      userQuery: string,
      selectedCollegeIds?: string[]
    ): Promise<{ reply: string; sourceLabel: string }> => {
      const targetColleges =
        selectedCollegeIds && selectedCollegeIds.length > 0
          ? colleges.filter((c) => selectedCollegeIds.includes(c.id))
          : colleges.slice(0, 6);

      const catalogDigest = targetColleges
        .map((c) => {
          const courseSummary = c.courses
            .map(
              (crs) =>
                `${crs.name} (${crs.degreeShort}, ${crs.duration}, Exams: ${crs.entranceExams.join('/')}, Tuition: ${formatINR(crs.annualTuitionFeeINR)}, Elig: ${crs.eligibility})`
            )
            .join('; ');
          return `- ${c.name} [${c.primaryCategory} | ${c.city}, ${c.state} | Status: ${c.admissionStatus} | Record: ${c.dataVerificationStatus}]\n  Tuition Range: ${c.feeInfo.tuitionRangeLabel} (Hostel: ${c.feeInfo.hostelFeeLabel})\n  Avg Package: ${c.placementInfo.averagePackageLabel || 'Not published'} (Source: ${c.placementInfo.sourceCitation || 'None'})\n  Next Deadline: ${c.nextDeadlineISO || 'Check official portal'}\n  Docs: ${c.requiredDocuments.join(', ')}\n  Courses: ${courseSummary || 'None listed'}`;
        })
        .join('\n');

      const schDigest = scholarships
        .slice(0, 6)
        .map(
          (s) =>
            `- ${s.title} (${s.category} · ${s.provider}): Eligibility: ${s.eligibility} | Benefits: ${s.benefits} | Deadline: ${s.deadlineISO}`
        )
        .join('\n');

      const prompt = [
        `Mode: ${mode}`,
        `Student Query: ${userQuery || 'Help me evaluate suitable options based on the catalog.'}`,
        `Student Profile Context: Course="${profile.course || 'Not set'}", Interests="${(profile.interests || []).join(', ') || 'None specified'}", Career Goals="${crossModule.careerTargetRoles.join(', ') || 'Not specified'}"`,
        `IMPORTANT INTEGRITY INSTRUCTIONS:`,
        `1. Base all specific college facts (fees, entrance exams, deadlines, placement figures, eligibility) strictly on the Catalog Records & Scholarships provided below.`,
        `2. If a figure (e.g., exact cutoff, missing salary package, or unverified date) is not in the catalog, explicitly state "Not published in available records — verify on official portal" and NEVER invent data.`,
        `3. Explicitly note that admission is NEVER guaranteed and depends on official merit/counseling cycles.`,
        `\nCATALOG RECORDS:\n${catalogDigest}`,
        `\nSCHOLARSHIPS:\n${schDigest}`,
      ].join('\n');

      try {
        const res = await sendAiChatMessage({
          messages: [{ role: 'user', content: prompt }],
          language: 'English',
          learningLevel: 'Intermediate',
          responseStyle: 'Detailed Explanation',
          studentContext: `KAMPUS College Explorer research session for ${profile.name || 'Student'}`,
        });
        return {
          reply: res.reply,
          sourceLabel: 'KAMPUS AI · Grounded in Available Explorer Records',
        };
      } catch {
        // Honest grounded fallback when live AI key is not set
        const lines: string[] = [
          `### Grounded Explorer Summary (${mode})`,
          `Live AI model response is unavailable right now; here is a verified breakdown directly from the loaded College Explorer catalog records:`,
          '',
          ...targetColleges.slice(0, 4).map(
            (c) =>
              `- **${c.name}** (${c.city}, ${c.state} · ${c.dataVerificationStatus})\n  - Programs: ${c.courses.map((cr) => cr.degreeShort).join(', ') || 'Verify on portal'}\n  - Tuition: ${c.feeInfo.tuitionRangeLabel}\n  - Next Deadline: ${c.nextDeadlineISO || 'Check official portal'}\n  - Placement Avg: ${c.placementInfo.averagePackageLabel || 'Not published in sample record'}\n  - Required Docs: ${c.requiredDocuments.join(', ')}`
          ),
          '',
          `**Important Note:** Availability, cutoffs, and final seat allotment are governed strictly by official institutional and counseling portals — admission is never guaranteed from estimate summaries.`,
        ];
        return {
          reply: lines.join('\n'),
          sourceLabel: 'Explorer Catalog Summary (Offline Fallback)',
        };
      }
    },
    [colleges, scholarships, profile.course, profile.interests, profile.name, crossModule.careerTargetRoles]
  );

  const value = useMemo<ExplorerContextType>(
    () => ({
      loading,
      statusToast,
      clearToast,
      showToast,
      providerInfo,
      colleges,
      courses,
      scholarships,
      admissionUpdates,
      reviews,
      reports,
      recentlyViewedIds,
      collections,
      savedColleges,
      admissions,
      comparisonHistory,
      compareIds,
      roleInfo,
      crossModule,
      reload,
      markCollegeViewed,
      switchRoleSession,
      createCollection,
      saveOrUpdateShortlist,
      toggleCompareCollege,
      setCompareCollegeIds,
      saveComparison,
      loadSharedComparison,
      addToAdmissionTracker,
      updateAdmissionTracker,
      deleteAdmissionTracker,
      uploadAdmissionDoc,
      scheduleDeadlineReminder,
      submitReview,
      toggleHelpfulReview,
      reportReview,
      adminAddCollege,
      adminUpdateCollege,
      adminAddScholarship,
      adminModerateReview,
      adminMarkReportReviewed,
      runExplorerAiAssistant,
    }),
    [
      loading,
      statusToast,
      clearToast,
      showToast,
      providerInfo,
      colleges,
      courses,
      scholarships,
      admissionUpdates,
      reviews,
      reports,
      recentlyViewedIds,
      collections,
      savedColleges,
      admissions,
      comparisonHistory,
      compareIds,
      roleInfo,
      crossModule,
      reload,
      markCollegeViewed,
      switchRoleSession,
      createCollection,
      saveOrUpdateShortlist,
      toggleCompareCollege,
      setCompareCollegeIds,
      saveComparison,
      loadSharedComparison,
      addToAdmissionTracker,
      updateAdmissionTracker,
      deleteAdmissionTracker,
      uploadAdmissionDoc,
      scheduleDeadlineReminder,
      submitReview,
      toggleHelpfulReview,
      reportReview,
      adminAddCollege,
      adminUpdateCollege,
      adminAddScholarship,
      adminModerateReview,
      adminMarkReportReviewed,
      runExplorerAiAssistant,
    ]
  );

  return (
    <CollegeExplorerContext.Provider value={value}>
      {children}
    </CollegeExplorerContext.Provider>
  );
};

export const useCollegeExplorer = () => {
  const ctx = useContext(CollegeExplorerContext);
  if (!ctx) {
    throw new Error('useCollegeExplorer must be used within a CollegeExplorerProvider');
  }
  return ctx;
};
