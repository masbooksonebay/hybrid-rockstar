// Minimal shared persistence layer for the Activity tab's log entries.
// Used by:
//   - app/(tabs)/log/index.tsx (the Activity screen — reads + writes)
//   - app/(tabs)/train/cycle/session.tsx (auto-creates a "programmed" entry
//     when a session is marked complete)
//
// The Activity screen already owns the in-screen state; this helper exists
// so the session-completion path can append without duplicating AsyncStorage
// read-modify-write code.

import AsyncStorage from "@react-native-async-storage/async-storage";

export const ACTIVITY_LOG_KEY = "hr_log";

export type LogEntryType = "ad-hoc" | "programmed";

export interface LogEntry {
  id: string;
  date: string;
  type?: LogEntryType; // undefined → legacy ad-hoc

  // Ad-hoc fields (legacy + + button entries)
  activity?: string;
  activityOther?: string;
  duration?: string;
  distanceKm?: string;

  // Programmed fields (Mark-Complete auto-created entries)
  sessionKey?: string;
  weekIndex?: number;
  sessionName?: string;
  tier?: "full" | "half";

  notes: string;
}

export async function loadActivityLog(): Promise<LogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVITY_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveActivityLog(entries: LogEntry[]): Promise<void> {
  await AsyncStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(entries));
}

// Append-or-replace by `id`. Prepends new entries so the newest sits at the
// top of the Activity feed (matches existing in-screen handleSave behavior).
export async function upsertActivityEntry(entry: LogEntry): Promise<void> {
  const current = await loadActivityLog();
  const without = current.filter((e) => e.id !== entry.id);
  await saveActivityLog([entry, ...without]);
}

// Stable id for a programmed session — lets re-completion replace rather than
// duplicate the entry. Format: programmed-w{N}-{sessionKey}.
export function programmedEntryId(weekIndex: number, sessionKey: string): string {
  return `programmed-w${weekIndex}-${sessionKey}`;
}
