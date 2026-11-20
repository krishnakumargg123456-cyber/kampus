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
import {
  DeliveryMode,
  ExchangePreference,
  ExperienceDuration,
  GroupTeachingMode,
  ListingIntent,
  SharedResourceKind,
  SkillCategoryDef,
  SkillCategoryId,
  SkillExchange,
  SkillExchangeRequest,
  SkillListing,
  SkillProficiency,
  SkillRequestStatus,
  SkillRequestType,
  SkillReview,
  SkillSessionStatus,
  SkillSwapBootstrapResponse,
  SkillSwapReport,
  StudentSkillProfile,
} from '../types/skillSwap';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { sendAiChatMessage } from '../services/kampusAiService';

const PLANNER_SESSIONS_KEY = 'kampus_planner_partner_sessions_v1';
const CHAT_HANDOFF_KEY = 'kampus_chat_handoff_v1';
const COMMUNITY_STORAGE_KEY = 'kampus_community_state_v1';

export type SkillSwapAiMode =
  | 'suggest-skills'
  | 'learning-roadmap'
  | 'beginner-topics'
  | 'practice-projects'
  | 'session-objectives'
  | 'practice-questions'
  | 'explain-concept'
  | 'portfolio-ideas';

interface CreateListingInput {
  intent: ListingIntent;
  skillName: string;
  categoryId: SkillCategoryId;
  description: string;
  topics: string[];
  proficiency: SkillProficiency;
  experienceLevel: ExperienceDuration;
  whatStudentsLearn: string;
  teachingApproach: string;
  sessionDurationMinutes: number;
  language: string;
  groupMode: GroupTeachingMode;
  deliveryMode: DeliveryMode;
  exchangePreference: ExchangePreference;
  desiredSkill: string;
  desiredProficiency: SkillProficiency;
  learningGoals: string;
  preferredPartner: string;
  availableDays: string[];
  preferredTime: string;
  weeklyHours: number;
  portfolioPreviewUrl?: string;
}

interface SkillSwapContextType {
  currentUserId: string;
  currentUserName: string;
  currentUserCourse: string;
  currentUserCollege: string;
  loading: boolean;
  error: string | null;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  categories: SkillCategoryDef[];
  profiles: StudentSkillProfile[];
  myProfile: StudentSkillProfile | undefined;
  listings: SkillListing[];
  requests: SkillExchangeRequest[];
  exchanges: SkillExchange[];
  reviews: SkillReview[];
  savedStudentIds: string[];
  blockedUserIds: string[];
  reports: SkillSwapReport[];

  refreshBootstrap: () => Promise<void>;
  updateMyProfile: (updates: Partial<StudentSkillProfile>) => Promise<boolean>;
  addCategorySkill: (categoryId: SkillCategoryId, skillName: string) => Promise<void>;
  createListing: (input: CreateListingInput) => Promise<SkillListing | null>;
  updateListing: (listingId: string, updates: Partial<SkillListing>) => Promise<boolean>;
  deleteListing: (listingId: string) => Promise<void>;

  sendRequest: (payload: {
    recipientId: string;
    listingId?: string;
    requestType: SkillRequestType;
    requestedSkill: string;
    offeredSkill: string;
    learningGoals: string;
    preferredAvailability: string;
    message: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  respondToRequest: (
    requestId: string,
    decision: Extract<SkillRequestStatus, 'Accepted' | 'Declined' | 'Cancelled'>
  ) => Promise<SkillExchange | null>;

  updateExchangeProgress: (
    exchangeId: string,
    payload: {
      action:
        | 'set-status'
        | 'add-objective'
        | 'add-topic'
        | 'toggle-topic'
        | 'add-task'
        | 'toggle-task'
        | 'add-milestone'
        | 'toggle-milestone';
      trackId?: string;
      itemId?: string;
      title?: string;
      status?: 'Completed' | 'Cancelled';
    }
  ) => Promise<void>;

  uploadSkillFile: (file: File) => Promise<{
    fileId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url: string;
  }>;

  mutateExchangeResource: (
    exchangeId: string,
    payload: {
      action: 'add' | 'delete';
      trackId: string;
      resourceId?: string;
      kind?: SharedResourceKind;
      title?: string;
      url?: string;
      fileName?: string;
      sizeBytes?: number;
    }
  ) => Promise<void>;

  manageExchangeSession: (
    exchangeId: string,
    payload: {
      action: 'create' | 'reschedule' | 'set-status';
      sessionId?: string;
      topic?: string;
      dateISO?: string;
      timeSlot?: string;
      durationMinutes?: number;
      objectives?: string;
      prepNotes?: string;
      status?: SkillSessionStatus;
    }
  ) => Promise<void>;

  submitExchangeReview: (
    exchangeId: string,
    payload: {
      learningExperience: number;
      communication: number;
      reliability: number;
      teachingClarity: number;
      writtenReview: string;
    }
  ) => Promise<{ ok: boolean; error?: string }>;

  toggleSaveStudent: (targetUserId: string) => Promise<void>;
  toggleBlockUser: (targetUserId: string) => Promise<void>;
  submitSafetyReport: (payload: {
    targetType: SkillSwapReport['targetType'];
    targetId: string;
    targetSummary: string;
    reason: string;
    details: string;
  }) => Promise<void>;

  getStudentRatingStats: (userId: string) => {
    reviewCount: number;
    averageRating: number | null;
    reviewsForStudent: SkillReview[];
  };

  openPartnerChat: (partnerName: string, partnerId: string, contextSkill?: string) => void;
  shareToCommunity: (payload: {
    title: string;
    content: string;
    tags: string[];
  }) => void;
  runSkillSwapAi: (
    mode: SkillSwapAiMode,
    skillOrTopic: string,
    extraContext?: string
  ) => Promise<{ text: string; error?: string }>;
}

const SkillSwapContext = createContext<SkillSwapContextType | undefined>(undefined);

function syncSkillSessionToPlanner(
  session: {
    id: string;
    topic: string;
    dateISO: string;
    timeSlot: string;
    durationMinutes: number;
    status: string;
  },
  partnerName: string,
  skillLabel: string
) {
  try {
    const raw = localStorage.getItem(PLANNER_SESSIONS_KEY);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const entry = {
      id: `ss_${session.id}`,
      title: `SkillSwap: ${session.topic}`,
      targetName: partnerName,
      subject: skillLabel,
      dateISO: session.dateISO,
      timeSlot: session.timeSlot,
      durationMinutes: session.durationMinutes,
      status: session.status,
    };
    const next = [entry, ...list.filter((item) => item.id !== entry.id)];
    localStorage.setItem(PLANNER_SESSIONS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export const SkillSwapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();

  const currentUserId = user?.id || 'usr_22b030149';
  const currentUserName = profile.name || 'Priya Sharma';
  const currentUserCollege = profile.college || 'Indian Institute of Technology, Bombay';
  const currentUserCourse = profile.course || 'B.Tech in Computer Science & AI';
  const currentUserSemester = profile.semester || 'Semester 6';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [categories, setCategories] = useState<SkillCategoryDef[]>([]);
  const [profiles, setProfiles] = useState<StudentSkillProfile[]>([]);
  const [listings, setListings] = useState<SkillListing[]>([]);
  const [requests, setRequests] = useState<SkillExchangeRequest[]>([]);
  const [exchanges, setExchanges] = useState<SkillExchange[]>([]);
  const [reviews, setReviews] = useState<SkillReview[]>([]);
  const [savedStudentIds, setSavedStudentIds] = useState<string[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [reports, setReports] = useState<SkillSwapReport[]>([]);

  const addNotifRef = useRef(addNotification);
  useEffect(() => {
    addNotifRef.current = addNotification;
  }, [addNotification]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const refreshBootstrap = useCallback(async () => {
    try {
      setError(null);
      const qs = new URLSearchParams({
        userId: currentUserId,
        userName: currentUserName,
        college: currentUserCollege,
        course: currentUserCourse,
        semester: currentUserSemester,
      });
      const res = await fetch(`/api/skillswap/bootstrap?${qs.toString()}`);
      if (!res.ok) throw new Error('Unable to load SkillSwap data.');
      const data = (await res.json()) as SkillSwapBootstrapResponse;
      setCategories(data.categories || []);
      setProfiles(data.profiles || []);
      setListings(data.listings || []);
      setRequests(data.requests || []);
      setExchanges(data.exchanges || []);
      setReviews(data.reviews || []);
      setSavedStudentIds(data.savedStudentIds || []);
      setBlockedUserIds(data.blockedUserIds || []);
      setReports(data.reports || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to SkillSwap server.');
    } finally {
      setLoading(false);
    }
  }, [
    currentUserId,
    currentUserName,
    currentUserCollege,
    currentUserCourse,
    currentUserSemester,
  ]);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const myProfile = useMemo(
    () => profiles.find((p) => p.userId === currentUserId),
    [profiles, currentUserId]
  );

  const mergeExchange = useCallback((ex: SkillExchange) => {
    setExchanges((prev) => {
      const exists = prev.some((item) => item.id === ex.id);
      return exists ? prev.map((item) => (item.id === ex.id ? ex : item)) : [ex, ...prev];
    });
  }, []);

  const updateMyProfile = async (updates: Partial<StudentSkillProfile>) => {
    const res = await fetch('/api/skillswap/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, updates }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Could not update skill profile.');
      return false;
    }
    if (data.profile) {
      setProfiles((prev) =>
        prev.map((p) => (p.userId === currentUserId ? data.profile : p))
      );
      showToast('Skill profile updated.');
    }
    return true;
  };

  const addCategorySkill = async (categoryId: SkillCategoryId, skillName: string) => {
    const res = await fetch('/api/skillswap/categories/skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, skillName }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.categories) {
      setCategories(data.categories);
      showToast(`Added "${skillName}" to skill catalog.`);
    }
  };

  const createListing = async (input: CreateListingInput) => {
    const res = await fetch('/api/skillswap/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        userId: currentUserId,
        userName: currentUserName,
        college: currentUserCollege,
        course: currentUserCourse,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Failed to publish skill listing.');
      return null;
    }
    const created = data.listing as SkillListing;
    setListings((prev) => [created, ...prev]);
    showToast(`Published "${created.skillName}" to SkillSwap.`);
    return created;
  };

  const updateListing = async (listingId: string, updates: Partial<SkillListing>) => {
    const res = await fetch(`/api/skillswap/listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, ...updates }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Unable to update listing.');
      return false;
    }
    if (data.listing) {
      setListings((prev) => prev.map((l) => (l.id === listingId ? data.listing : l)));
      showToast('Skill listing updated.');
    }
    return true;
  };

  const deleteListing = async (listingId: string) => {
    const res = await fetch(
      `/api/skillswap/listings/${listingId}?userId=${encodeURIComponent(currentUserId)}`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      showToast('Skill listing removed.');
    }
  };

  const sendRequest = async (payload: {
    recipientId: string;
    listingId?: string;
    requestType: SkillRequestType;
    requestedSkill: string;
    offeredSkill: string;
    learningGoals: string;
    preferredAvailability: string;
    message: string;
  }) => {
    const res = await fetch('/api/skillswap/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        senderId: currentUserId,
        senderName: currentUserName,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.message || 'Unable to send request.' };
    }
    if (data.request) {
      setRequests((prev) => [data.request, ...prev]);
      addNotifRef.current({
        title: `Skill Request Sent to ${data.request.recipientName}`,
        description: `${data.request.requestedSkill} (${data.request.offeredSkill})`,
        time: 'Just now',
        type: 'academic',
        linkRoute: '/connect/skillswap',
      });
      showToast('Skill exchange request sent.');
    }
    return { ok: true };
  };

  const respondToRequest = async (
    requestId: string,
    decision: Extract<SkillRequestStatus, 'Accepted' | 'Declined' | 'Cancelled'>
  ) => {
    const res = await fetch(`/api/skillswap/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, decision }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Unable to update request.');
      return null;
    }
    if (data.request) {
      setRequests((prev) => prev.map((r) => (r.id === requestId ? data.request : r)));
    }
    if (data.exchange) {
      mergeExchange(data.exchange);
      addNotifRef.current({
        title: `Skill Exchange Started: ${data.exchange.skillAForB}`,
        description: `Partnered with ${data.request.senderName}. Learning tracks are ready.`,
        time: 'Just now',
        type: 'academic',
        linkRoute: '/connect/skillswap',
      });
      showToast('Request accepted! Exchange workspace created.');
      return data.exchange as SkillExchange;
    }
    if (decision === 'Declined') showToast('Request declined.');
    if (decision === 'Cancelled') showToast('Request withdrawn.');
    return null;
  };

  const updateExchangeProgress = async (
    exchangeId: string,
    payload: {
      action:
        | 'set-status'
        | 'add-objective'
        | 'add-topic'
        | 'toggle-topic'
        | 'add-task'
        | 'toggle-task'
        | 'add-milestone'
        | 'toggle-milestone';
      trackId?: string;
      itemId?: string;
      title?: string;
      status?: 'Completed' | 'Cancelled';
    }
  ) => {
    const res = await fetch(`/api/skillswap/exchanges/${exchangeId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.exchange) {
      mergeExchange(data.exchange);
      if (payload.action === 'set-status' && payload.status === 'Completed') {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === data.exchange.requestId ? { ...r, status: 'Completed' } : r
          )
        );
        addNotifRef.current({
          title: `Skill Exchange Completed`,
          description: `${data.exchange.skillAForB} exchange marked complete. You can now leave feedback.`,
          time: 'Just now',
          type: 'academic',
          linkRoute: '/connect/skillswap',
        });
        showToast('Exchange marked completed! Feedback is now unlocked.');
      } else if (payload.action === 'toggle-milestone') {
        addNotifRef.current({
          title: `Learning Milestone Updated`,
          description: `Milestone progress updated in ${data.exchange.skillAForB}.`,
          time: 'Just now',
          type: 'academic',
          linkRoute: '/connect/skillswap',
        });
      }
    }
  };

  const uploadSkillFile = (file: File) => {
    return new Promise<{
      fileId: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      url: string;
    }>((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error('File exceeds the 5 MB upload limit.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/skillswap/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUserId,
              fileName: file.name,
              mimeType: file.type || 'application/octet-stream',
              base64Data: String(reader.result || ''),
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.file) {
            reject(new Error(data.message || 'Upload failed.'));
            return;
          }
          resolve(data.file);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Upload failed.'));
        }
      };
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsDataURL(file);
    });
  };

  const mutateExchangeResource = async (
    exchangeId: string,
    payload: {
      action: 'add' | 'delete';
      trackId: string;
      resourceId?: string;
      kind?: SharedResourceKind;
      title?: string;
      url?: string;
      fileName?: string;
      sizeBytes?: number;
    }
  ) => {
    const res = await fetch(`/api/skillswap/exchanges/${exchangeId}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        userName: currentUserName,
        ...payload,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.exchange) {
      mergeExchange(data.exchange);
      showToast(payload.action === 'delete' ? 'Resource removed.' : 'Learning material shared.');
    } else {
      showToast(data.message || 'Failed to update learning resources.');
    }
  };

  const manageExchangeSession = async (
    exchangeId: string,
    payload: {
      action: 'create' | 'reschedule' | 'set-status';
      sessionId?: string;
      topic?: string;
      dateISO?: string;
      timeSlot?: string;
      durationMinutes?: number;
      objectives?: string;
      prepNotes?: string;
      status?: SkillSessionStatus;
    }
  ) => {
    const res = await fetch(`/api/skillswap/exchanges/${exchangeId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || 'Could not update learning session.');
      return;
    }
    if (data.exchange && data.session) {
      const ex = data.exchange as SkillExchange;
      mergeExchange(ex);
      const partnerName =
        ex.studentAId === currentUserId ? ex.studentBName : ex.studentAName;
      syncSkillSessionToPlanner(
        data.session,
        partnerName,
        `${ex.skillAForB} / ${ex.skillBForA}`
      );
      if (payload.action === 'create') {
        addNotifRef.current({
          title: `SkillSwap Session Scheduled`,
          description: `${data.session.topic} with ${partnerName} on ${data.session.dateISO} at ${data.session.timeSlot} (synced to Planner)`,
          time: 'Scheduled',
          type: 'academic',
          linkRoute: '/tools/planner',
        });
        showToast('Session scheduled and synced to KAMPUS Planner.');
      } else if (payload.action === 'reschedule') {
        addNotifRef.current({
          title: `SkillSwap Session Rescheduled`,
          description: `${data.session.topic} moved to ${data.session.dateISO} at ${data.session.timeSlot}`,
          time: 'Just now',
          type: 'academic',
          linkRoute: '/tools/planner',
        });
        showToast('Session rescheduled and Planner updated.');
      } else {
        showToast(`Session marked ${payload.status}.`);
      }
    }
  };

  const submitExchangeReview = async (
    exchangeId: string,
    payload: {
      learningExperience: number;
      communication: number;
      reliability: number;
      teachingClarity: number;
      writtenReview: string;
    }
  ) => {
    const res = await fetch(`/api/skillswap/exchanges/${exchangeId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewerId: currentUserId,
        reviewerName: currentUserName,
        ...payload,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.message || 'Could not submit review.' };
    }
    if (data.review) {
      setReviews((prev) => [data.review, ...prev]);
      showToast('Thank you! Your SkillSwap feedback has been recorded.');
    }
    return { ok: true };
  };

  const toggleSaveStudent = async (targetUserId: string) => {
    const res = await fetch('/api/skillswap/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, targetUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.savedStudentIds) {
      setSavedStudentIds(data.savedStudentIds);
      showToast(
        data.savedStudentIds.includes(targetUserId)
          ? 'Student saved to your list.'
          : 'Removed from saved students.'
      );
    }
  };

  const toggleBlockUser = async (targetUserId: string) => {
    const res = await fetch('/api/skillswap/safety/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, targetUserId }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setBlockedUserIds(data.blockedUserIds || []);
      await refreshBootstrap();
      showToast('Updated student block settings.');
    }
  };

  const submitSafetyReport = async (payload: {
    targetType: SkillSwapReport['targetType'];
    targetId: string;
    targetSummary: string;
    reason: string;
    details: string;
  }) => {
    const res = await fetch('/api/skillswap/safety/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reporterId: currentUserId, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.report) {
      setReports((prev) => [data.report, ...prev]);
      showToast('Safety report submitted for review.');
    }
  };

  const getStudentRatingStats = useCallback(
    (userId: string) => {
      const reviewsForStudent = reviews.filter((r) => r.revieweeId === userId);
      if (reviewsForStudent.length === 0) {
        return { reviewCount: 0, averageRating: null, reviewsForStudent };
      }
      const sum = reviewsForStudent.reduce(
        (acc, r) =>
          acc +
          (r.learningExperience +
            r.communication +
            r.reliability +
            r.teachingClarity) /
            4,
        0
      );
      return {
        reviewCount: reviewsForStudent.length,
        averageRating: Number((sum / reviewsForStudent.length).toFixed(1)),
        reviewsForStudent,
      };
    },
    [reviews]
  );

  const openPartnerChat = (
    partnerName: string,
    partnerId: string,
    contextSkill?: string
  ) => {
    try {
      localStorage.setItem(
        CHAT_HANDOFF_KEY,
        JSON.stringify({
          name: partnerName,
          partnerId,
          initialNotice: contextSkill
            ? `SkillSwap discussion: ${contextSkill}`
            : undefined,
        })
      );
    } catch {
      // ignore storage failure
    }
    navigate('/connect/chat');
  };

  const shareToCommunity = (payload: {
    title: string;
    content: string;
    tags: string[];
  }) => {
    try {
      const raw = localStorage.getItem(COMMUNITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.posts)) {
          const targetCommId =
            parsed.communities?.[0]?.id || 'comm_skillswap_share';
          const newPost = {
            id: `post_ss_${Date.now()}`,
            communityId: targetCommId,
            authorId: currentUserId,
            authorName: currentUserName,
            authorAvatar: profile.avatarUrl,
            authorCourse: currentUserCourse,
            authorSemester: currentUserSemester,
            type: 'discussion',
            title: payload.title.trim(),
            content: payload.content.trim(),
            tags: payload.tags.map((t) => (t.startsWith('#') ? t : `#${t}`)),
            createdAt: new Date().toISOString(),
            upvoterIds: [currentUserId],
            helpfulVoterIds: [],
            bookmarkedByIds: [],
            replies: [],
            status: 'published',
          };
          parsed.posts.unshift(newPost);
          localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
      addNotifRef.current({
        title: `Shared to Student Community`,
        description: payload.title,
        time: 'Just now',
        type: 'campus',
        linkRoute: '/connect/community',
      });
      showToast('Published to Student Community feed!');
    } catch {
      showToast('Could not share to Student Community.');
    }
  };

  const runSkillSwapAi = async (
    mode: SkillSwapAiMode,
    skillOrTopic: string,
    extraContext?: string
  ): Promise<{ text: string; error?: string }> => {
    const interests =
      myProfile?.learningInterests.join(', ') || (profile.interests || []).join(', ');
    const teachList =
      myProfile?.skillsToTeach.map((s) => s.skillName).join(', ') || 'None specified';
    const learnList =
      myProfile?.skillsToLearn.map((s) => s.skillName).join(', ') || 'None specified';

    const prompts: Record<SkillSwapAiMode, string> = {
      'suggest-skills': `Based on this student's interests (${interests}), skills they already teach (${teachList}), and current learning list (${learnList}), suggest 4 practical complementary skills they could offer or request on SkillSwap, explaining why each fits.`,
      'learning-roadmap': `Create a 4-week peer-to-peer learning roadmap for "${skillOrTopic}" tailored for college students exchanging skills in 60-minute weekly sessions.`,
      'beginner-topics': `Break "${skillOrTopic}" into 6 clear, beginner-friendly topics ordered from foundational to applied.`,
      'practice-projects': `Suggest 3 hands-on weekend practice projects a student learning "${skillOrTopic}" can build and review with a peer mentor.`,
      'session-objectives': `Generate a concise 60-minute session agenda with 3 measurable objectives and 2 preparation steps for "${skillOrTopic}".`,
      'practice-questions': `Create 4 short practice check-in questions (with brief hint answers) to test understanding of "${skillOrTopic}".`,
      'explain-concept': `Explain the core concept of "${skillOrTopic}" clearly for a peer learner using a real-world analogy and one concrete example.`,
      'portfolio-ideas': `Suggest 3 portfolio showcase project ideas for "${skillOrTopic}" that a student can publish to prove their skill cleanly.`,
    };

    try {
      const resp = await sendAiChatMessage({
        messages: [
          {
            role: 'user',
            content: `${prompts[mode]}${
              extraContext ? `\n\nAdditional Context:\n${extraContext}` : ''
            }\n\nNote: Clearly frame recommendations as study suggestions.`,
          },
        ],
        language: 'English',
        learningLevel: 'Intermediate',
        responseStyle: 'Detailed Explanation',
        studentContext: `${currentUserName} (${currentUserCourse})`,
      });
      return { text: resp.reply };
    } catch (err) {
      return {
        text: '',
        error:
          err instanceof Error
            ? err.message
            : 'KAMPUS AI is currently unavailable. Please verify server Gemini configuration.',
      };
    }
  };

  return (
    <SkillSwapContext.Provider
      value={{
        currentUserId,
        currentUserName,
        currentUserCourse,
        currentUserCollege,
        loading,
        error,
        toastMessage,
        showToast,
        categories,
        profiles,
        myProfile,
        listings,
        requests,
        exchanges,
        reviews,
        savedStudentIds,
        blockedUserIds,
        reports,
        refreshBootstrap,
        updateMyProfile,
        addCategorySkill,
        createListing,
        updateListing,
        deleteListing,
        sendRequest,
        respondToRequest,
        updateExchangeProgress,
        uploadSkillFile,
        mutateExchangeResource,
        manageExchangeSession,
        submitExchangeReview,
        toggleSaveStudent,
        toggleBlockUser,
        submitSafetyReport,
        getStudentRatingStats,
        openPartnerChat,
        shareToCommunity,
        runSkillSwapAi,
      }}
    >
      {children}
    </SkillSwapContext.Provider>
  );
};

export const useSkillSwap = () => {
  const ctx = useContext(SkillSwapContext);
  if (!ctx) throw new Error('useSkillSwap must be used within SkillSwapProvider');
  return ctx;
};
