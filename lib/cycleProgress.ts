import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export function getNextUncompletedSession(
  progress: CycleProgress,
  weeks: Array<{ cycle_week: number; sessionKeys: string[] }>,
  startFromWeek: number = 1
): NextSessionRef | null {
  const ordered = [...weeks].sort((a, b) => a.cycle_week - b.cycle_week);
  const fromCurrent = ordered.filter((w) => w.cycle_week >= startFromWeek);
  for (const w of [...fromCurrent, ...ordered.filter((w) => w.cycle_week < startFromWeek)]) {
    for (const key of w.sessionKeys) {
      if (!isSessionComplete(progress, w.cycle_week, key)) {
        return { weekIndex: w.cycle_week, sessionKey: key };
      }
    }
  }
  return null;
}

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
