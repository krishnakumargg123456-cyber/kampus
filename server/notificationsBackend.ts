import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import type {
  AggregatedReminder,
  AnnouncementAudienceType,
  AnnouncementCategory,
  ChannelCapabilities,
  NotificationCategory,
  NotificationDeliveryRecord,
  NotificationPreferences,
  NotificationPriority,
  NotificationRecord,
  NotificationRoleInfo,
  OfficialAnnouncement,
  PushSubscriptionRecord,
  ReminderStatus,
  SocialActivityItem,
} from '../src/types/notifications.ts';

interface ReminderOverride {
  status?: ReminderStatus;
  snoozedUntilISO?: string | null;
  rescheduledDateISO?: string;
  rescheduledTime?: string;
  updatedAt: string;
}

interface NotificationsDatabase {
  notifications: NotificationRecord[];
  preferencesByUser: Record<string, NotificationPreferences>;
  pushSubscriptions: PushSubscriptionRecord[];
  announcements: OfficialAnnouncement[];
  reminderOverrides: Record<string, ReminderOverride>; // key: `${userId}::${sourceModule}::${sourceItemId}`
  roleOverrides: Record<string, NotificationRoleInfo>;
}

const DB_PATH = path.join(process.cwd(), '.kampus_notifications_db.json');
const PUBLISHER_ADMIN_PASSKEY = 'KAMPUS_PUBLISHER_2026';

const PLANNER_DB_PATH = path.join(process.cwd(), '.kampus_planner_db.json');
const CAREER_DB_PATH = path.join(process.cwd(), '.kampus_career_db.json');
const EVENTS_DB_PATH = path.join(process.cwd(), '.kampus_events_clubs_db.json');
const COLLEGE_DB_PATH = path.join(process.cwd(), '.kampus_college_explorer_db.json');
const LOCKER_DB_PATH = path.join(process.cwd(), '.kampus_locker_db.json');
const COMMUNITY_DB_PATH = path.join(process.cwd(), '.kampus_community_db.json');
const CHAT_DB_PATH = path.join(process.cwd(), '.kampus_chat_db.json');

function createEmptyDb(): NotificationsDatabase {
  return {
    notifications: [],
    preferencesByUser: {},
    pushSubscriptions: [],
    announcements: [],
    reminderOverrides: {},
    roleOverrides: {},
  };
}

function loadDb(): NotificationsDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as Partial<NotificationsDatabase>;
      return {
        notifications: parsed.notifications || [],
        preferencesByUser: parsed.preferencesByUser || {},
        pushSubscriptions: parsed.pushSubscriptions || [],
        announcements: parsed.announcements || [],
        reminderOverrides: parsed.reminderOverrides || {},
        roleOverrides: parsed.roleOverrides || {},
      };
    }
  } catch {
    // rebuild clean database on parse error
  }
  const initial = createEmptyDb();
  saveDb(initial);
  return initial;
}

function saveDb(db: NotificationsDatabase): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function createDefaultPreferences(userId: string): NotificationPreferences {
  return {
    userId,
    modules: {
      academic: {
        studyReminders: true,
        examAlerts: true,
        assignmentUpdates: true,
        goalReminders: true,
      },
      community: {
        mentions: true,
        replies: true,
        comments: true,
        announcements: true,
      },
      chat: {
        directMessages: true,
        groupMessages: true,
        messageRequests: true,
      },
      events: {
        eventReminders: true,
        registrationUpdates: true,
        clubAnnouncements: true,
      },
      career: {
        applicationReminders: true,
        interviewAlerts: true,
        opportunityUpdates: true,
      },
      market: {
        buyerInquiries: true,
        offers: true,
        listingUpdates: true,
      },
      rewards: {
        pointsUpdates: true,
        achievementUpdates: true,
        challengeReminders: true,
        redemptionUpdates: true,
      },
      system: {
        securityAlerts: true,
        serviceUpdates: true,
      },
    },
    channels: {
      inApp: true,
      browserPush: false,
      email: false,
      sms: false,
      smsConsent: false,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      timezone: 'Asia/Kolkata',
    },
    digest: {
      enabled: false,
      frequency: 'Daily',
      categories: ['Academic', 'Career', 'Events & Clubs'],
    },
    updatedAt: new Date().toISOString(),
  };
}

function ensurePreferences(db: NotificationsDatabase, userId: string): NotificationPreferences {
  if (!db.preferencesByUser[userId]) {
    db.preferencesByUser[userId] = createDefaultPreferences(userId);
  }
  // Enforce mandatory security alert rule
  db.preferencesByUser[userId].modules.system.securityAlerts = true;
  return db.preferencesByUser[userId];
}

function getChannelCapabilities(): ChannelCapabilities {
  const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
  const smsConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  return {
    inApp: { configured: true, statusText: 'Active · WebSocket + Sync' },
    push: { configured: true, statusText: 'Browser Push API Ready (Permission Required)' },
    email: {
      configured: emailConfigured,
      statusText: emailConfigured ? 'SMTP Provider Configured' : 'Unavailable · Email Provider Not Configured',
    },
    sms: {
      configured: smsConfigured,
      statusText: smsConfigured ? 'SMS Gateway Configured' : 'Unavailable · SMS Provider Not Configured',
    },
  };
}

function isWithinQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
  if (!quietHours.enabled) return false;
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: quietHours.timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const currentHHMM = formatter.format(new Date());
    const start = quietHours.startTime || '22:00';
    const end = quietHours.endTime || '07:00';
    if (start === end) return false;
    if (start < end) {
      return currentHHMM >= start && currentHHMM < end;
    }
    // Overnight quiet hours (e.g., 22:00 -> 07:00)
    return currentHHMM >= start || currentHHMM < end;
  } catch {
    return false;
  }
}

function assignCategoryAndRules(input: {
  title: string;
  description: string;
  legacyType?: string;
  category?: NotificationCategory;
  linkRoute?: string;
  sourceModule?: string;
  subType?: string;
  priority?: NotificationPriority;
}): {
  category: NotificationCategory;
  sourceModule: string;
  subType: string;
  priority: NotificationPriority;
  isMention: boolean;
  isReminder: boolean;
} {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const route = (input.linkRoute || '').toLowerCase();

  let category: NotificationCategory = input.category || 'System';
  let sourceModule = input.sourceModule || '';

  if (!input.category) {
    if (route.includes('/chat')) {
      category = 'Chat';
      sourceModule = sourceModule || 'KAMPUS Chat';
    } else if (route.includes('/community')) {
      category = 'Community';
      sourceModule = sourceModule || 'Student Community';
    } else if (route.includes('/events')) {
      category = 'Events & Clubs';
      sourceModule = sourceModule || 'Events & Clubs';
    } else if (route.includes('/career')) {
      category = 'Career';
      sourceModule = sourceModule || 'Career';
    } else if (route.includes('/college-explorer')) {
      category = 'College Explorer';
      sourceModule = sourceModule || 'College Explorer';
    } else if (route.includes('/market')) {
      category = 'KAMPUS Market';
      sourceModule = sourceModule || 'KAMPUS Market';
    } else if (route.includes('/digital-locker')) {
      category = 'Digital Locker';
      sourceModule = sourceModule || 'Digital Locker';
    } else if (route.includes('/rewards')) {
      category = 'KAMPUS Rewards';
      sourceModule = sourceModule || 'KAMPUS Rewards';
    } else if (route.includes('/planner')) {
      category = 'Academic';
      sourceModule = sourceModule || 'KAMPUS Planner';
    } else if (route.includes('/study-hub') || route.includes('/notes') || route.includes('/kampus-ai')) {
      category = 'Academic';
      sourceModule = sourceModule || 'Study Hub';
    } else if (input.legacyType === 'career') {
      category = 'Career';
      sourceModule = sourceModule || 'Career';
    } else if (input.legacyType === 'campus') {
      category = 'Events & Clubs';
      sourceModule = sourceModule || 'Campus';
    } else if (input.legacyType === 'academic' || input.subType === 'exam_alert' || input.subType === 'assignment' || input.subType === 'goal') {
      category = 'Academic';
      sourceModule = sourceModule || 'Academic';
    } else if (input.subType === 'club_announcement') {
      category = 'Events & Clubs';
      sourceModule = sourceModule || 'Events & Clubs';
    } else {
      category = 'System';
      sourceModule = sourceModule || 'System';
    }
  } else {
    sourceModule = sourceModule || category;
  }

  // Sub-type & flags
  const isMention = Boolean(
    input.subType === 'mention' || text.includes('mentioned you') || text.includes('@')
  );
  const isReminder = Boolean(
    input.subType === 'reminder' ||
      text.includes('reminder') ||
      text.includes('due ') ||
      text.includes('deadline') ||
      text.includes('snoozed') ||
      text.includes('scheduled')
  );

  const subType =
    input.subType ||
    (text.includes('security') || text.includes('password') || text.includes('login alert')
      ? 'security_alert'
      : isMention
      ? 'mention'
      : isReminder
      ? 'reminder'
      : 'general');

  // Rule-based smart priority assignment (never artificially inflated)
  let priority: NotificationPriority = input.priority || 'Normal';
  if (!input.priority) {
    if (
      subType === 'security_alert' ||
      text.includes('exam rescheduled') ||
      text.includes('exam cancelled') ||
      text.includes('immediate examination') ||
      text.includes('critical deadline')
    ) {
      priority = 'Urgent';
    } else if (
      text.includes('interview') ||
      text.includes('assignment deadline') ||
      text.includes('due tomorrow') ||
      text.includes('counteroffer') ||
      text.includes('offer received') ||
      text.includes('admission deadline')
    ) {
      priority = 'High';
    } else if (text.includes('recommendation') || text.includes('digest') || text.includes('tip')) {
      priority = 'Low';
    } else {
      priority = 'Normal';
    }
  }

  return { category, sourceModule, subType, priority, isMention, isReminder };
}

function isCategoryAllowedByPreferences(
  prefs: NotificationPreferences,
  category: NotificationCategory,
  subType: string
): boolean {
  // Mandatory critical security alerts cannot be silently disabled
  if (category === 'System' && subType === 'security_alert') {
    return true;
  }
  switch (category) {
    case 'Academic':
      if (subType === 'exam_alert') return prefs.modules.academic.examAlerts;
      if (subType === 'assignment') return prefs.modules.academic.assignmentUpdates;
      if (subType === 'goal') return prefs.modules.academic.goalReminders;
      return (
        prefs.modules.academic.studyReminders ||
        prefs.modules.academic.examAlerts ||
        prefs.modules.academic.assignmentUpdates ||
        prefs.modules.academic.goalReminders
      );
    case 'Community':
      if (subType === 'mention') return prefs.modules.community.mentions;
      if (subType === 'reply') return prefs.modules.community.replies;
      if (subType === 'comment') return prefs.modules.community.comments;
      return (
        prefs.modules.community.mentions ||
        prefs.modules.community.replies ||
        prefs.modules.community.comments ||
        prefs.modules.community.announcements
      );
    case 'Chat':
      return (
        prefs.modules.chat.directMessages ||
        prefs.modules.chat.groupMessages ||
        prefs.modules.chat.messageRequests
      );
    case 'Events & Clubs':
      return (
        prefs.modules.events.eventReminders ||
        prefs.modules.events.registrationUpdates ||
        prefs.modules.events.clubAnnouncements
      );
    case 'Career':
      return (
        prefs.modules.career.applicationReminders ||
        prefs.modules.career.interviewAlerts ||
        prefs.modules.career.opportunityUpdates
      );
    case 'KAMPUS Market':
      return (
        prefs.modules.market.buyerInquiries ||
        prefs.modules.market.offers ||
        prefs.modules.market.listingUpdates
      );
    case 'KAMPUS Rewards':
      return (
        prefs.modules.rewards.pointsUpdates ||
        prefs.modules.rewards.achievementUpdates ||
        prefs.modules.rewards.challengeReminders ||
        prefs.modules.rewards.redemptionUpdates
      );
    case 'System':
      return prefs.modules.system.serviceUpdates;
    default:
      return true;
  }
}

function buildDeliveryRecords(
  db: NotificationsDatabase,
  userId: string,
  prefs: NotificationPreferences,
  allowedByPref: boolean,
  suppressedByQuietHours: boolean
): NotificationDeliveryRecord[] {
  const now = new Date().toISOString();
  const caps = getChannelCapabilities();
  const records: NotificationDeliveryRecord[] = [];

  // In-App
  if (!allowedByPref) {
    records.push({
      id: `del_${crypto.randomUUID().slice(0, 8)}`,
      channel: 'in_app',
      status: 'Skipped (Preference Disabled)',
      detail: 'Category muted in user notification preferences.',
      timestamp: now,
    });
  } else if (suppressedByQuietHours) {
    records.push({
      id: `del_${crypto.randomUUID().slice(0, 8)}`,
      channel: 'in_app',
      status: 'Held (Quiet Hours)',
      detail: `Held non-critical alert during quiet hours (${prefs.quietHours.startTime}–${prefs.quietHours.endTime} ${prefs.quietHours.timezone}).`,
      timestamp: now,
    });
  } else if (!prefs.channels.inApp) {
    records.push({
      id: `del_${crypto.randomUUID().slice(0, 8)}`,
      channel: 'in_app',
      status: 'Skipped (Preference Disabled)',
      detail: 'In-app feed delivery disabled by user.',
      timestamp: now,
    });
  } else {
    records.push({
      id: `del_${crypto.randomUUID().slice(0, 8)}`,
      channel: 'in_app',
      status: 'Delivered',
      detail: 'Delivered to centralized Notification Center inbox.',
      timestamp: now,
    });
  }

  // Browser Push
  const activeSub = db.pushSubscriptions.find((s) => s.userId === userId && s.active && s.permissionState === 'granted');
  if (prefs.channels.browserPush) {
    records.push({
      id: `del_${crypto.randomUUID().slice(0, 8)}`,
      channel: 'push',
      status: suppressedByQuietHours
        ? 'Held (Quiet Hours)'
        : activeSub
        ? 'Delivered'
        : 'Unavailable (Provider Not Configured)',
      detail: activeSub
        ? `Dispatched via active browser subscription (${activeSub.platform}).`
        : 'Browser push permission not granted on this device.',
      timestamp: now,
    });
  }

  // Email
  if (prefs.channels.email) {
    records.push({
      id: `del_${crypto.randomUUID().slice(0, 8)}`,
      channel: 'email',
      status: caps.email.configured ? 'Delivered' : 'Unavailable (Provider Not Configured)',
      detail: caps.email.statusText,
      timestamp: now,
    });
  }

  // SMS
  if (prefs.channels.sms) {
    records.push({
      id: `del_${crypto.randomUUID().slice(0, 8)}`,
      channel: 'sms',
      status:
        caps.sms.configured && prefs.channels.smsConsent
          ? 'Delivered'
          : 'Unavailable (Provider Not Configured)',
      detail: !caps.sms.configured ? caps.sms.statusText : 'SMS consent missing.',
      timestamp: now,
    });
  }

  return records;
}

function buildAggregatedReminders(db: NotificationsDatabase, userId: string): AggregatedReminder[] {
  const reminders: AggregatedReminder[] = [];
  const todayISO = new Date().toISOString().slice(0, 10);

  // 1. KAMPUS Planner tasks & exams
  const planner = safeReadJson<{
    tasks?: Array<{
      id: string;
      userId: string;
      title: string;
      category: string;
      dueDateISO: string;
      dueTime: string;
      status: string;
      priority: NotificationPriority;
      reminderState: string;
      snoozedUntilISO?: string | null;
    }>;
    exams?: Array<{
      id: string;
      userId: string;
      name: string;
      subject: string;
      dateISO: string;
      time: string;
      prepStatus: string;
    }>;
  }>(PLANNER_DB_PATH);

  for (const t of planner?.tasks || []) {
    if (t.userId !== userId || t.status === 'Cancelled' || t.reminderState === 'Dismissed') continue;
    let status: ReminderStatus = 'Upcoming';
    if (t.status === 'Completed' || t.reminderState === 'Completed') status = 'Completed';
    else if (t.reminderState === 'Snoozed') status = 'Snoozed';
    else if (t.dueDateISO < todayISO) status = 'Missed';

    reminders.push({
      id: `rem_planner_task_${t.id}`,
      sourceModule: 'KAMPUS Planner',
      sourceItemId: t.id,
      title: t.title,
      subtitle: `${t.category} Task`,
      dueDateISO: t.dueDateISO,
      dueTime: t.dueTime || '18:00',
      status,
      snoozedUntilISO: t.snoozedUntilISO || null,
      linkRoute: '/tools/planner',
      priority: t.priority || 'Normal',
    });
  }

  for (const x of planner?.exams || []) {
    if (x.userId !== userId) continue;
    const key = `${userId}::KAMPUS Planner::exam_${x.id}`;
    const ov = db.reminderOverrides[key];
    let status: ReminderStatus = ov?.status || (x.prepStatus === 'Ready' ? 'Completed' : x.dateISO < todayISO ? 'Missed' : 'Upcoming');
    reminders.push({
      id: `rem_planner_exam_${x.id}`,
      sourceModule: 'KAMPUS Planner',
      sourceItemId: `exam_${x.id}`,
      title: x.name,
      subtitle: `Exam · ${x.subject}`,
      dueDateISO: ov?.rescheduledDateISO || x.dateISO,
      dueTime: ov?.rescheduledTime || x.time || '09:30',
      status,
      snoozedUntilISO: ov?.snoozedUntilISO || null,
      linkRoute: '/tools/planner',
      priority: 'High',
    });
  }

  // 2. Career applications & deadlines
  const career = safeReadJson<{
    applications?: Array<{
      id: string;
      userId: string;
      opportunityTitle?: string;
      companyName?: string;
      status?: string;
      interviewDateISO?: string;
      appliedAt?: string;
    }>;
  }>(CAREER_DB_PATH);

  for (const appItem of career?.applications || []) {
    if (appItem.userId !== userId) continue;
    const key = `${userId}::Career::${appItem.id}`;
    const ov = db.reminderOverrides[key];
    const dueDate = ov?.rescheduledDateISO || appItem.interviewDateISO || (appItem.appliedAt || todayISO).slice(0, 10);
    const status: ReminderStatus =
      ov?.status || (appItem.status === 'Rejected' || appItem.status === 'Offer Accepted' ? 'Completed' : 'Upcoming');
    reminders.push({
      id: `rem_career_${appItem.id}`,
      sourceModule: 'Career',
      sourceItemId: appItem.id,
      title: `${appItem.opportunityTitle || 'Career Application'} (${appItem.status || 'Active'})`,
      subtitle: appItem.companyName || 'Career Opportunity',
      dueDateISO: dueDate,
      dueTime: ov?.rescheduledTime || '10:00',
      status,
      snoozedUntilISO: ov?.snoozedUntilISO || null,
      linkRoute: '/career',
      priority: appItem.status === 'Interview Scheduled' ? 'High' : 'Normal',
    });
  }

  // 3. Events & Clubs registrations
  const eventsDb = safeReadJson<{
    events?: Array<{ id: string; title: string; dateISO: string; timeLabel?: string }>;
    registrations?: Array<{ id: string; userId: string; eventId: string; status?: string }>;
  }>(EVENTS_DB_PATH);

  for (const reg of eventsDb?.registrations || []) {
    if (reg.userId !== userId || reg.status === 'Cancelled') continue;
    const ev = (eventsDb?.events || []).find((e) => e.id === reg.eventId);
    if (!ev) continue;
    const key = `${userId}::Events & Clubs::${reg.id}`;
    const ov = db.reminderOverrides[key];
    const dueDate = ov?.rescheduledDateISO || ev.dateISO || todayISO;
    const status: ReminderStatus = ov?.status || (dueDate < todayISO ? 'Completed' : 'Upcoming');
    reminders.push({
      id: `rem_event_${reg.id}`,
      sourceModule: 'Events & Clubs',
      sourceItemId: reg.id,
      title: ev.title,
      subtitle: 'Registered Campus Event',
      dueDateISO: dueDate,
      dueTime: ov?.rescheduledTime || ev.timeLabel || '16:00',
      status,
      snoozedUntilISO: ov?.snoozedUntilISO || null,
      linkRoute: '/campus/events-clubs',
      priority: 'Normal',
    });
  }

  // 4. College Explorer saved application deadlines
  const collegeDb = safeReadJson<{
    reminders?: Array<{
      id: string;
      userId: string;
      collegeName: string;
      title: string;
      deadlineISO: string;
      completed?: boolean;
    }>;
  }>(COLLEGE_DB_PATH);

  for (const cr of collegeDb?.reminders || []) {
    if (cr.userId !== userId) continue;
    const key = `${userId}::College Explorer::${cr.id}`;
    const ov = db.reminderOverrides[key];
    const dueDate = ov?.rescheduledDateISO || cr.deadlineISO || todayISO;
    const status: ReminderStatus =
      ov?.status || (cr.completed ? 'Completed' : dueDate < todayISO ? 'Missed' : 'Upcoming');
    reminders.push({
      id: `rem_college_${cr.id}`,
      sourceModule: 'College Explorer',
      sourceItemId: cr.id,
      title: cr.title,
      subtitle: cr.collegeName,
      dueDateISO: dueDate,
      dueTime: ov?.rescheduledTime || '17:00',
      status,
      snoozedUntilISO: ov?.snoozedUntilISO || null,
      linkRoute: '/campus/college-explorer',
      priority: 'High',
    });
  }

  // 5. Digital Locker document expiry/reminders
  const lockerDb = safeReadJson<{
    documents?: Array<{
      id: string;
      ownerId: string;
      title: string;
      category: string;
      expiryDate?: string;
    }>;
  }>(LOCKER_DB_PATH);

  for (const doc of lockerDb?.documents || []) {
    if (doc.ownerId !== userId || !doc.expiryDate) continue;
    const key = `${userId}::Digital Locker::${doc.id}`;
    const ov = db.reminderOverrides[key];
    const dueDate = ov?.rescheduledDateISO || doc.expiryDate;
    const status: ReminderStatus = ov?.status || (dueDate < todayISO ? 'Missed' : 'Upcoming');
    reminders.push({
      id: `rem_locker_${doc.id}`,
      sourceModule: 'Digital Locker',
      sourceItemId: doc.id,
      title: `Document Renewal: ${doc.title}`,
      subtitle: doc.category,
      dueDateISO: dueDate,
      dueTime: ov?.rescheduledTime || '12:00',
      status,
      snoozedUntilISO: ov?.snoozedUntilISO || null,
      linkRoute: '/tools/digital-locker',
      priority: 'High',
    });
  }

  return reminders.sort((a, b) => `${a.dueDateISO} ${a.dueTime}`.localeCompare(`${b.dueDateISO} ${b.dueTime}`));
}

function buildSocialActivity(db: NotificationsDatabase, userId: string): SocialActivityItem[] {
  const items: SocialActivityItem[] = [];

  // Pull real Community mentions/replies notifications without duplicating community DB
  for (const n of db.notifications) {
    if (n.userId === userId && !n.deleted && (n.category === 'Community' || n.category === 'Chat' || n.isMention)) {
      items.push({
        id: `soc_notif_${n.id}`,
        kind: n.isMention ? 'mention' : n.category === 'Chat' ? 'chat' : 'reply',
        actorName: n.sourceModule,
        title: n.title,
        excerpt: n.description,
        sourceModule: n.category === 'Chat' ? 'KAMPUS Chat' : 'Student Community',
        linkRoute: n.linkRoute || (n.category === 'Chat' ? '/connect/chat' : '/connect/community'),
        timestamp: n.createdAt,
      });
    }
  }

  // Also inspect real unread chat requests from .kampus_chat_db.json
  const chatDb = safeReadJson<{
    requests?: Array<{
      id: string;
      toUserId: string;
      fromName: string;
      preview: string;
      status: string;
      createdAt: string;
    }>;
  }>(CHAT_DB_PATH);

  for (const reqItem of chatDb?.requests || []) {
    if (reqItem.toUserId === userId && reqItem.status === 'pending') {
      items.push({
        id: `soc_chatreq_${reqItem.id}`,
        kind: 'chat',
        actorName: reqItem.fromName,
        title: `Message request from ${reqItem.fromName}`,
        excerpt: reqItem.preview || 'Sent you a direct message request.',
        sourceModule: 'KAMPUS Chat',
        linkRoute: '/connect/chat',
        timestamp: reqItem.createdAt || new Date().toISOString(),
      });
    }
  }

  // Inspect real community comments/replies authored on user's posts if present
  const commDb = safeReadJson<{
    posts?: Array<{
      id: string;
      authorId?: string;
      title: string;
      replies?: Array<{ id: string; authorName: string; content: string; createdAt: string; accepted?: boolean }>;
    }>;
  }>(COMMUNITY_DB_PATH);

  for (const post of commDb?.posts || []) {
    if (post.authorId === userId && Array.isArray(post.replies)) {
      for (const rep of post.replies.slice(0, 5)) {
        items.push({
          id: `soc_comm_${rep.id}`,
          kind: rep.accepted ? 'accepted_answer' : 'reply',
          actorName: rep.authorName || 'Student',
          title: `${rep.authorName || 'A peer'} replied on "${post.title}"`,
          excerpt: rep.content,
          sourceModule: 'Student Community',
          linkRoute: '/connect/community',
          timestamp: rep.createdAt || new Date().toISOString(),
        });
      }
    }
  }

  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50);
}

function isUserEligibleForAnnouncement(
  ann: OfficialAnnouncement,
  userCollege?: string,
  userCourse?: string
): boolean {
  if (ann.targetAudience === 'All Students') return true;
  const val = (ann.targetValue || '').trim().toLowerCase();
  if (!val) return true;
  if (ann.targetAudience === 'Selected Colleges') {
    return (userCollege || '').toLowerCase().includes(val);
  }
  if (ann.targetAudience === 'Selected Courses') {
    return (userCourse || '').toLowerCase().includes(val);
  }
  return true;
}

export function registerNotificationsBackend(app: Express): WebSocketServer {
  const db = loadDb();
  const wss = new WebSocketServer({ noServer: true });
  const socketsByUser = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const userId = url.searchParams.get('userId') || 'anonymous';
    if (!socketsByUser.has(userId)) {
      socketsByUser.set(userId, new Set());
    }
    socketsByUser.get(userId)!.add(ws);

    ws.send(JSON.stringify({ type: 'connected', userId, timestamp: new Date().toISOString() }));

    ws.on('close', () => {
      const set = socketsByUser.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) socketsByUser.delete(userId);
      }
    });
  });

  const emitToUser = (userId: string, payload: Record<string, unknown>) => {
    const sockets = socketsByUser.get(userId);
    if (!sockets) return;
    const msg = JSON.stringify(payload);
    for (const sock of sockets) {
      if (sock.readyState === WebSocket.OPEN) {
        sock.send(msg);
      }
    }
  };

  const promoteScheduledAnnouncements = () => {
    const nowIso = new Date().toISOString();
    let changed = false;
    for (const ann of db.announcements) {
      if (ann.status === 'Scheduled' && ann.scheduledFor && ann.scheduledFor <= nowIso) {
        ann.status = 'Published';
        ann.updatedAt = nowIso;
        changed = true;
      }
    }
    if (changed) saveDb(db);
  };

  // 1. Bootstrap Notification Center
  app.post('/api/notifications/bootstrap', (req: Request, res: Response) => {
    const { userId, college, course } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid) return res.status(400).json({ message: 'userId is required.' });

    promoteScheduledAnnouncements();
    const prefs = ensurePreferences(db, uid);
    saveDb(db);

    const userNotifications = db.notifications
      .filter((n) => n.userId === uid)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const active = userNotifications.filter((n) => !n.deleted && !n.archived);
    const roleInfo = db.roleOverrides[uid] || { role: 'Student' as const, label: null };
    const isAdmin = roleInfo.role === 'Publisher Admin';

    const announcements = isAdmin
      ? db.announcements
      : db.announcements.filter(
          (a) => a.status === 'Published' && isUserEligibleForAnnouncement(a, college, course)
        );

    return res.json({
      notifications: userNotifications,
      unreadCount: active.filter((n) => !n.read).length,
      preferences: prefs,
      channelCapabilities: getChannelCapabilities(),
      pushSubscriptions: db.pushSubscriptions.filter((s) => s.userId === uid),
      reminders: buildAggregatedReminders(db, uid),
      announcements: [...announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      socialActivity: buildSocialActivity(db, uid),
      roleInfo,
    });
  });

  // 2. Centralized Event-Driven Notification Creation (with Idempotency, Rules, Preferences, Quiet Hours)
  app.post('/api/notifications', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const title = String(b.title || '').trim();
    const description = String(b.description || '').trim();
    if (!userId || !title) {
      return res.status(400).json({ message: 'userId and title are required.' });
    }

    const prefs = ensurePreferences(db, userId);

    // Idempotency / duplicate prevention
    const idemKey = b.idempotencyKey ? String(b.idempotencyKey).trim() : undefined;
    if (idemKey) {
      const existing = db.notifications.find((n) => n.userId === userId && n.idempotencyKey === idemKey);
      if (existing) {
        return res.status(200).json({ notification: existing, deduplicated: true });
      }
    } else {
      const recentCutoff = Date.now() - 45_000;
      const dup = db.notifications.find(
        (n) =>
          n.userId === userId &&
          !n.deleted &&
          n.title === title &&
          n.description === description &&
          new Date(n.createdAt).getTime() >= recentCutoff
      );
      if (dup) {
        return res.status(200).json({ notification: dup, deduplicated: true });
      }
    }

    const rules = assignCategoryAndRules({
      title,
      description,
      legacyType: b.type,
      category: b.category,
      linkRoute: b.linkRoute,
      sourceModule: b.sourceModule,
      subType: b.subType,
      priority: b.priority,
    });

    const allowed = isCategoryAllowedByPreferences(prefs, rules.category, rules.subType);
    const quietActive = isWithinQuietHours(prefs.quietHours);
    const isCriticalSecurity = rules.category === 'System' && rules.subType === 'security_alert';
    const suppressedByQuietHours = quietActive && !isCriticalSecurity && rules.priority !== 'Urgent';

    const deliveryRecords = buildDeliveryRecords(db, userId, prefs, allowed, suppressedByQuietHours);

    // If user explicitly muted an optional category, skip adding noisy unread item while returning accurate preference state
    if (!allowed) {
      return res.status(200).json({
        notification: null,
        suppressedByPreference: true,
        deliveryRecords,
      });
    }

    const now = new Date().toISOString();
    const record: NotificationRecord = {
      id: `notif_${crypto.randomUUID().slice(0, 10)}`,
      userId,
      title,
      description,
      details: b.details ? String(b.details) : undefined,
      category: rules.category,
      subType: rules.subType,
      sourceModule: rules.sourceModule,
      priority: rules.priority,
      read: false,
      archived: false,
      deleted: false,
      deletedAt: null,
      important: Boolean(b.important) || rules.priority === 'Urgent',
      isMention: Boolean(b.isMention ?? rules.isMention),
      isReminder: Boolean(b.isReminder ?? rules.isReminder),
      linkRoute: b.linkRoute ? String(b.linkRoute) : undefined,
      actionLabel: b.actionLabel ? String(b.actionLabel) : 'Open Page',
      idempotencyKey: idemKey,
      suppressedByQuietHours,
      deliveryRecords,
      createdAt: now,
      updatedAt: now,
    };

    db.notifications.unshift(record);
    // Keep up to 400 notifications per user
    let countForUser = 0;
    db.notifications = db.notifications.filter((n) => {
      if (n.userId !== userId) return true;
      countForUser += 1;
      return countForUser <= 400;
    });
    saveDb(db);

    emitToUser(userId, { type: 'notification:created', notification: record });
    return res.status(201).json({ notification: record });
  });

  // 3. Single Notification Update (Read/Unread, Archive, Important, Soft-Delete)
  app.patch('/api/notifications/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, read, archived, important, deleted } = req.body || {};
    const uid = String(userId || '').trim();
    const item = db.notifications.find((n) => n.id === id);
    if (!item) return res.status(404).json({ message: 'Notification not found.' });
    if (item.userId !== uid) return res.status(403).json({ message: 'Unauthorized.' });

    if (typeof read === 'boolean') item.read = read;
    if (typeof archived === 'boolean') item.archived = archived;
    if (typeof important === 'boolean') item.important = important;
    if (typeof deleted === 'boolean') {
      item.deleted = deleted;
      item.deletedAt = deleted ? new Date().toISOString() : null;
    }
    item.updatedAt = new Date().toISOString();
    saveDb(db);

    emitToUser(uid, { type: 'notification:updated', notification: item });
    return res.json({ notification: item });
  });

  // 4. Bulk Actions (with confirmation required for destructive operations)
  app.post('/api/notifications/bulk', (req: Request, res: Response) => {
    const { userId, action, ids, confirmed } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid || !action) return res.status(400).json({ message: 'userId and action are required.' });

    if ((action === 'delete' || action === 'clear-read') && confirmed !== true) {
      return res.status(400).json({ message: 'Confirmation is required before destructive bulk actions.' });
    }

    const idSet = new Set<string>(Array.isArray(ids) ? ids.map(String) : []);
    const now = new Date().toISOString();
    let affected = 0;

    for (const n of db.notifications) {
      if (n.userId !== uid || n.deleted) continue;
      if (action === 'mark-all-read') {
        if (!n.read) {
          n.read = true;
          n.updatedAt = now;
          affected += 1;
        }
      } else if (action === 'clear-read') {
        if (n.read && !n.archived) {
          n.deleted = true;
          n.deletedAt = now;
          n.updatedAt = now;
          affected += 1;
        }
      } else if (idSet.has(n.id)) {
        if (action === 'mark-read') n.read = true;
        else if (action === 'mark-unread') n.read = false;
        else if (action === 'archive') n.archived = true;
        else if (action === 'unarchive') n.archived = false;
        else if (action === 'delete') {
          n.deleted = true;
          n.deletedAt = now;
        }
        n.updatedAt = now;
        affected += 1;
      }
    }

    saveDb(db);
    emitToUser(uid, { type: 'notification:bulk', action, affected });
    return res.json({ affected, notifications: db.notifications.filter((n) => n.userId === uid) });
  });

  // 5. Notification Preferences & Quiet Hours & Digest
  app.put('/api/notifications/preferences', (req: Request, res: Response) => {
    const { userId, preferences } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid || !preferences) {
      return res.status(400).json({ message: 'userId and preferences are required.' });
    }
    const current = ensurePreferences(db, uid);
    const next: NotificationPreferences = {
      ...current,
      ...preferences,
      userId: uid,
      modules: {
        ...current.modules,
        ...(preferences.modules || {}),
        system: {
          ...current.modules.system,
          ...(preferences.modules?.system || {}),
          securityAlerts: true, // Strictly enforced mandatory policy
        },
      },
      channels: {
        ...current.channels,
        ...(preferences.channels || {}),
      },
      quietHours: {
        ...current.quietHours,
        ...(preferences.quietHours || {}),
      },
      digest: {
        ...current.digest,
        ...(preferences.digest || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    db.preferencesByUser[uid] = next;
    saveDb(db);
    return res.json({ preferences: next, channelCapabilities: getChannelCapabilities() });
  });

  // 6. Push Subscription Management
  app.post('/api/notifications/push-subscription', (req: Request, res: Response) => {
    const { userId, permissionState, platform, active } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid) return res.status(400).json({ message: 'userId is required.' });

    const existing = db.pushSubscriptions.find((s) => s.userId === uid);
    const now = new Date().toISOString();
    if (existing) {
      existing.permissionState = permissionState || existing.permissionState;
      existing.platform = platform || existing.platform;
      existing.active = typeof active === 'boolean' ? active : existing.active;
      existing.updatedAt = now;
    } else {
      db.pushSubscriptions.push({
        id: `push_${crypto.randomUUID().slice(0, 8)}`,
        userId: uid,
        endpointLabel: 'Web Browser Notification API',
        permissionState: permissionState || 'default',
        platform: platform || 'Web Browser',
        active: Boolean(active),
        updatedAt: now,
      });
    }
    const prefs = ensurePreferences(db, uid);
    if (permissionState === 'granted' && active) {
      prefs.channels.browserPush = true;
    } else if (active === false) {
      prefs.channels.browserPush = false;
    }
    saveDb(db);
    return res.json({
      pushSubscriptions: db.pushSubscriptions.filter((s) => s.userId === uid),
      preferences: prefs,
    });
  });

  // 7. Reminders Aggregator & Source-of-Truth Actions (No Duplicate Tasks)
  app.get('/api/notifications/reminders', (req: Request, res: Response) => {
    const uid = String(req.query.userId || '').trim();
    if (!uid) return res.status(400).json({ message: 'userId is required.' });
    return res.json({ reminders: buildAggregatedReminders(db, uid) });
  });

  app.post('/api/notifications/reminders/action', (req: Request, res: Response) => {
    const { userId, sourceModule, sourceItemId, action, dateISO, time } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid || !sourceModule || !sourceItemId || !action) {
      return res.status(400).json({ message: 'userId, sourceModule, sourceItemId, and action are required.' });
    }

    // If source is a Planner Task, mutate the source of truth directly in .kampus_planner_db.json
    if (sourceModule === 'KAMPUS Planner' && !String(sourceItemId).startsWith('exam_')) {
      const planner = safeReadJson<{ tasks?: Array<Record<string, unknown>> }>(PLANNER_DB_PATH);
      if (planner && Array.isArray(planner.tasks)) {
        const task = planner.tasks.find((t) => t.id === sourceItemId && t.userId === uid);
        if (task) {
          if (action === 'complete') {
            task.status = 'Completed';
            task.reminderState = 'Completed';
            task.completedAt = new Date().toISOString();
          } else if (action === 'snooze') {
            const nextDay = dateISO || new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
            task.reminderState = 'Snoozed';
            task.snoozedUntilISO = nextDay;
            task.dueDateISO = nextDay;
          } else if (action === 'reschedule' && dateISO) {
            task.dueDateISO = dateISO;
            if (time) task.dueTime = time;
            task.reminderState = 'Active';
          }
          task.updatedAt = new Date().toISOString();
          fs.writeFileSync(PLANNER_DB_PATH, JSON.stringify(planner, null, 2), 'utf8');
        }
      }
    } else {
      // Update lightweight override state for external modules without duplicating their records
      const key = `${uid}::${sourceModule}::${sourceItemId}`;
      const existing = db.reminderOverrides[key] || { updatedAt: new Date().toISOString() };
      if (action === 'complete') {
        existing.status = 'Completed';
      } else if (action === 'snooze') {
        existing.status = 'Snoozed';
        existing.snoozedUntilISO = dateISO || new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
      } else if (action === 'reschedule' && dateISO) {
        existing.status = 'Upcoming';
        existing.rescheduledDateISO = dateISO;
        if (time) existing.rescheduledTime = time;
      }
      existing.updatedAt = new Date().toISOString();
      db.reminderOverrides[key] = existing;
      saveDb(db);
    }

    return res.json({ reminders: buildAggregatedReminders(db, uid) });
  });

  // 8. Role-Protected Publisher Admin Auth
  app.post('/api/notifications/auth/role-session', (req: Request, res: Response) => {
    const { userId, passkey, revert } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid) return res.status(400).json({ message: 'userId is required.' });
    if (revert) {
      delete db.roleOverrides[uid];
      saveDb(db);
      return res.json({ roleInfo: { role: 'Student', label: null } });
    }
    if (passkey !== PUBLISHER_ADMIN_PASSKEY) {
      return res.status(403).json({ message: 'Invalid official publisher passkey.' });
    }
    db.roleOverrides[uid] = {
      role: 'Publisher Admin',
      label: 'Authorized Campus Publisher',
    };
    saveDb(db);
    return res.json({ roleInfo: db.roleOverrides[uid] });
  });

  // 9. Official Announcements (Create/Edit/Schedule/Delete protected to Publisher Admin)
  app.post('/api/notifications/announcements', (req: Request, res: Response) => {
    const b = req.body || {};
    const uid = String(b.userId || '').trim();
    const roleInfo = db.roleOverrides[uid];
    if (!roleInfo || roleInfo.role !== 'Publisher Admin') {
      return res.status(403).json({ message: 'Only authorized publishers can create official announcements.' });
    }
    const title = String(b.title || '').trim();
    const description = String(b.description || '').trim();
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const now = new Date().toISOString();
    const scheduledFor = b.scheduledFor ? String(b.scheduledFor) : null;
    const status = b.status === 'Draft' ? 'Draft' : scheduledFor && scheduledFor > now ? 'Scheduled' : 'Published';

    const ann: OfficialAnnouncement = {
      id: `ann_${crypto.randomUUID().slice(0, 10)}`,
      title,
      description,
      publisherName: String(b.publisherName || 'KAMPUS Administration'),
      publisherRole: String(b.publisherRole || 'Official Publisher'),
      isOfficial: true,
      category: (b.category as AnnouncementCategory) || 'KAMPUS',
      targetAudience: (b.targetAudience as AnnouncementAudienceType) || 'All Students',
      targetValue: b.targetValue ? String(b.targetValue) : undefined,
      attachmentName: b.attachmentName ? String(b.attachmentName) : undefined,
      linkRoute: b.linkRoute ? String(b.linkRoute) : '/account/notifications',
      scheduledFor,
      status,
      createdAt: now,
      updatedAt: now,
      readByUserIds: [],
      clickedByUserIds: [],
    };
    db.announcements.unshift(ann);
    saveDb(db);

    if (ann.status === 'Published') {
      for (const [targetUid, sockets] of socketsByUser.entries()) {
        for (const sock of sockets) {
          if (sock.readyState === WebSocket.OPEN) {
            sock.send(JSON.stringify({ type: 'announcement:published', announcement: ann, userId: targetUid }));
          }
        }
      }
    }

    return res.status(201).json({ announcement: ann });
  });

  app.patch('/api/notifications/announcements/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const b = req.body || {};
    const uid = String(b.userId || '').trim();
    const roleInfo = db.roleOverrides[uid];
    if (!roleInfo || roleInfo.role !== 'Publisher Admin') {
      return res.status(403).json({ message: 'Only authorized publishers can edit official announcements.' });
    }
    const ann = db.announcements.find((a) => a.id === id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found.' });

    if (b.title !== undefined) ann.title = String(b.title);
    if (b.description !== undefined) ann.description = String(b.description);
    if (b.category !== undefined) ann.category = b.category;
    if (b.targetAudience !== undefined) ann.targetAudience = b.targetAudience;
    if (b.targetValue !== undefined) ann.targetValue = b.targetValue;
    if (b.status !== undefined) ann.status = b.status;
    if (b.scheduledFor !== undefined) ann.scheduledFor = b.scheduledFor;
    ann.updatedAt = new Date().toISOString();
    saveDb(db);

    return res.json({ announcement: ann });
  });

  app.delete('/api/notifications/announcements/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const uid = String(req.query.userId || '').trim();
    const roleInfo = db.roleOverrides[uid];
    if (!roleInfo || roleInfo.role !== 'Publisher Admin') {
      return res.status(403).json({ message: 'Only authorized publishers can delete official announcements.' });
    }
    const idx = db.announcements.findIndex((a) => a.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Announcement not found.' });
    db.announcements.splice(idx, 1);
    saveDb(db);
    return res.json({ deleted: true });
  });

  app.post('/api/notifications/announcements/:id/engage', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, kind } = req.body || {};
    const uid = String(userId || '').trim();
    const ann = db.announcements.find((a) => a.id === id);
    if (!ann || !uid) return res.status(404).json({ message: 'Announcement not found.' });

    if (kind === 'click') {
      if (!ann.clickedByUserIds.includes(uid)) ann.clickedByUserIds.push(uid);
      if (!ann.readByUserIds.includes(uid)) ann.readByUserIds.push(uid);
    } else {
      if (!ann.readByUserIds.includes(uid)) ann.readByUserIds.push(uid);
    }
    saveDb(db);
    return res.json({ announcement: ann });
  });

  return wss;
}
