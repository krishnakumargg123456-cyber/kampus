import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  NoteEducationLevel,
  NoteFormat,
  NoteRequestItem,
  NotesExchangeState,
  NotesExchangeTab,
  SharedNoteAttachment,
  SharedNoteItem,
} from '../types/notesExchange';
import {
  INITIAL_NOTES_EXCHANGE_STATE,
  NOTES_EXCHANGE_IMAGES,
} from '../data/notesExchangeData';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { INITIAL_STUDY_HUB_STATE } from '../data/studyHubData';
import { PersonalNote, StudyHubState } from '../types/studyHub';
import { AiToolId } from '../types/kampusAi';

const STORAGE_KEY = 'kampus_notes_exchange_state_v1';
const NOTES_EXCHANGE_DRAFT_KEY = 'kampus_notes_exchange_draft_v1';
const STUDY_HUB_STORAGE_KEY = 'kampus_studyhub_state_v1';
const AI_HANDOFF_KEY = 'kampus_ai_handoff_v1';

export interface UploadNotePayload {
  title: string;
  course: string;
  subjectArea: string;
  semesterOrTerm: string;
  level: NoteEducationLevel;
  format: NoteFormat;
  summary: string;
  content: string;
  tags: string[];
  pagesCount: number;
  attachment?: SharedNoteAttachment;
  fulfillRequestId?: string;
}

export interface CreateRequestPayload {
  title: string;
  course: string;
  semesterOrTerm: string;
  level: NoteEducationLevel;
  details: string;
  bountyKarma: number;
}

export interface PendingDraftData {
  title: string;
  course: string;
  content: string;
  source?: 'ai' | 'request';
  fulfillRequestId?: string;
  bountyKarma?: number;
}

interface NotesExchangeContextType {
  state: NotesExchangeState;
  activeTab: NotesExchangeTab;
  setActiveTab: (tab: NotesExchangeTab) => void;
  selectedNote: SharedNoteItem | null;
  setSelectedNoteId: (id: string | null) => void;
  isUploadModalOpen: boolean;
  openUploadModal: (prefill?: Partial<PendingDraftData>) => void;
  closeUploadModal: () => void;
  pendingDraft: PendingDraftData | null;
  clearPendingDraft: () => void;
  toastMessage: { text: string; tone: 'success' | 'info' | 'warning' } | null;
  dismissToast: () => void;
  showToast: (text: string, tone?: 'success' | 'info' | 'warning') => void;

  // Core Actions
  publishNote: (payload: UploadNotePayload) => SharedNoteItem;
  updateOwnNote: (
    noteId: string,
    updates: Partial<
      Pick<SharedNoteItem, 'title' | 'course' | 'semesterOrTerm' | 'format' | 'summary' | 'content' | 'tags'>
    >
  ) => void;
  deleteOwnNote: (noteId: string) => void;
  downloadNote: (note: SharedNoteItem) => void;
  toggleSaveNote: (noteId: string) => void;
  submitReview: (noteId: string, rating: number, comment: string) => void;
  reportNote: (noteId: string, reason: string) => void;

  // Requests & Bounties
  createRequest: (payload: CreateRequestPayload) => void;
  toggleUpvoteRequest: (requestId: string) => void;

  // Cross-module integrations
  savePeerNoteToStudyHub: (note: SharedNoteItem) => void;
  getStudyHubPersonalNotes: () => PersonalNote[];
  prepareAiHandoffPayload: (note: SharedNoteItem, toolId: AiToolId) => void;
}

const NotesExchangeContext = createContext<NotesExchangeContextType | undefined>(
  undefined
);

function pickCoverForSubject(course: string, subjectArea: string): string {
  const combined = `${course} ${subjectArea}`.toLowerCase();
  if (combined.includes('algo') || combined.includes('cs-301') || combined.includes('distributed')) {
    return NOTES_EXCHANGE_IMAGES.algoCover;
  }
  if (combined.includes('ai') || combined.includes('neural') || combined.includes('exam')) {
    return NOTES_EXCHANGE_IMAGES.examPrep;
  }
  if (combined.includes('math') || combined.includes('chem') || combined.includes('physics')) {
    return NOTES_EXCHANGE_IMAGES.stem;
  }
  return NOTES_EXCHANGE_IMAGES.scienceCover;
}

export const NotesExchangeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { profile } = useAuth();
  const { addNotification } = useNotifications();

  const [state, setState] = useState<NotesExchangeState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.notes) && parsed.notes.length > 0) {
          return {
            ...INITIAL_NOTES_EXCHANGE_STATE,
            ...parsed,
          };
        }
      }
    } catch {
      // fallback to initial state
    }
    return INITIAL_NOTES_EXCHANGE_STATE;
  });

  const [activeTab, setActiveTab] = useState<NotesExchangeTab>('explore');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<PendingDraftData | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    tone: 'success' | 'info' | 'warning';
  } | null>(null);

  const showToast = (
    text: string,
    tone: 'success' | 'info' | 'warning' = 'success'
  ) => {
    setToastMessage({ text, tone });
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Consume cross-module draft from KAMPUS AI Notes Generator if present
  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(NOTES_EXCHANGE_DRAFT_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        localStorage.removeItem(NOTES_EXCHANGE_DRAFT_KEY);
        if (draft?.title || draft?.content) {
          setPendingDraft({
            title: draft.title || '',
            course: draft.course || 'CS-302 (Algorithms)',
            content: draft.content || '',
            source: 'ai',
          });
          setIsUploadModalOpen(true);
        }
      }
    } catch {
      // ignore invalid draft
    }
  }, []);

  useEffect(() => {
    fetch('/api/notes-exchange/bootstrap')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.success && json.data) {
          setState((prev) => ({
            ...prev,
            ...json.data,
            notes: json.data.notes?.length ? json.data.notes : prev.notes,
            requests: json.data.requests?.length ? json.data.requests : prev.requests,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Persist state cleanly & sync with backend
  useEffect(() => {
    try {
      // Strip very large binary dataUrls above 400KB if needed to keep localStorage responsive
      const leanNotes = state.notes.map((n) => {
        if (n.attachment?.dataUrl && n.attachment.dataUrl.length > 450_000) {
          return {
            ...n,
            attachment: { ...n.attachment, dataUrl: undefined },
          };
        }
        return n;
      });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...state, notes: leanNotes })
      );
    } catch {
      // ignore storage quota errors
    }

    const timer = setTimeout(() => {
      fetch('/api/notes-exchange/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [state]);

  const selectedNote =
    state.notes.find((n) => n.id === selectedNoteId) || null;

  const openUploadModal = (prefill?: Partial<PendingDraftData>) => {
    if (prefill) {
      setPendingDraft({
        title: prefill.title || '',
        course: prefill.course || 'CS-302 (Algorithms)',
        content: prefill.content || '',
        source: prefill.source,
        fulfillRequestId: prefill.fulfillRequestId,
        bountyKarma: prefill.bountyKarma,
      });
    }
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setPendingDraft(null);
  };

  const clearPendingDraft = () => setPendingDraft(null);

  const publishNote = (payload: UploadNotePayload): SharedNoteItem => {
    const nowIso = new Date().toISOString();
    const matchedReq = payload.fulfillRequestId
      ? state.requests.find((r) => r.id === payload.fulfillRequestId)
      : undefined;
    const baseKarma = 100;
    const bountyBonus = matchedReq && matchedReq.status === 'open' ? matchedReq.bountyKarma : 0;
    const totalKarmaEarned = baseKarma + bountyBonus;

    const newNote: SharedNoteItem = {
      id: `sn-${Date.now()}`,
      title: payload.title.trim(),
      course: payload.course.trim(),
      subjectArea: payload.subjectArea.trim() || 'General Studies',
      semesterOrTerm: payload.semesterOrTerm.trim() || profile.semester || 'Semester 6',
      level: payload.level,
      format: payload.format,
      summary:
        payload.summary.trim() ||
        payload.content.trim().slice(0, 160) ||
        'Peer-contributed study notes shared on KAMPUS Notes Exchange.',
      content: payload.content.trim(),
      tags: payload.tags.length > 0 ? payload.tags : [payload.format],
      pagesCount: Math.max(1, payload.pagesCount || 6),
      authorName: profile.name || 'Priya Sharma',
      authorCollege: profile.college || 'IIT Bombay',
      authorAvatar: profile.avatarUrl || NOTES_EXCHANGE_IMAGES.priyaAvatar,
      isOwnUpload: true,
      isVerified: true,
      createdAt: nowIso,
      dateLabel: 'Just now',
      rating: 5.0,
      reviews: [],
      downloads: 0,
      karmaReward: totalKarmaEarned,
      coverImage: pickCoverForSubject(payload.course, payload.subjectArea),
      attachment: payload.attachment,
      fulfilledRequestId: matchedReq?.id,
    };

    setState((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes],
      requests: matchedReq
        ? prev.requests.map((r) =>
            r.id === matchedReq.id
              ? { ...r, status: 'fulfilled', fulfilledNoteId: newNote.id }
              : r
          )
        : prev.requests,
      karmaPoints: prev.karmaPoints + totalKarmaEarned,
      karmaHistory: [
        {
          id: `kh-${Date.now()}`,
          event: matchedReq
            ? `Fulfilled "${matchedReq.title}" & published study note`
            : `Published "${newNote.title}"`,
          points: totalKarmaEarned,
          createdAt: nowIso,
          dateLabel: 'Just now',
        },
        ...prev.karmaHistory,
      ],
    }));

    addNotification({
      title: matchedReq ? 'Note Request Fulfilled!' : 'Study Notes Published',
      description: `Earned +${totalKarmaEarned} Karma for "${newNote.title}".`,
      time: 'Just now',
      type: 'academic',
      linkRoute: '/learn/notes-exchange',
    });

    showToast(
      `Published "${newNote.title}" (+${totalKarmaEarned} Karma earned!)`,
      'success'
    );
    closeUploadModal();
    return newNote;
  };

  const updateOwnNote = (
    noteId: string,
    updates: Partial<
      Pick<SharedNoteItem, 'title' | 'course' | 'semesterOrTerm' | 'format' | 'summary' | 'content' | 'tags'>
    >
  ) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
    }));
    showToast('Updated your shared study note.', 'success');
  };

  const deleteOwnNote = (noteId: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId),
      savedNoteIds: prev.savedNoteIds.filter((id) => id !== noteId),
    }));
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
    }
    showToast('Removed your uploaded note from Notes Exchange.', 'info');
  };

  const downloadNote = (note: SharedNoteItem) => {
    try {
      if (note.attachment?.dataUrl) {
        const a = document.createElement('a');
        a.href = note.attachment.dataUrl;
        a.download = note.attachment.fileName || `${note.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const markdownBundle = [
          `# ${note.title}`,
          `Course: ${note.course} | Level: ${note.level} | Term: ${note.semesterOrTerm}`,
          `Author: ${note.authorName} (${note.authorCollege})`,
          `Format: ${note.format} | Verified Peer Contribution`,
          '',
          '---',
          '',
          note.content || note.summary,
          '',
          '---',
          'Downloaded from KAMPUS Notes Exchange',
        ].join('\n');

        const blob = new Blob([markdownBundle], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const safeName = note.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 60);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeName || 'kampus-study-note'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      showToast('Could not trigger browser download in this view.', 'warning');
      return;
    }

    setState((prev) => {
      const alreadyDownloaded = prev.downloadedNoteIds.includes(note.id);
      return {
        ...prev,
        notes: prev.notes.map((n) =>
          n.id === note.id
            ? { ...n, downloads: alreadyDownloaded ? n.downloads : n.downloads + 1 }
            : n
        ),
        downloadedNoteIds: alreadyDownloaded
          ? prev.downloadedNoteIds
          : [...prev.downloadedNoteIds, note.id],
      };
    });

    showToast(`Downloaded "${note.title}"`, 'success');
  };

  const toggleSaveNote = (noteId: string) => {
    setState((prev) => {
      const exists = prev.savedNoteIds.includes(noteId);
      const nextSaved = exists
        ? prev.savedNoteIds.filter((id) => id !== noteId)
        : [noteId, ...prev.savedNoteIds];
      showToast(
        exists ? 'Removed from Saved Notes' : 'Saved to your Notes Exchange bookmarks',
        'info'
      );
      return {
        ...prev,
        savedNoteIds: nextSaved,
      };
    });
  };

  const submitReview = (noteId: string, rating: number, comment: string) => {
    const cleanComment = comment.trim();
    if (!cleanComment) return;
    const nowIso = new Date().toISOString();

    setState((prev) => {
      const updatedNotes = prev.notes.map((n) => {
        if (n.id !== noteId) return n;
        const newReview = {
          id: `rev-${Date.now()}`,
          authorName: profile.name || 'Priya Sharma',
          authorCollege: profile.college || 'IIT Bombay',
          rating,
          comment: cleanComment,
          createdAt: nowIso,
          helpfulCount: 1,
        };
        const updatedReviews = [newReview, ...n.reviews];
        const totalScore =
          n.reviews.length > 0
            ? updatedReviews.reduce((acc, r) => acc + r.rating, 0) /
              updatedReviews.length
            : (n.rating + rating) / 2;
        return {
          ...n,
          rating: Number(totalScore.toFixed(1)),
          reviews: updatedReviews,
        };
      });

      return {
        ...prev,
        notes: updatedNotes,
        karmaPoints: prev.karmaPoints + 10,
        karmaHistory: [
          {
            id: `kh-${Date.now()}`,
            event: 'Submitted helpful peer review on shared notes',
            points: 10,
            createdAt: nowIso,
            dateLabel: 'Just now',
          },
          ...prev.karmaHistory,
        ],
      };
    });

    showToast('Review posted (+10 Karma for peer feedback!)', 'success');
  };

  const reportNote = (noteId: string, reason: string) => {
    setState((prev) => ({
      ...prev,
      reportedNoteIds: prev.reportedNoteIds.includes(noteId)
        ? prev.reportedNoteIds
        : [...prev.reportedNoteIds, noteId],
    }));

    addNotification({
      title: 'Content Quality Report Logged',
      description: `Moderator review queued (${reason}). Thank you for keeping Notes Exchange accurate.`,
      time: 'Just now',
      type: 'system',
    });
    showToast('Report submitted for academic moderator review.', 'info');
  };

  const createRequest = (payload: CreateRequestPayload) => {
    const newReq: NoteRequestItem = {
      id: `req-${Date.now()}`,
      title: payload.title.trim(),
      course: payload.course.trim(),
      semesterOrTerm: payload.semesterOrTerm.trim() || 'Semester 6',
      level: payload.level,
      details: payload.details.trim(),
      requesterName: profile.name || 'Priya Sharma',
      requesterCollege: profile.college || 'IIT Bombay',
      bountyKarma: Math.max(25, Math.min(200, payload.bountyKarma || 50)),
      upvotes: 1,
      upvotedByUser: true,
      status: 'open',
      createdAt: new Date().toISOString(),
      dateLabel: 'Just now',
    };

    setState((prev) => ({
      ...prev,
      requests: [newReq, ...prev.requests],
    }));

    addNotification({
      title: 'Note Request Posted',
      description: `Peers can now fulfill "${newReq.title}" for +${newReq.bountyKarma} Bonus Karma.`,
      time: 'Just now',
      type: 'academic',
      linkRoute: '/learn/notes-exchange',
    });
    showToast(`Posted note request (+${newReq.bountyKarma} Karma bounty)`, 'success');
  };

  const toggleUpvoteRequest = (requestId: string) => {
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) => {
        if (r.id !== requestId) return r;
        const already = Boolean(r.upvotedByUser);
        return {
          ...r,
          upvotedByUser: !already,
          upvotes: already ? Math.max(0, r.upvotes - 1) : r.upvotes + 1,
        };
      }),
    }));
  };

  const getStudyHubPersonalNotes = (): PersonalNote[] => {
    try {
      const raw = localStorage.getItem(STUDY_HUB_STORAGE_KEY);
      if (raw) {
        const parsed: StudyHubState = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.notes)) {
          return parsed.notes;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_STUDY_HUB_STATE.notes;
  };

  const savePeerNoteToStudyHub = (note: SharedNoteItem) => {
    try {
      const raw = localStorage.getItem(STUDY_HUB_STORAGE_KEY);
      const snap: StudyHubState = raw
        ? { ...INITIAL_STUDY_HUB_STATE, ...JSON.parse(raw) }
        : INITIAL_STUDY_HUB_STATE;

      const matchedSubject =
        snap.subjects.find(
          (s) =>
            note.course.toLowerCase().includes(s.code.toLowerCase()) ||
            s.name.toLowerCase().includes(note.subjectArea.toLowerCase())
        ) || snap.subjects[0];

      const now = new Date().toISOString();
      const newPersonalNote: PersonalNote = {
        id: `note_nx_${Date.now()}`,
        title: note.title,
        description: `Imported from Notes Exchange · By ${note.authorName} (${note.authorCollege})`,
        content: note.content || note.summary,
        subjectId: matchedSubject?.id || 'subj-cs302',
        pinned: false,
        bookmarked: true,
        createdAt: now,
        updatedAt: now,
      };

      const nextStudyHub: StudyHubState = {
        ...snap,
        notes: [newPersonalNote, ...(snap.notes || [])],
      };

      localStorage.setItem(STUDY_HUB_STORAGE_KEY, JSON.stringify(nextStudyHub));

      addNotification({
        title: 'Peer Note Saved to Study Hub',
        description: `"${note.title}" is now available inside your Study Hub Notes Workspace.`,
        time: 'Just now',
        type: 'academic',
        linkRoute: '/learn/study-hub',
      });
      showToast('Saved into your Study Hub Personal Notes!', 'success');
    } catch {
      showToast('Could not sync with Study Hub storage.', 'warning');
    }
  };

  const prepareAiHandoffPayload = (note: SharedNoteItem, toolId: AiToolId) => {
    const promptBody = `${note.title} (${note.course})\n\n${
      note.content ? note.content.slice(0, 2600) : note.summary
    }`;
    try {
      localStorage.setItem(
        AI_HANDOFF_KEY,
        JSON.stringify({
          toolId,
          payload: {
            topic: note.title,
            subject: note.subjectArea,
            chapter: note.course,
            courseOrClass: `${note.course} · ${note.semesterOrTerm}`,
            content: promptBody,
          },
        })
      );
    } catch {
      // ignore
    }
  };

  return (
    <NotesExchangeContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        selectedNote,
        setSelectedNoteId,
        isUploadModalOpen,
        openUploadModal,
        closeUploadModal,
        pendingDraft,
        clearPendingDraft,
        toastMessage,
        dismissToast: () => setToastMessage(null),
        showToast,
        publishNote,
        updateOwnNote,
        deleteOwnNote,
        downloadNote,
        toggleSaveNote,
        submitReview,
        reportNote,
        createRequest,
        toggleUpvoteRequest,
        savePeerNoteToStudyHub,
        getStudyHubPersonalNotes,
        prepareAiHandoffPayload,
      }}
    >
      {children}
    </NotesExchangeContext.Provider>
  );
};

export const useNotesExchange = () => {
  const ctx = useContext(NotesExchangeContext);
  if (!ctx) {
    throw new Error('useNotesExchange must be used within NotesExchangeProvider');
  }
  return ctx;
};
