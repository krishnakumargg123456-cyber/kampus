import React, { useState } from 'react';
import { BookOpen, Calendar, Plus, Target, Trash2, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

interface StudyToolsModalProps {
  isOpen: boolean;
  conversationId: string;
  onClose: () => void;
}

export const StudyToolsModal: React.FC<StudyToolsModalProps> = ({
  isOpen,
  conversationId,
  onClose,
}) => {
  const { currentUserId, sendMessage } = useChat();
  const [tab, setTab] = useState<'session' | 'material' | 'goal'>('session');

  // Study Session state
  const [sessTitle, setSessTitle] = useState('');
  const [sessSubject, setSessSubject] = useState('');
  const [sessDate, setSessDate] = useState('Today');
  const [sessTime, setSessTime] = useState('7:00 PM IST');
  const [sessDuration, setSessDuration] = useState(50);
  const [sessObjective, setSessObjective] = useState('');

  // Study Material state
  const [matType, setMatType] = useState<'Notes' | 'PDF' | 'PYQ' | 'Study Guide' | 'Flashcards'>('Notes');
  const [matTitle, setMatTitle] = useState('');
  const [matSubject, setMatSubject] = useState('');
  const [matSummary, setMatSummary] = useState('');

  // Study Goal state
  const [goalType, setGoalType] = useState<'Daily Goal' | 'Weekly Target' | 'Revision Plan'>('Daily Goal');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalItems, setGoalItems] = useState<string[]>(['', '']);

  if (!isOpen) return null;

  const handleSendSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessTitle.trim() || !sessSubject.trim()) return;
    await sendMessage({
      conversationId,
      kind: 'study-session',
      text: `Study Session: ${sessTitle.trim()}`,
      studySession: {
        sessionId: `sess_${Date.now()}`,
        title: sessTitle.trim(),
        subject: sessSubject.trim(),
        date: sessDate.trim() || 'Today',
        time: sessTime.trim() || '7:00 PM IST',
        durationMinutes: Math.max(15, Number(sessDuration) || 50),
        objective: sessObjective.trim() || 'Focused collaborative revision and problem solving.',
        acceptedByIds: [currentUserId],
      },
    });
    onClose();
  };

  const handleSendMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;
    await sendMessage({
      conversationId,
      kind: 'study-resource',
      text: `Shared ${matType}: ${matTitle.trim()}`,
      studyResource: {
        sourceModule: 'Custom',
        resourceType: matType,
        title: matTitle.trim(),
        subject: matSubject.trim() || 'Academic Material',
        summary: matSummary.trim() || 'Shared academic reference material.',
        route: '/learn/study-hub',
      },
    });
    onClose();
  };

  const handleSendGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = goalItems.map((i) => i.trim()).filter(Boolean);
    if (!goalTitle.trim() || validItems.length === 0) return;
    await sendMessage({
      conversationId,
      kind: 'study-goal',
      text: `${goalType}: ${goalTitle.trim()}`,
      studyGoal: {
        goalType,
        title: goalTitle.trim(),
        items: validItems.map((label, idx) => ({ id: `gi_${idx}`, label, done: false })),
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Academic Collaboration Tools
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setTab('session')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer ${
              tab === 'session'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Study Session
          </button>
          <button
            type="button"
            onClick={() => setTab('material')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer ${
              tab === 'material'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Study Material
          </button>
          <button
            type="button"
            onClick={() => setTab('goal')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 cursor-pointer ${
              tab === 'goal'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <Target className="w-3.5 h-3.5" /> Study Goals
          </button>
        </div>

        <div className="p-5">
          {tab === 'session' && (
            <form onSubmit={handleSendSession} className="space-y-3">
              <input
                type="text"
                required
                value={sessTitle}
                onChange={(e) => setSessTitle(e.target.value)}
                placeholder="Session title (e.g. Graph Algorithms Mock Sprint)"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={sessSubject}
                  onChange={(e) => setSessSubject(e.target.value)}
                  placeholder="Subject"
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  min={15}
                  max={180}
                  value={sessDuration}
                  onChange={(e) => setSessDuration(Number(e.target.value))}
                  placeholder="Minutes"
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={sessDate}
                  onChange={(e) => setSessDate(e.target.value)}
                  placeholder="Date"
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={sessTime}
                  onChange={(e) => setSessTime(e.target.value)}
                  placeholder="Time"
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <textarea
                rows={2}
                value={sessObjective}
                onChange={(e) => setSessObjective(e.target.value)}
                placeholder="Study objectives..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Send Session Invite
                </button>
              </div>
            </form>
          )}

          {tab === 'material' && (
            <form onSubmit={handleSendMaterial} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={matType}
                  onChange={(e) => setMatType(e.target.value as typeof matType)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="Notes">Notes</option>
                  <option value="PDF">PDF</option>
                  <option value="PYQ">Previous Year Paper</option>
                  <option value="Study Guide">Study Guide</option>
                  <option value="Flashcards">Flashcards</option>
                </select>
                <input
                  type="text"
                  value={matSubject}
                  onChange={(e) => setMatSubject(e.target.value)}
                  placeholder="Subject"
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <input
                type="text"
                required
                value={matTitle}
                onChange={(e) => setMatTitle(e.target.value)}
                placeholder="Material title"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
              <textarea
                rows={3}
                value={matSummary}
                onChange={(e) => setMatSummary(e.target.value)}
                placeholder="Summary or key topics covered..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Share Material
                </button>
              </div>
            </form>
          )}

          {tab === 'goal' && (
            <form onSubmit={handleSendGoal} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as typeof goalType)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="Daily Goal">Daily Goal</option>
                  <option value="Weekly Target">Weekly Target</option>
                  <option value="Revision Plan">Revision Plan</option>
                </select>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Plan title"
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-2">
                {goalItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) =>
                        setGoalItems((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                      }
                      placeholder={`Target item ${idx + 1}`}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                    />
                    {goalItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGoalItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setGoalItems((prev) => [...prev, ''])}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add target
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Share Study Goals
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
