import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Lock, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { useCollegeExplorer } from '../../context/CollegeExplorerContext';
import {
  ALL_ADMISSION_STATUSES,
  ALL_COLLEGE_TYPES,
  ALL_DEGREE_LEVELS,
  ALL_SCHOLARSHIP_CATEGORIES,
  COLLEGE_PHOTO_ASSETS,
  formatExplorerDate,
} from '../../data/collegeExplorerData';
import type {
  AdmissionStatus,
  CollegeType,
  DataVerificationStatus,
  ScholarshipCategory,
} from '../../types/collegeExplorer';

export const ExplorerAdminView: React.FC = () => {
  const {
    colleges,
    reviews,
    reports,
    roleInfo,
    switchRoleSession,
    adminAddCollege,
    adminUpdateCollege,
    adminAddScholarship,
    adminModerateReview,
    adminMarkReportReviewed,
  } = useCollegeExplorer();

  const [passkeyInput, setPasskeyInput] = useState('');
  const [submittingRole, setSubmittingRole] = useState(false);

  // Add College state
  const [colName, setColName] = useState('');
  const [colCity, setColCity] = useState('');
  const [colState, setColState] = useState('');
  const [colCategory, setColCategory] = useState<CollegeType>('Engineering College');
  const [colUniversity, setColUniversity] = useState('');
  const [colWebsite, setColWebsite] = useState('https://www.education.gov.in');
  const [colPhotoKey, setColPhotoKey] = useState('tech_campus');
  const [colAdmissionStatus, setColAdmissionStatus] =
    useState<AdmissionStatus>('Check Official Portal');
  const [colTuitionLabel, setColTuitionLabel] = useState('');
  const [colHostel, setColHostel] = useState(true);
  const [colScholarship, setColScholarship] = useState(true);
  const [colFeatured, setColFeatured] = useState(false);

  // Edit Existing College & Add Course state
  const [editCollegeId, setEditCollegeId] = useState(colleges[0]?.id || '');
  const [editAdmissionStatus, setEditAdmissionStatus] = useState<AdmissionStatus>('Open');
  const [editDeadlineISO, setEditDeadlineISO] = useState('');
  const [editVerificationStatus, setEditVerificationStatus] =
    useState<DataVerificationStatus>('Admin Managed Record');
  const [editPhotoKey, setEditPhotoKey] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDegree, setNewCourseDegree] = useState('Undergraduate');
  const [newCourseFee, setNewCourseFee] = useState('');

  // Add Scholarship state
  const [schTitle, setSchTitle] = useState('');
  const [schProvider, setSchProvider] = useState('');
  const [schCategory, setSchCategory] = useState<ScholarshipCategory>('University');
  const [schEligibility, setSchEligibility] = useState('');
  const [schBenefits, setSchBenefits] = useState('');
  const [schDeadlineISO, setSchDeadlineISO] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );

  const isPrivileged = roleInfo.role !== 'Student';
  const canEditCatalog =
    roleInfo.role === 'Platform Admin' || roleInfo.role === 'Education Data Editor';

  const handleRoleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyInput.trim()) return;
    setSubmittingRole(true);
    const ok = await switchRoleSession(passkeyInput.trim(), false);
    setSubmittingRole(false);
    if (ok) setPasskeyInput('');
  };

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await adminAddCollege({
      name: colName,
      city: colCity,
      state: colState,
      primaryCategory: colCategory,
      collegeTypes: [colCategory],
      affiliatedUniversity: colUniversity || undefined,
      officialWebsite: colWebsite,
      officialApplicationUrl: colWebsite,
      photoKey: colPhotoKey,
      admissionStatus: colAdmissionStatus,
      tuitionRangeLabel: colTuitionLabel || undefined,
      hostelAvailable: colHostel,
      scholarshipAvailable: colScholarship,
      featured: colFeatured,
      dataVerificationStatus: 'Admin Managed Record',
    });
    if (ok) {
      setColName('');
      setColCity('');
      setColState('');
      setColUniversity('');
      setColTuitionLabel('');
    }
  };

  const handleUpdateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCollegeId) return;
    await adminUpdateCollege(editCollegeId, {
      admissionStatus: editAdmissionStatus,
      nextDeadlineISO: editDeadlineISO || undefined,
      dataVerificationStatus: editVerificationStatus,
      ...(editPhotoKey ? { photoKey: editPhotoKey } : {}),
      ...(newCourseName.trim()
        ? {
            newCourse: {
              name: newCourseName.trim(),
              degreeType: newCourseDegree,
              degreeShort: newCourseDegree.slice(0, 4).toUpperCase(),
              stream: 'General',
              department: 'Academic Department',
              duration: '3-4 Years',
              eligibility: 'Verify institutional admissions notice',
              entranceExams: ['Institutional Merit / Exam'],
              annualTuitionFeeINR: newCourseFee ? Number(newCourseFee) : null,
            },
          }
        : {}),
    });
    setNewCourseName('');
    setNewCourseFee('');
  };

  const handleAddScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await adminAddScholarship({
      title: schTitle,
      provider: schProvider,
      category: schCategory,
      eligibility: schEligibility || 'Verify scheme portal notice',
      benefits: schBenefits || 'Check official scholarship prospectus',
      deadlineISO: schDeadlineISO,
      dataVerificationStatus: 'Admin Managed Record',
    });
    if (ok) {
      setSchTitle('');
      setSchProvider('');
      setSchEligibility('');
      setSchBenefits('');
    }
  };

  return (
    <div className="space-y-6">
      {/* RBAC Role Switcher */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Role-Based Data Curation & Moderation Access</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current Active Role: <strong>{roleInfo.role}</strong>
              {roleInfo.label ? ` · ${roleInfo.label}` : ' (Read-only catalog permissions)'}
            </p>
          </div>

          {isPrivileged && (
            <button
              type="button"
              onClick={() => switchRoleSession(undefined, true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Return to Student Mode
            </button>
          )}
        </div>

        {!isPrivileged && (
          <form onSubmit={handleRoleUnlock} className="flex flex-col sm:flex-row gap-2 text-xs">
            <div className="relative flex-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Enter authorized Platform Admin, Editor, or Moderator passkey..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <button
              type="submit"
              disabled={submittingRole}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
            >
              {submittingRole ? 'Verifying...' : 'Verify Role Passkey'}
            </button>
          </form>
        )}
      </section>

      {!isPrivileged ? (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-2">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Institutional Curation & Review Moderation Restricted
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Standard Student accounts cannot add colleges, modify official verification badges, or
            moderate reviews. Verify an authorized Editor, Moderator, or Platform Admin passkey above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {canEditCatalog && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add College */}
              <form
                onSubmit={handleAddCollege}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Add Institution Record</span>
                </h4>
                <input
                  type="text"
                  required
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder="Institution Full Name *"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={colCity}
                    onChange={(e) => setColCity(e.target.value)}
                    placeholder="City *"
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    required
                    value={colState}
                    onChange={(e) => setColState(e.target.value)}
                    placeholder="State *"
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={colCategory}
                    onChange={(e) => setColCategory(e.target.value as CollegeType)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {ALL_COLLEGE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    value={colPhotoKey}
                    onChange={(e) => setColPhotoKey(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {Object.keys(COLLEGE_PHOTO_ASSETS).map((key) => (
                      <option key={key} value={key}>
                        Photo: {key}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={colUniversity}
                  onChange={(e) => setColUniversity(e.target.value)}
                  placeholder="Affiliated University"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="url"
                    value={colWebsite}
                    onChange={(e) => setColWebsite(e.target.value)}
                    placeholder="Official Website URL"
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <select
                    value={colAdmissionStatus}
                    onChange={(e) => setColAdmissionStatus(e.target.value as AdmissionStatus)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {ALL_ADMISSION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={colTuitionLabel}
                  onChange={(e) => setColTuitionLabel(e.target.value)}
                  placeholder="Annual Tuition Summary (e.g., ₹85,000 – ₹1,40,000 / year)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={colHostel}
                      onChange={(e) => setColHostel(e.target.checked)}
                    />
                    <span>Hostel Available</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={colScholarship}
                      onChange={(e) => setColScholarship(e.target.checked)}
                    />
                    <span>Scholarships Listed</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={colFeatured}
                      onChange={(e) => setColFeatured(e.target.checked)}
                    />
                    <span>Feature on Dashboard</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Save College Record
                </button>
              </form>

              {/* Edit Existing College & Add Course */}
              <form
                onSubmit={handleUpdateCollege}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Update College Dates, Verification & Courses
                </h4>
                <select
                  value={editCollegeId}
                  onChange={(e) => setEditCollegeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.dataVerificationStatus})
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editAdmissionStatus}
                    onChange={(e) => setEditAdmissionStatus(e.target.value as AdmissionStatus)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {ALL_ADMISSION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        Status: {st}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editDeadlineISO}
                    onChange={(e) => setEditDeadlineISO(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editVerificationStatus}
                    onChange={(e) =>
                      setEditVerificationStatus(e.target.value as DataVerificationStatus)
                    }
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="Admin Managed Record">Admin Managed Record</option>
                    <option value="Verified Provider Record">Verified Provider Record</option>
                    <option value="Sample Development Record">Sample Development Record</option>
                  </select>
                  <select
                    value={editPhotoKey}
                    onChange={(e) => setEditPhotoKey(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">Keep existing photo</option>
                    {Object.keys(COLLEGE_PHOTO_ASSETS).map((key) => (
                      <option key={key} value={key}>
                        Photo: {key}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    Optional: Append New Course Offering
                  </p>
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Course Title (e.g., B.Sc. Clinical Optometry)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newCourseDegree}
                      onChange={(e) => setNewCourseDegree(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      {ALL_DEGREE_LEVELS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={newCourseFee}
                      onChange={(e) => setNewCourseFee(e.target.value)}
                      placeholder="Annual Fee INR"
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold"
                >
                  Apply College Updates
                </button>
              </form>
            </div>
          )}

          {/* Add Scholarship */}
          {canEditCatalog && (
            <form
              onSubmit={handleAddScholarship}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs"
            >
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Publish Verified Scholarship Entry
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  value={schTitle}
                  onChange={(e) => setSchTitle(e.target.value)}
                  placeholder="Scholarship Title *"
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  required
                  value={schProvider}
                  onChange={(e) => setSchProvider(e.target.value)}
                  placeholder="Provider / Foundation *"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <select
                  value={schCategory}
                  onChange={(e) => setSchCategory(e.target.value as ScholarshipCategory)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {ALL_SCHOLARSHIP_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={schEligibility}
                  onChange={(e) => setSchEligibility(e.target.value)}
                  placeholder="Eligibility summary..."
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  value={schBenefits}
                  onChange={(e) => setSchBenefits(e.target.value)}
                  placeholder="Financial / tuition benefits..."
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="date"
                  value={schDeadlineISO}
                  onChange={(e) => setSchDeadlineISO(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Publish Scholarship
              </button>
            </form>
          )}

          {/* Review Moderation & Reports Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Student Review Moderation Queue ({reviews.length})
              </h4>
              {reviews.length === 0 ? (
                <p className="text-slate-500">No student reviews submitted yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {reviews.map((rv) => (
                    <div
                      key={rv.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {rv.title} ({rv.collegeName})
                        </span>
                        <span className="font-semibold text-orange-600">
                          {rv.moderationStatus}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                        {rv.experienceText}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => adminModerateReview(rv.id, 'Published')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => adminModerateReview(rv.id, 'Removed')}
                          className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                <span>Abuse & Misinformation Reports ({reports.length})</span>
              </h4>
              {reports.length === 0 ? (
                <p className="text-slate-500">No review reports filed.</p>
              ) : (
                <div className="space-y-2.5">
                  {reports.map((rp) => (
                    <div
                      key={rp.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {rp.reviewTitle}
                        </span>
                        <span className="font-semibold text-blue-600">{rp.status}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        Reason: {rp.reason} {rp.details ? `— ${rp.details}` : ''}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 tabular-nums">
                          Filed {formatExplorerDate(rp.createdAt)}
                        </span>
                        {rp.status === 'Open' && (
                          <button
                            type="button"
                            onClick={() => adminMarkReportReviewed(rp.id)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold"
                          >
                            Mark Reviewed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
