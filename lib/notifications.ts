import * as Notifications from "expo-notifications";
import { Settings } from "./store";
import type { CycleProgress } from "./cycleProgress";
import { getActiveWeek } from "./cycleProgress";
import { BLOCK_LABELS, getCycle, getWeekSessions } from "./cycle";

interface NotificationContent {
  title: string;
  body: string;
}

// Pure function — caller passes settings + cycleProgress so this module has no
// hard runtime dependency on the loaders (avoids circular import friction with
// cycleProgress.ts, which calls back into here on session completion).
export function buildNotificationBody(
  settings: Settings,
  progress: CycleProgress
): NotificationContent {
  const title = "Hybrid Rockstar";

  if (!progress.startDate) {
    return { title, body: "Tap to start your cycle" };
  }

  const cycle = getCycle();
  const weekKeyIndex = cycle.weeks.map((w) => ({
    cycle_week: w.cycle_week,
    sessionKeys: getWeekSessions(w).map(({ key }) => key),
  }));
  const currentWeek = getActiveWeek(progress, settings.raceDate, weekKeyIndex);
  if (currentWeek == null) {
    // getActiveWeek returns null only when startDate is missing (handled above)
    // or unparseable — treat as pre-cycle.
    return { title, body: "Tap to start your cycle" };
  }

  const week = cycle.weeks.find((w) => w.cycle_week === currentWeek);
  if (!week) {
    // Cycle data missing the week (e.g. cycle complete past wk12). Generic
    // copy rather than block-specific.
    return { title, body: "Time to train" };
  }

  const sessionKeys = getWeekSessions(week).map(({ key }) => key);
  const totalSessions = sessionKeys.length;
  const completedThisWeek = progress.completedSessions.filter(
    (s) => s.weekIndex === currentWeek
  ).length;
  const completed = Math.min(completedThisWeek, totalSessions);
  const remaining = totalSessions - completed;

  if (remaining <= 0) {
    return { title, body: "All sessions complete this week. Great work." };
  }

  const blockLabel = BLOCK_LABELS[week.block_phase] ?? "";
  const sessionWord = remaining === 1 ? "session" : "sessions";
  return {
    title,
    body: `${blockLabel} Week ${currentWeek} · ${remaining} ${sessionWord} remaining`,
  };
}

// settings.notificationsTime is "HH:MM" (24h, zero-padded). Parses defensively
// — anything malformed falls back to 07:00.
export function parseNotificationTime(s: string | null | undefined): {
  hour: number;
  minute: number;
} {
  const fallback = { hour: 7, minute: 0 };
  if (!s) return fallback;
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return fallback;
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return fallback;
  }
  return { hour, minute };
}

// Cancel any pending scheduled notification and (if enabled) schedule a fresh
// one with up-to-date cycle copy. Called on every store/progress mutation that
// could shift the message — toggle, time change, session complete, app open.
export async function rescheduleNotifications(
  settings: Settings,
  progress: CycleProgress
): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Cancel failures shouldn't block scheduling — proceed.
  }

  if (!settings.notificationsEnabled) return;

  const { hour, minute } = parseNotificationTime(settings.notificationsTime);
  const content = buildNotificationBody(settings, progress);

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {
    // Permission revoked between toggle and schedule, or other transient. Stay
    // silent — next hook will retry.
  }
}
