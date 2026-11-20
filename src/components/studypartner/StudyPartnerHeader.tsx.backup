import React from 'react';
import {
  UserCheck,
  Search,
  Bell,
  X,
  Compass,
  Home,
  Inbox,
  Users,
  CalendarClock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useStudyPartner } from '../../context/StudyPartnerContext';
import { StudyPartnerTab } from '../../types/studyPartner';

interface StudyPartnerHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenNotifications?: () => void;
}

export const StudyPartnerHeader: React.FC<StudyPartnerHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenNotifications,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { unreadCount } = useNotifications();
  const { state, activeTab, setActiveTab } = useStudyPartner();

  const receivedPendingCount = state.requests.filter(
    (r) => r.direction === 'received' && r.status === 'pending'
  ).length;
  const upcomingSessionsCount = state.sessions.filter(
    (s) => s.status === 'Upcoming' || s.status === 'Live'
  ).length;

  const tabs: Array<{
    id: StudyPartnerTab;
    labelEn: string;
    labelHi: string;
    count?: number;
    icon: React.ReactNode;
  }> = [
    {
      id: 'home',
      labelEn: 'Overview',
      labelHi: 'डैशबोर्ड',
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: 'discover',
      labelEn: 'Find Partners',
      labelHi: 'साथी खोजें',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'requests',
      labelEn: 'Requests',
      labelHi: 'अनुरोध',
      count: receivedPendingCount,
      icon: <Inbox className="w-4 h-4" />,
    },
    {
      id: 'partners',
      labelEn: 'My Partners',
      labelHi: 'मेरे साथी',
      count: state.connectedPartnerIds.length,
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'groups',
      labelEn: 'Study Groups',
      labelHi: 'अध्ययन समूह',
      count: state.groups.length,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'sessions',
      labelEn: 'Sessions & Goals',
      labelHi: 'सत्र और लक्ष्य',
      count: upcomingSessionsCount,
      icon: <CalendarClock className="w-4 h-4" />,
    },
    {
      id: 'preferences',
      labelEn: 'Preferences & Privacy',
      labelHi: 'प्राथमिकताएं व सुरक्षा',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  const handleSearchInput = (val: string) => {
    onSearchChange(val);
    if (val.trim() && activeTab === 'home') {
      setActiveTab('discover');
    }
  };

  return (
    <header className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <span>CONNECT · Module 04</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-orange-600 dark:text-orange-400">
                Demo Directory · Privacy Protected
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {language === 'hi' ? 'अपना स्टडी पार्टनर खोजें' : 'Find Your Study Partner'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'hi'
                ? 'साथ सीखें। नियमित रहें। अधिक हासिल करें।'
                : 'Learn together. Stay consistent. Achieve more.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 justify-between lg:justify-end">
          <div className="relative flex-1 sm:w-64 lg:w-72 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'विषय, परीक्षा या छात्र खोजें...'
                  : 'Search students, subjects, exams...'
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
            onClick={() => setActiveTab('discover')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'hi' ? 'पार्टनर खोजें' : 'Find My Study Partner'}</span>
          </button>

          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
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
        aria-label="Study Partner Workspace"
        className="flex items-center gap-1 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                active
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.icon}
              <span>{language === 'hi' ? tab.labelHi : tab.labelEn}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[11px] font-bold tabular-nums ${
                    active
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
