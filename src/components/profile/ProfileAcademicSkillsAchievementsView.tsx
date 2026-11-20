import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  FileBadge2,
  FolderLock,
  GraduationCap,
  Heart,
  ImagePlus,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccountProfileSettings } from '../../context/AccountProfileSettingsContext';
import type {
  AchievementCategory,
  EducationRecord,
  InterestCategory,
  SkillCategory,
  SkillLevel,
  StudentAchievement,
  StudentSkill,
} from '../../types/accountProfileSettings';

const SKILL_CATEGORIES: SkillCategory[] = ['Technical', 'Communication', 'Creative', 'Academic', 'Professional'];
const SKILL_LEVELS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const INTEREST_CATEGORIES: InterestCategory[] = [
  'Technology',
  'Science',
  'Business',
  'Research',
  'Design',
  'Sports',
  'Literature',
  'Entrepreneurship',
  'Other',
];

const SUGGESTED_INTERESTS: Array<{ name: string; category: InterestCategory }> = [
  { name: 'Artificial Intelligence', category: 'Technology' },
  { name: 'Distributed Systems', category: 'Technology' },
  { name: 'Quantum Computing', category: 'Science' },
  { name: 'Product Strategy', category: 'Business' },
  { name: 'Academic Publishing', category: 'Research' },
  { name: 'UI/UX Design Systems', category: 'Design' },
  { name: 'Intercollegiate Athletics', category: 'Sports' },
  { name: 'Modern Literature', category: 'Literature' },
  { name: 'Campus Startups', category: 'Entrepreneurship' },
];

const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  'Academic',
  'Competition',
  'Certifications',
  'Projects',
  'Leadership',
  'Volunteering',
  'Sports & Extracurricular',
];

interface Props {
  section: 'academic' | 'skills' | 'achievements';
}

export const ProfileAcademicSkillsAchievementsView: React.FC<Props> = ({ section }) => {
  const {
    profileRecord,
    eligibleCertificates,
    unlockedBadges,
    saving,
    saveProfilePatch,
  } = useAccountProfileSettings();

  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Education state
  const [eduFormOpen, setEduFormOpen] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [eduForm, setEduForm] = useState<Omit<EducationRecord, 'id'>>({
    institution: '',
    university: '',
    courseProgram: '',
    stream: '',
    specialization: '',
    academicYear: '',
    semesterOrClass: '',
    enrollmentYear: '',
    graduationYear: '',
    academicInterests: '',
    description: '',
    isCurrent: true,
  });

  // Skill state
  const [skillName, setSkillName] = useState('');
  const [skillCat, setSkillCat] = useState<SkillCategory>('Technical');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Intermediate');

  // Interest state
  const [customInterestName, setCustomInterestName] = useState('');
  const [customInterestCat, setCustomInterestCat] = useState<InterestCategory>('Technology');

  // Achievement state
  const [achFormOpen, setAchFormOpen] = useState(false);
  const [achForm, setAchForm] = useState<Omit<StudentAchievement, 'id' | 'verified'>>({
    category: 'Certifications',
    title: '',
    description: '',
    issuer: '',
    dateISO: new Date().toISOString().slice(0, 10),
    imageUrl: '',
    lockerDocId: '',
    lockerDocTitle: '',
  });

  if (!profileRecord) return null;

  // ==================================================
  // ACADEMIC RECORDS HANDLERS
  // ==================================================
  const openNewEdu = () => {
    setEditingEduId(null);
    setEduForm({
      institution: profileRecord.college || '',
      university: profileRecord.university || '',
      courseProgram: profileRecord.course || '',
      stream: '',
      specialization: profileRecord.specialization || '',
      academicYear: '',
      semesterOrClass: profileRecord.semester || '',
      enrollmentYear: '',
      graduationYear: '',
      academicInterests: '',
      description: '',
      isCurrent: profileRecord.educationRecords.length === 0,
    });
    setEduFormOpen(true);
  };

  const openEditEdu = (rec: EducationRecord) => {
    setEditingEduId(rec.id);
    const { id: _id, ...rest } = rec;
    setEduForm(rest);
    setEduFormOpen(true);
  };

  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.institution.trim() || !eduForm.courseProgram.trim()) {
      setNotice({ type: 'err', text: 'Institution and Course / Program are required.' });
      return;
    }

    let nextRecords = [...profileRecord.educationRecords];
    if (eduForm.isCurrent) {
      nextRecords = nextRecords.map((r) => ({ ...r, isCurrent: false }));
    }

    if (editingEduId) {
      nextRecords = nextRecords.map((r) => (r.id === editingEduId ? { ...eduForm, id: editingEduId } : r));
    } else {
      nextRecords.unshift({ ...eduForm, id: `edu_${Date.now()}` });
    }

    const currentPrimary = nextRecords.find((r) => r.isCurrent) || nextRecords[0];
    const res = await saveProfilePatch({
      educationRecords: nextRecords,
      college: currentPrimary?.institution || profileRecord.college,
      university: currentPrimary?.university || profileRecord.university,
      course: currentPrimary?.courseProgram || profileRecord.course,
      specialization: currentPrimary?.specialization || profileRecord.specialization,
      semester: currentPrimary?.semesterOrClass || profileRecord.semester,
    });

    if (res.ok) {
      setEduFormOpen(false);
      setNotice({ type: 'ok', text: 'Academic record saved.' });
    } else {
      setNotice({ type: 'err', text: res.error || 'Could not save academic record.' });
    }
  };

  const handleDeleteEdu = async (id: string) => {
    const next = profileRecord.educationRecords.filter((r) => r.id !== id);
    const res = await saveProfilePatch({ educationRecords: next });
    if (res.ok) setNotice({ type: 'ok', text: 'Education record removed.' });
  };

  // ==================================================
  // SKILLS & INTERESTS HANDLERS
  // ==================================================
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = skillName.trim();
    if (!clean) return;
    if (profileRecord.skills.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      setNotice({ type: 'err', text: 'That skill is already listed on your profile.' });
      return;
    }
    const newSkill: StudentSkill = {
      id: `sk_${Date.now()}`,
      name: clean,
      category: skillCat,
      level: skillLevel,
    };
    const res = await saveProfilePatch({ skills: [...profileRecord.skills, newSkill] });
    if (res.ok) {
      setSkillName('');
      setNotice({ type: 'ok', text: `Added skill "${clean}".` });
    }
  };

  const handleRemoveSkill = async (id: string) => {
    await saveProfilePatch({ skills: profileRecord.skills.filter((s) => s.id !== id) });
  };

  const handleToggleInterest = async (item: { name: string; category: InterestCategory }) => {
    const exists = profileRecord.interests.some((i) => i.name.toLowerCase() === item.name.toLowerCase());
    const next = exists
      ? profileRecord.interests.filter((i) => i.name.toLowerCase() !== item.name.toLowerCase())
      : [...profileRecord.interests, item];
    await saveProfilePatch({ interests: next });
  };

  const handleAddCustomInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customInterestName.trim();
    if (!clean) return;
    if (profileRecord.interests.some((i) => i.name.toLowerCase() === clean.toLowerCase())) {
      setNotice({ type: 'err', text: 'Interest already added.' });
      return;
    }
    const res = await saveProfilePatch({
      interests: [...profileRecord.interests, { name: clean, category: customInterestCat }],
    });
    if (res.ok) {
      setCustomInterestName('');
      setNotice({ type: 'ok', text: `Added interest "${clean}".` });
    }
  };

  // ==================================================
  // ACHIEVEMENTS & CERTIFICATES HANDLERS
  // ==================================================
  const handleAchImageUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setNotice({ type: 'err', text: 'Certificate image must be an image file under 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAchForm((p) => ({ ...p, imageUrl: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achForm.title.trim() || !achForm.issuer.trim()) {
      setNotice({ type: 'err', text: 'Title and Issuing Organization are required.' });
      return;
    }
    const linkedDoc = eligibleCertificates.find((c) => c.id === achForm.lockerDocId);
    const entry: StudentAchievement = {
      id: `ach_${Date.now()}`,
      category: achForm.category,
      title: achForm.title.trim(),
      description: achForm.description.trim(),
      issuer: achForm.issuer.trim(),
      dateISO: achForm.dateISO,
      imageUrl: achForm.imageUrl || undefined,
      lockerDocId: linkedDoc?.id || undefined,
      lockerDocTitle: linkedDoc?.title || undefined,
      verified: Boolean(linkedDoc), // Only true when backed by an actual Digital Locker document
    };
    const res = await saveProfilePatch({
      achievements: [entry, ...profileRecord.achievements],
    });
    if (res.ok) {
      setAchFormOpen(false);
      setAchForm({
        category: 'Certifications',
        title: '',
        description: '',
        issuer: '',
        dateISO: new Date().toISOString().slice(0, 10),
        imageUrl: '',
        lockerDocId: '',
        lockerDocTitle: '',
      });
      setNotice({ type: 'ok', text: 'Achievement added to your profile.' });
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    await saveProfilePatch({
      achievements: profileRecord.achievements.filter((a) => a.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
            notice.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION: ACADEMIC DETAILS */}
      {section === 'academic' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span>Academic Journey & Education</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Maintain your current university program and prior academic milestones.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewEdu}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Education Record</span>
            </button>
          </div>

          {eduFormOpen && (
            <form
              onSubmit={handleSaveEdu}
              className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingEduId ? 'Edit Education Record' : 'New Education Record'}
                </h3>
                <button type="button" onClick={() => setEduFormOpen(false)} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    College / School Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={eduForm.institution}
                    onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    University / Board
                  </label>
                  <input
                    type="text"
                    value={eduForm.university}
                    onChange={(e) => setEduForm({ ...eduForm, university: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course / Program *
                  </label>
                  <input
                    type="text"
                    required
                    value={eduForm.courseProgram}
                    onChange={(e) => setEduForm({ ...eduForm, courseProgram: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stream / Department
                  </label>
                  <input
                    type="text"
                    value={eduForm.stream}
                    onChange={(e) => setEduForm({ ...eduForm, stream: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={eduForm.specialization}
                    onChange={(e) => setEduForm({ ...eduForm, specialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester / Class
                  </label>
                  <input
                    type="text"
                    value={eduForm.semesterOrClass}
                    onChange={(e) => setEduForm({ ...eduForm, semesterOrClass: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enrollment Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2022"
                    value={eduForm.enrollmentYear}
                    onChange={(e) => setEduForm({ ...eduForm, enrollmentYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Graduation Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026"
                    value={eduForm.graduationYear}
                    onChange={(e) => setEduForm({ ...eduForm, graduationYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Interests & Focus
                  </label>
                  <input
                    type="text"
                    value={eduForm.academicInterests}
                    onChange={(e) => setEduForm({ ...eduForm, academicInterests: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={eduForm.description}
                    onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eduForm.isCurrent}
                  onChange={(e) => setEduForm({ ...eduForm, isCurrent: e.target.checked })}
                />
                <span>Set as my current active enrollment</span>
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEduFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                >
                  {saving ? 'Saving...' : 'Save Education Record'}
                </button>
              </div>
            </form>
          )}

          {profileRecord.educationRecords.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No academic records added yet</p>
              <p className="text-xs text-slate-500 mt-1">Add your college, program, and graduation timeline.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profileRecord.educationRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {rec.institution}
                      </h3>
                      {rec.isCurrent && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {rec.courseProgram}
                      {rec.specialization ? ` · ${rec.specialization}` : ''}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {[rec.university, rec.stream, rec.semesterOrClass].filter(Boolean).join(' · ')}
                      {(rec.enrollmentYear || rec.graduationYear) &&
                        ` · ${rec.enrollmentYear || '—'} – ${rec.graduationYear || 'Present'}`}
                    </p>
                    {rec.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">{rec.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditEdu(rec)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEdu(rec.id)}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION: SKILLS & INTERESTS */}
      {section === 'skills' && (
        <div className="space-y-6">
          {/* Skills Manager */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Skills & Proficiency</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Self-reported skills organized by category. No fabricated endorsement scores or artificial ratings.
              </p>
            </div>

            <form onSubmit={handleAddSkill} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Skill name (e.g. TypeScript, Public Speaking)"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
              />
              <select
                value={skillCat}
                onChange={(e) => setSkillCat(e.target.value as SkillCategory)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  {SKILL_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>

            {profileRecord.skills.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                No skills added yet. Add skills above across Technical, Communication, Creative, Academic, or Professional categories.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SKILL_CATEGORIES.map((cat) => {
                  const list = profileRecord.skills.filter((s) => s.category === cat);
                  if (list.length === 0) return null;
                  return (
                    <div
                      key={cat}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {cat}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {list.map((sk) => (
                          <span
                            key={sk.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                          >
                            <span>{sk.name}</span>
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              · {sk.level}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(sk.id)}
                              className="text-slate-400 hover:text-rose-600"
                              title="Remove skill"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interests Manager */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-orange-500" />
                <span>Interests & Domains</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pick from the 9 KAMPUS domains or add custom topic tags to personalize peer & opportunity discovery.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_INTERESTS.map((item) => {
                const active = profileRecord.interests.some(
                  (i) => i.name.toLowerCase() === item.name.toLowerCase()
                );
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleToggleInterest(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    {item.name} ({item.category})
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddCustomInterest} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Add custom interest..."
                value={customInterestName}
                onChange={(e) => setCustomInterestName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm"
              />
              <select
                value={customInterestCat}
                onChange={(e) => setCustomInterestCat(e.target.value as InterestCategory)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                {INTEREST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Add Interest
              </button>
            </form>

            {profileRecord.interests.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                {profileRecord.interests.map((it) => (
                  <span
                    key={it.name}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{it.name}</span>
                    <span className="text-[10px] opacity-75">({it.category})</span>
                    <button
                      type="button"
                      onClick={() => handleToggleInterest(it)}
                      className="ml-1 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: ACHIEVEMENTS & CERTIFICATES */}
      {section === 'achievements' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                <span>Achievements, Certificates & Badges</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Showcase verified Digital Locker certificates, hackathon milestones, and unlocked KAMPUS Rewards badges.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAchFormOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Achievement</span>
            </button>
          </div>

          {achFormOpen && (
            <form
              onSubmit={handleSaveAchievement}
              className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">New Achievement / Certificate</h3>
                <button type="button" onClick={() => setAchFormOpen(false)} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={achForm.category}
                    onChange={(e) => setAchForm({ ...achForm, category: e.target.value as AchievementCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {ACHIEVEMENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={achForm.dateISO}
                    onChange={(e) => setAchForm({ ...achForm, dateISO: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smart India Hackathon Finalist"
                    value={achForm.title}
                    onChange={(e) => setAchForm({ ...achForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issuing Organization *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ministry of Education / Coursera / IIT Bombay"
                    value={achForm.issuer}
                    onChange={(e) => setAchForm({ ...achForm, issuer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={achForm.description}
                    onChange={(e) => setAchForm({ ...achForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Link Eligible Digital Locker Certificate (Optional)
                  </label>
                  <select
                    value={achForm.lockerDocId}
                    onChange={(e) => setAchForm({ ...achForm, lockerDocId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="">None selected</option>
                    {eligibleCertificates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attach Certificate Image (Optional)
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <ImagePlus className="w-4 h-4 text-blue-600" />
                    <span>{achForm.imageUrl ? 'Image attached' : 'Upload PNG/JPG'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAchImageUpload(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAchFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold">
                  Save Achievement
                </button>
              </div>
            </form>
          )}

          {/* User Achievements List */}
          {profileRecord.achievements.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center">
              <FileBadge2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No achievements added yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Add awards, certifications, or link verified certificates from your Digital Locker.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileRecord.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                        {ach.category}
                      </span>
                      <span className="text-[11px] text-slate-400 tabular-nums">{ach.dateISO}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{ach.title}</h3>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Issued by {ach.issuer}</p>
                    {ach.description && <p className="text-xs text-slate-500">{ach.description}</p>}
                    {ach.imageUrl && (
                      <img
                        src={ach.imageUrl}
                        alt={ach.title}
                        className="mt-2 w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                    )}
                    {ach.lockerDocTitle && (
                      <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Backed by Digital Locker: {ach.lockerDocTitle}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      to="/tools/digital-locker"
                      className="text-[11px] font-semibold text-blue-600 inline-flex items-center gap-1"
                    >
                      <FolderLock className="w-3.5 h-3.5" />
                      <span>Digital Locker</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteAchievement(ach.id)}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* KAMPUS Rewards Live Unlocked Badges */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Unlocked KAMPUS Rewards Badges ({unlockedBadges.length})
              </h3>
              <Link to="/tools/rewards" className="text-xs font-semibold text-blue-600 hover:underline">
                View Rewards Hub
              </Link>
            </div>
            {unlockedBadges.length === 0 ? (
              <p className="text-xs text-slate-500">
                No KAMPUS Rewards badges unlocked yet. Badges earned through real platform milestones automatically appear here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unlockedBadges.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{b.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{b.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1 tabular-nums">
                      Unlocked {b.unlockedAt.slice(0, 10)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
