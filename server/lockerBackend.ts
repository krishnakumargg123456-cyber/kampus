import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import type {
  LockerActivityAction,
  LockerActivityEntry,
  LockerAdmissionChecklistLink,
  LockerCategory,
  LockerCrossModuleData,
  LockerDocument,
  LockerFileFormat,
  LockerFolder,
  LockerReminder,
  LockerStorageSummary,
} from '../src/types/locker.ts';

interface LockerDatabase {
  documents: LockerDocument[];
  folders: LockerFolder[];
  reminders: LockerReminder[];
  activity: LockerActivityEntry[];
  recentSearchesByUser: Record<string, string[]>;
  admissionDocAttachments: Record<string, string[]>; // admissionId -> docIds[]
}

const DB_PATH = path.join(process.cwd(), '.kampus_locker_db.json');
const VAULT_DIR = path.join(process.cwd(), '.kampus_locker_vault');
const VAULT_KEY_PATH = path.join(VAULT_DIR, '.vault_key');

const KAMPUS_ID_DB_PATH = path.join(process.cwd(), '.kampus_kampus_id_db.json');
const CAREER_DB_PATH = path.join(process.cwd(), '.kampus_career_db.json');
const COLLEGE_DB_PATH = path.join(process.cwd(), '.kampus_college_explorer_db.json');

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const QUOTA_BYTES = 100 * 1024 * 1024; // 100 MB

const MIME_BY_EXT: Record<string, { format: LockerFileFormat; mime: string }> = {
  '.pdf': { format: 'PDF', mime: 'application/pdf' },
  '.jpg': { format: 'JPG', mime: 'image/jpeg' },
  '.jpeg': { format: 'JPEG', mime: 'image/jpeg' },
  '.png': { format: 'PNG', mime: 'image/png' },
  '.doc': { format: 'DOC', mime: 'application/msword' },
  '.docx': {
    format: 'DOCX',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  '.ppt': { format: 'PPT', mime: 'application/vnd.ms-powerpoint' },
  '.pptx': {
    format: 'PPTX',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
};

function ensureVaultKey(): Buffer {
  if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true });
  }
  if (fs.existsSync(VAULT_KEY_PATH)) {
    const hex = fs.readFileSync(VAULT_KEY_PATH, 'utf8').trim();
    if (/^[a-f0-9]{64}$/i.test(hex)) {
      return Buffer.from(hex, 'hex');
    }
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(VAULT_KEY_PATH, key.toString('hex'), { mode: 0o600 });
  return key;
}

function encryptAndStoreFile(docId: string, plainBuffer: Buffer): void {
  const key = ensureVaultKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, encrypted]);
  fs.writeFileSync(path.join(VAULT_DIR, `${docId}.enc`), payload, { mode: 0o600 });
}

function readDecryptedFile(docId: string): Buffer | null {
  const filePath = path.join(VAULT_DIR, `${docId}.enc`);
  if (!fs.existsSync(filePath)) return null;
  const payload = fs.readFileSync(filePath);
  if (payload.length < 28) return null;
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const key = ensureVaultKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

function removeVaultFile(docId: string): void {
  const filePath = path.join(VAULT_DIR, `${docId}.enc`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function validateDocumentMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length === 0 || buffer.length > MAX_FILE_BYTES) return false;
  if (ext === '.pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  if (ext === '.png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8;
  }
  if (ext === '.docx' || ext === '.pptx') {
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }
  if (ext === '.doc' || ext === '.ppt') {
    // Allow standard OLE2 compound binary header D0 CF 11 E0 OR plain RTF/ASCII doc streams starting cleanly
    const isOle =
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0;
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
    const isRtf = buffer.subarray(0, 5).toString('ascii') === '{\\rtf';
    return isOle || isZip || isRtf;
  }
  return false;
}

function stripXml(xml: string): string {
  return xml
    .replace(/<w:p[^>]*>/g, '\n')
    .replace(/<a:p[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractSearchableText(buffer: Buffer, ext: string): Promise<string | undefined> {
  try {
    if (ext === '.docx') {
      const zip = await JSZip.loadAsync(buffer);
      const xml = await zip.file('word/document.xml')?.async('string');
      return xml ? stripXml(xml).slice(0, 15000) : undefined;
    }
    if (ext === '.pptx') {
      const zip = await JSZip.loadAsync(buffer);
      const slideNames = Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
        .sort();
      const parts: string[] = [];
      for (const s of slideNames.slice(0, 20)) {
        const xml = await zip.file(s)?.async('string');
        if (xml) parts.push(stripXml(xml));
      }
      const joined = parts.join(' ').trim();
      return joined ? joined.slice(0, 15000) : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function loadDb(): LockerDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw) as LockerDatabase;
      return {
        documents: parsed.documents || [],
        folders: parsed.folders || [],
        reminders: parsed.reminders || [],
        activity: parsed.activity || [],
        recentSearchesByUser: parsed.recentSearchesByUser || {},
        admissionDocAttachments: parsed.admissionDocAttachments || {},
      };
    }
  } catch {
    // rebuild clean empty vault state
  }
  return {
    documents: [],
    folders: [],
    reminders: [],
    activity: [],
    recentSearchesByUser: {},
    admissionDocAttachments: {},
  };
}

function saveDb(db: LockerDatabase): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function recordActivity(
  db: LockerDatabase,
  ownerId: string,
  action: LockerActivityAction,
  targetType: LockerActivityEntry['targetType'],
  targetId: string,
  targetName: string,
  details: string
): void {
  db.activity.unshift({
    id: `lac_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ownerId,
    action,
    targetType,
    targetId,
    targetName,
    details,
    createdAt: new Date().toISOString(),
  });
  db.activity = db.activity.slice(0, 250);
}

function computeStorageForUser(db: LockerDatabase, userId: string): LockerStorageSummary {
  const userDocs = db.documents.filter((d) => d.ownerId === userId);
  const usedBytes = userDocs.reduce((acc, d) => acc + (d.sizeBytes || 0), 0);
  const userFolders = db.folders.filter((f) => f.ownerId === userId);
  return {
    quotaBytes: QUOTA_BYTES,
    usedBytes,
    availableBytes: Math.max(0, QUOTA_BYTES - usedBytes),
    totalDocuments: userDocs.length,
    totalFolders: userFolders.length,
    encryptionCipher: 'AES-256-GCM (Private Vault)',
  };
}

function readCrossModuleData(db: LockerDatabase, userId: string): LockerCrossModuleData {
  let kampusId: LockerCrossModuleData['kampusId'] = {
    kampusIdNumber: null,
    isVerified: false,
    achievements: [],
  };
  let careerResumes: LockerCrossModuleData['careerResumes'] = [];
  let admissions: LockerAdmissionChecklistLink[] = [];

  try {
    if (fs.existsSync(KAMPUS_ID_DB_PATH)) {
      const kdb = JSON.parse(fs.readFileSync(KAMPUS_ID_DB_PATH, 'utf8'));
      const rec = Array.isArray(kdb.identities)
        ? kdb.identities.find((i: { userId?: string }) => i.userId === userId)
        : null;
      if (rec) {
        kampusId = {
          kampusIdNumber: rec.kampusIdNumber || null,
          isVerified: rec.verificationStatus === 'Verified',
          achievements: Array.isArray(rec.achievements)
            ? rec.achievements.map((a: { title?: string }) => a.title || '').filter(Boolean)
            : [],
        };
      }
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(CAREER_DB_PATH)) {
      const cdb = JSON.parse(fs.readFileSync(CAREER_DB_PATH, 'utf8'));
      const resumes = Array.isArray(cdb.resumes)
        ? cdb.resumes.filter((r: { userId?: string }) => r.userId === userId)
        : [];
      careerResumes = resumes.map(
        (r: { id: string; title: string; targetRole: string; updatedAt: string; pdfUrl?: string }) => ({
          id: r.id,
          title: r.title,
          targetRole: r.targetRole || 'Career Resume',
          updatedAt: r.updatedAt,
          pdfUrl: r.pdfUrl,
        })
      );
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(COLLEGE_DB_PATH)) {
      const cedb = JSON.parse(fs.readFileSync(COLLEGE_DB_PATH, 'utf8'));
      const userAdms = Array.isArray(cedb.admissions)
        ? cedb.admissions.filter((a: { userId?: string }) => a.userId === userId)
        : [];
      admissions = userAdms.map(
        (a: {
          id: string;
          collegeName: string;
          courseName: string;
          status: string;
          deadlineISO?: string;
        }) => ({
          admissionId: a.id,
          collegeName: a.collegeName,
          courseName: a.courseName,
          status: a.status,
          deadlineISO: a.deadlineISO,
          attachedDocumentIds: db.admissionDocAttachments[a.id] || [],
        })
      );
    }
  } catch {
    // ignore
  }

  return { kampusId, careerResumes, admissions };
}

function canUserAccessDoc(
  doc: LockerDocument,
  userId: string,
  requiredPermission: 'view' | 'download' = 'view'
): boolean {
  if (!userId) return false;
  if (doc.ownerId === userId) return true;
  const now = Date.now();
  const share = doc.userShares.find(
    (s) =>
      s.targetUserId === userId &&
      !s.revoked &&
      (!s.expiresAt || new Date(s.expiresAt).getTime() > now)
  );
  if (!share) return false;
  if (requiredPermission === 'download' && share.permission !== 'download') return false;
  return true;
}

export function registerLockerBackend(app: Express): void {
  const db = loadDb();

  // 1. Bootstrap (Private to authenticated userId + items actively shared with userId)
  app.post('/api/locker/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.body?.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'Authenticated userId is required.' });

    const now = Date.now();
    const myDocuments = db.documents.filter((d) => d.ownerId === userId);
    const sharedWithMe = db.documents
      .filter(
        (d) =>
          d.ownerId !== userId &&
          d.userShares.some(
            (s) =>
              s.targetUserId === userId &&
              !s.revoked &&
              (!s.expiresAt || new Date(s.expiresAt).getTime() > now)
          )
      )
      .map((d) => ({
        ...d,
        // Never leak other user's share lists or tokens to a recipient
        userShares: d.userShares.filter((s) => s.targetUserId === userId),
        shareLinks: [],
      }));

    return res.json({
      documents: myDocuments,
      sharedWithMe,
      folders: db.folders.filter((f) => f.ownerId === userId),
      reminders: db.reminders.filter((r) => r.ownerId === userId),
      activity: db.activity.filter((a) => a.ownerId === userId).slice(0, 80),
      recentSearches: db.recentSearchesByUser[userId] || [],
      storage: computeStorageForUser(db, userId),
      crossModule: readCrossModuleData(db, userId),
    });
  });

  // 2. Upload Private Encrypted Document
  app.post('/api/locker/documents', async (req: Request, res: Response) => {
    try {
      const b = req.body || {};
      const ownerId = String(b.ownerId || '').trim();
      const ownerName = String(b.ownerName || 'Student').trim();
      const fileName = String(b.fileName || '').trim();
      const base64Data = String(b.base64Data || '').trim();

      if (!ownerId || !fileName || !base64Data) {
        return res.status(400).json({ message: 'ownerId, fileName, and file content are required.' });
      }

      const ext = path.extname(fileName).toLowerCase();
      const formatInfo = MIME_BY_EXT[ext];
      if (!formatInfo) {
        return res.status(400).json({
          message: `Unsupported format "${ext}". Supported formats: PDF, JPG, JPEG, PNG, DOC, DOCX, PPT, PPTX.`,
        });
      }

      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');

      if (!validateDocumentMagicBytes(buffer, ext)) {
        return res.status(400).json({
          message: `Invalid or corrupted ${formatInfo.format} file signature. Upload rejected.`,
        });
      }

      const storage = computeStorageForUser(db, ownerId);
      if (storage.usedBytes + buffer.length > QUOTA_BYTES) {
        return res.status(400).json({
          message: 'Storage quota exceeded (100 MB limit). Remove unused documents before uploading.',
        });
      }

      // If uploading into folderId, ensure folder belongs to ownerId
      const folderId = b.folderId ? String(b.folderId) : null;
      if (folderId) {
        const folder = db.folders.find((f) => f.id === folderId && f.ownerId === ownerId);
        if (!folder) {
          return res.status(403).json({ message: '403 Forbidden: Target folder not accessible.' });
        }
      }

      const docId = `ldc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const sha256Checksum = crypto.createHash('sha256').update(buffer).digest('hex');

      encryptAndStoreFile(docId, buffer);

      const searchableText =
        b.allowContentIndexing === true ? await extractSearchableText(buffer, ext) : undefined;

      const now = new Date().toISOString();
      const title = String(b.title || fileName.replace(/\.[^.]+$/, '')).trim();
      const doc: LockerDocument = {
        id: docId,
        ownerId,
        ownerName,
        title,
        fileName,
        format: formatInfo.format,
        mimeType: formatInfo.mime,
        sizeBytes: buffer.length,
        sha256Checksum,
        encryptedAtRest: true,
        category: (b.category as LockerCategory) || 'Academic Records',
        subtype: String(b.subtype || 'General'),
        folderId,
        description: String(b.description || '').trim(),
        tags: Array.isArray(b.tags)
          ? b.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
          : [],
        academicYear: b.academicYear ? String(b.academicYear).trim() : undefined,
        semester: b.semester ? String(b.semester).trim() : undefined,
        college: b.college ? String(b.college).trim() : undefined,
        isImportant: Boolean(b.isImportant),
        searchableText,
        userShares: [],
        shareLinks: [],
        createdAt: now,
        updatedAt: now,
        lastAccessedAt: now,
      };

      db.documents.unshift(doc);
      recordActivity(
        db,
        ownerId,
        'Uploaded',
        'document',
        doc.id,
        doc.title,
        `${doc.format} (${buffer.length} bytes) encrypted at rest in ${doc.category}`
      );
      saveDb(db);

      return res.status(201).json({
        document: doc,
        storage: computeStorageForUser(db, ownerId),
        activity: db.activity.filter((a) => a.ownerId === ownerId).slice(0, 80),
      });
    } catch (err) {
      return res.status(500).json({
        message: err instanceof Error ? err.message : 'Failed to store document in encrypted vault.',
      });
    }
  });

  // 3. Authenticated Private Binary Content Stream (Preview / Download)
  app.get('/api/locker/documents/:id/content', (req: Request, res: Response) => {
    const doc = db.documents.find((d) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const userId = String(req.query.userId || req.header('x-kampus-user-id') || '').trim();
    const isDownload = req.query.download === '1';

    if (!canUserAccessDoc(doc, userId, isDownload ? 'download' : 'view')) {
      return res.status(403).json({
        message: '403 Forbidden: Private document access requires owner or active share authorization.',
      });
    }

    const plain = readDecryptedFile(doc.id);
    if (!plain) {
      return res.status(404).json({ message: 'Encrypted file payload not found in vault.' });
    }

    doc.lastAccessedAt = new Date().toISOString();
    recordActivity(
      db,
      doc.ownerId,
      isDownload ? 'Downloaded' : 'Viewed',
      'document',
      doc.id,
      doc.title,
      `${isDownload ? 'Downloaded' : 'Previewed'} by ${userId === doc.ownerId ? 'owner' : userId}`
    );
    saveDb(db);

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader(
      'Content-Disposition',
      `${isDownload ? 'attachment' : 'inline'}; filename="${doc.fileName.replace(/"/g, '')}"`
    );
    return res.send(plain);
  });

  // 4. Update Metadata, Rename, Move Folder, Toggle Important (Owner Only)
  app.patch('/api/locker/documents/:id', (req: Request, res: Response) => {
    const doc = db.documents.find((d) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || doc.ownerId !== userId) {
      return res.status(403).json({ message: '403 Forbidden: Only the document owner may modify it.' });
    }

    const prevTitle = doc.title;
    const prevFolderId = doc.folderId;

    if (typeof b.title === 'string' && b.title.trim()) doc.title = b.title.trim();
    if (typeof b.description === 'string') doc.description = b.description.trim();
    if (typeof b.category === 'string') doc.category = b.category as LockerCategory;
    if (typeof b.subtype === 'string') doc.subtype = b.subtype;
    if (Array.isArray(b.tags)) {
      doc.tags = b.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
    }
    if (typeof b.isImportant === 'boolean') doc.isImportant = b.isImportant;
    if (b.folderId !== undefined) {
      if (b.folderId === null || b.folderId === '') {
        doc.folderId = null;
      } else {
        const folder = db.folders.find((f) => f.id === b.folderId && f.ownerId === userId);
        if (!folder) return res.status(403).json({ message: '403 Forbidden: Invalid destination folder.' });
        doc.folderId = folder.id;
      }
    }
    if (typeof b.academicYear === 'string') doc.academicYear = b.academicYear.trim();
    if (typeof b.semester === 'string') doc.semester = b.semester.trim();
    if (typeof b.college === 'string') doc.college = b.college.trim();

    doc.updatedAt = new Date().toISOString();

    let action: LockerActivityAction = 'Updated';
    let detail = 'Updated document details';
    if (prevTitle !== doc.title) {
      action = 'Renamed';
      detail = `Renamed from "${prevTitle}" to "${doc.title}"`;
    } else if (prevFolderId !== doc.folderId) {
      action = 'Moved';
      const destName = doc.folderId
        ? db.folders.find((f) => f.id === doc.folderId)?.name || 'Folder'
        : 'Root Vault';
      detail = `Moved to ${destName}`;
    }

    recordActivity(db, userId, action, 'document', doc.id, doc.title, detail);
    saveDb(db);

    return res.json({
      document: doc,
      activity: db.activity.filter((a) => a.ownerId === userId).slice(0, 80),
    });
  });

  // 5. Secure Document Deletion (Owner Only — removes encrypted disk file + DB record + admission links)
  app.delete('/api/locker/documents/:id', (req: Request, res: Response) => {
    const idx = db.documents.findIndex((d) => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Document not found.' });

    const doc = db.documents[idx];
    const userId = String(req.query.userId || '').trim();
    if (!userId || doc.ownerId !== userId) {
      return res.status(403).json({ message: '403 Forbidden: Only the document owner may delete it.' });
    }

    removeVaultFile(doc.id);
    db.documents.splice(idx, 1);

    // Purge from admission checklist links
    for (const key of Object.keys(db.admissionDocAttachments)) {
      db.admissionDocAttachments[key] = db.admissionDocAttachments[key].filter((id) => id !== doc.id);
    }

    recordActivity(
      db,
      userId,
      'Deleted',
      'document',
      doc.id,
      doc.title,
      'Permanently deleted file from encrypted vault'
    );
    saveDb(db);

    return res.json({
      deletedId: doc.id,
      storage: computeStorageForUser(db, userId),
      activity: db.activity.filter((a) => a.ownerId === userId).slice(0, 80),
    });
  });

  // 6. Folder CRUD (Custom Folders & Subfolders, Academic Year / Semester / College Metadata)
  app.post('/api/locker/folders', (req: Request, res: Response) => {
    const b = req.body || {};
    const ownerId = String(b.ownerId || '').trim();
    const name = String(b.name || '').trim();
    if (!ownerId || !name) {
      return res.status(400).json({ message: 'ownerId and folder name are required.' });
    }
    const parentId = b.parentId ? String(b.parentId) : null;
    if (parentId && !db.folders.some((f) => f.id === parentId && f.ownerId === ownerId)) {
      return res.status(403).json({ message: '403 Forbidden: Parent folder not owned by you.' });
    }

    const now = new Date().toISOString();
    const folder: LockerFolder = {
      id: `lfd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ownerId,
      name,
      parentId,
      academicYear: b.academicYear ? String(b.academicYear).trim() : undefined,
      semester: b.semester ? String(b.semester).trim() : undefined,
      college: b.college ? String(b.college).trim() : undefined,
      documentType: b.documentType ? String(b.documentType).trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };
    db.folders.push(folder);
    recordActivity(db, ownerId, 'Uploaded', 'folder', folder.id, folder.name, 'Created smart folder');
    saveDb(db);

    return res.status(201).json({
      folder,
      storage: computeStorageForUser(db, ownerId),
      activity: db.activity.filter((a) => a.ownerId === ownerId).slice(0, 80),
    });
  });

  app.patch('/api/locker/folders/:id', (req: Request, res: Response) => {
    const folder = db.folders.find((f) => f.id === req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found.' });
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || folder.ownerId !== userId) {
      return res.status(403).json({ message: '403 Forbidden: Only owner can rename or edit folder.' });
    }
    const prevName = folder.name;
    if (typeof b.name === 'string' && b.name.trim()) folder.name = b.name.trim();
    if (typeof b.academicYear === 'string') folder.academicYear = b.academicYear.trim();
    if (typeof b.semester === 'string') folder.semester = b.semester.trim();
    if (typeof b.college === 'string') folder.college = b.college.trim();
    folder.updatedAt = new Date().toISOString();

    recordActivity(
      db,
      userId,
      'Renamed',
      'folder',
      folder.id,
      folder.name,
      `Renamed folder from "${prevName}" to "${folder.name}"`
    );
    saveDb(db);
    return res.json({
      folder,
      activity: db.activity.filter((a) => a.ownerId === userId).slice(0, 80),
    });
  });

  app.delete('/api/locker/folders/:id', (req: Request, res: Response) => {
    const folder = db.folders.find((f) => f.id === req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found.' });
    const userId = String(req.query.userId || '').trim();
    if (!userId || folder.ownerId !== userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }

    // Reparent child subfolders to folder.parentId and move documents to folder.parentId cleanly
    db.folders.forEach((f) => {
      if (f.ownerId === userId && f.parentId === folder.id) {
        f.parentId = folder.parentId;
      }
    });
    db.documents.forEach((d) => {
      if (d.ownerId === userId && d.folderId === folder.id) {
        d.folderId = folder.parentId;
      }
    });
    db.folders = db.folders.filter((f) => f.id !== folder.id);
    recordActivity(
      db,
      userId,
      'Deleted',
      'folder',
      folder.id,
      folder.name,
      'Deleted folder (documents safely preserved in parent folder)'
    );
    saveDb(db);

    return res.json({
      deletedFolderId: folder.id,
      folders: db.folders.filter((f) => f.ownerId === userId),
      documents: db.documents.filter((d) => d.ownerId === userId),
      storage: computeStorageForUser(db, userId),
      activity: db.activity.filter((a) => a.ownerId === userId).slice(0, 80),
    });
  });

  // 7. Secure Sharing Permissions & Time-Limited Signed Links
  app.post('/api/locker/documents/:id/share-user', (req: Request, res: Response) => {
    const doc = db.documents.find((d) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || doc.ownerId !== userId) {
      return res.status(403).json({ message: '403 Forbidden: Only owner can share this document.' });
    }
    const targetUserId = String(b.targetUserId || '').trim();
    const targetUserName = String(b.targetUserName || targetUserId).trim();
    if (!targetUserId || targetUserId === userId) {
      return res.status(400).json({ message: 'Select a valid KAMPUS recipient.' });
    }

    const permission = b.permission === 'download' ? 'download' : 'view';
    const hours = Number(b.expiresInHours || 72);
    const expiresAt =
      hours > 0 ? new Date(Date.now() + hours * 3600_000).toISOString() : null;

    const existing = doc.userShares.find(
      (s) => s.targetUserId === targetUserId && !s.revoked
    );
    if (existing) {
      existing.permission = permission;
      existing.expiresAt = expiresAt;
      existing.grantedAt = new Date().toISOString();
    } else {
      doc.userShares.unshift({
        id: `lus_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        targetUserId,
        targetUserName,
        permission,
        grantedAt: new Date().toISOString(),
        expiresAt,
        revoked: false,
      });
    }

    recordActivity(
      db,
      userId,
      'Shared',
      'share',
      doc.id,
      doc.title,
      `Shared (${permission}) with ${targetUserName}`
    );
    saveDb(db);

    return res.status(201).json({
      document: doc,
      activity: db.activity.filter((a) => a.ownerId === userId).slice(0, 80),
    });
  });

  app.post('/api/locker/documents/:id/share-link', (req: Request, res: Response) => {
    const doc = db.documents.find((d) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || doc.ownerId !== userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }

    const hours = Math.min(720, Math.max(1, Number(b.expiresInHours) || 24));
    const permission = b.permission === 'download' ? 'download' : 'view';
    const token = `kmp_shr_${crypto.randomBytes(18).toString('hex')}`;
    const expiresAt = new Date(Date.now() + hours * 3600_000).toISOString();

    const shareLink = {
      id: `lsl_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      token,
      label: String(b.label || `${hours}h Restricted Link`),
      permission: permission as 'view' | 'download',
      createdAt: new Date().toISOString(),
      expiresAt,
      revoked: false,
      accessCount: 0,
    };

    doc.shareLinks.unshift(shareLink);
    recordActivity(
      db,
      userId,
      'Shared',
      'share',
      doc.id,
      doc.title,
      `Created signed share link (${hours}h · ${permission})`
    );
    saveDb(db);

    return res.status(201).json({
      shareLink,
      document: doc,
      activity: db.activity.filter((a) => a.ownerId === userId).slice(0, 80),
    });
  });

  app.post('/api/locker/documents/:id/revoke', (req: Request, res: Response) => {
    const doc = db.documents.find((d) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId || doc.ownerId !== userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }

    let revokedDesc = '';
    if (b.shareUserId) {
      const sh = doc.userShares.find((s) => s.id === b.shareUserId);
      if (sh) {
        sh.revoked = true;
        revokedDesc = `Revoked user access for ${sh.targetUserName}`;
      }
    }
    if (b.shareLinkId) {
      const lk = doc.shareLinks.find((l) => l.id === b.shareLinkId);
      if (lk) {
        lk.revoked = true;
        revokedDesc = `Revoked signed share link (${lk.label})`;
      }
    }
    if (!revokedDesc) {
      return res.status(400).json({ message: 'Specify shareUserId or shareLinkId to revoke.' });
    }

    recordActivity(db, userId, 'Sharing Revoked', 'share', doc.id, doc.title, revokedDesc);
    saveDb(db);

    return res.json({
      document: doc,
      activity: db.activity.filter((a) => a.ownerId === userId).slice(0, 80),
    });
  });

  // Validate & inspect signed share link (requires valid token & authenticated KAMPUS userId)
  app.get('/api/locker/shared/:token', (req: Request, res: Response) => {
    const token = String(req.params.token || '').trim();
    const viewerUserId = String(req.query.userId || req.header('x-kampus-user-id') || '').trim();
    if (!viewerUserId) {
      return res.status(401).json({ message: 'Authentication required to open shared link.' });
    }

    for (const doc of db.documents) {
      const link = doc.shareLinks.find((l) => l.token === token);
      if (!link) continue;
      if (link.revoked) {
        return res.status(410).json({ message: 'This sharing link has been revoked by the owner.' });
      }
      if (new Date(link.expiresAt).getTime() <= Date.now()) {
        return res.status(410).json({ message: 'This sharing link has expired.' });
      }

      link.accessCount += 1;
      doc.lastAccessedAt = new Date().toISOString();
      recordActivity(
        db,
        doc.ownerId,
        'Viewed',
        'share',
        doc.id,
        doc.title,
        `Signed share link "${link.label}" opened by ${viewerUserId}`
      );
      saveDb(db);

      return res.json({
        document: {
          id: doc.id,
          title: doc.title,
          fileName: doc.fileName,
          format: doc.format,
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes,
          category: doc.category,
          subtype: doc.subtype,
          ownerName: doc.ownerName,
          description: doc.description,
          createdAt: doc.createdAt,
        },
        permission: link.permission,
        expiresAt: link.expiresAt,
      });
    }

    return res.status(404).json({ message: 'Invalid or unknown sharing token.' });
  });

  app.get('/api/locker/shared/:token/content', (req: Request, res: Response) => {
    const token = String(req.params.token || '').trim();
    const viewerUserId = String(req.query.userId || req.header('x-kampus-user-id') || '').trim();
    const isDownload = req.query.download === '1';

    if (!viewerUserId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    for (const doc of db.documents) {
      const link = doc.shareLinks.find((l) => l.token === token);
      if (!link) continue;
      if (link.revoked || new Date(link.expiresAt).getTime() <= Date.now()) {
        return res.status(410).json({ message: 'Sharing link is revoked or expired.' });
      }
      if (isDownload && link.permission !== 'download') {
        return res.status(403).json({ message: '403 Forbidden: This share link is view-only.' });
      }
      const plain = readDecryptedFile(doc.id);
      if (!plain) return res.status(404).json({ message: 'File missing from vault.' });

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      res.setHeader(
        'Content-Disposition',
        `${isDownload ? 'attachment' : 'inline'}; filename="${doc.fileName.replace(/"/g, '')}"`
      );
      return res.send(plain);
    }
    return res.status(404).json({ message: 'Share link not found.' });
  });

  // 8. Reminders CRUD
  app.post('/api/locker/reminders', (req: Request, res: Response) => {
    const b = req.body || {};
    const ownerId = String(b.ownerId || '').trim();
    const title = String(b.title || '').trim();
    const dueAtISO = String(b.dueAtISO || '').trim();
    if (!ownerId || !title || !dueAtISO) {
      return res.status(400).json({ message: 'Reminder title and date/time are required.' });
    }
    const linkedDoc = b.documentId
      ? db.documents.find((d) => d.id === b.documentId && d.ownerId === ownerId)
      : null;

    const rem: LockerReminder = {
      id: `lrm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ownerId,
      title,
      reminderType: b.reminderType || 'Document submission',
      documentId: linkedDoc ? linkedDoc.id : null,
      documentTitle: linkedDoc ? linkedDoc.title : null,
      dueAtISO,
      repeat: b.repeat || 'None',
      notes: String(b.notes || '').trim(),
      completed: false,
      syncedToPlanner: Boolean(b.syncToPlanner),
      createdAt: new Date().toISOString(),
    };
    db.reminders.unshift(rem);
    saveDb(db);
    return res.status(201).json({ reminder: rem });
  });

  app.patch('/api/locker/reminders/:id', (req: Request, res: Response) => {
    const rem = db.reminders.find((r) => r.id === req.params.id);
    if (!rem) return res.status(404).json({ message: 'Reminder not found.' });
    const b = req.body || {};
    if (String(b.userId || '').trim() !== rem.ownerId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    if (typeof b.completed === 'boolean') rem.completed = b.completed;
    saveDb(db);
    return res.json({ reminder: rem });
  });

  app.delete('/api/locker/reminders/:id', (req: Request, res: Response) => {
    const rem = db.reminders.find((r) => r.id === req.params.id);
    if (!rem) return res.status(404).json({ message: 'Reminder not found.' });
    if (String(req.query.userId || '').trim() !== rem.ownerId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.reminders = db.reminders.filter((r) => r.id !== rem.id);
    saveDb(db);
    return res.json({ deletedId: rem.id });
  });

  // 9. Recent Searches
  app.post('/api/locker/recent-searches', (req: Request, res: Response) => {
    const { userId, query, clear } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (clear) {
      db.recentSearchesByUser[userId] = [];
      saveDb(db);
      return res.json({ recentSearches: [] });
    }
    const trimmed = String(query || '').trim();
    if (!trimmed) return res.json({ recentSearches: db.recentSearchesByUser[userId] || [] });
    const prev = (db.recentSearchesByUser[userId] || []).filter(
      (q) => q.toLowerCase() !== trimmed.toLowerCase()
    );
    db.recentSearchesByUser[userId] = [trimmed, ...prev].slice(0, 6);
    saveDb(db);
    return res.json({ recentSearches: db.recentSearchesByUser[userId] });
  });

  // 10. Attach Document to College Explorer Admission Preparation Checklist
  app.post('/api/locker/integrations/attach-admission-doc', (req: Request, res: Response) => {
    const { userId, admissionId, documentId, detach } = req.body || {};
    if (!userId || !admissionId || !documentId) {
      return res.status(400).json({ message: 'userId, admissionId, and documentId are required.' });
    }
    const doc = db.documents.find((d) => d.id === documentId && d.ownerId === userId);
    if (!doc) return res.status(403).json({ message: '403 Forbidden: Document not owned by user.' });

    const prev = db.admissionDocAttachments[admissionId] || [];
    if (detach) {
      db.admissionDocAttachments[admissionId] = prev.filter((id) => id !== documentId);
    } else if (!prev.includes(documentId)) {
      db.admissionDocAttachments[admissionId] = [...prev, documentId];
    }
    saveDb(db);
    return res.json({ crossModule: readCrossModuleData(db, userId) });
  });
}
