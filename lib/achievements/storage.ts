import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACHIEVEMENTS, INITIAL_ACHIEVEMENTS_STORE } from "./catalog";
import { AchievementId, AchievementsStore } from "./types";

const STORAGE_KEY = "hr.achievements.v1";

let cache: AchievementsStore | null = null;
const listeners = new Set<(s: AchievementsStore) => void>();

function notify() {
  if (!cache) return;
  for (const listener of listeners) listener(cache);
}

// Reconcile a persisted blob against the current catalog: drop unknown ids
// (renamed/removed achievements) and seed any new ids with a locked state.
// Keeps the store schema-aligned across app versions.
function reconcile(raw: unknown): AchievementsStore {
  const out = { ...INITIAL_ACHIEVEMENTS_STORE };
  if (!raw || typeof raw !== "object") return out;
  const incoming = raw as Record<string, unknown>;
  for (const def of ACHIEVEMENTS) {
    const entry = incoming[def.id];
    if (
      entry &&
      typeof entry === "object" &&
      typeof (entry as { unlocked?: unknown }).unlocked === "boolean"
    ) {
      const e = entry as { unlocked: boolean; unlockedAt?: unknown };
      out[def.id] = {
        unlocked: e.unlocked,
        unlockedAt: typeof e.unlockedAt === "string" ? e.unlockedAt : null,
      };
    }
  }
  return out;
}

async function load(): Promise<AchievementsStore> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? reconcile(JSON.parse(raw)) : { ...INITIAL_ACHIEVEMENTS_STORE };
  } catch {
    cache = { ...INITIAL_ACHIEVEMENTS_STORE };
  }
  return cache;
}

export async function loadAchievements(): Promise<AchievementsStore> {
  return load();
}

export async function saveAchievements(store: AchievementsStore): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  cache = store;
  notify();
}

export async function markAchievementUnlocked(id: AchievementId): Promise<void> {
  const current = await load();
  if (current[id]?.unlocked) return;
  const next: AchievementsStore = {
    ...current,
    [id]: { unlocked: true, unlockedAt: new Date().toISOString() },
  };
  await saveAchievements(next);
}

export async function resetAchievements(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  cache = { ...INITIAL_ACHIEVEMENTS_STORE };
  notify();
}

export function useAchievements(): AchievementsStore {
  const [store, setStore] = useState<AchievementsStore>(
    cache ?? INITIAL_ACHIEVEMENTS_STORE
  );
  useEffect(() => {
    let cancelled = false;
    load().then((s) => {
      if (!cancelled) setStore(s);
    });
    const listener = (s: AchievementsStore) => setStore(s);
    listeners.add(listener);
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);
  return store;
}

// Test-only: reset the in-module cache so unit tests can re-seed AsyncStorage
// between cases without leaking state. Not for production paths.
export function __resetCacheForTests(): void {
  cache = null;
}
