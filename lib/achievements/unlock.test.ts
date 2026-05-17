import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkUnlocks, UnlockContext, WeekRef } from "./unlock";
import { INITIAL_ACHIEVEMENTS_STORE } from "./catalog";
import { AchievementsStore } from "./types";
import {
  CompletedSession,
  CycleProgress,
  SessionTier,
} from "../cycleProgress.pure";

// ─── Fixtures ──────────────────────────────────────────────────────────────

// 12 weeks, 6 sessions each (d1-d6). Matches the shape `runAchievementChecks`
// produces from the real cycle, but kept hand-rolled so the test doesn't
// depend on the cycle JSON.
const WEEKS: WeekRef[] = Array.from({ length: 12 }, (_, i) => ({
  cycle_week: i + 1,
  sessionKeys: ["d1", "d2", "d3", "d4", "d5", "d6"],
}));

const FIXED_NOW = new Date("2026-05-16T12:00:00Z");

function session(
  weekIndex: number,
  sessionKey: string,
  daysAgo: number,
  tier: SessionTier = "full"
): CompletedSession {
  const t = FIXED_NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000;
  return {
    weekIndex,
    sessionKey,
    completedAt: new Date(t).toISOString(),
    tier,
  };
}

function ctx(
  sessions: CompletedSession[],
  overrides: Partial<UnlockContext> = {}
): UnlockContext {
  const progress: CycleProgress = {
    startDate: "2026-01-01T00:00:00Z",
    cycleId: "hr-cycle-1",
    completedSessions: sessions,
  };
  return {
    cycleProgress: progress,
    weeks: WEEKS,
    sessions,
    currentTier: "full",
    now: FIXED_NOW,
    ...overrides,
  };
}

function fullWeek(weekIndex: number, daysAgoStart = 0, tier: SessionTier = "full"): CompletedSession[] {
  return WEEKS[weekIndex - 1].sessionKeys.map((k, i) =>
    session(weekIndex, k, daysAgoStart + i * 0.01, tier)
  );
}

const FRESH_STORE: AchievementsStore = INITIAL_ACHIEVEMENTS_STORE;

// ─── Predicate coverage ────────────────────────────────────────────────────

describe("first_rep", () => {
  it("does not unlock with zero sessions", () => {
    const result = checkUnlocks(FRESH_STORE, ctx([]));
    assert.ok(!result.includes("first_rep"));
  });
  it("unlocks at exactly 1 session", () => {
    const result = checkUnlocks(FRESH_STORE, ctx([session(1, "d1", 0)]));
    assert.ok(result.includes("first_rep"));
  });
});

describe("first_week", () => {
  it("does not unlock on partial week", () => {
    const partial = fullWeek(1).slice(0, 3);
    const result = checkUnlocks(FRESH_STORE, ctx(partial));
    assert.ok(!result.includes("first_week"));
  });
  it("unlocks on full week", () => {
    const result = checkUnlocks(FRESH_STORE, ctx(fullWeek(1)));
    assert.ok(result.includes("first_week"));
  });
});

describe("one_month_in", () => {
  it("does not unlock at week 3 leading edge", () => {
    // Engaged at week 3 (incomplete) → leadingEdgeWeek = 3.
    const result = checkUnlocks(FRESH_STORE, ctx([session(3, "d1", 0)]));
    assert.ok(!result.includes("one_month_in"));
  });
  it("unlocks when leadingEdgeWeek hits 4", () => {
    const result = checkUnlocks(FRESH_STORE, ctx([session(4, "d1", 0)]));
    assert.ok(result.includes("one_month_in"));
  });
});

describe("halfway_there", () => {
  it("does not unlock on week 6 partial", () => {
    const partial = fullWeek(6).slice(0, 5);
    const result = checkUnlocks(FRESH_STORE, ctx(partial));
    assert.ok(!result.includes("halfway_there"));
  });
  it("unlocks on week 6 full completion", () => {
    const result = checkUnlocks(FRESH_STORE, ctx(fullWeek(6)));
    assert.ok(result.includes("halfway_there"));
  });
});

describe("final_push", () => {
  it("does not unlock at week 11", () => {
    const result = checkUnlocks(FRESH_STORE, ctx([session(11, "d1", 0)]));
    assert.ok(!result.includes("final_push"));
  });
  it("unlocks at leadingEdgeWeek 12", () => {
    const result = checkUnlocks(FRESH_STORE, ctx([session(12, "d1", 0)]));
    assert.ok(result.includes("final_push"));
  });
});

describe("cycle_crown", () => {
  it("does not unlock with 11 weeks complete", () => {
    const sessions: CompletedSession[] = [];
    for (let w = 1; w <= 11; w++) sessions.push(...fullWeek(w));
    const result = checkUnlocks(FRESH_STORE, ctx(sessions));
    assert.ok(!result.includes("cycle_crown"));
  });
  it("unlocks when all 12 weeks complete", () => {
    const sessions: CompletedSession[] = [];
    for (let w = 1; w <= 12; w++) sessions.push(...fullWeek(w));
    const result = checkUnlocks(FRESH_STORE, ctx(sessions));
    assert.ok(result.includes("cycle_crown"));
  });
});

describe("consistency", () => {
  it("does not unlock at 4 sessions in 7 days", () => {
    const sessions = [
      session(1, "d1", 6),
      session(1, "d2", 4),
      session(1, "d3", 2),
      session(1, "d4", 0),
    ];
    const result = checkUnlocks(FRESH_STORE, ctx(sessions));
    assert.ok(!result.includes("consistency"));
  });
  it("unlocks at 5 sessions inside a 7-day window", () => {
    const sessions = [
      session(1, "d1", 6),
      session(1, "d2", 5),
      session(1, "d3", 3),
      session(1, "d4", 1),
      session(1, "d5", 0),
    ];
    const result = checkUnlocks(FRESH_STORE, ctx(sessions));
    assert.ok(result.includes("consistency"));
  });
});

describe("comeback", () => {
  it("does not unlock when prior gap was 6 days", () => {
    const sessions = [session(1, "d1", 6), session(1, "d2", 0)];
    const result = checkUnlocks(FRESH_STORE, ctx(sessions));
    assert.ok(!result.includes("comeback"));
  });
  it("unlocks when prior gap was 7+ days and latest is within 24h", () => {
    const sessions = [session(1, "d1", 8), session(1, "d2", 0)];
    const result = checkUnlocks(FRESH_STORE, ctx(sessions));
    assert.ok(result.includes("comeback"));
  });
});

describe("full_send", () => {
  it("does not unlock on a half-only history", () => {
    const result = checkUnlocks(FRESH_STORE, ctx([session(1, "d1", 0, "half")]));
    assert.ok(!result.includes("full_send"));
  });
  it("unlocks on first full session", () => {
    const result = checkUnlocks(FRESH_STORE, ctx([session(1, "d1", 0, "full")]));
    assert.ok(result.includes("full_send"));
  });
});

describe("half_send", () => {
  it("does not unlock on a full-only history", () => {
    const result = checkUnlocks(FRESH_STORE, ctx([session(1, "d1", 0, "full")]));
    assert.ok(!result.includes("half_send"));
  });
  it("unlocks on first half session", () => {
    const result = checkUnlocks(FRESH_STORE, ctx([session(1, "d1", 0, "half")]));
    assert.ok(result.includes("half_send"));
  });
});

// ─── Hygiene ───────────────────────────────────────────────────────────────

describe("hygiene", () => {
  it("does not return already-unlocked IDs", () => {
    const partiallyUnlocked: AchievementsStore = {
      ...FRESH_STORE,
      first_rep: { unlocked: true, unlockedAt: "2026-04-01T00:00:00Z" },
    };
    const result = checkUnlocks(partiallyUnlocked, ctx([session(1, "d1", 0)]));
    assert.ok(!result.includes("first_rep"));
  });

  it("does not mutate currentStore", () => {
    const before = JSON.stringify(FRESH_STORE);
    checkUnlocks(FRESH_STORE, ctx(fullWeek(1)));
    assert.equal(JSON.stringify(FRESH_STORE), before);
  });
});
