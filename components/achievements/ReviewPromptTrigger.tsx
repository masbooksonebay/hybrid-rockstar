import { useEffect, useRef } from "react";
import * as StoreReview from "expo-store-review";
import { onAchievementsUnlocked } from "../../lib/achievements/events";
import { AchievementId } from "../../lib/achievements/types";

// Milestones high-engagement enough to ask for a review. Apple's StoreKit
// enforces the actual rate limit (max 3 prompts/year per user); we just emit
// the request at moments the user is most likely to feel positive.
const TRIGGER_IDS: ReadonlySet<AchievementId> = new Set<AchievementId>([
  "first_week",
  "one_month_in",
  "halfway_there",
]);

// Toast lifecycle is ~3.2s (3000ms auto-dismiss + 200ms queue gap). Delay the
// review prompt past that so it doesn't stack on top of the still-visible
// unlock toast.
const PROMPT_DELAY_MS = 3500;

export function ReviewPromptTrigger() {
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onAchievementsUnlocked((ids) => {
      const triggerHit = ids.some((id) => TRIGGER_IDS.has(id));
      if (__DEV__) {
        console.log("[ReviewPrompt] unlock batch", { ids, triggerHit });
      }
      if (!triggerHit) return;
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingTimer.current = setTimeout(async () => {
        pendingTimer.current = null;
        try {
          if (await StoreReview.hasAction()) {
            await StoreReview.requestReview();
          }
        } catch (err) {
          console.error("[ReviewPrompt] StoreReview error", err);
        }
      }, PROMPT_DELAY_MS);
    });
    return () => {
      unsubscribe();
      if (pendingTimer.current) {
        clearTimeout(pendingTimer.current);
        pendingTimer.current = null;
      }
    };
  }, []);

  return null;
}
