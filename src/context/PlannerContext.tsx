import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { todayLocalISO } from '../data/plannerData';
import type {
  AiPlannerDraftPlan,
  CalendarEvent,
  DayOfWeek,
  EcosystemIntegrationItem,
  ExamRecord,
  FocusSessionRecord,
  PlannerGoal,
  PlannerHabit,
  PlannerNote,
  PlannerTask,
  StudyPlan,
  StudySessionRecord,
  TaskCategory,
  TimetableSlot,
} from '../types/planner';

const PLANNER_AI_STORAGE_KEY = 'kampus_planner_ai_schedules_v1';
const PLANNER_PARTNER_SESSIONS_KEY = 'kampus_planner_partner_sessions_v1';

export interface PartnerSessionEntry {
  id: string;
  title: string;
  targetName: string;
  subject: string;
  dateISO: string;
  timeSlot: string;
  durationMinutes: number;
  status: string;
}

interface PlannerContextType {
  loading: boolean;
  error: string | null;
  actionBanner: string | null;
  clearError: () => void;
  clearBanner: () => void;
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
  integrations: EcosystemIntegrationItem[];
  partnerSessions: PartnerSessionEntry[];
  refreshWorkspace: () => Promise<void>;
  createTask: (payload: Partial<PlannerTask> & { title: string }) => Promise<PlannerTask | null>;
  updateTask: (taskId: string, patch: Partial<PlannerTask>) => Promise<PlannerTask | null>;
  duplicateTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  createEvent: (payload: Partial<CalendarEvent> & { title: string }) => Promise<CalendarEvent | null>;
  updateEvent: (eventId: string, patch: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
  deleteEvent: (eventId: string) => Promise<void>;
  createStudyPlan: (payload: Partial<StudyPlan> & { subject: string }) => Promise<StudyPlan | null>;
  updateStudyPlan: (planId: string, patch: Partial<StudyPlan>) => Promise<void>;
  deleteStudyPlan: (planId: string) => Promise<void>;
  createStudySession: (payload: Partial<StudySessionRecord> & { subject: string }) => Promise<void>;
  updateStudySession: (sessionId: string, patch: Partial<StudySessionRecord>) => Promise<void>;
  deleteStudySession: (sessionId: string) => Promise<void>;
  createTimetableSlot: (payload: Partial<TimetableSlot> & { subject: string }) => Promise<void>;
  duplicateTimetableDay: (fromDay: DayOfWeek, toDay: DayOfWeek) => Promise<void>;
  deleteTimetableSlot: (slotId: string) => Promise<void>;
  createGoal: (payload: Partial<PlannerGoal> & { title: string }) => Promise<void>;
  updateGoal: (goalId: string, patch: Partial<PlannerGoal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  createHabit: (name: string, targetNote?: string) => Promise<void>;
  toggleHabitDate: (habitId: string, dateISO: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  createExam: (payload: Partial<ExamRecord> & { name: string }) => Promise<void>;
  updateExam: (examId: string, patch: Partial<ExamRecord>) => Promise<void>;
  deleteExam: (examId: string) => Promise<void>;
  logFocusSession: (payload: {
    mode: 'Focus' | 'Short Break' | 'Long Break';
    presetLabel: string;
    plannedMinutes: number;
    actualMinutes: number;
    notes: string;
    confirmed: boolean;
  }) => Promise<void>;
  createNote: (payload: Partial<PlannerNote> & { content: string }) => Promise<void>;
  updateNote: (noteId: string, patch: Partial<PlannerNote>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  importIntegrationItem: (item: EcosystemIntegrationItem) => Promise<void>;
  generateAiPlannerDraft: (requestType: string, userPrompt: string) => Promise<{ ok: boolean; draft?: AiPlannerDraftPlan; error?: string }>;
  applyAiDraftToPlanner: (draft: AiPlannerDraftPlan) => Promise<number>;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const userId = user?.id || 'usr_22b030149';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [studySessions, setStudySessions] = useState<StudySessionRecord[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [goals, setGoals] = useState<PlannerGoal[]>([]);
  const [habits, setHabits] = useState<PlannerHabit[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSessionRecord[]>([]);
  const [notes, setNotes] = useState<PlannerNote[]>([]);
  const [integrations, setIntegrations] = useState<EcosystemIntegrationItem[]>([]);

  const [partnerSessions, setPartnerSessions] = useState<PartnerSessionEntry[]>([]);

  const clearError = useCallback(() => setError(null), []);
  const clearBanner = useCallback(() => setActionBanner(null), []);

  const readLocalSyncedHooks = useCallback(() => {
    try {
      const rawPartner = localStorage.getItem(PLANNER_PARTNER_SESSIONS_KEY);
      const parsedPartner: PartnerSessionEntry[] = rawPartner ? JSON.parse(rawPartner) : [];
      const rawAi = localStorage.getItem(PLANNER_AI_STORAGE_KEY);
      const parsedAi = rawAi ? JSON.parse(rawAi) : [];
      const combinedPartner = [...parsedPartner];
      if (Array.isArray(parsedAi)) {
        for (const p of parsedAi) {
          if (p && Array.isArray(p.dailyPlan)) {
            for (const d of p.dailyPlan) {
              if (!d.completed) {
                combinedPartner.push({
                  id: `ai_${p.id}_${d.id}`,
                  title: `[KAMPUS AI] ${d.task || 'Study Block'}`,
                  targetName: p.title || 'AI Study Plan',
                  subject: d.subject || 'Study',
                  dateISO: todayLocalISO(),
                  timeSlot: d.timeSlot || 'Scheduled',
                  durationMinutes: 45,
                  status: 'Synced',
                });
              }
            }
          }
        }
      }
      setPartnerSessions(combinedPartner);
    } catch {
      setPartnerSessions([]);
    }
  }, []);

  const refreshWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      readLocalSyncedHooks();
      const res = await fetch('/api/planner/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to load KAMPUS Planner.');
      setTasks(data.tasks || []);
      setEvents(data.events || []);
      setStudyPlans(data.studyPlans || []);
      setStudySessions(data.studySessions || []);
      setTimetable(data.timetable || []);
      setGoals(data.goals || []);
      setHabits(data.habits || []);
      setExams(data.exams || []);
      setFocusSessions(data.focusSessions || []);
      setNotes(data.notes || []);
      setIntegrations(data.integrations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load planner workspace.');
    } finally {
      setLoading(false);
    }
  }, [userId, readLocalSyncedHooks]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const createTask = useCallback(
    async (payload: Partial<PlannerTask> & { title: string }) => {
      try {
        const res = await fetch('/api/planner/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not create task.');
        setTasks((prev) => [data.task, ...prev]);
        addNotification({
          title: `Task Scheduled: ${data.task.title}`,
          description: `Due ${data.task.dueDateISO} at ${data.task.dueTime} (${data.task.reminderOffset}).`,
          time: 'Just now',
          type: 'academic',
          linkRoute: '/tools/planner',
        });
        setActionBanner(`Task "${data.task.title}" added.`);
        return data.task as PlannerTask;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create task.');
        return null;
      }
    },
    [userId, addNotification]
  );

  const updateTask = useCallback(
    async (taskId: string, patch: Partial<PlannerTask>) => {
      try {
        const res = await fetch(`/api/planner/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not update task.');
        setTasks((prev) => {
          const updated = prev.map((t) => (t.id === taskId ? data.task : t));
          return data.nextRecurringTask ? [data.nextRecurringTask, ...updated] : updated;
        });
        if (patch.reminderState === 'Snoozed') {
          addNotification({
            title: `Reminder Snoozed: ${data.task.title}`,
            description: `Rescheduled alert for ${data.task.dueDateISO} at ${data.task.dueTime}.`,
            time: 'Just now',
            type: 'system',
            linkRoute: '/tools/planner',
          });
        }
        return data.task as PlannerTask;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update task.');
        return null;
      }
    },
    [userId, addNotification]
  );

  const duplicateTask = useCallback(
    async (taskId: string) => {
      try {
        const res = await fetch(`/api/planner/tasks/${taskId}/duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not duplicate task.');
        setTasks((prev) => [data.task, ...prev]);
        setActionBanner(`Duplicated "${data.task.title}".`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Duplicate failed.');
      }
    },
    [userId]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        const res = await fetch(`/api/planner/tasks/${taskId}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [userId]
  );

  const createEvent = useCallback(
    async (payload: Partial<CalendarEvent> & { title: string }) => {
      try {
        const res = await fetch('/api/planner/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not create event.');
        setEvents((prev) => [data.event, ...prev]);
        addNotification({
          title: `Calendar Event: ${data.event.title}`,
          description: `${data.event.dateISO} · ${data.event.startTime}–${data.event.endTime}`,
          time: 'Just now',
          type: 'campus',
          linkRoute: '/tools/planner',
        });
        setActionBanner(`Event "${data.event.title}" scheduled.`);
        return data.event as CalendarEvent;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create event.');
        return null;
      }
    },
    [userId, addNotification]
  );

  const updateEvent = useCallback(
    async (eventId: string, patch: Partial<CalendarEvent>) => {
      try {
        const res = await fetch(`/api/planner/events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not update event.');
        setEvents((prev) => prev.map((e) => (e.id === eventId ? data.event : e)));
        return data.event as CalendarEvent;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed.');
        return null;
      }
    },
    [userId]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      try {
        const res = await fetch(`/api/planner/events/${eventId}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [userId]
  );

  const createStudyPlan = useCallback(
    async (payload: Partial<StudyPlan> & { subject: string }) => {
      try {
        const res = await fetch('/api/planner/study-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not create study plan.');
        setStudyPlans((prev) => [data.studyPlan, ...prev]);
        setActionBanner(`Study plan created for ${data.studyPlan.subject}.`);
        return data.studyPlan as StudyPlan;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Study plan creation failed.');
        return null;
      }
    },
    [userId]
  );

  const updateStudyPlan = useCallback(
    async (planId: string, patch: Partial<StudyPlan>) => {
      try {
        const res = await fetch(`/api/planner/study-plans/${planId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Update failed.');
        setStudyPlans((prev) => prev.map((p) => (p.id === planId ? data.studyPlan : p)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed.');
      }
    },
    [userId]
  );

  const deleteStudyPlan = useCallback(
    async (planId: string) => {
      try {
        const res = await fetch(`/api/planner/study-plans/${planId}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setStudyPlans((prev) => prev.filter((p) => p.id !== planId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [userId]
  );

  const createStudySession = useCallback(
    async (payload: Partial<StudySessionRecord> & { subject: string }) => {
      try {
        const res = await fetch('/api/planner/study-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not schedule study session.');
        setStudySessions((prev) => [data.studySession, ...prev]);
        setActionBanner(`Study session scheduled for ${data.studySession.subject}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Session creation failed.');
      }
    },
    [userId]
  );

  const updateStudySession = useCallback(
    async (sessionId: string, patch: Partial<StudySessionRecord>) => {
      try {
        const res = await fetch(`/api/planner/study-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Session update failed.');
        setStudySessions((prev) => prev.map((s) => (s.id === sessionId ? data.studySession : s)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Session update failed.');
      }
    },
    [userId]
  );

  const deleteStudySession = useCallback(
    async (sessionId: string) => {
      try {
        const res = await fetch(`/api/planner/study-sessions/${sessionId}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setStudySessions((prev) => prev.filter((s) => s.id !== sessionId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [userId]
  );

  const createTimetableSlot = useCallback(
    async (payload: Partial<TimetableSlot> & { subject: string }) => {
      try {
        const res = await fetch('/api/planner/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not add timetable slot.');
        setTimetable((prev) => [...prev, data.slot]);
        setActionBanner(`Added ${data.slot.subject} to ${data.slot.dayOfWeek}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Timetable add failed.');
      }
    },
    [userId]
  );

  const duplicateTimetableDay = useCallback(
    async (fromDay: DayOfWeek, toDay: DayOfWeek) => {
      try {
        const res = await fetch('/api/planner/timetable/duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, fromDay, toDay }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Duplicate failed.');
        setTimetable((prev) => [...prev, ...(data.createdSlots || [])]);
        setActionBanner(`Duplicated ${fromDay} schedule to ${toDay}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Timetable duplicate failed.');
      }
    },
    [userId]
  );

  const deleteTimetableSlot = useCallback(
    async (slotId: string) => {
      try {
        const res = await fetch(`/api/planner/timetable/${slotId}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setTimetable((prev) => prev.filter((s) => s.id !== slotId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [userId]
  );

  const createGoal = useCallback(
    async (payload: Partial<PlannerGoal> & { title: string }) => {
      try {
        const res = await fetch('/api/planner/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not create goal.');
        setGoals((prev) => [data.goal, ...prev]);
        setActionBanner(`Goal "${data.goal.title}" saved.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Goal creation failed.');
      }
    },
    [userId]
  );

  const updateGoal = useCallback(
    async (goalId: string, patch: Partial<PlannerGoal>) => {
      try {
        const res = await fetch(`/api/planner/goals/${goalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Goal update failed.');
        setGoals((prev) => prev.map((g) => (g.id === goalId ? data.goal : g)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Goal update failed.');
      }
    },
    [userId]
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      try {
        const res = await fetch(`/api/planner/goals/${goalId}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [userId]
  );

  const createHabit = useCallback(
    async (name: string, targetNote?: string) => {
      try {
        const res = await fetch('/api/planner/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, name, targetNote }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not create habit.');
        setHabits((prev) => [data.habit, ...prev]);
        setActionBanner(`Habit "${data.habit.name}" added.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Habit creation failed.');
      }
    },
    [userId]
  );

  const toggleHabitDate = useCallback(
    async (habitId: string, dateISO: string) => {
      try {
        const res = await fetch(`/api/planner/habits/${habitId}/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, dateISO }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Check-in failed.');
        setHabits((prev) => prev.map((h) => (h.id === habitId ? data.habit : h)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Habit check-in failed.');
      }
    },
    [userId]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      try {
        const res = await fetch(`/api/planner/habits/${habitId}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setHabits((prev) => prev.filter((h) => h.id !== habitId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [userId]
  );

  const createExam = useCallback(
    async (payload: Partial<ExamRecord> & { name: string }) => {
      try {
        const res = await fetch('/api/planner/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not create exam record.');
        setExams((prev) => [data.exam, ...prev]);
        addNotification({
          title: `Exam / Deadline Tracked: ${data.exam.name}`,
          description: `Scheduled for ${data.exam.dateISO} at ${data.exam.time}.`,
          time: 'Just now',
          type: 'academic',
          linkRoute: '/tools/planner',
        });
        setActionBanner(`Tracked "${data.exam.name}".`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Exam creation failed.');
      }
    },
    [userId, addNotification]
  );

  const updateExam = useCallback(
    async (examId: string, patch: Partial<ExamRecord>) => {
      try {
        const res = await fetch(`/api/planner/exams/${examId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Update failed.');
        setExams((prev) => prev.map((x) => (x.id === examId ? data.exam : x)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed.');
      }
    },
    [userId]
  );

  const deleteExam = useCallback(
    async (examId: string) => {
      try {
        const res = await fetch(`/api/planner/exams/${examId}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setExams((prev) => prev.filter((x) => x.id !== examId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [userId]
  );

  const logFocusSession = useCallback(
    async (payload: {
      mode: 'Focus' | 'Short Break' | 'Long Break';
      presetLabel: string;
      plannedMinutes: number;
      actualMinutes: number;
      notes: string;
      confirmed: boolean;
    }) => {
      try {
        const res = await fetch('/api/planner/focus-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not record focus session.');
        setFocusSessions((prev) => [data.focusSession, ...prev]);
        setActionBanner(`Recorded ${data.focusSession.actualMinutes}m ${data.focusSession.mode} session.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Focus recording failed.');
      }
    },
    [userId]
  );

  const createNote = useCallback(
    async (payload: Partial<PlannerNote> & { content: string }) => {
      try {
        const res = await fetch('/api/planner/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not save note.');
        setNotes((prev) => [data.note, ...prev]);
        setActionBanner('Note saved.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Note save failed.');
      }
    },
    [userId]
  );

  const updateNote = useCallback(
    async (noteId: string, patch: Partial<PlannerNote>) => {
      try {
        const res = await fetch(`/api/planner/notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Could not update note.');
        setNotes((prev) => prev.map((n) => (n.id === noteId ? data.note : n)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Note update failed.');
      }
    },
    [userId]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        const res = await fetch(`/api/planner/notes/${noteId}?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Delete failed.');
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [userId]
  );

  const importIntegrationItem = useCallback(
    async (item: EcosystemIntegrationItem) => {
      if (item.kind === 'Event') {
        await createEvent({
          title: item.title,
          dateISO: item.dateISO,
          startTime: item.time,
          endTime: item.time,
          category: item.category,
          description: item.subtitle,
          sourceModule: item.sourceModule,
        });
      } else if (item.kind === 'StudySession') {
        await createStudySession({
          subject: item.category,
          chapterOrTopic: item.title,
          dateISO: item.dateISO,
          startTime: item.time,
          endTime: item.time,
          plannedMinutes: 45,
          status: 'Planned',
        });
      } else {
        await createTask({
          title: item.title,
          description: item.subtitle,
          category: item.category,
          dueDateISO: item.dateISO,
          dueTime: item.time,
          priority: 'High',
          sourceModule: item.sourceModule,
          sourceRefId: item.id,
        });
      }
    },
    [createEvent, createStudySession, createTask]
  );

  const generateAiPlannerDraft = useCallback(
    async (requestType: string, userPrompt: string) => {
      try {
        const todayISO = todayLocalISO();
        const contextLines = [
          `Open Tasks (${tasks.filter((t) => t.status !== 'Completed').length}): ${tasks
            .slice(0, 12)
            .map((t) => `${t.title} [${t.category}, due ${t.dueDateISO} ${t.dueTime}, ${t.priority}]`)
            .join('; ')}`,
          `Upcoming Exams (${exams.length}): ${exams
            .slice(0, 6)
            .map((x) => `${x.name} (${x.dateISO})`)
            .join('; ')}`,
          `Active Goals (${goals.length}): ${goals.map((g) => g.title).join('; ')}`,
        ].join('\n');

        const res = await fetch('/api/ai/tool', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool: 'planner-assistant',
            payload: {
              requestType,
              todayISO,
              userPrompt,
              plannerContext: contextLines,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.message || 'KAMPUS AI Planner Assistant is unavailable.' };
        }
        const raw = data.data || {};
        const items = Array.isArray(raw.items)
          ? raw.items.map((it: Record<string, unknown>, idx: number) => ({
              id: `aidraft_${Date.now()}_${idx}`,
              selected: true,
              kind: (it.kind as 'Task' | 'Event' | 'StudySession' | 'GoalMilestone') || 'Task',
              title: String(it.title || 'Planned Item'),
              category: (it.category as TaskCategory) || 'Study',
              dateISO: String(it.dateISO || todayISO),
              startTime: String(it.startTime || '17:00'),
              endTime: String(it.endTime || '18:00'),
              estimatedMinutes: Number(it.estimatedMinutes || 45),
              priority: (it.priority as PlannerTask['priority']) || 'Medium',
              notes: String(it.notes || ''),
            }))
          : [];

        return {
          ok: true,
          draft: {
            requestType,
            summaryTitle: String(raw.summaryTitle || 'Suggested Schedule'),
            adviceNote: String(raw.adviceNote || ''),
            items,
          },
        };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Unable to reach KAMPUS AI service.',
        };
      }
    },
    [tasks, exams, goals]
  );

  const applyAiDraftToPlanner = useCallback(
    async (draft: AiPlannerDraftPlan) => {
      const selected = draft.items.filter((i) => i.selected);
      let applied = 0;
      for (const item of selected) {
        if (item.kind === 'Event') {
          await createEvent({
            title: item.title,
            dateISO: item.dateISO,
            startTime: item.startTime,
            endTime: item.endTime,
            category: item.category,
            priority: item.priority,
            description: item.notes,
            sourceModule: 'KAMPUS AI',
          });
          applied += 1;
        } else if (item.kind === 'StudySession') {
          await createStudySession({
            subject: item.category,
            chapterOrTopic: item.title,
            dateISO: item.dateISO,
            startTime: item.startTime,
            endTime: item.endTime,
            plannedMinutes: item.estimatedMinutes,
            status: 'Planned',
          });
          applied += 1;
        } else {
          await createTask({
            title: item.title,
            description: item.notes,
            category: item.category,
            priority: item.priority,
            dueDateISO: item.dateISO,
            dueTime: item.startTime,
            estimatedMinutes: item.estimatedMinutes,
            sourceModule: 'KAMPUS AI',
          });
          applied += 1;
        }
      }
      if (applied > 0) {
        setActionBanner(`Confirmed and added ${applied} item(s) to your Planner.`);
      }
      return applied;
    },
    [createEvent, createStudySession, createTask]
  );

  return (
    <PlannerContext.Provider
      value={{
        loading,
        error,
        actionBanner,
        clearError,
        clearBanner,
        tasks,
        events,
        studyPlans,
        studySessions,
        timetable,
        goals,
        habits,
        exams,
        focusSessions,
        notes,
        integrations,
        partnerSessions,
        refreshWorkspace,
        createTask,
        updateTask,
        duplicateTask,
        deleteTask,
        createEvent,
        updateEvent,
        deleteEvent,
        createStudyPlan,
        updateStudyPlan,
        deleteStudyPlan,
        createStudySession,
        updateStudySession,
        deleteStudySession,
        createTimetableSlot,
        duplicateTimetableDay,
        deleteTimetableSlot,
        createGoal,
        updateGoal,
        deleteGoal,
        createHabit,
        toggleHabitDate,
        deleteHabit,
        createExam,
        updateExam,
        deleteExam,
        logFocusSession,
        createNote,
        updateNote,
        deleteNote,
        importIntegrationItem,
        generateAiPlannerDraft,
        applyAiDraftToPlanner,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = (): PlannerContextType => {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within a PlannerProvider');
  return ctx;
};
