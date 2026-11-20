import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  ChevronRight,
  Clock,
  Sliders,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type NotificationFeedItem } from '../../context/NotificationContext';
import { CATEGORY_META } from '../../data/notificationsData';
import { getCategoryIcon } from '../notifications/NotificationFeedAndDetailView';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    connectionStatus,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const navigate = useNavigate();

  const visibleItems = useMemo(() => {
    return notifications
      .filter((n) => !n.deleted && !n.archived)
      .filter((n) => {
        if (filter === 'unread') return !n.read;
        if (filter === 'important') return n.important;
        return true;
      })
      .slice(0, 20);
  }, [notifications, filter]);

  if (!isOpen) return null;

  const handleNotificationClick = (item: NotificationFeedItem) => {
    markAsRead(item.id);
    onClose();
    navigate(item.linkRoute || '/account/notifications');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs transition-opacity"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Notifications
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · {connectionStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold px-2 py-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Read all</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                navigate('/account/notifications?tab=preferences');
              }}
              aria-label="Notification preferences"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs">
          {(['all', 'unread', 'important'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors ${
                filter === tab
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notification Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {visibleItems.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No matching notifications</p>
              <p>Real alerts from across KAMPUS modules appear here as they occur.</p>
            </div>
          ) : (
            visibleItems.map((item) => {
              const meta = CATEGORY_META[item.category] || CATEGORY_META.System;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    !item.read ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.bgClass} ${meta.colorClass}`}
                  >
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs sm:text-sm truncate ${
                          !item.read
                            ? 'text-slate-900 dark:text-slate-100 font-bold'
                            : 'text-slate-700 dark:text-slate-300 font-medium'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 tabular-nums">
                      <span>{item.sourceModule}</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>{item.time}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 self-center" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer: View All in Notification Center */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={() => {
              onClose();
              navigate('/account/notifications');
            }}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
          >
            View All in Notification Center
          </button>
        </div>
      </div>
    </div>
  );
};
