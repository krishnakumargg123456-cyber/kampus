import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  MessageSquare,
  Search,
  Users,
} from 'lucide-react';
import { useSkillSwap } from '../../context/SkillSwapContext';
import {
  DELIVERY_MODES,
  SKILLSWAP_LANGUAGES,
  SKILL_PROFICIENCIES,
  WEEKDAYS,
  assessSkillMatch,
  getStudentInitials,
} from '../../data/skillSwapData';
import { SkillListing, StudentSkillProfile } from '../../types/skillSwap';

interface FindLearningPartnerViewProps {
  onOpenProfile: (profile: StudentSkillProfile) => void;
  onConnect: (profile: StudentSkillProfile, listing?: SkillListing) => void;
}

export const FindLearningPartnerView: React.FC<FindLearningPartnerViewProps> = ({
  onOpenProfile,
  onConnect,
}) => {
  const {
    currentUserId,
    profiles,
    myProfile,
    listings,
    openPartnerChat,
  } = useSkillSwap();

  const [teachQuery, setTeachQuery] = useState('');
  const [learnQuery, setLearnQuery] = useState('');
  const [proficiencyFilter, setProficiencyFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [mutualOnly, setMutualOnly] = useState(false);

  const matchedPeers = useMemo(() => {
    const tq = teachQuery.trim().toLowerCase();
    const lq = learnQuery.trim().toLowerCase();

    return profiles
      .filter((p) => p.userId !== currentUserId)
      .map((peer) => {
        const peerListings = listings.filter(
          (l) => l.ownerId === peer.userId && l.status === 'active'
        );
        const assessment = assessSkillMatch(myProfile, peer, peerListings);
        return { peer, peerListings, assessment };
      })
      .filter(({ peer, assessment }) => {
        if (mutualOnly && assessment?.kind !== 'Great Match') return false;
        if (tq) {
          const teaches = peer.skillsToTeach
            .map((s) => `${s.skillName} ${s.topicsCovered.join(' ')}`)
            .join(' ')
            .toLowerCase();
          if (!teaches.includes(tq)) return false;
        }
        if (lq) {
          const learns = `${peer.skillsToLearn.map((s) => s.skillName).join(' ')} ${peer.learningInterests.join(' ')}`.toLowerCase();
          if (!learns.includes(lq)) return false;
        }
        if (
          proficiencyFilter !== 'all' &&
          !peer.skillsToTeach.some((s) => s.proficiency === proficiencyFilter)
        ) {
          return false;
        }
        if (
          languageFilter !== 'all' &&
          !peer.languages.some((l) => l.toLowerCase().includes(languageFilter.toLowerCase()))
        ) {
          return false;
        }
        if (dayFilter !== 'all' && !peer.availability.days.includes(dayFilter)) {
          return false;
        }
        if (formatFilter !== 'all' && peer.learningPreferences.format !== formatFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const rank = (kind?: string) =>
          kind === 'Great Match' ? 3 : kind === 'Learning Match' || kind === 'Teaching Match' ? 2 : kind ? 1 : 0;
        return rank(b.assessment?.kind) - rank(a.assessment?.kind);
      });
  }, [
    profiles,
    currentUserId,
    listings,
    myProfile,
    mutualOnly,
    teachQuery,
    learnQuery,
    proficiencyFilter,
    languageFilter,
    dayFilter,
    formatFilter,
  ]);

  return (
    <div className="space-y-6">
      {/* Header + Deterministic Matching Filters */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Find a Learning Partner
            </h2>
            <p className="text-xs text-slate-500">
              Matched directly using listed teaching skills, learning goals, language, and schedule overlap.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={mutualOnly}
              onChange={(e) => setMutualOnly(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Mutual Skill Swaps Only (&ldquo;Great Match&rdquo;)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={teachQuery}
              onChange={(e) => setTeachQuery(e.target.value)}
              placeholder="Partner can teach (e.g. Python, Figma)..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-2"
            />
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={learnQuery}
              onChange={(e) => setLearnQuery(e.target.value)}
              placeholder="Partner wants to learn / interests..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-2"
            />
          </div>

          <select
            value={proficiencyFilter}
            onChange={(e) => setProficiencyFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          >
            <option value="all">Any Teaching Level</option>
            {SKILL_PROFICIENCIES.map((p) => (
              <option key={p} value={p}>
                {p}
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
            <option value="all">Any Available Day</option>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          >
            <option value="all">Any Session Format</option>
            {DELIVERY_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Your Skill Preferences Strip */}
      {myProfile && (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">Your Profile Basis: </span>
            <span className="text-slate-600 dark:text-slate-300">
              Can Teach{' '}
              <strong>
                {myProfile.skillsToTeach.map((s) => s.skillName).join(', ') || 'None'}
              </strong>{' '}
              · Wants to Learn{' '}
              <strong>
                {myProfile.skillsToLearn.map((s) => s.skillName).join(', ') || 'None'}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => onOpenProfile(myProfile)}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            Edit My Preferences
          </button>
        </div>
      )}

      {/* Partner Results */}
      {matchedPeers.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            No learning partners match these filters
          </p>
          <p className="text-xs text-slate-500">
            Try unchecking &ldquo;Mutual Skill Swaps Only&rdquo; or broadening your availability filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matchedPeers.map(({ peer, peerListings, assessment }) => (
            <article
              key={peer.userId}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4"
            >
              {/* Mutual Match Banner (Purely factual explanation, no fake percentages) */}
              {assessment && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                    assessment.kind === 'Great Match'
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                      : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-extrabold">{assessment.headline}: </span>
                      <span>{assessment.explanation}</span>
                    </div>
                  </div>
                  <span className="text-[11px] opacity-80">
                    {assessment.sharedDays.length > 0
                      ? `Shared days: ${assessment.sharedDays.join(', ')}`
                      : `Format: ${peer.learningPreferences.format}`}
                  </span>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#172554] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                    {getStudentInitials(peer.name)}
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {peer.name}
                      </h3>
                      {peer.privacySettings.showCollegeDetails && (
                        <p className="text-xs text-slate-500">
                          {peer.course} · {peer.semester} · {peer.college}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {peer.intro}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <p>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          Can Teach:
                        </span>{' '}
                        {peer.skillsToTeach
                          .map((s) => `${s.skillName} (${s.proficiency})`)
                          .join(', ') || 'Open to collaborate'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          Wants to Learn:
                        </span>{' '}
                        {peer.skillsToLearn.map((l) => l.skillName).join(', ') || 'Exploring'}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Languages: {peer.languages.join(', ')} · Available:{' '}
                      {peer.availability.days.join(', ')} ({peer.availability.preferredTime}) ·{' '}
                      {peer.learningPreferences.format}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap md:flex-col items-stretch gap-2 shrink-0">
                  {peer.privacySettings.allowDirectRequests && (
                    <button
                      type="button"
                      onClick={() => onConnect(peer, peerListings[0])}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Propose Exchange</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenProfile(peer)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    View Profile
                  </button>
                  {peer.privacySettings.allowMessagesFromPeers && (
                    <button
                      type="button"
                      onClick={() =>
                        openPartnerChat(
                          peer.name,
                          peer.userId,
                          peer.skillsToTeach[0]?.skillName
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
