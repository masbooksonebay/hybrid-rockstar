import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../lib/context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { spacing, borderRadius } from "../../constants/theme";

interface LogEntry { id: string; date: string; type: string; duration: string; notes: string }

const LOG_KEY = "hr_log";

export default function LogScreen() {
  const { theme } = useApp();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(LOG_KEY).then((raw) => { if (raw) setEntries(JSON.parse(raw)); });
  }, []);

  const save = async (list: LogEntry[]) => {
    setEntries(list);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(list));
  };

  const addEntry = () => {
    const entry: LogEntry = { id: Date.now().toString(36), date: new Date().toISOString(), type: type || "Workout", duration, notes };
    save([entry, ...entries]);
    setShowAdd(false);
    setType(""); setDuration(""); setNotes("");
  };

  const filtered = search ? entries.filter((e) => e.type.toLowerCase().includes(search.toLowerCase()) || e.notes.toLowerCase().includes(search.toLowerCase())) : entries;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput style={[styles.searchInput, { color: theme.text }]} placeholder="Search log..." placeholderTextColor={theme.textSecondary} value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle" size={28} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No workouts logged yet. Tap + to add one.</Text>
        ) : filtered.map((e) => (
          <View key={e.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardRow}>
              <Text style={[styles.cardType, { color: theme.text }]}>{e.type}</Text>
              <Text style={[styles.cardDate, { color: theme.textSecondary }]}>{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
            </View>
            {e.duration ? <Text style={[styles.cardDuration, { color: theme.accent }]}>{e.duration}</Text> : null}
            {e.notes ? <Text style={[styles.cardNotes, { color: theme.textSecondary }]}>{e.notes}</Text> : null}
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Log Workout</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Ionicons name="close" size={28} color={theme.text} /></TouchableOpacity>
          </View>
          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="e.g. Run + Stations" placeholderTextColor={theme.textSecondary} value={type} onChangeText={setType} />
            <Text style={[styles.label, { color: theme.textSecondary }]}>Duration</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="e.g. 65 min" placeholderTextColor={theme.textSecondary} value={duration} onChangeText={setDuration} />
            <Text style={[styles.label, { color: theme.textSecondary }]}>Notes</Text>
            <TextInput style={[styles.input, styles.notesInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="How did it go?" placeholderTextColor={theme.textSecondary} multiline value={notes} onChangeText={setNotes} />
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={addEntry}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, gap: spacing.sm },
  searchRow: { flex: 1, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm + 4 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: spacing.sm, marginLeft: spacing.sm },
  content: { padding: spacing.md },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
  card: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm + 2, borderWidth: 1 },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  cardType: { fontSize: 16, fontWeight: "700" },
  cardDate: { fontSize: 12 },
  cardDuration: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  cardNotes: { fontSize: 13, marginTop: 4 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, paddingTop: 56 },
  modalTitle: { fontSize: 22, fontWeight: "800" },
  form: { padding: spacing.lg },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderRadius: borderRadius.sm, padding: spacing.md - 2, fontSize: 15 },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  saveBtn: { borderRadius: borderRadius.sm, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
