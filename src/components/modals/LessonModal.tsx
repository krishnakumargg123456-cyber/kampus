import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle, BookOpen, Sparkles, Download, Flame } from 'lucide-react';
import { ContinueLearningCourse } from '../../types';
import { triggerMilestoneConfetti } from '../../utils/confetti';
import { useAuth } from '../../context/AuthContext';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: ContinueLearningCourse;
  onOpenAi: (query?: string) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({ isOpen, onClose, course, onOpenAi }) => {
  const { profile } = useAuth();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && !completed) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, completed]);

  if (!isOpen) return null;

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400">{course.code}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{course.subject}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {course.chapter}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lesson Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-800 dark:text-slate-200 text-sm">
          {/* Progress & Focus Timer Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{course.currentLesson}</div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                Overall module progress: {course.progressPercent}%
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span>⏱ Session:</span>
                <span className="text-blue-600 dark:text-blue-400">{formatTime(seconds)}</span>
              </div>
              <button
                onClick={() => setIsActive(!isActive)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title={isActive ? 'Pause Timer' : 'Resume Timer'}
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setSeconds(0)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lesson Content Overview */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">
              Lesson Objectives & Formulation
            </h4>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              When tackling Tree Dynamic Programming, the key observation is that every tree has a natural recursive structure. Removing any node partitions the tree into independent connected components. By fixing an arbitrary node as the root, any node <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono">u</code> acts as the root of its own subtree.
            </p>
          </div>

          {/* Key Formula Box */}
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 font-mono text-xs sm:text-sm space-y-2">
            <div className="font-sans font-semibold text-blue-900 dark:text-blue-300 text-xs">
              Recurrence Relation:
            </div>
            <div className="text-slate-800 dark:text-slate-200">
              dp[u][0] = ∑ max(dp[v][0], dp[v][1])   <span className="text-slate-400">// if u is NOT included</span>
            </div>
            <div className="text-slate-800 dark:text-slate-200">
              dp[u][1] = weight[u] + ∑ dp[v][0]     <span className="text-slate-400">// if u IS included</span>
            </div>
          </div>

          {/* Interactive AI Query trigger */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                Stuck on transition logic or re-rooting technique?
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenAi('Walk me through Tree DP re-rooting technique with an example');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Ask KAMPUS AI
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mx-6 mb-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-400 animate-fire-pulse" />
              {toastMessage}
            </span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <button
            onClick={() => {
              const sheetContent = `# ${course.code}: ${course.subject}\n## ${course.chapter}\n\n${course.currentLesson}\n\n### Recurrence Relation (Tree DP)\n- dp[u][0] = sum(max(dp[v][0], dp[v][1]))  // if u is NOT included\n- dp[u][1] = weight[u] + sum(dp[v][0])      // if u IS included\n\nDownloaded from KAMPUS Study Hub (${profile.name})\n`;
              const blob = new Blob([sheetContent], { type: 'text/markdown;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${course.code.toLowerCase()}-lecture-sheet.md`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(url);
              setToastMessage(`Lecture sheet for ${course.code} downloaded!`);
              setTimeout(() => setToastMessage(null), 3000);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Lecture Sheet</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                setCompleted(true);
                triggerMilestoneConfetti();
                const firstName = (profile.name || 'Scholar').split(' ')[0];
                setToastMessage(`Great job ${firstName}! Lesson marked complete & streak updated.`);
                setTimeout(() => {
                  onClose();
                }, 2200);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Lesson Complete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
