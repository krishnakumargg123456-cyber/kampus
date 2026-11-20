import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  FilePlus2,
  Home,
  KeyRound,
  Landmark,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { CampusPulseProvider, useCampusPulse } from '../../context/CampusPulseContext';
import { useNotifications } from '../../context/NotificationContext';
import { CampusPulseHomeView, PulseSectionTab } from '../../components/campuspulse/CampusPulseHomeView';
import {
  CampusSearchView,
  OfficialNoticesView,
} from '../../components/campuspulse/OfficialNoticesAndSearchView';
import {
  AcademicCalendarView,
  CampusAlertsView,
  DepartmentsView,
  FacilityUpdatesView,
} from '../../components/campuspulse/AlertsCalendarFacilitiesView';
import {
  CampusPollsView,
  LostFoundView,
  SavedInformationView,
  StudentSubmissionsView,
} from '../../components/campuspulse/LostFoundPollsCommunityView';
import { AdminPublishingView } from '../../components/campuspulse/AdminPublishingView';
import {
  NoticeDetailModal,
  PulseNotificationPrefsModal,
  PulseReportModal,
  StaffRolePortalModal,
} from '../../components/campuspulse/NoticeDetailModal';
import type { CampusAnnouncement } from '../../types/campusPulse';

interface CampusPulsePageProps {
  onOpenNotifications?: () => void;
}

const CampusPulseShell: React.FC<CampusPulsePageProps> = ({ onOpenNotifications }) => {
  const { unreadCount } = useNotifications();
  const {
    loading,
    error,
    toastMessage,
    selectedInstitution,
    currentUserName,
    roleInfo,
    announcements,
    alerts,
    refresh,
  } = useCampusPulse();

  const [activeTab, setActiveTab] = useState<PulseSectionTab>('home');
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedNotice, setSelectedNotice] = useState<CampusAnnouncement | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [notifPrefsOpen, setNotifPrefsOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    targetType: 'announcement' | 'lost-found' | 'poll' | 'submission';
    targetId: string;
    targetTitle: string;
  } | null>(null);

  const initials = currentUserName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const criticalAlertCount = alerts.filter(
    (a) =>
      a.institutionId === (selectedInstitution?.id || 'inst_iitb') &&
      (a.priority === 'Critical' || a.priority === 'High')
  ).length;

  const openNoticeById = (id: string) => {
    const found = announcements.find((a) => a.id === id);
    if (found) setSelectedNotice(found);
  };

  const navItems: Array<{
    id: PulseSectionTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }> = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'official', label: 'Official Notices', icon: ShieldCheck },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badgeCount: criticalAlertCount },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'departments', label: 'Departments', icon: Landmark },
    { id: 'facilities', label: 'Facilities', icon: Building2 },
    { id: 'lost-found', label: 'Lost & Found', icon: PackageSearch },
    { id: 'polls', label: 'Polls', icon: BarChart3 },
    { id: 'submissions', label: 'Submit Update', icon: FilePlus2 },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'admin', label: roleInfo.role === 'Student' ? 'Staff Portal' : 'Publishing', icon: KeyRound },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-semibold text-[#2563EB]">
            CAMPUS · {selectedInstitution?.shortName || 'Institution Hub'}
            {roleInfo.role !== 'Student' ? ` · ${roleInfo.role}` : ''}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-slate-100 tracking-tight mt-0.5">
            Campus Pulse
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Official college circulars, academic deadlines, department announcements, facility
            updates, and student campus information.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Global Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveTab('search');
            }}
            className="relative flex-1 sm:w-64 min-w-48"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search notices, exams, labs..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </form>

          <button
            onClick={() => setNotifPrefsOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#2563EB]"
            aria-label="Campus notification preferences"
            title="Notification Preferences"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#2563EB]"
              aria-label="Open KAMPUS Notification Center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#F97316] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setRoleModalOpen(true)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#2563EB]"
            title="Student Profile & Institutional Role Access"
          >
            <span className="w-7 h-7 rounded-lg bg-[#172554] text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
              {roleInfo.role === 'Student' ? currentUserName : roleInfo.role}
            </span>
          </button>
        </div>
      </header>

      {/* Section Navigation Bar (Touch-Friendly & Responsive) */}
      <nav
        aria-label="Campus Pulse Sections"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors border ${
                active
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#F97316] dark:bg-orange-950/60'
                  }`}
                >
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 right-4 z-50 px-4 py-2.5 rounded-xl bg-[#172554] text-white text-xs font-semibold shadow-lg flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Loading / Error / Active View */}
      {loading ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Campus Pulse updates...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 text-center space-y-3">
          <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{error}</div>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2563EB] text-white"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'home' && (
            <CampusPulseHomeView
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenNotice={setSelectedNotice}
            />
          )}
          {activeTab === 'official' && (
            <OfficialNoticesView onOpenNotice={setSelectedNotice} />
          )}
          {activeTab === 'alerts' && (
            <CampusAlertsView onOpenNoticeById={openNoticeById} />
          )}
          {activeTab === 'calendar' && (
            <AcademicCalendarView onOpenNoticeById={openNoticeById} />
          )}
          {activeTab === 'departments' && (
            <DepartmentsView onOpenNotice={setSelectedNotice} />
          )}
          {activeTab === 'facilities' && <FacilityUpdatesView />}
          {activeTab === 'lost-found' && (
            <LostFoundView onOpenReport={(t) => setReportTarget(t)} />
          )}
          {activeTab === 'polls' && <CampusPollsView />}
          {activeTab === 'submissions' && <StudentSubmissionsView />}
          {activeTab === 'saved' && (
            <SavedInformationView onOpenNotice={setSelectedNotice} />
          )}
          {activeTab === 'search' && (
            <CampusSearchView
              initialQuery={quickSearch}
              onOpenNotice={setSelectedNotice}
            />
          )}
          {activeTab === 'admin' && (
            <AdminPublishingView onOpenRoleModal={() => setRoleModalOpen(true)} />
          )}
        </>
      )}

      {/* Modals */}
      <NoticeDetailModal
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
        onSelectNotice={(n) => setSelectedNotice(n)}
        onOpenReport={(t) => setReportTarget(t)}
      />

      <StaffRolePortalModal
        open={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />

      <PulseNotificationPrefsModal
        open={notifPrefsOpen}
        onClose={() => setNotifPrefsOpen(false)}
      />

      <PulseReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
};

export const CampusPulsePage: React.FC<CampusPulsePageProps> = ({
  onOpenNotifications,
}) => {
  return (
    <CampusPulseProvider>
      <CampusPulseShell onOpenNotifications={onOpenNotifications} />
    </CampusPulseProvider>
  );
};
