import { ModuleStorage } from '../database/moduleStorage.ts';
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import type {
  CalendarEvent,
  DayOfWeek,
  EcosystemIntegrationItem,
  ExamRecord,
  FocusSessionRecord,
  PlannerGoal,
  PlannerHabit,
  PlannerNote,
  PlannerTask,
  RecurrenceRule,
  StudyPlan,
  StudySessionRecord,
  TimetableSlot,
} from '../src/types/planner.ts';

interface PlannerDatabase {
  tasks: PlannerTask[];
  events: CalendarEvent[];
  studyPlans: StudyPlan[];
  studySessions: StudySessionRecord[];
  timetable: TimetableSlot[];
  goals: PlannerGoal[];
  habits: PlannerHabit[];
  exams: ExamRecord[];
  focusSessions: FocusSessionRecord[];
  notes: PlannerNote[];
}

const DB_PATH = path.join(process.cwd(), '.kampus_planner_db.json');

const CAREER_DB_PATH = path.join(process.cwd(), '.kampus_career_db.json');
const EVENTS_DB_PATH = path.join(process.cwd(), '.kampus_events_clubs_db.json');
const COLLEGE_DB_PATH = path.join(process.cwd(), '.kampus_college_explorer_db.json');
const LOCKER_DB_PATH = path.join(process.cwd(), '.kampus_locker_db.json');
const STUDY_ROOMS_DB_PATH = path.join(process.cwd(), '.kampus_study_rooms_db.json');

function createEmptyDb(): PlannerDatabase {
  return {
    tasks: [],
    events: [],
    studyPlans: [],
    studySessions: [],
    timetable: [],
    goals: [],
    habits: [],
    exams: [],
    focusSessions: [],
    notes: [],
  };
}


const plannerStorage = new ModuleStorage<PlannerDatabase>(
  'planner',
  DB_PATH,
  () => (createEmptyDb())
);

function loadDb(): PlannerDatabase {
  return plannerStorage.get();
}

function saveDb(db: PlannerDatabase): void {
  plannerStorage.saveSync(db);
}

function addDaysToISODate(baseISO: string, days: number): string {
  const [y, m, d] = (baseISO || new Date().toISOString().slice(0, 10)).split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function computeNextRecurrenceDate(
  currentISO: string,
  recurrence: RecurrenceRule,
  customDays?: number
): string | null {
  if (recurrence === 'None') return null;
  if (recurrence === 'Daily') return addDaysToISODate(currentISO, 1);
  if (recurrence === 'Weekly') return addDaysToISODate(currentISO, 7);
  if (recurrence === 'Monthly') return addDaysToISODate(currentISO, 30);
  if (recurrence === 'Custom') {
    const span = Math.max(1, Number(customDays || 3));
    return addDaysToISODate(currentISO, span);
  }
  return null;
}

function readJsonSafe(filePath: string): Record<string, unknown> | null {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {
    // ignore missing or corrupt cross-module DB
  }
  return null;
}

function readUserIntegrations(userId: string): EcosystemIntegrationItem[] {
  const items: EcosystemIntegrationItem[] = [];

  // 1. Career: Applications & Interviews
  const careerDb = readJsonSafe(CAREER_DB_PATH);
  if (careerDb && Array.isArray(careerDb.applications)) {
    for (const appItem of careerDb.applications as Array<{
      id?: string;
      userId?: string;
      opportunityTitle?: string;
      companyName?: string;
      status?: string;
      interviewDate?: string;
      appliedAt?: string;
    }>) {
      if (appItem.userId !== userId) continue;
      items.push({
        id: `int_career_${appItem.id}`,
        sourceModule: 'Career',
        kind: appItem.interviewDate ? 'Event' : 'Task',
        title: appItem.interviewDate
          ? `Interview: ${appItem.opportunityTitle || 'Role'} (${appItem.companyName || 'Company'})`
          : `Follow up: ${appItem.opportunityTitle || 'Application'} at ${appItem.companyName || 'Employer'}`,
        subtitle: `Status: ${appItem.status || 'Applied'}`,
        dateISO: (appItem.interviewDate || appItem.appliedAt || new Date().toISOString()).slice(0, 10),
        time: '10:00',
        category: 'Career',
      });
    }
  }

  // 2. Events & Clubs: Registered Campus Events
  const eventsDb = readJsonSafe(EVENTS_DB_PATH);
  if (eventsDb && Array.isArray(eventsDb.registrations)) {
    const eventsList = Array.isArray(eventsDb.events)
      ? (eventsDb.events as Array<{ id?: string; title?: string; dateISO?: string; startTime?: string; venue?: string }>)
      : [];
    for (const reg of eventsDb.registrations as Array<{
      id?: string;
      userId?: string;
      eventId?: string;
      eventTitle?: string;
      status?: string;
    }>) {
      if (reg.userId !== userId || reg.status === 'Cancelled') continue;
      const evt = eventsList.find((e) => e.id === reg.eventId);
      items.push({
        id: `int_evt_${reg.id}`,
        sourceModule: 'Events & Clubs',
        kind: 'Event',
        title: evt?.title || reg.eventTitle || 'Registered Campus Event',
        subtitle: evt?.venue ? `Venue: ${evt.venue}` : `Status: ${reg.status || 'Registered'}`,
        dateISO: (evt?.dateISO || new Date().toISOString()).slice(0, 10),
        time: evt?.startTime || '16:00',
        category: 'College',
      });
    }
  }

  // 3. College Explorer: Saved Colleges & Deadlines
  const collegeDb = readJsonSafe(COLLEGE_DB_PATH);
  if (collegeDb) {
    const savedMap = (collegeDb.savedCollegesByUser || {}) as Record<string, string[]>;
    const savedIds = savedMap[userId] || [];
    const colleges = Array.isArray(collegeDb.colleges)
      ? (collegeDb.colleges as Array<{ id?: string; name?: string; applicationDeadline?: string }>)
      : [];
    for (const cid of savedIds) {
      const col = colleges.find((c) => c.id === cid);
      if (!col) continue;
      items.push({
        id: `int_col_${cid}`,
        sourceModule: 'College Explorer',
        kind: 'Exam',
        title: `Admission Review: ${col.name}`,
        subtitle: col.applicationDeadline
          ? `Deadline note: ${col.applicationDeadline}`
          : 'Saved target institution checklist',
        dateISO: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
        time: '17:00',
        category: 'College',
      });
    }
  }

  // 4. Digital Locker: Document Reminders
  const lockerDb = readJsonSafe(LOCKER_DB_PATH);
  if (lockerDb && Array.isArray(lockerDb.reminders)) {
    for (const rem of lockerDb.reminders as Array<{
      id?: string;
      ownerId?: string;
      title?: string;
      reminderType?: string;
      dueAtISO?: string;
      completed?: boolean;
    }>) {
      if (rem.ownerId !== userId || rem.completed) continue;
      const dueStr = String(rem.dueAtISO || new Date().toISOString());
      items.push({
        id: `int_lck_${rem.id}`,
        sourceModule: 'Digital Locker',
        kind: 'Task',
        title: `[Locker] ${rem.title || 'Document Submission'}`,
        subtitle: rem.reminderType || 'Document reminder',
        dateISO: dueStr.slice(0, 10),
        time: dueStr.includes('T') ? dueStr.slice(11, 16) || '09:00' : '09:00',
        category: 'Personal',
      });
    }
  }

  // 5. Study Hub / Study Rooms: Joined Sessions
  const studyDb = readJsonSafe(STUDY_ROOMS_DB_PATH);
  if (studyDb && Array.isArray(studyDb.rooms)) {
    for (const rm of studyDb.rooms as Array<{
      id?: string;
      title?: string;
      subject?: string;
      hostId?: string;
      participantIds?: string[];
    }>) {
      if (rm.hostId !== userId && !(Array.isArray(rm.participantIds) && rm.participantIds.includes(userId))) {
        continue;
      }
      items.push({
        id: `int_sty_${rm.id}`,
        sourceModule: 'Study Hub',
        kind: 'StudySession',
        title: `Study Room Revision: ${rm.title || 'Session'}`,
        subtitle: rm.subject ? `Subject: ${rm.subject}` : 'Collaborative study session',
        dateISO: new Date().toISOString().slice(0, 10),
        time: '18:00',
        category: 'Study',
      });
    }
  }

  return items;
}

export function registerPlannerBackend(app: Express): void {
  const db = loadDb();

  // 1. Bootstrap User Workspace (Zero fabricated user state)
  app.post('/api/planner/bootstrap', (req: Request, res: Response) => {
    const userId = String(req.body?.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });

    return res.json({
      tasks: db.tasks.filter((t) => t.userId === userId),
      events: db.events.filter((e) => e.userId === userId),
      studyPlans: db.studyPlans.filter((p) => p.userId === userId),
      studySessions: db.studySessions.filter((s) => s.userId === userId),
      timetable: db.timetable.filter((s) => s.userId === userId),
      goals: db.goals.filter((g) => g.userId === userId),
      habits: db.habits.filter((h) => h.userId === userId),
      exams: db.exams.filter((x) => x.userId === userId),
      focusSessions: db.focusSessions.filter((f) => f.userId === userId),
      notes: db.notes.filter((n) => n.userId === userId),
      integrations: readUserIntegrations(userId),
    });
  });

  app.get('/api/planner/integrations', (req: Request, res: Response) => {
    const userId = String(req.query.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    return res.json({ integrations: readUserIntegrations(userId) });
  });

  // 2. Tasks CRUD + Duplicate + Recurrence
  app.post('/api/planner/tasks', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const title = String(b.title || '').trim();
    if (!userId || !title) {
      return res.status(400).json({ message: 'userId and task title are required.' });
    }
    const now = new Date().toISOString();
    const task: PlannerTask = {
      id: `ptk_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      title,
      description: String(b.description || '').trim(),
      category: b.category || 'Study',
      priority: b.priority || 'Medium',
      status: b.status || 'To Do',
      dueDateISO: String(b.dueDateISO || new Date().toISOString().slice(0, 10)),
      dueTime: String(b.dueTime || '18:00'),
      estimatedMinutes: Math.max(5, Number(b.estimatedMinutes || 30)),
      subtasks: Array.isArray(b.subtasks) ? b.subtasks : [],
      tags: Array.isArray(b.tags) ? b.tags : [],
      attachmentLabel: b.attachmentLabel ? String(b.attachmentLabel).trim() : undefined,
      recurrence: b.recurrence || 'None',
      customIntervalDays: b.customIntervalDays ? Number(b.customIntervalDays) : undefined,
      reminderOffset: b.reminderOffset || '15 minutes before',
      customReminderMinutes: b.customReminderMinutes ? Number(b.customReminderMinutes) : undefined,
      reminderState: 'Active',
      snoozedUntilISO: null,
      sourceModule: b.sourceModule ? String(b.sourceModule) : undefined,
      sourceRefId: b.sourceRefId ? String(b.sourceRefId) : undefined,
      createdAt: now,
      updatedAt: now,
      completedAt: b.status === 'Completed' ? now : null,
    };
    db.tasks.unshift(task);
    saveDb(db);
    return res.status(201).json({ task });
  });

  app.patch('/api/planner/tasks/:id', (req: Request, res: Response) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const b = req.body || {};
    if (String(b.userId || '').trim() !== task.userId) {
      return res.status(403).json({ message: '403 Forbidden: Task owned by another user.' });
    }

    const wasCompleted = task.status === 'Completed';
    if (typeof b.title === 'string' && b.title.trim()) task.title = b.title.trim();
    if (typeof b.description === 'string') task.description = b.description.trim();
    if (typeof b.category === 'string') task.category = b.category;
    if (typeof b.priority === 'string') task.priority = b.priority;
    if (typeof b.status === 'string') task.status = b.status;
    if (typeof b.dueDateISO === 'string') task.dueDateISO = b.dueDateISO;
    if (typeof b.dueTime === 'string') task.dueTime = b.dueTime;
    if (typeof b.estimatedMinutes === 'number') task.estimatedMinutes = Math.max(5, b.estimatedMinutes);
    if (Array.isArray(b.subtasks)) task.subtasks = b.subtasks;
    if (Array.isArray(b.tags)) task.tags = b.tags;
    if (typeof b.attachmentLabel === 'string') task.attachmentLabel = b.attachmentLabel.trim() || undefined;
    if (typeof b.recurrence === 'string') task.recurrence = b.recurrence;
    if (typeof b.customIntervalDays === 'number') task.customIntervalDays = b.customIntervalDays;
    if (typeof b.reminderOffset === 'string') task.reminderOffset = b.reminderOffset;
    if (typeof b.reminderState === 'string') task.reminderState = b.reminderState;
    if (b.snoozedUntilISO !== undefined) task.snoozedUntilISO = b.snoozedUntilISO;

    const now = new Date().toISOString();
    task.updatedAt = now;
    if (task.status === 'Completed' && !wasCompleted) {
      task.completedAt = now;
      task.reminderState = 'Completed';
    } else if (task.status !== 'Completed') {
      task.completedAt = null;
    }

    // Spawn next recurring occurrence when marked Completed cleanly
    let nextRecurringTask: PlannerTask | null = null;
    if (!wasCompleted && task.status === 'Completed' && task.recurrence !== 'None') {
      const nextDate = computeNextRecurrenceDate(
        task.dueDateISO,
        task.recurrence,
        task.customIntervalDays
      );
      if (nextDate) {
        nextRecurringTask = {
          ...task,
          id: `ptk_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
          status: 'To Do',
          dueDateISO: nextDate,
          reminderState: 'Active',
          snoozedUntilISO: null,
          subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        };
        db.tasks.unshift(nextRecurringTask);
      }
    }

    saveDb(db);
    return res.json({ task, nextRecurringTask });
  });

  app.post('/api/planner/tasks/:id/duplicate', (req: Request, res: Response) => {
    const orig = db.tasks.find((t) => t.id === req.params.id);
    if (!orig) return res.status(404).json({ message: 'Task not found.' });
    if (String(req.body?.userId || '').trim() !== orig.userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    const now = new Date().toISOString();
    const copy: PlannerTask = {
      ...orig,
      id: `ptk_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      title: `${orig.title} (Copy)`,
      status: 'To Do',
      reminderState: 'Active',
      snoozedUntilISO: null,
      subtasks: orig.subtasks.map((s) => ({ ...s, id: `sub_${crypto.randomBytes(2).toString('hex')}`, completed: false })),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    db.tasks.unshift(copy);
    saveDb(db);
    return res.status(201).json({ task: copy });
  });

  app.delete('/api/planner/tasks/:id', (req: Request, res: Response) => {
    const idx = db.tasks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Task not found.' });
    if (String(req.query.userId || '').trim() !== db.tasks[idx].userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.tasks.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });

  // 3. Calendar Events CRUD
  app.post('/api/planner/events', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const title = String(b.title || '').trim();
    if (!userId || !title) return res.status(400).json({ message: 'userId and title required.' });
    const now = new Date().toISOString();
    const evt: CalendarEvent = {
      id: `pevt_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      title,
      dateISO: String(b.dateISO || new Date().toISOString().slice(0, 10)),
      startTime: String(b.startTime || '09:00'),
      endTime: String(b.endTime || '10:00'),
      category: b.category || 'Study',
      priority: b.priority || 'Medium',
      recurrence: b.recurrence || 'None',
      reminderOffset: b.reminderOffset || '15 minutes before',
      reminderState: 'Active',
      location: String(b.location || '').trim(),
      description: String(b.description || '').trim(),
      completed: Boolean(b.completed),
      sourceModule: b.sourceModule ? String(b.sourceModule) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    db.events.unshift(evt);
    saveDb(db);
    return res.status(201).json({ event: evt });
  });

  app.patch('/api/planner/events/:id', (req: Request, res: Response) => {
    const evt = db.events.find((e) => e.id === req.params.id);
    if (!evt) return res.status(404).json({ message: 'Event not found.' });
    const b = req.body || {};
    if (String(b.userId || '').trim() !== evt.userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    if (typeof b.title === 'string' && b.title.trim()) evt.title = b.title.trim();
    if (typeof b.dateISO === 'string') evt.dateISO = b.dateISO;
    if (typeof b.startTime === 'string') evt.startTime = b.startTime;
    if (typeof b.endTime === 'string') evt.endTime = b.endTime;
    if (typeof b.category === 'string') evt.category = b.category;
    if (typeof b.priority === 'string') evt.priority = b.priority;
    if (typeof b.recurrence === 'string') evt.recurrence = b.recurrence;
    if (typeof b.reminderOffset === 'string') evt.reminderOffset = b.reminderOffset;
    if (typeof b.reminderState === 'string') evt.reminderState = b.reminderState;
    if (typeof b.location === 'string') evt.location = b.location.trim();
    if (typeof b.description === 'string') evt.description = b.description.trim();
    if (typeof b.completed === 'boolean') evt.completed = b.completed;
    evt.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ event: evt });
  });

  app.delete('/api/planner/events/:id', (req: Request, res: Response) => {
    const idx = db.events.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Event not found.' });
    if (String(req.query.userId || '').trim() !== db.events[idx].userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.events.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });

  // 4. Study Plans & Study Sessions
  app.post('/api/planner/study-plans', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const subject = String(b.subject || '').trim();
    if (!userId || !subject) return res.status(400).json({ message: 'userId and subject required.' });
    const now = new Date().toISOString();
    const plan: StudyPlan = {
      id: `pspl_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      courseOrClass: String(b.courseOrClass || 'Current Semester').trim(),
      subject,
      dailyAvailabilityHours: Math.max(0.5, Number(b.dailyAvailabilityHours || 2)),
      targetDateISO: String(b.targetDateISO || addDaysToISODate(now.slice(0, 10), 14)),
      chapters: Array.isArray(b.chapters) ? b.chapters : [],
      createdAt: now,
      updatedAt: now,
    };
    db.studyPlans.unshift(plan);
    saveDb(db);
    return res.status(201).json({ studyPlan: plan });
  });

  app.patch('/api/planner/study-plans/:id', (req: Request, res: Response) => {
    const plan = db.studyPlans.find((p) => p.id === req.params.id);
    if (!plan) return res.status(404).json({ message: 'Study plan not found.' });
    const b = req.body || {};
    if (String(b.userId || '').trim() !== plan.userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    if (typeof b.subject === 'string' && b.subject.trim()) plan.subject = b.subject.trim();
    if (typeof b.courseOrClass === 'string') plan.courseOrClass = b.courseOrClass.trim();
    if (typeof b.targetDateISO === 'string') plan.targetDateISO = b.targetDateISO;
    if (Array.isArray(b.chapters)) plan.chapters = b.chapters;
    plan.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ studyPlan: plan });
  });

  app.delete('/api/planner/study-plans/:id', (req: Request, res: Response) => {
    const idx = db.studyPlans.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Study plan not found.' });
    if (String(req.query.userId || '').trim() !== db.studyPlans[idx].userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.studyPlans.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });

  app.post('/api/planner/study-sessions', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const subject = String(b.subject || '').trim();
    if (!userId || !subject) return res.status(400).json({ message: 'Subject is required.' });
    const status = b.status || 'Planned';
    const session: StudySessionRecord = {
      id: `pssn_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      studyPlanId: b.studyPlanId || null,
      subject,
      chapterOrTopic: String(b.chapterOrTopic || 'Focused Revision').trim(),
      plannedMinutes: Math.max(5, Number(b.plannedMinutes || 45)),
      actualMinutes: status === 'Completed' ? Math.max(1, Number(b.actualMinutes || b.plannedMinutes || 45)) : 0,
      dateISO: String(b.dateISO || new Date().toISOString().slice(0, 10)),
      startTime: String(b.startTime || '17:00'),
      endTime: String(b.endTime || '17:45'),
      status,
      createdAt: new Date().toISOString(),
    };
    db.studySessions.unshift(session);
    saveDb(db);
    return res.status(201).json({ studySession: session });
  });

  app.patch('/api/planner/study-sessions/:id', (req: Request, res: Response) => {
    const ssn = db.studySessions.find((s) => s.id === req.params.id);
    if (!ssn) return res.status(404).json({ message: 'Session not found.' });
    const b = req.body || {};
    if (String(b.userId || '').trim() !== ssn.userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    if (typeof b.dateISO === 'string') ssn.dateISO = b.dateISO;
    if (typeof b.startTime === 'string') ssn.startTime = b.startTime;
    if (typeof b.endTime === 'string') ssn.endTime = b.endTime;
    if (typeof b.status === 'string') ssn.status = b.status;
    if (typeof b.actualMinutes === 'number') {
      ssn.actualMinutes = Math.max(0, b.actualMinutes);
    } else if (ssn.status === 'Completed' && ssn.actualMinutes === 0) {
      ssn.actualMinutes = ssn.plannedMinutes;
    }
    saveDb(db);
    return res.json({ studySession: ssn });
  });

  app.delete('/api/planner/study-sessions/:id', (req: Request, res: Response) => {
    const idx = db.studySessions.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Session not found.' });
    if (String(req.query.userId || '').trim() !== db.studySessions[idx].userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.studySessions.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });

  // 5. Timetable Builder CRUD + Duplicate Day Schedule
  app.post('/api/planner/timetable', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const subject = String(b.subject || '').trim();
    if (!userId || !subject) return res.status(400).json({ message: 'Subject required.' });
    const slot: TimetableSlot = {
      id: `pttb_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      dayOfWeek: (b.dayOfWeek || 'Mon') as DayOfWeek,
      startTime: String(b.startTime || '09:00'),
      endTime: String(b.endTime || '10:00'),
      subject,
      slotType: b.slotType || 'Lecture',
      room: String(b.room || '').trim(),
      instructor: String(b.instructor || '').trim(),
    };
    db.timetable.push(slot);
    saveDb(db);
    return res.status(201).json({ slot });
  });

  app.post('/api/planner/timetable/duplicate', (req: Request, res: Response) => {
    const { userId, fromDay, toDay } = req.body || {};
    if (!userId || !fromDay || !toDay || fromDay === toDay) {
      return res.status(400).json({ message: 'Valid source and destination days required.' });
    }
    const sourceSlots = db.timetable.filter((s) => s.userId === userId && s.dayOfWeek === fromDay);
    const createdSlots: TimetableSlot[] = sourceSlots.map((s) => ({
      ...s,
      id: `pttb_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      dayOfWeek: toDay as DayOfWeek,
    }));
    db.timetable.push(...createdSlots);
    saveDb(db);
    return res.status(201).json({ createdSlots });
  });

  app.delete('/api/planner/timetable/:id', (req: Request, res: Response) => {
    const idx = db.timetable.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Timetable slot not found.' });
    if (String(req.query.userId || '').trim() !== db.timetable[idx].userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.timetable.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });

  // 6. Goals & Milestones
  app.post('/api/planner/goals', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const title = String(b.title || '').trim();
    if (!userId || !title) return res.status(400).json({ message: 'Goal title is required.' });
    const milestones = Array.isArray(b.milestones) ? b.milestones : [];
    const done = milestones.filter((m: { completed?: boolean }) => m.completed).length;
    const progressPct = milestones.length > 0 ? Math.round((done / milestones.length) * 100) : 0;
    const now = new Date().toISOString();
    const goal: PlannerGoal = {
      id: `pgl_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      category: b.category || 'Academic Goals',
      title,
      description: String(b.description || '').trim(),
      targetDateISO: String(b.targetDateISO || addDaysToISODate(now.slice(0, 10), 30)),
      priority: b.priority || 'Medium',
      status: 'Active',
      milestones,
      progressPct,
      createdAt: now,
      updatedAt: now,
    };
    db.goals.unshift(goal);
    saveDb(db);
    return res.status(201).json({ goal });
  });

  app.patch('/api/planner/goals/:id', (req: Request, res: Response) => {
    const goal = db.goals.find((g) => g.id === req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });
    const b = req.body || {};
    if (String(b.userId || '').trim() !== goal.userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    if (typeof b.title === 'string' && b.title.trim()) goal.title = b.title.trim();
    if (typeof b.description === 'string') goal.description = b.description.trim();
    if (typeof b.status === 'string') goal.status = b.status;
    if (Array.isArray(b.milestones)) {
      goal.milestones = b.milestones;
      const done = goal.milestones.filter((m) => m.completed).length;
      goal.progressPct =
        goal.milestones.length > 0 ? Math.round((done / goal.milestones.length) * 100) : goal.progressPct;
      if (goal.milestones.length > 0 && done === goal.milestones.length && goal.status === 'Active') {
        goal.status = 'Completed';
      }
    } else if (typeof b.progressPct === 'number') {
      goal.progressPct = Math.max(0, Math.min(100, b.progressPct));
    }
    goal.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ goal });
  });

  app.delete('/api/planner/goals/:id', (req: Request, res: Response) => {
    const idx = db.goals.findIndex((g) => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Goal not found.' });
    if (String(req.query.userId || '').trim() !== db.goals[idx].userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.goals.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });

  // 7. Habits Tracker (Strict Real Check-ins, Zero Fake Streaks)
  app.post('/api/planner/habits', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const name = String(b.name || '').trim();
    if (!userId || !name) return res.status(400).json({ message: 'Habit name required.' });
    const habit: PlannerHabit = {
      id: `phb_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      name,
      targetNote: String(b.targetNote || 'Daily consistency').trim(),
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    db.habits.unshift(habit);
    saveDb(db);
    return res.status(201).json({ habit });
  });

  app.post('/api/planner/habits/:id/checkin', (req: Request, res: Response) => {
    const habit = db.habits.find((h) => h.id === req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit not found.' });
    const b = req.body || {};
    if (String(b.userId || '').trim() !== habit.userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    const dateISO = String(b.dateISO || new Date().toISOString().slice(0, 10)).slice(0, 10);
    if (habit.completedDates.includes(dateISO)) {
      habit.completedDates = habit.completedDates.filter((d) => d !== dateISO);
    } else {
      habit.completedDates.push(dateISO);
    }
    saveDb(db);
    return res.json({ habit });
  });

  app.delete('/api/planner/habits/:id', (req: Request, res: Response) => {
    const idx = db.habits.findIndex((h) => h.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Habit not found.' });
    if (String(req.query.userId || '').trim() !== db.habits[idx].userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.habits.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });

  // 8. Exams & Deadlines Tracker
  app.post('/api/planner/exams', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const name = String(b.name || '').trim();
    if (!userId || !name) return res.status(400).json({ message: 'Exam/deadline name required.' });
    const now = new Date().toISOString();
    const exam: ExamRecord = {
      id: `pexm_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      examType: b.examType || 'University Examination',
      name,
      subject: String(b.subject || '').trim(),
      dateISO: String(b.dateISO || addDaysToISODate(now.slice(0, 10), 7)),
      time: String(b.time || '09:30'),
      venue: String(b.venue || '').trim(),
      prepStatus: b.prepStatus || 'Not Started',
      checklist: Array.isArray(b.checklist) ? b.checklist : [],
      createdAt: now,
      updatedAt: now,
    };
    db.exams.unshift(exam);
    saveDb(db);
    return res.status(201).json({ exam });
  });

  app.patch('/api/planner/exams/:id', (req: Request, res: Response) => {
    const exam = db.exams.find((e) => e.id === req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam record not found.' });
    const b = req.body || {};
    if (String(b.userId || '').trim() !== exam.userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    if (typeof b.prepStatus === 'string') exam.prepStatus = b.prepStatus;
    if (Array.isArray(b.checklist)) exam.checklist = b.checklist;
    if (typeof b.venue === 'string') exam.venue = b.venue;
    if (typeof b.dateISO === 'string') exam.dateISO = b.dateISO;
    exam.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ exam });
  });

  app.delete('/api/planner/exams/:id', (req: Request, res: Response) => {
    const idx = db.exams.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Exam not found.' });
    if (String(req.query.userId || '').trim() !== db.exams[idx].userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.exams.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });

  // 9. Focus Sessions (Only records when confirmed or timer completed cleanly)
  app.post('/api/planner/focus-sessions', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (!b.confirmed) {
      return res.status(400).json({ message: 'Focus sessions must be completed or explicitly confirmed.' });
    }
    const actualMinutes = Math.max(1, Number(b.actualMinutes || 0));
    const rec: FocusSessionRecord = {
      id: `pfcs_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      mode: b.mode || 'Focus',
      presetLabel: String(b.presetLabel || `${b.plannedMinutes || actualMinutes} min Focus`),
      plannedMinutes: Math.max(1, Number(b.plannedMinutes || actualMinutes)),
      actualMinutes,
      notes: String(b.notes || '').trim(),
      confirmed: true,
      completedAt: new Date().toISOString(),
    };
    db.focusSessions.unshift(rec);
    saveDb(db);
    return res.status(201).json({ focusSession: rec });
  });

  // 10. Planner Notes CRUD
  app.post('/api/planner/notes', (req: Request, res: Response) => {
    const b = req.body || {};
    const userId = String(b.userId || '').trim();
    const content = String(b.content || '').trim();
    if (!userId || !content) return res.status(400).json({ message: 'Note content required.' });
    const now = new Date().toISOString();
    const note: PlannerNote = {
      id: `pnts_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      noteType: b.noteType || 'Quick',
      title: String(b.title || content.slice(0, 42)).trim(),
      content,
      pinned: Boolean(b.pinned),
      linkedSubject: b.linkedSubject ? String(b.linkedSubject).trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };
    db.notes.unshift(note);
    saveDb(db);
    return res.status(201).json({ note });
  });

  app.patch('/api/planner/notes/:id', (req: Request, res: Response) => {
    const note = db.notes.find((n) => n.id === req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found.' });
    const b = req.body || {};
    if (String(b.userId || '').trim() !== note.userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    if (typeof b.title === 'string' && b.title.trim()) note.title = b.title.trim();
    if (typeof b.content === 'string') note.content = b.content.trim();
    if (typeof b.noteType === 'string') note.noteType = b.noteType;
    if (typeof b.pinned === 'boolean') note.pinned = b.pinned;
    note.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json({ note });
  });

  app.delete('/api/planner/notes/:id', (req: Request, res: Response) => {
    const idx = db.notes.findIndex((n) => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Note not found.' });
    if (String(req.query.userId || '').trim() !== db.notes[idx].userId) {
      return res.status(403).json({ message: '403 Forbidden.' });
    }
    db.notes.splice(idx, 1);
    saveDb(db);
    return res.json({ deletedId: req.params.id });
  });
}
