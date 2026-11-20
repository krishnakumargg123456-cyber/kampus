import React, { useState } from 'react';
import {
  CheckCircle2,
  Eye,
  FileText,
  Lock,
  Paperclip,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useStudentVoice } from '../../context/StudentVoiceContext';
import { CAMPUS_DEPARTMENTS, FEEDBACK_TYPES } from '../../data/studentVoiceData';
import type {
  FeedbackType,
  PrivacyMode,
  VoiceAttachment,
  VoiceSubmission,
} from '../../types/studentVoice';

interface Props {
  initialFeedbackType?: FeedbackType;
  onSubmittedNavigate: (sub: VoiceSubmission) => void;
}

export const SubmitFeedbackAndComplaintView: React.FC<Props> = ({
  initialFeedbackType = 'General Feedback',
  onSubmittedNavigate,
}) => {
  const {
    categories,
    uploadAttachment,
    createSubmission,
    runVoiceAiAssistant,
    showToast,
  } = useStudentVoice();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>(initialFeedbackType);
  const [title, setTitle] = useState('');
  const [categoryGroup, setCategoryGroup] = useState<string>(
    categories[0]?.groupName || 'Academic'
  );
  const [categoryItem, setCategoryItem] = useState<string>(
    categories[0]?.items[0] || 'Teaching Quality'
  );
  const [department, setDepartment] = useState<string>(CAMPUS_DEPARTMENTS[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [incidentDateISO, setIncidentDateISO] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>('Identified');
  const [attachments, setAttachments] = useState<VoiceAttachment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmedReceipt, setConfirmedReceipt] = useState<VoiceSubmission | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // KAMPUS AI Clarity Assistant
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHelpResult, setAiHelpResult] = useState<{
    reply: string;
    sourceLabel: string;
  } | null>(null);

  const selectedGroupObj =
    categories.find((c) => c.groupName === categoryGroup) || categories[0];

  const handleGroupChange = (grpName: string) => {
    setCategoryGroup(grpName);
    const found = categories.find((c) => c.groupName === grpName);
    if (found && found.items.length > 0) {
      setCategoryItem(found.items[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadAttachment(file, false);
    if (uploaded) {
      setAttachments((prev) => [...prev, uploaded]);
    }
    e.target.value = '';
  };

  const handleRunAiHelp = async (
    mode: 'organize-complaint' | 'suggest-category' | 'improve-clarity'
  ) => {
    if (!description.trim() && !title.trim()) {
      showToast('info', 'Enter a draft title or description first so KAMPUS AI can help.');
      return;
    }
    setAiBusy(true);
    try {
      const res = await runVoiceAiAssistant(
        mode,
        `${title}\n${description}`.trim()
      );
      setAiHelpResult(res);
    } finally {
      setAiBusy(false);
    }
  };

  const handleSubmit = async (saveAsDraft: boolean) => {
    if (!title.trim() || !description.trim()) {
      showToast('error', 'Submission title and detailed description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createSubmission({
        title,
        feedbackType,
        categoryGroup,
        categoryItem,
        department,
        description,
        location,
        incidentDateISO: incidentDateISO || undefined,
        desiredOutcome,
        privacyMode,
        attachments,
        saveAsDraft,
      });
      if (created) {
        setConfirmedReceipt(created);
        setShowPreview(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedReceipt) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 space-y-5">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-7 h-7" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              {confirmedReceipt.status === 'Draft' ? 'Draft Saved' : 'Backend Confirmed'}
            </div>
            <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
              Reference: {confirmedReceipt.referenceNumber}
            </h2>
          </div>
        </div>
        <p className="text-sm text-[#64748B] dark:text-slate-300">
          Your <strong>{confirmedReceipt.feedbackType}</strong> ("{confirmedReceipt.title}") has been saved to{' '}
          <strong>{confirmedReceipt.department}</strong> under <strong>{confirmedReceipt.privacyMode}</strong> privacy settings.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSubmittedNavigate(confirmedReceipt)}
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold cursor-pointer"
          >
            View Submission & Timeline
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmedReceipt(null);
              setTitle('');
              setDescription('');
              setLocation('');
              setDesiredOutcome('');
              setAttachments([]);
              setAiHelpResult(null);
            }}
            className="px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-[#172033] dark:text-slate-100">
            Submit Feedback, Complaint or Suggestion
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Select feedback type, campus department, and privacy mode before submitting.
          </p>
        </div>

        {/* Feedback Type Selector */}
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TYPES.map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => setFeedbackType(ft)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                feedbackType === ft
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-[#F8FAFC] dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>

        {/* Form Fields */}
        <div className="space-y-4 text-xs">
          <label className="block space-y-1">
            <span className="font-semibold text-[#172033] dark:text-slate-200">
              Submission Title *
            </span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Concise summary of the feedback, complaint, or improvement..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="font-semibold">Category Group *</span>
              <select
                value={categoryGroup}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {categories.map((grp) => (
                  <option key={grp.id} value={grp.groupName}>
                    {grp.groupName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="font-semibold">Subcategory *</span>
              <select
                value={categoryItem}
                onChange={(e) => setCategoryItem(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {(selectedGroupObj?.items || []).map((it) => (
                  <option key={it} value={it}>
                    {it}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="font-semibold">Responsible Department *</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {CAMPUS_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="font-semibold">Detailed Description *</span>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what happened or what should be improved clearly and factually..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="font-semibold">Relevant Location</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Library Floor 2 / Hostel 14"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>

            <label className="space-y-1">
              <span className="font-semibold">Date of Incident (if applicable)</span>
              <input
                type="date"
                value={incidentDateISO}
                onChange={(e) => setIncidentDateISO(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>

            <label className="space-y-1">
              <span className="font-semibold">Desired Outcome</span>
              <input
                type="text"
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                placeholder="e.g., Repair router / extend access"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </label>
          </div>

          {/* Evidence Upload */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-[#172033] dark:text-slate-100">
                Supporting Evidence Attachment (PDF, PNG, JPG, WEBP — max 5 MB)
              </div>
              <div className="text-[#64748B]">
                {attachments.length === 0
                  ? 'No files attached'
                  : attachments.map((a) => a.fileName).join(', ')}
              </div>
            </div>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach File</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => void handleFileChange(e)}
                className="hidden"
              />
            </label>
          </div>

          {/* Privacy Mode Options + Explicit Disclosures */}
          <div className="space-y-2.5 pt-2">
            <div className="font-bold text-[#172033] dark:text-slate-100 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Privacy & Identity Mode</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {(
                [
                  [
                    'Identified',
                    'Your authorized KAMPUS name and account are visible to assigned reviewers.',
                  ],
                  [
                    'Confidential',
                    'Identity hidden from Department Admins, ordinary reviewers, and students; unsealed only for Platform / Institution Admins.',
                  ],
                  [
                    'Anonymous',
                    'Submitted without storing student name/email on the record. Technical/network logs may still exist per institutional IT policy.',
                  ],
                ] as const
              ).map(([mode, desc]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPrivacyMode(mode)}
                  className={`p-3 rounded-xl border text-left space-y-1 cursor-pointer ${
                    privacyMode === mode
                      ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/50'
                  }`}
                >
                  <div className="font-bold text-[#172033] dark:text-slate-100">{mode}</div>
                  <div className="text-[11px] text-[#64748B] dark:text-slate-400 leading-relaxed">
                    {desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Privacy disclosure: While Confidential and Anonymous options strip or mask your profile from reviewers, institutional server access logs or legally mandated safety investigations can still apply. Never upload unverified accusations or private third-party data.
              </span>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-[#2563EB] space-y-2 text-xs">
            <div className="font-bold text-[#2563EB]">
              Preview · {feedbackType} · {privacyMode}
            </div>
            <div className="text-sm font-bold text-[#172033] dark:text-slate-100">
              {title || '(No title)'}
            </div>
            <div className="text-[#64748B]">
              {categoryGroup} / {categoryItem} · Department: {department}
            </div>
            <p className="text-[#172033] dark:text-slate-200 whitespace-pre-wrap">{description}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit(false)}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Confirm & Submit'}
          </button>
        </div>
      </div>

      {/* KAMPUS AI Clarity Assistant */}
      <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-sm text-[#2563EB]">
          <Sparkles className="w-4 h-4" />
          <span>KAMPUS AI Writing Helper</span>
        </div>
        <p className="text-[#64748B] dark:text-slate-400 leading-relaxed">
          Organize your concern or suggestion clearly before submitting. AI never invents evidence or submits anything automatically.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={aiBusy}
            onClick={() => void handleRunAiHelp('organize-complaint')}
            className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left font-semibold hover:border-[#2563EB] cursor-pointer"
          >
            Structure & Organize Description
          </button>
          <button
            type="button"
            disabled={aiBusy}
            onClick={() => void handleRunAiHelp('suggest-category')}
            className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left font-semibold hover:border-[#2563EB] cursor-pointer"
          >
            Suggest Matching Category & Department
          </button>
          <button
            type="button"
            disabled={aiBusy}
            onClick={() => void handleRunAiHelp('improve-clarity')}
            className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left font-semibold hover:border-[#2563EB] cursor-pointer"
          >
            Review Clarity Without Altering Meaning
          </button>
        </div>

        {aiHelpResult && (
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-[#2563EB]">{aiHelpResult.sourceLabel}</div>
            <pre className="whitespace-pre-wrap font-sans text-[#172033] dark:text-slate-200 leading-relaxed">
              {aiHelpResult.reply}
            </pre>
            <button
              type="button"
              onClick={() => {
                setDescription((prev) =>
                  prev ? `${prev}\n\n${aiHelpResult.reply}` : aiHelpResult.reply
                );
              }}
              className="text-[#2563EB] font-semibold hover:underline cursor-pointer"
            >
              Insert into Description Draft (Review Before Submit)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
