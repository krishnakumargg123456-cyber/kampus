import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  Compass,
  ExternalLink,
  FileText,
  FolderKanban,
  Gift,
  Globe,
  HardDrive,
  HeadphonesIcon,
  Image,
  LayoutDashboard,
  LayoutTemplate,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareWarning,
  Navigation,
  PanelLeft,
  PanelLeftClose,
  Plug,
  Plus,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Users,
  X,
} from 'lucide-react';
import type { AdminSectionId } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';

export interface AdminNavItem {
  id: AdminSectionId;
  label: string;
  group: 'Core' | 'Website & CMS' | 'Platform Modules' | 'Growth & Media' | 'Operations & Security';
  icon: React.ComponentType<{ className?: string }>;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: 'overview', label: 'Overview', group: 'Core', icon: LayoutDashboard },
  { id: 'website', label: 'Website Control', group: 'Website & CMS', icon: Globe },
  { id: 'homepage', label: 'Homepage Builder', group: 'Website & CMS', icon: LayoutTemplate },
  { id: 'pages', label: 'Page Management', group: 'Website & CMS', icon: FileText },
  { id: 'navigation', label: 'Navigation Manager', group: 'Website & CMS', icon: Navigation },
  { id: 'features', label: 'Feature Management', group: 'Website & CMS', icon: Sliders },
  { id: 'users', label: 'User Management', group: 'Platform Modules', icon: Users },
  { id: 'content', label: 'Content Management', group: 'Platform Modules', icon: FolderKanban },
  { id: 'academic', label: 'Academic Management', group: 'Platform Modules', icon: BookOpen },
  { id: 'community', label: 'Community Management', group: 'Platform Modules', icon: MessageSquareWarning },
  { id: 'colleges', label: 'College Management', group: 'Platform Modules', icon: Building2 },
  { id: 'events', label: 'Events & Clubs', group: 'Platform Modules', icon: Calendar },
  { id: 'marketplace', label: 'Marketplace', group: 'Platform Modules', icon: ShoppingBag },
  { id: 'rewards', label: 'Rewards Management', group: 'Platform Modules', icon: Gift },
  { id: 'notifications', label: 'Notification Center', group: 'Growth & Media', icon: Bell },
  { id: 'ads', label: 'Advertisement Management', group: 'Growth & Media', icon: Megaphone },
  { id: 'media', label: 'Media Library', group: 'Growth & Media', icon: Image },
  { id: 'analytics', label: 'Analytics & Reports', group: 'Growth & Media', icon: BarChart3 },
  { id: 'support', label: 'Support Center', group: 'Operations & Security', icon: HeadphonesIcon },
  { id: 'team', label: 'Admin Team & Permissions', group: 'Operations & Security', icon: ShieldCheck },
  { id: 'security', label: 'Security Center', group: 'Operations & Security', icon: Lock },
  { id: 'health', label: 'System Health', group: 'Operations & Security', icon: Activity },
  { id: 'integrations', label: 'Integrations', group: 'Operations & Security', icon: Plug },
  { id: 'settings', label: 'Global Settings', group: 'Operations & Security', icon: Settings },
  { id: 'audit', label: 'Audit Logs', group: 'Operations & Security', icon: ScrollText },
];

interface AdminLayoutProps {
  activeSection: AdminSectionId;
  onSelectSection: (section: AdminSectionId) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeSection,
  onSelectSection,
  children,
}) => {
  const { admin, roleName, logout, adminFetch } = useAdminAuth();
  const { config } = usePlatformConfig();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ kind: string; id: string; title: string; subtitle: string; section: AdminSectionId }>
  >([]);
  const [healthStatus, setHealthStatus] = useState<string>('Healthy');
  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; meta: string; section: AdminSectionId }>>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    adminFetch('/api/admin/overview')
      .then((res) => {
        if (res?.systemHealth?.appStatus) setHealthStatus(res.systemHealth.appStatus);
        const list: Array<{ id: string; title: string; meta: string; section: AdminSectionId }> = [];
        if (res?.metrics?.pendingSupportTickets > 0) {
          list.push({
            id: 'al-tickets',
            title: `${res.metrics.pendingSupportTickets} active support / moderation item(s)`,
            meta: 'Requires triage',
            section: 'support',
          });
        }
        if (res?.metrics?.pendingReports > 0) {
          list.push({
            id: 'al-reports',
            title: `${res.metrics.pendingReports} flagged safety/content report(s)`,
            meta: 'Community & Market',
            section: 'community',
          });
        }
        if (res?.integrationsSummary?.notConfigured > 0) {
          list.push({
            id: 'al-int',
            title: `${res.integrationsSummary.notConfigured} optional external integration(s) not configured`,
            meta: 'Integrations monitor',
            section: 'integrations',
          });
        }
        setAlerts(list);
      })
      .catch(() => {
        // silent fallback
      });
  }, [adminFetch, activeSection]);

  useEffect(() => {
    if (!searchOpen) return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      adminFetch<{ results: typeof searchResults }>(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`)
        .then((d) => setSearchResults(d.results || []))
        .catch(() => setSearchResults([]));
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen, adminFetch]);

  const currentNav = ADMIN_NAV_ITEMS.find((i) => i.id === activeSection) || ADMIN_NAV_ITEMS[0];
  const groups: Array<AdminNavItem['group']> = [
    'Core',
    'Website & CMS',
    'Platform Modules',
    'Growth & Media',
    'Operations & Security',
  ];

  const renderSidebarNav = () => (
    <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
      {groups.map((grp) => {
        const items = ADMIN_NAV_ITEMS.filter((i) => i.group === grp);
        return (
          <div key={grp} className="space-y-0.5">
            {!collapsed && (
              <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {grp}
              </div>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectSection(item.id);
                    setMobileOpen(false);
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#172554] text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-[#172033] dark:text-slate-100 flex">
      {/* Desktop Left Sidebar */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 transition-all duration-150 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="h-14 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#172554] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  {config?.website?.siteName || 'KAMPUS'} ADMIN
                </div>
                <div className="text-[10px] text-slate-500">Super Admin Center</div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={`p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 ${
              collapsed ? 'mx-auto' : ''
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {renderSidebarNav()}

        <div className="p-2.5 border-t border-slate-200 dark:border-slate-800">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            title="Open Student Application"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Open Live Student App</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col">
            <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-extrabold">KAMPUS Admin</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            {renderSidebarNav()}
          </div>
          <div className="flex-1 bg-slate-950/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
              <span className="hidden sm:inline font-semibold text-slate-400">Super Admin</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentNav.label}
              </span>
            </div>
            {config?.website?.maintenanceMode && (
              <button
                type="button"
                onClick={() => onSelectSection('website')}
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-[11px] font-semibold text-amber-700 dark:text-amber-300"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Maintenance Mode Active
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Global Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 hover:border-blue-500"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search platform...</span>
              <kbd className="hidden md:inline font-mono text-[10px] px-1 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Quick Create Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setQuickCreateOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Create</span>
              </button>
              {quickCreateOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50">
                  {[
                    { label: 'New CMS Page', sec: 'pages' as AdminSectionId },
                    { label: 'Official Broadcast', sec: 'notifications' as AdminSectionId },
                    { label: 'Campus Event', sec: 'events' as AdminSectionId },
                    { label: 'Ad Campaign', sec: 'ads' as AdminSectionId },
                    { label: 'Create System Backup', sec: 'health' as AdminSectionId },
                  ].map((act) => (
                    <button
                      key={act.label}
                      type="button"
                      onClick={() => {
                        onSelectSection(act.sec);
                        setQuickCreateOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Health Indicator */}
            <button
              type="button"
              onClick={() => onSelectSection('health')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              title="System Health Status"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px]">{healthStatus}</span>
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setQuickCreateOpen(false);
                }}
                className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Admin Alerts"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {alerts.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-3 z-50 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Operations Alerts
                  </div>
                  {alerts.length === 0 ? (
                    <div className="text-xs text-slate-500 py-2">No active alerts.</div>
                  ) : (
                    alerts.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          onSelectSection(a.section);
                          setNotifOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-slate-500">{a.meta}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Admin Profile & Logout */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {admin?.name}
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold leading-tight">
                  {roleName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Sign out of Admin Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Scroll Canvas */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students, features, CMS pages, content, media, or tickets..."
                className="flex-1 bg-transparent text-sm focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {!searchQuery.trim() ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Type a keyword to search across all KAMPUS Super Admin modules.
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No matching records found for &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                searchResults.map((item) => (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => {
                      onSelectSection(item.section);
                      setSearchOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {item.kind}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { HardDrive };
