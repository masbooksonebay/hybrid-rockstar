import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Vibration,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../lib/context";
import {
  getSession,
  isSessionComplete,
  markSessionComplete,
  SESSION_LABELS,
  SESSION_ORDER,
  SessionSlug,
  SessionStructureBlock,
} from "../../lib/programming";
import { spacing, borderRadius } from "../../constants/theme";

type Version = "full" | "quick";

const SIMULATION_BANNER =
  "Recommended: save this one for last this week. Simulation is the most demanding session — you'll get the most from it when you've banked the week's other workouts first. That said, it's your week — do it whenever fits.";

const SCREEN_W = Dimensions.get("window").width;
const SWIPE_THRESHOLD = 60;

export default function WorkoutDetailScreen() {
  const { theme } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ session: string }>();
  const slug = params.session as SessionSlug;
  const session = getSession(slug);

  const [version, setVersion] = useState<Version>("full");
  const [done, setDone] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const idx = SESSION_ORDER.indexOf(slug);
  const prevSlug: SessionSlug | null = idx > 0 ? SESSION_ORDER[idx - 1] : null;
  const nextSlug: SessionSlug | null = idx >= 0 && idx < SESSION_ORDER.length - 1 ? SESSION_ORDER[idx + 1] : null;

  useEffect(() => {
    let cancelled = false;
    if (slug) {
      setLoaded(false);
      isSessionComplete(slug).then((v) => {
        if (!cancelled) {
          setDone(v);
          setLoaded(true);
        }
      });
      setVersion("full");
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const goTo = useCallback(
    (target: SessionSlug | null) => {
      if (!target) return;
      router.replace(`/train/${target}`);
    },
    [router]
  );

  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_e, g) => {
        translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -SWIPE_THRESHOLD && nextSlug) {
          Animated.timing(translateX, { toValue: -SCREEN_W, duration: 160, useNativeDriver: true }).start(
            () => {
              translateX.setValue(0);
              goTo(nextSlug);
            }
          );
        } else if (g.dx > SWIPE_THRESHOLD && prevSlug) {
          Animated.timing(translateX, { toValue: SCREEN_W, duration: 160, useNativeDriver: true }).start(
            () => {
              translateX.setValue(0);
              goTo(prevSlug);
            }
          );
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const toggleComplete = useCallback(async () => {
    const next = !done;
    setDone(next);
    if (next && Platform.OS === "ios") {
      Vibration.vibrate(10);
    }
    await markSessionComplete(slug, next);
  }, [done, slug]);

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.padded}>
          <BackButton onPress={() => router.back()} color={theme.text} />
          <Text style={[styles.missing, { color: theme.text }]}>Session not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const versionData = version === "full" ? session.full_rox : session.quick_rox;
  const isSimulation = slug === "simulation";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.View style={{ flex: 1, transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <BackButton onPress={() => router.back()} color={theme.text} />
            <View style={styles.topNav}>
              <NavButton
                dir="prev"
                label={prevSlug ? SESSION_LABELS[prevSlug] : null}
                onPress={() => goTo(prevSlug)}
                color={theme.text}
                muted={theme.textSecondary}
              />
              <NavButton
                dir="next"
                label={nextSlug ? SESSION_LABELS[nextSlug] : null}
                onPress={() => goTo(nextSlug)}
                color={theme.text}
                muted={theme.textSecondary}
              />
            </View>
          </View>

          <Text style={[styles.category, { color: theme.accent }]}>{SESSION_LABELS[slug]}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{session.title}</Text>
          <Text style={[styles.stimulus, { color: theme.textSecondary }]}>{session.stimulus}</Text>

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

          {isSimulation && (
            <View style={[styles.infoBanner, { backgroundColor: theme.accent + "15", borderColor: theme.accent + "40" }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.accent} style={{ marginTop: 1 }} />
              <Text style={[styles.infoText, { color: theme.text }]}>{SIMULATION_BANNER}</Text>
            </View>
          )}

          {versionData.structure.map((block, i) => (
            <StructureBlock key={`${version}-${i}`} block={block} />
          ))}

          <Pressable
            onPress={loaded ? toggleComplete : undefined}
            style={[
              styles.completeBtn,
              done
                ? { backgroundColor: "rgba(52, 199, 89, 0.2)", borderColor: "#34C759", borderWidth: 1 }
                : { backgroundColor: theme.accent },
            ]}
          >
            {done ? (
              <Text style={[styles.completeText, { color: "#34C759" }]}>Completed ✓</Text>
            ) : (
              <Text style={[styles.completeText, { color: "#fff" }]}>Mark Complete</Text>
            )}
          </Pressable>

          <NotesSection title="About this workout" body={session.notes.about} />
          <NotesSection title="This week in your block" body={session.notes.week_context} />
          <NotesSection title="How blocks fit together" body={session.notes.block_context} />

          <View style={{ height: 60 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function BackButton({ onPress, color }: { onPress: () => void; color: string }) {
  return (
    <Pressable onPress={onPress} style={styles.back} hitSlop={12}>
      <Ionicons name="chevron-back" size={22} color={color} />
      <Text style={[styles.backText, { color }]}>Back</Text>
    </Pressable>
  );
}

function NavButton({
  dir,
  label,
  onPress,
  color,
  muted,
}: {
  dir: "prev" | "next";
  label: string | null;
  onPress: () => void;
  color: string;
  muted: string;
}) {
  if (!label) return <View style={styles.navBtnPlaceholder} />;
  const isPrev = dir === "prev";
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.navBtn}>
      {isPrev && <Ionicons name="chevron-back" size={14} color={muted} />}
      <Text style={[styles.navBtnText, { color: muted }]} numberOfLines={1}>
        {label}
      </Text>
      {!isPrev && <Ionicons name="chevron-forward" size={14} color={muted} />}
    </Pressable>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentBtn, active && { backgroundColor: theme.accent }]}
    >
      <Text
        style={[
          styles.segmentText,
          { color: active ? "#fff" : theme.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StructureBlock({ block }: { block: SessionStructureBlock }) {
  const { theme } = useApp();
  return (
    <View style={styles.block}>
      <Text style={[styles.blockHeading, { color: theme.text }]}>{block.heading}</Text>
      {block.items.map((item, i) => (
        <View key={i} style={styles.itemRow}>
          <Text style={[styles.bullet, { color: theme.accent }]}>•</Text>
          <Text style={[styles.itemText, { color: theme.text }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function NotesSection({ title, body }: { title: string; body: string }) {
  const { theme } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.notesWrap, { borderColor: theme.border }]}>
      <Pressable onPress={() => setOpen((v) => !v)} style={styles.notesHeader}>
        <Text style={[styles.notesTitle, { color: theme.textSecondary }]}>{title}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
      </Pressable>
      {open && <Text style={[styles.notesBody, { color: theme.textSecondary }]}>{body}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  padded: { padding: spacing.md },
  scroll: { padding: spacing.md, paddingTop: spacing.sm },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  back: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  backText: { fontSize: 15, fontWeight: "500" },
  topNav: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 4, paddingHorizontal: 4, maxWidth: 140 },
  navBtnPlaceholder: { width: 0 },
  navBtnText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  category: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 4 },
  stimulus: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  segment: { flexDirection: "row", borderRadius: borderRadius.sm, borderWidth: 1, padding: 3, marginBottom: spacing.md },
  segmentBtn: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: borderRadius.sm - 2, alignItems: "center" },
  segmentText: { fontSize: 13, fontWeight: "600" },
  infoBanner: {
    flexDirection: "row",
    gap: 8,
    padding: spacing.sm + 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  block: { marginBottom: spacing.md },
  blockHeading: { fontSize: 15, fontWeight: "700", marginBottom: spacing.sm },
  itemRow: { flexDirection: "row", marginBottom: 6 },
  bullet: { width: 14, fontSize: 14, fontWeight: "700" },
  itemText: { flex: 1, fontSize: 14, lineHeight: 20 },
  completeBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  completeText: { fontSize: 15, fontWeight: "700" },
  notesWrap: { borderTopWidth: 1, paddingVertical: spacing.sm + 2 },
  notesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  notesTitle: { fontSize: 13, fontWeight: "600" },
  notesBody: { fontSize: 13, lineHeight: 20, marginTop: spacing.sm, paddingRight: spacing.sm },
  missing: { fontSize: 16, textAlign: "center", marginTop: spacing.xl },
});
