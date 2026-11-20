import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  StudyHubState,
  StudySubject,
  StudyMaterialItem,
  PersonalNote,
  QuestionPaper,
  QuestionBankItem,
  PracticeTestResult,
  UploadedResource,
  StudyReminder,
  DailyStudyLog,
} from '../src/types/studyHub.ts';

interface StudyHubDatabase {
  subjects: StudySubject[];
  materials: StudyMaterialItem[];
  notes: PersonalNote[];
  papers: QuestionPaper[];
  questions: QuestionBankItem[];
  testHistory: PracticeTestResult[];
  uploads: UploadedResource[];
  reminders: StudyReminder[];
  weeklyLogs: DailyStudyLog[];
  dailyGoalMinutes: number;
  recentSearches: string[];
  activeReadingPosition: {
    subjectId: string;
    chapterId: string;
    topicId: string;
  };
}

const DB_PATH = path.join(process.cwd(), '.kampus_studyhub_db.json');

const INITIAL_FALLBACK_STATE: StudyHubDatabase = {
  subjects: [
    {
      id: 'subj-cs302',
      code: 'CS-302',
      name: 'Design & Analysis of Algorithms',
      level: 'Undergraduate',
      course: 'B.Tech Computer Science & AI',
      semesterOrClass: 'Semester 6',
      description: 'Divide-and-conquer, dynamic programming on trees and DAGs, greedy correctness proofs, network flows, and NP-completeness.',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      accentColor: 'blue',
      lastAccessedAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-cs302-1',
          number: 1,
          title: 'Asymptotics, Recurrences & Divide and Conquer',
          overview: 'Master Big-O/Omega/Theta notations, Master theorem, recursion-tree methods, and optimal divide and conquer implementations.',
          learningObjectives: [
            'Formulate asymptotic upper and lower bounds for divide-and-conquer recurrences',
            'Prove substitution master theorem bounds with corner cases',
            'Analyze Strassen matrix multiplication and median-of-medians linear selection'
          ],
          relatedMaterialIds: ['mat-cs302-dnc-notes'],
          completed: false,
          bookmarked: true,
          personalChapterNotes: 'Focus on case 3 of Master Theorem for upcoming mid-term exams.',
          topics: [
            {
              id: 'top-cs302-1-1',
              title: 'Asymptotic Notations & Formal Proofs',
              summary: 'Rigorous definitions of Big-O, Big-Omega, Big-Theta, Little-o, and Little-omega with formal epsilon-N proofs.',
              keyConcepts: ['Limit tests for asymptotic growth', 'Worst-case vs Average-case', 'Tight bounds'],
              studyNotes: 'Remember: f(n) = O(g(n)) iff lim sup f(n)/g(n) < infinity.',
              estimatedMinutes: 25,
              completed: false,
              bookmarked: true
            },
            {
              id: 'top-cs302-1-2',
              title: 'Master Method & Recursion Trees',
              summary: 'Solving T(n) = aT(n/b) + f(n) across three canonical cases, plus Akra-Bazzi intuition.',
              keyConcepts: ['Work per level', 'Branching factor', 'Regularity condition'],
              studyNotes: 'When f(n) = n^(log_b a), leaf costs match root cost: result is Theta(n^(log_b a) * log n).',
              estimatedMinutes: 30,
              completed: false,
              bookmarked: false
            }
          ]
        },
        {
          id: 'ch-cs302-2',
          number: 2,
          title: 'Dynamic Programming: Intervals, Trees & Bitmask',
          overview: 'Optimal substructure and overlapping subproblems in matrix chains, tree vertex covers, and traveling salesperson bitmask DP.',
          learningObjectives: [
            'Derive recursive subproblem formulations and verify acyclic state DAGs',
            'Compute memoized space-optimized tables for O(V+E) execution'
          ],
          relatedMaterialIds: [],
          completed: false,
          bookmarked: false,
          personalChapterNotes: '',
          topics: [
            {
              id: 'top-cs302-2-1',
              title: 'Longest Common Subsequence & Edit Distance',
              summary: '2D table reconstruction, space reduction to 2 rows, and Myers diff algorithm introduction.',
              keyConcepts: ['State transition', 'Backtracking paths', 'Linear space trick'],
              studyNotes: 'Base cases at table boundaries must be initialized cleanly.',
              estimatedMinutes: 35,
              completed: false,
              bookmarked: false
            }
          ]
        }
      ]
    },
    {
      id: 'subj-cs401',
      code: 'CS-401',
      name: 'Distributed Systems & Cloud Computing',
      level: 'Undergraduate',
      course: 'B.Tech Computer Science & AI',
      semesterOrClass: 'Semester 6',
      description: 'Consensus protocols (Raft & Paxos), vector clocks, distributed transactions (2PC/3PC), and event-driven microservices.',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      accentColor: 'indigo',
      lastAccessedAt: new Date().toISOString(),
      chapters: [
        {
          id: 'ch-cs401-1',
          number: 1,
          title: 'Clocks, Synchronization & Causality',
          overview: 'Physical clock drift, NTP, Lamport logical clocks, and causality tracking with vector clocks in distributed systems.',
          learningObjectives: [
            'Analyze clock drift bounds and Christian synchronization algorithm',
            'Implement Lamport timestamps and total ordering',
            'Differentiate concurrent events from causally related events using vector clocks'
          ],
          relatedMaterialIds: [],
          completed: false,
          bookmarked: false,
          personalChapterNotes: '',
          topics: [
            {
              id: 'top-cs401-1-1',
              title: 'Vector Clocks & Causality Violation Detection',
              summary: 'Component-wise comparison of clock vectors to detect message racing and ensure causally consistent delivery.',
              keyConcepts: ['Concurrent events', 'Causal ordering', 'Vector increments'],
              studyNotes: 'Event A happened-before B if and only if V(A)[k] <= V(B)[k] for all k and at least one strictly less.',
              estimatedMinutes: 30,
              completed: false,
              bookmarked: false
            }
          ]
        }
      ]
    }
  ],
  materials: [
    {
      id: 'mat-cs302-dnc-notes',
      title: 'Complete Algorithms Master Handouts & Proofs',
      subjectId: 'subj-cs302',
      subjectName: 'Design & Analysis of Algorithms',
      chapterName: 'Asymptotics, Recurrences & Divide and Conquer',
      semester: 'Semester 6',
      category: 'PDF Notes',
      uploadedBy: 'Dept of Computer Science',
      uploadDate: '2026-03-01',
      fileType: 'PDF',
      fileSize: '3.4 MB',
      pages: 48,
      downloads: 412,
      description: 'Comprehensive lecture handouts with solved recurrence equations, substitution proofs, and Strassen multiplication derivations.',
      previewContent: 'Section 1: Asymptotic Notation. Definition 1.1: Let f, g: N -> R+. We write f(n) = O(g(n)) if there exist positive constants c and n0 such that 0 <= f(n) <= c*g(n) for all n >= n0...',
      bookmarked: true,
      isVerifiedSample: true
    },
    {
      id: 'mat-cs401-raft-guide',
      title: 'In-Depth Raft Consensus Protocol Implementation Guide',
      subjectId: 'subj-cs401',
      subjectName: 'Distributed Systems & Cloud Computing',
      chapterName: 'Clocks, Synchronization & Causality',
      semester: 'Semester 6',
      category: 'Study Guides',
      uploadedBy: 'Distributed Labs',
      uploadDate: '2026-03-10',
      fileType: 'PDF',
      fileSize: '2.1 MB',
      pages: 32,
      downloads: 285,
      description: 'Step-by-step breakdown of Leader Election, Log Replication, Safety Invariants, and Cluster Membership Changes with Go pseudo-code.',
      previewContent: 'Raft decomposes consensus into three independent subproblems: 1) Leader Election, 2) Log Replication, and 3) Safety...',
      bookmarked: false,
      isVerifiedSample: true
    }
  ],
  notes: [
    {
      id: 'note-algo-master',
      title: 'Master Theorem Shortcut Formulae & Corner Cases',
      description: 'Quick reference sheet for recurrence relations T(n) = aT(n/b) + f(n)',
      content: '# Master Theorem Quick Reference\n\nFor `T(n) = a T(n/b) + f(n)` where `a >= 1` and `b > 1`:\n\n- **Case 1:** If `f(n) = O(n^(log_b(a) - eps))` for `eps > 0` => `T(n) = Theta(n^(log_b(a)))`\n- **Case 2:** If `f(n) = Theta(n^(log_b(a)) * log^k(n))` for `k >= 0` => `T(n) = Theta(n^(log_b(a)) * log^(k+1)(n))`\n- **Case 3:** If `f(n) = Omega(n^(log_b(a) + eps))` and regularity condition `a f(n/b) <= c f(n)` holds => `T(n) = Theta(f(n))`',
      subjectId: 'subj-cs302',
      chapterId: 'ch-cs302-1',
      pinned: true,
      bookmarked: true,
      createdAt: '2026-03-18T14:20:00Z',
      updatedAt: '2026-03-20T10:15:00Z'
    }
  ],
  papers: [
    {
      id: 'pyq-algo-2025',
      title: 'Algorithms Mid-Semester Examination 2025',
      subjectId: 'subj-cs302',
      subjectName: 'Design & Analysis of Algorithms',
      course: 'B.Tech Computer Science & AI',
      semester: 'Semester 6',
      year: 2025,
      examType: 'Mid-Sem',
      durationMinutes: 120,
      totalMarks: 50,
      fileSize: '1.2 MB',
      bookmarked: true,
      isVerifiedSample: true,
      paperTextPreview: 'Q1 (10 marks): Prove using substitution method that T(n) = 2T(n/2) + n log n is O(n log^2 n).\nQ2 (15 marks): Design an O(V + E) algorithm to find the topological order of a directed graph.',
      questionIds: ['qb-1', 'qb-2']
    }
  ],
  questions: [
    {
      id: 'qb-1',
      subjectId: 'subj-cs302',
      chapterId: 'ch-cs302-1',
      chapterName: 'Asymptotics & Recurrences',
      type: 'MCQ',
      difficulty: 'Medium',
      question: 'What is the asymptotic time complexity of the recurrence T(n) = 4T(n/2) + n^2?',
      options: ['O(n^2)', 'Theta(n^2 log n)', 'Theta(n^3)', 'Theta(n log n)'],
      correctAnswer: 'Theta(n^2 log n)',
      explanation: 'Here a = 4, b = 2. log_b(a) = log_2(4) = 2. Since f(n) = n^2 = Theta(n^(log_2 4)), by Case 2 of Master Theorem, T(n) = Theta(n^2 log n).',
      marks: 2,
      isImportant: true,
      isPyq: true,
      pyqYear: 2025,
      bookmarked: true
    },
    {
      id: 'qb-2',
      subjectId: 'subj-cs302',
      chapterId: 'ch-cs302-2',
      chapterName: 'Dynamic Programming',
      type: 'MCQ',
      difficulty: 'Easy',
      question: 'Which of the following problems exhibits optimal substructure and overlapping subproblems?',
      options: ['Longest Common Subsequence', 'Fractional Knapsack', 'Binary Search', 'Quicksort partition'],
      correctAnswer: 'Longest Common Subsequence',
      explanation: 'LCS breaks down into smaller identical prefix subproblems with optimal substructure, making it prime for Dynamic Programming.',
      marks: 2,
      isImportant: true,
      isPyq: false,
      bookmarked: false
    }
  ],
  testHistory: [],
  uploads: [],
  reminders: [
    {
      id: 'rem-1',
      title: 'Review Algorithms Chapter 2 Dynamic Programming notes',
      type: 'Revision',
      subjectId: 'subj-cs302',
      dueDateTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      completed: false,
      syncedToNotifications: true,
      notes: 'Prepare for Friday quiz on Matrix Chain Multiplication'
    }
  ],
  weeklyLogs: [
    { dayLabel: 'Mon', dateIso: new Date(Date.now() - 6 * 86400000).toISOString(), minutes: 45, isRecordedUserActivity: true },
    { dayLabel: 'Tue', dateIso: new Date(Date.now() - 5 * 86400000).toISOString(), minutes: 60, isRecordedUserActivity: true },
    { dayLabel: 'Wed', dateIso: new Date(Date.now() - 4 * 86400000).toISOString(), minutes: 90, isRecordedUserActivity: true },
    { dayLabel: 'Thu', dateIso: new Date(Date.now() - 3 * 86400000).toISOString(), minutes: 50, isRecordedUserActivity: true },
    { dayLabel: 'Fri', dateIso: new Date(Date.now() - 2 * 86400000).toISOString(), minutes: 80, isRecordedUserActivity: true },
    { dayLabel: 'Sat', dateIso: new Date(Date.now() - 1 * 86400000).toISOString(), minutes: 110, isRecordedUserActivity: true },
    { dayLabel: 'Sun', dateIso: new Date().toISOString(), minutes: 75, isRecordedUserActivity: true },
  ],
  dailyGoalMinutes: 60,
  recentSearches: ['Algorithms', 'Master Theorem', 'Raft Consensus'],
  activeReadingPosition: {
    subjectId: 'subj-cs302',
    chapterId: 'ch-cs302-1',
    topicId: 'top-cs302-1-1'
  }
};

function loadDb(): StudyHubDatabase {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (data && Array.isArray(data.subjects) && data.subjects.length > 0) {
        return {
          ...INITIAL_FALLBACK_STATE,
          ...data,
          subjects: data.subjects || INITIAL_FALLBACK_STATE.subjects,
          notes: data.notes || INITIAL_FALLBACK_STATE.notes,
          materials: data.materials || INITIAL_FALLBACK_STATE.materials,
          papers: data.papers || INITIAL_FALLBACK_STATE.papers,
          questions: data.questions || INITIAL_FALLBACK_STATE.questions,
          testHistory: data.testHistory || [],
          uploads: data.uploads || [],
          reminders: data.reminders || [],
          weeklyLogs: data.weeklyLogs || INITIAL_FALLBACK_STATE.weeklyLogs,
        };
      }
    }
  } catch (err) {
    console.error('[StudyHubDB Load Error]:', err);
  }
  // Initialize and write default
  saveDb(INITIAL_FALLBACK_STATE);
  return INITIAL_FALLBACK_STATE;
}

function saveDb(db: StudyHubDatabase): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[StudyHubDB Save Error]:', err);
  }
}

export function registerStudyHubBackend(app: Express): void {
  /**
   * 1. Bootstrap: fetch complete Study Hub state
   */
  app.get('/api/studyhub/bootstrap', (_req: Request, res: Response): void => {
    try {
      const db = loadDb();
      res.json({ success: true, data: db });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 2. Add / Update Subject
   */
  app.post('/api/studyhub/subject', (req: Request, res: Response): void => {
    try {
      const { id, code, name, level, course, semesterOrClass, description, initialChapterTitle } = req.body;
      if (!name) {
        res.status(400).json({ success: false, error: 'Subject name is required.' });
        return;
      }

      const db = loadDb();
      if (id) {
        const idx = db.subjects.findIndex((s) => s.id === id);
        if (idx !== -1) {
          db.subjects[idx] = { ...db.subjects[idx], ...req.body, lastAccessedAt: new Date().toISOString() };
          saveDb(db);
          res.json({ success: true, data: db.subjects[idx] });
          return;
        }
      }

      const newSubjectId = 'subj-' + Date.now().toString(36);
      const newChapterId = 'ch-' + Date.now().toString(36) + '-1';
      const newSubject: StudySubject = {
        id: newSubjectId,
        code: code || 'SUB-101',
        name: name.trim(),
        level: level || 'Undergraduate',
        course: course || 'General Sciences',
        semesterOrClass: semesterOrClass || 'Semester 1',
        description: description || 'Academic course curriculum and learning modules.',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
        accentColor: 'blue',
        isCustom: true,
        lastAccessedAt: new Date().toISOString(),
        chapters: initialChapterTitle
          ? [
              {
                id: newChapterId,
                number: 1,
                title: initialChapterTitle.trim(),
                overview: 'Core introductory principles and foundation objectives.',
                learningObjectives: ['Understand fundamental terminology and definitions'],
                relatedMaterialIds: [],
                completed: false,
                bookmarked: false,
                personalChapterNotes: '',
                topics: [
                  {
                    id: 'top-' + Date.now().toString(36) + '-1',
                    title: 'Module 1: Foundations',
                    summary: 'Introduction and initial lecture overview.',
                    keyConcepts: ['Key concepts', 'Syllabus roadmap'],
                    studyNotes: '',
                    estimatedMinutes: 20,
                    completed: false,
                    bookmarked: false,
                  },
                ],
              },
            ]
          : [],
      };

      db.subjects.unshift(newSubject);
      saveDb(db);
      res.status(201).json({ success: true, data: newSubject });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 3. Delete Subject
   */
  app.delete('/api/studyhub/subject/:id', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const db = loadDb();
      db.subjects = db.subjects.filter((s) => s.id !== id);
      db.notes = db.notes.filter((n) => n.subjectId !== id);
      saveDb(db);
      res.json({ success: true, message: 'Subject deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 4. Create or Update Personal Note
   */
  app.post('/api/studyhub/note', (req: Request, res: Response): void => {
    try {
      const { id, title, description, content, subjectId, chapterId, pinned, bookmarked } = req.body;
      if (!title || !subjectId) {
        res.status(400).json({ success: false, error: 'Note title and subject are required.' });
        return;
      }

      const db = loadDb();
      const now = new Date().toISOString();

      if (id) {
        const idx = db.notes.findIndex((n) => n.id === id);
        if (idx !== -1) {
          db.notes[idx] = {
            ...db.notes[idx],
            title: title.trim(),
            description: description || '',
            content: content || '',
            chapterId,
            pinned: pinned !== undefined ? pinned : db.notes[idx].pinned,
            bookmarked: bookmarked !== undefined ? bookmarked : db.notes[idx].bookmarked,
            updatedAt: now,
          };
          saveDb(db);
          res.json({ success: true, data: db.notes[idx] });
          return;
        }
      }

      const newNote: PersonalNote = {
        id: 'note-' + Date.now().toString(36) + '_' + crypto.randomBytes(2).toString('hex'),
        title: title.trim(),
        description: description || '',
        content: content || '',
        subjectId,
        chapterId,
        pinned: Boolean(pinned),
        bookmarked: Boolean(bookmarked),
        createdAt: now,
        updatedAt: now,
      };

      db.notes.unshift(newNote);
      saveDb(db);
      res.status(201).json({ success: true, data: newNote });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 5. Delete Personal Note
   */
  app.delete('/api/studyhub/note/:id', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const db = loadDb();
      db.notes = db.notes.filter((n) => n.id !== id);
      saveDb(db);
      res.json({ success: true, message: 'Note removed successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 6. Upload Resource / Notes File
   */
  app.post('/api/studyhub/resource/upload', (req: Request, res: Response): void => {
    try {
      const { name, originalName, fileType, mimeType, sizeBytes, sizeLabel, subjectId, category, previewDataUrl, textPreview } = req.body;
      if (!name || !subjectId) {
        res.status(400).json({ success: false, error: 'File name and subject are required.' });
        return;
      }

      const db = loadDb();
      const newUpload: UploadedResource = {
        id: 'upl-' + Date.now().toString(36),
        name: name.trim(),
        originalName: originalName || name,
        fileType: fileType || 'PDF',
        mimeType: mimeType || 'application/pdf',
        sizeBytes: sizeBytes || 1024 * 100,
        sizeLabel: sizeLabel || '100 KB',
        subjectId,
        category: category || 'PDF Notes',
        uploadedAt: new Date().toISOString(),
        previewDataUrl,
        textPreview: textPreview || 'Document successfully indexed and accessible for offline review.',
      };

      db.uploads.unshift(newUpload);
      saveDb(db);
      res.status(201).json({ success: true, data: newUpload });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 7. Delete Uploaded Resource
   */
  app.delete('/api/studyhub/resource/:id', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const db = loadDb();
      db.uploads = db.uploads.filter((u) => u.id !== id);
      saveDb(db);
      res.json({ success: true, message: 'Uploaded file removed.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 8. Toggle Chapter / Topic Completion & Bookmark
   */
  app.post('/api/studyhub/toggle-progress', (req: Request, res: Response): void => {
    try {
      const { subjectId, chapterId, topicId, field } = req.body; // field: 'completed' | 'bookmarked'
      const db = loadDb();

      const subject = db.subjects.find((s) => s.id === subjectId);
      if (!subject) {
        res.status(404).json({ success: false, error: 'Subject not found.' });
        return;
      }

      const chapter = subject.chapters.find((c) => c.id === chapterId);
      if (!chapter) {
        res.status(404).json({ success: false, error: 'Chapter not found.' });
        return;
      }

      if (topicId) {
        const topic = chapter.topics.find((t) => t.id === topicId);
        if (topic) {
          if (field === 'completed') topic.completed = !topic.completed;
          if (field === 'bookmarked') topic.bookmarked = !topic.bookmarked;
        }
      } else {
        if (field === 'completed') chapter.completed = !chapter.completed;
        if (field === 'bookmarked') chapter.bookmarked = !chapter.bookmarked;
      }

      subject.lastAccessedAt = new Date().toISOString();
      saveDb(db);
      res.json({ success: true, subject });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 9. Log Study Minutes
   */
  app.post('/api/studyhub/log-minutes', (req: Request, res: Response): void => {
    try {
      const { minutes = 25 } = req.body;
      const db = loadDb();

      const todayStr = new Date().toISOString().split('T')[0];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayLabel = days[new Date().getDay()];

      let existing = db.weeklyLogs.find((l) => l.dateIso.startsWith(todayStr));
      if (existing) {
        existing.minutes += Number(minutes);
        existing.isRecordedUserActivity = true;
      } else {
        db.weeklyLogs.push({
          dayLabel: todayLabel,
          dateIso: new Date().toISOString(),
          minutes: Number(minutes),
          isRecordedUserActivity: true,
        });
        if (db.weeklyLogs.length > 7) {
          db.weeklyLogs = db.weeklyLogs.slice(-7);
        }
      }

      saveDb(db);
      res.json({ success: true, weeklyLogs: db.weeklyLogs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 10. Record Practice Test Result
   */
  app.post('/api/studyhub/test-result', (req: Request, res: Response): void => {
    try {
      const result = req.body;
      const db = loadDb();
      db.testHistory.unshift({
        ...result,
        id: 'test-' + Date.now().toString(36),
        date: new Date().toISOString(),
      });
      saveDb(db);
      res.json({ success: true, testHistory: db.testHistory });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 11. Add / Toggle Reminder
   */
  app.post('/api/studyhub/reminders', (req: Request, res: Response): void => {
    try {
      const { id, title, type, subjectId, dueDateTime, notes, toggleComplete } = req.body;
      const db = loadDb();

      if (id && toggleComplete) {
        const item = db.reminders.find((r) => r.id === id);
        if (item) {
          item.completed = !item.completed;
          saveDb(db);
          res.json({ success: true, reminders: db.reminders });
          return;
        }
      }

      if (!title) {
        res.status(400).json({ success: false, error: 'Reminder title is required.' });
        return;
      }

      const newReminder: StudyReminder = {
        id: 'rem-' + Date.now().toString(36),
        title: title.trim(),
        type: type || 'Revision',
        subjectId,
        dueDateTime: dueDateTime || new Date(Date.now() + 86400000).toISOString(),
        completed: false,
        syncedToNotifications: true,
        notes,
      };

      db.reminders.unshift(newReminder);
      saveDb(db);
      res.status(201).json({ success: true, reminders: db.reminders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 12. Delete Reminder
   */
  app.delete('/api/studyhub/reminders/:id', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const db = loadDb();
      db.reminders = db.reminders.filter((r) => r.id !== id);
      saveDb(db);
      res.json({ success: true, reminders: db.reminders });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 13. Sync Full State / Backup
   */
  app.post('/api/studyhub/sync', (req: Request, res: Response): void => {
    try {
      const clientState = req.body;
      if (clientState && clientState.subjects) {
        saveDb(clientState);
      }
      res.json({ success: true, message: 'Study Hub synchronized.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
