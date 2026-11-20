import crypto from 'crypto';
import type { Express, NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  AcademicCourseRecord,
  AcademicResourceRecord,
  AcademicSubjectRecord,
  AdCampaignRecord,
  AdminLoginEvent,
  AdminPermission,
  AdminRoleDefinition,
  AdminRoleId,
  AdminSessionRecord,
  AdminSupportTicket,
  AdminTeamMember,
  AdminUserRecord,
  AuditLogEntry,
  BackupRecord,
  CmsPage,
  HomepageSectionConfig,
  HomepageVersion,
  IntegrationStatusItem,
  ManagedFeatureConfig,
  MediaAssetRecord,
  NavigationConfig,
  PublicPlatformConfig,
  SystemHealthSnapshot,
  UnifiedContentItem,
  WebsiteConfig,
  WebsiteConfigVersion,
} from '../src/types/superAdmin.ts';

interface StoredAdminCredential {
  adminId: string;
  passwordSalt: string;
  passwordHash: string;
}

interface SuperAdminDatabase {
  tokenSecret: string;
  roles: AdminRoleDefinition[];
  teamMembers: AdminTeamMember[];
  credentials: StoredAdminCredential[];
  sessions: AdminSessionRecord[];
  loginEvents: AdminLoginEvent[];
  websiteConfig: WebsiteConfig;
  websiteVersions: WebsiteConfigVersion[];
  homepageDraft: HomepageSectionConfig[];
  homepagePublished: HomepageSectionConfig[];
  homepageVersions: HomepageVersion[];
  pages: CmsPage[];
  navigation: NavigationConfig;
  features: ManagedFeatureConfig[];
  suspendedUserIds: string[];
  userNotes: Record<string, Array<{ id: string; author: string; note: string; createdAt: string }>>;
  academicSubjects: AcademicSubjectRecord[];
  academicCourses: AcademicCourseRecord[];
  academicResources: AcademicResourceRecord[];
  academicStreams: string[];
  communityRules: {
    requireVerifiedForLinks: boolean;
    autoFlagThreshold: number;
    allowAnonymousVoice: boolean;
    blockedKeywords: string[];
    pinnedNotice: string;
  };
  contentStatusOverrides: Record<string, { status: UnifiedContentItem['status']; featured: boolean }>;
  marketRules: {
    maxActiveListingsPerStudent: number;
    requireCollegeVerification: boolean;
    prohibitedKeywords: string[];
    escrowGuidance: string;
  };
  notificationPolicies: {
    enableBroadcasts: boolean;
    dailyDigestHour: string;
    retentionDays: number;
    templates: Array<{ id: string; name: string; category: string; titleTemplate: string; bodyTemplate: string }>;
  };
  ads: AdCampaignRecord[];
  mediaAssets: MediaAssetRecord[];
  supportTickets: AdminSupportTicket[];
  auditLogs: AuditLogEntry[];
  backups: BackupRecord[];
  retentionConfig: {
    auditLogDays: number;
    resolvedTicketDays: number;
    backupRetentionCount: number;
  };
}

const DB_PATH = path.join(process.cwd(), '.kampus_super_admin_db.json');
const MEDIA_DIR = path.join(process.cwd(), '.kampus_admin_media');
const BACKUP_DIR = path.join(process.cwd(), '.kampus_backups');

const STORE_PATHS: Record<string, string> = {
  account: path.join(process.cwd(), '.kampus_account_db.json'),
  campusPulse: path.join(process.cwd(), '.kampus_campus_pulse_db.json'),
  career: path.join(process.cwd(), '.kampus_career_db.json'),
  chat: path.join(process.cwd(), '.kampus_chat_db.json'),
  collegeExplorer: path.join(process.cwd(), '.kampus_college_explorer_db.json'),
  community: path.join(process.cwd(), '.kampus_community_db.json'),
  eventsClubs: path.join(process.cwd(), '.kampus_events_clubs_db.json'),
  kampusId: path.join(process.cwd(), '.kampus_kampus_id_db.json'),
  locker: path.join(process.cwd(), '.kampus_locker_db.json'),
  market: path.join(process.cwd(), '.kampus_market_db.json'),
  notifications: path.join(process.cwd(), '.kampus_notifications_db.json'),
  planner: path.join(process.cwd(), '.kampus_planner_db.json'),
  rewards: path.join(process.cwd(), '.kampus_rewards_db.json'),
  skillswap: path.join(process.cwd(), '.kampus_skillswap_db.json'),
  studentVoice: path.join(process.cwd(), '.kampus_student_voice_db.json'),
  studyRooms: path.join(process.cwd(), '.kampus_study_rooms_db.json'),
};

const ALL_PERMISSIONS: AdminPermission[] = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'publish',
  'export',
  'configure',
  'manage_users',
  'manage_permissions',
];

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { salt: usedSalt, hash: derived };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function writeJsonSafe(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function ensureDir(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

function defaultWebsiteConfig(): WebsiteConfig {
  const now = new Date().toISOString();
  return {
    siteName: 'KAMPUS',
    tagline: 'Your Student Life, Connected.',
    logoUrl: '/src/assets/images/rewards_campus_pass_1794643813947.jpg',
    faviconUrl: '',
    contactEmail: 'support@kampus.edu.in',
    supportPhone: '+91 22 4001 8800',
    footerDescription:
      'India’s unified academic operating system connecting coursework, AI tutoring, peer communities, campus passes, career drives, and verified student tools.',
    footerCopyright: 'KAMPUS Technologies. Student-First Architecture.',
    siteActive: true,
    maintenanceMode: false,
    maintenanceMessage:
      'KAMPUS is undergoing scheduled platform maintenance. Core academic records remain safe and will return shortly.',
    scheduledMaintenanceWindow: '',
    allowRegistration: true,
    allowLogin: true,
    publicAccess: true,
    primaryColor: '#2563EB',
    navyColor: '#172554',
    accentColor: '#F97316',
    fontFamily: 'Plus Jakarta Sans',
    buttonStyle: 'rounded',
    borderRadiusScale: 'standard',
    layoutWidth: 'standard',
    navigationStyle: 'sidebar',
    defaultTheme: 'light',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'hi'],
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD MMM YYYY',
    seoTitle: 'KAMPUS - Your Student Life, Connected',
    seoDescription:
      'All-in-One Student Super App with 21 connected modules for study notes, KAMPUS AI, planner, digital locker, career placements, and campus life.',
    ogImage: '/src/assets/images/hero_students_campus_1794449577723.jpg',
    updatedAt: now,
    updatedBy: 'System Seed',
  };
}

function defaultHomepageSections(): HomepageSectionConfig[] {
  return [
    {
      id: 'sec-hero',
      type: 'hero',
      label: 'Hero Section',
      visible: true,
      order: 1,
      heading: 'Your Student Life, Connected.',
      subheading: 'India’s All-in-One Collegiate Ecosystem',
      description:
        'Unifying study materials, KAMPUS AI tutoring, live campus circulars, career drives, digital vault, and student communities in one workspace.',
      imageUrl: '/src/assets/images/hero_students_campus_1794449577723.jpg',
      iconName: 'Compass',
      primaryCtaLabel: 'Explore KAMPUS',
      primaryCtaLink: '#explore-features',
      secondaryCtaLabel: 'Quick Search',
      secondaryCtaLink: 'action:search',
      backgroundTone: 'navy',
    },
    {
      id: 'sec-features',
      type: 'features',
      label: 'Feature Categories (21 Modules)',
      visible: true,
      order: 2,
      heading: 'Every Essential Student Tool, Unified',
      subheading: '21 Purpose-Built Modules',
      description:
        'Navigate seamlessly across Learn, Connect, Campus, Career, Market, Student Tools, and Account spaces.',
      imageUrl: '/src/assets/images/studyhub_desk_hero_1794549223041.jpg',
      iconName: 'Layers',
      primaryCtaLabel: 'Open Module',
      primaryCtaLink: '/learn/study-hub',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: 'default',
    },
    {
      id: 'sec-dashboard',
      type: 'dashboard',
      label: 'Student Dashboard Preview',
      visible: true,
      order: 3,
      heading: 'Your Academic Cockpit',
      subheading: 'Personalized Semester Snapshot',
      description:
        'Live syllabus pace, today’s lecture schedule, attendance safe-zone, and pending deadlines.',
      imageUrl: '/src/assets/images/study_algorithms_1794407583101.jpg',
      iconName: 'TrendingUp',
      primaryCtaLabel: 'Resume Lesson',
      primaryCtaLink: 'action:lesson',
      secondaryCtaLabel: 'Open Full Planner',
      secondaryCtaLink: '/tools/planner',
      backgroundTone: 'default',
    },
    {
      id: 'sec-ai-showcase',
      type: 'ai-showcase',
      label: 'KAMPUS AI Showcase',
      visible: true,
      order: 4,
      heading: 'Meet KAMPUS AI, Your 24/7 Academic Copilot',
      subheading: 'AI Study Companion',
      description:
        'Step-by-step proofs, note summarization, practice quizzes, and document intelligence tailored to your semester.',
      imageUrl: '/src/assets/images/ai_study_copilot_1794449593187.jpg',
      iconName: 'Sparkles',
      primaryCtaLabel: 'Open KAMPUS AI',
      primaryCtaLink: '/learn/kampus-ai',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: 'navy',
    },
    {
      id: 'sec-campus-life',
      type: 'campus-life',
      label: 'Campus Life Showcase',
      visible: true,
      order: 5,
      heading: 'Stay Synchronized With Campus Pulse',
      subheading: 'Vibrant Campus Community',
      description:
        'Official dean circulars, cultural fests, hackathons, student clubs, and hostel community channels.',
      imageUrl: '/src/assets/images/campus_life_activities_1794488255584.jpg',
      iconName: 'Calendar',
      primaryCtaLabel: 'Browse Events & Clubs',
      primaryCtaLink: '/campus/events-clubs',
      secondaryCtaLabel: 'Join Community',
      secondaryCtaLink: '/connect/community',
      backgroundTone: 'default',
    },
    {
      id: 'sec-career',
      type: 'career',
      label: 'Career & Placements Showcase',
      visible: true,
      order: 6,
      heading: 'Launch Your Engineering & Research Career',
      subheading: 'Career & Placements',
      description:
        'Verified summer internships, merit scholarships, mentorship workshops, and campus placement drives.',
      imageUrl: '/src/assets/images/career_students_workshop_1794488271245.jpg',
      iconName: 'Briefcase',
      primaryCtaLabel: 'Explore Career Portal',
      primaryCtaLink: '/career',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: 'default',
    },
    {
      id: 'sec-announcements',
      type: 'announcements',
      label: 'Official Announcements Strip',
      visible: false,
      order: 7,
      heading: 'Campus Announcements & Deadlines',
      subheading: 'Verified Notices',
      description: 'Official institution announcements published directly from KAMPUS Super Admin & Notification Center.',
      imageUrl: '/src/assets/images/notes_exchange_hero_1794550950819.jpg',
      iconName: 'Bell',
      primaryCtaLabel: 'View Notification Center',
      primaryCtaLink: '/account/notifications',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: 'blue',
    },
    {
      id: 'sec-featured-events',
      type: 'featured-events',
      label: 'Featured Events Spotlight',
      visible: false,
      order: 8,
      heading: 'Featured Campus Events & Symposia',
      subheading: 'Events & Clubs',
      description: 'Discover upcoming workshops, hackathons, and student club showcases across campus.',
      imageUrl: '/src/assets/images/events_cultural_fest_1794564537193.jpg',
      iconName: 'Calendar',
      primaryCtaLabel: 'All Events',
      primaryCtaLink: '/campus/events-clubs',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: 'default',
    },
    {
      id: 'sec-featured-colleges',
      type: 'featured-colleges',
      label: 'Featured Colleges Spotlight',
      visible: false,
      order: 9,
      heading: 'Explore Top Campuses & Departments',
      subheading: 'College Explorer',
      description: 'Compare verified campus directories, degree tracks, and academic facilities.',
      imageUrl: '/src/assets/images/college_iit_tech_campus_1794572775766.jpg',
      iconName: 'Building2',
      primaryCtaLabel: 'Open College Explorer',
      primaryCtaLink: '/campus/college-explorer',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: 'slate',
    },
    {
      id: 'sec-featured-market',
      type: 'featured-market',
      label: 'Featured Marketplace Items',
      visible: false,
      order: 10,
      heading: 'Peer-to-Peer Campus Marketplace',
      subheading: 'Zero Brokerage Student Exchange',
      description: 'Verified textbooks, calculators, cycles, and lab instruments shared safely within college.',
      imageUrl: '/src/assets/images/market_hero_student_desk_1794573425705.jpg',
      iconName: 'ShoppingBag',
      primaryCtaLabel: 'Browse Market',
      primaryCtaLink: '/market',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: 'default',
    },
    {
      id: 'sec-promo-banner',
      type: 'promo-banner',
      label: 'Promotional Highlight Banner',
      visible: false,
      order: 11,
      heading: 'Campus Academic Semester Drive',
      subheading: 'Platform Highlight',
      description: 'Complete your student profile and upload semester notes to unlock academic community recognition.',
      imageUrl: '/src/assets/images/rewards_study_pack_1794643814692.jpg',
      iconName: 'Award',
      primaryCtaLabel: 'Explore Rewards',
      primaryCtaLink: '/tools/rewards',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: 'amber',
    },
    {
      id: 'sec-footer',
      type: 'footer',
      label: 'Website Footer',
      visible: true,
      order: 12,
      heading: 'KAMPUS',
      subheading: 'Your Student Life, Connected.',
      description: 'Built for modern Indian universities with secure local-first data controls.',
      imageUrl: '',
      iconName: 'GraduationCap',
      primaryCtaLabel: '',
      primaryCtaLink: '',
      secondaryCtaLabel: '',
      secondaryCtaLink: '',
      backgroundTone: 'default',
    },
  ];
}

function defaultPages(): CmsPage[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'page-about',
      title: 'About KAMPUS',
      slug: 'about',
      pageType: 'about',
      status: 'Published',
      visibility: 'Public',
      seoTitle: 'About KAMPUS — Student Super App',
      seoDescription: 'Learn how KAMPUS unifies 21 student workflows into one connected academic platform.',
      coverImageUrl: '/src/assets/images/college_management_quad_1794572777420.jpg',
      updatedAt: now,
      updatedBy: 'Super Admin',
      publishedAt: now,
      blocks: [
        {
          id: 'blk-about-1',
          type: 'heading',
          title: 'Built Around the Real Student Journey',
        },
        {
          id: 'blk-about-2',
          type: 'paragraph',
          body: 'KAMPUS brings together coursework materials, AI academic guidance, peer study rooms, official campus circulars, career opportunities, and verified student identity passes inside a single cohesive workspace.',
        },
        {
          id: 'blk-about-3',
          type: 'card-grid',
          title: 'Platform Pillars',
          items: [
            { title: 'Academic Mastery', detail: 'Study Hub, KAMPUS AI, Notes Exchange, and Smart Planner.' },
            { title: 'Connected Campuses', detail: 'Campus Pulse, Events & Clubs, KAMPUS ID, and Student Voice.' },
            { title: 'Verified Trust', detail: 'Encrypted Digital Locker and role-governed data privacy.' },
          ],
        },
      ],
    },
    {
      id: 'page-privacy',
      title: 'Privacy Policy',
      slug: 'privacy',
      pageType: 'privacy',
      status: 'Published',
      visibility: 'Public',
      seoTitle: 'KAMPUS Privacy Policy',
      seoDescription: 'How KAMPUS protects student identity records, private Digital Locker files, and academic telemetry.',
      updatedAt: now,
      updatedBy: 'Super Admin',
      publishedAt: now,
      blocks: [
        { id: 'blk-priv-1', type: 'heading', title: 'Student Data & Digital Locker Protection' },
        {
          id: 'blk-priv-2',
          type: 'paragraph',
          body: 'Private files stored inside Digital Locker remain strictly isolated to your authenticated student account and are never exposed in administrative bulk exports.',
        },
      ],
    },
    {
      id: 'page-terms',
      title: 'Terms of Service',
      slug: 'terms',
      pageType: 'terms',
      status: 'Published',
      visibility: 'Public',
      seoTitle: 'KAMPUS Terms of Service',
      seoDescription: 'Community guidelines, academic integrity standards, and campus marketplace rules on KAMPUS.',
      updatedAt: now,
      updatedBy: 'Super Admin',
      publishedAt: now,
      blocks: [
        { id: 'blk-terms-1', type: 'heading', title: 'Academic Integrity & Community Conduct' },
        {
          id: 'blk-terms-2',
          type: 'paragraph',
          body: 'Students must uphold university honour codes when uploading notes, participating in SkillSwap, or listing items on KAMPUS Market.',
        },
      ],
    },
    {
      id: 'page-help',
      title: 'Help & Student Support',
      slug: 'help',
      pageType: 'help',
      status: 'Published',
      visibility: 'Public',
      seoTitle: 'KAMPUS Help Center',
      seoDescription: 'Frequently asked questions and support resources for KAMPUS modules.',
      updatedAt: now,
      updatedBy: 'Super Admin',
      publishedAt: now,
      blocks: [
        { id: 'blk-help-1', type: 'heading', title: 'Frequently Asked Questions' },
        {
          id: 'blk-help-2',
          type: 'faq',
          items: [
            { title: 'How do I verify my student account?', detail: 'Open KAMPUS ID or Onboarding to submit your enrollment ID for institutional verification.' },
            { title: 'Are my Digital Locker files private?', detail: 'Yes. Only files for which you explicitly generate a timed share link can be viewed externally.' },
          ],
        },
      ],
    },
    {
      id: 'page-contact',
      title: 'Contact KAMPUS',
      slug: 'contact',
      pageType: 'contact',
      status: 'Published',
      visibility: 'Public',
      seoTitle: 'Contact KAMPUS Administration',
      seoDescription: 'Reach KAMPUS campus coordinators and platform support.',
      updatedAt: now,
      updatedBy: 'Super Admin',
      publishedAt: now,
      blocks: [
        { id: 'blk-cnt-1', type: 'heading', title: 'Institutional & Student Support' },
        {
          id: 'blk-cnt-2',
          type: 'paragraph',
          body: 'Reach our support team via support@kampus.edu.in or submit an issue ticket from Account > Settings > Help & Support.',
        },
      ],
    },
  ];
}

function defaultNavigation(): NavigationConfig {
  return {
    headerMenu: [
      { id: 'hdr-home', label: 'Home', destination: '/', visible: true, order: 1, protected: true },
      { id: 'hdr-study', label: 'Study Hub', destination: '/learn/study-hub', visible: true, order: 2 },
      { id: 'hdr-ai', label: 'KAMPUS AI', destination: '/learn/kampus-ai', visible: true, order: 3 },
      { id: 'hdr-campus', label: 'Campus Pulse', destination: '/campus/campus-pulse', visible: true, order: 4 },
      { id: 'hdr-career', label: 'Career', destination: '/career', visible: true, order: 5 },
    ],
    sidebarCategories: [
      { id: 'sb-learn', label: 'LEARN', destination: '/learn/study-hub', visible: true, order: 1 },
      { id: 'sb-connect', label: 'CONNECT', destination: '/connect/community', visible: true, order: 2 },
      { id: 'sb-campus', label: 'CAMPUS', destination: '/campus/campus-pulse', visible: true, order: 3 },
      { id: 'sb-career', label: 'Career', destination: '/career', visible: true, order: 4 },
      { id: 'sb-market', label: 'KAMPUS Market', destination: '/market', visible: true, order: 5 },
      { id: 'sb-tools', label: 'STUDENT TOOLS', destination: '/tools/planner', visible: true, order: 6 },
      { id: 'sb-account', label: 'ACCOUNT', destination: '/account/settings', visible: true, order: 7, protected: true },
    ],
    dashboardQuickLinks: [
      { id: 'ql-planner', label: 'Open Planner', destination: '/tools/planner', visible: true, order: 1 },
      { id: 'ql-locker', label: 'Digital Locker', destination: '/tools/digital-locker', visible: true, order: 2 },
      { id: 'ql-rewards', label: 'KAMPUS Rewards', destination: '/tools/rewards', visible: true, order: 3 },
    ],
    footerAcademic: [
      { id: 'fa-study', label: 'Study Hub', destination: '/learn/study-hub', visible: true, order: 1 },
      { id: 'fa-ai', label: 'KAMPUS AI Assistant', destination: '/learn/kampus-ai', visible: true, order: 2 },
      { id: 'fa-notes', label: 'Notes Exchange', destination: '/learn/notes-exchange', visible: true, order: 3 },
      { id: 'fa-planner', label: 'Academic Planner', destination: '/tools/planner', visible: true, order: 4 },
      { id: 'fa-rooms', label: 'Live Study Rooms', destination: '/connect/study-rooms', visible: true, order: 5 },
    ],
    footerSupport: [
      { id: 'fs-about', label: 'About Us', destination: '/page/about', visible: true, order: 1 },
      { id: 'fs-help', label: 'Help & Support', destination: '/page/help', visible: true, order: 2 },
      { id: 'fs-privacy', label: 'Privacy Policy', destination: '/page/privacy', visible: true, order: 3, protected: true },
      { id: 'fs-terms', label: 'Terms of Service', destination: '/page/terms', visible: true, order: 4, protected: true },
      { id: 'fs-contact', label: 'Contact', destination: '/page/contact', visible: true, order: 5 },
    ],
    updatedAt: new Date().toISOString(),
  };
}

function defaultFeatures(): ManagedFeatureConfig[] {
  const specs: Array<{
    num: number;
    id: string;
    name: string;
    desc: string;
    icon: string;
    cat: ManagedFeatureConfig['category'];
    route: string;
    limits: Record<string, number | string>;
    settings: Record<string, string | number | boolean>;
  }> = [
    {
      num: 1,
      id: 'study-hub',
      name: 'Study Hub',
      desc: 'Course notes, previous year question papers, lecture summaries, and formula sheets.',
      icon: 'BookOpen',
      cat: 'learn',
      route: '/learn/study-hub',
      limits: { maxUploadSizeMb: 25, maxResourcesPerSubject: 100 },
      settings: { requireApprovalForPublicNotes: true, enableFormulaSheets: true, defaultView: 'subjects' },
    },
    {
      num: 2,
      id: 'kampus-ai',
      name: 'KAMPUS AI',
      desc: '24/7 personal academic copilot for problem solving, proofs, and document analysis.',
      icon: 'Sparkles',
      cat: 'learn',
      route: '/learn/kampus-ai',
      limits: { maxRequestsPerHour: 40, maxDocumentUploadMb: 10 },
      settings: { defaultModel: 'gemini-4-hydrogen', enforceAcademicIntegrityDisclaimer: true, allowDocumentUpload: true },
    },
    {
      num: 3,
      id: 'notes-exchange',
      name: 'Notes Exchange',
      desc: 'Peer-to-peer network to upload, review, and exchange verified handwritten notes.',
      icon: 'Share2',
      cat: 'learn',
      route: '/learn/notes-exchange',
      limits: { maxPdfMb: 20, maxBountyRequestsOpen: 5 },
      settings: { autoModerationEnabled: true, allowPeerVerification: true, requireCourseTag: true },
    },
    {
      num: 4,
      id: 'study-partner',
      name: 'Study Partner',
      desc: 'Peer matching based on courses, exam targets, and overlapping study schedules.',
      icon: 'UserCheck',
      cat: 'connect',
      route: '/connect/study-partner',
      limits: { maxDailyMatchRequests: 15 },
      settings: { sameCampusPriority: true, requireVerifiedForDirectPing: true, safetyFilterStrict: true },
    },
    {
      num: 5,
      id: 'community',
      name: 'Student Community',
      desc: 'Branch-wise and interest-based campus discussion forums and polls.',
      icon: 'Users',
      cat: 'connect',
      route: '/connect/community',
      limits: { maxPostLength: 3000, maxImagesPerPost: 4 },
      settings: { holdFlaggedPostsForReview: true, allowCommunityPolls: true, minAccountAgeHours: 0 },
    },
    {
      num: 6,
      id: 'chat',
      name: 'KAMPUS Chat',
      desc: 'Real-time direct messaging and study group channels for students.',
      icon: 'MessageSquare',
      cat: 'connect',
      route: '/connect/chat',
      limits: { maxAttachmentMb: 10, maxGroupMembers: 150 },
      settings: { requireRequestForNonConnections: true, allowVoiceNotes: true, messageReportingEnabled: true },
    },
    {
      num: 7,
      id: 'study-rooms',
      name: 'Study Rooms',
      desc: 'Synchronized Pomodoro focus rooms and silent accountability tables.',
      icon: 'Radio',
      cat: 'connect',
      route: '/connect/study-rooms',
      limits: { maxParticipantsPerRoom: 30, maxConcurrentOwnedRooms: 3 },
      settings: { defaultPomodoroMinutes: 25, allowPublicRooms: true, enableSafetyReportButton: true },
    },
    {
      num: 8,
      id: 'skillswap',
      name: 'SkillSwap',
      desc: 'Peer micro-mentorship: exchange skills through structured learning tracks.',
      icon: 'Repeat',
      cat: 'connect',
      route: '/connect/skillswap',
      limits: { maxActiveListingsPerUser: 6 },
      settings: { enableTimeBanking: true, requireSessionConfirmation: true, moderationAutoHoldReports: 3 },
    },
    {
      num: 9,
      id: 'campus-pulse',
      name: 'Campus Pulse',
      desc: 'Live administrative circulars, mess menus, facility status, and campus polls.',
      icon: 'Activity',
      cat: 'campus',
      route: '/campus/campus-pulse',
      limits: { pollDurationMaxDays: 14 },
      settings: { allowStudentSubmissions: true, verifyPublisherBadge: true, showFacilityStatus: true },
    },
    {
      num: 10,
      id: 'events-clubs',
      name: 'Events & Clubs',
      desc: 'Discover hackathons, cultural festivals, student clubs, and manage RSVPs.',
      icon: 'Calendar',
      cat: 'campus',
      route: '/campus/events-clubs',
      limits: { maxTeamSizeDefault: 5 },
      settings: { requireAdminApprovalForNewClubs: true, issueQrTickets: true, enableParticipationCertificates: true },
    },
    {
      num: 11,
      id: 'kampus-id',
      name: 'KAMPUS ID',
      desc: 'Digital QR & NFC student identification card and institutional verification pass.',
      icon: 'CreditCard',
      cat: 'campus',
      route: '/campus/kampus-id',
      limits: { qrRefreshSeconds: 60 },
      settings: { requireEnrollmentMatch: true, allowPublicVerificationUrl: true, biometricLockPrompt: true },
    },
    {
      num: 12,
      id: 'student-voice',
      name: 'Student Voice',
      desc: 'Structured student grievances, petitions, council polls, and idea board.',
      icon: 'Megaphone',
      cat: 'campus',
      route: '/campus/student-voice',
      limits: { maxMonthlyPetitionsPerUser: 5 },
      settings: { allowConfidentialSubmission: true, requireAdminEscalationReview: true, showPublicTrackingId: true },
    },
    {
      num: 13,
      id: 'career',
      name: 'Career',
      desc: 'Internships, scholarships, campus placement drives, and resume builder.',
      icon: 'Briefcase',
      cat: 'career',
      route: '/career',
      limits: { maxSavedJobs: 100 },
      settings: { showUnverifiedOpportunityWarning: true, enableAtsResumePdf: true, enablePortfolioSharing: true },
    },
    {
      num: 14,
      id: 'college-explorer',
      name: 'College Explorer',
      desc: 'Search, compare, and inspect universities, courses, fees, and admissions.',
      icon: 'Compass',
      cat: 'campus',
      route: '/campus/college-explorer',
      limits: { maxCompareColleges: 4 },
      settings: { markUnverifiedRecordsClearly: true, allowStudentReviews: true, allowSharedComparisons: true },
    },
    {
      num: 15,
      id: 'market',
      name: 'KAMPUS Market',
      desc: 'Intra-college marketplace for textbooks, calculators, cycles, and room gear.',
      icon: 'ShoppingBag',
      cat: 'market',
      route: '/market',
      limits: { maxListingsPerStudent: 10, maxPhotosPerListing: 4 },
      settings: { zeroBrokeragePolicy: true, requireVerifiedCampusUser: true, autoHideReportedItems: 3 },
    },
    {
      num: 16,
      id: 'digital-locker',
      name: 'Digital Locker',
      desc: 'Encrypted cloud vault for grade sheets, certificates, IDs, and documents.',
      icon: 'ShieldCheck',
      cat: 'tools',
      route: '/tools/digital-locker',
      limits: { storageQuotaMb: 250, maxSingleFileMb: 25 },
      settings: { allowedFileTypes: 'pdf,png,jpg,jpeg,docx,txt', enableTimedShareLinks: true, strictPrivateIsolation: true },
    },
    {
      num: 17,
      id: 'rewards',
      name: 'KAMPUS Rewards',
      desc: 'Transparent student participation points, badges, challenges, and redemptions.',
      icon: 'Gift',
      cat: 'tools',
      route: '/tools/rewards',
      limits: { dailyEarnCapPoints: 300 },
      settings: { enableLeaderboardOptOut: true, requireAuditLogForAdjustments: true, pointsExpiryDays: 365 },
    },
    {
      num: 18,
      id: 'planner',
      name: 'KAMPUS Planner',
      desc: 'Daily task planning, study schedules, attendance tracker, and exam countdowns.',
      icon: 'Clock',
      cat: 'tools',
      route: '/tools/planner',
      limits: { maxActiveGoals: 25 },
      settings: { defaultAttendanceThresholdPct: 75, enableStudyTimer: true, syncPlannerReminders: true },
    },
    {
      num: 19,
      id: 'notifications',
      name: 'Notification Center',
      desc: 'Centralized real-time academic alerts, campus circulars, and reminders.',
      icon: 'Bell',
      cat: 'account',
      route: '/account/notifications',
      limits: { retentionDays: 90 },
      settings: { enableWebSocketLiveFeed: true, allowOfficialBroadcasts: true, respectQuietHours: true },
    },
    {
      num: 20,
      id: 'profile',
      name: 'Student Profile',
      desc: 'Student identity, academic credentials, activity ledger, and verified certificates.',
      icon: 'User',
      cat: 'account',
      route: '/account/profile',
      limits: { maxSkillTags: 20 },
      settings: { allowPublicProfileSlug: true, allowCustomHeadline: true, showVerifiedLockerCertificates: true },
    },
    {
      num: 21,
      id: 'settings',
      name: 'Settings',
      desc: 'Theme appearance, language preferences, privacy controls, and account security.',
      icon: 'Settings',
      cat: 'account',
      route: '/account/settings',
      limits: { sessionTimeoutDays: 30 },
      settings: { allowSelfAccountExport: true, allowThemeCustomization: true, allowLanguageSwitch: true },
    },
  ];

  return specs.map((s) => ({
    id: s.id,
    number: s.num,
    name: s.name,
    description: s.desc,
    iconName: s.icon,
    category: s.cat,
    route: s.route,
    enabled: true,
    visible: true,
    maintenanceMode: false,
    maintenanceMessage: `${s.name} is temporarily undergoing administrative maintenance.`,
    accessPermission: 'all',
    limits: s.limits,
    featureSettings: s.settings,
    usageCount: 0,
    history: [],
  }));
}

function createInitialDb(): SuperAdminDatabase {
  const now = new Date().toISOString();
  const roles: AdminRoleDefinition[] = [
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Full platform ownership including availability, global settings, RBAC, security, and backups.',
      permissions: [...ALL_PERMISSIONS],
      isSystem: true,
    },
    {
      id: 'admin',
      name: 'Admin',
      description: 'Operational platform management across features, colleges, events, marketplace, and users.',
      permissions: ['view', 'create', 'edit', 'delete', 'approve', 'publish', 'export', 'configure', 'manage_users'],
      isSystem: true,
    },
    {
      id: 'content_manager',
      name: 'Content Manager',
      description: 'Homepage Builder, Page Management CMS, Navigation, Media Library, and Academic Resources.',
      permissions: ['view', 'create', 'edit', 'publish'],
      isSystem: true,
    },
    {
      id: 'moderator',
      name: 'Moderator',
      description: 'Community moderation, Notes/Market report handling, and student safety enforcement.',
      permissions: ['view', 'edit', 'approve', 'delete'],
      isSystem: true,
    },
    {
      id: 'support_admin',
      name: 'Support Admin',
      description: 'Support Center ticket triage, student assistance replies, and issue status tracking.',
      permissions: ['view', 'create', 'edit'],
      isSystem: true,
    },
    {
      id: 'custom',
      name: 'Custom Role',
      description: 'Configurable role permissions assigned directly by a Super Admin.',
      permissions: ['view', 'edit'],
      isSystem: false,
    },
  ];

  const teamMembers: AdminTeamMember[] = [
    {
      id: 'adm-super-1',
      name: 'Priyanka Kumari',
      email: 'admin@kampus.edu.in',
      roleId: 'super_admin',
      status: 'Active',
      lastLoginAt: null,
      createdAt: now,
    },
    {
      id: 'adm-content-1',
      name: 'Aarav Mehta',
      email: 'content@kampus.edu.in',
      roleId: 'content_manager',
      status: 'Active',
      lastLoginAt: null,
      createdAt: now,
    },
    {
      id: 'adm-mod-1',
      name: 'Neha Verma',
      email: 'mod@kampus.edu.in',
      roleId: 'moderator',
      status: 'Active',
      lastLoginAt: null,
      createdAt: now,
    },
    {
      id: 'adm-support-1',
      name: 'Rohan Nair',
      email: 'support@kampus.edu.in',
      roleId: 'support_admin',
      status: 'Active',
      lastLoginAt: null,
      createdAt: now,
    },
  ];

  const defaultPass = hashPassword('KampusAdmin@2026');
  const credentials: StoredAdminCredential[] = teamMembers.map((m) => ({
    adminId: m.id,
    passwordSalt: defaultPass.salt,
    passwordHash: defaultPass.hash,
  }));

  const websiteConfig = defaultWebsiteConfig();
  const homepageSections = defaultHomepageSections();

  const mediaAssets: MediaAssetRecord[] = [
    {
      id: 'med-hero-1',
      name: 'Hero Campus Collaboration',
      folder: 'Homepage',
      mimeType: 'image/jpeg',
      sizeBytes: 248000,
      url: '/src/assets/images/hero_students_campus_1794449577723.jpg',
      uploadedBy: 'System Seed',
      uploadedAt: now,
      usageRefs: [],
    },
    {
      id: 'med-ai-1',
      name: 'KAMPUS AI Copilot Cover',
      folder: 'Homepage',
      mimeType: 'image/jpeg',
      sizeBytes: 214000,
      url: '/src/assets/images/ai_study_copilot_1794449593187.jpg',
      uploadedBy: 'System Seed',
      uploadedAt: now,
      usageRefs: [],
    },
    {
      id: 'med-campus-1',
      name: 'Campus Life Cultural Fest',
      folder: 'Banners',
      mimeType: 'image/jpeg',
      sizeBytes: 230000,
      url: '/src/assets/images/campus_life_activities_1794488255584.jpg',
      uploadedBy: 'System Seed',
      uploadedAt: now,
      usageRefs: [],
    },
    {
      id: 'med-career-1',
      name: 'Career Mentorship Workshop',
      folder: 'Banners',
      mimeType: 'image/jpeg',
      sizeBytes: 221000,
      url: '/src/assets/images/career_students_workshop_1794488271245.jpg',
      uploadedBy: 'System Seed',
      uploadedAt: now,
      usageRefs: [],
    },
    {
      id: 'med-brand-1',
      name: 'KAMPUS Pass Identity Mark',
      folder: 'Logos & Brand',
      mimeType: 'image/jpeg',
      sizeBytes: 185000,
      url: '/src/assets/images/rewards_campus_pass_1794643813947.jpg',
      uploadedBy: 'System Seed',
      uploadedAt: now,
      usageRefs: [],
    },
  ];

  return {
    tokenSecret: crypto.randomBytes(32).toString('hex'),
    roles,
    teamMembers,
    credentials,
    sessions: [],
    loginEvents: [],
    websiteConfig,
    websiteVersions: [
      {
        id: 'wver-init',
        createdAt: now,
        createdBy: 'System Seed',
        note: 'Initial platform baseline configuration',
        snapshot: websiteConfig,
      },
    ],
    homepageDraft: homepageSections,
    homepagePublished: homepageSections,
    homepageVersions: [
      {
        id: 'hver-init',
        publishedAt: now,
        publishedBy: 'System Seed',
        note: 'Initial production homepage layout',
        sections: homepageSections,
      },
    ],
    pages: defaultPages(),
    navigation: defaultNavigation(),
    features: defaultFeatures(),
    suspendedUserIds: [],
    userNotes: {},
    academicSubjects: [
      { id: 'subj-1', code: 'CS-301', name: 'Distributed Systems', stream: 'Computer Science', semester: 'Semester 6', credits: 4, status: 'Active' },
      { id: 'subj-2', code: 'CS-302', name: 'Advanced Algorithms & Graph Theory', stream: 'Computer Science', semester: 'Semester 6', credits: 4, status: 'Active' },
      { id: 'subj-3', code: 'CS-303', name: 'Artificial Intelligence & Neural Networks', stream: 'Computer Science', semester: 'Semester 6', credits: 4, status: 'Active' },
      { id: 'subj-4', code: 'CS-304', name: 'Database Management Systems', stream: 'Computer Science', semester: 'Semester 6', credits: 4, status: 'Active' },
      { id: 'subj-5', code: 'MA-201', name: 'Probability & Linear Algebra', stream: 'Mathematics & Data Science', semester: 'Semester 4', credits: 3, status: 'Active' },
    ],
    academicCourses: [
      { id: 'crs-1', name: 'B.Tech in Computer Science & AI', degreeLevel: 'UG', stream: 'Computer Science', durationYears: 4, status: 'Active' },
      { id: 'crs-2', name: 'B.Tech in Electronics & Communication', degreeLevel: 'UG', stream: 'Electronics', durationYears: 4, status: 'Active' },
      { id: 'crs-3', name: 'M.Tech in Machine Intelligence', degreeLevel: 'PG', stream: 'Computer Science', durationYears: 2, status: 'Active' },
    ],
    academicResources: [
      { id: 'res-1', title: 'Raft & Paxos Consensus Complete Notes', subjectCode: 'CS-301', category: 'Notes', status: 'Approved', uploadedBy: 'Aditya Sharma', createdAt: now },
      { id: 'res-2', title: 'Tree DP & Centroid Decomposition Formula Sheet', subjectCode: 'CS-302', category: 'Formula Sheet', status: 'Approved', uploadedBy: 'Priya Sharma', createdAt: now },
      { id: 'res-3', title: 'DBMS Indexing & B+ Tree Past Paper Solutions', subjectCode: 'CS-304', category: 'PYQ', status: 'Pending Approval', uploadedBy: 'Karan Patel', createdAt: now },
    ],
    academicStreams: ['Computer Science', 'Electronics', 'Mechanical Engineering', 'Mathematics & Data Science', 'Management'],
    communityRules: {
      requireVerifiedForLinks: true,
      autoFlagThreshold: 3,
      allowAnonymousVoice: true,
      blockedKeywords: ['spam-link', 'phishing', 'exam-leak'],
      pinnedNotice: 'Keep peer discussions respectful, cite academic sources, and never share private credentials.',
    },
    contentStatusOverrides: {},
    marketRules: {
      maxActiveListingsPerStudent: 10,
      requireCollegeVerification: true,
      prohibitedKeywords: ['weapon', 'alcohol', 'tobacco', 'question-paper-leak'],
      escrowGuidance: 'Meet in verified campus common zones (Library Plaza / Student Activity Center) before confirming handover.',
    },
    notificationPolicies: {
      enableBroadcasts: true,
      dailyDigestHour: '08:00',
      retentionDays: 90,
      templates: [
        {
          id: 'tpl-exam',
          name: 'Examination Schedule Circular',
          category: 'Academic',
          titleTemplate: 'Exam Schedule Update: {{examName}}',
          bodyTemplate: 'Official examination timetable details have been updated. Verify your hall and reporting time in KAMPUS Planner.',
        },
        {
          id: 'tpl-maint',
          name: 'Platform Maintenance Advisory',
          category: 'System',
          titleTemplate: 'Scheduled KAMPUS Maintenance Window',
          bodyTemplate: 'Platform maintenance is scheduled for {{window}}. Save active drafts beforehand.',
        },
      ],
    },
    ads: [
      {
        id: 'ad-campus-techfest',
        title: 'Inter-College GenAI Buildathon 2026',
        subtitle: 'Open for student teams across Computer Science, Design, and Systems tracks.',
        placement: 'Homepage Banner',
        imageUrl: '/src/assets/images/campus_hackathon_1794407584703.jpg',
        targetUrl: '/campus/events-clubs',
        ctaLabel: 'View Event Details',
        status: 'Active',
        startDate: now.slice(0, 10),
        endDate: '2026-12-31',
        impressions: 0,
        clicks: 0,
        updatedAt: now,
      },
    ],
    mediaAssets,
    supportTickets: [],
    auditLogs: [
      {
        id: 'aud-init',
        actor: 'System Seed',
        actorRole: 'super_admin',
        action: 'INITIALIZE_SUPER_ADMIN_CONTROL_CENTER',
        target: 'Platform Core',
        timestamp: now,
        result: 'Success',
      },
    ],
    backups: [],
    retentionConfig: {
      auditLogDays: 365,
      resolvedTicketDays: 180,
      backupRetentionCount: 15,
    },
  };
}

function loadDb(): SuperAdminDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as Partial<SuperAdminDatabase>;
      const fallback = createInitialDb();
      return {
        ...fallback,
        ...raw,
        websiteConfig: { ...fallback.websiteConfig, ...(raw.websiteConfig || {}) },
        navigation: { ...fallback.navigation, ...(raw.navigation || {}) },
        communityRules: { ...fallback.communityRules, ...(raw.communityRules || {}) },
        marketRules: { ...fallback.marketRules, ...(raw.marketRules || {}) },
        notificationPolicies: { ...fallback.notificationPolicies, ...(raw.notificationPolicies || {}) },
        retentionConfig: { ...fallback.retentionConfig, ...(raw.retentionConfig || {}) },
      };
    }
  } catch {
    // rebuild clean database if corrupted
  }
  const initial = createInitialDb();
  writeJsonSafe(DB_PATH, initial);
  return initial;
}

function saveDb(db: SuperAdminDatabase): void {
  writeJsonSafe(DB_PATH, db);
}

function appendAudit(
  db: SuperAdminDatabase,
  actor: string,
  actorRole: string,
  action: string,
  target: string,
  result: AuditLogEntry['result'] = 'Success',
  metadata?: Record<string, unknown>
): void {
  db.auditLogs.unshift({
    id: `aud-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    actor,
    actorRole,
    action,
    target,
    timestamp: new Date().toISOString(),
    result,
    metadata,
  });
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
}

function signSessionToken(secret: string, sessionId: string, adminId: string): string {
  const payload = `${sessionId}.${adminId}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySessionToken(db: SuperAdminDatabase, token: string): { session: AdminSessionRecord; member: AdminTeamMember } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [sessionId, adminId, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', db.tokenSecret).update(`${sessionId}.${adminId}`).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const session = db.sessions.find((s) => s.id === sessionId && s.adminId === adminId && s.active);
  if (!session) return null;

  const member = db.teamMembers.find((m) => m.id === adminId && m.status === 'Active');
  if (!member) return null;

  return { session, member };
}

function getEffectivePermissions(db: SuperAdminDatabase, member: AdminTeamMember): AdminPermission[] {
  if (member.roleId === 'custom' && Array.isArray(member.customPermissions)) {
    return member.customPermissions;
  }
  const role = db.roles.find((r) => r.id === member.roleId);
  return role ? role.permissions : ['view'];
}

function computeFeatureUsageMap(db: SuperAdminDatabase): Record<string, number> {
  const pulse = safeReadJson<any>(STORE_PATHS.campusPulse);
  const career = safeReadJson<any>(STORE_PATHS.career);
  const chat = safeReadJson<any>(STORE_PATHS.chat);
  const explorer = safeReadJson<any>(STORE_PATHS.collegeExplorer);
  const events = safeReadJson<any>(STORE_PATHS.eventsClubs);
  const kampusId = safeReadJson<any>(STORE_PATHS.kampusId);
  const locker = safeReadJson<any>(STORE_PATHS.locker);
  const market = safeReadJson<any>(STORE_PATHS.market);
  const notifs = safeReadJson<any>(STORE_PATHS.notifications);
  const planner = safeReadJson<any>(STORE_PATHS.planner);
  const rewards = safeReadJson<any>(STORE_PATHS.rewards);
  const skillswap = safeReadJson<any>(STORE_PATHS.skillswap);
  const voice = safeReadJson<any>(STORE_PATHS.studentVoice);
  const rooms = safeReadJson<any>(STORE_PATHS.studyRooms);
  const account = safeReadJson<any>(STORE_PATHS.account);

  return {
    'study-hub': db.academicResources.length + db.academicSubjects.length,
    'kampus-ai': (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') ? 1 : 0,
    'notes-exchange': db.academicResources.filter((r) => r.category === 'Notes').length,
    'study-partner': Object.keys(account?.profiles || {}).length,
    'community': (pulse?.submissions || []).length + (voice?.ideas || []).length,
    'chat': (chat?.messages || []).length,
    'study-rooms': (rooms?.rooms || []).length,
    'skillswap': (skillswap?.listings || []).length + (skillswap?.exchanges || []).length,
    'campus-pulse': (pulse?.announcements || []).length + (pulse?.polls || []).length,
    'events-clubs': (events?.events || []).length + (events?.clubs || []).length,
    'kampus-id': Object.keys(kampusId?.identitiesByUser || {}).length,
    'student-voice': (voice?.submissions || []).length + (voice?.polls || []).length,
    'career': (career?.opportunities || []).length + (career?.scholarships || []).length + (career?.applications || []).length,
    'college-explorer': (explorer?.colleges || []).length,
    'market': (market?.listings || []).length,
    'digital-locker': (locker?.documents || []).length,
    'rewards': (rewards?.transactions || []).length + (rewards?.challenges || []).length,
    'planner': (planner?.tasks || []).length + (planner?.events || []).length + (planner?.exams || []).length,
    'notifications': (notifs?.notifications || []).length + (notifs?.announcements || []).length,
    'profile': Object.keys(account?.profiles || {}).length,
    'settings': Object.keys(account?.settings || {}).length,
  };
}

function aggregateUnifiedUsers(db: SuperAdminDatabase): AdminUserRecord[] {
  const account = safeReadJson<any>(STORE_PATHS.account) || {};
  const chat = safeReadJson<any>(STORE_PATHS.chat) || {};
  const kampusId = safeReadJson<any>(STORE_PATHS.kampusId) || {};
  const skillswap = safeReadJson<any>(STORE_PATHS.skillswap) || {};
  const events = safeReadJson<any>(STORE_PATHS.eventsClubs) || {};
  const market = safeReadJson<any>(STORE_PATHS.market) || {};
  const locker = safeReadJson<any>(STORE_PATHS.locker) || {};
  const rewards = safeReadJson<any>(STORE_PATHS.rewards) || {};

  const map = new Map<string, AdminUserRecord>();

  const upsert = (uid: string, patch: Partial<AdminUserRecord>) => {
    const existing = map.get(uid) || {
      userId: uid,
      name: 'KAMPUS Student',
      email: '',
      phone: '',
      college: '',
      course: '',
      semester: '',
      enrollmentNo: uid,
      role: 'Student',
      accountStatus: db.suspendedUserIds.includes(uid) ? 'Suspended' : 'Active',
      isVerified: false,
      reportedCount: 0,
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      activitySummary: { posts: 0, events: 0, listings: 0, lockerDocs: 0, supportTickets: 0, rewardPoints: 0 },
      internalNotes: db.userNotes[uid] || [],
    };
    map.set(uid, {
      ...existing,
      ...patch,
      accountStatus: db.suspendedUserIds.includes(uid) ? 'Suspended' : 'Active',
      internalNotes: db.userNotes[uid] || [],
    });
  };

  for (const [uid, p] of Object.entries<any>(account.profiles || {})) {
    upsert(uid, {
      name: p.fullName || p.name || 'KAMPUS Student',
      email: p.email || '',
      phone: p.phone || '',
      college: p.college || '',
      course: p.course || '',
      semester: p.semester || '',
      enrollmentNo: p.enrollmentNo || uid,
      role: account.modRoleOverrides?.[uid]?.role || 'Student',
      isVerified: Boolean(p.isVerified || p.badgeVerified),
      registeredAt: p.createdAt || new Date().toISOString(),
      lastActiveAt: p.updatedAt || p.createdAt || new Date().toISOString(),
    });
  }

  for (const st of chat.students || []) {
    const uid = st.id || st.userId;
    if (uid && !map.has(uid)) {
      upsert(uid, {
        name: st.name || 'Student',
        college: st.college || '',
        course: st.course || '',
        semester: st.semester || '',
        isVerified: true,
      });
    }
  }

  for (const [uid, idRec] of Object.entries<any>(kampusId.identitiesByUser || {})) {
    upsert(uid, {
      name: idRec.fullName || map.get(uid)?.name || 'Student',
      enrollmentNo: idRec.enrollmentNo || uid,
      college: idRec.institution || map.get(uid)?.college || '',
      isVerified: idRec.verificationStatus === 'Verified' || Boolean(map.get(uid)?.isVerified),
    });
  }

  for (const sp of skillswap.profiles || []) {
    const uid = sp.userId || sp.id;
    if (uid && !map.has(uid)) {
      upsert(uid, {
        name: sp.name || 'Student',
        course: sp.course || '',
        college: sp.college || '',
        isVerified: true,
      });
    }
  }

  // Enrich with real counts across modules
  const registrations = events.registrations || [];
  const listings = market.listings || [];
  const lockerDocs = locker.documents || [];
  const wallets = rewards.wallets || {};
  const tickets = account.supportTickets || [];
  const allReports = [
    ...(account.reports || []),
    ...(market.reports || []),
    ...(skillswap.reports || []),
  ];

  for (const [uid, rec] of map.entries()) {
    rec.activitySummary = {
      posts: (skillswap.listings || []).filter((l: any) => l.userId === uid).length,
      events: registrations.filter((r: any) => r.userId === uid).length,
      listings: listings.filter((l: any) => l.sellerId === uid || l.userId === uid).length,
      lockerDocs: lockerDocs.filter((d: any) => d.userId === uid).length,
      supportTickets: tickets.filter((t: any) => t.userId === uid).length,
      rewardPoints: wallets[uid]?.availablePoints || 0,
    };
    rec.reportedCount = allReports.filter(
      (r: any) => r.targetUserId === uid || r.reportedUserId === uid
    ).length;
  }

  return Array.from(map.values());
}

function aggregateUnifiedContent(db: SuperAdminDatabase): UnifiedContentItem[] {
  const items: UnifiedContentItem[] = [];
  const pulse = safeReadJson<any>(STORE_PATHS.campusPulse) || {};
  const career = safeReadJson<any>(STORE_PATHS.career) || {};
  const explorer = safeReadJson<any>(STORE_PATHS.collegeExplorer) || {};
  const events = safeReadJson<any>(STORE_PATHS.eventsClubs) || {};
  const market = safeReadJson<any>(STORE_PATHS.market) || {};

  const applyOverride = (id: string, fallbackStatus: UnifiedContentItem['status'], fallbackFeatured = false) => {
    const ov = db.contentStatusOverrides[id];
    return {
      status: ov?.status || fallbackStatus,
      featured: ov?.featured ?? fallbackFeatured,
    };
  };

  for (const r of db.academicResources) {
    const ov = applyOverride(r.id, r.status === 'Approved' ? 'Published' : r.status === 'Rejected' ? 'Rejected' : 'Pending Review');
    items.push({
      id: r.id,
      module: r.category === 'Notes' ? 'Notes Exchange' : 'Study Hub',
      title: `${r.subjectCode}: ${r.title}`,
      author: r.uploadedBy,
      category: r.category,
      ...ov,
      createdAt: r.createdAt,
      summary: `Subject resource (${r.category})`,
    });
  }

  for (const a of pulse.announcements || []) {
    const ov = applyOverride(a.id, 'Published');
    items.push({
      id: a.id,
      module: 'Community',
      title: a.title,
      author: a.publisherName || 'Campus Office',
      category: a.category || 'Circular',
      ...ov,
      createdAt: a.publishedAt || a.createdAt || new Date().toISOString(),
      summary: (a.summary || a.body || '').slice(0, 140),
    });
  }

  for (const opp of career.opportunities || []) {
    const ov = applyOverride(opp.id, opp.status === 'Closed' ? 'Archived' : 'Published');
    items.push({
      id: opp.id,
      module: 'Career',
      title: `${opp.title} — ${opp.companyName || opp.organization || 'Partner'}`,
      author: opp.postedBy || 'T&P Cell',
      category: opp.type || 'Opportunity',
      ...ov,
      createdAt: opp.createdAt || new Date().toISOString(),
      summary: opp.location || 'Campus Placement / Internship',
    });
  }

  for (const col of explorer.colleges || []) {
    const ov = applyOverride(col.id, col.verificationStatus === 'Verified' ? 'Published' : 'Pending Review');
    items.push({
      id: col.id,
      module: 'College Explorer',
      title: col.name,
      author: col.city ? `${col.city}, ${col.state || ''}` : 'Directory',
      category: col.type || 'Institution',
      ...ov,
      createdAt: col.updatedAt || new Date().toISOString(),
      summary: col.website || 'Higher education record',
    });
  }

  for (const ev of events.events || []) {
    const ov = applyOverride(ev.id, ev.status === 'Cancelled' ? 'Archived' : 'Published');
    items.push({
      id: ev.id,
      module: 'Events',
      title: ev.title,
      author: ev.organizerName || 'Campus Club',
      category: ev.category || 'Event',
      ...ov,
      createdAt: ev.dateISO || new Date().toISOString(),
      summary: ev.venue || 'Campus Venue',
    });
  }

  for (const lst of market.listings || []) {
    const ov = applyOverride(lst.id, lst.status === 'Removed' ? 'Rejected' : 'Published');
    items.push({
      id: lst.id,
      module: 'Marketplace',
      title: lst.title,
      author: lst.sellerName || 'Student Seller',
      category: lst.category || 'Item',
      ...ov,
      createdAt: lst.createdAt || new Date().toISOString(),
      summary: lst.price !== undefined ? `₹${lst.price} · ${lst.condition || 'Used'}` : 'Marketplace listing',
    });
  }

  return items;
}

function aggregateSupportTickets(db: SuperAdminDatabase): AdminSupportTicket[] {
  const account = safeReadJson<any>(STORE_PATHS.account) || {};
  const pulse = safeReadJson<any>(STORE_PATHS.campusPulse) || {};
  const market = safeReadJson<any>(STORE_PATHS.market) || {};
  const skillswap = safeReadJson<any>(STORE_PATHS.skillswap) || {};
  const voice = safeReadJson<any>(STORE_PATHS.studentVoice) || {};

  const existingById = new Map(db.supportTickets.map((t) => [t.id, t]));
  const combined: AdminSupportTicket[] = [...db.supportTickets];

  const pushIfNew = (item: AdminSupportTicket) => {
    if (!existingById.has(item.id)) {
      combined.push(item);
      existingById.set(item.id, item);
    }
  };

  for (const t of account.supportTickets || []) {
    pushIfNew({
      id: t.id,
      sourceModule: 'Account Settings',
      type: t.category === 'Bug' ? 'Bug Report' : 'Account Problem',
      subject: t.subject || 'Support Request',
      description: t.description || '',
      requesterName: t.userName || t.userId || 'Student',
      requesterId: t.userId || 'unknown',
      priority: 'Medium',
      status: t.status === 'Resolved' ? 'Resolved' : 'Open',
      assignedTo: null,
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: t.updatedAt || t.createdAt || new Date().toISOString(),
      internalNotes: [],
      replies: [],
    });
  }

  for (const r of [...(account.reports || []), ...(market.reports || []), ...(skillswap.reports || []), ...(pulse.reports || [])]) {
    const rid = r.id || `rep-${r.targetId || Date.now()}`;
    pushIfNew({
      id: rid,
      sourceModule: r.targetType ? 'Account/Market' : 'Moderation',
      type: r.reason?.toLowerCase().includes('safety') ? 'Safety Report' : 'Content Report',
      subject: r.reason || 'Content / Safety Report',
      description: r.details || r.targetSummary || `Target: ${r.targetId || 'record'}`,
      requesterName: r.reporterName || r.reporterId || 'Student',
      requesterId: r.reporterId || 'unknown',
      priority: 'High',
      status: r.status === 'Resolved' ? 'Resolved' : 'Open',
      assignedTo: null,
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.createdAt || new Date().toISOString(),
      internalNotes: [],
      replies: [],
    });
  }

  for (const sub of voice.submissions || []) {
    pushIfNew({
      id: sub.id,
      sourceModule: 'Student Voice',
      type: 'Complaint',
      subject: sub.title || 'Student Voice Grievance',
      description: sub.description || '',
      requesterName: sub.isAnonymous ? 'Confidential Student' : sub.studentName || 'Student',
      requesterId: sub.userId || 'anonymous',
      priority: sub.urgency === 'Urgent' ? 'Urgent' : 'Medium',
      status: sub.status === 'Resolved' ? 'Resolved' : 'Open',
      assignedTo: null,
      createdAt: sub.createdAt || new Date().toISOString(),
      updatedAt: sub.updatedAt || sub.createdAt || new Date().toISOString(),
      internalNotes: [],
      replies: [],
    });
  }

  return combined.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function scanMediaReferences(db: SuperAdminDatabase, url: string): string[] {
  const refs: string[] = [];
  if (db.websiteConfig.logoUrl === url) refs.push('Website Identity: Logo');
  if (db.websiteConfig.faviconUrl === url) refs.push('Website Identity: Favicon');
  if (db.websiteConfig.ogImage === url) refs.push('Website SEO: OG Image');
  for (const s of db.homepageDraft) {
    if (s.imageUrl === url) refs.push(`Homepage Draft: ${s.label}`);
  }
  for (const s of db.homepagePublished) {
    if (s.imageUrl === url) refs.push(`Homepage Live: ${s.label}`);
  }
  for (const p of db.pages) {
    if (p.coverImageUrl === url) refs.push(`CMS Page Cover: ${p.title}`);
    for (const b of p.blocks) {
      if (b.imageUrl === url) refs.push(`CMS Page Block: ${p.title}`);
    }
  }
  for (const ad of db.ads) {
    if (ad.imageUrl === url) refs.push(`Ad Campaign: ${ad.title}`);
  }
  return refs;
}

function getIntegrationStatuses(): IntegrationStatusItem[] {
  const now = new Date().toISOString();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== 'MY_GEMINI_API_KEY');
  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
  const hasVapid = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  const hasPayment = Boolean(process.env.STRIPE_SECRET_KEY || process.env.RAZORPAY_KEY_ID);
  const dbReady = Object.values(STORE_PATHS).some((p) => fs.existsSync(p));
  const storageWritable = ensureDir(MEDIA_DIR) && ensureDir(BACKUP_DIR);

  return [
    {
      id: 'int-auth',
      name: 'KAMPUS Session & Admin HMAC Auth',
      category: 'Authentication',
      connectionStatus: 'Connected',
      configurationStatus: 'Configured',
      lastCheckedAt: now,
      details: 'Scrypt credential hashing + signed HMAC-SHA256 admin session tokens active.',
      supportsTest: true,
    },
    {
      id: 'int-db',
      name: 'Domain JSON Persistence Stores',
      category: 'Database',
      connectionStatus: dbReady ? 'Connected' : 'Degraded',
      configurationStatus: 'Local Adapter',
      lastCheckedAt: now,
      details: `${Object.values(STORE_PATHS).filter((p) => fs.existsSync(p)).length} active domain stores detected in workspace.`,
      supportsTest: true,
    },
    {
      id: 'int-storage',
      name: 'Local Media & Backup File Storage',
      category: 'Storage',
      connectionStatus: storageWritable ? 'Connected' : 'Degraded',
      configurationStatus: storageWritable ? 'Configured' : 'Missing Secrets',
      lastCheckedAt: now,
      details: storageWritable ? 'Media library and backup snapshot directories are writable.' : 'Storage directories unavailable.',
      supportsTest: true,
    },
    {
      id: 'int-gemini',
      name: 'Google Gemini AI Provider',
      category: 'AI Provider',
      connectionStatus: hasGemini ? 'Connected' : 'Not Configured',
      configurationStatus: hasGemini ? 'Configured' : 'Missing Secrets',
      lastCheckedAt: now,
      details: hasGemini ? 'GEMINI_API_KEY configured for server-side KAMPUS AI proxy.' : 'GEMINI_API_KEY environment secret is not configured.',
      supportsTest: true,
    },
    {
      id: 'int-email',
      name: 'SMTP Email Delivery',
      category: 'Email',
      connectionStatus: hasSmtp ? 'Connected' : 'Not Configured',
      configurationStatus: hasSmtp ? 'Configured' : 'Missing Secrets',
      lastCheckedAt: now,
      details: hasSmtp ? 'SMTP relay credentials detected.' : 'SMTP_HOST / SMTP_USER not configured; in-app notifications active.',
      supportsTest: false,
    },
    {
      id: 'int-push',
      name: 'Web Push VAPID Service',
      category: 'Push',
      connectionStatus: hasVapid ? 'Connected' : 'Not Configured',
      configurationStatus: hasVapid ? 'Configured' : 'Missing Secrets',
      lastCheckedAt: now,
      details: hasVapid ? 'VAPID keys configured for push delivery.' : 'WebSocket real-time alerts active; external VAPID keys unset.',
      supportsTest: false,
    },
    {
      id: 'int-payment',
      name: 'Payment Gateway',
      category: 'Payment',
      connectionStatus: hasPayment ? 'Connected' : 'Not Configured',
      configurationStatus: hasPayment ? 'Configured' : 'Missing Secrets',
      lastCheckedAt: now,
      details: hasPayment ? 'Payment provider key configured.' : 'Not configured (KAMPUS Market operates on zero-brokerage peer handshake).',
      supportsTest: false,
    },
  ];
}

function getSystemHealth(db: SuperAdminDatabase): SystemHealthSnapshot {
  const mem = process.memoryUsage();
  const existingDbFiles = Object.values(STORE_PATHS).filter((p) => fs.existsSync(p));
  if (fs.existsSync(DB_PATH)) existingDbFiles.push(DB_PATH);
  const totalBytes = existingDbFiles.reduce((acc, p) => {
    try {
      return acc + fs.statSync(p).size;
    } catch {
      return acc;
    }
  }, 0);

  const recentErrors = db.loginEvents
    .filter((e) => !e.success)
    .slice(0, 8)
    .map((e) => ({
      timestamp: e.timestamp,
      source: 'Admin Auth',
      message: `${e.email}: ${e.reason}`,
    }));

  return {
    appStatus: 'Healthy',
    backendUptimeSeconds: Math.round(process.uptime()),
    memoryRssMb: Math.round((mem.rss / (1024 * 1024)) * 10) / 10,
    memoryHeapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 10) / 10,
    nodeVersion: process.version,
    buildMode: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    databaseFilesCount: existingDbFiles.length,
    databaseTotalBytes: totalBytes,
    storageWritable: ensureDir(MEDIA_DIR) && ensureDir(BACKUP_DIR),
    mediaCount: db.mediaAssets.length,
    recentErrors,
    checkedAt: new Date().toISOString(),
  };
}

export function registerSuperAdminBackend(app: Express): void {
  ensureDir(MEDIA_DIR);
  ensureDir(BACKUP_DIR);
  // Seed file on boot if absent
  loadDb();

  const requireAdminAuth =
    (requiredPermission?: AdminPermission, requireSuperAdminOnly = false) =>
    (req: Request, res: Response, next: NextFunction) => {
      const db = loadDb();
      const rawAuth = req.header('X-Admin-Token') || req.header('Authorization')?.replace(/^Bearer\s+/i, '') || '';
      const verified = verifySessionToken(db, rawAuth.trim());
      if (!verified) {
        return res.status(401).json({
          code: 'ADMIN_UNAUTHORIZED',
          message: 'Valid Super Admin authentication session is required.',
        });
      }

      if (requireSuperAdminOnly && verified.member.roleId !== 'super_admin') {
        appendAudit(db, verified.member.email, verified.member.roleId, `DENIED_SUPER_ADMIN_ONLY:${req.path}`, req.path, 'Denied');
        saveDb(db);
        return res.status(403).json({
          code: 'SUPER_ADMIN_REQUIRED',
          message: 'This critical action requires Super Admin privileges.',
        });
      }

      const perms = getEffectivePermissions(db, verified.member);
      if (requiredPermission && !perms.includes(requiredPermission)) {
        appendAudit(db, verified.member.email, verified.member.roleId, `DENIED_PERMISSION:${requiredPermission}`, req.path, 'Denied');
        saveDb(db);
        return res.status(403).json({
          code: 'PERMISSION_DENIED',
          message: `Your role (${verified.member.roleId}) lacks the "${requiredPermission}" permission.`,
        });
      }

      verified.session.lastActiveAt = new Date().toISOString();
      saveDb(db);
      (req as any).adminMember = verified.member;
      (req as any).adminSession = verified.session;
      (req as any).adminPermissions = perms;
      next();
    };

  // =========================================================
  // PUBLIC CONFIG ENDPOINTS (Consumed live by Student App)
  // =========================================================
  app.get('/api/public/site-config', (_req: Request, res: Response) => {
    const db = loadDb();
    const now = new Date().toISOString().slice(0, 10);
    const activeAds = db.ads.filter((ad) => ad.status === 'Active' && (!ad.endDate || ad.endDate >= now));
    const payload: PublicPlatformConfig = {
      website: db.websiteConfig,
      homepageSections: [...db.homepagePublished].sort((a, b) => a.order - b.order),
      navigation: db.navigation,
      features: db.features.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        iconName: f.iconName,
        category: f.category,
        route: f.route,
        enabled: f.enabled,
        visible: f.visible,
        maintenanceMode: f.maintenanceMode,
        maintenanceMessage: f.maintenanceMessage,
        accessPermission: f.accessPermission,
      })),
      ads: activeAds,
      pages: db.pages
        .filter((p) => p.status === 'Published')
        .map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          pageType: p.pageType,
          status: p.status,
          visibility: p.visibility,
        })),
    };
    res.json(payload);
  });

  app.get('/api/public/pages/:slug', (req: Request, res: Response) => {
    const db = loadDb();
    const slug = String(req.params.slug || '').toLowerCase().trim();
    const page = db.pages.find((p) => p.slug.toLowerCase() === slug && p.status === 'Published');
    if (!page) {
      return res.status(404).json({ code: 'PAGE_NOT_FOUND', message: 'Requested CMS page is unavailable or unpublished.' });
    }
    res.json({ page });
  });

  app.post('/api/public/ads/:id/track', (req: Request, res: Response) => {
    const db = loadDb();
    const ad = db.ads.find((a) => a.id === req.params.id);
    if (!ad) return res.status(404).json({ error: 'Not found' });
    const kind = req.body?.event === 'click' ? 'clicks' : 'impressions';
    ad[kind] += 1;
    saveDb(db);
    res.json({ ok: true, impressions: ad.impressions, clicks: ad.clicks });
  });

  app.post('/api/public/check-student-access', (req: Request, res: Response) => {
    const db = loadDb();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const users = aggregateUnifiedUsers(db);
    const matched = users.find((u) => u.email.toLowerCase() === email || u.enrollmentNo.toLowerCase() === email);
    const suspended = matched ? db.suspendedUserIds.includes(matched.userId) : false;
    res.json({
      allowLogin: db.websiteConfig.allowLogin,
      allowRegistration: db.websiteConfig.allowRegistration,
      maintenanceMode: db.websiteConfig.maintenanceMode,
      siteActive: db.websiteConfig.siteActive,
      suspended,
    });
  });

  app.get('/api/admin/media/file/:id', (req: Request, res: Response) => {
    const db = loadDb();
    const asset = db.mediaAssets.find((m) => m.id === req.params.id);
    if (!asset) return res.status(404).send('Media not found');
    if (asset.url.startsWith('/src/')) {
      return res.redirect(asset.url);
    }
    const diskPath = path.join(MEDIA_DIR, asset.id);
    if (!fs.existsSync(diskPath)) {
      return res.status(404).send('Media file missing from disk');
    }
    res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
    fs.createReadStream(diskPath).pipe(res);
  });

  // =========================================================
  // ADMIN AUTHENTICATION & SESSIONS
  // =========================================================
  app.post('/api/admin/auth/login', (req: Request, res: Response) => {
    const db = loadDb();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const ua = String(req.header('user-agent') || 'Unknown Browser');
    const ip = String(req.ip || req.socket.remoteAddress || '127.0.0.1');

    const member = db.teamMembers.find((m) => m.email.toLowerCase() === email);
    const cred = member ? db.credentials.find((c) => c.adminId === member.id) : null;

    if (!member || !cred || !verifyPassword(password, cred.passwordSalt, cred.passwordHash)) {
      db.loginEvents.unshift({
        id: `log-${Date.now()}`,
        email: email || 'unknown',
        success: false,
        reason: 'Invalid administrator email or password',
        timestamp: new Date().toISOString(),
        ipAddress: ip,
        userAgent: ua,
      });
      db.loginEvents = db.loginEvents.slice(0, 200);
      saveDb(db);
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid administrator credentials.',
      });
    }

    if (member.status !== 'Active') {
      db.loginEvents.unshift({
        id: `log-${Date.now()}`,
        email: member.email,
        adminName: member.name,
        roleId: member.roleId,
        success: false,
        reason: 'Administrator account is suspended',
        timestamp: new Date().toISOString(),
        ipAddress: ip,
        userAgent: ua,
      });
      saveDb(db);
      return res.status(403).json({
        code: 'ACCOUNT_SUSPENDED',
        message: 'This administrator account is currently suspended.',
      });
    }

    const sessionId = `adm-sess-${crypto.randomBytes(6).toString('hex')}`;
    const now = new Date().toISOString();
    const session: AdminSessionRecord = {
      id: sessionId,
      adminId: member.id,
      adminEmail: member.email,
      adminName: member.name,
      roleId: member.roleId,
      createdAt: now,
      lastActiveAt: now,
      userAgent: ua,
      ipAddress: ip,
      active: true,
    };
    db.sessions.unshift(session);
    member.lastLoginAt = now;
    db.loginEvents.unshift({
      id: `log-${Date.now()}`,
      email: member.email,
      adminName: member.name,
      roleId: member.roleId,
      success: true,
      reason: 'Authenticated via KAMPUS Admin Portal',
      timestamp: now,
      ipAddress: ip,
      userAgent: ua,
    });
    appendAudit(db, member.email, member.roleId, 'ADMIN_LOGIN', 'Admin Portal Session', 'Success');
    saveDb(db);

    const token = signSessionToken(db.tokenSecret, sessionId, member.id);
    const permissions = getEffectivePermissions(db, member);
    const roleDef = db.roles.find((r) => r.id === member.roleId);
    res.json({
      token,
      admin: member,
      roleName: roleDef?.name || member.roleId,
      permissions,
      session,
    });
  });

  app.get('/api/admin/auth/session', requireAdminAuth('view'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const roleDef = db.roles.find((r) => r.id === member.roleId);
    res.json({
      admin: member,
      roleName: roleDef?.name || member.roleId,
      permissions: (req as any).adminPermissions,
      session: (req as any).adminSession,
    });
  });

  app.post('/api/admin/auth/logout', requireAdminAuth(), (req: Request, res: Response) => {
    const db = loadDb();
    const session = (req as any).adminSession as AdminSessionRecord;
    const member = (req as any).adminMember as AdminTeamMember;
    const target = db.sessions.find((s) => s.id === session.id);
    if (target) target.active = false;
    appendAudit(db, member.email, member.roleId, 'ADMIN_LOGOUT', 'Admin Portal Session', 'Success');
    saveDb(db);
    res.json({ ok: true });
  });

  // =========================================================
  // OVERVIEW, GLOBAL SEARCH & ANALYTICS
  // =========================================================
  app.get('/api/admin/overview', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    const users = aggregateUnifiedUsers(db);
    const content = aggregateUnifiedContent(db);
    const tickets = aggregateSupportTickets(db);
    const eventsDb = safeReadJson<any>(STORE_PATHS.eventsClubs) || {};
    const usageMap = computeFeatureUsageMap(db);

    const nowMs = Date.now();
    const sevenDaysMs = 7 * 86400000;
    const newRegistrations = users.filter((u) => nowMs - new Date(u.registeredAt).getTime() <= sevenDaysMs).length;
    const suspendedUsers = users.filter((u) => u.accountStatus === 'Suspended').length;
    const activeUsers = users.filter((u) => u.accountStatus === 'Active').length;
    const activeFeatures = db.features.filter((f) => f.enabled && !f.maintenanceMode).length;
    const pendingReports = tickets.filter((t) => (t.type === 'Content Report' || t.type === 'Safety Report') && t.status !== 'Resolved' && t.status !== 'Closed').length;
    const openSupportTickets = tickets.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length;

    const featureBreakdown = db.features.map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category,
      enabled: f.enabled,
      recordsCount: usageMap[f.id] || 0,
    }));

    const health = getSystemHealth(db);
    const integrations = getIntegrationStatuses();

    res.json({
      metrics: {
        totalUsers: users.length,
        activeUsers,
        newRegistrations,
        suspendedUsers,
        totalPublishedContent: content.filter((c) => c.status === 'Published' || c.status === 'Featured').length,
        totalActiveFeatures: activeFeatures,
        totalFeatures: db.features.length,
        totalEvents: (eventsDb.events || []).length,
        pendingReports,
        pendingSupportTickets: openSupportTickets,
      },
      featureBreakdown,
      recentUsers: users.slice(0, 6),
      recentContent: content.slice(0, 6),
      recentAuditLogs: db.auditLogs.slice(0, 12),
      recentTickets: tickets.slice(0, 6),
      systemHealth: health,
      integrationsSummary: {
        total: integrations.length,
        connected: integrations.filter((i) => i.connectionStatus === 'Connected').length,
        notConfigured: integrations.filter((i) => i.connectionStatus === 'Not Configured').length,
      },
    });
  });

  app.get('/api/admin/analytics', requireAdminAuth('view'), (req: Request, res: Response) => {
    const db = loadDb();
    const fromDate = String(req.query.from || '');
    const toDate = String(req.query.to || '');
    const inRange = (iso?: string) => {
      if (!iso) return true;
      const d = iso.slice(0, 10);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    };

    const users = aggregateUnifiedUsers(db).filter((u) => inRange(u.registeredAt));
    const content = aggregateUnifiedContent(db).filter((c) => inRange(c.createdAt));
    const tickets = aggregateSupportTickets(db).filter((t) => inRange(t.createdAt));
    const eventsDb = safeReadJson<any>(STORE_PATHS.eventsClubs) || {};
    const marketDb = safeReadJson<any>(STORE_PATHS.market) || {};
    const rewardsDb = safeReadJson<any>(STORE_PATHS.rewards) || {};
    const usageMap = computeFeatureUsageMap(db);

    const contentByModule = ['Study Hub', 'Notes Exchange', 'Community', 'Career', 'College Explorer', 'Events', 'Marketplace'].map(
      (mod) => ({
        module: mod,
        count: content.filter((c) => c.module === mod).length,
      })
    );

    const featureRecords = db.features.map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category,
      enabled: f.enabled,
      count: usageMap[f.id] || 0,
    }));

    const marketplaceByCategory: Record<string, number> = {};
    for (const lst of marketDb.listings || []) {
      const cat = lst.category || 'Other';
      marketplaceByCategory[cat] = (marketplaceByCategory[cat] || 0) + 1;
    }

    res.json({
      dateRange: { from: fromDate || null, to: toDate || null },
      usersSummary: {
        totalInRange: users.length,
        verifiedCount: users.filter((u) => u.isVerified).length,
        suspendedCount: users.filter((u) => u.accountStatus === 'Suspended').length,
      },
      contentByModule,
      featureRecords,
      eventsSummary: {
        totalEvents: (eventsDb.events || []).length,
        totalClubs: (eventsDb.clubs || []).length,
        totalRegistrations: (eventsDb.registrations || []).length,
      },
      marketplaceSummary: {
        totalListings: (marketDb.listings || []).length,
        activeCategories: Object.entries(marketplaceByCategory).map(([category, count]) => ({ category, count })),
      },
      rewardsSummary: {
        walletsCount: Object.keys(rewardsDb.wallets || {}).length,
        transactionsCount: (rewardsDb.transactions || []).length,
        redemptionsCount: (rewardsDb.redemptions || []).length,
        activeChallenges: (rewardsDb.challenges || []).length,
      },
      supportSummary: {
        totalTickets: tickets.length,
        openTickets: tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length,
        resolvedTickets: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
      },
    });
  });

  app.get('/api/admin/search', requireAdminAuth('view'), (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const db = loadDb();
    if (!q) return res.json({ results: [] });

    const results: Array<{ kind: string; id: string; title: string; subtitle: string; section: string }> = [];

    for (const u of aggregateUnifiedUsers(db)) {
      if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.enrollmentNo.toLowerCase().includes(q)) {
        results.push({ kind: 'Student', id: u.userId, title: u.name, subtitle: `${u.enrollmentNo} · ${u.college}`, section: 'users' });
      }
    }
    for (const f of db.features) {
      if (f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) {
        results.push({ kind: 'Feature', id: f.id, title: f.name, subtitle: `${f.enabled ? 'Enabled' : 'Disabled'} · ${f.category}`, section: 'features' });
      }
    }
    for (const p of db.pages) {
      if (p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)) {
        results.push({ kind: 'CMS Page', id: p.id, title: p.title, subtitle: `/page/${p.slug} · ${p.status}`, section: 'pages' });
      }
    }
    for (const s of db.homepageDraft) {
      if (s.label.toLowerCase().includes(q) || s.heading.toLowerCase().includes(q)) {
        results.push({ kind: 'Homepage Section', id: s.id, title: s.label, subtitle: s.heading, section: 'homepage' });
      }
    }
    for (const m of db.mediaAssets) {
      if (m.name.toLowerCase().includes(q) || m.folder.toLowerCase().includes(q)) {
        results.push({ kind: 'Media Asset', id: m.id, title: m.name, subtitle: `${m.folder} · ${m.mimeType}`, section: 'media' });
      }
    }
    for (const c of aggregateUnifiedContent(db)) {
      if (c.title.toLowerCase().includes(q) || c.module.toLowerCase().includes(q)) {
        results.push({
          kind: c.module,
          id: c.id,
          title: c.title,
          subtitle: `${c.status} · ${c.author}`,
          section: c.module === 'College Explorer' ? 'colleges' : c.module === 'Events' ? 'events' : c.module === 'Marketplace' ? 'marketplace' : 'content',
        });
      }
    }
    for (const t of aggregateSupportTickets(db)) {
      if (t.subject.toLowerCase().includes(q) || t.requesterName.toLowerCase().includes(q)) {
        results.push({ kind: 'Support Ticket', id: t.id, title: t.subject, subtitle: `${t.status} · ${t.type}`, section: 'support' });
      }
    }

    res.json({ results: results.slice(0, 30) });
  });

  // =========================================================
  // WEBSITE CONTROL CENTER & GLOBAL SETTINGS
  // =========================================================
  app.get('/api/admin/website', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ config: db.websiteConfig, versions: db.websiteVersions });
  });

  app.put('/api/admin/website', requireAdminAuth('configure', true), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const patch = (req.body?.config || req.body) as Partial<WebsiteConfig>;
    const note = String(req.body?.note || 'Updated website configuration');

    const prev = db.websiteConfig;
    const next: WebsiteConfig = {
      ...prev,
      ...patch,
      siteName: String(patch.siteName ?? prev.siteName).trim() || 'KAMPUS',
      updatedAt: new Date().toISOString(),
      updatedBy: member.email,
    };

    db.websiteConfig = next;
    db.websiteVersions.unshift({
      id: `wver-${Date.now()}`,
      createdAt: next.updatedAt,
      createdBy: member.email,
      note,
      snapshot: next,
    });
    db.websiteVersions = db.websiteVersions.slice(0, 30);
    appendAudit(db, member.email, member.roleId, 'UPDATE_WEBSITE_CONFIG', 'Website Control Center', 'Success', {
      siteActive: next.siteActive,
      maintenanceMode: next.maintenanceMode,
      allowRegistration: next.allowRegistration,
    });
    saveDb(db);
    res.json({ config: next, versions: db.websiteVersions });
  });

  app.post('/api/admin/website/restore/:versionId', requireAdminAuth('configure', true), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const ver = db.websiteVersions.find((v) => v.id === req.params.versionId);
    if (!ver) return res.status(404).json({ message: 'Version not found.' });

    db.websiteConfig = {
      ...ver.snapshot,
      updatedAt: new Date().toISOString(),
      updatedBy: `${member.email} (restored)`,
    };
    appendAudit(db, member.email, member.roleId, 'RESTORE_WEBSITE_VERSION', ver.id, 'Success');
    saveDb(db);
    res.json({ config: db.websiteConfig, versions: db.websiteVersions });
  });

  // =========================================================
  // HOMEPAGE VISUAL BUILDER
  // =========================================================
  app.get('/api/admin/homepage', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({
      draft: [...db.homepageDraft].sort((a, b) => a.order - b.order),
      published: [...db.homepagePublished].sort((a, b) => a.order - b.order),
      versions: db.homepageVersions,
    });
  });

  app.put('/api/admin/homepage/draft', requireAdminAuth('edit'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const sections = req.body?.sections as HomepageSectionConfig[];
    if (!Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ message: 'Sections array is required.' });
    }
    db.homepageDraft = sections.map((s, idx) => ({ ...s, order: idx + 1 }));
    appendAudit(db, member.email, member.roleId, 'SAVE_HOMEPAGE_DRAFT', `${db.homepageDraft.length} sections`, 'Success');
    saveDb(db);
    res.json({ draft: db.homepageDraft });
  });

  app.post('/api/admin/homepage/publish', requireAdminAuth('publish'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const sections = Array.isArray(req.body?.sections)
      ? (req.body.sections as HomepageSectionConfig[]).map((s, idx) => ({ ...s, order: idx + 1 }))
      : db.homepageDraft;
    const note = String(req.body?.note || 'Published homepage layout');
    db.homepageDraft = sections;
    db.homepagePublished = JSON.parse(JSON.stringify(sections));
    db.homepageVersions.unshift({
      id: `hver-${Date.now()}`,
      publishedAt: new Date().toISOString(),
      publishedBy: member.email,
      note,
      sections: JSON.parse(JSON.stringify(sections)),
    });
    db.homepageVersions = db.homepageVersions.slice(0, 25);
    appendAudit(db, member.email, member.roleId, 'PUBLISH_HOMEPAGE', 'Live Student Homepage', 'Success', { note });
    saveDb(db);
    res.json({ draft: db.homepageDraft, published: db.homepagePublished, versions: db.homepageVersions });
  });

  app.post('/api/admin/homepage/restore/:versionId', requireAdminAuth('publish'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const ver = db.homepageVersions.find((v) => v.id === req.params.versionId);
    if (!ver) return res.status(404).json({ message: 'Homepage version not found.' });
    db.homepageDraft = JSON.parse(JSON.stringify(ver.sections));
    db.homepagePublished = JSON.parse(JSON.stringify(ver.sections));
    appendAudit(db, member.email, member.roleId, 'RESTORE_HOMEPAGE_VERSION', ver.id, 'Success');
    saveDb(db);
    res.json({ draft: db.homepageDraft, published: db.homepagePublished, versions: db.homepageVersions });
  });

  // =========================================================
  // PAGE MANAGEMENT CMS & NAVIGATION MANAGER
  // =========================================================
  app.get('/api/admin/pages', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ pages: db.pages });
  });

  app.post('/api/admin/pages', requireAdminAuth('create'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const p = req.body as Partial<CmsPage>;
    const rawSlug = String(p.slug || p.title || 'new-page')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!rawSlug) return res.status(400).json({ message: 'Valid page slug is required.' });

    let uniqueSlug = rawSlug;
    let i = 2;
    while (db.pages.some((ex) => ex.slug === uniqueSlug)) {
      uniqueSlug = `${rawSlug}-${i++}`;
    }

    const now = new Date().toISOString();
    const page: CmsPage = {
      id: `page-${Date.now()}`,
      title: String(p.title || 'Untitled Page').trim(),
      slug: uniqueSlug,
      pageType: p.pageType || 'standard',
      status: p.status === 'Published' && (req as any).adminPermissions.includes('publish') ? 'Published' : p.status || 'Draft',
      visibility: p.visibility || 'Public',
      scheduledPublishAt: p.scheduledPublishAt || '',
      seoTitle: p.seoTitle || p.title || 'KAMPUS Page',
      seoDescription: p.seoDescription || '',
      coverImageUrl: p.coverImageUrl || '',
      blocks: Array.isArray(p.blocks) ? p.blocks : [{ id: `blk-${Date.now()}`, type: 'heading', title: p.title || 'Untitled Page' }],
      updatedAt: now,
      updatedBy: member.email,
      publishedAt: p.status === 'Published' ? now : undefined,
    };
    db.pages.unshift(page);
    appendAudit(db, member.email, member.roleId, 'CREATE_CMS_PAGE', `/page/${page.slug}`, 'Success');
    saveDb(db);
    res.json({ page, pages: db.pages });
  });

  app.put('/api/admin/pages/:id', requireAdminAuth('edit'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const idx = db.pages.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Page not found.' });

    const patch = req.body as Partial<CmsPage>;
    if (patch.status === 'Published' && !(req as any).adminPermissions.includes('publish')) {
      return res.status(403).json({ message: 'Publish permission is required to publish a page.' });
    }

    const cleanSlug = patch.slug
      ? patch.slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
      : db.pages[idx].slug;

    if (cleanSlug !== db.pages[idx].slug && db.pages.some((p) => p.slug === cleanSlug && p.id !== req.params.id)) {
      return res.status(409).json({ message: `Slug "${cleanSlug}" is already in use.` });
    }

    const now = new Date().toISOString();
    const updated: CmsPage = {
      ...db.pages[idx],
      ...patch,
      slug: cleanSlug,
      updatedAt: now,
      updatedBy: member.email,
      publishedAt: patch.status === 'Published' ? db.pages[idx].publishedAt || now : db.pages[idx].publishedAt,
    };
    db.pages[idx] = updated;
    appendAudit(db, member.email, member.roleId, 'UPDATE_CMS_PAGE', `/page/${updated.slug}`, 'Success', { status: updated.status });
    saveDb(db);
    res.json({ page: updated, pages: db.pages });
  });

  app.delete('/api/admin/pages/:id', requireAdminAuth('delete'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const target = db.pages.find((p) => p.id === req.params.id);
    if (!target) return res.status(404).json({ message: 'Page not found.' });
    db.pages = db.pages.filter((p) => p.id !== req.params.id);
    appendAudit(db, member.email, member.roleId, 'DELETE_CMS_PAGE', target.title, 'Success');
    saveDb(db);
    res.json({ pages: db.pages });
  });

  app.get('/api/admin/navigation', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ navigation: db.navigation });
  });

  app.put('/api/admin/navigation', requireAdminAuth('edit'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const incoming = req.body as NavigationConfig;

    const validateDest = (dest: string) =>
      dest.startsWith('/') || dest.startsWith('http://') || dest.startsWith('https://');

    const groups = [
      ...(incoming.headerMenu || []),
      ...(incoming.sidebarCategories || []),
      ...(incoming.dashboardQuickLinks || []),
      ...(incoming.footerAcademic || []),
      ...(incoming.footerSupport || []),
    ];
    for (const item of groups) {
      if (!item.label?.trim() || !validateDest(item.destination || '')) {
        return res.status(400).json({ message: `Invalid navigation destination for "${item.label || 'item'}".` });
      }
    }

    // Preserve essential account link
    const hasAccount = (incoming.sidebarCategories || []).some((s) => s.destination.startsWith('/account'));
    if (!hasAccount) {
      return res.status(400).json({ message: 'Account & Settings navigation must remain preserved.' });
    }

    db.navigation = {
      ...incoming,
      updatedAt: new Date().toISOString(),
    };
    appendAudit(db, member.email, member.roleId, 'UPDATE_NAVIGATION', 'Global Site Navigation', 'Success');
    saveDb(db);
    res.json({ navigation: db.navigation });
  });

  // =========================================================
  // 21-MODULE FEATURE MANAGEMENT CENTER
  // =========================================================
  app.get('/api/admin/features', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    const usage = computeFeatureUsageMap(db);
    const enriched = db.features.map((f) => ({ ...f, usageCount: usage[f.id] || 0 }));
    res.json({ features: enriched });
  });

  app.put('/api/admin/features/:id', requireAdminAuth('configure'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const idx = db.features.findIndex((f) => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Feature not found.' });

    const prev = db.features[idx];
    const patch = req.body as Partial<ManagedFeatureConfig>;
    const summaryParts: string[] = [];
    if (patch.enabled !== undefined && patch.enabled !== prev.enabled) {
      summaryParts.push(patch.enabled ? 'Enabled feature' : 'Disabled feature');
    }
    if (patch.maintenanceMode !== undefined && patch.maintenanceMode !== prev.maintenanceMode) {
      summaryParts.push(patch.maintenanceMode ? 'Enabled maintenance mode' : 'Cleared maintenance mode');
    }
    if (patch.name && patch.name !== prev.name) summaryParts.push(`Renamed to ${patch.name}`);
    if (patch.accessPermission && patch.accessPermission !== prev.accessPermission) {
      summaryParts.push(`Access -> ${patch.accessPermission}`);
    }
    if (patch.limits || patch.featureSettings) summaryParts.push('Updated module configuration/limits');

    const updated: ManagedFeatureConfig = {
      ...prev,
      ...patch,
      id: prev.id,
      number: prev.number,
      route: prev.route,
      history: [
        {
          id: `fhist-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: member.email,
          summary: summaryParts.join(' · ') || 'Saved configuration',
        },
        ...prev.history,
      ].slice(0, 30),
    };
    db.features[idx] = updated;
    appendAudit(db, member.email, member.roleId, 'UPDATE_FEATURE_CONFIG', updated.name, 'Success', {
      enabled: updated.enabled,
      maintenanceMode: updated.maintenanceMode,
    });
    saveDb(db);
    const usage = computeFeatureUsageMap(db);
    res.json({ feature: { ...updated, usageCount: usage[updated.id] || 0 } });
  });

  // =========================================================
  // USER & ACCOUNT MANAGEMENT
  // =========================================================
  app.get('/api/admin/users', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ users: aggregateUnifiedUsers(db) });
  });

  app.patch('/api/admin/users/:userId', requireAdminAuth('manage_users'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const uid = req.params.userId;
    const { accountStatus, isVerified, college, course, semester, role } = req.body as {
      accountStatus?: 'Active' | 'Suspended';
      isVerified?: boolean;
      college?: string;
      course?: string;
      semester?: string;
      role?: string;
    };

    if (accountStatus === 'Suspended') {
      if (!db.suspendedUserIds.includes(uid)) db.suspendedUserIds.push(uid);
    } else if (accountStatus === 'Active') {
      db.suspendedUserIds = db.suspendedUserIds.filter((x) => x !== uid);
    }

    const accountDb = safeReadJson<any>(STORE_PATHS.account);
    if (accountDb?.profiles?.[uid]) {
      const p = accountDb.profiles[uid];
      if (typeof isVerified === 'boolean') p.badgeVerified = isVerified;
      if (college !== undefined) p.college = college;
      if (course !== undefined) p.course = course;
      if (semester !== undefined) p.semester = semester;
      p.updatedAt = new Date().toISOString();
      if (role && (role === 'Student' || role === 'Moderator Admin')) {
        accountDb.modRoleOverrides = accountDb.modRoleOverrides || {};
        accountDb.modRoleOverrides[uid] = { role, label: role === 'Moderator Admin' ? 'Admin Assigned' : null };
      }
      writeJsonSafe(STORE_PATHS.account, accountDb);
    }

    appendAudit(db, member.email, member.roleId, 'UPDATE_USER_ACCOUNT', uid, 'Success', { accountStatus, isVerified, role });
    saveDb(db);
    res.json({ users: aggregateUnifiedUsers(db) });
  });

  app.post('/api/admin/users/bulk', requireAdminAuth('manage_users'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const { userIds, action } = req.body as { userIds: string[]; action: 'suspend' | 'restore' | 'verify' };
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Select at least one user.' });
    }
    const accountDb = safeReadJson<any>(STORE_PATHS.account);

    for (const uid of userIds) {
      if (action === 'suspend' && !db.suspendedUserIds.includes(uid)) db.suspendedUserIds.push(uid);
      if (action === 'restore') db.suspendedUserIds = db.suspendedUserIds.filter((x) => x !== uid);
      if (action === 'verify' && accountDb?.profiles?.[uid]) {
        accountDb.profiles[uid].badgeVerified = true;
      }
    }
    if (action === 'verify' && accountDb) writeJsonSafe(STORE_PATHS.account, accountDb);
    appendAudit(db, member.email, member.roleId, `BULK_USER_${action.toUpperCase()}`, `${userIds.length} user(s)`, 'Success');
    saveDb(db);
    res.json({ users: aggregateUnifiedUsers(db) });
  });

  app.post('/api/admin/users/:userId/notes', requireAdminAuth('manage_users'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const uid = req.params.userId;
    const note = String(req.body?.note || '').trim();
    if (!note) return res.status(400).json({ message: 'Note text is required.' });
    db.userNotes[uid] = [
      { id: `unote-${Date.now()}`, author: member.email, note, createdAt: new Date().toISOString() },
      ...(db.userNotes[uid] || []),
    ];
    appendAudit(db, member.email, member.roleId, 'ADD_USER_ADMIN_NOTE', uid, 'Success');
    saveDb(db);
    res.json({ users: aggregateUnifiedUsers(db) });
  });

  // =========================================================
  // CONTENT, ACADEMIC & COMMUNITY MANAGEMENT
  // =========================================================
  app.get('/api/admin/content', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ items: aggregateUnifiedContent(db) });
  });

  app.post('/api/admin/content/action', requireAdminAuth('approve'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const { id, action } = req.body as {
      id: string;
      action: 'publish' | 'unpublish' | 'approve' | 'reject' | 'archive' | 'feature' | 'unfeature';
    };
    const prev = db.contentStatusOverrides[id] || { status: 'Published', featured: false };
    if (action === 'publish' || action === 'approve') prev.status = 'Published';
    if (action === 'unpublish') prev.status = 'Pending Review';
    if (action === 'reject') prev.status = 'Rejected';
    if (action === 'archive') prev.status = 'Archived';
    if (action === 'feature') {
      prev.featured = true;
      prev.status = 'Featured';
    }
    if (action === 'unfeature') {
      prev.featured = false;
      prev.status = 'Published';
    }
    db.contentStatusOverrides[id] = prev;
    appendAudit(db, member.email, member.roleId, `CONTENT_${action.toUpperCase()}`, id, 'Success');
    saveDb(db);
    res.json({ items: aggregateUnifiedContent(db) });
  });

  app.get('/api/admin/academic', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({
      subjects: db.academicSubjects,
      courses: db.academicCourses,
      resources: db.academicResources,
      streams: db.academicStreams,
    });
  });

  app.post('/api/admin/academic/:kind', requireAdminAuth('create'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const kind = req.params.kind;
    const payload = req.body;

    if (kind === 'subjects') {
      const rec: AcademicSubjectRecord = {
        id: payload.id || `subj-${Date.now()}`,
        code: String(payload.code || 'NEW-101').trim(),
        name: String(payload.name || '').trim(),
        stream: String(payload.stream || 'Computer Science'),
        semester: String(payload.semester || 'Semester 1'),
        credits: Number(payload.credits || 4),
        status: payload.status || 'Active',
      };
      const idx = db.academicSubjects.findIndex((s) => s.id === rec.id);
      if (idx >= 0) db.academicSubjects[idx] = rec;
      else db.academicSubjects.unshift(rec);
      appendAudit(db, member.email, member.roleId, 'UPSERT_ACADEMIC_SUBJECT', rec.code, 'Success');
    } else if (kind === 'courses') {
      const rec: AcademicCourseRecord = {
        id: payload.id || `crs-${Date.now()}`,
        name: String(payload.name || '').trim(),
        degreeLevel: payload.degreeLevel || 'UG',
        stream: String(payload.stream || 'Computer Science'),
        durationYears: Number(payload.durationYears || 4),
        status: payload.status || 'Active',
      };
      const idx = db.academicCourses.findIndex((c) => c.id === rec.id);
      if (idx >= 0) db.academicCourses[idx] = rec;
      else db.academicCourses.unshift(rec);
      appendAudit(db, member.email, member.roleId, 'UPSERT_ACADEMIC_COURSE', rec.name, 'Success');
    } else if (kind === 'resources') {
      const rec: AcademicResourceRecord = {
        id: payload.id || `res-${Date.now()}`,
        title: String(payload.title || '').trim(),
        subjectCode: String(payload.subjectCode || 'CS-301'),
        category: payload.category || 'Notes',
        status: payload.status || 'Approved',
        uploadedBy: payload.uploadedBy || member.name,
        createdAt: payload.createdAt || new Date().toISOString(),
      };
      const idx = db.academicResources.findIndex((r) => r.id === rec.id);
      if (idx >= 0) db.academicResources[idx] = rec;
      else db.academicResources.unshift(rec);
      appendAudit(db, member.email, member.roleId, 'UPSERT_STUDY_RESOURCE', rec.title, 'Success');
    } else if (kind === 'streams') {
      const name = String(payload.name || '').trim();
      if (name && !db.academicStreams.includes(name)) db.academicStreams.push(name);
    } else {
      return res.status(400).json({ message: 'Unknown academic entity kind.' });
    }

    saveDb(db);
    res.json({
      subjects: db.academicSubjects,
      courses: db.academicCourses,
      resources: db.academicResources,
      streams: db.academicStreams,
    });
  });

  app.delete('/api/admin/academic/:kind/:id', requireAdminAuth('delete'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const { kind, id } = req.params;
    if (kind === 'subjects') db.academicSubjects = db.academicSubjects.filter((s) => s.id !== id);
    if (kind === 'courses') db.academicCourses = db.academicCourses.filter((c) => c.id !== id);
    if (kind === 'resources') db.academicResources = db.academicResources.filter((r) => r.id !== id);
    appendAudit(db, member.email, member.roleId, `DELETE_ACADEMIC_${kind.toUpperCase()}`, id, 'Success');
    saveDb(db);
    res.json({
      subjects: db.academicSubjects,
      courses: db.academicCourses,
      resources: db.academicResources,
      streams: db.academicStreams,
    });
  });

  app.get('/api/admin/community', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    const pulse = safeReadJson<any>(STORE_PATHS.campusPulse) || {};
    const voice = safeReadJson<any>(STORE_PATHS.studentVoice) || {};
    res.json({
      rules: db.communityRules,
      polls: [...(pulse.polls || []), ...(voice.polls || [])],
      communitySubmissions: [...(pulse.submissions || []), ...(voice.ideas || [])],
      reports: aggregateSupportTickets(db).filter((t) => t.type === 'Content Report' || t.type === 'Safety Report'),
    });
  });

  app.put('/api/admin/community/rules', requireAdminAuth('configure'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    db.communityRules = { ...db.communityRules, ...req.body };
    appendAudit(db, member.email, member.roleId, 'UPDATE_COMMUNITY_RULES', 'Community Moderation Rules', 'Success');
    saveDb(db);
    res.json({ rules: db.communityRules });
  });

  // =========================================================
  // COLLEGE EXPLORER, EVENTS & CLUBS, MARKETPLACE
  // =========================================================
  app.get('/api/admin/colleges', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const explorer = safeReadJson<any>(STORE_PATHS.collegeExplorer) || {};
    res.json({
      colleges: explorer.colleges || [],
      courses: explorer.courses || [],
      scholarships: explorer.scholarships || [],
      admissionUpdates: explorer.admissionUpdates || [],
    });
  });

  app.post('/api/admin/colleges', requireAdminAuth('create'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const explorer = safeReadJson<any>(STORE_PATHS.collegeExplorer) || { colleges: [], courses: [], scholarships: [], admissionUpdates: [] };
    const col = req.body;
    const record = {
      id: `col-${Date.now()}`,
      name: String(col.name || '').trim(),
      shortName: String(col.shortName || col.name || '').slice(0, 18),
      city: String(col.city || ''),
      state: String(col.state || ''),
      type: col.type || 'Institute',
      website: String(col.website || ''),
      accreditation: String(col.accreditation || 'Not Listed'),
      contactEmail: String(col.contactEmail || ''),
      verificationStatus: col.verified ? 'Verified' : 'Unverified',
      verifiedSourceUrl: col.verifiedSourceUrl || '',
      feeNote: col.feeNote || 'Unverified / Refer to official website',
      feeYear: col.feeYear || '',
      admissionSummary: col.admissionSummary || 'Verify official admission portal.',
      updatedAt: new Date().toISOString(),
    };
    explorer.colleges = [record, ...(explorer.colleges || [])];
    writeJsonSafe(STORE_PATHS.collegeExplorer, explorer);
    appendAudit(db, member.email, member.roleId, 'CREATE_COLLEGE_RECORD', record.name, 'Success');
    saveDb(db);
    res.json({ college: record, colleges: explorer.colleges });
  });

  app.put('/api/admin/colleges/:id', requireAdminAuth('edit'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const explorer = safeReadJson<any>(STORE_PATHS.collegeExplorer) || { colleges: [] };
    const idx = (explorer.colleges || []).findIndex((c: any) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'College record not found.' });
    explorer.colleges[idx] = {
      ...explorer.colleges[idx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    writeJsonSafe(STORE_PATHS.collegeExplorer, explorer);
    appendAudit(db, member.email, member.roleId, 'UPDATE_COLLEGE_RECORD', explorer.colleges[idx].name, 'Success');
    saveDb(db);
    res.json({ college: explorer.colleges[idx], colleges: explorer.colleges });
  });

  app.delete('/api/admin/colleges/:id', requireAdminAuth('delete'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const explorer = safeReadJson<any>(STORE_PATHS.collegeExplorer) || { colleges: [] };
    explorer.colleges = (explorer.colleges || []).filter((c: any) => c.id !== req.params.id);
    writeJsonSafe(STORE_PATHS.collegeExplorer, explorer);
    appendAudit(db, member.email, member.roleId, 'DELETE_COLLEGE_RECORD', req.params.id, 'Success');
    saveDb(db);
    res.json({ colleges: explorer.colleges });
  });

  app.get('/api/admin/events-clubs', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const ec = safeReadJson<any>(STORE_PATHS.eventsClubs) || {};
    res.json({
      events: ec.events || [],
      clubs: ec.clubs || [],
      registrations: ec.registrations || [],
      reports: ec.reports || [],
    });
  });

  app.post('/api/admin/events-clubs/:action', requireAdminAuth('approve'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const ec = safeReadJson<any>(STORE_PATHS.eventsClubs) || { events: [], clubs: [], registrations: [] };
    const { action } = req.params;
    const p = req.body || {};

    if (action === 'create-event') {
      const ev = {
        id: `ev-adm-${Date.now()}`,
        title: String(p.title || 'Campus Event'),
        category: p.category || 'Tech & Coding',
        organizerName: p.organizerName || 'KAMPUS Events Council',
        dateISO: p.dateISO || new Date().toISOString().slice(0, 10),
        time: p.time || '10:00 AM',
        venue: p.venue || 'Main Auditorium',
        capacity: Number(p.capacity || 200),
        registeredCount: 0,
        status: p.status || 'Published',
        description: p.description || '',
      };
      ec.events = [ev, ...(ec.events || [])];
    } else if (action === 'update-event-status') {
      const ev = (ec.events || []).find((e: any) => e.id === p.id);
      if (ev) ev.status = p.status || 'Published';
    } else if (action === 'update-club-status') {
      const cl = (ec.clubs || []).find((c: any) => c.id === p.id);
      if (cl) cl.status = p.status || 'Active';
    }
    writeJsonSafe(STORE_PATHS.eventsClubs, ec);
    appendAudit(db, member.email, member.roleId, `EVENTS_CLUBS_${action.toUpperCase()}`, String(p.id || p.title || 'event'), 'Success');
    saveDb(db);
    res.json({ events: ec.events || [], clubs: ec.clubs || [], registrations: ec.registrations || [] });
  });

  app.get('/api/admin/market', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    const market = safeReadJson<any>(STORE_PATHS.market) || {};
    res.json({
      listings: market.listings || [],
      categories: market.categories || [],
      reports: market.reports || [],
      offers: market.offers || [],
      rules: db.marketRules,
    });
  });

  app.post('/api/admin/market/action', requireAdminAuth('approve'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const market = safeReadJson<any>(STORE_PATHS.market) || { listings: [], categories: [] };
    const { id, action } = req.body as { id: string; action: 'approve' | 'remove' | 'flag' };
    const lst = (market.listings || []).find((l: any) => l.id === id);
    if (lst) {
      lst.status = action === 'remove' ? 'Removed' : action === 'flag' ? 'Under Review' : 'Available';
      writeJsonSafe(STORE_PATHS.market, market);
    }
    appendAudit(db, member.email, member.roleId, `MARKET_${action.toUpperCase()}`, id, 'Success');
    saveDb(db);
    res.json({ listings: market.listings || [], rules: db.marketRules });
  });

  app.put('/api/admin/market/rules', requireAdminAuth('configure'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    db.marketRules = { ...db.marketRules, ...req.body };
    appendAudit(db, member.email, member.roleId, 'UPDATE_MARKET_RULES', 'KAMPUS Market Rules', 'Success');
    saveDb(db);
    res.json({ rules: db.marketRules });
  });

  // =========================================================
  // REWARDS, NOTIFICATIONS, ADS & MEDIA LIBRARY
  // =========================================================
  app.get('/api/admin/rewards', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const rewards = safeReadJson<any>(STORE_PATHS.rewards) || {};
    res.json({
      rules: rewards.rules || [],
      levels: rewards.levels || [],
      challenges: rewards.challenges || [],
      catalog: rewards.catalog || [],
      redemptions: rewards.redemptions || [],
      transactions: rewards.transactions || [],
      auditLogs: rewards.auditLogs || [],
      wallets: rewards.wallets || {},
    });
  });

  app.put('/api/admin/rewards/config', requireAdminAuth('configure'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const rewards = safeReadJson<any>(STORE_PATHS.rewards) || {};
    const { rules, levels, challenges, catalog } = req.body || {};
    if (Array.isArray(rules)) rewards.rules = rules;
    if (Array.isArray(levels)) rewards.levels = levels;
    if (Array.isArray(challenges)) rewards.challenges = challenges;
    if (Array.isArray(catalog)) rewards.catalog = catalog;
    writeJsonSafe(STORE_PATHS.rewards, rewards);
    appendAudit(db, member.email, member.roleId, 'UPDATE_REWARDS_POLICY', 'KAMPUS Rewards Config', 'Success');
    saveDb(db);
    res.json({
      rules: rewards.rules || [],
      levels: rewards.levels || [],
      challenges: rewards.challenges || [],
      catalog: rewards.catalog || [],
    });
  });

  app.post('/api/admin/rewards/adjust-points', requireAdminAuth('configure'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const rewards = safeReadJson<any>(STORE_PATHS.rewards) || { wallets: {}, transactions: [], auditLogs: [] };
    const { userId, deltaPoints, reason } = req.body as { userId: string; deltaPoints: number; reason: string };
    if (!userId || !deltaPoints || !reason?.trim()) {
      return res.status(400).json({ message: 'userId, non-zero deltaPoints, and audit reason are required.' });
    }
    rewards.wallets = rewards.wallets || {};
    const wallet = rewards.wallets[userId] || { userId, availablePoints: 0, totalEarned: 0, totalRedeemed: 0 };
    wallet.availablePoints = Math.max(0, Number(wallet.availablePoints || 0) + Number(deltaPoints));
    if (deltaPoints > 0) wallet.totalEarned = Number(wallet.totalEarned || 0) + Number(deltaPoints);
    rewards.wallets[userId] = wallet;

    const now = new Date().toISOString();
    rewards.transactions = [
      {
        id: `rtx-${Date.now()}`,
        userId,
        type: deltaPoints > 0 ? 'Admin Credit' : 'Admin Adjustment',
        points: deltaPoints,
        reason: reason.trim(),
        createdAt: now,
      },
      ...(rewards.transactions || []),
    ];
    rewards.auditLogs = [
      { id: `raud-${Date.now()}`, actor: member.email, targetUserId: userId, deltaPoints, reason: reason.trim(), createdAt: now },
      ...(rewards.auditLogs || []),
    ];
    writeJsonSafe(STORE_PATHS.rewards, rewards);
    appendAudit(db, member.email, member.roleId, 'REWARDS_POINTS_ADJUSTMENT', userId, 'Success', { deltaPoints, reason });
    saveDb(db);
    res.json({ wallet, transactions: rewards.transactions, auditLogs: rewards.auditLogs });
  });

  app.get('/api/admin/notifications', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    const notifs = safeReadJson<any>(STORE_PATHS.notifications) || {};
    res.json({
      announcements: notifs.announcements || [],
      recentDeliveries: (notifs.notifications || []).slice(0, 30),
      policies: db.notificationPolicies,
    });
  });

  app.post('/api/admin/notifications/broadcast', requireAdminAuth('publish'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const notifs = safeReadJson<any>(STORE_PATHS.notifications) || { notifications: [], announcements: [] };
    const { title, message, category, priority, targetAudience } = req.body as {
      title: string;
      message: string;
      category?: string;
      priority?: string;
      targetAudience?: string;
    };
    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Title and message are required.' });
    }
    const now = new Date().toISOString();
    const ann = {
      id: `ann-adm-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      category: category || 'Official Notice',
      priority: priority || 'High',
      audience: targetAudience || 'All Students',
      publisherName: member.name,
      publisherRole: 'Super Admin Control Center',
      publishedAt: now,
      status: 'Published',
    };
    notifs.announcements = [ann, ...(notifs.announcements || [])];

    const users = aggregateUnifiedUsers(db);
    const createdNotifs = users.slice(0, 50).map((u) => ({
      id: `notif-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      userId: u.userId,
      title: ann.title,
      description: ann.message,
      category: 'Campus',
      priority: priority || 'High',
      sourceModule: 'Admin Broadcast',
      linkRoute: '/account/notifications',
      read: false,
      createdAt: now,
    }));
    notifs.notifications = [...createdNotifs, ...(notifs.notifications || [])];
    writeJsonSafe(STORE_PATHS.notifications, notifs);
    appendAudit(db, member.email, member.roleId, 'PUBLISH_ANNOUNCEMENT', ann.title, 'Success', { deliveredCount: createdNotifs.length });
    saveDb(db);
    res.json({ announcement: ann, announcements: notifs.announcements, deliveredCount: createdNotifs.length });
  });

  app.put('/api/admin/notifications/policies', requireAdminAuth('configure'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    db.notificationPolicies = { ...db.notificationPolicies, ...req.body };
    appendAudit(db, member.email, member.roleId, 'UPDATE_NOTIFICATION_POLICIES', 'Notification Policies', 'Success');
    saveDb(db);
    res.json({ policies: db.notificationPolicies });
  });

  app.get('/api/admin/ads', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ ads: db.ads });
  });

  app.post('/api/admin/ads', requireAdminAuth('create'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const p = req.body as Partial<AdCampaignRecord>;
    const ad: AdCampaignRecord = {
      id: `ad-${Date.now()}`,
      title: String(p.title || 'New Campus Campaign').trim(),
      subtitle: String(p.subtitle || ''),
      placement: p.placement || 'Homepage Banner',
      imageUrl: String(p.imageUrl || '/src/assets/images/rewards_campus_pass_1794643813947.jpg'),
      targetUrl: String(p.targetUrl || '/campus/events-clubs'),
      ctaLabel: String(p.ctaLabel || 'Learn More'),
      status: p.status || 'Active',
      startDate: p.startDate || new Date().toISOString().slice(0, 10),
      endDate: p.endDate || '2026-12-31',
      impressions: 0,
      clicks: 0,
      updatedAt: new Date().toISOString(),
    };
    db.ads.unshift(ad);
    appendAudit(db, member.email, member.roleId, 'CREATE_AD_CAMPAIGN', ad.title, 'Success');
    saveDb(db);
    res.json({ ad, ads: db.ads });
  });

  app.put('/api/admin/ads/:id', requireAdminAuth('edit'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const idx = db.ads.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Campaign not found.' });
    db.ads[idx] = { ...db.ads[idx], ...req.body, updatedAt: new Date().toISOString() };
    appendAudit(db, member.email, member.roleId, 'UPDATE_AD_CAMPAIGN', db.ads[idx].title, 'Success');
    saveDb(db);
    res.json({ ad: db.ads[idx], ads: db.ads });
  });

  app.delete('/api/admin/ads/:id', requireAdminAuth('delete'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    db.ads = db.ads.filter((a) => a.id !== req.params.id);
    appendAudit(db, member.email, member.roleId, 'DELETE_AD_CAMPAIGN', req.params.id, 'Success');
    saveDb(db);
    res.json({ ads: db.ads });
  });

  app.get('/api/admin/media', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    const enriched = db.mediaAssets.map((m) => ({
      ...m,
      usageRefs: scanMediaReferences(db, m.url),
    }));
    res.json({ assets: enriched });
  });

  app.post('/api/admin/media', requireAdminAuth('create'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const { name, folder, mimeType, base64Data } = req.body as {
      name: string;
      folder?: MediaAssetRecord['folder'];
      mimeType: string;
      base64Data: string;
    };
    if (!name || !base64Data) return res.status(400).json({ message: 'Asset name and file payload required.' });
    const allowedMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'];
    if (!allowedMimes.includes(mimeType)) {
      return res.status(400).json({ message: `Unsupported media format: ${mimeType}` });
    }
    const clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buf = Buffer.from(clean, 'base64');
    if (buf.length === 0 || buf.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File must be between 1 byte and 5 MB.' });
    }
    const id = `med-${Date.now()}`;
    ensureDir(MEDIA_DIR);
    fs.writeFileSync(path.join(MEDIA_DIR, id), buf);

    const asset: MediaAssetRecord = {
      id,
      name: name.trim(),
      folder: folder || 'General',
      mimeType,
      sizeBytes: buf.length,
      url: `/api/admin/media/file/${id}`,
      uploadedBy: member.email,
      uploadedAt: new Date().toISOString(),
      usageRefs: [],
    };
    db.mediaAssets.unshift(asset);
    appendAudit(db, member.email, member.roleId, 'UPLOAD_MEDIA_ASSET', asset.name, 'Success');
    saveDb(db);
    res.json({ asset, assets: db.mediaAssets });
  });

  app.put('/api/admin/media/:id', requireAdminAuth('edit'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const asset = db.mediaAssets.find((m) => m.id === req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });
    if (req.body?.name) asset.name = String(req.body.name).trim();
    if (req.body?.folder) asset.folder = req.body.folder;
    if (req.body?.base64Data && req.body?.mimeType) {
      const clean = String(req.body.base64Data).includes(',') ? String(req.body.base64Data).split(',')[1] : String(req.body.base64Data);
      const buf = Buffer.from(clean, 'base64');
      if (buf.length > 0 && buf.length <= 5 * 1024 * 1024) {
        fs.writeFileSync(path.join(MEDIA_DIR, asset.id), buf);
        asset.sizeBytes = buf.length;
        asset.mimeType = req.body.mimeType;
        asset.url = `/api/admin/media/file/${asset.id}`;
      }
    }
    appendAudit(db, member.email, member.roleId, 'UPDATE_MEDIA_ASSET', asset.name, 'Success');
    saveDb(db);
    res.json({ asset, assets: db.mediaAssets.map((m) => ({ ...m, usageRefs: scanMediaReferences(db, m.url) })) });
  });

  app.delete('/api/admin/media/:id', requireAdminAuth('delete'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const asset = db.mediaAssets.find((m) => m.id === req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found.' });
    const refs = scanMediaReferences(db, asset.url);
    if (refs.length > 0 && !req.query.force) {
      return res.status(409).json({
        message: `Asset is still referenced in: ${refs.join(', ')}. Replace references first or pass force.`,
      });
    }
    db.mediaAssets = db.mediaAssets.filter((m) => m.id !== req.params.id);
    const filePath = path.join(MEDIA_DIR, asset.id);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    appendAudit(db, member.email, member.roleId, 'DELETE_MEDIA_ASSET', asset.name, 'Success');
    saveDb(db);
    res.json({ assets: db.mediaAssets });
  });

  // =========================================================
  // SUPPORT CENTER & MODERATION WORKFLOW
  // =========================================================
  app.get('/api/admin/support', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ tickets: aggregateSupportTickets(db), team: db.teamMembers });
  });

  app.post('/api/admin/support/:id/action', requireAdminAuth('edit'), (req: Request, res: Response) => {
    const db = loadDb();
    const member = (req as any).adminMember as AdminTeamMember;
    const tickets = aggregateSupportTickets(db);
    const found = tickets.find((t) => t.id === req.params.id);
    if (!found) return res.status(404).json({ message: 'Ticket not found.' });

    const { status, assignedTo, internalNote, replyText } = req.body as {
      status?: AdminSupportTicket['status'];
      assignedTo?: string | null;
      internalNote?: string;
      replyText?: string;
    };

    const now = new Date().toISOString();
    const updated: AdminSupportTicket = {
      ...found,
      status: status || found.status,
      assignedTo: assignedTo !== undefined ? assignedTo : found.assignedTo,
      updatedAt: now,
      internalNotes: internalNote?.trim()
        ? [{ id: `tn-${Date.now()}`, author: member.email, text: internalNote.trim(), createdAt: now }, ...found.internalNotes]
        : found.internalNotes,
      replies: replyText?.trim()
        ? [...found.replies, { id: `tr-${Date.now()}`, author: member.name, text: replyText.trim(), createdAt: now }]
        : found.replies,
    };

    const idx = db.supportTickets.findIndex((t) => t.id === found.id);
    if (idx >= 0) db.supportTickets[idx] = updated;
    else db.supportTickets.unshift(updated);

    appendAudit(db, member.email, member.roleId, 'SUPPORT_TICKET_UPDATE', `${updated.id} (${updated.status})`, 'Success');
    saveDb(db);
    res.json({ ticket: updated, tickets: aggregateSupportTickets(db) });
  });

  // =========================================================
  // RBAC TEAM & PERMISSIONS, SECURITY, HEALTH, BACKUPS, AUDIT
  // =========================================================
  app.get('/api/admin/team', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ roles: db.roles, members: db.teamMembers, allPermissions: ALL_PERMISSIONS });
  });

  app.post('/api/admin/team/member', requireAdminAuth('manage_permissions', true), (req: Request, res: Response) => {
    const db = loadDb();
    const actor = (req as any).adminMember as AdminTeamMember;
    const { name, email, roleId, password, customPermissions } = req.body as {
      name: string;
      email: string;
      roleId: AdminRoleId;
      password: string;
      customPermissions?: AdminPermission[];
    };
    if (!name?.trim() || !email?.includes('@') || !password || password.length < 8) {
      return res.status(400).json({ message: 'Name, valid email, and password (min 8 chars) required.' });
    }
    if (db.teamMembers.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) {
      return res.status(409).json({ message: 'Admin member email already exists.' });
    }
    const id = `adm-${Date.now()}`;
    const newMember: AdminTeamMember = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      roleId: roleId || 'support_admin',
      customPermissions: roleId === 'custom' ? customPermissions || ['view'] : undefined,
      status: 'Active',
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    };
    const hashed = hashPassword(password);
    db.teamMembers.push(newMember);
    db.credentials.push({ adminId: id, passwordSalt: hashed.salt, passwordHash: hashed.hash });
    appendAudit(db, actor.email, actor.roleId, 'ADD_ADMIN_MEMBER', `${newMember.email} (${newMember.roleId})`, 'Success');
    saveDb(db);
    res.json({ member: newMember, members: db.teamMembers });
  });

  app.put('/api/admin/team/member/:id', requireAdminAuth('manage_permissions', true), (req: Request, res: Response) => {
    const db = loadDb();
    const actor = (req as any).adminMember as AdminTeamMember;
    const member = db.teamMembers.find((m) => m.id === req.params.id);
    if (!member) return res.status(404).json({ message: 'Team member not found.' });
    if (member.id === actor.id && req.body.status === 'Suspended') {
      return res.status(400).json({ message: 'You cannot suspend your own Super Admin account.' });
    }
    if (req.body.roleId) member.roleId = req.body.roleId;
    if (req.body.status) member.status = req.body.status;
    if (Array.isArray(req.body.customPermissions)) member.customPermissions = req.body.customPermissions;
    appendAudit(db, actor.email, actor.roleId, 'UPDATE_ADMIN_MEMBER', member.email, 'Success', {
      roleId: member.roleId,
      status: member.status,
    });
    saveDb(db);
    res.json({ member, members: db.teamMembers });
  });

  app.put('/api/admin/team/roles/:roleId', requireAdminAuth('manage_permissions', true), (req: Request, res: Response) => {
    const db = loadDb();
    const actor = (req as any).adminMember as AdminTeamMember;
    const role = db.roles.find((r) => r.id === req.params.roleId);
    if (!role) return res.status(404).json({ message: 'Role not found.' });
    if (role.id === 'super_admin') {
      return res.status(400).json({ message: 'Super Admin role retains full platform permissions.' });
    }
    const nextPerms = Array.isArray(req.body?.permissions)
      ? (req.body.permissions as AdminPermission[]).filter((p) => ALL_PERMISSIONS.includes(p))
      : role.permissions;
    role.permissions = nextPerms;
    appendAudit(db, actor.email, actor.roleId, 'UPDATE_ROLE_MATRIX', role.id, 'Success', { permissions: nextPerms });
    saveDb(db);
    res.json({ role, roles: db.roles });
  });

  app.get('/api/admin/security', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    const users = aggregateUnifiedUsers(db);
    res.json({
      signedInSessions: db.sessions.filter((s) => s.active).slice(0, 30),
      loginHistory: db.loginEvents.slice(0, 50),
      failedAttemptsCount: db.loginEvents.filter((e) => !e.success).length,
      suspendedUsers: users.filter((u) => u.accountStatus === 'Suspended'),
      sensitiveChanges: db.auditLogs.filter((a) =>
        ['UPDATE_WEBSITE_CONFIG', 'UPDATE_ADMIN_MEMBER', 'UPDATE_ROLE_MATRIX', 'CREATE_BACKUP', 'RESTORE_BACKUP', 'UPDATE_USER_ACCOUNT'].includes(a.action)
      ).slice(0, 30),
    });
  });

  app.post('/api/admin/security/revoke-session', requireAdminAuth('manage_permissions', true), (req: Request, res: Response) => {
    const db = loadDb();
    const actor = (req as any).adminMember as AdminTeamMember;
    const current = (req as any).adminSession as AdminSessionRecord;
    const targetId = String(req.body?.sessionId || '');
    if (targetId === current.id) {
      return res.status(400).json({ message: 'Use Log Out to end your active session cleanly.' });
    }
    const sess = db.sessions.find((s) => s.id === targetId);
    if (sess) sess.active = false;
    appendAudit(db, actor.email, actor.roleId, 'REVOKE_ADMIN_SESSION', targetId, 'Success');
    saveDb(db);
    res.json({ signedInSessions: db.sessions.filter((s) => s.active) });
  });

  app.get('/api/admin/health', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ health: getSystemHealth(db) });
  });

  app.get('/api/admin/integrations', requireAdminAuth('view'), (_req: Request, res: Response) => {
    res.json({ integrations: getIntegrationStatuses() });
  });

  app.post('/api/admin/integrations/:id/test', requireAdminAuth('configure'), (req: Request, res: Response) => {
    const db = loadDb();
    const actor = (req as any).adminMember as AdminTeamMember;
    const all = getIntegrationStatuses();
    const target = all.find((i) => i.id === req.params.id);
    if (!target) return res.status(404).json({ message: 'Integration not found.' });
    appendAudit(db, actor.email, actor.roleId, 'TEST_INTEGRATION', target.name, target.connectionStatus === 'Connected' ? 'Success' : 'Failed');
    saveDb(db);
    res.json({ integration: target });
  });

  app.get('/api/admin/audit-logs', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ logs: db.auditLogs });
  });

  app.get('/api/admin/backups', requireAdminAuth('view'), (_req: Request, res: Response) => {
    const db = loadDb();
    const account = safeReadJson<any>(STORE_PATHS.account) || {};
    const verifiedBackups = db.backups.filter((b) => fs.existsSync(path.join(BACKUP_DIR, b.fileName)));
    res.json({
      backups: verifiedBackups.map((b) => ({ ...b, verified: true })),
      retentionConfig: db.retentionConfig,
      deletionRequests: account.deletionRequests || [],
      health: getSystemHealth(db),
    });
  });

  app.post('/api/admin/backups', requireAdminAuth('configure', true), (_req: Request, res: Response) => {
    const db = loadDb();
    const actor = (_req as any).adminMember as AdminTeamMember;
    ensureDir(BACKUP_DIR);

    const storesPayload: Record<string, unknown> = { superAdmin: db };
    const includedStores: string[] = ['superAdmin'];
    for (const [k, p] of Object.entries(STORE_PATHS)) {
      if (k === 'locker') continue; // Never copy private Locker documents into standard admin snapshot backups
      const parsed = safeReadJson(p);
      if (parsed) {
        storesPayload[k] = parsed;
        includedStores.push(k);
      }
    }

    const jsonString = JSON.stringify(storesPayload, null, 2);
    const fileName = `kampus-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);
    fs.writeFileSync(filePath, jsonString, 'utf8');

    const checksum = crypto.createHash('sha256').update(jsonString).digest('hex');
    const rec: BackupRecord = {
      id: `bkp-${Date.now()}`,
      fileName,
      createdAt: new Date().toISOString(),
      createdBy: actor.email,
      sizeBytes: Buffer.byteLength(jsonString, 'utf8'),
      checksumSha256: checksum,
      includedStores,
      verified: true,
    };
    db.backups.unshift(rec);
    db.backups = db.backups.slice(0, db.retentionConfig.backupRetentionCount || 15);
    appendAudit(db, actor.email, actor.roleId, 'CREATE_BACKUP', fileName, 'Success', { sizeBytes: rec.sizeBytes });
    saveDb(db);
    res.json({ backup: rec, backups: db.backups });
  });

  app.get('/api/admin/export/:dataset', requireAdminAuth('export'), (req: Request, res: Response) => {
    const db = loadDb();
    const actor = (req as any).adminMember as AdminTeamMember;
    const dataset = req.params.dataset;
    const format = req.query.format === 'csv' ? 'csv' : 'json';

    let rows: Array<Record<string, unknown>> = [];
    if (dataset === 'users') {
      // Never export passwords, tokens, or private locker documents
      rows = aggregateUnifiedUsers(db).map((u) => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        college: u.college,
        course: u.course,
        semester: u.semester,
        accountStatus: u.accountStatus,
        isVerified: u.isVerified,
        registeredAt: u.registeredAt,
      }));
    } else if (dataset === 'content') {
      rows = aggregateUnifiedContent(db) as unknown as Array<Record<string, unknown>>;
    } else if (dataset === 'audit') {
      rows = db.auditLogs as unknown as Array<Record<string, unknown>>;
    } else if (dataset === 'support') {
      rows = aggregateSupportTickets(db).map((t) => ({
        id: t.id,
        sourceModule: t.sourceModule,
        type: t.type,
        subject: t.subject,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt,
      }));
    } else {
      return res.status(400).json({ message: 'Unsupported dataset export.' });
    }

    appendAudit(db, actor.email, actor.roleId, `EXPORT_${dataset.toUpperCase()}`, `${format.toUpperCase()} (${rows.length} rows)`, 'Success');
    saveDb(db);

    if (format === 'csv') {
      const headers = rows.length > 0 ? Object.keys(rows[0]) : ['empty'];
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="kampus-${dataset}-export.csv"`);
      return res.send(csv);
    }

    res.json({ dataset, exportedAt: new Date().toISOString(), count: rows.length, rows });
  });
}
