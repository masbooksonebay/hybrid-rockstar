import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../../../lib/context";

// Android needs LayoutAnimation explicitly enabled. No-op on iOS.
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TIER_EXPLAINER_BODY =
  "Both tiers cover all 8 Hyrox stations across the cycle. FullRox sessions run about twice as long as HalfRox — pick based on how much time you have per session.";

const RPE_BODY =
  "Rate of Perceived Exertion. A 1-10 self-rated effort scale used throughout strength and conditioning programming. RPE 6 = moderate, could keep going indefinitely. RPE 7 = hard, 3-4 reps in reserve on lifts. RPE 8 = very hard, 1-2 reps in reserve. RPE 9 = barely complete, 0-1 reps left. RPE 10 = maximum, no reps left.";
import {
  CycleSession,
  Step,
  Wk12Variant,
  getCycleWeek,
  getSession,
  getStations,
  getWeekSessions,
  sessionUsesStationWeights,
} from "../../../../lib/cycle";
import {
  isSessionComplete,
  markSessionComplete,
  markSessionIncomplete,
  useCycleProgress,
} from "../../../../lib/cycleProgress";
import { spacing, borderRadius } from "../../../../constants/theme";
import { SegmentButton } from "../../../../components/train/SegmentButton";
import { CollisionCallout } from "../../../../components/train/CollisionCallout";

function dayNumberFromKey(key: string, fallbackIndex: number): number {
  const m = /^d(\d+)$/.exec(key);
  return m ? parseInt(m[1], 10) : fallbackIndex + 1;
}

type RoxVersion = "full" | "half";

export default function CycleSessionScreen() {
  const { theme, settings, updateSettings } = useApp();
  const router = useRouter();
  const [explainerModalOpen, setExplainerModalOpen] = useState(false);

  const onDismissExplainer = () => {
    // Animate the conditional swap from card → icon. `configureNext` arms a
    // one-shot animation for the next layout pass triggered by the state
    // change below.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updateSettings({ hasSeenTierExplainer: true });
  };
  const params = useLocalSearchParams<{ w?: string; s?: string; variant?: string }>();
  const weekNumber = parseInt(params.w ?? "1", 10);
  const sessionKey = params.s ?? "";
  const variant = (params.variant as Wk12Variant | undefined) ?? "continuous";

  const week = getCycleWeek(weekNumber);
  const session: CycleSession | undefined = week
    ? getSession(week, sessionKey, variant)
    : undefined;

  const [version, setVersion] = useState<RoxVersion>("full");

  if (!week || !session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.notFound}>
          <Text style={{ color: theme.text }}>Session not found.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.accent }}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const versionData = version === "full" ? session.full_rox : session.half_rox;
  // Derive day number by locating this session in the week's ordered list —
  // covers both static keys ("d1") and any future divergent-variant shape.
  const weekSessions = getWeekSessions(week, week.is_divergent ? variant : undefined);
  const sessionIdx = weekSessions.findIndex(({ key }) => key === sessionKey);
  const dayNumber = dayNumberFromKey(sessionKey, sessionIdx >= 0 ? sessionIdx : 0);
  // Eyebrow is just "DAY N" here — the h1 directly below carries the session
  // name, so the "· TYPE" suffix (kept on the week list) would be redundant.
  const headerEyebrow = `DAY ${dayNumber}`;
  const showStations = sessionUsesStationWeights(session);
  const progress = useCycleProgress();
  const completed = isSessionComplete(progress, week.cycle_week, sessionKey);

  const onToggleComplete = () => {
    if (completed) {
      markSessionIncomplete(week.cycle_week, sessionKey);
    } else {
      markSessionComplete(week.cycle_week, sessionKey, version === "full" ? "full" : "half");
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header title intentionally blank — the page h1 below carries the
          session name. Back chevron stays. */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.chev}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={styles.chev} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.context, { color: theme.accent }]}>{headerEyebrow}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{session.title}</Text>
        <Text style={[styles.stimulus, { color: theme.textSecondary }]}>{session.stimulus}</Text>

        {session.optional && (
          <View style={[styles.optionalBanner, { backgroundColor: theme.accent + "15", borderColor: theme.accent + "40" }]}>
            <Ionicons name="information-circle-outline" size={16} color={theme.accent} />
            <Text style={[styles.optionalText, { color: theme.text }]}>
              Optional session{session.replaces ? ` — replaces ${session.replaces.replace(/_/g, " ")}, doesn't add to it` : ""}.
            </Text>
          </View>
        )}

        <View style={[styles.segment, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <SegmentButton
            label={`FullRox ~${session.full_rox.estimated_duration_minutes}m`}
            active={version === "full"}
            onPress={() => setVersion("full")}
          />
          <SegmentButton
            label={`HalfRox ~${session.half_rox.estimated_duration_minutes}m`}
            active={version === "half"}
            onPress={() => setVersion("half")}
          />
        </View>

        {settings.hasSeenTierExplainer ? (
          <Pressable
            onPress={() => setExplainerModalOpen(true)}
            hitSlop={8}
            style={styles.explainerInfoRow}
          >
            <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.explainerInfoLabel, { color: theme.textSecondary }]}>
              FullRox vs HalfRox
            </Text>
          </Pressable>
        ) : (
          <View
            style={[
              styles.explainerCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Pressable
              onPress={onDismissExplainer}
              hitSlop={12}
              style={styles.explainerClose}
              accessibilityLabel="Dismiss explainer"
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
            <Text style={[styles.explainerBody, { color: theme.textSecondary }]}>
              {TIER_EXPLAINER_BODY}
            </Text>
          </View>
        )}

        {session.notes.collision_warning && (
          <CollisionCallout text={session.notes.collision_warning} />
        )}

        <View style={styles.stepsBlock}>
          {versionData.structure.map((step, i) => (
            <StepRow key={`${version}-${i}`} step={step} />
          ))}
        </View>

        {/* Notes accordion always renders because the "What is RPE?" reference
            sub-section is included on every session. Default closed. */}
        <NotesDisclosure title="Notes">
          {session.notes.about && (
            <NoteSubsection label="About" body={session.notes.about} />
          )}
          {session.notes.week_context && (
            <NoteSubsection label="Week context" body={session.notes.week_context} />
          )}
          {session.notes.block_context && (
            <NoteSubsection label="Block context" body={session.notes.block_context} />
          )}
          {session.notes.scaling?.beginner && (
            <NoteSubsection label="Scaling — Beginner" body={session.notes.scaling.beginner} />
          )}
          {session.notes.scaling?.advanced && (
            <NoteSubsection label="Scaling — Advanced" body={session.notes.scaling.advanced} />
          )}
          {session.notes.substitutions && (
            <NoteSubsection label="Substitutions" body={session.notes.substitutions} />
          )}
          <NoteSubsection label="What is RPE?" body={RPE_BODY} />
        </NotesDisclosure>

        {showStations && <StationWeightsDisclosure />}

        <View style={styles.completeBlock}>
          <Pressable
            onPress={onToggleComplete}
            style={({ pressed }) => [
              styles.completeBtn,
              {
                backgroundColor: completed ? "transparent" : theme.accent,
                borderColor: theme.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name={completed ? "checkmark-circle" : "checkmark-circle-outline"}
              size={20}
              color={completed ? theme.accent : "#fff"}
            />
            <Text
              style={[
                styles.completeBtnText,
                { color: completed ? theme.accent : "#fff" },
              ]}
            >
              {completed ? "Completed" : "Mark complete"}
            </Text>
          </Pressable>
          {completed && (
            <Text style={[styles.undoHint, { color: theme.textSecondary }]}>
              Tap to mark incomplete
            </Text>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Info modal — opened from the info-icon row after explainer dismissal. */}
      <Modal
        visible={explainerModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setExplainerModalOpen(false)}
      >
        <Pressable
          style={styles.explainerBackdrop}
          onPress={() => setExplainerModalOpen(false)}
        >
          <Pressable
            style={[
              styles.explainerSheet,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => {
              /* swallow taps so the backdrop doesn't dismiss when interacting
                 with the sheet body */
            }}
          >
            <Text style={[styles.explainerSheetTitle, { color: theme.text }]}>
              FullRox vs HalfRox
            </Text>
            <Text style={[styles.explainerBody, { color: theme.textSecondary }]}>
              {TIER_EXPLAINER_BODY}
            </Text>
            <Pressable
              onPress={() => setExplainerModalOpen(false)}
              style={({ pressed }) => [
                styles.explainerGotIt,
                { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.explainerGotItText}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function StepRow({ step }: { step: Step }) {
  const { theme } = useApp();
  const icon = ICON_FOR_STEP[step.type] ?? "ellipse-outline";
  const label = LABEL_FOR_STEP[step.type] ?? step.type;
  return (
    <View style={[styles.stepRow, { borderColor: theme.border }]}>
      <View style={styles.stepHeader}>
        <Ionicons name={icon as any} size={16} color={theme.accent} />
        <Text style={[styles.stepLabel, { color: theme.accent }]}>{label}</Text>
        {step.duration_minutes != null && (
          <Text style={[styles.stepDuration, { color: theme.textSecondary }]}>
            ~{step.duration_minutes}m
          </Text>
        )}
      </View>
      <Text style={[styles.stepDesc, { color: theme.text }]}>{step.description}</Text>
      {step.rest && (
        <Text style={[styles.stepMeta, { color: theme.textSecondary }]}>{step.rest}</Text>
      )}
      {step.details && step.details.length > 0 && (
        <View style={styles.stepDetails}>
          {step.details.map((d, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={[styles.detailBullet, { color: theme.accent }]}>•</Text>
              <Text style={[styles.detailText, { color: theme.textSecondary }]}>{d}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function NotesDisclosure({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const { theme } = useApp();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[styles.discWrap, { borderColor: theme.border }]}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.discHeader}>
        <Text style={[styles.discTitle, { color: theme.text }]}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.textSecondary}
        />
      </Pressable>
      {open && <View style={styles.discBody}>{children}</View>}
    </View>
  );
}

function NoteSubsection({ label, body }: { label: string; body: string }) {
  const { theme } = useApp();
  return (
    <View style={styles.subsection}>
      <Text style={[styles.subsectionLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.noteBody, { color: theme.text }]}>{body}</Text>
    </View>
  );
}

function StationWeightsDisclosure() {
  const { theme } = useApp();
  const [open, setOpen] = useState(false);
  const stations = getStations();
  return (
    <View style={[styles.discWrap, { borderColor: theme.border }]}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.discHeader}>
        <Text style={[styles.discTitle, { color: theme.text }]}>
          2025/26 station weights
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.textSecondary}
        />
      </Pressable>
      {open && (
        <View style={styles.discBody}>
          <View style={[styles.tableHeader, { borderColor: theme.border }]}>
            <Text style={[styles.tableHeaderCell, styles.colStation, { color: theme.textSecondary }]}>
              Station
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colDiv, { color: theme.textSecondary }]}>
              Open M
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colDiv, { color: theme.textSecondary }]}>
              Open W
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colDiv, { color: theme.textSecondary }]}>
              Pro M
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colDiv, { color: theme.textSecondary }]}>
              Pro W
            </Text>
          </View>
          {stations.stations.map((st) => (
            <View key={st.key} style={[styles.tableRow, { borderColor: theme.border }]}>
              <View style={styles.colStation}>
                <Text style={[styles.tableStationLabel, { color: theme.text }]}>{st.label}</Text>
                {st.distance !== "—" && (
                  <Text style={[styles.tableStationDist, { color: theme.textSecondary }]}>
                    {st.distance}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.colDiv, { color: theme.text }]}>
                {st.weights.open_men}
              </Text>
              <Text style={[styles.tableCell, styles.colDiv, { color: theme.text }]}>
                {st.weights.open_women}
              </Text>
              <Text style={[styles.tableCell, styles.colDiv, { color: theme.text }]}>
                {st.weights.pro_men}
              </Text>
              <Text style={[styles.tableCell, styles.colDiv, { color: theme.text }]}>
                {st.weights.pro_women}
              </Text>
            </View>
          ))}
          <Text style={[styles.tableFooter, { color: theme.textSecondary }]}>
            {stations.run_format}
          </Text>
        </View>
      )}
    </View>
  );
}

const ICON_FOR_STEP: Record<string, string> = {
  warmup: "sunny-outline",
  main: "flame-outline",
  cooldown: "snow-outline",
  strength_set: "barbell-outline",
  rounds: "repeat-outline",
  emom: "timer-outline",
  intervals: "pulse-outline",
  station_rotation: "grid-outline",
};

const LABEL_FOR_STEP: Record<string, string> = {
  warmup: "WARM-UP",
  main: "MAIN",
  cooldown: "COOL-DOWN",
  strength_set: "LIFT",
  rounds: "ROUNDS",
  emom: "EMOM",
  intervals: "INTERVALS",
  station_rotation: "STATION ROTATION",
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chev: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scroll: { padding: spacing.md, paddingTop: 0 },
  context: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  stimulus: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  optionalBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  optionalText: { flex: 1, fontSize: 13, lineHeight: 18 },
  segment: {
    flexDirection: "row",
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    padding: 3,
    marginBottom: spacing.md,
  },
  explainerCard: {
    position: "relative",
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    padding: 12,
    paddingRight: 36,
    marginBottom: spacing.md,
  },
  explainerClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  explainerBody: { fontSize: 13, lineHeight: 19 },
  explainerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    marginBottom: spacing.sm,
  },
  explainerInfoLabel: { fontSize: 12, fontWeight: "500" },
  explainerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  explainerSheet: {
    width: "100%",
    maxWidth: 360,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md + 2,
    gap: spacing.sm + 2,
  },
  explainerSheetTitle: { fontSize: 17, fontWeight: "700" },
  explainerGotIt: {
    minHeight: 44,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  explainerGotItText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  stepsBlock: { marginBottom: spacing.sm },
  stepRow: {
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  stepLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, flex: 1 },
  stepDuration: { fontSize: 11, fontWeight: "700" },
  stepDesc: { fontSize: 14, lineHeight: 20 },
  stepMeta: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
  stepDetails: { marginTop: 6 },
  detailRow: { flexDirection: "row", marginBottom: 3 },
  detailBullet: { width: 14, fontSize: 14, fontWeight: "700" },
  detailText: { flex: 1, fontSize: 13, lineHeight: 19 },
  discWrap: { borderTopWidth: 1, paddingVertical: spacing.sm + 2 },
  discHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discTitle: { fontSize: 14, fontWeight: "700" },
  discBody: { marginTop: spacing.sm },
  subsection: { marginBottom: spacing.sm + 4 },
  subsectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 4 },
  noteBody: { fontSize: 13, lineHeight: 20 },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  tableHeaderCell: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "flex-start",
  },
  colStation: { flex: 1.6, paddingRight: 4 },
  colDiv: { flex: 1, textAlign: "right", paddingLeft: 2 },
  tableStationLabel: { fontSize: 12, fontWeight: "700" },
  tableStationDist: { fontSize: 10, fontWeight: "500", marginTop: 1 },
  tableCell: { fontSize: 11, fontWeight: "500" },
  tableFooter: { fontSize: 11, fontStyle: "italic", marginTop: spacing.sm },
  completeBlock: { marginTop: spacing.lg, alignItems: "center" },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignSelf: "stretch",
  },
  completeBtnText: { fontSize: 16, fontWeight: "700" },
  undoHint: { fontSize: 12, marginTop: 8 },
});
