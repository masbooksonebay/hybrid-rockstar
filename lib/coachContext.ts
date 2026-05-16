import { BLOCK_LABELS, Cycle, getWeekSessions } from "./cycle";
import { CycleProgress, getActiveWeek } from "./cycleProgress";
import { Settings } from "./store";
import { daysUntil } from "./dates";

export interface CoachContext {
  cycleStarted: boolean;
  cycleVersion?: string;
  currentWeek?: number;
  totalWeeks?: number;
  blockLabel?: string;
  blockWeek?: number;
  blockTotalWeeks?: number;
  sessionsCompletedThisWeek?: number;
  sessionsThisWeekTotal?: number;
  sessionsCompletedInCycle?: number;
  raceDateLine?: string;
  format?: string | null;
  tier?: string | null;
  gender?: string | null;
  plannedCycleStartLine?: string;
  goalLine?: string;
  paceLine?: string;
}

export function getCurrentCoachContext(
  progress: CycleProgress,
  settings: Settings,
  cycle: Cycle
): CoachContext {
  const cycleStarted = progress.startDate != null;

  const base: CoachContext = {
    cycleStarted,
    format: settings.format,
    tier: settings.tier,
    gender: settings.gender,
  };

  const raceDateLine = formatRaceDateLine(settings.raceDate);
  if (raceDateLine) base.raceDateLine = raceDateLine;

  base.plannedCycleStartLine = formatPlannedStartLine(settings.cycleStartDate);
  base.goalLine = formatGoalLine(settings.goal);
  base.paceLine = formatPaceLine(settings.paceSecondsPerKm);

  if (!cycleStarted) return base;

  const weekKeyIndex = cycle.weeks.map((w) => ({
    cycle_week: w.cycle_week,
    sessionKeys: getWeekSessions(w).map(({ key }) => key),
  }));
  const currentWeek =
    getActiveWeek(progress, settings.raceDate, weekKeyIndex) ?? 1;
  const week = cycle.weeks.find((w) => w.cycle_week === currentWeek);
  if (!week) return { ...base, cycleVersion: cycle.cycle_version };

  const block = cycle.block_structure.find((b) => b.key === week.block_phase);
  const sessionKeys = getWeekSessions(week).map(({ key }) => key);
  const sessionsCompletedThisWeek = progress.completedSessions.filter(
    (s) => s.weekIndex === currentWeek
  ).length;

  return {
    ...base,
    cycleVersion: cycle.cycle_version,
    currentWeek,
    totalWeeks: cycle.cycle_length_weeks,
    blockLabel: BLOCK_LABELS[week.block_phase],
    blockWeek: week.block_week,
    blockTotalWeeks: block?.weeks.length,
    sessionsCompletedThisWeek: Math.min(sessionsCompletedThisWeek, sessionKeys.length),
    sessionsThisWeekTotal: sessionKeys.length,
    sessionsCompletedInCycle: progress.completedSessions.length,
  };
}

function formatRaceDateLine(raceDateISO: string | null): string | null {
  if (!raceDateISO) return null;
  const days = daysUntil(raceDateISO);
  const d = new Date(raceDateISO);
  const dateLabel = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (days > 0) return `Race in ${days} day${days === 1 ? "" : "s"} (${dateLabel})`;
  if (days === 0) return `Race today (${dateLabel})`;
  return `Race was ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago (${dateLabel})`;
}

function formatPlannedStartLine(iso: string | null): string {
  if (!iso) return "not set yet";
  const d = new Date(iso);
  const dateLabel = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const days = daysUntil(iso);
  if (days > 0) return `${dateLabel} (in ${days} day${days === 1 ? "" : "s"})`;
  if (days === 0) return `${dateLabel} (today)`;
  return `${dateLabel} (${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago)`;
}

function formatGoalLine(goal: Settings["goal"]): string {
  if (goal === "finish_strong") return "finish strong";
  if (goal === "compete_for_time") return "compete for time";
  return "not set";
}

function formatPaceLine(seconds: number | null): string {
  if (seconds == null) return "not provided";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")} per km`;
}
