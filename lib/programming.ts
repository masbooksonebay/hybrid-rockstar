import AsyncStorage from "@react-native-async-storage/async-storage";
import weekData from "../data/weeks/week_2026_05_04.json";

export type SessionSlug = "strength" | "running" | "engine" | "simulation" | "emom";

export interface SessionStructureBlock {
  heading: string;
  items: string[];
}

export interface SessionVersion {
  estimated_duration_minutes: number;
  structure: SessionStructureBlock[];
}

export interface SessionNotes {
  about: string;
  week_context: string;
  block_context: string;
}

export interface Session {
  title: string;
  stimulus: string;
  simulation_type?: string;
  full_rox: SessionVersion;
  quick_rox: SessionVersion;
  notes: SessionNotes;
}

export interface Week {
  week_start: string;
  block_id: string;
  block_week: number;
  block_phase: string;
  sessions: Record<SessionSlug, Session>;
}

export const SESSION_ORDER: SessionSlug[] = [
  "strength",
  "running",
  "engine",
  "simulation",
  "emom",
];

export const SESSION_LABELS: Record<SessionSlug, string> = {
  strength: "STRENGTH",
  running: "RUNNING",
  engine: "ENGINE",
  simulation: "SIMULATION",
  emom: "EMOM / TECHNIQUE",
};

const LAST_SEEN_WEEK_KEY = "hr_last_seen_week";
const completedKeyFor = (weekStart: string) => `hr_completed_sessions_${weekStart}`;
const archivedKeyFor = (weekStart: string) => `hr_completed_sessions_${weekStart}_archived`;

export function getCurrentWeek(): Week {
  return weekData as Week;
}

export function getSession(slug: SessionSlug): Session | undefined {
  return getCurrentWeek().sessions[slug];
}

export async function getCompletedSessions(): Promise<SessionSlug[]> {
  const week = getCurrentWeek();
  await rotateIfNewWeek(week.week_start);
  const raw = await AsyncStorage.getItem(completedKeyFor(week.week_start));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionSlug[]) : [];
  } catch {
    return [];
  }
}

export async function isSessionComplete(slug: SessionSlug): Promise<boolean> {
  const list = await getCompletedSessions();
  return list.includes(slug);
}

export async function markSessionComplete(slug: SessionSlug, complete: boolean): Promise<SessionSlug[]> {
  const week = getCurrentWeek();
  await rotateIfNewWeek(week.week_start);
  const list = await getCompletedSessions();
  const set = new Set(list);
  if (complete) set.add(slug);
  else set.delete(slug);
  const next = SESSION_ORDER.filter((s) => set.has(s));
  await AsyncStorage.setItem(completedKeyFor(week.week_start), JSON.stringify(next));
  return next;
}

async function rotateIfNewWeek(currentWeekStart: string): Promise<void> {
  const last = await AsyncStorage.getItem(LAST_SEEN_WEEK_KEY);
  if (last && last !== currentWeekStart) {
    const oldRaw = await AsyncStorage.getItem(completedKeyFor(last));
    if (oldRaw) {
      await AsyncStorage.setItem(archivedKeyFor(last), oldRaw);
      await AsyncStorage.removeItem(completedKeyFor(last));
    }
  }
  if (last !== currentWeekStart) {
    await AsyncStorage.setItem(LAST_SEEN_WEEK_KEY, currentWeekStart);
  }
}
