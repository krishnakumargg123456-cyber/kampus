import React from 'react';
import {
  Share2,
  Search,
  Upload,
  Bell,
  X,
  Compass,
  HelpCircle,
  Bookmark,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNotesExchange } from '../../context/NotesExchangeContext';
import { NotesExchangeTab } from '../../types/notesExchange';

interface NotesExchangeHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNotifications?: () => void;
}

export const NotesExchangeHeader: React.FC<NotesExchangeHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNotifications,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { unreadCount } = useNotifications();
  const { state, activeTab, setActiveTab, openUploadModal } = useNotesExchange();

  const openRequestsCount = state.requests.filter((r) => r.status === 'open').length;
  const savedCount = state.savedNoteIds.length;
  const ownUploadsCount = state.notes.filter((n) => n.isOwnUpload).length;

  const tabs: Array<{
    id: NotesExchangeTab;
    labelEn: string;
    labelHi: string;
    count?: number;
    icon: React.ReactNode;
  }> = [
    {
      id: 'explore',
      labelEn: 'Explore Notes',
      labelHi: 'नोट्स खोजें',
      count: state.notes.length,
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'requests',
      labelEn: 'Requests & Bounties',
      labelHi: 'अनुरोध व बाउंटी',
      count: openRequestsCount,
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      id: 'saved',
      labelEn: 'Saved Notes',
      labelHi: 'सहेजे गए नोट्स',
      count: savedCount,
      icon: <Bookmark className="w-4 h-4" />,
    },
    {
      id: 'contributions',
      labelEn: 'My Contributions',
      labelHi: 'मेरा योगदान',
      count: ownUploadsCount,
      icon: <Trophy className="w-4 h-4" />,
    },
  ];

  return (
    <header className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Module Identity */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <span>LEARN · Module 03</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-orange-600 dark:text-orange-400 tabular-nums">
                {state.karmaPoints.toLocaleString()} Karma
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {language === 'hi' ? 'नोट्स एक्सचेंज' : 'Notes Exchange'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'hi'
                ? 'सत्यापित सहपाठी अध्ययन नोट्स साझा करें, डाउनलोड करें और कर्मा अर्जित करें।'
                : 'Peer-to-peer verified lecture notes, formula sheets, and syllabus bounties.'}
            </p>
          </div>
        </div>

        {/* Search + Actions */}
        <div className="flex flex-wrap items-center gap-2.5 justify-between lg:justify-end">
          <div className="relative flex-1 sm:w-64 lg:w-72 min-w-[210px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'विषय, कोर्स कोड या टैग से खोजें...'
                  : 'Search notes, course code, tag, or author...'
              }
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => openUploadModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'hi' ? 'नोट्स अपलोड (+100)' : 'Upload Notes (+100)'}</span>
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            title="Switch Language"
          >
            {language === 'hi' ? 'EN' : 'हिं'}
          </button>

          <button
            type="button"
            onClick={() =>
              onOpenNotifications
                ? onOpenNotifications()
                : navigate('/account/notifications')
            }
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/account/profile')}
            className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 shrink-0 cursor-pointer"
          >
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-lg object-cover"
            />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline whitespace-nowrap">
              {profile.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav
        aria-label="Notes Exchange Sections"
        className="flex items-center gap-1 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.icon}
              <span>{language === 'hi' ? tab.labelHi : tab.labelEn}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[11px] font-bold tabular-nums ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-300'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
