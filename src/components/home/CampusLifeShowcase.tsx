import React from 'react';
import { Calendar, Activity, Bell, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SHOWCASE_IMAGES } from '../../data/featureImages';
import { useNavigate } from 'react-router-dom';

export const CampusLifeShowcase: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const highlights = [
    {
      id: 'events',
      title: t('feat.events-clubs.name'),
      desc: t('campus.events.desc'),
      image: SHOWCASE_IMAGES.campusEvents,
      icon: Calendar,
      route: '/campus/events-clubs',
      tag: 'Events & Fests',
    },
    {
      id: 'community',
      title: t('feat.community.name'),
      desc: t('campus.community.desc'),
      image: SHOWCASE_IMAGES.communityHighlights,
      icon: Users,
      route: '/connect/community',
      tag: 'Peer Network',
    },
    {
      id: 'activities',
      title: 'Clubs & Societies',
      desc: t('campus.activities.desc'),
      image: SHOWCASE_IMAGES.studentActivities,
      icon: Activity,
      route: '/campus/events-clubs',
      tag: 'Student Clubs',
    },
    {
      id: 'announcements',
      title: t('feat.campus-pulse.name'),
      desc: t('campus.announcements.desc'),
      image: SHOWCASE_IMAGES.announcements,
      icon: Bell,
      route: '/campus/campus-pulse',
      tag: 'Official Circulars',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Featured Wide Realistic Campus Life Hero Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-md group">
        <div className="relative aspect-21/9 min-h-[300px] w-full bg-slate-900">
          <img
            src={SHOWCASE_IMAGES.campusLifeWide}
            alt="Indian College Students at Campus Fest"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 brightness-90"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-transparent to-transparent sm:hidden" />

          {/* Content inside the wide photo */}
          <div className="absolute inset-0 p-6 sm:p-8 lg:p-10 flex flex-col justify-between z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold border border-orange-400/30 backdrop-blur-xs w-fit">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Vibrant Campus Community</span>
            </div>

            <div className="max-w-xl space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {t('campus.heading')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg">
                {t('campus.description')}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/campus/events-clubs')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{t('campus.btn.events')}</span>
                </button>

                <button
                  onClick={() => navigate('/connect/community')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-bold backdrop-blur-md transition-all border border-white/20 active:scale-98 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-orange-300" />
                  <span>{t('campus.btn.community')}</span>
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live: 14 Campus Events Today
              </span>
              <span>·</span>
              <span>28 Active Student Clubs</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(item.route)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(item.route);
                }
              }}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-85" />

                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 border border-white/20">
                  <Icon className="w-3 h-3 text-blue-400" />
                  <span>{item.tag}</span>
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
