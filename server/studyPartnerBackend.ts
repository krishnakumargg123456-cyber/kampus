import { ModuleStorage } from '../database/moduleStorage.ts';
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  StudyPartnerState,
  MyStudyPreferences,
  StudentPeerProfile,
  StudyRequest,
  StudyGroup,
  StudySession,
  CollaborativeGoal,
} from '../src/types/studyPartner.ts';

const DB_PATH = path.join(process.cwd(), '.kampus_study_partner_db.json');

const INITIAL_PEERS: StudentPeerProfile[] = [
  {
    id: 'peer-aditya',
    name: 'Aditya Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    isDemoProfile: false,
    intro: 'Competitive programmer working on graph algorithms and distributed systems. Looking for an accountability buddy for CS-302.',
    course: 'B.Tech Computer Science & AI',
    stream: 'Engineering & Technology',
    college: 'IIT Bombay',
    university: 'IIT Bombay',
    semester: 'Semester 6',
    academicYear: '3rd Year',
    subjects: ['Algorithms', 'Distributed Systems', 'Machine Learning'],
    examPreparation: 'GATE CS 2027',
    learningGoals: ['Crack Codeforces Candidate Master', 'Publish paper in distributed systems'],
    preferredTimes: ['Night Study', 'Evening Study'],
    studyModes: ['Online Study', 'Group Learning'],
    learningStyles: ['Practice & Questions', 'Doubt Solving'],
    preferredLanguage: 'English',
    studyLevel: 'Undergraduate',
    availability: '15 hrs/week',
    collaborationInterests: ['Algorithms', 'System Design'],
    visibility: 'campus-peers',
    allowRequestsFrom: 'everyone',
    isRecentlyActive: true,
    lastActiveLabel: 'Just now',
  },
  {
    id: 'peer-rohan',
    name: 'Rohan Deshmukh',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    isDemoProfile: false,
    intro: 'Backend & Cloud systems builder. Preparing for upcoming summer internship technical rounds.',
    course: 'B.Tech Computer Science',
    stream: 'Engineering & Technology',
    college: 'IIT Delhi',
    university: 'IIT Delhi',
    semester: 'Semester 6',
    academicYear: '3rd Year',
    subjects: ['Operating Systems', 'Computer Networks', 'System Design'],
    examPreparation: 'Placement Technical Rounds',
    learningGoals: ['Build distributed Raft consensus engine', 'Master Linux kernel internals'],
    preferredTimes: ['Morning Study', 'Night Study'],
    studyModes: ['Online Study', 'Individual Focus'],
    learningStyles: ['Concept-Based Learning', 'Practice & Questions'],
    preferredLanguage: 'Bilingual (EN/HI)',
    studyLevel: 'Undergraduate',
    availability: '10 hrs/week',
    collaborationInterests: ['Cloud Systems', 'Operating Systems'],
    visibility: 'campus-peers',
    allowRequestsFrom: 'everyone',
    isRecentlyActive: false,
    lastActiveLabel: '25m ago',
  },
];

const INITIAL_FALLBACK_STATE: StudyPartnerState = {
  preferences: {
    stream: 'Computer Science & AI',
    academicYear: '3rd Year',
    examPreparation: 'Mid-Sem & Gate CS 2027',
    subjects: ['Algorithms', 'Distributed Systems', 'DBMS'],
    learningGoals: ['Master Graph DP', 'Complete Mock Exam Papers', 'Daily 2-hr study streak'],
    preferredTimes: ['Evening Study', 'Night Study'],
    studyModes: ['Online Study', 'Group Learning'],
    learningStyles: ['Practice & Questions', 'Concept-Based Learning'],
    preferredLanguage: 'Bilingual (EN/HI)',
    studyLevel: 'Undergraduate',
    availability: '15 hrs/week',
    collaborationInterests: ['Algorithms', 'Distributed Systems'],
    visibility: 'campus-peers',
    allowRequestsFrom: 'everyone',
    hideCollegeName: false,
    notifyOnRequests: true,
    notifyOnSessions: true,
    notifyOnGoals: true,
  },
  peers: INITIAL_PEERS,
  connectedPartnerIds: ['peer-aditya'],
  savedPeerIds: ['peer-rohan'],
  ignoredPeerIds: [],
  blockedPeerIds: [],
  requests: [
    {
      id: 'req-partner-1',
      direction: 'received',
      peerId: 'peer-aditya',
      message: 'Hey! Saw your focus on Graph DP. Want to do joint problem sets this week?',
      sharedInterests: ['Algorithms', 'Distributed Systems'],
      status: 'accepted',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      dateLabel: 'Yesterday',
    },
  ],
  groups: [
    {
      id: 'grp-cs302',
      name: 'CS-302 Algorithms & Graph Theory Circle',
      description: 'Daily accountability sprint for algorithm problem solving and theorem proofs.',
      subjects: ['Algorithms', 'Discrete Math'],
      goals: ['Solve 50 tree & DAG DP problems before Mid-Terms'],
      visibility: 'Public',
      ownerId: 'me',
      members: [
        {
          id: 'me',
          name: 'KAMPUS Scholar',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          role: 'owner',
          courseLabel: 'B.Tech CS & AI',
        },
        {
          id: 'peer-aditya',
          name: 'Aditya Sharma',
          avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
          role: 'member',
          courseLabel: 'B.Tech CS & AI',
        },
      ],
      discussions: [],
      resources: [],
      tasks: [],
      createdAt: '2026-02-01T00:00:00Z',
    },
  ],
  sessions: [
    {
      id: 'sess-1',
      title: 'Tree DP & Binary Lifting Problem Sprint',
      targetType: 'partner',
      targetId: 'peer-aditya',
      targetName: 'Aditya Sharma',
      subject: 'Algorithms (CS-302)',
      dateISO: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      timeSlot: '19:00',
      durationMinutes: 50,
      objectives: 'Work through 3 rerooting DP problems and cross-check time complexity proofs.',
      prepNotes: 'Review Notes Exchange CS-302 handwritten pack Section 2 before joining.',
      status: 'Upcoming',
      createdAt: new Date().toISOString(),
    },
  ],
  goals: [
    {
      id: 'goal-1',
      title: 'Revise Semester 6 Core Units (Algorithms + DBMS)',
      description: 'Joint accountability goal ahead of Mid-Sem exams covering DP on Trees and Relational Normalization.',
      subject: 'Algorithms & DBMS',
      targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      assignedMemberIds: ['me', 'peer-aditya'],
      assignedMemberNames: ['KAMPUS Scholar', 'Aditya Sharma'],
      tasks: [
        { id: 'gtask-1', text: 'Complete DFS Tree & Bridges derivation', completed: true },
        { id: 'gtask-2', text: 'Solve 10 BCNF / 3NF decomposition PYQs', completed: false },
        { id: 'gtask-3', text: 'Run 1 timed 30-min mock quiz in KAMPUS AI', completed: false },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ],
  reports: [],
  activityLog: [],
};


const studyPartnerStorage = new ModuleStorage<StudyPartnerState>(
  'study_partner',
  DB_PATH,
  () => (INITIAL_FALLBACK_STATE)
);

function loadDb(): StudyPartnerState {
  return studyPartnerStorage.get();
}

function saveDb(db: StudyPartnerState): void {
  studyPartnerStorage.saveSync(db);
}

export function registerStudyPartnerBackend(app: Express): void {
  /**
   * 1. Bootstrap: Fetch complete study partner ecosystem state
   */
  app.get('/api/study-partner/bootstrap', (_req: Request, res: Response): void => {
    try {
      const db = loadDb();
      res.json({ success: true, data: db });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 2. Update Study Preferences
   */
  app.post('/api/study-partner/preferences', (req: Request, res: Response): void => {
    try {
      const preferences = req.body;
      const db = loadDb();
      db.preferences = { ...db.preferences, ...preferences };
      saveDb(db);
      res.json({ success: true, preferences: db.preferences });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 3. Send Study Buddy Request
   */
  app.post('/api/study-partner/request', (req: Request, res: Response): void => {
    try {
      const { targetPeerId, subject, message } = req.body;
      if (!targetPeerId) {
        res.status(400).json({ success: false, error: 'Target peer ID is required.' });
        return;
      }

      const db = loadDb();
      const newRequest: StudyRequest = {
        id: 'req-' + Date.now().toString(36),
        direction: 'sent',
        peerId: targetPeerId,
        sharedInterests: subject ? [subject] : [],
        message: message || 'Would love to study together on KAMPUS!',
        status: 'pending',
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
   * 4. Schedule Collaborative Study Session
   */
  app.post('/api/study-partner/session', (req: Request, res: Response): void => {
    try {
      const { title, targetType, targetId, targetName, subject, dateISO, timeSlot, durationMinutes, objectives, prepNotes } = req.body;
      if (!title || !dateISO) {
        res.status(400).json({ success: false, error: 'Session title and date are required.' });
        return;
      }

      const db = loadDb();
      const newSession: StudySession = {
        id: 'sess-' + Date.now().toString(36),
        title: title.trim(),
        targetType: targetType || 'partner',
        targetId: targetId || 'peer-aditya',
        targetName: targetName || 'Study Partner',
        subject: subject || 'Academics',
        dateISO,
        timeSlot: timeSlot || '19:00',
        durationMinutes: Number(durationMinutes) || 45,
        objectives: objectives || '',
        prepNotes: prepNotes || '',
        status: 'Upcoming',
        createdAt: new Date().toISOString(),
      };

      db.sessions.unshift(newSession);
      saveDb(db);
      res.status(201).json({ success: true, data: newSession });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * 5. State Sync
   */
  app.post('/api/study-partner/sync', (req: Request, res: Response): void => {
    try {
      const clientState = req.body;
      if (clientState && Array.isArray(clientState.peers)) {
        saveDb(clientState);
      }
      res.json({ success: true, message: 'Study Partner synchronized.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
