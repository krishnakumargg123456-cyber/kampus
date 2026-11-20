import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import {
  StudyPartnerProvider,
  useStudyPartner,
} from '../../context/StudyPartnerContext';
import { StudyPartnerHeader } from '../../components/studypartner/StudyPartnerHeader';
import { StudyPartnerHomeView } from '../../components/studypartner/StudyPartnerHomeView';
import { DiscoverPartnersView } from '../../components/studypartner/DiscoverPartnersView';
import { PartnerProfileModal } from '../../components/studypartner/PartnerProfileModal';
import { StudyRequestsView } from '../../components/studypartner/StudyRequestsView';
import { MyPartnersView } from '../../components/studypartner/MyPartnersView';
import { StudyGroupsView } from '../../components/studypartner/StudyGroupsView';
import { SessionsAndGoalsView } from '../../components/studypartner/SessionsAndGoalsView';
import { PartnerPreferencesView } from '../../components/studypartner/PartnerPreferencesView';

interface StudyPartnerPageProps {
  onOpenNotifications?: () => void;
}

const StudyPartnerWorkspace: React.FC<StudyPartnerPageProps> = ({
  onOpenNotifications,
}) => {
  const { activeTab, toast, dismissToast } = useStudyPartner();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <StudyPartnerHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Toast Feedback Banner */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border flex items-center justify-between gap-3 text-xs font-semibold ${
            toast.tone === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              : toast.tone === 'info'
              ? 'bg-slate-900 dark:bg-slate-800 border-slate-700 text-white'
              : 'bg-emerald-600 border-emerald-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            className="opacity-80 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'home' && <StudyPartnerHomeView />}
      {activeTab === 'discover' && (
        <DiscoverPartnersView searchQuery={searchQuery} />
      )}
      {activeTab === 'requests' && <StudyRequestsView />}
      {activeTab === 'partners' && <MyPartnersView />}
      {activeTab === 'groups' && <StudyGroupsView />}
      {activeTab === 'sessions' && <SessionsAndGoalsView />}
      {activeTab === 'preferences' && <PartnerPreferencesView />}

      <PartnerProfileModal />
    </div>
  );
};

export const StudyPartnerPage: React.FC<StudyPartnerPageProps> = ({
  onOpenNotifications,
}) => {
  return (
    <StudyPartnerProvider>
      <StudyPartnerWorkspace onOpenNotifications={onOpenNotifications} />
    </StudyPartnerProvider>
  );
};
