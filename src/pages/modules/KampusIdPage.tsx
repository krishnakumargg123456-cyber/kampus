import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  KeyRound,
  Lock,
  QrCode,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { KampusIdProvider, useKampusId } from '../../context/KampusIdContext';
import { useNotifications } from '../../context/NotificationContext';
import { DigitalIdCardView } from '../../components/kampusid/DigitalIdCardView';
import {
  PublicProfilePreviewView,
  QrVerificationView,
} from '../../components/kampusid/QrVerificationAndPublicView';
import {
  IdentityHistoryView,
  KampusIdAiHelperModal,
  ProfileAndPrivacySettingsView,
  VerifierAdminView,
} from '../../components/kampusid/PrivacyHistoryAdminView';

interface KampusIdPageProps {
  onOpenNotifications?: () => void;
}

type KampusIdTab = 'card' | 'verify' | 'public' | 'settings' | 'history' | 'admin';

const KampusIdShell: React.FC<KampusIdPageProps> = ({ onOpenNotifications }) => {
  const [searchParams] = useSearchParams();
  const publicQuery = searchParams.get('public') || '';
  const { unreadCount } = useNotifications();
  const {
    loading,
    error,
    toastMessage,
    identity,
    roleInfo,
    refresh,
  } = useKampusId();

  const [activeTab, setActiveTab] = useState<KampusIdTab>(publicQuery ? 'verify' : 'card');
  const [aiModalOpen, setAiModalOpen] = useState(false);

  useEffect(() => {
    if (publicQuery) {
      setActiveTab('verify');
    }
  }, [publicQuery]);

  const navItems: Array<{
    id: KampusIdTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'card', label: 'My Digital ID Card', icon: CreditCard },
    { id: 'verify', label: 'QR & Identity Verifier', icon: QrCode },
    { id: 'public', label: 'Public Profile Preview', icon: Eye },
    { id: 'settings', label: 'Profile & Privacy', icon: Lock },
    { id: 'history', label: 'Activity History', icon: Clock },
    {
      id: 'admin',
      label: roleInfo.role === 'Student' ? 'Verifier Portal' : 'Verification Queue',
      icon: KeyRound,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-semibold text-[#2563EB] flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            <span>
              CAMPUS · Digital Platform Identity
              {identity ? ` · ${identity.kampusIdNumber}` : ''}
              {roleInfo.role !== 'Student' ? ` · ${roleInfo.role}` : ''}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-slate-100 tracking-tight mt-0.5">
            KAMPUS ID
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Your immutable KAMPUS digital student identity card, signed QR verifier, privacy
            controls, and connected campus achievements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAiModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 hover:border-[#2563EB]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>AI Identity Guide</span>
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
        </div>
      </header>

      {/* Section Navigation */}
      <nav
        aria-label="KAMPUS ID Sections"
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

      {/* Main Content */}
      {loading ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <RefreshCw className="w-5 h-5 text-[#2563EB] animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            Loading your KAMPUS Digital Identity...
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
          {activeTab === 'card' && (
            <DigitalIdCardView onNavigateTab={(t) => setActiveTab(t)} />
          )}
          {activeTab === 'verify' && (
            <QrVerificationView initialPublicIdentifier={publicQuery || undefined} />
          )}
          {activeTab === 'public' && <PublicProfilePreviewView />}
          {activeTab === 'settings' && <ProfileAndPrivacySettingsView />}
          {activeTab === 'history' && <IdentityHistoryView />}
          {activeTab === 'admin' && <VerifierAdminView />}
        </>
      )}

      <KampusIdAiHelperModal open={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  );
};

export const KampusIdPage: React.FC<KampusIdPageProps> = ({ onOpenNotifications }) => {
  return (
    <KampusIdProvider>
      <KampusIdShell onOpenNotifications={onOpenNotifications} />
    </KampusIdProvider>
  );
};
