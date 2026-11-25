import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  StudyHubState,
  StudyHubTab,
  StudySubject,
  StudyChapter,
  PersonalNote,
  QuestionPaper,
  UploadedResource,
  StudyReminder,
  PracticeTestResult,
  MaterialCategory,
  EducationLevel,
} from '../types/studyHub';
import { INITIAL_STUDY_HUB_STATE, STUDY_HUB_IMAGES } from '../data/studyHubData';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'kampus_studyhub_state_v1';

interface LaunchTestConfig {
  title: string;
  mode: 'Chapter Test' | 'Subject Test' | 'Custom Test' | 'PYQ Practice';
  subjectId: string;
  questionIds: string[];
  durationMinutes: number;
  timed: boolean;
}

interface StudyHubContextType {
  state: StudyHubState;
  activeTab: StudyHubTab;
  setActiveTab: (tab: StudyHubTab) => void;
  selectedSubjectId: string | null;
  setSelectedSubjectId: (id: string | null) => void;
  selectedChapterId: string | null;
  setSelectedChapterId: (id: string | null) => void;
  selectedTopicId: string | null;
  setSelectedTopicId: (id: string | null) => void;
  libraryInitialCategory: MaterialCategory | 'all';
  setLibraryInitialCategory: (cat: MaterialCategory | 'all') => void;
  pendingTestLaunch: LaunchTestConfig | null;
  setPendingTestLaunch: (cfg: LaunchTestConfig | null) => void;

  // Navigation helpers
  openSubjectChapterTopic: (subjectId: string, chapterId?: string, topicId?: string) => void;
  launchPracticeTest: (cfg: LaunchTestConfig) => void;

  // Subject CRUD & Progress
  addSubject: (payload: {
    code: string;
    name: string;
    level: EducationLevel;
    course: string;
    semesterOrClass: string;
    description: string;
    initialChapterTitle?: string;
  }) => string;
  updateSubject: (id: string, updates: Partial<StudySubject>) => void;
  deleteSubject: (id: string) => void;
  toggleChapterComplete: (subjectId: string, chapterId: string) => void;
  toggleChapterBookmark: (subjectId: string, chapterId: string) => void;
  toggleTopicComplete: (subjectId: string, chapterId: string, topicId: string) => void;
  toggleTopicBookmark: (subjectId: string, chapterId: string, topicId: string) => void;
  setReadingPosition: (subjectId: string, chapterId: string, topicId: string) => void;
  updateChapterNotes: (subjectId: string, chapterId: string, notes: string) => void;

  // Materials
  toggleMaterialBookmark: (materialId: string) => void;
  incrementMaterialDownload: (materialId: string) => void;
  reportMaterial: (materialId: string, reason: string) => void;

  // Personal Notes
  createNote: (payload: { title: string; description: string; content: string; subjectId: string; chapterId?: string }) => string;
  updateNote: (id: string, updates: Partial<PersonalNote>) => void;
  deleteNote: (id: string) => void;
  toggleNotePin: (id: string) => void;
  toggleNoteBookmark: (id: string) => void;

  // PYQ Papers
  togglePaperBookmark: (paperId: string) => void;
  addUploadedPaper: (paper: Omit<QuestionPaper, 'id'>) => void;

  // Question Bank
  toggleQuestionBookmark: (questionId: string) => void;

  // Practice Tests & Study Logs
  saveTestResult: (result: PracticeTestResult) => void;
  logStudyMinutes: (minutes: number) => void;
  setDailyGoalMinutes: (minutes: number) => void;

  // Uploads
  addUploadedResource: (resource: Omit<UploadedResource, 'id' | 'uploadedAt'>) => void;
  renameUploadedResource: (id: string, newName: string) => void;
  deleteUploadedResource: (id: string) => void;

  // Reminders
  addReminder: (payload: Omit<StudyReminder, 'id' | 'completed'>) => void;
  toggleReminderComplete: (id: string) => void;
  deleteReminder: (id: string) => void;

  // Search history
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const StudyHubContext = createContext<StudyHubContextType | undefined>(undefined);

export const StudyHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification } = useNotifications();
  const { user, token } = useAuth();
  const currentUserId = user?.id || 'guest';
  const userStorageKey = `kampus_studyhub_state_${currentUserId}`;

  const [state, setState] = useState<StudyHubState>(() => {
    try {
      const saved = localStorage.getItem(`kampus_studyhub_state_${user?.id || 'guest'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
          return { ...INITIAL_STUDY_HUB_STATE, ...parsed };
        }
      }
      return INITIAL_STUDY_HUB_STATE;
    } catch {
      return INITIAL_STUDY_HUB_STATE;
    }
  });

  const [activeTab, setActiveTab] = useState<StudyHubTab>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [libraryInitialCategory, setLibraryInitialCategory] = useState<MaterialCategory | 'all'>('all');
  const [pendingTestLaunch, setPendingTestLaunch] = useState<LaunchTestConfig | null>(null);

  // Load authenticated user's state from server whenever user logs in or switches
  useEffect(() => {
    // Also load from user-specific local storage cache first
    try {
      const cached = localStorage.getItem(userStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.subjects)) {
          setState((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (user?.id) headers['x-user-id'] = user.id;

    fetch('/api/studyhub/bootstrap', { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.success && json.data) {
          setState((prev) => ({
            ...prev,
            ...json.data,
            subjects: json.data.subjects?.length ? json.data.subjects : prev.subjects,
            notes: Array.isArray(json.data.notes) ? json.data.notes : prev.notes,
            materials: json.data.materials?.length ? json.data.materials : prev.materials,
          }));
        }
      })
      .catch(() => {});
  }, [user?.id, token, userStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(state));
    } catch {
      // ignore quota overflow
    }

    const timer = setTimeout(() => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (user?.id) headers['x-user-id'] = user.id;

      fetch('/api/studyhub/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(state),
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [state, userStorageKey, token, user?.id]);

  const openSubjectChapterTopic = (subjectId: string, chapterId?: string, topicId?: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId(chapterId || null);
    setSelectedTopicId(topicId || null);
    setActiveTab('subjects');
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.id === subjectId ? { ...s, lastAccessedAt: new Date().toISOString() } : s
      ),
      activeReadingPosition:
        chapterId && topicId
          ? { subjectId, chapterId, topicId }
          : prev.activeReadingPosition,
    }));
  };

  const launchPracticeTest = (cfg: LaunchTestConfig) => {
    setPendingTestLaunch(cfg);
    setActiveTab('tests');
  };

  const addSubject: StudyHubContextType['addSubject'] = (payload) => {
    const id = `subj_custom_${Date.now()}`;
    const chId = `ch_custom_${Date.now()}`;
    const tpId = `tp_custom_${Date.now()}`;
    const coverByLevel: Record<EducationLevel, string> = {
      School: STUDY_HUB_IMAGES.deskHero,
      'Class 11 & 12': STUDY_HUB_IMAGES.stem,
      Undergraduate: STUDY_HUB_IMAGES.csAlgo,
      Postgraduate: STUDY_HUB_IMAGES.csAlgo,
      'Competitive Exams': STUDY_HUB_IMAGES.examPrep,
    };

    const newSubject: StudySubject = {
      id,
      code: payload.code.trim().toUpperCase() || 'SUB-101',
      name: payload.name.trim(),
      level: payload.level,
      course: payload.course.trim() || 'General Studies',
      semesterOrClass: payload.semesterOrClass.trim() || 'Current Term',
      description: payload.description.trim() || 'Custom student subject workspace.',
      imageUrl: coverByLevel[payload.level],
      accentColor: 'blue',
      isCustom: true,
      lastAccessedAt: new Date().toISOString(),
      chapters: [
        {
          id: chId,
          number: 1,
          title: payload.initialChapterTitle?.trim() || 'Unit 1: Core Foundations & Syllabus Overview',
          overview: 'Custom chapter created by you. Add personal study notes, mark topics completed, and attach resources.',
          learningObjectives: ['Master foundational concepts', 'Complete chapter revision notes'],
          relatedMaterialIds: [],
          completed: false,
          bookmarked: false,
          lastTopicId: tpId,
          personalChapterNotes: '',
          topics: [
            {
              id: tpId,
              title: 'Introduction & Key Definitions',
              summary: 'Starting topic for this custom chapter.',
              keyConcepts: ['Core terminology', 'Syllabus scope'],
              studyNotes: 'Use the personal notes box below or open the Notes Workspace to write detailed study summaries for this topic.',
              estimatedMinutes: 20,
              completed: false,
              bookmarked: false,
            },
          ],
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      subjects: [newSubject, ...prev.subjects],
    }));
    return id;
  };

  const updateSubject = (id: string, updates: Partial<StudySubject>) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const deleteSubject = (id: string) => {
    const target = state.subjects.find((s) => s.id === id);
    if (target && (target.isCommon || !target.isCustom)) {
      addNotification({
        title: 'Action Restricted',
        description: 'Common campus curriculum subjects cannot be deleted by students.',
        type: 'system',
        time: 'Just now',
      });
      return;
    }
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
    }));
    if (selectedSubjectId === id) {
      setSelectedSubjectId(null);
      setSelectedChapterId(null);
      setSelectedTopicId(null);
    }
  };

  const toggleChapterComplete = (subjectId: string, chapterId: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subj) => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          chapters: subj.chapters.map((ch) => {
            if (ch.id !== chapterId) return ch;
            const nextDone = !ch.completed;
            return {
              ...ch,
              completed: nextDone,
              topics: ch.topics.map((t) => ({ ...t, completed: nextDone })),
            };
          }),
        };
      }),
    }));
  };

  const toggleChapterBookmark = (subjectId: string, chapterId: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subj) =>
        subj.id !== subjectId
          ? subj
          : {
              ...subj,
              chapters: subj.chapters.map((ch) =>
                ch.id === chapterId ? { ...ch, bookmarked: !ch.bookmarked } : ch
              ),
            }
      ),
    }));
  };

  const toggleTopicComplete = (subjectId: string, chapterId: string, topicId: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subj) => {
        if (subj.id !== subjectId) return subj;
        return {
          ...subj,
          chapters: subj.chapters.map((ch) => {
            if (ch.id !== chapterId) return ch;
            const nextTopics = ch.topics.map((tp) =>
              tp.id === topicId ? { ...tp, completed: !tp.completed } : tp
            );
            const allCompleted = nextTopics.length > 0 && nextTopics.every((t) => t.completed);
            return {
              ...ch,
              topics: nextTopics,
              completed: allCompleted,
            };
          }),
        };
      }),
    }));
  };

  const toggleTopicBookmark = (subjectId: string, chapterId: string, topicId: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subj) =>
        subj.id !== subjectId
          ? subj
          : {
              ...subj,
              chapters: subj.chapters.map((ch) =>
                ch.id !== chapterId
                  ? ch
                  : {
                      ...ch,
                      topics: ch.topics.map((tp) =>
                        tp.id === topicId ? { ...tp, bookmarked: !tp.bookmarked } : tp
                      ),
                    }
              ),
            }
      ),
    }));
  };

  const setReadingPosition = (subjectId: string, chapterId: string, topicId: string) => {
    setState((prev) => ({
      ...prev,
      activeReadingPosition: { subjectId, chapterId, topicId },
      subjects: prev.subjects.map((s) =>
        s.id !== subjectId
          ? s
          : {
              ...s,
              lastAccessedAt: new Date().toISOString(),
              chapters: s.chapters.map((c) =>
                c.id === chapterId ? { ...c, lastTopicId: topicId } : c
              ),
            }
      ),
    }));
  };

  const updateChapterNotes = (subjectId: string, chapterId: string, notes: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.id !== subjectId
          ? s
          : {
              ...s,
              chapters: s.chapters.map((c: StudyChapter) =>
                c.id === chapterId ? { ...c, personalChapterNotes: notes } : c
              ),
            }
      ),
    }));
  };

  const toggleMaterialBookmark = (materialId: string) => {
    setState((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === materialId ? { ...m, bookmarked: !m.bookmarked } : m
      ),
    }));
  };

  const incrementMaterialDownload = (materialId: string) => {
    setState((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === materialId ? { ...m, downloads: m.downloads + 1 } : m
      ),
    }));
  };

  const reportMaterial = (materialId: string, reason: string) => {
    setState((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === materialId ? { ...m, reportedReason: reason } : m
      ),
    }));
  };

  const createNote: StudyHubContextType['createNote'] = (payload) => {
    const id = `note_${Date.now()}`;
    const now = new Date().toISOString();
    const newNote: PersonalNote = {
      id,
      title: payload.title.trim() || 'Untitled Study Note',
      description: payload.description.trim(),
      content: payload.content,
      subjectId: payload.subjectId,
      chapterId: payload.chapterId,
      pinned: false,
      bookmarked: false,
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({ ...prev, notes: [newNote, ...prev.notes] }));
    return id;
  };

  const updateNote = (id: string, updates: Partial<PersonalNote>) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      ),
    }));
  };

  const deleteNote = (id: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id),
    }));
  };

  const toggleNotePin = (id: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    }));
  };

  const toggleNoteBookmark = (id: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === id ? { ...n, bookmarked: !n.bookmarked } : n)),
    }));
  };

  const togglePaperBookmark = (paperId: string) => {
    setState((prev) => ({
      ...prev,
      papers: prev.papers.map((p) => (p.id === paperId ? { ...p, bookmarked: !p.bookmarked } : p)),
    }));
  };

  const addUploadedPaper = (paper: Omit<QuestionPaper, 'id'>) => {
    const newPaper: QuestionPaper = {
      ...paper,
      id: `pyq_user_${Date.now()}`,
    };
    setState((prev) => ({ ...prev, papers: [newPaper, ...prev.papers] }));
  };

  const toggleQuestionBookmark = (questionId: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, bookmarked: !q.bookmarked } : q
      ),
    }));
  };

  const saveTestResult = (result: PracticeTestResult) => {
    const addedMinutes = Math.max(1, Math.round(result.timeTakenSeconds / 60));
    setState((prev) => ({
      ...prev,
      testHistory: [result, ...prev.testHistory],
      weeklyLogs: prev.weeklyLogs.map((log, idx) =>
        idx === prev.weeklyLogs.length - 1
          ? { ...log, minutes: log.minutes + addedMinutes, isRecordedUserActivity: true }
          : log
      ),
    }));
  };

  const logStudyMinutes = (minutes: number) => {
    if (minutes <= 0) return;
    setState((prev) => ({
      ...prev,
      weeklyLogs: prev.weeklyLogs.map((log, idx) =>
        idx === prev.weeklyLogs.length - 1
          ? { ...log, minutes: log.minutes + minutes, isRecordedUserActivity: true }
          : log
      ),
    }));
  };

  const setDailyGoalMinutes = (minutes: number) => {
    setState((prev) => ({ ...prev, dailyGoalMinutes: Math.max(15, minutes) }));
  };

  const addUploadedResource = (resource: Omit<UploadedResource, 'id' | 'uploadedAt'>) => {
    const item: UploadedResource = {
      ...resource,
      id: `upl_${Date.now()}`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({ ...prev, uploads: [item, ...prev.uploads] }));
  };

  const renameUploadedResource = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setState((prev) => ({
      ...prev,
      uploads: prev.uploads.map((u) => (u.id === id ? { ...u, name: newName.trim() } : u)),
    }));
  };

  const deleteUploadedResource = (id: string) => {
    setState((prev) => ({
      ...prev,
      uploads: prev.uploads.filter((u) => u.id !== id),
    }));
  };

  const addReminder: StudyHubContextType['addReminder'] = (payload) => {
    const newRem: StudyReminder = {
      ...payload,
      id: `rem_${Date.now()}`,
      completed: false,
    };
    setState((prev) => ({ ...prev, reminders: [newRem, ...prev.reminders] }));

    if (payload.syncedToNotifications) {
      addNotification({
        title: `Study Reminder: ${payload.title}`,
        description: `${payload.type} scheduled for ${payload.dueDateTime}${payload.notes ? ` — ${payload.notes}` : ''}`,
        time: 'Just now',
        type: 'academic',
        linkRoute: '/learn/study-hub',
      });
    }
  };

  const toggleReminderComplete = (id: string) => {
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      ),
    }));
  };

  const deleteReminder = (id: string) => {
    setState((prev) => ({
      ...prev,
      reminders: prev.reminders.filter((r) => r.id !== id),
    }));
  };

  const addRecentSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setState((prev) => ({
      ...prev,
      recentSearches: [q, ...prev.recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6),
    }));
  };

  const clearRecentSearches = () => {
    setState((prev) => ({ ...prev, recentSearches: [] }));
  };

  return (
    <StudyHubContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        selectedSubjectId,
        setSelectedSubjectId,
        selectedChapterId,
        setSelectedChapterId,
        selectedTopicId,
        setSelectedTopicId,
        libraryInitialCategory,
        setLibraryInitialCategory,
        pendingTestLaunch,
        setPendingTestLaunch,
        openSubjectChapterTopic,
        launchPracticeTest,
        addSubject,
        updateSubject,
        deleteSubject,
        toggleChapterComplete,
        toggleChapterBookmark,
        toggleTopicComplete,
        toggleTopicBookmark,
        setReadingPosition,
        updateChapterNotes,
        toggleMaterialBookmark,
        incrementMaterialDownload,
        reportMaterial,
        createNote,
        updateNote,
        deleteNote,
        toggleNotePin,
        toggleNoteBookmark,
        togglePaperBookmark,
        addUploadedPaper,
        toggleQuestionBookmark,
        saveTestResult,
        logStudyMinutes,
        setDailyGoalMinutes,
        addUploadedResource,
        renameUploadedResource,
        deleteUploadedResource,
        addReminder,
        toggleReminderComplete,
        deleteReminder,
        addRecentSearch,
        clearRecentSearches,
      }}
    >
      {children}
    </StudyHubContext.Provider>
  );
};

export const useStudyHub = () => {
  const ctx = useContext(StudyHubContext);
  if (!ctx) throw new Error('useStudyHub must be used within a StudyHubProvider');
  return ctx;
};
