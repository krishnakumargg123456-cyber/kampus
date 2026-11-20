import React, { useState } from 'react';
import { Bell, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudyPartner } from '../../context/StudyPartnerContext';
import {
  LearningStyle,
  ProfileVisibility,
  RequestPermission,
  StudyLevel,
  StudyMode,
  StudyPartnerLanguage,
  StudyTimeSlot,
} from '../../types/studyPartner';

const TIME_SLOTS: StudyTimeSlot[] = [
  'Morning Study',
  'Afternoon Study',
  'Evening Study',
  'Night Study',
];
const STUDY_MODES: StudyMode[] = [
  'Online Study',
  'Offline Study',
  'Individual Focus',
  'Group Learning',
];
const LEARNING_STYLES: LearningStyle[] = [
  'Concept-Based Learning',
  'Practice & Questions',
  'Revision',
  'Discussion',
  'Doubt Solving',
  'Exam Preparation',
];

export const PartnerPreferencesView: React.FC = () => {
  const { profile } = useAuth();
  const { state, updatePreferences, unblockUser } = useStudyPartner();

  const [stream, setStream] = useState(state.preferences.stream);
  const [academicYear, setAcademicYear] = useState(
    state.preferences.academicYear
  );
  const [examPreparation, setExamPreparation] = useState(
    state.preferences.examPreparation
  );
  const [subjectsRaw, setSubjectsRaw] = useState(
    state.preferences.subjects.join(', ')
  );
  const [goalsRaw, setGoalsRaw] = useState(
    state.preferences.learningGoals.join('\n')
  );
  const [preferredTimes, setPreferredTimes] = useState<StudyTimeSlot[]>(
    state.preferences.preferredTimes
  );
  const [studyModes, setStudyModes] = useState<StudyMode[]>(
    state.preferences.studyModes
  );
  const [learningStyles, setLearningStyles] = useState<LearningStyle[]>(
    state.preferences.learningStyles
  );
  const [preferredLanguage, setPreferredLanguage] =
    useState<StudyPartnerLanguage>(state.preferences.preferredLanguage);
  const [studyLevel, setStudyLevel] = useState<StudyLevel>(
    state.preferences.studyLevel
  );
  const [availability, setAvailability] = useState(
    state.preferences.availability
  );
  const [visibility, setVisibility] = useState<ProfileVisibility>(
    state.preferences.visibility
  );
  const [allowRequestsFrom, setAllowRequestsFrom] =
    useState<RequestPermission>(state.preferences.allowRequestsFrom);
  const [hideCollegeName, setHideCollegeName] = useState(
    state.preferences.hideCollegeName
  );
  const [notifyOnRequests, setNotifyOnRequests] = useState(
    state.preferences.notifyOnRequests
  );
  const [notifyOnSessions, setNotifyOnSessions] = useState(
    state.preferences.notifyOnSessions
  );
  const [notifyOnGoals, setNotifyOnGoals] = useState(
    state.preferences.notifyOnGoals
  );

  const toggleItem = <T extends string>(
    list: T[],
    item: T,
    setter: (next: T[]) => void
  ) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      stream: stream.trim(),
      academicYear: academicYear.trim(),
      examPreparation: examPreparation.trim(),
      subjects: subjectsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      learningGoals: goalsRaw
        .split('\n')
        .map((g) => g.trim())
        .filter(Boolean),
      preferredTimes,
      studyModes,
      learningStyles,
      preferredLanguage,
      studyLevel,
      availability: availability.trim(),
      visibility,
      allowRequestsFrom,
      hideCollegeName,
      notifyOnRequests,
      notifyOnSessions,
      notifyOnGoals,
    });
  };

  const blockedPeers = state.peers.filter((p) =>
    state.blockedPeerIds.includes(p.id)
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Reused Student Profile Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {profile.name} · {profile.course} ({profile.semester})
            </div>
            <div className="text-xs text-slate-500">
              {profile.college} — Reused automatically from your KAMPUS Profile.
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <UserCheck className="w-4 h-4" />
          <span>Contact Info Never Exposed</span>
        </span>
      </div>

      {/* Matching & Study Preferences */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-5 shadow-2xs">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
          Study Matching Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Academic Stream
            </label>
            <input
              type="text"
              value={stream}
              onChange={(e) => setStream(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Academic Year / Term
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Preparation Focus
            </label>
            <input
              type="text"
              value={examPreparation}
              onChange={(e) => setExamPreparation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Study Level
            </label>
            <select
              value={studyLevel}
              onChange={(e) => setStudyLevel(e.target.value as StudyLevel)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            >
              <option value="School">School</option>
              <option value="Class 11–12">Class 11–12</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="Competitive Exams">Competitive Exams</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Preferred Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) =>
                setPreferredLanguage(e.target.value as StudyPartnerLanguage)
              }
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Bilingual (EN/HI)">Bilingual (EN/HI)</option>
              <option value="Marathi">Marathi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Weekly Availability Window
            </label>
            <input
              type="text"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Subjects (comma separated)
            </label>
            <input
              type="text"
              value={subjectsRaw}
              onChange={(e) => setSubjectsRaw(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Active Learning Goals (one per line)
            </label>
            <textarea
              rows={3}
              value={goalsRaw}
              onChange={(e) => setGoalsRaw(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Multi-select chips */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Preferred Study Hours
            </span>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = preferredTimes.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() =>
                      toggleItem(preferredTimes, slot, setPreferredTimes)
                    }
                    className={`px-3 py-1.5 rounded-xl border font-semibold cursor-pointer ${
                      active
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Preferred Study Modes
            </span>
            <div className="flex flex-wrap gap-2">
              {STUDY_MODES.map((mode) => {
                const active = studyModes.includes(mode);
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => toggleItem(studyModes, mode, setStudyModes)}
                    className={`px-3 py-1.5 rounded-xl border font-semibold cursor-pointer ${
                      active
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Learning Style Preferences
            </span>
            <div className="flex flex-wrap gap-2">
              {LEARNING_STYLES.map((st) => {
                const active = learningStyles.includes(st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() =>
                      toggleItem(learningStyles, st, setLearningStyles)
                    }
                    className={`px-3 py-1.5 rounded-xl border font-semibold cursor-pointer ${
                      active
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy, Safety & Notification Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Privacy & Request Controls
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Who can discover your Study Partner profile?
              </label>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as ProfileVisibility)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="campus-peers">Verified KAMPUS Students</option>
                <option value="college-only">My College Only ({profile.college})</option>
                <option value="hidden">Hidden from Discovery</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Who can send you Study Requests?
              </label>
              <select
                value={allowRequestsFrom}
                onChange={(e) =>
                  setAllowRequestsFrom(e.target.value as RequestPermission)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="everyone">Any verified KAMPUS student</option>
                <option value="same-course-or-exam">
                  Same course / exam preparation track only
                </option>
                <option value="connections-only">
                  Pause all incoming requests
                </option>
              </select>
            </div>

            <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hideCollegeName}
                onChange={(e) => setHideCollegeName(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Hide my college name before a connection is accepted</span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Study Partner Notifications
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                New study requests & acceptances
              </span>
              <input
                type="checkbox"
                checked={notifyOnRequests}
                onChange={(e) => setNotifyOnRequests(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Study session reminders & Planner sync alerts
              </span>
              <input
                type="checkbox"
                checked={notifyOnSessions}
                onChange={(e) => setNotifyOnSessions(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                Shared goals & group activity updates
              </span>
              <input
                type="checkbox"
                checked={notifyOnGoals}
                onChange={(e) => setNotifyOnGoals(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
            </label>
          </div>
        </section>
      </div>

      {/* Blocked Users & Safety Logs */}
      {blockedPeers.length > 0 && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Blocked Users ({blockedPeers.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {blockedPeers.map((bp) => (
              <div
                key={bp.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {bp.name} · {bp.course}
                </span>
                <button
                  type="button"
                  onClick={() => unblockUser(bp.id)}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-blue-600 cursor-pointer"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
        >
          Save Preferences & Privacy Settings
        </button>
      </div>
    </form>
  );
};
