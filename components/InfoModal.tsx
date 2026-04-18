import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../lib/context";
import { spacing, borderRadius } from "../constants/theme";

export default function InfoModal({
  visible,
  title,
  body,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  const { theme } = useApp();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Text style={[styles.body, { color: theme.text }]}>{body}</Text>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: theme.accent }]}
            onPress={onClose}
          >
            <Text style={styles.ctaText}>Got it</Text>
          </TouchableOpacity>
        </View>
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
  },
  title: { fontSize: 22, fontWeight: "800" },
  content: { flex: 1, padding: spacing.lg },
  body: { fontSize: 15, lineHeight: 22 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm },
  cta: { paddingVertical: 14, borderRadius: borderRadius.md, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
