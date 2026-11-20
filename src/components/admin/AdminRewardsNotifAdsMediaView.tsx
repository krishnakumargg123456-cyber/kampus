import React, { useEffect, useState } from 'react';
import { Copy, Plus, Send, Trash2, Upload } from 'lucide-react';
import type { AdCampaignRecord, MediaAssetRecord } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { AdminCard, AdminFeedbackBanner, StatusLabel, formatBytes, formatDateTime } from './AdminShared';
import { resolveAssetUrl } from '../../utils/assetResolver';

export const AdminRewardsNotifAdsMediaView: React.FC<{
  mode: 'rewards' | 'notifications' | 'ads' | 'media';
}> = ({ mode }) => {
  const { adminFetch, hasPermission } = useAdminAuth();
  const { refreshPlatformConfig } = usePlatformConfig();

  // Rewards
  const [rewards, setRewards] = useState<any>({ rules: [], levels: [], challenges: [], catalog: [], auditLogs: [] });
  const [adjUserId, setAdjUserId] = useState('usr_22b030149');
  const [adjDelta, setAdjDelta] = useState(50);
  const [adjReason, setAdjReason] = useState('');

  // Notifications
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifPriority, setNotifPriority] = useState('High');

  // Ads
  const [ads, setAds] = useState<AdCampaignRecord[]>([]);
  const [adTitle, setAdTitle] = useState('');
  const [adPlacement, setAdPlacement] = useState<AdCampaignRecord['placement']>('Homepage Banner');
  const [adTargetUrl, setAdTargetUrl] = useState('/campus/events-clubs');

  // Media
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);
  const [mediaFolder, setMediaFolder] = useState<MediaAssetRecord['folder']>('General');

  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (mode === 'rewards') {
      adminFetch<any>('/api/admin/rewards').then(setRewards).catch((e) => setNotice({ kind: 'error', message: e.message }));
    } else if (mode === 'notifications') {
      adminFetch<any>('/api/admin/notifications')
        .then((d) => setAnnouncements(d.announcements || []))
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    } else if (mode === 'ads') {
      adminFetch<{ ads: AdCampaignRecord[] }>('/api/admin/ads')
        .then((d) => setAds(d.ads || []))
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    } else {
      adminFetch<{ assets: MediaAssetRecord[] }>('/api/admin/media')
        .then((d) => setAssets(d.assets || []))
        .catch((e) => setNotice({ kind: 'error', message: e.message }));
    }
  }, [mode, adminFetch]);

  const adjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminFetch<any>('/api/admin/rewards/adjust-points', {
        method: 'POST',
        body: JSON.stringify({ userId: adjUserId, deltaPoints: Number(adjDelta), reason: adjReason }),
      });
      setRewards((prev: any) => ({ ...prev, auditLogs: res.auditLogs || prev.auditLogs }));
      setAdjReason('');
      setNotice({ kind: 'success', message: `Points adjustment (${adjDelta}) recorded with audit trail.` });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Points adjustment failed.' });
    }
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminFetch<any>('/api/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title: notifTitle, message: notifMsg, priority: notifPriority }),
      });
      setAnnouncements(res.announcements || []);
      setNotifTitle('');
      setNotifMsg('');
      setNotice({
        kind: 'success',
        message: `Broadcast published (${res.deliveredCount} student notification records delivered).`,
      });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Broadcast failed.' });
    }
  };

  const createAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim()) return;
    try {
      const res = await adminFetch<{ ads: AdCampaignRecord[] }>('/api/admin/ads', {
        method: 'POST',
        body: JSON.stringify({ title: adTitle, placement: adPlacement, targetUrl: adTargetUrl, status: 'Active' }),
      });
      setAds(res.ads);
      setAdTitle('');
      await refreshPlatformConfig();
      setNotice({ kind: 'success', message: 'Campaign created and active on student placements.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to create campaign.' });
    }
  };

  const toggleAdStatus = async (ad: AdCampaignRecord) => {
    const nextStatus = ad.status === 'Active' ? 'Paused' : 'Active';
    try {
      const res = await adminFetch<{ ads: AdCampaignRecord[] }>(`/api/admin/ads/${ad.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      setAds(res.ads);
      await refreshPlatformConfig();
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Failed.' });
    }
  };

  const deleteAd = async (id: string) => {
    try {
      const res = await adminFetch<{ ads: AdCampaignRecord[] }>(`/api/admin/ads/${id}`, { method: 'DELETE' });
      setAds(res.ads);
      await refreshPlatformConfig();
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Delete failed.' });
    }
  };

  const handleUploadMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await adminFetch<{ assets: MediaAssetRecord[] }>('/api/admin/media', {
          method: 'POST',
          body: JSON.stringify({
            name: file.name,
            folder: mediaFolder,
            mimeType: file.type || 'image/png',
            base64Data: String(reader.result || ''),
          }),
        });
        setAssets(res.assets);
        setNotice({ kind: 'success', message: `Uploaded "${file.name}" to Media Library.` });
      } catch (err) {
        setNotice({ kind: 'error', message: err instanceof Error ? err.message : 'Upload failed.' });
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteMedia = async (id: string) => {
    try {
      const res = await adminFetch<{ assets: MediaAssetRecord[] }>(`/api/admin/media/${id}`, { method: 'DELETE' });
      setAssets(res.assets);
      setNotice({ kind: 'info', message: 'Media asset deleted.' });
    } catch (e) {
      setNotice({ kind: 'error', message: e instanceof Error ? e.message : 'Cannot delete media asset.' });
    }
  };

  if (mode === 'rewards') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Rewards Ecosystem Management
          </h1>
          <p className="text-xs text-slate-500">
            Configure transparent student earning rules, challenges, catalog rewards, and audited points adjustments.
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard title="Audited Points Adjustment">
            <form onSubmit={adjustPoints} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Student User ID</label>
                <input
                  type="text"
                  required
                  value={adjUserId}
                  onChange={(e) => setAdjUserId(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Points Delta (+ credit / - deduct)</label>
                <input
                  type="number"
                  required
                  value={adjDelta}
                  onChange={(e) => setAdjDelta(Number(e.target.value))}
                  className="w-full px-3 py-1.5 font-mono rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mandatory Audit Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verified hackathon volunteer recognition"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <button
                type="submit"
                disabled={!hasPermission('configure')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50"
              >
                Apply Audited Adjustment
              </button>
            </form>
          </AdminCard>

          <AdminCard title={`Earning Rules (${rewards.rules?.length || 0}) & Audit Logs`}>
            <div className="space-y-2 max-h-64 overflow-y-auto text-xs divide-y divide-slate-100 dark:divide-slate-800">
              {(rewards.auditLogs || []).slice(0, 15).map((log: any) => (
                <div key={log.id} className="py-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold">{log.reason}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {log.targetUserId} · {log.actor}
                    </div>
                  </div>
                  <span className="font-mono font-bold tabular-nums">
                    {log.deltaPoints > 0 ? `+${log.deltaPoints}` : log.deltaPoints} pts
                  </span>
                </div>
              ))}
              {(!rewards.auditLogs || rewards.auditLogs.length === 0) && (
                <p className="text-slate-500 py-4">No manual point adjustments logged yet.</p>
              )}
            </div>
          </AdminCard>
        </div>
      </div>
    );
  }

  if (mode === 'notifications') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Notification & Official Broadcast Center
          </h1>
          <p className="text-xs text-slate-500">
            Publish official university announcements directly into students&apos; Notification Centers.
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard title="Send Official Broadcast">
            <form onSubmit={sendBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. Mid-Semester Timetable Update"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Priority</label>
                <select
                  value={notifPriority}
                  onChange={(e) => setNotifPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Announcement Message</label>
                <textarea
                  rows={3}
                  required
                  value={notifMsg}
                  onChange={(e) => setNotifMsg(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <button
                type="submit"
                disabled={!hasPermission('publish')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                Publish Broadcast
              </button>
            </form>
          </AdminCard>

          <AdminCard title={`Published Announcements (${announcements.length})`}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {announcements.map((a) => (
                <div key={a.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{a.title}</span>
                    <StatusLabel status={a.priority || 'Published'} />
                  </div>
                  <p className="text-slate-500 mt-0.5 line-clamp-2">{a.message}</p>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    );
  }

  if (mode === 'ads') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Advertisement & Sponsor Campaign Management
          </h1>
          <p className="text-xs text-slate-500">
            Manage verified student sponsor placements with genuine tracked impressions and clicks.
          </p>
        </div>

        <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

        {hasPermission('create') && (
          <AdminCard title="Create Campaign">
            <form onSubmit={createAd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Placement</label>
                <select
                  value={adPlacement}
                  onChange={(e) => setAdPlacement(e.target.value as AdCampaignRecord['placement'])}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Homepage Banner">Homepage Banner</option>
                  <option value="Campus Feed">Campus Feed</option>
                  <option value="Career Sidebar">Career Sidebar</option>
                  <option value="Marketplace Top">Marketplace Top</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold inline-flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Create Campaign
              </button>
            </form>
          </AdminCard>
        )}

        <AdminCard title={`Active & Scheduled Campaigns (${ads.length})`}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ads.map((ad) => (
              <div key={ad.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold">{ad.title}</div>
                  <div className="text-[11px] text-slate-500">
                    {ad.placement} · Route: <span className="font-mono">{ad.targetUrl}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right font-mono tabular-nums text-[11px]">
                    <div>{ad.impressions} views</div>
                    <div>{ad.clicks} clicks</div>
                  </div>
                  <StatusLabel status={ad.status} />
                  <button
                    type="button"
                    onClick={() => toggleAdStatus(ad)}
                    className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    {ad.status === 'Active' ? 'Pause' : 'Activate'}
                  </button>
                  {hasPermission('delete') && (
                    <button
                      type="button"
                      onClick={() => deleteAd(ad.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Media Library & Asset Governance
          </h1>
          <p className="text-xs text-slate-500">
            Upload, preview, copy public asset URLs, check live references, and remove unused media safely.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={mediaFolder}
            onChange={(e) => setMediaFolder(e.target.value as MediaAssetRecord['folder'])}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            <option value="General">General</option>
            <option value="Homepage">Homepage</option>
            <option value="Logos & Brand">Logos & Brand</option>
            <option value="Banners">Banners</option>
            <option value="Pages">Pages</option>
          </select>
          <label className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Upload Asset
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadMedia} />
          </label>
        </div>
      </div>

      <AdminFeedbackBanner notice={notice} onDismiss={() => setNotice(null)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((m) => (
          <div
            key={m.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col"
          >
            <div className="h-36 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
              {m.mimeType.startsWith('image/') ? (
                <img src={resolveAssetUrl(m.url)} alt={m.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-mono text-slate-500">{m.mimeType}</span>
              )}
            </div>
            <div className="p-3.5 space-y-2 text-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="font-bold truncate">{m.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {m.folder} · {formatBytes(m.sizeBytes)} · {formatDateTime(m.uploadedAt)}
                </div>
                {m.usageRefs.length > 0 && (
                  <div className="mt-1 text-[10px] text-blue-600 dark:text-blue-400">
                    Used in: {m.usageRefs.join(', ')}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(m.url);
                    setNotice({ kind: 'info', message: `Copied URL: ${m.url}` });
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  <Copy className="w-3 h-3" /> Copy URL
                </button>
                {hasPermission('delete') && (
                  <button
                    type="button"
                    onClick={() => deleteMedia(m.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete unused asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
