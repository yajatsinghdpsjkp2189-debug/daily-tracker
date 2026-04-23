import type {
  CalendarEvent,
  Habit,
  ProductivityLog,
  RevisionTopic,
} from "../backend.d";

// ─── Internal stored types (no bigint, plain JSON-safe) ───────────────────────

interface StoredHabit {
  id: number;
  name: string;
  completionDates: string[];
}

interface StoredCalendarEvent {
  id: number;
  title: string;
  date: string;
  eventType: string;
  description: string;
}

interface StoredProductivityLog {
  rating: number;
  notes: string;
}

interface StoredRevisionTopic {
  id: number;
  title: string;
  intervals: number[];
  completedIntervals: number[];
  createdAtMs: number;
}

export interface AllData {
  habits: StoredHabit[];
  calendarEvents: StoredCalendarEvent[];
  productivityLogs: Record<string, StoredProductivityLog>;
  revisionTopics: StoredRevisionTopic[];
  tasks: unknown[];
  nextId: number;
}

// ─── Storage keys ────────────────────────────────────────────────────────────

const KEYS = {
  habits: "dt-habits",
  calendarEvents: "dt-calendar-events",
  productivityLogs: "dt-productivity-logs",
  revisionTopics: "dt-revision-topics",
  nextId: "dt-next-id",
  tasks: "daily-tracker-tasks",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function load<T>(key: string, def: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : def;
  } catch {
    return def;
  }
}

function save(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
}

let nextIdCounter = load<number>(KEYS.nextId, 1);

function getNextId(): number {
  const id = nextIdCounter++;
  save(KEYS.nextId, nextIdCounter);
  return id;
}

// ─── Raw load/save per collection ────────────────────────────────────────────

function loadHabits(): StoredHabit[] {
  return load(KEYS.habits, []);
}
function saveHabits(h: StoredHabit[]): void {
  save(KEYS.habits, h);
}

function loadCalendarEvents(): StoredCalendarEvent[] {
  return load(KEYS.calendarEvents, []);
}
function saveCalendarEvents(e: StoredCalendarEvent[]): void {
  save(KEYS.calendarEvents, e);
}

function loadProductivityLogs(): Record<string, StoredProductivityLog> {
  return load(KEYS.productivityLogs, {});
}
function saveProductivityLogs(l: Record<string, StoredProductivityLog>): void {
  save(KEYS.productivityLogs, l);
}

function loadRevisionTopics(): StoredRevisionTopic[] {
  return load(KEYS.revisionTopics, []);
}
function saveRevisionTopics(t: StoredRevisionTopic[]): void {
  save(KEYS.revisionTopics, t);
}

// ─── Local actor (mirrors backend interface) ─────────────────────────────────

export const localActor = {
  // Habits
  getAllHabits: async (): Promise<Habit[]> =>
    loadHabits().map((h) => ({
      id: BigInt(h.id),
      name: h.name,
      completionDates: h.completionDates,
    })),

  createHabit: async (name: string): Promise<bigint> => {
    const habits = loadHabits();
    const id = getNextId();
    habits.push({ id, name, completionDates: [] });
    saveHabits(habits);
    return BigInt(id);
  },

  completeHabit: async (id: bigint, date: string): Promise<void> => {
    const habits = loadHabits();
    const habit = habits.find((h) => h.id === Number(id));
    if (habit && !habit.completionDates.includes(date)) {
      habit.completionDates.push(date);
    }
    saveHabits(habits);
  },

  deleteHabit: async (id: bigint): Promise<void> => {
    saveHabits(loadHabits().filter((h) => h.id !== Number(id)));
  },

  // Calendar Events
  getAllCalendarEvents: async (): Promise<CalendarEvent[]> =>
    loadCalendarEvents().map((e) => ({
      id: BigInt(e.id),
      title: e.title,
      date: e.date,
      eventType: e.eventType,
      description: e.description,
    })),

  createCalendarEvent: async (
    title: string,
    date: string,
    eventType: string,
    description: string,
  ): Promise<bigint> => {
    const events = loadCalendarEvents();
    const id = getNextId();
    events.push({ id, title, date, eventType, description });
    saveCalendarEvents(events);
    return BigInt(id);
  },

  updateCalendarEvent: async (
    id: bigint,
    title: string,
    date: string,
    eventType: string,
    description: string,
  ): Promise<void> => {
    const events = loadCalendarEvents();
    const ev = events.find((e) => e.id === Number(id));
    if (ev) Object.assign(ev, { title, date, eventType, description });
    saveCalendarEvents(events);
  },

  deleteCalendarEvent: async (id: bigint): Promise<void> => {
    saveCalendarEvents(loadCalendarEvents().filter((e) => e.id !== Number(id)));
  },

  getCalendarEvent: async (id: bigint): Promise<CalendarEvent> => {
    const ev = loadCalendarEvents().find((e) => e.id === Number(id));
    if (!ev) throw new Error("Event not found");
    return {
      id: BigInt(ev.id),
      title: ev.title,
      date: ev.date,
      eventType: ev.eventType,
      description: ev.description,
    };
  },

  // Productivity Logs
  getProductivityLog: async (date: string): Promise<ProductivityLog | null> => {
    const log = loadProductivityLogs()[date];
    if (!log) return null;
    return { rating: BigInt(log.rating), notes: log.notes };
  },

  getAllProductivityLogs: async (): Promise<Array<[string, ProductivityLog]>> =>
    Object.entries(loadProductivityLogs()).map(([date, log]) => [
      date,
      { rating: BigInt(log.rating), notes: log.notes },
    ]),

  saveProductivityLog: async (
    date: string,
    rating: bigint,
    notes: string,
  ): Promise<void> => {
    const logs = loadProductivityLogs();
    logs[date] = { rating: Number(rating), notes };
    saveProductivityLogs(logs);
  },

  // Revision Topics
  getAllRevisionTopics: async (): Promise<RevisionTopic[]> =>
    loadRevisionTopics().map((t) => ({
      id: BigInt(t.id),
      title: t.title,
      intervals: t.intervals.map(BigInt),
      completedIntervals: t.completedIntervals.map(BigInt),
      createdAt: BigInt(t.createdAtMs) * 1_000_000n,
    })),

  createRevisionTopic: async (
    title: string,
    intervals: bigint[],
  ): Promise<bigint> => {
    const topics = loadRevisionTopics();
    const id = getNextId();
    topics.push({
      id,
      title,
      intervals: intervals.map(Number),
      completedIntervals: [],
      createdAtMs: Date.now(),
    });
    saveRevisionTopics(topics);
    return BigInt(id);
  },

  completeRevisionInterval: async (
    id: bigint,
    interval: bigint,
  ): Promise<void> => {
    const topics = loadRevisionTopics();
    const topic = topics.find((t) => t.id === Number(id));
    if (topic && !topic.completedIntervals.includes(Number(interval))) {
      topic.completedIntervals.push(Number(interval));
    }
    saveRevisionTopics(topics);
  },

  deleteRevisionTopic: async (id: bigint): Promise<void> => {
    saveRevisionTopics(loadRevisionTopics().filter((t) => t.id !== Number(id)));
  },

  getHabitCompletionDates: async (id: bigint): Promise<string[]> => {
    const habit = loadHabits().find((h) => h.id === Number(id));
    return habit?.completionDates ?? [];
  },
};

// ─── Backup / Restore ────────────────────────────────────────────────────────

export function exportAllData(): string {
  const data: AllData = {
    habits: loadHabits(),
    calendarEvents: loadCalendarEvents(),
    productivityLogs: loadProductivityLogs(),
    revisionTopics: loadRevisionTopics(),
    tasks: load(KEYS.tasks, []),
    nextId: nextIdCounter,
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonStr: string): void {
  const data = JSON.parse(jsonStr) as Partial<AllData>;
  if (data.habits) saveHabits(data.habits);
  if (data.calendarEvents) saveCalendarEvents(data.calendarEvents);
  if (data.productivityLogs) saveProductivityLogs(data.productivityLogs);
  if (data.revisionTopics) saveRevisionTopics(data.revisionTopics);
  if (data.tasks) save(KEYS.tasks, data.tasks);
  if (data.nextId) {
    nextIdCounter = data.nextId;
    save(KEYS.nextId, nextIdCounter);
  }
}
