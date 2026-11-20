import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Layers,
  MapPin,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { usePlanner } from '../../context/PlannerContext';
import {
  CATEGORY_COLOR_MAP,
  DAYS_OF_WEEK,
  RECURRENCE_RULES,
  REMINDER_OFFSETS,
  TASK_CATEGORIES,
  TIMETABLE_SLOT_TYPES,
  addDaysToISO,
  formatReadableDate,
  todayLocalISO,
} from '../../data/plannerData';
import type {
  CalendarEvent,
  DayOfWeek,
  RecurrenceRule,
  ReminderOffset,
  TaskCategory,
  TimetableSlotType,
} from '../../types/planner';

interface Props {
  mode: 'calendar' | 'timetable';
}

export const PlannerCalendarAndTimetableView: React.FC<Props> = ({ mode }) => {
  const {
    events,
    tasks,
    exams,
    partnerSessions,
    createEvent,
    updateEvent,
    deleteEvent,
    timetable,
    createTimetableSlot,
    duplicateTimetableDay,
    deleteTimetableSlot,
  } = usePlanner();

  const todayISO = todayLocalISO();

  // Calendar state
  const [calView, setCalView] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Agenda'>('Weekly');
  const [anchorDate, setAnchorDate] = useState(todayISO);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [evTitle, setEvTitle] = useState('');
  const [evDate, setEvDate] = useState(todayISO);
  const [evStart, setEvStart] = useState('09:00');
  const [evEnd, setEvEnd] = useState('10:00');
  const [evCat, setEvCat] = useState<TaskCategory>('Study');
  const [evLoc, setEvLoc] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evRecur, setEvRecur] = useState<RecurrenceRule>('None');
  const [evRem, setEvRem] = useState<ReminderOffset>('15 minutes before');

  // Timetable state
  const [ttView, setTtView] = useState<'Weekly' | 'Daily'>('Weekly');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Mon');
  const [dupTargetDay, setDupTargetDay] = useState<DayOfWeek>('Tue');
  const [slotSubject, setSlotSubject] = useState('');
  const [slotType, setSlotType] = useState<TimetableSlotType>('Lecture');
  const [slotDay, setSlotDay] = useState<DayOfWeek>('Mon');
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('10:00');
  const [slotRoom, setSlotRoom] = useState('');
  const [slotInstructor, setSlotInstructor] = useState('');

  // Merged unified calendar items
  const allCalEntries = useMemo(() => {
    const list: Array<{
      id: string;
      rawEvent?: CalendarEvent;
      title: string;
      dateISO: string;
      startTime: string;
      endTime: string;
      category: TaskCategory;
      source: string;
      draggable: boolean;
    }> = [];

    for (const ev of events) {
      list.push({
        id: `ev_${ev.id}`,
        rawEvent: ev,
        title: ev.title,
        dateISO: ev.dateISO,
        startTime: ev.startTime,
        endTime: ev.endTime,
        category: ev.category,
        source: ev.sourceModule || 'Calendar',
        draggable: true,
      });
    }
    for (const tk of tasks) {
      if (tk.status !== 'Cancelled') {
        list.push({
          id: `tk_${tk.id}`,
          title: `[Task] ${tk.title}`,
          dateISO: tk.dueDateISO,
          startTime: tk.dueTime,
          endTime: '',
          category: tk.category,
          source: 'Tasks',
          draggable: false,
        });
      }
    }
    for (const ex of exams) {
      list.push({
        id: `ex_${ex.id}`,
        title: `[Exam] ${ex.name}`,
        dateISO: ex.dateISO,
        startTime: ex.time,
        endTime: '',
        category: 'Examinations',
        source: ex.examType,
        draggable: false,
      });
    }
    for (const ps of partnerSessions) {
      list.push({
        id: `ps_${ps.id}`,
        title: ps.title,
        dateISO: ps.dateISO,
        startTime: ps.timeSlot,
        endTime: '',
        category: 'Study',
        source: 'Synced',
        draggable: false,
      });
    }
    return list.sort((a, b) => `${a.dateISO} ${a.startTime}`.localeCompare(`${b.dateISO} ${b.startTime}`));
  }, [events, tasks, exams, partnerSessions]);

  const openNewEvent = (presetDate?: string) => {
    setEditingEvent(null);
    setEvTitle('');
    setEvDate(presetDate || anchorDate);
    setEvStart('09:00');
    setEvEnd('10:00');
    setEvCat('Study');
    setEvLoc('');
    setEvDesc('');
    setEvRecur('None');
    setEvRem('15 minutes before');
    setIsEventModalOpen(true);
  };

  const openEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEvTitle(ev.title);
    setEvDate(ev.dateISO);
    setEvStart(ev.startTime);
    setEvEnd(ev.endTime);
    setEvCat(ev.category);
    setEvLoc(ev.location);
    setEvDesc(ev.description);
    setEvRecur(ev.recurrence);
    setEvRem(ev.reminderOffset);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    const payload = {
      title: evTitle.trim(),
      dateISO: evDate,
      startTime: evStart,
      endTime: evEnd,
      category: evCat,
      location: evLoc.trim(),
      description: evDesc.trim(),
      recurrence: evRecur,
      reminderOffset: evRem,
    };
    if (editingEvent) {
      await updateEvent(editingEvent.id, payload);
    } else {
      await createEvent(payload);
    }
    setIsEventModalOpen(false);
  };

  const handleDropOnDate = async (e: React.DragEvent, targetDateISO: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/planner-event-id');
    if (eventId) {
      await updateEvent(eventId, { dateISO: targetDateISO });
    }
  };

  if (mode === 'timetable') {
    const handleAddSlot = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!slotSubject.trim()) return;
      await createTimetableSlot({
        dayOfWeek: slotDay,
        startTime: slotStart,
        endTime: slotEnd,
        subject: slotSubject.trim(),
        slotType,
        room: slotRoom.trim(),
        instructor: slotInstructor.trim(),
      });
      setSlotSubject('');
      setSlotRoom('');
      setSlotInstructor('');
    };

    const visibleDays = ttView === 'Weekly' ? DAYS_OF_WEEK : [selectedDay];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Weekly Timetable Builder
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Build your Monday–Sunday academic classes, practical labs, break windows, and self-study blocks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['Weekly', 'Daily'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setTtView(v)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold ${
                  ttView === v
                    ? 'bg-slate-900 dark:bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {v} View
              </button>
            ))}
          </div>
        </div>

        {/* Add Slot Form + Duplicate Day */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleAddSlot}
            className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs h-fit"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Timetable Slot</h3>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={slotDay}
                onChange={(e) => setSlotDay(e.target.value as DayOfWeek)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={slotType}
                onChange={(e) => setSlotType(e.target.value as TimetableSlotType)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {TIMETABLE_SLOT_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              required
              value={slotSubject}
              onChange={(e) => setSlotSubject(e.target.value)}
              placeholder="Subject or Period Name (e.g. CS-302 Algorithms)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={slotStart}
                onChange={(e) => setSlotStart(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
              <input
                type="time"
                value={slotEnd}
                onChange={(e) => setSlotEnd(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={slotRoom}
                onChange={(e) => setSlotRoom(e.target.value)}
                placeholder="Room / Location"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <input
                type="text"
                value={slotInstructor}
                onChange={(e) => setSlotInstructor(e.target.value)}
                placeholder="Instructor (optional)"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Add to Timetable
            </button>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-700 dark:text-slate-200">Duplicate Schedule</div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Copy {slotDay} to</span>
                <select
                  value={dupTargetDay}
                  onChange={(e) => setDupTargetDay(e.target.value as DayOfWeek)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {DAYS_OF_WEEK.filter((d) => d !== slotDay).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => duplicateTimetableDay(slotDay, dupTargetDay)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white font-semibold inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>
          </form>

          {/* Timetable Display */}
          <div className="lg:col-span-8 space-y-4">
            {ttView === 'Daily' && (
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      selectedDay === d
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleDays.map((day) => {
                const slots = timetable
                  .filter((s) => s.dayOfWeek === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div
                    key={day}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{day}</span>
                      <span className="text-[11px] text-slate-400 tabular-nums">{slots.length} slots</span>
                    </div>
                    {slots.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No classes added</p>
                    ) : (
                      <div className="space-y-2">
                        {slots.map((s) => (
                          <div
                            key={s.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold tabular-nums">
                                {s.startTime}–{s.endTime}
                              </span>
                              <button
                                onClick={() => deleteTimetableSlot(s.id)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white">{s.subject}</div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                              <span>{s.slotType}</span>
                              {s.room && (
                                <span className="inline-flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {s.room}
                                </span>
                              )}
                              {s.instructor && (
                                <span className="inline-flex items-center gap-0.5">
                                  <User className="w-3 h-3" />
                                  {s.instructor}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calendar Mode (Daily / Weekly / Monthly / Agenda)
  const weekDays = useMemo(() => {
    const [y, m, d] = anchorDate.split('-').map(Number);
    const base = new Date(y, (m || 1) - 1, d || 1);
    const dow = (base.getDay() + 6) % 7; // Mon = 0
    const mondayISO = addDaysToISO(anchorDate, -dow);
    return Array.from({ length: 7 }).map((_, i) => addDaysToISO(mondayISO, i));
  }, [anchorDate]);

  const monthDays = useMemo(() => {
    const [y, m] = anchorDate.split('-').map(Number);
    const first = `${y}-${String(m).padStart(2, '0')}-01`;
    const totalDays = new Date(y, m, 0).getDate();
    return Array.from({ length: totalDays }).map((_, i) => addDaysToISO(first, i));
  }, [anchorDate]);

  const stepAnchor = (dir: -1 | 1) => {
    if (calView === 'Daily') setAnchorDate(addDaysToISO(anchorDate, dir));
    else if (calView === 'Weekly') setAnchorDate(addDaysToISO(anchorDate, dir * 7));
    else setAnchorDate(addDaysToISO(anchorDate, dir * 30));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Interactive Calendar & Schedule
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Drag and drop calendar events across days in Weekly or Monthly view to reschedule cleanly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(['Daily', 'Weekly', 'Monthly', 'Agenda'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setCalView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  calView === v
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => openNewEvent()}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => stepAnchor(-1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAnchorDate(todayISO)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
          >
            Today
          </button>
          <button
            onClick={() => stepAnchor(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
          {formatReadableDate(anchorDate)}
        </span>
      </div>

      {/* Daily View */}
      {calView === 'Daily' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Schedule for {formatReadableDate(anchorDate)}
            </h3>
            <button
              onClick={() => openNewEvent(anchorDate)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              + Add Event Here
            </button>
          </div>
          {allCalEntries.filter((e) => e.dateISO === anchorDate).length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No items scheduled for this date.</p>
          ) : (
            <div className="space-y-2">
              {allCalEntries
                .filter((e) => e.dateISO === anchorDate)
                .map((entry) => {
                  const cs = CATEGORY_COLOR_MAP[entry.category] || CATEGORY_COLOR_MAP.Other;
                  return (
                    <div
                      key={entry.id}
                      className={`p-3.5 rounded-xl border ${cs.border} ${cs.bg} flex items-center justify-between gap-3 text-xs`}
                    >
                      <div>
                        <div className={`font-bold ${cs.text}`}>
                          {entry.startTime}
                          {entry.endTime ? `–${entry.endTime}` : ''} · {entry.category}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                          {entry.title}
                        </div>
                      </div>
                      {entry.rawEvent && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditEvent(entry.rawEvent!)}
                            className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-900 text-slate-600"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteEvent(entry.rawEvent!.id)}
                            className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-900 text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Weekly View (Supports Drag-and-Drop Date Rescheduling) */}
      {calView === 'Weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((dayISO) => {
            const items = allCalEntries.filter((e) => e.dateISO === dayISO);
            const isToday = dayISO === todayISO;
            return (
              <div
                key={dayISO}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnDate(e, dayISO)}
                className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border min-h-[200px] space-y-2 ${
                  isToday ? 'border-blue-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className={`font-bold tabular-nums ${isToday ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>
                    {new Date(dayISO + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                  </span>
                  <button
                    onClick={() => openNewEvent(dayISO)}
                    className="text-slate-400 hover:text-blue-600"
                    title="Add event"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {items.map((item) => {
                  const cs = CATEGORY_COLOR_MAP[item.category] || CATEGORY_COLOR_MAP.Other;
                  return (
                    <div
                      key={item.id}
                      draggable={item.draggable}
                      onDragStart={(e) => {
                        if (item.rawEvent) {
                          e.dataTransfer.setData('text/planner-event-id', item.rawEvent.id);
                        }
                      }}
                      className={`p-2 rounded-xl border ${cs.border} ${cs.bg} text-[11px] space-y-0.5 ${
                        item.draggable ? 'cursor-grab active:cursor-grabbing' : ''
                      }`}
                    >
                      <div className={`font-bold tabular-nums ${cs.text}`}>{item.startTime}</div>
                      <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </div>
                      {item.rawEvent && (
                        <div className="flex justify-end gap-1 pt-1">
                          <button
                            onClick={() => openEditEvent(item.rawEvent!)}
                            className="text-slate-500 hover:text-blue-600"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteEvent(item.rawEvent!.id)}
                            className="text-slate-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly View (Supports Drag-and-Drop) */}
      {calView === 'Monthly' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {monthDays.map((dayISO) => {
            const items = allCalEntries.filter((e) => e.dateISO === dayISO);
            const isToday = dayISO === todayISO;
            return (
              <div
                key={dayISO}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnDate(e, dayISO)}
                className={`p-2.5 rounded-xl bg-white dark:bg-slate-900 border min-h-[100px] space-y-1.5 ${
                  isToday ? 'border-blue-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-bold tabular-nums ${isToday ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>
                    {dayISO.slice(8)}
                  </span>
                  <button
                    onClick={() => openNewEvent(dayISO)}
                    className="text-slate-400 hover:text-blue-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {items.slice(0, 3).map((item) => {
                  const cs = CATEGORY_COLOR_MAP[item.category] || CATEGORY_COLOR_MAP.Other;
                  return (
                    <div
                      key={item.id}
                      draggable={item.draggable}
                      onDragStart={(e) => {
                        if (item.rawEvent) {
                          e.dataTransfer.setData('text/planner-event-id', item.rawEvent.id);
                        }
                      }}
                      className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate ${cs.bg} ${cs.text}`}
                    >
                      {item.startTime} {item.title}
                    </div>
                  );
                })}
                {items.length > 3 && (
                  <div className="text-[10px] text-slate-400">+{items.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Agenda View */}
      {calView === 'Agenda' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          {allCalEntries.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              Your agenda is empty. Add calendar events, tasks, or exams to see them chronologically.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {allCalEntries.map((item) => {
                const cs = CATEGORY_COLOR_MAP[item.category] || CATEGORY_COLOR_MAP.Other;
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cs.dot}`} />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {formatReadableDate(item.dateISO)} · {item.startTime} · {item.source}
                        </div>
                      </div>
                    </div>
                    {item.rawEvent && (
                      <button
                        onClick={() => deleteEvent(item.rawEvent!.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEvent}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-3.5 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEvent ? 'Edit Event' : 'Add Calendar Event'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              value={evTitle}
              onChange={(e) => setEvTitle(e.target.value)}
              placeholder="Event title"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="date"
                value={evDate}
                onChange={(e) => setEvDate(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
              <input
                type="time"
                value={evStart}
                onChange={(e) => setEvStart(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
              <input
                type="time"
                value={evEnd}
                onChange={(e) => setEvEnd(e.target.value)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={evCat}
                onChange={(e) => setEvCat(e.target.value as TaskCategory)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={evRecur}
                onChange={(e) => setEvRecur(e.target.value as RecurrenceRule)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {RECURRENCE_RULES.map((r) => (
                  <option key={r} value={r}>
                    Repeat: {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={evLoc}
                onChange={(e) => setEvLoc(e.target.value)}
                placeholder="Location / Link"
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <select
                value={evRem}
                onChange={(e) => setEvRem(e.target.value as ReminderOffset)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                {REMINDER_OFFSETS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={2}
              value={evDesc}
              onChange={(e) => setEvDesc(e.target.value)}
              placeholder="Event notes"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
