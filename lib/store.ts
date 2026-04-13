import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Settings {
  darkMode: boolean;
  division: string;
  gender: string;
  units: "imperial" | "metric";
}

export const DEFAULT_SETTINGS: Settings = {
  darkMode: true,
  division: "Open",
  gender: "Male",
  units: "imperial",
};

const SETTINGS_KEY = "hr_settings";

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
