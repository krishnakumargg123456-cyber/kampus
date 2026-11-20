import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BellPlus,
  Bookmark,
  BookmarkCheck,
  Building2,
  Check,
  ExternalLink,
  Flag,
  GitCompare,
  Info,
  ListChecks,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollegeExplorer } from '../../context/CollegeExplorerContext';
import {
  ALL_REVIEW_CATEGORIES,
  formatExplorerDate,
  formatINR,
  resolveCollegePhoto,
} from '../../data/collegeExplorerData';
import type { CollegeRecord, ReviewCategory } from '../../types/collegeExplorer';

interface CollegeDetailAndReviewsViewProps {
  college: CollegeRecord;
  onBack: () => void;
  onOpenAiForCollege: (collegeId: string, prompt: string) => void;
}

export const CollegeDetailAndReviewsView: React.FC<CollegeDetailAndReviewsViewProps> = ({
  college,
  onBack,
  onOpenAiForCollege,
}) => {
  const { user } = useAuth();
  const {
    reviews,
    savedColleges,
    collections,
    compareIds,
    crossModule,
    saveOrUpdateShortlist,
    toggleCompareCollege,
    addToAdmissionTracker,
    scheduleDeadlineReminder,
    submitReview,
    toggleHelpfulReview,
    reportReview,
  } = useCollegeExplorer();

  const currentUserId = user?.id || 'usr_22b030149';
  const savedEntry = savedColleges.find((s) => s.collegeId === college.id);
  const isCompared = compareIds.includes(college.id);

  const [activePhotoKey, setActivePhotoKey] = useState(college.photoKey);
  const [selectedCollection, setSelectedCollection] = useState(
    savedEntry?.collectionName || collections[0]?.name || 'Target List'
  );
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState<string>('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revCategory, setRevCategory] = useState<ReviewCategory>('Academics');
  const [revRating, setRevRating] = useState(4);
  const [revTitle, setRevTitle] = useState('');
  const [revBody, setRevBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Misleading or Unverified Claim');
  const [reportDetails, setReportDetails] = useState('');

  const collegeReviews = useMemo(() => {
    return reviews.filter(
      (r) =>
        r.collegeId === college.id &&
        (reviewCategoryFilter === 'all' || r.category === reviewCategoryFilter)
    );
  }, [reviews, college.id, reviewCategoryFilter]);

  const galleryKeys = useMemo(() => {
    const keys = [college.photoKey, ...(college.galleryPhotoKeys || [])];
    return Array.from(new Set(keys));
  }, [college.photoKey, college.galleryPhotoKeys]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revTitle.trim() || !revBody.trim()) return;
    setSubmittingReview(true);
    const ok = await submitReview({
      collegeId: college.id,
      category: revCategory,
      rating: revRating,
      title: revTitle.trim(),
      experienceText: revBody.trim(),
    });
    setSubmittingReview(false);
    if (ok) {
      setRevTitle('');
      setRevBody('');
      setShowReviewForm(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReviewId) return;
    const ok = await reportReview({
      reviewId: reportingReviewId,
      reason: reportReason,
      details: reportDetails,
    });
    if (ok) {
      setReportingReviewId(null);
      setReportDetails('');
    }
  };

  const facilityItems = [
    { label: 'Library', available: college.facilities.library },
    { label: 'Laboratories', available: college.facilities.laboratories },
    { label: 'Hostel', available: college.facilities.hostel },
    { label: 'Sports Complex', available: college.facilities.sports },
    { label: 'Cafeteria', available: college.facilities.cafeteria },
    { label: 'Campus Wi-Fi', available: college.facilities.wifi },
    { label: 'Transportation', available: college.facilities.transportation },
    { label: 'Medical Care', available: college.facilities.medical },
    { label: 'Accessibility Support', available: college.facilities.accessibility },
  ];

  const mapsQueryUrl = college.mapCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${college.mapCoordinates.lat},${college.mapCoordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${college.name} ${college.city} ${college.state}`
      )}`;

  return (
    <div className="space-y-6">
      {/* Top Action & Return Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to College Explorer</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCollection}
            onChange={(e) => {
              setSelectedCollection(e.target.value);
              if (savedEntry) {
                saveOrUpdateShortlist({
                  collegeId: college.id,
                  action: 'save',
                  collectionName: e.target.value,
                });
              }
            }}
            aria-label="Shortlist collection"
            className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            {collections.map((col) => (
              <option key={col.id} value={col.name}>
                List: {col.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              saveOrUpdateShortlist({
                collegeId: college.id,
                action: savedEntry ? 'remove' : 'save',
                collectionName: selectedCollection,
              })
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 ${
              savedEntry
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {savedEntry ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{savedEntry ? 'Shortlisted' : 'Save College'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleCompareCollege(college.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 ${
              isCompared
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{isCompared ? 'In Comparison' : 'Compare'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onOpenAiForCollege(
                college.id,
                `Explain eligibility, tuition breakdown, required documents, and any missing data for ${college.name}.`
              )
            }
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Ask KAMPUS AI</span>
          </button>
        </div>
      </div>

      {/* Hero Header & Gallery */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="h-56 sm:h-72 w-full bg-slate-100 dark:bg-slate-800 relative">
          <img
            src={resolveCollegePhoto(activePhotoKey)}
            alt={college.name}
            className="w-full h-full object-cover"
          />
        </div>
        {galleryKeys.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Campus Photos:</span>
            {galleryKeys.map((key, idx) => (
              <button
                key={key}
                type="button"
                onClick={() => setActivePhotoKey(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  activePhotoKey === key
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                View {idx + 1}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {college.collegeTypes.join(' · ')}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium tabular-nums">
              {college.dataVerificationStatus} · {college.dataSourceLabel}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {college.name}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4 text-blue-600" />
              {college.city}, {college.state}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-4 h-4 text-slate-400" />
              Est. {college.establishmentYear}
            </span>
            <span>Affiliation: {college.affiliatedUniversity}</span>
            <span>Accreditation: {college.accreditation}</span>
          </p>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                addToAdmissionTracker({
                  collegeId: college.id,
                  courseName: college.courses[0]?.name,
                })
              }
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <ListChecks className="w-4 h-4" />
              <span>Add to My Admissions</span>
            </button>

            <button
              type="button"
              onClick={() =>
                scheduleDeadlineReminder({
                  title: 'Application Portal Check & Document Prep',
                  collegeName: college.name,
                  dateISO: college.nextDeadlineISO || new Date().toISOString().slice(0, 10),
                  notes: college.officialApplicationUrl,
                })
              }
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <BellPlus className="w-4 h-4 text-orange-500" />
              <span>Schedule Deadline Reminder</span>
            </button>

            <a
              href={college.officialApplicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>Official Application Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Section A: Overview */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          A. Institution Overview & Official Links
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {college.overview}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
            <span className="text-slate-400 block">Affiliated University</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {college.affiliatedUniversity}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
            <span className="text-slate-400 block">Accreditation / Recognition</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {college.accreditation}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700">
            <span className="text-slate-400 block">Official Website</span>
            <a
              href={college.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-flex items-center gap-1 break-all"
            >
              <span>{college.officialWebsite}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>
      </section>

      {/* Section B: Academic Information */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          B. Academic Programs & Courses Offered
        </h3>
        {college.courses.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Program details not yet entered for this record. Verify catalog on official portal.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4 font-semibold">Course</th>
                  <th className="py-2.5 pr-4 font-semibold">Level · Stream</th>
                  <th className="py-2.5 pr-4 font-semibold">Duration</th>
                  <th className="py-2.5 pr-4 font-semibold">Entrance Exams</th>
                  <th className="py-2.5 pr-4 font-semibold">Annual Tuition</th>
                  <th className="py-2.5 font-semibold">Intake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {college.courses.map((cr) => (
                  <tr key={cr.courseId}>
                    <td className="py-3 pr-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{cr.name}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Eligibility: {cr.eligibility}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {cr.degreeType} ({cr.degreeShort}) · {cr.stream}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300 tabular-nums">
                      {cr.duration}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {cr.entranceExams.join(', ')}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatINR(cr.annualTuitionFeeINR)}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                      {cr.intakeSeats ?? 'Not published'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section C & Section D Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              C. Admission Information
            </h3>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              Status: {college.admissionStatus}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Admission Process & Steps
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {college.admissionProcess.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
              Procedure: {college.applicationProcedure}
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <p className="font-semibold text-slate-500 dark:text-slate-400">Important Dates</p>
            {college.importantDates.length === 0 ? (
              <p className="text-slate-500">Check official admission portal for current dates.</p>
            ) : (
              college.importantDates.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between py-1">
                  <span className="text-slate-700 dark:text-slate-300">{d.label}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatExplorerDate(d.dateISO)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Required Documents
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 dark:text-slate-300">
              {college.requiredDocuments.map((doc, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              D. Fee Structure & Aid
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Updated {formatExplorerDate(college.feeInfo.lastUpdatedISO)}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Tuition Fee Range</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-right tabular-nums">
                {college.feeInfo.tuitionRangeLabel}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Admission / One-time</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {college.feeInfo.admissionFeeLabel}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Hostel / Residence</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {college.feeInfo.hostelFeeLabel}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Other Institutional Charges</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {college.feeInfo.otherChargesLabel}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-500 dark:text-slate-400 block">
                Scholarship & Aid Information
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {college.feeInfo.scholarshipsSummary}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Source Reference: {college.feeInfo.sourceName}
          </p>
        </section>
      </div>

      {/* Section E, F, G */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            E. Campus Facilities
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {facilityItems.map((f) => (
              <div
                key={f.label}
                className={`px-2.5 py-2 rounded-lg border ${
                  f.available
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-400'
                }`}
              >
                {f.label}: {f.available ? 'Yes' : 'No / Unlisted'}
              </div>
            ))}
          </div>
          {college.facilities.highlights.length > 0 && (
            <p className="text-xs text-slate-600 dark:text-slate-400 pt-2">
              Highlights: {college.facilities.highlights.join(' · ')}
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            F. Placement & Career Support
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {college.placementInfo.supportDescription}
          </p>
          <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Average Package</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {college.placementInfo.averagePackageLabel || 'Not published in sample record'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Highest Package</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {college.placementInfo.highestPackageLabel || 'Not published in sample record'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Reporting Year</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                {college.placementInfo.reportingYear || 'Check official report'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {college.placementInfo.placementReportSummary}
          </p>
          {college.placementInfo.sourceCitation && (
            <p className="text-[11px] text-slate-400">
              Citation: {college.placementInfo.sourceCitation}
            </p>
          )}
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            G. Location & Contacts
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {college.address}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transit: {college.nearbyTransport}
          </p>
          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{college.contactEmail}</span>
            </p>
            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300 tabular-nums">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{college.contactPhone}</span>
            </p>
          </div>
          <a
            href={mapsQueryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Open Campus Location in Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </section>
      </div>

      {/* Section 8: Reviews & Student Insights */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Student Reviews & Experience Insights
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Zero fabricated testimonials — only real student submissions appear here
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowReviewForm((v) => !v)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{showReviewForm ? 'Close Form' : 'Share Student Insight'}</span>
          </button>
        </div>

        {/* Verification Policy Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              How Review Verification Works:{' '}
            </span>
            Posts authored by students with an active verified KAMPUS ID show a{' '}
            <strong>Verified Student</strong> badge. Standard accounts without institutional ID
            verification are labeled <strong>Unverified Experience</strong>. Your current posting
            status:{' '}
            <strong>
              {crossModule.isKampusIdVerified
                ? `Verified KAMPUS ID (${crossModule.kampusIdNumber || 'Active'})`
                : 'Unverified Experience (Standard Account)'}
            </strong>
            .
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setReviewCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
              reviewCategoryFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Categories
          </button>
          {ALL_REVIEW_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setReviewCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
                reviewCategoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Submit Review Form */}
        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Category</span>
                <select
                  value={revCategory}
                  onChange={(e) => setRevCategory(e.target.value as ReviewCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  {ALL_REVIEW_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Rating (1–5)
                </span>
                <select
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Summary Headline</span>
              <input
                type="text"
                required
                value={revTitle}
                onChange={(e) => setRevTitle(e.target.value)}
                placeholder="e.g., Lab availability and academic advising overview"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                First-Hand Experience Details
              </span>
              <textarea
                rows={3}
                required
                value={revBody}
                onChange={(e) => setRevBody(e.target.value)}
                placeholder="Share constructive, factual observations on facilities, teaching, hostel, or campus environment..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </label>

            <button
              type="submit"
              disabled={submittingReview}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold"
            >
              {submittingReview ? 'Submitting...' : 'Publish Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {collegeReviews.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No student reviews submitted yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Be the first student to contribute an honest, constructive review for this college.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {collegeReviews.map((rv) => {
              const hasVoted = rv.helpfulVoterIds.includes(currentUserId);
              return (
                <article
                  key={rv.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {rv.authorName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                          rv.isVerifiedStudent
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>
                          {rv.isVerifiedStudent ? 'Verified Student' : 'Unverified Experience'}
                        </span>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {rv.category} · {formatExplorerDate(rv.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-semibold text-orange-500 tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rv.rating} / 5</span>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{rv.title}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {rv.experienceText}
                  </p>

                  {rv.moderationStatus !== 'Published' && (
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                      Moderation Status: {rv.moderationStatus}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => toggleHelpfulReview(rv.id)}
                      className={`inline-flex items-center gap-1.5 font-semibold ${
                        hasVoted ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span className="tabular-nums">
                        Helpful ({rv.helpfulVoterIds.length})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportingReviewId(rv.id)}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  </div>

                  {reportingReviewId === rv.id && (
                    <form
                      onSubmit={handleReportSubmit}
                      className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                    >
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="Misleading or Unverified Claim">
                          Misleading or Unverified Claim
                        </option>
                        <option value="Abusive / Harassing Language">
                          Abusive / Harassing Language
                        </option>
                        <option value="Spam or Promotional Link">Spam or Promotional Link</option>
                      </select>
                      <input
                        type="text"
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder="Optional context for moderators..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold"
                        >
                          Submit Report
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportingReviewId(null)}
                          className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
