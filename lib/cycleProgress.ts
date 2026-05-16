import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadSettings } from "./store";
import { rescheduleNotifications } from "./notifications";
const STORAGE_KEYS = {
  startDate: "hr.cycle.startDate",
  cycleId: "hr.cycle.id",
  completed: "hr.cycle.completedSessions",
} as const;

const CYCLE_ID = "hr-cycle-1";
const CYCLE_LENGTH_WEEKS = 12;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface CompletedSession {
  weekIndex: number;
  sessionKey: string;
  completedAt: string;
}

export interface CycleProgress {
  startDate: string | null;
  cycleId: string | null;
  completedSessions: CompletedSession[];
}

const EMPTY: CycleProgress = {
  startDate: null,
  cycleId: null,
  completedSessions: [],
};

let cache: CycleProgress | null = null;
const listeners = new Set<(p: CycleProgress) => void>();

function notify() {
  if (!cache) return;
  for (const listener of listeners) listener(cache);
}

async function load(): Promise<CycleProgress> {
  if (cache) return cache;
  const [startDate, cycleId, completedRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.startDate),
    AsyncStorage.getItem(STORAGE_KEYS.cycleId),
    AsyncStorage.getItem(STORAGE_KEYS.completed),
  ]);
  let completedSessions: CompletedSession[] = [];
  if (completedRaw) {
    try {
      const parsed = JSON.parse(completedRaw);
      if (Array.isArray(parsed)) completedSessions = parsed;
    } catch {
      completedSessions = [];
    }
  }
  cache = { startDate, cycleId, completedSessions };
  return cache;
}

export async function getCycleProgress(): Promise<CycleProgress> {
  return load();
}

export async function startCycle(now: Date = new Date()): Promise<void> {
  const startDate = now.toISOString();
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.startDate, startDate),
    AsyncStorage.setItem(STORAGE_KEYS.cycleId, CYCLE_ID),
  ]);
  cache = { ...(cache ?? EMPTY), startDate, cycleId: CYCLE_ID };
  notify();
}

export async function resetCycle(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.startDate),
    AsyncStorage.removeItem(STORAGE_KEYS.cycleId),
    AsyncStorage.removeItem(STORAGE_KEYS.completed),
  ]);
  cache = { ...EMPTY };
  notify();
}

export async function markSessionComplete(
  weekIndex: number,
  sessionKey: string
): Promise<void> {
  const current = await load();
  const without = current.completedSessions.filter(
    (s) => !(s.weekIndex === weekIndex && s.sessionKey === sessionKey)
  );
  const next = [
    ...without,
    { weekIndex, sessionKey, completedAt: new Date().toISOString() },
  ];
  await AsyncStorage.setItem(STORAGE_KEYS.completed, JSON.stringify(next));
  cache = { ...current, completedSessions: next };
  notify();
  // Reschedule so the next daily notification's body reflects the new
  // remaining-sessions count (and switches to the "All sessions complete"
  // copy on the last completion of the week).
  await refreshNotification();
}

export async function markSessionIncomplete(
  weekIndex: number,
  sessionKey: string
): Promise<void> {
  const current = await load();
  const next = current.completedSessions.filter(
    (s) => !(s.weekIndex === weekIndex && s.sessionKey === sessionKey)
  );
  await AsyncStorage.setItem(STORAGE_KEYS.completed, JSON.stringify(next));
  cache = { ...current, completedSessions: next };
  notify();
  await refreshNotification();
}

async function refreshNotification(): Promise<void> {
  if (!cache) return;
  try {
    const settings = await loadSettings();
    await rescheduleNotifications(settings, cache);
  } catch {
    // Notification reschedule failures shouldn't surface in the completion UX.
  }
}

export function isSessionComplete(
  progress: CycleProgress,
  weekIndex: number,
  sessionKey: string
): boolean {
  return progress.completedSessions.some(
    (s) => s.weekIndex === weekIndex && s.sessionKey === sessionKey
  );
}

// True when every sessionKey in `week` is in `progress.completedSessions`.
// `total > 0` guard avoids tagging an empty-data week as trivially complete.
export function isWeekComplete(
  progress: CycleProgress,
  week: { cycle_week: number; sessionKeys: string[] }
): boolean {
  if (week.sessionKeys.length === 0) return false;
  return week.sessionKeys.every((key) =>
    isSessionComplete(progress, week.cycle_week, key)
  );
}

// Self-paced mode: pick the week the user is at the "leading edge" of.
//   1. No sessions logged anywhere → week 1.
//   2. Otherwise find the highest-numbered week H with at least one completed
//      session.
//      - If H is fully complete and H < 12 → return H + 1.
//      - If H is fully complete and H = 12 → return 12 (capped).
//      - If H has unfinished sessions → return H.
// Skips-ahead naturally: a user marking one session in Week 3 with nothing
// in Weeks 1-2 lands at Week 3 (the engaged frontier), not Week 1 (the lowest
// gap). Unmarking the last engaged session collapses back to Week 1.
export function leadingEdgeWeek(
  progress: CycleProgress,
  weeks: Array<{ cycle_week: number; sessionKeys: string[] }>
): number {
  const ordered = [...weeks].sort((a, b) => a.cycle_week - b.cycle_week);
  const lastIndex = ordered.length - 1;
  if (lastIndex < 0) return 1;
  let highestEngaged: { cycle_week: number; sessionKeys: string[] } | null = null;
  for (let i = lastIndex; i >= 0; i--) {
    const w = ordered[i];
    const anyDone = w.sessionKeys.some((k) =>
      isSessionComplete(progress, w.cycle_week, k)
    );
    if (anyDone) {
      highestEngaged = w;
      break;
    }
  }
  if (!highestEngaged) return ordered[0].cycle_week;
  if (isWeekComplete(progress, highestEngaged)) {
    return Math.min(
      ordered[lastIndex].cycle_week,
      highestEngaged.cycle_week + 1
    );
  }
  return highestEngaged.cycle_week;
}

// CURRENT week is always the user's leading edge in their completion log,
// regardless of race-date presence. Race date drives the countdown display
// elsewhere but is no longer an input here. `raceDate` kept in the signature
// so existing callers don't need a signature update.
export function getActiveWeek(
  progress: CycleProgress,
  _raceDate: string | null,
  weeks: Array<{ cycle_week: number; sessionKeys: string[] }>
): number | null {
  if (!progress.startDate) return null;
  return leadingEdgeWeek(progress, weeks);
}

// UNUSED after Phase 5+6 FIX 1 — getActiveWeek no longer dispatches on
// raceDate, so the calendar-derived week is no longer consulted. Kept until
// the next cleanup pass per spec.
export function getCurrentWeek(startDate: string | null): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.max(0, Math.floor((nowMidnight - startMidnight) / MS_PER_DAY));
  const week = Math.floor(days / 7) + 1;
  return Math.min(CYCLE_LENGTH_WEEKS, Math.max(1, week));
}

export interface WeekCompletion {
  completed: number;
  total: number;
}

export function getWeekCompletion(
  progress: CycleProgress,
  weekIndex: number,
  totalSessions: number
): WeekCompletion {
  const completed = progress.completedSessions.filter(
    (s) => s.weekIndex === weekIndex
  ).length;
  return { completed: Math.min(completed, totalSessions), total: totalSessions };
}

export interface NextSessionRef {
  weekIndex: number;
  sessionKey: string;
}

// Walks weeks at or after `startFromWeek` only. Sessions in weeks earlier
// than the leading edge are treated as past — they no longer surface in
// Up Next even when technically still incomplete. The cycle-complete state
// renders when this returns null at currentWeek=12.
export function getNextUncompletedSession(
  progress: CycleProgress,
  weeks: Array<{ cycle_week: number; sessionKeys: string[] }>,
  startFromWeek: number = 1
): NextSessionRef | null {
  const ordered = [...weeks].sort((a, b) => a.cycle_week - b.cycle_week);
  for (const w of ordered) {
    if (w.cycle_week < startFromWeek) continue;
    for (const key of w.sessionKeys) {
      if (!isSessionComplete(progress, w.cycle_week, key)) {
        return { weekIndex: w.cycle_week, sessionKey: key };
      }
    }
  }
  return null;
}

// UNUSED after Phase 5+6 FIX 3 — TrainScreen now derives "cycle complete"
// from `upNext === null` so the cycle-complete card renders correctly under
// the scoped Up Next walk (orphan incompletes in past weeks shouldn't block
// the end-of-cycle state). Kept until the next cleanup pass per spec.
export function isCycleComplete(
  progress: CycleProgress,
  weeks: Array<{ cycle_week: number; sessionKeys: string[] }>
): boolean {
  for (const w of weeks) {
    for (const key of w.sessionKeys) {
      if (!isSessionComplete(progress, w.cycle_week, key)) return false;
    }
  }
  return true;
}

export function useCycleProgress(): CycleProgress {
  const [progress, setProgress] = useState<CycleProgress>(cache ?? EMPTY);
  useEffect(() => {
    let cancelled = false;
    load().then((p) => {
      if (!cancelled) setProgress(p);
    });
    const listener = (p: CycleProgress) => setProgress(p);
    listeners.add(listener);
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);
  return progress;
}
