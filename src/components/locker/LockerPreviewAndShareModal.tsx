import React, { useState } from 'react';
import {
  Ban,
  Copy,
  Download,
  FileText,
  Link2,
  Maximize2,
  Minimize2,
  Printer,
  Share2,
  Shield,
  UserPlus,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useLocker } from '../../context/LockerContext';
import {
  KAMPUS_SHARE_PEERS,
  formatLockerBytes,
  formatLockerDateTime,
  isImageFormat,
  isPdfFormat,
} from '../../data/lockerData';
import type { LockerDocument } from '../../types/locker';

interface LockerPreviewModalProps {
  doc: LockerDocument;
  isSharedRecipient?: boolean;
  onClose: () => void;
  onOpenShare?: () => void;
}

export const LockerPreviewModal: React.FC<LockerPreviewModalProps> = ({
  doc,
  isSharedRecipient = false,
  onClose,
  onOpenShare,
}) => {
  const { getContentUrl } = useLocker();
  const [zoom, setZoom] = useState(100);
  const [fullScreen, setFullScreen] = useState(false);

  const inlineUrl = getContentUrl(doc.id, false);
  const downloadUrl = getContentUrl(doc.id, true);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={doc.title}
    >
      <div
        className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden ${
          fullScreen ? 'w-full h-full' : 'w-full max-w-5xl max-h-[90vh]'
        }`}
      >
        {/* Top Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {doc.title}
            </h3>
            <p className="text-slate-500 truncate tabular-nums">
              {doc.fileName} · {doc.format} · {formatLockerBytes(doc.sizeBytes)} · {doc.category}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(isImageFormat(doc.format) || isPdfFormat(doc.format)) && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  aria-label="Zoom out"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono tabular-nums">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  aria-label="Zoom in"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </>
            )}

            {isPdfFormat(doc.format) && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setFullScreen((v) => !v)}
              aria-label="Toggle full screen preview"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {!isSharedRecipient && onOpenShare && (
              <button
                type="button"
                onClick={onOpenShare}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            )}

            <a
              href={downloadUrl}
              download={doc.fileName}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold inline-flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-auto p-4 flex items-center justify-center min-h-[380px]">
          {isPdfFormat(doc.format) ? (
            <div
              className="w-full h-full min-h-[480px] bg-white rounded-xl overflow-hidden border border-slate-200"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <iframe title={doc.title} src={inlineUrl} className="w-full h-[65vh]" />
            </div>
          ) : isImageFormat(doc.format) ? (
            <img
              src={inlineUrl}
              alt={doc.title}
              referrerPolicy="no-referrer"
              style={{ transform: `scale(${zoom / 100})` }}
              className="max-w-full max-h-[68vh] object-contain rounded-xl shadow transition-transform"
            />
          ) : (
            <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 text-xs">
              <FileText className="w-12 h-12 text-blue-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {doc.format} Document Ready for Download
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Inline browser preview is not supported for {doc.format} files. Download the
                  encrypted copy safely to view it locally.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-left space-y-1">
                <p>
                  <strong>File:</strong> {doc.fileName}
                </p>
                <p className="tabular-nums">
                  <strong>Size:</strong> {formatLockerBytes(doc.sizeBytes)}
                </p>
                <p>
                  <strong>SHA-256 Checksum:</strong>{' '}
                  <span className="font-mono break-all">{doc.sha256Checksum.slice(0, 24)}...</span>
                </p>
              </div>
              {doc.searchableText && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-left max-h-40 overflow-y-auto">
                  <p className="font-bold mb-1">Extracted Text Snippet:</p>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {doc.searchableText.slice(0, 500)}
                  </p>
                </div>
              )}
              <a
                href={downloadUrl}
                download={doc.fileName}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download {doc.fileName}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface LockerShareModalProps {
  doc: LockerDocument;
  onClose: () => void;
}

export const LockerShareModal: React.FC<LockerShareModalProps> = ({ doc, onClose }) => {
  const { shareWithUser, createShareLink, revokeShare, showToast } = useLocker();

  const [selectedPeerId, setSelectedPeerId] = useState(KAMPUS_SHARE_PEERS[0].id);
  const [userPerm, setUserPerm] = useState<'view' | 'download'>('view');
  const [userHours, setUserHours] = useState(72);

  const [linkLabel, setLinkLabel] = useState('Restricted Verification Link');
  const [linkPerm, setLinkPerm] = useState<'view' | 'download'>('view');
  const [linkHours, setLinkHours] = useState(24);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleUserShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const peer = KAMPUS_SHARE_PEERS.find((p) => p.id === selectedPeerId);
    if (!peer) return;
    await shareWithUser({
      documentId: doc.id,
      targetUserId: peer.id,
      targetUserName: peer.name,
      permission: userPerm,
      expiresInHours: userHours,
    });
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = await createShareLink({
      documentId: doc.id,
      label: linkLabel.trim() || 'Restricted Link',
      permission: linkPerm,
      expiresInHours: linkHours,
    });
    if (url) setGeneratedLink(url);
  };

  const activeUsers = doc.userShares.filter((s) => !s.revoked);
  const activeLinks = doc.shareLinks.filter(
    (l) => !l.revoked && new Date(l.expiresAt).getTime() > Date.now()
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 overflow-y-auto p-4 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6 text-xs my-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Secure Sharing &amp; Access Control</span>
            </h3>
            <p className="text-slate-500 mt-0.5 truncate">Document: {doc.title}</p>
          </div>
          <button type="button" onClick={onClose}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Share with Specific KAMPUS User */}
        <form
          onSubmit={handleUserShare}
          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
        >
          <p className="font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Share with Selected KAMPUS User</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={selectedPeerId}
              onChange={(e) => setSelectedPeerId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              {KAMPUS_SHARE_PEERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={userPerm}
              onChange={(e) => setUserPerm(e.target.value as 'view' | 'download')}
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              <option value="view">View Only</option>
              <option value="download">View &amp; Download</option>
            </select>
            <select
              value={userHours}
              onChange={(e) => setUserHours(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              <option value={24}>Expires in 24 Hours</option>
              <option value={72}>Expires in 3 Days</option>
              <option value={168}>Expires in 7 Days</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
          >
            Grant Authenticated User Access
          </button>
        </form>

        {/* Generate Expiring Signed Link */}
        <form
          onSubmit={handleGenerateLink}
          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
        >
          <p className="font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-orange-500" />
            <span>Create Restricted Expiring Share Link</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Link purpose..."
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
            <select
              value={linkPerm}
              onChange={(e) => setLinkPerm(e.target.value as 'view' | 'download')}
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              <option value="view">View Only</option>
              <option value="download">View &amp; Download</option>
            </select>
            <select
              value={linkHours}
              onChange={(e) => setLinkHours(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              <option value={1}>Valid 1 Hour</option>
              <option value={24}>Valid 24 Hours</option>
              <option value={168}>Valid 7 Days</option>
              <option value={720}>Valid 30 Days</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            Generate Signed Link
          </button>

          {generatedLink && (
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] truncate">{generatedLink}</span>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard?.writeText(generatedLink);
                  showToast('success', 'Signed share link copied.');
                }}
                className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold inline-flex items-center gap-1 shrink-0"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
          )}
        </form>

        {/* Active Permissions & Instant Revocation */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Active Sharing Permissions ({activeUsers.length + activeLinks.length})
          </h4>
          {activeUsers.length === 0 && activeLinks.length === 0 ? (
            <p className="text-slate-500">
              This document is strictly private. No active user shares or signed links exist.
            </p>
          ) : (
            <div className="space-y-2">
              {activeUsers.map((sh) => (
                <div
                  key={sh.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      User: {sh.targetUserName} ({sh.permission})
                    </p>
                    <p className="text-slate-500 tabular-nums">
                      Expires: {sh.expiresAt ? formatLockerDateTime(sh.expiresAt) : 'No expiry'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeShare({ documentId: doc.id, shareUserId: sh.id })}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold inline-flex items-center gap-1"
                  >
                    <Ban className="w-3 h-3" />
                    <span>Revoke Access</span>
                  </button>
                </div>
              ))}

              {activeLinks.map((lk) => (
                <div
                  key={lk.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      Signed Link: {lk.label} ({lk.permission})
                    </p>
                    <p className="text-slate-500 tabular-nums">
                      Expires {formatLockerDateTime(lk.expiresAt)} · {lk.accessCount} access(es)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => revokeShare({ documentId: doc.id, shareLinkId: lk.id })}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold inline-flex items-center gap-1"
                  >
                    <Ban className="w-3 h-3" />
                    <span>Revoke Link</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
