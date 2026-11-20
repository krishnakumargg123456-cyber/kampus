import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Bell,
  Bookmark,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCareer } from '../../context/CareerContext';
import {
  CAREER_LEARNING_RESOURCES,
  CAREER_MEDIA,
  JOB_CATEGORIES,
  OPPORTUNITY_TYPES,
  formatShortDate,
  isSafeHttpUrl,
} from '../../data/careerData';
import type {
  CareerOpportunity,
  CareerPreferences,
  ExperienceLevel,
  JobCategory,
  OpportunityType,
  WorkFormat,
} from '../../types/career';

interface LearningViewProps {
  onOpenAiCareerModal: () => void;
}

export const LearningScholarshipsEventsView: React.FC<LearningViewProps> = ({
  onOpenAiCareerModal,
}) => {
  const navigate = useNavigate();
  const {
    scholarships,
    learningProgress,
    crossModule,
    toggleLearningResource,
  } = useCareer();

  const [subTab, setSubTab] = useState<'learning' | 'scholarships' | 'events'>('learning');
  const [topicFilter, setTopicFilter] = useState<string>('All');
  const [programTypeFilter, setProgramTypeFilter] = useState<string>('All');

  const filteredResources =
    topicFilter === 'All'
      ? CAREER_LEARNING_RESOURCES
      : CAREER_LEARNING_RESOURCES.filter((r) => r.category === topicFilter);

  const filteredScholarships =
    programTypeFilter === 'All'
      ? scholarships
      : scholarships.filter((s) => s.programType === programTypeFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Learning Hub, Scholarships & Career Events
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Workplace readiness guides, verified scholarship & fellowship directories, and live Events & Clubs sync.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('learning')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              subTab === 'learning' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Learning Hub ({CAREER_LEARNING_RESOURCES.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('scholarships')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              subTab === 'scholarships' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Scholarships & Grants ({scholarships.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('events')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer ${
              subTab === 'events' ? 'bg-white dark:bg-slate-900 text-[#2563EB]' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Career Events ({crossModule.careerEvents.length})
          </button>
        </div>
      </div>

      {subTab === 'learning' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="All">All 10 Career Topics</option>
                {CAREER_LEARNING_RESOURCES.map((r) => (
                  <option key={r.id} value={r.category}>
                    {r.category}
                  </option>
                ))}
              </select>
              <span className="text-[#64748B] tabular-nums">
                Completed: {learningProgress.completedIds.length}/{CAREER_LEARNING_RESOURCES.length} · Bookmarked: {learningProgress.bookmarkedIds.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/learn/study-hub')}
                className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer"
              >
                Open Study Hub
              </button>
              <button
                type="button"
                onClick={onOpenAiCareerModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2563EB] text-white font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask KAMPUS AI</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map((res) => {
              const isDone = learningProgress.completedIds.includes(res.id);
              const isSaved = learningProgress.bookmarkedIds.includes(res.id);
              return (
                <div
                  key={res.id}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-semibold text-[#2563EB]">
                      {res.category} · {res.estimatedMinutes} min read
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void toggleLearningResource(res.id, 'bookmark')}
                        className={`p-1 rounded cursor-pointer ${
                          isSaved ? 'text-[#F97316]' : 'text-slate-400'
                        }`}
                        aria-label="Bookmark resource"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleLearningResource(res.id, 'complete')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          isDone
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                    {res.title}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400">{res.summary}</p>
                  <ul className="list-disc pl-4 text-xs text-[#64748B] dark:text-slate-300 space-y-1">
                    {res.keyTakeaways.map((kt, idx) => (
                      <li key={idx}>{kt}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'scholarships' && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#172554] text-white">
            <img
              src={CAREER_MEDIA.scholarship}
              alt="Student scholarship and academic fellowship showcase"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
            <div className="relative z-10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <Award className="w-4 h-4" />
                  <span>Scholarships, Fellowships & Career Programs</span>
                </div>
                <h3 className="text-xl font-bold">Official Source & Sample Program Directory</h3>
                <p className="text-xs text-slate-200">
                  Eligibility and award terms are governed strictly by each official sponsor portal. Check last-updated dates directly.
                </p>
              </div>
              <select
                value={programTypeFilter}
                onChange={(e) => setProgramTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold"
              >
                <option value="All">All 7 Program Types</option>
                {[
                  'Scholarship',
                  'Fellowship',
                  'Research Program',
                  'Graduate Program',
                  'Training Program',
                  'Professional Development',
                  'Career Workshop',
                ].map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredScholarships.map((sc) => (
              <div
                key={sc.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#2563EB]">{sc.programType}</span>
                    <span>·</span>
                    <span className="text-[#64748B] dark:text-slate-400">
                      {sc.isSampleListing ? 'Sample Program Listing' : `Official Source: ${sc.officialSourceName}`}
                    </span>
                    <span>·</span>
                    <span className="tabular-nums text-[#64748B]">
                      Last Updated: {formatShortDate(sc.lastUpdatedISO)}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#172033] dark:text-slate-100">
                    {sc.title}
                  </h4>
                  <div className="text-xs text-[#64748B] dark:text-slate-400">
                    Sponsor: {sc.organization} · Deadline: {formatShortDate(sc.deadlineISO)}
                  </div>
                  <div className="text-xs text-[#172033] dark:text-slate-200">
                    <strong>Eligibility:</strong> {sc.eligibility}
                  </div>
                  <div className="text-xs text-[#64748B] dark:text-slate-300">
                    <strong>Benefits & Requirements:</strong> {sc.benefits} ({sc.requirements.join(', ')})
                  </div>
                </div>
                {isSafeHttpUrl(sc.officialSourceUrl) && (
                  <a
                    href={sc.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Official Source</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'events' && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                Career Events & Placement Activities
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Live read from KAMPUS Events & Clubs — registrations and event attendance remain unified inside Events & Clubs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/campus/events-clubs')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Open Events & Clubs</span>
            </button>
          </div>

          {crossModule.careerEvents.length === 0 ? (
            <p className="text-xs text-[#64748B]">
              No career workshops, placement talks, or hackathons are currently listed in Events & Clubs.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {crossModule.careerEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5"
                >
                  <div className="text-xs font-semibold text-[#2563EB]">
                    {ev.category} · {ev.subType}
                  </div>
                  <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
                    {ev.title}
                  </div>
                  <div className="text-xs text-[#64748B] dark:text-slate-400">
                    {formatShortDate(ev.startDateISO)} · {ev.startTime} · {ev.venue}
                  </div>
                  <div className="text-xs text-[#64748B] dark:text-slate-400">
                    Organizer: {ev.organizerName}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/campus/events-clubs')}
                    className="text-xs font-semibold text-[#2563EB] hover:underline pt-1 cursor-pointer"
                  >
                    View / Register in Events & Clubs
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ProfileSavedProps {
  onOpenOpportunity: (opp: CareerOpportunity) => void;
}

export const CareerProfileAndAlertsView: React.FC<ProfileSavedProps> = ({ onOpenOpportunity }) => {
  const { profile } = useAuth();
  const {
    preferences,
    opportunities,
    savedOpportunityIds,
    savePreferences,
    manageAlert,
    toggleSaveOpportunity,
  } = useCareer();

  const [prefDraft, setPrefDraft] = useState<CareerPreferences | null>(preferences);
  const [alertKeyword, setAlertKeyword] = useState('');
  const [alertIndustry, setAlertIndustry] = useState('All');
  const [alertFormat, setAlertFormat] = useState('All');
  const [alertType, setAlertType] = useState('All');

  useEffect(() => {
    if (preferences) setPrefDraft(JSON.parse(JSON.stringify(preferences)));
  }, [preferences]);

  const savedOpps = opportunities.filter((o) => savedOpportunityIds.includes(o.id));

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await manageAlert({
      alert: {
        roleKeyword: alertKeyword.trim() || 'Internship / Graduate Role',
        industry: alertIndustry,
        workFormat: alertFormat,
        opportunityType: alertType,
        deadlineWithinDays: 14,
      },
    });
    if (ok) setAlertKeyword('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Career Profile Settings */}
      <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
              Career Profile ({profile.name})
            </h3>
            <p className="text-[#64748B] dark:text-slate-400">
              Syncs with your existing KAMPUS Student Profile — no duplicate accounts created.
            </p>
          </div>
          {prefDraft && (
            <button
              type="button"
              onClick={() => void savePreferences(prefDraft)}
              className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
            >
              Save Profile
            </button>
          )}
        </div>

        {prefDraft && (
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="font-semibold">Career Interests (comma separated)</span>
              <input
                value={prefDraft.interests.join(', ')}
                onChange={(e) =>
                  setPrefDraft({
                    ...prefDraft,
                    interests: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Preferred Industries</span>
              <input
                value={prefDraft.preferredIndustries.join(', ')}
                onChange={(e) =>
                  setPrefDraft({
                    ...prefDraft,
                    preferredIndustries: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Target Roles</span>
              <input
                value={prefDraft.targetRoles.join(', ')}
                onChange={(e) =>
                  setPrefDraft({
                    ...prefDraft,
                    targetRoles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Verified Skills</span>
              <input
                value={prefDraft.skills.join(', ')}
                onChange={(e) =>
                  setPrefDraft({
                    ...prefDraft,
                    skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Learning Goals</span>
              <input
                value={prefDraft.learningGoals.join(', ')}
                onChange={(e) =>
                  setPrefDraft({
                    ...prefDraft,
                    learningGoals: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-semibold">Recruiter Visibility Control</span>
              <select
                value={prefDraft.visibilityToRecruiters}
                onChange={(e) =>
                  setPrefDraft({
                    ...prefDraft,
                    visibilityToRecruiters: e.target.value as CareerPreferences['visibilityToRecruiters'],
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="With Consent Only">With Consent Only (When I Apply)</option>
                <option value="Private">Strictly Private</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Saved Opportunities & Career Alerts */}
      <div className="lg:col-span-6 space-y-5 text-xs">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
              Career Alerts (Notification Center Connected)
            </h3>
          </div>
          <form onSubmit={(e) => void handleCreateAlert(e)} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={alertKeyword}
              onChange={(e) => setAlertKeyword(e.target.value)}
              placeholder="Role keyword (e.g., Frontend, Analyst)"
              className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <select
              value={alertIndustry}
              onChange={(e) => setAlertIndustry(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="All">All Categories</option>
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="All">All Opportunity Types</option>
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={alertFormat}
              onChange={(e) => setAlertFormat(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="All">Remote / Hybrid / Onsite</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
            <button
              type="submit"
              className="sm:col-span-2 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
            >
              Create Career Alert
            </button>
          </form>

          {(preferences?.alerts || []).length > 0 && (
            <div className="space-y-2 pt-2">
              {preferences?.alerts.map((al) => (
                <div
                  key={al.id}
                  className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold">{al.roleKeyword}</span> · {al.industry} · {al.workFormat}
                  </div>
                  <button
                    type="button"
                    onClick={() => void manageAlert({ deleteAlertId: al.id })}
                    className="text-rose-500 cursor-pointer"
                    aria-label="Delete alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
            Saved Opportunities ({savedOpps.length})
          </h3>
          {savedOpps.length === 0 ? (
            <p className="text-[#64748B]">Bookmark opportunities while browsing to review them here.</p>
          ) : (
            <div className="space-y-2">
              {savedOpps.map((opp) => (
                <div
                  key={opp.id}
                  className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => onOpenOpportunity(opp)}
                    className="text-left hover:underline cursor-pointer"
                  >
                    <div className="font-bold text-[#172033] dark:text-slate-100">{opp.title}</div>
                    <div className="text-[#64748B]">
                      {opp.organizationName} · Due {formatShortDate(opp.deadlineISO)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleSaveOpportunity(opp.id)}
                    className="text-rose-500 font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RecruiterAndAdminPortalView: React.FC = () => {
  const {
    roleInfo,
    organizations,
    opportunities,
    applications,
    reports,
    switchRoleSession,
    createOrganization,
    publishOpportunity,
    moderateOpportunity,
    reviewReport,
  } = useCareer();

  const [passkey, setPasskey] = useState('');

  // Create Organization Form
  const [orgName, setOrgName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('Technology');
  const [orgLocation, setOrgLocation] = useState('Remote');
  const [orgWebsite, setOrgWebsite] = useState('https://');
  const [orgDesc, setOrgDesc] = useState('');

  // Publish Opportunity Form
  const [title, setTitle] = useState('');
  const [orgId, setOrgId] = useState(organizations[0]?.id || 'org_kampus_cell');
  const [oppType, setOppType] = useState<OpportunityType>('Internship');
  const [category, setCategory] = useState<JobCategory>('Software Development');
  const [workFormat, setWorkFormat] = useState<WorkFormat>('Hybrid');
  const [expLevel, setExpLevel] = useState<ExperienceLevel>('Fresher / Student');
  const [location, setLocation] = useState('Bengaluru / Hybrid');
  const [skillsCsv, setSkillsCsv] = useState('TypeScript, SQL');
  const [compLabel, setCompLabel] = useState('Disclosed in official offer terms');
  const [roleDesc, setRoleDesc] = useState('');
  const [appMode, setAppMode] = useState<'KAMPUS-Hosted' | 'External Link'>('KAMPUS-Hosted');
  const [extUrl, setExtUrl] = useState('');

  const isPrivileged = roleInfo.role !== 'Student';
  const isAdmin = roleInfo.role === 'Platform Admin' || roleInfo.role === 'Career Team';

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const org = organizations.find((o) => o.id === orgId);
    const ok = await publishOpportunity({
      title,
      organizationId: orgId,
      organizationName: org?.name || 'Verified Partner',
      opportunityType: oppType,
      category,
      workFormat,
      experienceLevel: expLevel,
      location,
      requiredSkills: skillsCsv.split(',').map((s) => s.trim()).filter(Boolean),
      isPaid: true,
      compensationLabel: compLabel,
      roleDescription: roleDesc,
      applicationMode: appMode,
      externalApplyUrl: appMode === 'External Link' ? extUrl : undefined,
      responsibilities: ['Contribute to scoped team deliverables and code/design reviews.'],
      qualifications: ['Enrolled college student or recent graduate.'],
      benefits: ['Mentorship & experience letter'],
    });
    if (ok) {
      setTitle('');
      setRoleDesc('');
      setExtUrl('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Authorization Bar */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
            <ShieldCheck className="w-4 h-4" />
            <span>Active Session Role: {roleInfo.role}</span>
          </div>
          <h2 className="text-lg font-bold text-[#172033] dark:text-slate-100">
            Recruiter, Career Cell & Platform Moderation Portal
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Backend RBAC strictly prevents Student sessions from publishing listings or moderating safety reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isPrivileged ? (
            <button
              type="button"
              onClick={() => void switchRoleSession(undefined, true)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Return to Student View
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void switchRoleSession(passkey);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Role passkey..."
                className="px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#172554] text-white text-xs font-semibold cursor-pointer"
              >
                Unlock Role
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Live Genuine Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[#64748B]">Active Listings</div>
          <div className="text-2xl font-bold tabular-nums mt-1">
            {opportunities.filter((o) => o.status === 'Open').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[#64748B]">Organizations</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{organizations.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[#64748B]">Consented Applications Visible</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{applications.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[#64748B]">Safety Reports</div>
          <div className="text-2xl font-bold tabular-nums mt-1">{reports.length}</div>
        </div>
      </div>

      {!isPrivileged ? (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-[#64748B] space-y-1">
          <p className="font-semibold text-[#172033] dark:text-slate-100">
            Student Session — Read-Only View
          </p>
          <p>
            Authorized Career Team, Verified Campus Recruiters, or Platform Admins can sign in above with their issued authorization code (`KMP-RECRUITER-2026`, `KMP-CAREER-TEAM-2026`, or `KMP-CAREER-ADMIN-2026` for staging verification) to publish verified listings and moderate reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Publish Opportunity & Organization */}
          <div className="lg:col-span-6 space-y-5">
            <form
              onSubmit={(e) => void handlePublish(e)}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
                Publish Verified Opportunity Listing
              </h3>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Role title *"
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <select
                  value={oppType}
                  onChange={(e) => setOppType(e.target.value as OpportunityType)}
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {OPPORTUNITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as JobCategory)}
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {JOB_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={workFormat}
                  onChange={(e) => setWorkFormat(e.target.value as WorkFormat)}
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
                <select
                  value={expLevel}
                  onChange={(e) => setExpLevel(e.target.value as ExperienceLevel)}
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Fresher / Student">Fresher / Student</option>
                  <option value="0-1 Years">0-1 Years</option>
                  <option value="1-2 Years">1-2 Years</option>
                  <option value="Research Track">Research Track</option>
                </select>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <input
                value={skillsCsv}
                onChange={(e) => setSkillsCsv(e.target.value)}
                placeholder="Required skills (comma separated)"
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                value={compLabel}
                onChange={(e) => setCompLabel(e.target.value)}
                placeholder="Compensation / Stipend note"
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={appMode}
                  onChange={(e) => setAppMode(e.target.value as 'KAMPUS-Hosted' | 'External Link')}
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="KAMPUS-Hosted">KAMPUS-Hosted Application</option>
                  <option value="External Link">External Link Portal</option>
                </select>
                {appMode === 'External Link' && (
                  <input
                    type="url"
                    required
                    value={extUrl}
                    onChange={(e) => setExtUrl(e.target.value)}
                    placeholder="https://external-portal..."
                    className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                )}
              </div>
              <textarea
                rows={2}
                required
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="Role overview & genuine scope *"
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Listing</span>
              </button>
            </form>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await createOrganization({
                  name: orgName,
                  industry: orgIndustry,
                  location: orgLocation,
                  website: orgWebsite,
                  description: orgDesc,
                });
                if (ok) {
                  setOrgName('');
                  setOrgDesc('');
                }
              }}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
                <span>Add Organization Profile</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Organization name *"
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  value={orgIndustry}
                  onChange={(e) => setOrgIndustry(e.target.value)}
                  placeholder="Industry"
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  value={orgLocation}
                  onChange={(e) => setOrgLocation(e.target.value)}
                  placeholder="Location"
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="url"
                  value={orgWebsite}
                  onChange={(e) => setOrgWebsite(e.target.value)}
                  placeholder="Website URL"
                  className="px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <textarea
                rows={2}
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                placeholder="Organization overview..."
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#172554] text-white font-semibold cursor-pointer"
              >
                Create Organization
              </button>
            </form>
          </div>

          {/* Moderation Queue & Listing Controls */}
          <div className="lg:col-span-6 space-y-5 text-xs">
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Safety & Scam Moderation Reports ({reports.length})</span>
              </div>
              {reports.length === 0 ? (
                <p className="text-[#64748B]">No safety reports submitted.</p>
              ) : (
                <div className="space-y-2.5">
                  {reports.map((rp) => (
                    <div
                      key={rp.id}
                      className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{rp.targetTitle}</span>
                        <span className={rp.status === 'Reviewed' ? 'text-emerald-600' : 'text-amber-600'}>
                          {rp.status}
                        </span>
                      </div>
                      <div className="text-rose-600 font-semibold">{rp.reason}</div>
                      {rp.details && <p className="text-[#64748B] dark:text-slate-300">{rp.details}</p>}
                      {isAdmin && rp.status !== 'Reviewed' && (
                        <button
                          type="button"
                          onClick={() => void reviewReport(rp.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-semibold cursor-pointer"
                        >
                          Mark Reviewed
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-[#172033] dark:text-slate-100">
                Manage Published Listings
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {opportunities.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-[#172033] dark:text-slate-100">{o.title}</div>
                      <div className="text-[#64748B]">
                        {o.organizationName} · Status: {o.status}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {o.status !== 'Closed' && (
                        <button
                          type="button"
                          onClick={() => void moderateOpportunity(o.id, 'Closed')}
                          className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 font-semibold cursor-pointer"
                        >
                          Close
                        </button>
                      )}
                      {isAdmin && o.status !== 'Removed' && (
                        <button
                          type="button"
                          onClick={() => void moderateOpportunity(o.id, 'Removed')}
                          className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
