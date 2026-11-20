import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Camera,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Music,
  NotebookPen,
  RefreshCw,
  X,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { formatBytes } from '../../data/chatData';
import { ChatAttachmentMeta } from '../../types/chat';

interface AttachmentCenterModalProps {
  isOpen: boolean;
  conversationId: string;
  onClose: () => void;
}

const MAX_BYTES = 5 * 1024 * 1024;

export const AttachmentCenterModal: React.FC<AttachmentCenterModalProps> = ({
  isOpen,
  conversationId,
  onClose,
}) => {
  const { uploadAttachment, sendMessage } = useChat();

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<'upload' | 'studyhub' | 'notesexchange' | 'link'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // Link fields
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  const cameraSupported =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

  // Pull real items from Study Hub & Notes Exchange localStorage
  const studyHubItems = useMemo(() => {
    try {
      const raw = localStorage.getItem('kampus_studyhub_state_v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const notes = Array.isArray(parsed.personalNotes) ? parsed.personalNotes : [];
      const materials = Array.isArray(parsed.materials) ? parsed.materials : [];
      return [
        ...notes.slice(0, 4).map((n: any) => ({
          id: n.id,
          title: n.title,
          type: 'Notes' as const,
          subject: 'Study Hub Note',
          summary: n.description || String(n.content || '').slice(0, 100),
        })),
        ...materials.slice(0, 4).map((m: any) => ({
          id: m.id,
          title: m.title,
          type: 'Study Guide' as const,
          subject: m.subjectName || 'Study Hub',
          summary: m.description || '',
        })),
      ];
    } catch {
      return [];
    }
  }, [isOpen]);

  const notesExchangeItems = useMemo<
    Array<{ id: string; title: string; subject: string; summary: string }>
  >(() => {
    try {
      const raw = localStorage.getItem('kampus_notes_exchange_state_v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed.notes) ? parsed.notes : [];
      return list.slice(0, 6).map((n: any) => ({
        id: String(n.id || ''),
        title: String(n.title || 'Untitled Note'),
        subject: String(n.subject || 'Notes Exchange'),
        summary: String(n.description || `${n.course || ''} · ${n.category || ''}`),
      }));
    } catch {
      return [];
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectFile = (file: File) => {
    setUploadErr(null);
    setProgress(0);
    if (file.size > MAX_BYTES) {
      setUploadErr(`"${file.name}" exceeds the 5 MB limit.`);
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewDataUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleUploadAndSend = async () => {
    if (!selectedFile || !previewDataUrl) return;
    setUploading(true);
    setUploadErr(null);
    setProgress(5);

    const kind: ChatAttachmentMeta['kind'] = selectedFile.type.startsWith('image/')
      ? 'image'
      : selectedFile.type.startsWith('audio/')
        ? 'audio'
        : 'document';

    try {
      const meta = await uploadAttachment(
        {
          conversationId,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'application/octet-stream',
          base64Data: previewDataUrl,
          kind,
        },
        (pct) => setProgress(pct),
        (cancelFn) => {
          cancelRef.current = cancelFn;
        }
      );

      const ok = await sendMessage({
        conversationId,
        kind: kind === 'audio' ? 'voice' : kind,
        text: caption.trim() || selectedFile.name,
        attachment: meta,
      });

      if (ok) {
        setSelectedFile(null);
        setPreviewDataUrl(null);
        setCaption('');
        onClose();
      }
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    const normalized = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    await sendMessage({
      conversationId,
      kind: 'link',
      text: linkTitle.trim() || normalized,
      linkUrl: normalized,
      linkTitle: linkTitle.trim() || normalized,
    });
    setLinkUrl('');
    setLinkTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Attachment Center</h2>
          <button
            type="button"
            onClick={() => {
              cancelRef.current?.();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Tabs */}
        <div className="px-5 pt-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {(
            [
              ['upload', 'Files & Media'],
              ['studyhub', 'Study Hub'],
              ['notesexchange', 'Notes Exchange'],
              ['link', 'Share Link'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer ${
                tab === id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {tab === 'upload' && (
            <>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
                className="hidden"
              />
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
                className="hidden"
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => e.target.files?.[0] && handleSelectFile(e.target.files[0])}
                className="hidden"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Photos
                </button>
                {cameraSupported && (
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Camera className="w-5 h-5 text-orange-500" />
                    Camera
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Documents
                </button>
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <Music className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Audio Files
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG, and Audio up to 5 MB.
              </p>

              {uploadErr && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2 flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                  <span>{uploadErr}</span>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleUploadAndSend}
                      className="inline-flex items-center gap-1 font-semibold underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  )}
                </div>
              )}

              {selectedFile && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3.5 space-y-3">
                  {selectedFile.type.startsWith('image/') && previewDataUrl && (
                    <img
                      src={previewDataUrl}
                      alt={selectedFile.name}
                      className="max-h-48 rounded-lg object-contain mx-auto"
                    />
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-slate-500 tabular-nums shrink-0">
                      {formatBytes(selectedFile.size)}
                    </span>
                  </div>

                  {uploading && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                        <span>Uploading {progress}%</span>
                        <button
                          type="button"
                          onClick={() => cancelRef.current?.()}
                          className="text-red-500 font-semibold cursor-pointer"
                        >
                          Cancel upload
                        </button>
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption (optional)..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewDataUrl(null);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs text-slate-500 cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={handleUploadAndSend}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {uploading ? 'Uploading...' : 'Send Attachment'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'studyhub' && (
            <div className="space-y-2.5">
              {studyHubItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Open Study Hub first to sync your subjects &amp; personal notes, or add custom study links.
                </p>
              ) : (
                studyHubItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {item.subject}
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await sendMessage({
                          conversationId,
                          kind: 'study-resource',
                          text: `Shared from Study Hub: ${item.title}`,
                          studyResource: {
                            sourceModule: 'Study Hub',
                            resourceType: item.type,
                            title: item.title,
                            subject: item.subject,
                            summary: item.summary,
                            route: '/learn/study-hub',
                          },
                        });
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'notesexchange' && (
            <div className="space-y-2.5">
              {notesExchangeItems.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Visit Notes Exchange to browse or upload peer notes, then share them directly into any chat.
                </p>
              ) : (
                notesExchangeItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-orange-500">{item.subject}</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await sendMessage({
                          conversationId,
                          kind: 'study-resource',
                          text: `Shared from Notes Exchange: ${item.title}`,
                          studyResource: {
                            sourceModule: 'Notes Exchange',
                            resourceType: 'Notes',
                            title: item.title,
                            subject: item.subject,
                            summary: item.summary,
                            route: '/learn/notes-exchange',
                          },
                        });
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      <NotebookPen className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'link' && (
            <form onSubmit={handleShareLink} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Title (Optional)
                </label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. Lecture 7 Reference Slides"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" /> Send Link
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
