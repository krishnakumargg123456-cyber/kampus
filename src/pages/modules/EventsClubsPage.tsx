import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Compass,
  Home,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import { EventsClubsProvider, useEventsClubs } from '../../context/EventsClubsContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  EventsDashboardView,
  type EventsClubsTab,
} from '../../components/eventsclubs/EventsDashboardView';
import { ExploreEventsView } from '../../components/eventsclubs/ExploreEventsView';
import { ClubsDiscoveryAndDetailView } from '../../components/eventsclubs/ClubsDiscoveryAndDetailView';
import {
  CreateEventWizardView,
  MyActivitiesView,
  OrganizerPortalView,
} from '../../components/eventsclubs/MyActivitiesAndOrganizerView';
import { EventDetailAndRegistrationModal } from '../../components/eventsclubs/EventDetailAndRegistrationModal';
import {
  EventsClubsAiModal,
  EventsClubsReportModal,
  OrganizerPasskeyModal,
} from '../../components/eventsclubs/EventsModals';
import type { CampusClub, CampusEvent } from '../../types/eventsClubs';

interface EventsClubsPageProps {
  onOpenNotifications?: () => void;
}

const EventsClubsShell: React.FC<EventsClubsPageProps> = ({ onOpenNotifications }) => {
  const { unreadCount } = useNotifications();
  const {
    loading,
    error,
    toastMessage,
    currentUserName,
    currentUserCollege,
    authInfo,
    refresh,
  } = useEventsClubs();

  const [activeTab, setActiveTab] = useState<EventsClubsTab>('dashboard');
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
  const [selectedClub, setSelectedClub] = useState<CampusClub | null>(null);
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    targetType: 'event' | 'club' | 'content';
    targetId: string;
    targetTitle: string;
  } | null>(null);

  const initials = currentUserName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const navItems: Array<{
    id: EventsClubsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Overview', icon: Home },
    { id: 'explore-events', label: 'Explore Events', icon: Compass },
    { id: 'clubs', label: 'Clubs Directory', icon: Users },
    { id: 'my-activities', label: 'My Activities & Passes', icon: Ticket },
    { id: 'create-event', label: 'Create Event', icon: Plus },
    {
      id: 'organizer',
      label: authInfo.organizerRole ? 'Organizer Console' : 'Organizer Access',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-semibold text-[#2563EB] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              CAMPUS · {currentUserCollege}
              {authInfo.organizerRole ? ` · ${authInfo.organizerRole}` : ''}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-slate-100 tracking-tight mt-0.5">
            Events & Clubs
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Discover hackathons, workshops, cultural fests, and student clubs with verified QR
            passes and certificates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveTab('explore-events');
            }}
            className="relative flex-1 sm:w-60 min-w-44"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search events, hackathons..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </form>

          <button
            onClick={() => setAiModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 hover:border-[#2563EB]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span className="hidden sm:inline">AI Helper</span>
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
            onClick={() => setPasskeyModalOpen(true)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-[#2563EB]"
            title="Student Profile & Organizer Role Access"
          >
            <span className="w-7 h-7 rounded-lg bg-[#172554] text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
              {authInfo.organizerRole ? authInfo.organizerRole : currentUserName}
            </span>
            <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Section Navigation */}
      <nav
        aria-label="Events and Clubs Sections"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id !== 'clubs') setSelectedClub(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors border ${
                active
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
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

      {/* Main Viewport */}
      {loading ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            Loading Events & Clubs workspace...
          </p>
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
          {activeTab === 'dashboard' && (
            <EventsDashboardView
              onNavigateTab={(t) => setActiveTab(t)}
              onOpenEvent={(ev) => setSelectedEvent(ev)}
              onOpenClub={(club) => {
                setSelectedClub(club);
                setActiveTab('clubs');
              }}
              onOpenAiModal={() => setAiModalOpen(true)}
              onOpenPasskeyModal={() => setPasskeyModalOpen(true)}
            />
          )}
          {activeTab === 'explore-events' && (
            <ExploreEventsView
              initialQuery={quickSearch}
              onOpenEvent={(ev) => setSelectedEvent(ev)}
            />
          )}
          {activeTab === 'clubs' && (
            <ClubsDiscoveryAndDetailView
              selectedClub={selectedClub}
              onSelectClub={(c) => setSelectedClub(c)}
              onOpenEvent={(ev) => setSelectedEvent(ev)}
              onOpenReport={(t) => setReportTarget(t)}
            />
          )}
          {activeTab === 'my-activities' && (
            <MyActivitiesView
              onOpenEvent={(ev) => setSelectedEvent(ev)}
              onOpenClub={(club) => {
                setSelectedClub(club);
                setActiveTab('clubs');
              }}
            />
          )}
          {activeTab === 'create-event' && (
            <CreateEventWizardView
              onSuccess={() => setActiveTab('organizer')}
              onOpenPasskeyModal={() => setPasskeyModalOpen(true)}
            />
          )}
          {activeTab === 'organizer' && (
            <OrganizerPortalView onOpenPasskeyModal={() => setPasskeyModalOpen(true)} />
          )}
        </>
      )}

      {/* Dialogs */}
      <EventDetailAndRegistrationModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onOpenReport={(t) => setReportTarget(t)}
      />

      <OrganizerPasskeyModal
        open={passkeyModalOpen}
        onClose={() => setPasskeyModalOpen(false)}
      />

      <EventsClubsAiModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
      />

      <EventsClubsReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
};

export const EventsClubsPage: React.FC<EventsClubsPageProps> = ({
  onOpenNotifications,
}) => {
  return (
    <EventsClubsProvider>
      <EventsClubsShell onOpenNotifications={onOpenNotifications} />
    </EventsClubsProvider>
  );
};
