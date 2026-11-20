import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  GenuineConnectedSummary,
  KampusIdPrivacySettings,
  KampusIdRole,
  KampusIdentityRecord,
  PublicVerifiedIdentityPayload,
  VerificationReviewRequest,
} from '../src/types/kampusId.ts';

interface KampusIdDatabase {
  identitiesByUser: Record<string, KampusIdentityRecord>;
  issuedNumbers: string[];
  verificationRequests: VerificationReviewRequest[];
  verifierOverrides: Record<string, { role: KampusIdRole; label: string }>;
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

// Simple in-memory rate limiter for QR verification (max 30 requests/minute per IP)
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

function loadDb(): KampusIdDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (parsed && parsed.identitiesByUser) {
        return {
          identitiesByUser: parsed.identitiesByUser || {},
          issuedNumbers: parsed.issuedNumbers || [],
          verificationRequests: parsed.verificationRequests || [],
          verifierOverrides: parsed.verifierOverrides || {},
        };
      }
    }
  } catch {
    // recreate cleanly
  }
  const initial: KampusIdDatabase = {
    identitiesByUser: {},
    issuedNumbers: [],
    verificationRequests: [],
    verifierOverrides: {},
  };
  saveDb(initial);
  return initial;
}

function saveDb(db: KampusIdDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist KAMPUS ID DB:', err);
  }
}

function generateUniqueKampusId(db: KampusIdDatabase): string {
  const year = String(new Date().getFullYear()).slice(-2);
  for (let i = 0; i < 40; i++) {
    const num = Math.floor(100000 + Math.random() * 899999);
    const candidate = `KMP-${year}-${num}`;
    if (!db.issuedNumbers.includes(candidate)) {
      db.issuedNumbers.push(candidate);
      return candidate;
    }
  }
  const fallback = `KMP-${year}-${String(Date.now()).slice(-6)}`;
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

function verifyIdentityQrToken(token: string): {
  valid: boolean;
  expired?: boolean;
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
  } catch {
    // optional cross-module read
  }

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
  } catch {
    // optional cross-module read
  }

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

  // 1. Bootstrap or create immutable KAMPUS ID for authenticated student
  app.post('/api/kampus-id/bootstrap', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const now = new Date().toISOString();
    let rec = db.identitiesByUser[userId];

    if (!rec) {
      const kid = generateUniqueKampusId(db);
      const cleanName = String(b.fullName || 'KAMPUS Student').trim();
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
        avatarUrl: String(b.avatarUrl || ''),
        college: String(b.college || 'Indian Institute of Technology, Bombay'),
        department: String(b.department || 'Computer Science & Engineering'),
        course: String(b.course || 'B.Tech in Computer Science & AI'),
        academicYearOrSemester: String(b.academicYearOrSemester || 'Semester 6'),
        enrollmentNo: String(b.enrollmentNo || ''),
        bio: String(b.bio || ''),
        skills: Array.isArray(b.skills) ? b.skills.filter(Boolean) : [],
        interests: Array.isArray(b.interests) ? b.interests.filter(Boolean) : [],
        accountStatus: 'Active',
        cardVersion: 'KAMPUS ID v1.0',
        issuedAt: now,
        updatedAt: now,
        verification: {
          kampusAccount: 'Active',
          profileCompleted: false,
          emailVerified: Boolean(b.emailVerified),
          institutionalInfoProvided: Boolean(b.college && b.enrollmentNo),
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
    } else {
      // Keep synced with latest Auth/Profile fields without ever altering kampusIdNumber
      let changed = false;
      const fields: Array<[keyof KampusIdentityRecord, unknown]> = [
        ['fullName', b.fullName],
        ['avatarUrl', b.avatarUrl],
        ['college', b.college],
        ['course', b.course],
        ['academicYearOrSemester', b.academicYearOrSemester],
        ['enrollmentNo', b.enrollmentNo],
      ];
      for (const [key, val] of fields) {
        if (typeof val === 'string' && val.trim() && rec[key] !== val.trim()) {
          (rec as unknown as Record<string, unknown>)[key] = val.trim();
          changed = true;
        }
      }
      if (typeof b.bio === 'string' && rec.bio !== b.bio) {
        rec.bio = b.bio;
        changed = true;
      }
      if (Array.isArray(b.interests)) {
        rec.interests = b.interests.filter(Boolean);
      }
      rec.verification.profileCompleted = isProfileComplete(rec);
      rec.verification.emailVerified = Boolean(b.emailVerified);
      rec.verification.institutionalInfoProvided = Boolean(
        rec.college.trim() && rec.enrollmentNo.trim()
      );
      if (changed) {
        rec.updatedAt = now;
        rec.activityHistory.unshift({
          id: `kid_act_${Date.now()}`,
          action: 'Profile Updated',
          detail: 'Synchronized updated student profile details.',
          timestamp: now,
        });
      }
      saveDb(db);
    }

    const roleInfo = db.verifierOverrides[userId] || { role: 'Student' as KampusIdRole, label: null };
    const connected = readGenuineConnectedSummary(userId);
    const myRequests = db.verificationRequests.filter((r) => r.userId === userId);

    return res.json({
      identity: rec,
      connectedSummary: connected,
      verificationRequests: myRequests,
      roleInfo,
    });
  });

  // 2. Lightweight summary for cross-module integration (Events & Clubs, Community, etc.)
  app.get('/api/kampus-id/summary', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.json({ kampusIdNumber: null });
    return res.json({
      kampusIdNumber: rec.kampusIdNumber,
      verificationState: rec.verification.institutionalVerification,
    });
  });

  // 3. Update editable academic profile fields (department, skills, interests, bio)
  app.patch('/api/kampus-id/profile', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
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
    if (typeof b.enrollmentNo === 'string' && b.enrollmentNo.trim()) {
      rec.enrollmentNo = b.enrollmentNo.trim();
    }
    if (typeof b.bio === 'string') rec.bio = b.bio.trim();
    if (Array.isArray(b.skills)) rec.skills = b.skills.map(String).filter(Boolean);
    if (Array.isArray(b.interests)) rec.interests = b.interests.map(String).filter(Boolean);

    rec.updatedAt = now;
    rec.verification.profileCompleted = isProfileComplete(rec);
    rec.verification.institutionalInfoProvided = Boolean(
      rec.college.trim() && rec.enrollmentNo.trim()
    );
    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'Profile Updated',
      detail: 'Academic profile & skills updated inside KAMPUS ID.',
      timestamp: now,
    });
    saveDb(db);
    return res.json({ identity: rec });
  });

  // 4. Generate / Rotate Time-Limited Signed QR Verification Token (5 minute TTL)
  app.post('/api/kampus-id/qr-token', (req: Request, res: Response) => {
    const { userId, manualRefresh } = req.body || {};
    const rec = db.identitiesByUser[String(userId || '')];
    if (!rec) return res.status(404).json({ message: 'KAMPUS ID record not found.' });
    if (rec.accountStatus !== 'Active') {
      return res.status(403).json({ message: 'Inactive KAMPUS ID cannot issue verification tokens.' });
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

  // 5. Public Rate-Limited QR Verification Endpoint (strictly privacy filtered; zero sensitive leakage)
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
    const parsed = verifyIdentityQrToken(String(token || ''));

    if (!parsed.valid || !parsed.payload) {
      return res.status(parsed.expired ? 400 : 400).json({
        status: parsed.expired ? 'Expired' : 'Invalid',
        message: parsed.expired
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
    return res.json(payload);
  });

  // 6. Public Student Profile Lookup by Slug or KAMPUS ID Ref (privacy-controlled)
  app.get('/api/kampus-id/public/:identifier', (req: Request, res: Response) => {
    const idParam = String(req.params.identifier || '').trim().toLowerCase();
    const rec = Object.values(db.identitiesByUser).find(
      (r) =>
        r.publicSlug.toLowerCase() === idParam ||
        r.kampusIdNumber.toLowerCase() === idParam
    );
    if (!rec) {
      return res.status(404).json({
        status: 'Invalid',
        message: 'Public KAMPUS ID profile not found.',
        disclaimer: 'KAMPUS Platform Digital Identity — Not a Government or Official University ID.',
      });
    }
    const connected = readGenuineConnectedSummary(rec.userId);
    return res.json(buildPublicIdentityPayload(rec, connected));
  });

  // 7. Granular Privacy Controls
  app.patch('/api/kampus-id/privacy', (req: Request, res: Response) => {
    const { userId, privacy } = req.body || {};
    const rec = db.identitiesByUser[String(userId || '')];
    if (!rec) return res.status(404).json({ message: 'KAMPUS ID record not found.' });

    const next: KampusIdPrivacySettings = {
      profileVisibility: privacy?.profileVisibility || rec.privacy.profileVisibility,
      photoVisibility:
        typeof privacy?.photoVisibility === 'boolean'
          ? privacy.photoVisibility
          : rec.privacy.photoVisibility,
      collegeVisibility:
        typeof privacy?.collegeVisibility === 'boolean'
          ? privacy.collegeVisibility
          : rec.privacy.collegeVisibility,
      academicVisibility:
        typeof privacy?.academicVisibility === 'boolean'
          ? privacy.academicVisibility
          : rec.privacy.academicVisibility,
      skillsVisibility:
        typeof privacy?.skillsVisibility === 'boolean'
          ? privacy.skillsVisibility
          : rec.privacy.skillsVisibility,
      achievementsVisibility:
        typeof privacy?.achievementsVisibility === 'boolean'
          ? privacy.achievementsVisibility
          : rec.privacy.achievementsVisibility,
      clubsVisibility:
        typeof privacy?.clubsVisibility === 'boolean'
          ? privacy.clubsVisibility
          : rec.privacy.clubsVisibility,
    };

    rec.privacy = next;
    const now = new Date().toISOString();
    rec.updatedAt = now;
    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'Privacy Updated',
      detail: `Visibility set to ${next.profileVisibility}.`,
      timestamp: now,
    });
    saveDb(db);
    return res.json({ identity: rec });
  });

  // 8. Verification Request Submission & Backend-Enforced Verifier/Admin Queue
  app.post('/api/kampus-id/verification/request', (req: Request, res: Response) => {
    const { userId, institutionEmailDomain, supportingNote } = req.body || {};
    const rec = db.identitiesByUser[String(userId || '')];
    if (!rec) return res.status(404).json({ message: 'KAMPUS ID record not found.' });

    if (!rec.college.trim() || !rec.enrollmentNo.trim()) {
      return res.status(400).json({
        message: 'College and enrollment reference are required before submitting verification.',
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
    rec.verification.institutionalNote =
      'Submitted for authorized verifier review. External registrar auto-check is not connected.';
    rec.updatedAt = now;
    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'Verification Requested',
      detail: 'Submitted institutional details for platform verification review.',
      timestamp: now,
    });

    db.verificationRequests.unshift(request);
    saveDb(db);
    return res.status(201).json({ request, identity: rec });
  });

  app.post('/api/kampus-id/admin/session', (req: Request, res: Response) => {
    const { userId, passkey, revert } = req.body || {};
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

  app.get('/api/kampus-id/admin/requests', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    const roleInfo = db.verifierOverrides[userId];
    if (!roleInfo || (roleInfo.role !== 'Authorized Verifier' && roleInfo.role !== 'Platform Admin')) {
      return res.status(403).json({
        message: 'Forbidden: Authorized Verifier or Platform Admin permission required.',
      });
    }
    return res.json({ requests: db.verificationRequests });
  });

  app.post('/api/kampus-id/admin/requests/:id/decide', (req: Request, res: Response) => {
    const userId = String(req.body?.userId || '').trim();
    const roleInfo = db.verifierOverrides[userId];
    if (!roleInfo || (roleInfo.role !== 'Authorized Verifier' && roleInfo.role !== 'Platform Admin')) {
      return res.status(403).json({
        message: 'Forbidden: Only authorized verifiers can decide verification requests.',
      });
    }
    const vr = db.verificationRequests.find((r) => r.id === req.params.id);
    if (!vr) return res.status(404).json({ message: 'Verification request not found.' });

    const decision = req.body?.decision as
      | 'Verified'
      | 'Verification Not Available'
      | 'Rejected';
    if (!['Verified', 'Verification Not Available', 'Rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid verification decision.' });
    }

    const now = new Date().toISOString();
    vr.status = decision;
    vr.reviewerNote = String(req.body?.reviewerNote || '').trim();
    vr.reviewedBy = roleInfo.label;
    vr.reviewedAt = now;

    const studentRec = db.identitiesByUser[vr.userId];
    if (studentRec) {
      studentRec.verification.institutionalVerification = decision;
      studentRec.verification.institutionalNote = vr.reviewerNote || undefined;
      studentRec.updatedAt = now;
      studentRec.activityHistory.unshift({
        id: `kid_act_${Date.now()}`,
        action: 'Verification Reviewed',
        detail: `Institutional verification updated to "${decision}" by ${roleInfo.label}.`,
        timestamp: now,
      });
    }

    saveDb(db);
    return res.json({ request: vr, identity: studentRec });
  });

  // 9. Official Platform Identity PDF Download
  app.get('/api/kampus-id/download-pdf', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    const rec = db.identitiesByUser[userId];
    if (!rec) return res.status(404).send('KAMPUS ID record not found');

    rec.activityHistory.unshift({
      id: `kid_act_${Date.now()}`,
      action: 'PDF Downloaded',
      detail: 'Exported KAMPUS Digital Platform Identity Card PDF.',
      timestamp: new Date().toISOString(),
    });
    saveDb(db);

    const pdf = buildKampusIdPdf(rec);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${rec.kampusIdNumber}.pdf"`);
    return res.send(pdf);
  });
}
