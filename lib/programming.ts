import AsyncStorage from "@react-native-async-storage/async-storage";
import week_2026_03_09 from "../data/weeks/week_2026_03_09.json";
import week_2026_03_16 from "../data/weeks/week_2026_03_16.json";
import week_2026_03_23 from "../data/weeks/week_2026_03_23.json";
import week_2026_03_30 from "../data/weeks/week_2026_03_30.json";
import week_2026_04_06 from "../data/weeks/week_2026_04_06.json";
import week_2026_04_13 from "../data/weeks/week_2026_04_13.json";
import week_2026_04_20 from "../data/weeks/week_2026_04_20.json";
import week_2026_04_27 from "../data/weeks/week_2026_04_27.json";
import week_2026_05_04 from "../data/weeks/week_2026_05_04.json";
import { mondayOfWeek } from "./dates";

export type SessionSlug = "strength" | "running" | "engine" | "emom" | "simulation";

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
  is_placeholder?: boolean;
  sessions: Record<SessionSlug, Session>;
}

export const SESSION_ORDER: SessionSlug[] = [
  "strength",
  "running",
  "engine",
  "emom",
  "simulation",
];

export function getSessionOrder(): SessionSlug[] {
  return SESSION_ORDER;
}

export const SESSION_LABELS: Record<SessionSlug, string> = {
  strength: "STRENGTH",
  running: "RUNNING",
  engine: "ENGINE",
  emom: "EMOM / TECHNIQUE",
  simulation: "SIMULATION",
};

const ALL_WEEKS_UNSORTED: Week[] = [
  week_2026_03_09 as Week,
  week_2026_03_16 as Week,
  week_2026_03_23 as Week,
  week_2026_03_30 as Week,
  week_2026_04_06 as Week,
  week_2026_04_13 as Week,
  week_2026_04_20 as Week,
  week_2026_04_27 as Week,
  week_2026_05_04 as Week,
];

const ALL_WEEKS: Week[] = [...ALL_WEEKS_UNSORTED].sort((a, b) =>
  a.week_start.localeCompare(b.week_start)
);

export function getAllWeeks(): Week[] {
  return ALL_WEEKS;
}

function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d);
}

function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function findCurrentIndex(): number {
  const todayMondayISO = formatISO(mondayOfWeek(new Date()));
  const exact = ALL_WEEKS.findIndex((w) => w.week_start === todayMondayISO);
  if (exact >= 0) return exact;
  let mostRecent = -1;
  for (let i = 0; i < ALL_WEEKS.length; i++) {
    if (ALL_WEEKS[i].week_start <= todayMondayISO) mostRecent = i;
    else break;
  }
  return mostRecent >= 0 ? mostRecent : 0;
}

export function getCurrentWeek(): Week {
  return ALL_WEEKS[findCurrentIndex()];
}

export function getCurrentWeekIndex(): number {
  return findCurrentIndex();
}

export function getWeekByIndex(offset: number): Week | null {
  const idx = findCurrentIndex() + offset;
  if (idx < 0 || idx >= ALL_WEEKS.length) return null;
  return ALL_WEEKS[idx];
}

export function getWeekByStart(weekStart: string): Week | null {
  return ALL_WEEKS.find((w) => w.week_start === weekStart) ?? null;
}

export function getWeekBounds(): { earliestIndex: number; latestIndex: number } {
  const currentIdx = findCurrentIndex();
  const current = ALL_WEEKS[currentIdx];
  if (!current) return { earliestIndex: 0, latestIndex: 0 };

  const blockIds = Array.from(new Set(ALL_WEEKS.map((w) => w.block_id))).sort();
  const currentBlockPos = blockIds.indexOf(current.block_id);
  const prevBlockId = currentBlockPos > 0 ? blockIds[currentBlockPos - 1] : null;

  let earliestAbs = currentIdx;
  for (let i = 0; i < currentIdx; i++) {
    const w = ALL_WEEKS[i];
    if (w.block_id === current.block_id || (prevBlockId && w.block_id === prevBlockId)) {
      earliestAbs = i;
      break;
    }
  }

  let latestAbs = currentIdx;
  if (currentIdx + 1 < ALL_WEEKS.length) {
    const next = ALL_WEEKS[currentIdx + 1];
    const diffDays = Math.round(
      (isoToLocalDate(next.week_start).getTime() - isoToLocalDate(current.week_start).getTime()) / 86400000
    );
    if (diffDays === 7) latestAbs = currentIdx + 1;
  }

  return {
    earliestIndex: earliestAbs - currentIdx,
    latestIndex: latestAbs - currentIdx,
  };
}

export interface ReachableWeeks {
  weeks: Week[];
  currentIndex: number;
}

export function getReachableWeeks(): ReachableWeeks {
  const currentIdx = findCurrentIndex();
  const { earliestIndex, latestIndex } = getWeekBounds();
  const startAbs = currentIdx + earliestIndex;
  const endAbs = currentIdx + latestIndex;
  return {
    weeks: ALL_WEEKS.slice(startAbs, endAbs + 1),
    currentIndex: currentIdx - startAbs,
  };
}

export function isFutureWeek(weekStart: string): boolean {
  const weekDate = isoToLocalDate(weekStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return weekDate.getTime() > today.getTime();
}

export function getSession(slug: SessionSlug, weekStart?: string): Session | undefined {
  const week = weekStart ? getWeekByStart(weekStart) : getCurrentWeek();
  return week?.sessions[slug];
}

const completedKeyFor = (weekStart: string) => `hr_completed_sessions_${weekStart}`;

export async function getCompletedSessions(weekStart?: string): Promise<SessionSlug[]> {
  const key = completedKeyFor(weekStart ?? getCurrentWeek().week_start);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionSlug[]) : [];
  } catch {
    return [];
  }
}

export async function isSessionComplete(slug: SessionSlug, weekStart?: string): Promise<boolean> {
  const list = await getCompletedSessions(weekStart);
  return list.includes(slug);
}

export async function markSessionComplete(
  slug: SessionSlug,
  complete: boolean,
  weekStart?: string
): Promise<SessionSlug[]> {
  const effectiveWeek = weekStart ?? getCurrentWeek().week_start;
  const list = await getCompletedSessions(effectiveWeek);
  const set = new Set(list);
  if (complete) set.add(slug);
  else set.delete(slug);
  const next = SESSION_ORDER.filter((s) => set.has(s));
  await AsyncStorage.setItem(completedKeyFor(effectiveWeek), JSON.stringify(next));
  return next;
}
