import React, { useState, useRef } from 'react';
import {
  Send,
  FileText,
  Image as ImageIcon,
  FileUp,
  BookOpen,
  Mic,
  MicOff,
  Lightbulb,
  Calculator,
  PenTool,
  ClipboardCheck,
  FileSearch,
  Layers,
  GraduationCap,
  NotebookText,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';
import studyCompanionImg from '../../assets/images/kampus_ai_study_companion_1794549950125.jpg';
import { useKampusAi } from '../../context/KampusAiContext';
import { AiAttachment, AiToolId } from '../../types/kampusAi';
import { uploadAndExtractDocument } from '../../services/kampusAiService';
import { AiStatusBanner } from './AiStatusBanner';

export const AiHomeDashboard: React.FC = () => {
  const {
    setActiveTool,
    setToolDraftPrompt,
    toolDraftAttachments,
    setToolDraftAttachments,
    createNewConversation,
    getStudyHubSnapshot,
    history,
    reopenHistoryEntry,
  } = useKampusAi();

  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showStudyHubPicker, setShowStudyHubPicker] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const studyHubSnap = getStudyHubSnapshot();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    setUploadingFile(true);
    try {
      const att = await uploadAndExtractDocument(file);
      setToolDraftAttachments([...toolDraftAttachments, att]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to attach file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAttachStudyHubNote = (title: string, text: string) => {
    const att: AiAttachment = {
      id: `sh_${Date.now()}`,
      fileName: `${title} (Study Hub)`,
      kind: 'studyhub',
      mimeType: 'text/plain',
      extractedText: text,
    };
    setToolDraftAttachments([...toolDraftAttachments, att]);
    setShowStudyHubPicker(false);
  };

  const handleVoiceInput = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceNote('Voice dictation is not supported in this browser.');
      setTimeout(() => setVoiceNote(null), 3000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setVoiceNote('Voice recognition stopped or microphone permission denied.');
      setTimeout(() => setVoiceNote(null), 3000);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleLaunchChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && toolDraftAttachments.length === 0) return;
    createNewConversation(prompt.trim().slice(0, 42) || 'Study Chat');
    setToolDraftPrompt(prompt.trim() || 'Please analyze the attached study material.');
    setPrompt('');
    setActiveTool('chat');
  };

  const suggestedTools: Array<{
    id: AiToolId;
    title: string;
    desc: string;
    icon: React.ReactNode;
    accent: string;
  }> = [
    {
      id: 'explain',
      title: 'Explain a Topic',
      desc: 'Step-by-step concept breakdowns, formulas, real-life examples & common mistakes.',
      icon: <Lightbulb className="w-5 h-5 text-blue-600" />,
      accent: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      id: 'solver',
      title: 'Solve a Question',
      desc: 'Solve numericals, proofs & problems from text, images, or PDFs with step logic.',
      icon: <Calculator className="w-5 h-5 text-orange-500" />,
      accent: 'bg-orange-50 dark:bg-orange-950/50',
    },
    {
      id: 'notes',
      title: 'Create Study Notes',
      desc: 'Generate full, short revision, or exam-oriented notes and save to Study Hub.',
      icon: <PenTool className="w-5 h-5 text-emerald-600" />,
      accent: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      id: 'quiz',
      title: 'Generate a Quiz',
      desc: 'Build interactive MCQ, MSQ, True/False & Fill-in-Blank tests with scorecards.',
      icon: <ClipboardCheck className="w-5 h-5 text-blue-600" />,
      accent: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      id: 'documents',
      title: 'Summarize a PDF',
      desc: 'Upload PDF, DOCX, PPTX, TXT or images for summaries, Q&A & page references.',
      icon: <FileSearch className="w-5 h-5 text-orange-500" />,
      accent: 'bg-orange-50 dark:bg-orange-950/50',
    },
    {
      id: 'flashcards',
      title: 'Create Flashcards',
      desc: 'Generate flip cards from topics, notes, or PDFs with Learn & Difficult modes.',
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      accent: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      id: 'exam-prep',
      title: 'Exam Preparation',
      desc: 'Build exam timetables for Boards, JEE, NEET, CUET & university semesters.',
      icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
      accent: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      id: 'ask-notes',
      title: 'Ask from My Notes',
      desc: 'Query your saved Study Hub notes with source citations & extra AI explanations.',
      icon: <NotebookText className="w-5 h-5 text-orange-500" />,
      accent: 'bg-orange-50 dark:bg-orange-950/50',
    },
  ];

  return (
    <div className="space-y-6">
      <AiStatusBanner />

      {/* Hero Split Card */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                KAMPUS AI · Intelligent Student Learning Assistant
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-balance">
                Your Personal AI Study Companion
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Understand difficult concepts, create better notes, practice questions and prepare smarter with AI.
              </p>
            </div>

            {/* Main Interactive Prompt Composer */}
            <form onSubmit={handleLaunchChat} className="space-y-3">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-blue-600 focus-within:bg-white dark:focus-within:bg-slate-900 p-3 transition-colors">
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleLaunchChat(e);
                    }
                  }}
                  placeholder="Ask anything about your studies..."
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden resize-none"
                />

                {toolDraftAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {toolDraftAttachments.map((att) => (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[160px]">{att.fileName}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setToolDraftAttachments(
                              toolDraftAttachments.filter((x) => x.id !== att.id)
                            )
                          }
                          className="hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".docx,.pptx,.txt,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <input
                      ref={imgInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-400 whitespace-nowrap cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-orange-500" />
                      <span>Upload PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-400 whitespace-nowrap cursor-pointer"
                    >
                      <FileUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>Document</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => imgInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-400 whitespace-nowrap cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStudyHubPicker(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-400 whitespace-nowrap cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Study Hub</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap cursor-pointer ${
                        isListening
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                      }`}
                      title="Voice input"
                    >
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isListening ? 'Listening...' : 'Voice'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingFile || (!prompt.trim() && toolDraftAttachments.length === 0)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Start Learning</span>
                  </button>
                </div>
              </div>

              {(uploadError || voiceNote) && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {uploadError || voiceNote}
                </p>
              )}
            </form>
          </div>

          <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-800 min-h-[220px]">
            <img
              src={studyCompanionImg}
              alt="Indian student studying with laptop and textbook"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover max-h-80 lg:max-h-none"
            />
          </div>
        </div>
      </section>

      {/* 8 Specialized Learning Tools Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Specialized AI Learning Tools
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose a dedicated academic workspace tailored to what you need right now.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestedTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 text-left transition-all shadow-2xs flex flex-col justify-between gap-3 group cursor-pointer"
            >
              <div>
                <div className={`w-10 h-10 rounded-xl ${tool.accent} flex items-center justify-center mb-3`}>
                  {tool.icon}
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                  {tool.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {tool.desc}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>Open Tool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent AI Activity Preview */}
      {history.length > 0 && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Recent AI Learning Activities
            </h3>
            <button
              onClick={() => setActiveTool('history')}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              View All History →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {history.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => reopenHistoryEntry(item)}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/70 dark:border-slate-800 text-left transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-semibold text-orange-500">{item.category}</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Study Hub Material Picker Modal */}
      {showStudyHubPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-extrabold">Attach Study Hub Note or Material</h3>
              <button
                onClick={() => setShowStudyHubPicker(false)}
                className="p-1 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {studyHubSnap.notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleAttachStudyHubNote(n.title, n.content)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 text-left text-xs cursor-pointer"
                >
                  <div className="font-bold text-slate-900 dark:text-slate-100">{n.title}</div>
                  <div className="text-slate-500">Personal Note · {n.description}</div>
                </button>
              ))}
              {studyHubSnap.materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleAttachStudyHubNote(m.title, `${m.description}\n\n${m.previewContent}`)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 text-left text-xs cursor-pointer"
                >
                  <div className="font-bold text-slate-900 dark:text-slate-100">{m.title}</div>
                  <div className="text-slate-500">
                    {m.subjectName} · {m.category}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
