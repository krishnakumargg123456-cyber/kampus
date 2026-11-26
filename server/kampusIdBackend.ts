import { ModuleStorage } from '../database/moduleStorage.ts';
import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { dispatchNotification } from './notificationsBackend.ts';
import type {
  GenuineConnectedSummary,
  KampusIdPrivacySettings,
  KampusIdRole,
  KampusIdentityRecord,
  PublicVerifiedIdentityPayload,
  VerificationReviewRequest,
} from '../src/types/kampusId.ts';

export interface KampusIdAuditEntry {
  id: string;
  kampusIdNumber: string;
  action: string;
  performedBy: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  timestamp: string;
}

interface KampusIdDatabase {
  identitiesByUser: Record<string, KampusIdentityRecord>;
  issuedNumbers: string[];
  verificationRequests: VerificationReviewRequest[];
  verifierOverrides: Record<string, { role: KampusIdRole; label: string }>;
  auditLogs: KampusIdAuditEntry[];
  revokedNonces: string[];
}

const DB_FILE = path.join(process.cwd(), '.kampus_kampus_id_db.json');
const EVENTS_DB_FILE = path.join(process.cwd(), '.kampus_events_clubs_db.json');
const SKILLSWAP_DB_FILE = path.join(process.cwd(), '.kampus_skillswap_db.json');

const ID_QR_SECRET =
  process.env.KAMPUS_ID_QR_SECRET || 'kampus-platform-identity-signing-key-2026';

const VERIFIER_PASSKEYS: Record<string, { role: KampusIdRole; label: string }> = {
  'KMP-ID-VERIFIER-2026': {
    role: 'Authorized Verifier',
    label: 'KAMPUS Identity Verification Desk',
  },
  'KMP-ID-ADMIN-2026': {
    role: 'Platform Admin',
    label: 'KAMPUS Platform Identity Administrator',
  },
};

// Rate limiter for QR verification (max 30 requests/minute per IP)
const verifyHitsByIp: Record<string, number[]> = {};

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (verifyHitsByIp[ip] || []).filter((t) => t > windowStart);
  if (recent.length >= 30) {
    verifyHitsByIp[ip] = recent;
    return false;
  }
  recent.push(now);
  verifyHitsByIp[ip] = recent;
  return true;
}

const kampusIdStorage = new ModuleStorage<KampusIdDatabase>(
  'kampus_id',
  DB_FILE,
  () => ({
    identitiesByUser: {},
    issuedNumbers: [],
    verificationRequests: [],
    verifierOverrides: {},
    auditLogs: [],
    revokedNonces: [],
  })
);

function loadDb(): KampusIdDatabase {
  const db = kampusIdStorage.get();
  if (!db.auditLogs) db.auditLogs = [];
  if (!db.revokedNonces) db.revokedNonces = [];
  return db;
}

function saveDb(db: KampusIdDatabase): void {
  kampusIdStorage.saveSync(db);
}

export function getAuthenticatedUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.sub || decoded.userId)) {
        return decoded.sub || decoded.userId;
      }
    } catch {}
  }
  const headerUserId = req.headers['x-user-id'] || req.headers['x-clerk-user-id'];
  if (headerUserId && typeof headerUserId === 'string' && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }
  const queryUid = req.query.userId || req.body?.userId;
  if (queryUid && typeof queryUid === 'string' && queryUid.trim().length > 0) {
    return queryUid.trim();
  }
  return 'student_default';
}

function isUserAdmin(req: Request, db: KampusIdDatabase): boolean {
  const userId = getAuthenticatedUserId(req);
  if (
    db.verifierOverrides[userId]?.role === 'Platform Admin' ||
    db.verifierOverrides[userId]?.role === 'Authorized Verifier'
  ) {
    return true;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded: any = jwt.decode(authHeader.split(' ')[1]);
      if (
        decoded &&
        (decoded.role === 'admin' ||
          decoded.publicMetadata?.role === 'admin' ||
          decoded.org_role === 'admin')
      ) {
        return true;
      }
    } catch {}
  }
  const roleHeader = req.headers['x-user-role'] || req.headers['x-kampus-role'];
  if (
    roleHeader === 'admin' ||
    roleHeader === 'superadmin' ||
    roleHeader === 'Platform Admin' ||
    roleHeader === 'Authorized Verifier'
  ) {
    return true;
  }
  return false;
}

function generateUniqueKampusId(db: KampusIdDatabase): string {
  const year = new Date().getFullYear();
  for (let i = 0; i < 50; i++) {
    // 6-digit random hex
    const hex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const candidate = `KMP-${year}-${hex}`;
    if (!db.issuedNumbers.includes(candidate)) {
      db.issuedNumbers.push(candidate);
      return candidate;
    }
  }
  const fallback = `KMP-${year}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  db.issuedNumbers.push(fallback);
  return fallback;
}

function isProfileComplete(rec: {
  fullName: string;
  college: string;
  course: string;
  academicYearOrSemester: string;
  enrollmentNo: string;
}): boolean {
  return Boolean(
    rec.fullName.trim() &&
      rec.college.trim() &&
      rec.course.trim() &&
      rec.academicYearOrSemester.trim() &&
      rec.enrollmentNo.trim()
  );
}

function signIdentityQrToken(payload: {
  kid: string;
  nonce: string;
  iat: number;
  exp: number;
}): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', ID_QR_SECRET)
    .update(encoded)
    .digest('base64url');
  return `KMP-ID.${encoded}.${sig}`;
}

function verifyIdentityQrToken(
  token: string,
  db: KampusIdDatabase
): {
  valid: boolean;
  expired?: boolean;
  revoked?: boolean;
  payload?: { kid: string; nonce: string; iat: number; exp: number };
} {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'KMP-ID') return { valid: false };
    const [, encoded, sig] = parts;
    const expected = crypto
      .createHmac('sha256', ID_QR_SECRET)
      .update(encoded)
      .digest('base64url');
    if (sig !== expected) return { valid: false };
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.kid || !payload.exp || !payload.nonce) return { valid: false };

    // Check revoked nonces
    if (db.revokedNonces && db.revokedNonces.includes(payload.nonce)) {
      return { valid: false, revoked: true, payload };
    }

    if (Date.now() > Number(payload.exp)) {
      return { valid: false, expired: true, payload };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

function readGenuineConnectedSummary(userId: string): GenuineConnectedSummary {
  const summary: GenuineConnectedSummary = {
    eventsRegisteredCount: 0,
    eventsCheckedInCount: 0,
    certificates: [],
    clubsJoined: [],
    skillSwapCompletedCount: 0,
    skillsOffered: [],
  };

  try {
    if (fs.existsSync(EVENTS_DB_FILE)) {
      const evDb = JSON.parse(fs.readFileSync(EVENTS_DB_FILE, 'utf-8'));
      const regs = Array.isArray(evDb.registrations) ? evDb.registrations : [];
      const userRegs = regs.filter(
        (r: { userId?: string; status?: string }) =>
          r.userId === userId && r.status === 'Confirmed'
      );
      summary.eventsRegisteredCount = userRegs.length;
      summary.eventsCheckedInCount = userRegs.filter(
        (r: { checkInStatus?: string }) => r.checkInStatus === 'Checked In'
      ).length;

      const certs = Array.isArray(evDb.certificates) ? evDb.certificates : [];
      summary.certificates = certs
        .filter((c: { userId?: string }) => c.userId === userId)
        .map(
          (c: {
            certificateRef: string;
            eventTitle: string;
            certificateType: string;
            issuedAt: string;
          }) => ({
            certificateRef: c.certificateRef,
            eventTitle: c.eventTitle,
            certificateType: c.certificateType,
            issuedAt: c.issuedAt,
          })
        );

      const memberships = Array.isArray(evDb.memberships) ? evDb.memberships : [];
      const clubs = Array.isArray(evDb.clubs) ? evDb.clubs : [];
      summary.clubsJoined = memberships
        .filter(
          (m: { userId?: string; status?: string }) =>
            m.userId === userId && m.status === 'Member'
        )
        .map((m: { clubId: string; role: string }) => {
          const cl = clubs.find((c: { id: string }) => c.id === m.clubId);
          return {
            clubName: cl?.name || 'Campus Club',
            category: cl?.category || '',
            role: m.role,
          };
        });
    }
  } catch {}

  try {
    if (fs.existsSync(SKILLSWAP_DB_FILE)) {
      const ssDb = JSON.parse(fs.readFileSync(SKILLSWAP_DB_FILE, 'utf-8'));
      const listings = Array.isArray(ssDb.listings) ? ssDb.listings : [];
      summary.skillsOffered = listings
        .filter((l: { userId?: string }) => l.userId === userId)
        .map((l: { skillTitle?: string }) => String(l.skillTitle || ''))
        .filter(Boolean);
      const swaps = Array.isArray(ssDb.swaps) ? ssDb.swaps : [];
      summary.skillSwapCompletedCount = swaps.filter(
        (s: { requesterId?: string; providerId?: string; status?: string }) =>
          (s.requesterId === userId || s.providerId === userId) && s.status === 'Completed'
      ).length;
    }
  } catch {}

  return summary;
}

function escapePdf(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildKampusIdPdf(rec: KampusIdentityRecord): Buffer {
  const lines = [
    'KAMPUS · DIGITAL PLATFORM STUDENT IDENTITY CARD',
    '====================================================================',
    'FRONT OF CARD',
    `Platform ID Number : ${rec.kampusIdNumber}`,
    `Full Name          : ${rec.fullName}`,
    `Institution        : ${rec.college}`,
    `Department         : ${rec.department}`,
    `Course / Program   : ${rec.course}`,
    `Semester / Year    : ${rec.academicYearOrSemester}`,
    `Enrollment Ref     : ${rec.enrollmentNo}`,
    `Account Status     : ${rec.accountStatus}`,
    `Institutional Check: ${rec.verification.institutionalVerification}`,
    '',
    'BACK OF CARD & VERIFICATION NOTICE',
    `Card Version       : ${rec.cardVersion}`,
    `Issued Date        : ${new Date(rec.issuedAt).toDateString()}`,
    `Public Profile Slug: ${rec.publicSlug}`,
    `Email Verified     : ${rec.verification.emailVerified ? 'Yes' : 'No'}`,
    '',
    'IMPORTANT NOTICE:',
    'This is a KAMPUS Platform Digital Student Identity Card generated',
    'within KAMPUS. It is NOT a Government ID or Official University ID.',
    'Scan the live rotating QR inside KAMPUS ID to verify current status.',
  ];
  const ops = ['BT', '/F2 13 Tf', '52 736 Td', '18 TL'];
  lines.forEach((ln, idx) => {
    const safe = escapePdf(ln);
    if (idx === 0) {
      ops.push(`(${safe}) Tj T* /F1 10.5 Tf`);
    } else if (idx === 3 || idx === 4) {
      ops.push(`/F2 11 Tf (${safe}) Tj T* /F1 10.5 Tf`);
    } else {
      ops.push(`(${safe}) Tj T*`);
    }
  });
  ops.push('ET');
  const stream = ops.join('\n');
  const objs = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj',
    `4 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const o of objs) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += o + '\n';
  }
  const xref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objs.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function buildPublicIdentityPayload(
  rec: KampusIdentityRecord,
  connected: GenuineConnectedSummary,
  expiresAt?: string
): PublicVerifiedIdentityPayload {
  if (rec.privacy.profileVisibility === 'Private') {
    return {
      status: 'Private',
      message: 'Student has set this KAMPUS ID public profile to Private.',
      kampusIdNumber: rec.kampusIdNumber,
      accountStatus: rec.accountStatus,
      disclaimer:
        'KAMPUS Platform Digital Identity — Not a Government or Official University ID.',
    };
  }

  return {
    status: 'Valid',
    message: 'KAMPUS Digital Platform Identity verified cleanly.',
    kampusIdNumber: rec.kampusIdNumber,
    fullName: rec.fullName,
    avatarUrl: rec.privacy.photoVisibility ? rec.avatarUrl : undefined,
    college: rec.privacy.collegeVisibility ? rec.college : undefined,
    course: rec.privacy.academicVisibility ? rec.course : undefined,
    department: rec.privacy.academicVisibility ? rec.department : undefined,
    academicYearOrSemester: rec.privacy.academicVisibility
      ? rec.academicYearOrSemester
      : undefined,
    accountStatus: rec.accountStatus,
    verificationState: rec.verification.institutionalVerification,
    profileCompleted: rec.verification.profileCompleted,
    emailVerified: rec.verification.emailVerified,
    skills: rec.privacy.skillsVisibility ? rec.skills : undefined,
    achievementsCount: rec.privacy.achievementsVisibility
      ? connected.certificates.length
      : undefined,
    clubsCount: rec.privacy.clubsVisibility ? connected.clubsJoined.length : undefined,
    issuedAt: rec.issuedAt,
    expiresAt,
    disclaimer:
      'KAMPUS Platform Digital Identity — Not a Government or Official University ID.',
  };
}

export function registerKampusIdBackend(app: Express) {
  const db = loadDb();

  // Helper to ensure identity exists for user
  function ensureIdentity(userId: string, body?: any): KampusIdentityRecord {
    let rec = db.identitiesByUser[userId];
    const now = new Date().toISOString();

    if (!rec) {
      const kid = generateUniqueKampusId(db);
      const cleanName = String(body?.fullName || 'KAMPUS Student').trim();
      const slugBase = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24);

      rec = {
        kampusIdNumber: kid,
        publicSlug: `${slugBase || 'student'}-${kid.toLowerCase()}`,
        userId,
        fullName: cleanName,
        avatarUrl: String(body?.avatarUrl || ''),
        college: String(body?.college || 'Indian Institute of Technology, Bombay'),
        department: String(body?.department || 'Computer Science & Engineering'),
        course: String(body?.course || 'B.Tech in Computer Science & AI'),
        academicYearOrSemester: String(body?.academicYearOrSemester || 'Semester 6'),
        enrollmentNo: String(body?.enrollmentNo || ''),
        bio: String(body?.bio || ''),
        skills: Array.isArray(body?.skills) ? body.skills.filter(Boolean) : [],
        interests: Array.isArray(body?.interests) ? body.interests.filter(Boolean) : [],
        accountStatus: 'Active',
        cardVersion: 'KAMPUS ID v1.0',
        issuedAt: now,
        updatedAt: now,
        verification: {
          kampusAccount: 'Active',
          profileCompleted: false,
          emailVerified: Boolean(body?.emailVerified),
          institutionalInfoProvided: Boolean(body?.college && body?.enrollmentNo),
          institutionalVerification: 'Not Submitted',
        },
        privacy: {
          profileVisibility: 'Public',
          photoVisibility: true,
          collegeVisibility: true,
          academicVisibility: true,
          skillsVisibility: true,
          achievementsVisibility: true,
          clubsVisibility: true,
        },
        activityHistory: [
          {
            id: `kid_act_${Date.now()}`,
            action: 'ID Created',
            detail: `Immutable platform ID ${kid} issued.`,
            timestamp: now,
          },
        ],
      };
      rec.verification.profileCompleted = isProfileComplete(rec);
      db.identitiesByUser[userId] = rec;
      saveDb(db);

      // Dispatch real notification
      try {
        dispatchNotification({
          userId,
          title: 'KAMPUS ID Issued',
          description: `Your digital student identity ${kid} has been officially issued.`,
          category: 'Campus',
          priority: 'Normal',
          sourceModule: 'kampus_id',
        });
      } catch {}
    }
    return rec;
  }

  // 1. Bootstrap or get current student's KAMPUS ID
  app.post('/api/kampus-id/bootstrap', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const rec = ensureIdentity(userId, req.body);

    const roleInfo = db.verifierOverrides[userId] || { role: 'Student' as KampusIdRole, label: null };
    const connected = readGenuineConnectedSummary(userId);
    const myRequests = db.verificationRequests.filter((r) => r.userId === userId);

    const iat = Date.now();
    const exp = iat + 300_000;
    const nonce = crypto.randomBytes(8).toString('hex');
    const token = signIdentityQrToken({
      kid: rec.kampusIdNumber,
      nonce,
      iat,
      exp,
    });

    const qrPayload = {
      token,
      expiresAt: new Date(exp).toISOString(),
      verifyUrl: `/verify/id/${rec.kampusIdNumber}`,
      nonce,
    };

    return res.json({
      success: true,
      identity: rec,
      connectedSummary: connected,
      verificationRequests: myRequests,
      roleInfo,
      qrPayload,
      publicVerificationUrl: `/verify/id/${rec.kampusIdNumber}`,
    });
  });

  // Alias: GET /api/kampus-id/me
  app.get('/api/kampus-id/me', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const rec = ensureIdentity(userId);

    const roleInfo = db.verifierOverrides[userId] || { role: 'Student' as KampusIdRole, label: null };
    const connected = readGenuineConnectedSummary(userId);
    const myRequests = db.verificationRequests.filter((r) => r.userId === userId);

    const iat = Date.now();
    const exp = iat + 300_000;
    const nonce = crypto.randomBytes(8).toString('hex');
    const token = signIdentityQrToken({
      kid: rec.kampusIdNumber,
      nonce,
      iat,
      exp,
    });

    const qrPayload = {
      token,
      expiresAt: new Date(exp).toISOString(),
      verifyUrl: `/verify/id/${rec.kampusIdNumber}`,
      nonce,
    };

    return res.json({
      success: true,
      identity: rec,
      connectedSummary: connected,
      verificationRequests: myRequests,
      roleInfo,
      qrPayload,
      publicVerificationUrl: `/verify/id/${rec.kampusIdNumber}`,
    });
  });

  // 2. Summary for cross-module integration
  app.get('/api/kampus-id/summary', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.json({ kampusIdNumber: null });
    return res.json({
      kampusIdNumber: rec.kampusIdNumber,
      verificationState: rec.verification.institutionalVerification,
      accountStatus: rec.accountStatus,
    });
  });

  // 3. Update editable profile fields (Strictly prevents altering immutable kampusIdNumber)
  const updateProfileHandler = (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const b = req.body || {};
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.status(404).json({ message: 'KAMPUS ID record not found.' });

    const now = new Date().toISOString();
    if (typeof b.fullName === 'string' && b.fullName.trim()) rec.fullName = b.fullName.trim();
    if (typeof b.college === 'string' && b.college.trim()) rec.college = b.college.trim();
    if (typeof b.department === 'string') rec.department = b.department.trim();
    if (typeof b.course === 'string' && b.course.trim()) rec.course = b.course.trim();
    if (typeof b.academicYearOrSemester === 'string' && b.academicYearOrSemester.trim()) {
      rec.academicYearOrSemester = b.academicYearOrSemester.trim();
    }
    if (typeof b.semester === 'string' && b.semester.trim()) {
      rec.semester = b.semester.trim();
      rec.academicYearOrSemester = b.semester.trim();
    }
    if (typeof b.yearOfStudy === 'string' && b.yearOfStudy.trim()) {
      rec.yearOfStudy = b.yearOfStudy.trim();
    }
    if (typeof b.enrollmentNo === 'string' && b.enrollmentNo.trim()) {
      rec.enrollmentNo = b.enrollmentNo.trim();
      rec.enrollmentNumber = b.enrollmentNo.trim();
    }
    if (typeof b.enrollmentNumber === 'string' && b.enrollmentNumber.trim()) {
      rec.enrollmentNumber = b.enrollmentNumber.trim();
      rec.enrollmentNo = b.enrollmentNumber.trim();
    }
    if (typeof b.bio === 'string') rec.bio = b.bio.trim();
    if (Array.isArray(b.skills)) rec.skills = b.skills.map(String).filter(Boolean);
    if (Array.isArray(b.interests)) rec.interests = b.interests.map(String).filter(Boolean);
    if (typeof b.avatarUrl === 'string' && b.avatarUrl.trim()) rec.avatarUrl = b.avatarUrl.trim();

    rec.updatedAt = now;
    rec.verification.profileCompleted = isProfileComplete(rec);
    rec.verification.institutionalInfoProvided = Boolean(
      rec.college.trim() && rec.enrollmentNo.trim()
    );
    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'Profile Updated',
      detail: 'Academic profile & skills updated.',
      timestamp: now,
    });
    saveDb(db);
    return res.json({ success: true, identity: rec });
  };

  app.patch('/api/kampus-id/profile', updateProfileHandler);
  app.put('/api/kampus-id/profile', updateProfileHandler);

  // 4. Generate Time-Limited Signed QR Verification Token (5 minute TTL)
  app.post('/api/kampus-id/qr-token', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { manualRefresh } = req.body || {};
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.status(404).json({ message: 'KAMPUS ID record not found.' });
    if (rec.accountStatus !== 'Active') {
      return res.status(403).json({ message: 'Inactive or suspended KAMPUS ID cannot issue verification tokens.' });
    }

    const iat = Date.now();
    const exp = iat + 300_000; // 5 minutes
    const nonce = crypto.randomBytes(8).toString('hex');
    const token = signIdentityQrToken({
      kid: rec.kampusIdNumber,
      nonce,
      iat,
      exp,
    });

    if (manualRefresh) {
      rec.activityHistory.unshift({
        id: `kid_act_${Date.now()}`,
        action: 'QR Regenerated',
        detail: 'Manual QR verification token rotation performed.',
        timestamp: new Date(iat).toISOString(),
      });
      saveDb(db);
    }

    return res.json({
      token,
      issuedAt: new Date(iat).toISOString(),
      expiresAt: new Date(exp).toISOString(),
      kampusIdNumber: rec.kampusIdNumber,
    });
  });

  // Alias: Rotate verification reference (instantly revoking prior nonces)
  app.post('/api/kampus-id/me/rotate-verification', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.status(404).json({ success: false, message: 'KAMPUS ID record not found.' });

    const { priorNonce } = req.body || {};
    if (priorNonce) {
      if (!db.revokedNonces) db.revokedNonces = [];
      db.revokedNonces.push(String(priorNonce));
    }

    const iat = Date.now();
    const exp = iat + 300_000;
    const nonce = crypto.randomBytes(8).toString('hex');
    const token = signIdentityQrToken({
      kid: rec.kampusIdNumber,
      nonce,
      iat,
      exp,
    });

    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'QR Regenerated',
      detail: 'Rotated verification reference; prior QR references invalidated.',
      timestamp: new Date(iat).toISOString(),
    });
    saveDb(db);

    const qrPayload = {
      token,
      expiresAt: new Date(exp).toISOString(),
      verifyUrl: `/verify/id/${rec.kampusIdNumber}`,
      nonce,
    };

    return res.json({
      success: true,
      message: 'Verification reference successfully rotated.',
      token,
      expiresAt: new Date(exp).toISOString(),
      qrPayload,
    });
  });

  // 5. Public Rate-Limited QR Verification Endpoint
  app.post('/api/kampus-id/verify-qr', (req: Request, res: Response) => {
    const ip = req.ip || 'local';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        status: 'Invalid',
        message: 'Too many verification requests. Please wait a minute before retrying.',
        disclaimer: 'KAMPUS Platform Digital Identity — Not a Government or Official University ID.',
      });
    }

    const { token } = req.body || {};
    const parsed = verifyIdentityQrToken(String(token || ''), db);

    if (!parsed.valid || !parsed.payload) {
      return res.status(400).json({
        success: false,
        status: parsed.revoked ? 'Revoked' : parsed.expired ? 'Expired' : 'Invalid',
        message: parsed.revoked
          ? 'This verification QR code has been revoked by the student.'
          : parsed.expired
          ? 'Verification QR token has expired. Ask the student to tap Refresh QR.'
          : 'Invalid verification token: signature mismatch or malformed credential.',
        disclaimer: 'KAMPUS Platform Digital Identity — Not a Government or Official University ID.',
      });
    }

    const rec = Object.values(db.identitiesByUser).find(
      (r) => r.kampusIdNumber === parsed.payload!.kid
    );
    if (!rec) {
      return res.status(404).json({
        status: 'Invalid',
        message: 'No KAMPUS ID matches this verified credential.',
        disclaimer: 'KAMPUS Platform Digital Identity — Not a Government or Official University ID.',
      });
    }

    const connected = readGenuineConnectedSummary(rec.userId);
    const payload = buildPublicIdentityPayload(
      rec,
      connected,
      new Date(parsed.payload.exp).toISOString()
    );
    return res.json({
      success: true,
      identity: rec,
      profile: payload,
      ...payload,
    });
  });

  // 6. Public Student Profile Lookup by Slug or KAMPUS ID Number
  const publicLookupHandler = (req: Request, res: Response) => {
    const idParam = String(req.params.identifier || req.params.id || '').trim().toLowerCase();
    const rec = Object.values(db.identitiesByUser).find(
      (r) =>
        r.publicSlug.toLowerCase() === idParam ||
        r.kampusIdNumber.toLowerCase() === idParam
    );
    if (!rec) {
      return res.status(404).json({
        success: false,
        status: 'Invalid',
        message: 'Public KAMPUS ID profile not found.',
        disclaimer: 'KAMPUS Platform Digital Identity — Not a Government or Official University ID.',
      });
    }
    const connected = readGenuineConnectedSummary(rec.userId);
    const payload = buildPublicIdentityPayload(rec, connected);
    return res.json({
      success: true,
      identity: rec,
      profile: payload,
      ...payload,
    });
  };

  app.get('/api/kampus-id/public/:identifier', publicLookupHandler);
  app.get('/api/kampus-id/:id/public', publicLookupHandler);

  // 7. Granular Privacy Controls
  app.patch('/api/kampus-id/privacy', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { privacy } = req.body || {};
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.status(404).json({ message: 'KAMPUS ID record not found.' });

    rec.privacy = {
      profileVisibility: privacy?.profileVisibility || rec.privacy.profileVisibility,
      photoVisibility: typeof privacy?.photoVisibility === 'boolean' ? privacy.photoVisibility : rec.privacy.photoVisibility,
      collegeVisibility: typeof privacy?.collegeVisibility === 'boolean' ? privacy.collegeVisibility : rec.privacy.collegeVisibility,
      academicVisibility: typeof privacy?.academicVisibility === 'boolean' ? privacy.academicVisibility : rec.privacy.academicVisibility,
      skillsVisibility: typeof privacy?.skillsVisibility === 'boolean' ? privacy.skillsVisibility : rec.privacy.skillsVisibility,
      achievementsVisibility: typeof privacy?.achievementsVisibility === 'boolean' ? privacy.achievementsVisibility : rec.privacy.achievementsVisibility,
      clubsVisibility: typeof privacy?.clubsVisibility === 'boolean' ? privacy.clubsVisibility : rec.privacy.clubsVisibility,
    };

    const now = new Date().toISOString();
    rec.updatedAt = now;
    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'Privacy Updated',
      detail: `Visibility set to ${rec.privacy.profileVisibility}.`,
      timestamp: now,
    });
    saveDb(db);
    return res.json({ identity: rec });
  });

  // 8. Submit Verification Request
  const verificationRequestHandler = (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { institutionEmailDomain, supportingNote } = req.body || {};
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.status(404).json({ message: 'KAMPUS ID record not found.' });

    const enrollment = rec.enrollmentNo || (rec as any).enrollmentNumber || req.body?.enrollmentNo || req.body?.enrollmentNumber || '';
    if (!rec.enrollmentNo && enrollment) rec.enrollmentNo = enrollment;

    if (!rec.college.trim()) {
      return res.status(400).json({
        message: 'College reference is required before submitting verification.',
      });
    }

    const now = new Date().toISOString();
    const request: VerificationReviewRequest = {
      id: `kver_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      kampusIdNumber: rec.kampusIdNumber,
      userId: rec.userId,
      studentName: rec.fullName,
      college: rec.college,
      course: rec.course,
      enrollmentNo: rec.enrollmentNo,
      institutionEmailDomain: String(institutionEmailDomain || 'campus domain').trim(),
      supportingNote: String(supportingNote || '').trim(),
      status: 'Pending Review',
      createdAt: now,
    };

    rec.verification.institutionalVerification = 'Pending Review';
    rec.verificationStatus = 'PENDING_REVIEW';
    rec.statusBadge = 'Verification Pending';
    rec.verification.institutionalNote =
      'Submitted for authorized verifier review. Pending institutional confirmation.';
    rec.updatedAt = now;
    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'Verification Requested',
      detail: 'Submitted institutional details for platform verification review.',
      timestamp: now,
    });

    db.verificationRequests.unshift(request);
    saveDb(db);

    try {
      dispatchNotification({
        userId,
        title: 'Identity Verification Submitted',
        description: 'Your verification request has been received and queued for review.',
        category: 'Campus',
        priority: 'Normal',
        sourceModule: 'kampus_id',
      });
    } catch {}

    return res.status(201).json({ success: true, request, identity: rec });
  };

  app.post('/api/kampus-id/verification/request', verificationRequestHandler);
  app.post('/api/kampus-id/me/verification-request', verificationRequestHandler);

  // 9. Get verification status
  app.get('/api/kampus-id/me/verification-status', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.status(404).json({ message: 'KAMPUS ID record not found.' });

    const requests = db.verificationRequests.filter((r) => r.userId === userId);
    return res.json({
      success: true,
      institutionalVerification: rec.verification.institutionalVerification,
      note: rec.verification.institutionalNote,
      latestRequest: requests[0] || null,
    });
  });

  // 10. Admin session passkey check
  app.post('/api/kampus-id/admin/session', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { passkey, revert } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (revert) {
      delete db.verifierOverrides[userId];
      saveDb(db);
      return res.json({ ok: true, roleInfo: { role: 'Student', label: null } });
    }
    const clean = String(passkey || '').trim().toUpperCase();
    const matched = VERIFIER_PASSKEYS[clean];
    if (!matched) {
      return res.status(403).json({ message: 'Invalid verifier or admin authorization code.' });
    }
    db.verifierOverrides[userId] = matched;
    saveDb(db);
    return res.json({ ok: true, roleInfo: matched });
  });

  // 11. Admin: List and search student IDs
  app.get('/api/admin/kampus-ids', (req: Request, res: Response) => {
    if (!isUserAdmin(req, db)) {
      return res.status(403).json({ message: 'Forbidden: Platform Admin permission required.' });
    }

    const search = String(req.query.search || '').trim().toLowerCase();
    const status = String(req.query.status || '').trim();

    let list = Object.values(db.identitiesByUser);
    if (search) {
      list = list.filter(
        (i) =>
          i.fullName.toLowerCase().includes(search) ||
          i.kampusIdNumber.toLowerCase().includes(search) ||
          i.college.toLowerCase().includes(search) ||
          i.course.toLowerCase().includes(search)
      );
    }
    if (status) {
      list = list.filter(
        (i) =>
          i.accountStatus.toLowerCase() === status.toLowerCase() ||
          i.verification.institutionalVerification.toLowerCase() === status.toLowerCase()
      );
    }

    return res.json({
      success: true,
      totalCount: list.length,
      records: list,
    });
  });

  // 12. Admin: Get single student ID record
  app.get('/api/admin/kampus-ids/:id', (req: Request, res: Response) => {
    if (!isUserAdmin(req, db)) {
      return res.status(403).json({ message: 'Forbidden: Platform Admin permission required.' });
    }

    const { id } = req.params;
    const rec = Object.values(db.identitiesByUser).find(
      (i) => i.kampusIdNumber === id || i.userId === id
    );
    if (!rec) return res.status(404).json({ message: 'Student ID record not found.' });

    const requests = db.verificationRequests.filter((r) => r.userId === rec.userId);
    return res.json({ success: true, record: rec, requests });
  });

  // 13. Admin: Approve verification
  app.post('/api/admin/kampus-ids/:id/approve', (req: Request, res: Response) => {
    if (!isUserAdmin(req, db)) {
      return res.status(403).json({ message: 'Forbidden: Platform Admin permission required.' });
    }

    const { id } = req.params;
    const rec = Object.values(db.identitiesByUser).find(
      (i) => i.kampusIdNumber === id || i.userId === id
    );
    if (!rec) return res.status(404).json({ message: 'Student ID record not found.' });

    const prev = rec.verification.institutionalVerification;
    rec.verification.institutionalVerification = 'Verified';
    rec.verificationStatus = 'APPROVED';
    rec.statusBadge = 'Verified Scholar';
    rec.verification.institutionalNote = 'Institutionally verified by Platform Admin.';
    rec.updatedAt = new Date().toISOString();

    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'Verification Reviewed',
      detail: 'Institutional student verification approved by Platform Admin.',
      timestamp: rec.updatedAt,
    });

    db.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      kampusIdNumber: rec.kampusIdNumber,
      action: 'Verification Approved',
      performedBy: 'Platform Admin',
      previousStatus: prev,
      newStatus: 'Verified',
      timestamp: rec.updatedAt,
    });

    saveDb(db);

    try {
      dispatchNotification({
        userId: rec.userId,
        title: 'KAMPUS ID Verification Approved',
        description: 'Your academic student identity has been officially approved.',
        category: 'Campus',
        priority: 'High',
        sourceModule: 'kampus_id',
      });
    } catch {}

    return res.json({ success: true, message: 'Verification approved.', identity: rec });
  });

  // 14. Admin: Reject verification
  app.post('/api/admin/kampus-ids/:id/reject', (req: Request, res: Response) => {
    if (!isUserAdmin(req, db)) {
      return res.status(403).json({ message: 'Forbidden: Platform Admin permission required.' });
    }

    const { id } = req.params;
    const { reason } = req.body || {};
    const rec = Object.values(db.identitiesByUser).find(
      (i) => i.kampusIdNumber === id || i.userId === id
    );
    if (!rec) return res.status(404).json({ message: 'Student ID record not found.' });

    const prev = rec.verification.institutionalVerification;
    rec.verification.institutionalVerification = 'Rejected';
    rec.verificationStatus = 'REJECTED';
    rec.statusBadge = 'Action Required';
    rec.verification.institutionalNote = reason || 'Verification documents could not be confirmed.';
    rec.updatedAt = new Date().toISOString();

    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'Verification Reviewed',
      detail: `Verification rejected: ${reason || 'Details could not be confirmed'}.`,
      timestamp: rec.updatedAt,
    });

    db.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      kampusIdNumber: rec.kampusIdNumber,
      action: 'Verification Rejected',
      performedBy: 'Platform Admin',
      previousStatus: prev,
      newStatus: 'Rejected',
      reason,
      timestamp: rec.updatedAt,
    });

    saveDb(db);

    try {
      dispatchNotification({
        userId: rec.userId,
        title: 'KAMPUS ID Action Required',
        description: `Your verification request was rejected: ${reason || 'Please review your student credentials.'}`,
        category: 'Campus',
        priority: 'High',
        sourceModule: 'kampus_id',
      });
    } catch {}

    return res.json({ success: true, message: 'Verification rejected.', identity: rec });
  });

  // 15. Admin: Suspend ID
  app.post('/api/admin/kampus-ids/:id/suspend', (req: Request, res: Response) => {
    if (!isUserAdmin(req, db)) {
      return res.status(403).json({ message: 'Forbidden: Platform Admin permission required.' });
    }

    const { id } = req.params;
    const { reason } = req.body || {};
    const rec = Object.values(db.identitiesByUser).find(
      (i) => i.kampusIdNumber === id || i.userId === id
    );
    if (!rec) return res.status(404).json({ message: 'Student ID record not found.' });

    rec.accountStatus = 'Inactive';
    rec.updatedAt = new Date().toISOString();

    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'ID Suspended',
      detail: `ID suspended by Admin. Reason: ${reason || 'Administrative hold.'}`,
      timestamp: rec.updatedAt,
    });

    db.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      kampusIdNumber: rec.kampusIdNumber,
      action: 'ID Suspended',
      performedBy: 'Platform Admin',
      previousStatus: 'Active',
      newStatus: 'Inactive',
      reason,
      timestamp: rec.updatedAt,
    });

    saveDb(db);

    try {
      dispatchNotification({
        userId: rec.userId,
        title: 'KAMPUS ID Suspended',
        description: `Your KAMPUS ID has been suspended: ${reason || 'Please contact administration.'}`,
        category: 'Campus',
        priority: 'High',
        sourceModule: 'kampus_id',
      });
    } catch {}

    return res.json({ success: true, message: 'ID suspended.', identity: rec });
  });

  // 16. Admin: Restore ID
  app.post('/api/admin/kampus-ids/:id/restore', (req: Request, res: Response) => {
    if (!isUserAdmin(req, db)) {
      return res.status(403).json({ message: 'Forbidden: Platform Admin permission required.' });
    }

    const { id } = req.params;
    const rec = Object.values(db.identitiesByUser).find(
      (i) => i.kampusIdNumber === id || i.userId === id
    );
    if (!rec) return res.status(404).json({ message: 'Student ID record not found.' });

    rec.accountStatus = 'Active';
    rec.updatedAt = new Date().toISOString();

    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'ID Restored',
      detail: 'ID restored to Active status by Admin.',
      timestamp: rec.updatedAt,
    });

    db.auditLogs.unshift({
      id: `audit_${Date.now()}`,
      kampusIdNumber: rec.kampusIdNumber,
      action: 'ID Restored',
      performedBy: 'Platform Admin',
      previousStatus: 'Inactive',
      newStatus: 'Active',
      timestamp: rec.updatedAt,
    });

    saveDb(db);

    try {
      dispatchNotification({
        userId: rec.userId,
        title: 'KAMPUS ID Restored',
        description: 'Your KAMPUS ID has been reactivated to Active status.',
        category: 'Campus',
        priority: 'Normal',
        sourceModule: 'kampus_id',
      });
    } catch {}

    return res.json({ success: true, message: 'ID restored to active.', identity: rec });
  });

  // 17. PDF Download
  app.get('/api/kampus-id/download-pdf', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.status(404).json({ message: 'KAMPUS ID record not found.' });

    const pdfBuffer = buildKampusIdPdf(rec);
    const filename = `${rec.kampusIdNumber.replace(/[^A-Za-z0-9_-]/g, '_')}_ID_CARD.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  });

  console.log('[KampusIdBackend] Registered KAMPUS ID endpoints on /api/kampus-id/* and /api/admin/kampus-ids/*');
}
