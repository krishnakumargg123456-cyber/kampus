export type NotificationCategory =
  | 'Academic'
  | 'Community'
  | 'Chat'
  | 'Events & Clubs'
  | 'Campus'
  | 'Career'
  | 'College Explorer'
  | 'KAMPUS Market'
  | 'Market'
  | 'Digital Locker'
  | 'KAMPUS Rewards'
  | 'System';

export type NotificationPriority = 'Urgent' | 'High' | 'Important' | 'Normal' | 'Low';

export type DeliveryChannel = 'in_app' | 'push' | 'email' | 'sms';

export type DeliveryStatus =
  | 'Delivered'
  | 'Held (Quiet Hours)'
  | 'Skipped (Preference Disabled)'
  | 'Unavailable (Provider Not Configured)'
  | 'Failed';

export interface NotificationDeliveryRecord {
  id: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  detail: string;
  timestamp: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  details?: string;
  category: NotificationCategory;
  subType: string;
  sourceModule: string;
  priority: NotificationPriority;
  read: boolean;
  archived: boolean;
  deleted: boolean;
  deletedAt?: string | null;
  important: boolean;
  isMention: boolean;
  isReminder: boolean;
  linkRoute?: string;
  actionLabel?: string;
  idempotencyKey?: string;
  suppressedByQuietHours?: boolean;
  deliveryRecords: NotificationDeliveryRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  modules: {
    academic: {
      studyReminders: boolean;
      examAlerts: boolean;
      assignmentUpdates: boolean;
      goalReminders: boolean;
    };
    community: {
      mentions: boolean;
      replies: boolean;
      comments: boolean;
      announcements: boolean;
    };
    chat: {
      directMessages: boolean;
      groupMessages: boolean;
      messageRequests: boolean;
    };
    events: {
      eventReminders: boolean;
      registrationUpdates: boolean;
      clubAnnouncements: boolean;
    };
    career: {
      applicationReminders: boolean;
      interviewAlerts: boolean;
      opportunityUpdates: boolean;
    };
    market: {
      buyerInquiries: boolean;
      offers: boolean;
      listingUpdates: boolean;
    };
    rewards: {
      pointsUpdates: boolean;
      achievementUpdates: boolean;
      challengeReminders: boolean;
      redemptionUpdates: boolean;
    };
    system: {
      securityAlerts: true; // Mandatory per security policy
      serviceUpdates: boolean;
    };
  };
  channels: {
    inApp: boolean;
    browserPush: boolean;
    email: boolean;
    sms: boolean;
    smsConsent: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    timezone: string;
  };
  digest: {
    enabled: boolean;
    frequency: 'Daily' | 'Weekly';
    categories: NotificationCategory[];
  };
  updatedAt: string;
}

export interface ChannelCapabilities {
  inApp: { configured: boolean; statusText: string };
  push: { configured: boolean; statusText: string };
  email: { configured: boolean; statusText: string };
  sms: { configured: boolean; statusText: string };
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpointLabel: string;
  deviceLabel?: string;
  permissionState: 'granted' | 'denied' | 'default' | 'unsupported';
  platform: string;
  active: boolean;
  updatedAt: string;
}

export type ReminderStatus = 'Upcoming' | 'Completed' | 'Snoozed' | 'Missed';

export interface AggregatedReminder {
  id: string;
  sourceModule:
    | 'KAMPUS Planner'
    | 'Study Hub'
    | 'Career'
    | 'Events & Clubs'
    | 'College Explorer'
    | 'Digital Locker';
  sourceItemId: string;
  title: string;
  subtitle: string;
  dueDateISO: string;
  dueTime: string;
  status: ReminderStatus;
  snoozedUntilISO?: string | null;
  linkRoute: string;
  priority: NotificationPriority;
}

export type AnnouncementCategory = 'KAMPUS' | 'College' | 'Club' | 'Academic' | 'System';
export type AnnouncementAudienceType =
  | 'All Students'
  | 'Selected Colleges'
  | 'Selected Courses'
  | 'Selected Groups';

export interface OfficialAnnouncement {
  id: string;
  title: string;
  description: string;
  publisherName: string;
  publisherRole: string;
  isOfficial: true;
  category: AnnouncementCategory;
  targetAudience: AnnouncementAudienceType;
  targetValue?: string;
  attachmentName?: string;
  linkRoute?: string;
  scheduledFor?: string | null;
  status: 'Published' | 'Scheduled' | 'Draft';
  createdAt: string;
  updatedAt: string;
  readByUserIds: string[];
  clickedByUserIds: string[];
}

export interface SocialActivityItem {
  id: string;
  kind: 'mention' | 'reply' | 'comment' | 'accepted_answer' | 'interaction' | 'announcement' | 'chat';
  actorName: string;
  title: string;
  excerpt: string;
  sourceModule: 'Student Community' | 'KAMPUS Chat';
  linkRoute: string;
  timestamp: string;
}

export interface NotificationRoleInfo {
  role: 'Student' | 'Publisher Admin';
  label: string | null;
}
