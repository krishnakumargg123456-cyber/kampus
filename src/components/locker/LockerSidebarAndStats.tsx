import React from 'react';
import {
  Activity,
  Award,
  BellRing,
  Briefcase,
  ChevronRight,
  Clock,
  FileBadge2,
  Folder,
  FolderOpen,
  FolderPlus,
  GraduationCap,
  HardDrive,
  Link2,
  Lock,
  Share2,
  Shield,
  Star,
  Upload,
  UserCheck,
} from 'lucide-react';
import { useLocker } from '../../context/LockerContext';
import {
  LOCKER_CATEGORIES,
  formatLockerBytes,
} from '../../data/lockerData';
import type { LockerCategory } from '../../types/locker';

export type LockerSectionNav =
  | 'overview'
  | 'all'
  | 'important'
  | 'recent'
  | 'shared-by-me'
  | 'shared-with-me'
  | 'reminders'
  | 'integrations'
  | 'activity';

interface LockerSidebarProps {
  activeSection: LockerSectionNav;
  selectedCategory: LockerCategory | 'all';
  selectedFolderId: string | null;
  onSelectSection: (sec: LockerSectionNav) => void;
  onSelectCategory: (cat: LockerCategory | 'all') => void;
  onSelectFolder: (folderId: string | null) => void;
  onOpenUpload: () => void;
  onOpenNewFolder: () => void;
}

const CATEGORY_ICON: Record<LockerCategory, React.FC<{ className?: string }>> = {
  'Academic Records': GraduationCap,
  'Identity Documents': UserCheck,
  Certificates: Award,
  'Admission Documents': FileBadge2,
  'Examination Documents': Clock,
  'Career Documents': Briefcase,
  'Personal Documents': Lock,
  'Other Documents': Folder,
};

export const LockerSidebar: React.FC<LockerSidebarProps> = ({
  activeSection,
  selectedCategory,
  selectedFolderId,
  onSelectSection,
  onSelectCategory,
  onSelectFolder,
  onOpenUpload,
  onOpenNewFolder,
}) => {
  const { documents, sharedWithMe, folders, reminders, storage } = useLocker();

  const importantCount = documents.filter((d) => d.isImportant).length;
  const sharedByMeCount = documents.filter(
    (d) =>
      d.userShares.some((s) => !s.revoked) ||
      d.shareLinks.some((l) => !l.revoked && new Date(l.expiresAt).getTime() > Date.now())
  ).length;
  const rootFolders = folders.filter((f) => !f.parentId);

  const usedPct = storage
    ? Math.min(100, Math.round((storage.usedBytes / Math.max(1, storage.quotaBytes)) * 100))
    : 0;

  return (
    <aside className="w-full lg:w-[270px] shrink-0 space-y-5">
      {/* Primary Actions */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
        <button
          type="button"
          onClick={onOpenUpload}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
        <button
          type="button"
          onClick={onOpenNewFolder}
          className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-2"
        >
          <FolderPlus className="w-4 h-4 text-blue-600" />
          <span>Create Folder</span>
        </button>
      </div>

      {/* Navigation Views */}
      <nav
        aria-label="Digital Locker workspace navigation"
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-1 text-xs"
      >
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: HardDrive, count: null },
          { id: 'all', label: 'All Documents', icon: FolderOpen, count: documents.length },
          { id: 'important', label: 'Important & Pinned', icon: Star, count: importantCount },
          { id: 'recent', label: 'Recent Documents', icon: Clock, count: documents.slice(0, 12).length },
          { id: 'shared-by-me', label: 'Shared by Me', icon: Share2, count: sharedByMeCount },
          { id: 'shared-with-me', label: 'Shared with Me', icon: Shield, count: sharedWithMe.length },
          {
            id: 'reminders',
            label: 'Document Reminders',
            icon: BellRing,
            count: reminders.filter((r) => !r.completed).length,
          },
          { id: 'integrations', label: 'KAMPUS Integrations', icon: Link2, count: null },
          { id: 'activity', label: 'Activity & Security Log', icon: Activity, count: null },
        ].map((nav) => {
          const Icon = nav.icon;
          const active =
            activeSection === nav.id && selectedCategory === 'all' && !selectedFolderId;
          return (
            <button
              key={nav.id}
              type="button"
              onClick={() => {
                onSelectSection(nav.id as LockerSectionNav);
                onSelectCategory('all');
                onSelectFolder(null);
              }}
              className={`w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2 font-semibold transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{nav.label}</span>
              </span>
              {nav.count !== null && (
                <span
                  className={`tabular-nums text-[11px] ${
                    active ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {nav.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Document Categories */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
        <p className="font-bold text-slate-900 dark:text-slate-100">Document Categories</p>
        <div className="space-y-1">
          {LOCKER_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICON[cat];
            const count = documents.filter((d) => d.category === cat).length;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectSection('all');
                  onSelectCategory(cat);
                  onSelectFolder(null);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <span className="inline-flex items-center gap-2 truncate">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cat}</span>
                </span>
                <span className="tabular-nums text-[11px] text-slate-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Folder Tree */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-900 dark:text-slate-100">Folders ({folders.length})</p>
          <button
            type="button"
            onClick={onOpenNewFolder}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            + New
          </button>
        </div>

        {folders.length === 0 ? (
          <p className="text-slate-400 leading-relaxed">
            No custom folders yet. Create folders by semester, academic year, or college.
          </p>
        ) : (
          <div className="space-y-1">
            {rootFolders.map((folder) => {
              const children = folders.filter((f) => f.parentId === folder.id);
              const isSelected = selectedFolderId === folder.id;
              return (
                <div key={folder.id} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSection('all');
                      onSelectCategory('all');
                      onSelectFolder(folder.id);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <Folder className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                  {children.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        onSelectSection('all');
                        onSelectCategory('all');
                        onSelectFolder(sub.id);
                      }}
                      className={`w-full pl-7 pr-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        selectedFolderId === sub.id
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Folder className="w-3 h-3 shrink-0" />
                      <span className="truncate">{sub.name}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real Storage Quota Visualization */}
      {storage && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-slate-100">Private Vault Quota</span>
            <span className="font-mono text-[11px] text-slate-500 tabular-nums">{usedPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {formatLockerBytes(storage.usedBytes)} used · {formatLockerBytes(storage.availableBytes)}{' '}
            available ({formatLockerBytes(storage.quotaBytes)} total)
          </p>
        </div>
      )}
    </aside>
  );
};
