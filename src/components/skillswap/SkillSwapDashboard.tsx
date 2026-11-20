import React, { useMemo } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  BookOpen,
  Bot,
  Calendar,
  Compass,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { useSkillSwap } from '../../context/SkillSwapContext';
import {
  SKILLSWAP_ILLUSTRATIONS,
  assessSkillMatch,
  formatShortDate,
  getCategoryName,
  getStudentInitials,
} from '../../data/skillSwapData';
import {
  SkillCategoryId,
  SkillExchange,
  SkillListing,
  StudentSkillProfile,
} from '../../types/skillSwap';

interface SkillSwapDashboardProps {
  searchQuery: string;
  onNavigateExplore: (categoryFilter?: SkillCategoryId) => void;
  onNavigateMatch: () => void;
  onNavigateMySkillSwap: () => void;
  onOpenOfferWizard: () => void;
  onOpenAi: (defaultSkill?: string) => void;
  onOpenProfile: (profile: StudentSkillProfile) => void;
  onConnect: (profile: StudentSkillProfile, listing?: SkillListing) => void;
  onOpenExchange: (exchange: SkillExchange) => void;
}

export const SkillSwapDashboard: React.FC<SkillSwapDashboardProps> = ({
  searchQuery,
  onNavigateExplore,
  onNavigateMatch,
  onNavigateMySkillSwap,
  onOpenOfferWizard,
  onOpenAi,
  onOpenProfile,
  onConnect,
  onOpenExchange,
}) => {
  const {
    currentUserId,
    categories,
    profiles,
    myProfile,
    listings,
    exchanges,
    loading,
  } = useSkillSwap();

  const activeListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return listings.filter((l) => {
      if (l.status !== 'active') return false;
      if (!q) return true;
      return `${l.skillName} ${l.description} ${l.ownerName} ${l.desiredSkill}`
        .toLowerCase()
        .includes(q);
    });
  }, [listings, searchQuery]);

  // A. Recommended For You (real deterministic matching against current user's profile)
  const recommendedItems = useMemo(() => {
    return profiles
      .filter((p) => p.userId !== currentUserId)
      .map((peer) => {
        const peerListings = activeListings.filter((l) => l.ownerId === peer.userId);
        const match = assessSkillMatch(myProfile, peer, peerListings);
        return { peer, primaryListing: peerListings[0], match };
      })
      .filter((item) => item.match !== null)
      .sort((a, b) => {
        if (a.match?.kind === 'Great Match' && b.match?.kind !== 'Great Match') return -1;
        if (b.match?.kind === 'Great Match' && a.match?.kind !== 'Great Match') return 1;
        return 0;
      })
      .slice(0, 3);
  }, [profiles, currentUserId, activeListings, myProfile]);

  // B. Popular Skills (real category listing counts)
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const count = activeListings.filter((l) => l.categoryId === cat.id).length;
      return { ...cat, count };
    });
  }, [categories, activeListings]);

  // C. Students Teaching
  const teachingPeers = useMemo(
    () =>
      profiles
        .filter((p) => p.userId !== currentUserId && p.skillsToTeach.length > 0)
        .slice(0, 4),
    [profiles, currentUserId]
  );

  // D. Skills You Can Learn (Teaching Offers) & E. New Opportunities
  const teachingOffers = useMemo(
    () =>
      activeListings
        .filter((l) => l.intent === 'Teaching Offer' && l.ownerId !== currentUserId)
        .slice(0, 4),
    [activeListings, currentUserId]
  );

  const recentOpportunities = useMemo(
    () =>
      [...activeListings]
        .filter((l) => l.ownerId !== currentUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [activeListings, currentUserId]
  );

  // F. Active Exchanges
  const activeExchanges = useMemo(
    () => exchanges.filter((ex) => ex.status === 'Active'),
    [exchanges]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* HERO EDITORIAL SPLIT */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Peer-to-Peer Skill Exchange
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight [text-wrap:balance]">
              Learn Something New. Teach Something You Know.
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Connect with students, exchange knowledge and grow together through structured 1-on-1 skill swaps, shared learning tracks, and peer sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateExplore()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Skills</span>
            </button>
            <button
              type="button"
              onClick={onOpenOfferWizard}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#172554] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Offer a Skill</span>
            </button>
            <button
              type="button"
              onClick={onNavigateMatch}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-orange-500" />
              <span>Find a Learning Partner</span>
            </button>
            <button
              type="button"
              onClick={onNavigateMySkillSwap}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
            >
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <span>My Skill Exchanges</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#F8FAFC] dark:bg-slate-800/40 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
          <img
            src={SKILLSWAP_ILLUSTRATIONS.heroEditorial}
            alt="Students exchanging skills and collaborating across design and programming"
            referrerPolicy="no-referrer"
            className="w-full h-56 lg:h-full object-cover"
          />
        </div>
      </section>

      {/* SECTION A: RECOMMENDED FOR YOU */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Recommended For You
            </h2>
            <p className="text-xs text-slate-500">
              Matched directly against your listed skills to teach, learning goals, and schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateMatch}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <span>Open Partner Matcher</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recommendedItems.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Add skills you teach &amp; want to learn to unlock mutual matches
              </p>
              <p className="text-xs text-slate-500">
                Your profile matches update automatically as soon as your skill preferences are saved.
              </p>
            </div>
            {myProfile && (
              <button
                type="button"
                onClick={() => onOpenProfile(myProfile)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Update My Skills
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recommendedItems.map(({ peer, primaryListing, match }) => (
              <article
                key={peer.userId}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                    <span
                      className={
                        match?.kind === 'Great Match'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }
                    >
                      {match?.headline}
                    </span>
                    <span className="text-slate-400">{peer.learningPreferences.format}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#172554] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {getStudentInitials(peer.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {peer.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">{peer.course}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {match?.explanation}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenProfile(peer)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => onConnect(peer, primaryListing)}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SECTION B: POPULAR SKILLS TAXONOMY STRIP */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Popular Skill Categories
            </h2>
            <p className="text-xs text-slate-500">
              Live peer listings across 7 structured learning disciplines.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAi()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Skill Advisor</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {categoryStats.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onNavigateExplore(cat.id)}
              className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors cursor-pointer space-y-1.5"
            >
              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                {cat.name}
              </p>
              <p className="text-[11px] text-slate-500 tabular-nums">
                {cat.count} {cat.count === 1 ? 'listing' : 'listings'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {cat.skills.slice(0, 2).join(', ')}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION C: STUDENTS TEACHING (EDITORIAL LIST LAYOUT — VARIED FROM CARDS) */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        <div className="p-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Students Teaching
            </h2>
            <p className="text-xs text-slate-500">
              Self-reported student skills, teaching focus areas, and weekly availability.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateExplore()}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Browse All Peers
          </button>
        </div>

        {teachingPeers.map((peer) => (
          <div
            key={peer.userId}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-extrabold flex items-center justify-center shrink-0">
                {getStudentInitials(peer.name)}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {peer.name}
                  </span>
                  <span className="text-[11px] text-slate-400">· {peer.course}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Teaches:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {peer.skillsToTeach.map((s) => `${s.skillName} (${s.proficiency})`).join(', ')}
                  </span>
                  {peer.skillsToLearn.length > 0 && (
                    <>
                      {' '}
                      · Wants:{' '}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {peer.skillsToLearn.map((l) => l.skillName).join(', ')}
                      </span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">
                  {peer.availability.days.join(', ')} · {peer.availability.preferredTime} ·{' '}
                  {peer.languages.join('/')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenProfile(peer)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
              >
                View Profile
              </button>
              <button
                type="button"
                onClick={() => onConnect(peer)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                Connect
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* SECTION D & E: SPLIT EDITORIAL COLUMNS — SKILLS YOU CAN LEARN + NEW OPPORTUNITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Skills You Can Learn
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateExplore()}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              See All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {teachingOffers.map((item) => {
              const owner = profiles.find((p) => p.userId === item.ownerId);
              return (
                <div key={item.id} className="py-3.5 first:pt-1 last:pb-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.skillName}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {getCategoryName(item.categoryId)} · {item.proficiency} · Taught by{' '}
                        {item.ownerName}
                      </p>
                    </div>
                    {owner && (
                      <button
                        type="button"
                        onClick={() => onConnect(owner, item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                      >
                        Request
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {item.whatStudentsLearn || item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                New Skill Opportunities
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenOfferWizard}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Post Opportunity
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentOpportunities.map((item) => {
              const owner = profiles.find((p) => p.userId === item.ownerId);
              return (
                <div key={item.id} className="py-3.5 first:pt-1 last:pb-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                        {item.intent} · {formatShortDate(item.createdAt)}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.skillName}
                        {item.desiredSkill ? ` ↔ ${item.desiredSkill}` : ''}
                      </h3>
                    </div>
                    {owner && (
                      <button
                        type="button"
                        onClick={() => onOpenProfile(owner)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {item.ownerName} · {item.exchangePreference} · {item.deliveryMode}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* SECTION F: ACTIVE EXCHANGES */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Active Exchanges ({activeExchanges.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onNavigateMySkillSwap}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Manage All Exchanges
          </button>
        </div>

        {activeExchanges.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No active skill exchanges yet
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Send a SkillSwap request to a peer or accept an incoming request to open your shared learning tracks and session scheduler.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeExchanges.map((ex) => {
              const partnerName =
                ex.studentAId === currentUserId ? ex.studentBName : ex.studentAName;
              const totalTasks = ex.tracks.reduce((acc, t) => acc + t.tasks.length, 0);
              const doneTasks = ex.tracks.reduce(
                (acc, t) => acc + t.tasks.filter((x) => x.done).length,
                0
              );
              return (
                <div
                  key={ex.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {ex.skillAForB} ↔ {ex.skillBForA}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Partner: {partnerName} · {doneTasks}/{totalTasks} tasks ·{' '}
                      {ex.sessions.length} sessions
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenExchange(ex)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer shrink-0"
                  >
                    Open Workspace
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
