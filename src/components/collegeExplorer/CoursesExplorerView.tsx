import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, GitCompare, GraduationCap, Search } from 'lucide-react';
import { useCollegeExplorer } from '../../context/CollegeExplorerContext';
import { ALL_DEGREE_LEVELS, formatINR } from '../../data/collegeExplorerData';

interface CoursesExplorerViewProps {
  onOpenCollegeDetail: (collegeId: string) => void;
}

export const CoursesExplorerView: React.FC<CoursesExplorerViewProps> = ({
  onOpenCollegeDetail,
}) => {
  const { courses, colleges, showToast } = useCollegeExplorer();
  const [search, setSearch] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [activeCourseId, setActiveCourseId] = useState<string>(courses[0]?.id || '');
  const [compareCourseIds, setCompareCourseIds] = useState<string[]>(() =>
    courses.slice(0, 2).map((c) => c.id)
  );
  const [showComparePanel, setShowComparePanel] = useState(false);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (degreeFilter !== 'all' && c.degreeType !== degreeFilter) return false;
      if (!q) return true;
      return `${c.name} ${c.degreeShort} ${c.stream} ${c.entranceExams.join(' ')} ${c.careerOpportunities.join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [courses, degreeFilter, search]);

  const activeCourse =
    filteredCourses.find((c) => c.id === activeCourseId) || filteredCourses[0] || courses[0];

  const matchingColleges = useMemo(() => {
    if (!activeCourse) return [];
    return colleges.filter((col) =>
      col.courses.some(
        (cr) =>
          cr.degreeShort.toLowerCase() === activeCourse.degreeShort.toLowerCase() ||
          cr.stream.toLowerCase() === activeCourse.stream.toLowerCase()
      )
    );
  }, [activeCourse, colleges]);

  const toggleCourseCompare = (id: string) => {
    setCompareCourseIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        showToast('error', 'Select up to 4 courses for side-by-side comparison.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const comparedCourses = useMemo(
    () =>
      compareCourseIds
        .map((id) => courses.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [compareCourseIds, courses]
  );

  return (
    <div className="space-y-6">
      {/* Search & Degree Level Filter */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search degrees, streams, entrance exams, or career tracks..."
              className="w-full pl-10 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowComparePanel((v) => !v)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 ${
              showComparePanel
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Compare Courses ({comparedCourses.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setDegreeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              degreeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Programs
          </button>
          {ALL_DEGREE_LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setDegreeFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
                degreeFilter === lvl
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Course Comparison Table */}
      {showComparePanel && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Side-by-Side Course Comparison
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Toggle courses below to add/remove up to 4 courses
            </span>
          </div>

          {comparedCourses.length < 2 ? (
            <p className="text-xs text-slate-500">Select at least 2 courses to compare.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 pr-4 font-semibold text-slate-500">Attribute</th>
                    {comparedCourses.map((c) => (
                      <th
                        key={c.id}
                        className="py-2.5 pr-4 font-bold text-slate-900 dark:text-slate-100 min-w-[180px]"
                      >
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-slate-500">Degree Level</td>
                    {comparedCourses.map((c) => (
                      <td key={c.id} className="py-2.5 pr-4">
                        {c.degreeType} ({c.degreeShort})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-slate-500">Duration</td>
                    {comparedCourses.map((c) => (
                      <td key={c.id} className="py-2.5 pr-4 tabular-nums">
                        {c.duration}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-slate-500">Eligibility</td>
                    {comparedCourses.map((c) => (
                      <td key={c.id} className="py-2.5 pr-4">
                        {c.eligibility}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-slate-500">Required Subjects</td>
                    {comparedCourses.map((c) => (
                      <td key={c.id} className="py-2.5 pr-4">
                        {c.requiredSubjects.join(', ')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-slate-500">Entrance Exams</td>
                    {comparedCourses.map((c) => (
                      <td key={c.id} className="py-2.5 pr-4">
                        {c.entranceExams.join(', ')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-slate-500">Career Outcomes</td>
                    {comparedCourses.map((c) => (
                      <td key={c.id} className="py-2.5 pr-4">
                        {c.careerOpportunities.join(', ')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Split Master-Detail Course Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2.5">
          {filteredCourses.map((crs) => {
            const active = activeCourse?.id === crs.id;
            const inCompare = compareCourseIds.includes(crs.id);
            return (
              <div
                key={crs.id}
                className={`p-4 rounded-2xl border transition-colors ${
                  active
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {crs.degreeType}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {crs.duration}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCourseId(crs.id)}
                  className="text-sm font-bold text-slate-900 dark:text-slate-100 text-left mt-1 hover:text-blue-600 block w-full"
                >
                  {crs.name}
                </button>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{crs.stream}</span>
                  <button
                    type="button"
                    onClick={() => toggleCourseCompare(crs.id)}
                    className={`font-semibold ${
                      inCompare ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {inCompare ? 'In Compare' : '+ Compare'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {activeCourse && (
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {activeCourse.degreeType} · {activeCourse.stream}
                </span>
                <span className="tabular-nums">{activeCourse.duration}</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {activeCourse.name}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                {activeCourse.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block">
                  Eligibility Criteria
                </span>
                <p className="text-slate-800 dark:text-slate-200 mt-1">{activeCourse.eligibility}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block">
                  Required Subjects
                </span>
                <p className="text-slate-800 dark:text-slate-200 mt-1">
                  {activeCourse.requiredSubjects.join(' · ')}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block">
                  Common Entrance Exams
                </span>
                <p className="text-slate-800 dark:text-slate-200 mt-1">
                  {activeCourse.entranceExams.join(' · ')}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400 block">
                  Fee Guidance
                </span>
                <p className="text-slate-800 dark:text-slate-200 mt-1">
                  {activeCourse.typicalFeeRangeLabel}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Career Opportunities</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {activeCourse.careerOpportunities.join(' · ')}
                </p>
              </div>
              <Link
                to="/career"
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold whitespace-nowrap self-start sm:self-center"
              >
                Explore in KAMPUS Career
              </Link>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Institutions Offering Related Programs ({matchingColleges.length})</span>
              </h4>
              {matchingColleges.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No cataloged institutions listed under this track yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {matchingColleges.map((col) => {
                    const matchedOffering = col.courses.find(
                      (cr) =>
                        cr.degreeShort.toLowerCase() === activeCourse.degreeShort.toLowerCase() ||
                        cr.stream.toLowerCase() === activeCourse.stream.toLowerCase()
                    );
                    return (
                      <div
                        key={col.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{col.name}</p>
                          <p className="text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                            {col.city}, {col.state} · Tuition:{' '}
                            {formatINR(matchedOffering?.annualTuitionFeeINR)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenCollegeDetail(col.id)}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50"
                        >
                          Open College
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
