import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { useApp } from "../../lib/context";
import { ACHIEVEMENTS } from "../../lib/achievements/catalog";
import { useAchievements } from "../../lib/achievements/storage";
import { borderRadius, spacing } from "../../constants/theme";

export function AchievementsSection() {
  const { theme } = useApp();
  const router = useRouter();
  const store = useAchievements();

  const unlockedCount = ACHIEVEMENTS.reduce(
    (n, def) => (store[def.id]?.unlocked ? n + 1 : n),
    0
  );
  const total = ACHIEVEMENTS.length;

  return (
    <Pressable
      onPress={() => router.push("/(tabs)/log/achievements")}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Achievements, ${unlockedCount} of ${total} unlocked`}
    >
      <SymbolView
        name="trophy.fill"
        size={24}
        tintColor="#FFCC00"
        weight="regular"
        style={styles.icon}
      />
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: theme.text }]}>Achievements</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {unlockedCount} of {total} unlocked
        </Text>
      </View>
      <SymbolView
        name="chevron.right"
        size={20}
        tintColor={theme.textTertiary}
        weight="regular"
        style={styles.chev}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  icon: { width: 24, height: 24 },
  textCol: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: "600" },
  subtitle: { fontSize: 13, marginTop: 2 },
  chev: { width: 20, height: 20 },
});
