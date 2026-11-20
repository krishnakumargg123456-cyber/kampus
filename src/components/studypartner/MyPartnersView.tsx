import React, { useMemo, useState } from 'react';
import {
  Ban,
  CalendarPlus,
  MessageSquare,
  Search,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudyPartner } from '../../context/StudyPartnerContext';

export const MyPartnersView: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    getMatchForPeer,
    setSelectedPeerId,
    setActiveTab,
    removePartnerConnection,
    blockUser,
    invitePartnerToGroup,
    prepareChatHandoff,
  } = useStudyPartner();

  const [partnerSearch, setPartnerSearch] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'name' | 'upcoming'>('match');
  const [inviteOpenId, setInviteOpenId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState(
    state.groups[0]?.id || ''
  );
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const connectedPartners = useMemo(() => {
    const q = partnerSearch.trim().toLowerCase();
    const list = state.peers.filter((p) => {
      if (!state.connectedPartnerIds.includes(p.id)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.subjects.some((s) => s.toLowerCase().includes(q)) ||
        p.learningGoals.some((g) => g.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'upcoming') {
        const aHas = state.sessions.some(
          (s) => s.targetId === a.id && s.status === 'Upcoming'
        );
        const bHas = state.sessions.some(
          (s) => s.targetId === b.id && s.status === 'Upcoming'
        );
        if (aHas !== bHas) return aHas ? -1 : 1;
      }
      return (
        (getMatchForPeer(b).score ?? 0) - (getMatchForPeer(a).score ?? 0)
      );
    });
  }, [
    state.peers,
    state.connectedPartnerIds,
    state.sessions,
    partnerSearch,
    sortBy,
  ]);

  return (
    <div className="space-y-5">
      {/* Search & Sort Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={partnerSearch}
            onChange={(e) => setPartnerSearch(e.target.value)}
            placeholder="Search connected partners by name, subject, or goal..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'match' | 'name' | 'upcoming')
            }
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="match">Sort: Highest Compatibility</option>
            <option value="upcoming">Sort: Upcoming Sessions First</option>
            <option value="name">Sort: Name (A–Z)</option>
          </select>

          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add More</span>
          </button>
        </div>
      </div>

      {connectedPartners.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2.5">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            No connected study partners match your filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Accept an incoming request or discover compatible peers in Find Partners.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
          >
            Find Study Partners
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {connectedPartners.map((partner) => {
            const match = getMatchForPeer(partner);
            const upcoming = state.sessions.find(
              (s) => s.targetId === partner.id && s.status === 'Upcoming'
            );

            return (
              <div
                key={partner.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={partner.avatarUrl}
                      alt={partner.name}
                      referrerPolicy="no-referrer"
                      onClick={() => setSelectedPeerId(partner.id)}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <h3
                        onClick={() => setSelectedPeerId(partner.id)}
                        className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer truncate"
                      >
                        {partner.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {partner.course} · {partner.semester} · {partner.college}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Last collaboration:{' '}
                        {partner.lastCollaborationLabel || 'Connected recently'}
                      </p>
                    </div>
                  </div>

                  {match.score !== null && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                      {match.score}% Match
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Shared Subjects:{' '}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {match.commonSubjects.length > 0
                        ? match.commonSubjects.join(' · ')
                        : partner.subjects.slice(0, 3).join(' · ')}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Study Goals:{' '}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {partner.learningGoals.join(' · ')}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">Upcoming Session: </span>
                    {upcoming
                      ? `${upcoming.title} (${upcoming.dateISO} at ${upcoming.timeSlot})`
                      : 'None scheduled yet'}
                  </div>
                </div>

                {inviteOpenId === partner.id && state.groups.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <select
                      value={selectedGroupId || state.groups[0]?.id}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      {state.groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        invitePartnerToGroup(
                          selectedGroupId || state.groups[0].id,
                          partner.id
                        );
                        setInviteOpenId(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      prepareChatHandoff(
                        partner.name,
                        partner.avatarUrl,
                        `Connected Study Partner · ${partner.subjects[0]}`,
                        false
                      );
                      navigate('/connect/chat');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('sessions')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-orange-500" />
                    <span>Schedule Session</span>
                  </button>

                  {state.groups.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setInviteOpenId(
                          inviteOpenId === partner.id ? null : partner.id
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Invite to Group</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPeerId(partner.id)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                  >
                    View Profile
                  </button>

                  <div className="ml-auto flex items-center gap-1">
                    {confirmRemoveId === partner.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            removePartnerConnection(partner.id);
                            setConfirmRemoveId(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Confirm Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(null)}
                          className="px-2 py-1.5 text-xs text-slate-500 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(partner.id)}
                          title="Remove connection"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => blockUser(partner.id)}
                          title="Block user"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
