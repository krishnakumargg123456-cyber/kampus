import React from 'react';
import {
  BookOpen,
  Sparkles,
  Share2,
  Users,
  UserCheck,
  MessageSquare,
  Radio,
  Repeat,
  Activity,
  Calendar,
  CreditCard,
  Megaphone,
  Briefcase,
  Compass,
  ShoppingBag,
  ShieldCheck,
  Gift,
  Clock,
  Bell,
  User,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { MODULE_IMAGES } from '../../data/featureImages';

export const FeatureExplorationSection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const iconMap: Record<string, React.FC<{ className?: string }>> = {
    'study-hub': BookOpen,
    'kampus-ai': Sparkles,
    'notes-exchange': Share2,
    'study-partner': UserCheck,
    'community': Users,
    'chat': MessageSquare,
    'study-rooms': Radio,
    'skillswap': Repeat,
    'campus-pulse': Activity,
    'events-clubs': Calendar,
    'kampus-id': CreditCard,
    'student-voice': Megaphone,
    'career': Briefcase,
    'college-explorer': Compass,
    'market': ShoppingBag,
    'digital-locker': ShieldCheck,
    'rewards': Gift,
    'planner': Clock,
    'notifications': Bell,
    'profile': User,
    'settings': Settings,
  };

  const categories = [
    {
      id: 'cat-learn',
      title: t('features.cat1'),
      subtitle: t('features.cat1.sub'),
      modules: [
        { id: 'study-hub', route: '/learn/study-hub', isPhoto: true },
        { id: 'kampus-ai', route: '/learn/kampus-ai', isPhoto: true, badge: 'AI Copilot' },
        { id: 'notes-exchange', route: '/learn/notes-exchange', isPhoto: true },
      ],
    },
    {
      id: 'cat-connect',
      title: t('features.cat2'),
      subtitle: t('features.cat2.sub'),
      modules: [
        { id: 'study-partner', route: '/connect/study-partner', isPhoto: true, badge: 'Smart Match' },
        { id: 'community', route: '/connect/community', isPhoto: true },
        { id: 'chat', route: '/connect/chat', isPhoto: true },
        { id: 'study-rooms', route: '/connect/study-rooms', isPhoto: true, badge: 'Live Rooms' },
        { id: 'skillswap', route: '/connect/skillswap', isPhoto: true },
      ],
    },
    {
      id: 'cat-campus',
      title: t('features.cat3'),
      subtitle: t('features.cat3.sub'),
      modules: [
        { id: 'campus-pulse', route: '/campus/campus-pulse', isPhoto: true, badge: 'Realtime' },
        { id: 'events-clubs', route: '/campus/events-clubs', isPhoto: true },
        { id: 'kampus-id', route: '/campus/kampus-id', isPhoto: true, badge: 'Smart NFC' },
        { id: 'student-voice', route: '/campus/student-voice', isPhoto: true },
      ],
    },
    {
      id: 'cat-career-colleges',
      title: t('features.cat4'),
      subtitle: t('features.cat4.sub'),
      modules: [
        { id: 'career', route: '/career', isPhoto: true, badge: 'Placements' },
        { id: 'college-explorer', route: '/campus/college-explorer', isPhoto: true },
      ],
    },
    {
      id: 'cat-services',
      title: t('features.cat5'),
      subtitle: t('features.cat5.sub'),
      modules: [
        { id: 'market', route: '/market', isPhoto: true, badge: 'Verified 0% Fee' },
        { id: 'digital-locker', route: '/tools/digital-locker', isPhoto: true, badge: 'DigiLocker Sync' },
        { id: 'rewards', route: '/tools/rewards', isPhoto: true, badge: 'Karma Points' },
        { id: 'planner', route: '/tools/planner', isPhoto: true },
      ],
    },
    {
      id: 'cat-personal',
      title: t('features.cat6'),
      subtitle: t('features.cat6.sub'),
      modules: [
        { id: 'notifications', route: '/account/notifications', isPhoto: true, badge: 'Realtime Alerts' },
        { id: 'profile', route: '/account/profile', isPhoto: true, badge: 'Verified ID' },
        { id: 'settings', route: '/account/settings', isPhoto: true, badge: 'Preferences' },
      ],
    },
  ];

  return (
    <section id="explore-features" className="space-y-10 scroll-mt-20">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/60">
          {t('features.badge')}
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {t('features.heading')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('features.subtitle')}
        </p>
      </div>

      {/* Six Structured Categories */}
      <div className="space-y-10">
        {categories.map((category) => (
          <div key={category.id} className="space-y-4">
            {/* Category Banner Title */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>{category.title}</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {category.subtitle}
              </span>
            </div>

            {/* 3-Column Grid on Desktop, 2-Column on Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.modules.map((mod) => {
                const IconComponent = iconMap[mod.id] || BookOpen;
                const name = t(`feat.${mod.id}.name`);
                const desc = t(`feat.${mod.id}.desc`);
                const imageUrl = MODULE_IMAGES[mod.id];

                return (
                  <div
                    key={mod.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(mod.route)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(mod.route);
                      }
                    }}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    {/* Visual Card Header: Realistic Photograph */}
                    <div className="relative aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent opacity-85" />

                      {/* Top Icon Badge */}
                      <div className="absolute top-2.5 left-2.5 w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Highlight Badge */}
                      {mod.badge && (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-bold backdrop-blur-xs shadow-2xs">
                          {mod.badge}
                        </div>
                      )}
                    </div>

                    {/* Card Content & Open Action */}
                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {desc}
                        </p>
                      </div>

                      {/* Small Open Button */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {t('feat.btn.open')}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
