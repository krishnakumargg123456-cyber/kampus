export type AdminRoleId =
  | 'super_admin'
  | 'admin'
  | 'content_manager'
  | 'moderator'
  | 'support_admin'
  | 'custom';

export type AdminPermission =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'publish'
  | 'export'
  | 'configure'
  | 'manage_users'
  | 'manage_permissions';

export type AdminSectionId =
  | 'overview'
  | 'website'
  | 'homepage'
  | 'pages'
  | 'navigation'
  | 'features'
  | 'users'
  | 'content'
  | 'academic'
  | 'community'
  | 'colleges'
  | 'events'
  | 'marketplace'
  | 'rewards'
  | 'notifications'
  | 'ads'
  | 'media'
  | 'analytics'
  | 'support'
  | 'team'
  | 'security'
  | 'health'
  | 'integrations'
  | 'settings'
  | 'audit';

export interface AdminRoleDefinition {
  id: AdminRoleId;
  name: string;
  description: string;
  permissions: AdminPermission[];
  isSystem: boolean;
}

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  roleId: AdminRoleId;
  customPermissions?: AdminPermission[];
  status: 'Active' | 'Suspended';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminSessionRecord {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  roleId: AdminRoleId;
  createdAt: string;
  lastActiveAt: string;
  userAgent: string;
  ipAddress: string;
  active: boolean;
}

export interface AdminLoginEvent {
  id: string;
  email: string;
  adminName?: string;
  roleId?: AdminRoleId;
  success: boolean;
  reason: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

export interface WebsiteConfig {
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  supportPhone: string;
  footerDescription: string;
  footerCopyright: string;
  siteActive: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  scheduledMaintenanceWindow: string;
  allowRegistration: boolean;
  allowLogin: boolean;
  publicAccess: boolean;
  primaryColor: string;
  navyColor: string;
  accentColor: string;
  fontFamily: 'Inter' | 'Plus Jakarta Sans' | 'Manrope' | 'Public Sans';
  buttonStyle: 'rounded' | 'pill' | 'sharp';
  borderRadiusScale: 'compact' | 'standard' | 'relaxed';
  layoutWidth: 'standard' | 'wide';
  navigationStyle: 'sidebar' | 'compact-sidebar';
  defaultTheme: 'light' | 'dark';
  defaultLanguage: 'en' | 'hi';
  supportedLanguages: Array<'en' | 'hi'>;
  timezone: string;
  dateFormat: 'DD MMM YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  updatedAt: string;
  updatedBy: string;
}

export interface WebsiteConfigVersion {
  id: string;
  createdAt: string;
  createdBy: string;
  note: string;
  snapshot: WebsiteConfig;
}

export type HomepageSectionType =
  | 'hero'
  | 'features'
  | 'dashboard'
  | 'ai-showcase'
  | 'campus-life'
  | 'career'
  | 'featured-events'
  | 'featured-colleges'
  | 'featured-market'
  | 'announcements'
  | 'promo-banner'
  | 'custom-welcome'
  | 'search-spotlight'
  | 'footer';

export interface HomepageSectionConfig {
  id: string;
  type: HomepageSectionType;
  label: string;
  visible: boolean;
  order: number;
  heading: string;
  subheading: string;
  description: string;
  imageUrl: string;
  iconName: string;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  backgroundTone: 'default' | 'navy' | 'blue' | 'slate' | 'amber';
}

export interface HomepageVersion {
  id: string;
  publishedAt: string;
  publishedBy: string;
  note: string;
  sections: HomepageSectionConfig[];
}

export type CmsBlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'image-text'
  | 'button'
  | 'banner'
  | 'video'
  | 'feature-showcase'
  | 'faq'
  | 'divider'
  | 'card-grid';

export interface CmsBlock {
  id: string;
  type: CmsBlockType;
  title?: string;
  body?: string;
  imageUrl?: string;
  buttonLabel?: string;
  buttonLink?: string;
  videoUrl?: string;
  items?: Array<{ title: string; detail: string; link?: string }>;
}

export type CmsPageType =
  | 'standard'
  | 'about'
  | 'contact'
  | 'help'
  | 'terms'
  | 'privacy'
  | 'landing'
  | 'promotional';

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  pageType: CmsPageType;
  status: 'Draft' | 'Published' | 'Scheduled' | 'Unpublished';
  visibility: 'Public' | 'Authenticated' | 'Admins Only';
  scheduledPublishAt?: string;
  seoTitle: string;
  seoDescription: string;
  coverImageUrl?: string;
  blocks: CmsBlock[];
  updatedAt: string;
  updatedBy: string;
  publishedAt?: string;
}

export interface NavItemConfig {
  id: string;
  label: string;
  destination: string;
  visible: boolean;
  order: number;
  protected?: boolean;
  children?: Array<{
    id: string;
    label: string;
    destination: string;
    visible: boolean;
  }>;
}

export interface NavigationConfig {
  headerMenu: NavItemConfig[];
  sidebarCategories: NavItemConfig[];
  dashboardQuickLinks: NavItemConfig[];
  footerAcademic: NavItemConfig[];
  footerSupport: NavItemConfig[];
  updatedAt: string;
}

export interface FeatureChangeEntry {
  id: string;
  timestamp: string;
  actor: string;
  summary: string;
}

export interface ManagedFeatureConfig {
  id: string;
  number: number;
  name: string;
  description: string;
  iconName: string;
  category: 'learn' | 'connect' | 'campus' | 'career' | 'market' | 'tools' | 'account';
  route: string;
  enabled: boolean;
  visible: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  accessPermission: 'all' | 'verified' | 'students_only' | 'beta';
  limits: Record<string, number | string>;
  featureSettings: Record<string, string | number | boolean>;
  usageCount: number;
  history: FeatureChangeEntry[];
}

export interface AdminUserRecord {
  userId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  course: string;
  semester: string;
  enrollmentNo: string;
  role: string;
  accountStatus: 'Active' | 'Suspended';
  isVerified: boolean;
  reportedCount: number;
  registeredAt: string;
  lastActiveAt: string;
  activitySummary: {
    posts: number;
    events: number;
    listings: number;
    lockerDocs: number;
    supportTickets: number;
    rewardPoints: number;
  };
  internalNotes: Array<{
    id: string;
    author: string;
    note: string;
    createdAt: string;
  }>;
}

export interface UnifiedContentItem {
  id: string;
  module:
    | 'Study Hub'
    | 'Notes Exchange'
    | 'Community'
    | 'Career'
    | 'College Explorer'
    | 'Events'
    | 'Marketplace';
  title: string;
  author: string;
  category: string;
  status: 'Published' | 'Pending Review' | 'Rejected' | 'Archived' | 'Featured';
  featured: boolean;
  createdAt: string;
  summary: string;
}

export interface AcademicSubjectRecord {
  id: string;
  code: string;
  name: string;
  stream: string;
  semester: string;
  credits: number;
  status: 'Active' | 'Archived';
}

export interface AcademicCourseRecord {
  id: string;
  name: string;
  degreeLevel: 'UG' | 'PG' | 'Diploma' | 'Certificate';
  stream: string;
  durationYears: number;
  status: 'Active' | 'Archived';
}

export interface AcademicResourceRecord {
  id: string;
  title: string;
  subjectCode: string;
  category: 'Notes' | 'PYQ' | 'Formula Sheet' | 'Lecture Deck';
  status: 'Approved' | 'Pending Approval' | 'Rejected';
  uploadedBy: string;
  createdAt: string;
}

export interface AdCampaignRecord {
  id: string;
  title: string;
  subtitle: string;
  placement: 'Homepage Banner' | 'Campus Feed' | 'Career Sidebar' | 'Marketplace Top';
  imageUrl: string;
  targetUrl: string;
  ctaLabel: string;
  status: 'Active' | 'Paused' | 'Scheduled';
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  updatedAt: string;
}

export interface MediaAssetRecord {
  id: string;
  name: string;
  folder: 'General' | 'Homepage' | 'Logos & Brand' | 'Banners' | 'Pages' | 'Colleges';
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  usageRefs: string[];
}

export interface AdminSupportTicket {
  id: string;
  sourceModule: string;
  type: 'Complaint' | 'Bug Report' | 'Account Problem' | 'Content Report' | 'Safety Report' | 'Feature Issue';
  subject: string;
  description: string;
  requesterName: string;
  requesterId: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Waiting for Response' | 'Resolved' | 'Closed';
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  internalNotes: Array<{ id: string; author: string; text: string; createdAt: string }>;
  replies: Array<{ id: string; author: string; text: string; createdAt: string }>;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  timestamp: string;
  result: 'Success' | 'Denied' | 'Failed';
  metadata?: Record<string, unknown>;
}

export interface BackupRecord {
  id: string;
  fileName: string;
  createdAt: string;
  createdBy: string;
  sizeBytes: number;
  checksumSha256: string;
  includedStores: string[];
  verified: boolean;
}

export interface IntegrationStatusItem {
  id: string;
  name: string;
  category: 'Authentication' | 'Database' | 'Storage' | 'AI Provider' | 'Email' | 'Push' | 'Payment' | 'External API';
  connectionStatus: 'Connected' | 'Not Configured' | 'Degraded';
  configurationStatus: 'Configured' | 'Missing Secrets' | 'Local Adapter';
  lastCheckedAt: string;
  details: string;
  supportsTest: boolean;
}

export interface SystemHealthSnapshot {
  appStatus: 'Healthy' | 'Degraded';
  backendUptimeSeconds: number;
  memoryRssMb: number;
  memoryHeapUsedMb: number;
  nodeVersion: string;
  buildMode: string;
  databaseFilesCount: number;
  databaseTotalBytes: number;
  storageWritable: boolean;
  mediaCount: number;
  recentErrors: Array<{ timestamp: string; source: string; message: string }>;
  checkedAt: string;
}

export interface PublicPlatformConfig {
  website: WebsiteConfig;
  homepageSections: HomepageSectionConfig[];
  navigation: NavigationConfig;
  features: Array<Pick<ManagedFeatureConfig, 'id' | 'name' | 'description' | 'iconName' | 'category' | 'route' | 'enabled' | 'visible' | 'maintenanceMode' | 'maintenanceMessage' | 'accessPermission'>>;
  ads: AdCampaignRecord[];
  pages: Array<Pick<CmsPage, 'id' | 'title' | 'slug' | 'pageType' | 'status' | 'visibility'>>;
}
