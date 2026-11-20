export type LockerCategory =
  | 'Academic Records'
  | 'Identity Documents'
  | 'Certificates'
  | 'Admission Documents'
  | 'Examination Documents'
  | 'Career Documents'
  | 'Personal Documents'
  | 'Other Documents';

export type LockerFileFormat = 'PDF' | 'JPG' | 'JPEG' | 'PNG' | 'DOC' | 'DOCX' | 'PPT' | 'PPTX';

export type LockerReminderType =
  | 'Certificate renewal'
  | 'Admission deadlines'
  | 'Examination documents'
  | 'Application deadlines'
  | 'Document submission'
  | 'Scholarship documents';

export type LockerReminderRepeat = 'None' | 'Monthly' | 'Quarterly' | 'Yearly';

export type LockerActivityAction =
  | 'Uploaded'
  | 'Viewed'
  | 'Updated'
  | 'Renamed'
  | 'Moved'
  | 'Downloaded'
  | 'Shared'
  | 'Sharing Revoked'
  | 'Deleted';

export interface LockerFolder {
  id: string;
  ownerId: string;
  name: string;
  parentId: string | null;
  academicYear?: string;
  semester?: string;
  college?: string;
  documentType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LockerUserShare {
  id: string;
  targetUserId: string;
  targetUserName: string;
  permission: 'view' | 'download';
  grantedAt: string;
  expiresAt?: string | null;
  revoked: boolean;
}

export interface LockerShareLink {
  id: string;
  token: string;
  label: string;
  permission: 'view' | 'download';
  createdAt: string;
  expiresAt: string;
  revoked: boolean;
  accessCount: number;
}

export interface LockerDocument {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  fileName: string;
  format: LockerFileFormat;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum: string;
  encryptedAtRest: boolean;
  category: LockerCategory;
  subtype: string;
  folderId: string | null;
  description: string;
  tags: string[];
  academicYear?: string;
  semester?: string;
  college?: string;
  isImportant: boolean;
  searchableText?: string;
  userShares: LockerUserShare[];
  shareLinks: LockerShareLink[];
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

export interface LockerReminder {
  id: string;
  ownerId: string;
  title: string;
  reminderType: LockerReminderType;
  documentId?: string | null;
  documentTitle?: string | null;
  dueAtISO: string;
  repeat: LockerReminderRepeat;
  notes: string;
  completed: boolean;
  syncedToPlanner: boolean;
  createdAt: string;
}

export interface LockerActivityEntry {
  id: string;
  ownerId: string;
  action: LockerActivityAction;
  targetType: 'document' | 'folder' | 'share' | 'reminder';
  targetId: string;
  targetName: string;
  details: string;
  createdAt: string;
}

export interface LockerStorageSummary {
  quotaBytes: number;
  usedBytes: number;
  availableBytes: number;
  totalDocuments: number;
  totalFolders: number;
  encryptionCipher: string;
}

export interface LockerAdmissionChecklistLink {
  admissionId: string;
  collegeName: string;
  courseName: string;
  status: string;
  deadlineISO?: string;
  attachedDocumentIds: string[];
}

export interface LockerCrossModuleData {
  kampusId: {
    kampusIdNumber: string | null;
    isVerified: boolean;
    achievements: string[];
  };
  careerResumes: {
    id: string;
    title: string;
    targetRole: string;
    updatedAt: string;
    pdfUrl?: string;
  }[];
  admissions: LockerAdmissionChecklistLink[];
}
