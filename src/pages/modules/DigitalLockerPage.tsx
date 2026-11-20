import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Download,
  FolderPlus,
  Lock,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { LockerProvider, useLocker } from '../../context/LockerContext';
import { formatLockerBytes, isImageFormat, isPdfFormat } from '../../data/lockerData';
import type { LockerCategory, LockerDocument, LockerFileFormat } from '../../types/locker';
import {
  LockerSidebar,
  type LockerSectionNav,
} from '../../components/locker/LockerSidebarAndStats';
import { LockerWorkspaceViews } from '../../components/locker/LockerWorkspaceViews';
import {
  LockerPreviewModal,
  LockerShareModal,
} from '../../components/locker/LockerPreviewAndShareModal';
import { LockerRemindersAndIntegrationsView } from '../../components/locker/LockerRemindersAndIntegrationsView';

interface DigitalLockerPageProps {
  onOpenNotifications?: () => void;
}

interface SharedTokenPayload {
  document: {
    id: string;
    title: string;
    fileName: string;
    format: LockerFileFormat;
    mimeType: string;
    sizeBytes: number;
    category: string;
    subtype: string;
    ownerName: string;
    description: string;
    createdAt: string;
  };
  permission: 'view' | 'download';
  expiresAt: string;
}

const DigitalLockerWorkspace: React.FC<DigitalLockerPageProps> = ({
  onOpenNotifications,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const shareToken = searchParams.get('shareToken') || '';
  const { user } = useAuth();
  const userId = user?.id || 'usr_22b030149';
  const { unreadCount } = useNotifications();
  const { statusToast, clearToast, loading, documents } = useLocker();

  const [section, setSection] = useState<LockerSectionNav>('overview');
  const [selectedCategory, setSelectedCategory] = useState<LockerCategory | 'all'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  const [previewState, setPreviewState] = useState<{
    doc: LockerDocument;
    isSharedRecipient: boolean;
  } | null>(null);
  const [shareDocId, setShareDocId] = useState<string | null>(null);

  // Incoming signed shareToken lookup
  const [tokenData, setTokenData] = useState<SharedTokenPayload | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) {
      setTokenData(null);
      setTokenError(null);
      return;
    }
    fetch(
      `/api/locker/shared/${encodeURIComponent(shareToken)}?userId=${encodeURIComponent(userId)}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to verify shared link.');
        setTokenData(data);
        setTokenError(null);
      })
      .catch((err) => {
        setTokenData(null);
        setTokenError(err instanceof Error ? err.message : 'Shared link unavailable.');
      });
  }, [shareToken, userId]);

  const activeShareDoc = shareDocId
    ? documents.find((d) => d.id === shareDocId) || null
    : null;

  const dismissShareToken = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('shareToken');
    setSearchParams(next, { replace: true });
    setTokenData(null);
    setTokenError(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Status Toast */}
      {statusToast && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 ${
            statusToast.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : statusToast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          <span>{statusToast.message}</span>
          <button type="button" onClick={clearToast} aria-label="Dismiss toast">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>KAMPUS Digital Locker</span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 text-balance">
            Your Documents, One Secure Place.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize your academic records and important documents with ease.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Open Notification Center"
              className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setFolderModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold inline-flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-blue-600" />
            <span>New Folder</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </header>

      {/* Signed Share Link Banner (when navigated via ?shareToken=...) */}
      {shareToken && tokenError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center justify-between gap-3 text-xs text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{tokenError}</span>
          </div>
          <button type="button" onClick={dismissShareToken} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {shareToken && tokenData && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Shared Document: {tokenData.document.title}
              </p>
              <p className="text-slate-500">
                Shared by {tokenData.document.ownerName} · Permission: {tokenData.permission} ·{' '}
                {formatLockerBytes(tokenData.document.sizeBytes)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {tokenData.permission === 'download' && (
                <a
                  href={`/api/locker/shared/${encodeURIComponent(
                    shareToken
                  )}/content?userId=${encodeURIComponent(userId)}&download=1`}
                  download={tokenData.document.fileName}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              )}
              <button
                type="button"
                onClick={dismissShareToken}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
              >
                Close Shared View
              </button>
            </div>
          </div>
          {isPdfFormat(tokenData.document.format) && (
            <iframe
              title={tokenData.document.title}
              src={`/api/locker/shared/${encodeURIComponent(
                shareToken
              )}/content?userId=${encodeURIComponent(userId)}`}
              className="w-full h-[460px] rounded-xl border border-slate-200 dark:border-slate-700"
            />
          )}
          {isImageFormat(tokenData.document.format) && (
            <img
              src={`/api/locker/shared/${encodeURIComponent(
                shareToken
              )}/content?userId=${encodeURIComponent(userId)}`}
              alt={tokenData.document.title}
              referrerPolicy="no-referrer"
              className="max-h-[460px] mx-auto rounded-xl object-contain"
            />
          )}
        </div>
      )}

      {/* Main Split Workspace: Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <LockerSidebar
          activeSection={section}
          selectedCategory={selectedCategory}
          selectedFolderId={selectedFolderId}
          onSelectSection={setSection}
          onSelectCategory={setSelectedCategory}
          onSelectFolder={setSelectedFolderId}
          onOpenUpload={() => setUploadModalOpen(true)}
          onOpenNewFolder={() => setFolderModalOpen(true)}
        />

        <div className="flex-1 min-w-0 w-full">
          {loading && documents.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500">
              Unlocking your private Digital Locker...
            </div>
          ) : section === 'reminders' || section === 'integrations' || section === 'activity' ? (
            <LockerRemindersAndIntegrationsView mode={section} />
          ) : (
            <LockerWorkspaceViews
              section={section}
              selectedCategory={selectedCategory}
              selectedFolderId={selectedFolderId}
              onSelectSection={setSection}
              onSelectCategory={setSelectedCategory}
              onSelectFolder={setSelectedFolderId}
              onOpenPreview={(doc, isSharedRecipient = false) =>
                setPreviewState({ doc, isSharedRecipient })
              }
              onOpenShare={(doc) => setShareDocId(doc.id)}
              uploadModalOpen={uploadModalOpen}
              setUploadModalOpen={setUploadModalOpen}
              folderModalOpen={folderModalOpen}
              setFolderModalOpen={setFolderModalOpen}
            />
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewState && (
        <LockerPreviewModal
          doc={previewState.doc}
          isSharedRecipient={previewState.isSharedRecipient}
          onClose={() => setPreviewState(null)}
          onOpenShare={() => {
            const id = previewState.doc.id;
            setPreviewState(null);
            setShareDocId(id);
          }}
        />
      )}

      {/* Secure Share Modal */}
      {activeShareDoc && (
        <LockerShareModal doc={activeShareDoc} onClose={() => setShareDocId(null)} />
      )}
    </div>
  );
};

export const DigitalLockerPage: React.FC<DigitalLockerPageProps> = ({
  onOpenNotifications,
}) => {
  return (
    <LockerProvider>
      <DigitalLockerWorkspace onOpenNotifications={onOpenNotifications} />
    </LockerProvider>
  );
};

export default DigitalLockerPage;
