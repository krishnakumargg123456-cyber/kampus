import React, { useMemo, useRef, useState } from 'react';
import {
  Bell,
  Compass,
  HelpCircle,
  History,
  MessageSquarePlus,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { CommunityWorkspaceTab } from '../../types/community';

interface CommunityHeaderProps {
  activeWorkspaceTab: CommunityWorkspaceTab;
  onSelectWorkspaceTab: (tab: CommunityWorkspaceTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenComposer: (mode: 'discussion' | 'question') => void;
  onOpenNotifications?: () => void;
  onSelectPost: (postId: string) => void;
  onSelectCommunity: (communityId: string) => void;
  onSelectStudent: (studentId: string) => void;
}

const WORKSPACE_TABS: Array<{ id: CommunityWorkspaceTab; labelEn: string; labelHi: string }> = [
  { id: 'feed', labelEn: 'Community Feed', labelHi: 'à¤•à¤®à¥à¤¯à¥à¤¨à¤¿à¤Ÿà¥€ à¤«à¤¼à¥€à¤¡' },
  { id: 'qa', labelEn: 'Q&A Hub', labelHi: 'à¤ªà¥à¤°à¤¶à¥à¤¨ à¤”à¤° à¤‰à¤¤à¥à¤¤à¤°' },
  { id: 'communities', labelEn: 'Communities', labelHi: 'à¤¸à¤®à¥à¤¦à¤¾à¤¯' },
  { id: 'polls-resources', labelEn: 'Polls & Resources', labelHi: 'à¤ªà¥‹à¤² à¤µ à¤¸à¤‚à¤¸à¤¾à¤§à¤¨' },
  { id: 'contributors', labelEn: 'Contributors', labelHi: 'à¤¯à¥‹à¤—à¤¦à¤¾à¤¨à¤•à¤°à¥à¤¤à¤¾' },
  { id: 'activity', labelEn: 'My Activity', labelHi: 'à¤®à¥‡à¤°à¥€ à¤—à¤¤à¤¿à¤µà¤¿à¤§à¤¿' },
];

export const CommunityHeader: React.FC<CommunityHeaderProps> = ({
  activeWorkspaceTab,
  onSelectWorkspaceTab,
  searchQuery,
  onSearchChange,
  onOpenComposer,
  onOpenNotifications,
  onSelectPost,
  onSelectCommunity,
  onSelectStudent,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    state,
    language,
    setLanguage,
    visiblePosts,
    trendingTags,
    addRecentSearch,
    clearRecentSearches,
  } = useCommunity();

  const [searchFocused, setSearchFocused] = useState(false);
  const blurTimer = useRef<number | null>(null);

  const quickResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    const matchedPosts = visiblePosts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          (p.subject && p.subject.toLowerCase().includes(q))
      )
      .slice(0, 4);
    const matchedCommunities = state.communities
      .filter((c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      .slice(0, 3);
    const matchedStudents = state.publicStudents
      .filter((s) => s.name.toLowerCase().includes(q) || s.course.toLowerCase().includes(q))
      .slice(0, 3);
    return { matchedPosts, matchedCommunities, matchedStudents };
  }, [searchQuery, visiblePosts, state.communities, state.publicStudents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
    }
    setSearchFocused(false);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        {/* Top Row: Title + Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {language === 'hi' ? 'à¤›à¤¾à¤¤à¥à¤° à¤¸à¤®à¥à¤¦à¤¾à¤¯' : 'Student Community'}
                </h1>
              </div>
            </div>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              {language === 'hi'
                ? 'à¤›à¤¾à¤¤à¥à¤°à¥‹à¤‚ à¤¸à¥‡ à¤œà¥à¤¡à¤¼à¥‡à¤‚à¥¤ à¤œà¥à¤žà¤¾à¤¨ à¤¸à¤¾à¤à¤¾ à¤•à¤°à¥‡à¤‚à¥¤ à¤¸à¤¾à¤¥ à¤®à¤¿à¤²à¤•à¤° à¤†à¤—à¥‡ à¤¬à¤¢à¤¼à¥‡à¤‚à¥¤'
                : 'Connect with students. Share knowledge. Grow together.'}
              <span className="mx-2 text-slate-300 dark:text-slate-700">Â·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Demo Community Â· Local Persistence
              </span>
            </p>
          </div>

          {/* Primary Actions + Utilities */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenComposer('discussion')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4" />
              {language === 'hi' ? 'à¤ªà¥‹à¤¸à¥à¤Ÿ à¤²à¤¿à¤–à¥‡à¤‚' : 'Create Post'}
            </button>

            <button
              type="button"
              onClick={() => onOpenComposer('question')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              {language === 'hi' ? 'à¤ªà¥à¤°à¤¶à¥à¤¨ à¤ªà¥‚à¤›à¥‡à¤‚' : 'Ask a Question'}
            </button>

            <button
              type="button"
              onClick={() => onSelectWorkspaceTab('communities')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {language === 'hi' ? 'à¤¸à¤®à¥à¤¦à¤¾à¤¯ à¤–à¥‹à¤œà¥‡à¤‚' : 'Explore Communities'}
            </button>

            <div className="flex items-center gap-1.5 ml-auto lg:ml-1">
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
                title="Switch interface language"
              >
                {language === 'en' ? 'EN Â· à¤¹à¤¿à¤‚' : 'à¤¹à¤¿à¤‚ Â· EN'}
              </button>

              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                  aria-label="Open notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                title="Open your student profile"
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-6 h-6 rounded-lg object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{(profile?.name || 'Student').trim().split(/\s+/)[0]}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => {
                if (blurTimer.current) window.clearTimeout(blurTimer.current);
                setSearchFocused(true);
              }}
              onBlur={() => {
                blurTimer.current = window.setTimeout(() => setSearchFocused(false), 180);
              }}
              placeholder={
                language === 'hi'
                  ? 'à¤šà¤°à¥à¤šà¤¾à¤à¤, à¤ªà¥à¤°à¤¶à¥à¤¨, à¤µà¤¿à¤·à¤¯ à¤”à¤° à¤¸à¤®à¥à¤¦à¤¾à¤¯ à¤–à¥‹à¤œà¥‡à¤‚...'
                  : 'Search discussions, questions and communities...'
              }
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Search Dropdown: Recent & Trending OR Quick Results */}
          {searchFocused && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-3.5 space-y-3">
              {!searchQuery.trim() ? (
                <>
                  {state.recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                        <span className="inline-flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5" /> Recent searches
                        </span>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {state.recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onSearchChange(term);
                              setSearchFocused(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Trending topics
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {trendingTags.slice(0, 6).map((item) => (
                        <button
                          key={item.tag}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onSearchChange(item.tag);
                            addRecentSearch(item.tag);
                            setSearchFocused(false);
                          }}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          {item.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : quickResults ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {quickResults.matchedCommunities.length === 0 &&
                    quickResults.matchedPosts.length === 0 &&
                    quickResults.matchedStudents.length === 0 && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                        No exact quick matches for â€œ{searchQuery}â€. Keep typing or press Enter to filter the feed.
                      </p>
                    )}

                  {quickResults.matchedCommunities.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Communities
                      </p>
                      <div className="space-y-1">
                        {quickResults.matchedCommunities.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onSelectCommunity(c.id);
                              setSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-sm cursor-pointer"
                          >
                            <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{c.category}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {quickResults.matchedPosts.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Discussions & Questions
                      </p>
                      <div className="space-y-1">
                        {quickResults.matchedPosts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              addRecentSearch(searchQuery);
                              onSelectPost(p.id);
                              setSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                              {p.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {p.type} Â· {p.authorName}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {quickResults.matchedStudents.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Contributors
                      </p>
                      <div className="space-y-1">
                        {quickResults.matchedStudents.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              onSelectStudent(s.id);
                              setSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer"
                          >
                            <img src={s.avatarUrl} alt={s.name} className="w-6 h-6 rounded-full object-cover" />
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{s.course}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Workspace Navigation Tabs */}
        <nav className="mt-4 -mb-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {WORKSPACE_TABS.map((tab) => {
            const active = activeWorkspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectWorkspaceTab(tab.id)}
                className={`px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {language === 'hi' ? tab.labelHi : tab.labelEn}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

