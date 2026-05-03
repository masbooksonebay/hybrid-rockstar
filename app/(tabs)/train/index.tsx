import { useRef, useState } from "react";
import { Text, ScrollView, Pressable, StyleSheet, Animated, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { useApp } from "../../../lib/context";
import {
  BLOCK_LABELS,
  CycleSession,
  CycleWeek,
  getCycle,
  getSessionLabel,
  getWeekSessions,
} from "../../../lib/cycle";
import {
  getCurrentWeek,
  isSessionComplete,
  startCycle,
  useCycleProgress,
} from "../../../lib/cycleProgress";
import { daysUntil } from "../../../lib/dates";
import { spacing, borderRadius } from "../../../constants/theme";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function TrainScreen() {
  const { theme, settings } = useApp();
  const router = useRouter();
  const cycle = getCycle();
  const progress = useCycleProgress();
  const cycleStarted = progress.startDate != null;
  const currentWeek = getCurrentWeek(progress.startDate) ?? 1;
  const initialIdx = Math.max(0, Math.min(currentWeek - 1, cycle.weeks.length - 1));

  const pagerRef = useRef<PagerView>(null);
  const [activeIdx, setActiveIdx] = useState<number>(initialIdx);

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= cycle.weeks.length) return;
    pagerRef.current?.setPage(idx);
  };

  const raceDays = settings.raceDate ? daysUntil(settings.raceDate) : null;

  if (!cycleStarted) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
        <BrandHeader theme={theme} />
        <ScrollView contentContainerStyle={styles.startWrap} keyboardShouldPersistTaps="handled">
          {raceDays !== null && raceDays >= 0 && (
            <Text style={[styles.countdown, { color: theme.accent, marginBottom: spacing.lg }]}>
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
                Tap to begin Wk1 of HR Cycle 1 today. 12 weeks, ~5–6 sessions per week.
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push("/train/cycle")}
            style={({ pressed }) => [
              styles.cycleLink,
              { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.cycleLinkText, { color: theme.text }]}>
              View full 12-week cycle
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const activeWeek = cycle.weeks[activeIdx];
  const offset = activeIdx - (currentWeek - 1);
  const weekRange = formatCycleWeekRange(progress.startDate!, activeWeek.cycle_week);
  let headerText: string;
  if (offset === 0) headerText = `This Week (${weekRange})`;
  else if (offset === -1) headerText = `Last Week (${weekRange})`;
  else if (offset === 1) headerText = `Next Week (${weekRange})`;
  else headerText = `Wk ${activeWeek.cycle_week} · ${weekRange}`;

  const leftEnabled = activeIdx > 0;
  const rightEnabled = activeIdx < cycle.weeks.length - 1;

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <BrandHeader theme={theme} />

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
        initialPage={initialIdx}
        onPageSelected={(e) => setActiveIdx(e.nativeEvent.position)}
      >
        {cycle.weeks.map((week) => (
          <View key={week.cycle_week} style={styles.page}>
            <WeekPage week={week} />
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

function BrandHeader({ theme }: { theme: any }) {
  return (
    <>
      <View style={styles.brandHeader}>
        <Text style={[styles.brandText, { color: theme.text }]}>HYBRID ROCKSTAR</Text>
      </View>
      <View style={[styles.brandLine, { backgroundColor: theme.accent }]} />
    </>
  );
}

function WeekPage({ week }: { week: CycleWeek }) {
  const { theme } = useApp();
  const router = useRouter();
  const progress = useCycleProgress();
  const sessions = getWeekSessions(week);
  const blockLabel = BLOCK_LABELS[week.block_phase];

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Pressable
        onPress={() => router.push("/train/cycle")}
        style={({ pressed }) => [
          styles.cycleLink,
          { borderColor: theme.border, opacity: pressed ? 0.7 : 1, marginBottom: spacing.md },
        ]}
      >
        <Text style={[styles.cycleLinkText, { color: theme.text }]}>
          View full 12-week cycle
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      </Pressable>

      <View style={styles.weekHeader}>
        <Text style={[styles.weekEyebrow, { color: theme.accent }]}>
          {blockLabel.toUpperCase()} · WK{week.cycle_week}
        </Text>
        <Text style={[styles.weekTitle, { color: theme.text }]}>{week.title}</Text>
      </View>

      {sessions.map(({ key, session }, index) => (
        <SessionCard
          key={key}
          dayNumber={index + 1}
          sessionKey={key}
          session={session}
          completed={isSessionComplete(progress, week.cycle_week, key)}
          onPress={() =>
            router.push({
              pathname: "/train/cycle/session",
              params: { w: String(week.cycle_week), s: key },
            })
          }
        />
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

interface SessionCardProps {
  dayNumber: number;
  sessionKey: string;
  session: CycleSession;
  completed: boolean;
  onPress: () => void;
}

function SessionCard({ dayNumber, sessionKey, session, completed, onPress }: SessionCardProps) {
  const { theme } = useApp();
  const scale = useState(new Animated.Value(1))[0];
  const typeLabel = session.session_type
    ? getSessionLabel(session.session_type).toUpperCase()
    : sessionKey.replace(/_/g, " ").toUpperCase();

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
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: pressed ? 0.7 : completed ? 0.5 : 1,
          },
        ]}
      >
        <View style={styles.cardBody}>
          <Text style={[styles.category, { color: theme.accent }]}>
            DAY {dayNumber} · {typeLabel}
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>{session.title}</Text>
          <Text style={[styles.stimulus, { color: theme.textSecondary }]} numberOfLines={2}>
            {session.stimulus}
          </Text>
          <Text style={[styles.duration, { color: theme.textSecondary }]}>
            Full Rox ~{session.full_rox.estimated_duration_minutes}m · Quick Rox ~
            {session.quick_rox.estimated_duration_minutes}m
          </Text>
        </View>
        {completed && (
          <View style={styles.check}>
            <Ionicons name="checkmark-circle" size={28} color={theme.accent} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function formatCycleWeekRange(startDateISO: string, cycleWeek: number): string {
  const start = new Date(startDateISO);
  const wkStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  wkStart.setDate(wkStart.getDate() + (cycleWeek - 1) * 7);
  const wkEnd = new Date(wkStart);
  wkEnd.setDate(wkStart.getDate() + 6);
  const startLabel = `${MONTHS[wkStart.getMonth()]} ${wkStart.getDate()}`;
  const endLabel =
    wkStart.getMonth() === wkEnd.getMonth()
      ? `${wkEnd.getDate()}`
      : `${MONTHS[wkEnd.getMonth()]} ${wkEnd.getDate()}`;
  return `${startLabel}–${endLabel}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandHeader: { alignItems: "center", marginTop: spacing.sm, paddingBottom: spacing.sm },
  brandText: { fontSize: 22, fontWeight: "900", letterSpacing: 4 },
  brandLine: { width: "100%", height: 2, marginBottom: spacing.md },
  startWrap: { padding: spacing.md, alignItems: "stretch" },
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
  cycleLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  cycleLinkText: { fontSize: 14, fontWeight: "700" },
  eyebrowBlock: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  eyebrowRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chev: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 18, fontWeight: "600", flex: 1, textAlign: "center" },
  countdown: { fontSize: 13, fontWeight: "600", marginTop: 2, textAlign: "center" },
  pager: { flex: 1 },
  page: { flex: 1 },
  pageContent: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.md },
  weekHeader: { marginBottom: spacing.md },
  weekEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  weekTitle: { fontSize: 20, fontWeight: "800" },
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
