import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Sparkles,
  Share2,
  UserCheck,
  Users,
  MessageSquare,
  Radio,
  Repeat,
  Activity,
  Calendar,
  CreditCard,
  Megaphone,
  Compass,
  Briefcase,
  ShoppingBag,
  ShieldCheck,
  Gift,
  Clock,
  Bell,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Flame,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccountProfileSettings } from '../../context/AccountProfileSettingsContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { resolveAssetUrl } from '../../utils/assetResolver';

interface SidebarProps {
  onOpenAi: () => void;
}

type SectionKey = 'learn' | 'connect' | 'campus' | 'tools' | 'account';

interface NavSection {
  key: SectionKey;
  title: string;
  icon: any;
  defaultOpen?: boolean;
  basePath: string;
  items: {
    label: string;
    path: string;
    icon: any;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenAi }) => {
  const { profile, logout } = useAuth();
  const { settings } = useAccountProfileSettings();
  const { config, getFeatureConfig } = usePlatformConfig();
  const isNavPathVisible = (route: string) => {
    const f = getFeatureConfig(route);
    if (!f) return true;
    return f.enabled && f.visible;
  };
  const getFeatureLabel = (route: string, fallback: string) => getFeatureConfig(route)?.name || fallback;
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(
    settings?.appearance?.sidebarBehavior === 'collapsed'
  );

  React.useEffect(() => {
    if (settings?.appearance?.sidebarBehavior === 'collapsed') {
      setIsCollapsed(true);
    } else if (settings?.appearance?.sidebarBehavior === 'expanded') {
      setIsCollapsed(false);
    }
  }, [settings?.appearance?.sidebarBehavior]);

  // Track open state for expandable categories
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    learn: true,
    connect: false,
    campus: false,
    tools: false,
    account: false,
  });

  React.useEffect(() => {
    const matched = (
      [
        { key: 'learn', prefix: '/learn' },
        { key: 'connect', prefix: '/connect' },
        { key: 'campus', prefix: '/campus' },
        { key: 'tools', prefix: '/tools' },
        { key: 'account', prefix: '/account' },
      ] as const
    ).find((entry) => location.pathname.startsWith(entry.prefix));

    if (matched) {
      setOpenSections((prev) => (prev[matched.key] ? prev : { ...prev, [matched.key]: true }));
    }
  }, [location.pathname]);

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections: NavSection[] = [
    {
      key: 'learn',
      title: 'LEARN',
      icon: BookOpen,
      basePath: '/learn',
      items: [
        { label: 'Study Hub', path: '/learn/study-hub', icon: BookOpen },
        { label: 'KAMPUS AI', path: '/learn/kampus-ai', icon: Sparkles, badge: 'AI' },
        { label: 'Notes Exchange', path: '/learn/notes-exchange', icon: Share2 },
      ],
    },
    {
      key: 'connect',
      title: 'CONNECT',
      icon: Users,
      basePath: '/connect',
      items: [
        { label: 'Study Partner', path: '/connect/study-partner', icon: UserCheck },
        { label: 'Student Community', path: '/connect/community', icon: Users },
        { label: 'Chat', path: '/connect/chat', icon: MessageSquare },
        { label: 'Study Rooms', path: '/connect/study-rooms', icon: Radio, badge: 'Live' },
        { label: 'SkillSwap', path: '/connect/skillswap', icon: Repeat },
      ],
    },
    {
      key: 'campus',
      title: 'CAMPUS',
      icon: Compass,
      basePath: '/campus',
      items: [
        { label: 'Campus Pulse', path: '/campus/campus-pulse', icon: Activity },
        { label: 'Events & Clubs', path: '/campus/events-clubs', icon: Calendar },
        { label: 'KAMPUS ID', path: '/campus/kampus-id', icon: CreditCard, badge: 'NFC' },
        { label: 'Student Voice', path: '/campus/student-voice', icon: Megaphone },
        { label: 'College Explorer', path: '/campus/college-explorer', icon: Compass },
      ],
    },
    {
      key: 'tools',
      title: 'STUDENT TOOLS',
      icon: ShieldCheck,
      basePath: '/tools',
      items: [
        { label: 'Digital Locker', path: '/tools/digital-locker', icon: ShieldCheck },
        { label: 'KAMPUS Rewards', path: '/tools/rewards', icon: Gift },
        { label: 'KAMPUS Planner', path: '/tools/planner', icon: Clock },
      ],
    },
    {
      key: 'account',
      title: 'ACCOUNT',
      icon: User,
      basePath: '/account',
      items: [
        { label: 'Notification Center', path: '/account/notifications', icon: Bell },
        { label: 'Student Profile', path: '/account/profile', icon: User },
        { label: 'Settings', path: '/account/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-[calc(100vh-4rem)] sticky top-16 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-200 select-none shrink-0 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Bar */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation Menu (21 Modules)
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {/* 1. Home Link */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`
          }
          title={isCollapsed ? 'Home' : undefined}
        >
          <Home className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Home Dashboard</span>}
        </NavLink>

        {/* Sections */}
        {sections.slice(0, 3).map((sec) => {
          const isExpanded = openSections[sec.key] ?? true;
          const isSectionActive = location.pathname.startsWith(sec.basePath);
          const SecIcon = sec.icon;

          const visibleItems = sec.items.filter((sub) => isNavPathVisible(sub.path));
          if (visibleItems.length === 0) return null;

          if (isCollapsed) {
            return (
              <div key={sec.key} className="pt-2">
                <NavLink
                  to={visibleItems[0].path}
                  className={`flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    isSectionActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600' : ''
                  }`}
                  title={sec.title}
                >
                  <SecIcon className="w-4 h-4" />
                </NavLink>
              </div>
            );
          }

          return (
            <div key={sec.key} className="pt-1.5">
              <button
                type="button"
                onClick={() => toggleSection(sec.key)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 uppercase tracking-wider rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <SecIcon className="w-3.5 h-3.5" />
                  <span>{sec.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-0.5 space-y-0.5 pl-4">
                  {visibleItems.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{getFeatureLabel(sub.path, sub.label)}</span>
                        </div>
                        {sub.badge && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {sub.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 4. Standalone Career Link */}
        {isNavPathVisible('/career') && (
          <NavLink
            to="/career"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`
            }
            title={isCollapsed ? 'Career' : undefined}
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{getFeatureLabel('/career', 'Career')}</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                Hiring
              </span>
            )}
          </NavLink>
        )}

        {/* 5. Standalone Market Link */}
        {isNavPathVisible('/market') && (
          <NavLink
            to="/market"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`
            }
            title={isCollapsed ? 'KAMPUS Market' : undefined}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{getFeatureLabel('/market', 'KAMPUS Market')}</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] text-slate-400">Campus</span>
            )}
          </NavLink>
        )}

        {/* Remaining Sections: Tools & Account */}
        {sections.slice(3).map((sec) => {
          const isExpanded = openSections[sec.key] ?? false;
          const isSectionActive = location.pathname.startsWith(sec.basePath);
          const SecIcon = sec.icon;

          if (isCollapsed) {
            return (
              <div key={sec.key} className="pt-2">
                <NavLink
                  to={sec.items[0].path}
                  className={`flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    isSectionActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600' : ''
                  }`}
                  title={sec.title}
                >
                  <SecIcon className="w-4 h-4" />
                </NavLink>
              </div>
            );
          }

          return (
            <div key={sec.key} className="pt-1.5">
              <button
                type="button"
                onClick={() => toggleSection(sec.key)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 uppercase tracking-wider rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <SecIcon className="w-3.5 h-3.5" />
                  <span>{sec.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-0.5 space-y-0.5 pl-4">
                  {sec.items
                    .filter((sub) => sub.path.startsWith('/account') || isNavPathVisible(sub.path))
                    .map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{getFeatureLabel(sub.path, sub.label)}</span>
                        </div>
                        {sub.badge && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {sub.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Admin Custom Sidebar Links (CMS / Navigation Manager) */}
        {!isCollapsed &&
          (config?.navigation?.sidebarCategories || [])
            .filter(
              (c) =>
                c.visible &&
                !['/learn', '/connect', '/campus', '/career', '/market', '/tools', '/account'].includes(
                  c.destination
                )
            )
            .map((custom) => (
              <NavLink
                key={custom.id}
                to={custom.destination}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                <span className="truncate">{custom.label}</span>
              </NavLink>
            ))}
      </nav>

      {/* Footer Profile Strip */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <NavLink to="/account/profile" className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={resolveAssetUrl(profile.avatarUrl)}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full flex items-center">
                  <Flame className="w-2 h-2 fill-current" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {profile.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {profile.enrollmentNo}
                </div>
              </div>
            </NavLink>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <NavLink to="/account/profile">
              <img
                src={resolveAssetUrl(profile.avatarUrl)}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
              />
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
};
