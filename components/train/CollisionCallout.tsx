import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../lib/context";
import { spacing, borderRadius } from "../../constants/theme";

interface Props {
  text: string;
  // Default "Collision warning" matches session-detail usage. Week list overrides
  // with "Week collision warning" so the user knows the warning applies to the
  // whole week, not just one session.
  label?: string;
}

export function CollisionCallout({ text, label = "Collision warning" }: Props) {
  const { theme } = useApp();
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: "rgba(255, 149, 0, 0.12)", borderColor: "#FF9500" },
      ]}
    >
      <Ionicons name="warning-outline" size={18} color="#FF9500" style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: "#FF9500" }]}>{label}</Text>
        <Text style={[styles.body, { color: theme.text }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    gap: 10,
    padding: spacing.sm + 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  body: { fontSize: 13, lineHeight: 19 },
});
