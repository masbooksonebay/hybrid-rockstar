import { AchievementId } from "./types";

type UnlockListener = (ids: AchievementId[]) => void;

const listeners = new Set<UnlockListener>();

export function emitAchievementsUnlocked(ids: AchievementId[]): void {
  if (ids.length === 0) return;
  for (const l of listeners) l(ids);
}

export function onAchievementsUnlocked(listener: UnlockListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function __resetListenersForTests(): void {
  listeners.clear();
}
