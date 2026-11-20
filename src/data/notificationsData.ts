import type {
  AnnouncementCategory,
  NotificationCategory,
  NotificationPriority,
  NotificationRecord,
} from '../types/notifications';

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'Academic',
  'Community',
  'Chat',
  'Events & Clubs',
  'Career',
  'College Explorer',
  'KAMPUS Market',
  'Digital Locker',
  'KAMPUS Rewards',
  'System',
];

export const NOTIFICATION_PRIORITIES: NotificationPriority[] = ['Urgent', 'High', 'Normal', 'Low'];

export const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  'KAMPUS',
  'College',
  'Club',
  'Academic',
  'System',
];

export const CATEGORY_META: Record<
  NotificationCategory,
  { colorClass: string; bgClass: string; borderClass: string; defaultRoute: string }
> = {
  Academic: {
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200 dark:border-blue-800',
    defaultRoute: '/tools/planner',
  },
  Community: {
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
    defaultRoute: '/connect/community',
  },
  Chat: {
    colorClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200 dark:border-sky-800',
    defaultRoute: '/connect/chat',
  },
  'Events & Clubs': {
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    defaultRoute: '/campus/events-clubs',
  },
  Career: {
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200 dark:border-amber-800',
    defaultRoute: '/career',
  },
  'College Explorer': {
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/40',
    borderClass: 'border-violet-200 dark:border-violet-800',
    defaultRoute: '/campus/college-explorer',
  },
  'KAMPUS Market': {
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-200 dark:border-orange-800',
    defaultRoute: '/market',
  },
  'Digital Locker': {
    colorClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-950/40',
    borderClass: 'border-teal-200 dark:border-teal-800',
    defaultRoute: '/tools/digital-locker',
  },
  'KAMPUS Rewards': {
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200 dark:border-rose-800',
    defaultRoute: '/tools/rewards',
  },
  System: {
    colorClass: 'text-slate-700 dark:text-slate-300',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    borderClass: 'border-slate-200 dark:border-slate-700',
    defaultRoute: '/account/settings',
  },
};

export type TimeGroupLabel = 'Today' | 'Yesterday' | 'Earlier This Week' | 'Older';

export function getTimeGroupLabel(isoDate: string): TimeGroupLabel {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return 'Today';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400_000;
  const startOfWeek = startOfToday - 6 * 86400_000;
  const target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();

  if (target >= startOfToday) return 'Today';
  if (target >= startOfYesterday) return 'Yesterday';
  if (target >= startOfWeek) return 'Earlier This Week';
  return 'Older';
}

export function formatRelativeTimestamp(isoDate: string): string {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return isoDate;
  const diffMs = Date.now() - dt.getTime();
  if (diffMs < 60_000) return 'Just now';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function groupNotificationsByDate(
  items: NotificationRecord[]
): Array<{ group: TimeGroupLabel; items: NotificationRecord[] }> {
  const order: TimeGroupLabel[] = ['Today', 'Yesterday', 'Earlier This Week', 'Older'];
  const map: Record<TimeGroupLabel, NotificationRecord[]> = {
    Today: [],
    Yesterday: [],
    'Earlier This Week': [],
    Older: [],
  };
  for (const item of items) {
    map[getTimeGroupLabel(item.createdAt)].push(item);
  }
  return order.filter((g) => map[g].length > 0).map((g) => ({ group: g, items: map[g] }));
}

export const RECENT_SEARCHES_KEY = 'kampus_notification_recent_searches_v1';

export function loadRecentNotificationSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function saveRecentNotificationSearch(term: string): string[] {
  const clean = term.trim();
  if (!clean) return loadRecentNotificationSearches();
  const current = loadRecentNotificationSearches().filter((t) => t.toLowerCase() !== clean.toLowerCase());
  const next = [clean, ...current].slice(0, 6);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
