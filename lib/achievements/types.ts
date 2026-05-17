export type AchievementId =
  | "first_rep"
  | "first_week"
  | "one_month_in"
  | "halfway_there"
  | "final_push"
  | "cycle_crown"
  | "consistency"
  | "comeback"
  | "full_send"
  | "half_send";

export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  sfSymbol: string;
  colorHex: string;
}

export interface AchievementState {
  unlocked: boolean;
  unlockedAt: string | null;
}

export type AchievementsStore = Record<AchievementId, AchievementState>;
