import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  Flag,
  MapPin,
  Search,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useCareer } from '../../context/CareerContext';
import {
  CAREER_REPORT_REASONS,
  JOB_CATEGORIES,
  OPPORTUNITY_TYPES,
  formatShortDate,
  isSafeHttpUrl,
} from '../../data/careerData';
import type { CareerOpportunity, OrganizationProfile } from '../../types/career';

interface Props {
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  selectedOpportunity: CareerOpportunity | null;
  onSelectOpportunity: (opp: CareerOpportunity | null) => void;
}

export const OpportunityDiscoveryAndDetailView: React.FC<Props> = ({
  searchQuery,
  onSearchQueryChange,
  selectedOpportunity,
  onSelectOpportunity,
}) => {
  const {
    organizations,
    opportunities,
    resumes,
    applications,
    savedOpportunityIds,
    notInterestedIds,
    toggleSaveOpportunity,
    markOpportunityViewed,
    markNotInterested,
    createApplication,
    submitSafetyReport,
    showToast,
  } = useCareer();

  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [workFormatFilter, setWorkFormatFilter] = useState<string>('All');
  const [experienceFilter, setExperienceFilter] = useState<string>('All');
  const [paidFilter, setPaidFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [orgFilter, setOrgFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'Relevant' | 'Recent' | 'DeadlineSoon' | 'SavedFirst'>('Relevant');

  // Organization drawer
  const [inspectOrg, setInspectOrg] = useState<OrganizationProfile | null>(null);

  // KAMPUS-Hosted Application Modal State
  const [applyModalOpp, setApplyModalOpp] = useState<CareerOpportunity | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState<boolean>(false);
  const [applyNote, setApplyNote] = useState<string>('');

  // External Link Warning Modal State
  const [externalModalOpp, setExternalModalOpp] = useState<CareerOpportunity | null>(null);

  // Report Modal State
  const [reportTarget, setReportTarget] = useState<{
    type: 'opportunity' | 'organization';
    id: string;
    title: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState<string>(CAREER_REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState<string>('');

  const filteredOpportunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = opportunities.filter((o) => {
      if (o.status !== 'Open') return false;
      if (notInterestedIds.includes(o.id)) return false;
      if (typeFilter !== 'All' && o.opportunityType !== typeFilter) return false;
      if (categoryFilter !== 'All' && o.category !== categoryFilter) return false;
      if (workFormatFilter !== 'All' && o.workFormat !== workFormatFilter) return false;
      if (experienceFilter !== 'All' && o.experienceLevel !== experienceFilter) return false;
      if (paidFilter === 'Paid' && !o.isPaid) return false;
      if (paidFilter === 'Unpaid' && o.isPaid) return false;
      if (orgFilter !== 'All' && o.organizationId !== orgFilter) return false;
      if (
        locationFilter.trim() &&
        !o.location.toLowerCase().includes(locationFilter.trim().toLowerCase())
      ) {
        return false;
      }
      if (q) {
        const hay = `${o.title} ${o.organizationName} ${o.category} ${o.requiredSkills.join(' ')} ${o.educationRequirement} ${o.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'Recent') return b.publishedAtISO.localeCompare(a.publishedAtISO);
      if (sortBy === 'DeadlineSoon') return a.deadlineISO.localeCompare(b.deadlineISO);
      if (sortBy === 'SavedFirst') {
        const aSaved = savedOpportunityIds.includes(a.id) ? 1 : 0;
        const bSaved = savedOpportunityIds.includes(b.id) ? 1 : 0;
        return bSaved - aSaved;
      }
      return (b.organizationVerified ? 1 : 0) - (a.organizationVerified ? 1 : 0);
    });
  }, [
    opportunities,
    notInterestedIds,
    typeFilter,
    categoryFilter,
    workFormatFilter,
    experienceFilter,
    paidFilter,
    orgFilter,
    locationFilter,
    searchQuery,
    sortBy,
    savedOpportunityIds,
  ]);

  const handleOpenDetail = (opp: CareerOpportunity) => {
    onSelectOpportunity(opp);
    void markOpportunityViewed(opp.id);
  };

  const handleShareOpportunity = async (opp: CareerOpportunity) => {
    const shareText = `${opp.title} — ${opp.organizationName} (${opp.opportunityType}, Due ${formatShortDate(opp.deadlineISO)})`;
    try {
      await navigator.clipboard.writeText(shareText);
      showToast('info', 'Opportunity summary copied to clipboard.');
    } catch {
      showToast('info', shareText);
    }
  };

  const handleConfirmHostedApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalOpp) return;
    if (!consentChecked) {
      showToast('error', 'Explicit consent checkbox must be checked before submitting.');
      return;
    }
    const chosenResume =
      resumes.find((r) => r.id === selectedResumeId) || resumes[0];
    const ok = await createApplication({
      opportunityId: applyModalOpp.id,
      roleTitle: applyModalOpp.title,
      companyName: applyModalOpp.organizationName,
      applicationMode: 'KAMPUS-Hosted',
      status: 'Applied',
      deadlineISO: applyModalOpp.deadlineISO,
      resumeVersionId: chosenResume?.id,
      resumeVersionName: chosenResume?.versionName,
      personalNotes: applyNote,
      consentConfirmed: true,
    });
    if (ok) {
      setApplyModalOpp(null);
      setConsentChecked(false);
      setApplyNote('');
    }
  };

  const handleLogExternalApplication = async (status: 'Planning to Apply' | 'Applied') => {
    if (!externalModalOpp) return;
    const ok = await createApplication({
      opportunityId: externalModalOpp.id,
      roleTitle: externalModalOpp.title,
      companyName: externalModalOpp.organizationName,
      opportunityLink: externalModalOpp.externalApplyUrl,
      applicationMode: 'External Link',
      status,
      deadlineISO: externalModalOpp.deadlineISO,
      consentConfirmed: true,
    });
    if (ok) setExternalModalOpp(null);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    const ok = await submitSafetyReport({
      targetType: reportTarget.type,
      targetId: reportTarget.id,
      targetTitle: reportTarget.title,
      reason: reportReason,
      details: reportDetails,
    });
    if (ok) {
      setReportTarget(null);
      setReportDetails('');
    }
  };

  const activeOpp = selectedOpportunity;
  const activeOrg = activeOpp
    ? organizations.find((o) => o.id === activeOpp.organizationId) || null
    : null;
  const existingAppForActive = activeOpp
    ? applications.find((a) => a.opportunityId === activeOpp.id && !a.archived && a.status !== 'Withdrawn')
    : undefined;

  return (
    <div className="space-y-6">
      {/* Search & Multi-Facet Filter Bar */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center bg-[#F8FAFC] dark:bg-slate-800 rounded-xl px-3.5 py-2.5 border border-slate-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search role title, required skill, organization, or education requirement..."
              className="w-full text-sm bg-transparent text-[#172033] dark:text-slate-100 focus:outline-hidden"
            />
          </div>
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filter location..."
            className="w-full md:w-48 px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-[#172033] dark:text-slate-100 focus:outline-hidden"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-[#172033] dark:text-slate-100"
          >
            <option value="Relevant">Sort: Most Relevant</option>
            <option value="Recent">Sort: Recently Added</option>
            <option value="DeadlineSoon">Sort: Deadline Approaching</option>
            <option value="SavedFirst">Sort: Saved First</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Opportunity Type"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="All">All 10 Types</option>
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Job Category"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="All">All 15 Categories</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={workFormatFilter}
            onChange={(e) => setWorkFormatFilter(e.target.value)}
            aria-label="Work Mode"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="All">Remote / Hybrid / Onsite</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Onsite">Onsite</option>
          </select>

          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            aria-label="Experience Level"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="All">Any Experience Level</option>
            <option value="Fresher / Student">Fresher / Student</option>
            <option value="0-1 Years">0-1 Years</option>
            <option value="1-2 Years">1-2 Years</option>
            <option value="Research Track">Research Track</option>
          </select>

          <select
            value={paidFilter}
            onChange={(e) => setPaidFilter(e.target.value as any)}
            aria-label="Compensation Filter"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="All">Paid & Unpaid</option>
            <option value="Paid">Paid / Stipend Listed</option>
            <option value="Unpaid">Unpaid / Volunteer / Unspecified</option>
          </select>

          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            aria-label="Organization Filter"
            className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
          >
            <option value="All">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory + Split Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Listings List */}
        <div className={`${activeOpp ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
          <div className="text-xs font-semibold text-[#64748B] dark:text-slate-400">
            Showing {filteredOpportunities.length} opportunities
          </div>
          {filteredOpportunities.length === 0 ? (
            <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <p className="text-sm font-semibold text-[#172033] dark:text-slate-100">
                No opportunities match your active filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  onSearchQueryChange('');
                  setTypeFilter('All');
                  setCategoryFilter('All');
                  setWorkFormatFilter('All');
                  setExperienceFilter('All');
                  setPaidFilter('All');
                  setLocationFilter('');
                  setOrgFilter('All');
                }}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className={`grid gap-3 ${activeOpp ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {filteredOpportunities.map((opp) => {
                const isSelected = activeOpp?.id === opp.id;
                const isSaved = savedOpportunityIds.includes(opp.id);
                return (
                  <div
                    key={opp.id}
                    onClick={() => handleOpenDetail(opp)}
                    className={`p-4 rounded-xl border transition-colors cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-[#2563EB]'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-[#2563EB]">
                        {opp.opportunityType} · {opp.category} · {opp.workFormat}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleSaveOpportunity(opp.id);
                        }}
                        aria-label="Save listing"
                        className={`p-1 rounded-md cursor-pointer ${
                          isSaved ? 'text-[#F97316]' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                      {opp.title}
                    </h4>

                    <div className="text-xs text-[#64748B] dark:text-slate-400">
                      {opp.organizationName} ·{' '}
                      {opp.organizationVerified ? 'Verified Organization' : 'Unverified Listing Source'}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {opp.location}
                      </span>
                      <span className="tabular-nums">Deadline: {formatShortDate(opp.deadlineISO)}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {opp.listingSource} · {opp.applicationMode}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Opportunity Detail Page Panel */}
        {activeOpp && (
          <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#2563EB]">
                  {activeOpp.opportunityType} · {activeOpp.category} · {activeOpp.workFormat}
                </div>
                <h3 className="text-xl font-bold text-[#172033] dark:text-slate-100">
                  {activeOpp.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => activeOrg && setInspectOrg(activeOrg)}
                    className="inline-flex items-center gap-1 font-semibold text-[#172033] dark:text-slate-200 hover:text-[#2563EB] hover:underline cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{activeOpp.organizationName}</span>
                  </button>
                  <span>·</span>
                  <span className={activeOpp.organizationVerified ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                    {activeOpp.organizationVerified ? 'Verified Organization' : 'Unverified Listing Source'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectOpportunity(null)}
                aria-label="Close opportunity detail"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Facts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60">
                <div className="text-[#64748B] dark:text-slate-400">Location</div>
                <div className="font-semibold text-[#172033] dark:text-slate-100 mt-0.5">
                  {activeOpp.location}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60">
                <div className="text-[#64748B] dark:text-slate-400">Experience Level</div>
                <div className="font-semibold text-[#172033] dark:text-slate-100 mt-0.5">
                  {activeOpp.experienceLevel}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60">
                <div className="text-[#64748B] dark:text-slate-400">Deadline</div>
                <div className="font-semibold tabular-nums text-[#172033] dark:text-slate-100 mt-0.5">
                  {formatShortDate(activeOpp.deadlineISO)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60">
                <div className="text-[#64748B] dark:text-slate-400">Published</div>
                <div className="font-semibold tabular-nums text-[#172033] dark:text-slate-100 mt-0.5">
                  {formatShortDate(activeOpp.publishedAtISO)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800/60 col-span-2">
                <div className="text-[#64748B] dark:text-slate-400">Compensation / Source</div>
                <div className="font-semibold text-[#172033] dark:text-slate-100 mt-0.5">
                  {activeOpp.compensationLabel} · {activeOpp.listingSource}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {existingAppForActive ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tracked in Applications ({existingAppForActive.status})</span>
                </div>
              ) : activeOpp.applicationMode === 'KAMPUS-Hosted' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResumeId(resumes[0]?.id || '');
                    setApplyModalOpp(activeOpp);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Apply via KAMPUS (Consent Required)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setExternalModalOpp(activeOpp)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open External Application</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void toggleSaveOpportunity(activeOpp.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 text-xs font-semibold text-[#172033] dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{savedOpportunityIds.includes(activeOpp.id) ? 'Saved' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleShareOpportunity(activeOpp)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 text-xs font-semibold text-[#172033] dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  void markNotInterested(activeOpp.id);
                  onSelectOpportunity(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Not Interested</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setReportTarget({
                    type: 'opportunity',
                    id: activeOpp.id,
                    title: activeOpp.title,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Listing</span>
              </button>
            </div>

            {/* Sections A through I */}
            <div className="space-y-4 text-sm text-[#172033] dark:text-slate-200 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">
                  A. About Organization
                </h4>
                <p className="text-xs leading-relaxed text-[#64748B] dark:text-slate-300">
                  {activeOpp.aboutOrganization}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">
                  B. Role Description
                </h4>
                <p className="text-xs leading-relaxed text-[#64748B] dark:text-slate-300">
                  {activeOpp.roleDescription}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">
                  C. Key Responsibilities
                </h4>
                <ul className="list-disc pl-5 text-xs space-y-1 text-[#64748B] dark:text-slate-300">
                  {activeOpp.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">
                  D. Qualifications & Education
                </h4>
                <p className="text-xs text-[#172033] dark:text-slate-200 font-medium mb-1">
                  {activeOpp.educationRequirement}
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 text-[#64748B] dark:text-slate-300">
                  {activeOpp.qualifications.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">
                    E. Required Skills
                  </h4>
                  <p className="text-xs text-[#172033] dark:text-slate-200">
                    {activeOpp.requiredSkills.join(', ') || 'None specified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">
                    F. Preferred Skills
                  </h4>
                  <p className="text-xs text-[#64748B] dark:text-slate-300">
                    {activeOpp.preferredSkills.join(', ') || 'None specified'}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">
                  G. Benefits & Terms
                </h4>
                <ul className="list-disc pl-5 text-xs space-y-1 text-[#64748B] dark:text-slate-300">
                  {activeOpp.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">
                  H. Application Process
                </h4>
                <ul className="list-disc pl-5 text-xs space-y-1 text-[#64748B] dark:text-slate-300">
                  {activeOpp.applicationProcess.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B] mb-1">
                  I. Important Dates
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] dark:text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>{activeOpp.importantDates.join(' · ')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Organization Profile Modal */}
      {inspectOrg && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-[#2563EB]">
                  {inspectOrg.verificationStatus}
                </div>
                <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100 mt-0.5">
                  {inspectOrg.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectOrg(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-[#64748B] dark:text-slate-400 space-y-1">
              <div>Industry: {inspectOrg.industry}</div>
              <div>Location: {inspectOrg.location}</div>
              {isSafeHttpUrl(inspectOrg.website) && (
                <div>
                  Website:{' '}
                  <a
                    href={inspectOrg.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:underline"
                  >
                    {inspectOrg.website}
                  </a>
                </div>
              )}
            </div>
            <p className="text-xs leading-relaxed text-[#172033] dark:text-slate-200">
              {inspectOrg.description}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setReportTarget({
                    type: 'organization',
                    id: inspectOrg.id,
                    title: inspectOrg.name,
                  });
                  setInspectOrg(null);
                }}
                className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Report Organization
              </button>
              <button
                type="button"
                onClick={() => setInspectOrg(null)}
                className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KAMPUS-Hosted Application Modal */}
      {applyModalOpp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void handleConfirmHostedApply(e)}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold text-[#2563EB]">
                  KAMPUS-Hosted Application
                </div>
                <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100">
                  {applyModalOpp.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalOpp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200">
                Select Resume Version to Attach
              </label>
              <select
                value={selectedResumeId || resumes[0]?.id || ''}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.versionName} ({r.templateId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200">
                Optional Note / Availability
              </label>
              <textarea
                rows={3}
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                placeholder="Briefly state your interest or portfolio link..."
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I explicitly consent to share my selected KAMPUS Resume and application details with{' '}
                <strong>{applyModalOpp.organizationName}</strong>. KAMPUS does not auto-submit resumes without approval.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApplyModalOpp(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!consentChecked}
                className="px-4 py-2 rounded-xl bg-[#2563EB] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* External Application Portal Warning Modal */}
      {externalModalOpp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  External Portal Notice
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExternalModalOpp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-[#172033] dark:text-slate-100">
              {externalModalOpp.title}
            </h3>
            <p className="text-xs leading-relaxed text-[#64748B] dark:text-slate-300">
              This opportunity is hosted outside KAMPUS. KAMPUS does not auto-submit applications on
              external portals, nor should you ever pay fees or share bank OTPs. After visiting the
              official portal, log your status manually in Application Tracker.
            </p>
            {isSafeHttpUrl(externalModalOpp.externalApplyUrl) && externalModalOpp.externalApplyUrl ? (
              <a
                href={externalModalOpp.externalApplyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit Official External Portal ({externalModalOpp.externalApplyUrl})</span>
              </a>
            ) : (
              <div className="text-xs text-rose-600">External URL unavailable or invalid.</div>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => void handleLogExternalApplication('Planning to Apply')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Save as Planning to Apply
              </button>
              <button
                type="button"
                onClick={() => void handleLogExternalApplication('Applied')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                Mark Externally Applied
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void handleReportSubmit(e)}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-base font-bold">Report Unsafe or Misleading Listing</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-[#64748B] dark:text-slate-400">
              Reporting: <strong>{reportTarget.title}</strong>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              >
                {CAREER_REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold">Details for Moderation Team</label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe what happened (e.g., requested registration fee, broken link)..."
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
