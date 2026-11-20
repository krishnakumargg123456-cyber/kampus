import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Megaphone } from 'lucide-react';
import { SplitHeroSection } from '../components/home/SplitHeroSection';
import { FeatureExplorationSection } from '../components/home/FeatureExplorationSection';
import { StudentDashboardPreview } from '../components/home/StudentDashboardPreview';
import { KampusAiShowcase } from '../components/home/KampusAiShowcase';
import { CampusLifeShowcase } from '../components/home/CampusLifeShowcase';
import { CareerShowcase } from '../components/home/CareerShowcase';
import { Footer } from '../components/layout/Footer';
import { usePlatformConfig } from '../context/PlatformConfigContext';
import type { HomepageSectionConfig } from '../types/superAdmin';

interface HomePageProps {
  onOpenSearch: () => void;
  onOpenAi: (query?: string) => void;
  onOpenNotifications: () => void;
  onOpenLesson: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenSearch,
  onOpenAi,
  onOpenLesson,
}) => {
  const { config } = usePlatformConfig();

  const handleScrollToFeatures = () => {
    const el = document.getElementById('explore-features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const bannerAd = config?.ads?.find((a) => a.placement === 'Homepage Banner' && a.status === 'Active');

  useEffect(() => {
    if (!bannerAd) return;
    fetch(`/api/public/ads/${bannerAd.id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'impression' }),
    }).catch(() => {});
  }, [bannerAd?.id]);

  const sections: HomepageSectionConfig[] = config?.homepageSections?.length
    ? config.homepageSections.filter((s) => s.visible)
    : [
        { id: 'hp-hero', type: 'hero', label: 'Hero', visible: true, order: 1, heading: '', subheading: '', description: '', imageUrl: '', iconName: '', primaryCtaLabel: '', primaryCtaLink: '', secondaryCtaLabel: '', secondaryCtaLink: '', backgroundTone: 'navy' },
        { id: 'hp-features', type: 'features', label: 'Features', visible: true, order: 2, heading: '', subheading: '', description: '', imageUrl: '', iconName: '', primaryCtaLabel: '', primaryCtaLink: '', secondaryCtaLabel: '', secondaryCtaLink: '', backgroundTone: 'default' },
        { id: 'hp-dashboard', type: 'dashboard', label: 'Dashboard', visible: true, order: 3, heading: '', subheading: '', description: '', imageUrl: '', iconName: '', primaryCtaLabel: '', primaryCtaLink: '', secondaryCtaLabel: '', secondaryCtaLink: '', backgroundTone: 'default' },
        { id: 'hp-ai', type: 'ai-showcase', label: 'AI', visible: true, order: 4, heading: '', subheading: '', description: '', imageUrl: '', iconName: '', primaryCtaLabel: '', primaryCtaLink: '', secondaryCtaLabel: '', secondaryCtaLink: '', backgroundTone: 'default' },
        { id: 'hp-campus', type: 'campus-life', label: 'Campus', visible: true, order: 5, heading: '', subheading: '', description: '', imageUrl: '', iconName: '', primaryCtaLabel: '', primaryCtaLink: '', secondaryCtaLabel: '', secondaryCtaLink: '', backgroundTone: 'default' },
        { id: 'hp-career', type: 'career', label: 'Career', visible: true, order: 6, heading: '', subheading: '', description: '', imageUrl: '', iconName: '', primaryCtaLabel: '', primaryCtaLink: '', secondaryCtaLabel: '', secondaryCtaLink: '', backgroundTone: 'default' },
        { id: 'hp-footer', type: 'footer', label: 'Footer', visible: true, order: 7, heading: '', subheading: '', description: '', imageUrl: '', iconName: '', primaryCtaLabel: '', primaryCtaLink: '', secondaryCtaLabel: '', secondaryCtaLink: '', backgroundTone: 'default' },
      ];

  const renderSection = (sec: HomepageSectionConfig) => {
    switch (sec.type) {
      case 'hero':
        return (
          <SplitHeroSection
            key={sec.id}
            onExploreFeatures={handleScrollToFeatures}
            onDiscoverFeatures={onOpenSearch}
            cmsOverride={sec.heading ? sec : undefined}
          />
        );
      case 'features':
        return <FeatureExplorationSection key={sec.id} />;
      case 'dashboard':
        return (
          <StudentDashboardPreview
            key={sec.id}
            onContinueLesson={onOpenLesson}
            onOpenAi={() => onOpenAi()}
          />
        );
      case 'ai-showcase':
        return <KampusAiShowcase key={sec.id} onOpenAi={onOpenAi} />;
      case 'campus-life':
        return <CampusLifeShowcase key={sec.id} />;
      case 'career':
        return <CareerShowcase key={sec.id} />;
      case 'footer':
        return <Footer key={sec.id} />;
      default: {
        const toneClass =
          sec.backgroundTone === 'navy'
            ? 'bg-[#172554] text-white border-indigo-900'
            : sec.backgroundTone === 'blue'
            ? 'bg-blue-600 text-white border-blue-500'
            : sec.backgroundTone === 'amber'
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-slate-900 dark:text-slate-100'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100';
        return (
          <section
            key={sec.id}
            className={`rounded-2xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${toneClass}`}
          >
            <div className="space-y-1.5 max-w-2xl">
              {sec.subheading && (
                <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  {sec.subheading}
                </div>
              )}
              <h2 className="text-xl font-extrabold tracking-tight">{sec.heading || sec.label}</h2>
              {sec.description && <p className="text-xs sm:text-sm opacity-90">{sec.description}</p>}
            </div>
            {sec.primaryCtaLabel && sec.primaryCtaLink && (
              <Link
                to={sec.primaryCtaLink}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-xs hover:opacity-95 shrink-0"
              >
                <span>{sec.primaryCtaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </section>
        );
      }
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-12">
      {sections.map(renderSection)}

      {bannerAd && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sponsored Campus Spotlight
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{bannerAd.title}</h3>
              {bannerAd.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{bannerAd.subtitle}</p>
              )}
            </div>
          </div>
          <Link
            to={bannerAd.targetUrl || '/campus/events-clubs'}
            onClick={() => {
              fetch(`/api/public/ads/${bannerAd.id}/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'click' }),
              }).catch(() => {});
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
          >
            {bannerAd.ctaLabel || 'Explore'}
          </Link>
        </section>
      )}
    </div>
  );
};
