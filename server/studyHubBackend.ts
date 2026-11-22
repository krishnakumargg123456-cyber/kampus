import { ModuleStorage } from '../database/moduleStorage.ts';
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// ==========================================
// 1. DATA MODELS FOR THE 6 CORE MODULES
// ==========================================

export interface StudyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyMaterial {
  id: string;
  userId: string;
  title: string;
  subject: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileSizeBytes: number;
  fileUri: string;
  isPublic: boolean;
  uploadedBy?: string;
  createdAt: string;
  lastOpenedAt?: string;
}

export interface StudyAssignment {
  id: string;
  userId: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string; // YYYY-MM-DD
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface StudyPlannerSession {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  goals: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
  completedAt?: string;
}

export interface QuizQuestion {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  subject: string;
  topic?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  userAnswers: Array<{
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
  }>;
  completedAt: string;
}

export interface StudyHubDatabase {
  notes: StudyNote[];
  materials: StudyMaterial[];
  assignments: StudyAssignment[];
  plannerSessions: StudyPlannerSession[];
  questions: QuizQuestion[];
  quizAttempts: QuizAttempt[];
}

const DB_PATH = path.join(process.cwd(), '.kampus_studyhub_db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'study-materials');

// ==========================================
// 2. REAL ACADEMIC INITIAL SEED DATA
// ==========================================

const INITIAL_QUESTIONS: QuizQuestion[] = [
  // Data Structures & Algorithms
  {
    id: 'q-dsa-1',
    subject: 'Data Structures & Algorithms',
    topic: 'Searching & Sorting',
    difficulty: 'Easy',
    question: 'What is the worst-case time complexity of standard Binary Search on a sorted array of size N?',
    options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
    correctAnswer: 1,
    explanation: 'Binary Search halves the search space at each comparison step, leading to logarithmic O(log N) time complexity.',
  },
  {
    id: 'q-dsa-2',
    subject: 'Data Structures & Algorithms',
    topic: 'Graph Algorithms',
    difficulty: 'Medium',
    question: 'Which graph traversal algorithm uses a FIFO Queue and is guaranteed to find the shortest path in an unweighted graph?',
    options: ['Depth First Search (DFS)', 'Breadth First Search (BFS)', 'Dijkstra Algorithm', 'Bellman-Ford Algorithm'],
    correctAnswer: 1,
    explanation: 'BFS explores vertices level by level using a queue, guaranteeing the shortest path in unweighted graphs.',
  },
  {
    id: 'q-dsa-3',
    subject: 'Data Structures & Algorithms',
    topic: 'Trees & Heaps',
    difficulty: 'Medium',
    question: 'In an AVL tree, what is the maximum allowed difference in heights between the left and right subtrees of any node?',
    options: ['0', '1', '2', 'log N'],
    correctAnswer: 1,
    explanation: 'AVL trees strictly enforce a balance factor of -1, 0, or +1 at every node to maintain O(log N) height.',
  },
  {
    id: 'q-dsa-4',
    subject: 'Data Structures & Algorithms',
    topic: 'Dynamic Programming',
    difficulty: 'Hard',
    question: 'Which condition is strictly required for a dynamic programming solution to be applicable to an optimization problem?',
    options: ['Greedy choice property only', 'Optimal substructure and overlapping subproblems', 'Linear recursion without memoization', 'Unbounded graph state transitions'],
    correctAnswer: 1,
    explanation: 'Dynamic Programming applies when problems exhibit both optimal substructure (optimal solution contains optimal sub-solutions) and overlapping subproblems.',
  },
  {
    id: 'q-dsa-5',
    subject: 'Data Structures & Algorithms',
    topic: 'Algorithm Analysis',
    difficulty: 'Medium',
    question: 'According to the Master Theorem, what is the asymptotic solution of T(n) = 2T(n/2) + O(n)?',
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(2^n)'],
    correctAnswer: 1,
    explanation: 'Here a=2, b=2, log_b(a) = 1. Since f(n) = O(n^1), it falls into Case 2 of Master Theorem, giving O(n log n).',
  },

  // Database Management Systems
  {
    id: 'q-dbms-1',
    subject: 'Database Management Systems',
    topic: 'Transactions & Concurrency',
    difficulty: 'Easy',
    question: 'Which ACID property ensures that a transaction completes entirely or leaves the database unchanged if it fails?',
    options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
    correctAnswer: 0,
    explanation: 'Atomicity follows the all-or-nothing rule: either all operations in a transaction succeed, or the entire transaction is rolled back.',
  },
  {
    id: 'q-dbms-2',
    subject: 'Database Management Systems',
    topic: 'Normalization',
    difficulty: 'Medium',
    question: 'A relational schema is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency X -> Y:',
    options: ['Y is a prime attribute', 'X is a superkey', 'X is in 2NF', 'Y functionally determines X'],
    correctAnswer: 1,
    explanation: 'In BCNF, every determinant X in non-trivial functional dependency X -> Y must be a superkey of the relation.',
  },
  {
    id: 'q-dbms-3',
    subject: 'Database Management Systems',
    topic: 'Indexing',
    difficulty: 'Hard',
    question: 'Why are B+ Trees preferred over Binary Search Trees for disk-based database indexing?',
    options: ['B+ trees use less RAM', 'B+ trees have a high branching factor minimizing disk I/O seeks', 'B+ trees avoid range queries', 'B+ trees require no balancing'],
    correctAnswer: 1,
    explanation: 'B+ Trees have huge node capacity (fan-out), making the tree short (3-4 levels) and drastically minimizing expensive mechanical or NVMe disk I/O reads.',
  },
  {
    id: 'q-dbms-4',
    subject: 'Database Management Systems',
    topic: 'SQL Queries',
    difficulty: 'Easy',
    question: 'Which SQL clause is used to filter aggregated group results produced by GROUP BY?',
    options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
    correctAnswer: 1,
    explanation: 'WHERE filters rows before aggregation, whereas HAVING filters group results after aggregation.',
  },

  // Operating Systems
  {
    id: 'q-os-1',
    subject: 'Operating Systems',
    topic: 'Process Scheduling',
    difficulty: 'Easy',
    question: 'Which scheduling algorithm is preemptive and allocates a fixed time quantum per process in circular order?',
    options: ['First-Come, First-Served (FCFS)', 'Round Robin (RR)', 'Shortest Job First (SJF)', 'Priority Scheduling without preemption'],
    correctAnswer: 1,
    explanation: 'Round Robin assigns each ready process a fixed time slice (quantum) in circular order to ensure fair CPU sharing.',
  },
  {
    id: 'q-os-2',
    subject: 'Operating Systems',
    topic: 'Deadlocks',
    difficulty: 'Medium',
    question: 'Which of the following is NOT one of the Coffman conditions required for a deadlock to occur?',
    options: ['Mutual Exclusion', 'Hold and Wait', 'Preemption allowed', 'Circular Wait'],
    correctAnswer: 2,
    explanation: 'Deadlock requires NO preemption. If preemption is allowed, the operating system can reclaim resources and avoid deadlock.',
  },
  {
    id: 'q-os-3',
    subject: 'Operating Systems',
    topic: 'Memory Management',
    difficulty: 'Hard',
    question: 'What is Belady\'s Anomaly in operating systems virtual memory management?',
    options: ['Page fault rate increases as number of allocated frame pages increases in FIFO', 'Thrashing due to excessive page swaps', 'Translation Lookaside Buffer (TLB) misses on write', 'External fragmentation in segmented memory'],
    correctAnswer: 0,
    explanation: 'Belady\'s Anomaly is the counter-intuitive phenomenon in FIFO page replacement where giving more memory frames actually results in more page faults.',
  },

  // Computer Networks
  {
    id: 'q-cn-1',
    subject: 'Computer Networks',
    topic: 'Transport Layer',
    difficulty: 'Easy',
    question: 'How many packets are exchanged in a standard TCP connection establishment handshake?',
    options: ['2 (SYN, ACK)', '3 (SYN, SYN-ACK, ACK)', '4 (SYN, ACK, DATA, FIN)', '1 (UDP Datagram)'],
    correctAnswer: 1,
    explanation: 'TCP 3-Way Handshake consists of client SYN, server SYN-ACK, and client ACK before reliable stream data transfer begins.',
  },
  {
    id: 'q-cn-2',
    subject: 'Computer Networks',
    topic: 'IP Addressing & Subnetting',
    difficulty: 'Medium',
    question: 'In a /24 IPv4 subnet (255.255.255.0), how many usable host IP addresses are available?',
    options: ['256', '254', '255', '128'],
    correctAnswer: 1,
    explanation: 'Total IP addresses = 2^8 = 256. Subnet address (.0) and Broadcast address (.255) cannot be assigned to hosts, leaving 254 usable addresses.',
  },

  // Artificial Intelligence & Machine Learning
  {
    id: 'q-ai-1',
    subject: 'Artificial Intelligence & Machine Learning',
    topic: 'Neural Networks',
    difficulty: 'Medium',
    question: 'What is the primary advantage of the Rectified Linear Unit (ReLU) activation function over Sigmoid in deep neural networks?',
    options: ['ReLU bounds output between 0 and 1', 'ReLU mitigates the vanishing gradient problem for positive inputs', 'ReLU is differentiable at all points', 'ReLU guarantees convex optimization'],
    correctAnswer: 1,
    explanation: 'Unlike Sigmoid where gradients saturate near 0 or 1, ReLU has a constant derivative of 1 for positive inputs, avoiding vanishing gradients during backpropagation.',
  },
  {
    id: 'q-ai-2',
    subject: 'Artificial Intelligence & Machine Learning',
    topic: 'Model Evaluation',
    difficulty: 'Easy',
    question: 'In binary classification, what metric measures the proportion of actual positives that were correctly identified (TP / (TP + FN))?',
    options: ['Precision', 'Recall (Sensitivity)', 'Accuracy', 'Specificity'],
    correctAnswer: 1,
    explanation: 'Recall (or Sensitivity) measures the proportion of actual positive cases correctly identified: True Positives / (True Positives + False Negatives).',
  },
];

const INITIAL_FALLBACK_STATE: StudyHubDatabase = {
  notes: [
    {
      id: 'note-sample-1',
      userId: 'global_sample',
      title: 'Master Theorem Quick Formulae & Boundary Conditions',
      content: '# Master Theorem Cheat Sheet\n\nFor divide and conquer recurrences `T(n) = a*T(n/b) + f(n)`:\n\n- **Case 1:** If `f(n) = O(n^(log_b(a) - ε))` where `ε > 0` => `T(n) = Θ(n^log_b(a))`\n- **Case 2:** If `f(n) = Θ(n^log_b(a) * log^k(n))` where `k >= 0` => `T(n) = Θ(n^log_b(a) * log^(k+1)(n))`\n- **Case 3:** If `f(n) = Ω(n^(log_b(a) + ε))` and `a*f(n/b) <= c*f(n)` => `T(n) = Θ(f(n))`\n\n### Examples:\n- `T(n) = 2T(n/2) + O(n)` => Case 2 (`k=0`): `O(n log n)`\n- `T(n) = 4T(n/2) + n` => Case 1: `O(n^2)`',
      subject: 'Data Structures & Algorithms',
      tags: ['Algorithms', 'Exam Prep', 'Recurrences'],
      pinned: true,
      createdAt: '2026-03-15T10:00:00Z',
      updatedAt: '2026-03-20T14:30:00Z',
    },
    {
      id: 'note-sample-2',
      userId: 'global_sample',
      title: 'ACID Properties & Database Transaction Isolation Levels',
      content: '## ACID Guarantees\n\n1. **Atomicity:** All operations succeed or all roll back.\n2. **Consistency:** Database transitions only between valid states conforming to constraints.\n3. **Isolation:** Concurrent transactions execute without cross-contamination.\n4. **Durability:** Committed data is permanently written to non-volatile storage.\n\n## Isolation Levels (Weakest to Strongest)\n- Read Uncommitted (Dirty reads possible)\n- Read Committed (No dirty reads)\n- Repeatable Read (No non-repeatable reads; snapshot isolation)\n- Serializable (Strict 2-Phase Locking / Serializable Snapshot Isolation)',
      subject: 'Database Management Systems',
      tags: ['DBMS', 'Transactions', 'SQL'],
      pinned: false,
      createdAt: '2026-03-18T11:20:00Z',
      updatedAt: '2026-03-21T09:15:00Z',
    },
  ],
  materials: [
    {
      id: 'mat-sample-1',
      userId: 'global_sample',
      title: 'Operating Systems Complete Lecture Notes & Scheduling Guides',
      subject: 'Operating Systems',
      fileName: 'Operating_Systems_Lecture_Notes.pdf',
      fileType: 'PDF',
      fileSize: '3.8 MB',
      fileSizeBytes: 3984588,
      fileUri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      isPublic: true,
      uploadedBy: 'Dept of Computer Science',
      createdAt: '2026-03-10T12:00:00Z',
    },
    {
      id: 'mat-sample-2',
      userId: 'global_sample',
      title: 'Computer Networks TCP/IP Stack & Subnetting Reference Sheet',
      subject: 'Computer Networks',
      fileName: 'Computer_Networks_Reference.pdf',
      fileType: 'PDF',
      fileSize: '2.1 MB',
      fileSizeBytes: 2202009,
      fileUri: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      isPublic: true,
      uploadedBy: 'Campus Academic Council',
      createdAt: '2026-03-12T15:30:00Z',
    },
  ],
  assignments: [
    {
      id: 'asgn-sample-1',
      userId: 'global_sample',
      title: 'Implement Dijkstra and Bellman-Ford Shortest Path in C++/Python',
      description: 'Write clean code with benchmark analysis on sparse vs dense graphs with negative cycle detection.',
      subject: 'Data Structures & Algorithms',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-03-20T10:00:00Z',
      updatedAt: '2026-03-21T12:00:00Z',
    },
    {
      id: 'asgn-sample-2',
      userId: 'global_sample',
      title: 'Design 3NF Relational Schema for University ERP System',
      description: 'Create ER diagram, write SQL DDL scripts with foreign keys, and normalize table attributes to BCNF.',
      subject: 'Database Management Systems',
      dueDate: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
      priority: 'Medium',
      status: 'Pending',
      createdAt: '2026-03-19T09:00:00Z',
      updatedAt: '2026-03-19T09:00:00Z',
    },
  ],
  plannerSessions: [
    {
      id: 'sess-sample-1',
      userId: 'global_sample',
      subject: 'Data Structures & Algorithms',
      topic: 'Dynamic Programming on Trees & DAGs',
      date: new Date().toISOString().slice(0, 10),
      startTime: '10:00',
      endTime: '11:30',
      goals: 'Solve 3 LeetCode Medium tree DP problems and write notes.',
      status: 'Scheduled',
      createdAt: '2026-03-22T08:00:00Z',
    },
    {
      id: 'sess-sample-2',
      userId: 'global_sample',
      subject: 'Operating Systems',
      topic: 'Deadlock Prevention & Banker Algorithm',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      startTime: '14:00',
      endTime: '15:30',
      goals: 'Review Banker safety algorithm proof and practice numericals.',
      status: 'Scheduled',
      createdAt: '2026-03-22T08:00:00Z',
    },
  ],
  questions: INITIAL_QUESTIONS,
  quizAttempts: [],
};

const studyhubStorage = new ModuleStorage<StudyHubDatabase>(
  'studyhub',
  DB_PATH,
  () => INITIAL_FALLBACK_STATE
);

function loadDb(): StudyHubDatabase {
  const db = studyhubStorage.get();
  // Ensure all collections exist
  if (!db.notes) db.notes = [...INITIAL_FALLBACK_STATE.notes];
  if (!db.materials) db.materials = [...INITIAL_FALLBACK_STATE.materials];
  if (!db.assignments) db.assignments = [...INITIAL_FALLBACK_STATE.assignments];
  if (!db.plannerSessions) db.plannerSessions = [...INITIAL_FALLBACK_STATE.plannerSessions];
  if (!db.questions || db.questions.length === 0 || !(db.questions[0] as any).subject) {
    db.questions = [...INITIAL_QUESTIONS];
  }
  if (!db.quizAttempts) db.quizAttempts = [];
  return db;
}

function saveDb(db: StudyHubDatabase): void {
  studyhubStorage.saveSync(db);
}

/**
 * Extracts student userId from Clerk token or custom authorization header.
 */
function getAuthenticatedUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.sub || decoded.userId)) {
        return decoded.sub || decoded.userId;
      }
    } catch {}
  }
  const headerUserId = req.headers['x-user-id'] || req.headers['x-clerk-user-id'];
  if (headerUserId && typeof headerUserId === 'string' && headerUserId.trim().length > 0) {
    return headerUserId.trim();
  }
  return 'student_default';
}

// ==========================================
// 3. REGISTER ALL 6 STUDY HUB MODULE ENDPOINTS
// ==========================================

export function registerStudyHubBackend(app: Express): void {
  // Ensure local uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // ------------------------------------------
  // MODULE 1: MY NOTES APIS
  // ------------------------------------------

  // List user's notes
  app.get('/api/studyhub/notes', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { search, subject, sort = 'updated' } = req.query;
      const db = loadDb();

      let notes = db.notes.filter((n) => n.userId === userId || n.userId === 'global_sample');

      if (subject && typeof subject === 'string' && subject !== 'All') {
        notes = notes.filter((n) => n.subject.toLowerCase() === subject.toLowerCase());
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        notes = notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.subject.toLowerCase().includes(q) ||
            n.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      // Sort: pinned first, then by date
      notes.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const dateA = new Date(sort === 'created' ? a.createdAt : a.updatedAt).getTime();
        const dateB = new Date(sort === 'created' ? b.createdAt : b.updatedAt).getTime();
        return dateB - dateA;
      });

      res.json({ success: true, count: notes.length, data: notes });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create a note
  app.post('/api/studyhub/notes', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { title, content, subject, tags, pinned = false } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, error: 'Note title is required.' });
        return;
      }

      const now = new Date().toISOString();
      const newNote: StudyNote = {
        id: 'note_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex'),
        userId,
        title: title.trim(),
        content: content || '',
        subject: subject?.trim() || 'General Studies',
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
        pinned: Boolean(pinned),
        createdAt: now,
        updatedAt: now,
      };

      const db = loadDb();
      db.notes.unshift(newNote);
      saveDb(db);

      res.status(201).json({ success: true, data: newNote });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get note by id
  app.get('/api/studyhub/notes/:id', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      const db = loadDb();

      const note = db.notes.find((n) => n.id === id && (n.userId === userId || n.userId === 'global_sample'));
      if (!note) {
        res.status(404).json({ success: false, error: 'Note not found.' });
        return;
      }

      res.json({ success: true, data: note });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update a note
  app.put('/api/studyhub/notes/:id', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      const { title, content, subject, tags, pinned } = req.body;
      const db = loadDb();

      const idx = db.notes.findIndex((n) => n.id === id);
      if (idx === -1) {
        res.status(404).json({ success: false, error: 'Note not found.' });
        return;
      }

      // Check ownership
      if (db.notes[idx].userId !== userId && db.notes[idx].userId !== 'global_sample') {
        res.status(403).json({ success: false, error: 'Unauthorized to modify this note.' });
        return;
      }

      const existing = db.notes[idx];
      db.notes[idx] = {
        ...existing,
        title: title !== undefined ? title.trim() : existing.title,
        content: content !== undefined ? content : existing.content,
        subject: subject !== undefined ? subject.trim() : existing.subject,
        tags: Array.isArray(tags) ? tags : existing.tags,
        pinned: pinned !== undefined ? Boolean(pinned) : existing.pinned,
        updatedAt: new Date().toISOString(),
      };

      saveDb(db);
      res.json({ success: true, data: db.notes[idx] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Toggle pin
  app.patch('/api/studyhub/notes/:id/pin', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      const db = loadDb();

      const note = db.notes.find((n) => n.id === id);
      if (!note) {
        res.status(404).json({ success: false, error: 'Note not found.' });
        return;
      }

      note.pinned = !note.pinned;
      note.updatedAt = new Date().toISOString();
      saveDb(db);

      res.json({ success: true, data: note });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete a note
  app.delete('/api/studyhub/notes/:id', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      const db = loadDb();

      const note = db.notes.find((n) => n.id === id);
      if (!note) {
        res.status(404).json({ success: false, error: 'Note not found.' });
        return;
      }

      if (note.userId !== userId && note.userId !== 'global_sample') {
        res.status(403).json({ success: false, error: 'Unauthorized to delete this note.' });
        return;
      }

      db.notes = db.notes.filter((n) => n.id !== id);
      saveDb(db);

      res.json({ success: true, message: 'Note deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // MODULE 2: STUDY MATERIALS APIS
  // ------------------------------------------

  // List materials
  app.get('/api/studyhub/materials', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { search, subject } = req.query;
      const db = loadDb();

      let materials = db.materials.filter((m) => m.isPublic || m.userId === userId || m.userId === 'global_sample');

      if (subject && typeof subject === 'string' && subject !== 'All') {
        materials = materials.filter((m) => m.subject.toLowerCase() === subject.toLowerCase());
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        materials = materials.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.fileName.toLowerCase().includes(q) ||
            m.subject.toLowerCase().includes(q)
        );
      }

      materials.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json({ success: true, count: materials.length, data: materials });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Upload/Import study material
  app.post('/api/studyhub/materials', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { title, subject, fileName, fileType, fileSize, fileBase64, isPublic = true } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, error: 'Material title is required.' });
        return;
      }

      const cleanFileName = (fileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = path.extname(cleanFileName).toLowerCase();
      const allowedExts = ['.pdf', '.docx', '.pptx', '.txt', '.png', '.jpg', '.jpeg'];

      if (!allowedExts.includes(ext) && ext !== '') {
        res.status(400).json({
          success: false,
          error: `Unsupported file format '${ext}'. Supported formats: PDF, DOCX, PPTX, TXT, PNG, JPG.`,
        });
        return;
      }

      let storedUri = '';
      let calculatedBytes = 0;

      // Save file to disk if base64 provided
      if (fileBase64 && typeof fileBase64 === 'string') {
        const rawBase64 = fileBase64.replace(/^data:.*?;base64,/, '');
        const fileBuffer = Buffer.from(rawBase64, 'base64');
        calculatedBytes = fileBuffer.length;

        // Max 10MB file limit
        if (calculatedBytes > 10 * 1024 * 1024) {
          res.status(400).json({ success: false, error: 'File size exceeds maximum allowed limit of 10 MB.' });
          return;
        }

        const safeSavedName = `${Date.now()}_${cleanFileName}`;
        const targetPath = path.join(UPLOADS_DIR, safeSavedName);
        fs.writeFileSync(targetPath, fileBuffer);
        storedUri = `/uploads/study-materials/${safeSavedName}`;
      } else {
        storedUri = req.body.fileUri || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      }

      const formattedSize =
        fileSize || (calculatedBytes > 0 ? (calculatedBytes / (1024 * 1024)).toFixed(1) + ' MB' : '1.5 MB');

      const newMaterial: StudyMaterial = {
        id: 'mat_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex'),
        userId,
        title: title.trim(),
        subject: subject?.trim() || 'General Studies',
        fileName: cleanFileName,
        fileType: (fileType || ext.replace('.', '').toUpperCase()) || 'PDF',
        fileSize: formattedSize,
        fileSizeBytes: calculatedBytes,
        fileUri: storedUri,
        isPublic: Boolean(isPublic),
        uploadedBy: req.body.uploadedBy || 'Student',
        createdAt: new Date().toISOString(),
      };

      const db = loadDb();
      db.materials.unshift(newMaterial);
      saveDb(db);

      res.status(201).json({ success: true, data: newMaterial });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Mark material opened / track last opened
  app.post('/api/studyhub/materials/:id/opened', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const db = loadDb();

      const mat = db.materials.find((m) => m.id === id);
      if (!mat) {
        res.status(404).json({ success: false, error: 'Material not found.' });
        return;
      }

      mat.lastOpenedAt = new Date().toISOString();
      saveDb(db);

      res.json({ success: true, data: mat });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete material
  app.delete('/api/studyhub/materials/:id', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      const db = loadDb();

      const mat = db.materials.find((m) => m.id === id);
      if (!mat) {
        res.status(404).json({ success: false, error: 'Material not found.' });
        return;
      }

      if (mat.userId !== userId && mat.userId !== 'global_sample') {
        res.status(403).json({ success: false, error: 'Unauthorized to delete this material.' });
        return;
      }

      // Delete file from disk if local upload
      if (mat.fileUri && mat.fileUri.startsWith('/uploads/')) {
        const localFilePath = path.join(process.cwd(), mat.fileUri);
        if (fs.existsSync(localFilePath)) {
          try {
            fs.unlinkSync(localFilePath);
          } catch {}
        }
      }

      db.materials = db.materials.filter((m) => m.id !== id);
      saveDb(db);

      res.json({ success: true, message: 'Material removed successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // MODULE 3: ASSIGNMENTS & TASKS APIS
  // ------------------------------------------

  // List assignments
  app.get('/api/studyhub/assignments', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { search, status, priority, subject, sort = 'dueDate' } = req.query;
      const db = loadDb();

      let assignments = db.assignments.filter(
        (a) => a.userId === userId || a.userId === 'global_sample'
      );

      if (status && typeof status === 'string' && status !== 'All') {
        assignments = assignments.filter((a) => a.status.toLowerCase() === status.toLowerCase());
      }

      if (priority && typeof priority === 'string' && priority !== 'All') {
        assignments = assignments.filter((a) => a.priority.toLowerCase() === priority.toLowerCase());
      }

      if (subject && typeof subject === 'string' && subject !== 'All') {
        assignments = assignments.filter((a) => a.subject.toLowerCase() === subject.toLowerCase());
      }

      if (search && typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        assignments = assignments.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.subject.toLowerCase().includes(q)
        );
      }

      // Sort by due date (earliest deadline first)
      assignments.sort((a, b) => {
        if (sort === 'dueDate') {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json({ success: true, count: assignments.length, data: assignments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create assignment
  app.post('/api/studyhub/assignments', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { title, description, subject, dueDate, priority = 'Medium', status = 'Pending' } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, error: 'Assignment title is required.' });
        return;
      }
      if (!dueDate) {
        res.status(400).json({ success: false, error: 'Assignment due date is required.' });
        return;
      }

      const now = new Date().toISOString();
      const newAssignment: StudyAssignment = {
        id: 'asgn_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex'),
        userId,
        title: title.trim(),
        description: description?.trim() || '',
        subject: subject?.trim() || 'General Studies',
        dueDate: dueDate.slice(0, 10),
        priority: priority || 'Medium',
        status: status || 'Pending',
        createdAt: now,
        updatedAt: now,
      };

      const db = loadDb();
      db.assignments.unshift(newAssignment);
      saveDb(db);

      res.status(201).json({ success: true, data: newAssignment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update assignment
  app.put('/api/studyhub/assignments/:id', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      const { title, description, subject, dueDate, priority, status } = req.body;
      const db = loadDb();

      const idx = db.assignments.findIndex((a) => a.id === id);
      if (idx === -1) {
        res.status(404).json({ success: false, error: 'Assignment not found.' });
        return;
      }

      if (db.assignments[idx].userId !== userId && db.assignments[idx].userId !== 'global_sample') {
        res.status(403).json({ success: false, error: 'Unauthorized to update this assignment.' });
        return;
      }

      const existing = db.assignments[idx];
      const now = new Date().toISOString();
      const updatedStatus = status !== undefined ? status : existing.status;

      db.assignments[idx] = {
        ...existing,
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? description.trim() : existing.description,
        subject: subject !== undefined ? subject.trim() : existing.subject,
        dueDate: dueDate !== undefined ? dueDate.slice(0, 10) : existing.dueDate,
        priority: priority !== undefined ? priority : existing.priority,
        status: updatedStatus,
        updatedAt: now,
        completedAt: updatedStatus === 'Completed' ? existing.completedAt || now : undefined,
      };

      saveDb(db);
      res.json({ success: true, data: db.assignments[idx] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Toggle/Update status
  app.patch('/api/studyhub/assignments/:id/status', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      const { status } = req.body;
      const db = loadDb();

      const asgn = db.assignments.find((a) => a.id === id);
      if (!asgn) {
        res.status(404).json({ success: false, error: 'Assignment not found.' });
        return;
      }

      const targetStatus =
        status || (asgn.status === 'Completed' ? 'Pending' : 'Completed');
      asgn.status = targetStatus;
      asgn.updatedAt = new Date().toISOString();
      if (targetStatus === 'Completed') {
        asgn.completedAt = new Date().toISOString();
      } else {
        asgn.completedAt = undefined;
      }

      saveDb(db);
      res.json({ success: true, data: asgn });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete assignment
  app.delete('/api/studyhub/assignments/:id', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      const db = loadDb();

      const asgn = db.assignments.find((a) => a.id === id);
      if (!asgn) {
        res.status(404).json({ success: false, error: 'Assignment not found.' });
        return;
      }

      if (asgn.userId !== userId && asgn.userId !== 'global_sample') {
        res.status(403).json({ success: false, error: 'Unauthorized to delete this assignment.' });
        return;
      }

      db.assignments = db.assignments.filter((a) => a.id !== id);
      saveDb(db);

      res.json({ success: true, message: 'Assignment deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // MODULE 4: STUDY PLANNER & TIMETABLE APIS
  // ------------------------------------------

  // List study sessions
  app.get('/api/studyhub/planner/sessions', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { date, startDate, endDate, subject } = req.query;
      const db = loadDb();

      let sessions = db.plannerSessions.filter(
        (s) => s.userId === userId || s.userId === 'global_sample'
      );

      if (date && typeof date === 'string') {
        sessions = sessions.filter((s) => s.date === date);
      } else if (startDate && endDate) {
        sessions = sessions.filter((s) => s.date >= String(startDate) && s.date <= String(endDate));
      }

      if (subject && typeof subject === 'string' && subject !== 'All') {
        sessions = sessions.filter((s) => s.subject.toLowerCase() === subject.toLowerCase());
      }

      // Sort by date and startTime
      sessions.sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp;
        return a.startTime.localeCompare(b.startTime);
      });

      res.json({ success: true, count: sessions.length, data: sessions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create study session
  app.post('/api/studyhub/planner/sessions', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { subject, topic, date, startTime, endTime, goals, status = 'Scheduled' } = req.body;

      if (!subject || !subject.trim()) {
        res.status(400).json({ success: false, error: 'Subject is required.' });
        return;
      }
      if (!topic || !topic.trim()) {
        res.status(400).json({ success: false, error: 'Topic or goal description is required.' });
        return;
      }
      if (!date || !startTime || !endTime) {
        res.status(400).json({ success: false, error: 'Date, start time, and end time are required.' });
        return;
      }

      // Time validation
      if (startTime >= endTime) {
        res.status(400).json({ success: false, error: 'Start time must be before end time.' });
        return;
      }

      const db = loadDb();

      // Check overlapping sessions on the same date for this user
      const hasOverlap = db.plannerSessions.some((s) => {
        if (s.userId !== userId && s.userId !== 'global_sample') return false;
        if (s.date !== date || s.status === 'Cancelled') return false;
        // Overlap condition: start < other.end && end > other.start
        return startTime < s.endTime && endTime > s.startTime;
      });

      if (hasOverlap) {
        res.status(400).json({
          success: false,
          error: `A study session is already scheduled between ${startTime} and ${endTime} on ${date}.`,
        });
        return;
      }

      const newSession: StudyPlannerSession = {
        id: 'sess_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex'),
        userId,
        subject: subject.trim(),
        topic: topic.trim(),
        date: date.slice(0, 10),
        startTime: startTime.slice(0, 5),
        endTime: endTime.slice(0, 5),
        goals: goals?.trim() || '',
        status: status || 'Scheduled',
        createdAt: new Date().toISOString(),
      };

      db.plannerSessions.push(newSession);
      saveDb(db);

      res.status(201).json({ success: true, data: newSession });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Mark session completed
  app.patch('/api/studyhub/planner/sessions/:id/complete', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const db = loadDb();

      const sess = db.plannerSessions.find((s) => s.id === id);
      if (!sess) {
        res.status(404).json({ success: false, error: 'Study session not found.' });
        return;
      }

      sess.status = sess.status === 'Completed' ? 'Scheduled' : 'Completed';
      sess.completedAt = sess.status === 'Completed' ? new Date().toISOString() : undefined;
      saveDb(db);

      res.json({ success: true, data: sess });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete session
  app.delete('/api/studyhub/planner/sessions/:id', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { id } = req.params;
      const db = loadDb();

      const sess = db.plannerSessions.find((s) => s.id === id);
      if (!sess) {
        res.status(404).json({ success: false, error: 'Study session not found.' });
        return;
      }

      if (sess.userId !== userId && sess.userId !== 'global_sample') {
        res.status(403).json({ success: false, error: 'Unauthorized to delete this study session.' });
        return;
      }

      db.plannerSessions = db.plannerSessions.filter((s) => s.id !== id);
      saveDb(db);

      res.json({ success: true, message: 'Session deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // MODULE 5: QUIZ & PRACTICE APIS
  // ------------------------------------------

  // List quiz subjects and available questions count
  app.get('/api/studyhub/quiz/subjects', (_req: Request, res: Response): void => {
    try {
      const db = loadDb();
      const subjectMap: Record<string, { count: number; topics: Set<string> }> = {};

      for (const q of db.questions) {
        if (!subjectMap[q.subject]) {
          subjectMap[q.subject] = { count: 0, topics: new Set() };
        }
        subjectMap[q.subject].count += 1;
        if (q.topic) subjectMap[q.subject].topics.add(q.topic);
      }

      const list = Object.entries(subjectMap).map(([subject, data]) => ({
        subject,
        questionCount: data.count,
        topics: Array.from(data.topics),
      }));

      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Retrieve test questions (scrubbing correct answers for quiz integrity)
  app.get('/api/studyhub/quiz/questions', (req: Request, res: Response): void => {
    try {
      const { subject, count = 5 } = req.query;
      const db = loadDb();

      let pool = db.questions;
      if (subject && typeof subject === 'string' && subject !== 'All') {
        pool = pool.filter((q) => q.subject.toLowerCase() === subject.toLowerCase());
      }

      // Shuffle pool
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Number(count) || 5);

      // Sanitize: strip correctAnswer and explanation before sending to client
      const sanitized = selected.map((q) => ({
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
      }));

      res.json({ success: true, count: sanitized.length, data: sanitized });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Submit quiz answers & grade on backend
  app.post('/api/studyhub/quiz/submit', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const { subject, topic, answers } = req.body; // answers: { [questionId: string]: number }

      if (!answers || typeof answers !== 'object') {
        res.status(400).json({ success: false, error: 'User answers object is required.' });
        return;
      }

      const db = loadDb();
      let score = 0;
      const questionIds = Object.keys(answers);
      const totalQuestions = questionIds.length;

      const userAnswersReview: Array<{
        questionId: string;
        question: string;
        options: string[];
        selectedOption: number;
        correctAnswer: number;
        isCorrect: boolean;
        explanation: string;
      }> = [];

      for (const qId of questionIds) {
        const q = db.questions.find((item) => item.id === qId);
        if (!q) continue;

        const selected = Number(answers[qId]);
        const isCorrect = selected === q.correctAnswer;
        if (isCorrect) score += 1;

        userAnswersReview.push({
          questionId: q.id,
          question: q.question,
          options: q.options,
          selectedOption: selected,
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation,
        });
      }

      const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      const attemptId = 'attempt_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex');
      const completedAt = new Date().toISOString();

      const newAttempt: QuizAttempt = {
        id: attemptId,
        userId,
        subject: subject || 'General Practice',
        topic: topic || 'All Topics',
        score,
        totalQuestions,
        percentage,
        userAnswers: userAnswersReview.map((r) => ({
          questionId: r.questionId,
          selectedOption: r.selectedOption,
          isCorrect: r.isCorrect,
        })),
        completedAt,
      };

      db.quizAttempts.unshift(newAttempt);
      saveDb(db);

      res.status(201).json({
        success: true,
        data: {
          attemptId,
          score,
          totalQuestions,
          percentage,
          review: userAnswersReview,
          completedAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get user's quiz attempt history
  app.get('/api/studyhub/quiz/history', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const db = loadDb();

      const attempts = db.quizAttempts.filter(
        (a) => a.userId === userId || a.userId === 'global_sample'
      );
      attempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      res.json({ success: true, count: attempts.length, data: attempts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // MODULE 6: STUDY PROGRESS API (REAL DATA AGGREGATION)
  // ------------------------------------------

  app.get('/api/studyhub/progress', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const db = loadDb();

      const userNotes = db.notes.filter((n) => n.userId === userId || n.userId === 'global_sample');
      const userAssignments = db.assignments.filter((a) => a.userId === userId || a.userId === 'global_sample');
      const userSessions = db.plannerSessions.filter((s) => s.userId === userId || s.userId === 'global_sample');
      const userQuizzes = db.quizAttempts.filter((q) => q.userId === userId || q.userId === 'global_sample');
      const userMaterials = db.materials.filter((m) => m.userId === userId || m.userId === 'global_sample');

      const completedAssignments = userAssignments.filter((a) => a.status === 'Completed');
      const pendingAssignments = userAssignments.filter((a) => a.status !== 'Completed');
      const completedSessions = userSessions.filter((s) => s.status === 'Completed');
      const todayStr = new Date().toISOString().slice(0, 10);
      const upcomingSessions = userSessions.filter((s) => s.status === 'Scheduled' && s.date >= todayStr);

      const totalQuizScores = userQuizzes.reduce((acc, q) => acc + q.percentage, 0);
      const averageQuizScore = userQuizzes.length > 0 ? Math.round(totalQuizScores / userQuizzes.length) : 0;
      const bestQuizScore = userQuizzes.reduce((max, q) => Math.max(max, q.percentage), 0);

      // Calculate total study minutes from completed planner sessions (average 60 mins each)
      const studyMinutes = completedSessions.length * 60;

      // Compile chronological activity feed from real user actions
      const activities: Array<{
        id: string;
        type: 'note' | 'assignment' | 'session' | 'quiz' | 'material';
        title: string;
        subtitle: string;
        timestamp: string;
      }> = [];

      for (const n of userNotes.slice(0, 5)) {
        activities.push({
          id: 'act_' + n.id,
          type: 'note',
          title: `Note saved: "${n.title}"`,
          subtitle: n.subject,
          timestamp: n.updatedAt,
        });
      }

      for (const a of completedAssignments.slice(0, 5)) {
        activities.push({
          id: 'act_' + a.id,
          type: 'assignment',
          title: `Assignment completed: "${a.title}"`,
          subtitle: a.subject,
          timestamp: a.completedAt || a.updatedAt,
        });
      }

      for (const s of completedSessions.slice(0, 5)) {
        activities.push({
          id: 'act_' + s.id,
          type: 'session',
          title: `Study session finished: "${s.topic}"`,
          subtitle: `${s.subject} (${s.startTime} - ${s.endTime})`,
          timestamp: s.completedAt || s.createdAt,
        });
      }

      for (const q of userQuizzes.slice(0, 5)) {
        activities.push({
          id: 'act_' + q.id,
          type: 'quiz',
          title: `Quiz completed: ${q.percentage}% score (${q.score}/${q.totalQuestions})`,
          subtitle: q.subject,
          timestamp: q.completedAt,
        });
      }

      for (const m of userMaterials.slice(0, 3)) {
        activities.push({
          id: 'act_' + m.id,
          type: 'material',
          title: `Material imported: "${m.title}"`,
          subtitle: `${m.fileType} • ${m.fileSize}`,
          timestamp: m.createdAt,
        });
      }

      // Sort activities descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json({
        success: true,
        data: {
          notes: {
            total: userNotes.length,
            pinned: userNotes.filter((n) => n.pinned).length,
          },
          materials: {
            total: userMaterials.length,
          },
          assignments: {
            total: userAssignments.length,
            completed: completedAssignments.length,
            pending: pendingAssignments.length,
            completionRate:
              userAssignments.length > 0
                ? Math.round((completedAssignments.length / userAssignments.length) * 100)
                : 0,
          },
          planner: {
            total: userSessions.length,
            totalSessions: userSessions.length,
            completed: completedSessions.length,
            completedSessions: completedSessions.length,
            upcoming: upcomingSessions.length,
            upcomingSessions: upcomingSessions.length,
            studyMinutes,
            estimatedStudyMinutes: studyMinutes,
          },
          quiz: {
            totalAttempts: userQuizzes.length,
            averageScore: averageQuizScore,
            bestScore: bestQuizScore,
          },
          activityFeed: activities.slice(0, 10),
          recentActivities: activities.slice(0, 10),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ------------------------------------------
  // STUDY HUB HOMEPAGE OVERVIEW SUMMARY
  // ------------------------------------------

  app.get('/api/studyhub/overview', (req: Request, res: Response): void => {
    try {
      const userId = getAuthenticatedUserId(req);
      const db = loadDb();
      const todayStr = new Date().toISOString().slice(0, 10);

      const userNotes = db.notes.filter((n) => n.userId === userId || n.userId === 'global_sample');
      const userMaterials = db.materials.filter((m) => m.isPublic || m.userId === userId || m.userId === 'global_sample');
      const userAssignments = db.assignments.filter((a) => a.userId === userId || a.userId === 'global_sample');
      const userSessions = db.plannerSessions.filter((s) => s.userId === userId || s.userId === 'global_sample');
      const userQuizzes = db.quizAttempts.filter((q) => q.userId === userId || q.userId === 'global_sample');

      const todaySessions = userSessions.filter((s) => s.date === todayStr);
      const dueSoonAssignments = userAssignments.filter(
        (a) => a.status !== 'Completed' && a.dueDate >= todayStr
      );
      const recentQuiz = userQuizzes.length > 0 ? userQuizzes[0] : null;

      const totalQuizScores = userQuizzes.reduce((acc, q) => acc + q.percentage, 0);
      const averageQuizScore = userQuizzes.length > 0 ? Math.round(totalQuizScores / userQuizzes.length) : 0;

      res.json({
        success: true,
        data: {
          notesCount: userNotes.length,
          materialsCount: userMaterials.length,
          assignmentsCount: userAssignments.length,
          pendingAssignmentsCount: userAssignments.filter((a) => a.status !== 'Completed').length,
          todaySessionsCount: todaySessions.length,
          totalQuizAttempts: userQuizzes.length,
          averageQuizScore,
          urgentAssignments: dueSoonAssignments.slice(0, 3),
          todaySessions,
          dueSoonAssignments: dueSoonAssignments.slice(0, 3),
          recentQuiz,
          counts: {
            notes: userNotes.length,
            materials: userMaterials.length,
            assignments: userAssignments.length,
            pendingAssignments: userAssignments.filter((a) => a.status !== 'Completed').length,
            sessions: userSessions.length,
            todaySessionsCount: todaySessions.length,
            quizzesTaken: userQuizzes.length,
          },
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
