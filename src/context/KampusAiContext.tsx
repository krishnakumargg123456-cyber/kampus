import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AiAttachment,
  AiConversation,
  AiHistoryCategory,
  AiHistoryEntry,
  AiSavedItem,
  AiServiceStatus,
  AiToolId,
  AiUserPreferences,
  FlashcardDeck,
  GeneratedNotesOutput,
  StudyPlanOutput,
} from '../types/kampusAi';
import { fetchAiStatus } from '../services/kampusAiService';
import { useNotifications } from './NotificationContext';
import { PersonalNote, StudyHubState } from '../types/studyHub';
import { INITIAL_STUDY_HUB_STATE } from '../data/studyHubData';

const AI_STORAGE_KEY = 'kampus_ai_workspace_v1';
const STUDY_HUB_STORAGE_KEY = 'kampus_studyhub_state_v1';
const PLANNER_AI_STORAGE_KEY = 'kampus_planner_ai_schedules_v1';
const NOTES_EXCHANGE_DRAFT_KEY = 'kampus_notes_exchange_draft_v1';

interface StoredAiState {
  preferences: AiUserPreferences;
  conversations: AiConversation[];
  activeConversationId: string;
  history: AiHistoryEntry[];
  savedItems: AiSavedItem[];
  flashcardDecks: FlashcardDeck[];
}

const DEFAULT_PREFERENCES: AiUserPreferences = {
  language: 'English',
  learningLevel: 'Intermediate',
  responseStyle: 'Detailed Explanation',
};

function createEmptyConversation(title = 'New Study Conversation'): AiConversation {
  const now = new Date().toISOString();
  return {
    id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
    attachments: [],
  };
}

interface KampusAiContextType {
  serviceStatus: AiServiceStatus | null;
  statusLoading: boolean;
  refreshStatus: () => Promise<void>;

  activeTool: AiToolId;
  setActiveTool: (tool: AiToolId) => void;
  toolDraftPrompt: string | null;
  setToolDraftPrompt: (prompt: string | null) => void;
  toolDraftAttachments: AiAttachment[];
  setToolDraftAttachments: (atts: AiAttachment[]) => void;

  preferences: AiUserPreferences;
  updatePreferences: (updates: Partial<AiUserPreferences>) => void;

  conversations: AiConversation[];
  activeConversation: AiConversation;
  setActiveConversationId: (id: string) => void;
  createNewConversation: (initialTitle?: string) => string;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearActiveConversation: () => void;
  updateConversation: (id: string, updater: (c: AiConversation) => AiConversation) => void;

  history: AiHistoryEntry[];
  addHistoryEntry: (entry: Omit<AiHistoryEntry, 'id' | 'createdAt'>) => string;
  renameHistoryEntry: (id: string, title: string) => void;
  deleteHistoryEntry: (id: string) => void;
  reopenHistoryEntry: (entry: AiHistoryEntry) => void;
  launchToolWithPrefill: (toolId: AiToolId, payload: any) => void;
  pendingReopenData: { toolId: AiToolId; payload: any } | null;
  clearPendingReopenData: () => void;

  savedItems: AiSavedItem[];
  saveItem: (item: Omit<AiSavedItem, 'id' | 'savedAt'>) => void;
  removeSavedItem: (id: string) => void;

  flashcardDecks: FlashcardDeck[];
  saveFlashcardDeck: (deck: FlashcardDeck) => void;
  deleteFlashcardDeck: (id: string) => void;

  // Cross-module integrations
  getStudyHubSnapshot: () => StudyHubState;
  saveNotesToStudyHub: (notes: GeneratedNotesOutput, subjectId?: string) => void;
  prepareForNotesExchange: (title: string, course: string, content: string) => void;
  saveStudyPlanToPlanner: (plan: StudyPlanOutput) => void;
}

const KampusAiContext = createContext<KampusAiContextType | undefined>(undefined);

export const KampusAiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useNotifications();

  const [stored, setStored] = useState<StoredAiState>(() => {
    const initialConv = createEmptyConversation('Study Assistant Session');
    try {
      const raw = localStorage.getItem(AI_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.conversations) && parsed.conversations.length > 0) {
          return {
            preferences: { ...DEFAULT_PREFERENCES, ...(parsed.preferences || {}) },
            conversations: parsed.conversations,
            activeConversationId: parsed.activeConversationId || parsed.conversations[0].id,
            history: Array.isArray(parsed.history) ? parsed.history : [],
            savedItems: Array.isArray(parsed.savedItems) ? parsed.savedItems : [],
            flashcardDecks: Array.isArray(parsed.flashcardDecks) ? parsed.flashcardDecks : [],
          };
        }
      }
    } catch {
      // ignore invalid storage
    }
    return {
      preferences: DEFAULT_PREFERENCES,
      conversations: [initialConv],
      activeConversationId: initialConv.id,
      history: [],
      savedItems: [],
      flashcardDecks: [],
    };
  });

  const [serviceStatus, setServiceStatus] = useState<AiServiceStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<AiToolId>('home');
  const [toolDraftPrompt, setToolDraftPrompt] = useState<string | null>(null);
  const [toolDraftAttachments, setToolDraftAttachments] = useState<AiAttachment[]>([]);
  const [pendingReopenData, setPendingReopenData] = useState<{
    toolId: AiToolId;
    payload: any;
  } | null>(null);

  const refreshStatus = async () => {
    setStatusLoading(true);
    const status = await fetchAiStatus();
    setServiceStatus(status);
    setStatusLoading(false);
  };

  useEffect(() => {
    refreshStatus();
    try {
      const handoffRaw = localStorage.getItem('kampus_ai_handoff_v1');
      if (handoffRaw) {
        localStorage.removeItem('kampus_ai_handoff_v1');
        const parsed = JSON.parse(handoffRaw);
        if (parsed?.toolId) {
          setPendingReopenData({ toolId: parsed.toolId, payload: parsed.payload || {} });
          setActiveTool(parsed.toolId);
        }
      }
    } catch {
      // ignore invalid handoff
    }
  }, []);

  useEffect(() => {
    try {
      // Strip heavy base64 strings before persisting to localStorage
      const leanConversations = stored.conversations.map((c) => ({
        ...c,
        attachments: c.attachments.map((a) => ({ ...a, base64Data: undefined })),
      }));
      localStorage.setItem(
        AI_STORAGE_KEY,
        JSON.stringify({
          ...stored,
          conversations: leanConversations,
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [stored]);

  const activeConversation =
    stored.conversations.find((c) => c.id === stored.activeConversationId) ||
    stored.conversations[0];

  const updatePreferences = (updates: Partial<AiUserPreferences>) => {
    setStored((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
  };

  const setActiveConversationId = (id: string) => {
    setStored((prev) => ({ ...prev, activeConversationId: id }));
  };

  const createNewConversation = (initialTitle?: string) => {
    const newConv = createEmptyConversation(initialTitle || 'New Study Conversation');
    setStored((prev) => ({
      ...prev,
      conversations: [newConv, ...prev.conversations],
      activeConversationId: newConv.id,
    }));
    return newConv.id;
  };

  const renameConversation = (id: string, title: string) => {
    if (!title.trim()) return;
    setStored((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === id ? { ...c, title: title.trim(), updatedAt: new Date().toISOString() } : c
      ),
    }));
  };

  const deleteConversation = (id: string) => {
    setStored((prev) => {
      const remaining = prev.conversations.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createEmptyConversation('Study Assistant Session');
        return {
          ...prev,
          conversations: [fresh],
          activeConversationId: fresh.id,
        };
      }
      return {
        ...prev,
        conversations: remaining,
        activeConversationId:
          prev.activeConversationId === id ? remaining[0].id : prev.activeConversationId,
      };
    });
  };

  const clearActiveConversation = () => {
    setStored((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === activeConversation.id
          ? { ...c, messages: [], attachments: [], updatedAt: new Date().toISOString() }
          : c
      ),
    }));
  };

  const updateConversation = (id: string, updater: (c: AiConversation) => AiConversation) => {
    setStored((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) => (c.id === id ? updater(c) : c)),
    }));
  };

  const addHistoryEntry: KampusAiContextType['addHistoryEntry'] = (entry) => {
    const id = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const full: AiHistoryEntry = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
    };
    setStored((prev) => ({
      ...prev,
      history: [full, ...prev.history].slice(0, 60),
    }));
    return id;
  };

  const renameHistoryEntry = (id: string, title: string) => {
    if (!title.trim()) return;
    setStored((prev) => ({
      ...prev,
      history: prev.history.map((h) => (h.id === id ? { ...h, title: title.trim() } : h)),
    }));
  };

  const deleteHistoryEntry = (id: string) => {
    setStored((prev) => ({
      ...prev,
      history: prev.history.filter((h) => h.id !== id),
    }));
  };

  const reopenHistoryEntry = (entry: AiHistoryEntry) => {
    if (entry.toolId === 'chat' && entry.payload?.conversationId) {
      setActiveConversationId(entry.payload.conversationId);
      setActiveTool('chat');
      return;
    }
    setPendingReopenData({ toolId: entry.toolId, payload: entry.payload });
    setActiveTool(entry.toolId);
  };

  const launchToolWithPrefill = (toolId: AiToolId, payload: any) => {
    setPendingReopenData({ toolId, payload });
    setActiveTool(toolId);
  };

  const clearPendingReopenData = () => setPendingReopenData(null);

  const saveItem: KampusAiContextType['saveItem'] = (item) => {
    const full: AiSavedItem = {
      ...item,
      id: `sav_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      savedAt: new Date().toISOString(),
    };
    setStored((prev) => ({
      ...prev,
      savedItems: [full, ...prev.savedItems],
    }));
  };

  const removeSavedItem = (id: string) => {
    setStored((prev) => ({
      ...prev,
      savedItems: prev.savedItems.filter((s) => s.id !== id),
    }));
  };

  const saveFlashcardDeck = (deck: FlashcardDeck) => {
    setStored((prev) => {
      const exists = prev.flashcardDecks.some((d) => d.id === deck.id);
      return {
        ...prev,
        flashcardDecks: exists
          ? prev.flashcardDecks.map((d) => (d.id === deck.id ? deck : d))
          : [deck, ...prev.flashcardDecks],
      };
    });
  };

  const deleteFlashcardDeck = (id: string) => {
    setStored((prev) => ({
      ...prev,
      flashcardDecks: prev.flashcardDecks.filter((d) => d.id !== id),
    }));
  };

  // Cross-Module Integrations
  const getStudyHubSnapshot = (): StudyHubState => {
    try {
      const raw = localStorage.getItem(STUDY_HUB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.subjects)) {
          return { ...INITIAL_STUDY_HUB_STATE, ...parsed };
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_STUDY_HUB_STATE;
  };

  const saveNotesToStudyHub = (notes: GeneratedNotesOutput, subjectId?: string) => {
    const snap = getStudyHubSnapshot();
    const targetSubjectId = subjectId || snap.subjects[0]?.id || 'subj-cs302';
    const now = new Date().toISOString();
    const formattedMarkdown = [
      notes.completeNotes,
      '',
      '## Key Definitions',
      ...notes.definitions.map((d) => `- ${d}`),
      '',
      '## Formulas & Equations',
      ...notes.formulas.map((f) => `- ${f}`),
      '',
      '## Quick Revision Points',
      ...notes.quickRevisionPoints.map((p) => `- ${p}`),
    ].join('\n');

    const newNote: PersonalNote = {
      id: `note_ai_${Date.now()}`,
      title: notes.title,
      description: 'Generated with KAMPUS AI Notes Generator',
      content: formattedMarkdown,
      subjectId: targetSubjectId,
      pinned: false,
      bookmarked: true,
      createdAt: now,
      updatedAt: now,
    };

    const nextState: StudyHubState = {
      ...snap,
      notes: [newNote, ...snap.notes],
    };
    localStorage.setItem(STUDY_HUB_STORAGE_KEY, JSON.stringify(nextState));

    addNotification({
      title: 'AI Notes Saved to Study Hub',
      description: `"${notes.title}" was added to your Study Hub Notes Workspace.`,
      time: 'Just now',
      type: 'academic',
      linkRoute: '/learn/study-hub',
    });
  };

  const prepareForNotesExchange = (title: string, course: string, content: string) => {
    localStorage.setItem(
      NOTES_EXCHANGE_DRAFT_KEY,
      JSON.stringify({ title, course, content, preparedAt: new Date().toISOString() })
    );
  };

  const saveStudyPlanToPlanner = (plan: StudyPlanOutput) => {
    try {
      const existingRaw = localStorage.getItem(PLANNER_AI_STORAGE_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const next = [
        {
          id: `ai_plan_${Date.now()}`,
          savedAt: new Date().toISOString(),
          ...plan,
        },
        ...(Array.isArray(existing) ? existing : []),
      ];
      localStorage.setItem(PLANNER_AI_STORAGE_KEY, JSON.stringify(next));
      addNotification({
        title: 'AI Study Schedule Synced to Planner',
        description: `"${plan.title}" is now visible inside KAMPUS Planner.`,
        time: 'Just now',
        type: 'academic',
        linkRoute: '/tools/planner',
      });
    } catch {
      // ignore
    }
  };

  return (
    <KampusAiContext.Provider
      value={{
        serviceStatus,
        statusLoading,
        refreshStatus,
        activeTool,
        setActiveTool,
        toolDraftPrompt,
        setToolDraftPrompt,
        toolDraftAttachments,
        setToolDraftAttachments,
        preferences: stored.preferences,
        updatePreferences,
        conversations: stored.conversations,
        activeConversation,
        setActiveConversationId,
        createNewConversation,
        renameConversation,
        deleteConversation,
        clearActiveConversation,
        updateConversation,
        history: stored.history,
        addHistoryEntry,
        renameHistoryEntry,
        deleteHistoryEntry,
        reopenHistoryEntry,
        launchToolWithPrefill,
        pendingReopenData,
        clearPendingReopenData,
        savedItems: stored.savedItems,
        saveItem,
        removeSavedItem,
        flashcardDecks: stored.flashcardDecks,
        saveFlashcardDeck,
        deleteFlashcardDeck,
        getStudyHubSnapshot,
        saveNotesToStudyHub,
        prepareForNotesExchange,
        saveStudyPlanToPlanner,
      }}
    >
      {children}
    </KampusAiContext.Provider>
  );
};

export const useKampusAi = () => {
  const ctx = useContext(KampusAiContext);
  if (!ctx) throw new Error('useKampusAi must be used within KampusAiProvider');
  return ctx;
};
