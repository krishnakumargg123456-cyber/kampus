import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Calendar,
  Compass,
  FileText,
  GraduationCap,
  MapPin,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCareer } from '../../context/CareerContext';
import { CAREER_LEARNING_RESOURCES, CAREER_MEDIA, CAREER_PATHS, formatShortDate } from '../../data/careerData';
import type { CareerOpportunity, ResumeDocument } from '../../types/career';

export type CareerSectionTab =
  | 'dashboard'
  | 'opportunities'
  | 'tracker'
  | 'resume'
  | 'portfolio'
  | 'paths'
  | 'interview'
  | 'learning'
  | 'profile'
  | 'portal';

interface Props {
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onNavigateTab: (tab: CareerSectionTab) => void;
  onOpenOpportunity: (opp: CareerOpportunity) => void;
  onOpenAiCareerModal: () => void;
}

export function computeResumeCompletion(resumes: ResumeDocument[]): number {
  const primary = resumes[0];
  if (!primary) return 0;
  let score = 0;
  if (primary.personalInfo.fullName && primary.personalInfo.email) score += 20;
  if (primary.summary.trim().length > 20) score += 20;
  if (primary.education.length > 0) score += 20;
  if (primary.skills.length >= 3) score += 20;
  if (primary.projects.length > 0 || primary.internships.length > 0 || primary.experience.length > 0) {
    score += 20;
  }
  return score;
}

export const CareerDashboardView: React.FC<Props> = ({
  searchQuery,
  onSearchQueryChange,
  onNavigateTab,
  onOpenOpportunity,
  onOpenAiCareerModal,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    opportunities,
    applications,
    resumes,
    preferences,
    savedOpportunityIds,
    viewedOpportunityIds,
    notInterestedIds,
    crossModule,
    toggleSaveOpportunity,
  } = useCareer();

  const visibleOpps = opportunities.filter(
    (o) => o.status === 'Open' && !notInterestedIds.includes(o.id)
  );
  const resumeCompletion = computeResumeCompletion(resumes);

  const recommendedOpps = visibleOpps.filter((o) => {
    const interests = [...(preferences?.interests || []), ...(preferences?.skills || [])].map((s) =>
      s.toLowerCase()
    );
    if (interests.length === 0) return true;
    return (
      interests.some((i) => o.category.toLowerCase().includes(i)) ||
      o.requiredSkills.some((sk) => interests.includes(sk.toLowerCase())) ||
      visibleOpps.indexOf(o) < 3
    );
  });

  const internships = visibleOpps.filter((o) => o.opportunityType === 'Internship');
  const entryLevelJobs = visibleOpps.filter((o) =>
    ['Full-Time Job', 'Campus Placement', 'Graduate Trainee Program', 'Apprenticeship'].includes(
      o.opportunityType
    )
  );
  const recentlyViewed = viewedOpportunityIds
    .map((id) => visibleOpps.find((o) => o.id === id))
    .filter((x): x is CareerOpportunity => Boolean(x));

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateTab('opportunities');
  };

  return (
    <div className="space-y-8">
      {/* 1. Career Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#172554] text-white">
        <img
          src={CAREER_MEDIA.hero}
          alt="Students collaborating on career preparation workshop"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              KAMPUS Career · Verified Discovery & Preparation
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Your Future Starts Here.
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              Discover opportunities, build skills, prepare with realistic guidance, and organize
              your next step across internships, placements, fellowships, and portfolios.
            </p>

            {/* Quick Search */}
            <form onSubmit={handleQuickSearchSubmit} className="pt-2 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center bg-white text-slate-900 rounded-xl px-3.5 py-2.5">
                <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder="Search internships, skills, roles, organizations..."
                  className="w-full text-sm bg-transparent focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white text-sm font-semibold transition-colors shrink-0 cursor-pointer"
              >
                Search Listings
              </button>
            </form>

            {/* Primary 4 Hero Actions */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('opportunities')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F97316] hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <Briefcase className="w-4 h-4" />
                <span>Explore Opportunities</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('resume')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Build My Resume</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('interview')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Practice Interview</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('paths')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Career Paths</span>
              </button>
            </div>
          </div>

          {/* 2. Personal Career Overview Card */}
          <div className="w-full lg:w-80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
                  Personal Career Overview
                </div>
                <div className="text-sm font-bold text-[#172033] dark:text-slate-100 mt-0.5">
                  {profile?.name || 'Student'}
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAiCareerModal}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Guide</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B] dark:text-slate-400">Resume Completion</span>
                <span className="font-bold tabular-nums text-[#172033] dark:text-slate-100">
                  {resumeCompletion}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] transition-all"
                  style={{ width: `${resumeCompletion}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <button
                type="button"
                onClick={() => onNavigateTab('profile')}
                className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="text-lg font-bold tabular-nums text-[#172033] dark:text-slate-100">
                  {savedOpportunityIds.length}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-slate-400">Saved</div>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('tracker')}
                className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="text-lg font-bold tabular-nums text-[#172033] dark:text-slate-100">
                  {applications.filter((a) => !a.archived).length}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-slate-400">Tracked</div>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('profile')}
                className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="text-lg font-bold tabular-nums text-[#172033] dark:text-slate-100">
                  {preferences?.skills.length || 0}
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-slate-400">Skills</div>
              </button>
            </div>

            <div className="text-xs text-[#64748B] dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div>
                <span className="font-semibold text-[#172033] dark:text-slate-200">Target: </span>
                {preferences?.targetRoles.join(', ') || 'Configure in Career Profile'}
              </div>
              <div>
                <span className="font-semibold text-[#172033] dark:text-slate-200">Goal: </span>
                {preferences?.learningGoals[0] || 'Add a learning goal'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transparency banner for seeded vs official listings */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900 px-4 py-3 text-xs text-[#64748B] dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>
            Every listing shows its exact source (Verified KAMPUS Partner, Official External Portal, or Sample Development Listing). KAMPUS never submits applications without your consent.
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('portal')}
          className="text-[#2563EB] font-semibold hover:underline shrink-0 cursor-pointer"
        >
          Recruiter / Career Cell Access
        </button>
      </div>

      {/* 3. Recommended Opportunities */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100">
              Recommended Opportunities
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Matched against your entered career interests and academic track
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('opportunities')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
          >
            <span>Browse all ({visibleOpps.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedOpps.slice(0, 3).map((opp) => {
            const isSaved = savedOpportunityIds.includes(opp.id);
            return (
              <div
                key={opp.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4 hover:border-[#2563EB]/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold text-[#2563EB]">
                      {opp.opportunityType} · {opp.workFormat}
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleSaveOpportunity(opp.id)}
                      aria-label={isSaved ? 'Remove bookmark' : 'Save opportunity'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isSaved
                          ? 'text-[#F97316] bg-orange-50 dark:bg-orange-950/40'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100 leading-snug">
                    {opp.title}
                  </h4>

                  <div className="text-xs text-[#64748B] dark:text-slate-400">
                    {opp.organizationName}
                    {opp.organizationVerified ? ' · Verified Organization' : ' · Unverified Listing Source'}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] dark:text-slate-400 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {opp.location}
                    </span>
                    <span className="tabular-nums">Due {formatShortDate(opp.deadlineISO)}</span>
                  </div>

                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Source: {opp.listingSource} · {opp.applicationMode}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenOpportunity(opp)}
                  className="w-full py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 hover:bg-[#2563EB] hover:text-white text-[#172033] dark:text-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  View Details & Apply Options
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4 & 5. Latest Internships & Entry-Level Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
              Latest Internships
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('opportunities')}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>
          {internships.length === 0 ? (
            <p className="text-xs text-[#64748B]">No active internships match your hidden filter.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {internships.slice(0, 3).map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => onOpenOpportunity(opp)}
                  className="w-full text-left py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#172033] dark:text-slate-100">
                      {opp.title}
                    </div>
                    <div className="text-xs text-[#64748B] dark:text-slate-400">
                      {opp.organizationName} · {opp.workFormat} · {opp.listingSource}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
              Entry-Level Jobs & Campus Drives
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('opportunities')}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              See all
            </button>
          </div>
          {entryLevelJobs.length === 0 ? (
            <p className="text-xs text-[#64748B]">No active entry-level openings listed.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {entryLevelJobs.slice(0, 3).map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => onOpenOpportunity(opp)}
                  className="w-full text-left py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#172033] dark:text-slate-100">
                      {opp.title}
                    </div>
                    <div className="text-xs text-[#64748B] dark:text-slate-400">
                      {opp.organizationName} · {opp.experienceLevel} · {opp.listingSource}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6, 7, 8: Placement Preparation, Career Learning Resources, Popular Career Paths */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Placement Preparation
          </div>
          <h4 className="text-base font-bold text-[#172033] dark:text-slate-100">
            Interview & Skill Practice
          </h4>
          <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
            Practice HR, technical, behavioral, and campus placement prompts plus timed & untimed skill assessments.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab('interview')}
              className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
            >
              Open Practice Lab
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('portfolio')}
              className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 text-[#172033] dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              Portfolio Builder
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#F97316]">
            Career Learning Resources
          </div>
          <h4 className="text-base font-bold text-[#172033] dark:text-slate-100">
            {CAREER_LEARNING_RESOURCES.length} Workplace Guides
          </h4>
          <ul className="space-y-1.5 text-xs text-[#64748B] dark:text-slate-400">
            {CAREER_LEARNING_RESOURCES.slice(0, 3).map((res) => (
              <li key={res.id} className="truncate">
                • {res.category}: {res.title}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onNavigateTab('learning')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
          >
            <span>Open Learning Hub & Scholarships</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Popular Career Paths
          </div>
          <h4 className="text-base font-bold text-[#172033] dark:text-slate-100">
            {CAREER_PATHS.length} Explorable Tracks
          </h4>
          <ul className="space-y-1.5 text-xs text-[#64748B] dark:text-slate-400">
            {CAREER_PATHS.slice(0, 3).map((cp) => (
              <li key={cp.id}>
                • {cp.title} ({cp.field})
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onNavigateTab('paths')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
          >
            <span>Explore Paths & Build Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 9 & 10. Upcoming Career Events (Synced with Events & Clubs) & Recently Viewed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                Upcoming Career Events (Events & Clubs Sync)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/campus/events-clubs')}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              Open Events & Clubs
            </button>
          </div>
          {crossModule.careerEvents.length === 0 ? (
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              No career workshops or hackathons currently published in Events & Clubs. Visit Events & Clubs to view campus calendars.
            </p>
          ) : (
            <div className="space-y-2">
              {crossModule.careerEvents.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-[#172033] dark:text-slate-100">
                      {ev.title}
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                      {formatShortDate(ev.startDateISO)} · {ev.startTime} · {ev.venue}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/campus/events-clubs')}
                    className="text-xs font-semibold text-[#2563EB] hover:underline shrink-0 cursor-pointer"
                  >
                    Register in Events
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#F97316]" />
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
              Recently Viewed Opportunities
            </h3>
          </div>
          {recentlyViewed.length === 0 ? (
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Opportunities you inspect will appear here for quick access.
            </p>
          ) : (
            <div className="space-y-2">
              {recentlyViewed.slice(0, 3).map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => onOpenOpportunity(opp)}
                  className="w-full text-left p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#172033] dark:text-slate-100">
                      {opp.title}
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-slate-400">
                      {opp.organizationName} · {opp.opportunityType}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
