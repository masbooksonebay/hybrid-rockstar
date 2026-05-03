import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../../../lib/context";
import {
  BLOCK_LABELS,
  BlockPhase,
  CycleWeek,
  blockMiniSummary,
  getCycle,
  getWeekSessions,
} from "../../../../lib/cycle";
import {
  CycleProgress,
  getCurrentWeek,
  getNextUncompletedSession,
  getWeekCompletion,
  isCycleComplete,
  startCycle,
  useCycleProgress,
} from "../../../../lib/cycleProgress";
import { spacing, borderRadius } from "../../../../constants/theme";

const COMPLETE_GREEN = "#34C759";

const BLOCK_ACCENTS: Record<BlockPhase, string> = {
  foundation: "#34C759",
  build: "#00B7FF",
  peak: "#FF9500",
  race_prep: "#FF453A",
};

export default function CycleOverviewScreen() {
  const { theme } = useApp();
  const router = useRouter();
  const cycle = getCycle();
  const progress = useCycleProgress();
  const currentWeek = getCurrentWeek(progress.startDate);
  const cycleStarted = progress.startDate != null;

  const grouped = useMemo(() => {
    return cycle.block_structure.map((block) => ({
      key: block.key,
      label: block.label,
      weekNumbers: block.weeks,
      weeks: cycle.weeks.filter((w) => w.block_phase === block.key),
    }));
  }, [cycle]);

  const currentBlockLabel = useMemo(() => {
    if (currentWeek == null) return null;
    const w = cycle.weeks.find((wk) => wk.cycle_week === currentWeek);
    return w ? BLOCK_LABELS[w.block_phase] : null;
  }, [cycle, currentWeek]);

  const weekKeyIndex = useMemo(
    () =>
      cycle.weeks.map((w) => ({
        cycle_week: w.cycle_week,
        sessionKeys: getWeekSessions(w).map(({ key }) => key),
      })),
    [cycle]
  );

  const upNext = useMemo(
    () =>
      cycleStarted
        ? getNextUncompletedSession(progress, weekKeyIndex, currentWeek ?? 1)
        : null,
    [cycleStarted, progress, weekKeyIndex, currentWeek]
  );

  const cycleComplete = useMemo(
    () => cycleStarted && isCycleComplete(progress, weekKeyIndex),
    [cycleStarted, progress, weekKeyIndex]
  );

  const upNextSession = useMemo(() => {
    if (!upNext) return null;
    const w = cycle.weeks.find((wk) => wk.cycle_week === upNext.weekIndex);
    if (!w) return null;
    const sessions = getWeekSessions(w);
    const found = sessions.find(({ key }) => key === upNext.sessionKey);
    if (!found) return null;
    return { week: w, sessionKey: upNext.sessionKey, session: found.session };
  }, [upNext, cycle]);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.chev}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.text }]}>12-week Cycle</Text>
        <View style={styles.chev} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.intro}>
          <Text style={[styles.cycleEyebrow, { color: theme.accent }]}>
            HR CYCLE 1 · {cycle.cycle_version.toUpperCase()}
          </Text>
          {cycleStarted && currentWeek != null ? (
            <Text style={[styles.cycleTitle, { color: theme.text }]}>
              Week {currentWeek} of {cycle.cycle_length_weeks}
              {currentBlockLabel ? ` · ${currentBlockLabel}` : ""}
            </Text>
          ) : (
            <Text style={[styles.cycleTitle, { color: theme.text }]}>
              12 weeks · 4 blocks
            </Text>
          )}
          <Text style={[styles.cycleSummary, { color: theme.textSecondary }]}>
            Foundation → Build → Peak → Race Prep. Tap a week to view sessions.
          </Text>
        </View>

        {!cycleStarted && (
          <Pressable
            onPress={() => startCycle()}
            style={({ pressed }) => [
              styles.startCta,
              { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="play-circle" size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.startCtaTitle}>Start Cycle</Text>
              <Text style={styles.startCtaBody}>
                Tap to begin Wk1 today. Tracks your week-by-week progress.
              </Text>
            </View>
          </Pressable>
        )}

        {cycleStarted && cycleComplete && (
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
        )}

        {cycleStarted && !cycleComplete && upNextSession && (
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
                UP NEXT · WK{upNextSession.week.cycle_week}{" "}
                {upNextDayLabel(upNextSession.week, upNextSession.sessionKey)}
              </Text>
              <Text style={[styles.upNextTitle, { color: theme.text }]} numberOfLines={2}>
                {upNextSession.session.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </Pressable>
        )}

        {grouped.map((block) => (
          <View key={block.key} style={styles.blockSection}>
            <View style={styles.blockHeaderRow}>
              <View
                style={[
                  styles.blockDot,
                  { backgroundColor: BLOCK_ACCENTS[block.key] },
                ]}
              />
              <Text style={[styles.blockHeader, { color: theme.text }]}>{block.label}</Text>
              <Text style={[styles.blockHeaderMeta, { color: theme.textSecondary }]}>
                Wk {block.weekNumbers[0]}–{block.weekNumbers[block.weekNumbers.length - 1]}
              </Text>
            </View>
            {block.weeks.map((w) => (
              <WeekTile
                key={w.cycle_week}
                week={w}
                isCurrent={currentWeek != null && w.cycle_week === currentWeek}
                progress={progress}
                cycleStarted={cycleStarted}
                onPress={() =>
                  router.push({
                    pathname: "/train/cycle/week",
                    params: { w: String(w.cycle_week) },
                  })
                }
              />
            ))}
          </View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function WeekTile({
  week,
  isCurrent,
  progress,
  cycleStarted,
  onPress,
}: {
  week: CycleWeek;
  isCurrent: boolean;
  progress: CycleProgress;
  cycleStarted: boolean;
  onPress: () => void;
}) {
  const { theme } = useApp();
  const accent = BLOCK_ACCENTS[week.block_phase];

  const totalSessions = week.is_divergent
    ? week.variants?.continuous.session_count ?? 0
    : week.session_count ?? 0;
  const completion = getWeekCompletion(progress, week.cycle_week, totalSessions);

  let countColor = theme.textSecondary;
  if (cycleStarted && completion.completed > 0) {
    countColor =
      completion.completed >= completion.total ? COMPLETE_GREEN : theme.accent;
  }

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
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.tileHeader}>
        <Text style={[styles.weekNumber, { color: theme.text }]}>Wk {week.cycle_week}</Text>
        {isCurrent && (
          <View style={[styles.currentChip, { backgroundColor: accent }]}>
            <Text style={styles.currentChipText}>CURRENT</Text>
          </View>
        )}
        <View style={[styles.phaseChip, { borderColor: accent }]}>
          <Text style={[styles.phaseChipText, { color: accent }]}>
            {BLOCK_LABELS[week.block_phase].toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[styles.weekTitle, { color: theme.text }]}>{week.title}</Text>
      <Text style={[styles.weekSummary, { color: theme.textSecondary }]} numberOfLines={2}>
        {blockMiniSummary(week)}
      </Text>
      <View style={styles.tileFooter}>
        <View style={styles.tileMetaRow}>
          <Ionicons name="list-outline" size={13} color={countColor} />
          <Text style={[styles.tileMeta, { color: countColor }]}>
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

function upNextDayLabel(week: CycleWeek, sessionKey: string): string {
  const sessions = getWeekSessions(week);
  const idx = sessions.findIndex(({ key }) => key === sessionKey);
  if (idx < 0) return "";
  return `· D${idx + 1}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chev: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "700" },
  scroll: { padding: spacing.md, paddingTop: 0 },
  intro: { marginBottom: spacing.lg },
  cycleEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  cycleTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  cycleSummary: { fontSize: 13, lineHeight: 18 },
  startCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  startCtaTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 2 },
  startCtaBody: { color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 17 },
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
  blockSection: { marginBottom: spacing.lg },
  blockHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  blockDot: { width: 10, height: 10, borderRadius: 5 },
  blockHeader: { fontSize: 14, fontWeight: "800", letterSpacing: 0.5, flex: 1 },
  blockHeaderMeta: { fontSize: 11, fontWeight: "600" },
  weekTile: {
    borderRadius: borderRadius.md,
    padding: spacing.md - 2,
    marginBottom: spacing.sm + 2,
  },
  tileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  weekNumber: { fontSize: 14, fontWeight: "800", flex: 1 },
  currentChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentChipText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  phaseChip: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  phaseChipText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  weekTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  weekSummary: { fontSize: 12, lineHeight: 17, marginBottom: spacing.sm },
  tileFooter: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  tileMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  tileMeta: { fontSize: 11, fontWeight: "600" },
});
