import React from 'react';
import { ArrowRight, Compass, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SHOWCASE_IMAGES } from '../../data/featureImages';
import { resolveAssetUrl } from '../../utils/assetResolver';

interface SplitHeroSectionProps {
  onExploreFeatures: () => void;
  onDiscoverFeatures: () => void;
  cmsOverride?: {
    heading?: string;
    subheading?: string;
    description?: string;
    imageUrl?: string;
    primaryCtaLabel?: string;
    secondaryCtaLabel?: string;
  };
}

export const SplitHeroSection: React.FC<SplitHeroSectionProps> = ({
  onExploreFeatures,
  onDiscoverFeatures,
  cmsOverride,
}) => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-b from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-md">
      {/* Ambient background lighting */}
      <div className="absolute -left-12 -top-12 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10 items-center">
        {/* Left Column: Headlines & Action Buttons */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{cmsOverride?.subheading || t('hero.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {cmsOverride?.heading || t('hero.headline')}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl">
            {cmsOverride?.description || t('hero.description')}
          </p>

          {/* Buttons: Explore KAMPUS & Discover Features */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onExploreFeatures}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 active:scale-98 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{cmsOverride?.primaryCtaLabel || t('hero.btn.explore')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDiscoverFeatures}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/15 backdrop-blur-xs active:scale-98 transition-all cursor-pointer"
            >
              <span>{cmsOverride?.secondaryCtaLabel || t('hero.btn.discover')}</span>
            </button>
          </div>

          {/* Credibility Counters */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-lg sm:text-xl font-black text-white tabular-nums">50,000+</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t('hero.stat.students')}</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-white tabular-nums">120+</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t('hero.stat.universities')}</div>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-black text-white tabular-nums">21</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t('hero.stat.modules')}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Realistic Photograph of Indian College Students Studying Together */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl aspect-16/10 lg:aspect-4/3 group">
            <img
              src={resolveAssetUrl(cmsOverride?.imageUrl) || SHOWCASE_IMAGES.hero}
              alt="Indian college students studying together in a modern campus courtyard"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

            {/* Live Campus Cohort Badge */}
            <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/15 text-xs text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-slate-200">Indian College Life</span>
              </div>
              <span className="text-[11px] text-blue-300 font-medium">IIT Bombay · 2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
