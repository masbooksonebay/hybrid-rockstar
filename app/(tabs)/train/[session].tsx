import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { useApp } from "../../../lib/context";
import {
  getCurrentWeek,
  getWeekByStart,
  isFutureWeek,
  isSessionComplete,
  markSessionComplete,
  SESSION_LABELS,
  SESSION_ORDER,
  Session,
  SessionSlug,
  SessionStructureBlock,
  Week,
} from "../../../lib/programming";
import { spacing, borderRadius } from "../../../constants/theme";

type Version = "full" | "quick";

const SIMULATION_BANNER =
  "Recommended: save this one for last this week. Simulation is the most demanding session — you'll get the most from it when you've banked the week's other workouts first. That said, it's your week — do it whenever fits.";

export default function WorkoutDetailScreen() {
  const { theme } = useApp();
  const params = useLocalSearchParams<{ session: string; week?: string }>();
  const initialSlug = params.session as SessionSlug;
  const week: Week = useMemo(
    () => (params.week ? getWeekByStart(params.week) ?? getCurrentWeek() : getCurrentWeek()),
    [params.week]
  );

  const initialIndex = Math.max(0, SESSION_ORDER.indexOf(initialSlug));
  const [activeIdx, setActiveIdx] = useState(initialIndex);
  const pagerRef = useRef<PagerView>(null);
  const future = isFutureWeek(week.week_start);

  const activeSlug = SESSION_ORDER[activeIdx];
  const leftEnabled = activeIdx > 0;
  const rightEnabled = activeIdx < SESSION_ORDER.length - 1;

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= SESSION_ORDER.length) return;
    pagerRef.current?.setPage(idx);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable
          onPress={() => goTo(activeIdx - 1)}
          disabled={!leftEnabled}
          hitSlop={12}
          style={styles.chev}
        >
          <Ionicons name="chevron-back" size={26} color={leftEnabled ? theme.text : "transparent"} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => goTo(activeIdx + 1)}
          disabled={!rightEnabled}
          hitSlop={12}
          style={styles.chev}
        >
          <Ionicons name="chevron-forward" size={26} color={rightEnabled ? theme.text : "transparent"} />
        </Pressable>
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        onPageSelected={(e) => setActiveIdx(e.nativeEvent.position)}
      >
        {SESSION_ORDER.map((slug, i) => {
          const session = week.sessions[slug];
          if (!session) return <View key={slug} style={styles.pageEmpty} />;
          return (
            <SessionPage
              key={slug}
              slug={slug}
              session={session}
              weekStart={week.week_start}
              active={i === activeIdx}
              future={future}
              placeholder={!!week.is_placeholder}
            />
          );
        })}
      </PagerView>
    </SafeAreaView>
  );
}

interface SessionPageProps {
  slug: SessionSlug;
  session: Session;
  weekStart: string;
  active: boolean;
  future: boolean;
  placeholder: boolean;
}

function SessionPage({ slug, session, weekStart, active, future, placeholder }: SessionPageProps) {
  const { theme } = useApp();
  const [version, setVersion] = useState<Version>("full");
  const [done, setDone] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;
    isSessionComplete(slug, weekStart).then((v) => {
      if (!cancelled) {
        setDone(v);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug, weekStart]);

  useEffect(() => {
    if (active) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setVersion("full");
    }
  }, [active]);

  const toggleComplete = useCallback(async () => {
    const next = !done;
    setDone(next);
    if (next && Platform.OS === "ios") {
      Vibration.vibrate(10);
    }
    await markSessionComplete(slug, next, weekStart);
  }, [done, slug, weekStart]);

  const versionData = version === "full" ? session.full_rox : session.quick_rox;
  const isSimulation = slug === "simulation";

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {placeholder && (
        <View style={[styles.placeholderBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
            Placeholder week — for beta testing navigation only. Programming not authored.
          </Text>
        </View>
      )}
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

      {!future && (
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
      )}

      <NotesSection title="About this workout" body={session.notes.about} />
      <NotesSection title="This week in your block" body={session.notes.week_context} />
      <NotesSection title="How blocks fit together" body={session.notes.block_context} />

      <View style={{ height: 60 }} />
    </ScrollView>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chev: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  pager: { flex: 1 },
  pageEmpty: { flex: 1 },
  scroll: { padding: spacing.md, paddingTop: 0 },
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
  placeholderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  placeholderText: { flex: 1, fontSize: 13, lineHeight: 18 },
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
});
