import React from 'react';
import { Briefcase, Award, GraduationCap, Compass, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SHOWCASE_IMAGES } from '../../data/featureImages';
import { useNavigate } from 'react-router-dom';

export const CareerShowcase: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const careerPillars = [
    {
      id: 'internships',
      title: t('career.internships'),
      desc: t('career.internships.desc'),
      image: SHOWCASE_IMAGES.internships,
      icon: Briefcase,
      tag: '₹40k–₹85k/mo',
      tagColor: 'text-blue-300 border-blue-400/30',
    },
    {
      id: 'scholarships',
      title: t('career.scholarships'),
      desc: t('career.scholarships.desc'),
      image: SHOWCASE_IMAGES.scholarships,
      icon: Award,
      tag: '₹50k/yr Grants',
      tagColor: 'text-amber-300 border-amber-400/30',
    },
    {
      id: 'guidance',
      title: t('career.guidance'),
      desc: t('career.guidance.desc'),
      image: SHOWCASE_IMAGES.placements,
      icon: Compass,
      tag: 'AI Mentorship',
      tagColor: 'text-emerald-300 border-emerald-400/30',
    },
    {
      id: 'workshops',
      title: t('career.workshops'),
      desc: t('career.workshops.desc'),
      image: SHOWCASE_IMAGES.workshops,
      icon: GraduationCap,
      tag: 'Masterclasses',
      tagColor: 'text-purple-300 border-purple-400/30',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Featured Career Banner with Realistic Photography */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-md group">
        <div className="relative aspect-21/9 min-h-[300px] w-full bg-slate-900">
          <img
            src={SHOWCASE_IMAGES.careerWorkshopWide}
            alt="Indian Students in Tech Mentorship Workshop"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 brightness-90"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-950/65 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-transparent to-transparent sm:hidden" />

          {/* Content inside the banner */}
          <div className="absolute inset-0 p-6 sm:p-8 lg:p-10 flex flex-col justify-between z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 backdrop-blur-xs w-fit">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Career & Placements</span>
            </div>

            <div className="max-w-xl space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {t('career.heading')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg">
                {t('career.description')}
              </p>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => navigate('/career')}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>{t('career.btn.explore')}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                120+ Verified Live Openings
              </span>
              <span>·</span>
              <span>Top Tech, Finance & Research Roles</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Career Areas: Internships, Scholarships, Career Guidance, Workshops */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {careerPillars.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => navigate('/career')}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-85" />

                <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 border ${item.tagColor}`}>
                  <Icon className="w-3 h-3" />
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
                  <span>Explore Listings</span>
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
