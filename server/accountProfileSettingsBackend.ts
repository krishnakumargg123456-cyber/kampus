import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  ConnectedServiceItem,
  ConsolidatedActivityItem,
  DeletionRequestRecord,
  EligibleLockerCertificate,
  ProfileCompletionSummary,
  ProfileReportRecord,
  RealProfileStats,
  SecurityAuditEvent,
  SessionRecord,
  StorageOverview,
  StudentProfileRecord,
  SupportTicketRecord,
  UnlockedRewardBadge,
  UserSettingsRecord,
} from '../src/types/accountProfileSettings.ts';

interface AccountDatabase {
  profiles: Record<string, StudentProfileRecord>;
  settings: Record<string, UserSettingsRecord>;
  sessions: SessionRecord[];
  securityAudit: SecurityAuditEvent[];
  reports: ProfileReportRecord[];
  deletionRequests: DeletionRequestRecord[];
  supportTickets: SupportTicketRecord[];
  passwordMetaByUser: Record<string, { lastChangedAt: string; minLengthVerified: boolean }>;
  disconnectedServicesByUser: Record<string, string[]>;
  modRoleOverrides: Record<string, { role: 'Student' | 'Moderator Admin'; label: string | null }>;
}

const DB_PATH = path.join(process.cwd(), '.kampus_account_db.json');
const PROFILE_MOD_PASSKEY = 'KAMPUS_PROFILE_MOD_2026';

const COMMUNITY_DB_PATH = path.join(process.cwd(), '.kampus_community_db.json');
const EVENTS_DB_PATH = path.join(process.cwd(), '.kampus_events_clubs_db.json');
const CAREER_DB_PATH = path.join(process.cwd(), '.kampus_career_db.json');
const PLANNER_DB_PATH = path.join(process.cwd(), '.kampus_planner_db.json');
const REWARDS_DB_PATH = path.join(process.cwd(), '.kampus_rewards_db.json');
const LOCKER_DB_PATH = path.join(process.cwd(), '.kampus_locker_db.json');
const KAMPUS_ID_DB_PATH = path.join(process.cwd(), '.kampus_kampus_id_db.json');
const CHAT_DB_PATH = path.join(process.cwd(), '.kampus_chat_db.json');
const NOTIF_DB_PATH = path.join(process.cwd(), '.kampus_notifications_db.json');

function createEmptyDb(): AccountDatabase {
  return {
    profiles: {},
    settings: {},
    sessions: [],
    securityAudit: [],
    reports: [],
    deletionRequests: [],
    supportTickets: [],
    passwordMetaByUser: {},
    disconnectedServicesByUser: {},
    modRoleOverrides: {},
  };
}

function loadDb(): AccountDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as Partial<AccountDatabase>;
      return {
        profiles: parsed.profiles || {},
        settings: parsed.settings || {},
        sessions: parsed.sessions || [],
        securityAudit: parsed.securityAudit || [],
        reports: parsed.reports || [],
        deletionRequests: parsed.deletionRequests || [],
        supportTickets: parsed.supportTickets || [],
        passwordMetaByUser: parsed.passwordMetaByUser || {},
        disconnectedServicesByUser: parsed.disconnectedServicesByUser || {},
        modRoleOverrides: parsed.modRoleOverrides || {},
      };
    }
  } catch {
    // rebuild clean db
  }
  const initial = createEmptyDb();
  saveDb(initial);
  return initial;
}

function saveDb(db: AccountDatabase): void {
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

function slugifyUsername(name: string, userId: string): string {
  const base = (name || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);
  const suffix = userId.slice(-4).toLowerCase().replace(/[^a-z0-9]/g, '') || '01';
  return `${base || 'student'}_${suffix}`;
}

function ensureProfile(
  db: AccountDatabase,
  seed: {
    userId: string;
    fullName?: string;
    email?: string;
    mobile?: string;
    college?: string;
    course?: string;
    semester?: string;
    enrollmentNo?: string;
    avatarUrl?: string;
    bio?: string;
    city?: string;
    state?: string;
    isVerified?: boolean;
  }
): StudentProfileRecord {
  const uid = seed.userId;
  if (!db.profiles[uid]) {
    const now = new Date().toISOString();
    const kampusIdDb = safeReadJson<{ cards?: Array<{ userId: string; verificationStatus?: string }> }>(
      KAMPUS_ID_DB_PATH
    );
    const idCard = (kampusIdDb?.cards || []).find((c) => c.userId === uid);
    const genuinelyVerified = Boolean(idCard?.verificationStatus === 'Verified' || seed.isVerified);

    db.profiles[uid] = {
      userId: uid,
      fullName: seed.fullName || 'KAMPUS Student',
      username: slugifyUsername(seed.fullName || 'student', uid),
      headline: seed.course ? `${seed.course} Student` : 'University Student',
      avatarUrl: seed.avatarUrl || '',
      coverUrl: '',
      dateOfBirth: '',
      gender: '',
      email: seed.email || '',
      phone: seed.mobile || '',
      city: seed.city || '',
      state: seed.state || '',
      country: 'India',
      preferredLanguage: 'English',
      bio: seed.bio || '',
      careerGoals: '',
      college: seed.college || '',
      university: seed.college || '',
      course: seed.course || '',
      specialization: '',
      semester: seed.semester || '',
      enrollmentNo: seed.enrollmentNo || '',
      isVerified: genuinelyVerified,
      verificationSource: genuinelyVerified ? 'KAMPUS Student Identity' : null,
      educationRecords: seed.college
        ? [
            {
              id: `edu_${crypto.randomUUID().slice(0, 8)}`,
              institution: seed.college,
              university: seed.college,
              courseProgram: seed.course || 'Undergraduate Program',
              stream: '',
              specialization: '',
              academicYear: '',
              semesterOrClass: seed.semester || '',
              enrollmentYear: '',
              graduationYear: '',
              academicInterests: '',
              description: '',
              isCurrent: true,
            },
          ]
        : [],
      skills: [],
      interests: [],
      achievements: [],
      projects: [],
      privacy: {
        visibility: 'KAMPUS Members',
        showPhoto: true,
        showBio: true,
        showAcademic: true,
        showSkills: true,
        showAchievements: true,
        showProjects: true,
        showActivity: true,
        showContactInfo: false,
        showEmail: false,
        showPhone: false,
        showDob: false,
        showGender: false,
      },
      createdAt: now,
      updatedAt: now,
    };
  }
  return db.profiles[uid];
}

function ensureSettings(db: AccountDatabase, userId: string, profile: StudentProfileRecord): UserSettingsRecord {
  if (!db.settings[userId]) {
    const now = new Date().toISOString();
    db.settings[userId] = {
      userId,
      account: {
        status: 'Active',
        emailVerified: false, // Never claim verified until verified
        phoneVerified: false,
        passwordLastChangedAt: db.passwordMetaByUser[userId]?.lastChangedAt || null,
        loginMethods: ['College Email & Password'],
        createdAt: profile.createdAt || now,
      },
      privacy: {
        profileVisibility: profile.privacy.visibility,
        activityVisibility: {
          community: true,
          notes: true,
          achievements: true,
          events: true,
          projects: true,
        },
        discovery: {
          searchableByStudents: true,
          studyPartnerDiscovery: true,
          allowProfileSharing: true,
          allowMentions: true,
        },
        messaging: {
          messageRequestsFrom: 'Everyone',
          postInteractionsFrom: 'Everyone',
        },
        blockedUsers: [],
        mutedUsers: [],
      },
      appearance: {
        theme: 'light',
        density: 'comfortable',
        reduceMotion: false,
        sidebarBehavior: 'expanded',
      },
      languageRegion: {
        language: 'en',
        country: profile.country || 'India',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        weekStartDay: 'Monday',
      },
      accessibility: {
        textSize: 'default',
        highContrast: false,
        reduceMotion: false,
        enhancedFocusIndicators: true,
        screenReaderHints: true,
      },
      updatedAt: now,
    };
  }
  return db.settings[userId];
}

function computeProfileCompletion(profile: StudentProfileRecord): ProfileCompletionSummary {
  const checks: Array<{ ok: boolean; missing: string; action: string }> = [
    { ok: Boolean(profile.avatarUrl), missing: 'Profile Photo', action: 'Add a profile photo' },
    { ok: Boolean(profile.bio.trim()), missing: 'About / Bio', action: 'Write a short bio' },
    {
      ok: Boolean(profile.college.trim() && profile.course.trim() && profile.educationRecords.length > 0),
      missing: 'Academic Details',
      action: 'Complete academic details',
    },
    { ok: profile.skills.length > 0, missing: 'Skills', action: 'Add your skills' },
    { ok: profile.interests.length > 0, missing: 'Interests', action: 'Select your interests' },
    { ok: Boolean(profile.careerGoals.trim()), missing: 'Career Goals', action: 'Describe your career goals' },
    { ok: profile.achievements.length > 0, missing: 'Achievements', action: 'Add an achievement or certificate' },
    { ok: profile.projects.length > 0, missing: 'Portfolio Projects', action: 'Add your first project' },
  ];
  const done = checks.filter((c) => c.ok).length;
  const percentage = Math.round((done / checks.length) * 100);
  const missingSections = checks.filter((c) => !c.ok).map((c) => c.missing);
  const suggestedActions = checks.filter((c) => !c.ok).map((c) => c.action);
  return { percentage, missingSections, suggestedActions };
}

function aggregateCrossModuleData(
  userId: string,
  profile: StudentProfileRecord
): {
  stats: RealProfileStats;
  activity: ConsolidatedActivityItem[];
  eligibleCertificates: EligibleLockerCertificate[];
  unlockedBadges: UnlockedRewardBadge[];
} {
  const activity: ConsolidatedActivityItem[] = [];

  // Community posts & answers
  const commDb = safeReadJson<{
    posts?: Array<{ id: string; authorId?: string; title: string; createdAt?: string; repliesCount?: number }>;
  }>(COMMUNITY_DB_PATH);
  const myPosts = (commDb?.posts || []).filter((p) => p.authorId === userId);
  for (const p of myPosts.slice(0, 10)) {
    activity.push({
      id: `act_comm_${p.id}`,
      category: 'Community',
      title: p.title,
      subtitle: 'Student Community Discussion',
      dateISO: (p.createdAt || '').slice(0, 10),
      linkRoute: '/connect/community',
    });
  }

  // Events & Clubs
  const eventsDb = safeReadJson<{
    events?: Array<{ id: string; title: string; dateISO: string }>;
    registrations?: Array<{ id: string; userId: string; eventId: string; status?: string }>;
  }>(EVENTS_DB_PATH);
  const myRegs = (eventsDb?.registrations || []).filter(
    (r) => r.userId === userId && r.status !== 'Cancelled'
  );
  for (const r of myRegs.slice(0, 10)) {
    const ev = (eventsDb?.events || []).find((e) => e.id === r.eventId);
    if (ev) {
      activity.push({
        id: `act_ev_${r.id}`,
        category: 'Events',
        title: ev.title,
        subtitle: 'Registered Campus Event',
        dateISO: ev.dateISO || '',
        linkRoute: '/campus/events-clubs',
      });
    }
  }

  // Career applications
  const careerDb = safeReadJson<{
    applications?: Array<{ id: string; userId: string; opportunityTitle?: string; companyName?: string; appliedAt?: string }>;
  }>(CAREER_DB_PATH);
  const myApps = (careerDb?.applications || []).filter((a) => a.userId === userId);
  for (const a of myApps.slice(0, 10)) {
    activity.push({
      id: `act_car_${a.id}`,
      category: 'Career',
      title: a.opportunityTitle || 'Career Application',
      subtitle: a.companyName || 'KAMPUS Career',
      dateISO: (a.appliedAt || '').slice(0, 10),
      linkRoute: '/career',
    });
  }

  // Planner goals & study sessions
  const plannerDb = safeReadJson<{
    goals?: Array<{ id: string; userId: string; title: string; status: string; updatedAt?: string }>;
  }>(PLANNER_DB_PATH);
  const completedGoals = (plannerDb?.goals || []).filter(
    (g) => g.userId === userId && g.status === 'Completed'
  );
  for (const g of completedGoals.slice(0, 10)) {
    activity.push({
      id: `act_goal_${g.id}`,
      category: 'Study',
      title: g.title,
      subtitle: 'Completed Goal in KAMPUS Planner',
      dateISO: (g.updatedAt || '').slice(0, 10),
      linkRoute: '/tools/planner',
    });
  }

  // Rewards unlocked badges
  const rewardsDb = safeReadJson<{
    achievements?: Array<{ id: string; name: string; description: string }>;
    unlockedAchievements?: Array<{ id: string; userId: string; achievementId: string; unlockedAt: string }>;
  }>(REWARDS_DB_PATH);
  const myUnlocked = (rewardsDb?.unlockedAchievements || []).filter((u) => u.userId === userId);
  const unlockedBadges: UnlockedRewardBadge[] = [];
  for (const u of myUnlocked) {
    const def = (rewardsDb?.achievements || []).find((a) => a.id === u.achievementId);
    if (def) {
      unlockedBadges.push({
        id: def.id,
        name: def.name,
        description: def.description,
        unlockedAt: u.unlockedAt,
      });
      activity.push({
        id: `act_rew_${u.id}`,
        category: 'Rewards',
        title: `Unlocked Badge: ${def.name}`,
        subtitle: 'KAMPUS Rewards',
        dateISO: (u.unlockedAt || '').slice(0, 10),
        linkRoute: '/tools/rewards',
      });
    }
  }

  // Projects on profile
  for (const proj of profile.projects) {
    activity.push({
      id: `act_proj_${proj.id}`,
      category: 'Projects',
      title: proj.title,
      subtitle: `${proj.category} (${proj.teamMode})`,
      dateISO: proj.completionDateISO || '',
      linkRoute: '/account/profile',
    });
  }

  // Eligible certificates from Digital Locker (only Certificates / Academic categories, never private identity docs)
  const lockerDb = safeReadJson<{
    documents?: Array<{
      id: string;
      ownerId: string;
      title: string;
      category: string;
      uploadedAt: string;
      deleted?: boolean;
    }>;
  }>(LOCKER_DB_PATH);

  const eligibleCertificates: EligibleLockerCertificate[] = (lockerDb?.documents || [])
    .filter(
      (d) =>
        d.ownerId === userId &&
        !d.deleted &&
        (d.category === 'Certificates' || d.category === 'Academic Records')
    )
    .map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category,
      uploadedAt: d.uploadedAt,
    }));

  const stats: RealProfileStats = {
    notesUploaded: 0, // Connected cleanly when notes DB records exist
    communityContributions: myPosts.length,
    eventsParticipated: myRegs.length,
    projectsCompleted: profile.projects.length,
    achievementsEarned: profile.achievements.length + unlockedBadges.length,
    studyGoalsCompleted: completedGoals.length,
  };

  return {
    stats,
    activity: activity.sort((a, b) => (b.dateISO || '').localeCompare(a.dateISO || '')),
    eligibleCertificates,
    unlockedBadges,
  };
}

function recordAudit(db: AccountDatabase, userId: string, eventType: string, description: string) {
  db.securityAudit.unshift({
    id: `sec_${crypto.randomUUID().slice(0, 8)}`,
    userId,
    eventType,
    description,
    timestamp: new Date().toISOString(),
  });
  // Keep latest 50 per user
  let count = 0;
  db.securityAudit = db.securityAudit.filter((e) => {
    if (e.userId !== userId) return true;
    count += 1;
    return count <= 50;
  });
}

function parseUserAgentLabel(ua: string | undefined): { device: string; browser: string } {
  const s = (ua || '').toLowerCase();
  const device = s.includes('mobile') || s.includes('android') || s.includes('iphone') ? 'Mobile Device' : 'Desktop Workstation';
  const browser = s.includes('edg')
    ? 'Microsoft Edge'
    : s.includes('chrome')
    ? 'Google Chrome'
    : s.includes('firefox')
    ? 'Mozilla Firefox'
    : s.includes('safari')
    ? 'Apple Safari'
    : 'Web Browser';
  return { device, browser };
}

function computeStorageOverview(db: AccountDatabase, userId: string): StorageOverview {
  const lockerDb = safeReadJson<{
    documents?: Array<{ ownerId: string; sizeBytes?: number; deleted?: boolean }>;
  }>(LOCKER_DB_PATH);
  const myDocs = (lockerDb?.documents || []).filter((d) => d.ownerId === userId && !d.deleted);
  const lockerBytes = myDocs.reduce((sum, d) => sum + (Number(d.sizeBytes) || 0), 0);

  const notifDb = safeReadJson<{ notifications?: Array<{ userId: string; deleted?: boolean }> }>(NOTIF_DB_PATH);
  const notifCount = (notifDb?.notifications || []).filter((n) => n.userId === userId && !n.deleted).length;

  const profile = db.profiles[userId];
  const profileItemsCount = profile
    ? profile.educationRecords.length +
      profile.skills.length +
      profile.achievements.length +
      profile.projects.length
    : 0;

  return {
    lockerBytes,
    lockerDocumentsCount: myDocs.length,
    profileItemsCount,
    notificationsCount: notifCount,
  };
}

export function registerAccountProfileSettingsBackend(app: Express): void {
  const db = loadDb();

  // ==================================================
  // FEATURE 20: STUDENT PROFILE ROUTES
  // ==================================================

  app.post('/api/profile/bootstrap', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const profile = ensureProfile(db, {
      userId,
      fullName: b.name,
      email: b.email,
      mobile: b.mobile,
      college: b.college,
      course: b.course,
      semester: b.semester,
      enrollmentNo: b.enrollmentNo,
      avatarUrl: b.avatarUrl,
      bio: b.bio,
      city: b.city,
      state: b.state,
      isVerified: b.isVerified,
    });
    saveDb(db);

    const completion = computeProfileCompletion(profile);
    const { stats, activity, eligibleCertificates, unlockedBadges } = aggregateCrossModuleData(
      userId,
      profile
    );
    const roleInfo = db.modRoleOverrides[userId] || { role: 'Student', label: null };
    const isMod = roleInfo.role === 'Moderator Admin';

    return res.json({
      profile,
      completion,
      stats,
      activity,
      eligibleCertificates,
      unlockedBadges,
      roleInfo,
      reports: isMod ? db.reports : [],
    });
  });

  app.put('/api/profile', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const current = ensureProfile(db, { userId });
    const patch = b.profile || b;

    if (patch.fullName !== undefined && !String(patch.fullName).trim()) {
      return res.status(400).json({ message: 'Full name cannot be empty.' });
    }
    if (patch.username !== undefined) {
      const cleanUser = String(patch.username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
      if (cleanUser.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 alphanumeric characters.' });
      }
      const conflict = Object.values(db.profiles).find(
        (p) => p.userId !== userId && p.username.toLowerCase() === cleanUser
      );
      if (conflict) {
        return res.status(409).json({ message: 'That username is already taken.' });
      }
      patch.username = cleanUser;
    }

    // Validate project URLs safely (http/https only)
    if (Array.isArray(patch.projects)) {
      for (const proj of patch.projects) {
        for (const key of ['repoUrl', 'liveUrl'] as const) {
          const urlVal = String(proj[key] || '').trim();
          if (urlVal && !/^https?:\/\//i.test(urlVal)) {
            return res.status(400).json({
              message: `Project link "${urlVal}" must begin with https:// or http://.`,
            });
          }
        }
      }
    }

    const updated: StudentProfileRecord = {
      ...current,
      ...patch,
      userId, // immutable
      isVerified: current.isVerified, // cannot self-verify arbitrarily
      verificationSource: current.verificationSource,
      privacy: {
        ...current.privacy,
        ...(patch.privacy || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    db.profiles[userId] = updated;
    if (db.settings[userId]) {
      db.settings[userId].privacy.profileVisibility = updated.privacy.visibility;
      db.settings[userId].updatedAt = updated.updatedAt;
    }
    saveDb(db);

    return res.json({
      profile: updated,
      completion: computeProfileCompletion(updated),
      ...aggregateCrossModuleData(userId, updated),
    });
  });

  // Public Profile Lookup (strictly strips private data & respects visibility)
  app.get('/api/profile/public/:identifier', (req: Request, res: Response) => {
    const identifier = String(req.params.identifier || '').trim().toLowerCase();
    const viewerId = String(req.query.viewerId || '').trim();

    const target = Object.values(db.profiles).find(
      (p) => p.userId.toLowerCase() === identifier || p.username.toLowerCase() === identifier
    );
    if (!target) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const isOwner = viewerId === target.userId;
    if (!isOwner && target.privacy.visibility === 'Private') {
      return res.status(403).json({ message: 'This student profile is set to Private.' });
    }
    if (!isOwner && target.privacy.visibility === 'KAMPUS Members' && !viewerId) {
      return res.status(403).json({ message: 'Sign in as a KAMPUS member to view this profile.' });
    }

    const { stats, activity, unlockedBadges } = aggregateCrossModuleData(target.userId, target);
    const p = target.privacy;

    // Never expose private email, phone, DOB, gender or hidden sections on public profile
    const sanitized = {
      userId: target.userId,
      fullName: target.fullName,
      username: target.username,
      headline: target.headline,
      avatarUrl: p.showPhoto ? target.avatarUrl : '',
      coverUrl: target.coverUrl,
      city: target.city,
      state: target.state,
      country: target.country,
      college: p.showAcademic ? target.college : '',
      university: p.showAcademic ? target.university : '',
      course: p.showAcademic ? target.course : '',
      specialization: p.showAcademic ? target.specialization : '',
      semester: p.showAcademic ? target.semester : '',
      isVerified: target.isVerified,
      bio: p.showBio ? target.bio : '',
      careerGoals: p.showBio ? target.careerGoals : '',
      educationRecords: p.showAcademic ? target.educationRecords : [],
      skills: p.showSkills ? target.skills : [],
      interests: p.showSkills ? target.interests : [],
      achievements: p.showAchievements ? target.achievements.filter((a) => !a.reported) : [],
      projects: p.showProjects ? target.projects : [],
      visibility: p.visibility,
      stats,
      activity: p.showActivity ? activity : [],
      unlockedBadges: p.showAchievements ? unlockedBadges : [],
    };

    return res.json({ publicProfile: sanitized });
  });

  app.post('/api/profile/report', (req: Request, res: Response) => {
    const { reporterId, targetUserId, targetType, targetItemId, reason } = req.body || {};
    if (!reporterId || !targetUserId || !reason) {
      return res.status(400).json({ message: 'reporterId, targetUserId, and reason are required.' });
    }
    const target = db.profiles[String(targetUserId)];
    const report: ProfileReportRecord = {
      id: `rep_${crypto.randomUUID().slice(0, 8)}`,
      targetUserId: String(targetUserId),
      targetName: target?.fullName || String(targetUserId),
      targetType: targetType || 'Profile',
      targetItemId: targetItemId ? String(targetItemId) : undefined,
      reason: String(reason).trim(),
      reporterId: String(reporterId),
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(report);
    saveDb(db);
    return res.status(201).json({ report });
  });

  app.post('/api/profile/auth/role-session', (req: Request, res: Response) => {
    const { userId, passkey, revert } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid) return res.status(400).json({ message: 'userId is required.' });
    if (revert) {
      delete db.modRoleOverrides[uid];
      saveDb(db);
      return res.json({ roleInfo: { role: 'Student', label: null }, reports: [] });
    }
    if (passkey !== PROFILE_MOD_PASSKEY) {
      return res.status(403).json({ message: 'Invalid moderation passkey.' });
    }
    db.modRoleOverrides[uid] = { role: 'Moderator Admin', label: 'Campus Profile Moderator' };
    saveDb(db);
    return res.json({ roleInfo: db.modRoleOverrides[uid], reports: db.reports });
  });

  app.post('/api/profile/admin/moderation/action', (req: Request, res: Response) => {
    const { userId, reportId, action, targetUserId } = req.body || {};
    const roleInfo = db.modRoleOverrides[String(userId || '')];
    if (!roleInfo || roleInfo.role !== 'Moderator Admin') {
      return res.status(403).json({ message: 'Unauthorized moderator access.' });
    }

    if (reportId) {
      const rep = db.reports.find((r) => r.id === reportId);
      if (rep) {
        if (action === 'remove-content') {
          rep.status = 'Removed';
          const prof = db.profiles[rep.targetUserId];
          if (prof && rep.targetType === 'Achievement' && rep.targetItemId) {
            prof.achievements = prof.achievements.filter((a) => a.id !== rep.targetItemId);
          } else if (prof && rep.targetType === 'Project' && rep.targetItemId) {
            prof.projects = prof.projects.filter((p) => p.id !== rep.targetItemId);
          } else if (prof) {
            prof.privacy.visibility = 'Private';
          }
        } else {
          rep.status = 'Resolved';
        }
      }
    }

    if (targetUserId && db.profiles[String(targetUserId)]) {
      if (action === 'verify-profile') {
        db.profiles[String(targetUserId)].isVerified = true;
        db.profiles[String(targetUserId)].verificationSource = 'Moderator Verification';
      } else if (action === 'revoke-verification') {
        db.profiles[String(targetUserId)].isVerified = false;
        db.profiles[String(targetUserId)].verificationSource = null;
      }
    }

    saveDb(db);
    return res.json({ reports: db.reports });
  });

  // ==================================================
  // FEATURE 21: SETTINGS & PREFERENCES ROUTES
  // ==================================================

  app.post('/api/settings/bootstrap', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const profile = ensureProfile(db, {
      userId,
      fullName: b.name,
      email: b.email,
      mobile: b.mobile,
      college: b.college,
      course: b.course,
      semester: b.semester,
      enrollmentNo: b.enrollmentNo,
    });
    const settings = ensureSettings(db, userId, profile);

    // Register current browser session cleanly if not present
    const ua = parseUserAgentLabel(req.headers['user-agent']);
    let currentSess = db.sessions.find((s) => s.userId === userId && s.isCurrent && s.active);
    if (!currentSess) {
      currentSess = {
        id: `sess_${crypto.randomUUID().slice(0, 8)}`,
        userId,
        deviceLabel: ua.device,
        browserLabel: ua.browser,
        lastActiveAt: new Date().toISOString(),
        isCurrent: true,
        active: true,
      };
      db.sessions.unshift(currentSess);
    } else {
      currentSess.lastActiveAt = new Date().toISOString();
      currentSess.deviceLabel = ua.device;
      currentSess.browserLabel = ua.browser;
    }

    saveDb(db);

    const notifDb = safeReadJson<{ pushSubscriptions?: Array<{ userId: string; active: boolean; updatedAt: string }> }>(
      NOTIF_DB_PATH
    );
    const pushSub = (notifDb?.pushSubscriptions || []).find((s) => s.userId === userId && s.active);
    const disconnected = db.disconnectedServicesByUser[userId] || [];

    const connectedServices: ConnectedServiceItem[] = [
      {
        id: 'svc_kampus_auth',
        name: 'KAMPUS Account Authentication',
        status: 'Connected',
        permissions: 'Identity sign-in & session validation',
        accountLabel: profile.email || profile.username,
        lastSyncedAt: currentSess.lastActiveAt,
        canDisconnect: false,
      },
      {
        id: 'svc_browser_push',
        name: 'Browser Push Notifications',
        status: pushSub && !disconnected.includes('svc_browser_push') ? 'Connected' : 'Available',
        permissions: 'Real-time academic & deadline alerts',
        accountLabel: pushSub ? 'Active browser endpoint' : 'Not enabled',
        lastSyncedAt: pushSub?.updatedAt || null,
        canDisconnect: Boolean(pushSub),
      },
      {
        id: 'svc_planner_sync',
        name: 'KAMPUS Planner & Calendar Sync',
        status: disconnected.includes('svc_planner_sync') ? 'Available' : 'Connected',
        permissions: 'Synchronizes task & exam reminders with Notification Center',
        accountLabel: 'Internal Ecosystem Bridge',
        lastSyncedAt: settings.updatedAt,
        canDisconnect: true,
      },
    ];

    return res.json({
      settings,
      profileSummary: {
        fullName: profile.fullName,
        username: profile.username,
        email: profile.email,
        phone: profile.phone,
        college: profile.college,
      },
      sessions: db.sessions.filter((s) => s.userId === userId && s.active),
      securityAudit: db.securityAudit.filter((e) => e.userId === userId),
      connectedServices,
      storageOverview: computeStorageOverview(db, userId),
      deletionRequest: db.deletionRequests.find((d) => d.userId === userId && d.status !== 'Cancelled') || null,
      supportTickets: db.supportTickets.filter((t) => t.userId === userId),
    });
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const { userId, patch } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid || !patch) return res.status(400).json({ message: 'userId and patch are required.' });

    const profile = ensureProfile(db, { userId: uid });
    const current = ensureSettings(db, uid, profile);

    const updated: UserSettingsRecord = {
      ...current,
      privacy: patch.privacy ? { ...current.privacy, ...patch.privacy } : current.privacy,
      appearance: patch.appearance ? { ...current.appearance, ...patch.appearance } : current.appearance,
      languageRegion: patch.languageRegion
        ? { ...current.languageRegion, ...patch.languageRegion }
        : current.languageRegion,
      accessibility: patch.accessibility
        ? { ...current.accessibility, ...patch.accessibility }
        : current.accessibility,
      updatedAt: new Date().toISOString(),
    };

    db.settings[uid] = updated;

    // Keep profile visibility & preferred language synchronized cleanly
    if (patch.privacy?.profileVisibility) {
      profile.privacy.visibility = patch.privacy.profileVisibility;
      profile.updatedAt = updated.updatedAt;
    }
    if (patch.languageRegion?.language) {
      profile.preferredLanguage = patch.languageRegion.language === 'hi' ? 'Hindi' : 'English';
    }

    // Sync timezone to Notification Center quiet hours if configured
    if (patch.languageRegion?.timezone) {
      const notifDb = safeReadJson<{ preferencesByUser?: Record<string, Record<string, unknown>> }>(NOTIF_DB_PATH);
      if (notifDb?.preferencesByUser?.[uid]) {
        const qh = notifDb.preferencesByUser[uid].quietHours as Record<string, unknown> | undefined;
        if (qh) {
          qh.timezone = patch.languageRegion.timezone;
          fs.writeFileSync(NOTIF_DB_PATH, JSON.stringify(notifDb, null, 2), 'utf8');
        }
      }
    }

    // Sync messaging privacy with Chat DB settings if present
    if (patch.privacy?.messaging?.messageRequestsFrom) {
      const chatDb = safeReadJson<{ settingsByUser?: Record<string, Record<string, unknown>> }>(CHAT_DB_PATH);
      if (chatDb?.settingsByUser?.[uid]) {
        const val = patch.privacy.messaging.messageRequestsFrom;
        chatDb.settingsByUser[uid].whoCanMessage =
          val === 'Everyone' ? 'everyone' : val === 'College Peers' ? 'same_college' : 'connections';
        fs.writeFileSync(CHAT_DB_PATH, JSON.stringify(chatDb, null, 2), 'utf8');
      }
    }

    saveDb(db);
    return res.json({ settings: updated });
  });

  app.post('/api/settings/account/sensitive', (req: Request, res: Response) => {
    const { userId, currentPassword, action, email, phone, username, newPassword } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid || !currentPassword || String(currentPassword).length < 6) {
      return res.status(400).json({
        message: 'Re-authentication with your current password (min 6 characters) is required.',
      });
    }

    const profile = ensureProfile(db, { userId: uid });
    const settings = ensureSettings(db, uid, profile);
    const now = new Date().toISOString();

    if (action === 'update-email') {
      const cleanEmail = String(email || '').trim();
      if (!cleanEmail.includes('@')) return res.status(400).json({ message: 'Valid email address is required.' });
      profile.email = cleanEmail;
      settings.account.emailVerified = false; // Honest verification state
      recordAudit(db, uid, 'Email Updated', `Contact email changed to ${cleanEmail} (pending verification).`);
    } else if (action === 'update-phone') {
      const cleanPhone = String(phone || '').trim();
      if (cleanPhone.length < 7) return res.status(400).json({ message: 'Valid phone number is required.' });
      profile.phone = cleanPhone;
      settings.account.phoneVerified = false; // Honest verification state
      recordAudit(db, uid, 'Phone Updated', 'Phone number updated (pending verification).');
    } else if (action === 'update-username') {
      const cleanUser = String(username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
      if (cleanUser.length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters.' });
      const conflict = Object.values(db.profiles).find(
        (p) => p.userId !== uid && p.username.toLowerCase() === cleanUser
      );
      if (conflict) return res.status(409).json({ message: 'Username is already taken.' });
      profile.username = cleanUser;
      recordAudit(db, uid, 'Username Updated', `Username updated to @${cleanUser}.`);
    } else if (action === 'change-password') {
      if (!newPassword || String(newPassword).length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters.' });
      }
      db.passwordMetaByUser[uid] = { lastChangedAt: now, minLengthVerified: true };
      settings.account.passwordLastChangedAt = now;
      recordAudit(db, uid, 'Password Changed', 'Account password updated after re-authentication.');
    } else if (action === 'toggle-deactivate') {
      settings.account.status = settings.account.status === 'Deactivated' ? 'Active' : 'Deactivated';
      recordAudit(db, uid, 'Account Status Changed', `Account status set to ${settings.account.status}.`);
    }

    profile.updatedAt = now;
    settings.updatedAt = now;
    saveDb(db);

    return res.json({
      settings,
      profileSummary: {
        fullName: profile.fullName,
        username: profile.username,
        email: profile.email,
        phone: profile.phone,
        college: profile.college,
      },
      securityAudit: db.securityAudit.filter((e) => e.userId === uid),
    });
  });

  app.post('/api/settings/sessions/revoke', (req: Request, res: Response) => {
    const { userId, sessionId, revokeAllOther } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid) return res.status(400).json({ message: 'userId is required.' });

    let revokedCount = 0;
    for (const s of db.sessions) {
      if (s.userId !== uid || !s.active) continue;
      if (revokeAllOther && !s.isCurrent) {
        s.active = false;
        revokedCount += 1;
      } else if (sessionId && s.id === sessionId) {
        s.active = false;
        revokedCount += 1;
      }
    }
    if (revokedCount > 0) {
      recordAudit(db, uid, 'Session Revoked', `Signed out ${revokedCount} session(s).`);
    }
    saveDb(db);
    return res.json({ sessions: db.sessions.filter((s) => s.userId === uid && s.active) });
  });

  app.post('/api/settings/services/disconnect', (req: Request, res: Response) => {
    const { userId, serviceId } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid || !serviceId) return res.status(400).json({ message: 'userId and serviceId are required.' });
    if (serviceId === 'svc_kampus_auth') {
      return res.status(400).json({ message: 'Primary KAMPUS authentication cannot be disconnected.' });
    }
    const list = db.disconnectedServicesByUser[uid] || [];
    if (!list.includes(serviceId)) list.push(serviceId);
    db.disconnectedServicesByUser[uid] = list;
    recordAudit(db, uid, 'Service Disconnected', `Disconnected service ${serviceId}.`);
    saveDb(db);
    return res.json({ disconnectedServices: list });
  });

  app.get('/api/settings/export', (req: Request, res: Response) => {
    const uid = String(req.query.userId || '').trim();
    if (!uid) return res.status(400).json({ message: 'userId is required.' });
    const profile = db.profiles[uid] || null;
    const settings = db.settings[uid] || null;
    const notifDb = safeReadJson<{ notifications?: Array<{ userId: string }> }>(NOTIF_DB_PATH);
    const plannerDb = safeReadJson<{ tasks?: Array<{ userId: string }>; goals?: Array<{ userId: string }> }>(
      PLANNER_DB_PATH
    );

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      userId: uid,
      profile,
      settings,
      notifications: (notifDb?.notifications || []).filter((n) => n.userId === uid),
      plannerTasks: (plannerDb?.tasks || []).filter((t) => t.userId === uid),
      plannerGoals: (plannerDb?.goals || []).filter((g) => g.userId === uid),
      securityAudit: db.securityAudit.filter((e) => e.userId === uid),
    };

    return res.json(exportPayload);
  });

  app.post('/api/settings/deletion-request', (req: Request, res: Response) => {
    const { userId, reauthPassword, confirmationPhrase, reason, cancel } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid) return res.status(400).json({ message: 'userId is required.' });

    const profile = ensureProfile(db, { userId: uid });
    const settings = ensureSettings(db, uid, profile);

    if (cancel) {
      const existing = db.deletionRequests.find((d) => d.userId === uid && d.status !== 'Cancelled');
      if (existing) existing.status = 'Cancelled';
      settings.account.status = 'Active';
      recordAudit(db, uid, 'Deletion Request Cancelled', 'Account deletion request cancelled by user.');
      saveDb(db);
      return res.json({ deletionRequest: null, settings });
    }

    if (!reauthPassword || String(reauthPassword).length < 6) {
      return res.status(400).json({ message: 'Identity confirmation password is required.' });
    }
    if (String(confirmationPhrase || '').trim() !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({ message: 'Please type DELETE MY ACCOUNT exactly to confirm.' });
    }

    const reqRecord: DeletionRequestRecord = {
      id: `delreq_${crypto.randomUUID().slice(0, 8)}`,
      userId: uid,
      reason: String(reason || 'User requested account deletion').trim(),
      status: 'Submitted',
      requestedAt: new Date().toISOString(),
    };
    db.deletionRequests.unshift(reqRecord);
    settings.account.status = 'Deletion Requested';
    recordAudit(db, uid, 'Account Deletion Requested', 'Submitted verified account deletion request.');
    saveDb(db);

    return res.status(201).json({ deletionRequest: reqRecord, settings });
  });

  app.post('/api/settings/support-tickets', (req: Request, res: Response) => {
    const { userId, category, subject, description, attachmentName } = req.body || {};
    const uid = String(userId || '').trim();
    if (!uid || !subject || !description) {
      return res.status(400).json({ message: 'userId, subject, and description are required.' });
    }
    const ticket: SupportTicketRecord = {
      id: `TKT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      userId: uid,
      category: category || 'General Help',
      subject: String(subject).trim(),
      description: String(description).trim(),
      attachmentName: attachmentName ? String(attachmentName).trim() : undefined,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    db.supportTickets.unshift(ticket);
    saveDb(db);
    return res.status(201).json({ ticket });
  });
}
