import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../../../lib/context";
import {
  BLOCK_LABELS,
  CycleSession,
  Wk12Variant,
  blockMiniSummary,
  getCycleWeek,
  getSessionLabel,
  getWeekSessions,
} from "../../../../lib/cycle";
import { spacing, borderRadius } from "../../../../constants/theme";

export default function CycleWeekScreen() {
  const { theme } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ w?: string; variant?: string }>();
  const weekNumber = parseInt(params.w ?? "1", 10);
  const initialVariant: Wk12Variant =
    (params.variant as Wk12Variant | undefined) ?? "continuous";

  const week = getCycleWeek(weekNumber);
  const [variant, setVariant] = useState<Wk12Variant>(initialVariant);

  if (!week) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.notFound}>
          <Text style={{ color: theme.text }}>Week not found.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: theme.accent }}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const blockLabel = BLOCK_LABELS[week.block_phase];
  const sessions = getWeekSessions(week, variant);
  const variantData = week.is_divergent && week.variants ? week.variants[variant] : undefined;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.chev}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.text }]} numberOfLines={1}>
          Wk{week.cycle_week}
        </Text>
        <View style={styles.chev} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>
            {blockLabel.toUpperCase()} · WK{week.cycle_week}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>{week.title}</Text>
          <Text style={[styles.summary, { color: theme.textSecondary }]}>
            {blockMiniSummary(week)}
          </Text>
        </View>

        {week.is_divergent && week.variants && (
          <View style={[styles.segment, { borderColor: theme.border, backgroundColor: theme.card }]}>
            <SegmentButton
              label={week.variants.racer.label}
              active={variant === "racer"}
              onPress={() => setVariant("racer")}
            />
            <SegmentButton
              label={week.variants.continuous.label}
              active={variant === "continuous"}
              onPress={() => setVariant("continuous")}
            />
          </View>
        )}

        {variantData?.intro && (
          <View style={[styles.introBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.introText, { color: theme.text }]}>{variantData.intro}</Text>
            {variantData.sequencing && (
              <>
                <Text style={[styles.introLabel, { color: theme.textSecondary }]}>Sequencing</Text>
                <Text style={[styles.introText, { color: theme.text }]}>{variantData.sequencing}</Text>
              </>
            )}
          </View>
        )}

        {week.notes.collision_warning && (
          <CollisionCallout text={week.notes.collision_warning} />
        )}

        {sessions.map(({ key, session }) => (
          <SessionListItem
            key={key}
            sessionKey={key}
            session={session}
            onPress={() =>
              router.push({
                pathname: "/train/cycle/session",
                params: {
                  w: String(week.cycle_week),
                  s: key,
                  variant: week.is_divergent ? variant : undefined,
                },
              })
            }
          />
        ))}

        <View style={[styles.weekNotesWrap, { borderColor: theme.border }]}>
          <Text style={[styles.weekNotesLabel, { color: theme.textSecondary }]}>
            About this week
          </Text>
          <Text style={[styles.weekNotesBody, { color: theme.text }]}>
            {week.notes.about}
          </Text>
        </View>

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
        <Text style={[styles.collisionLabel, { color: "#FF9500" }]}>Week collision warning</Text>
        <Text style={[styles.collisionBody, { color: theme.text }]}>{text}</Text>
      </View>
    </View>
  );
}

function SessionListItem({
  sessionKey,
  session,
  onPress,
}: {
  sessionKey: string;
  session: CycleSession;
  onPress: () => void;
}) {
  const { theme } = useApp();
  const typeLabel = session.session_type
    ? getSessionLabel(session.session_type).toUpperCase()
    : sessionKey.replace(/_/g, " ").toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sessionCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.cardTop}>
          <Text style={[styles.sessionType, { color: theme.accent }]}>{typeLabel}</Text>
          {session.optional && (
            <View style={[styles.optionalChip, { borderColor: theme.accent }]}>
              <Text style={[styles.optionalChipText, { color: theme.accent }]}>OPTIONAL</Text>
            </View>
          )}
          {session.notes.collision_warning && (
            <Ionicons name="warning-outline" size={14} color="#FF9500" />
          )}
        </View>
        <Text style={[styles.sessionTitle, { color: theme.text }]}>{session.title}</Text>
        <Text style={[styles.sessionStimulus, { color: theme.textSecondary }]} numberOfLines={2}>
          {session.stimulus}
        </Text>
        <Text style={[styles.sessionMeta, { color: theme.textSecondary }]}>
          Full ~{session.full_rox.estimated_duration_minutes}m · Quick ~{session.quick_rox.estimated_duration_minutes}m
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

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
  headerBlock: { marginBottom: spacing.md },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  summary: { fontSize: 13, lineHeight: 18 },
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
  segmentText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  introBanner: {
    padding: spacing.sm + 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  introText: { fontSize: 13, lineHeight: 19 },
  introLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
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
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md - 2,
    marginBottom: spacing.sm + 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sessionType: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  optionalChip: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  optionalChipText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  sessionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  sessionStimulus: { fontSize: 12, lineHeight: 17, marginBottom: 6 },
  sessionMeta: { fontSize: 11, fontWeight: "600" },
  weekNotesWrap: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  weekNotesLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  weekNotesBody: { fontSize: 13, lineHeight: 19 },
});
