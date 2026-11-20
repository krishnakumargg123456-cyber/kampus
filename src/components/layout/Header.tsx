import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Bell, Sun, Moon, CheckCircle2, User, Settings, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { useNavigate, Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../utils/assetResolver';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAi: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenAi,
  onOpenNotifications,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { profile, logout, isAuthenticated } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { config } = usePlatformConfig();
  const siteName = config?.website?.siteName || 'KAMPUS';
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { unreadCount } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-left group focus-visible:outline-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-base tracking-tight">{siteName.slice(0, 1)}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">
                  {siteName}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Elegant Search Bar */}
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm text-slate-400 dark:text-slate-500 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              <span className="text-slate-500 dark:text-slate-400">{t('header.search')}</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 font-mono text-[10px] font-medium text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, AI Shortcut, Notifications, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile search trigger */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* AI Assistant shortcut */}
          <Link
            to="/learn/kampus-ai"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/70 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Open KAMPUS AI Study Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">{t('header.ai')}</span>
          </Link>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 tabular-nums">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* EN | हिन्दी Language Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700"
            title="Switch Language / भाषा बदलें"
          >
            <span className={language === 'en' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-400'}>
              EN
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className={language === 'hi' ? 'text-blue-600 dark:text-blue-400 font-extrabold font-hindi' : 'text-slate-400 font-hindi'}>
              हिन्दी
            </span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-600" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800" />

          {/* Student Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group text-left"
            >
              <div className="relative">
                <img
                  src={resolveAssetUrl(profile.avatarUrl)}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-blue-500 transition-all"
                />
                <span className="absolute -bottom-0.5 -right-0.5 bg-blue-600 rounded-full text-white p-0.5 ring-1 ring-white dark:ring-slate-900">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                </span>
              </div>
              <div className="hidden xl:block">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight">
                  {profile.name}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight max-w-[140px] truncate">
                  {profile.college ? profile.college.split(',')[0] : 'KAMPUS'} · {profile.semester || 'Student'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{profile.name}</p>
                  <p className="text-[10px] text-slate-400">{profile.email}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">Roll: {profile.enrollmentNo}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/account/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Student Profile</span>
                  </Link>
                  <Link
                    to="/account/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings & Privacy</span>
                  </Link>
                  <Link
                    to="/campus/kampus-id"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Digital KAMPUS ID Pass</span>
                  </Link>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Super Admin Portal</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
