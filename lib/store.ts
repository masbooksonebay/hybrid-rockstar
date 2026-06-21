import AsyncStorage from "@react-native-async-storage/async-storage";

export type Format = "Individual" | "Doubles" | "Mixed Doubles" | "Relay";
export type Tier = "Open" | "Pro";
export type Goal = "finish_strong" | "compete_for_time";

export interface Settings {
  format: Format | null;
  tier: Tier | null;
  gender: string | null;
  ageGroup: string | null;
  raceDate: string | null;
  notificationsEnabled: boolean;
  notificationsTime: string;
  analyticsEnabled: boolean;
  hasCompletedOnboarding: boolean;
  cycleStartDate: string | null;
  paceSecondsPerKm: number | null;
  goal: Goal | null;
  hasSeenTierExplainer: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  format: null,
  tier: null,
  gender: null,
  ageGroup: null,
  raceDate: null,
  notificationsEnabled: false,
  notificationsTime: "07:00",
  analyticsEnabled: true,
  // Every install (App Store or TestFlight upgrade) onboards exactly once.
  // No grandfathering — existing persisted settings will lack this field and
  // fall back to false via the spread merge in loadSettings().
  hasCompletedOnboarding: false,
  cycleStartDate: null,
  paceSecondsPerKm: null,
  goal: null,
  // Existing users land here as `false` via the spread-DEFAULT_SETTINGS merge
  // in loadSettings() — they see the explainer once on next session-card visit.
  hasSeenTierExplainer: false,
};

const SETTINGS_KEY = "hr_settings";
const LEGACY_KEY = "hr_settings";

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return migrate({ ...DEFAULT_SETTINGS, ...parsed });
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function migrate(s: Settings & { division?: string }): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS, ...s };
  if (out.format == null && typeof s.division === "string") {
    if (s.division === "Open" || s.division === "Pro") {
      out.format = "Individual";
      out.tier = s.division as Tier;
    } else if (s.division === "Doubles" || s.division === "Mixed Doubles" || s.division === "Relay") {
      out.format = s.division as Format;
      out.tier = null;
    }
  }
  return out;
}

export { LEGACY_KEY };
