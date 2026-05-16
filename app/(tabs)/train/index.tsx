import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../../lib/context";
import {
  BLOCK_LABELS,
  BlockPhase,
  CycleWeek,
  getCycle,
  getWeekSessions,
} from "../../../lib/cycle";
import {
  CycleProgress,
  getActiveWeek,
  getNextUncompletedSession,
  getWeekCompletion,
  startCycle,
  useCycleProgress,
} from "../../../lib/cycleProgress";
import { daysUntil } from "../../../lib/dates";
import { spacing, borderRadius } from "../../../constants/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COMPLETE_GREEN = "#34C759";

// Per-block accent colors. /train is the only consumer (the old
// BlockFlowIndicator that also used these was removed in Wave 3D revisions),
// so the map lives here rather than in a shared module.
const BLOCK_ACCENTS: Record<BlockPhase, string> = {
  foundation: "#34C759",
  build: "#00B7FF",
  peak: "#FF9500",
  race_prep: "#FF453A",
};

// Derive day number from JSON session key. Keys are "d1".."d6" by convention.
// Falls back to the position-in-week index if the key isn't day-prefixed (it
// always is today, but the fallback keeps render safe if data ever shifts).
function dayNumberFromKey(key: string, fallbackIndex: number): number {
  const m = /^d(\d+)$/.exec(key);
  return m ? parseInt(m[1], 10) : fallbackIndex + 1;
}

export default function TrainScreen() {
  const { theme, settings } = useApp();
  const router = useRouter();
  const cycle = getCycle();
  const progress = useCycleProgress();
  const cycleStarted = progress.startDate != null;

  // All hooks run unconditionally, before any early return — the pre-start
  // branch below must not change the hook count between renders. On a cold
  // launch, useCycleProgress() returns empty on the first render and the real
  // value after the async load resolves; gating hooks behind cycleStarted
  // would flip the hook count and crash ("rendered more hooks…").
  const weekKeyIndex = useMemo(
    () =>
      cycle.weeks.map((w) => ({
        cycle_week: w.cycle_week,
        sessionKeys: getWeekSessions(w).map(({ key }) => key),
      })),
    [cycle]
  );

  // Adaptive progression: race-date set + in the future → calendar week;
  // otherwise → first week with any uncompleted session. Falls back to 1 for
  // the pre-start render pass (cycleStarted=false branches out below anyway).
  const currentWeek =
    getActiveWeek(progress, settings.raceDate, weekKeyIndex) ?? 1;
  const currentWeekData = cycle.weeks.find((w) => w.cycle_week === currentWeek);
  const currentBlockPhase: BlockPhase = currentWeekData?.block_phase ?? "foundation";

  const upNext = useMemo(
    () => getNextUncompletedSession(progress, weekKeyIndex, currentWeek),
    [progress, weekKeyIndex, currentWeek]
  );

  // Under the leading-edge model, upNext is null iff currentWeek=12 and
  // every session in Week 12 is logged complete. Orphan-incomplete sessions
  // in past weeks are excluded by getNextUncompletedSession's scoping, so this
  // derivation matches the user's perceived "end of cycle" state.
  const cycleComplete = upNext === null;

  // Resolve Up Next to a full session record (week + key + session payload)
  // so the card can render title + route correctly. Null when complete or no
  // uncompleted sessions remain.
  const upNextSession = useMemo(() => {
    if (!upNext) return null;
    const w = cycle.weeks.find((wk) => wk.cycle_week === upNext.weekIndex);
    if (!w) return null;
    const sessions = getWeekSessions(w);
    const idx = sessions.findIndex(({ key }) => key === upNext.sessionKey);
    if (idx < 0) return null;
    return {
      week: w,
      sessionKey: upNext.sessionKey,
      session: sessions[idx].session,
      dayNumber: dayNumberFromKey(upNext.sessionKey, idx),
    };
  }, [upNext, cycle]);

  // Group cycle weeks under their parent blocks for the section render.
  const grouped = useMemo(() => {
    return cycle.block_structure.map((block) => ({
      key: block.key as BlockPhase,
      label: block.label,
      weekNumbers: block.weeks,
      weeks: cycle.weeks.filter((w) => w.block_phase === block.key),
    }));
  }, [cycle]);

  // Pre-start view: keep the Start CTA per spec. Returned after all hooks so
  // the hook count stays stable across the cold-launch empty→loaded transition.
  if (!cycleStarted) {
    const raceDays = settings.raceDate ? daysUntil(settings.raceDate) : null;
    return (
      <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.preStartScroll}>
          <Text style={[styles.cycleHeadline, { color: theme.text }]}>
            12 weeks · 4 blocks
          </Text>
          {raceDays !== null && raceDays >= 0 && (
            <Text style={[styles.countdown, { color: theme.accent }]}>
              {raceDays === 0 ? "Race day" : `${raceDays} day${raceDays === 1 ? "" : "s"} to race`}
            </Text>
          )}
          <Pressable
            onPress={() => startCycle()}
            style={({ pressed }) => [
              styles.startCta,
              { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="play-circle" size={26} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.startCtaTitle}>Start Cycle</Text>
              <Text style={styles.startCtaBody}>
                Tap to begin Week 1 of HR Cycle 1 today. 12 weeks, ~5–6 sessions per week.
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentBlockLabel = BLOCK_LABELS[currentBlockPhase];
  const raceDays = settings.raceDate ? daysUntil(settings.raceDate) : null;

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CycleStatusCard
          currentWeek={currentWeek}
          currentBlockPhase={currentBlockPhase}
          currentBlockLabel={currentBlockLabel}
          raceDays={raceDays}
          weeks={cycle.weeks}
        />
        {cycleComplete ? (
          <View
            style={[
              styles.upNextCard,
              { backgroundColor: theme.card, borderColor: COMPLETE_GREEN },
            ]}
          >
            <Ionicons name="trophy" size={22} color={COMPLETE_GREEN} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.upNextEyebrow, { color: COMPLETE_GREEN }]}>
                CYCLE COMPLETE
              </Text>
              <Text style={[styles.upNextTitle, { color: theme.text }]}>
                All {cycle.cycle_length_weeks} weeks done. Nice work.
              </Text>
            </View>
          </View>
        ) : upNextSession ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/train/cycle/session",
                params: {
                  w: String(upNextSession.week.cycle_week),
                  s: upNextSession.sessionKey,
                },
              })
            }
            style={({ pressed }) => [
              styles.upNextCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.upNextEyebrow, { color: theme.accent }]}>
                UP NEXT · WEEK {upNextSession.week.cycle_week} · DAY {upNextSession.dayNumber}
              </Text>
              <Text style={[styles.upNextTitle, { color: theme.text }]} numberOfLines={2}>
                {upNextSession.session.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}

        {grouped.map((block) => (
          <BlockSection
            key={block.key}
            blockKey={block.key}
            label={block.label}
            weekNumbers={block.weekNumbers}
            weeks={block.weeks}
            isCurrent={block.key === currentBlockPhase}
            currentWeek={currentWeek}
            progress={progress}
            onWeekTap={(w) =>
              router.push({ pathname: "/train/cycle/week", params: { w: String(w) } })
            }
          />
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface CycleStatusCardProps {
  currentWeek: number;
  currentBlockPhase: BlockPhase;
  currentBlockLabel: string;
  raceDays: number | null;
  weeks: CycleWeek[];
}

function CycleStatusCard({
  currentWeek,
  currentBlockPhase,
  currentBlockLabel,
  raceDays,
  weeks,
}: CycleStatusCardProps) {
  const { theme } = useApp();
  const accent = BLOCK_ACCENTS[currentBlockPhase];

  // Map every cycle week → its block accent so each dot picks up its phase
  // color. Falls back to current accent if a week is missing (shouldn't happen
  // with the bundled JSON, but keeps render safe).
  const dotAccents = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const wkNum = i + 1;
      const wk = weeks.find((w) => w.cycle_week === wkNum);
      const phase = wk?.block_phase ?? currentBlockPhase;
      return BLOCK_ACCENTS[phase];
    });
  }, [weeks, currentBlockPhase]);

  const showRaceRow = raceDays !== null && raceDays >= 0;
  const raceText =
    raceDays === 0
      ? "Race Day today"
      : `Race Day in ${raceDays} day${raceDays === 1 ? "" : "s"}`;

  return (
    <View
      style={[
        styles.statusCard,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={styles.statusRow1}>
        <Text style={[styles.statusPhase, { color: accent }]}>{currentBlockLabel}</Text>
        <Text style={[styles.statusWeek, { color: theme.textSecondary }]}>
          Week {currentWeek} of 12
        </Text>
      </View>
      <View style={styles.statusDots}>
        {dotAccents.map((dotAccent, i) => {
          const wkNum = i + 1;
          const isCurrent = wkNum === currentWeek;
          const isPast = wkNum < currentWeek;
          return (
            <View
              key={wkNum}
              style={[
                styles.statusDot,
                isCurrent && styles.statusDotCurrent,
                isPast
                  ? { backgroundColor: dotAccent, opacity: 0.6 }
                  : isCurrent
                  ? { backgroundColor: dotAccent, opacity: 1 }
                  : {
                      backgroundColor: "transparent",
                      borderColor: dotAccent,
                      borderWidth: 1.5,
                      opacity: 0.55,
                    },
              ]}
            />
          );
        })}
      </View>
      {showRaceRow && (
        <Text style={[styles.statusRace, { color: theme.textSecondary }]}>
          {raceText}
        </Text>
      )}
    </View>
  );
}

interface BlockSectionProps {
  blockKey: BlockPhase;
  label: string;
  weekNumbers: number[];
  weeks: CycleWeek[];
  isCurrent: boolean;
  currentWeek: number;
  progress: CycleProgress;
  onWeekTap: (cycleWeek: number) => void;
}

function BlockSection({
  blockKey,
  label,
  weekNumbers,
  weeks,
  isCurrent,
  currentWeek,
  progress,
  onWeekTap,
}: BlockSectionProps) {
  const { theme } = useApp();
  // All blocks share the same chevron affordance; only the default differs —
  // current block expanded, others collapsed. Local state resets on remount.
  const [expanded, setExpanded] = useState<boolean>(isCurrent);
  // Belt-and-braces auto-expand: if this block becomes the current one (cold
  // launch async-load race, or week tick advancing into a new phase), force it
  // open. Doesn't fire when isCurrent is false, so the user's manual collapse
  // of the current block during a session is preserved.
  useEffect(() => {
    if (isCurrent) setExpanded(true);
  }, [isCurrent]);

  const accent = BLOCK_ACCENTS[blockKey];
  const firstWk = weekNumbers[0];
  const lastWk = weekNumbers[weekNumbers.length - 1];

  // Aggregate completion across the block — small "n/m" badge on collapsed
  // sections gives a glanceable progress signal without expanding.
  const blockCompletion = useMemo(() => {
    let completed = 0;
    let total = 0;
    for (const w of weeks) {
      const wkTotal = w.is_divergent
        ? w.variants?.continuous.session_count ?? 0
        : w.session_count ?? 0;
      total += wkTotal;
      const wc = getWeekCompletion(progress, w.cycle_week, wkTotal);
      completed += wc.completed;
    }
    return { completed, total };
  }, [weeks, progress]);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={styles.blockSection}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.blockHeaderRow,
          { opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-forward"}
          size={14}
          color={theme.textSecondary}
          style={{ width: 14 }}
        />
        <View style={[styles.blockDot, { backgroundColor: accent }]} />
        <Text style={[styles.blockHeader, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.blockHeaderMeta, { color: theme.textSecondary }]}>
          Week {firstWk}–{lastWk}
        </Text>
        {!isCurrent && blockCompletion.completed > 0 && (
          <Text style={[styles.blockCompletion, { color: accent }]}>
            {blockCompletion.completed}/{blockCompletion.total}
          </Text>
        )}
      </Pressable>
      {expanded &&
        weeks.map((w) => (
          <WeekTile
            key={w.cycle_week}
            week={w}
            currentWeek={currentWeek}
            progress={progress}
            onPress={() => onWeekTap(w.cycle_week)}
          />
        ))}
    </View>
  );
}

interface WeekTileProps {
  week: CycleWeek;
  currentWeek: number;
  progress: CycleProgress;
  onPress: () => void;
}

function WeekTile({ week, currentWeek, progress, onPress }: WeekTileProps) {
  const { theme } = useApp();
  const accent = BLOCK_ACCENTS[week.block_phase];

  const totalSessions = week.is_divergent
    ? week.variants?.continuous.session_count ?? 0
    : week.session_count ?? 0;
  const completion = getWeekCompletion(progress, week.cycle_week, totalSessions);
  // Three states derive from comparison to the user's leading edge. CURRENT
  // takes precedence by construction (a week can be exactly one of these).
  const isCurrent = week.cycle_week === currentWeek;
  const isPast = week.cycle_week < currentWeek;

  const sessionCountText = week.is_divergent
    ? `${week.variants?.racer.session_count}/${week.variants?.continuous.session_count} (R/C)`
    : `${completion.completed}/${completion.total}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.weekTile,
        {
          backgroundColor: theme.card,
          borderColor: isCurrent ? accent : theme.border,
          borderWidth: isCurrent ? 2 : 1,
          opacity: pressed ? 0.85 : isPast ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.tileHeader}>
        <Text style={[styles.weekHeading, { color: theme.text }]}>
          Week {week.cycle_week} · {week.title}
        </Text>
        {isCurrent ? (
          <View style={[styles.currentChip, { backgroundColor: accent }]}>
            <Text style={styles.currentChipText}>CURRENT</Text>
          </View>
        ) : isPast ? (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={COMPLETE_GREEN}
            style={styles.completeBadge}
          />
        ) : null}
      </View>
      <Text style={[styles.weekSummary, { color: theme.textSecondary }]}>
        {week.summary}
      </Text>
      <View style={styles.tileFooter}>
        <View style={styles.tileMetaRow}>
          <Text style={[styles.tileMeta, { color: theme.textSecondary }]}>
            {sessionCountText} sessions
          </Text>
        </View>
        {week.notes.collision_warning && (
          <View style={styles.tileMetaRow}>
            <Ionicons name="warning-outline" size={13} color="#FF9500" />
            <Text style={[styles.tileMeta, { color: "#FF9500" }]}>
              Collision warning
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingTop: spacing.sm },
  preStartScroll: { padding: spacing.md, paddingTop: spacing.lg, alignItems: "stretch" },
  cycleHeadline: { fontSize: 22, fontWeight: "800", marginBottom: spacing.sm },
  countdown: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.lg,
  },
  startCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  startCtaTitle: { color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 2 },
  startCtaBody: { color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 17 },
  statusCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusRow1: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.sm + 2,
  },
  statusPhase: { fontSize: 21, fontWeight: "700" },
  statusWeek: { fontSize: 13, fontWeight: "500" },
  statusDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  statusDotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusRace: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: spacing.sm,
  },
  upNextCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    padding: spacing.md - 2,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
  },
  upNextEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  upNextTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  blockSection: { marginBottom: spacing.md },
  blockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  blockDot: { width: 10, height: 10, borderRadius: 5 },
  blockHeader: { fontSize: 14, fontWeight: "800", letterSpacing: 0.5, flex: 1 },
  blockHeaderMeta: { fontSize: 11, fontWeight: "600" },
  blockCompletion: { fontSize: 11, fontWeight: "700", marginLeft: 6 },
  weekTile: {
    borderRadius: borderRadius.md,
    padding: spacing.md - 2,
    marginBottom: spacing.sm + 2,
  },
  tileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  weekHeading: { fontSize: 15, fontWeight: "700", flex: 1, lineHeight: 20 },
  currentChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  currentChipText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  completeBadge: { marginTop: 1 },
  weekSummary: { fontSize: 12, lineHeight: 17, marginBottom: spacing.sm },
  tileFooter: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  tileMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  tileMeta: { fontSize: 11, fontWeight: "600" },
});
