import React from 'react';
import { GraduationCap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { config } = usePlatformConfig();
  const siteName = config?.website?.siteName || 'KAMPUS';
  const tagline = config?.website?.tagline || t('footer.tagline');
  const desc = config?.website?.footerDescription || t('footer.desc');
  const copyright = config?.website?.footerCopyright || t('footer.rights');
  const academicLinks = config?.navigation?.footerAcademic?.filter((l) => l.visible) || [];
  const supportLinks = config?.navigation?.footerSupport?.filter((l) => l.visible) || [];

  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Mission Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {siteName}
                </span>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 -mt-1">
                  {tagline}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              {desc}
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Live on 45+ Campuses</span>
              <span aria-hidden="true">·</span>
              <span>100% Student-First</span>
            </div>
          </div>

          {/* Column 1: Academic & Learning (Admin Navigation Synced) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Academic Hub
            </h4>
            <ul className="space-y-2 text-xs">
              {academicLinks.length > 0 ? (
                academicLinks.map((lnk) => (
                  <li key={lnk.id}>
                    <Link to={lnk.destination} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {lnk.label}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/learn/study-hub" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Study Hub
                    </Link>
                  </li>
                  <li>
                    <Link to="/learn/kampus-ai" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      KAMPUS AI Assistant
                    </Link>
                  </li>
                  <li>
                    <Link to="/learn/notes-exchange" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Notes Exchange
                    </Link>
                  </li>
                  <li>
                    <Link to="/tools/planner" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Academic Planner
                    </Link>
                  </li>
                  <li>
                    <Link to="/connect/study-rooms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      Live Study Rooms
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 2: Campus & Career */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Campus & Career
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/campus/campus-pulse" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Campus Pulse
                </Link>
              </li>
              <li>
                <Link to="/campus/events-clubs" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Events & Clubs
                </Link>
              </li>
              <li>
                <Link to="/career" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Internships & Jobs
                </Link>
              </li>
              <li>
                <Link to="/campus/college-explorer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  College Explorer
                </Link>
              </li>
              <li>
                <Link to="/market" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  KAMPUS Market
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Support (Admin CMS Synced) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              {t('footer.col.support')}
            </h4>
            <ul className="space-y-2 text-xs">
              {supportLinks.length > 0 ? (
                supportLinks.map((lnk) => (
                  <li key={lnk.id}>
                    <Link to={lnk.destination} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {lnk.label}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/page/about-kampus" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {t('footer.about')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/account/settings?section=support" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {t('footer.support')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/page/privacy-policy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {t('footer.privacy')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/page/terms-of-service" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {t('footer.terms')}
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/admin/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  Admin Control Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <div>
            © {new Date().getFullYear()} {siteName}. {copyright}
          </div>

          <div className="flex items-center gap-6">
            <Link to="/page/privacy-policy" className="hover:underline">
              {t('footer.privacy')}
            </Link>
            <Link to="/page/terms-of-service" className="hover:underline">
              {t('footer.terms')}
            </Link>
            <Link to="/account/settings?section=security" className="hover:underline">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
