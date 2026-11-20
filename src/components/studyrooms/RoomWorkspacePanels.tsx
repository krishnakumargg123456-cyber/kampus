import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  CheckSquare,
  Code,
  ExternalLink,
  FileText,
  Heading2,
  List,
  Link2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Square,
  Target,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Bold,
  Eye,
  Edit3,
} from 'lucide-react';
import { PomodoroPhase, SharedNoteItem, StudyRoom } from '../../types/studyRooms';
import { useStudyRooms } from '../../context/StudyRoomsContext';
import { formatFileSize, formatShortTime, formatTimerSeconds } from '../../data/studyRoomsData';
import { MarkdownRenderer } from '../kampusai/MarkdownRenderer';

/* ----------------------------------------------------------
   1. POMODORO FOCUS TIMER & STUDY AREA PANEL
---------------------------------------------------------- */
export const PomodoroFocusPanel: React.FC<{
  room: StudyRoom;
  isHostOrCoHost: boolean;
}> = ({ room, isHostOrCoHost }) => {
  const { controlPomodoro, updateObjective, showToast } = useStudyRooms();
  const { pomodoro } = room;

  const computeRemaining = () => {
    if (pomodoro.status !== 'running') return pomodoro.remainingSeconds;
    const elapsed = Math.floor((Date.now() - new Date(pomodoro.lastUpdatedAt).getTime()) / 1000);
    return Math.max(0, pomodoro.remainingSeconds - Math.max(0, elapsed));
  };

  const [displaySeconds, setDisplaySeconds] = useState<number>(computeRemaining);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [focusMins, setFocusMins] = useState(pomodoro.focusMinutes);
  const [shortMins, setShortMins] = useState(pomodoro.shortBreakMinutes);
  const [longMins, setLongMins] = useState(pomodoro.longBreakMinutes);
  const [autoBreak, setAutoBreak] = useState(pomodoro.autoBreakReminders);
  const [newObjective, setNewObjective] = useState('');
  const [ambientOn, setAmbientOn] = useState(false);

  const cycleTriggeredRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    setFocusMins(pomodoro.focusMinutes);
    setShortMins(pomodoro.shortBreakMinutes);
    setLongMins(pomodoro.longBreakMinutes);
    setAutoBreak(pomodoro.autoBreakReminders);
    cycleTriggeredRef.current = false;
    setDisplaySeconds(computeRemaining());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pomodoro.phase,
    pomodoro.status,
    pomodoro.remainingSeconds,
    pomodoro.lastUpdatedAt,
    pomodoro.focusMinutes,
    pomodoro.shortBreakMinutes,
    pomodoro.longBreakMinutes,
    pomodoro.autoBreakReminders,
  ]);

  useEffect(() => {
    if (pomodoro.status !== 'running') return;
    const id = window.setInterval(() => {
      const next = computeRemaining();
      setDisplaySeconds(next);
      if (next <= 0 && !cycleTriggeredRef.current && isHostOrCoHost) {
        cycleTriggeredRef.current = true;
        controlPomodoro(room.id, 'complete-cycle');
      }
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoro.status, pomodoro.remainingSeconds, pomodoro.lastUpdatedAt, isHostOrCoHost, room.id]);

  // Client-side gentle filtered brown noise for optional study focus sound
  const toggleAmbientSound = () => {
    if (ambientOn) {
      try {
        audioSourceRef.current?.stop();
        audioCtxRef.current?.close();
      } catch {
        // ignore audio teardown errors
      }
      audioSourceRef.current = null;
      audioCtxRef.current = null;
      setAmbientOn(false);
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.25;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 340;

      const gain = ctx.createGain();
      gain.gain.value = 0.22;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      audioCtxRef.current = ctx;
      audioSourceRef.current = source;
      setAmbientOn(true);
    } catch {
      showToast('Ambient study audio is not supported in this browser.');
    }
  };

  useEffect(() => {
    return () => {
      try {
        audioSourceRef.current?.stop();
        audioCtxRef.current?.close();
      } catch {
        // ignore cleanup
      }
    };
  }, []);

  const totalPhaseSeconds = useMemo(() => {
    if (pomodoro.phase === 'short-break') return pomodoro.shortBreakMinutes * 60;
    if (pomodoro.phase === 'long-break') return pomodoro.longBreakMinutes * 60;
    return pomodoro.focusMinutes * 60;
  }, [pomodoro]);

  const progressPct =
    totalPhaseSeconds > 0
      ? Math.min(100, Math.max(0, Math.round(((totalPhaseSeconds - displaySeconds) / totalPhaseSeconds) * 100)))
      : 0;

  const doneObjectives = room.objectives.filter((o) => o.done).length;
  const objPct = room.objectives.length
    ? Math.round((doneObjectives / room.objectives.length) * 100)
    : 0;

  const handleSaveTimerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await controlPomodoro(room.id, 'configure', {
      focusMinutes: Math.max(5, Math.min(120, Number(focusMins) || 25)),
      shortBreakMinutes: Math.max(1, Math.min(30, Number(shortMins) || 5)),
      longBreakMinutes: Math.max(5, Math.min(60, Number(longMins) || 15)),
      autoBreakReminders: autoBreak,
    });
    setShowTimerSettings(false);
    showToast('Pomodoro timer intervals updated.');
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjective.trim()) return;
    await updateObjective(room.id, 'add', { label: newObjective.trim() });
    setNewObjective('');
  };

  return (
    <div className="space-y-5">
      {/* Pomodoro Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(
              [
                { id: 'focus', label: `Focus (${pomodoro.focusMinutes}m)` },
                { id: 'short-break', label: `Short Break (${pomodoro.shortBreakMinutes}m)` },
                { id: 'long-break', label: `Long Break (${pomodoro.longBreakMinutes}m)` },
              ] as Array<{ id: PomodoroPhase; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                disabled={!isHostOrCoHost}
                onClick={() => controlPomodoro(room.id, 'switch-phase', { phase: tab.id })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  pomodoro.phase === tab.id
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                } ${!isHostOrCoHost ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAmbientSound}
              title="Toggle gentle ambient rain sound"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                ambientOn
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {ambientOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{ambientOn ? 'Focus Audio On' : 'Focus Audio'}</span>
            </button>
            {isHostOrCoHost && (
              <button
                type="button"
                onClick={() => setShowTimerSettings((prev) => !prev)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Timer Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Synchronized Clock */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {pomodoro.phase === 'focus'
                ? 'Deep Focus Block'
                : pomodoro.phase === 'short-break'
                  ? 'Short Recovery Break'
                  : 'Long Break'}
            </p>
            <div className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums mt-1">
              {formatTimerSeconds(displaySeconds)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Completed Focus Cycles:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                {pomodoro.completedFocusSessions}
              </span>
              {!isHostOrCoHost && ' · Synchronized by room host'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isHostOrCoHost ? (
              <>
                {pomodoro.status === 'running' ? (
                  <button
                    type="button"
                    onClick={() => controlPomodoro(room.id, 'pause')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold cursor-pointer shadow-xs"
                  >
                    <Pause className="w-4 h-4" /> Pause Timer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => controlPomodoro(room.id, 'start')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer shadow-xs"
                  >
                    <Play className="w-4 h-4" /> {pomodoro.status === 'paused' ? 'Resume Focus' : 'Start Focus'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => controlPomodoro(room.id, 'reset')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                Status:{' '}
                <span className="font-semibold text-slate-900 dark:text-white capitalize">
                  {pomodoro.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Track */}
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                pomodoro.phase === 'focus' ? 'bg-blue-600' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Custom Settings Popover */}
        {showTimerSettings && isHostOrCoHost && (
          <form
            onSubmit={handleSaveTimerSettings}
            className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Focus (min)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={focusMins}
                onChange={(e) => setFocusMins(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Short Break (min)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={shortMins}
                onChange={(e) => setShortMins(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Long Break (min)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={longMins}
                onChange={(e) => setLongMins(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBreak}
                  onChange={(e) => setAutoBreak(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>Reminders</span>
              </label>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
              >
                Apply
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Study Focus Area & Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Topic, Instructions & Rules */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Study Focus & Room Guidelines</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Current Topic</p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">{room.topic}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Session Instructions</p>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {room.instructions || room.description}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Room Rules</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{room.rules}</p>
            </div>
          </div>
        </div>

        {/* Shared Study Objectives & Progress */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Session Objectives</h3>
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
              {doneObjectives}/{room.objectives.length} ({objPct}%)
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${objPct}%` }} />
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {room.objectives.length === 0 ? (
              <p className="text-xs text-slate-400">No session objectives added yet.</p>
            ) : (
              room.objectives.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => updateObjective(room.id, 'toggle', { objectiveId: obj.id })}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left cursor-pointer"
                >
                  {obj.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-xs leading-snug ${
                      obj.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {obj.label}
                  </span>
                </button>
              ))
            )}
          </div>

          <form onSubmit={handleAddObjective} className="flex gap-2">
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Add shared session objective..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   2. SHARED NOTES EDITOR & TOPIC GROUPING PANEL
---------------------------------------------------------- */
export const SharedNotesPanel: React.FC<{
  room: StudyRoom;
  canEditWorkspace: boolean;
}> = ({ room, canEditWorkspace }) => {
  const { saveNote } = useStudyRooms();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(room.notes[0]?.id || null);
  const [topic, setTopic] = useState(room.notes[0]?.topic || room.topic || 'General');
  const [title, setTitle] = useState(room.notes[0]?.title || '');
  const [content, setContent] = useState(room.notes[0]?.content || '');
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const selectedNote: SharedNoteItem | undefined = room.notes.find((n) => n.id === selectedNoteId);

  useEffect(() => {
    if (!selectedNoteId && room.notes.length > 0) {
      const first = room.notes[0];
      setSelectedNoteId(first.id);
      setTopic(first.topic);
      setTitle(first.title);
      setContent(first.content);
    }
  }, [room.notes, selectedNoteId]);

  const selectNote = (note: SharedNoteItem) => {
    setSelectedNoteId(note.id);
    setTopic(note.topic);
    setTitle(note.title);
    setContent(note.content);
  };

  const startNewNote = () => {
    setSelectedNoteId(null);
    setTopic(room.topic || 'General');
    setTitle('');
    setContent('');
    setPreviewMode(false);
  };

  const insertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => `${prev}${snippet}`);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const next = content.slice(0, start) + snippet + content.slice(end);
    setContent(next);
    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await saveNote(room.id, 'upsert', {
      noteId: selectedNoteId || undefined,
      topic: topic.trim() || 'General',
      title: title.trim(),
      content,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Notes List */}
      <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Room Notes ({room.notes.length})</h3>
          {canEditWorkspace && (
            <button
              type="button"
              onClick={startNewNote}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Note
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {room.notes.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No shared notes created yet.</p>
          ) : (
            room.notes.map((n) => (
              <div
                key={n.id}
                onClick={() => selectNote(n)}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedNoteId === n.id
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30'
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">{n.topic}</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                      {n.title}
                    </p>
                  </div>
                  {canEditWorkspace && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveNote(room.id, 'delete', { noteId: n.id });
                        if (selectedNoteId === n.id) startNewNote();
                      }}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Updated by {n.updatedBy} · {formatShortTime(n.updatedAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Collaborative Editor */}
      <form
        onSubmit={handleSave}
        className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
            <input
              type="text"
              value={topic}
              disabled={!canEditWorkspace}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic group"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
            />
            <input
              type="text"
              required
              disabled={!canEditWorkspace}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Shared note title..."
              className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
            />
          </div>

          <button
            type="button"
            onClick={() => setPreviewMode((p) => !p)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{previewMode ? 'Edit' : 'Preview'}</span>
          </button>
        </div>

        {/* Formatting Toolbar */}
        {!previewMode && canEditWorkspace && (
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => insertSnippet('## Heading\n')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Heading2 className="w-3.5 h-3.5" /> Heading
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('**bold text**')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Bold className="w-3.5 h-3.5" /> Bold
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n- Bullet point')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('`code`')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" /> Code
            </button>
          </div>
        )}

        {previewMode ? (
          <div className="min-h-[260px] rounded-xl border border-slate-100 dark:border-slate-800 p-4 text-sm bg-slate-50/50 dark:bg-slate-950/30">
            <MarkdownRenderer content={content || '*Nothing written yet.*'} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={12}
            disabled={!canEditWorkspace}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Collaborate on structured notes, key formulas, definitions, and takeaways..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-slate-400">
            {selectedNote
              ? `Last saved by ${selectedNote.updatedBy} at ${formatShortTime(selectedNote.updatedAt)}`
              : 'Drafting a new shared note'}
          </span>
          {canEditWorkspace && (
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save to Room Notes
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

/* ----------------------------------------------------------
   3. SHARED RESOURCES PANEL (FILE UPLOAD + LINKS)
---------------------------------------------------------- */
export const SharedResourcesPanel: React.FC<{
  room: StudyRoom;
  canShare: boolean;
  isHostOrMod: boolean;
}> = ({ room, canShare, isHostOrMod }) => {
  const { currentUserId, uploadRoomFile, mutateResource, showToast } = useStudyRooms();
  const [kind, setKind] = useState<'PDF' | 'Notes' | 'Document' | 'Link'>('Link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadRoomFile(file, room.id);
      const inferredKind = file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document';
      await mutateResource(room.id, 'add', {
        kind: inferredKind,
        title: file.name,
        url: uploaded.url,
        fileName: uploaded.fileName,
        sizeBytes: uploaded.sizeBytes,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    await mutateResource(room.id, 'add', {
      kind,
      title: title.trim(),
      url: url.trim(),
    });
    setTitle('');
    setUrl('');
  };

  return (
    <div className="space-y-4">
      {canShare && room.allowResourceSharing ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Share Study Material</h3>
              <p className="text-xs text-slate-500">Upload PDFs/documents up to 5 MB or attach reference links.</p>
            </div>
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload PDF / File'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <form onSubmit={handleAddLink} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'PDF' | 'Notes' | 'Document' | 'Link')}
              className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs"
            >
              <option value="Link">Link</option>
              <option value="Notes">Notes</option>
              <option value="PDF">PDF</option>
              <option value="Document">Document</option>
            </select>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title (e.g. Lecture 04 Slides)"
              className="sm:col-span-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
            />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="sm:col-span-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold py-2 cursor-pointer"
            >
              Add Link
            </button>
          </form>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-100 dark:bg-slate-800/70 p-3 text-xs text-slate-500">
          Resource sharing is disabled or restricted by the room host.
        </div>
      )}

      {/* Resources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {room.resources.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400">
            No study materials shared in this room yet.
          </div>
        ) : (
          room.resources.map((res) => (
            <div
              key={res.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                  {res.kind === 'Link' ? <Link2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{res.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {res.kind}
                    {res.sizeBytes ? ` · ${formatFileSize(res.sizeBytes)}` : ''} · Shared by {res.sharedBy}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </a>
                {(res.sharedById === currentUserId || isHostOrMod) && (
                  <button
                    type="button"
                    onClick={() => mutateResource(room.id, 'delete', { resourceId: res.id })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------
   4. GROUP STUDY TASK BOARD PANEL
---------------------------------------------------------- */
export const TaskBoardPanel: React.FC<{
  room: StudyRoom;
  canEditWorkspace: boolean;
}> = ({ room, canEditWorkspace }) => {
  const { currentUserName, mutateTask } = useStudyRooms();
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState(currentUserName);

  const completed = room.tasks.filter((t) => t.done).length;
  const pct = room.tasks.length ? Math.round((completed / room.tasks.length) * 100) : 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await mutateTask(room.id, 'add', { title: title.trim(), assigneeName: assignee });
    setTitle('');
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Group Study Task Board</h3>
          <p className="text-xs text-slate-500">Assign practice tasks and track collective room completion.</p>
        </div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
          {completed}/{room.tasks.length} Done ({pct}%)
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {canEditWorkspace && (
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New study task (e.g. Solve Graph Coloring Q4)..."
            className="sm:col-span-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
          />
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="sm:col-span-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs"
          >
            {room.participants.map((p) => (
              <option key={p.userId} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 text-white text-xs font-semibold py-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </form>
      )}

      <div className="space-y-2">
        {room.tasks.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No shared tasks created yet.</p>
        ) : (
          room.tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
            >
              <button
                type="button"
                onClick={() => mutateTask(room.id, 'toggle', { taskId: task.id })}
                className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                    task.done
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {task.done && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${
                      task.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-[11px] text-slate-400">Assigned to {task.assigneeName}</p>
                </div>
              </button>
              {canEditWorkspace && (
                <button
                  type="button"
                  onClick={() => mutateTask(room.id, 'delete', { taskId: task.id })}
                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
