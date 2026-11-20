import React, { useState } from 'react';
import { X, Flame, Sparkles, Award, Calendar, CheckCircle2, ShieldCheck, Trophy, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { triggerMilestoneConfetti } from '../../utils/confetti';

interface StudyStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyStreakModal: React.FC<StudyStreakModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();
  const [loggedToday, setLoggedToday] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentStreak = profile.studyStreakDays;
  const nextMilestone = currentStreak >= 30 ? 50 : currentStreak >= 21 ? 30 : currentStreak >= 14 ? 21 : 14;
  const daysRemaining = Math.max(0, nextMilestone - currentStreak);
  const milestoneProgress = Math.min(100, Math.round(((currentStreak - 14) / (nextMilestone - 14)) * 100));

  const handleCelebrate = () => {
    triggerMilestoneConfetti();
    setShowToast(`🔥 Incredible dedication! Celebrating your ${currentStreak}-Day Study Streak!`);
    setTimeout(() => setShowToast(null), 3500);
  };

  const handleLogDay = () => {
    if (loggedToday) {
      handleCelebrate();
      return;
    }
    const newStreak = currentStreak + 1;
    const newKarma = (profile.karmaPoints || 1240) + 50;
    updateProfile({
      studyStreakDays: newStreak,
      karmaPoints: newKarma,
      todayStudyHours: Number((profile.todayStudyHours + 0.5).toFixed(1)),
    });
    setLoggedToday(true);
    triggerMilestoneConfetti();
    setShowToast(`🎉 Milestone advanced! Streak boosted to ${newStreak} Days (+50 Karma Points)!`);
    setTimeout(() => setShowToast(null), 4000);
  };

  const weekDays = [
    { day: 'Mon', completed: true, hours: '3.5h' },
    { day: 'Tue', completed: true, hours: '4.0h' },
    { day: 'Wed', completed: true, hours: '2.5h' },
    { day: 'Thu', completed: true, hours: '5.0h' },
    { day: 'Fri', completed: true, hours: '3.0h' },
    { day: 'Sat', completed: true, hours: '4.2h' },
    { day: 'Sun', completed: true, isToday: true, hours: `${profile.todayStudyHours}h` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background banner */}
        <div className="relative p-6 sm:p-8 bg-linear-to-b from-amber-500/15 via-orange-500/5 to-transparent text-center border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Fire Icon with Pulse and Glow */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center mb-3">
            {/* Ambient breathing back-glow */}
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-amber-500 to-orange-500 blur-xl opacity-60 animate-fire-glow" />
            
            {/* Center flame badge */}
            <div className="relative w-20 h-20 rounded-2xl bg-linear-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-amber-300/60">
              <Flame className="w-11 h-11 text-white fill-amber-200 animate-fire-pulse" />
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-xs font-black shadow-xs">
                🔥
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200 dark:border-amber-800/80">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Consistency Streak</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center justify-center gap-2">
            <span>{currentStreak}</span>
            <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">Day Streak</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            You are in the <strong>top 5%</strong> of most disciplined engineering scholars at IIT Bombay!
          </p>

          {/* Toast Notification */}
          {showToast && (
            <div className="mt-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
              {showToast}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Milestone Progress Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                Next Major Tier: <strong className="text-amber-600 dark:text-amber-400">{nextMilestone} Days (Inferno)</strong>
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {daysRemaining === 0 ? 'Milestone Ready!' : `${daysRemaining} days away`}
              </span>
            </div>
            
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-linear-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700 relative"
                style={{ width: `${Math.max(15, milestoneProgress)}%` }}
              >
                <div className="absolute inset-0 animate-streak-shimmer" />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>Tier II: 14 Days (Unlocked)</span>
              <span>Tier III: 21 Days (+100 Karma)</span>
            </div>
          </div>

          {/* 7-Day Consistency Weekly Heatmap */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Weekly Consistency
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">100% On-Track</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((d, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    d.isToday
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="block text-[10px] font-semibold text-slate-400">{d.day}</span>
                  <div className="my-1 flex items-center justify-center">
                    <Flame
                      className={`w-4 h-4 ${
                        d.completed
                          ? 'text-amber-500 fill-amber-400 animate-fire-pulse'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </div>
                  <span className="block text-[9px] font-mono text-slate-500 dark:text-slate-400">{d.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Perks & Protection */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Streak Freeze Shield</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1 freeze remaining for busy exam days.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">2x Karma Multiplier</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Active due to 14+ day consistency streak.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleLogDay}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all active:scale-98"
          >
            <Flame className="w-4 h-4 fill-white" />
            <span>{loggedToday ? 'Streak Logged Today! 🎉' : "Log Today's Study (+1 Day)"}</span>
          </button>

          <button
            onClick={handleCelebrate}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-all active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Celebrate Milestone 🎊</span>
          </button>
        </div>
      </div>
    </div>
  );
};
