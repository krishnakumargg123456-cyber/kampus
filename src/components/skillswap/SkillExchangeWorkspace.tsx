import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  ExternalLink,
  FileText,
  MessageSquare,
  Plus,
  Share2,
  Square,
  Star,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useSkillSwap } from '../../context/SkillSwapContext';
import {
  SHARED_RESOURCE_KINDS,
  formatFileSize,
  formatShortDate,
  getStudentInitials,
} from '../../data/skillSwapData';
import {
  SharedResourceKind,
  SkillExchange,
  SkillSession,
} from '../../types/skillSwap';

interface SkillExchangeWorkspaceProps {
  exchange: SkillExchange;
  onBack: () => void;
  onOpenAi: (skill: string) => void;
  onShareCommunity: (draft: { title: string; content: string; tags: string[] }) => void;
}

export const SkillExchangeWorkspace: React.FC<SkillExchangeWorkspaceProps> = ({
  exchange,
  onBack,
  onOpenAi,
  onShareCommunity,
}) => {
  const navigate = useNavigate();
  const {
    currentUserId,
    reviews,
    updateExchangeProgress,
    uploadSkillFile,
    mutateExchangeResource,
    manageExchangeSession,
    submitExchangeReview,
    openPartnerChat,
    showToast,
  } = useSkillSwap();

  const [activeTrackIdx, setActiveTrackIdx] = useState(0);
  const [topicInput, setTopicInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [milestoneInput, setMilestoneInput] = useState('');

  // Resource form
  const [resKind, setResKind] = useState<SharedResourceKind>('Study Notes');
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Session form
  const [sesTopic, setSesTopic] = useState('');
  const [sesDate, setSesDate] = useState(new Date().toISOString().slice(0, 10));
  const [sesTime, setSesTime] = useState('18:30');
  const [sesDuration, setSesDuration] = useState(60);
  const [sesObj, setSesObj] = useState('');
  const [sesPrep, setSesPrep] = useState('');
  const [reschedulingSession, setReschedulingSession] = useState<SkillSession | null>(null);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('');

  // Feedback form
  const [revExp, setRevExp] = useState(5);
  const [revComm, setRevComm] = useState(5);
  const [revRel, setRevRel] = useState(5);
  const [revClar, setRevClar] = useState(5);
  const [revText, setRevText] = useState('');
  const [revErr, setRevErr] = useState<string | null>(null);

  const partnerName =
    exchange.studentAId === currentUserId ? exchange.studentBName : exchange.studentAName;
  const partnerId =
    exchange.studentAId === currentUserId ? exchange.studentBId : exchange.studentAId;

  const activeTrack = exchange.tracks[activeTrackIdx] || exchange.tracks[0];

  const trackProgress = useMemo(() => {
    if (!activeTrack) return { done: 0, total: 0, pct: 0 };
    const total =
      activeTrack.topics.length + activeTrack.tasks.length + activeTrack.milestones.length;
    const done =
      activeTrack.topics.filter((t) => t.done).length +
      activeTrack.tasks.filter((t) => t.done).length +
      activeTrack.milestones.filter((m) => m.done).length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [activeTrack]);

  const myExistingReview = useMemo(
    () =>
      reviews.find(
        (r) => r.exchangeId === exchange.id && r.reviewerId === currentUserId
      ),
    [reviews, exchange.id, currentUserId]
  );

  const handleUploadTrackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeTrack) return;
    setUploadingFile(true);
    try {
      const uploaded = await uploadSkillFile(file);
      const inferred: SharedResourceKind = file.type.startsWith('image/')
        ? 'Image'
        : file.name.toLowerCase().endsWith('.pdf')
          ? 'PDF Document'
          : file.name.toLowerCase().includes('.ppt')
            ? 'Presentation'
            : 'Study Notes';
      await mutateExchangeResource(exchange.id, {
        action: 'add',
        trackId: activeTrack.id,
        kind: inferred,
        title: file.name,
        url: uploaded.url,
        fileName: uploaded.fileName,
        sizeBytes: uploaded.sizeBytes,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddResourceLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrack || !resTitle.trim() || !resUrl.trim()) return;
    await mutateExchangeResource(exchange.id, {
      action: 'add',
      trackId: activeTrack.id,
      kind: resKind,
      title: resTitle.trim(),
      url: resUrl.trim(),
    });
    setResTitle('');
    setResUrl('');
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesTopic.trim() || !sesDate || !sesTime) return;
    await manageExchangeSession(exchange.id, {
      action: 'create',
      topic: sesTopic.trim(),
      dateISO: sesDate,
      timeSlot: sesTime,
      durationMinutes: sesDuration,
      objectives: sesObj.trim(),
      prepNotes: sesPrep.trim(),
    });
    setSesTopic('');
    setSesObj('');
    setSesPrep('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevErr(null);
    const res = await submitExchangeReview(exchange.id, {
      learningExperience: revExp,
      communication: revComm,
      reliability: revRel,
      teachingClarity: revClar,
      writtenReview: revText,
    });
    if (!res.ok) setRevErr(res.error || 'Could not submit review.');
    else setRevText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Exchange Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#172554] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
            {getStudentInitials(partnerName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                {exchange.skillAForB} ↔ {exchange.skillBForA}
              </h2>
              <span
                className={`text-[11px] font-bold ${
                  exchange.status === 'Active'
                    ? 'text-emerald-600'
                    : exchange.status === 'Completed'
                      ? 'text-blue-600'
                      : 'text-red-500'
                }`}
              >
                {exchange.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              Partner: {partnerName} · {exchange.exchangeType}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openPartnerChat(partnerName, partnerId, exchange.skillAForB)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Open KAMPUS Chat
          </button>
          <button
            type="button"
            onClick={() => onOpenAi(activeTrack?.skillName || exchange.skillAForB)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600" /> AI Roadmap
          </button>
          <button
            type="button"
            onClick={() =>
              onShareCommunity({
                title: `SkillSwap Progress: ${exchange.skillAForB} ↔ ${exchange.skillBForA}`,
                content: `Practicing ${exchange.skillAForB} and ${exchange.skillBForA} with ${partnerName} on KAMPUS SkillSwap (${trackProgress.pct}% milestones/tasks completed).`,
                tags: ['SkillSwap', 'PeerLearning'],
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-orange-500" /> Share Milestone
          </button>
          {exchange.status === 'Active' && (
            <>
              <button
                type="button"
                onClick={() =>
                  updateExchangeProgress(exchange.id, {
                    action: 'set-status',
                    status: 'Completed',
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
              </button>
              <button
                type="button"
                onClick={() =>
                  updateExchangeProgress(exchange.id, {
                    action: 'set-status',
                    status: 'Cancelled',
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Connection
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Split: Dual Learning Tracks + Session Scheduler */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: DUAL LEARNING TRACKS & RESOURCES */}
        <section className="lg:col-span-7 space-y-5">
          {/* Track Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            {exchange.tracks.map((trk, idx) => (
              <button
                key={trk.id}
                type="button"
                onClick={() => setActiveTrackIdx(idx)}
                className={`flex-1 min-w-[200px] py-2 px-3 rounded-xl text-left text-xs cursor-pointer transition-colors ${
                  activeTrackIdx === idx
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <p className="font-extrabold truncate">{trk.skillName} Track</p>
                <p className="text-[11px] text-slate-400 truncate">
                  Learner: {trk.learnerName} · Mentor: {trk.mentorName}
                </p>
              </button>
            ))}
          </div>

          {activeTrack && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-6 text-xs">
              {/* Track Progress Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {activeTrack.skillName} Progress
                  </h3>
                  <span className="font-bold text-blue-600 tabular-nums">
                    {trackProgress.done}/{trackProgress.total} Completed ({trackProgress.pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${trackProgress.pct}%` }}
                  />
                </div>
              </div>

              {/* Topics Checklist */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Learning Topics</h4>
                {activeTrack.topics.map((top) => (
                  <button
                    key={top.id}
                    type="button"
                    onClick={() =>
                      updateExchangeProgress(exchange.id, {
                        action: 'toggle-topic',
                        trackId: activeTrack.id,
                        itemId: top.id,
                      })
                    }
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left cursor-pointer"
                  >
                    {top.done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={top.done ? 'line-through text-slate-400' : ''}>
                      {top.title}
                    </span>
                  </button>
                ))}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Add a learning topic..."
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!topicInput.trim()) return;
                      await updateExchangeProgress(exchange.id, {
                        action: 'add-topic',
                        trackId: activeTrack.id,
                        title: topicInput.trim(),
                      });
                      setTopicInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Practice Tasks */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Practice Tasks</h4>
                {activeTrack.tasks.map((tsk) => (
                  <button
                    key={tsk.id}
                    type="button"
                    onClick={() =>
                      updateExchangeProgress(exchange.id, {
                        action: 'toggle-task',
                        trackId: activeTrack.id,
                        itemId: tsk.id,
                      })
                    }
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left cursor-pointer"
                  >
                    {tsk.done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={tsk.done ? 'line-through text-slate-400' : ''}>
                      {tsk.title}
                    </span>
                  </button>
                ))}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="Add a practice task..."
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!taskInput.trim()) return;
                      await updateExchangeProgress(exchange.id, {
                        action: 'add-task',
                        trackId: activeTrack.id,
                        title: taskInput.trim(),
                      });
                      setTaskInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Learning Milestones */}
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">
                  Key Milestones
                </h4>
                {activeTrack.milestones.map((mil) => (
                  <button
                    key={mil.id}
                    type="button"
                    onClick={() =>
                      updateExchangeProgress(exchange.id, {
                        action: 'toggle-milestone',
                        trackId: activeTrack.id,
                        itemId: mil.id,
                      })
                    }
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left cursor-pointer"
                  >
                    {mil.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={mil.done ? 'line-through text-slate-400' : ''}>
                      {mil.title}
                    </span>
                  </button>
                ))}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={milestoneInput}
                    onChange={(e) => setMilestoneInput(e.target.value)}
                    placeholder="Add a milestone..."
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!milestoneInput.trim()) return;
                      await updateExchangeProgress(exchange.id, {
                        action: 'add-milestone',
                        trackId: activeTrack.id,
                        title: milestoneInput.trim(),
                      });
                      setMilestoneInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Shared Learning Resources for Track */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">
                      Shared Materials ({activeTrack.skillName})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      PDFs, notes, presentations, images, assignments &amp; links
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/learn/notes-exchange')}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" /> Notes Exchange
                    </button>
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingFile ? 'Uploading...' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        onChange={handleUploadTrackFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <form
                  onSubmit={handleAddResourceLink}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2"
                >
                  <select
                    value={resKind}
                    onChange={(e) => setResKind(e.target.value as SharedResourceKind)}
                    className="sm:col-span-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2"
                  >
                    {SHARED_RESOURCE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="Material title"
                    className="sm:col-span-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2"
                  />
                  <input
                    type="url"
                    required
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    placeholder="https://..."
                    className="sm:col-span-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold py-2 cursor-pointer"
                  >
                    Add
                  </button>
                </form>

                {activeTrack.resources.length === 0 ? (
                  <p className="text-slate-400">No materials shared for this track yet.</p>
                ) : (
                  <div className="space-y-2">
                    {activeTrack.resources.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {r.title}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {r.kind}
                              {r.sizeBytes ? ` · ${formatFileSize(r.sizeBytes)}` : ''} · By{' '}
                              {r.sharedByName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </a>
                          {r.sharedById === currentUserId && (
                            <button
                              type="button"
                              onClick={() =>
                                mutateExchangeResource(exchange.id, {
                                  action: 'delete',
                                  trackId: activeTrack.id,
                                  resourceId: r.id,
                                })
                              }
                              className="text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: LEARNING SESSIONS & FEEDBACK */}
        <aside className="lg:col-span-5 space-y-5">
          {/* Session Scheduler */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Schedule Learning Session
              </h3>
            </div>

            <form onSubmit={handleScheduleSession} className="space-y-2.5">
              <input
                type="text"
                required
                value={sesTopic}
                onChange={(e) => setSesTopic(e.target.value)}
                placeholder="Session topic (e.g. Figma Auto-Layout Walkthrough)..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  required
                  value={sesDate}
                  onChange={(e) => setSesDate(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2"
                />
                <input
                  type="time"
                  required
                  value={sesTime}
                  onChange={(e) => setSesTime(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2"
                />
                <select
                  value={sesDuration}
                  onChange={(e) => setSesDuration(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2"
                >
                  {[30, 45, 60, 90].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={sesObj}
                onChange={(e) => setSesObj(e.target.value)}
                placeholder="Session objectives..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
              <input
                type="text"
                value={sesPrep}
                onChange={(e) => setSesPrep(e.target.value)}
                placeholder="Preparation notes (e.g. Install Figma / VS Code)..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Schedule &amp; Sync to Planner
              </button>
            </form>

            {/* Sessions List */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {exchange.sessions.length === 0 ? (
                <p className="text-slate-400">No sessions scheduled yet.</p>
              ) : (
                exchange.sessions.map((ses) => (
                  <div
                    key={ses.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{ses.topic}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {ses.dateISO} at {ses.timeSlot} ({ses.durationMinutes} min) ·{' '}
                          <span className="font-semibold text-blue-600">{ses.status}</span>
                        </p>
                      </div>
                    </div>
                    {ses.objectives && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Goal: {ses.objectives}
                      </p>
                    )}

                    {reschedulingSession?.id === ses.id ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <input
                          type="date"
                          value={reschedDate}
                          onChange={(e) => setReschedDate(e.target.value)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px]"
                        />
                        <input
                          type="time"
                          value={reschedTime}
                          onChange={(e) => setReschedTime(e.target.value)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await manageExchangeSession(exchange.id, {
                              action: 'reschedule',
                              sessionId: ses.id,
                              dateISO: reschedDate || ses.dateISO,
                              timeSlot: reschedTime || ses.timeSlot,
                            });
                            setReschedulingSession(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      ses.status !== 'Completed' &&
                      ses.status !== 'Cancelled' && (
                        <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() =>
                              manageExchangeSession(exchange.id, {
                                action: 'set-status',
                                sessionId: ses.id,
                                status: 'In Progress',
                              })
                            }
                            className="text-blue-600 font-semibold hover:underline cursor-pointer"
                          >
                            Start
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              manageExchangeSession(exchange.id, {
                                action: 'set-status',
                                sessionId: ses.id,
                                status: 'Completed',
                              })
                            }
                            className="text-emerald-600 font-semibold hover:underline cursor-pointer"
                          >
                            Mark Completed
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReschedulingSession(ses);
                              setReschedDate(ses.dateISO);
                              setReschedTime(ses.timeSlot);
                            }}
                            className="text-slate-500 font-semibold hover:underline cursor-pointer"
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              manageExchangeSession(exchange.id, {
                                action: 'set-status',
                                sessionId: ses.id,
                                status: 'Cancelled',
                              })
                            }
                            className="text-red-500 font-semibold hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Exchange Feedback (Unlocked only when Exchange is Completed) */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Exchange Feedback
              </h3>
            </div>

            {exchange.status !== 'Completed' ? (
              <p className="text-slate-500">
                Feedback unlocks once this exchange is marked Completed so reviews reflect genuine completed learning.
              </p>
            ) : myExistingReview ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                  <Check className="w-4 h-4" /> Your Feedback Recorded
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  &ldquo;{myExistingReview.writtenReview}&rdquo;
                </p>
                <p className="text-[11px] text-slate-400">
                  Submitted {formatShortDate(myExistingReview.createdAt)}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                {revErr && (
                  <p className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600">
                    {revErr}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Learning Experience', val: revExp, set: setRevExp },
                    { label: 'Communication', val: revComm, set: setRevComm },
                    { label: 'Reliability', val: revRel, set: setRevRel },
                    { label: 'Teaching Clarity', val: revClar, set: setRevClar },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        {field.label}
                      </label>
                      <select
                        value={field.val}
                        onChange={(e) => field.set(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} / 5
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <textarea
                  rows={3}
                  required
                  value={revText}
                  onChange={(e) => setRevText(e.target.value)}
                  placeholder="Share honest, constructive feedback about what worked well..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Submit Genuine Review
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
