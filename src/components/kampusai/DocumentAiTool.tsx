import React, { useState, useEffect, useRef } from 'react';
import {
  FileSearch,
  Upload,
  Loader2,
  CheckCircle2,
  Bookmark,
  Check,
  PenTool,
  Layers,
  Send,
  FileText,
} from 'lucide-react';
import documentStudioImg from '../../assets/images/kampus_ai_document_studio_1794549950075.jpg';
import { useKampusAi } from '../../context/KampusAiContext';
import { AiAttachment, DocumentAnalysisOutput } from '../../types/kampusAi';
import { runStructuredAiTool, uploadAndExtractDocument } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';
import { MarkdownRenderer } from './MarkdownRenderer';

const ACTIONS = [
  'Summarize Document',
  'Explain Difficult Sections',
  'Extract Important Points',
  'Generate Chapter Notes',
  'Create Questions from Document',
  'Generate Flashcards',
  'Ask Questions about Document',
];

export const DocumentAiTool: React.FC = () => {
  const {
    preferences,
    addHistoryEntry,
    saveItem,
    pendingReopenData,
    clearPendingReopenData,
    launchToolWithPrefill,
  } = useKampusAi();

  const [doc, setDoc] = useState<AiAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selectedAction, setSelectedAction] = useState(ACTIONS[0]);
  const [userQuestion, setUserQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentAnalysisOutput | null>(null);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingReopenData?.toolId === 'documents') {
      const p = pendingReopenData.payload || {};
      if (p.result) setResult(p.result);
      if (p.fileName) {
        setDoc({
          id: 'hist_doc',
          fileName: p.fileName,
          kind: 'pdf',
          mimeType: 'application/pdf',
        });
      }
      clearPendingReopenData();
    }
  }, [pendingReopenData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    setError(null);
    setResult(null);
    setUploading(true);
    try {
      const processed = await uploadAndExtractDocument(file);
      setDoc(processed);
    } catch (err: any) {
      setDoc(null);
      setUploadError(err?.message || 'Unable to process uploaded document.');
    } finally {
      setUploading(false);
    }
  };

  const runDocumentAction = async (actionName: string) => {
    if (!doc) return;

    if (actionName === 'Generate Chapter Notes' && doc.extractedText) {
      launchToolWithPrefill('notes', {
        topic: doc.fileName.replace(/\.[^/.]+$/, ''),
        sourceText: doc.extractedText,
      });
      return;
    }

    if (actionName === 'Generate Flashcards' && doc.extractedText) {
      launchToolWithPrefill('flashcards', {
        topic: doc.fileName.replace(/\.[^/.]+$/, ''),
        sourceType: 'Uploaded Document',
        sourceText: doc.extractedText,
      });
      return;
    }

    setSelectedAction(actionName);
    setError(null);
    setLoading(true);
    setSaved(false);
    try {
      const data = await runStructuredAiTool<DocumentAnalysisOutput>('analyze-document', {
        fileName: doc.fileName,
        action: actionName,
        userQuestion: userQuestion.trim() || undefined,
        extractedText: doc.extractedText,
        base64Data: doc.base64Data,
        mimeType: doc.mimeType,
        language: preferences.language,
      });
      setResult(data);
      addHistoryEntry({
        category: 'PDF Summaries',
        toolId: 'documents',
        title: `${doc.fileName} · ${actionName}`,
        subtitle: data.keyPoints?.[0]?.slice(0, 60) || 'Document analysis completed',
        payload: { fileName: doc.fileName, result: data },
      });
    } catch (err: any) {
      setError(err?.message || 'Document analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AiStatusBanner
        compact={!error && !uploadError}
        errorOverride={error || uploadError}
        onRetry={() => doc && runDocumentAction(selectedAction)}
      />

      {/* Document Upload & Studio Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                PDF & Document Study AI
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload PDF, DOCX, PPTX, TXT or images (max 10 MB) for grounded summaries & citations.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp"
            onChange={handleUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 transition-colors text-center space-y-2 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto" />
            ) : (
              <Upload className="w-7 h-7 text-blue-600 mx-auto" />
            )}
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {uploading
                ? 'Validating and extracting document contents...'
                : doc
                ? `Uploaded: ${doc.fileName} (Click to replace)`
                : 'Choose PDF, DOCX, PPTX, TXT or Image'}
            </div>
            <p className="text-xs text-slate-500">
              Real server-side parsing validates headers, text & page/slide counts.
            </p>
          </button>

          {doc && (
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Ready · {doc.fileName}
                  {doc.pageOrSlideCount ? ` · ${doc.pageOrSlideCount} pages/slides` : ''}
                </span>
              </div>
              <span className="text-emerald-700 dark:text-emerald-300 uppercase font-mono">
                {doc.kind}
              </span>
            </div>
          )}

          {/* Action Buttons (disabled until document ready) */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Document Actions
            </div>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={!doc || loading}
                  onClick={() => {
                    if (action === 'Ask Questions about Document') {
                      setSelectedAction(action);
                    } else {
                      runDocumentAction(action);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                    selectedAction === action && doc
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (userQuestion.trim()) {
                runDocumentAction('Ask Questions about Document');
              }
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              disabled={!doc || loading}
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder={
                doc
                  ? `Ask a specific question about ${doc.fileName}...`
                  : 'Upload a document first to ask questions...'
              }
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!doc || loading || !userQuestion.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Ask Doc</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-800 min-h-[220px]">
          <img
            src={documentStudioImg}
            alt="Study notebook sheets, equations and digital tablet workspace"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover max-h-96 lg:max-h-none"
          />
        </div>
      </div>

      {/* Document Output */}
      {result && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {result.title}
              </h3>
              <p className="text-xs text-slate-500">
                Action: {selectedAction} {doc ? `· ${doc.fileName}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.markdownOutput && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      launchToolWithPrefill('notes', {
                        topic: result.title,
                        sourceText: result.markdownOutput,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Turn into Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      launchToolWithPrefill('flashcards', {
                        topic: result.title,
                        sourceType: 'Uploaded Document',
                        sourceText: result.markdownOutput,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Turn into Flashcards</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  saveItem({
                    collection: 'Summaries',
                    title: result.title,
                    summary: `${selectedAction} · ${doc?.fileName || 'Document'}`,
                    toolId: 'documents',
                    data: { fileName: doc?.fileName, result },
                  });
                  setSaved(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
              >
                {saved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-orange-500" />}
                <span>{saved ? 'Saved Summary' : 'Save Summary'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
              <MarkdownRenderer content={result.markdownOutput} />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  Key Takeaways
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc ml-4">
                  {result.keyPoints.map((kp, i) => (
                    <li key={i}>{kp}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-800/50 space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Page & Slide References</span>
                </h4>
                {result.references.length === 0 ? (
                  <p className="text-xs text-slate-500">General document synthesis.</p>
                ) : (
                  <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200 list-disc ml-4">
                    {result.references.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
