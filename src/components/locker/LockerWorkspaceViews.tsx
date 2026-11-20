import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Download,
  Edit3,
  Eye,
  FileText,
  Folder,
  FolderInput,
  FolderPlus,
  Grid,
  Image as ImageIcon,
  List,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocker } from '../../context/LockerContext';
import {
  LOCKER_CATEGORIES,
  LOCKER_SUBTYPES_BY_CATEGORY,
  formatLockerBytes,
  formatLockerDate,
  formatLockerDateTime,
  isImageFormat,
} from '../../data/lockerData';
import type { LockerCategory, LockerDocument, LockerFolder } from '../../types/locker';
import type { LockerSectionNav } from './LockerSidebarAndStats';

interface LockerWorkspaceViewsProps {
  section: LockerSectionNav;
  selectedCategory: LockerCategory | 'all';
  selectedFolderId: string | null;
  onSelectSection: (sec: LockerSectionNav) => void;
  onSelectCategory: (cat: LockerCategory | 'all') => void;
  onSelectFolder: (folderId: string | null) => void;
  onOpenPreview: (doc: LockerDocument, isSharedRecipient?: boolean) => void;
  onOpenShare: (doc: LockerDocument) => void;
  uploadModalOpen: boolean;
  setUploadModalOpen: (v: boolean) => void;
  folderModalOpen: boolean;
  setFolderModalOpen: (v: boolean) => void;
}

type SortKey = 'newest' | 'oldest' | 'name' | 'largest' | 'accessed';

export const LockerWorkspaceViews: React.FC<LockerWorkspaceViewsProps> = ({
  section,
  selectedCategory,
  selectedFolderId,
  onSelectSection,
  onSelectCategory,
  onSelectFolder,
  onOpenPreview,
  onOpenShare,
  uploadModalOpen,
  setUploadModalOpen,
  folderModalOpen,
  setFolderModalOpen,
}) => {
  const { profile } = useAuth();
  const {
    documents,
    sharedWithMe,
    folders,
    activity,
    storage,
    recentSearches,
    uploadProgress,
    uploadDocument,
    updateDocument,
    deleteDocument,
    createFolder,
    renameFolder,
    deleteFolder,
    recordRecentSearch,
    clearRecentSearches,
    getContentUrl,
    showToast,
  } = useLocker();

  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [query, setQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [searchContentEnabled, setSearchContentEnabled] = useState(false);

  // Camera Scanner Support Check
  const [cameraSupported, setCameraSupported] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setCameraSupported(
      typeof navigator !== 'undefined' &&
        Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }, []);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCat, setUploadCat] = useState<LockerCategory>(
    selectedCategory !== 'all' ? selectedCategory : 'Academic Records'
  );
  const [uploadSubtype, setUploadSubtype] = useState(
    LOCKER_SUBTYPES_BY_CATEGORY['Academic Records'][0]
  );
  const [uploadFolderId, setUploadFolderId] = useState<string>(selectedFolderId || '');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTagsText, setUploadTagsText] = useState('');
  const [uploadYear, setUploadYear] = useState('2025-26');
  const [uploadSem, setUploadSem] = useState(profile.semester || 'Semester 6');
  const [uploadCollege, setUploadCollege] = useState(profile.college || '');
  const [uploadImportant, setUploadImportant] = useState(false);
  const [allowContentIndexing, setAllowContentIndexing] = useState(false);

  // Folder Modal State
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderYear, setNewFolderYear] = useState('2025-26');
  const [newFolderSem, setNewFolderSem] = useState(profile.semester || '');
  const [newFolderCollege, setNewFolderCollege] = useState(profile.college || '');

  // Rename / Move Document & Folder inline controls
  const [editingDoc, setEditingDoc] = useState<LockerDocument | null>(null);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocDesc, setEditDocDesc] = useState('');
  const [editDocTags, setEditDocTags] = useState('');
  const [editDocFolder, setEditDocFolder] = useState<string>('');
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<string | null>(null);

  const [renamingFolder, setRenamingFolder] = useState<LockerFolder | null>(null);
  const [renameFolderText, setRenameFolderText] = useState('');

  useEffect(() => {
    if (selectedCategory !== 'all') {
      setUploadCat(selectedCategory);
      setUploadSubtype(LOCKER_SUBTYPES_BY_CATEGORY[selectedCategory][0] || 'General');
    }
  }, [selectedCategory]);

  useEffect(() => {
    setUploadFolderId(selectedFolderId || '');
  }, [selectedFolderId]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanModalOpen(false);
  };

  const openCameraScanner = async () => {
    if (!cameraSupported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setScanModalOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch {
      showToast('error', 'Camera permission denied or unavailable on this device.');
    }
  };

  const captureScanPhoto = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const canvas = document.createElement('canvas');
    canvas.width = vid.videoWidth || 1280;
    canvas.height = vid.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const scannedFile = new File([blob], `scanned_doc_${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        stopCamera();
        setUploadFile(scannedFile);
        setUploadTitle(`Scanned Document ${new Date().toLocaleDateString()}`);
        setUploadModalOpen(true);
      },
      'image/jpeg',
      0.92
    );
  };

  // Build Breadcrumbs for folder hierarchy
  const folderBreadcrumbs = useMemo(() => {
    const trail: LockerFolder[] = [];
    let curId = selectedFolderId;
    const guard = new Set<string>();
    while (curId && !guard.has(curId)) {
      guard.add(curId);
      const found = folders.find((f) => f.id === curId);
      if (!found) break;
      trail.unshift(found);
      curId = found.parentId;
    }
    return trail;
  }, [folders, selectedFolderId]);

  const childFolders = useMemo(() => {
    if (section !== 'all' || selectedCategory !== 'all' || query.trim()) return [];
    return folders.filter((f) => (selectedFolderId ? f.parentId === selectedFolderId : !f.parentId));
  }, [folders, section, selectedCategory, selectedFolderId, query]);

  const distinctYears = useMemo(() => {
    return Array.from(
      new Set(documents.map((d) => d.academicYear).filter((v): v is string => Boolean(v)))
    );
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const source = section === 'shared-with-me' ? sharedWithMe : documents;
    const q = query.trim().toLowerCase();

    const matched = source.filter((doc) => {
      if (section === 'important' && !doc.isImportant) return false;
      if (
        section === 'shared-by-me' &&
        !doc.userShares.some((s) => !s.revoked) &&
        !doc.shareLinks.some((l) => !l.revoked && new Date(l.expiresAt).getTime() > Date.now())
      ) {
        return false;
      }
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
      if (selectedFolderId && !q && doc.folderId !== selectedFolderId) return false;
      if (formatFilter !== 'all' && doc.format !== formatFilter) return false;
      if (yearFilter !== 'all' && doc.academicYear !== yearFilter) return false;

      if (q) {
        const folderName = folders.find((f) => f.id === doc.folderId)?.name || '';
        const baseHay = `${doc.title} ${doc.fileName} ${doc.category} ${doc.subtype} ${doc.description} ${folderName} ${doc.tags.join(' ')} ${doc.createdAt}`.toLowerCase();
        const fullHay =
          searchContentEnabled && doc.searchableText
            ? `${baseHay} ${doc.searchableText.toLowerCase()}`
            : baseHay;
        if (!fullHay.includes(q)) return false;
      }

      return true;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'largest') {
        return b.sizeBytes - a.sizeBytes;
      }
      if (sortBy === 'accessed' || section === 'recent') {
        return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    documents,
    sharedWithMe,
    section,
    selectedCategory,
    selectedFolderId,
    formatFilter,
    yearFilter,
    query,
    folders,
    searchContentEnabled,
    sortBy,
  ]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('error', 'Choose a file to upload.');
      return;
    }
    const created = await uploadDocument({
      file: uploadFile,
      title: uploadTitle.trim() || uploadFile.name.replace(/\.[^.]+$/, ''),
      category: uploadCat,
      subtype: uploadSubtype,
      folderId: uploadFolderId || null,
      description: uploadDescription.trim(),
      tags: uploadTagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      academicYear: uploadYear.trim() || undefined,
      semester: uploadSem.trim() || undefined,
      college: uploadCollege.trim() || undefined,
      isImportant: uploadImportant,
      allowContentIndexing,
    });
    if (created) {
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadTagsText('');
      setUploadImportant(false);
    }
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const created = await createFolder({
      name: newFolderName.trim(),
      parentId: selectedFolderId || null,
      academicYear: newFolderYear.trim() || undefined,
      semester: newFolderSem.trim() || undefined,
      college: newFolderCollege.trim() || undefined,
    });
    if (created) {
      setFolderModalOpen(false);
      setNewFolderName('');
    }
  };

  const openEditDocModal = (doc: LockerDocument) => {
    setEditingDoc(doc);
    setEditDocTitle(doc.title);
    setEditDocDesc(doc.description);
    setEditDocTags(doc.tags.join(', '));
    setEditDocFolder(doc.folderId || '');
  };

  const handleSaveDocEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    const ok = await updateDocument(editingDoc.id, {
      title: editDocTitle.trim(),
      description: editDocDesc.trim(),
      tags: editDocTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      folderId: editDocFolder || null,
    });
    if (ok) setEditingDoc(null);
  };

  const isSharedView = section === 'shared-with-me';
  const importantDocs = documents.filter((d) => d.isImportant);
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Security & Non-DigiLocker Boundary Notice */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900 dark:text-slate-100">
              Private Encrypted KAMPUS Vault · Private by Default
            </p>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Documents are stored private to your account (AES-256-GCM encrypted at rest) and
              never exposed on public URLs. Categories are organizational labels only — KAMPUS
              Digital Locker is separate from Government of India DigiLocker and does not claim
              government verification.
            </p>
          </div>
        </div>
        {storage && (
          <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0">
            {storage.encryptionCipher}
          </span>
        )}
      </div>

      {/* Overview Section (Shown when Overview is active) */}
      {section === 'overview' && (
        <div className="space-y-6">
          {/* Storage & Count Strip */}
          {storage && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Uploaded Documents', value: storage.totalDocuments },
                { label: 'Storage Used', value: formatLockerBytes(storage.usedBytes) },
                { label: 'Available Storage', value: formatLockerBytes(storage.availableBytes) },
                { label: 'Smart Folders', value: storage.totalFolders },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Quick Actions</h2>
            <div className="flex flex-wrap gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
              <button
                type="button"
                onClick={() => setFolderModalOpen(true)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>Create Folder</span>
              </button>
              {cameraSupported && (
                <button
                  type="button"
                  onClick={openCameraScanner}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-orange-500" />
                  <span>Scan Document</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectSection('recent')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              >
                Recent Documents
              </button>
              <button
                type="button"
                onClick={() => onSelectSection('shared-by-me')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              >
                Shared Documents
              </button>
            </div>
          </div>

          {/* Pinned / Important Documents */}
          {importantDocs.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-orange-500 fill-current" />
                <span>Important Pinned Documents ({importantDocs.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {importantDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {doc.title}
                      </p>
                      <p className="text-slate-500 truncate">
                        {doc.category} · {doc.format} · {formatLockerBytes(doc.sizeBytes)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPreview(doc)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold shrink-0"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Accessed + Real Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recently Accessed Documents
              </h2>
              {recentDocs.length === 0 ? (
                <p className="text-slate-500">
                  No documents uploaded yet. Upload your marksheets, IDs, or certificates to get
                  started.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {doc.title}
                        </p>
                        <p className="text-slate-500 tabular-nums">
                          Accessed {formatLockerDateTime(doc.lastAccessedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenPreview(doc)}
                        className="text-blue-600 font-semibold hover:underline shrink-0"
                      >
                        Preview
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Vault Activity
              </h2>
              {activity.length === 0 ? (
                <p className="text-slate-500">
                  Real activity events (uploads, views, shares, downloads) will appear here as you
                  use Digital Locker.
                </p>
              ) : (
                <div className="space-y-2">
                  {activity.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {ev.action}: {ev.targetName}
                        </p>
                        <p className="text-slate-500 truncate">{ev.details}</p>
                      </div>
                      <span className="text-slate-400 shrink-0 tabular-nums">
                        {formatLockerDate(ev.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search, Breadcrumbs, Sorting & View Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => {
                onSelectSection('all');
                onSelectCategory('all');
                onSelectFolder(null);
              }}
              className="hover:text-blue-600"
            >
              Digital Locker
            </button>
            {selectedCategory !== 'all' && (
              <>
                <span>/</span>
                <span className="text-blue-600">{selectedCategory}</span>
              </>
            )}
            {folderBreadcrumbs.map((f) => (
              <React.Fragment key={f.id}>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => onSelectFolder(f.id)}
                  className="hover:text-blue-600 text-blue-600"
                >
                  {f.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-lg border ${
                viewLayout === 'grid'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              aria-label="List view"
              className={`p-1.5 rounded-lg border ${
                viewLayout === 'list'
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) recordRecentSearch(query.trim());
          }}
          className="flex flex-wrap gap-2"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by file name, folder, category, tags, or upload date..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            aria-label="Filter by file format"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">All Formats</option>
            {['PDF', 'JPG', 'JPEG', 'PNG', 'DOC', 'DOCX', 'PPT', 'PPTX'].map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt}
              </option>
            ))}
          </select>

          {distinctYears.length > 0 && (
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              aria-label="Filter by academic year"
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="all">All Years</option>
              {distinctYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            aria-label="Sort documents"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="accessed">Recently Accessed</option>
            <option value="name">Name (A-Z)</option>
            <option value="largest">Largest File</option>
          </select>

          {(query || formatFilter !== 'all' || yearFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFormatFilter('all');
                setYearFilter('all');
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={searchContentEnabled}
              onChange={(e) => setSearchContentEnabled(e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
            <span>Include consented extracted text content (DOCX/PPTX) in search</span>
          </label>

          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400">Recent:</span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:text-blue-600"
                >
                  {term}
                </button>
              ))}
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-slate-400 hover:text-red-500 ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Folder Sub-grid inside current directory */}
      {childFolders.length > 0 && (
        <div className="space-y-2.5 text-xs">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">
            Folders ({childFolders.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {childFolders.map((fld) => {
              const count = documents.filter((d) => d.folderId === fld.id).length;
              return (
                <div
                  key={fld.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => onSelectFolder(fld.id)}
                    className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                  >
                    <Folder className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {fld.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate tabular-nums">
                        {count} {count === 1 ? 'file' : 'files'}
                        {fld.academicYear ? ` · ${fld.academicYear}` : ''}
                        {fld.semester ? ` · ${fld.semester}` : ''}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingFolder(fld);
                        setRenameFolderText(fld.name);
                      }}
                      aria-label="Rename folder"
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFolder(fld.id)}
                      aria-label="Delete folder"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Grid / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {isSharedView ? 'Documents Shared With You' : 'Documents'} ({filteredDocuments.length})
          </h3>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isSharedView
                ? 'No documents shared with you yet'
                : 'No documents in this view yet'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isSharedView
                ? 'When a peer or faculty member shares a KAMPUS document with your account, it will appear securely here.'
                : 'Upload PDFs, images, Word docs, or presentations (up to 10 MB each) to organize them safely in your private vault.'}
            </p>
            {!isSharedView && (
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload First Document</span>
              </button>
            )}
          </div>
        ) : viewLayout === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {filteredDocuments.map((doc) => {
              const activeShareCount =
                doc.userShares.filter((s) => !s.revoked).length +
                doc.shareLinks.filter((l) => !l.revoked && new Date(l.expiresAt).getTime() > Date.now())
                  .length;
              return (
                <article
                  key={doc.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                          {isImageFormat(doc.format) ? (
                            <ImageIcon className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {doc.category} · {doc.format}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {doc.subtype}
                          </p>
                        </div>
                      </div>

                      {!isSharedView && (
                        <button
                          type="button"
                          onClick={() => updateDocument(doc.id, { isImportant: !doc.isImportant })}
                          aria-label={doc.isImportant ? 'Unpin important' : 'Pin as important'}
                          className={`p-1.5 rounded-lg ${
                            doc.isImportant ? 'text-orange-500' : 'text-slate-300 hover:text-orange-400'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${doc.isImportant ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>

                    <h4
                      onClick={() => onOpenPreview(doc, isSharedView)}
                      className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 cursor-pointer hover:text-blue-600"
                    >
                      {doc.title}
                    </h4>

                    {doc.description && (
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 space-y-0.5 tabular-nums">
                      <p>
                        {formatLockerBytes(doc.sizeBytes)} · Uploaded {formatLockerDate(doc.createdAt)}
                      </p>
                      {doc.tags.length > 0 && (
                        <p className="truncate text-slate-500">Tags: {doc.tags.join(', ')}</p>
                      )}
                      {activeShareCount > 0 && !isSharedView && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Active Sharing ({activeShareCount})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenPreview(doc, isSharedView)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <a
                      href={getContentUrl(doc.id, true)}
                      download={doc.fileName}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    {!isSharedView && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenShare(doc)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold inline-flex items-center gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditDocModal(doc)}
                          aria-label="Edit or move document"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {deleteDocConfirm === doc.id ? (
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteDocument(doc.id);
                              setDeleteDocConfirm(null);
                            }}
                            className="px-2 py-1 rounded-lg bg-red-600 text-white font-semibold"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteDocConfirm(doc.id)}
                            aria-label="Delete document"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Document</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Format</th>
                  <th className="py-3 px-4 font-semibold text-right">Size</th>
                  <th className="py-3 px-4 font-semibold text-right">Uploaded</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      <button
                        type="button"
                        onClick={() => onOpenPreview(doc, isSharedView)}
                        className="hover:text-blue-600 text-left"
                      >
                        {doc.title}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {doc.category} · {doc.subtype}
                    </td>
                    <td className="py-3 px-4 font-mono">{doc.format}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {formatLockerBytes(doc.sizeBytes)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-500">
                      {formatLockerDate(doc.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenPreview(doc, isSharedView)}
                          className="text-blue-600 font-semibold hover:underline"
                        >
                          Preview
                        </button>
                        {!isSharedView && (
                          <button
                            type="button"
                            onClick={() => onOpenShare(doc)}
                            className="text-slate-600 dark:text-slate-300 font-semibold hover:underline"
                          >
                            Share
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 overflow-y-auto p-4 flex items-center justify-center">
          <form
            onSubmit={handleUploadSubmit}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Upload Document to Private Vault
              </h3>
              <button type="button" onClick={() => setUploadModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <label className="block space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Select File (PDF, JPG, PNG, DOC, DOCX, PPT, PPTX · Max 10 MB) *
              </span>
              <input
                type="file"
                required={!uploadFile}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setUploadFile(f);
                  if (f && !uploadTitle) setUploadTitle(f.name.replace(/\.[^.]+$/, ''));
                }}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              {uploadFile && (
                <span className="text-emerald-600 font-semibold block tabular-nums">
                  Selected: {uploadFile.name} ({formatLockerBytes(uploadFile.size)})
                </span>
              )}
            </label>

            {uploadProgress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between font-semibold tabular-nums">
                  <span>Encrypting &amp; uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="sm:col-span-2 block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Document Title *
                </span>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Category</span>
                <select
                  value={uploadCat}
                  onChange={(e) => {
                    const nextCat = e.target.value as LockerCategory;
                    setUploadCat(nextCat);
                    setUploadSubtype(LOCKER_SUBTYPES_BY_CATEGORY[nextCat][0] || 'General');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {LOCKER_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Document Type
                </span>
                <select
                  value={uploadSubtype}
                  onChange={(e) => setUploadSubtype(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  {(LOCKER_SUBTYPES_BY_CATEGORY[uploadCat] || ['General']).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Folder (Optional)
                </span>
                <select
                  value={uploadFolderId}
                  onChange={(e) => setUploadFolderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="">Root Vault</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Academic Year
                </span>
                <input
                  type="text"
                  value={uploadYear}
                  onChange={(e) => setUploadYear(e.target.value)}
                  placeholder="e.g., 2025-26"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Semester</span>
                <input
                  type="text"
                  value={uploadSem}
                  onChange={(e) => setUploadSem(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Tags (comma separated)
                </span>
                <input
                  type="text"
                  value={uploadTagsText}
                  onChange={(e) => setUploadTagsText(e.target.value)}
                  placeholder="e.g., sem6, transcript, scholarship"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>

              <label className="sm:col-span-2 block space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Description / Notes
                </span>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Add helpful context (do not store passwords here)..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadImportant}
                  onChange={(e) => setUploadImportant(e.target.checked)}
                />
                <span>Pin as Important Document</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowContentIndexing}
                  onChange={(e) => setAllowContentIndexing(e.target.checked)}
                />
                <span>Allow text content search indexing (DOCX/PPTX only)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploadProgress !== null}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold"
            >
              {uploadProgress !== null ? 'Encrypting & Uploading...' : 'Encrypt & Save Document'}
            </button>
          </form>
        </div>
      )}

      {/* Create Folder Modal */}
      {folderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center">
          <form
            onSubmit={handleCreateFolderSubmit}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Create Smart Folder
              </h3>
              <button type="button" onClick={() => setFolderModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <input
              type="text"
              required
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name (e.g., Semester 6 Marksheets) *"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newFolderYear}
                onChange={(e) => setNewFolderYear(e.target.value)}
                placeholder="Academic Year"
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={newFolderSem}
                onChange={(e) => setNewFolderSem(e.target.value)}
                placeholder="Semester"
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <input
              type="text"
              value={newFolderCollege}
              onChange={(e) => setNewFolderCollege(e.target.value)}
              placeholder="College / University"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold"
            >
              Create Folder
            </button>
          </form>
        </div>
      )}

      {/* Camera Scanner Modal */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Scan Document with Camera
              </h3>
              <button type="button" onClick={stopCamera}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] rounded-xl bg-black object-cover"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl border border-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureScanPhoto}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold inline-flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Capture &amp; Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Rename / Move Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center">
          <form
            onSubmit={handleSaveDocEdit}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
                <FolderInput className="w-4 h-4 text-blue-600" />
                <span>Rename, Tag &amp; Move Document</span>
              </h3>
              <button type="button" onClick={() => setEditingDoc(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <input
              type="text"
              required
              value={editDocTitle}
              onChange={(e) => setEditDocTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <select
              value={editDocFolder}
              onChange={(e) => setEditDocFolder(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <option value="">Move to: Root Vault</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  Move to: {f.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={editDocTags}
              onChange={(e) => setEditDocTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <textarea
              rows={2}
              value={editDocDesc}
              onChange={(e) => setEditDocDesc(e.target.value)}
              placeholder="Document description..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renamingFolder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 flex items-center justify-center">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!renameFolderText.trim()) return;
              const ok = await renameFolder(renamingFolder.id, renameFolderText.trim());
              if (ok) setRenamingFolder(null);
            }}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Rename Folder
              </h3>
              <button type="button" onClick={() => setRenamingFolder(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <input
              type="text"
              required
              value={renameFolderText}
              onChange={(e) => setRenameFolderText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold"
            >
              Rename Folder
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
