// Pure, side-effect-free slice of cycleProgress.ts: types and predicates that
// don't touch React, AsyncStorage, or notifications. Lets test runners and any
// other non-RN consumer import this without dragging in the runtime stack.
// `cycleProgress.ts` re-exports everything here so existing callers stay
// unchanged.

export type SessionTier = "full" | "half";

export interface CompletedSession {
  weekIndex: number;
  sessionKey: string;
  completedAt: string;
  tier?: SessionTier;
}

export interface CycleProgress {
  startDate: string | null;
  cycleId: string | null;
  completedSessions: CompletedSession[];
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
