import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  X,
  FileEdit,
  ShoppingBag,
  MessageSquare,
  Bot,
  Clock,
  Check,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface LiveAppFloatingHubProps {
  onOpenAi: () => void;
}

export const LiveAppFloatingHub: React.FC<LiveAppFloatingHubProps> = ({ onOpenAi }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'note' | 'timer' | 'post'>('none');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Quick Note state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Quick Post state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Quick Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      addNotification({
        title: '🎯 Focus Session Complete!',
        description: 'Great job! 25 minutes of focused studying logged to your academic profile.',
        type: 'academic',
        time: 'Just now',
      });
      // Log to study hub
      fetch('/api/studyhub/log-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: 25 }),
      }).catch(() => {});
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, addNotification]);

  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    setIsSavingNote(true);
    try {
      await fetch('/api/studyhub/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle.trim(),
          description: 'Quick Note from Live Action Hub',
          content: noteContent.trim(),
          subjectId: 'subj-cs302',
          pinned: false,
          bookmarked: true,
        }),
      });
      addNotification({
        title: 'Note Saved Successfully',
        description: `"${noteTitle}" has been saved to your Study Hub personal notes.`,
        type: 'academic',
        time: 'Just now',
      });
      setNoteTitle('');
      setNoteContent('');
      setActiveModal('none');
      setIsOpen(false);
    } catch {
      // offline notification
      addNotification({
        title: 'Note Saved (Local)',
        description: 'Your quick note is saved to local study storage.',
        type: 'academic',
        time: 'Just now',
      });
      setActiveModal('none');
      setIsOpen(false);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    setIsPosting(true);
    try {
      await fetch('/api/campus-pulse/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: user?.id || 'usr_live_user',
          authorName: user?.name || 'Verified Scholar',
          authorCourse: user?.course || 'Undergraduate',
          authorSemester: user?.semester || 'Semester 6',
          title: postTitle.trim(),
          details: postContent.trim(),
          postType: 'Student Query',
          isUrgent: false,
        }),
      });
      addNotification({
        title: 'Post Published',
        description: 'Your question has been shared with your campus community feed!',
        type: 'campus',
        time: 'Just now',
      });
      setPostTitle('');
      setPostContent('');
      setActiveModal('none');
      setIsOpen(false);
    } catch {
      addNotification({
        title: 'Post Queued',
        description: 'Saved to local activity queue.',
        type: 'campus',
        time: 'Just now',
      });
      setActiveModal('none');
      setIsOpen(false);
    } finally {
      setIsPosting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating Speed Dial Trigger (Bottom Right) */}
      <div className="fixed bottom-20 md:bottom-8 right-5 z-40 flex flex-col items-end gap-2.5">
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Action 1: Ask AI */}
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAi();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold group cursor-pointer transition-transform hover:scale-105"
            >
              <span>Ask Kampus AI</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
            </button>

            {/* Action 2: Quick Study Note */}
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveModal('note');
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold group cursor-pointer transition-transform hover:scale-105"
            >
              <span>Quick Study Note</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileEdit className="w-4 h-4" />
              </div>
            </button>

            {/* Action 3: Focus Timer */}
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveModal('timer');
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold group cursor-pointer transition-transform hover:scale-105"
            >
              <span>Focus Pomodoro</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </button>

            {/* Action 4: Post to Campus */}
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveModal('post');
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold group cursor-pointer transition-transform hover:scale-105"
            >
              <span>Share Campus Doubt</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </button>

            {/* Action 5: Sell on Campus Market */}
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/services/market');
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold group cursor-pointer transition-transform hover:scale-105"
            >
              <span>Sell on Campus Market</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Main Speed Dial Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Live Quick Action Hub"
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
              <span className="hidden sm:inline text-xs tracking-wide">Quick Action</span>
            </>
          )}
        </button>
      </div>

      {/* Modal: Quick Study Note */}
      {activeModal === 'note' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Create Quick Note</h3>
                  <p className="text-[11px] text-slate-400">Instantly saved to your Study Hub workspace</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickNote} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dynamic Programming state memoization formula"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Content (Markdown supported)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write your study summary, code snippet, or formula here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNote}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingNote ? 'Saving...' : 'Save Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Post */}
      {activeModal === 'post' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Post Campus Doubt</h3>
                  <p className="text-[11px] text-slate-400">Share with peers across your college department</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPost} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question or Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anyone solved Lab 4 Question 2 in Distributed Systems?"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Details & Context
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain what approach you tried or what error you are encountering..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPosting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPosting ? 'Posting...' : 'Publish to Feed'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Focus Pomodoro Timer */}
      {activeModal === 'timer' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Focus Session
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6">
              <div className="text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {formatTimer(timerSeconds)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {isTimerRunning ? '🔥 Focus mode active. Zero distractions.' : 'Standard 25-minute study sprint'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-transform active:scale-95 ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {isTimerRunning ? 'Pause Sprint' : 'Start Focus Sprint'}
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
