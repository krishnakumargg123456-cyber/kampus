import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Bold,
  Code,
  Eye,
  FileUp,
  Italic,
  List,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  ACADEMIC_LEVELS,
  QUESTION_SUBJECTS,
} from '../../data/communityData';
import {
  CommunityAttachment,
  CommunityPost,
  CommunityPostDraft,
  PostType,
  QuestionSubject,
} from '../../types/community';
import { useCommunity } from '../../context/CommunityContext';
import { formatFileSize, readAttachmentFile } from './communityUtils';
import { MarkdownRenderer } from '../kampusai/MarkdownRenderer';

const POST_TYPES: PostType[] = [
  'General Discussion',
  'Ask a Question',
  'Share Study Tips',
  'Share an Achievement',
  'Share a Resource',
  'Academic Announcement',
];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'discussion' | 'question';
  defaultCommunityId?: string;
  editingPost?: CommunityPost | null;
  loadingDraft?: CommunityPostDraft | null;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'discussion',
  defaultCommunityId,
  editingPost,
  loadingDraft,
}) => {
  const {
    state,
    getUserRoleInCommunity,
    createPost,
    updatePost,
    saveDraft,
    deleteDraft,
    askAiHelper,
    showToast,
  } = useCommunity();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [communityId, setCommunityId] = useState(
    defaultCommunityId || state.communities[0]?.id || 'comm_cs_students'
  );
  const [type, setType] = useState<PostType>(
    defaultMode === 'question' ? 'Ask a Question' : 'General Discussion'
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState<QuestionSubject>('Computer Science');
  const [academicLevel, setAcademicLevel] = useState<string>(ACADEMIC_LEVELS[1]);
  const [topicTag, setTopicTag] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [attachment, setAttachment] = useState<CommunityAttachment | undefined>(undefined);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Poll fields
  const [hasPoll, setHasPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);
  const [pollExpiresAt, setPollExpiresAt] = useState('');

  // Resource fields
  const [linkedResourceType, setLinkedResourceType] = useState<'Notes' | 'Book' | 'Guide' | 'PYQ'>('Notes');
  const [linkedResourceTitle, setLinkedResourceTitle] = useState('');

  // Preview & AI helper
  const [previewMode, setPreviewMode] = useState(false);
  const [aiWorking, setAiWorking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPreviewMode(false);
    setFormError(null);
    setUploadError(null);
    setAiError(null);

    if (editingPost) {
      setCommunityId(editingPost.communityId);
      setType(editingPost.type);
      setTitle(editingPost.title);
      setContent(editingPost.content);
      setSubject(editingPost.subject || 'Computer Science');
      setAcademicLevel(editingPost.academicLevel || ACADEMIC_LEVELS[1]);
      setTopicTag(editingPost.topicTag || '');
      setTagsInput(editingPost.tags.join(', '));
      setAttachment(editingPost.attachment);
      setHasPoll(false);
      setLinkedResourceType(editingPost.linkedResourceType || 'Notes');
      setLinkedResourceTitle(editingPost.linkedResourceTitle || '');
    } else if (loadingDraft) {
      setCommunityId(loadingDraft.communityId);
      setType(loadingDraft.type);
      setTitle(loadingDraft.title);
      setContent(loadingDraft.content);
      setSubject(loadingDraft.subject || 'Computer Science');
      setAcademicLevel(loadingDraft.academicLevel || ACADEMIC_LEVELS[1]);
      setTopicTag(loadingDraft.topicTag || '');
      setTagsInput(loadingDraft.tags.join(', '));
      setAttachment(loadingDraft.attachment);
      setHasPoll(Boolean(loadingDraft.hasPoll));
      setPollQuestion(loadingDraft.pollQuestion || '');
      setPollOptions(
        loadingDraft.pollOptions && loadingDraft.pollOptions.length >= 2
          ? loadingDraft.pollOptions
          : ['', '']
      );
      setPollAllowMultiple(Boolean(loadingDraft.pollAllowMultiple));
      setPollExpiresAt(loadingDraft.pollExpiresAt || '');
      setLinkedResourceType(loadingDraft.linkedResourceType || 'Notes');
      setLinkedResourceTitle(loadingDraft.linkedResourceTitle || '');
    } else {
      setCommunityId(defaultCommunityId || state.communities[0]?.id || 'comm_cs_students');
      setType(defaultMode === 'question' ? 'Ask a Question' : 'General Discussion');
      setTitle('');
      setContent('');
      setSubject('Computer Science');
      setAcademicLevel(ACADEMIC_LEVELS[1]);
      setTopicTag('');
      setTagsInput('');
      setAttachment(undefined);
      setHasPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollAllowMultiple(false);
      setPollExpiresAt('');
      setLinkedResourceType('Notes');
      setLinkedResourceTitle('');
    }
  }, [isOpen, defaultMode, defaultCommunityId, editingPost, loadingDraft, state.communities]);

  if (!isOpen) return null;

  const userRole = getUserRoleInCommunity(communityId);
  const canAnnounce = userRole === 'Owner' || userRole === 'Moderator';

  const insertFormat = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => `${prev}${prefix}text${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end) || 'text';
    const next = `${content.slice(0, start)}${prefix}${selected}${suffix}${content.slice(end)}`;
    setContent(next);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await readAttachmentFile(file);
    if (res.error) {
      setUploadError(res.error);
    } else if (res.attachment) {
      setAttachment(res.attachment);
    }
    e.target.value = '';
  };

  const parsedTags = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const handleImproveWithAi = async () => {
    if (!content.trim() && !title.trim()) {
      setAiError('Write a draft title or description first so KAMPUS AI can refine it.');
      return;
    }
    setAiWorking(true);
    setAiError(null);
    const res = await askAiHelper(
      'improve-clarity',
      `Title: ${title}\n\nBody:\n${content}`
    );
    setAiWorking(false);
    if (res.error) {
      setAiError(res.error);
    } else if (res.text) {
      setContent(res.text);
      showToast('Post text refined with KAMPUS AI.');
    }
  };

  const handleSaveDraft = () => {
    saveDraft({
      id: loadingDraft?.id,
      communityId,
      type,
      title: title || 'Untitled draft',
      content,
      subject: type === 'Ask a Question' || type === 'Share a Resource' ? subject : undefined,
      academicLevel: type === 'Ask a Question' ? academicLevel : undefined,
      topicTag,
      tags: parsedTags,
      attachment,
      hasPoll,
      pollQuestion,
      pollOptions,
      pollAllowMultiple,
      pollExpiresAt,
      linkedResourceType: type === 'Share a Resource' ? linkedResourceType : undefined,
      linkedResourceTitle: type === 'Share a Resource' ? linkedResourceTitle : undefined,
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (title.trim().length < 5) {
      setFormError('Please provide a clear title (at least 5 characters).');
      return;
    }
    if (content.trim().length < 10) {
      setFormError('Please add details or context in the post body (at least 10 characters).');
      return;
    }
    if (hasPoll) {
      const validOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (!pollQuestion.trim() || validOpts.length < 2) {
        setFormError('A poll needs a question and at least 2 options.');
        return;
      }
    }

    if (editingPost) {
      updatePost(editingPost.id, {
        title: title.trim(),
        content: content.trim(),
        tags: parsedTags.map((t) => (t.startsWith('#') ? t : `#${t}`)),
        subject: type === 'Ask a Question' || type === 'Share a Resource' ? subject : undefined,
        topicTag: topicTag.trim() || undefined,
        academicLevel: type === 'Ask a Question' ? academicLevel : undefined,
      });
    } else {
      createPost({
        communityId,
        type,
        title,
        content,
        subject: type === 'Ask a Question' || type === 'Share a Resource' ? subject : undefined,
        academicLevel: type === 'Ask a Question' ? academicLevel : undefined,
        topicTag,
        tags: parsedTags,
        attachment,
        hasPoll,
        pollQuestion,
        pollOptions,
        pollAllowMultiple,
        pollExpiresAt,
        linkedResourceType: type === 'Share a Resource' ? linkedResourceType : undefined,
        linkedResourceTitle: type === 'Share a Resource' ? linkedResourceTitle : undefined,
      });
      if (loadingDraft) {
        deleteDraft(loadingDraft.id);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingPost
                ? 'Edit Post'
                : type === 'Ask a Question'
                  ? 'Ask an Academic Question'
                  : 'Create Community Post'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share clear context so peers can give accurate, helpful responses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                previewMode
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {formError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          {!previewMode ? (
            <>
              {/* Community & Post Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Community
                  </label>
                  <select
                    disabled={Boolean(editingPost)}
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    {state.communities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Post Type
                  </label>
                  <select
                    disabled={Boolean(editingPost)}
                    value={type}
                    onChange={(e) => setType(e.target.value as PostType)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    {POST_TYPES.map((pt) => (
                      <option
                        key={pt}
                        value={pt}
                        disabled={pt === 'Academic Announcement' && !canAnnounce}
                      >
                        {pt}
                        {pt === 'Academic Announcement' && !canAnnounce ? ' (Moderators only)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject / Level / Topic for Q&A or Resources */}
              {(type === 'Ask a Question' || type === 'Share a Resource' || type === 'Share Study Tips') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value as QuestionSubject)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {QUESTION_SUBJECTS.map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </div>

                  {type === 'Ask a Question' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Academic Level
                      </label>
                      <select
                        value={academicLevel}
                        onChange={(e) => setAcademicLevel(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {ACADEMIC_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Topic / Chapter
                    </label>
                    <input
                      type="text"
                      value={topicTag}
                      onChange={(e) => setTopicTag(e.target.value)}
                      placeholder="e.g. Dynamic Programming"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Resource Metadata */}
              {type === 'Share a Resource' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Resource Format
                    </label>
                    <select
                      value={linkedResourceType}
                      onChange={(e) =>
                        setLinkedResourceType(e.target.value as 'Notes' | 'Book' | 'Guide' | 'PYQ')
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    >
                      <option value="Notes">Study Notes</option>
                      <option value="Guide">Revision Guide</option>
                      <option value="Book">Reference Book</option>
                      <option value="PYQ">Previous Year Paper</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Resource Title (for Study Hub export)
                    </label>
                    <input
                      type="text"
                      value={linkedResourceTitle}
                      onChange={(e) => setLinkedResourceTitle(e.target.value)}
                      placeholder="e.g. Linear Algebra Eigenvalues Cheat Sheet"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    type === 'Ask a Question'
                      ? 'State your question clearly with the core concept...'
                      : 'Write a clear, informative headline...'
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Formatting Toolbar + Body */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Description & Context
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertFormat('**', '**')}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormat('*', '*')}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormat('`', '`')}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Inline Code"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormat('\n- ', '')}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Bullet point"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleImproveWithAi}
                      disabled={aiWorking}
                      className="ml-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiWorking ? 'Refining...' : 'Improve Clarity (AI)'}
                    </button>
                  </div>
                </div>

                {aiError && (
                  <p className="mb-1.5 text-xs text-orange-600 dark:text-orange-400">{aiError}</p>
                )}

                <textarea
                  ref={textareaRef}
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Include what you tried, formulas ($E = mc^2$), or key steps. Markdown and code blocks are supported."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Algorithms, ExamPrep, Sem5"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Attachment & Poll Toggles */}
              {!editingPost && (
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.txt,.md,.docx,.pptx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Attach Image / File
                  </button>

                  <button
                    type="button"
                    onClick={() => setHasPoll((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                      hasPoll
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    {hasPoll ? 'Remove Poll' : 'Add Poll'}
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
              )}

              {attachment && (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                    Attached: {attachment.fileName} ({formatFileSize(attachment.sizeBytes)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachment(undefined)}
                    className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Poll Builder */}
              {hasPoll && !editingPost && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Poll Configuration
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pollAllowMultiple}
                        onChange={(e) => setPollAllowMultiple(e.target.checked)}
                        className="accent-blue-600"
                      />
                      Allow multiple selections
                    </label>
                  </div>

                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Poll question..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  />

                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            setPollOptions((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                          }
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPollOptions((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {pollOptions.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions((prev) => [...prev, ''])}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add option
                      </button>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Optional close date:</span>
                      <input
                        type="date"
                        value={pollExpiresAt}
                        onChange={(e) => setPollExpiresAt(e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {type} · {state.communities.find((c) => c.id === communityId)?.name}
                {subject ? ` · ${subject}` : ''}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {title || 'Untitled post'}
              </h3>
              <div className="text-sm text-slate-700 dark:text-slate-200">
                <MarkdownRenderer content={content || '_No content yet._'} />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              {!editingPost && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
              >
                {editingPost ? 'Save Changes' : type === 'Ask a Question' ? 'Post Question' : 'Publish Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
