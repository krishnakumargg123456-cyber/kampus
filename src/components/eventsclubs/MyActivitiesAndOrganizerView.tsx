import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  FileCheck,
  KeyRound,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import { useEventsClubs } from '../../context/EventsClubsContext';
import { EVENT_CATEGORIES, formatEventDate } from '../../data/eventsClubsData';
import type {
  CampusClub,
  CampusEvent,
  CertificateType,
  EventCategoryId,
  EventFormat,
  EventOriginType,
} from '../../types/eventsClubs';

interface MyActivitiesViewProps {
  onOpenEvent: (ev: CampusEvent) => void;
  onOpenClub: (club: CampusClub) => void;
}

export const MyActivitiesView: React.FC<MyActivitiesViewProps> = ({
  onOpenEvent,
  onOpenClub,
}) => {
  const {
    events,
    registrations,
    teams,
    certificates,
    clubs,
    memberships,
    clubActivities,
    clubAnnouncements,
    savedEventIds,
    currentUserId,
    currentUserEmail,
    acceptClubInvite,
    respondToTeamInvite,
    verifyCertificateRef,
  } = useEventsClubs();

  const [section, setSection] = useState<'events' | 'clubs' | 'certificates'>('events');
  const [eventFilter, setEventFilter] = useState<
    'all' | 'upcoming' | 'pending' | 'waitlisted' | 'past' | 'saved' | 'cancelled'
  >('all');

  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<{
    checked: boolean;
    valid: boolean;
    message?: string;
    studentName?: string;
    eventTitle?: string;
    certificateType?: string;
  } | null>(null);

  const myRegs = registrations.filter((r) => r.userId === currentUserId);
  const myCerts = certificates.filter((c) => c.userId === currentUserId);
  const myClubMems = memberships.filter((m) => m.userId === currentUserId);
  const joinedClubIds = myClubMems.filter((m) => m.status === 'Member').map((m) => m.clubId);
  const teamInvites = teams.filter((t) =>
    t.members.some(
      (m) =>
        m.email.toLowerCase() === currentUserEmail.toLowerCase() &&
        m.inviteStatus === 'Pending'
    )
  );

  const filteredEventCards = useMemo(() => {
    if (eventFilter === 'saved') {
      return savedEventIds
        .map((id) => ({
          ev: events.find((e) => e.id === id),
          reg: myRegs.find((r) => r.eventId === id && r.status !== 'Cancelled'),
        }))
        .filter((x): x is { ev: CampusEvent; reg: (typeof myRegs)[number] | undefined } => Boolean(x.ev));
    }

    return myRegs
      .filter((r) => {
        const ev = events.find((e) => e.id === r.eventId);
        if (!ev) return false;
        if (eventFilter === 'upcoming') {
          return r.status === 'Confirmed' && ev.status !== 'Completed' && ev.status !== 'Cancelled';
        }
        if (eventFilter === 'pending') return r.status === 'Registration Pending';
        if (eventFilter === 'waitlisted') return r.status === 'Waitlisted';
        if (eventFilter === 'past') return ev.status === 'Completed';
        if (eventFilter === 'cancelled') return r.status === 'Cancelled' || r.status === 'Rejected';
        return true;
      })
      .map((reg) => ({
        reg,
        ev: events.find((e) => e.id === reg.eventId)!,
      }))
      .filter((x) => Boolean(x.ev));
  }, [eventFilter, events, myRegs, savedEventIds]);

  return (
    <div className="space-y-5">
      {/* Main Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'events', label: `My Events & Passes (${myRegs.length})` },
          { id: 'clubs', label: `My Clubs (${joinedClubIds.length})` },
          { id: 'certificates', label: `Certificates & Verification (${myCerts.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSection(t.id as typeof section)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
              section === t.id
                ? 'bg-[#172554] text-white border-[#172554]'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === 'events' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Registered' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'pending', label: 'Pending' },
              { id: 'waitlisted', label: 'Waitlisted' },
              { id: 'past', label: 'Past' },
              { id: 'saved', label: `Saved (${savedEventIds.length})` },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setEventFilter(f.id as typeof eventFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  eventFilter === f.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-[#F8FAFC] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredEventCards.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No events in this section yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEventCards.map(({ ev, reg }) => (
                <div
                  key={`${ev.id}_${reg?.id || 'saved'}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-[#2563EB]">
                        {reg ? reg.status : 'Bookmarked Event'}
                      </span>
                      {reg && (
                        <span className="font-mono text-slate-500">{reg.referenceCode}</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      {ev.title}
                    </h4>
                    <div className="text-xs text-slate-500">
                      {formatEventDate(ev.startDateISO)} · {ev.startTime} · {ev.venue}
                    </div>
                    {reg && (
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Attendance Check-In: {reg.checkInStatus}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onOpenEvent(ev)}
                      className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{reg?.status === 'Confirmed' ? 'Open Pass & Details' : 'Open Event'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {section === 'clubs' && (
        <div className="space-y-5">
          {teamInvites.length > 0 && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2 text-xs">
              <div className="font-bold text-[#172554] dark:text-blue-200">
                Pending Event Team Invitations
              </div>
              {teamInvites.map((tm) => (
                <div key={tm.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Team <span className="font-bold">{tm.teamName}</span> (Leader: {tm.leaderName})
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToTeamInvite(tm.id, 'Accepted')}
                      className="px-3 py-1 rounded-lg bg-[#2563EB] text-white font-semibold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToTeamInvite(tm.id, 'Rejected')}
                      className="px-3 py-1 rounded-lg border border-slate-300 font-semibold"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClubMems.length === 0 ? (
              <div className="col-span-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                You have not joined or requested any clubs yet.
              </div>
            ) : (
              myClubMems.map((mem) => {
                const club = clubs.find((c) => c.id === mem.clubId);
                if (!club) return null;
                return (
                  <div
                    key={mem.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-[#2563EB]">
                        {mem.status} · {mem.role}
                      </div>
                      <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                        {club.name}
                      </div>
                      <div className="text-xs text-slate-500">{club.meetingSchedule}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => onOpenClub(club)}
                        className="px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
                      >
                        Open Club
                      </button>
                      {mem.status === 'Approved' && (
                        <button
                          onClick={() => acceptClubInvite(mem.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                        >
                          Accept Invite
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {joinedClubIds.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-sm">Club Activities</div>
                {clubActivities
                  .filter((a) => joinedClubIds.includes(a.clubId))
                  .slice(0, 4)
                  .map((a) => (
                    <div key={a.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold">{a.title}</div>
                      <div className="text-slate-500">
                        {formatEventDate(a.dateISO)} · {a.location}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-sm">Club Announcements</div>
                {clubAnnouncements
                  .filter((a) => joinedClubIds.includes(a.clubId))
                  .slice(0, 4)
                  .map((a) => (
                    <div key={a.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="font-bold">{a.title}</div>
                      <div className="text-slate-500">{a.content}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {section === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            {myCerts.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Award className="w-7 h-7 text-slate-400 mx-auto" />
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No issued certificates yet
                </div>
                <p className="text-xs text-slate-500">
                  Only authorized organizers can issue verified participation, winner, volunteer, or
                  organizer certificates after event attendance.
                </p>
              </div>
            ) : (
              myCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-[#2563EB]">
                      {cert.certificateType} Certificate ·{' '}
                      <span className="font-mono">{cert.certificateRef}</span>
                    </div>
                    <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      {cert.eventTitle}
                    </div>
                    <div className="text-slate-500">
                      Issued by {cert.issuedBy} on {formatEventDate(cert.issuedAt)}
                    </div>
                  </div>
                  <a
                    href={`/api/events-clubs/certificates/${encodeURIComponent(cert.id)}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#172554] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                </div>
              ))
            )}
          </div>

          {/* Public Certificate Reference Verifier */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 h-fit text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-[#172033] dark:text-slate-100">
              <FileCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Verify Certificate Reference</span>
            </div>
            <p className="text-slate-500">
              Check authenticity of any issued KAMPUS event certificate using its reference code.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!verifyInput.trim()) return;
                const res = await verifyCertificateRef(verifyInput);
                setVerifyResult({
                  checked: true,
                  valid: res.valid,
                  message: res.message,
                  studentName: res.certificate?.studentName,
                  eventTitle: res.certificate?.eventTitle,
                  certificateType: res.certificate?.certificateType,
                });
              }}
              className="space-y-2"
            >
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="e.g. KMP-CERT-2026-12345"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#2563EB] text-white font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Verify Certificate</span>
              </button>
            </form>
            {verifyResult && (
              <div
                className={`p-3 rounded-xl border ${
                  verifyResult.valid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                }`}
              >
                {verifyResult.valid ? (
                  <div className="space-y-0.5">
                    <div className="font-bold">Verified Authentic Certificate</div>
                    <div>Recipient: {verifyResult.studentName}</div>
                    <div>
                      {verifyResult.certificateType} · {verifyResult.eventTitle}
                    </div>
                  </div>
                ) : (
                  <div>{verifyResult.message || 'Certificate reference not found.'}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CreateEventWizardProps {
  onSuccess: () => void;
  onOpenPasskeyModal: () => void;
}

export const CreateEventWizardView: React.FC<CreateEventWizardProps> = ({
  onSuccess,
  onOpenPasskeyModal,
}) => {
  const {
    authInfo,
    clubs,
    currentUserCollege,
    currentUserName,
    createEvent,
    runEventsAiHelper,
  } = useEventsClubs();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategoryId>('Technology');
  const [subType, setSubType] = useState('Hackathons');
  const [description, setDescription] = useState('');
  const [organizerName, setOrganizerName] = useState(authInfo.staffLabel || currentUserName);
  const [organizerClubId, setOrganizerClubId] = useState('');
  const [originType, setOriginType] = useState<EventOriginType>(
    authInfo.organizerRole === 'Institutional Event Admin'
      ? 'Official Institutional Event'
      : 'Student-Organized Event'
  );
  const [department, setDepartment] = useState('Computer Science & Engineering');

  // Step 2: Format
  const [format, setFormat] = useState<EventFormat>('Offline');
  const [venue, setVenue] = useState('');
  const [onlineMeetingInfo, setOnlineMeetingInfo] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  // Step 3: Schedule
  const [startDateISO, setStartDateISO] = useState(
    new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)
  );
  const [endDateISO, setEndDateISO] = useState(
    new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)
  );
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('4:00 PM');
  const [deadlineDate, setDeadlineDate] = useState(
    new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10)
  );
  const [agendaLine, setAgendaLine] = useState('10:00 AM - Opening & Problem Briefing');

  // Step 4: Participation
  const [participationMode, setParticipationMode] = useState<'Individual' | 'Team' | 'Both'>(
    'Individual'
  );
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [maxSeats, setMaxSeats] = useState(100);
  const [entryFeeInr, setEntryFeeInr] = useState(0);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [eligibility, setEligibility] = useState('Open to all enrolled students.');

  // Step 5: Content
  const [rulesText, setRulesText] = useState('Carry valid student ID and KAMPUS QR entry pass.');
  const [materialsText, setMaterialsText] = useState('Laptop, Charger');
  const [faqQ, setFaqQ] = useState('Will participation certificates be issued?');
  const [faqA, setFaqA] = useState('Yes, verified digital certificates are issued post check-in.');

  const [aiDrafting, setAiDrafting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authInfo.canCreateEvent) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 max-w-lg mx-auto">
        <KeyRound className="w-8 h-8 text-[#2563EB] mx-auto" />
        <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
          Organizer Authorization Required
        </h3>
        <p className="text-xs text-slate-500">
          Only verified club leaders, student event coordinators, or institutional event admins can
          publish campus events.
        </p>
        <button
          onClick={onOpenPasskeyModal}
          className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
        >
          Verify Organizer Access
        </button>
      </div>
    );
  }

  const subTypes = EVENT_CATEGORIES.find((c) => c.id === category)?.subTypes || [];

  const handlePublish = async (mode: 'draft' | 'submit-approval' | 'publish') => {
    setSubmitError(null);
    setSubmitting(true);
    const res = await createEvent({
      title,
      description,
      category,
      subType,
      college: currentUserCollege,
      department,
      organizerName,
      organizerClubId: organizerClubId || undefined,
      originType,
      format,
      venue: venue || (format === 'Online' ? 'Online Interactive Session' : 'Campus Auditorium'),
      onlineMeetingInfo: onlineMeetingInfo || undefined,
      externalUrl: externalUrl || undefined,
      startDateISO,
      endDateISO,
      startTime,
      endTime,
      registrationDeadlineISO: `${deadlineDate}T23:59:00.000Z`,
      schedule: agendaLine
        .split('\n')
        .filter(Boolean)
        .map((line) => ({ time: startTime, title: line.trim() })),
      participationMode,
      minTeamSize,
      maxTeamSize,
      maxSeats,
      entryFeeInr,
      requiresApproval,
      eligibility,
      rules: rulesText.split('\n').map((s) => s.trim()).filter(Boolean),
      requiredMaterials: materialsText.split(',').map((s) => s.trim()).filter(Boolean),
      faqs: faqQ.trim() ? [{ question: faqQ.trim(), answer: faqA.trim() }] : [],
      publishMode: mode,
    });
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error || 'Could not create event.');
      return;
    }
    onSuccess();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
            Create Campus Event · Step {step} of 6
          </h3>
          <p className="text-xs text-slate-500">
            {authInfo.organizerRole || 'Authorized Club Coordinator'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStep(n)}
              className={`w-7 h-7 rounded-lg text-xs font-bold ${
                step === n
                  ? 'bg-[#2563EB] text-white'
                  : n < step
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs space-y-4">
        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">1. Basic Event Details</span>
              <button
                type="button"
                disabled={aiDrafting}
                onClick={async () => {
                  setAiDrafting(true);
                  const res = await runEventsAiHelper(
                    'draft-event-content',
                    title || `${category} ${subType} campus event`
                  );
                  setAiDrafting(false);
                  if (res.ok && res.text) {
                    setDescription(res.text.slice(0, 750));
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-[#172554] text-white font-semibold inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                <span>{aiDrafting ? 'Drafting...' : 'AI Draft Description'}</span>
              </button>
            </div>
            <div>
              <label className="block font-semibold mb-1">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Campus Systems & Distributed Web Workshop"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value as EventCategoryId;
                    setCategory(cat);
                    const first = EVENT_CATEGORIES.find((c) => c.id === cat)?.subTypes[0] || '';
                    setSubType(first);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Event Type</label>
                <select
                  value={subType}
                  onChange={(e) => setSubType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {subTypes.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Organizer Name</label>
                <input
                  type="text"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Host Club (Optional)</label>
                <select
                  value={organizerClubId}
                  onChange={(e) => setOrganizerClubId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="">Independent / Department Event</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe event goals, topics covered, and what students will learn or build..."
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="font-bold text-sm">2. Event Format & Location</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as EventFormat)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Offline">Offline (Campus Venue)</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
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
            </div>
            <div>
              <label className="block font-semibold mb-1">Venue / Location</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Lecture Hall LH-102 or Google Meet"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Online Meeting Instructions (Optional)
              </label>
              <input
                type="text"
                value={onlineMeetingInfo}
                onChange={(e) => setOnlineMeetingInfo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">External Reference URL (Optional)</label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="font-bold text-sm">3. Schedule & Timeline</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDateISO}
                  onChange={(e) => setStartDateISO(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={endDateISO}
                  onChange={(e) => setEndDateISO(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Registration Deadline</label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Start Time</label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">End Time</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Agenda Items (one per line)</label>
              <textarea
                rows={3}
                value={agendaLine}
                onChange={(e) => setAgendaLine(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="font-bold text-sm">4. Participation & Limits</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Participation Mode</label>
                <select
                  value={participationMode}
                  onChange={(e) =>
                    setParticipationMode(e.target.value as 'Individual' | 'Team' | 'Both')
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Individual">Individual</option>
                  <option value="Team">Team Only</option>
                  <option value="Both">Both Individual & Team</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Max Seats</label>
                <input
                  type="number"
                  min={1}
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Entry Fee (INR, 0 = Free)</label>
                <input
                  type="number"
                  min={0}
                  value={entryFeeInr}
                  onChange={(e) => setEntryFeeInr(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              {participationMode !== 'Individual' && (
                <>
                  <div>
                    <label className="block font-semibold mb-1">Min Team Size</label>
                    <input
                      type="number"
                      min={1}
                      value={minTeamSize}
                      onChange={(e) => setMinTeamSize(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Max Team Size</label>
                    <input
                      type="number"
                      min={1}
                      value={maxTeamSize}
                      onChange={(e) => setMaxTeamSize(Number(e.target.value) || 4)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block font-semibold mb-1">Eligibility Criteria</label>
              <input
                type="text"
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
              />
              <span>Require manual organizer approval for each registration</span>
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <div className="font-bold text-sm">5. Rules, Materials & FAQs</div>
            <div>
              <label className="block font-semibold mb-1">Rules (one per line)</label>
              <textarea
                rows={2}
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Required Materials (comma-separated)
              </label>
              <input
                type="text"
                value={materialsText}
                onChange={(e) => setMaterialsText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">FAQ Question</label>
                <input
                  type="text"
                  value={faqQ}
                  onChange={(e) => setFaqQ(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">FAQ Answer</label>
                <input
                  type="text"
                  value={faqA}
                  onChange={(e) => setFaqA(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div className="font-bold text-sm">6. Preview & Publish Settings</div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="text-[11px] font-bold text-[#2563EB]">
                {category} · {subType} · {format}
              </div>
              <div className="text-base font-bold">{title || 'Untitled Event'}</div>
              <div className="text-slate-500">
                {startDateISO} ({startTime} - {endTime}) · {venue || 'Venue TBD'} · Max {maxSeats}{' '}
                seats
              </div>
              <p className="text-slate-600 dark:text-slate-300 pt-1">
                {description || 'Add an event description in Step 1.'}
              </p>
            </div>
            {submitError && <div className="text-red-600 font-semibold">{submitError}</div>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handlePublish('draft')}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handlePublish('submit-approval')}
                className="px-4 py-2 rounded-xl bg-[#172554] text-white font-semibold"
              >
                Submit for Approval
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handlePublish('publish')}
                className="px-5 py-2 rounded-xl bg-[#2563EB] text-white font-bold"
              >
                {submitting ? 'Publishing...' : 'Publish Event Live'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        {step < 6 && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(6, s + 1))}
            className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
          >
            Next Step
          </button>
        )}
      </div>
    </div>
  );
};

interface OrganizerPortalViewProps {
  onOpenPasskeyModal: () => void;
}

export const OrganizerPortalView: React.FC<OrganizerPortalViewProps> = ({
  onOpenPasskeyModal,
}) => {
  const {
    authInfo,
    events,
    registrations,
    updateRegistrationStatus,
    verifyEventCheckIn,
    issueCertificate,
    manageEventAction,
  } = useEventsClubs();

  const managedEvents = events.filter((e) => authInfo.managedEventIds.includes(e.id));
  const [selectedEventId, setSelectedEventId] = useState<string>(managedEvents[0]?.id || '');
  const activeEvent =
    managedEvents.find((e) => e.id === selectedEventId) || managedEvents[0] || null;

  const [scanToken, setScanToken] = useState('');
  const [scanResult, setScanResult] = useState<{
    ok: boolean;
    checkInStatus: string;
    message: string;
  } | null>(null);
  const [certType, setCertType] = useState<CertificateType>('Participation');
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');

  if (!authInfo.canCreateEvent && managedEvents.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3 max-w-lg mx-auto">
        <ShieldCheck className="w-8 h-8 text-[#2563EB] mx-auto" />
        <h3 className="text-base font-bold">Organizer & Check-In Portal</h3>
        <p className="text-xs text-slate-500">
          Verify your Institutional Event Admin or Club Lead passkey to manage registrations, scan
          rotating attendance QR credentials, and issue verified certificates.
        </p>
        <button
          onClick={onOpenPasskeyModal}
          className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
        >
          Authenticate Organizer Session
        </button>
      </div>
    );
  }

  const eventRegs = activeEvent
    ? registrations.filter((r) => r.eventId === activeEvent.id)
    : [];

  const exportCsv = () => {
    if (!activeEvent) return;
    const header = 'Reference,Name,Email,Course,Status,CheckIn\n';
    const rows = eventRegs
      .map(
        (r) =>
          `"${r.referenceCode}","${r.studentName}","${r.email}","${r.course}","${r.status}","${r.checkInStatus}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeEvent.id}_participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Selector & Quick Actions */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">Managed Event:</span>
          <select
            value={activeEvent?.id || ''}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
          >
            {managedEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.status})
              </option>
            ))}
          </select>
        </div>

        {activeEvent && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCsv}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            {activeEvent.status === 'Pending Approval' && (
              <button
                onClick={() =>
                  manageEventAction(activeEvent.id, {
                    action: 'update-status',
                    status: 'Upcoming',
                  })
                }
                className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-semibold"
              >
                Approve & Publish
              </button>
            )}
            <button
              onClick={() =>
                manageEventAction(activeEvent.id, {
                  action: 'update-status',
                  status: 'Completed',
                })
              }
              className="px-3.5 py-2 rounded-xl bg-[#172554] text-white font-semibold"
            >
              Mark Completed
            </button>
          </div>
        )}
      </div>

      {activeEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* QR Attendance Scanner */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <QrCode className="w-4 h-4 text-[#2563EB]" />
              <span>QR Attendance Check-In Scanner</span>
            </div>
            <p className="text-slate-500">
              Paste or scan a participant's live rotating KMP-EVT QR token to verify venue entry.
              Expired or previously scanned tokens are rejected automatically.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!scanToken.trim()) return;
                const res = await verifyEventCheckIn(activeEvent.id, scanToken);
                setScanResult(res);
                if (res.ok) setScanToken('');
              }}
              className="space-y-2.5"
            >
              <textarea
                rows={2}
                value={scanToken}
                onChange={(e) => setScanToken(e.target.value)}
                placeholder="Paste KMP-EVT... token from participant QR pass"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold"
              >
                Verify & Check In Participant
              </button>
            </form>
            {scanResult && (
              <div
                className={`p-3 rounded-xl border font-semibold ${
                  scanResult.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                }`}
              >
                <div>Status: {scanResult.checkInStatus}</div>
                <div className="font-normal mt-0.5">{scanResult.message}</div>
              </div>
            )}
          </div>

          {/* Post Event Announcement */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await manageEventAction(activeEvent.id, {
                action: 'announce',
                title: annTitle,
                message: annMessage,
              });
              setAnnTitle('');
              setAnnMessage('');
            }}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="text-sm font-bold">Post Participant Update</div>
            <input
              type="text"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Update headline (e.g. Room Change / Kit Distribution)"
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
            <textarea
              rows={2}
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
              placeholder="Message to registered participants..."
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#172554] text-white font-semibold"
            >
              Publish Event Update
            </button>
          </form>
        </div>
      )}

      {/* Participant Roster & Certificate Issuance */}
      {activeEvent && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <span>Registrations & Certificate Issuance ({eventRegs.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Certificate Type:</span>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value as CertificateType)}
                className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="Participation">Participation</option>
                <option value="Winner">Winner</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Organizer">Organizer</option>
              </select>
            </div>
          </div>

          {eventRegs.length === 0 ? (
            <p className="text-slate-500 py-3">No students have registered for this event yet.</p>
          ) : (
            <div className="space-y-2">
              {eventRegs.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {reg.studentName} · <span className="font-mono">{reg.referenceCode}</span>
                    </div>
                    <div className="text-slate-500">
                      {reg.email} · {reg.status} · Check-In: {reg.checkInStatus}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {reg.status !== 'Confirmed' && (
                      <button
                        onClick={() => updateRegistrationStatus(reg.id, 'Confirmed')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                      >
                        Confirm
                      </button>
                    )}
                    {reg.status !== 'Waitlisted' && (
                      <button
                        onClick={() => updateRegistrationStatus(reg.id, 'Waitlisted')}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 font-semibold"
                      >
                        Waitlist
                      </button>
                    )}
                    <button
                      onClick={() =>
                        issueCertificate(activeEvent.id, {
                          recipientUserId: reg.userId,
                          recipientName: reg.studentName,
                          certificateType: certType,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Issue {certType} Cert</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
