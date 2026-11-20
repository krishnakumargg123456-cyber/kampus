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
  CampusClub,
  CampusEvent,
  CertificateType,
  ClubActivity,
  ClubAnnouncement,
  ClubGalleryItem,
  ClubMembership,
  ClubRole,
  EventCertificate,
  EventFeedback,
  EventRegistration,
  EventsClubsReport,
  EventTeam,
  MembershipStatus,
  RegistrationStatus,
} from '../types/eventsClubs';

export interface EventsClubsAuthInfo {
  organizerRole: 'Institutional Event Admin' | 'Club Lead' | null;
  staffLabel: string | null;
  canCreateEvent: boolean;
  managedClubIds: string[];
  managedEventIds: string[];
}

interface EventsClubsContextValue {
  loading: boolean;
  error: string | null;
  toastMessage: string | null;
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  currentUserCollege: string;
  currentUserCourse: string;
  currentUserSemester: string;
  currentUserEnrollmentNo: string;
  kampusIdRef: string | null;
  events: CampusEvent[];
  confirmedCounts: Record<string, number>;
  registrations: EventRegistration[];
  teams: EventTeam[];
  certificates: EventCertificate[];
  clubs: CampusClub[];
  memberships: ClubMembership[];
  clubActivities: ClubActivity[];
  clubAnnouncements: ClubAnnouncement[];
  clubGallery: ClubGalleryItem[];
  savedEventIds: string[];
  feedback: EventFeedback[];
  reports: EventsClubsReport[];
  authInfo: EventsClubsAuthInfo;
  refresh: () => Promise<void>;
  showToast: (msg: string) => void;
  verifyOrganizerPasskey: (passkey: string) => Promise<{ ok: boolean; error?: string }>;
  revertToStudent: () => Promise<void>;
  toggleSaveEvent: (eventId: string) => Promise<void>;
  registerForEvent: (
    eventId: string,
    payload: {
      studentName: string;
      college: string;
      course: string;
      department: string;
      email: string;
      contactInfo?: string;
      participationType: 'Individual' | 'Team';
      teamName?: string;
      teamMembers?: Array<{ name: string; email: string }>;
      answers?: Record<string, string>;
    }
  ) => Promise<{ ok: boolean; registration?: EventRegistration; error?: string }>;
  cancelRegistration: (regId: string) => Promise<{ ok: boolean; error?: string }>;
  updateRegistrationStatus: (
    regId: string,
    status: RegistrationStatus
  ) => Promise<{ ok: boolean; error?: string }>;
  respondToTeamInvite: (
    teamId: string,
    decision: 'Accepted' | 'Rejected'
  ) => Promise<{ ok: boolean; error?: string }>;
  fetchEventQrToken: (
    regId: string
  ) => Promise<{ ok: boolean; token?: string; expiresAt?: string; error?: string }>;
  verifyEventCheckIn: (
    eventId: string,
    token: string
  ) => Promise<{ ok: boolean; checkInStatus: string; message: string; registration?: EventRegistration }>;
  issueCertificate: (
    eventId: string,
    payload: {
      recipientUserId: string;
      recipientName: string;
      certificateType: CertificateType;
      issuedBy?: string;
    }
  ) => Promise<{ ok: boolean; certificate?: EventCertificate; error?: string }>;
  verifyCertificateRef: (
    ref: string
  ) => Promise<{ valid: boolean; certificate?: EventCertificate; message?: string }>;
  createEvent: (
    payload: Partial<CampusEvent> & { publishMode: 'draft' | 'submit-approval' | 'publish' }
  ) => Promise<{ ok: boolean; event?: CampusEvent; error?: string }>;
  manageEventAction: (
    eventId: string,
    payload: { action: 'cancel' | 'update-status' | 'announce'; status?: string; title?: string; message?: string }
  ) => Promise<{ ok: boolean; error?: string }>;
  joinOrRequestClub: (
    clubId: string,
    payload: {
      joinReason: string;
      interests: string[];
      skills: string[];
      previousExperience: string;
      portfolioUrl?: string;
      showInPublicMembers: boolean;
    }
  ) => Promise<{ ok: boolean; membership?: ClubMembership; error?: string }>;
  leaveClub: (membershipId: string) => Promise<{ ok: boolean; error?: string }>;
  acceptClubInvite: (membershipId: string) => Promise<{ ok: boolean; error?: string }>;
  toggleMemberDirectoryPrivacy: (membershipId: string, showInPublicMembers: boolean) => Promise<void>;
  manageClubMembership: (
    membershipId: string,
    payload: { status?: MembershipStatus; role?: ClubRole }
  ) => Promise<{ ok: boolean; error?: string }>;
  manageClubContent: (
    clubId: string,
    payload: Record<string, unknown>
  ) => Promise<{ ok: boolean; error?: string }>;
  uploadClubFile: (file: File) => Promise<{ ok: boolean; url?: string; error?: string }>;
  submitEventFeedback: (
    eventId: string,
    rating: number,
    comment: string
  ) => Promise<{ ok: boolean; error?: string }>;
  submitReport: (payload: {
    targetType: 'event' | 'club' | 'content';
    targetId: string;
    targetTitle: string;
    reason: string;
    details: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  addEventToPlanner: (ev: CampusEvent) => void;
  handOffOrganizerToChat: (organizerName: string, organizerId: string, eventTitle: string) => void;
  runEventsAiHelper: (
    mode: 'recommend-events' | 'recommend-clubs' | 'draft-event-content' | 'summarize-event',
    contextPrompt: string
  ) => Promise<{ ok: boolean; text?: string; error?: string }>;
}

const EventsClubsContext = createContext<EventsClubsContextValue | undefined>(undefined);

const PLANNER_STORAGE_KEY = 'kampus_planner_partner_sessions_v1';
const CHAT_HANDOFF_KEY = 'kampus_chat_handoff_v1';

export const EventsClubsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { addNotification } = useNotifications();

  const currentUserId = user?.id || 'usr_22b030149';
  const currentUserName = profile.name || user?.name || 'Priya Sharma';
  const currentUserEmail = profile.email || user?.email || 'priya.sharma@iitb.ac.in';
  const currentUserCollege =
    profile.college || user?.college || 'Indian Institute of Technology, Bombay';
  const currentUserCourse =
    profile.course || user?.course || 'B.Tech in Computer Science & AI';
  const currentUserSemester = profile.semester || user?.semester || 'Semester 6';
  const currentUserEnrollmentNo = profile.enrollmentNo || user?.enrollmentNo || '22B030149';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [kampusIdRef, setKampusIdRef] = useState<string | null>(null);

  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [confirmedCounts, setConfirmedCounts] = useState<Record<string, number>>({});
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [certificates, setCertificates] = useState<EventCertificate[]>([]);
  const [clubs, setClubs] = useState<CampusClub[]>([]);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [clubActivities, setClubActivities] = useState<ClubActivity[]>([]);
  const [clubAnnouncements, setClubAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [clubGallery, setClubGallery] = useState<ClubGalleryItem[]>([]);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<EventFeedback[]>([]);
  const [reports, setReports] = useState<EventsClubsReport[]>([]);
  const [authInfo, setAuthInfo] = useState<EventsClubsAuthInfo>({
    organizerRole: null,
    staffLabel: null,
    canCreateEvent: false,
    managedClubIds: [],
    managedEventIds: [],
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(
        `/api/events-clubs/bootstrap?userId=${encodeURIComponent(currentUserId)}`
      );
      if (!res.ok) {
        throw new Error('Unable to load Events & Clubs.');
      }
      const data = await res.json();
      setEvents(data.events || []);
      setConfirmedCounts(data.confirmedCounts || {});
      setRegistrations(data.registrations || []);
      setTeams(data.teams || []);
      setCertificates(data.certificates || []);
      setClubs(data.clubs || []);
      setMemberships(data.memberships || []);
      setClubActivities(data.clubActivities || []);
      setClubAnnouncements(data.clubAnnouncements || []);
      setClubGallery(data.clubGallery || []);
      setSavedEventIds(data.savedEventIds || []);
      setFeedback(data.feedback || []);
      setReports(data.reports || []);
      setAuthInfo(
        data.authInfo || {
          organizerRole: null,
          staffLabel: null,
          canCreateEvent: false,
          managedClubIds: [],
          managedEventIds: [],
        }
      );

      // Optional integration: fetch KAMPUS ID platform ref if endpoint exists
      try {
        const idRes = await fetch(
          `/api/kampus-id/summary?userId=${encodeURIComponent(currentUserId)}`
        );
        if (idRes.ok) {
          const idData = await idRes.json();
          if (idData?.kampusIdNumber) {
            setKampusIdRef(idData.kampusIdNumber);
          }
        }
      } catch {
        // KAMPUS ID service optional
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Events & Clubs.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const verifyOrganizerPasskey = useCallback(
    async (passkey: string) => {
      try {
        const res = await fetch('/api/events-clubs/auth/organizer-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, passkey }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { ok: false, error: data.message || 'Verification failed.' };
        }
        await refresh();
        showToast(`Verified as ${data.organizerRole}`);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error while verifying authorization.' };
      }
    },
    [currentUserId, refresh, showToast]
  );

  const revertToStudent = useCallback(async () => {
    await fetch('/api/events-clubs/auth/organizer-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, revert: true }),
    });
    await refresh();
    showToast('Switched back to Student view');
  }, [currentUserId, refresh, showToast]);

  const toggleSaveEvent = useCallback(
    async (eventId: string) => {
      const res = await fetch('/api/events-clubs/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, eventId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedEventIds(data.savedEventIds || []);
        showToast(
          (data.savedEventIds || []).includes(eventId)
            ? 'Event saved to bookmarks'
            : 'Removed from saved events'
        );
      }
    },
    [currentUserId, showToast]
  );

  const addEventToPlanner = useCallback(
    (ev: CampusEvent) => {
      try {
        const existingRaw = localStorage.getItem(PLANNER_STORAGE_KEY);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const arr = Array.isArray(existing) ? existing : [];
        const sessionId = `evt_plan_${ev.id}`;
        if (!arr.some((item: { id?: string }) => item.id === sessionId)) {
          arr.unshift({
            id: sessionId,
            title: ev.title,
            targetName: ev.organizerName,
            subject: `${ev.category} · ${ev.subType}`,
            dateISO: ev.startDateISO,
            timeSlot: `${ev.startTime} - ${ev.endTime}`,
            durationMinutes: 90,
            status: 'scheduled',
          });
          localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(arr));
        }
        addNotification({
          title: 'Added to KAMPUS Planner',
          description: `${ev.title} scheduled for ${ev.startDateISO} at ${ev.startTime}.`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/tools/planner',
        });
        showToast('Event added to KAMPUS Study Planner');
      } catch {
        showToast('Unable to sync with Planner');
      }
    },
    [addNotification, showToast]
  );

  const registerForEvent = useCallback(
    async (
      eventId: string,
      payload: {
        studentName: string;
        college: string;
        course: string;
        department: string;
        email: string;
        contactInfo?: string;
        participationType: 'Individual' | 'Team';
        teamName?: string;
        teamMembers?: Array<{ name: string; email: string }>;
        answers?: Record<string, string>;
      }
    ) => {
      try {
        const res = await fetch(`/api/events-clubs/events/${encodeURIComponent(eventId)}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            userId: currentUserId,
            kampusIdRef: kampusIdRef || currentUserEnrollmentNo,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { ok: false, error: data.message || 'Registration failed.' };
        }
        await refresh();
        const ev = events.find((e) => e.id === eventId);
        addNotification({
          title: `Event Registration: ${data.registration?.status || 'Confirmed'}`,
          description: `${ev?.title || 'Campus Event'} · Ref ${data.registration?.referenceCode || ''}`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/campus/events-clubs',
        });
        showToast(`Registration ${data.registration?.status || 'Confirmed'}`);
        return { ok: true, registration: data.registration };
      } catch {
        return { ok: false, error: 'Network error during event registration.' };
      }
    },
    [
      addNotification,
      currentUserEnrollmentNo,
      currentUserId,
      events,
      kampusIdRef,
      refresh,
      showToast,
    ]
  );

  const cancelRegistration = useCallback(
    async (regId: string) => {
      try {
        const res = await fetch(`/api/events-clubs/registrations/${encodeURIComponent(regId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, status: 'Cancelled' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { ok: false, error: data.message || 'Unable to cancel registration.' };
        }
        await refresh();
        showToast('Event registration cancelled');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, refresh, showToast]
  );

  const updateRegistrationStatus = useCallback(
    async (regId: string, status: RegistrationStatus) => {
      try {
        const res = await fetch(`/api/events-clubs/registrations/${encodeURIComponent(regId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, status }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Update failed.' };
        await refresh();
        showToast(`Registration marked ${status}`);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, refresh, showToast]
  );

  const respondToTeamInvite = useCallback(
    async (teamId: string, decision: 'Accepted' | 'Rejected') => {
      try {
        const res = await fetch(`/api/events-clubs/teams/${encodeURIComponent(teamId)}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberEmail: currentUserEmail, decision }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Unable to update invite.' };
        await refresh();
        showToast(`Team invitation ${decision.toLowerCase()}`);
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserEmail, refresh, showToast]
  );

  const fetchEventQrToken = useCallback(
    async (regId: string) => {
      try {
        const res = await fetch(
          `/api/events-clubs/registrations/${encodeURIComponent(regId)}/qr-token?userId=${encodeURIComponent(currentUserId)}`
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { ok: false, error: data.message || 'Unable to generate check-in QR pass.' };
        }
        return { ok: true, token: data.token, expiresAt: data.expiresAt };
      } catch {
        return { ok: false, error: 'Network error generating QR credential.' };
      }
    },
    [currentUserId]
  );

  const verifyEventCheckIn = useCallback(
    async (eventId: string, token: string) => {
      try {
        const res = await fetch(
          `/api/events-clubs/events/${encodeURIComponent(eventId)}/checkin`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, token }),
          }
        );
        const data = await res.json().catch(() => ({}));
        await refresh();
        return {
          ok: res.ok,
          checkInStatus: data.checkInStatus || (res.ok ? 'Checked In' : 'Invalid Credential'),
          message: data.message || (res.ok ? 'Attendance verified.' : 'Invalid check-in token.'),
          registration: data.registration,
        };
      } catch {
        return {
          ok: false,
          checkInStatus: 'Invalid Credential',
          message: 'Network error verifying QR check-in.',
        };
      }
    },
    [currentUserId, refresh]
  );

  const issueCertificate = useCallback(
    async (
      eventId: string,
      payload: {
        recipientUserId: string;
        recipientName: string;
        certificateType: CertificateType;
        issuedBy?: string;
      }
    ) => {
      try {
        const res = await fetch(
          `/api/events-clubs/events/${encodeURIComponent(eventId)}/certificates`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, userId: currentUserId }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Failed to issue certificate.' };
        await refresh();
        addNotification({
          title: 'Event Certificate Issued',
          description: `${data.certificate?.certificateType} certificate (${data.certificate?.certificateRef}) issued for ${payload.recipientName}.`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/campus/events-clubs',
        });
        showToast('Verified certificate issued');
        return { ok: true, certificate: data.certificate };
      } catch {
        return { ok: false, error: 'Network error issuing certificate.' };
      }
    },
    [addNotification, currentUserId, refresh, showToast]
  );

  const verifyCertificateRef = useCallback(async (ref: string) => {
    try {
      const res = await fetch(
        `/api/events-clubs/certificates/verify/${encodeURIComponent(ref.trim())}`
      );
      const data = await res.json().catch(() => ({}));
      return {
        valid: Boolean(data.valid),
        certificate: data.certificate,
        message: data.message,
      };
    } catch {
      return { valid: false, message: 'Network error verifying reference.' };
    }
  }, []);

  const createEvent = useCallback(
    async (payload: Partial<CampusEvent> & { publishMode: 'draft' | 'submit-approval' | 'publish' }) => {
      try {
        const res = await fetch('/api/events-clubs/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId: currentUserId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Unable to create event.' };
        await refresh();
        showToast(
          payload.publishMode === 'draft'
            ? 'Event saved as draft'
            : payload.publishMode === 'submit-approval'
              ? 'Submitted for institutional approval'
              : 'Event published live'
        );
        return { ok: true, event: data.event };
      } catch {
        return { ok: false, error: 'Network error creating event.' };
      }
    },
    [currentUserId, refresh, showToast]
  );

  const manageEventAction = useCallback(
    async (
      eventId: string,
      payload: {
        action: 'cancel' | 'update-status' | 'announce';
        status?: string;
        title?: string;
        message?: string;
      }
    ) => {
      try {
        const res = await fetch(`/api/events-clubs/events/${encodeURIComponent(eventId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId: currentUserId, authorName: currentUserName }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Action failed.' };
        await refresh();
        showToast(
          payload.action === 'announce'
            ? 'Event announcement posted'
            : payload.action === 'cancel'
              ? 'Event marked Cancelled'
              : 'Event status updated'
        );
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, currentUserName, refresh, showToast]
  );

  const joinOrRequestClub = useCallback(
    async (
      clubId: string,
      payload: {
        joinReason: string;
        interests: string[];
        skills: string[];
        previousExperience: string;
        portfolioUrl?: string;
        showInPublicMembers: boolean;
      }
    ) => {
      try {
        const res = await fetch(`/api/events-clubs/clubs/${encodeURIComponent(clubId)}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            userId: currentUserId,
            studentName: currentUserName,
            course: currentUserCourse,
            semester: currentUserSemester,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Unable to process club request.' };
        await refresh();
        const club = clubs.find((c) => c.id === clubId);
        addNotification({
          title:
            data.membership?.status === 'Member'
              ? `Joined ${club?.shortCode || 'Club'}`
              : `Membership Request Sent`,
          description: `${club?.name || 'Campus Club'} · Status: ${data.membership?.status}`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/campus/events-clubs',
        });
        showToast(
          data.membership?.status === 'Member'
            ? `You are now a member of ${club?.name || 'the club'}`
            : 'Membership request submitted for review'
        );
        return { ok: true, membership: data.membership };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [
      addNotification,
      clubs,
      currentUserCourse,
      currentUserId,
      currentUserName,
      currentUserSemester,
      refresh,
      showToast,
    ]
  );

  const leaveClub = useCallback(
    async (membershipId: string) => {
      try {
        const res = await fetch(`/api/events-clubs/memberships/${encodeURIComponent(membershipId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, action: 'leave' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Unable to leave club.' };
        await refresh();
        showToast('Left club membership');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, refresh, showToast]
  );

  const acceptClubInvite = useCallback(
    async (membershipId: string) => {
      try {
        const res = await fetch(`/api/events-clubs/memberships/${encodeURIComponent(membershipId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, action: 'accept-invite' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Failed to accept invitation.' };
        await refresh();
        showToast('Club invitation accepted');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, refresh, showToast]
  );

  const toggleMemberDirectoryPrivacy = useCallback(
    async (membershipId: string, showInPublicMembers: boolean) => {
      await fetch(`/api/events-clubs/memberships/${encodeURIComponent(membershipId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, action: 'privacy', showInPublicMembers }),
      });
      await refresh();
      showToast(showInPublicMembers ? 'Visible in club member directory' : 'Hidden from public directory');
    },
    [currentUserId, refresh, showToast]
  );

  const manageClubMembership = useCallback(
    async (membershipId: string, payload: { status?: MembershipStatus; role?: ClubRole }) => {
      try {
        const res = await fetch(`/api/events-clubs/memberships/${encodeURIComponent(membershipId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, ...payload }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Unauthorized.' };
        await refresh();
        showToast('Club member updated');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, refresh, showToast]
  );

  const manageClubContent = useCallback(
    async (clubId: string, payload: Record<string, unknown>) => {
      try {
        const res = await fetch(`/api/events-clubs/clubs/${encodeURIComponent(clubId)}/manage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId: currentUserId, authorName: currentUserName }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Unauthorized.' };
        await refresh();
        showToast('Club updated');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, currentUserName, refresh, showToast]
  );

  const uploadClubFile = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        return { ok: false, error: 'File must be smaller than 5 MB.' };
      }
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        const res = await fetch('/api/events-clubs/upload', {
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
        if (!res.ok) return { ok: false, error: data.message || 'Upload failed.' };
        return { ok: true, url: data.url };
      } catch {
        return { ok: false, error: 'Failed to upload image.' };
      }
    },
    [currentUserId]
  );

  const submitEventFeedback = useCallback(
    async (eventId: string, rating: number, comment: string) => {
      try {
        const res = await fetch('/api/events-clubs/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            userId: currentUserId,
            studentName: currentUserName,
            rating,
            comment,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Feedback failed.' };
        await refresh();
        showToast('Feedback submitted');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, currentUserName, refresh, showToast]
  );

  const submitReport = useCallback(
    async (payload: {
      targetType: 'event' | 'club' | 'content';
      targetId: string;
      targetTitle: string;
      reason: string;
      details: string;
    }) => {
      try {
        const res = await fetch('/api/events-clubs/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            userId: currentUserId,
            userName: currentUserName,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: data.message || 'Report failed.' };
        await refresh();
        showToast('Safety report submitted');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error.' };
      }
    },
    [currentUserId, currentUserName, refresh, showToast]
  );

  const handOffOrganizerToChat = useCallback(
    (organizerName: string, organizerId: string, eventTitle: string) => {
      try {
        localStorage.setItem(
          CHAT_HANDOFF_KEY,
          JSON.stringify({
            name: organizerName,
            partnerId: organizerId,
            initialNotice: `Hi ${organizerName}, I have a question regarding "${eventTitle}".`,
          })
        );
      } catch {
        // ignore
      }
    },
    []
  );

  const runEventsAiHelper = useCallback(
    async (
      mode: 'recommend-events' | 'recommend-clubs' | 'draft-event-content' | 'summarize-event',
      contextPrompt: string
    ) => {
      try {
        const eventsDigest = events
          .slice(0, 8)
          .map((e) => `- ${e.title} (${e.category} / ${e.subType}, ${e.startDateISO}, ${e.format})`)
          .join('\n');
        const clubsDigest = clubs
          .map((c) => `- ${c.name} (${c.category} / ${c.subCategory})`)
          .join('\n');

        const promptMap: Record<typeof mode, string> = {
          'recommend-events': `Recommend 2-3 matching campus events from this list ONLY (do not invent events) for a ${currentUserCourse} (${currentUserSemester}) student.\nInterests/Prompt: ${contextPrompt}\nAvailable Events:\n${eventsDigest}`,
          'recommend-clubs': `Recommend relevant campus clubs from this list ONLY (do not invent clubs) for a ${currentUserCourse} student.\nInterests/Prompt: ${contextPrompt}\nAvailable Clubs:\n${clubsDigest}`,
          'draft-event-content': `As an AI writing assistant, draft a clear event description, 3-item schedule outline, and 2 helpful FAQs for an organizer planning:\n${contextPrompt}`,
          'summarize-event': `Summarize the key event details, preparation checklist, and eligibility clearly from:\n${contextPrompt}`,
        };

        const res = await sendAiChatMessage({
          messages: [{ role: 'user', content: promptMap[mode] }],
          language: 'English',
          learningLevel: 'Intermediate',
          responseStyle: 'Detailed Explanation',
          studentContext: `${currentUserName}, ${currentUserCollege}, ${currentUserCourse}`,
        });
        return { ok: true, text: res.reply };
      } catch (err) {
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'KAMPUS AI service is temporarily unavailable.',
        };
      }
    },
    [clubs, currentUserCollege, currentUserCourse, currentUserName, currentUserSemester, events]
  );

  const value = useMemo(
    () => ({
      loading,
      error,
      toastMessage,
      currentUserId,
      currentUserName,
      currentUserEmail,
      currentUserCollege,
      currentUserCourse,
      currentUserSemester,
      currentUserEnrollmentNo,
      kampusIdRef,
      events,
      confirmedCounts,
      registrations,
      teams,
      certificates,
      clubs,
      memberships,
      clubActivities,
      clubAnnouncements,
      clubGallery,
      savedEventIds,
      feedback,
      reports,
      authInfo,
      refresh,
      showToast,
      verifyOrganizerPasskey,
      revertToStudent,
      toggleSaveEvent,
      registerForEvent,
      cancelRegistration,
      updateRegistrationStatus,
      respondToTeamInvite,
      fetchEventQrToken,
      verifyEventCheckIn,
      issueCertificate,
      verifyCertificateRef,
      createEvent,
      manageEventAction,
      joinOrRequestClub,
      leaveClub,
      acceptClubInvite,
      toggleMemberDirectoryPrivacy,
      manageClubMembership,
      manageClubContent,
      uploadClubFile,
      submitEventFeedback,
      submitReport,
      addEventToPlanner,
      handOffOrganizerToChat,
      runEventsAiHelper,
    }),
    [
      loading,
      error,
      toastMessage,
      currentUserId,
      currentUserName,
      currentUserEmail,
      currentUserCollege,
      currentUserCourse,
      currentUserSemester,
      currentUserEnrollmentNo,
      kampusIdRef,
      events,
      confirmedCounts,
      registrations,
      teams,
      certificates,
      clubs,
      memberships,
      clubActivities,
      clubAnnouncements,
      clubGallery,
      savedEventIds,
      feedback,
      reports,
      authInfo,
      refresh,
      showToast,
      verifyOrganizerPasskey,
      revertToStudent,
      toggleSaveEvent,
      registerForEvent,
      cancelRegistration,
      updateRegistrationStatus,
      respondToTeamInvite,
      fetchEventQrToken,
      verifyEventCheckIn,
      issueCertificate,
      verifyCertificateRef,
      createEvent,
      manageEventAction,
      joinOrRequestClub,
      leaveClub,
      acceptClubInvite,
      toggleMemberDirectoryPrivacy,
      manageClubMembership,
      manageClubContent,
      uploadClubFile,
      submitEventFeedback,
      submitReport,
      addEventToPlanner,
      handOffOrganizerToChat,
      runEventsAiHelper,
    ]
  );

  return (
    <EventsClubsContext.Provider value={value}>{children}</EventsClubsContext.Provider>
  );
};

export const useEventsClubs = () => {
  const ctx = useContext(EventsClubsContext);
  if (!ctx) throw new Error('useEventsClubs must be used within EventsClubsProvider');
  return ctx;
};
