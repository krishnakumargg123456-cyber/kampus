import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { NotificationItem } from '../types';
import { useAuth } from './AuthContext';
import { formatRelativeTimestamp } from '../data/notificationsData';
import type {
  AggregatedReminder,
  AnnouncementAudienceType,
  AnnouncementCategory,
  ChannelCapabilities,
  NotificationCategory,
  NotificationPreferences,
  NotificationPriority,
  NotificationRecord,
  NotificationRoleInfo,
  OfficialAnnouncement,
  PushSubscriptionRecord,
  SocialActivityItem,
} from '../types/notifications';

export interface NotificationFeedItem extends NotificationRecord {
  time: string;
  type: 'academic' | 'campus' | 'career' | 'system';
}

export interface AddNotificationInput extends Omit<NotificationItem, 'id' | 'read' | 'priority'> {
  category?: NotificationCategory;
  priority?: NotificationPriority;
  sourceModule?: string;
  subType?: string;
  details?: string;
  isMention?: boolean;
  isReminder?: boolean;
  actionLabel?: string;
  idempotencyKey?: string;
}

interface NotificationContextType {
  loading: boolean;
  error: string | null;
  actionBanner: string | null;
  clearError: () => void;
  clearBanner: () => void;
  connectionStatus: 'Live WebSocket' | 'Polling Sync' | 'Connecting';
  notifications: NotificationFeedItem[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  channelCapabilities: ChannelCapabilities | null;
  pushSubscriptions: PushSubscriptionRecord[];
  reminders: AggregatedReminder[];
  announcements: OfficialAnnouncement[];
  socialActivity: SocialActivityItem[];
  roleInfo: NotificationRoleInfo;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  toggleImportant: (id: string) => void;
  archiveNotification: (id: string, archived?: boolean) => void;
  deleteNotification: (id: string) => void;
  markAllAsRead: () => void;
  bulkAction: (
    action: 'mark-read' | 'mark-unread' | 'archive' | 'unarchive' | 'delete' | 'clear-read' | 'mark-all-read',
    ids?: string[],
    confirmed?: boolean
  ) => Promise<boolean>;
  addNotification: (item: AddNotificationInput) => void;
  updatePreferences: (patch: Partial<NotificationPreferences>) => Promise<boolean>;
  requestBrowserPushPermission: () => Promise<{ ok: boolean; statusText: string }>;
  disableBrowserPush: () => Promise<void>;
  performReminderAction: (payload: {
    sourceModule: AggregatedReminder['sourceModule'];
    sourceItemId: string;
    action: 'snooze' | 'reschedule' | 'complete';
    dateISO?: string;
    time?: string;
  }) => Promise<void>;
  switchRoleSession: (passkey?: string, revert?: boolean) => Promise<{ ok: boolean; error?: string }>;
  createAnnouncement: (payload: {
    title: string;
    description: string;
    category: AnnouncementCategory;
    targetAudience: AnnouncementAudienceType;
    targetValue?: string;
    attachmentName?: string;
    linkRoute?: string;
    scheduledFor?: string | null;
    status?: 'Published' | 'Scheduled' | 'Draft';
  }) => Promise<{ ok: boolean; error?: string }>;
  updateAnnouncement: (id: string, patch: Partial<OfficialAnnouncement>) => Promise<boolean>;
  deleteAnnouncement: (id: string) => Promise<boolean>;
  engageAnnouncement: (id: string, kind: 'read' | 'click') => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function mapCategoryToLegacyType(cat: NotificationCategory): 'academic' | 'campus' | 'career' | 'system' {
  if (cat === 'Academic') return 'academic';
  if (cat === 'Career') return 'career';
  if (cat === 'Events & Clubs' || cat === 'Community' || cat === 'College Explorer') return 'campus';
  return 'system';
}

function toFeedItem(rec: NotificationRecord): NotificationFeedItem {
  return {
    ...rec,
    time: formatRelativeTimestamp(rec.createdAt),
    type: mapCategoryToLegacyType(rec.category),
  };
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const userId = user?.id || 'usr_22b030149';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'Live WebSocket' | 'Polling Sync' | 'Connecting'>(
    'Connecting'
  );

  const [rawNotifications, setRawNotifications] = useState<NotificationRecord[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [channelCapabilities, setChannelCapabilities] = useState<ChannelCapabilities | null>(null);
  const [pushSubscriptions, setPushSubscriptions] = useState<PushSubscriptionRecord[]>([]);
  const [reminders, setReminders] = useState<AggregatedReminder[]>([]);
  const [announcements, setAnnouncements] = useState<OfficialAnnouncement[]>([]);
  const [socialActivity, setSocialActivity] = useState<SocialActivityItem[]>([]);
  const [roleInfo, setRoleInfo] = useState<NotificationRoleInfo>({ role: 'Student', label: null });

  const wsRef = useRef<WebSocket | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearBanner = useCallback(() => setActionBanner(null), []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          college: user?.college || profile?.college,
          course: user?.course || profile?.course,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load notifications.');
      setRawNotifications(data.notifications || []);
      setPreferences(data.preferences || null);
      setChannelCapabilities(data.channelCapabilities || null);
      setPushSubscriptions(data.pushSubscriptions || []);
      setReminders(data.reminders || []);
      setAnnouncements(data.announcements || []);
      setSocialActivity(data.socialActivity || []);
      setRoleInfo(data.roleInfo || { role: 'Student', label: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sync Notification Center.');
    } finally {
      setLoading(false);
    }
  }, [userId, user?.college, user?.course, profile?.college, profile?.course]);

  // Initial load + reliable 30s polling fallback
  useEffect(() => {
    refreshNotifications();
    const poll = window.setInterval(() => {
      refreshNotifications();
    }, 30_000);
    return () => window.clearInterval(poll);
  }, [refreshNotifications]);

  // Real-time WebSocket connection (/ws/notifications) with retry & fallback indicator
  useEffect(() => {
    let closedByCleanup = false;
    let reconnectTimer: number | undefined;

    const connect = () => {
      try {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${proto}//${window.location.host}/ws/notifications?userId=${encodeURIComponent(userId)}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('Live WebSocket');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'notification:created' && msg.notification) {
              setRawNotifications((prev) => {
                if (prev.some((n) => n.id === msg.notification.id)) return prev;
                return [msg.notification, ...prev];
              });
            } else if (msg.type === 'notification:updated' && msg.notification) {
              setRawNotifications((prev) =>
                prev.map((n) => (n.id === msg.notification.id ? msg.notification : n))
              );
            } else if (msg.type === 'notification:bulk' || msg.type === 'announcement:published') {
              void refreshNotifications();
            }
          } catch {
            // ignore malformed ws frame
          }
        };

        ws.onerror = () => {
          setConnectionStatus('Polling Sync');
        };

        ws.onclose = () => {
          setConnectionStatus('Polling Sync');
          if (!closedByCleanup) {
            reconnectTimer = window.setTimeout(connect, 6000);
          }
        };
      } catch {
        setConnectionStatus('Polling Sync');
      }
    };

    connect();
    return () => {
      closedByCleanup = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userId, refreshNotifications]);

  const patchNotification = useCallback(
    async (id: string, patch: { read?: boolean; archived?: boolean; important?: boolean; deleted?: boolean }) => {
      setRawNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n))
      );
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        if (!res.ok) {
          await refreshNotifications();
        }
      } catch {
        await refreshNotifications();
      }
    },
    [userId, refreshNotifications]
  );

  const markAsRead = useCallback((id: string) => void patchNotification(id, { read: true }), [patchNotification]);
  const markAsUnread = useCallback((id: string) => void patchNotification(id, { read: false }), [patchNotification]);
  const toggleImportant = useCallback(
    (id: string) => {
      const target = rawNotifications.find((n) => n.id === id);
      if (!target) return;
      void patchNotification(id, { important: !target.important });
    },
    [rawNotifications, patchNotification]
  );
  const archiveNotification = useCallback(
    (id: string, archived = true) => {
      void patchNotification(id, { archived });
      setActionBanner(archived ? 'Notification archived.' : 'Notification restored to inbox.');
    },
    [patchNotification]
  );
  const deleteNotification = useCallback(
    (id: string) => {
      void patchNotification(id, { deleted: true });
      setActionBanner('Notification moved to retention history.');
    },
    [patchNotification]
  );

  const bulkAction = useCallback(
    async (
      action: 'mark-read' | 'mark-unread' | 'archive' | 'unarchive' | 'delete' | 'clear-read' | 'mark-all-read',
      ids: string[] = [],
      confirmed = false
    ) => {
      try {
        const res = await fetch('/api/notifications/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action, ids, confirmed }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Bulk action failed.');
          return false;
        }
        setRawNotifications(data.notifications || []);
        setActionBanner(`Updated ${data.affected || 0} notification(s).`);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bulk action failed.');
        return false;
      }
    },
    [userId]
  );

  const markAllAsRead = useCallback(() => {
    void bulkAction('mark-all-read', [], true);
  }, [bulkAction]);

  const addNotification = useCallback(
    (item: AddNotificationInput) => {
      void (async () => {
        try {
          const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              title: item.title,
              description: item.description,
              type: item.type,
              linkRoute: item.linkRoute,
              category: item.category,
              priority: item.priority,
              sourceModule: item.sourceModule,
              subType: item.subType,
              details: item.details,
              isMention: item.isMention,
              isReminder: item.isReminder,
              actionLabel: item.actionLabel,
              idempotencyKey: item.idempotencyKey,
            }),
          });
          const data = await res.json();
          if (res.ok && data.notification) {
            setRawNotifications((prev) => {
              if (prev.some((n) => n.id === data.notification.id)) return prev;
              return [data.notification, ...prev];
            });
            // Trigger native browser push notification only when granted, enabled, and not held by quiet hours
            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              window.Notification.permission === 'granted' &&
              preferences?.channels.browserPush &&
              !data.notification.suppressedByQuietHours
            ) {
              try {
                new window.Notification(data.notification.title, {
                  body: data.notification.description,
                });
              } catch {
                // ignore browser push errors in restricted iframes
              }
            }
          }
        } catch {
          // silent retry on next poll
        }
      })();
    },
    [userId, preferences?.channels.browserPush]
  );

  const updatePreferences = useCallback(
    async (patch: Partial<NotificationPreferences>) => {
      try {
        const merged = { ...(preferences || {}), ...patch };
        const res = await fetch('/api/notifications/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, preferences: merged }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not save preferences.');
        setPreferences(data.preferences);
        setChannelCapabilities(data.channelCapabilities);
        setActionBanner('Notification preferences saved.');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save preferences.');
        return false;
      }
    },
    [userId, preferences]
  );

  const requestBrowserPushPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { ok: false, statusText: 'Browser Push API is not supported in this browser.' };
    }
    try {
      const permission = await window.Notification.requestPermission();
      const res = await fetch('/api/notifications/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          permissionState: permission,
          platform: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
          active: permission === 'granted',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPushSubscriptions(data.pushSubscriptions || []);
        setPreferences(data.preferences || null);
      }
      if (permission === 'granted') {
        setActionBanner('Browser Push Notifications enabled.');
        return { ok: true, statusText: 'Browser Push permission granted.' };
      }
      return { ok: false, statusText: `Browser Push permission state: ${permission}.` };
    } catch {
      return { ok: false, statusText: 'Could not request browser push permission.' };
    }
  }, [userId]);

  const disableBrowserPush = useCallback(async () => {
    await fetch('/api/notifications/push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, active: false }),
    });
    await refreshNotifications();
    setActionBanner('Browser Push Notifications disabled.');
  }, [userId, refreshNotifications]);

  const performReminderAction = useCallback(
    async (payload: {
      sourceModule: AggregatedReminder['sourceModule'];
      sourceItemId: string;
      action: 'snooze' | 'reschedule' | 'complete';
      dateISO?: string;
      time?: string;
    }) => {
      try {
        const res = await fetch('/api/notifications/reminders/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not update reminder.');
        setReminders(data.reminders || []);
        setActionBanner(`Reminder updated (${payload.action}).`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update reminder.');
      }
    },
    [userId]
  );

  const switchRoleSession = useCallback(
    async (passkey?: string, revert = false) => {
      try {
        const res = await fetch('/api/notifications/auth/role-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, passkey, revert }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.message || 'Role switch failed.' };
        setRoleInfo(data.roleInfo);
        await refreshNotifications();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Role switch failed.' };
      }
    },
    [userId, refreshNotifications]
  );

  const createAnnouncement = useCallback(
    async (payload: {
      title: string;
      description: string;
      category: AnnouncementCategory;
      targetAudience: AnnouncementAudienceType;
      targetValue?: string;
      attachmentName?: string;
      linkRoute?: string;
      scheduledFor?: string | null;
      status?: 'Published' | 'Scheduled' | 'Draft';
    }) => {
      try {
        const res = await fetch('/api/notifications/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            userId,
            publisherName: profile?.name || 'KAMPUS Administration',
            publisherRole: roleInfo.label || 'Authorized Publisher',
          }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.message || 'Publish failed.' };
        setAnnouncements((prev) => [data.announcement, ...prev]);
        setActionBanner(`Official announcement "${data.announcement.title}" ${data.announcement.status.toLowerCase()}.`);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Publish failed.' };
      }
    },
    [userId, profile?.name, roleInfo.label]
  );

  const updateAnnouncement = useCallback(
    async (id: string, patch: Partial<OfficialAnnouncement>) => {
      try {
        const res = await fetch(`/api/notifications/announcements/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Update failed.');
        setAnnouncements((prev) => prev.map((a) => (a.id === id ? data.announcement : a)));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed.');
        return false;
      }
    },
    [userId]
  );

  const deleteAnnouncement = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/notifications/announcements/${id}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
        return false;
      }
    },
    [userId]
  );

  const engageAnnouncement = useCallback(
    async (id: string, kind: 'read' | 'click') => {
      try {
        const res = await fetch(`/api/notifications/announcements/${id}/engage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, kind }),
        });
        const data = await res.json();
        if (res.ok && data.announcement) {
          setAnnouncements((prev) => prev.map((a) => (a.id === id ? data.announcement : a)));
        }
      } catch {
        // ignore telemetry errors
      }
    },
    [userId]
  );

  const notifications = useMemo(
    () => rawNotifications.map(toFeedItem),
    [rawNotifications]
  );

  const unreadCount = useMemo(
    () => rawNotifications.filter((n) => !n.deleted && !n.archived && !n.read).length,
    [rawNotifications]
  );

  const value = useMemo(
    () => ({
      loading,
      error,
      actionBanner,
      clearError,
      clearBanner,
      connectionStatus,
      notifications,
      unreadCount,
      preferences,
      channelCapabilities,
      pushSubscriptions,
      reminders,
      announcements,
      socialActivity,
      roleInfo,
      refreshNotifications,
      markAsRead,
      markAsUnread,
      toggleImportant,
      archiveNotification,
      deleteNotification,
      markAllAsRead,
      bulkAction,
      addNotification,
      updatePreferences,
      requestBrowserPushPermission,
      disableBrowserPush,
      performReminderAction,
      switchRoleSession,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      engageAnnouncement,
    }),
    [
      loading,
      error,
      actionBanner,
      clearError,
      clearBanner,
      connectionStatus,
      notifications,
      unreadCount,
      preferences,
      channelCapabilities,
      pushSubscriptions,
      reminders,
      announcements,
      socialActivity,
      roleInfo,
      refreshNotifications,
      markAsRead,
      markAsUnread,
      toggleImportant,
      archiveNotification,
      deleteNotification,
      markAllAsRead,
      bulkAction,
      addNotification,
      updatePreferences,
      requestBrowserPushPermission,
      disableBrowserPush,
      performReminderAction,
      switchRoleSession,
      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      engageAnnouncement,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};
