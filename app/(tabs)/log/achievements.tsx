import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../../lib/context";
import { ACHIEVEMENTS } from "../../../lib/achievements/catalog";
import { useAchievements } from "../../../lib/achievements/storage";
import { AchievementCard } from "../../../components/achievements/AchievementCard";
import { spacing } from "../../../constants/theme";

export default function AchievementsScreen() {
  const { theme } = useApp();
  const router = useRouter();
  const store = useAchievements();

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.chev}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Achievements</Text>
        <View style={styles.chev} />
      </View>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Earn badges by completing training milestones.
      </Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {ACHIEVEMENTS.map((def) => (
          <AchievementCard key={def.id} definition={def} state={store[def.id]} />
        ))}
        <View style={{ height: spacing.lg }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  chev: { width: 40, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scroll: { paddingVertical: spacing.sm },
});
