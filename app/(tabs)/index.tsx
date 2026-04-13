import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../lib/context";
import { PROGRAM } from "../../data/programming";
import { spacing, borderRadius } from "../../constants/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TrainScreen() {
  const { theme, settings } = useApp();
  const [weekIdx, setWeekIdx] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<"full" | "quick">("full");

  const week = PROGRAM[weekIdx];
  const workout = selectedDay !== null ? week.workouts[selectedDay] : null;
  const session = workout ? (sessionType === "full" ? workout.full : workout.quick) : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Week selector */}
      <View style={styles.weekRow}>
        {PROGRAM.map((w, i) => (
          <TouchableOpacity key={w.phase} style={[styles.weekTab, i === weekIdx && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => { setWeekIdx(i); setSelectedDay(null); }}>
            <Text style={[styles.weekLabel, { color: i === weekIdx ? theme.text : theme.textSecondary }]}>{w.phase}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Phase note */}
        <View style={[styles.phaseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.phaseLabel, { color: theme.accent }]}>{week.label}</Text>
          <Text style={[styles.phaseNote, { color: theme.textSecondary }]}>{week.note}</Text>
        </View>

        {/* Day cards */}
        {week.workouts.map((w, i) => (
          <TouchableOpacity key={i} style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setSelectedDay(i)} activeOpacity={0.7}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayName, { color: theme.text }]}>{DAYS[i]}</Text>
              <View style={[styles.typeTag, { backgroundColor: theme.accent + "20" }]}>
                <Text style={[styles.typeText, { color: theme.accent }]}>{w.type}</Text>
              </View>
            </View>
            <Text style={[styles.dayPreview, { color: theme.textSecondary }]} numberOfLines={2}>{w.full.main}</Text>
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Workout detail modal */}
      <Modal visible={selectedDay !== null} animationType="slide" presentationStyle="pageSheet">
        {workout && session && (
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalDay, { color: theme.accent }]}>{DAYS[selectedDay!]} — {workout.type}</Text>
                <Text style={[styles.modalPhase, { color: theme.textSecondary }]}>{week.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Session toggle */}
            <View style={[styles.toggleRow, { borderColor: theme.border }]}>
              <TouchableOpacity style={[styles.toggleBtn, sessionType === "full" && { backgroundColor: theme.accent }]} onPress={() => setSessionType("full")}>
                <Text style={[styles.toggleText, { color: sessionType === "full" ? "#fff" : theme.textSecondary }]}>Full (60-90 min)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, sessionType === "quick" && { backgroundColor: theme.accent }]} onPress={() => setSessionType("quick")}>
                <Text style={[styles.toggleText, { color: sessionType === "quick" ? "#fff" : theme.textSecondary }]}>Quick (25-30 min)</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>WARM-UP</Text>
              <Text style={[styles.sectionBody, { color: theme.text }]}>{session.warmup}</Text>

              <Text style={[styles.sectionTitle, { color: theme.accent }]}>WORKOUT</Text>
              <Text style={[styles.sectionBody, { color: theme.text }]}>{session.main}</Text>

              <Text style={[styles.sectionTitle, { color: theme.accent }]}>COACH NOTE</Text>
              <Text style={[styles.sectionBody, { color: theme.textSecondary, fontStyle: "italic" }]}>{session.notes}</Text>

              <Text style={[styles.weightNote, { color: theme.textSecondary }]}>
                Open weights shown. Adjust for your division in Settings.
              </Text>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  weekRow: { flexDirection: "row", paddingHorizontal: spacing.sm, paddingTop: spacing.xs },
  weekTab: { flex: 1, alignItems: "center", paddingVertical: spacing.sm + 4, borderBottomWidth: 2, borderBottomColor: "transparent" },
  weekLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  content: { padding: spacing.md },
  phaseCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  phaseLabel: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  phaseNote: { fontSize: 13, lineHeight: 18 },
  dayCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm + 2, borderWidth: 1 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  dayName: { fontSize: 17, fontWeight: "800" },
  typeTag: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm + 2, paddingVertical: 3 },
  typeText: { fontSize: 11, fontWeight: "700" },
  dayPreview: { fontSize: 13, lineHeight: 18 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: spacing.md, paddingTop: 56 },
  modalDay: { fontSize: 20, fontWeight: "800" },
  modalPhase: { fontSize: 13, marginTop: 2 },
  toggleRow: { flexDirection: "row", marginHorizontal: spacing.md, borderRadius: borderRadius.sm, borderWidth: 1, overflow: "hidden" },
  toggleBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.sm + 2 },
  toggleText: { fontSize: 13, fontWeight: "600" },
  modalContent: { padding: spacing.lg },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  sectionBody: { fontSize: 15, lineHeight: 22 },
  weightNote: { fontSize: 11, marginTop: spacing.lg, textAlign: "center" },
});
