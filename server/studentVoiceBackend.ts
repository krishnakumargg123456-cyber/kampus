import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  IdeaStatus,
  InstitutionalUpdate,
  PriorityLevel,
  PrivacyMode,
  SubmissionStatus,
  VoiceAbuseReport,
  VoiceAttachment,
  VoiceAuditLog,
  VoiceCategoryGroup,
  VoiceIdea,
  VoicePoll,
  VoicePollResponse,
  VoiceRole,
  VoiceSubmission,
} from '../src/types/studentVoice.ts';

interface StoredConfidentialIdentity {
  submissionId: string;
  ownerId: string;
  name: string;
  email: string;
  enrollmentNo: string;
}

interface StoredVoiceFile {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64Data: string;
  ownerId: string | null;
  submissionId?: string;
  isPublicIdeaFile?: boolean;
  createdAt: string;
}

interface StudentVoiceDatabase {
  categories: VoiceCategoryGroup[];
  submissions: VoiceSubmission[];
  confidentialIdentities: Record<string, StoredConfidentialIdentity>;
  ideas: VoiceIdea[];
  bookmarkedIdeaIdsByUser: Record<string, string[]>;
  polls: VoicePoll[];
  pollResponses: VoicePollResponse[];
  institutionalUpdates: InstitutionalUpdate[];
  reports: VoiceAbuseReport[];
  auditLogs: VoiceAuditLog[];
  files: Record<string, StoredVoiceFile>;
  roleOverrides: Record<string, { role: VoiceRole; department?: string; label: string }>;
  refCounter: number;
}

const DB_FILE = path.join(process.cwd(), '.kampus_student_voice_db.json');
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const VOICE_PASSKEYS: Record<string, { role: VoiceRole; department?: string; label: string }> = {
  'KMP-VOICE-PLATFORM-2026': {
    role: 'Platform Admin',
    label: 'Platform Governance Administrator',
  },
  'KMP-VOICE-INST-2026': {
    role: 'Institution Admin',
    label: 'Institution Student Affairs & Dean Office',
  },
  'KMP-VOICE-DEPT-2026': {
    role: 'Department Admin',
    department: 'Estate, Maintenance & Campus Facilities',
    label: 'Estate & Maintenance Department Admin',
  },
  'KMP-VOICE-REV-2026': {
    role: 'Authorized Reviewer',
    label: 'Campus Grievance & Feedback Reviewer',
  },
};

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hashUserForPoll(userId: string, pollOrScope: string): string {
  return crypto
    .createHash('sha256')
    .update(`${userId}::${pollOrScope}::kampus_voice`)
    .digest('hex')
    .slice(0, 24);
}

function createSeedDatabase(): StudentVoiceDatabase {
  const categories: VoiceCategoryGroup[] = [
    {
      id: 'cat_academic',
      groupName: 'Academic',
      items: [
        'Teaching Quality',
        'Course Curriculum',
        'Examination Experience',
        'Assignment Workload',
        'Academic Resources',
        'Faculty Feedback',
      ],
    },
    {
      id: 'cat_facilities',
      groupName: 'Campus Facilities',
      items: [
        'Library',
        'Laboratories',
        'Classrooms',
        'Drinking Water',
        'Washrooms',
        'Electricity',
        'Internet Connectivity',
        'Campus Cleanliness',
      ],
    },
    {
      id: 'cat_services',
      groupName: 'Student Services',
      items: [
        'Administrative Support',
        'Student Helpdesk',
        'Scholarships',
        'Admission Support',
        'Document Services',
      ],
    },
    {
      id: 'cat_hostel_transport',
      groupName: 'Hostel & Transport',
      items: [
        'Hostel Facilities',
        'Food Services',
        'Transport',
        'Bus Facilities',
        'Campus Safety',
      ],
    },
    {
      id: 'cat_experience',
      groupName: 'Student Experience',
      items: [
        'Campus Environment',
        'Events and Activities',
        'Clubs and Societies',
        'Accessibility',
        'Student Wellbeing',
      ],
    },
    {
      id: 'cat_suggestions',
      groupName: 'Suggestions',
      items: [
        'New Campus Facilities',
        'Academic Improvements',
        'Technology Improvements',
        'Student Engagement Ideas',
        'General Suggestions',
      ],
    },
  ];

  // Note: No fake student complaints, fake feedback, or fake poll votes are fabricated!
  // Only an open institutional poll framework and sample transparency bulletin are seeded for live participation.
  const polls: VoicePoll[] = [
    {
      id: 'poll_lib_hours',
      title: 'Campus Feedback Campaign: Library & Quiet Study Access Preferences',
      description:
        'Institutional Student Affairs poll to gather genuine student scheduling preferences for late-evening reading rooms.',
      pollType: 'Single-Choice Poll',
      department: 'Central Library Administration',
      options: [
        { id: 'opt_1', label: 'Keep current 11:00 PM closing hours' },
        { id: 'opt_2', label: 'Extend reading room until 2:00 AM during semester weeks' },
        { id: 'opt_3', label: '24-hour quiet reading wing during exam fortnights only' },
      ],
      closingDateISO: addDaysISO(21),
      isAnonymousVoting: true,
      showResultsAfterVoting: true,
      participationRules: 'One vote per enrolled student account. Individual choices remain unattributed.',
      createdByRole: 'Institution Admin',
      createdAt: new Date().toISOString(),
      status: 'Open',
    },
    {
      id: 'poll_wifi_survey',
      title: 'IT & Network Services: Campus Connectivity Quality Rating',
      description:
        'Rate Wi-Fi stability in lecture halls and labs to prioritize maintenance tickets objectively.',
      pollType: 'Rating Survey',
      department: 'IT & Network Services',
      options: [
        { id: 'r_1', label: '1 - Frequent drops' },
        { id: 'r_2', label: '2 - Slow in peak hours' },
        { id: 'r_3', label: '3 - Acceptable' },
        { id: 'r_4', label: '4 - Reliable' },
        { id: 'r_5', label: '5 - Consistently fast' },
      ],
      closingDateISO: addDaysISO(30),
      isAnonymousVoting: false,
      showResultsAfterVoting: true,
      participationRules: 'One submission per student account.',
      createdByRole: 'Department Admin',
      createdAt: new Date().toISOString(),
      status: 'Open',
    },
  ];

  const institutionalUpdates: InstitutionalUpdate[] = [
    {
      id: 'upd_welcome',
      title: 'Student Voice Grievance & Feedback Charter',
      department: 'Student Affairs & Governance Cell',
      summary:
        'All submitted feedback, confidential reports, and campus improvement ideas receive unique reference tracking. Confidential submitter identities are restricted strictly to authorized institutional leadership.',
      actionTaken: 'Role-isolated tracking and attachment verification enabled.',
      status: 'Notice',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    categories,
    submissions: [],
    confidentialIdentities: {},
    ideas: [],
    bookmarkedIdeaIdsByUser: {},
    polls,
    pollResponses: [],
    institutionalUpdates,
    reports: [],
    auditLogs: [],
    files: {},
    roleOverrides: {},
    refCounter: 1001,
  };
}

function loadDb(): StudentVoiceDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (parsed && Array.isArray(parsed.categories)) {
        return {
          categories: parsed.categories || [],
          submissions: parsed.submissions || [],
          confidentialIdentities: parsed.confidentialIdentities || {},
          ideas: parsed.ideas || [],
          bookmarkedIdeaIdsByUser: parsed.bookmarkedIdeaIdsByUser || {},
          polls: parsed.polls || [],
          pollResponses: parsed.pollResponses || [],
          institutionalUpdates: parsed.institutionalUpdates || [],
          reports: parsed.reports || [],
          auditLogs: parsed.auditLogs || [],
          files: parsed.files || {},
          roleOverrides: parsed.roleOverrides || {},
          refCounter: Number(parsed.refCounter) || 1001,
        };
      }
    }
  } catch {
    // rebuild cleanly
  }
  const seeded = createSeedDatabase();
  saveDb(seeded);
  return seeded;
}

function saveDb(db: StudentVoiceDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist Student Voice DB:', err);
  }
}

function validateEvidenceHeader(buffer: Buffer, ext: string): boolean {
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) return false;
  if (ext === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (ext === '.png')
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  if (ext === '.jpg' || ext === '.jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (ext === '.webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  return false;
}

function isPrivilegedRole(role: VoiceRole): boolean {
  return ['Authorized Reviewer', 'Department Admin', 'Institution Admin', 'Platform Admin'].includes(
    role
  );
}

function canUnsealConfidential(role: VoiceRole): boolean {
  return role === 'Platform Admin' || role === 'Institution Admin';
}

function sanitizeSubmissionForViewer(
  sub: VoiceSubmission,
  viewerId: string,
  viewerRole: VoiceRole,
  db: StudentVoiceDatabase
): VoiceSubmission {
  const adminView = isPrivilegedRole(viewerRole);
  const unseal = canUnsealConfidential(viewerRole);
  const isOwner =
    sub.ownerId === viewerId ||
    sub.submitterTokenHash === hashUserForPoll(viewerId, sub.referenceNumber);

  const clone: VoiceSubmission = {
    ...sub,
    // Strip internal admin notes for Students
    internalNotes: adminView ? sub.internalNotes || [] : undefined,
    // Hide real confidential identity from ordinary reviewers, Department Admin, and other users
    confidentialRealName: undefined,
    confidentialRealEmail: undefined,
  };

  if (sub.privacyMode === 'Confidential') {
    if (unseal || isOwner) {
      const secret = db.confidentialIdentities[sub.id];
      if (secret) {
        clone.confidentialRealName = `${secret.name} (${secret.enrollmentNo})`;
        clone.confidentialRealEmail = secret.email;
      }
      clone.confidentialIdentityMasked = false;
    } else {
      clone.ownerId = null;
      clone.visibleAuthorName = 'Confidential Student (Restricted Identity)';
      clone.confidentialIdentityMasked = true;
    }
  } else if (sub.privacyMode === 'Anonymous') {
    clone.ownerId = null;
    clone.visibleAuthorName = 'Anonymous Student';
  }

  return clone;
}

export function registerStudentVoiceBackend(app: Express) {
  const db = loadDb();

  function addAudit(actorRole: VoiceRole, action: string, targetRef: string) {
    db.auditLogs.unshift({
      id: `vaud_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      actorRole,
      action,
      targetRef,
      createdAt: new Date().toISOString(),
    });
    if (db.auditLogs.length > 200) db.auditLogs = db.auditLogs.slice(0, 200);
  }

  // 1. Bootstrap Student Voice Workspace
  app.post('/api/voice/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.body?.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const roleInfo = db.roleOverrides[userId] || { role: 'Student' as VoiceRole, label: null };
    const role = roleInfo.role;

    const mySubmissions = db.submissions
      .filter(
        (s) =>
          s.ownerId === userId ||
          s.submitterTokenHash === hashUserForPoll(userId, s.referenceNumber)
      )
      .map((s) => sanitizeSubmissionForViewer(s, userId, role, db));

    const adminSubmissions = isPrivilegedRole(role)
      ? db.submissions
          .filter((s) => {
            if (s.status === 'Draft') return false;
            if (role === 'Department Admin' && roleInfo.department) {
              return (
                s.department === roleInfo.department ||
                s.assignedDepartment === roleInfo.department
              );
            }
            return true;
          })
          .map((s) => sanitizeSubmissionForViewer(s, userId, role, db))
      : [];

    // Approved public resolutions only (never private complaints!)
    const publicResolutions = db.submissions
      .filter((s) => s.publishedToTransparency && (s.status === 'Resolved' || s.status === 'Closed'))
      .map((s) => ({
        id: s.id,
        referenceNumber: s.referenceNumber,
        title: s.title,
        category: `${s.categoryGroup} · ${s.categoryItem}`,
        department: s.assignedDepartment || s.department,
        status: s.status,
        latestUpdate:
          s.officialResponses[s.officialResponses.length - 1]?.resolutionNotes ||
          s.officialResponses[s.officialResponses.length - 1]?.message ||
          'Resolved by responsible department.',
        resolvedAt: s.resolvedAt || s.updatedAt,
      }));

    // Poll summaries with duplicate check & genuine counts
    const pollsWithStats = db.polls.map((poll) => {
      const responses = db.pollResponses.filter((r) => r.pollId === poll.id);
      const userVoted = responses.some(
        (r) => r.voterId === userId || r.voterHash === hashUserForPoll(userId, poll.id)
      );
      const optionCounts: Record<string, number> = {};
      poll.options.forEach((opt) => {
        optionCounts[opt.id] = 0;
      });
      responses.forEach((r) => {
        r.selectedOptionIds.forEach((oid) => {
          optionCounts[oid] = (optionCounts[oid] || 0) + 1;
        });
      });
      return {
        ...poll,
        totalResponses: responses.length,
        hasVoted: userVoted,
        optionCounts: poll.showResultsAfterVoting && (userVoted || isPrivilegedRole(role))
          ? optionCounts
          : null,
        textResponses:
          isPrivilegedRole(role) && poll.pollType === 'Text Feedback Survey'
            ? responses.map((r) => ({ id: r.id, textAnswer: r.textAnswer, createdAt: r.createdAt }))
            : [],
      };
    });

    // Analytics from real database records (for privileged roles only)
    let analytics: Record<string, unknown> | null = null;
    if (isPrivilegedRole(role)) {
      const nonDraft = db.submissions.filter((s) => s.status !== 'Draft');
      const byCategory: Record<string, number> = {};
      const byDepartment: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let firstRespSumMs = 0;
      let firstRespCount = 0;
      let resolveSumMs = 0;
      let resolveCount = 0;

      nonDraft.forEach((s) => {
        byCategory[s.categoryGroup] = (byCategory[s.categoryGroup] || 0) + 1;
        const dept = s.assignedDepartment || s.department;
        byDepartment[dept] = (byDepartment[dept] || 0) + 1;
        byStatus[s.status] = (byStatus[s.status] || 0) + 1;
        if (s.firstRespondedAt) {
          firstRespSumMs +=
            new Date(s.firstRespondedAt).getTime() - new Date(s.createdAt).getTime();
          firstRespCount += 1;
        }
        if (s.resolvedAt) {
          resolveSumMs += new Date(s.resolvedAt).getTime() - new Date(s.createdAt).getTime();
          resolveCount += 1;
        }
      });

      analytics = {
        totalSubmissions: nonDraft.length,
        pendingReviews: nonDraft.filter((s) =>
          ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Awaiting Student Response'].includes(
            s.status
          )
        ).length,
        inProgressComplaints: nonDraft.filter(
          (s) => s.feedbackType === 'Complaint' && ['Assigned', 'In Progress'].includes(s.status)
        ).length,
        resolvedSubmissions: nonDraft.filter((s) => ['Resolved', 'Closed'].includes(s.status))
          .length,
        byCategory,
        byDepartment,
        byStatus,
        avgFirstResponseHours:
          firstRespCount > 0 ? Number((firstRespSumMs / firstRespCount / 3600000).toFixed(1)) : null,
        avgResolutionHours:
          resolveCount > 0 ? Number((resolveSumMs / resolveCount / 3600000).toFixed(1)) : null,
        totalSurveyResponses: db.pollResponses.length,
      };
    }

    return res.json({
      roleInfo,
      categories: db.categories,
      mySubmissions,
      adminSubmissions,
      publicResolutions,
      ideas: db.ideas,
      bookmarkedIdeaIds: db.bookmarkedIdeaIdsByUser[userId] || [],
      polls: pollsWithStats,
      institutionalUpdates: db.institutionalUpdates,
      reports: isPrivilegedRole(role) ? db.reports : [],
      auditLogs: isPrivilegedRole(role) ? db.auditLogs.slice(0, 40) : [],
      analytics,
    });
  });

  // 2. Role Switcher (Backend RBAC)
  app.post('/api/voice/auth/role-session', (req: Request, res: Response) => {
    const { userId, passkey, revert } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (revert) {
      delete db.roleOverrides[userId];
      saveDb(db);
      return res.json({ ok: true, roleInfo: { role: 'Student', label: null } });
    }
    const matched = VOICE_PASSKEYS[String(passkey || '').trim().toUpperCase()];
    if (!matched) {
      return res.status(403).json({ message: 'Invalid institutional authorization code.' });
    }
    db.roleOverrides[userId] = matched;
    addAudit(matched.role, 'ROLE_SESSION_ACTIVATED', String(userId));
    saveDb(db);
    return res.json({ ok: true, roleInfo: matched });
  });

  // 3. Validated Attachment Upload (PDF/PNG/JPG/WEBP <= 5 MB)
  app.post('/api/voice/upload-attachment', (req: Request, res: Response) => {
    const { userId, fileName, mimeType, base64Data, isPublicIdeaFile } = req.body || {};
    if (!userId || !fileName || !base64Data) {
      return res.status(400).json({ message: 'File payload missing.' });
    }
    const ext = path.extname(String(fileName)).toLowerCase();
    if (!['.pdf', '.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      return res.status(400).json({ message: 'Only PDF, PNG, JPG, and WEBP attachments are allowed.' });
    }
    const clean = String(base64Data).includes(',')
      ? String(base64Data).split(',')[1]
      : String(base64Data);
    const buffer = Buffer.from(clean, 'base64');
    if (!validateEvidenceHeader(buffer, ext)) {
      return res.status(400).json({
        message: 'Invalid or oversized file (must be valid PDF/image and under 5 MB).',
      });
    }
    const id = `vfile_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    db.files[id] = {
      id,
      fileName: String(fileName),
      mimeType: String(mimeType || 'application/octet-stream'),
      sizeBytes: buffer.length,
      base64Data: clean,
      ownerId: String(userId),
      isPublicIdeaFile: Boolean(isPublicIdeaFile),
      createdAt: new Date().toISOString(),
    };
    saveDb(db);
    const att: VoiceAttachment = {
      id,
      fileName: String(fileName),
      mimeType: String(mimeType || 'application/octet-stream'),
      sizeBytes: buffer.length,
      url: `/api/voice/attachments/${id}`,
    };
    return res.status(201).json({ attachment: att });
  });

  app.get('/api/voice/attachments/:id', (req: Request, res: Response) => {
    const f = db.files[req.params.id];
    if (!f) return res.status(404).send('Attachment not found');
    const requester = String(req.query.userId || '');
    const role = db.roleOverrides[requester]?.role || 'Student';
    if (!f.isPublicIdeaFile && f.ownerId !== requester && !isPrivilegedRole(role)) {
      return res.status(403).send('Forbidden: private submission attachment.');
    }
    res.setHeader('Content-Type', f.mimeType || 'application/octet-stream');
    return res.send(Buffer.from(f.base64Data, 'base64'));
  });

  // 4. Create or Update Draft / Submit Feedback or Complaint
  app.post('/api/voice/submissions', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const title = String(b.title || '').trim();
    const description = String(b.description || '').trim();
    const department = String(b.department || '').trim();
    const categoryGroup = String(b.categoryGroup || '').trim();
    const categoryItem = String(b.categoryItem || '').trim();

    if (!userId || !title || !description || !department || !categoryGroup || !categoryItem) {
      return res.status(400).json({
        message: 'Title, category, department, and description are required.',
      });
    }

    const privacyMode: PrivacyMode = ['Identified', 'Confidential', 'Anonymous'].includes(
      b.privacyMode
    )
      ? b.privacyMode
      : 'Identified';
    const isDraft = Boolean(b.saveAsDraft);
    const now = new Date().toISOString();
    const refNumber = `SV-2026-${db.refCounter++}`;
    const subId = `vsub_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

    const sub: VoiceSubmission = {
      id: subId,
      referenceNumber: refNumber,
      ownerId: privacyMode === 'Anonymous' ? null : userId,
      submitterTokenHash: hashUserForPoll(userId, refNumber),
      visibleAuthorName:
        privacyMode === 'Anonymous'
          ? 'Anonymous Student'
          : privacyMode === 'Confidential'
          ? 'Confidential Student (Restricted Identity)'
          : String(b.studentName || 'Student'),
      title,
      feedbackType: b.feedbackType || 'General Feedback',
      categoryGroup,
      categoryItem,
      department,
      description,
      location: String(b.location || '').trim(),
      incidentDateISO: b.incidentDateISO || undefined,
      desiredOutcome: String(b.desiredOutcome || '').trim(),
      privacyMode,
      status: isDraft ? 'Draft' : 'Submitted',
      priority: 'Normal', // Never auto-mark every complaint urgent
      assignedDepartment: department,
      escalated: false,
      publishedToTransparency: false,
      attachments: Array.isArray(b.attachments) ? b.attachments : [],
      timeline: isDraft
        ? []
        : [
            {
              id: `tl_${Date.now()}`,
              label: 'Submission Received',
              actorLabel:
                privacyMode === 'Anonymous'
                  ? 'Anonymous Student'
                  : privacyMode === 'Confidential'
                  ? 'Confidential Student'
                  : String(b.studentName || 'Student'),
              message: `Reference ${refNumber} logged with ${privacyMode} privacy mode.`,
              createdAt: now,
            },
          ],
      officialResponses: [],
      studentFollowUps: [],
      internalNotes: [],
      createdAt: now,
      updatedAt: now,
    };

    if (privacyMode === 'Confidential') {
      db.confidentialIdentities[subId] = {
        submissionId: subId,
        ownerId: userId,
        name: String(b.studentName || 'Student'),
        email: String(b.studentEmail || ''),
        enrollmentNo: String(b.enrollmentNo || ''),
      };
    }

    db.submissions.unshift(sub);
    saveDb(db);
    return res.status(201).json({
      submission: sanitizeSubmissionForViewer(sub, userId, 'Student', db),
    });
  });

  app.patch('/api/voice/submissions/:id', (req: Request, res: Response) => {
    const sub = db.submissions.find((s) => s.id === req.params.id);
    if (!sub) return res.status(404).json({ message: 'Submission not found.' });
    const b = req.body || {};
    const userId = String(b.userId || '');
    const isOwner =
      sub.ownerId === userId ||
      sub.submitterTokenHash === hashUserForPoll(userId, sub.referenceNumber);
    if (!isOwner) {
      return res.status(403).json({ message: 'Only the submitter can edit or manage this draft/request.' });
    }

    const now = new Date().toISOString();

    if (sub.status === 'Draft') {
      if (b.title) sub.title = String(b.title).trim();
      if (b.description) sub.description = String(b.description).trim();
      if (b.location !== undefined) sub.location = String(b.location).trim();
      if (b.desiredOutcome !== undefined) sub.desiredOutcome = String(b.desiredOutcome).trim();
      if (b.department) sub.department = String(b.department);
      if (b.categoryGroup) sub.categoryGroup = String(b.categoryGroup);
      if (b.categoryItem) sub.categoryItem = String(b.categoryItem);
      if (b.submitNow) {
        sub.status = 'Submitted';
        sub.timeline.push({
          id: `tl_${Date.now()}`,
          label: 'Submission Received',
          actorLabel: sub.visibleAuthorName,
          message: `Draft submitted as ${sub.referenceNumber}.`,
          createdAt: now,
        });
      }
    } else if (b.action === 'close' && sub.status === 'Resolved') {
      sub.status = 'Closed';
      sub.timeline.push({
        id: `tl_${Date.now()}`,
        label: 'Closed by Student',
        actorLabel: sub.visibleAuthorName,
        message: 'Student confirmed resolution and closed request.',
        createdAt: now,
      });
    } else if (b.action === 'reopen' && sub.status === 'Resolved') {
      sub.status = 'Submitted';
      sub.timeline.push({
        id: `tl_${Date.now()}`,
        label: 'Reopened by Student',
        actorLabel: sub.visibleAuthorName,
        message: String(b.message || 'Student requested further follow-up.'),
        createdAt: now,
      });
    } else if (
      b.action === 'withdraw' &&
      ['Submitted', 'Under Review', 'Assigned', 'Awaiting Student Response'].includes(sub.status)
    ) {
      sub.status = 'Closed';
      sub.timeline.push({
        id: `tl_${Date.now()}`,
        label: 'Withdrawn by Student',
        actorLabel: sub.visibleAuthorName,
        message: 'Student withdrew submission.',
        createdAt: now,
      });
    } else if (b.action === 'followup' && String(b.message || '').trim()) {
      const msg = String(b.message).trim();
      sub.studentFollowUps.push({
        id: `fu_${Date.now()}`,
        message: msg,
        createdAt: now,
      });
      if (sub.status === 'Awaiting Student Response') sub.status = 'In Progress';
      sub.timeline.push({
        id: `tl_${Date.now()}`,
        label: 'Student Follow-Up Added',
        actorLabel: sub.visibleAuthorName,
        message: msg,
        createdAt: now,
      });
    } else {
      return res.status(400).json({ message: 'Action not allowed in current status.' });
    }

    sub.updatedAt = now;
    saveDb(db);
    return res.json({
      submission: sanitizeSubmissionForViewer(sub, userId, 'Student', db),
    });
  });

  // 5. Suggestion & Ideas Hub
  app.post('/api/voice/ideas', (req: Request, res: Response) => {
    const b = req.body || {};
    if (!b.userId || !String(b.title || '').trim() || !String(b.description || '').trim()) {
      return res.status(400).json({ message: 'Idea title and description are required.' });
    }
    const now = new Date().toISOString();
    const idea: VoiceIdea = {
      id: `idea_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      ownerId: String(b.userId),
      authorName: String(b.authorName || 'Student'),
      title: String(b.title).trim(),
      description: String(b.description).trim(),
      category: String(b.category || 'General Suggestions'),
      expectedBenefits: String(b.expectedBenefits || '').trim(),
      attachments: Array.isArray(b.attachments) ? b.attachments : [],
      status: 'Under Review',
      supporterIds: [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    };
    db.ideas.unshift(idea);
    saveDb(db);
    return res.status(201).json({ idea });
  });

  app.post('/api/voice/ideas/:id/support', (req: Request, res: Response) => {
    const idea = db.ideas.find((i) => i.id === req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found.' });
    const userId = String(req.body?.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId required.' });
    idea.supporterIds = idea.supporterIds.includes(userId)
      ? idea.supporterIds.filter((x) => x !== userId)
      : [...idea.supporterIds, userId];
    idea.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ idea });
  });

  app.post('/api/voice/ideas/:id/bookmark', (req: Request, res: Response) => {
    const userId = String(req.body?.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId required.' });
    const cur = db.bookmarkedIdeaIdsByUser[userId] || [];
    db.bookmarkedIdeaIdsByUser[userId] = cur.includes(req.params.id)
      ? cur.filter((x) => x !== req.params.id)
      : [req.params.id, ...cur];
    saveDb(db);
    return res.json({ bookmarkedIdeaIds: db.bookmarkedIdeaIdsByUser[userId] });
  });

  app.post('/api/voice/ideas/:id/comments', (req: Request, res: Response) => {
    const idea = db.ideas.find((i) => i.id === req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found.' });
    const { userId, authorName, content } = req.body || {};
    if (!userId || !String(content || '').trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }
    idea.comments.push({
      id: `icmt_${Date.now()}`,
      authorId: String(userId),
      authorName: String(authorName || 'Student'),
      content: String(content).trim(),
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    return res.status(201).json({ idea });
  });

  // 6. Polls & Surveys Voting
  app.post('/api/voice/polls/:id/respond', (req: Request, res: Response) => {
    const poll = db.polls.find((p) => p.id === req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });
    if (poll.status !== 'Open') return res.status(400).json({ message: 'This poll is closed.' });

    const { userId, selectedOptionIds, ratingValue, textAnswer } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    const voterHash = hashUserForPoll(String(userId), poll.id);
    const already = db.pollResponses.some(
      (r) => r.pollId === poll.id && (r.voterHash === voterHash || r.voterId === userId)
    );
    if (already) {
      return res.status(400).json({ message: 'Duplicate submission prevented: you already responded.' });
    }

    const opts = Array.isArray(selectedOptionIds) ? selectedOptionIds.map(String) : [];
    if (poll.pollType === 'Text Feedback Survey' && !String(textAnswer || '').trim()) {
      return res.status(400).json({ message: 'Please enter a response.' });
    }
    if (poll.pollType !== 'Text Feedback Survey' && opts.length === 0) {
      return res.status(400).json({ message: 'Please select an option.' });
    }

    db.pollResponses.push({
      id: `presp_${Date.now()}`,
      pollId: poll.id,
      voterId: poll.isAnonymousVoting ? null : String(userId),
      voterHash,
      selectedOptionIds: opts,
      ratingValue: ratingValue ? Number(ratingValue) : undefined,
      textAnswer: textAnswer ? String(textAnswer).trim() : undefined,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);
    return res.status(201).json({ ok: true });
  });

  // 7. Abuse Reporting
  app.post('/api/voice/reports', (req: Request, res: Response) => {
    const { userId, targetType, targetId, targetTitle, reason, details } = req.body || {};
    if (!userId || !targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'Missing safety report fields.' });
    }
    const rp: VoiceAbuseReport = {
      id: `vrp_${Date.now()}`,
      reporterId: String(userId),
      targetType,
      targetId: String(targetId),
      targetTitle: String(targetTitle || 'Submission'),
      reason: String(reason),
      details: String(details || ''),
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(rp);
    saveDb(db);
    return res.status(201).json({ report: rp });
  });

  // 8. Admin / Authorized Reviewer Routes (Backend RBAC Strictly Enforced)
  app.patch('/api/voice/admin/submissions/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '');
    const roleInfo = db.roleOverrides[userId];
    const role: VoiceRole = roleInfo?.role || 'Student';
    if (!isPrivilegedRole(role)) {
      return res.status(403).json({
        message: 'Forbidden: Authorized Reviewer or Institutional Admin privileges required.',
      });
    }

    const sub = db.submissions.find((s) => s.id === req.params.id);
    if (!sub) return res.status(404).json({ message: 'Submission not found.' });
    if (sub.status === 'Draft') {
      return res.status(400).json({ message: 'Cannot modify unsubmitted student drafts.' });
    }

    const now = new Date().toISOString();

    if (b.assignedDepartment) {
      sub.assignedDepartment = String(b.assignedDepartment);
      if (sub.status === 'Submitted' || sub.status === 'Under Review') {
        sub.status = 'Assigned';
      }
      sub.timeline.push({
        id: `tl_${Date.now()}_d`,
        label: 'Department Assigned',
        actorLabel: roleInfo?.label || role,
        message: `Assigned to ${sub.assignedDepartment}.`,
        createdAt: now,
      });
      addAudit(role, `ASSIGNED_DEPT:${sub.assignedDepartment}`, sub.referenceNumber);
    }

    if (b.assignedReviewer !== undefined) {
      sub.assignedReviewer = String(b.assignedReviewer);
    }

    if (b.priority && ['Low', 'Normal', 'High', 'Urgent'].includes(b.priority)) {
      sub.priority = b.priority as PriorityLevel;
      addAudit(role, `SET_PRIORITY:${sub.priority}`, sub.referenceNumber);
    }

    if (typeof b.escalated === 'boolean' && b.escalated !== sub.escalated) {
      sub.escalated = b.escalated;
      if (b.escalated) {
        sub.timeline.push({
          id: `tl_${Date.now()}_e`,
          label: 'Escalated for Priority Review',
          actorLabel: roleInfo?.label || role,
          message: 'Marked as escalated for timely institutional attention.',
          createdAt: now,
        });
      }
      addAudit(role, `ESCALATED:${b.escalated}`, sub.referenceNumber);
    }

    if (b.status && ['Under Review', 'Assigned', 'In Progress', 'Awaiting Student Response', 'Resolved', 'Closed', 'Rejected'].includes(b.status)) {
      const nextStatus = b.status as SubmissionStatus;
      if (nextStatus !== sub.status) {
        sub.status = nextStatus;
        if (!sub.firstRespondedAt) sub.firstRespondedAt = now;
        if ((nextStatus === 'Resolved' || nextStatus === 'Closed') && !sub.resolvedAt) {
          sub.resolvedAt = now;
        }
        sub.timeline.push({
          id: `tl_${Date.now()}_s`,
          label: `Status: ${nextStatus}`,
          actorLabel: roleInfo?.label || role,
          message: String(b.statusNote || `Updated status to ${nextStatus}.`),
          createdAt: now,
        });
        addAudit(role, `STATUS:${nextStatus}`, sub.referenceNumber);
      }
    }

    if (String(b.officialMessage || '').trim()) {
      const msg = String(b.officialMessage).trim();
      if (!sub.firstRespondedAt) sub.firstRespondedAt = now;
      sub.officialResponses.push({
        id: `oresp_${Date.now()}`,
        department: sub.assignedDepartment || sub.department,
        responderRole: roleInfo?.label || role,
        message: msg,
        resolutionNotes: b.resolutionNotes ? String(b.resolutionNotes).trim() : undefined,
        createdAt: now,
      });
      sub.timeline.push({
        id: `tl_${Date.now()}_r`,
        label: 'Official Response Provided',
        actorLabel: sub.assignedDepartment || sub.department,
        message: msg,
        createdAt: now,
      });
      addAudit(role, 'OFFICIAL_RESPONSE', sub.referenceNumber);
    }

    if (String(b.internalNote || '').trim()) {
      sub.internalNotes = sub.internalNotes || [];
      sub.internalNotes.unshift({
        id: `inote_${Date.now()}`,
        authorLabel: roleInfo?.label || role,
        note: String(b.internalNote).trim(),
        createdAt: now,
      });
      addAudit(role, 'INTERNAL_NOTE_ADDED', sub.referenceNumber);
    }

    if (typeof b.publishedToTransparency === 'boolean') {
      sub.publishedToTransparency = b.publishedToTransparency;
    }

    sub.updatedAt = now;
    saveDb(db);
    return res.json({
      submission: sanitizeSubmissionForViewer(sub, userId, role, db),
    });
  });

  app.patch('/api/voice/admin/ideas/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!isPrivilegedRole(role)) {
      return res.status(403).json({ message: 'Forbidden: Admin/Reviewer access required.' });
    }
    const idea = db.ideas.find((i) => i.id === req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found.' });
    if (['Under Review', 'Accepted', 'Planned', 'Implemented', 'Not Approved'].includes(b.status)) {
      idea.status = b.status as IdeaStatus;
      idea.updatedAt = new Date().toISOString();
      addAudit(role, `IDEA_STATUS:${idea.status}`, idea.title);
      saveDb(db);
    }
    return res.json({ idea });
  });

  app.post('/api/voice/admin/polls', (req: Request, res: Response) => {
    const b = req.body || {};
    const roleInfo = db.roleOverrides[String(b.userId || '')];
    const role = roleInfo?.role || 'Student';
    if (!isPrivilegedRole(role)) {
      return res.status(403).json({ message: 'Forbidden: Only authorized admins can launch polls.' });
    }
    if (!String(b.title || '').trim()) {
      return res.status(400).json({ message: 'Poll question/title is required.' });
    }
    const opts = Array.isArray(b.options)
      ? b.options
          .map((lbl: string, i: number) => ({ id: `opt_${Date.now()}_${i}`, label: String(lbl).trim() }))
          .filter((o: { label: string }) => o.label)
      : [];
    const poll: VoicePoll = {
      id: `poll_${Date.now()}`,
      title: String(b.title).trim(),
      description: String(b.description || '').trim(),
      pollType: b.pollType || 'Single-Choice Poll',
      department: String(b.department || 'Student Affairs & Dean Office'),
      options: opts,
      closingDateISO: String(b.closingDateISO || addDaysISO(14)),
      isAnonymousVoting: Boolean(b.isAnonymousVoting),
      showResultsAfterVoting: b.showResultsAfterVoting !== false,
      participationRules: String(b.participationRules || 'One response per student account.'),
      createdByRole: roleInfo?.label || role,
      createdAt: new Date().toISOString(),
      status: 'Open',
    };
    db.polls.unshift(poll);
    addAudit(role, 'POLL_CREATED', poll.title);
    saveDb(db);
    return res.status(201).json({ poll });
  });

  app.post('/api/voice/admin/categories', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (role !== 'Platform Admin' && role !== 'Institution Admin') {
      return res.status(403).json({ message: 'Forbidden: Institution or Platform Admin required.' });
    }
    const groupName = String(b.groupName || '').trim();
    const itemName = String(b.itemName || '').trim();
    if (!groupName || !itemName) {
      return res.status(400).json({ message: 'Category group and subcategory name are required.' });
    }
    let grp = db.categories.find((c) => c.groupName.toLowerCase() === groupName.toLowerCase());
    if (!grp) {
      grp = { id: `cat_${Date.now()}`, groupName, items: [itemName] };
      db.categories.push(grp);
    } else if (!grp.items.includes(itemName)) {
      grp.items.push(itemName);
    }
    addAudit(role, 'CATEGORY_CONFIGURED', `${groupName}/${itemName}`);
    saveDb(db);
    return res.status(201).json({ categories: db.categories });
  });

  app.post('/api/voice/admin/updates', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!isPrivilegedRole(role)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    if (!String(b.title || '').trim() || !String(b.summary || '').trim()) {
      return res.status(400).json({ message: 'Title and summary required.' });
    }
    const upd: InstitutionalUpdate = {
      id: `upd_${Date.now()}`,
      title: String(b.title).trim(),
      department: String(b.department || 'Campus Administration'),
      summary: String(b.summary).trim(),
      actionTaken: String(b.actionTaken || 'In progress'),
      status: b.status || 'Active Initiative',
      completionDateISO: b.completionDateISO || undefined,
      createdAt: new Date().toISOString(),
    };
    db.institutionalUpdates.unshift(upd);
    addAudit(role, 'UPDATE_PUBLISHED', upd.title);
    saveDb(db);
    return res.status(201).json({ update: upd });
  });

  app.patch('/api/voice/admin/reports/:id', (req: Request, res: Response) => {
    const b = req.body || {};
    const role = db.roleOverrides[String(b.userId || '')]?.role || 'Student';
    if (!isPrivilegedRole(role)) {
      return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    const rp = db.reports.find((r) => r.id === req.params.id);
    if (!rp) return res.status(404).json({ message: 'Report not found.' });
    rp.status = 'Reviewed';
    addAudit(role, 'ABUSE_REPORT_REVIEWED', rp.targetTitle);
    saveDb(db);
    return res.json({ report: rp });
  });
}
