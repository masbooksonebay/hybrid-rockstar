import {
  CompletedSession,
  CycleProgress,
  isWeekComplete,
  leadingEdgeWeek,
} from "../cycleProgress.pure";
import { AchievementId, AchievementsStore } from "./types";

export interface WeekRef {
  cycle_week: number;
  sessionKeys: string[];
}

export interface UnlockContext {
  cycleProgress: CycleProgress;
  weeks: WeekRef[];
  sessions: CompletedSession[];
  currentTier: "full" | "half";
  now: Date;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ─── Predicates ────────────────────────────────────────────────────────────
// Each returns whether the achievement should be unlocked given the context.
// Pure, no side effects. Assume `currentStore` filtering happens at the caller.

function passes_first_rep(ctx: UnlockContext): boolean {
  return ctx.sessions.length >= 1;
}

function passes_first_week(ctx: UnlockContext): boolean {
  return ctx.weeks.some((w) => isWeekComplete(ctx.cycleProgress, w));
}

function passes_one_month_in(ctx: UnlockContext): boolean {
  return leadingEdgeWeek(ctx.cycleProgress, ctx.weeks) >= 4;
}

function passes_halfway_there(ctx: UnlockContext): boolean {
  const week6 = ctx.weeks.find((w) => w.cycle_week === 6);
  return week6 ? isWeekComplete(ctx.cycleProgress, week6) : false;
}

function passes_final_push(ctx: UnlockContext): boolean {
  return leadingEdgeWeek(ctx.cycleProgress, ctx.weeks) >= 12;
}

function passes_cycle_crown(ctx: UnlockContext): boolean {
  if (ctx.weeks.length === 0) return false;
  return ctx.weeks.every((w) => isWeekComplete(ctx.cycleProgress, w));
}

// 5+ completions inside any rolling 7-day window within the last 14 days.
// Window slides session-by-session — for each session in scope, count how many
// other in-scope sessions fall within [session.completedAt, session.completedAt + 7d).
function passes_consistency(ctx: UnlockContext): boolean {
  const cutoff = ctx.now.getTime() - 14 * MS_PER_DAY;
  const stamps = ctx.sessions
    .map((s) => new Date(s.completedAt).getTime())
    .filter((t) => !Number.isNaN(t) && t >= cutoff)
    .sort((a, b) => a - b);
  if (stamps.length < 5) return false;
  for (let i = 0; i < stamps.length; i++) {
    const windowEnd = stamps[i] + 7 * MS_PER_DAY;
    let count = 0;
    for (let j = i; j < stamps.length && stamps[j] < windowEnd; j++) count++;
    if (count >= 5) return true;
  }
  return false;
}

// Most recent session is within the last 24h AND the prior session was 7+ days
// before it. Captures the moment the user breaks a long gap.
function passes_comeback(ctx: UnlockContext): boolean {
  const stamps = ctx.sessions
    .map((s) => new Date(s.completedAt).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);
  if (stamps.length < 2) return false;
  const latest = stamps[stamps.length - 1];
  const prior = stamps[stamps.length - 2];
  const sinceLatest = ctx.now.getTime() - latest;
  const gap = latest - prior;
  return sinceLatest <= MS_PER_DAY && gap >= 7 * MS_PER_DAY;
}

function passes_full_send(ctx: UnlockContext): boolean {
  return ctx.sessions.some((s) => s.tier === "full");
}

function passes_half_strike(ctx: UnlockContext): boolean {
  return ctx.sessions.some((s) => s.tier === "half");
}

const PREDICATES: Record<AchievementId, (ctx: UnlockContext) => boolean> = {
  first_rep: passes_first_rep,
  first_week: passes_first_week,
  one_month_in: passes_one_month_in,
  halfway_there: passes_halfway_there,
  final_push: passes_final_push,
  cycle_crown: passes_cycle_crown,
  consistency: passes_consistency,
  comeback: passes_comeback,
  full_send: passes_full_send,
  half_strike: passes_half_strike,
};

export function checkUnlocks(
  currentStore: AchievementsStore,
  context: UnlockContext
): AchievementId[] {
  const out: AchievementId[] = [];
  for (const id of Object.keys(PREDICATES) as AchievementId[]) {
    if (currentStore[id]?.unlocked) continue;
    if (PREDICATES[id](context)) out.push(id);
  }
  return out;
}
