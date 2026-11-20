import React, { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  FolderGit2,
  Globe,
  GraduationCap,
  Sparkles,
  User,
} from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ProfileOverviewAndPersonalView } from '../../components/profile/ProfileOverviewAndPersonalView';
import { ProfileAcademicSkillsAchievementsView } from '../../components/profile/ProfileAcademicSkillsAchievementsView';
import { ProfileProjectsActivityPublicView } from '../../components/profile/ProfileProjectsActivityPublicView';

type ProfileTab = 'overview' | 'academic' | 'skills' | 'achievements' | 'projects' | 'activity' | 'public';

const PROFILE_TABS: Array<{ id: ProfileTab; label: string; icon: any }> = [
  { id: 'overview', label: 'Overview & Personal', icon: User },
  { id: 'academic', label: 'Academic Journey', icon: GraduationCap },
  { id: 'skills', label: 'Skills & Interests', icon: Sparkles },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'activity', label: 'Activity & Stats', icon: Activity },
  { id: 'public', label: 'Public Profile', icon: Globe },
];

export const ProfilePage: React.FC = () => {
  const { identifier } = useParams<{ identifier?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as ProfileTab) || 'overview';
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    PROFILE_TABS.some((t) => t.id === initialTab) ? initialTab : 'overview'
  );

  useEffect(() => {
    const q = searchParams.get('tab') as ProfileTab | null;
    if (q && PROFILE_TABS.some((t) => t.id === q)) {
      setActiveTab(q);
    }
  }, [searchParams]);

  if (identifier) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            KAMPUS Public Student Identity
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            @{identifier}
          </h1>
        </div>
        <ProfileProjectsActivityPublicView section="public" standaloneIdentifier={identifier} />
      </div>
    );
  }

  const handleSelectTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            <User className="w-4 h-4" />
            <span>ACCOUNT · Student Identity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Student Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your academic identity, skills, verified certificates, portfolio projects, and public visibility.
          </p>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2">
        {PROFILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active View */}
      {activeTab === 'overview' && <ProfileOverviewAndPersonalView onNavigateTab={handleSelectTab} />}
      {(activeTab === 'academic' || activeTab === 'skills' || activeTab === 'achievements') && (
        <ProfileAcademicSkillsAchievementsView section={activeTab} />
      )}
      {(activeTab === 'projects' || activeTab === 'activity' || activeTab === 'public') && (
        <ProfileProjectsActivityPublicView section={activeTab} />
      )}
    </div>
  );
};
