import { Pressable, Text, StyleSheet } from "react-native";
import { useApp } from "../../lib/context";
import { spacing, borderRadius } from "../../constants/theme";

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function SegmentButton({ label, active, onPress }: Props) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, active && { backgroundColor: theme.accent }]}
    >
      <Text style={[styles.text, { color: active ? "#000" : theme.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm - 2,
    alignItems: "center",
  },
  text: { fontSize: 13, fontWeight: "600", textAlign: "center" },
});
