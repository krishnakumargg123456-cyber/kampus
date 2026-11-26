/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Wrench } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { AccountProfileSettingsProvider } from './context/AccountProfileSettingsContext';
import { PlatformConfigProvider, usePlatformConfig } from './context/PlatformConfigContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { LiveAppFloatingHub } from './components/common/LiveAppFloatingHub';
import { SearchModal } from './components/modals/SearchModal';
import { AiAssistantDrawer } from './components/modals/AiAssistantDrawer';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';
import { LessonModal } from './components/modals/LessonModal';
import { RECENT_COURSE } from './data/mockData';
import { HomePage } from './pages/HomePage';

// Lazy-loaded Auth & Onboarding Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const SsoCallbackPage = lazy(() => import('./pages/auth/SsoCallbackPage').then((m) => ({ default: m.SsoCallbackPage })));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));

// Lazy-loaded Admin Control Center & Public CMS Pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const AdminPortalPage = lazy(() => import('./pages/admin/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage })));
const CmsPageView = lazy(() => import('./pages/public/CmsPageView').then((m) => ({ default: m.CmsPageView })));

// Lazy-loaded 21 Module Pages
const StudyHubPage = lazy(() => import('./pages/modules/StudyHubPage').then((m) => ({ default: m.StudyHubPage })));
const KampusAiPage = lazy(() => import('./pages/modules/KampusAiPage').then((m) => ({ default: m.KampusAiPage })));
const NotesExchangePage = lazy(() => import('./pages/modules/NotesExchangePage').then((m) => ({ default: m.NotesExchangePage })));
const StudyPartnerPage = lazy(() => import('./pages/modules/StudyPartnerPage').then((m) => ({ default: m.StudyPartnerPage })));
const CommunityPage = lazy(() => import('./pages/modules/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const ChatPage = lazy(() => import('./pages/modules/ChatPage').then((m) => ({ default: m.ChatPage })));
const StudyRoomsPage = lazy(() => import('./pages/modules/StudyRoomsPage').then((m) => ({ default: m.StudyRoomsPage })));
const SkillSwapPage = lazy(() => import('./pages/modules/SkillSwapPage').then((m) => ({ default: m.SkillSwapPage })));
const CampusPulsePage = lazy(() => import('./pages/modules/CampusPulsePage').then((m) => ({ default: m.CampusPulsePage })));
const EventsClubsPage = lazy(() => import('./pages/modules/EventsClubsPage').then((m) => ({ default: m.EventsClubsPage })));
const KampusIdPage = lazy(() => import('./pages/modules/KampusIdPage').then((m) => ({ default: m.KampusIdPage })));
const StudentVoicePage = lazy(() => import('./pages/modules/StudentVoicePage').then((m) => ({ default: m.StudentVoicePage })));
const CollegeExplorerPage = lazy(() => import('./pages/modules/CollegeExplorerPage').then((m) => ({ default: m.CollegeExplorerPage })));
const CareerPage = lazy(() => import('./pages/modules/CareerPage').then((m) => ({ default: m.CareerPage })));
const MarketPage = lazy(() => import('./pages/modules/MarketPage').then((m) => ({ default: m.MarketPage })));
const DigitalLockerPage = lazy(() => import('./pages/modules/DigitalLockerPage').then((m) => ({ default: m.DigitalLockerPage })));
const RewardsPage = lazy(() => import('./pages/modules/RewardsPage').then((m) => ({ default: m.RewardsPage })));
const PlannerPage = lazy(() => import('./pages/modules/PlannerPage').then((m) => ({ default: m.PlannerPage })));
const StudentToolkitPage = lazy(() => import('./pages/modules/StudentToolkitPage').then((m) => ({ default: m.StudentToolkitPage })));
const NotificationsPage = lazy(() => import('./pages/modules/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import('./pages/modules/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/modules/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const PublicIdVerificationPage = lazy(() => import('./pages/modules/PublicIdVerificationPage').then((m) => ({ default: m.PublicIdVerificationPage })));

const RouteFallback: React.FC = () => (
  <div className="max-w-5xl mx-auto py-16 px-4 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
    <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    <span className="text-xs font-semibold">Loading KAMPUS workspace...</span>
  </div>
);

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, hasCompletedOnboarding, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <RouteFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasCompletedOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Live Admin Feature Availability & Maintenance Guard (never locks out data)
const FeatureGuard: React.FC<{ featureId: string; children: React.ReactNode }> = ({ featureId, children }) => {
  const { getFeatureConfig } = usePlatformConfig();
  const feature = getFeatureConfig(featureId);

  if (feature && !feature.enabled) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {feature.name} Is Temporarily Disabled
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          This module has been paused by a KAMPUS Super Administrator. All saved records remain preserved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  if (feature && feature.maintenanceMode) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
          <Wrench className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {feature.name} — Scheduled Maintenance
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {feature.maintenanceMessage || 'This module is undergoing scheduled maintenance and will reopen shortly.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
        >
          Back to Home Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

// Main App Layout Wrapper
const AppLayout: React.FC = () => {
  const location = useLocation();
  const { config } = usePlatformConfig();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = [
    '/login',
    '/sign-in',
    '/register',
    '/sign-up',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
    '/sso-callback',
    '/onboarding',
  ].includes(location.pathname);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState<string | undefined>(undefined);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLessonOpen, setIsLessonOpen] = useState(false);

  // Normalize legacy #/path bookmarks to modern clean pathing
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.slice(1);
      window.history.replaceState(null, '', cleanPath);
    }
  }, []);

  const handleOpenAi = (query?: string) => {
    setAiInitialQuery(query);
    setIsAiOpen(true);
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Admin Portal always stays accessible regardless of student maintenance / offline mode
  if (isAdminRoute) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminPortalPage />} />
            <Route path="/admin/:section" element={<AdminPortalPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Global Student Site Offline / Maintenance Mode controlled live by Super Admin
  if (config?.website && (!config.website.siteActive || config.website.maintenanceMode)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {config.website.siteActive ? 'Scheduled Maintenance' : `${config.website.siteName} Offline`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {config.website.maintenanceMessage ||
              'The student platform is undergoing scheduled maintenance and will return shortly.'}
          </p>
          {config.website.scheduledMaintenanceWindow && (
            <p className="text-xs font-mono text-slate-500">
              Window: {config.website.scheduledMaintenanceWindow}
            </p>
          )}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{config.website.contactEmail}</span>
            <Link to="/admin/login" className="text-blue-600 font-semibold hover:underline">
              Admin Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sign-in" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/sign-up" element={<Navigate to="/register" replace />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/sso-callback" element={<SsoCallbackPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-500 selection:text-white">
      {/* Top Bar Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAi={() => handleOpenAi()}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex items-start">
        {/* Desktop Sidebar with Expandable Categories */}
        <Sidebar onOpenAi={() => handleOpenAi()} />

        {/* Central Viewport Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Home Dashboard */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage
                        onOpenSearch={() => setIsSearchOpen(true)}
                        onOpenAi={handleOpenAi}
                        onOpenNotifications={() => setIsNotificationsOpen(true)}
                        onOpenLesson={() => setIsLessonOpen(true)}
                      />
                    </ProtectedRoute>
                  }
                />

                {/* Public Dynamic CMS Pages */}
                <Route path="/page/:slug" element={<CmsPageView />} />

                {/* LEARN (Modules 1, 2, 3) */}
                <Route path="/learn" element={<Navigate to="/learn/study-hub" replace />} />
                <Route
                  path="/learn/study-hub"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="study-hub">
                        <StudyHubPage
                          onOpenAi={handleOpenAi}
                          onOpenNotifications={() => setIsNotificationsOpen(true)}
                        />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learn/kampus-ai"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="kampus-ai">
                        <KampusAiPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/learn/notes-exchange"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="notes-exchange">
                        <NotesExchangePage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />

                {/* CONNECT (Modules 4, 5, 6, 7, 8) */}
                <Route path="/connect" element={<Navigate to="/connect/community" replace />} />
                <Route
                  path="/connect/study-partner"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="study-partner">
                        <StudyPartnerPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connect/community"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="community">
                        <CommunityPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connect/chat"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="chat">
                        <ChatPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connect/study-rooms"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="study-rooms">
                        <StudyRoomsPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/connect/skillswap"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="skillswap">
                        <SkillSwapPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />

                {/* CAMPUS (Modules 9, 10, 11, 12, 13) */}
                <Route path="/campus" element={<Navigate to="/campus/campus-pulse" replace />} />
                <Route
                  path="/campus/campus-pulse"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="campus-pulse">
                        <CampusPulsePage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campus/events-clubs"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="events-clubs">
                        <EventsClubsPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campus/kampus-id"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="kampus-id">
                        <KampusIdPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campus/student-voice"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="student-voice">
                        <StudentVoicePage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campus/college-explorer"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="college-explorer">
                        <CollegeExplorerPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />

                {/* CAREER (Module 14) */}
                <Route
                  path="/career"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="career">
                        <CareerPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />

                {/* MARKET (Module 15) */}
                <Route
                  path="/market"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="market">
                        <MarketPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />

                {/* STUDENT TOOLS (Modules 16, 17, 18 + STUDENT TOOLKIT) */}
                <Route path="/tools" element={<Navigate to="/tools/toolkit" replace />} />
                <Route
                  path="/tools/toolkit"
                  element={
                    <ProtectedRoute>
                      <StudentToolkitPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/toolkit" element={<Navigate to="/tools/toolkit" replace />} />
                <Route
                  path="/tools/digital-locker"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="digital-locker">
                        <DigitalLockerPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tools/rewards"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="rewards">
                        <RewardsPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tools/planner"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="planner">
                        <PlannerPage onOpenNotifications={() => setIsNotificationsOpen(true)} />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route path="/planner" element={<Navigate to="/tools/planner" replace />} />

                {/* ACCOUNT (Modules 19, 20, 21) */}
                <Route path="/account" element={<Navigate to="/account/profile" replace />} />
                <Route
                  path="/account/notifications"
                  element={
                    <ProtectedRoute>
                      <FeatureGuard featureId="notifications">
                        <NotificationsPage />
                      </FeatureGuard>
                    </ProtectedRoute>
                  }
                />
                <Route path="/account/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/account/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/profile/:identifier" element={<ProfilePage />} />
                <Route path="/profile" element={<Navigate to="/account/profile" replace />} />
                <Route path="/settings" element={<Navigate to="/account/settings" replace />} />
                <Route path="/notifications" element={<Navigate to="/account/notifications" replace />} />
                <Route path="/verify/id/:identifier" element={<PublicIdVerificationPage />} />
                <Route path="/verify/:identifier" element={<PublicIdVerificationPage />} />

                {/* Defensive Route Aliases */}
                <Route path="/study-hub" element={<Navigate to="/learn/study-hub" replace />} />
                <Route path="/career/college-explorer" element={<Navigate to="/campus/college-explorer" replace />} />
                <Route path="/digital-locker" element={<Navigate to="/tools/digital-locker" replace />} />
                <Route path="/rewards" element={<Navigate to="/tools/rewards" replace />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Live App Speed Dial Action Hub */}
      <LiveAppFloatingHub onOpenAi={() => handleOpenAi()} />

      {/* Interactive Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenAi={handleOpenAi}
      />

      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        initialQuery={aiInitialQuery}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <LessonModal
        isOpen={isLessonOpen}
        onClose={() => setIsLessonOpen(false)}
        course={RECENT_COURSE}
        onOpenAi={handleOpenAi}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PlatformConfigProvider>
          <AdminAuthProvider>
            <AuthProvider>
              <NotificationProvider>
                <AccountProfileSettingsProvider>
                  <Router>
                    <AppLayout />
                  </Router>
                </AccountProfileSettingsProvider>
              </NotificationProvider>
            </AuthProvider>
          </AdminAuthProvider>
        </PlatformConfigProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
