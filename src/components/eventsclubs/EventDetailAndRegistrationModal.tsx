import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bookmark,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  MapPin,
  MessageSquare,
  Plus,
  QrCode,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEventsClubs } from '../../context/EventsClubsContext';
import {
  EVENT_COVER_ASSETS,
  formatEventDate,
  isRegistrationOpen,
  isSafeExternalUrl,
} from '../../data/eventsClubsData';
import { RealQrCode } from '../shared/RealQrCode';
import type { CampusEvent } from '../../types/eventsClubs';

interface EventDetailAndRegistrationModalProps {
  event: CampusEvent | null;
  onClose: () => void;
  onOpenReport: (target: {
    targetType: 'event' | 'club' | 'content';
    targetId: string;
    targetTitle: string;
  }) => void;
}

export const EventDetailAndRegistrationModal: React.FC<
  EventDetailAndRegistrationModalProps
> = ({ event, onClose, onOpenReport }) => {
  const navigate = useNavigate();
  const {
    currentUserId,
    currentUserName,
    currentUserEmail,
    currentUserCollege,
    currentUserCourse,
    currentUserEnrollmentNo,
    kampusIdRef,
    confirmedCounts,
    registrations,
    teams,
    feedback,
    savedEventIds,
    toggleSaveEvent,
    registerForEvent,
    cancelRegistration,
    respondToTeamInvite,
    fetchEventQrToken,
    submitEventFeedback,
    addEventToPlanner,
    handOffOrganizerToChat,
    runEventsAiHelper,
    showToast,
  } = useEventsClubs();

  const [tab, setTab] = useState<'overview' | 'register' | 'pass' | 'feedback'>('overview');
  const [partType, setPartType] = useState<'Individual' | 'Team'>('Individual');
  const [studentName, setStudentName] = useState(currentUserName);
  const [college, setCollege] = useState(currentUserCollege);
  const [course, setCourse] = useState(currentUserCourse);
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [email, setEmail] = useState(currentUserEmail);
  const [contactInfo, setContactInfo] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; email: string }>>([
    { name: '', email: '' },
  ]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [regError, setRegError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Rotating Check-In QR State
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Feedback State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const myReg = event
    ? registrations.find(
        (r) =>
          r.eventId === event.id &&
          r.userId === currentUserId &&
          r.status !== 'Cancelled' &&
          r.status !== 'Rejected'
      )
    : undefined;

  const myTeam = myReg?.teamId ? teams.find((t) => t.id === myReg.teamId) : undefined;
  const pendingTeamInvite = event
    ? teams.find(
        (t) =>
          t.eventId === event.id &&
          t.members.some(
            (m) =>
              m.email.toLowerCase() === currentUserEmail.toLowerCase() &&
              m.inviteStatus === 'Pending'
          )
      )
    : undefined;

  useEffect(() => {
    if (!event) return;
    setTab('overview');
    setPartType(event.participationMode === 'Team' ? 'Team' : 'Individual');
    setStudentName(currentUserName);
    setCollege(currentUserCollege);
    setCourse(currentUserCourse);
    setEmail(currentUserEmail);
    setAnswers({});
    setRegError(null);
    setQrToken(null);
    setAiSummary(null);
  }, [event, currentUserName, currentUserCollege, currentUserCourse, currentUserEmail]);

  const loadQrPass = useCallback(async () => {
    if (!myReg || myReg.status !== 'Confirmed') return;
    setQrLoading(true);
    setQrError(null);
    const res = await fetchEventQrToken(myReg.id);
    setQrLoading(false);
    if (!res.ok || !res.token) {
      setQrError(res.error || 'Unable to fetch check-in QR.');
      return;
    }
    setQrToken(res.token);
    const expMs = res.expiresAt ? new Date(res.expiresAt).getTime() : Date.now() + 90_000;
    setQrExpiresAt(expMs);
  }, [fetchEventQrToken, myReg]);

  useEffect(() => {
    if (tab === 'pass' && myReg?.status === 'Confirmed' && !qrToken) {
      loadQrPass();
    }
  }, [tab, myReg, qrToken, loadQrPass]);

  useEffect(() => {
    if (!qrExpiresAt) return;
    const id = window.setInterval(() => {
      const rem = Math.max(0, Math.floor((qrExpiresAt - Date.now()) / 1000));
      setSecondsLeft(rem);
    }, 1000);
    return () => window.clearInterval(id);
  }, [qrExpiresAt]);

  if (!event) return null;

  const saved = savedEventIds.includes(event.id);
  const confirmed = confirmedCounts[event.id] || 0;
  const open = isRegistrationOpen(event.registrationDeadlineISO) && event.status !== 'Cancelled';
  const eventFeedback = feedback.filter((f) => f.eventId === event.id);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setSubmitting(true);
    const cleanMembers =
      partType === 'Team'
        ? teamMembers.filter((m) => m.name.trim() && m.email.trim())
        : undefined;
    const res = await registerForEvent(event.id, {
      studentName,
      college,
      course,
      department,
      email,
      contactInfo: contactInfo || undefined,
      participationType: partType,
      teamName: partType === 'Team' ? teamName : undefined,
      teamMembers: cleanMembers,
      answers,
    });
    setSubmitting(false);
    if (!res.ok) {
      setRegError(res.error || 'Could not register.');
      return;
    }
    if (res.registration?.status === 'Confirmed') {
      setTab('pass');
    } else {
      setTab('overview');
    }
  };

  const handleSummarizeAi = async () => {
    setAiLoading(true);
    const res = await runEventsAiHelper(
      'summarize-event',
      `Title: ${event.title}\nDate: ${event.startDateISO} (${event.startTime} - ${event.endTime})\nVenue: ${event.venue}\nEligibility: ${event.eligibility}\nDescription: ${event.description}\nMaterials: ${event.requiredMaterials.join(', ')}`
    );
    setAiLoading(false);
    if (res.ok && res.text) {
      setAiSummary(res.text);
    } else {
      showToast(res.error || 'AI service unavailable');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-2xl">
        {/* Top Cover Header */}
        <div className="relative h-44 sm:h-52 bg-slate-900 shrink-0">
          <img
            src={event.coverImageUrl || EVENT_COVER_ASSETS[event.coverKey]}
            alt={event.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Close event dialog"
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950/75 text-white hover:bg-slate-900"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-blue-200">
              <span>{event.category}</span>
              <span>·</span>
              <span>{event.subType}</span>
              <span>·</span>
              <span>{event.originType}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold leading-snug">{event.title}</h2>
            <div className="text-xs text-slate-200">
              Organized by <span className="font-semibold text-white">{event.organizerName}</span> ·{' '}
              {event.department}
            </div>
          </div>
        </div>

        {/* Action Strip & Tabs */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-[#F8FAFC] dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'overview', label: 'Details & Agenda' },
              {
                id: 'register',
                label: myReg ? `Registered (${myReg.status})` : 'Register',
              },
              ...(myReg?.status === 'Confirmed'
                ? [{ id: 'pass', label: 'QR Entry Pass' }]
                : []),
              { id: 'feedback', label: `Feedback (${eventFeedback.length})` },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as typeof tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => toggleSaveEvent(event.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border inline-flex items-center gap-1 ${
                saved
                  ? 'bg-blue-50 text-[#2563EB] border-blue-200 dark:bg-blue-950/60 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>
            <button
              onClick={() => addEventToPlanner(event)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add to Planner</span>
            </button>
            <button
              onClick={() => {
                handOffOrganizerToChat(event.organizerName, event.organizerId, event.title);
                onClose();
                navigate('/connect/chat');
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Message Organizer</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`${window.location.origin}/#/campus/events-clubs`);
                showToast('Event link copied to clipboard');
              }}
              className="p-1.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              title="Share event"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                onOpenReport({
                  targetType: 'event',
                  targetId: event.id,
                  targetTitle: event.title,
                })
              }
              className="p-1.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#F97316]"
              title="Report issue"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {pendingTeamInvite && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-[#172554] dark:text-blue-200">
                  Team Invitation:
                </span>{' '}
                {pendingTeamInvite.leaderName} invited you to join team{' '}
                <span className="font-semibold">"{pendingTeamInvite.teamName}"</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => respondToTeamInvite(pendingTeamInvite.id, 'Accepted')}
                  className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold"
                >
                  Accept Team Invite
                </button>
                <button
                  onClick={() => respondToTeamInvite(pendingTeamInvite.id, 'Rejected')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Key Fact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Event Date</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {formatEventDate(event.startDateISO)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {event.startTime} - {event.endTime}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{event.format} Venue</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                    {event.venue}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">{event.college}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Participation</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {event.participationMode} ({event.minTeamSize}-{event.maxTeamSize})
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {confirmed} / {event.maxSeats} confirmed seats
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                    <span>Entry & Deadline</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {event.entryFeeInr === 0 ? 'Free Entry' : `Rs. ${event.entryFeeInr}`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Closes {formatEventDate(event.registrationDeadlineISO)}
                  </div>
                </div>
              </div>

              {/* AI Event Summary Helper */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  Want a quick AI preparation checklist and summary for this event?
                </div>
                <button
                  onClick={handleSummarizeAi}
                  disabled={aiLoading}
                  className="px-3 py-1.5 rounded-xl bg-[#172554] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>{aiLoading ? 'Summarizing...' : 'Summarize with KAMPUS AI'}</span>
                </button>
              </div>
              {aiSummary && (
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs space-y-1.5">
                  <div className="font-bold text-[#2563EB]">AI-Generated Summary</div>
                  <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed">
                    {aiSummary}
                  </div>
                </div>
              )}

              {/* Description, Objectives, Highlights */}
              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
                <div>
                  <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100 mb-1">
                    About This Event
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed">{event.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.objectives.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Objectives & Eligibility
                      </h5>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {event.eligibility}
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-xs">
                        {event.objectives.map((o, idx) => (
                          <li key={idx}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {event.requiredMaterials.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Required Materials & Rules
                      </h5>
                      <ul className="list-disc pl-4 space-y-1 text-xs">
                        {event.requiredMaterials.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                        {event.rules.map((r, idx) => (
                          <li key={`r_${idx}`} className="text-slate-500">
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Schedule / Timeline */}
                {event.schedule.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      Schedule & Agenda
                    </h4>
                    <div className="space-y-2">
                      {event.schedule.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#2563EB] mr-2">
                              {item.time}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.title}
                            </span>
                          </div>
                          {item.speakerOrLead && (
                            <span className="text-slate-500">{item.speakerOrLead}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speakers & Organizing Team */}
                {(event.speakers.length > 0 || event.organizingTeam.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.speakers.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Speakers & Mentors
                        </h4>
                        {event.speakers.map((sp, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {sp.name}
                            </div>
                            <div className="text-slate-500">
                              {sp.role} · {sp.organization}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {event.organizingTeam.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Organizing Team
                        </h4>
                        {event.organizingTeam.map((tm, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                          >
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {tm.name}
                            </span>
                            <span className="text-slate-500">{tm.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Event Announcements */}
                {event.announcements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      Organizer Updates
                    </h4>
                    {event.announcements.map((a) => (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs space-y-1"
                      >
                        <div className="font-bold text-slate-900 dark:text-slate-100">{a.title}</div>
                        <p className="text-slate-700 dark:text-slate-300">{a.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* External Registration Link Warning if External */}
                {event.externalUrl && isSafeExternalUrl(event.externalUrl) && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        External event link provided by organizer. Verify institutional domain
                        before submitting personal credentials externally.
                      </span>
                    </div>
                    <a
                      href={event.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold inline-flex items-center gap-1"
                    >
                      <span>Open External Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div className="space-y-4">
              {myReg ? (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Registration Status: {myReg.status}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="font-semibold">Reference Code:</span>{' '}
                      <span className="font-mono font-bold">{myReg.referenceCode}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Participant:</span> {myReg.studentName}
                    </div>
                    <div>
                      <span className="font-semibold">Check-In Status:</span> {myReg.checkInStatus}
                    </div>
                    <div>
                      <span className="font-semibold">Mode:</span> {myReg.participationType}
                      {myReg.teamName ? ` (${myReg.teamName})` : ''}
                    </div>
                  </div>
                  {myTeam && (
                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 space-y-1.5 text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Team Roster: {myTeam.teamName}
                      </div>
                      {myTeam.members.map((tm, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span>
                            {tm.name} ({tm.email}) · {tm.role}
                          </span>
                          <span className="font-semibold">{tm.inviteStatus}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {myReg.status === 'Confirmed' && (
                      <button
                        onClick={() => setTab('pass')}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>View Live QR Entry Pass</span>
                      </button>
                    )}
                    <button
                      onClick={() => cancelRegistration(myReg.id)}
                      className="px-4 py-2 rounded-xl border border-red-300 text-red-700 dark:text-red-300 text-xs font-semibold"
                    >
                      Cancel Registration
                    </button>
                  </div>
                </div>
              ) : !open ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-600 dark:text-slate-300">
                  Registration window is closed or event has been cancelled.
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Linked Student ID:{' '}
                      <span className="font-mono font-bold text-[#2563EB]">
                        {kampusIdRef || currentUserEnrollmentNo}
                      </span>
                    </span>
                    <span className="text-slate-500">
                      {event.requiresApproval
                        ? 'Organizer approval required before confirmation'
                        : confirmed >= event.maxSeats
                          ? 'Event full — registration will be waitlisted'
                          : 'Instant seat confirmation'}
                    </span>
                  </div>

                  {event.participationMode === 'Both' && (
                    <div className="flex items-center gap-2">
                      {(['Individual', 'Team'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPartType(m)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                            partType === m
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {m} Participation
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Institutional Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">College / Institution</label>
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Course & Department</label>
                      <input
                        type="text"
                        value={`${course}`}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Contact Phone (Optional)
                      </label>
                      <input
                        type="text"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="Optional emergency/coordinator contact"
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  {event.requiredQuestions.map((q, idx) => (
                    <div key={idx} className="text-xs">
                      <label className="block font-semibold mb-1">{q}</label>
                      <input
                        type="text"
                        value={answers[q] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q]: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        required
                      />
                    </div>
                  ))}

                  {partType === 'Team' && (
                    <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                      <div>
                        <label className="block font-bold mb-1">Team Name</label>
                        <input
                          type="text"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="e.g. Campus Builders"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Invite Team Members</span>
                          <button
                            type="button"
                            onClick={() =>
                              setTeamMembers((prev) =>
                                prev.length < event.maxTeamSize - 1
                                  ? [...prev, { name: '', email: '' }]
                                  : prev
                              )
                            }
                            className="text-[#2563EB] font-semibold inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Member</span>
                          </button>
                        </div>
                        {teamMembers.map((tm, i) => (
                          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={tm.name}
                              onChange={(e) =>
                                setTeamMembers((prev) =>
                                  prev.map((row, idx) =>
                                    idx === i ? { ...row, name: e.target.value } : row
                                  )
                                )
                              }
                              placeholder="Member full name"
                              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            />
                            <div className="flex gap-2">
                              <input
                                type="email"
                                value={tm.email}
                                onChange={(e) =>
                                  setTeamMembers((prev) =>
                                    prev.map((row, idx) =>
                                      idx === i ? { ...row, email: e.target.value } : row
                                    )
                                  )
                                }
                                placeholder="Member email"
                                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                              />
                              {teamMembers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTeamMembers((prev) => prev.filter((_, idx) => idx !== i))
                                  }
                                  className="p-2 text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {regError && <div className="text-xs font-semibold text-red-600">{regError}</div>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-60"
                  >
                    {submitting ? 'Submitting Registration...' : 'Submit Registration'}
                  </button>
                </form>
              )}
            </div>
          )}

          {tab === 'pass' && myReg && (
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#2563EB]">
                  Verified Rotating Event Check-In Credential
                </div>
                <h3 className="text-base font-bold text-[#172033] dark:text-slate-100 mt-0.5">
                  {event.title}
                </h3>
              </div>

              {qrLoading ? (
                <div className="py-12 text-xs text-slate-500">Generating signed QR token...</div>
              ) : qrError ? (
                <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs">{qrError}</div>
              ) : qrToken ? (
                <div className="space-y-3">
                  <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <RealQrCode value={qrToken} size={184} />
                  </div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {secondsLeft > 0
                      ? `Token expires in ${secondsLeft}s · Single-use entry`
                      : 'Token expired — tap Refresh QR for live venue scan'}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={loadQrPass}
                      className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh QR</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(qrToken);
                        showToast('Check-in token copied for organizer scanner');
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold"
                    >
                      Copy Token for Scanner
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="text-left p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div>
                  <span className="font-semibold">Student:</span> {myReg.studentName}
                </div>
                <div>
                  <span className="font-semibold">Reference:</span>{' '}
                  <span className="font-mono font-bold">{myReg.referenceCode}</span>
                </div>
                <div>
                  <span className="font-semibold">Check-In Status:</span>{' '}
                  <span className="font-bold text-[#2563EB]">{myReg.checkInStatus}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Anti-screenshot protection: each QR pass expires after 90 seconds and becomes invalid
                once scanned at venue check-in.
              </p>
            </div>
          )}

          {tab === 'feedback' && (
            <div className="space-y-5">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await submitEventFeedback(event.id, rating, comment);
                  setComment('');
                }}
                className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="text-xs font-bold text-[#172033] dark:text-slate-100">
                  Share Your Event Feedback
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={`p-1.5 rounded-lg border ${
                        rating >= n
                          ? 'bg-amber-50 border-amber-300 text-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-400'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-2">
                    {rating} / 5
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share honest takeaways on session quality, organization, or speakers..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
                >
                  Submit Feedback
                </button>
              </form>

              {eventFeedback.length === 0 ? (
                <p className="text-xs text-slate-500">No participant feedback submitted yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {eventFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {fb.studentName}
                        </span>
                        <span className="font-semibold text-amber-600">{fb.rating} / 5</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{fb.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
