import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sendAiChatMessage } from '../services/kampusAiService';
import type {
  FeedbackType,
  IdeaStatus,
  InstitutionalUpdate,
  PollType,
  PriorityLevel,
  PrivacyMode,
  SubmissionStatus,
  VoiceAbuseReport,
  VoiceAttachment,
  VoiceAuditLog,
  VoiceCategoryGroup,
  VoiceIdea,
  VoicePoll,
  VoiceRole,
  VoiceSubmission,
} from '../types/studentVoice';

export interface PollWithStats extends VoicePoll {
  totalResponses: number;
  hasVoted: boolean;
  optionCounts: Record<string, number> | null;
  textResponses?: Array<{ id: string; textAnswer?: string; createdAt: string }>;
}

export interface PublicResolutionItem {
  id: string;
  referenceNumber: string;
  title: string;
  category: string;
  department: string;
  status: SubmissionStatus;
  latestUpdate: string;
  resolvedAt: string;
}

export interface VoiceAnalytics {
  totalSubmissions: number;
  pendingReviews: number;
  inProgressComplaints: number;
  resolvedSubmissions: number;
  byCategory: Record<string, number>;
  byDepartment: Record<string, number>;
  byStatus: Record<string, number>;
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
  totalSurveyResponses: number;
}

interface StudentVoiceContextType {
  loading: boolean;
  statusToast: { type: 'success' | 'error' | 'info'; message: string } | null;
  clearToast: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  roleInfo: { role: VoiceRole; department?: string; label: string | null };
  categories: VoiceCategoryGroup[];
  mySubmissions: VoiceSubmission[];
  adminSubmissions: VoiceSubmission[];
  publicResolutions: PublicResolutionItem[];
  ideas: VoiceIdea[];
  bookmarkedIdeaIds: string[];
  polls: PollWithStats[];
  institutionalUpdates: InstitutionalUpdate[];
  reports: VoiceAbuseReport[];
  auditLogs: VoiceAuditLog[];
  analytics: VoiceAnalytics | null;
  reload: () => Promise<void>;
  switchRoleSession: (passkey?: string, revert?: boolean) => Promise<boolean>;
  uploadAttachment: (file: File, isPublicIdeaFile?: boolean) => Promise<VoiceAttachment | null>;
  createSubmission: (payload: {
    title: string;
    feedbackType: FeedbackType;
    categoryGroup: string;
    categoryItem: string;
    department: string;
    description: string;
    location?: string;
    incidentDateISO?: string;
    desiredOutcome?: string;
    privacyMode: PrivacyMode;
    attachments?: VoiceAttachment[];
    saveAsDraft?: boolean;
  }) => Promise<VoiceSubmission | null>;
  manageMySubmission: (
    id: string,
    payload: Record<string, unknown>
  ) => Promise<VoiceSubmission | null>;
  createIdea: (payload: {
    title: string;
    description: string;
    category: string;
    expectedBenefits?: string;
    attachments?: VoiceAttachment[];
  }) => Promise<boolean>;
  toggleIdeaSupport: (id: string) => Promise<void>;
  toggleIdeaBookmark: (id: string) => Promise<void>;
  addIdeaComment: (id: string, content: string) => Promise<boolean>;
  submitPollResponse: (
    pollId: string,
    payload: { selectedOptionIds: string[]; ratingValue?: number; textAnswer?: string }
  ) => Promise<boolean>;
  submitAbuseReport: (payload: {
    targetType: 'idea' | 'comment';
    targetId: string;
    targetTitle: string;
    reason: string;
    details: string;
  }) => Promise<boolean>;
  adminUpdateSubmission: (
    id: string,
    payload: {
      assignedDepartment?: string;
      assignedReviewer?: string;
      priority?: PriorityLevel;
      escalated?: boolean;
      status?: SubmissionStatus;
      statusNote?: string;
      officialMessage?: string;
      resolutionNotes?: string;
      internalNote?: string;
      publishedToTransparency?: boolean;
    }
  ) => Promise<boolean>;
  adminUpdateIdeaStatus: (id: string, status: IdeaStatus) => Promise<boolean>;
  adminCreatePoll: (payload: {
    title: string;
    description: string;
    pollType: PollType;
    department: string;
    options: string[];
    closingDateISO: string;
    isAnonymousVoting: boolean;
    showResultsAfterVoting: boolean;
    participationRules: string;
  }) => Promise<boolean>;
  adminAddCategory: (groupName: string, itemName: string) => Promise<boolean>;
  adminPublishUpdate: (payload: {
    title: string;
    department: string;
    summary: string;
    actionTaken: string;
    status: 'Active Initiative' | 'Completed' | 'Notice';
  }) => Promise<boolean>;
  adminReviewReport: (id: string) => Promise<boolean>;
  runVoiceAiAssistant: (
    mode:
      | 'organize-complaint'
      | 'suggest-category'
      | 'improve-clarity'
      | 'summarize'
      | 'explain-status',
    text: string
  ) => Promise<{ reply: string; sourceLabel: string }>;
}

const StudentVoiceContext = createContext<StudentVoiceContextType | undefined>(undefined);

export const StudentVoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();
  const userId = user?.id || 'usr_22b030149';

  const [loading, setLoading] = useState(true);
  const [statusToast, setStatusToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [roleInfo, setRoleInfo] = useState<{
    role: VoiceRole;
    department?: string;
    label: string | null;
  }>({ role: 'Student', label: null });
  const [categories, setCategories] = useState<VoiceCategoryGroup[]>([]);
  const [mySubmissions, setMySubmissions] = useState<VoiceSubmission[]>([]);
  const [adminSubmissions, setAdminSubmissions] = useState<VoiceSubmission[]>([]);
  const [publicResolutions, setPublicResolutions] = useState<PublicResolutionItem[]>([]);
  const [ideas, setIdeas] = useState<VoiceIdea[]>([]);
  const [bookmarkedIdeaIds, setBookmarkedIdeaIds] = useState<string[]>([]);
  const [polls, setPolls] = useState<PollWithStats[]>([]);
  const [institutionalUpdates, setInstitutionalUpdates] = useState<InstitutionalUpdate[]>([]);
  const [reports, setReports] = useState<VoiceAbuseReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<VoiceAuditLog[]>([]);
  const [analytics, setAnalytics] = useState<VoiceAnalytics | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setStatusToast({ type, message });
  }, []);

  const clearToast = useCallback(() => setStatusToast(null), []);

  useEffect(() => {
    if (!statusToast) return;
    const t = setTimeout(() => setStatusToast(null), 5000);
    return () => clearTimeout(t);
  }, [statusToast]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/voice/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load Student Voice workspace.');
      setRoleInfo(data.roleInfo || { role: 'Student', label: null });
      setCategories(data.categories || []);
      setMySubmissions(data.mySubmissions || []);
      setAdminSubmissions(data.adminSubmissions || []);
      setPublicResolutions(data.publicResolutions || []);
      setIdeas(data.ideas || []);
      setBookmarkedIdeaIds(data.bookmarkedIdeaIds || []);
      setPolls(data.polls || []);
      setInstitutionalUpdates(data.institutionalUpdates || []);
      setReports(data.reports || []);
      setAuditLogs(data.auditLogs || []);
      setAnalytics(data.analytics || null);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to load Student Voice.');
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const switchRoleSession = useCallback(
    async (passkey?: string, revert?: boolean) => {
      try {
        const res = await fetch('/api/voice/auth/role-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, passkey, revert }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Invalid institutional passkey.');
          return false;
        }
        await reload();
        showToast(
          'success',
          revert ? 'Returned to Student session.' : `Authenticated as ${data.roleInfo?.role}.`
        );
        return true;
      } catch {
        showToast('error', 'Failed to switch role session.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const uploadAttachment = useCallback(
    async (file: File, isPublicIdeaFile: boolean = false): Promise<VoiceAttachment | null> => {
      if (file.size === 0 || file.size > 5 * 1024 * 1024) {
        showToast('error', 'Attachment must be non-empty and under 5 MB.');
        return null;
      }
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Could not read selected file.'));
          reader.readAsDataURL(file);
        });
        const res = await fetch('/api/voice/upload-attachment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            fileName: file.name,
            mimeType: file.type,
            base64Data,
            isPublicIdeaFile,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Invalid attachment.');
          return null;
        }
        showToast('info', `Attached "${file.name}".`);
        return data.attachment as VoiceAttachment;
      } catch {
        showToast('error', 'Failed to upload attachment.');
        return null;
      }
    },
    [userId, showToast]
  );

  const createSubmission = useCallback(
    async (payload: {
      title: string;
      feedbackType: FeedbackType;
      categoryGroup: string;
      categoryItem: string;
      department: string;
      description: string;
      location?: string;
      incidentDateISO?: string;
      desiredOutcome?: string;
      privacyMode: PrivacyMode;
      attachments?: VoiceAttachment[];
      saveAsDraft?: boolean;
    }): Promise<VoiceSubmission | null> => {
      try {
        const res = await fetch('/api/voice/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            userId,
            studentName: profile?.name || user?.name || 'Student',
            studentEmail: profile?.email || user?.email || '',
            enrollmentNo: profile?.enrollmentNo || user?.enrollmentNo || '',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Submission failed.');
          return null;
        }
        const created = data.submission as VoiceSubmission;
        setMySubmissions((prev) => [created, ...prev]);
        if (!payload.saveAsDraft) {
          addNotification({
            title: 'Student Voice Submission Received',
            description: `Reference ${created.referenceNumber} (${created.privacyMode}) logged for ${created.department}.`,
            time: 'Just now',
            type: 'campus',
          });
        }
        showToast(
          'success',
          payload.saveAsDraft
            ? `Saved draft ${created.referenceNumber}.`
            : `Submitted cleanly. Reference: ${created.referenceNumber}`
        );
        await reload();
        return created;
      } catch {
        showToast('error', 'Network error: Submission was NOT saved.');
        return null;
      }
    },
    [userId, profile, user, addNotification, showToast, reload]
  );

  const manageMySubmission = useCallback(
    async (id: string, payload: Record<string, unknown>): Promise<VoiceSubmission | null> => {
      try {
        const res = await fetch(`/api/voice/submissions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not update submission.');
          return null;
        }
        await reload();
        showToast('success', 'Submission updated.');
        return data.submission as VoiceSubmission;
      } catch {
        showToast('error', 'Failed to update submission.');
        return null;
      }
    },
    [userId, reload, showToast]
  );

  const createIdea = useCallback(
    async (payload: {
      title: string;
      description: string;
      category: string;
      expectedBenefits?: string;
      attachments?: VoiceAttachment[];
    }) => {
      try {
        const res = await fetch('/api/voice/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            userId,
            authorName: profile?.name || user?.name || 'Student',
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not post idea.');
          return false;
        }
        setIdeas((prev) => [data.idea, ...prev]);
        showToast('success', 'Campus improvement idea published.');
        return true;
      } catch {
        showToast('error', 'Failed to post idea.');
        return false;
      }
    },
    [userId, profile, user, showToast]
  );

  const toggleIdeaSupport = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/voice/ideas/${id}/support`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (res.ok) {
          setIdeas((prev) => prev.map((x) => (x.id === id ? data.idea : x)));
        }
      } catch {
        showToast('error', 'Could not update support vote.');
      }
    },
    [userId, showToast]
  );

  const toggleIdeaBookmark = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/voice/ideas/${id}/bookmark`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (res.ok) setBookmarkedIdeaIds(data.bookmarkedIdeaIds || []);
      } catch {
        showToast('error', 'Could not bookmark idea.');
      }
    },
    [userId, showToast]
  );

  const addIdeaComment = useCallback(
    async (id: string, content: string) => {
      try {
        const res = await fetch(`/api/voice/ideas/${id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            authorName: profile?.name || user?.name || 'Student',
            content,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to add comment.');
          return false;
        }
        setIdeas((prev) => prev.map((x) => (x.id === id ? data.idea : x)));
        return true;
      } catch {
        showToast('error', 'Network error posting comment.');
        return false;
      }
    },
    [userId, profile, user, showToast]
  );

  const submitPollResponse = useCallback(
    async (
      pollId: string,
      payload: { selectedOptionIds: string[]; ratingValue?: number; textAnswer?: string }
    ) => {
      try {
        const res = await fetch(`/api/voice/polls/${pollId}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not record response.');
          return false;
        }
        showToast('success', 'Your poll response has been recorded.');
        await reload();
        return true;
      } catch {
        showToast('error', 'Failed to submit poll response.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const submitAbuseReport = useCallback(
    async (payload: {
      targetType: 'idea' | 'comment';
      targetId: string;
      targetTitle: string;
      reason: string;
      details: string;
    }) => {
      try {
        const res = await fetch('/api/voice/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not submit report.');
          return false;
        }
        showToast('success', 'Report submitted to campus moderation team.');
        return true;
      } catch {
        showToast('error', 'Failed to send report.');
        return false;
      }
    },
    [userId, showToast]
  );

  const adminUpdateSubmission = useCallback(
    async (
      id: string,
      payload: {
        assignedDepartment?: string;
        assignedReviewer?: string;
        priority?: PriorityLevel;
        escalated?: boolean;
        status?: SubmissionStatus;
        statusNote?: string;
        officialMessage?: string;
        resolutionNotes?: string;
        internalNote?: string;
        publishedToTransparency?: boolean;
      }
    ) => {
      try {
        const res = await fetch(`/api/voice/admin/submissions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Not authorized or invalid update.');
          return false;
        }
        if (payload.officialMessage || payload.status === 'Resolved' || payload.status === 'Awaiting Student Response') {
          addNotification({
            title: `Student Voice Update (${data.submission?.referenceNumber || ''})`,
            description:
              payload.officialMessage ||
              `Status updated to ${payload.status || data.submission?.status}`,
            time: 'Just now',
            type: 'campus',
          });
        }
        showToast('success', 'Institutional update saved.');
        await reload();
        return true;
      } catch {
        showToast('error', 'Failed to update submission.');
        return false;
      }
    },
    [userId, addNotification, reload, showToast]
  );

  const adminUpdateIdeaStatus = useCallback(
    async (id: string, status: IdeaStatus) => {
      try {
        const res = await fetch(`/api/voice/admin/ideas/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, status }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Permission denied.');
          return false;
        }
        await reload();
        showToast('success', `Idea marked ${status}.`);
        return true;
      } catch {
        showToast('error', 'Failed to update idea status.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const adminCreatePoll = useCallback(
    async (payload: {
      title: string;
      description: string;
      pollType: PollType;
      department: string;
      options: string[];
      closingDateISO: string;
      isAnonymousVoting: boolean;
      showResultsAfterVoting: boolean;
      participationRules: string;
    }) => {
      try {
        const res = await fetch('/api/voice/admin/polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not launch poll.');
          return false;
        }
        addNotification({
          title: 'New Campus Feedback Campaign',
          description: `${payload.title} (${payload.department})`,
          time: 'Just now',
          type: 'campus',
        });
        showToast('success', 'Student poll published.');
        await reload();
        return true;
      } catch {
        showToast('error', 'Failed to publish poll.');
        return false;
      }
    },
    [userId, addNotification, reload, showToast]
  );

  const adminAddCategory = useCallback(
    async (groupName: string, itemName: string) => {
      try {
        const res = await fetch('/api/voice/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, groupName, itemName }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Admin permission required.');
          return false;
        }
        setCategories(data.categories || []);
        showToast('success', `Added category ${groupName} -> ${itemName}.`);
        return true;
      } catch {
        showToast('error', 'Failed to configure category.');
        return false;
      }
    },
    [userId, showToast]
  );

  const adminPublishUpdate = useCallback(
    async (payload: {
      title: string;
      department: string;
      summary: string;
      actionTaken: string;
      status: 'Active Initiative' | 'Completed' | 'Notice';
    }) => {
      try {
        const res = await fetch('/api/voice/admin/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Admin access required.');
          return false;
        }
        await reload();
        showToast('success', 'Institutional update published.');
        return true;
      } catch {
        showToast('error', 'Failed to publish update.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const adminReviewReport = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/voice/admin/reports/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (!res.ok) {
          showToast('error', 'Admin permission required.');
          return false;
        }
        await reload();
        showToast('success', 'Report marked Reviewed.');
        return true;
      } catch {
        showToast('error', 'Failed to review report.');
        return false;
      }
    },
    [userId, reload, showToast]
  );

  const runVoiceAiAssistant = useCallback(
    async (
      mode:
        | 'organize-complaint'
        | 'suggest-category'
        | 'improve-clarity'
        | 'summarize'
        | 'explain-status',
      text: string
    ) => {
      const prompt = `You are KAMPUS AI assisting a student writing a Student Voice submission. STRICT RULES: Never invent evidence, dates, or witness facts. Never change the student's intended meaning. Mode: ${mode}. Student text: "${text}"`;
      try {
        const res = await sendAiChatMessage({
          messages: [{ role: 'user', content: prompt }],
          language: 'English',
          learningLevel: 'Intermediate',
          responseStyle: 'Detailed Explanation',
          studentContext: `${profile?.course || 'Student'}`,
        });
        return { reply: res.reply, sourceLabel: `KAMPUS AI Guidance (${res.model})` };
      } catch {
        const lower = text.toLowerCase();
        const catGuess = lower.includes('wifi') || lower.includes('internet')
          ? 'Campus Facilities -> Internet Connectivity (IT & Network Services)'
          : lower.includes('library')
          ? 'Campus Facilities -> Library (Central Library Administration)'
          : lower.includes('hostel') || lower.includes('mess') || lower.includes('food')
          ? 'Hostel & Transport -> Hostel Facilities / Food Services'
          : lower.includes('exam') || lower.includes('faculty') || lower.includes('syllabus')
          ? 'Academic -> Course Curriculum / Examination Experience'
          : 'Student Experience -> Campus Environment';

        const fallbacks: Record<typeof mode, string> = {
          'organize-complaint': `Structured Draft (Review & confirm before submitting):\n• Issue Summary: ${text.slice(0, 140) || '[Describe issue]'}\n• Location & Time: [Add exact room/building and date]\n• Impact on Students: [Briefly state how learning/safety is affected]\n• Requested Action: [State realistic fix]`,
          'suggest-category': `Recommended Category Match:\n${catGuess}\n(You remain in full control of the final category before submitting.)`,
          'improve-clarity': `Clarity Checklist:\n1. Replace broad labels with exact room/building names.\n2. Keep description factual (what happened + when).\n3. State one constructive desired outcome.`,
          summarize: `Concise Summary:\n${text.trim().slice(0, 220)}${text.length > 220 ? '...' : ''}`,
          'explain-status': `Status Guide:\n• Submitted: Logged with reference number.\n• Under Review / Assigned: Triaged to responsible campus department.\n• In Progress: Action underway.\n• Awaiting Student Response: Reviewer asked a follow-up question.\n• Resolved / Closed: Outcome recorded.`,
        };
        return {
          reply: fallbacks[mode],
          sourceLabel: 'KAMPUS AI Structured Helper (Review before applying)',
        };
      }
    },
    [profile]
  );

  const value = useMemo<StudentVoiceContextType>(
    () => ({
      loading,
      statusToast,
      clearToast,
      showToast,
      roleInfo,
      categories,
      mySubmissions,
      adminSubmissions,
      publicResolutions,
      ideas,
      bookmarkedIdeaIds,
      polls,
      institutionalUpdates,
      reports,
      auditLogs,
      analytics,
      reload,
      switchRoleSession,
      uploadAttachment,
      createSubmission,
      manageMySubmission,
      createIdea,
      toggleIdeaSupport,
      toggleIdeaBookmark,
      addIdeaComment,
      submitPollResponse,
      submitAbuseReport,
      adminUpdateSubmission,
      adminUpdateIdeaStatus,
      adminCreatePoll,
      adminAddCategory,
      adminPublishUpdate,
      adminReviewReport,
      runVoiceAiAssistant,
    }),
    [
      loading,
      statusToast,
      clearToast,
      showToast,
      roleInfo,
      categories,
      mySubmissions,
      adminSubmissions,
      publicResolutions,
      ideas,
      bookmarkedIdeaIds,
      polls,
      institutionalUpdates,
      reports,
      auditLogs,
      analytics,
      reload,
      switchRoleSession,
      uploadAttachment,
      createSubmission,
      manageMySubmission,
      createIdea,
      toggleIdeaSupport,
      toggleIdeaBookmark,
      addIdeaComment,
      submitPollResponse,
      submitAbuseReport,
      adminUpdateSubmission,
      adminUpdateIdeaStatus,
      adminCreatePoll,
      adminAddCategory,
      adminPublishUpdate,
      adminReviewReport,
      runVoiceAiAssistant,
    ]
  );

  return (
    <StudentVoiceContext.Provider value={value}>{children}</StudentVoiceContext.Provider>
  );
};

export const useStudentVoice = () => {
  const ctx = useContext(StudentVoiceContext);
  if (!ctx) throw new Error('useStudentVoice must be used within a StudentVoiceProvider');
  return ctx;
};
