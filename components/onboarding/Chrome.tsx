import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../lib/context";
import { spacing, borderRadius } from "../../constants/theme";

const TOTAL_STEPS = 3;

export function OnboardingProgress({ step }: { step: number }) {
  const { theme } = useApp();
  return (
    <View style={styles.progress}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const active = i === step;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: active ? theme.accent : theme.border },
              active && styles.dotActive,
            ]}
          />
        );
      })}
    </View>
  );
}

export function BackChevron({ onPress }: { onPress: () => void }) {
  const { theme } = useApp();
  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.chev}>
      <Ionicons name="chevron-back" size={28} color={theme.text} />
    </Pressable>
  );
}

export function HeaderRow({
  onBack,
  step,
}: {
  onBack?: () => void;
  step?: number;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerSide}>{onBack && <BackChevron onPress={onBack} />}</View>
      <View style={styles.headerCenter}>
        {step != null && <OnboardingProgress step={step} />}
      </View>
      <View style={styles.headerSide} />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        {
          backgroundColor: disabled ? theme.border : theme.accent,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.primaryText, { color: disabled ? theme.textTertiary : "#fff" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { theme } = useApp();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[styles.secondaryText, { color: theme.accent }]}>{label}</Text>
    </Pressable>
  );
}

export function OptionPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionPill,
        {
          backgroundColor: active ? theme.accent : theme.card,
          borderColor: active ? theme.accent : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.optionPillText,
          { color: active ? "#fff" : theme.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  chev: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    minHeight: 56,
  },
  headerSide: { width: 56, alignItems: "flex-start" },
  headerCenter: { flex: 1, alignItems: "center" },
  primary: {
    minHeight: 52,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryText: { fontSize: 17, fontWeight: "700" },
  secondary: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryText: { fontSize: 15, fontWeight: "600" },
  optionPill: {
    minHeight: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  optionPillText: { fontSize: 16, fontWeight: "600" },
});
