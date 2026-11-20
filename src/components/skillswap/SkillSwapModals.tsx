import React, { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Award,
  Ban,
  Bookmark,
  Bot,
  Briefcase,
  Check,
  Edit3,
  ExternalLink,
  Flag,
  GraduationCap,
  Lock,
  MessageSquare,
  Plus,
  Share2,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  DELIVERY_MODES,
  EXPERIENCE_DURATIONS,
  GROUP_TEACHING_MODES,
  SKILLSWAP_REPORT_REASONS,
  SKILLSWAP_ILLUSTRATIONS,
  SKILL_PROFICIENCIES,
  WEEKDAYS,
  formatShortDate,
  getCategoryName,
  getStudentInitials,
} from '../../data/skillSwapData';
import { SkillSwapAiMode, useSkillSwap } from '../../context/SkillSwapContext';
import {
  SkillCategoryId,
  SkillListing,
  SkillProficiency,
  SkillRequestType,
  SkillSwapReport,
  StudentSkillProfile,
} from '../../types/skillSwap';
import { MarkdownRenderer } from '../kampusai/MarkdownRenderer';

/* ----------------------------------------------------------
   1. SEND SKILL EXCHANGE / LEARNING REQUEST MODAL
---------------------------------------------------------- */
export const SendExchangeRequestModal: React.FC<{
  target: {
    profile: StudentSkillProfile;
    listing?: SkillListing;
  } | null;
  onClose: () => void;
}> = ({ target, onClose }) => {
  const { myProfile, sendRequest } = useSkillSwap();
  const [requestType, setRequestType] = useState<SkillRequestType>('exchange');
  const [requestedSkill, setRequestedSkill] = useState('');
  const [offeredSkill, setOfferedSkill] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [preferredAvailability, setPreferredAvailability] = useState('');
  const [message, setMessage] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    setErr(null);
    const defaultReqSkill =
      target.listing?.skillName || target.profile.skillsToTeach[0]?.skillName || '';
    const defaultOffer =
      myProfile?.skillsToTeach[0]?.skillName || target.listing?.desiredSkill || '';
    if (target.listing?.intent === 'Learning Request') {
      setRequestType('teach-requested');
    } else if (target.listing?.exchangePreference === 'Teaching Only') {
      setRequestType('learn-skill');
    } else if (target.listing?.exchangePreference === 'Learning Collaboration') {
      setRequestType('collaborate');
    } else {
      setRequestType('exchange');
    }
    setRequestedSkill(defaultReqSkill);
    setOfferedSkill(defaultOffer);
    setPreferredAvailability(
      `${target.profile.availability.days.join(', ')} · ${target.profile.availability.preferredTime}`
    );
    setLearningGoals('');
    setMessage('');
  }, [target, myProfile]);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedSkill.trim()) {
      setErr('Please specify the skill for this request.');
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await sendRequest({
      recipientId: target.profile.userId,
      listingId: target.listing?.id,
      requestType,
      requestedSkill: requestedSkill.trim(),
      offeredSkill: offeredSkill.trim() || 'Peer Collaboration',
      learningGoals: learningGoals.trim(),
      preferredAvailability: preferredAvailability.trim(),
      message: message.trim(),
    });
    setBusy(false);
    if (!res.ok) setErr(res.error || 'Failed to send request.');
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Connect with {target.profile.name}
            </h3>
            <p className="text-xs text-slate-500">
              {target.profile.course} · Send a structured SkillSwap request
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {err && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300">
              {err}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Request Type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as SkillRequestType)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
            >
              <option value="exchange">I want to exchange skills</option>
              <option value="learn-skill">I want to learn your skill</option>
              <option value="teach-requested">I can teach your requested skill</option>
              <option value="collaborate">I want to collaborate together</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                {requestType === 'teach-requested' ? 'Skill Requested by Peer' : 'Skill to Learn'}
              </label>
              <input
                type="text"
                required
                value={requestedSkill}
                onChange={(e) => setRequestedSkill(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                What I Can Offer
              </label>
              <input
                type="text"
                value={offeredSkill}
                onChange={(e) => setOfferedSkill(e.target.value)}
                placeholder="e.g. Python, Graphic Design..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Learning Goals
            </label>
            <input
              type="text"
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              placeholder="e.g. Build a portfolio wireframe or learn Pandas basics..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Preferred Availability
            </label>
            <input
              type="text"
              value={preferredAvailability}
              onChange={(e) => setPreferredAvailability(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Personal Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself and suggest how you would like to structure sessions..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{busy ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   2. STUDENT SKILL PROFILE MODAL (VIEW + SELF EDIT + PRIVACY)
---------------------------------------------------------- */
export const StudentSkillProfileModal: React.FC<{
  profile: StudentSkillProfile | null;
  onClose: () => void;
  onConnect: (profile: StudentSkillProfile) => void;
  onReport: (target: {
    targetType: SkillSwapReport['targetType'];
    targetId: string;
    targetSummary: string;
  }) => void;
}> = ({ profile, onClose, onConnect, onReport }) => {
  const {
    currentUserId,
    categories,
    exchanges,
    savedStudentIds,
    toggleSaveStudent,
    toggleBlockUser,
    openPartnerChat,
    getStudentRatingStats,
    updateMyProfile,
  } = useSkillSwap();

  const [editing, setEditing] = useState(false);
  const [intro, setIntro] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [showCollegeDetails, setShowCollegeDetails] = useState(true);
  const [allowDirectRequests, setAllowDirectRequests] = useState(true);
  const [allowMessagesFromPeers, setAllowMessagesFromPeers] = useState(true);
  const [newTeachSkill, setNewTeachSkill] = useState('');
  const [newTeachCategory, setNewTeachCategory] = useState<SkillCategoryId>('technology');
  const [newTeachLevel, setNewTeachLevel] = useState<SkillProficiency>('Intermediate');
  const [newLearnSkill, setNewLearnSkill] = useState('');
  const [newLearnGoal, setNewLearnGoal] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectSummary, setNewProjectSummary] = useState('');
  const [prefFormat, setPrefFormat] = useState(profile?.learningPreferences.format || 'Online');
  const [prefGroup, setPrefGroup] = useState(
    profile?.learningPreferences.groupMode || 'Individual (1-on-1)'
  );
  const [availDays, setAvailDays] = useState<string[]>(profile?.availability.days || []);
  const [availTime, setAvailTime] = useState(profile?.availability.preferredTime || '');

  useEffect(() => {
    if (!profile) return;
    setEditing(false);
    setIntro(profile.intro);
    setLanguagesText(profile.languages.join(', '));
    setInterestsText(profile.learningInterests.join(', '));
    setShowCollegeDetails(profile.privacySettings.showCollegeDetails);
    setAllowDirectRequests(profile.privacySettings.allowDirectRequests);
    setAllowMessagesFromPeers(profile.privacySettings.allowMessagesFromPeers);
    setPrefFormat(profile.learningPreferences.format);
    setPrefGroup(profile.learningPreferences.groupMode);
    setAvailDays(profile.availability.days);
    setAvailTime(profile.availability.preferredTime);
  }, [profile]);

  if (!profile) return null;

  const isMe = profile.userId === currentUserId;
  const isSaved = savedStudentIds.includes(profile.userId);
  const stats = getStudentRatingStats(profile.userId);
  const completedCount = exchanges.filter(
    (ex) =>
      ex.status === 'Completed' &&
      (ex.studentAId === profile.userId || ex.studentBId === profile.userId)
  ).length;

  const handleSaveProfileEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateMyProfile({
      intro: intro.trim(),
      languages: languagesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      learningInterests: interestsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      learningPreferences: {
        ...profile.learningPreferences,
        format: prefFormat,
        groupMode: prefGroup,
      },
      availability: {
        ...profile.availability,
        days: availDays,
        preferredTime: availTime,
      },
      privacySettings: {
        showCollegeDetails,
        allowDirectRequests,
        allowMessagesFromPeers,
      },
    });
    if (ok) setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Top Profile Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#172554] text-white font-extrabold text-lg flex items-center justify-center shrink-0">
              {getStudentInitials(profile.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {profile.name}
                </h2>
                {stats.averageRating !== null && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {stats.averageRating} ({stats.reviewCount} reviews)
                  </span>
                )}
              </div>
              {profile.privacySettings.showCollegeDetails || isMe ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {profile.course} · {profile.semester} · {profile.college}
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">
                  Institution details hidden by student privacy settings
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Languages: {profile.languages.join(', ')} · Completed Exchanges:{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                  {completedCount}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isMe ? (
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{editing ? 'View Profile' : 'Edit Profile & Privacy'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => toggleSaveStudent(profile.userId)}
                  className={`p-2 rounded-xl border cursor-pointer ${
                    isSaved
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                  title={isSaved ? 'Remove bookmark' : 'Save student'}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                {profile.privacySettings.allowMessagesFromPeers && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openPartnerChat(
                        profile.name,
                        profile.userId,
                        profile.skillsToTeach[0]?.skillName
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Message</span>
                  </button>
                )}
                {profile.privacySettings.allowDirectRequests && (
                  <button
                    type="button"
                    onClick={() => onConnect(profile)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {editing && isMe ? (
          <form onSubmit={handleSaveProfileEdits} className="p-6 space-y-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Short Introduction
              </label>
              <textarea
                rows={3}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Languages (comma-separated)
                </label>
                <input
                  type="text"
                  value={languagesText}
                  onChange={(e) => setLanguagesText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Learning Interests (comma-separated)
                </label>
                <input
                  type="text"
                  value={interestsText}
                  onChange={(e) => setInterestsText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>
            </div>

            {/* Quick Add Skill I Can Teach */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="font-bold text-slate-900 dark:text-white">Manage Skills I Can Teach</p>
              <div className="flex flex-wrap gap-2">
                {profile.skillsToTeach.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800"
                  >
                    {s.skillName} ({s.proficiency})
                    <button
                      type="button"
                      onClick={() =>
                        updateMyProfile({
                          skillsToTeach: profile.skillsToTeach.filter((x) => x.id !== s.id),
                        })
                      }
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newTeachSkill}
                  onChange={(e) => setNewTeachSkill(e.target.value)}
                  placeholder="Skill name..."
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <select
                  value={newTeachCategory}
                  onChange={(e) => setNewTeachCategory(e.target.value as SkillCategoryId)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newTeachLevel}
                  onChange={(e) => setNewTeachLevel(e.target.value as SkillProficiency)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2"
                >
                  {SKILL_PROFICIENCIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!newTeachSkill.trim()) return;
                    updateMyProfile({
                      skillsToTeach: [
                        ...profile.skillsToTeach,
                        {
                          id: `t_${Date.now()}`,
                          skillName: newTeachSkill.trim(),
                          categoryId: newTeachCategory,
                          proficiency: newTeachLevel,
                          experience: EXPERIENCE_DURATIONS[2],
                          topicsCovered: [],
                          availabilityNote: availTime || 'Weekends',
                          verificationLabel: 'Self-Reported',
                        },
                      ],
                    });
                    setNewTeachSkill('');
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold py-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Skill
                </button>
              </div>
            </div>

            {/* Quick Add Skill I Want to Learn */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="font-bold text-slate-900 dark:text-white">Manage Skills I Want to Learn</p>
              <div className="flex flex-wrap gap-2">
                {profile.skillsToLearn.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800"
                  >
                    {s.skillName}
                    <button
                      type="button"
                      onClick={() =>
                        updateMyProfile({
                          skillsToLearn: profile.skillsToLearn.filter((x) => x.id !== s.id),
                        })
                      }
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newLearnSkill}
                  onChange={(e) => setNewLearnSkill(e.target.value)}
                  placeholder="Desired skill..."
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <input
                  type="text"
                  value={newLearnGoal}
                  onChange={(e) => setNewLearnGoal(e.target.value)}
                  placeholder="Learning goal..."
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newLearnSkill.trim()) return;
                    updateMyProfile({
                      skillsToLearn: [
                        ...profile.skillsToLearn,
                        {
                          id: `l_${Date.now()}`,
                          skillName: newLearnSkill.trim(),
                          categoryId: 'technology',
                          preferredLevel: 'Beginner',
                          learningGoal: newLearnGoal.trim() || 'Build practical foundation.',
                        },
                      ],
                    });
                    setNewLearnSkill('');
                    setNewLearnGoal('');
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold py-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Goal
                </button>
              </div>
            </div>

            {/* Add Project */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-bold text-slate-900 dark:text-white">Add Portfolio Project</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="Project title..."
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <input
                  type="text"
                  value={newProjectSummary}
                  onChange={(e) => setNewProjectSummary(e.target.value)}
                  placeholder="Short project summary..."
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newProjectTitle.trim()) return;
                    updateMyProfile({
                      projects: [
                        ...profile.projects,
                        {
                          id: `prj_${Date.now()}`,
                          title: newProjectTitle.trim(),
                          summary: newProjectSummary.trim(),
                        },
                      ],
                    });
                    setNewProjectTitle('');
                    setNewProjectSummary('');
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 font-semibold py-2 cursor-pointer"
                >
                  Add Project
                </button>
              </div>
            </div>

            {/* Preferences & Privacy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Session Format
                </label>
                <select
                  value={prefFormat}
                  onChange={(e) => setPrefFormat(e.target.value as typeof prefFormat)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {DELIVERY_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Group Preference
                </label>
                <select
                  value={prefGroup}
                  onChange={(e) => setPrefGroup(e.target.value as typeof prefGroup)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {GROUP_TEACHING_MODES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-slate-700 dark:text-slate-200">Available Days</p>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setAvailDays((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                      availDays.includes(d)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={availTime}
                onChange={(e) => setAvailTime(e.target.value)}
                placeholder="Preferred time window"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 mt-2"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Privacy & Request Controls</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCollegeDetails}
                  onChange={(e) => setShowCollegeDetails(e.target.checked)}
                />
                <span>Display college & semester details on SkillSwap profile</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDirectRequests}
                  onChange={(e) => setAllowDirectRequests(e.target.checked)}
                />
                <span>Allow peers to send new SkillSwap requests</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMessagesFromPeers}
                  onChange={(e) => setAllowMessagesFromPeers(e.target.checked)}
                />
                <span>Allow KAMPUS Chat messages from prospective partners</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Save Profile
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6 text-xs">
            {/* Intro */}
            <div className="space-y-2">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {profile.intro}
              </p>
              <p className="text-slate-500">
                Interests: <span className="font-semibold">{profile.learningInterests.join(' · ')}</span>
              </p>
            </div>

            {/* Teach vs Learn 2-Column Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Skills I Can Teach
                  </h3>
                  <span className="text-[11px] text-slate-400">Self-Reported</span>
                </div>
                {profile.skillsToTeach.length === 0 ? (
                  <p className="text-slate-400">No teaching skills listed yet.</p>
                ) : (
                  profile.skillsToTeach.map((sk) => (
                    <div
                      key={sk.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {sk.skillName}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          {sk.proficiency} · {sk.experience}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {getCategoryName(sk.categoryId)} · {sk.availabilityNote}
                      </p>
                      {sk.topicsCovered.length > 0 && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Topics: {sk.topicsCovered.join(', ')}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Skills I Want to Learn
                </h3>
                {profile.skillsToLearn.length === 0 ? (
                  <p className="text-slate-400">No learning requests added yet.</p>
                ) : (
                  profile.skillsToLearn.map((sk) => (
                    <div
                      key={sk.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {sk.skillName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Target: {sk.preferredLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {sk.learningGoal}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Portfolio, Projects, Achievements, Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Portfolio & Projects</span>
                </div>
                {profile.portfolio.length === 0 && profile.projects.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <img
                      src={SKILLSWAP_ILLUSTRATIONS.portfolioPreview}
                      alt="SkillSwap student portfolio workspace"
                      referrerPolicy="no-referrer"
                      className="w-full h-32 object-cover"
                    />
                    <p className="p-3 text-[11px] text-slate-500">
                      No external portfolio links added yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {profile.portfolio.map((pf) => (
                      <div
                        key={pf.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <p className="font-bold text-slate-900 dark:text-white">{pf.title}</p>
                        <p className="text-[11px] text-slate-500">{pf.description}</p>
                      </div>
                    ))}
                    {profile.projects.map((pr) => (
                      <div
                        key={pr.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 dark:text-white">{pr.title}</p>
                          {pr.url && (
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 inline-flex items-center gap-0.5"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{pr.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-sm">
                  <GraduationCap className="w-4 h-4 text-orange-500" />
                  <span>Preferences, Availability & Achievements</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                  <p>
                    <span className="font-semibold">Format:</span> {profile.learningPreferences.format}{' '}
                    · {profile.learningPreferences.groupMode} ·{' '}
                    {profile.learningPreferences.sessionDurationMinutes} min sessions
                  </p>
                  <p>
                    <span className="font-semibold">Schedule:</span>{' '}
                    {profile.availability.days.join(', ')} ({profile.availability.preferredTime}) ·{' '}
                    {profile.availability.weeklyHours}h/week
                  </p>
                </div>

                {profile.achievements.length > 0 && (
                  <div className="space-y-1">
                    {profile.achievements.map((ach, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Genuine Reviews Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Peer Exchange Feedback ({stats.reviewCount})
              </h3>
              {stats.reviewsForStudent.length === 0 ? (
                <p className="text-slate-400">
                  No peer feedback submitted yet. Ratings appear only after completed SkillSwap exchanges.
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.reviewsForStudent.map((rv) => (
                    <div
                      key={rv.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {rv.reviewerName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatShortDate(rv.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{rv.writtenReview}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Safety Footer for Other Profiles */}
            {!isMe && (
              <div className="flex items-center justify-end gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={async () => {
                    await toggleBlockUser(profile.userId);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" /> Block Student
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onReport({
                      targetType: 'profile',
                      targetId: profile.userId,
                      targetSummary: `${profile.name} (${profile.course})`,
                    })
                  }
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-orange-600 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   3. KAMPUS AI SKILLSWAP ADVISOR MODAL
---------------------------------------------------------- */
export const SkillSwapAiModal: React.FC<{
  isOpen: boolean;
  defaultSkill?: string;
  onClose: () => void;
}> = ({ isOpen, defaultSkill = '', onClose }) => {
  const { runSkillSwapAi } = useSkillSwap();
  const [skillTopic, setSkillTopic] = useState(defaultSkill);
  const [busyMode, setBusyMode] = useState<SkillSwapAiMode | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSkillTopic(defaultSkill || 'Python');
      setErr(null);
    }
  }, [isOpen, defaultSkill]);

  if (!isOpen) return null;

  const tools: Array<{ mode: SkillSwapAiMode; label: string }> = [
    { mode: 'suggest-skills', label: 'Suggest Skills for Me' },
    { mode: 'learning-roadmap', label: '4-Week Learning Roadmap' },
    { mode: 'beginner-topics', label: 'Beginner Topic Breakdown' },
    { mode: 'practice-projects', label: 'Practice Project Ideas' },
    { mode: 'session-objectives', label: '60m Session Agenda' },
    { mode: 'practice-questions', label: 'Practice Questions' },
    { mode: 'explain-concept', label: 'Explain Concept' },
    { mode: 'portfolio-ideas', label: 'Portfolio Project Ideas' },
  ];

  const handleRun = async (mode: SkillSwapAiMode) => {
    setBusyMode(mode);
    setErr(null);
    const res = await runSkillSwapAi(mode, skillTopic.trim() || 'Skill Exchange');
    setBusyMode(null);
    if (res.error) setErr(res.error);
    else setOutput(res.text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                KAMPUS AI Skill Advisor
              </h3>
              <p className="text-[11px] text-slate-500">
                AI-generated learning roadmaps, session plans & project prompts (does not verify skills)
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          type="text"
          value={skillTopic}
          onChange={(e) => setSkillTopic(e.target.value)}
          placeholder="Enter skill or concept (e.g. Figma Auto-Layout, Python Pandas, Public Speaking)..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs"
        />

        <div className="flex flex-wrap gap-2">
          {tools.map((t) => (
            <button
              key={t.mode}
              type="button"
              disabled={Boolean(busyMode)}
              onClick={() => handleRun(t.mode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{busyMode === t.mode ? 'Generating...' : t.label}</span>
            </button>
          ))}
        </div>

        {err && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-600 dark:text-red-300">
            {err}
          </div>
        )}

        {output && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-2">
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              AI-Generated Study Suggestion
            </p>
            <div className="text-xs leading-relaxed">
              <MarkdownRenderer content={output} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   4. SHARE TO STUDENT COMMUNITY MODAL
---------------------------------------------------------- */
export const ShareCommunityModal: React.FC<{
  draft: { title: string; content: string; tags: string[] } | null;
  onClose: () => void;
}> = ({ draft, onClose }) => {
  const { shareToCommunity } = useSkillSwap();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsText, setTagsText] = useState('');

  useEffect(() => {
    if (!draft) return;
    setTitle(draft.title);
    setContent(draft.content);
    setTagsText(draft.tags.join(', '));
  }, [draft]);

  if (!draft) return null;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    shareToCommunity({
      title: title.trim(),
      content: content.trim(),
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Share to Student Community
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handlePublish} className="space-y-3 text-xs">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-semibold"
          />
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          />
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-slate-500 cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
            >
              Publish Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   5. SAFETY REPORT MODAL
---------------------------------------------------------- */
export const SkillSwapSafetyReportModal: React.FC<{
  target: {
    targetType: SkillSwapReport['targetType'];
    targetId: string;
    targetSummary: string;
  } | null;
  onClose: () => void;
}> = ({ target, onClose }) => {
  const { submitSafetyReport } = useSkillSwap();
  const [reason, setReason] = useState(SKILLSWAP_REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitSafetyReport({ ...target, reason, details });
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-orange-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Report {target.targetType}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 truncate">
            {target.targetSummary}
          </p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
          >
            {SKILLSWAP_REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide details to assist campus moderation..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-slate-500 cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
