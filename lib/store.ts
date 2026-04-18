import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";
export type Format = "Individual" | "Doubles" | "Mixed Doubles" | "Relay";
export type Tier = "Open" | "Pro";

export interface Settings {
  themeMode: ThemeMode;
  format: Format | null;
  tier: Tier | null;
  gender: string | null;
  ageGroup: string | null;
  raceDate: string | null;
  units: "imperial" | "metric";
  notificationsEnabled: boolean;
  notificationsTime: string;
  analyticsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  themeMode: "system",
  format: null,
  tier: null,
  gender: null,
  ageGroup: null,
  raceDate: null,
  units: "imperial",
  notificationsEnabled: false,
  notificationsTime: "07:00",
  analyticsEnabled: true,
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

function migrate(s: Settings & { darkMode?: boolean; division?: string }): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS, ...s };
  if (out.themeMode == null && typeof s.darkMode === "boolean") {
    out.themeMode = s.darkMode ? "dark" : "light";
  }
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
