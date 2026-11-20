import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Bookmark,
  Check,
  Edit3,
  History,
  Inbox,
  Pause,
  Play,
  Plus,
  Send,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { useSkillSwap } from '../../context/SkillSwapContext';
import { formatShortDate, getCategoryName, getStudentInitials } from '../../data/skillSwapData';
import {
  SkillExchange,
  SkillListing,
  StudentSkillProfile,
} from '../../types/skillSwap';

type MyTab =
  | 'listings'
  | 'want-to-learn'
  | 'incoming'
  | 'sent'
  | 'active'
  | 'completed'
  | 'saved'
  | 'history';

interface MySkillSwapViewProps {
  onOpenOfferWizard: (intent?: 'Teaching Offer' | 'Learning Request') => void;
  onEditListing: (listing: SkillListing) => void;
  onOpenProfile: (profile: StudentSkillProfile) => void;
  onConnect: (profile: StudentSkillProfile) => void;
  onOpenExchange: (exchange: SkillExchange) => void;
  onShareCommunity: (draft: { title: string; content: string; tags: string[] }) => void;
}

export const MySkillSwapView: React.FC<MySkillSwapViewProps> = ({
  onOpenOfferWizard,
  onEditListing,
  onOpenProfile,
  onConnect,
  onOpenExchange,
  onShareCommunity,
}) => {
  const {
    currentUserId,
    profiles,
    myProfile,
    listings,
    requests,
    exchanges,
    reviews,
    savedStudentIds,
    updateListing,
    deleteListing,
    respondToRequest,
    toggleSaveStudent,
  } = useSkillSwap();

  const [subTab, setSubTab] = useState<MyTab>('listings');

  const myListings = useMemo(
    () => listings.filter((l) => l.ownerId === currentUserId),
    [listings, currentUserId]
  );

  const incomingRequests = useMemo(
    () => requests.filter((r) => r.recipientId === currentUserId),
    [requests, currentUserId]
  );
  const pendingIncomingCount = incomingRequests.filter((r) => r.status === 'Pending').length;

  const sentRequests = useMemo(
    () => requests.filter((r) => r.senderId === currentUserId),
    [requests, currentUserId]
  );

  const activeExchanges = useMemo(
    () => exchanges.filter((e) => e.status === 'Active'),
    [exchanges]
  );

  const completedExchanges = useMemo(
    () => exchanges.filter((e) => e.status === 'Completed'),
    [exchanges]
  );

  const savedProfiles = useMemo(
    () => profiles.filter((p) => savedStudentIds.includes(p.userId)),
    [profiles, savedStudentIds]
  );

  const completedSessionsHistory = useMemo(() => {
    const items: Array<{
      id: string;
      topic: string;
      skillLabel: string;
      dateISO: string;
      durationMinutes: number;
      partnerName: string;
    }> = [];
    exchanges.forEach((ex) => {
      const partnerName =
        ex.studentAId === currentUserId ? ex.studentBName : ex.studentAName;
      ex.sessions
        .filter((s) => s.status === 'Completed')
        .forEach((s) => {
          items.push({
            id: s.id,
            topic: s.topic,
            skillLabel: `${ex.skillAForB} ↔ ${ex.skillBForA}`,
            dateISO: s.dateISO,
            durationMinutes: s.durationMinutes,
            partnerName,
          });
        });
    });
    return items;
  }, [exchanges, currentUserId]);

  const navItems: Array<{ id: MyTab; label: string; count?: number }> = [
    { id: 'listings', label: 'A. My Skill Listings', count: myListings.length },
    {
      id: 'want-to-learn',
      label: 'B. Skills I Want to Learn',
      count: myProfile?.skillsToLearn.length || 0,
    },
    {
      id: 'incoming',
      label: 'C. Incoming Requests',
      count: pendingIncomingCount || incomingRequests.length,
    },
    { id: 'sent', label: 'D. Sent Requests', count: sentRequests.length },
    { id: 'active', label: 'E. Active Exchanges', count: activeExchanges.length },
    { id: 'completed', label: 'F. Completed Exchanges', count: completedExchanges.length },
    { id: 'saved', label: 'G. Saved Students', count: savedProfiles.length },
    { id: 'history', label: 'H. Learning History', count: completedSessionsHistory.length },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Section Sidebar */}
      <aside className="lg:col-span-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSubTab(item.id)}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer text-left transition-colors ${
              subTab === item.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="truncate">{item.label}</span>
            <span
              className={`tabular-nums text-[11px] ${
                subTab === item.id ? 'text-blue-100' : 'text-slate-400'
              }`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </aside>

      {/* Right Content Area */}
      <section className="lg:col-span-9 space-y-4">
        {/* A. MY SKILL LISTINGS */}
        {subTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  My Skill Listings
                </h2>
                <p className="text-xs text-slate-500">
                  Manage, pause, edit, or share your active teaching offers and learning requests.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenOfferWizard('Teaching Offer')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Listing
              </button>
            </div>

            {myListings.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  You have not published any skill listings yet
                </p>
                <p className="text-xs text-slate-500">
                  Publish a skill you can teach or post a skill you want to learn.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenOfferWizard('Teaching Offer')}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Offer Your First Skill
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500">
                        {l.intent} · {getCategoryName(l.categoryId)} ·{' '}
                        <span
                          className={
                            l.status === 'active' ? 'text-emerald-600' : 'text-amber-600'
                          }
                        >
                          {l.status === 'active' ? 'Active' : 'Paused'}
                        </span>
                      </p>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {l.skillName}
                        {l.desiredSkill ? ` ↔ ${l.desiredSkill}` : ''}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {l.exchangePreference} · {l.deliveryMode} · {l.availableDays.join(', ')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onShareCommunity({
                            title: `SkillSwap Opportunity: ${l.skillName}`,
                            content: `${l.description}\n\nMode: ${l.exchangePreference} (${l.deliveryMode}). Reach out via SkillSwap!`,
                            tags: ['SkillSwap', l.skillName.replace(/\s+/g, '')],
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateListing(l.id, {
                            status: l.status === 'active' ? 'paused' : 'active',
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        {l.status === 'active' ? (
                          <>
                            <Pause className="w-3.5 h-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Resume
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditListing(l)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteListing(l.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 cursor-pointer"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* B. SKILLS I WANT TO LEARN */}
        {subTab === 'want-to-learn' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Skills I Want to Learn
                </h2>
                <p className="text-xs text-slate-500">
                  Manage your target skills to improve partner matching or post an open learning request.
                </p>
              </div>
              <div className="flex gap-2">
                {myProfile && (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(myProfile)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Edit Profile Goals
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenOfferWizard('Learning Request')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Post Learning Request
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(myProfile?.skillsToLearn || []).map((sk) => (
                <div
                  key={sk.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {sk.skillName}
                    </h3>
                    <span className="text-[11px] text-slate-500">Target: {sk.preferredLevel}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{sk.learningGoal}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* C. INCOMING REQUESTS */}
        {subTab === 'incoming' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Incoming Requests ({incomingRequests.length})
            </h2>

            {incomingRequests.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No incoming skill exchange requests yet.</p>
              </div>
            ) : (
              incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        {req.status} · {formatShortDate(req.createdAt)}
                      </p>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {req.senderName} wants to connect: {req.requestedSkill} ↔ {req.offeredSkill}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Availability: {req.preferredAvailability}
                      </p>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const ex = await respondToRequest(req.id, 'Accepted');
                            if (ex) onOpenExchange(ex);
                          }}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToRequest(req.id, 'Declined')}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                  {req.learningGoals && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Goal: {req.learningGoals}
                    </p>
                  )}
                  {req.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* D. SENT REQUESTS */}
        {subTab === 'sent' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Sent Requests ({sentRequests.length})
            </h2>

            {sentRequests.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
                <Send className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">You have not sent any SkillSwap requests yet.</p>
              </div>
            ) : (
              sentRequests.map((req) => {
                const linkedEx = exchanges.find((ex) => ex.id === req.exchangeId);
                return (
                  <div
                    key={req.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500">
                        Status:{' '}
                        <span
                          className={
                            req.status === 'Accepted' || req.status === 'Completed'
                              ? 'text-emerald-600'
                              : req.status === 'Pending'
                                ? 'text-blue-600'
                                : 'text-slate-400'
                          }
                        >
                          {req.status}
                        </span>{' '}
                        · {formatShortDate(req.createdAt)}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        To {req.recipientName}: {req.requestedSkill} ↔ {req.offeredSkill}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => respondToRequest(req.id, 'Cancelled')}
                          className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 cursor-pointer"
                        >
                          Withdraw Request
                        </button>
                      )}
                      {linkedEx && (
                        <button
                          type="button"
                          onClick={() => onOpenExchange(linkedEx)}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Open Exchange
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* E. ACTIVE EXCHANGES */}
        {subTab === 'active' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Active Exchanges ({activeExchanges.length})
            </h2>
            {activeExchanges.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-xs text-slate-500">
                No active exchanges right now. Accept an incoming request or connect with a learning partner.
              </div>
            ) : (
              activeExchanges.map((ex) => {
                const partnerName =
                  ex.studentAId === currentUserId ? ex.studentBName : ex.studentAName;
                return (
                  <div
                    key={ex.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-emerald-600">
                        Active · {ex.exchangeType}
                      </p>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {ex.skillAForB} ↔ {ex.skillBForA}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Partner: {partnerName} · {ex.tracks.length} learning tracks ·{' '}
                        {ex.sessions.length} scheduled sessions
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenExchange(ex)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Open Exchange Workspace
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* F. COMPLETED EXCHANGES */}
        {subTab === 'completed' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Completed Exchanges ({completedExchanges.length})
            </h2>
            {completedExchanges.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-xs text-slate-500">
                Completed skill exchanges and feedback records will appear here.
              </div>
            ) : (
              completedExchanges.map((ex) => {
                const partnerName =
                  ex.studentAId === currentUserId ? ex.studentBName : ex.studentAName;
                const reviewed = reviews.some(
                  (r) => r.exchangeId === ex.id && r.reviewerId === currentUserId
                );
                return (
                  <div
                    key={ex.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500">
                        Completed {ex.completedAt ? formatShortDate(ex.completedAt) : ''}
                      </p>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {ex.skillAForB} ↔ {ex.skillBForA} with {partnerName}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenExchange(ex)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      {reviewed ? 'View Summary' : 'Leave Feedback'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* G. SAVED STUDENTS */}
        {subTab === 'saved' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Saved Students ({savedProfiles.length})
            </h2>
            {savedProfiles.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-xs text-slate-500">
                Bookmark student skill profiles from Explore or Partner Discovery to keep track of them here.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedProfiles.map((p) => (
                  <div
                    key={p.userId}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#172554] text-white text-xs font-extrabold flex items-center justify-center">
                          {getStudentInitials(p.name)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </h3>
                          <p className="text-[11px] text-slate-500">{p.course}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSaveStudent(p.userId)}
                        className="p-2 text-orange-500 cursor-pointer"
                        title="Remove bookmark"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenProfile(p)}
                        className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        View Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => onConnect(p)}
                        className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* H. LEARNING HISTORY */}
        {subTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Learning History
            </h2>
            {completedSessionsHistory.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
                <History className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">
                  Completed learning sessions and accomplished milestones will be logged here automatically.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {completedSessionsHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.topic}</p>
                      <p className="text-slate-500">
                        {item.skillLabel} · With {item.partnerName}
                      </p>
                    </div>
                    <span className="text-slate-500 tabular-nums">
                      {item.dateISO} · {item.durationMinutes} min
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
