import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Flag,
  MessageSquare,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useSkillSwap } from '../../context/SkillSwapContext';
import {
  DELIVERY_MODES,
  EXCHANGE_PREFERENCES,
  SKILLSWAP_LANGUAGES,
  SKILL_PROFICIENCIES,
  WEEKDAYS,
  formatShortDate,
  getCategoryName,
  getStudentInitials,
} from '../../data/skillSwapData';
import {
  SkillCategoryId,
  SkillListing,
  SkillSwapReport,
  StudentSkillProfile,
} from '../../types/skillSwap';

type ExploreTab =
  | 'all'
  | 'trending'
  | 'recent'
  | 'recommended'
  | 'teaching'
  | 'requests';

type SortOption = 'relevant' | 'recent' | 'experienced' | 'active';

const EXPERIENCE_WEIGHT: Record<string, number> = {
  '2+ Years': 4,
  '1-2 Years': 3,
  '6-12 Months': 2,
  '< 6 Months': 1,
};

interface ExploreSkillsViewProps {
  initialCategory?: SkillCategoryId | 'all';
  globalSearch: string;
  onOpenProfile: (profile: StudentSkillProfile) => void;
  onConnect: (profile: StudentSkillProfile, listing?: SkillListing) => void;
  onReport: (target: {
    targetType: SkillSwapReport['targetType'];
    targetId: string;
    targetSummary: string;
  }) => void;
}

export const ExploreSkillsView: React.FC<ExploreSkillsViewProps> = ({
  initialCategory = 'all',
  globalSearch,
  onOpenProfile,
  onConnect,
  onReport,
}) => {
  const {
    currentUserId,
    categories,
    profiles,
    myProfile,
    listings,
    exchanges,
    openPartnerChat,
  } = useSkillSwap();

  const [tab, setTab] = useState<ExploreTab>('all');
  const [search, setSearch] = useState(globalSearch);
  const [categoryFilter, setCategoryFilter] = useState<SkillCategoryId | 'all'>(initialCategory);
  const [levelFilter, setLevelFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [exchangePrefFilter, setExchangePrefFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevant');

  useEffect(() => {
    setCategoryFilter(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (globalSearch) setSearch(globalSearch);
  }, [globalSearch]);

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const myLearnNames = new Set(
      (myProfile?.skillsToLearn || []).map((s) => s.skillName.toLowerCase())
    );
    const myTeachNames = new Set(
      (myProfile?.skillsToTeach || []).map((s) => s.skillName.toLowerCase())
    );

    const skillCounts = new Map<string, number>();
    listings.forEach((l) => {
      const k = l.skillName.toLowerCase();
      skillCounts.set(k, (skillCounts.get(k) || 0) + 1);
    });

    const list = listings.filter((l) => {
      if (l.status !== 'active') return false;
      if (categoryFilter !== 'all' && l.categoryId !== categoryFilter) return false;
      if (levelFilter !== 'all' && l.proficiency !== levelFilter) return false;
      if (deliveryFilter !== 'all' && l.deliveryMode !== deliveryFilter) return false;
      if (
        languageFilter !== 'all' &&
        !l.language.toLowerCase().includes(languageFilter.toLowerCase())
      ) {
        return false;
      }
      if (dayFilter !== 'all' && !l.availableDays.includes(dayFilter)) return false;
      if (exchangePrefFilter !== 'all' && l.exchangePreference !== exchangePrefFilter) {
        return false;
      }

      if (tab === 'teaching' && l.intent !== 'Teaching Offer') return false;
      if (tab === 'requests' && l.intent !== 'Learning Request') return false;
      if (tab === 'recommended') {
        const matchesLearn = myLearnNames.has(l.skillName.toLowerCase());
        const matchesDesired = l.desiredSkill && myTeachNames.has(l.desiredSkill.toLowerCase());
        if (!matchesLearn && !matchesDesired) return false;
      }
      if (tab === 'trending') {
        if ((skillCounts.get(l.skillName.toLowerCase()) || 0) < 1) return false;
      }

      if (q) {
        const hay = `${l.skillName} ${l.description} ${l.topics.join(' ')} ${l.ownerName} ${l.desiredSkill}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'experienced') {
        return (
          (EXPERIENCE_WEIGHT[b.experienceLevel] || 0) -
          (EXPERIENCE_WEIGHT[a.experienceLevel] || 0)
        );
      }
      if (sortBy === 'active') {
        const aEx = exchanges.filter(
          (ex) => ex.studentAId === a.ownerId || ex.studentBId === a.ownerId
        ).length;
        const bEx = exchanges.filter(
          (ex) => ex.studentAId === b.ownerId || ex.studentBId === b.ownerId
        ).length;
        return bEx - aEx;
      }
      // relevant
      const aMatch = myLearnNames.has(a.skillName.toLowerCase()) ? 1 : 0;
      const bMatch = myLearnNames.has(b.skillName.toLowerCase()) ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [
    listings,
    search,
    categoryFilter,
    levelFilter,
    deliveryFilter,
    languageFilter,
    dayFilter,
    exchangePrefFilter,
    tab,
    sortBy,
    myProfile,
    exchanges,
  ]);

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setLevelFilter('all');
    setDeliveryFilter('all');
    setLanguageFilter('all');
    setDayFilter('all');
    setExchangePrefFilter('all');
    setTab('all');
  };

  return (
    <div className="space-y-6">
      {/* Discovery Tabs + Search + Sort */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(
              [
                { id: 'all', label: 'All Skills' },
                { id: 'trending', label: 'Trending' },
                { id: 'recent', label: 'Recently Added' },
                { id: 'recommended', label: 'Recommended' },
                { id: 'teaching', label: 'Teaching Offers' },
                { id: 'requests', label: 'Learning Requests' },
              ] as Array<{ id: ExploreTab; label: string }>
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
          >
            <option value="relevant">Sort: Most Relevant</option>
            <option value="recent">Sort: Recently Added</option>
            <option value="experienced">Sort: Most Experienced</option>
            <option value="active">Sort: Most Active</option>
          </select>
        </div>

        {/* Search & Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills, topics, or student names..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as SkillCategoryId | 'all')}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          >
            <option value="all">All Skill Levels</option>
            {SKILL_PROFICIENCIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          >
            <option value="all">Online &amp; In-Person</option>
            {DELIVERY_MODES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          >
            <option value="all">Any Language</option>
            {SKILLSWAP_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          >
            <option value="all">Any Availability Day</option>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={exchangePrefFilter}
            onChange={(e) => setExchangePrefFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          >
            <option value="all">Any Exchange Preference</option>
            {EXCHANGE_PREFERENCES.map((ep) => (
              <option key={ep} value={ep}>
                {ep}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Showing {filteredListings.length}{' '}
            {filteredListings.length === 1 ? 'skill listing' : 'skill listings'}
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results List */}
      {filteredListings.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            No skill listings match your current filters
          </p>
          <p className="text-xs text-slate-500">
            Try clearing a filter or broadening your search query.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
          >
            Show All Skills
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredListings.map((item) => {
            const owner = profiles.find((p) => p.userId === item.ownerId);
            const isMine = item.ownerId === currentUserId;

            return (
              <article
                key={item.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Clean unboxed metadata header */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {getCategoryName(item.categoryId)} · {item.intent}
                    </span>
                    <span>
                      {item.verificationLabel} · {formatShortDate(item.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {item.skillName}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Owner summary */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-[#172554] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {getStudentInitials(item.ownerName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.ownerName} {isMine && '(You)'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.proficiency} ({item.experienceLevel}) · {item.ownerCourse}
                      </p>
                    </div>
                  </div>

                  {/* Teach / Learn details */}
                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <p>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {item.intent === 'Learning Request' ? 'Wants to Learn:' : 'Can Teach:'}
                      </span>{' '}
                      {item.topics.length > 0 ? item.topics.join(', ') : item.whatStudentsLearn}
                    </p>
                    {item.desiredSkill && (
                      <p>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          Wants in Return:
                        </span>{' '}
                        {item.desiredSkill} ({item.exchangePreference})
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Format: {item.deliveryMode} · {item.groupMode} · {item.language} ·{' '}
                      {item.availableDays.join(', ')} ({item.preferredTime})
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {owner && (
                      <button
                        type="button"
                        onClick={() => onOpenProfile(owner)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        View Profile
                      </button>
                    )}
                    {!isMine && owner?.privacySettings.allowMessagesFromPeers && (
                      <button
                        type="button"
                        onClick={() =>
                          openPartnerChat(item.ownerName, item.ownerId, item.skillName)
                        }
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                        title="Message in KAMPUS Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isMine && (
                      <button
                        type="button"
                        onClick={() =>
                          onReport({
                            targetType: 'listing',
                            targetId: item.id,
                            targetSummary: `${item.skillName} by ${item.ownerName}`,
                          })
                        }
                        className="p-2 rounded-xl text-slate-400 hover:text-orange-500 cursor-pointer"
                        title="Report listing"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {!isMine && owner && owner.privacySettings.allowDirectRequests && (
                    <button
                      type="button"
                      onClick={() => onConnect(owner, item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
