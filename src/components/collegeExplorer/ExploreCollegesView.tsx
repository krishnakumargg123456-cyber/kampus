import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Filter,
  GitCompare,
  ListChecks,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useCollegeExplorer } from '../../context/CollegeExplorerContext';
import {
  ALL_ADMISSION_STATUSES,
  ALL_COLLEGE_TYPES,
  ALL_DEGREE_LEVELS,
  formatExplorerDate,
  formatINR,
  resolveCollegePhoto,
} from '../../data/collegeExplorerData';
import type { CollegeType } from '../../types/collegeExplorer';

interface ExploreCollegesViewProps {
  initialFilters?: { query?: string; state?: string; city?: string; type?: CollegeType };
  onOpenCollegeDetail: (collegeId: string) => void;
}

type SortKey = 'relevance' | 'name-asc' | 'fees-asc' | 'fees-desc' | 'recently-updated';

export const ExploreCollegesView: React.FC<ExploreCollegesViewProps> = ({
  initialFilters,
  onOpenCollegeDetail,
}) => {
  const {
    colleges,
    savedColleges,
    compareIds,
    saveOrUpdateShortlist,
    toggleCompareCollege,
    addToAdmissionTracker,
  } = useCollegeExplorer();

  const [query, setQuery] = useState(initialFilters?.query || '');
  const [stateFilter, setStateFilter] = useState(initialFilters?.state || 'all');
  const [cityFilter, setCityFilter] = useState(initialFilters?.city || 'all');
  const [typeFilter, setTypeFilter] = useState<string>(initialFilters?.type || 'all');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [maxAnnualFee, setMaxAnnualFee] = useState<string>('any');
  const [hostelOnly, setHostelOnly] = useState(false);
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [accreditationFilter, setAccreditationFilter] = useState('all');
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('relevance');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  useEffect(() => {
    if (!initialFilters) return;
    if (initialFilters.query !== undefined) setQuery(initialFilters.query);
    if (initialFilters.state !== undefined) setStateFilter(initialFilters.state);
    if (initialFilters.city !== undefined) setCityFilter(initialFilters.city);
    if (initialFilters.type !== undefined) setTypeFilter(initialFilters.type);
  }, [initialFilters]);

  const filterOptions = useMemo(() => {
    const states = Array.from(new Set(colleges.map((c) => c.state))).sort();
    const cities = Array.from(
      new Set(
        colleges
          .filter((c) => stateFilter === 'all' || c.state === stateFilter)
          .map((c) => c.city)
      )
    ).sort();
    const universities = Array.from(new Set(colleges.map((c) => c.affiliatedUniversity))).sort();
    const courses = Array.from(
      new Set(colleges.flatMap((c) => c.courses.map((cr) => cr.name)))
    ).sort();
    const streams = Array.from(
      new Set(colleges.flatMap((c) => c.courses.map((cr) => cr.stream)))
    ).sort();
    const exams = Array.from(new Set(colleges.flatMap((c) => c.entranceExams))).sort();
    const accreditations = Array.from(new Set(colleges.map((c) => c.accreditation))).sort();
    return { states, cities, universities, courses, streams, exams, accreditations };
  }, [colleges, stateFilter]);

  const resetAllFilters = () => {
    setQuery('');
    setStateFilter('all');
    setCityFilter('all');
    setTypeFilter('all');
    setUniversityFilter('all');
    setCourseFilter('all');
    setDegreeFilter('all');
    setStreamFilter('all');
    setExamFilter('all');
    setMaxAnnualFee('any');
    setHostelOnly(false);
    setScholarshipOnly(false);
    setAccreditationFilter('all');
    setAdmissionStatusFilter('all');
    setSortBy('relevance');
  };

  const filteredColleges = useMemo(() => {
    const q = query.trim().toLowerCase();
    const feeCeiling = maxAnnualFee === 'any' ? null : Number(maxAnnualFee);

    const matched = colleges.filter((c) => {
      if (q) {
        const hay = [
          c.name,
          c.shortName,
          c.city,
          c.state,
          c.affiliatedUniversity,
          c.primaryCategory,
          c.collegeTypes.join(' '),
          c.entranceExams.join(' '),
          c.courses.map((cr) => `${cr.name} ${cr.degreeShort} ${cr.stream}`).join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (stateFilter !== 'all' && c.state !== stateFilter) return false;
      if (cityFilter !== 'all' && c.city !== cityFilter) return false;
      if (
        typeFilter !== 'all' &&
        c.primaryCategory !== typeFilter &&
        !c.collegeTypes.includes(typeFilter as CollegeType)
      ) {
        return false;
      }
      if (universityFilter !== 'all' && c.affiliatedUniversity !== universityFilter) return false;
      if (courseFilter !== 'all' && !c.courses.some((cr) => cr.name === courseFilter)) return false;
      if (degreeFilter !== 'all' && !c.courses.some((cr) => cr.degreeType === degreeFilter))
        return false;
      if (streamFilter !== 'all' && !c.courses.some((cr) => cr.stream === streamFilter))
        return false;
      if (
        examFilter !== 'all' &&
        !c.entranceExams.includes(examFilter) &&
        !c.courses.some((cr) => cr.entranceExams.includes(examFilter))
      ) {
        return false;
      }
      if (feeCeiling !== null) {
        const minFee = c.feeInfo.minAnnualTuitionINR;
        if (minFee === null || minFee > feeCeiling) return false;
      }
      if (hostelOnly && !c.facilities.hostel) return false;
      if (scholarshipOnly && !c.scholarshipAvailable) return false;
      if (accreditationFilter !== 'all' && c.accreditation !== accreditationFilter) return false;
      if (admissionStatusFilter !== 'all' && c.admissionStatus !== admissionStatusFilter)
        return false;

      return true;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'fees-asc') {
        const fa = a.feeInfo.minAnnualTuitionINR ?? Number.MAX_SAFE_INTEGER;
        const fb = b.feeInfo.minAnnualTuitionINR ?? Number.MAX_SAFE_INTEGER;
        return fa - fb;
      }
      if (sortBy === 'fees-desc') {
        const fa = a.feeInfo.maxAnnualTuitionINR ?? a.feeInfo.minAnnualTuitionINR ?? -1;
        const fb = b.feeInfo.maxAnnualTuitionINR ?? b.feeInfo.minAnnualTuitionINR ?? -1;
        return fb - fa;
      }
      if (sortBy === 'recently-updated') {
        return String(b.lastUpdatedISO).localeCompare(String(a.lastUpdatedISO));
      }
      // Relevance: featured & query match priority
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [
    colleges,
    query,
    stateFilter,
    cityFilter,
    typeFilter,
    universityFilter,
    courseFilter,
    degreeFilter,
    streamFilter,
    examFilter,
    maxAnnualFee,
    hostelOnly,
    scholarshipOnly,
    accreditationFilter,
    admissionStatusFilter,
    sortBy,
  ]);

  return (
    <div className="space-y-6">
      {/* Search, Sort & Filter Toolbar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by college, university, course, entrance exam, or city..."
              className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort colleges"
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="name-asc">Sort: Name (A–Z)</option>
              <option value="fees-asc">Sort: Fees (Low to High)</option>
              <option value="fees-desc">Sort: Fees (High to Low)</option>
              <option value="recently-updated">Sort: Recently Updated</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>{showAdvancedFilters ? 'Hide Filters' : 'Show All 13 Filters'}</span>
            </button>

            <button
              type="button"
              onClick={resetAllFilters}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* All 13 Filter Dimensions */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">1. State</span>
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setCityFilter('all');
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All States</option>
                {filterOptions.states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">2. City</span>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Cities</option>
                {filterOptions.cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">3. College Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All 13 Institution Types</option>
                {ALL_COLLEGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                4. Affiliated University
              </span>
              <select
                value={universityFilter}
                onChange={(e) => setUniversityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Affiliations</option>
                {filterOptions.universities.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">5. Course</span>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Courses</option>
                {filterOptions.courses.map((cr) => (
                  <option key={cr} value={cr}>
                    {cr}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">6. Degree Level</span>
              <select
                value={degreeFilter}
                onChange={(e) => setDegreeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Degree Levels</option>
                {ALL_DEGREE_LEVELS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">7. Stream</span>
              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Academic Streams</option>
                {filterOptions.streams.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                8. Entrance Exam
              </span>
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">Any Entrance Exam</option>
                {filterOptions.exams.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                9. Annual Tuition Cap
              </span>
              <select
                value={maxAnnualFee}
                onChange={(e) => setMaxAnnualFee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="any">Any Annual Tuition Fee</option>
                <option value="50000">Up to ₹50,000 / year</option>
                <option value="150000">Up to ₹1,50,000 / year</option>
                <option value="300000">Up to ₹3,00,000 / year</option>
                <option value="600000">Up to ₹6,00,000 / year</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                10. Accreditation
              </span>
              <select
                value={accreditationFilter}
                onChange={(e) => setAccreditationFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Accreditations</option>
                {filterOptions.accreditations.map((ac) => (
                  <option key={ac} value={ac}>
                    {ac}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                11. Admission Status
              </span>
              <select
                value={admissionStatusFilter}
                onChange={(e) => setAdmissionStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="all">All Admission Statuses</option>
                {ALL_ADMISSION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hostelOnly}
                  onChange={(e) => setHostelOnly(e.target.checked)}
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  12. Hostel Available
                </span>
              </label>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scholarshipOnly}
                  onChange={(e) => setScholarshipOnly(e.target.checked)}
                />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  13. Scholarship Support
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
          Showing {filteredColleges.length} of {colleges.length} cataloged institutions
        </span>
        <span className="inline-flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Click any institution for full fee, admission & placement disclosure</span>
        </span>
      </div>

      {/* Results List */}
      {filteredColleges.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
          <p className="text-base font-bold text-slate-900 dark:text-slate-100">
            No institutions match your active filters
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Try widening your tuition fee ceiling or clearing one of the course/city constraints.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredColleges.map((col) => {
            const saved = savedColleges.some((s) => s.collegeId === col.id);
            const compared = compareIds.includes(col.id);
            return (
              <article
                key={col.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row"
              >
                <div className="md:w-64 h-44 md:h-auto shrink-0 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={resolveCollegePhoto(col.photoKey)}
                    alt={col.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {col.collegeTypes.join(' · ')}
                      </span>
                      <span className="tabular-nums">
                        {col.dataVerificationStatus} · Updated {formatExplorerDate(col.lastUpdatedISO)}
                      </span>
                    </div>

                    <h3
                      onClick={() => onOpenCollegeDetail(col.id)}
                      className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 cursor-pointer hover:text-blue-600"
                    >
                      {col.name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {col.city}, {col.state}
                      </span>
                      <span>Affiliation: {col.affiliatedUniversity}</span>
                      <span>Est. {col.establishmentYear}</span>
                    </p>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed line-clamp-2">
                      {col.overview}
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block">Annual Tuition</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {col.feeInfo.minAnnualTuitionINR !== null
                            ? `From ${formatINR(col.feeInfo.minAnnualTuitionINR)}`
                            : col.feeInfo.tuitionRangeLabel}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Admission Status</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {col.admissionStatus}{' '}
                          {col.nextDeadlineISO
                            ? `(${formatExplorerDate(col.nextDeadlineISO)})`
                            : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Placement Avg</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                          {col.placementInfo.averagePackageLabel || 'Not published'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenCollegeDetail(col.id)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                      >
                        Open College Profile
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          addToAdmissionTracker({
                            collegeId: col.id,
                            courseName: col.courses[0]?.name,
                          })
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Track Admission</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCompareCollege(col.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 ${
                          compared
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>{compared ? 'Comparing' : 'Compare'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          saveOrUpdateShortlist({
                            collegeId: col.id,
                            action: saved ? 'remove' : 'save',
                            collectionName: 'Target List',
                          })
                        }
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 ${
                          saved
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {saved ? (
                          <BookmarkCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                        <span>{saved ? 'Saved' : 'Shortlist'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
