import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "hr.achievements.unread.v1";

let cachedCount: number | null = null;
const listeners = new Set<(n: number) => void>();

function notify() {
  if (cachedCount == null) return;
  for (const l of listeners) l(cachedCount);
}

async function load(): Promise<number> {
  if (cachedCount != null) return cachedCount;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw != null ? JSON.parse(raw) : 0;
    cachedCount = typeof parsed === "number" && parsed >= 0 ? parsed : 0;
  } catch {
    cachedCount = 0;
  }
  return cachedCount;
}

export async function loadUnreadCount(): Promise<number> {
  return load();
}

export async function saveUnreadCount(count: number): Promise<void> {
  const next = Math.max(0, Math.floor(count));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cachedCount = next;
  notify();
}

export async function incrementUnread(by: number): Promise<void> {
  if (by <= 0) return;
  const current = await load();
  await saveUnreadCount(current + by);
}

export async function clearUnread(): Promise<void> {
  if (cachedCount === 0) return;
  await saveUnreadCount(0);
}

export function useUnreadCount(): number {
  const [count, setCount] = useState<number>(cachedCount ?? 0);
  useEffect(() => {
    let cancelled = false;
    load().then((n) => {
      if (!cancelled) setCount(n);
    });
    const listener = (n: number) => setCount(n);
    listeners.add(listener);
    return () => {
      cancelled = true;
      listeners.delete(listener);
    };
  }, []);
  return count;
}

// Test-only: reset the in-module cache so unit tests can re-seed AsyncStorage
// between cases without leaking state. Not for production paths.
export function __resetCacheForTests(): void {
  cachedCount = null;
}
