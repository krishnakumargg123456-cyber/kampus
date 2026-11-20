import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { AdminSectionId } from '../../types/superAdmin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ADMIN_NAV_ITEMS, AdminLayout } from '../../components/admin/AdminLayout';
import { AdminOverviewView } from '../../components/admin/AdminOverviewView';
import { AdminWebsiteGlobalView } from '../../components/admin/AdminWebsiteGlobalView';
import { AdminHomepageBuilderView } from '../../components/admin/AdminHomepageBuilderView';
import { AdminPagesNavView } from '../../components/admin/AdminPagesNavView';
import { AdminFeatureManagementView } from '../../components/admin/AdminFeatureManagementView';
import { AdminUsersTeamView } from '../../components/admin/AdminUsersTeamView';
import { AdminContentAcademicView } from '../../components/admin/AdminContentAcademicView';
import { AdminCollegeEventsMarketView } from '../../components/admin/AdminCollegeEventsMarketView';
import { AdminRewardsNotifAdsMediaView } from '../../components/admin/AdminRewardsNotifAdsMediaView';
import { AdminAnalyticsSupportView } from '../../components/admin/AdminAnalyticsSupportView';
import { AdminSecurityHealthBackupView } from '../../components/admin/AdminSecurityHealthBackupView';

export const AdminPortalPage: React.FC = () => {
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500">
        Verifying KAMPUS Administrator session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const validIds = new Set(ADMIN_NAV_ITEMS.map((i) => i.id));
  const resolved: AdminSectionId =
    section && validIds.has(section as AdminSectionId) ? (section as AdminSectionId) : 'overview';

  const handleSelectSection = (next: AdminSectionId) => {
    if (next === 'overview') {
      navigate('/admin/dashboard');
    } else {
      navigate(`/admin/${next}`);
    }
  };

  const renderSection = () => {
    switch (resolved) {
      case 'overview':
        return <AdminOverviewView onNavigate={handleSelectSection} />;
      case 'website':
        return <AdminWebsiteGlobalView mode="website" />;
      case 'settings':
        return <AdminWebsiteGlobalView mode="settings" />;
      case 'homepage':
        return <AdminHomepageBuilderView />;
      case 'pages':
        return <AdminPagesNavView mode="pages" />;
      case 'navigation':
        return <AdminPagesNavView mode="navigation" />;
      case 'features':
        return <AdminFeatureManagementView />;
      case 'users':
        return <AdminUsersTeamView mode="users" />;
      case 'team':
        return <AdminUsersTeamView mode="team" />;
      case 'content':
        return <AdminContentAcademicView mode="content" />;
      case 'academic':
        return <AdminContentAcademicView mode="academic" />;
      case 'community':
        return <AdminContentAcademicView mode="community" />;
      case 'colleges':
        return <AdminCollegeEventsMarketView mode="colleges" />;
      case 'events':
        return <AdminCollegeEventsMarketView mode="events" />;
      case 'marketplace':
        return <AdminCollegeEventsMarketView mode="marketplace" />;
      case 'rewards':
        return <AdminRewardsNotifAdsMediaView mode="rewards" />;
      case 'notifications':
        return <AdminRewardsNotifAdsMediaView mode="notifications" />;
      case 'ads':
        return <AdminRewardsNotifAdsMediaView mode="ads" />;
      case 'media':
        return <AdminRewardsNotifAdsMediaView mode="media" />;
      case 'analytics':
        return <AdminAnalyticsSupportView mode="analytics" />;
      case 'support':
        return <AdminAnalyticsSupportView mode="support" />;
      case 'security':
        return <AdminSecurityHealthBackupView mode="security" />;
      case 'health':
        return <AdminSecurityHealthBackupView mode="health" />;
      case 'integrations':
        return <AdminSecurityHealthBackupView mode="integrations" />;
      case 'audit':
        return <AdminSecurityHealthBackupView mode="audit" />;
      default:
        return <AdminOverviewView onNavigate={handleSelectSection} />;
    }
  };

  return (
    <AdminLayout activeSection={resolved} onSelectSection={handleSelectSection}>
      {renderSection()}
    </AdminLayout>
  );
};
