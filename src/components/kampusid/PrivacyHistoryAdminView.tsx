import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  KeyRound,
  Lock,
  Save,
  ShieldCheck,
  Sparkles,
  UserCog,
  X,
} from 'lucide-react';
import { useKampusId } from '../../context/KampusIdContext';

export const ProfileAndPrivacySettingsView: React.FC = () => {
  const { identity, updateIdentityProfile, updatePrivacy } = useKampusId();

  const [fullName, setFullName] = useState(identity?.fullName || '');
  const [college, setCollege] = useState(identity?.college || '');
  const [department, setDepartment] = useState(identity?.department || '');
  const [course, setCourse] = useState(identity?.course || '');
  const [semester, setSemester] = useState(identity?.academicYearOrSemester || '');
  const [enrollmentNo, setEnrollmentNo] = useState(identity?.enrollmentNo || '');
  const [bio, setBio] = useState(identity?.bio || '');
  const [skillsText, setSkillsText] = useState((identity?.skills || []).join(', '));
  const [interestsText, setInterestsText] = useState((identity?.interests || []).join(', '));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!identity) return;
    setFullName(identity.fullName);
    setCollege(identity.college);
    setDepartment(identity.department);
    setCourse(identity.course);
    setSemester(identity.academicYearOrSemester);
    setEnrollmentNo(identity.enrollmentNo);
    setBio(identity.bio);
    setSkillsText(identity.skills.join(', '));
    setInterestsText(identity.interests.join(', '));
  }, [identity]);

  if (!identity) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateIdentityProfile({
      fullName,
      college,
      department,
      course,
      academicYearOrSemester: semester,
      enrollmentNo,
      bio,
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      interests: interestsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs">
      {/* Editable Academic Profile */}
      <form
        onSubmit={handleSaveProfile}
        className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-[#172033] dark:text-slate-100">
            <UserCog className="w-4 h-4 text-[#2563EB]" />
            <span>Academic Profile & Skills</span>
          </div>
          <span className="font-mono font-bold text-[#2563EB]">
            Immutable ID: {identity.kampusIdNumber}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Enrollment / Roll Number</label>
            <input
              type="text"
              value={enrollmentNo}
              onChange={(e) => setEnrollmentNo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">College / Institution</label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Course / Degree</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Academic Year / Semester</label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="e.g. TypeScript, Python, Systems"
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Interests (comma-separated)</label>
            <input
              type="text"
              value={interestsText}
              onChange={(e) => setInterestsText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold mb-1">Short Academic Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Academic Profile'}</span>
        </button>
      </form>

      {/* Privacy & Security Controls */}
      <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#172033] dark:text-slate-100 pb-3 border-b border-slate-200 dark:border-slate-800">
          <Lock className="w-4 h-4 text-[#2563EB]" />
          <span>Privacy & QR Disclosure Controls</span>
        </div>

        <div>
          <label className="block font-semibold mb-1.5">Public Profile Visibility</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Public', 'Platform Only', 'Private'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updatePrivacy({ profileVisibility: mode })}
                className={`py-2 px-2 rounded-xl font-semibold border ${
                  identity.privacy.profileVisibility === mode
                    ? 'bg-[#172554] text-white border-[#172554]'
                    : 'bg-[#F8FAFC] dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          {[
            { key: 'photoVisibility', label: 'Show profile photo on QR & public view' },
            { key: 'collegeVisibility', label: 'Show college / institution name' },
            { key: 'academicVisibility', label: 'Show course, department & semester' },
            { key: 'skillsVisibility', label: 'Show skills on public profile' },
            { key: 'achievementsVisibility', label: 'Show verified event certificates' },
            { key: 'clubsVisibility', label: 'Show active club memberships' },
          ].map((item) => {
            const checked = Boolean(
              identity.privacy[item.key as keyof typeof identity.privacy]
            );
            return (
              <label
                key={item.key}
                className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {item.label}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updatePrivacy({ [item.key]: e.target.checked })}
                />
              </label>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] text-slate-700 dark:text-slate-300">
          Private email, mobile number, and internal account credentials are strictly excluded from
          all QR tokens and public KAMPUS ID views.
        </div>
      </div>
    </div>
  );
};

export const IdentityHistoryView: React.FC = () => {
  const { identity } = useKampusId();
  if (!identity) return null;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-[#172033] dark:text-slate-100">
          <Clock className="w-4 h-4 text-[#2563EB]" />
          <span>KAMPUS ID Activity History ({identity.activityHistory.length})</span>
        </div>
        <span className="text-xs font-mono font-bold text-[#2563EB]">
          {identity.kampusIdNumber}
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        {identity.activityHistory.map((entry) => (
          <div
            key={entry.id}
            className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2"
          >
            <div>
              <span className="font-bold text-[#172554] dark:text-blue-300 mr-2">
                {entry.action}
              </span>
              <span className="text-slate-700 dark:text-slate-300">{entry.detail}</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const VerifierAdminView: React.FC = () => {
  const {
    roleInfo,
    adminRequests,
    verifyVerifierPasskey,
    revertToStudent,
    fetchAdminRequests,
    decideAdminRequest,
  } = useKampusId();

  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');

  useEffect(() => {
    if (roleInfo.role !== 'Student') {
      fetchAdminRequests();
    }
  }, [fetchAdminRequests, roleInfo.role]);

  if (roleInfo.role === 'Student') {
    return (
      <div className="max-w-md mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#172554] text-white flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172033] dark:text-slate-100">
              Authorized Verifier & Admin Queue
            </h3>
            <p className="text-slate-500">
              Backend RBAC enforced · Students cannot access verification approvals
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
          Authorized Verifier code: <span className="font-mono font-bold">KMP-ID-VERIFIER-2026</span>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const res = await verifyVerifierPasskey(passkey);
            if (!res.ok) setError(res.error || 'Unauthorized');
            else setPasskey('');
          }}
          className="space-y-3"
        >
          <input
            type="password"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            placeholder="Enter Verifier Passkey"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            required
          />
          {error && <div className="text-red-600 font-semibold">{error}</div>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold"
          >
            Unlock Verifier Console
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-sm text-[#172554] dark:text-blue-300">
          <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
          <span>
            {roleInfo.role} · {roleInfo.label}
          </span>
        </div>
        <button
          onClick={revertToStudent}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
        >
          Exit Verifier Mode
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="font-bold text-sm">
          Institutional Verification Review Queue ({adminRequests.length})
        </div>
        <input
          type="text"
          value={reviewerNote}
          onChange={(e) => setReviewerNote(e.target.value)}
          placeholder="Optional reviewer note (saved on decision)"
          className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        />

        {adminRequests.length === 0 ? (
          <p className="text-slate-500">No verification review requests submitted yet.</p>
        ) : (
          <div className="space-y-2.5">
            {adminRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {req.studentName} · <span className="font-mono">{req.kampusIdNumber}</span>
                  </div>
                  <div className="text-slate-500">
                    {req.college} · Roll: {req.enrollmentNo} · Domain: {req.institutionEmailDomain}
                  </div>
                  <div className="font-semibold text-[#2563EB]">Status: {req.status}</div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      decideAdminRequest(
                        req.id,
                        'Verified',
                        reviewerNote || 'Verified via authorized review desk.'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Verified</span>
                  </button>
                  <button
                    onClick={() =>
                      decideAdminRequest(
                        req.id,
                        'Verification Not Available',
                        reviewerNote ||
                          'Automated institutional registrar check not yet connected for this domain.'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold"
                  >
                    Mark Unavailable
                  </button>
                  <button
                    onClick={() =>
                      decideAdminRequest(
                        req.id,
                        'Rejected',
                        reviewerNote || 'Insufficient institutional confirmation details.'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 font-semibold"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const KampusIdAiHelperModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { askKampusIdAi } = useKampusId();
  const [question, setQuestion] = useState(
    'What does each KAMPUS ID verification status mean and how are my private details protected?'
  );
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-slate-100">
                KAMPUS AI · Identity & Privacy Guide
              </h3>
              <p className="text-xs text-slate-500">
                AI-generated explanation · AI never approves or modifies verification state
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError(null);
            const res = await askKampusIdAi(question);
            setLoading(false);
            if (!res.ok) setError(res.error || 'AI service unavailable.');
            else setReply(res.text || '');
          }}
          className="space-y-3 text-xs"
        >
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-semibold"
          >
            {loading ? 'Thinking...' : 'Ask AI Guide'}
          </button>
        </form>

        {error && <div className="text-xs text-red-600">{error}</div>}
        {reply && (
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
            {reply}
          </div>
        )}
      </div>
    </div>
  );
};
