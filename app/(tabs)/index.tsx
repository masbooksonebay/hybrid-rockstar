import { useCallback, useState } from "react";
import { Text, ScrollView, Pressable, StyleSheet, Animated, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../lib/context";
import {
  getCurrentWeek,
  getCompletedSessions,
  SESSION_ORDER,
  SESSION_LABELS,
  SessionSlug,
} from "../../lib/programming";
import { formatWeekRange, daysUntil } from "../../lib/dates";
import { spacing, borderRadius } from "../../constants/theme";

export default function TrainScreen() {
  const { theme, settings } = useApp();
  const router = useRouter();
  const week = getCurrentWeek();
  const [completed, setCompleted] = useState<SessionSlug[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getCompletedSessions().then((list) => {
        if (!cancelled) setCompleted(list);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const weekRange = formatWeekRange();
  const raceDays = settings.raceDate ? daysUntil(settings.raceDate) : null;

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.appTitle, { color: theme.text }]}>Hybrid Rockstar</Text>

        <View style={styles.eyebrowBlock}>
          <Text style={[styles.eyebrow, { color: theme.text }]}>This Week ({weekRange})</Text>
          {raceDays !== null && raceDays >= 0 && (
            <Text style={[styles.countdown, { color: theme.accent }]}>
              {raceDays === 0 ? "Race day" : `${raceDays} day${raceDays === 1 ? "" : "s"} to race`}
            </Text>
          )}
        </View>

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
              onPress={() => router.push(`/train/${slug}`)}
            />
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.md },
  appTitle: { fontSize: 28, fontWeight: "700", textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  eyebrowBlock: { marginBottom: spacing.sm },
  eyebrow: { fontSize: 18, fontWeight: "600" },
  countdown: { fontSize: 13, fontWeight: "600", marginTop: 2 },
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
