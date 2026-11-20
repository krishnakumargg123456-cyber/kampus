import React from 'react';
import { GraduationCap, ShieldCheck, Sparkles, Users, BookOpen, Award } from 'lucide-react';
import campusHeroImg from '../../assets/images/hero_students_campus_1794449577723.jpg';

interface AuthBrandPanelProps {
  quote?: string;
  author?: string;
  highlightTag?: string;
}

export const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({
  quote = "Everything you need to navigate university life, connect with your community, discover opportunities, and make the most of your campus experience.",
  author = "KAMPUS Student Ecosystem",
  highlightTag = "Official Student Network",
}) => {
  return (
    <div className="relative hidden lg:flex lg:w-1/2 min-h-screen bg-slate-950 text-white flex-col justify-between p-12 overflow-hidden border-r border-slate-800/80">
      {/* Background Photography with Sophisticated Navy/Slate Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={campusHeroImg}
          alt="University campus students"
          className="w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.08] saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/90 via-slate-950/70 to-slate-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.22),transparent_60%)]" />
      </div>

      {/* Top Header: KAMPUS Brand Mark */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-blue-500 via-blue-600 to-indigo-800 p-0.5 shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <div className="w-full h-full rounded-[14px] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-white font-sans">
                KAMPUS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">University Technology Platform</p>
          </div>
        </div>

        {/* Highlight Tag */}
        <div className="mt-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>{highlightTag}</span>
        </div>
      </div>

      {/* Center Value Proposition */}
      <div className="relative z-10 my-auto py-12 max-w-lg">
        <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Your campus. <br />
          Your community. <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-300 to-sky-400">
            Your opportunities.
          </span>
        </h1>

        <blockquote className="mt-6 text-base xl:text-lg text-slate-300 font-normal leading-relaxed border-l-2 border-blue-500/60 pl-4">
          "{quote}"
        </blockquote>
        <p className="mt-3 text-xs text-slate-400 uppercase tracking-wider font-semibold pl-4">
          — {author}
        </p>

        {/* Small Trust Feature Pillars */}
        <div className="mt-10 grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Verified ID</div>
              <div className="text-[11px] text-slate-400">Institutional check</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Users className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Peer Network</div>
              <div className="text-[11px] text-slate-400">Across 120+ colleges</div>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Award className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Zero Spam</div>
              <div className="text-[11px] text-slate-400">Moderated campus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Student Stats Indicator */}
      <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">
              IT
            </div>
            <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">
              CS
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">
              AI
            </div>
          </div>
          <span className="font-medium text-slate-300">Joined by 48,000+ verified students</span>
        </div>
        <span className="text-[11px] text-slate-400">v2.4 Secured</span>
      </div>
    </div>
  );
};
