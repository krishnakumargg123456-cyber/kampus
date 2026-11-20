import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Flag,
  ImagePlus,
  Lock,
  Search,
  ShieldCheck,
  Unlock,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useEventsClubs } from '../../context/EventsClubsContext';
import {
  CLUB_CATEGORIES,
  EVENT_COVER_ASSETS,
  formatEventDate,
  isSafeExternalUrl,
} from '../../data/eventsClubsData';
import type {
  CampusClub,
  CampusEvent,
  ClubCategoryId,
  ClubRole,
} from '../../types/eventsClubs';

interface ClubsDiscoveryAndDetailViewProps {
  selectedClub: CampusClub | null;
  onSelectClub: (club: CampusClub | null) => void;
  onOpenEvent: (ev: CampusEvent) => void;
  onOpenReport: (target: {
    targetType: 'event' | 'club' | 'content';
    targetId: string;
    targetTitle: string;
  }) => void;
}

const ASSIGNABLE_ROLES: ClubRole[] = [
  'Club President',
  'Vice President',
  'Club Admin',
  'Event Coordinator',
  'Faculty Coordinator',
  'Member',
];

export const ClubsDiscoveryAndDetailView: React.FC<ClubsDiscoveryAndDetailViewProps> = ({
  selectedClub,
  onSelectClub,
  onOpenEvent,
  onOpenReport,
}) => {
  const {
    clubs,
    memberships,
    clubActivities,
    clubAnnouncements,
    clubGallery,
    events,
    currentUserId,
    authInfo,
    joinOrRequestClub,
    leaveClub,
    toggleMemberDirectoryPrivacy,
    manageClubMembership,
    manageClubContent,
    uploadClubFile,
  } = useEventsClubs();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ClubCategoryId>('All');
  const [joinTarget, setJoinTarget] = useState<CampusClub | null>(null);

  // Join Club Form State
  const [joinReason, setJoinReason] = useState('');
  const [interests, setInterests] = useState('');
  const [skills, setSkills] = useState('');
  const [prevExp, setPrevExp] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [showPublic, setShowPublic] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // Club Detail Tab State
  const [clubTab, setClubTab] = useState<
    'overview' | 'activities' | 'events' | 'members' | 'announcements' | 'gallery' | 'leadership'
  >('overview');

  // Leadership Form States
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actDate, setActDate] = useState(new Date().toISOString().slice(0, 10));
  const [actLocation, setActLocation] = useState('');
  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryFile, setGalleryFile] = useState<File | null>(null);

  const filteredClubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clubs.filter((c) => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (q) {
        const blob = `${c.name} ${c.shortCode} ${c.category} ${c.subCategory} ${c.description}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [clubs, query, selectedCategory]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinTarget) return;
    setJoinError(null);
    if (portfolioUrl.trim() && !isSafeExternalUrl(portfolioUrl)) {
      setJoinError('Portfolio URL must begin with http:// or https://');
      return;
    }
    setJoining(true);
    const res = await joinOrRequestClub(joinTarget.id, {
      joinReason,
      interests: interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      skills: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      previousExperience: prevExp,
      portfolioUrl: portfolioUrl.trim() || undefined,
      showInPublicMembers: showPublic,
    });
    setJoining(false);
    if (!res.ok) {
      setJoinError(res.error || 'Failed to submit membership.');
      return;
    }
    setJoinTarget(null);
    setJoinReason('');
    setInterests('');
    setSkills('');
    setPrevExp('');
    setPortfolioUrl('');
  };

  if (selectedClub) {
    const club = clubs.find((c) => c.id === selectedClub.id) || selectedClub;
    const isManager = authInfo.managedClubIds.includes(club.id);
    const myMem = memberships.find(
      (m) => m.clubId === club.id && m.userId === currentUserId
    );
    const clubMembers = memberships.filter(
      (m) => m.clubId === club.id && m.status === 'Member'
    );
    const pendingRequests = memberships.filter(
      (m) => m.clubId === club.id && m.status === 'Request Pending'
    );
    const activities = clubActivities.filter((a) => a.clubId === club.id);
    const announcements = clubAnnouncements.filter((a) => a.clubId === club.id);
    const gallery = clubGallery.filter((g) => g.clubId === club.id);
    const clubEvents = events.filter(
      (e) => e.organizerClubId === club.id && e.status !== 'Draft' && e.status !== 'Pending Approval'
    );

    return (
      <div className="space-y-5">
        <button
          onClick={() => {
            onSelectClub(null);
            setClubTab('overview');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Club Directory</span>
        </button>

        {/* Club Header */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="relative h-44 bg-slate-900">
            <img
              src={EVENT_COVER_ASSETS[club.coverKey]}
              alt={club.name}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-white">
              <div>
                <div className="text-[11px] font-semibold text-blue-200 flex items-center gap-1.5">
                  <span>{club.category}</span>
                  <span>·</span>
                  <span>{club.subCategory}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    {club.visibility === 'Private' ? (
                      <Lock className="w-3 h-3" />
                    ) : (
                      <Unlock className="w-3 h-3" />
                    )}
                    {club.visibility} Club
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mt-0.5">{club.name}</h2>
                <div className="text-xs text-slate-200">
                  {club.college} · {clubMembers.length} active members
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!myMem || myMem.status === 'Inactive' || myMem.status === 'Rejected' ? (
                  <button
                    onClick={() => setJoinTarget(club)}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {club.visibility === 'Private' ? 'Request to Join' : 'Join Club'}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold">
                      {myMem.status} · {myMem.role}
                    </span>
                    <button
                      onClick={() => leaveClub(myMem.id)}
                      className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold"
                    >
                      Leave Club
                    </button>
                  </div>
                )}
                <button
                  onClick={() =>
                    onOpenReport({
                      targetType: 'club',
                      targetId: club.id,
                      targetTitle: club.name,
                    })
                  }
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white"
                  title="Report club"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Club Navigation Tabs */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview & About' },
              { id: 'activities', label: `Activities (${activities.length})` },
              { id: 'events', label: `Events (${clubEvents.length})` },
              { id: 'members', label: `Members (${clubMembers.length})` },
              { id: 'announcements', label: `Announcements (${announcements.length})` },
              { id: 'gallery', label: `Gallery (${gallery.length})` },
              ...(isManager ? [{ id: 'leadership', label: 'Leadership Workspace' }] : []),
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setClubTab(t.id as typeof clubTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap ${
                  clubTab === t.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-[#F8FAFC] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            {clubTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100 mb-1">
                      Mission & Purpose
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {club.mission}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                      {club.description}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100 mb-1.5">
                      Objectives
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                      {club.objectives.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100 mb-1.5">
                      Main Activities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {club.mainActivities.map((act) => (
                        <span
                          key={act}
                          className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 h-fit">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Club Coordination
                  </div>
                  <div>
                    <div className="text-slate-500">Meeting Schedule</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {club.meetingSchedule}
                    </div>
                  </div>
                  {club.facultyCoordinator && (
                    <div>
                      <div className="text-slate-500">Faculty Coordinator</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {club.facultyCoordinator}
                      </div>
                    </div>
                  )}
                  {myMem && myMem.status === 'Member' && (
                    <label className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={myMem.showInPublicMembers}
                        onChange={(e) =>
                          toggleMemberDirectoryPrivacy(myMem.id, e.target.checked)
                        }
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Show my profile in public member directory
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {clubTab === 'activities' && (
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-xs text-slate-500">No club activities scheduled yet.</p>
                ) : (
                  activities.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{a.title}</div>
                        <p className="text-slate-600 dark:text-slate-400">{a.description}</p>
                      </div>
                      <div className="text-right font-semibold text-[#2563EB]">
                        <div>{formatEventDate(a.dateISO)}</div>
                        <div className="text-slate-500 font-normal">{a.location}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {clubTab === 'events' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clubEvents.length === 0 ? (
                  <p className="text-xs text-slate-500">No active events linked to this club yet.</p>
                ) : (
                  clubEvents.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => onOpenEvent(ev)}
                      className="text-left p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] space-y-1.5"
                    >
                      <div className="text-[11px] font-bold text-[#2563EB]">
                        {ev.category} · {formatEventDate(ev.startDateISO)}
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {ev.title}
                      </div>
                      <div className="text-xs text-slate-500">{ev.venue}</div>
                    </button>
                  ))
                )}
              </div>
            )}

            {clubTab === 'members' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {clubMembers.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {m.studentName}
                    </div>
                    <div className="text-[#2563EB] font-semibold">{m.role}</div>
                    <div className="text-slate-500">
                      {m.course} · {m.semester}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {clubTab === 'announcements' && (
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-500">No announcements posted yet.</p>
                ) : (
                  announcements.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-900 dark:text-slate-100">{a.title}</div>
                      <p className="text-slate-600 dark:text-slate-300">{a.content}</p>
                      <div className="text-[11px] text-slate-500">
                        Posted by {a.authorName} · {formatEventDate(a.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {clubTab === 'gallery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.length === 0 ? (
                  <p className="text-xs text-slate-500 col-span-full">
                    No activity photos uploaded by club leadership yet.
                  </p>
                ) : (
                  gallery.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <img src={g.imageUrl} alt={g.caption} className="w-full h-40 object-cover" />
                      <div className="p-3 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {g.caption}
                        </div>
                        <div className="text-[11px] text-slate-500">By {g.uploadedByName}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {clubTab === 'leadership' && isManager && (
              <div className="space-y-6 text-xs">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-2 text-[#172554] dark:text-blue-200 font-semibold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    Authorized Leadership Console · Approve members, manage roles, post club
                    updates, and upload gallery photos.
                  </span>
                </div>

                {/* Pending Requests */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold">
                    Pending Membership Requests ({pendingRequests.length})
                  </h4>
                  {pendingRequests.length === 0 ? (
                    <p className="text-slate-500">No pending requests.</p>
                  ) : (
                    pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold">{req.studentName}</div>
                          <div className="text-slate-500">{req.joinReason}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              manageClubMembership(req.id, { status: 'Member', role: 'Member' })
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold"
                          >
                            Approve Member
                          </button>
                          <button
                            onClick={() => manageClubMembership(req.id, { status: 'Rejected' })}
                            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Role Management */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold">Member Role Assignments</h4>
                  <div className="space-y-2">
                    {clubMembers.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="font-semibold">
                          {m.studentName} ({m.course})
                        </span>
                        <select
                          value={m.role}
                          onChange={(e) =>
                            manageClubMembership(m.id, { role: e.target.value as ClubRole })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Post Announcement + Activity + Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await manageClubContent(club.id, {
                        action: 'add-announcement',
                        title: annTitle,
                        content: annContent,
                      });
                      setAnnTitle('');
                      setAnnContent('');
                    }}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                  >
                    <div className="font-bold text-sm">Post Club Announcement</div>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="Announcement headline"
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      required
                    />
                    <textarea
                      rows={2}
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Announcement details..."
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold"
                    >
                      Publish Announcement
                    </button>
                  </form>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await manageClubContent(club.id, {
                        action: 'add-activity',
                        title: actTitle,
                        description: actDesc,
                        dateISO: actDate,
                        location: actLocation,
                        kind: 'Upcoming',
                      });
                      setActTitle('');
                      setActDesc('');
                      setActLocation('');
                    }}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                  >
                    <div className="font-bold text-sm">Schedule Club Activity</div>
                    <input
                      type="text"
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      placeholder="Activity title"
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={actDate}
                        onChange={(e) => setActDate(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        value={actLocation}
                        onChange={(e) => setActLocation(e.target.value)}
                        placeholder="Venue / Lab"
                        className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        required
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={actDesc}
                      onChange={(e) => setActDesc(e.target.value)}
                      placeholder="Short activity summary..."
                      className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#172554] text-white font-semibold"
                    >
                      Add Club Activity
                    </button>
                  </form>
                </div>

                {/* Gallery Upload */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!galleryFile) return;
                    const up = await uploadClubFile(galleryFile);
                    if (up.ok && up.url) {
                      await manageClubContent(club.id, {
                        action: 'add-gallery',
                        caption: galleryCaption,
                        imageUrl: up.url,
                      });
                      setGalleryCaption('');
                      setGalleryFile(null);
                    }
                  }}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3"
                >
                  <ImagePlus className="w-5 h-5 text-[#2563EB]" />
                  <input
                    type="text"
                    value={galleryCaption}
                    onChange={(e) => setGalleryCaption(e.target.value)}
                    placeholder="Photo caption"
                    className="flex-1 min-w-40 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    required
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setGalleryFile(e.target.files?.[0] || null)}
                    className="text-xs"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold"
                  >
                    Upload Photo (max 5 MB)
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Club Categories */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              selectedCategory === 'All'
                ? 'bg-[#172554] text-white border-[#172554]'
                : 'bg-[#F8FAFC] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            All Clubs
          </button>
          {CLUB_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                selectedCategory === cat.id
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-[#F8FAFC] dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {cat.id}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs or societies..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Club Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredClubs.map((club) => {
          const memCount = memberships.filter(
            (m) => m.clubId === club.id && m.status === 'Member'
          ).length;
          const myMem = memberships.find(
            (m) => m.clubId === club.id && m.userId === currentUserId
          );

          return (
            <div
              key={club.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="h-32 bg-slate-900 relative">
                  <img
                    src={EVENT_COVER_ASSETS[club.coverKey]}
                    alt={club.name}
                    className="w-full h-full object-cover opacity-85"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/75 text-white text-[11px] font-semibold">
                    {club.category} · {club.visibility}
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{club.subCategory}</span>
                    <span className="inline-flex items-center gap-1 font-semibold tabular-nums">
                      <Users className="w-3.5 h-3.5" />
                      {memCount} members
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                    {club.name}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 line-clamp-2">
                    {club.description}
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{club.meetingSchedule}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectClub(club)}
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  View Club Profile
                </button>
                {myMem && myMem.status !== 'Inactive' && myMem.status !== 'Rejected' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    {myMem.status}
                  </span>
                ) : (
                  <button
                    onClick={() => setJoinTarget(club)}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    {club.visibility === 'Private' ? 'Request to Join' : 'Join Club'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Join / Request Membership Modal */}
      {joinTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                  {joinTarget.visibility === 'Private'
                    ? `Request Membership: ${joinTarget.shortCode}`
                    : `Join ${joinTarget.name}`}
                </h3>
                <p className="text-xs text-slate-500">
                  {joinTarget.visibility === 'Private'
                    ? 'Private club applications require leadership approval.'
                    : 'Public club — instant membership upon submission.'}
                </p>
              </div>
              <button onClick={() => setJoinTarget(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Why do you want to join?</label>
                <textarea
                  rows={2}
                  value={joinReason}
                  onChange={(e) => setJoinReason(e.target.value)}
                  placeholder="Share your goals, interest areas, or how you hope to contribute..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Interests (comma-separated)</label>
                  <input
                    type="text"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g. Web Apps, Open Source"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. TypeScript, UI Design"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Previous Experience (Optional)
                </label>
                <input
                  type="text"
                  value={prevExp}
                  onChange={(e) => setPrevExp(e.target.value)}
                  placeholder="Prior projects, volunteering, or club work"
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Portfolio / GitHub Link (Optional)
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={showPublic}
                  onChange={(e) => setShowPublic(e.target.checked)}
                />
                <span>Allow my name and role to appear in this club's member directory</span>
              </label>

              {joinError && <div className="text-red-600 font-semibold">{joinError}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold"
                >
                  {joining ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
