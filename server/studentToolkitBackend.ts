import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { ModuleStorage } from '../database/moduleStorage.ts';

export interface ToolkitItemMeta {
  id: string;
  name: string;
  category: 'calculators' | 'productivity' | 'documents' | 'programming' | 'college';
  description: string;
  icon: string;
  keywords: string[];
  featured?: boolean;
}

export interface ToolkitFavorite {
  id: string;
  userId: string;
  toolId: string;
  createdAt: string;
}

export interface ToolkitHistoryEntry {
  id: string;
  userId: string;
  toolId: string;
  toolName: string;
  actionSummary?: string;
  timestamp: string;
}

export interface ToolkitPreferences {
  calculatorAngleMode?: 'deg' | 'rad';
  defaultGradingScale?: '10-point' | '4-point';
  attendanceTargetPercent?: number;
  pomodoroWorkMinutes?: number;
  pomodoroBreakMinutes?: number;
  pomodoroLongBreakMinutes?: number;
  preferredTheme?: 'system' | 'light' | 'dark';
}

export interface ToolkitTask {
  id: string;
  userId: string;
  title: string;
  subject?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export interface ToolkitTimetableEntry {
  id: string;
  userId: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  startTime: string;
  endTime: string;
  subject: string;
  room?: string;
  professor?: string;
}

export interface ToolkitExamCountdown {
  id: string;
  userId: string;
  examName: string;
  subject: string;
  examDate: string;
  room?: string;
  createdAt: string;
}

export interface ToolkitQuickNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  category?: string;
  isPinned: boolean;
  updatedAt: string;
}

export interface ToolkitDatabase {
  tools: ToolkitItemMeta[];
  favorites: ToolkitFavorite[];
  history: ToolkitHistoryEntry[];
  preferencesByUser: Record<string, ToolkitPreferences>;
  tasks: ToolkitTask[];
  timetable: ToolkitTimetableEntry[];
  exams: ToolkitExamCountdown[];
  quickNotes: ToolkitQuickNote[];
  pomodoroStatsByUser: Record<string, { totalSessionsCompleted: number; totalFocusMinutes: number; lastActiveDate: string }>;
}

const DB_PATH = path.join(process.cwd(), '.kampus_toolkit_db.json');

const DEFAULT_TOOLS: ToolkitItemMeta[] = [
  // Academic Calculators
  {
    id: 'scientific-calc',
    name: 'Scientific Calculator',
    category: 'calculators',
    description: 'Advanced calculator with trigonometric, logarithmic, square root, exponential, brackets & history.',
    icon: 'Calculator',
    keywords: ['math', 'scientific', 'trigonometry', 'log', 'arithmetic', 'algebra', 'sin', 'cos', 'tan'],
    featured: true,
  },
  {
    id: 'cgpa-calc',
    name: 'CGPA Calculator',
    category: 'calculators',
    description: 'Calculate cumulative grade point average across semesters with configurable credit weightings.',
    icon: 'GraduationCap',
    keywords: ['cgpa', 'grades', 'semester', 'university', 'credits', 'academic', 'score'],
    featured: true,
  },
  {
    id: 'sgpa-calc',
    name: 'SGPA Calculator',
    category: 'calculators',
    description: 'Calculate semester grade point average with individual subject credits and grade points.',
    icon: 'Award',
    keywords: ['sgpa', 'semester', 'grade point', 'credits', 'marks', 'academic'],
  },
  {
    id: 'percentage-calc',
    name: 'Percentage & Marks Calculator',
    category: 'calculators',
    description: 'Calculate percentages, marks percentages, percentage increases/decreases, and difference.',
    icon: 'Percent',
    keywords: ['percentage', 'marks', 'fraction', 'discount', 'increase', 'ratio'],
  },
  {
    id: 'attendance-calc',
    name: 'Attendance & Safe-Zone Calculator',
    category: 'calculators',
    description: 'Check attendance percentage, required classes to reach 75%/85%, and safe skippable classes.',
    icon: 'CalendarCheck',
    keywords: ['attendance', 'bunk', 'safe zone', 'classes', 'lectures', 'shortage'],
    featured: true,
  },

  // Student Productivity
  {
    id: 'pomodoro-timer',
    name: 'Pomodoro Focus Timer',
    category: 'productivity',
    description: '25-minute deep focus sessions with smart short/long breaks and study cycle tracking.',
    icon: 'Timer',
    keywords: ['pomodoro', 'focus', 'timer', 'study session', 'productivity', 'deep work'],
    featured: true,
  },
  {
    id: 'todo-list',
    name: 'Academic To-Do & Tasks',
    category: 'productivity',
    description: 'Task management with priority badges, course tags, due dates, and completion status.',
    icon: 'CheckSquare',
    keywords: ['todo', 'tasks', 'checklist', 'homework', 'priority', 'reminders'],
  },
  {
    id: 'study-timer',
    name: 'Subject Study Stopwatch',
    category: 'productivity',
    description: 'Track dedicated study time per subject with live stopwatch and daily study summaries.',
    icon: 'Clock',
    keywords: ['stopwatch', 'study time', 'tracker', 'hours', 'subject log'],
  },
  {
    id: 'timetable-generator',
    name: 'Class Timetable & Schedule',
    category: 'productivity',
    description: 'Weekly schedule planner with room numbers, faculty tags, and slot collision detection.',
    icon: 'Calendar',
    keywords: ['timetable', 'schedule', 'routine', 'classes', 'lectures', 'slots'],
  },
  {
    id: 'exam-countdown',
    name: 'Exam Countdown',
    category: 'productivity',
    description: 'Days remaining countdowns for mid-terms, end-sems, practicals, and competitive exams.',
    icon: 'Hourglass',
    keywords: ['exam', 'countdown', 'finals', 'midterm', 'dates', 'test'],
  },
  {
    id: 'quick-notes',
    name: 'Quick Notes & Scratchpad',
    category: 'productivity',
    description: 'Fast auto-saving scratchpad for lecture pointers, formulas, and brainstormed ideas.',
    icon: 'FileText',
    keywords: ['notes', 'scratchpad', 'memo', 'quick note', 'formulas', 'draft'],
  },

  // Text & Document Utilities
  {
    id: 'word-counter',
    name: 'Word & Character Counter',
    category: 'documents',
    description: 'Count words, characters with/without spaces, sentences, paragraphs, and reading duration.',
    icon: 'AlignLeft',
    keywords: ['words', 'characters', 'count', 'essay', 'sentences', 'reading time'],
  },
  {
    id: 'case-converter',
    name: 'Text Case Converter',
    category: 'documents',
    description: 'Transform text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, and snake_case.',
    icon: 'Type',
    keywords: ['case', 'uppercase', 'lowercase', 'titlecase', 'transform', 'capitalize'],
  },
  {
    id: 'text-cleaner',
    name: 'Text Cleaner & Whitespace Stripper',
    category: 'documents',
    description: 'Remove redundant spaces, strip consecutive blank lines, clean tabs, and normalize formatting.',
    icon: 'Sparkles',
    keywords: ['clean', 'spaces', 'trim', 'whitespace', 'formatting', 'normalize'],
  },
  {
    id: 'text-compare',
    name: 'Text Compare & Diff Checker',
    category: 'documents',
    description: 'Side-by-side textual diff highlighter showing added, modified, and removed lines.',
    icon: 'GitCompare',
    keywords: ['diff', 'compare', 'text compare', 'changes', 'revisions', 'duplicate check'],
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    category: 'documents',
    description: 'Generate high-resolution scannable QR codes for web links, campus notices, and Wi-Fi credentials.',
    icon: 'QrCode',
    keywords: ['qr', 'qrcode', 'barcode', 'generator', 'link', 'download qr'],
    featured: true,
  },
  {
    id: 'image-to-pdf',
    name: 'Images to PDF Compiler',
    category: 'documents',
    description: 'Reorder captured photo notes and compile them into a single clean PDF document.',
    icon: 'FileImage',
    keywords: ['pdf', 'images to pdf', 'convert', 'scan', 'notes to pdf'],
  },
  {
    id: 'pdf-utilities',
    name: 'PDF Page Extractor & Merge Tools',
    category: 'documents',
    description: 'Preview, merge study guides, and split or extract selected pages from lecture slides.',
    icon: 'FileSpreadsheet',
    keywords: ['pdf', 'merge pdf', 'split pdf', 'extract pages', 'slides'],
  },

  // Programming & Technical Utilities
  {
    id: 'binary-converter',
    name: 'Binary & Bitwise Converter',
    category: 'programming',
    description: 'Live bidirectional conversion between Decimal and Binary representations with validation.',
    icon: 'Binary',
    keywords: ['binary', 'decimal', 'bits', 'base2', 'twos complement', 'programming'],
  },
  {
    id: 'number-base-converter',
    name: 'Multi-Base Number Converter',
    category: 'programming',
    description: 'Convert values instantaneously across Decimal (Base 10), Binary (2), Octal (8), and Hex (16).',
    icon: 'Cpu',
    keywords: ['hex', 'octal', 'binary', 'decimal', 'radix', 'base converter'],
  },
  {
    id: 'unit-converter',
    name: 'Universal Unit Converter',
    category: 'programming',
    description: 'Accurate scientific conversion for Length, Mass, Temperature, Time, Speed, and Frequency.',
    icon: 'Compass',
    keywords: ['unit', 'converter', 'metric', 'imperial', 'length', 'weight', 'temperature'],
  },
  {
    id: 'data-size-converter',
    name: 'Digital Data Size Converter',
    category: 'programming',
    description: 'Convert storage capacity across Bytes, KB, MB, GB, TB, and PB in Decimal (1000) & Binary (1024).',
    icon: 'HardDrive',
    keywords: ['bytes', 'kb', 'mb', 'gb', 'tb', 'data size', 'storage'],
  },
  {
    id: 'password-generator',
    name: 'Secure Password Generator',
    category: 'programming',
    description: 'Generate high-entropy cryptographically strong passwords locally with zero server transmission.',
    icon: 'Key',
    keywords: ['password', 'generator', 'security', 'crypto', 'random', 'pin'],
  },
  {
    id: 'color-converter',
    name: 'HEX / RGB / HSL Color Converter',
    category: 'programming',
    description: 'Live color picker and converter across HEX, RGB, HSL and CSS formats with swatch previews.',
    icon: 'Palette',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'css', 'design', 'palette'],
  },
  {
    id: 'code-formatter',
    name: 'Code Beautifier & JSON Validator',
    category: 'programming',
    description: 'Format, indent, and validate JSON data structures, HTML, CSS, and JavaScript snippets.',
    icon: 'Code2',
    keywords: ['code', 'format', 'json', 'beautify', 'validate', 'indent'],
  },

  // College & Student Utilities
  {
    id: 'age-calculator',
    name: 'Age & Milestone Calculator',
    category: 'college',
    description: 'Exact age in years, months, days, total hours lived, and countdown to your next birthday.',
    icon: 'Cake',
    keywords: ['age', 'birthday', 'date of birth', 'calendar', 'years', 'milestone'],
  },
  {
    id: 'date-difference',
    name: 'Date Difference & Working Days',
    category: 'college',
    description: 'Calculate exact elapsed days, calendar weeks, and business days between any two dates.',
    icon: 'CalendarRange',
    keywords: ['date difference', 'days between', 'duration', 'working days', 'semester length'],
  },
  {
    id: 'marks-grade-calc',
    name: 'Marks & Letter Grade Converter',
    category: 'college',
    description: 'Convert percentage marks into standard university 10-point grades (O, A+, A, B+, B, C, F).',
    icon: 'FileCheck',
    keywords: ['grades', 'marks', 'scale', 'letter grade', 'pass criteria', 'university'],
  },
  {
    id: 'assignment-tracker',
    name: 'Assignment Deadline Tracker',
    category: 'college',
    description: 'Track lab submissions, project reports, and milestones with urgency alerts.',
    icon: 'Bookmark',
    keywords: ['assignment', 'deadline', 'submission', 'project', 'lab report'],
  },
];

function createSeedDatabase(): ToolkitDatabase {
  return {
    tools: DEFAULT_TOOLS,
    favorites: [],
    history: [],
    preferencesByUser: {},
    tasks: [],
    timetable: [],
    exams: [],
    quickNotes: [],
    pomodoroStatsByUser: {},
  };
}

const toolkitStorage = new ModuleStorage<ToolkitDatabase>(
  'student_toolkit',
  DB_PATH,
  () => createSeedDatabase()
);

function loadDb(): ToolkitDatabase {
  const db = toolkitStorage.get();
  // Ensure tools array is up-to-date
  if (!db.tools || db.tools.length < DEFAULT_TOOLS.length) {
    db.tools = DEFAULT_TOOLS;
    toolkitStorage.saveSync(db);
  }
  return db;
}

function saveDb(db: ToolkitDatabase): void {
  toolkitStorage.saveSync(db);
}

export function getAuthenticatedUserId(req: Request): string {
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
  const queryUid = req.query.userId || req.body?.userId;
  if (queryUid && typeof queryUid === 'string' && queryUid.trim().length > 0) {
    return queryUid.trim();
  }
  return 'student_default';
}

export function registerStudentToolkitBackend(app: Express) {
  // 1. GET /api/toolkit/tools - Catalog of all tools
  app.get('/api/toolkit/tools', (_req: Request, res: Response) => {
    const db = loadDb();
    return res.json({
      success: true,
      data: db.tools,
      totalCount: db.tools.length,
    });
  });

  // 2. GET /api/toolkit/favorites - User favorite tools
  app.get('/api/toolkit/favorites', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const db = loadDb();
    const userFavorites = db.favorites
      .filter((f) => f.userId === userId)
      .map((f) => f.toolId);

    return res.json({
      success: true,
      favorites: userFavorites,
    });
  });

  // 3. POST /api/toolkit/favorites - Add to favorites
  app.post('/api/toolkit/favorites', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { toolId } = req.body || {};
    if (!toolId || typeof toolId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid toolId provided.' });
    }

    const db = loadDb();
    const existing = db.favorites.find((f) => f.userId === userId && f.toolId === toolId);
    if (!existing) {
      db.favorites.push({
        id: `fav_${crypto.randomUUID()}`,
        userId,
        toolId,
        createdAt: new Date().toISOString(),
      });
      saveDb(db);
    }

    const updatedFavorites = db.favorites
      .filter((f) => f.userId === userId)
      .map((f) => f.toolId);

    return res.json({
      success: true,
      message: 'Tool added to favorites.',
      favorites: updatedFavorites,
    });
  });

  // 4. DELETE /api/toolkit/favorites/:toolId - Remove from favorites
  app.delete('/api/toolkit/favorites/:toolId', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { toolId } = req.params;

    const db = loadDb();
    db.favorites = db.favorites.filter((f) => !(f.userId === userId && f.toolId === toolId));
    saveDb(db);

    const updatedFavorites = db.favorites
      .filter((f) => f.userId === userId)
      .map((f) => f.toolId);

    return res.json({
      success: true,
      message: 'Tool removed from favorites.',
      favorites: updatedFavorites,
    });
  });

  // 5. GET /api/toolkit/history - Recent tool usage
  app.get('/api/toolkit/history', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const limit = Math.min(50, parseInt(String(req.query.limit || '15'), 10) || 15);
    const db = loadDb();

    const userHistory = db.history
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return res.json({
      success: true,
      history: userHistory,
    });
  });

  // 6. POST /api/toolkit/history - Record tool usage
  app.post('/api/toolkit/history', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { toolId, actionSummary } = req.body || {};
    if (!toolId || typeof toolId !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid toolId is required.' });
    }

    const db = loadDb();
    const toolMeta = db.tools.find((t) => t.id === toolId);
    const toolName = toolMeta ? toolMeta.name : toolId;

    const entry: ToolkitHistoryEntry = {
      id: `hist_${crypto.randomUUID()}`,
      userId,
      toolId,
      toolName,
      actionSummary: typeof actionSummary === 'string' ? actionSummary.slice(0, 120) : undefined,
      timestamp: new Date().toISOString(),
    };

    db.history.unshift(entry);
    // Keep max 100 history items per user
    const otherUsers = db.history.filter((h) => h.userId !== userId);
    const thisUser = db.history.filter((h) => h.userId === userId).slice(0, 100);
    db.history = [...thisUser, ...otherUsers];

    saveDb(db);

    return res.json({
      success: true,
      entry,
    });
  });

  // 7. DELETE /api/toolkit/history - Clear history
  app.delete('/api/toolkit/history', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const entryId = req.query.id as string | undefined;

    const db = loadDb();
    if (entryId) {
      db.history = db.history.filter((h) => !(h.userId === userId && h.id === entryId));
    } else {
      db.history = db.history.filter((h) => h.userId !== userId);
    }
    saveDb(db);

    return res.json({
      success: true,
      message: entryId ? 'History item removed.' : 'All usage history cleared.',
    });
  });

  // 8. GET /api/toolkit/preferences - User preferences
  app.get('/api/toolkit/preferences', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const db = loadDb();
    const prefs = db.preferencesByUser[userId] || {
      calculatorAngleMode: 'deg',
      defaultGradingScale: '10-point',
      attendanceTargetPercent: 75,
      pomodoroWorkMinutes: 25,
      pomodoroBreakMinutes: 5,
      pomodoroLongBreakMinutes: 15,
      preferredTheme: 'system',
    };

    return res.json({
      success: true,
      preferences: prefs,
    });
  });

  // 9. PUT /api/toolkit/preferences - Update preferences
  app.put('/api/toolkit/preferences', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const updates = req.body || {};

    const db = loadDb();
    const existing = db.preferencesByUser[userId] || {};
    db.preferencesByUser[userId] = {
      ...existing,
      ...updates,
    };
    saveDb(db);

    return res.json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences: db.preferencesByUser[userId],
    });
  });

  // 10. GET /api/toolkit/productivity/bootstrap - Full productivity state for cross-device sync
  app.get('/api/toolkit/productivity/bootstrap', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const db = loadDb();

    const tasks = db.tasks.filter((t) => t.userId === userId);
    const timetable = db.timetable.filter((t) => t.userId === userId);
    const exams = db.exams.filter((e) => e.userId === userId);
    const quickNotes = db.quickNotes.filter((n) => n.userId === userId);
    const pomodoroStats = db.pomodoroStatsByUser[userId] || {
      totalSessionsCompleted: 0,
      totalFocusMinutes: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
    };

    return res.json({
      success: true,
      data: {
        tasks,
        timetable,
        exams,
        quickNotes,
        pomodoroStats,
      },
    });
  });

  // 11. POST /api/toolkit/productivity/tasks - Create or update task
  app.post('/api/toolkit/productivity/tasks', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { title, subject, priority, dueDate, completed } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const db = loadDb();
    const newTask: ToolkitTask = {
      id: `task_${crypto.randomUUID()}`,
      userId,
      title: title.trim(),
      subject: (subject || 'General').trim(),
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      dueDate: dueDate || undefined,
      completed: Boolean(completed),
      createdAt: new Date().toISOString(),
    };

    db.tasks.unshift(newTask);
    saveDb(db);

    return res.status(201).json({
      success: true,
      task: newTask,
    });
  });

  // 12. PUT /api/toolkit/productivity/tasks/:id - Update task
  app.put('/api/toolkit/productivity/tasks/:id', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { id } = req.params;
    const updates = req.body || {};

    const db = loadDb();
    const taskIndex = db.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (db.tasks[taskIndex].userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot modify another student\'s task.' });
    }

    db.tasks[taskIndex] = {
      ...db.tasks[taskIndex],
      ...updates,
      userId, // guarantee ownership cannot be forged
      id,
    };
    saveDb(db);

    return res.json({
      success: true,
      task: db.tasks[taskIndex],
    });
  });

  // 13. DELETE /api/toolkit/productivity/tasks/:id - Delete task
  app.delete('/api/toolkit/productivity/tasks/:id', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { id } = req.params;

    const db = loadDb();
    const task = db.tasks.find((t) => t.id === id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (task.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot delete another student\'s task.' });
    }

    db.tasks = db.tasks.filter((t) => t.id !== id);
    saveDb(db);

    return res.json({
      success: true,
      message: 'Task deleted successfully.',
    });
  });

  // 14. POST /api/toolkit/productivity/pomodoro/complete - Record completed pomodoro session
  app.post('/api/toolkit/productivity/pomodoro/complete', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { focusMinutes } = req.body || {};
    const minutes = Math.max(1, Math.min(180, parseInt(String(focusMinutes || '25'), 10) || 25));

    const db = loadDb();
    const existing = db.pomodoroStatsByUser[userId] || {
      totalSessionsCompleted: 0,
      totalFocusMinutes: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
    };

    existing.totalSessionsCompleted += 1;
    existing.totalFocusMinutes += minutes;
    existing.lastActiveDate = new Date().toISOString().split('T')[0];
    db.pomodoroStatsByUser[userId] = existing;

    saveDb(db);

    return res.json({
      success: true,
      stats: existing,
    });
  });

  // 15. POST /api/toolkit/productivity/notes - Create/update quick note
  app.post('/api/toolkit/productivity/notes', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { id, title, content, category, isPinned } = req.body || {};

    const db = loadDb();
    if (id) {
      const idx = db.quickNotes.findIndex((n) => n.id === id);
      if (idx !== -1) {
        if (db.quickNotes[idx].userId !== userId) {
          return res.status(403).json({ success: false, message: 'Access denied: Cannot edit another student\'s note.' });
        }
        db.quickNotes[idx] = {
          ...db.quickNotes[idx],
          title: title ?? db.quickNotes[idx].title,
          content: content ?? db.quickNotes[idx].content,
          category: category ?? db.quickNotes[idx].category,
          isPinned: isPinned !== undefined ? Boolean(isPinned) : db.quickNotes[idx].isPinned,
          updatedAt: new Date().toISOString(),
        };
        saveDb(db);
        return res.json({ success: true, note: db.quickNotes[idx] });
      }
    }

    const newNote: ToolkitQuickNote = {
      id: `note_${crypto.randomUUID()}`,
      userId,
      title: (title || 'Untitled Note').trim(),
      content: content || '',
      category: category || 'General',
      isPinned: Boolean(isPinned),
      updatedAt: new Date().toISOString(),
    };

    db.quickNotes.unshift(newNote);
    saveDb(db);

    return res.status(201).json({
      success: true,
      note: newNote,
    });
  });

  // 16. DELETE /api/toolkit/productivity/notes/:id - Delete note
  app.delete('/api/toolkit/productivity/notes/:id', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { id } = req.params;

    const db = loadDb();
    const note = db.quickNotes.find((n) => n.id === id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    if (note.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot delete another student\'s note.' });
    }

    db.quickNotes = db.quickNotes.filter((n) => n.id !== id);
    saveDb(db);

    return res.json({
      success: true,
      message: 'Note deleted successfully.',
    });
  });

  // 17. POST /api/toolkit/productivity/exams - Create exam countdown
  app.post('/api/toolkit/productivity/exams', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { examName, subject, examDate, room } = req.body || {};
    if (!examName || !examDate) {
      return res.status(400).json({ success: false, message: 'Exam name and exam date are required.' });
    }

    const db = loadDb();
    const newExam: ToolkitExamCountdown = {
      id: `exam_${crypto.randomUUID()}`,
      userId,
      examName: examName.trim(),
      subject: (subject || 'General').trim(),
      examDate: examDate.trim(),
      room: room ? room.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    db.exams.push(newExam);
    saveDb(db);

    return res.status(201).json({
      success: true,
      exam: newExam,
    });
  });

  // 18. DELETE /api/toolkit/productivity/exams/:id - Delete exam countdown
  app.delete('/api/toolkit/productivity/exams/:id', (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const { id } = req.params;

    const db = loadDb();
    const exam = db.exams.find((e) => e.id === id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    if (exam.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot delete another student\'s exam.' });
    }

    db.exams = db.exams.filter((e) => e.id !== id);
    saveDb(db);

    return res.json({
      success: true,
      message: 'Exam removed successfully.',
    });
  });

  console.log('[StudentToolkitBackend] Registered Student Toolkit endpoints on /api/toolkit/*');
}
