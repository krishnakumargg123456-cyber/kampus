import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import {
  LOCKER_MAX_FILE_BYTES,
  LOCKER_SUPPORTED_EXTENSIONS,
} from '../data/lockerData';
import type {
  LockerActivityEntry,
  LockerCategory,
  LockerCrossModuleData,
  LockerDocument,
  LockerFolder,
  LockerReminder,
  LockerReminderRepeat,
  LockerReminderType,
  LockerStorageSummary,
} from '../types/locker';

const PLANNER_PARTNER_SESSIONS_KEY = 'kampus_planner_partner_sessions_v1';

export interface LockerContextType {
  loading: boolean;
  uploadProgress: number | null;
  statusToast: { type: 'success' | 'error' | 'info'; message: string } | null;
  clearToast: () => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  documents: LockerDocument[];
  sharedWithMe: LockerDocument[];
  folders: LockerFolder[];
  reminders: LockerReminder[];
  activity: LockerActivityEntry[];
  recentSearches: string[];
  storage: LockerStorageSummary | null;
  crossModule: LockerCrossModuleData | null;
  reload: () => Promise<void>;
  uploadDocument: (payload: {
    file: File;
    title: string;
    category: LockerCategory;
    subtype: string;
    folderId: string | null;
    description: string;
    tags: string[];
    academicYear?: string;
    semester?: string;
    college?: string;
    isImportant?: boolean;
    allowContentIndexing?: boolean;
  }) => Promise<LockerDocument | null>;
  updateDocument: (
    id: string,
    patch: Partial<LockerDocument>
  ) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
  createFolder: (payload: {
    name: string;
    parentId?: string | null;
    academicYear?: string;
    semester?: string;
    college?: string;
    documentType?: string;
  }) => Promise<LockerFolder | null>;
  renameFolder: (id: string, name: string) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  shareWithUser: (payload: {
    documentId: string;
    targetUserId: string;
    targetUserName: string;
    permission: 'view' | 'download';
    expiresInHours?: number;
  }) => Promise<boolean>;
  createShareLink: (payload: {
    documentId: string;
    label: string;
    permission: 'view' | 'download';
    expiresInHours: number;
  }) => Promise<string | null>;
  revokeShare: (payload: {
    documentId: string;
    shareUserId?: string;
    shareLinkId?: string;
  }) => Promise<boolean>;
  createReminder: (payload: {
    title: string;
    reminderType: LockerReminderType;
    documentId?: string | null;
    dueAtISO: string;
    repeat: LockerReminderRepeat;
    notes: string;
    syncToPlanner: boolean;
  }) => Promise<boolean>;
  toggleReminderComplete: (id: string, completed: boolean) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  recordRecentSearch: (query: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;
  toggleAdmissionAttachment: (
    admissionId: string,
    documentId: string,
    detach?: boolean
  ) => Promise<void>;
  getContentUrl: (docId: string, download?: boolean) => string;
}

const LockerContext = createContext<LockerContextType | undefined>(undefined);

function readFileAsBase64WithProgress(
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.min(45, Math.round((e.loaded / e.total) * 45)));
      }
    };
    reader.onload = () => {
      onProgress(50);
      resolve(String(reader.result || ''));
    };
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export const LockerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const userId = user?.id || 'usr_22b030149';
  const userName = user?.name || 'KAMPUS Student';

  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusToast, setStatusToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [documents, setDocuments] = useState<LockerDocument[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<LockerDocument[]>([]);
  const [folders, setFolders] = useState<LockerFolder[]>([]);
  const [reminders, setReminders] = useState<LockerReminder[]>([]);
  const [activity, setActivity] = useState<LockerActivityEntry[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [storage, setStorage] = useState<LockerStorageSummary | null>(null);
  const [crossModule, setCrossModule] = useState<LockerCrossModuleData | null>(null);

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      setStatusToast({ type, message });
    },
    []
  );

  const clearToast = useCallback(() => setStatusToast(null), []);

  useEffect(() => {
    if (!statusToast) return;
    const t = setTimeout(() => setStatusToast(null), 4800);
    return () => clearTimeout(t);
  }, [statusToast]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/locker/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load Digital Locker.');
      setDocuments(data.documents || []);
      setSharedWithMe(data.sharedWithMe || []);
      setFolders(data.folders || []);
      setReminders(data.reminders || []);
      setActivity(data.activity || []);
      setRecentSearches(data.recentSearches || []);
      setStorage(data.storage || null);
      setCrossModule(data.crossModule || null);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Unable to connect to Digital Locker backend.'
      );
    } finally {
      setLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const uploadDocument = useCallback(
    async (payload: {
      file: File;
      title: string;
      category: LockerCategory;
      subtype: string;
      folderId: string | null;
      description: string;
      tags: string[];
      academicYear?: string;
      semester?: string;
      college?: string;
      isImportant?: boolean;
      allowContentIndexing?: boolean;
    }): Promise<LockerDocument | null> => {
      const ext = payload.file.name
        .toLowerCase()
        .slice(payload.file.name.lastIndexOf('.'));
      if (!LOCKER_SUPPORTED_EXTENSIONS.includes(ext)) {
        showToast(
          'error',
          `Unsupported file format "${ext}". Allowed: PDF, JPG, JPEG, PNG, DOC, DOCX, PPT, PPTX.`
        );
        return null;
      }
      if (payload.file.size === 0 || payload.file.size > LOCKER_MAX_FILE_BYTES) {
        showToast('error', 'File must be non-empty and up to 10 MB.');
        return null;
      }

      try {
        setUploadProgress(10);
        const base64Data = await readFileAsBase64WithProgress(payload.file, setUploadProgress);
        setUploadProgress(70);

        const res = await fetch('/api/locker/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerId: userId,
            ownerName: userName,
            fileName: payload.file.name,
            base64Data,
            title: payload.title,
            category: payload.category,
            subtype: payload.subtype,
            folderId: payload.folderId,
            description: payload.description,
            tags: payload.tags,
            academicYear: payload.academicYear,
            semester: payload.semester,
            college: payload.college,
            isImportant: payload.isImportant,
            allowContentIndexing: payload.allowContentIndexing,
          }),
        });
        setUploadProgress(95);
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Document upload failed.');
          return null;
        }
        setDocuments((prev) => [data.document, ...prev]);
        if (data.storage) setStorage(data.storage);
        if (data.activity) setActivity(data.activity);

        addNotification({
          title: 'Document Stored in Digital Locker',
          description: `"${data.document.title}" encrypted and organized under ${data.document.category}.`,
          time: 'Just now',
          type: 'academic',
          linkRoute: '/tools/digital-locker',
        });
        showToast('success', `"${data.document.title}" uploaded cleanly to your private vault.`);
        return data.document;
      } catch {
        showToast('error', 'Upload failed. Check your connection and try again.');
        return null;
      } finally {
        setUploadProgress(null);
      }
    },
    [userId, userName, addNotification, showToast]
  );

  const updateDocument = useCallback(
    async (id: string, patch: Partial<LockerDocument>): Promise<boolean> => {
      try {
        const res = await fetch(`/api/locker/documents/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, ...patch }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Unable to update document.');
          return false;
        }
        setDocuments((prev) => prev.map((d) => (d.id === id ? data.document : d)));
        if (data.activity) setActivity(data.activity);
        showToast('success', 'Document updated.');
        return true;
      } catch {
        showToast('error', 'Error updating document.');
        return false;
      }
    },
    [userId, showToast]
  );

  const deleteDocument = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/locker/documents/${id}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to delete document.');
          return false;
        }
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (data.storage) setStorage(data.storage);
        if (data.activity) setActivity(data.activity);
        showToast('info', 'Document permanently deleted from private vault.');
        return true;
      } catch {
        showToast('error', 'Error deleting document.');
        return false;
      }
    },
    [userId, showToast]
  );

  const createFolder = useCallback(
    async (payload: {
      name: string;
      parentId?: string | null;
      academicYear?: string;
      semester?: string;
      college?: string;
      documentType?: string;
    }): Promise<LockerFolder | null> => {
      try {
        const res = await fetch('/api/locker/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId: userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to create folder.');
          return null;
        }
        setFolders((prev) => [...prev, data.folder]);
        if (data.storage) setStorage(data.storage);
        if (data.activity) setActivity(data.activity);
        showToast('success', `Folder "${data.folder.name}" created.`);
        return data.folder;
      } catch {
        showToast('error', 'Error creating folder.');
        return null;
      }
    },
    [userId, showToast]
  );

  const renameFolder = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/locker/folders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not rename folder.');
          return false;
        }
        setFolders((prev) => prev.map((f) => (f.id === id ? data.folder : f)));
        if (data.activity) setActivity(data.activity);
        showToast('success', `Folder renamed to "${data.folder.name}".`);
        return true;
      } catch {
        showToast('error', 'Error renaming folder.');
        return false;
      }
    },
    [userId, showToast]
  );

  const deleteFolder = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/locker/folders/${id}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not delete folder.');
          return false;
        }
        setFolders(data.folders || []);
        setDocuments(data.documents || []);
        if (data.storage) setStorage(data.storage);
        if (data.activity) setActivity(data.activity);
        showToast('info', 'Folder deleted. Enclosed files moved safely up one level.');
        return true;
      } catch {
        showToast('error', 'Error deleting folder.');
        return false;
      }
    },
    [userId, showToast]
  );

  const shareWithUser = useCallback(
    async (payload: {
      documentId: string;
      targetUserId: string;
      targetUserName: string;
      permission: 'view' | 'download';
      expiresInHours?: number;
    }): Promise<boolean> => {
      try {
        const res = await fetch(`/api/locker/documents/${payload.documentId}/share-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            targetUserId: payload.targetUserId,
            targetUserName: payload.targetUserName,
            permission: payload.permission,
            expiresInHours: payload.expiresInHours,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Sharing failed.');
          return false;
        }
        setDocuments((prev) =>
          prev.map((d) => (d.id === payload.documentId ? data.document : d))
        );
        if (data.activity) setActivity(data.activity);
        showToast('success', `Shared "${data.document.title}" with ${payload.targetUserName}.`);
        return true;
      } catch {
        showToast('error', 'Network error sharing document.');
        return false;
      }
    },
    [userId, showToast]
  );

  const createShareLink = useCallback(
    async (payload: {
      documentId: string;
      label: string;
      permission: 'view' | 'download';
      expiresInHours: number;
    }): Promise<string | null> => {
      try {
        const res = await fetch(`/api/locker/documents/${payload.documentId}/share-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            label: payload.label,
            permission: payload.permission,
            expiresInHours: payload.expiresInHours,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not create share link.');
          return null;
        }
        setDocuments((prev) =>
          prev.map((d) => (d.id === payload.documentId ? data.document : d))
        );
        if (data.activity) setActivity(data.activity);
        const shareUrl = `${window.location.origin}/#/tools/digital-locker?shareToken=${data.shareLink.token}`;
        showToast('success', 'Restricted expiring share link generated.');
        return shareUrl;
      } catch {
        showToast('error', 'Failed to generate share link.');
        return null;
      }
    },
    [userId, showToast]
  );

  const revokeShare = useCallback(
    async (payload: {
      documentId: string;
      shareUserId?: string;
      shareLinkId?: string;
    }): Promise<boolean> => {
      try {
        const res = await fetch(`/api/locker/documents/${payload.documentId}/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            shareUserId: payload.shareUserId,
            shareLinkId: payload.shareLinkId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Could not revoke sharing.');
          return false;
        }
        setDocuments((prev) =>
          prev.map((d) => (d.id === payload.documentId ? data.document : d))
        );
        if (data.activity) setActivity(data.activity);
        showToast('info', 'Sharing access revoked immediately.');
        return true;
      } catch {
        showToast('error', 'Failed to revoke sharing.');
        return false;
      }
    },
    [userId, showToast]
  );

  const createReminder = useCallback(
    async (payload: {
      title: string;
      reminderType: LockerReminderType;
      documentId?: string | null;
      dueAtISO: string;
      repeat: LockerReminderRepeat;
      notes: string;
      syncToPlanner: boolean;
    }): Promise<boolean> => {
      try {
        const res = await fetch('/api/locker/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId: userId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast('error', data.message || 'Failed to save reminder.');
          return false;
        }
        setReminders((prev) => [data.reminder, ...prev]);

        if (payload.syncToPlanner) {
          try {
            const raw = localStorage.getItem(PLANNER_PARTNER_SESSIONS_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            const [datePart, timePart] = payload.dueAtISO.split('T');
            arr.unshift({
              id: `locker_rem_${data.reminder.id}`,
              title: `[Digital Locker] ${payload.title}`,
              targetName: payload.reminderType,
              subject: data.reminder.documentTitle || 'Document Checklist',
              dateISO: datePart || payload.dueAtISO,
              timeSlot: (timePart || '09:00').slice(0, 5),
              durationMinutes: 30,
              status: 'Scheduled',
            });
            localStorage.setItem(PLANNER_PARTNER_SESSIONS_KEY, JSON.stringify(arr.slice(0, 50)));
          } catch {
            // non-fatal
          }
        }

        addNotification({
          title: `Document Reminder: ${payload.title}`,
          description: `${payload.reminderType} due on ${payload.dueAtISO.replace('T', ' ')}.`,
          time: 'Just now',
          type: 'academic',
          linkRoute: '/tools/digital-locker',
        });

        showToast(
          'success',
          payload.syncToPlanner
            ? 'Reminder saved and synced to KAMPUS Planner & Notification Center.'
            : 'Document reminder saved.'
        );
        return true;
      } catch {
        showToast('error', 'Error creating reminder.');
        return false;
      }
    },
    [userId, addNotification, showToast]
  );

  const toggleReminderComplete = useCallback(
    async (id: string, completed: boolean) => {
      try {
        const res = await fetch(`/api/locker/reminders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, completed }),
        });
        const data = await res.json();
        if (res.ok && data.reminder) {
          setReminders((prev) => prev.map((r) => (r.id === id ? data.reminder : r)));
        }
      } catch {
        // ignore
      }
    },
    [userId]
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/locker/reminders/${id}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setReminders((prev) => prev.filter((r) => r.id !== id));
          showToast('info', 'Reminder deleted.');
        }
      } catch {
        showToast('error', 'Failed to delete reminder.');
      }
    },
    [userId, showToast]
  );

  const recordRecentSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      try {
        const res = await fetch('/api/locker/recent-searches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, query: trimmed }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.recentSearches)) {
          setRecentSearches(data.recentSearches);
        }
      } catch {
        // ignore
      }
    },
    [userId]
  );

  const clearRecentSearches = useCallback(async () => {
    try {
      const res = await fetch('/api/locker/recent-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, clear: true }),
      });
      if (res.ok) setRecentSearches([]);
    } catch {
      // ignore
    }
  }, [userId]);

  const toggleAdmissionAttachment = useCallback(
    async (admissionId: string, documentId: string, detach = false) => {
      try {
        const res = await fetch('/api/locker/integrations/attach-admission-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, admissionId, documentId, detach }),
        });
        const data = await res.json();
        if (res.ok && data.crossModule) {
          setCrossModule(data.crossModule);
          showToast(
            'success',
            detach ? 'Document removed from admission checklist.' : 'Document attached to admission checklist.'
          );
        }
      } catch {
        showToast('error', 'Could not update admission checklist link.');
      }
    },
    [userId, showToast]
  );

  const getContentUrl = useCallback(
    (docId: string, download = false) =>
      `/api/locker/documents/${docId}/content?userId=${encodeURIComponent(userId)}${
        download ? '&download=1' : ''
      }`,
    [userId]
  );

  const value = useMemo<LockerContextType>(
    () => ({
      loading,
      uploadProgress,
      statusToast,
      clearToast,
      showToast,
      documents,
      sharedWithMe,
      folders,
      reminders,
      activity,
      recentSearches,
      storage,
      crossModule,
      reload,
      uploadDocument,
      updateDocument,
      deleteDocument,
      createFolder,
      renameFolder,
      deleteFolder,
      shareWithUser,
      createShareLink,
      revokeShare,
      createReminder,
      toggleReminderComplete,
      deleteReminder,
      recordRecentSearch,
      clearRecentSearches,
      toggleAdmissionAttachment,
      getContentUrl,
    }),
    [
      loading,
      uploadProgress,
      statusToast,
      clearToast,
      showToast,
      documents,
      sharedWithMe,
      folders,
      reminders,
      activity,
      recentSearches,
      storage,
      crossModule,
      reload,
      uploadDocument,
      updateDocument,
      deleteDocument,
      createFolder,
      renameFolder,
      deleteFolder,
      shareWithUser,
      createShareLink,
      revokeShare,
      createReminder,
      toggleReminderComplete,
      deleteReminder,
      recordRecentSearch,
      clearRecentSearches,
      toggleAdmissionAttachment,
      getContentUrl,
    ]
  );

  return <LockerContext.Provider value={value}>{children}</LockerContext.Provider>;
};

export const useLocker = () => {
  const ctx = useContext(LockerContext);
  if (!ctx) throw new Error('useLocker must be used within a LockerProvider');
  return ctx;
};
