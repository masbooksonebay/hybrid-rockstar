# Hybrid Rockstar — Claude Code project rules

Read at every session start. These rules have slipped multiple times during
fast iteration; codebase enforcement (check:hyrox script + pre-commit hook) is
the durable fix for the trademark rule. The rest are conventions to keep work
consistent across sessions.

---

## CRITICAL: "Hyrox" is a registered trademark of UpsideDown GmbH

The word **Hyrox** must not appear in any user-facing text. This has shipped
into copy multiple times despite the rule existing in reference docs — that
recurrence is the reason the rule is now enforced at the codebase level.

**BANNED in:**
- JSX text and string literals rendered to UI
- Notification body strings (`expo-notifications` payloads, etc.)
- JSON content fields whose values surface in the UI (session titles, labels,
  taglines, descriptions, etc.)
- Accessibility labels and alt text
- Coach Rob system prompts (the LLM repeats vocabulary from its prompt; a
  "Hyrox" reference there leaks into model output)
- Anywhere else user-facing — when in doubt, replace it

**ALLOWED in:**
- Code comments explaining the trademark constraint itself
- Internal slug/key names that never render to UI (e.g.,
  `session_type === "hyrox_movement_pattern"` as an internal taxonomy key is
  fine — but its *display label* must not contain "Hyrox")
- Git commit messages discussing the rule
- This file

**Approved replacements** — pick whichever flows in context:
- `race-day stations` / `8 stations` / `the race`
- `fitness racing event`
- `race-distance work` / `race-style training`
- `Movement Pattern` (for the session type formerly labeled "Hyrox Movement Pattern")

**Validation:** before any commit, the pre-commit hook runs
`npm run check:hyrox`. If matches are found, fix them before committing — do
not bypass the hook.

---

## UI conventions

- **"Wk" → "Week"** in user-facing text. Internal variable names like
  `weekIndex` are fine; rendered copy should spell out "Week N".
- **Never make non-functional UI tappable.** A `<Pressable>` or
  `<TouchableOpacity>` with no real handler is a bug — it tells the user
  something will happen that doesn't.
- **Default to Apple/iOS conventions** when a UX question arises (modal
  presentation styles, navigation patterns, gesture handling). HR is iOS-first.

## Color hierarchy

- **Block accent colors** (per `app/(tabs)/train/index.tsx`):
  - Foundation: `#34C759` (green)
  - Build: `#00B7FF` (blue)
  - Peak: `#FF9500` (orange)
  - Race Prep: `#FF453A` (red)
- **Cyan** (`theme.accent` = `#00B7FF` in both light and dark themes) is
  reserved for brand CTAs and active states. Don't reuse for incidental
  affordances.
- **Color hierarchy lock — completion semantics**:
  - **Green** = week-level completion (the green check on a completed Week
    tile in the Train screen)
  - **Blue** = session-level completion (the cyan accent on a completed
    session row in the Week detail screen)
  - Don't cross these — the user has learned the two-level grammar.

## Cycle scheduling

- **Race date is informational only.** `leadingEdgeWeek` (in
  `lib/cycleProgress.pure.ts`) is the single source of truth for what week the
  user is on — it's completion-driven, not calendar-driven. `raceDate` was
  removed from `getActiveWeek`'s signature (Wave 3D) precisely because it was
  never consulted there.
- "CURRENT" week is whatever `leadingEdgeWeek` returns, regardless of whether
  a race date is set or not. The Race tab countdown banner is the only place
  `raceDate` materially affects display.
