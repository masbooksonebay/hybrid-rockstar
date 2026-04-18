import { useCallback, useEffect, useRef, useState } from "react";
import { Text, ScrollView, Pressable, StyleSheet, Animated, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { useApp } from "../../../lib/context";
import {
  getReachableWeeks,
  getCompletedSessions,
  SESSION_ORDER,
  SESSION_LABELS,
  SessionSlug,
  Week,
  isFutureWeek,
} from "../../../lib/programming";
import { formatWeekRange, daysUntil } from "../../../lib/dates";
import { spacing, borderRadius } from "../../../constants/theme";

export default function TrainScreen() {
  const { theme, settings } = useApp();
  const router = useRouter();
  const { weeks, currentIndex: currentIdx } = getReachableWeeks();
  const pagerRef = useRef<PagerView>(null);
  const [activeIdx, setActiveIdx] = useState<number>(currentIdx);
  const [completedByWeek, setCompletedByWeek] = useState<Record<string, SessionSlug[]>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const map: Record<string, SessionSlug[]> = {};
        for (const w of weeks) {
          map[w.week_start] = await getCompletedSessions(w.week_start);
        }
        if (!cancelled) setCompletedByWeek(map);
      })();
      return () => {
        cancelled = true;
      };
    }, [weeks])
  );

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= weeks.length) return;
    pagerRef.current?.setPage(idx);
  };

  const raceDays = settings.raceDate ? daysUntil(settings.raceDate) : null;
  const activeWeek = weeks[activeIdx];
  const offset = activeIdx - currentIdx;
  const weekRange = formatWeekRange(isoToDate(activeWeek.week_start));
  let headerText: string;
  if (offset === 0) headerText = `This Week (${weekRange})`;
  else if (offset === -1) headerText = `Last Week (${weekRange})`;
  else if (offset === 1) headerText = `Next Week (${weekRange})`;
  else headerText = weekRange;

  const leftEnabled = activeIdx > 0;
  const rightEnabled = activeIdx < weeks.length - 1;
  const isFuture = isFutureWeek(activeWeek.week_start);

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.appTitle, { color: theme.text }]}>Hybrid Rockstar</Text>

      <View style={styles.eyebrowBlock}>
        <View style={styles.eyebrowRow}>
          <Pressable
            onPress={() => goTo(activeIdx - 1)}
            disabled={!leftEnabled}
            hitSlop={12}
            style={styles.chev}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={leftEnabled ? theme.text : "transparent"}
            />
          </Pressable>
          <Text style={[styles.eyebrow, { color: theme.text }]} numberOfLines={1}>
            {headerText}
          </Text>
          <Pressable
            onPress={() => goTo(activeIdx + 1)}
            disabled={!rightEnabled}
            hitSlop={12}
            style={styles.chev}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={rightEnabled ? theme.text : "transparent"}
            />
          </Pressable>
        </View>
        {raceDays !== null && raceDays >= 0 && (
          <Text style={[styles.countdown, { color: theme.accent }]}>
            {raceDays === 0 ? "Race day" : `${raceDays} day${raceDays === 1 ? "" : "s"} to race`}
          </Text>
        )}
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={currentIdx}
        onPageSelected={(e) => setActiveIdx(e.nativeEvent.position)}
      >
        {weeks.map((week) => (
          <View key={week.week_start} style={styles.page}>
            <WeekPage
              week={week}
              completed={completedByWeek[week.week_start] ?? []}
              isFuture={isFuture && week.week_start === activeWeek.week_start ? true : isFutureWeek(week.week_start)}
              onOpen={(slug) =>
                router.push({
                  pathname: "/train/[session]",
                  params: { session: slug, week: week.week_start },
                })
              }
            />
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

function WeekPage({
  week,
  completed,
  isFuture,
  onOpen,
}: {
  week: Week;
  completed: SessionSlug[];
  isFuture: boolean;
  onOpen: (slug: SessionSlug) => void;
}) {
  const { theme } = useApp();
  const mon = isoToDate(week.week_start);
  const monLabel = mon.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      {isFuture && (
        <View style={[styles.previewBanner, { backgroundColor: theme.accent + "12", borderColor: theme.accent + "40" }]}>
          <Ionicons name="eye-outline" size={14} color={theme.accent} />
          <Text style={[styles.previewText, { color: theme.text }]}>
            Preview — training starts Monday, {monLabel}
          </Text>
        </View>
      )}

      {SESSION_ORDER.map((slug) => {
        const session = week.sessions[slug];
        if (!session) return null;
        return (
          <SessionCard
            key={slug}
            slug={slug}
            title={session.title}
            stimulus={session.stimulus}
            fullDuration={session.full_rox.estimated_duration_minutes}
            quickDuration={session.quick_rox.estimated_duration_minutes}
            completed={completed.includes(slug)}
            onPress={() => onOpen(slug)}
          />
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

interface SessionCardProps {
  slug: SessionSlug;
  title: string;
  stimulus: string;
  fullDuration: number;
  quickDuration: number;
  completed: boolean;
  onPress: () => void;
}

function SessionCard({ slug, title, stimulus, fullDuration, quickDuration, completed, onPress }: SessionCardProps) {
  const { theme } = useApp();
  const scale = useState(new Animated.Value(1))[0];

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.cardBody}>
          <Text style={[styles.category, { color: theme.accent }]}>{SESSION_LABELS[slug]}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.stimulus, { color: theme.textSecondary }]}>{stimulus}</Text>
          <Text style={[styles.duration, { color: theme.textSecondary }]}>
            Full Rox ~{fullDuration}m · Quick Rox ~{quickDuration}m
          </Text>
        </View>
        {completed && (
          <View style={styles.check}>
            <Ionicons name="checkmark-circle" size={28} color="#34C759" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d);
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appTitle: { fontSize: 28, fontWeight: "700", textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  eyebrowBlock: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  eyebrowRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chev: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 18, fontWeight: "600", flex: 1, textAlign: "center" },
  countdown: { fontSize: 13, fontWeight: "600", marginTop: 2, textAlign: "center" },
  pager: { flex: 1 },
  page: { flex: 1 },
  pageContent: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.md },
  previewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  previewText: { fontSize: 12, fontWeight: "600", flex: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    marginBottom: spacing.md,
  },
  cardBody: { flex: 1 },
  category: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  stimulus: { fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
  duration: { fontSize: 11, fontWeight: "600" },
  check: { marginLeft: spacing.sm, alignSelf: "center" },
});
