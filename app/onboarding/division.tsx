import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../lib/context";
import { Format, Tier } from "../../lib/store";
import { spacing } from "../../constants/theme";
import {
  HeaderRow,
  OptionPill,
  PrimaryButton,
  SecondaryButton,
} from "../../components/onboarding/Chrome";

// Division → format + tier mapping. Six options cover every real race
// format. Each tap writes format + tier atomically so Doubles users land in
// Settings with their tier already set.
type DivisionKey =
  | "pro_individual"
  | "open_individual"
  | "pro_doubles"
  | "open_doubles"
  | "mixed_doubles"
  | "relay";

interface DivisionOption {
  key: DivisionKey;
  label: string;
  format: Format;
  tier: Tier | null;
}

const OPTIONS: DivisionOption[] = [
  { key: "pro_individual", label: "Pro Individual", format: "Individual", tier: "Pro" },
  { key: "open_individual", label: "Open Individual", format: "Individual", tier: "Open" },
  { key: "pro_doubles", label: "Pro Doubles", format: "Doubles", tier: "Pro" },
  { key: "open_doubles", label: "Open Doubles", format: "Doubles", tier: "Open" },
  { key: "mixed_doubles", label: "Mixed Doubles", format: "Mixed Doubles", tier: null },
  { key: "relay", label: "Relay", format: "Relay", tier: null },
];

function detectSelection(format: Format | null, tier: Tier | null): DivisionKey | null {
  if (format === "Individual" && tier === "Pro") return "pro_individual";
  if (format === "Individual" && tier === "Open") return "open_individual";
  if (format === "Doubles" && tier === "Pro") return "pro_doubles";
  if (format === "Doubles" && tier === "Open") return "open_doubles";
  if (format === "Mixed Doubles") return "mixed_doubles";
  if (format === "Relay") return "relay";
  return null;
}

export default function Division() {
  const { theme, settings, updateSettings } = useApp();
  const router = useRouter();

  const selected = detectSelection(settings.format, settings.tier);

  const onSelect = (opt: DivisionOption) => {
    updateSettings({ format: opt.format, tier: opt.tier });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* No back button on screen 1 — first screen of the flow. */}
      <HeaderRow step={0} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { color: theme.text }]}>What are you racing?</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          Pick the division you're training for. You can change this later in Settings.
        </Text>
        <View style={styles.options}>
          {OPTIONS.map((opt) => (
            <OptionPill
              key={opt.key}
              label={opt.label}
              active={selected === opt.key}
              onPress={() => onSelect(opt)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          disabled={selected == null}
          onPress={() => router.push("/onboarding/goal")}
        />
        <SecondaryButton label="Skip" onPress={() => router.push("/onboarding/goal")} />
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
