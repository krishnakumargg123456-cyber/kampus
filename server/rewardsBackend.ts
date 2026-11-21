import { ModuleStorage } from '../database/moduleStorage.ts';
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  AchievementDefinition,
  ChallengeDefinition,
  ChallengeParticipation,
  LeaderboardEntry,
  LeaderboardPeriod,
  PointEarningRule,
  PointTransaction,
  RedemptionRecord,
  RedemptionStatus,
  ReferralRecord,
  RewardCatalogItem,
  RewardLevelConfig,
  RewardsAdminAuditLog,
  RewardsAnalytics,
  RewardsRole,
  StudentPointsWallet,
  UnlockedAchievement,
} from '../src/types/rewards.ts';

interface VerifiedEcosystemSnapshot {
  studySessionsJoinedOrHosted: number;
  careerAssessmentsCompleted: number;
  careerResumesCreated: number;
  eventsCheckedIn: number;
  clubsJoined: number;
  voicePollsVoted: number;
  voiceFeedbackSubmitted: number;
  lockerDocsUploaded: number;
  verifiedEvents: Array<{
    sourceEventKey: string;
    ruleAction: string;
    description: string;
    createdAt: string;
  }>;
}

interface RewardsDatabase {
  wallets: Record<string, StudentPointsWallet>;
  transactions: PointTransaction[];
  rules: PointEarningRule[];
  levels: RewardLevelConfig[];
  achievements: AchievementDefinition[];
  unlockedAchievements: UnlockedAchievement[];
  challenges: ChallengeDefinition[];
  challengeParticipations: ChallengeParticipation[];
  catalog: RewardCatalogItem[];
  redemptions: RedemptionRecord[];
  referrals: ReferralRecord[];
  auditLogs: RewardsAdminAuditLog[];
  roleOverrides: Record<string, { role: RewardsRole; label: string }>;
}

const DB_PATH = path.join(process.cwd(), '.kampus_rewards_db.json');
const REWARDS_ADMIN_PASSKEY = 'KMP-REWARDS-ADMIN-2026';

const STUDY_DB_PATH = path.join(process.cwd(), '.kampus_study_rooms_db.json');
const EVENTS_DB_PATH = path.join(process.cwd(), '.kampus_events_clubs_db.json');
const CAREER_DB_PATH = path.join(process.cwd(), '.kampus_career_db.json');
const VOICE_DB_PATH = path.join(process.cwd(), '.kampus_student_voice_db.json');
const LOCKER_DB_PATH = path.join(process.cwd(), '.kampus_locker_db.json');

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function createSeedDatabase(): RewardsDatabase {
  const rules: PointEarningRule[] = [
    {
      id: 'rule_study_session',
      module: 'Study Hub',
      actionName: 'Verified Study Room Session',
      description: 'Participate in or host a verified Study Room session.',
      points: 25,
      dailyLimit: 2,
      active: true,
    },
    {
      id: 'rule_notes_approved',
      module: 'Notes Exchange',
      actionName: 'Approved Study Document Contribution',
      description: 'Upload and organize verified academic documents.',
      points: 20,
      dailyLimit: 3,
      active: true,
    },
    {
      id: 'rule_community_answer',
      module: 'Student Community',
      actionName: 'Accepted Academic Discussion Contribution',
      description: 'Contribute helpful study guidance or answers in campus communities.',
      points: 30,
      dailyLimit: 3,
      active: true,
    },
    {
      id: 'rule_event_checkin',
      module: 'Events & Clubs',
      actionName: 'Verified Event Attendance Check-In',
      description: 'QR-verified attendance at an official campus event or workshop.',
      points: 40,
      dailyLimit: 2,
      active: true,
    },
    {
      id: 'rule_career_assessment',
      module: 'Career',
      actionName: 'Completed Career Readiness Assessment',
      description: 'Finish an aptitude, coding, or interview assessment in KAMPUS Career.',
      points: 35,
      dailyLimit: 2,
      active: true,
    },
    {
      id: 'rule_voice_survey',
      module: 'Student Voice',
      actionName: 'Campus Poll / Constructive Survey Participation',
      description: 'Cast a verified campus poll vote or submit constructive institutional feedback.',
      points: 15,
      dailyLimit: 2,
      active: true,
    },
  ];

  const levels: RewardLevelConfig[] = [
    {
      levelNumber: 1,
      name: 'STARTER',
      tagline: 'Welcome to KAMPUS.',
      minPoints: 0,
      benefits: ['Access KAMPUS Digital Rewards Store', 'Join Daily & Weekly Challenges'],
    },
    {
      levelNumber: 2,
      name: 'EXPLORER',
      tagline: 'Explore the student ecosystem.',
      minPoints: 100,
      benefits: ['Unlock Career Templates & Checklists', 'Priority Study Pack Downloads'],
    },
    {
      levelNumber: 3,
      name: 'ACHIEVER',
      tagline: 'Build consistent learning habits.',
      minPoints: 300,
      benefits: ['Unlock ATS Resume & Interview Kits', 'Featured Explorer Profile Ribbon'],
    },
    {
      levelNumber: 4,
      name: 'CHAMPION',
      tagline: 'Become an active student contributor.',
      minPoints: 700,
      benefits: ['Unlock Priority Campus Workshop Passes', 'Custom Profile Theme Pack'],
    },
    {
      levelNumber: 5,
      name: 'LEGEND',
      tagline: 'Reach exceptional community milestones.',
      minPoints: 1500,
      benefits: ['Campus Honours Digital Crest', 'Early Access to New Campus Tools'],
    },
  ];

  const achievements: AchievementDefinition[] = [
    {
      id: 'ach_first_study',
      name: 'First Study Session',
      category: 'Academic',
      description: 'Join or host your first collaborative Study Room on KAMPUS.',
      criteriaText: '1 verified Study Room participation',
      criteriaKey: 'study_sessions',
      threshold: 1,
    },
    {
      id: 'ach_quiz_master',
      name: 'Assessment Finisher',
      category: 'Career',
      description: 'Complete at least one career readiness assessment.',
      criteriaText: '1 completed Career Assessment',
      criteriaKey: 'career_assessments',
      threshold: 1,
    },
    {
      id: 'ach_resume_ready',
      name: 'Resume Ready',
      category: 'Career',
      description: 'Create and maintain a structured resume inside KAMPUS Career.',
      criteriaText: '1 Resume created in Career Hub',
      criteriaKey: 'career_resumes',
      threshold: 1,
    },
    {
      id: 'ach_event_explorer',
      name: 'Event Explorer',
      category: 'Campus',
      description: 'Verify attendance at an official campus workshop, seminar, or fest event.',
      criteriaText: '1 QR-verified event attendance',
      criteriaKey: 'events_checked_in',
      threshold: 1,
    },
    {
      id: 'ach_club_participant',
      name: 'Club Participant',
      category: 'Campus',
      description: 'Join an active campus student club or technical society.',
      criteriaText: '1 active club membership',
      criteriaKey: 'clubs_joined',
      threshold: 1,
    },
    {
      id: 'ach_community_voice',
      name: 'Constructive Campus Voice',
      category: 'Community',
      description: 'Share constructive feedback or participate in an official campus poll.',
      criteriaText: '1 verified poll vote or feedback entry',
      criteriaKey: 'voice_contributions',
      threshold: 1,
    },
    {
      id: 'ach_doc_organizer',
      name: 'Vault Organizer',
      category: 'Personal Growth',
      description: 'Store and organize academic or career records safely in Digital Locker.',
      criteriaText: '1 encrypted file in Digital Locker',
      criteriaKey: 'locker_docs',
      threshold: 1,
    },
    {
      id: 'ach_challenge_done',
      name: 'Challenge Completed',
      category: 'Personal Growth',
      description: 'Complete and claim your first KAMPUS Rewards challenge.',
      criteriaText: '1 claimed Rewards Challenge',
      criteriaKey: 'challenges_claimed',
      threshold: 1,
    },
  ];

  const challenges: ChallengeDefinition[] = [
    {
      id: 'chl_daily_voice',
      cadence: 'Daily',
      name: 'Voice Your Campus Perspective',
      description: 'Participate in a Student Voice poll or submit constructive campus feedback.',
      rewardPoints: 20,
      targetCount: 1,
      metricKey: 'voice_contributions',
      deadlineISO: addDaysISO(1),
      active: true,
    },
    {
      id: 'chl_daily_locker',
      cadence: 'Daily',
      name: 'Back Up an Academic Record',
      description: 'Upload and categorize at least 1 academic or career document in Digital Locker.',
      rewardPoints: 20,
      targetCount: 1,
      metricKey: 'locker_docs',
      deadlineISO: addDaysISO(1),
      active: true,
    },
    {
      id: 'chl_weekly_career',
      cadence: 'Weekly',
      name: 'Weekly Career Readiness Sprint',
      description: 'Complete a career assessment and build or update your resume in Career Hub.',
      rewardPoints: 45,
      targetCount: 2,
      metricKey: 'career_total',
      deadlineISO: addDaysISO(7),
      active: true,
    },
    {
      id: 'chl_weekly_campus',
      cadence: 'Weekly',
      name: 'Active Campus Engagement',
      description: 'Check in at a campus event or join an active student club in Events & Clubs.',
      rewardPoints: 40,
      targetCount: 1,
      metricKey: 'campus_total',
      deadlineISO: addDaysISO(7),
      active: true,
    },
  ];

  const catalog: RewardCatalogItem[] = [
    {
      id: 'rw_study_planner_pack',
      name: 'Semester Study & Exam Revision Pack',
      category: 'Study Rewards',
      description:
        'Structured semester syllabus tracker, spaced-repetition revision checklist, and exam formula template.',
      requiredPoints: 25,
      requiredLevel: 1,
      stockRemaining: -1,
      imageKey: 'study_pack',
      isPartnerOffer: false,
      digitalContent: {
        title: 'KAMPUS Semester Revision Blueprint',
        instructions:
          'Save these templates in your Study Hub or Digital Locker to structure 14-day exam blocks.',
        resourceText:
          '1. 7-3-1 Spaced Review Cadence: Review new lecture notes at 24h, Day 3, and Day 7.\n2. Formula & Proof Sheet: Condense each unit to 1 single-sided sheet.\n3. Timed Mock Sprint: Allocate 60% of final 5 days to timed past-paper problem sets.',
      },
      active: true,
    },
    {
      id: 'rw_career_ats_kit',
      name: 'ATS Resume & Technical Interview Kit',
      category: 'Career Rewards',
      description:
        'Curated engineering & internship resume bullet templates plus structured behavioral STAR prompts.',
      requiredPoints: 50,
      requiredLevel: 1,
      stockRemaining: -1,
      imageKey: 'career_kit',
      isPartnerOffer: false,
      digitalContent: {
        title: 'KAMPUS Career ATS & Interview Kit',
        instructions:
          'Apply the Action + Metric + Context formula directly inside Career Hub Resume Builder.',
        resourceText:
          'Bullet Formula: [Strong Action Verb] + [Technical Artifact] + [Measurable Outcome].\nSTAR Method Checklist: Situation (15%) -> Task (15%) -> Action (50%) -> Quantified Result (20%).',
      },
      active: true,
    },
    {
      id: 'rw_campus_workshop_pass',
      name: 'Priority Campus Workshop Seating Pass',
      category: 'Campus Rewards',
      description:
        'Reserve priority front-row seating at official Campus Tech & Design Club workshops organized on campus.',
      requiredPoints: 75,
      requiredLevel: 2,
      stockRemaining: 40,
      imageKey: 'campus_pass',
      isPartnerOffer: false,
      digitalContent: {
        title: 'Campus Workshop Priority Verification',
        instructions: 'Show this fulfilled redemption ID to student organizers at the event desk.',
        resourceText: 'Valid for any campus-hosted club workshop listed under Events & Clubs.',
      },
      active: true,
    },
    {
      id: 'rw_digital_navy_crest',
      name: 'Deep Navy Honours Profile Theme',
      category: 'Digital Rewards',
      description:
        'Unlock a clean Deep Navy Honours accent theme for your KAMPUS Rewards portfolio card.',
      requiredPoints: 40,
      requiredLevel: 1,
      stockRemaining: -1,
      imageKey: 'campus_pass',
      isPartnerOffer: false,
      digitalContent: {
        title: 'Deep Navy Honours Theme Unlocked',
        instructions: 'Theme preference is applied directly to your KAMPUS Rewards hero display.',
        resourceText: 'Active theme key: navy-honours',
      },
      active: true,
    },
  ];

  return {
    wallets: {},
    transactions: [],
    rules,
    levels,
    achievements,
    unlockedAchievements: [],
    challenges,
    challengeParticipations: [],
    catalog,
    redemptions: [],
    referrals: [],
    auditLogs: [],
    roleOverrides: {},
  };
}


const rewardsStorage = new ModuleStorage<RewardsDatabase>(
  'rewards',
  DB_PATH,
  () => (createSeedDatabase())
);

function loadDb(): RewardsDatabase {
  return rewardsStorage.get();
}

function saveDb(db: RewardsDatabase): void {
  rewardsStorage.saveSync(db);
}

function ensureWallet(
  db: RewardsDatabase,
  userId: string,
  userName?: string,
  college?: string
): StudentPointsWallet {
  if (!db.wallets[userId]) {
    const shortHash = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 6).toUpperCase();
    db.wallets[userId] = {
      userId,
      userName: userName || 'KAMPUS Student',
      college: college || 'Campus Member',
      availableBalance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      pendingPoints: 0,
      showOnLeaderboard: true,
      referralCode: `KMP-REF-${shortHash}`,
      activeDigitalTheme: null,
      updatedAt: new Date().toISOString(),
    };
  } else {
    if (userName && userName.trim()) db.wallets[userId].userName = userName.trim();
    if (college && college.trim()) db.wallets[userId].college = college.trim();
  }
  return db.wallets[userId];
}

function getLevelForPoints(levels: RewardLevelConfig[], totalEarned: number): RewardLevelConfig {
  const sorted = [...levels].sort((a, b) => a.minPoints - b.minPoints);
  let active = sorted[0];
  for (const lvl of sorted) {
    if (totalEarned >= lvl.minPoints) active = lvl;
  }
  return active;
}

function readJsonSafe(filePath: string): Record<string, unknown> | null {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {
    // ignore corrupt/missing module file
  }
  return null;
}

function readVerifiedEcosystemForUser(userId: string): VerifiedEcosystemSnapshot {
  const verifiedEvents: VerifiedEcosystemSnapshot['verifiedEvents'] = [];
  let studySessionsJoinedOrHosted = 0;
  let careerAssessmentsCompleted = 0;
  let careerResumesCreated = 0;
  let eventsCheckedIn = 0;
  let clubsJoined = 0;
  let voicePollsVoted = 0;
  let voiceFeedbackSubmitted = 0;
  let lockerDocsUploaded = 0;

  // 1. Study Rooms
  const studyDb = readJsonSafe(STUDY_DB_PATH);
  if (studyDb && Array.isArray(studyDb.rooms)) {
    for (const r of studyDb.rooms as Array<{ id?: string; title?: string; hostId?: string; participantIds?: string[]; createdAt?: string }>) {
      if (r.hostId === userId || (Array.isArray(r.participantIds) && r.participantIds.includes(userId))) {
        studySessionsJoinedOrHosted += 1;
        if (r.id) {
          verifiedEvents.push({
            sourceEventKey: `study:room:${r.id}`,
            ruleAction: 'Verified Study Room Session',
            description: `Participated in Study Room "${r.title || r.id}"`,
            createdAt: r.createdAt || new Date().toISOString(),
          });
        }
      }
    }
  }

  // 2. Events & Clubs
  const evtDb = readJsonSafe(EVENTS_DB_PATH);
  if (evtDb) {
    if (Array.isArray(evtDb.registrations)) {
      for (const reg of evtDb.registrations as Array<{
        id?: string;
        userId?: string;
        eventTitle?: string;
        status?: string;
        checkedInAt?: string;
      }>) {
        if (reg.userId === userId && (reg.status === 'Checked In' || reg.status === 'Attended')) {
          eventsCheckedIn += 1;
          verifiedEvents.push({
            sourceEventKey: `events:checkin:${reg.id}`,
            ruleAction: 'Verified Event Attendance Check-In',
            description: `Checked in at "${reg.eventTitle || 'Campus Event'}"`,
            createdAt: reg.checkedInAt || new Date().toISOString(),
          });
        }
      }
    }
    if (Array.isArray(evtDb.memberships)) {
      clubsJoined = (evtDb.memberships as Array<{ userId?: string; status?: string }>).filter(
        (m) => m.userId === userId && m.status !== 'Removed'
      ).length;
    }
  }

  // 3. Career
  const carDb = readJsonSafe(CAREER_DB_PATH);
  if (carDb) {
    if (Array.isArray(carDb.assessmentAttempts)) {
      for (const att of carDb.assessmentAttempts as Array<{
        id?: string;
        userId?: string;
        category?: string;
        completedAt?: string;
      }>) {
        if (att.userId === userId) {
          careerAssessmentsCompleted += 1;
          verifiedEvents.push({
            sourceEventKey: `career:assessment:${att.id}`,
            ruleAction: 'Completed Career Readiness Assessment',
            description: `Completed ${att.category || 'Career'} assessment`,
            createdAt: att.completedAt || new Date().toISOString(),
          });
        }
      }
    }
    if (Array.isArray(carDb.resumes)) {
      careerResumesCreated = (carDb.resumes as Array<{ userId?: string }>).filter(
        (r) => r.userId === userId
      ).length;
    }
  }

  // 4. Student Voice
  const voiceDb = readJsonSafe(VOICE_DB_PATH);
  if (voiceDb) {
    if (Array.isArray(voiceDb.submissions)) {
      for (const s of voiceDb.submissions as Array<{
        id?: string;
        authorId?: string;
        title?: string;
        createdAt?: string;
      }>) {
        if (s.authorId === userId) {
          voiceFeedbackSubmitted += 1;
          verifiedEvents.push({
            sourceEventKey: `voice:submission:${s.id}`,
            ruleAction: 'Campus Poll / Constructive Survey Participation',
            description: `Submitted Student Voice feedback: "${s.title || 'Feedback'}"`,
            createdAt: s.createdAt || new Date().toISOString(),
          });
        }
      }
    }
    if (Array.isArray(voiceDb.pollResponses)) {
      voicePollsVoted = (voiceDb.pollResponses as Array<{ userHash?: string }>).filter((p) => {
        const expected = crypto
          .createHash('sha256')
          .update(`${userId}::${(p as { pollId?: string }).pollId || ''}::kampus_voice`)
          .digest('hex')
          .slice(0, 24);
        return p.userHash === expected;
      }).length;
    }
  }

  // 5. Digital Locker
  const lockerDb = readJsonSafe(LOCKER_DB_PATH);
  if (lockerDb && Array.isArray(lockerDb.documents)) {
    for (const d of lockerDb.documents as Array<{
      id?: string;
      ownerId?: string;
      title?: string;
      createdAt?: string;
    }>) {
      if (d.ownerId === userId) {
        lockerDocsUploaded += 1;
        verifiedEvents.push({
          sourceEventKey: `locker:doc:${d.id}`,
          ruleAction: 'Approved Study Document Contribution',
          description: `Organized "${d.title || 'Academic Document'}" in Digital Locker`,
          createdAt: d.createdAt || new Date().toISOString(),
        });
      }
    }
  }

  return {
    studySessionsJoinedOrHosted,
    careerAssessmentsCompleted,
    careerResumesCreated,
    eventsCheckedIn,
    clubsJoined,
    voicePollsVoted,
    voiceFeedbackSubmitted,
    lockerDocsUploaded,
    verifiedEvents,
  };
}

function getMetricValue(
  snap: VerifiedEcosystemSnapshot,
  db: RewardsDatabase,
  userId: string,
  key: string
): number {
  if (key === 'study_sessions') return snap.studySessionsJoinedOrHosted;
  if (key === 'career_assessments') return snap.careerAssessmentsCompleted;
  if (key === 'career_resumes') return snap.careerResumesCreated;
  if (key === 'career_total') return snap.careerAssessmentsCompleted + snap.careerResumesCreated;
  if (key === 'events_checked_in') return snap.eventsCheckedIn;
  if (key === 'clubs_joined') return snap.clubsJoined;
  if (key === 'campus_total') return snap.eventsCheckedIn + snap.clubsJoined;
  if (key === 'voice_contributions') return snap.voicePollsVoted + snap.voiceFeedbackSubmitted;
  if (key === 'locker_docs') return snap.lockerDocsUploaded;
  if (key === 'challenges_claimed') {
    return db.challengeParticipations.filter((c) => c.userId === userId && c.claimed).length;
  }
  return 0;
}

function syncVerifiedActivityForUser(
  db: RewardsDatabase,
  userId: string
): { newTransactions: PointTransaction[]; newlyUnlockedBadges: UnlockedAchievement[] } {
  const wallet = ensureWallet(db, userId);
  const snap = readVerifiedEcosystemForUser(userId);
  const todayISO = new Date().toISOString().slice(0, 10);
  const newTransactions: PointTransaction[] = [];

  for (const ev of snap.verifiedEvents) {
    // Idempotency guard: never reward the same sourceEventKey twice
    if (
      db.transactions.some(
        (tx) => tx.userId === userId && tx.sourceEventKey === ev.sourceEventKey
      )
    ) {
      continue;
    }
    const rule = db.rules.find((r) => r.actionName === ev.ruleAction && r.active);
    if (!rule || rule.points <= 0) continue;

    // Daily limit enforcement
    const todayRuleCount = db.transactions.filter(
      (tx) =>
        tx.userId === userId &&
        tx.module === rule.module &&
        tx.category === 'Earned' &&
        tx.createdAt.startsWith(todayISO)
    ).length;
    if (todayRuleCount >= rule.dailyLimit) continue;

    const tx: PointTransaction = {
      id: `ktx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
      activityName: rule.actionName,
      module: rule.module,
      category: 'Earned',
      points: rule.points,
      status: 'Completed',
      description: ev.description,
      sourceEventKey: ev.sourceEventKey,
      createdAt: new Date().toISOString(),
    };
    db.transactions.unshift(tx);
    wallet.availableBalance += rule.points;
    wallet.totalEarned += rule.points;
    wallet.updatedAt = new Date().toISOString();
    newTransactions.push(tx);
  }

  // Update challenge progress & evaluate badge unlocks
  for (const ch of db.challengeParticipations) {
    if (ch.userId !== userId) continue;
    const def = db.challenges.find((d) => d.id === ch.challengeId);
    if (def) {
      ch.currentProgress = Math.min(
        def.targetCount,
        getMetricValue(snap, db, userId, def.metricKey)
      );
    }
  }

  const newlyUnlockedBadges: UnlockedAchievement[] = [];
  for (const ach of db.achievements) {
    const already = db.unlockedAchievements.some(
      (u) => u.userId === userId && u.achievementId === ach.id
    );
    if (already) continue;
    const val = getMetricValue(snap, db, userId, ach.criteriaKey);
    if (val >= ach.threshold) {
      const unlock: UnlockedAchievement = {
        userId,
        achievementId: ach.id,
        unlockedAt: new Date().toISOString(),
      };
      db.unlockedAchievements.push(unlock);
      newlyUnlockedBadges.push(unlock);
    }
  }

  return { newTransactions, newlyUnlockedBadges };
}

function buildLeaderboard(db: RewardsDatabase, period: LeaderboardPeriod): LeaderboardEntry[] {
  const nowMs = Date.now();
  const cutoffMs =
    period === 'Weekly'
      ? nowMs - 7 * 86400_000
      : period === 'Monthly'
      ? nowMs - 30 * 86400_000
      : 0;

  const entries: LeaderboardEntry[] = [];
  for (const wallet of Object.values(db.wallets)) {
    if (!wallet.showOnLeaderboard) continue;

    let pts = 0;
    if (period === 'All Time') {
      pts = wallet.totalEarned;
    } else {
      pts = db.transactions
        .filter((tx) => {
          if (tx.userId !== wallet.userId || tx.category !== 'Earned' || tx.status === 'Reversed') {
            return false;
          }
          if (cutoffMs && new Date(tx.createdAt).getTime() < cutoffMs) return false;
          if (period === 'Academic') return tx.module === 'Study Hub' || tx.module === 'Notes Exchange';
          if (period === 'Community') return tx.module === 'Student Community';
          if (period === 'Career') return tx.module === 'Career';
          if (period === 'Campus') return tx.module === 'Events & Clubs';
          return true;
        })
        .reduce((acc, tx) => acc + tx.points, 0);
    }

    if (pts <= 0) continue;
    const lvl = getLevelForPoints(db.levels, wallet.totalEarned);
    const badgeCount = db.unlockedAchievements.filter((u) => u.userId === wallet.userId).length;
    entries.push({
      rank: 0,
      userId: wallet.userId,
      displayName: wallet.userName,
      college: wallet.college,
      levelName: lvl.name,
      unlockedBadgesCount: badgeCount,
      points: pts,
    });
  }

  return entries
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

function computeAnalytics(db: RewardsDatabase): RewardsAnalytics {
  const wallets = Object.values(db.wallets);
  return {
    totalWallets: wallets.length,
    totalPointsIssued: wallets.reduce((a, w) => a + w.totalEarned, 0),
    totalPointsRedeemed: wallets.reduce((a, w) => a + w.totalRedeemed, 0),
    totalRedemptions: db.redemptions.length,
    activeChallenges: db.challenges.filter((c) => c.active).length,
    flaggedOrReversedCount: db.transactions.filter((t) => t.status === 'Reversed').length,
  };
}

// Per-user redemption concurrency mutex to strictly prevent double-spending
const activeRedemptionLocks = new Set<string>();

export function registerRewardsBackend(app: Express): void {
  const db = loadDb();

  // 1. Bootstrap Student Wallet + Sync Verified Cross-Module Activity
  app.post('/api/rewards/bootstrap', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const wallet = ensureWallet(db, userId, b.userName, b.college);
    const { newTransactions, newlyUnlockedBadges } = syncVerifiedActivityForUser(db, userId);
    saveDb(db);

    const roleInfo = db.roleOverrides[userId] || { role: 'Student' as RewardsRole, label: null };
    const isAdmin = roleInfo.role === 'Rewards Admin';
    const currentLevel = getLevelForPoints(db.levels, wallet.totalEarned);
    const sortedLevels = [...db.levels].sort((a, b) => a.minPoints - b.minPoints);
    const nextLevel = sortedLevels.find((l) => l.minPoints > wallet.totalEarned) || null;
    const period = (String(b.leaderboardPeriod || 'All Time') as LeaderboardPeriod);

    return res.json({
      wallet,
      currentLevel,
      nextLevel,
      levels: sortedLevels,
      rules: db.rules,
      achievements: db.achievements,
      unlockedAchievements: db.unlockedAchievements.filter((u) => u.userId === userId),
      challenges: db.challenges.filter((c) => c.active || isAdmin),
      challengeParticipations: db.challengeParticipations.filter((c) => c.userId === userId),
      catalog: db.catalog.filter((c) => c.active || isAdmin),
      transactions: db.transactions.filter((t) => t.userId === userId),
      redemptions: db.redemptions.filter((r) => r.userId === userId || isAdmin),
      referrals: isAdmin ? db.referrals : db.referrals.filter((r) => r.referrerUserId === userId),
      leaderboard: buildLeaderboard(db, period),
      roleInfo,
      auditLogs: isAdmin ? db.auditLogs : [],
      analytics: isAdmin ? computeAnalytics(db) : null,
      allTransactions: isAdmin ? db.transactions.slice(0, 120) : [],
      newlyAwardedCount: newTransactions.length,
      newlyUnlockedCount: newlyUnlockedBadges.length,
    });
  });

  // 2. Role Switch (Student <-> Rewards Admin)
  app.post('/api/rewards/auth/role-session', (req: Request, res: Response) => {
    const { userId, passkey, revert } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (revert) {
      delete db.roleOverrides[userId];
      saveDb(db);
      return res.json({ roleInfo: { role: 'Student', label: null } });
    }
    if (passkey !== REWARDS_ADMIN_PASSKEY) {
      return res.status(403).json({ message: 'Invalid KAMPUS Rewards admin passkey.' });
    }
    db.roleOverrides[userId] = {
      role: 'Rewards Admin',
      label: 'Campus Rewards & Engagement Administrator',
    };
    saveDb(db);
    return res.json({ roleInfo: db.roleOverrides[userId] });
  });

  // 3. Leaderboard Period Query & Privacy Toggle
  app.get('/api/rewards/leaderboard', (req: Request, res: Response) => {
    const period = (String(req.query.period || 'All Time') as LeaderboardPeriod);
    return res.json({ leaderboard: buildLeaderboard(db, period) });
  });

  app.patch('/api/rewards/privacy', (req: Request, res: Response) => {
    const { userId, showOnLeaderboard } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId required.' });
    const wallet = ensureWallet(db, userId);
    wallet.showOnLeaderboard = Boolean(showOnLeaderboard);
    wallet.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ wallet, leaderboard: buildLeaderboard(db, 'All Time') });
  });

  // 4. Challenges: Join & Claim Verified Progress
  app.post('/api/rewards/challenges/:id/join', (req: Request, res: Response) => {
    const userId = String(req.body?.userId || '').trim();
    const challenge = db.challenges.find((c) => c.id === req.params.id && c.active);
    if (!userId || !challenge) {
      return res.status(404).json({ message: 'Active challenge not found.' });
    }
    const existing = db.challengeParticipations.find(
      (p) => p.userId === userId && p.challengeId === challenge.id
    );
    if (existing) {
      return res.status(400).json({ message: 'Already joined this challenge.' });
    }
    const snap = readVerifiedEcosystemForUser(userId);
    const currentProgress = Math.min(
      challenge.targetCount,
      getMetricValue(snap, db, userId, challenge.metricKey)
    );
    const part: ChallengeParticipation = {
      id: `chp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
      challengeId: challenge.id,
      joinedAt: new Date().toISOString(),
      currentProgress,
      claimed: false,
    };
    db.challengeParticipations.push(part);
    saveDb(db);
    return res.status(201).json({ participation: part });
  });

  app.post('/api/rewards/challenges/:id/claim', (req: Request, res: Response) => {
    const userId = String(req.body?.userId || '').trim();
    const challenge = db.challenges.find((c) => c.id === req.params.id);
    if (!userId || !challenge) return res.status(404).json({ message: 'Challenge not found.' });

    const part = db.challengeParticipations.find(
      (p) => p.userId === userId && p.challengeId === challenge.id
    );
    if (!part) return res.status(400).json({ message: 'Join the challenge before claiming.' });
    if (part.claimed) return res.status(400).json({ message: 'Challenge reward already claimed.' });

    // Recompute progress directly from verified backend ecosystem
    const snap = readVerifiedEcosystemForUser(userId);
    const actualProgress = getMetricValue(snap, db, userId, challenge.metricKey);
    part.currentProgress = Math.min(challenge.targetCount, actualProgress);

    if (actualProgress < challenge.targetCount) {
      return res.status(400).json({
        message: `Challenge criteria not yet met (${actualProgress}/${challenge.targetCount}). Complete verified activity in KAMPUS first.`,
      });
    }

    const wallet = ensureWallet(db, userId);
    part.claimed = true;
    part.claimedAt = new Date().toISOString();

    const tx: PointTransaction = {
      id: `ktx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
      activityName: `Challenge Completed: ${challenge.name}`,
      module: 'Challenge',
      category: 'Earned',
      points: challenge.rewardPoints,
      status: 'Completed',
      description: `Verified ${challenge.cadence} challenge completion.`,
      sourceEventKey: `challenge:${challenge.id}:${userId}`,
      createdAt: new Date().toISOString(),
    };
    db.transactions.unshift(tx);
    wallet.availableBalance += challenge.rewardPoints;
    wallet.totalEarned += challenge.rewardPoints;
    wallet.updatedAt = new Date().toISOString();

    syncVerifiedActivityForUser(db, userId);
    saveDb(db);

    return res.json({
      participation: part,
      transaction: tx,
      wallet,
      unlockedAchievements: db.unlockedAchievements.filter((u) => u.userId === userId),
    });
  });

  // 5. Atomic Reward Redemption (Idempotency + Stock + Balance + Level Check)
  app.post('/api/rewards/redeem', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const rewardId = String(b.rewardId || '').trim();
    const idempotencyKey = String(b.idempotencyKey || `${userId}:${rewardId}:${Date.now()}`).trim();

    if (!userId || !rewardId) {
      return res.status(400).json({ message: 'userId and rewardId are required.' });
    }

    // Return cached idempotent redemption if already processed
    const duplicate = db.redemptions.find(
      (r) => r.userId === userId && r.idempotencyKey === idempotencyKey
    );
    if (duplicate) {
      return res.json({ redemption: duplicate, wallet: db.wallets[userId], idempotentReplay: true });
    }

    if (activeRedemptionLocks.has(userId)) {
      return res.status(409).json({ message: 'Another redemption is currently processing. Please wait.' });
    }

    activeRedemptionLocks.add(userId);
    try {
      const item = db.catalog.find((c) => c.id === rewardId && c.active);
      if (!item) return res.status(404).json({ message: 'Reward item unavailable.' });

      const wallet = ensureWallet(db, userId, b.userName);
      const userLevel = getLevelForPoints(db.levels, wallet.totalEarned);

      if (userLevel.levelNumber < item.requiredLevel) {
        return res.status(403).json({
          message: `Requires Level ${item.requiredLevel} to redeem this reward.`,
        });
      }
      if (item.stockRemaining === 0) {
        return res.status(400).json({ message: 'This reward is currently out of stock.' });
      }
      if (wallet.availableBalance < item.requiredPoints) {
        return res.status(400).json({
          message: `Insufficient K-Points (${wallet.availableBalance} available, ${item.requiredPoints} required).`,
        });
      }

      // Atomic state transition
      wallet.availableBalance -= item.requiredPoints;
      wallet.totalRedeemed += item.requiredPoints;
      wallet.updatedAt = new Date().toISOString();

      if (item.stockRemaining > 0) {
        item.stockRemaining -= 1;
      }

      // Digital Rewards / Study & Career digital items fulfill immediately; Physical/Campus passes confirm pending/fulfilled
      const status: RedemptionStatus =
        item.category === 'Digital Rewards' || item.category === 'Study Rewards' || item.category === 'Career Rewards'
          ? 'Fulfilled'
          : 'Confirmed';

      if (item.id === 'rw_digital_navy_crest' && status === 'Fulfilled') {
        wallet.activeDigitalTheme = 'navy-honours';
      }

      const tx: PointTransaction = {
        id: `ktx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId,
        activityName: `Redeemed: ${item.name}`,
        module: 'Rewards Store',
        category: 'Redeemed',
        points: -item.requiredPoints,
        status: 'Completed',
        description: `Redeemed from ${item.category}`,
        createdAt: new Date().toISOString(),
      };
      db.transactions.unshift(tx);

      const now = new Date().toISOString();
      const record: RedemptionRecord = {
        id: `rrd_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        idempotencyKey,
        userId,
        userName: wallet.userName,
        rewardId: item.id,
        rewardName: item.name,
        category: item.category,
        pointsSpent: item.requiredPoints,
        status,
        couponCode: item.isPartnerOffer && item.partnerName ? `VERIFIED-${crypto.randomBytes(3).toString('hex').toUpperCase()}` : null,
        couponValidity: item.isPartnerOffer ? addDaysISO(30) : null,
        usageInstructions: item.digitalContent?.instructions,
        createdAt: now,
        updatedAt: now,
      };
      db.redemptions.unshift(record);
      saveDb(db);

      return res.status(201).json({
        redemption: record,
        transaction: tx,
        wallet,
        catalog: db.catalog.filter((c) => c.active),
      });
    } finally {
      activeRedemptionLocks.delete(userId);
    }
  });

  // 6. Referrals (Strict Self-Referral & Duplicate Account Block)
  app.post('/api/rewards/referrals', (req: Request, res: Response) => {
    const b = req.body || {};
    const referrerUserId = String(b.userId || '').trim();
    const referredIdentifier = String(b.referredIdentifier || '').trim().toLowerCase();
    if (!referrerUserId || !referredIdentifier) {
      return res.status(400).json({ message: 'Enter a valid peer student email or enrollment ID.' });
    }
    const wallet = ensureWallet(db, referrerUserId, b.userName);

    if (
      referredIdentifier === referrerUserId.toLowerCase() ||
      referredIdentifier === wallet.referralCode.toLowerCase()
    ) {
      return res.status(400).json({ message: 'Self-referrals are prohibited.' });
    }

    const dup = db.referrals.find(
      (r) => r.referredIdentifier.toLowerCase() === referredIdentifier
    );
    if (dup) {
      return res.status(400).json({ message: 'This peer has already been referred.' });
    }

    const now = new Date().toISOString();
    const rec: ReferralRecord = {
      id: `rrf_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      referrerUserId,
      referrerName: wallet.userName,
      referredIdentifier,
      referralCodeUsed: wallet.referralCode,
      status: 'Invited',
      pointsAwarded: 0,
      createdAt: now,
      updatedAt: now,
    };
    db.referrals.unshift(rec);
    saveDb(db);
    return res.status(201).json({ referral: rec });
  });

  // 7. Role-Protected Admin Endpoints (Strict 403 for Students)
  const requireRewardsAdmin = (userId: unknown, res: Response): string | null => {
    const id = String(userId || '').trim();
    if (db.roleOverrides[id]?.role !== 'Rewards Admin') {
      res.status(403).json({ message: '403 Forbidden: Rewards Admin authorization required.' });
      return null;
    }
    return id;
  };

  app.patch('/api/rewards/admin/rules/:id', (req: Request, res: Response) => {
    const adminId = requireRewardsAdmin(req.body?.userId, res);
    if (!adminId) return;
    const rule = db.rules.find((r) => r.id === req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found.' });
    if (typeof req.body.points === 'number' && req.body.points >= 0) rule.points = req.body.points;
    if (typeof req.body.dailyLimit === 'number' && req.body.dailyLimit >= 1) {
      rule.dailyLimit = req.body.dailyLimit;
    }
    if (typeof req.body.active === 'boolean') rule.active = req.body.active;

    db.auditLogs.unshift({
      id: `ral_${Date.now()}`,
      actorId: adminId,
      actorRole: 'Rewards Admin',
      action: 'Updated Point Rule',
      reason: String(req.body.reason || 'Admin rule configuration update'),
      details: `${rule.actionName} set to ${rule.points} K-Points (daily limit ${rule.dailyLimit})`,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    return res.json({ rule, rules: db.rules, auditLogs: db.auditLogs });
  });

  app.patch('/api/rewards/admin/levels/:num', (req: Request, res: Response) => {
    const adminId = requireRewardsAdmin(req.body?.userId, res);
    if (!adminId) return;
    const num = Number(req.params.num);
    const lvl = db.levels.find((l) => l.levelNumber === num);
    if (!lvl) return res.status(404).json({ message: 'Level not found.' });
    if (typeof req.body.minPoints === 'number' && req.body.minPoints >= 0) {
      lvl.minPoints = req.body.minPoints;
    }
    db.auditLogs.unshift({
      id: `ral_${Date.now()}`,
      actorId: adminId,
      actorRole: 'Rewards Admin',
      action: 'Updated Level Threshold',
      reason: 'Level progression threshold adjustment',
      details: `Level ${lvl.levelNumber} (${lvl.name}) threshold -> ${lvl.minPoints} pts`,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    return res.json({ levels: db.levels, auditLogs: db.auditLogs });
  });

  app.post('/api/rewards/admin/catalog', (req: Request, res: Response) => {
    const b = req.body || {};
    const adminId = requireRewardsAdmin(b.userId, res);
    if (!adminId) return;
    if (!b.name || typeof b.requiredPoints !== 'number' || b.requiredPoints <= 0) {
      return res.status(400).json({ message: 'Valid reward name and positive point cost required.' });
    }
    const item: RewardCatalogItem = {
      id: `rw_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      name: String(b.name).trim(),
      category: b.category || 'Campus Rewards',
      description: String(b.description || '').trim(),
      requiredPoints: b.requiredPoints,
      requiredLevel: Number(b.requiredLevel || 1),
      stockRemaining: typeof b.stockRemaining === 'number' ? b.stockRemaining : 25,
      imageKey: String(b.imageKey || 'campus_pass'),
      isPartnerOffer: Boolean(b.isPartnerOffer),
      partnerName: b.partnerName ? String(b.partnerName).trim() : undefined,
      active: true,
    };
    db.catalog.unshift(item);
    db.auditLogs.unshift({
      id: `ral_${Date.now()}`,
      actorId: adminId,
      actorRole: 'Rewards Admin',
      action: 'Added Reward Item',
      reason: 'Catalog expansion',
      details: `Added "${item.name}" (${item.requiredPoints} K-Points)`,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    return res.status(201).json({ item, catalog: db.catalog, auditLogs: db.auditLogs });
  });

  app.post('/api/rewards/admin/challenges', (req: Request, res: Response) => {
    const b = req.body || {};
    const adminId = requireRewardsAdmin(b.userId, res);
    if (!adminId) return;
    if (!b.name || !b.rewardPoints) {
      return res.status(400).json({ message: 'Challenge name and reward points required.' });
    }
    const ch: ChallengeDefinition = {
      id: `chl_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      cadence: b.cadence === 'Daily' ? 'Daily' : 'Weekly',
      name: String(b.name).trim(),
      description: String(b.description || '').trim(),
      rewardPoints: Number(b.rewardPoints),
      targetCount: Math.max(1, Number(b.targetCount || 1)),
      metricKey: String(b.metricKey || 'voice_contributions'),
      deadlineISO: String(b.deadlineISO || addDaysISO(7)),
      active: true,
    };
    db.challenges.unshift(ch);
    saveDb(db);
    return res.status(201).json({ challenge: ch, challenges: db.challenges });
  });

  // Audited Manual Point Adjustment (Requires Reason)
  app.post('/api/rewards/admin/adjust', (req: Request, res: Response) => {
    const b = req.body || {};
    const adminId = requireRewardsAdmin(b.userId, res);
    if (!adminId) return;
    const targetUserId = String(b.targetUserId || '').trim();
    const delta = Number(b.pointsDelta);
    const reason = String(b.reason || '').trim();
    if (!targetUserId || !Number.isFinite(delta) || delta === 0 || !reason) {
      return res.status(400).json({
        message: 'Target userId, non-zero point delta, and audit reason are required.',
      });
    }

    const wallet = ensureWallet(db, targetUserId);
    if (delta < 0 && wallet.availableBalance + delta < 0) {
      return res.status(400).json({ message: 'Adjustment cannot make wallet balance negative.' });
    }

    wallet.availableBalance += delta;
    if (delta > 0) wallet.totalEarned += delta;
    wallet.updatedAt = new Date().toISOString();

    const tx: PointTransaction = {
      id: `ktx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: targetUserId,
      activityName: 'Admin Audited Adjustment',
      module: 'Admin Adjustment',
      category: delta > 0 ? 'Earned' : 'Reversed',
      points: delta,
      status: 'Completed',
      description: reason,
      createdAt: new Date().toISOString(),
    };
    db.transactions.unshift(tx);

    db.auditLogs.unshift({
      id: `ral_${Date.now()}`,
      actorId: adminId,
      actorRole: 'Rewards Admin',
      action: 'Manual Point Adjustment',
      targetUserId,
      reason,
      details: `${delta > 0 ? '+' : ''}${delta} K-Points for ${targetUserId}`,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);

    return res.status(201).json({
      transaction: tx,
      wallet,
      auditLogs: db.auditLogs,
      analytics: computeAnalytics(db),
    });
  });

  // Reverse Transaction with Audit Record
  app.post('/api/rewards/admin/transactions/:id/reverse', (req: Request, res: Response) => {
    const b = req.body || {};
    const adminId = requireRewardsAdmin(b.userId, res);
    if (!adminId) return;
    const reason = String(b.reason || '').trim();
    if (!reason) return res.status(400).json({ message: 'Reversal reason is required.' });

    const orig = db.transactions.find((t) => t.id === req.params.id);
    if (!orig) return res.status(404).json({ message: 'Transaction not found.' });
    if (orig.status === 'Reversed') {
      return res.status(400).json({ message: 'Transaction already reversed.' });
    }

    const wallet = ensureWallet(db, orig.userId);
    if (orig.points > 0 && wallet.availableBalance < orig.points) {
      return res.status(400).json({
        message: 'Cannot reverse earned points because user already spent part of this balance.',
      });
    }

    orig.status = 'Reversed';
    wallet.availableBalance -= orig.points;
    if (orig.points > 0) wallet.totalEarned = Math.max(0, wallet.totalEarned - orig.points);
    if (orig.points < 0) wallet.totalRedeemed = Math.max(0, wallet.totalRedeemed + orig.points);

    const revTx: PointTransaction = {
      id: `ktx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: orig.userId,
      activityName: `Reversal: ${orig.activityName}`,
      module: 'Admin Adjustment',
      category: 'Reversed',
      points: -orig.points,
      status: 'Completed',
      description: `Reversed by admin: ${reason}`,
      reversedByTxId: orig.id,
      createdAt: new Date().toISOString(),
    };
    db.transactions.unshift(revTx);

    db.auditLogs.unshift({
      id: `ral_${Date.now()}`,
      actorId: adminId,
      actorRole: 'Rewards Admin',
      action: 'Transaction Reversed',
      targetUserId: orig.userId,
      reason,
      details: `Reversed ${orig.id} (${orig.points} K-Points)`,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);

    return res.json({
      reversed: revTx,
      auditLogs: db.auditLogs,
      analytics: computeAnalytics(db),
    });
  });

  // Fulfill / Reject Redemption
  app.patch('/api/rewards/admin/redemptions/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const adminId = requireRewardsAdmin(b.userId, res);
    if (!adminId) return;
    const rec = db.redemptions.find((r) => r.id === req.params.id);
    if (!rec) return res.status(404).json({ message: 'Redemption not found.' });

    const nextStatus = b.status as RedemptionStatus;
    rec.status = nextStatus;
    if (typeof b.note === 'string') rec.note = b.note;
    rec.updatedAt = new Date().toISOString();

    if (nextStatus === 'Rejected' || nextStatus === 'Cancelled') {
      // Refund K-Points transparently on rejection
      const wallet = ensureWallet(db, rec.userId);
      wallet.availableBalance += rec.pointsSpent;
      wallet.totalRedeemed = Math.max(0, wallet.totalRedeemed - rec.pointsSpent);
    }

    db.auditLogs.unshift({
      id: `ral_${Date.now()}`,
      actorId: adminId,
      actorRole: 'Rewards Admin',
      action: `Redemption ${nextStatus}`,
      targetUserId: rec.userId,
      reason: String(b.note || `Updated status to ${nextStatus}`),
      details: `${rec.rewardName} (${rec.id})`,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    return res.json({ redemption: rec, auditLogs: db.auditLogs });
  });

  // Verify & Reward Referral
  app.patch('/api/rewards/admin/referrals/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const adminId = requireRewardsAdmin(b.userId, res);
    if (!adminId) return;
    const ref = db.referrals.find((r) => r.id === req.params.id);
    if (!ref) return res.status(404).json({ message: 'Referral not found.' });
    if (ref.status === 'Rewarded') {
      return res.status(400).json({ message: 'Referral bonus already awarded.' });
    }
    ref.status = b.status || 'Rewarded';
    ref.updatedAt = new Date().toISOString();
    if (ref.status === 'Rewarded') {
      const bonus = 50;
      ref.pointsAwarded = bonus;
      const wallet = ensureWallet(db, ref.referrerUserId);
      wallet.availableBalance += bonus;
      wallet.totalEarned += bonus;
      db.transactions.unshift({
        id: `ktx_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: ref.referrerUserId,
        activityName: 'Verified Peer Referral Bonus',
        module: 'Referral',
        category: 'Earned',
        points: bonus,
        status: 'Completed',
        description: `Verified campus onboarding for ${ref.referredIdentifier}`,
        sourceEventKey: `referral:${ref.id}`,
        createdAt: new Date().toISOString(),
      });
    }
    saveDb(db);
    return res.json({ referral: ref, auditLogs: db.auditLogs });
  });
}
