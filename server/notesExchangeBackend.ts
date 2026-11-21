import { ModuleStorage } from '../database/moduleStorage.ts';
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  NotesExchangeState,
  SharedNoteItem,
  NoteRequestItem,
  NoteReview,
} from '../src/types/notesExchange.ts';

const DB_PATH = path.join(process.cwd(), '.kampus_notes_exchange_db.json');

const INITIAL_NOTES: SharedNoteItem[] = [
  {
    id: 'sn-1',
    title: 'Handwritten Graph Theory, Treewidth & DP on Trees Complete Derivations',
    course: 'CS-302 (Algorithms)',
    subjectArea: 'Computer Science',
    semesterOrTerm: 'Semester 6',
    level: 'Undergraduate',
    format: 'Handwritten PDF',
    summary: 'Comprehensive classroom derivations on treewidth decomposition, subproblem state graphs, and Hamiltonian path bitmasks with verified proofs.',
    content: '1. Introduction to Tree Decompositions\nA tree decomposition of a graph G = (V, E) is a tree T with nodes X_i subseteq V such that:\n- Every vertex v in V belongs to at least one X_i\n- For every edge (u, v) in E, there is a node X_i containing both u and v\n- For any vertex v, the nodes containing v form a connected subtree of T.\n\nTreewidth tw(G) = min over all decompositions max(|X_i| - 1).',
    tags: ['#GraphTheory', '#Treewidth', '#Algorithms', '#IITB'],
    pagesCount: 28,
    authorName: 'Aditya Kulkarni',
    authorCollege: 'IIT Bombay',
    authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    isOwnUpload: false,
    isVerified: true,
    createdAt: '2026-03-12T10:00:00Z',
    dateLabel: 'March 2026',
    rating: 4.9,
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Priya Sharma',
        authorCollege: 'IIT Bombay',
        rating: 5,
        comment: 'Extremely clear diagrams on treewidth decomposition. Helped me ace Question 3 on the mid-term!',
        createdAt: '2026-03-14T11:20:00Z',
        helpfulCount: 8,
      },
    ],
    downloads: 342,
    karmaReward: 25,
    coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'sn-2',
    title: 'Distributed Systems Raft Consensus Protocol & Vector Clocks Cheat Sheet',
    course: 'CS-401 (Distributed Systems)',
    subjectArea: 'Computer Science',
    semesterOrTerm: 'Semester 6',
    level: 'Undergraduate',
    format: 'Formula Sheet',
    summary: 'Quick reference breakdown of Lamport timestamps, causal delivery proofs, Raft election safety, and log invariant proofs.',
    content: 'Raft Safety Invariants:\n1. Election Safety: at most one leader can be elected in a given term.\n2. Leader Append-Only: a leader never overwrites or truncates its log; it only appends new entries.\n3. Log Matching: if two logs contain an entry with the same index and term, then the logs are identical in all entries up through the given index.',
    tags: ['#DistributedSystems', '#Raft', '#CloudComputing'],
    pagesCount: 14,
    authorName: 'Rohan Deshmukh',
    authorCollege: 'IIT Delhi',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    isOwnUpload: false,
    isVerified: true,
    createdAt: '2026-03-16T14:30:00Z',
    dateLabel: 'March 2026',
    rating: 4.8,
    reviews: [],
    downloads: 215,
    karmaReward: 20,
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  },
];

const INITIAL_REQUESTS: NoteRequestItem[] = [
  {
    id: 'req-1',
    title: 'Need clean handwritten notes for Quantum Computing Shor algorithm proofs',
    course: 'PH-302 (Quantum Mechanics)',
    semesterOrTerm: 'Semester 6',
    level: 'Undergraduate',
    details: 'Looking for detailed derivations of quantum phase estimation and continued fractions reduction for Shor factoring.',
    requesterName: 'Meera Iyer',
    requesterCollege: 'IIT Madras',
    bountyKarma: 50,
    upvotes: 14,
    status: 'open',
    createdAt: '2026-03-18T09:00:00Z',
    dateLabel: '2 days ago',
  },
];

const INITIAL_FALLBACK_STATE: NotesExchangeState = {
  notes: INITIAL_NOTES,
  requests: INITIAL_REQUESTS,
  savedNoteIds: ['sn-1'],
  downloadedNoteIds: ['sn-1'],
  karmaPoints: 120,
  karmaHistory: [
    {
      id: 'k-1',
      event: 'Joined KAMPUS Notes Community',
      points: 50,
      createdAt: '2026-01-01T00:00:00Z',
      dateLabel: 'Jan 2026',
    },
    {
      id: 'k-2',
      event: 'Received upvotes for handwritten algorithms solution',
      points: 70,
      createdAt: '2026-03-15T00:00:00Z',
      dateLabel: 'March 2026',
    },
  ],
  reportedNoteIds: [],
};


const notesExchangeStorage = new ModuleStorage<NotesExchangeState>(
  'notes_exchange',
  DB_PATH,
  () => (INITIAL_FALLBACK_STATE)
);

function loadDb(): NotesExchangeState {
  return notesExchangeStorage.get();
}

function saveDb(db: NotesExchangeState): void {
  notesExchangeStorage.saveSync(db);
}

export function registerNotesExchangeBackend(app: Express): void {
  /**
   * 1. Bootstrap: Fetch all shared notes and requests
   */
  app.get('/api/notes-exchange/bootstrap', (_req: Request, res: Response): void => {
    try {
      const db = loadDb();
      res.json({ success: true, data: db });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 2. Upload Note
   */
  app.post('/api/notes-exchange/upload', (req: Request, res: Response): void => {
    try {
      const {
        title,
        course,
        subjectArea,
        semesterOrTerm,
        level,
        format,
        summary,
        content,
        tags = [],
        pagesCount = 1,
        authorName,
        authorCollege,
        authorAvatar,
        attachment,
        fulfillRequestId,
      } = req.body;

      if (!title || !content) {
        res.status(400).json({ success: false, error: 'Note title and content are required.' });
        return;
      }

      const db = loadDb();
      const newNoteId = 'sn-' + Date.now().toString(36) + '_' + crypto.randomBytes(2).toString('hex');
      const newNote: SharedNoteItem = {
        id: newNoteId,
        title: title.trim(),
        course: course || 'General Course',
        subjectArea: subjectArea || 'Engineering & Science',
        semesterOrTerm: semesterOrTerm || 'Semester 1',
        level: level || 'Undergraduate',
        format: format || 'Digital Notes',
        summary: summary || title,
        content: content.trim(),
        tags: Array.isArray(tags) ? tags : [],
        pagesCount: Number(pagesCount) || 1,
        authorName: authorName || 'KAMPUS Student',
        authorCollege: authorCollege || 'Indian University',
        authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        isOwnUpload: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        dateLabel: 'Just now',
        rating: 5.0,
        reviews: [],
        downloads: 0,
        karmaReward: 25,
        coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
        attachment,
        fulfilledRequestId: fulfillRequestId,
      };

      db.notes.unshift(newNote);
      db.karmaPoints += 25;
      db.karmaHistory.unshift({
        id: 'k-' + Date.now().toString(36),
        event: `Shared note: ${title}`,
        points: 25,
        createdAt: new Date().toISOString(),
        dateLabel: 'Today',
      });

      if (fulfillRequestId) {
        const reqItem = db.requests.find((r) => r.id === fulfillRequestId);
        if (reqItem) {
          reqItem.status = 'fulfilled';
          reqItem.fulfilledNoteId = newNoteId;
        }
      }

      saveDb(db);
      res.status(201).json({ success: true, data: newNote, karmaPoints: db.karmaPoints });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 3. Download Note (Increment counter)
   */
  app.post('/api/notes-exchange/download/:id', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const db = loadDb();
      const note = db.notes.find((n) => n.id === id);
      if (!note) {
        res.status(404).json({ success: false, error: 'Note not found.' });
        return;
      }

      note.downloads += 1;
      if (!db.downloadedNoteIds.includes(id)) {
        db.downloadedNoteIds.push(id);
      }

      saveDb(db);
      res.json({ success: true, downloads: note.downloads, downloadedNoteIds: db.downloadedNoteIds });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 4. Rate / Review Note
   */
  app.post('/api/notes-exchange/rate/:id', (req: Request, res: Response): void => {
    try {
      const { id } = req.params;
      const { authorName, authorCollege, rating, comment } = req.body;

      const db = loadDb();
      const note = db.notes.find((n) => n.id === id);
      if (!note) {
        res.status(404).json({ success: false, error: 'Note not found.' });
        return;
      }

      const newReview: NoteReview = {
        id: 'rev-' + Date.now().toString(36),
        authorName: authorName || 'KAMPUS Scholar',
        authorCollege: authorCollege || 'Campus',
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        comment: comment || 'Very helpful study note!',
        createdAt: new Date().toISOString(),
        helpfulCount: 0,
      };

      note.reviews.unshift(newReview);
      const totalRatings = note.reviews.reduce((acc, r) => acc + r.rating, 0);
      note.rating = Number((totalRatings / note.reviews.length).toFixed(1));

      saveDb(db);
      res.json({ success: true, rating: note.rating, reviews: note.reviews });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 5. Create Request for Notes
   */
  app.post('/api/notes-exchange/request', (req: Request, res: Response): void => {
    try {
      const { title, course, semesterOrTerm, level, details, requesterName, requesterCollege, bountyKarma } = req.body;
      if (!title || !details) {
        res.status(400).json({ success: false, error: 'Request title and details are required.' });
        return;
      }

      const db = loadDb();
      const newRequest: NoteRequestItem = {
        id: 'req-' + Date.now().toString(36),
        title: title.trim(),
        course: course || 'General Course',
        semesterOrTerm: semesterOrTerm || 'Current Term',
        level: level || 'Undergraduate',
        details: details.trim(),
        requesterName: requesterName || 'KAMPUS Student',
        requesterCollege: requesterCollege || 'Indian University',
        bountyKarma: Number(bountyKarma) || 30,
        upvotes: 1,
        status: 'open',
        createdAt: new Date().toISOString(),
        dateLabel: 'Just now',
      };

      db.requests.unshift(newRequest);
      saveDb(db);
      res.status(201).json({ success: true, data: newRequest });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 6. State Sync
   */
  app.post('/api/notes-exchange/sync', (req: Request, res: Response): void => {
    try {
      const clientState = req.body;
      if (clientState && Array.isArray(clientState.notes)) {
        saveDb(clientState);
      }
      res.json({ success: true, message: 'Notes Exchange synchronized.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
