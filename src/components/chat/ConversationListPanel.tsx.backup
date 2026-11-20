import React, { useMemo, useState } from 'react';
import {
  Archive,
  Bell,
  BellOff,
  Inbox,
  MailCheck,
  MessageSquarePlus,
  MoreVertical,
  Pin,
  Search,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { formatMessageTime } from '../../data/chatData';
import { ChatConversation, ChatFilterTab } from '../../types/chat';

const FILTER_TABS: ChatFilterTab[] = ['All', 'Unread', 'Personal', 'Groups', 'Archived'];

interface ConversationListPanelProps {
  onSelectConversation: (convId: string, jumpMessageId?: string) => void;
  onOpenNewMessage: () => void;
  onOpenCreateGroup: () => void;
  onOpenRequests: () => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void;
  onRequestDeleteConv: (conv: ChatConversation) => void;
}

export const ConversationListPanel: React.FC<ConversationListPanelProps> = ({
  onSelectConversation,
  onOpenNewMessage,
  onOpenCreateGroup,
  onOpenRequests,
  onOpenSettings,
  onOpenNotifications,
  onRequestDeleteConv,
}) => {
  const {
    currentUserId,
    wsStatus,
    conversations,
    messagesByConv,
    requests,
    activeConversationId,
    typingByConv,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    getConversationDisplay,
    getUnreadCount,
    updateConversationAction,
  } = useChat();

  const [filterTab, setFilterTab] = useState<ChatFilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuConvId, setMenuConvId] = useState<string | null>(null);

  const pendingRequestsCount = requests.filter(
    (r) => r.toUserId === currentUserId && r.status === 'pending'
  ).length;

  // Global Search across authorized conversations, messages, documents, and links
  const globalMessageMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{
      msgId: string;
      convId: string;
      convTitle: string;
      senderName: string;
      snippet: string;
      createdAt: string;
    }> = [];
    conversations.forEach((conv) => {
      const display = getConversationDisplay(conv);
      (messagesByConv[conv.id] || []).forEach((m) => {
        if (m.deletedForAll) return;
        const hay = `${m.text} ${m.attachment?.fileName || ''} ${m.linkTitle || ''} ${m.linkUrl || ''} ${m.studyResource?.title || ''}`.toLowerCase();
        if (hay.includes(q)) {
          results.push({
            msgId: m.id,
            convId: conv.id,
            convTitle: display.title,
            senderName: m.senderName,
            snippet: m.attachment?.fileName || m.text,
            createdAt: m.createdAt,
          });
        }
      });
    });
    return results.slice(0, 10);
  }, [searchQuery, conversations, messagesByConv, getConversationDisplay]);

  const filteredConvs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations
      .filter((conv) => {
        const prefs = conv.userPrefs[currentUserId];
        const archived = Boolean(prefs?.archived);
        const unread = getUnreadCount(conv) > 0;

        if (filterTab === 'Archived') return archived;
        if (archived) return false;
        if (filterTab === 'Unread') return unread;
        if (filterTab === 'Personal') return conv.type === 'direct';
        if (filterTab === 'Groups') return conv.type === 'group';
        return true;
      })
      .filter((conv) => {
        if (!q) return true;
        const display = getConversationDisplay(conv);
        const msgs = messagesByConv[conv.id] || [];
        return (
          display.title.toLowerCase().includes(q) ||
          conv.lastMessagePreview.toLowerCase().includes(q) ||
          msgs.some(
            (m) =>
              m.text.toLowerCase().includes(q) ||
              (m.attachment?.fileName || '').toLowerCase().includes(q)
          )
        );
      })
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [conversations, currentUserId, filterTab, searchQuery, getUnreadCount, getConversationDisplay, messagesByConv]);

  const pinnedConvs = filteredConvs.filter((c) => c.userPrefs[currentUserId]?.pinned);
  const regularConvs = filteredConvs.filter((c) => !c.userPrefs[currentUserId]?.pinned);

  const renderConversationRow = (conv: ChatConversation) => {
    const display = getConversationDisplay(conv);
    const prefs = conv.userPrefs[currentUserId];
    const unread = getUnreadCount(conv);
    const isActive = conv.id === activeConversationId;
    const typingList = typingByConv[conv.id] || [];

    return (
      <div
        key={conv.id}
        className={`group relative flex items-center gap-3 px-3.5 py-2.5 transition-colors cursor-pointer ${
          isActive
            ? 'bg-blue-50/80 dark:bg-blue-950/40'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
        onClick={() => onSelectConversation(conv.id)}
      >
        <div className="relative shrink-0">
          <img
            src={display.avatarUrl}
            alt={display.title}
            className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          {display.isOnline && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
              title="Online"
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {display.title}
            </h4>
            <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
              {formatMessageTime(conv.lastMessageAt)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {typingList.length > 0 ? (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {typingList[0].userName.split(' ')[0]} is typing...
                </span>
              ) : (
                conv.lastMessagePreview
              )}
            </p>

            <div className="flex items-center gap-1 shrink-0">
              {prefs?.muted && <BellOff className="w-3 h-3 text-slate-400" />}
              {prefs?.pinned && <Pin className="w-3 h-3 text-orange-500" />}
              {unread > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unread}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Context Menu Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuConvId((prev) => (prev === conv.id ? null : conv.id));
          }}
          className="p-1 rounded-lg text-slate-400 opacity-70 sm:opacity-0 group-hover:opacity-100 hover:bg-slate-200/70 dark:hover:bg-slate-700 cursor-pointer"
          aria-label="Conversation options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuConvId === conv.id && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setMenuConvId(null)}
            className="absolute right-3 top-11 z-30 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1 text-xs"
          >
            <button
              type="button"
              onClick={() => {
                setMenuConvId(null);
                updateConversationAction(conv.id, { action: 'pin', value: !prefs?.pinned });
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Pin className="w-3.5 h-3.5" /> {prefs?.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuConvId(null);
                updateConversationAction(conv.id, { action: 'mute', value: !prefs?.muted });
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <BellOff className="w-3.5 h-3.5" /> {prefs?.muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuConvId(null);
                updateConversationAction(conv.id, { action: 'archive', value: !prefs?.archived });
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" /> {prefs?.archived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuConvId(null);
                updateConversationAction(conv.id, {
                  action: 'markUnread',
                  value: !(unread > 0),
                });
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <MailCheck className="w-3.5 h-3.5" /> {unread > 0 ? 'Mark read' : 'Mark unread'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuConvId(null);
                onRequestDeleteConv(conv);
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete conversation
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Chat Home Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Chat
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stay connected with your campus.
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenNewMessage}
              title="New Message"
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenCreateGroup}
              title="Create Group"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenRequests}
              title="Message Requests"
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Inbox className="w-4 h-4" />
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                title="Notification Center"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Chat Settings"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live WebSocket Status Strip */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span
            className={
              wsStatus === 'connected'
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : wsStatus === 'reconnecting' || wsStatus === 'connecting'
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-slate-500'
            }
          >
            {wsStatus === 'connected'
              ? 'Connected · Real-time'
              : wsStatus === 'reconnecting'
                ? 'Reconnecting to server...'
                : wsStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Offline — queued changes will retry'}
          </span>
          <span className="text-slate-400">KAMPUS Chat</span>
        </div>

        {/* Global Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 180)}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) addRecentSearch(searchQuery);
            }}
            placeholder="Search chats, messages, files, links..."
            className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Recent Searches Bar when focused & empty */}
        {searchFocused && !searchQuery.trim() && recentSearches.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Recent searches</span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearRecentSearches();
                }}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery(term);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compact Conversation Filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                filterTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List & Message Search Matches */}
      <div className="flex-1 overflow-y-auto">
        {pinnedConvs.length > 0 && (
          <div>
            <p className="px-3.5 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pinned
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {pinnedConvs.map(renderConversationRow)}
            </div>
          </div>
        )}

        <div>
          {pinnedConvs.length > 0 && regularConvs.length > 0 && (
            <p className="px-3.5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Conversations
            </p>
          )}
          {regularConvs.length === 0 && pinnedConvs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No conversations in “{filterTab}”.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {regularConvs.map(renderConversationRow)}
            </div>
          )}
        </div>

        {/* Global Message Matches */}
        {searchQuery.trim() && globalMessageMatches.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 mt-2">
            <p className="px-3.5 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Matching Messages &amp; Files ({globalMessageMatches.length})
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {globalMessageMatches.map((hit) => (
                <button
                  key={hit.msgId}
                  type="button"
                  onClick={() => {
                    addRecentSearch(searchQuery);
                    onSelectConversation(hit.convId, hit.msgId);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                      {hit.convTitle}
                    </span>
                    <span>{formatMessageTime(hit.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 truncate mt-0.5">
                    {hit.senderName}: {hit.snippet}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
