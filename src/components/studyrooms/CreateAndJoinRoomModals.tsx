import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Flag,
  KeyRound,
  Lock,
  Plus,
  Users,
  X,
} from 'lucide-react';
import {
  COURSE_CATEGORIES,
  ROOM_COVER_OPTIONS,
  ROOM_REPORT_REASONS,
  STUDY_MODE_LIST,
} from '../../data/studyRoomsData';
import { useStudyRooms } from '../../context/StudyRoomsContext';
import {
  SessionSummaryRecord,
  StudyMode,
  StudyRoom,
  StudyRoomsReport,
} from '../../types/studyRooms';

/* ----------------------------------------------------------
   1. CREATE / SCHEDULE / EDIT STUDY ROOM MODAL
---------------------------------------------------------- */
interface CreateStudyRoomModalProps {
  isOpen: boolean;
  defaultScheduleLater?: boolean;
  editingRoom?: StudyRoom | null;
  onClose: () => void;
}

export const CreateStudyRoomModal: React.FC<CreateStudyRoomModalProps> = ({
  isOpen,
  defaultScheduleLater = false,
  editingRoom = null,
  onClose,
}) => {
  const { createRoom, updateRoom } = useStudyRooms();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [courseCategory, setCourseCategory] = useState(COURSE_CATEGORIES[0]);
  const [topic, setTopic] = useState('');
  const [coverKey, setCoverKey] = useState('desk');
  const [rules, setRules] = useState(
    'Stay focused during Pomodoro blocks, share helpful resources, and keep discussions respectful.'
  );
  const [instructions, setInstructions] = useState(
    'Work through the room objectives together and drop questions on the Doubt Board.'
  );
  const [privacy, setPrivacy] = useState<'Public' | 'Private'>('Public');
  const [visibility, setVisibility] = useState<'Listed' | 'Unlisted'>('Listed');
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [allowJoinRequests, setAllowJoinRequests] = useState(true);
  const [hostApprovalRequired, setHostApprovalRequired] = useState(false);
  const [allowResourceSharing, setAllowResourceSharing] = useState(true);
  const [enableGroupDiscussion, setEnableGroupDiscussion] = useState(true);
  const [enableWorkspace, setEnableWorkspace] = useState(true);
  const [studyMode, setStudyMode] = useState<StudyMode>('Pomodoro Study');
  const [startMode, setStartMode] = useState<'now' | 'later'>(
    defaultScheduleLater ? 'later' : 'now'
  );
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [breakIntervalMinutes, setBreakIntervalMinutes] = useState(5);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [objectiveInput, setObjectiveInput] = useState('');
  const [objectives, setObjectives] = useState<string[]>([
    'Complete targeted chapter practice problems',
  ]);
  const [invitesInput, setInvitesInput] = useState('');
  const [formErr, setFormErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormErr(null);
    if (editingRoom) {
      setName(editingRoom.name);
      setDescription(editingRoom.description);
      setSubject(editingRoom.subject);
      setCourseCategory(editingRoom.courseCategory);
      setTopic(editingRoom.topic);
      setCoverKey(editingRoom.coverKey);
      setRules(editingRoom.rules);
      setInstructions(editingRoom.instructions);
      setPrivacy(editingRoom.privacy);
      setVisibility(editingRoom.visibility);
      setMaxCapacity(editingRoom.maxCapacity);
      setAllowJoinRequests(editingRoom.allowJoinRequests);
      setHostApprovalRequired(editingRoom.hostApprovalRequired);
      setAllowResourceSharing(editingRoom.allowResourceSharing);
      setEnableGroupDiscussion(editingRoom.enableGroupDiscussion);
      setEnableWorkspace(editingRoom.enableWorkspace);
      setStudyMode(editingRoom.studyMode);
      setStartMode(editingRoom.scheduledStartAt ? 'later' : 'now');
      setScheduledDateTime(
        editingRoom.scheduledStartAt
          ? new Date(editingRoom.scheduledStartAt).toISOString().slice(0, 16)
          : ''
      );
      setDurationMinutes(editingRoom.durationMinutes);
      setBreakIntervalMinutes(editingRoom.breakIntervalMinutes);
      setRemindersEnabled(editingRoom.remindersEnabled);
      setObjectives(editingRoom.objectives.map((o) => o.label));
      setInvitesInput((editingRoom.invitedEmailsOrNames || []).join(', '));
    } else {
      setName('');
      setDescription('');
      setSubject('');
      setTopic('');
      setCoverKey('desk');
      setPrivacy('Public');
      setVisibility('Listed');
      setMaxCapacity(20);
      setHostApprovalRequired(false);
      setStartMode(defaultScheduleLater ? 'later' : 'now');
      const twoHoursAhead = new Date(Date.now() + 2 * 3600_000);
      setScheduledDateTime(
        new Date(twoHoursAhead.getTime() - twoHoursAhead.getTimezoneOffset() * 60_000)
          .toISOString()
          .slice(0, 16)
      );
      setDurationMinutes(50);
      setBreakIntervalMinutes(5);
      setObjectives(['Complete targeted chapter practice problems']);
      setInvitesInput('');
    }
  }, [isOpen, editingRoom, defaultScheduleLater]);

  if (!isOpen) return null;

  const handleAddObjective = () => {
    if (!objectiveInput.trim()) return;
    setObjectives((prev) => [...prev, objectiveInput.trim()]);
    setObjectiveInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormErr('Please enter a room name.');
      return;
    }
    if (!subject.trim()) {
      setFormErr('Please specify the subject or course.');
      return;
    }
    if (startMode === 'later' && !scheduledDateTime) {
      setFormErr('Please select a date and time for the scheduled session.');
      return;
    }

    setSubmitting(true);
    setFormErr(null);

    if (editingRoom) {
      const ok = await updateRoom(editingRoom.id, {
        name: name.trim(),
        description: description.trim(),
        subject: subject.trim(),
        courseCategory,
        topic: topic.trim() || subject.trim(),
        coverKey,
        rules: rules.trim(),
        instructions: instructions.trim(),
        privacy,
        visibility,
        maxCapacity,
        allowJoinRequests,
        hostApprovalRequired,
        allowResourceSharing,
        enableGroupDiscussion,
        enableWorkspace,
        studyMode,
        scheduledStartAt:
          startMode === 'later' && scheduledDateTime
            ? new Date(scheduledDateTime).toISOString()
            : undefined,
        durationMinutes,
        remindersEnabled,
      });
      setSubmitting(false);
      if (ok) onClose();
      return;
    }

    const created = await createRoom({
      name: name.trim(),
      description: description.trim(),
      subject: subject.trim(),
      courseCategory,
      topic: topic.trim() || subject.trim(),
      coverKey,
      rules: rules.trim(),
      instructions: instructions.trim(),
      privacy,
      visibility,
      maxCapacity,
      allowJoinRequests,
      hostApprovalRequired,
      allowResourceSharing,
      enableGroupDiscussion,
      enableWorkspace,
      studyMode,
      startMode,
      scheduledStartAt:
        startMode === 'later' && scheduledDateTime
          ? new Date(scheduledDateTime).toISOString()
          : undefined,
      durationMinutes,
      breakIntervalMinutes,
      remindersEnabled,
      objectives,
      invitedEmailsOrNames: invitesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });

    setSubmitting(false);
    if (created) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingRoom
                ? 'Edit Study Room'
                : startMode === 'later'
                  ? 'Schedule Study Session'
                  : 'Create Study Room'}
            </h2>
            <p className="text-xs text-slate-500">
              Configure study mode, workspace tools, privacy, and session timing
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {formErr && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErr}</span>
            </div>
          )}

          {/* Section 1: Basic Room Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Room Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CS-302 Graph Theory Sprint"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Subject / Course *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Algorithms & Data Structures"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Course / Exam Category
                </label>
                <select
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  {COURSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Study Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Dynamic Programming on Trees"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what students will study or solve in this session..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Cover Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Room Cover Image
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ROOM_COVER_OPTIONS.map((cov) => (
                  <button
                    key={cov.key}
                    type="button"
                    onClick={() => setCoverKey(cov.key)}
                    className={`rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      coverKey === cov.key
                        ? 'border-blue-600 ring-2 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
                    }`}
                    title={cov.label}
                  >
                    <img
                      src={cov.src}
                      alt={cov.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-11 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Study Mode & Timing */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Study Mode &amp; Schedule
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {STUDY_MODE_LIST.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setStudyMode(mode)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                    studyMode === mode
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Session Timing
                </label>
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setStartMode('now')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      startMode === 'now'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Start Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setStartMode('later')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      startMode === 'later'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Schedule
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min={10}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 50)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Break Interval (mins)
                </label>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={breakIntervalMinutes}
                  onChange={(e) => setBreakIntervalMinutes(Number(e.target.value) || 5)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs tabular-nums"
                />
              </div>
            </div>

            {startMode === 'later' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Invite Friends (optional names)
                  </label>
                  <input
                    type="text"
                    value={invitesInput}
                    onChange={(e) => setInvitesInput(e.target.value)}
                    placeholder="e.g. Aditya Sharma, Ananya Verma"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Privacy & Permissions */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Privacy, Capacity &amp; Permissions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Room Privacy
                </label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as 'Public' | 'Private')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                >
                  <option value="Public">Public Room</option>
                  <option value="Private">Private (Code/Invite Only)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Directory Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'Listed' | 'Unlisted')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
                >
                  <option value="Listed">Listed in Discovery</option>
                  <option value="Unlisted">Unlisted (Invite Link Only)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Max Participants
                </label>
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value) || 20)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {(
                [
                  ['allowJoinRequests', 'Allow student join requests', allowJoinRequests, setAllowJoinRequests],
                  ['hostApprovalRequired', 'Require host approval to enter', hostApprovalRequired, setHostApprovalRequired],
                  ['allowResourceSharing', 'Allow participants to share resources', allowResourceSharing, setAllowResourceSharing],
                  ['enableGroupDiscussion', 'Enable room discussion chat', enableGroupDiscussion, setEnableGroupDiscussion],
                  ['enableWorkspace', 'Enable shared notes, whiteboard & tasks', enableWorkspace, setEnableWorkspace],
                  ['remindersEnabled', 'Enable KAMPUS session reminders', remindersEnabled, setRemindersEnabled],
                ] as const
              ).map(([key, label, checked, setter]) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  <span className="text-slate-700 dark:text-slate-200 font-medium">{label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setter(e.target.checked)}
                    className="accent-blue-600"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Section 4: Session Objectives & Rules */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Objectives &amp; Rules
            </h3>
            <div className="space-y-2">
              {objectives.map((obj, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <span className="truncate">{obj}</span>
                  <button
                    type="button"
                    onClick={() => setObjectives((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={objectiveInput}
                  onChange={(e) => setObjectiveInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddObjective();
                    }
                  }}
                  placeholder="Add a session objective..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddObjective}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-blue-600 hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Room Rules &amp; Guidelines
              </label>
              <input
                type="text"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : editingRoom
                  ? 'Save Changes'
                  : startMode === 'later'
                    ? 'Schedule Study Room'
                    : 'Create & Open Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   2. JOIN WITH ROOM CODE OR INVITE LINK MODAL
---------------------------------------------------------- */
export const JoinByCodeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { joinByCodeOrToken } = useStudyRooms();
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setErr(null);
    const res = await joinByCodeOrToken(code.trim());
    setBusy(false);
    if (!res.ok) setErr(res.error || 'Unable to join room.');
    else {
      setCode('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Join Study Room with Code
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter a room code (e.g. <span className="font-mono font-semibold">KMP-PRIV</span>) or paste an invitation token.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {err && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
              {err}
            </div>
          )}
          <input
            type="text"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="KMP-302A or invite link..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   3. REQUEST PRIVATE ROOM ACCESS MODAL
---------------------------------------------------------- */
export const RequestJoinModal: React.FC<{
  room: StudyRoom | null;
  onClose: () => void;
}> = ({ room, onClose }) => {
  const { requestJoinRoom } = useStudyRooms();
  const [message, setMessage] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await requestJoinRoom(room.id, message);
    setBusy(false);
    if (!res.ok) setErr(res.error || 'Request failed.');
    else {
      setMessage('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Request Access to {room.name}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Hosted by {room.hostName} · {room.subject}. Include a short academic note for the host.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {err && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-600">
              {err}
            </div>
          )}
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi! Preparing for the same exam topic and would love to join..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              {busy ? 'Sending...' : 'Send Join Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   4. SESSION SUMMARY MODAL (POST-SESSION ANALYTICS)
---------------------------------------------------------- */
export const SessionSummaryModal: React.FC<{
  summary: SessionSummaryRecord | null;
  onClose: () => void;
}> = ({ summary, onClose }) => {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Study Session Summary
              </h3>
              <p className="text-xs text-slate-500">
                {summary.roomName} · {summary.subject}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-400">Recorded Duration</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {summary.totalDurationMinutes} min
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-400">Focus Cycles</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {summary.completedFocusSessions}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-400">Tasks Completed</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {summary.tasksCompleted}/{summary.totalTasks}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-400">Objectives Met</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {summary.objectivesCompleted}/{summary.totalObjectives}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-400">Shared Resources</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {summary.sharedResourcesCount}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-400">Doubts Resolved</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {summary.doubtsResolvedCount}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Participants ({summary.participantCount}):</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            {summary.participantNames.join(', ')}
          </p>
        </div>

        {summary.discussionHighlights.length > 0 && (
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold text-slate-700 dark:text-slate-200">Pinned Discussion Highlights</p>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300 list-disc pl-4">
              {summary.discussionHighlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="w-3.5 h-3.5" /> {new Date(summary.sessionDate).toLocaleString()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   5. SAFETY REPORT MODAL
---------------------------------------------------------- */
export const RoomSafetyReportModal: React.FC<{
  target: {
    roomId: string;
    targetType: StudyRoomsReport['targetType'];
    targetId: string;
    targetSummary: string;
  } | null;
  onClose: () => void;
}> = ({ target, onClose }) => {
  const { submitReport } = useStudyRooms();
  const [reason, setReason] = useState(ROOM_REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitReport({ ...target, reason, details });
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
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 truncate">
            {target.targetSummary}
          </p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
          >
            {ROOM_REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe what happened for safety review..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
