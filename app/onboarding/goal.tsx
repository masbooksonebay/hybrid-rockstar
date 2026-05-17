import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../lib/context";
import { Goal } from "../../lib/store";
import { spacing } from "../../constants/theme";
import { HeaderRow, OptionPill, PrimaryButton, SecondaryButton } from "../../components/onboarding/Chrome";

const OPTIONS: { key: Goal; label: string }[] = [
  { key: "finish_strong", label: "Finish strong" },
  { key: "compete_for_time", label: "Compete for time" },
];

export default function GoalScreen() {
  const { theme, settings, updateSettings } = useApp();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <HeaderRow step={2} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { color: theme.text }]}>What's your goal?</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          Helps personalize your training program.
        </Text>
        <View style={styles.options}>
          {OPTIONS.map((opt) => (
            <OptionPill
              key={opt.key}
              label={opt.label}
              active={settings.goal === opt.key}
              onPress={() => updateSettings({ goal: opt.key })}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          disabled={settings.goal == null}
          onPress={() => router.push("/onboarding/pace")}
        />
        <SecondaryButton label="Skip" onPress={() => router.push("/onboarding/pace")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: spacing.lg, paddingTop: spacing.md },
  heading: { fontSize: 28, fontWeight: "800", marginBottom: spacing.sm },
  sub: { fontSize: 15, lineHeight: 21, marginBottom: spacing.lg },
  options: { gap: spacing.sm + 4 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
});
