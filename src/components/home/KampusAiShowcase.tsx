import React, { useState } from 'react';
import { Sparkles, HelpCircle, FileText, CheckSquare, BrainCircuit, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SHOWCASE_IMAGES } from '../../data/featureImages';

interface KampusAiShowcaseProps {
  onOpenAi: (query?: string) => void;
}

export const KampusAiShowcase: React.FC<KampusAiShowcaseProps> = ({ onOpenAi }) => {
  const { t } = useLanguage();
  const [customInput, setCustomInput] = useState('');

  const capabilities = [
    {
      id: 'cap1',
      title: t('ai.feat1.title'),
      desc: t('ai.feat1.desc'),
      icon: HelpCircle,
      prompt: 'Explain the core intuition and proof of Bellman-Ford algorithm with step-by-step example',
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200/50 dark:border-blue-800/50',
    },
    {
      id: 'cap2',
      title: t('ai.feat2.title'),
      desc: t('ai.feat2.desc'),
      icon: FileText,
      prompt: 'Create a high-yield formula cheat sheet and bullet summary for CS-301 Distributed Systems',
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200/50 dark:border-amber-800/50',
    },
    {
      id: 'cap3',
      title: t('ai.feat3.title'),
      desc: t('ai.feat3.desc'),
      icon: CheckSquare,
      prompt: 'Generate a 5-question multiple choice practice quiz for Database Management Systems normalization',
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/50 dark:border-emerald-800/50',
    },
    {
      id: 'cap4',
      title: t('ai.feat4.title'),
      desc: t('ai.feat4.desc'),
      icon: BrainCircuit,
      prompt: 'Help me solve this algorithm recurrence relation: T(n) = 2T(n/2) + n log n using Master Theorem',
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60 border-purple-200/50 dark:border-purple-800/50',
    },
  ];

  const handleAsk = (prompt?: string) => {
    const q = prompt || customInput.trim();
    onOpenAi(q || undefined);
    if (!prompt) setCustomInput('');
  };

  return (
    <section className="rounded-3xl bg-linear-to-br from-[#0F172A] via-[#1E1B4B] to-[#0B132B] text-white p-6 sm:p-8 lg:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Realistic Photograph of Student Studying with Laptop */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl aspect-4/3 group bg-slate-900">
            <img
              src={SHOWCASE_IMAGES.aiShowcase}
              alt="Indian Student using KAMPUS AI on Laptop"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/15 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-blue-300 font-bold">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>KAMPUS AI Assistant</span>
              </span>
              <span className="text-[11px] text-slate-300 font-medium">24/7 Study Partner</span>
            </div>
          </div>
        </div>

        {/* Right: Content & 4 Visual Capabilities */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>AI Study Companion</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('ai.heading')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              {t('ai.description')}
            </p>
          </div>

          {/* 4 Capabilities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleAsk(item.prompt)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAsk(item.prompt);
                    }
                  }}
                  className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 transition-all cursor-pointer group flex items-start gap-3 focus-visible:outline-2 focus-visible:outline-blue-400"
                >
                  <div className={`w-8 h-8 rounded-lg ${item.color} border flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assistant Prompt Input & Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex-1 flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-white/10 border border-white/15 focus-within:border-blue-400"
            >
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={t('ai.input.placeholder')}
                className="w-full text-xs sm:text-sm text-white placeholder-slate-400 bg-transparent focus:outline-hidden"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                <span>Ask</span>
              </button>
            </form>

            <button
              onClick={() => onOpenAi()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-98 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-orange-300" />
              <span>{t('ai.btn.explore')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
