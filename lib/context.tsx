import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Settings, DEFAULT_SETTINGS, loadSettings, saveSettings } from "./store";
import { darkTheme, Theme } from "../constants/theme";

interface AppCtx {
  settings: Settings;
  theme: Theme;
  updateSettings: (s: Partial<Settings>) => void;
}

const Ctx = createContext<AppCtx>({
  settings: DEFAULT_SETTINGS,
  theme: darkTheme,
  updateSettings: () => {},
});

export function useApp() {
  return useContext(Ctx);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => { setSettings(s); setLoaded(true); });
  }, []);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...s };
      saveSettings(next);
      return next;
    });
  }, []);

  // Dark is the only theme — the app is permanently dark-mode.
  const theme = darkTheme;

  if (!loaded) return null;

  return <Ctx.Provider value={{ settings, theme, updateSettings }}>{children}</Ctx.Provider>;
}
