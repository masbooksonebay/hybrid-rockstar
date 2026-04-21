import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../../lib/context";
import { spacing, borderRadius } from "../../constants/theme";
import { getMovement, Substitution } from "../../constants/hyroxMovements";

const TIER_COLOR: Record<Substitution["tier"], string> = {
  ideal: "#22c55e",
  good: "#eab308",
  acceptable: "#f97316",
  lastResort: "#ef4444",
};

const TIER_LABEL: Record<Substitution["tier"], string> = {
  ideal: "Ideal",
  good: "Good",
  acceptable: "Acceptable",
  lastResort: "Last Resort",
};

interface Props {
  visible: boolean;
  movementId: string | null;
  onClose: () => void;
}

export default function MovementInfoModal({ visible, movementId, onClose }: Props) {
  const { theme } = useApp();
  const movement = movementId ? getMovement(movementId) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {movement?.name ?? "Movement"}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close movement info">
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        {!movement ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Movement info unavailable.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.sectionHeader, { color: theme.accent }]}>FORM</Text>

            <Text style={[styles.subLabel, { color: theme.text }]}>Setup</Text>
            {movement.setup.map((s, i) => (
              <View key={`setup-${i}`} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: theme.accent }]}>•</Text>
                <Text style={[styles.bulletText, { color: theme.text }]}>{s}</Text>
              </View>
            ))}

            <Text style={[styles.subLabel, { color: theme.text, marginTop: spacing.md }]}>Execution</Text>
            {movement.execution.map((s, i) => (
              <View key={`exec-${i}`} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: theme.accent }]}>•</Text>
                <Text style={[styles.bulletText, { color: theme.text }]}>{s}</Text>
              </View>
            ))}

            <Text style={[styles.subLabel, { color: theme.text, marginTop: spacing.md }]}>Common Mistakes</Text>
            {movement.commonMistakes.map((s, i) => (
              <View key={`mistakes-${i}`} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: theme.accent }]}>•</Text>
                <Text style={[styles.bulletText, { color: theme.text }]}>{s}</Text>
              </View>
            ))}

            <Text style={[styles.sectionHeader, { color: theme.accent, marginTop: spacing.xl }]}>SUBSTITUTIONS</Text>
            {movement.substitutions.map((sub, i) => (
              <View
                key={`sub-${i}`}
                style={[styles.subRow, { borderColor: theme.border, backgroundColor: theme.card }]}
              >
                <View style={styles.subRowHeader}>
                  <View style={[styles.tierDot, { backgroundColor: TIER_COLOR[sub.tier] }]} />
                  <Text style={[styles.tierLabel, { color: TIER_COLOR[sub.tier] }]}>{TIER_LABEL[sub.tier]}</Text>
                </View>
                <Text style={[styles.subName, { color: theme.text }]}>{sub.name}</Text>
                <Text style={[styles.subNote, { color: theme.textSecondary }]}>{sub.note}</Text>
              </View>
            ))}
            <View style={{ height: spacing.lg }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { flex: 1, fontSize: 22, fontWeight: "800", paddingRight: spacing.sm },
  content: { padding: spacing.lg, paddingTop: spacing.sm },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyText: { fontSize: 14 },
  sectionHeader: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2, marginBottom: spacing.sm },
  subLabel: { fontSize: 14, fontWeight: "700", marginTop: spacing.xs, marginBottom: spacing.xs },
  bulletRow: { flexDirection: "row", marginBottom: 6 },
  bullet: { width: 14, fontSize: 14, fontWeight: "700" },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 20 },
  subRow: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  subRowHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  tierLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  subName: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  subNote: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});
