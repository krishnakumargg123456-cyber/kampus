import React, { useMemo, useState } from 'react';
import {
  Archive,
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Compass,
  FileLock2,
  Gift,
  MessageSquare,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type NotificationFeedItem } from '../../context/NotificationContext';
import {
  CATEGORY_META,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  formatRelativeTimestamp,
  groupNotificationsByDate,
  loadRecentNotificationSearches,
  saveRecentNotificationSearch,
} from '../../data/notificationsData';
import type { NotificationCategory, NotificationPriority, NotificationRecord } from '../../types/notifications';

interface Props {
  onOpenSettings: () => void;
}

type TopFilterTab = 'All' | 'Unread' | 'Important' | 'Mentions' | 'Reminders';

export function getCategoryIcon(category: NotificationCategory, className = 'w-4 h-4') {
  switch (category) {
    case 'Academic':
      return <BookOpen className={className} />;
    case 'Community':
      return <Users className={className} />;
    case 'Chat':
      return <MessageSquare className={className} />;
    case 'Events & Clubs':
      return <Calendar className={className} />;
    case 'Career':
      return <Briefcase className={className} />;
    case 'College Explorer':
      return <Compass className={className} />;
    case 'KAMPUS Market':
      return <ShoppingBag className={className} />;
    case 'Digital Locker':
      return <FileLock2 className={className} />;
    case 'KAMPUS Rewards':
      return <Gift className={className} />;
    default:
      return <Settings className={className} />;
  }
}

export const NotificationFeedAndDetailView: React.FC<Props> = ({ onOpenSettings }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    toggleImportant,
    archiveNotification,
    deleteNotification,
    markAllAsRead,
    bulkAction,
  } = useNotifications();

  const [topTab, setTopTab] = useState<TopFilterTab>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | NotificationCategory>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | NotificationPriority>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadRecentNotificationSearches()
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDestructive, setConfirmDestructive] = useState<'delete' | 'clear-read' | null>(null);

  const inboxNotifications = useMemo(
    () => notifications.filter((n) => !n.deleted && !n.archived),
    [notifications]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inboxNotifications.filter((n) => {
      if (topTab === 'Unread' && n.read) return false;
      if (topTab === 'Important' && !n.important) return false;
      if (topTab === 'Mentions' && !n.isMention) return false;
      if (topTab === 'Reminders' && !n.isReminder) return false;
      if (categoryFilter !== 'All' && n.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && n.priority !== priorityFilter) return false;
      if (q) {
        const hay = `${n.title} ${n.description} ${n.sourceModule} ${n.category} ${n.createdAt} ${
          n.read ? 'read' : 'unread'
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [inboxNotifications, topTab, categoryFilter, priorityFilter, searchQuery]);

  const grouped = useMemo(() => groupNotificationsByDate(filtered), [filtered]);

  const selectedDetail: NotificationFeedItem | null = useMemo(
    () => inboxNotifications.find((n) => n.id === detailId) || null,
    [inboxNotifications, detailId]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setRecentSearches(saveRecentNotificationSearch(searchQuery.trim()));
    }
  };

  const handleOpenItem = (item: NotificationRecord) => {
    if (!item.read) markAsRead(item.id);
    setDetailId(item.id);
  };

  const handleConfirmedBulk = async () => {
    if (!confirmDestructive) return;
    if (confirmDestructive === 'clear-read') {
      await bulkAction('clear-read', [], true);
    } else if (confirmDestructive === 'delete' && selectedIds.length > 0) {
      await bulkAction('delete', selectedIds, true);
      setSelectedIds([]);
    }
    setConfirmDestructive(null);
  };

  return (
    <div className="space-y-5">
      {/* Search & Top Action Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by title, module, category, date, or read status..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All as Read</span>
              </button>
            )}
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Preferences</span>
            </button>
          </div>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !searchQuery && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Recent:</span>
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setSearchQuery(term)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Top Filter Tabs & Priority/Category Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(['All', 'Unread', 'Important', 'Mentions', 'Reminders'] as TopFilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTopTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  topTab === tab
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {tab}
                {tab === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'All' | NotificationCategory)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Modules</option>
              {NOTIFICATION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'All' | NotificationPriority)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Priorities</option>
              {NOTIFICATION_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSelectedIds(
                  selectedIds.length === filtered.length && filtered.length > 0
                    ? []
                    : filtered.map((n) => n.id)
                )
              }
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {selectedIds.length === filtered.length && filtered.length > 0
                ? 'Deselect All'
                : `Select All (${filtered.length})`}
            </button>
            {selectedIds.length > 0 && (
              <>
                <span className="text-slate-500 font-semibold tabular-nums">
                  {selectedIds.length} selected
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await bulkAction('mark-read', selectedIds, true);
                    setSelectedIds([]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                >
                  Mark Read
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await bulkAction('archive', selectedIds, true);
                    setSelectedIds([]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200"
                >
                  Archive
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDestructive('delete')}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold"
                >
                  Delete Selected
                </button>
              </>
            )}
          </div>

          {inboxNotifications.some((n) => n.read) && (
            <button
              type="button"
              onClick={() => setConfirmDestructive('clear-read')}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400"
            >
              Clear Read Notifications
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Bulk Actions */}
      {confirmDestructive && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
              {confirmDestructive === 'clear-read'
                ? 'Clear all read notifications from your active inbox?'
                : `Move ${selectedIds.length} selected notification(s) to retention history?`}
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              Underlying academic tasks, documents, and system records will not be deleted.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmDestructive(null)}
              className="px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 text-xs font-semibold text-amber-900 dark:text-amber-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmedBulk}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              Confirm Remove
            </button>
          </div>
        </div>
      )}

      {/* Feed + Optional Desktop Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`${selectedDetail ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-5`}>
          {grouped.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center">
              <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchQuery ? 'No notifications match your search' : 'Your Notification Center is clear'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? 'Try clearing filters or searching by module name, title, or status.'
                  : 'Real alerts from Planner, Study Hub, Career, Events, Market, Locker, and Rewards appear here automatically as activity occurs.'}
              </p>
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                  {group} · <span className="tabular-nums">{items.length}</span>
                </h3>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {items.map((item) => {
                    const meta = CATEGORY_META[item.category] || CATEGORY_META.System;
                    const isSelected = selectedIds.includes(item.id);
                    const isDetailOpen = detailId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 flex items-start gap-3 transition-colors ${
                          isDetailOpen
                            ? 'bg-blue-50/70 dark:bg-blue-950/30'
                            : !item.read
                            ? 'bg-blue-50/25 dark:bg-blue-950/15'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          aria-label={`Select ${item.title}`}
                          className="mt-2.5 rounded border-slate-300 shrink-0"
                        />

                        <button
                          type="button"
                          onClick={() => handleOpenItem(item)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bgClass} ${meta.colorClass}`}
                        >
                          {getCategoryIcon(item.category)}
                        </button>

                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleOpenItem(item)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`text-sm truncate ${
                                !item.read
                                  ? 'font-bold text-slate-900 dark:text-white'
                                  : 'font-medium text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 shrink-0">
                              {item.priority === 'Urgent' && (
                                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                  Urgent
                                </span>
                              )}
                              {item.priority === 'High' && (
                                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                                  High
                                </span>
                              )}
                              {!item.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-600" aria-label="Unread" />
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                            {item.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                            <span>{item.sourceModule}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTimestamp(item.createdAt)}
                            </span>
                            {item.suppressedByQuietHours && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  Held during Quiet Hours
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Inline Quick Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleImportant(item.id)}
                            title={item.important ? 'Remove from Important' : 'Save as Important'}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              item.important ? 'text-orange-500' : 'text-slate-400'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${item.important ? 'fill-orange-500' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => (item.read ? markAsUnread(item.id) : markAsRead(item.id))}
                            title={item.read ? 'Mark as Unread' : 'Mark as Read'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => archiveNotification(item.id, true)}
                            title="Archive"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNotification(item.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selectedDetail && (
          <aside className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 sticky top-20">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    CATEGORY_META[selectedDetail.category].bgClass
                  } ${CATEGORY_META[selectedDetail.category].colorClass}`}
                >
                  {getCategoryIcon(selectedDetail.category)}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {selectedDetail.sourceModule} · {selectedDetail.priority} Priority
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {selectedDetail.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDetailId(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
                aria-label="Close detail panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedDetail.description}
            </p>

            {selectedDetail.details && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                {selectedDetail.details}
              </div>
            )}

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 tabular-nums">
              <div>Received: {new Date(selectedDetail.createdAt).toLocaleString()}</div>
              <div>Category: {selectedDetail.category}</div>
              <div>Status: {selectedDetail.read ? 'Read' : 'Unread'}</div>
            </div>

            {/* Channel Delivery Log */}
            {selectedDetail.deliveryRecords && selectedDetail.deliveryRecords.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Delivery Status Log
                </h4>
                <div className="space-y-1.5">
                  {selectedDetail.deliveryRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="uppercase text-slate-700 dark:text-slate-200">{rec.channel}</span>
                        <span
                          className={
                            rec.status === 'Delivered'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : rec.status.includes('Held')
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }
                        >
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{rec.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              {selectedDetail.linkRoute && (
                <button
                  onClick={() => navigate(selectedDetail.linkRoute!)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  <span>{selectedDetail.actionLabel || 'Open Related Module'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() =>
                  selectedDetail.read ? markAsUnread(selectedDetail.id) : markAsRead(selectedDetail.id)
                }
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {selectedDetail.read ? 'Mark Unread' : 'Mark Read'}
              </button>
              <button
                onClick={() => archiveNotification(selectedDetail.id, true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Archive
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
