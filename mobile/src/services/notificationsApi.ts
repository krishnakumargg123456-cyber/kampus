import API_BASE_URL from '../config/api';

export type NotificationCategory = 'Academic' | 'Campus' | 'Community' | 'Market' | 'Career' | 'System';
export type NotificationPriority = 'Low' | 'Normal' | 'Important' | 'Urgent';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  details?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  archived?: boolean;
  deleted?: boolean;
  important?: boolean;
  linkRoute?: string;
  actionLabel?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationPreferences {
  academicAlerts: boolean;
  campusEvents: boolean;
  communityAlerts: boolean;
  marketAlerts: boolean;
  careerAlerts: boolean;
  systemAlerts: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

const getHeaders = (token?: string | null, userId?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
};

export const notificationsApi = {
  async getNotifications(
    token?: string | null,
    userId?: string | null,
    category?: string,
    unreadOnly?: boolean
  ): Promise<{ notifications: NotificationItem[]; unreadCount: number; total: number }> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (unreadOnly) params.append('unreadOnly', 'true');
    if (userId) params.append('userId', userId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/api/notifications${qs}`, {
      headers: getHeaders(token, userId),
    });
    if (!res.ok) {
      throw new Error(`Failed to load notifications: HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      notifications: data.notifications || [],
      unreadCount: data.unreadCount || 0,
      total: data.total || 0,
    };
  },

  async getUnreadCount(token?: string | null, userId?: string | null): Promise<number> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count${qs}`, {
      headers: getHeaders(token, userId),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.unreadCount ?? data.count ?? 0;
  },

  async markAsRead(id: string, token?: string | null, userId?: string | null): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
    });
    return res.ok;
  },

  async markAllRead(token?: string | null, userId?: string | null): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: getHeaders(token, userId),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.updatedCount || 0;
  },

  async deleteNotification(id: string, token?: string | null, userId?: string | null): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
    return res.ok;
  },

  async clearAll(token?: string | null, userId?: string | null): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/notifications`, {
      method: 'DELETE',
      headers: getHeaders(token, userId),
    });
    return res.ok;
  },

  async getPreferences(token?: string | null, userId?: string | null): Promise<NotificationPreferences> {
    const res = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      headers: getHeaders(token, userId),
    });
    if (!res.ok) {
      return {
        academicAlerts: true,
        campusEvents: true,
        communityAlerts: true,
        marketAlerts: true,
        careerAlerts: true,
        systemAlerts: true,
        pushEnabled: true,
        emailEnabled: false,
      };
    }
    const data = await res.json();
    const p = data.preferences || {};
    return {
      academicAlerts: p.categories?.Academic ?? true,
      campusEvents: p.categories?.Campus ?? true,
      communityAlerts: p.categories?.Community ?? true,
      marketAlerts: p.categories?.Market ?? true,
      careerAlerts: p.categories?.Career ?? true,
      systemAlerts: p.categories?.System ?? true,
      pushEnabled: p.channels?.push ?? true,
      emailEnabled: p.channels?.email ?? false,
    };
  },

  async updatePreferences(
    prefs: Partial<NotificationPreferences>,
    token?: string | null,
    userId?: string | null
  ): Promise<boolean> {
    const body: any = {
      categories: {},
      channels: {},
    };
    if (prefs.academicAlerts !== undefined) body.categories.Academic = prefs.academicAlerts;
    if (prefs.campusEvents !== undefined) body.categories.Campus = prefs.campusEvents;
    if (prefs.communityAlerts !== undefined) body.categories.Community = prefs.communityAlerts;
    if (prefs.marketAlerts !== undefined) body.categories.Market = prefs.marketAlerts;
    if (prefs.careerAlerts !== undefined) body.categories.Career = prefs.careerAlerts;
    if (prefs.systemAlerts !== undefined) body.categories.System = prefs.systemAlerts;
    if (prefs.pushEnabled !== undefined) body.channels.push = prefs.pushEnabled;
    if (prefs.emailEnabled !== undefined) body.channels.email = prefs.emailEnabled;

    const res = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
      method: 'PUT',
      headers: getHeaders(token, userId),
      body: JSON.stringify(body),
    });
    return res.ok;
  },

  async registerPushToken(
    deviceToken: string,
    platform: string,
    token?: string | null,
    userId?: string | null
  ): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/notifications/push-token`, {
      method: 'POST',
      headers: getHeaders(token, userId),
      body: JSON.stringify({ token: deviceToken, platform }),
    });
    return res.ok;
  },
};
