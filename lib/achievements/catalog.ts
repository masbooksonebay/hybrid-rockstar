import { AchievementDefinition, AchievementsStore, AchievementId } from "./types";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first_rep",     name: "First Rep",     description: "Complete your first session",                sfSymbol: "figure.run",               colorHex: "#007AFF" },
  { id: "first_week",    name: "First Week",    description: "Complete every session in any one week",     sfSymbol: "calendar.badge.checkmark", colorHex: "#34C759" },
  { id: "one_month_in",  name: "One Month In",  description: "Reach Week 4 of your cycle",                 sfSymbol: "calendar",                 colorHex: "#5AC8FA" },
  { id: "halfway_there", name: "Halfway There", description: "Complete Week 6 — you are halfway done",     sfSymbol: "flag.checkered",           colorHex: "#FF9500" },
  { id: "final_push",    name: "Final Push",    description: "Reach Week 12 — the home stretch",           sfSymbol: "bolt.fill",                colorHex: "#FFCC00" },
  { id: "cycle_crown",   name: "Cycle Crown",   description: "Complete the entire 12-week cycle",          sfSymbol: "crown.fill",               colorHex: "#AF52DE" },
  { id: "consistency",   name: "Consistency",   description: "Complete 5+ sessions in a 7-day window",     sfSymbol: "flame.fill",               colorHex: "#FF3B30" },
  { id: "comeback",      name: "Comeback",      description: "Resume training after a 7+ day gap",         sfSymbol: "arrow.uturn.up",           colorHex: "#00C7BE" },
  { id: "full_send",     name: "Full Send",     description: "Complete a FullRox-tier session",            sfSymbol: "star.fill",                colorHex: "#5856D6" },
  { id: "half_strike",   name: "Half Strike",   description: "Complete a HalfRox-tier session",            sfSymbol: "hare.fill",                colorHex: "#FF2D55" },
];

export const INITIAL_ACHIEVEMENTS_STORE: AchievementsStore = ACHIEVEMENTS.reduce(
  (acc, a) => ({ ...acc, [a.id]: { unlocked: false, unlockedAt: null } }),
  {} as AchievementsStore
);

export function getAchievementById(id: AchievementId): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
