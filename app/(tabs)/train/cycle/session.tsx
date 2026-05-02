import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../../../lib/context";
import {
  BLOCK_LABELS,
  CycleSession,
  Step,
  Wk12Variant,
  getCycleWeek,
  getSession,
  getStations,
  sessionUsesStationWeights,
} from "../../../../lib/cycle";
import { spacing, borderRadius } from "../../../../constants/theme";

type RoxVersion = "full" | "quick";

export default function CycleSessionScreen() {
  const { theme } = useApp();
  const router = useRouter();
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

  const versionData = version === "full" ? session.full_rox : session.quick_rox;
  const blockLabel = BLOCK_LABELS[week.block_phase];
  const contextLine =
    week.is_divergent && variant
      ? `${blockLabel} Wk${week.cycle_week} — ${variant === "racer" ? "Racer" : "Continuous"}`
      : `${blockLabel} Wk${week.cycle_week}`;
  const showStations = sessionUsesStationWeights(session);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.chev}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.text }]} numberOfLines={1}>
          {session.title}
        </Text>
        <View style={styles.chev} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.context, { color: theme.accent }]}>{contextLine}</Text>
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
            label={`Full Rox ~${session.full_rox.estimated_duration_minutes}m`}
            active={version === "full"}
            onPress={() => setVersion("full")}
          />
          <SegmentButton
            label={`Quick Rox ~${session.quick_rox.estimated_duration_minutes}m`}
            active={version === "quick"}
            onPress={() => setVersion("quick")}
          />
        </View>

        {session.notes.collision_warning && (
          <CollisionCallout text={session.notes.collision_warning} />
        )}

        <View style={styles.stepsBlock}>
          {versionData.structure.map((step, i) => (
            <StepRow key={`${version}-${i}`} step={step} />
          ))}
        </View>

        <NotesDisclosure title="Notes" defaultOpen>
          <NoteSubsection label="About" body={session.notes.about} />
          <NoteSubsection label="Week context" body={session.notes.week_context} />
          <NoteSubsection label="Block context" body={session.notes.block_context} />
        </NotesDisclosure>

        {(session.notes.scaling?.beginner || session.notes.scaling?.advanced) && (
          <NotesDisclosure title="Scaling">
            {session.notes.scaling.beginner && (
              <NoteSubsection label="Beginner" body={session.notes.scaling.beginner} />
            )}
            {session.notes.scaling.advanced && (
              <NoteSubsection label="Advanced" body={session.notes.scaling.advanced} />
            )}
          </NotesDisclosure>
        )}

        {session.notes.substitutions && (
          <NotesDisclosure title="Substitutions">
            <Text style={[styles.noteBody, { color: theme.textSecondary }]}>
              {session.notes.substitutions}
            </Text>
          </NotesDisclosure>
        )}

        {showStations && <StationWeightsDisclosure />}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentBtn, active && { backgroundColor: theme.accent }]}
    >
      <Text style={[styles.segmentText, { color: active ? "#fff" : theme.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

function CollisionCallout({ text }: { text: string }) {
  const { theme } = useApp();
  return (
    <View
      style={[
        styles.collisionBanner,
        { backgroundColor: "rgba(255, 149, 0, 0.12)", borderColor: "#FF9500" },
      ]}
    >
      <Ionicons name="warning-outline" size={18} color="#FF9500" style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.collisionLabel, { color: "#FF9500" }]}>Collision warning</Text>
        <Text style={[styles.collisionBody, { color: theme.text }]}>{text}</Text>
      </View>
    </View>
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
  topTitle: { flex: 1, textAlign: "center", fontSize: 14, fontWeight: "700" },
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
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm - 2,
    alignItems: "center",
  },
  segmentText: { fontSize: 13, fontWeight: "600" },
  collisionBanner: {
    flexDirection: "row",
    gap: 10,
    padding: spacing.sm + 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  collisionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  collisionBody: { fontSize: 13, lineHeight: 19 },
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
});
