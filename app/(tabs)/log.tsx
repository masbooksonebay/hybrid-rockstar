import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Swipeable } from "react-native-gesture-handler";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp } from "../../lib/context";
import { spacing, borderRadius } from "../../constants/theme";
import { formatRelativeDate } from "../../lib/dates";
import DoneKeyboardToolbar, { KEYBOARD_DONE_ID } from "../../components/DoneKeyboardToolbar";
import { NumericInputWithDone } from "../../components/common/NumericInputWithDone";

interface LogEntry {
  id: string;
  date: string;
  activity: string;
  activityOther?: string;
  duration: string;
  distanceKm?: string;
  notes: string;
}

const LOG_KEY = "hr_log";
const ACTIVITIES = ["Strength", "Running", "Engine", "Simulation", "EMOM / Technique", "Race", "Other"] as const;
type Activity = (typeof ACTIVITIES)[number];

export default function LogScreen() {
  const { theme } = useApp();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<LogEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [undoEntry, setUndoEntry] = useState<{ entry: LogEntry; index: number } | null>(null);
  const undoOpacity = useRef(new Animated.Value(0)).current;
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeRefs = useRef<Map<string, Swipeable>>(new Map());

  useEffect(() => {
    AsyncStorage.getItem(LOG_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as LogEntry[];
          setEntries(parsed.map(migrateEntry));
        } catch {}
      }
      setLoaded(true);
    });
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const persist = async (next: LogEntry[]) => {
    setEntries(next);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(next));
  };

  const handleSave = (entry: LogEntry) => {
    if (entries.find((e) => e.id === entry.id)) {
      persist(entries.map((e) => (e.id === entry.id ? entry : e)));
    } else {
      persist([entry, ...entries]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    const idx = entries.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const removed = entries[idx];
    const next = [...entries.slice(0, idx), ...entries.slice(idx + 1)];
    persist(next);
    swipeRefs.current.get(id)?.close();
    swipeRefs.current.delete(id);
    showUndo(removed, idx);
  };

  const showUndo = (entry: LogEntry, index: number) => {
    setUndoEntry({ entry, index });
    Animated.timing(undoOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => dismissUndo(), 4000);
  };

  const dismissUndo = () => {
    Animated.timing(undoOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setUndoEntry(null);
    });
    if (undoTimer.current) {
      clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
  };

  const handleUndo = () => {
    if (!undoEntry) return;
    const restored = [...entries];
    restored.splice(Math.min(undoEntry.index, restored.length), 0, undoEntry.entry);
    persist(restored);
    dismissUndo();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.activity.toLowerCase().includes(q) ||
        (e.activityOther ?? "").toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (entry: LogEntry) => {
    setEditing(entry);
    setShowForm(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search log..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity onPress={openCreate}>
          <Ionicons name="add-circle" size={28} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!loaded ? null : filtered.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No workouts logged yet. Tap + to add one.</Text>
        ) : (
          filtered.map((e) => (
            <LogRow
              key={e.id}
              entry={e}
              onPress={() => openEdit(e)}
              onDelete={() => handleDelete(e.id)}
              registerRef={(ref) => {
                if (ref) swipeRefs.current.set(e.id, ref);
                else swipeRefs.current.delete(e.id);
              }}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {undoEntry && (
        <Animated.View pointerEvents="box-none" style={[styles.undoWrap, { opacity: undoOpacity }]}>
          <View style={[styles.undoToast, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.undoLabel, { color: theme.text }]}>Entry deleted</Text>
            <TouchableOpacity onPress={handleUndo}>
              <Text style={[styles.undoBtn, { color: theme.accent }]}>Undo</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <LogForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      </Modal>
    </View>
  );
}

function migrateEntry(e: LogEntry & { type?: string }): LogEntry {
  if (!e.activity && e.type) {
    const known = ACTIVITIES.find((a) => a.toLowerCase() === e.type!.toLowerCase());
    return {
      ...e,
      activity: known ?? "Other",
      activityOther: known ? undefined : e.type,
    };
  }
  return { ...e, activity: e.activity ?? "Other" };
}

interface LogRowProps {
  entry: LogEntry;
  onPress: () => void;
  onDelete: () => void;
  registerRef: (ref: Swipeable | null) => void;
}

function LogRow({ entry, onPress, onDelete, registerRef }: LogRowProps) {
  const { theme } = useApp();
  const activityLabel = entry.activity === "Other" && entry.activityOther ? entry.activityOther : entry.activity;
  const dateLabel = formatRelativeDate(entry.date);
  const durationLabel = entry.duration ? `${entry.duration} min` : "";

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const translateX = dragX.interpolate({ inputRange: [-100, 0], outputRange: [0, 100], extrapolate: "clamp" });
    return (
      <View style={styles.swipeRight}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={registerRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        if (direction === "right") onDelete();
      }}
      rightThreshold={40}
      friction={1.5}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={styles.rowMain}>
          <View style={styles.rowTopLine}>
            <Text style={[styles.rowActivity, { color: theme.text }]} numberOfLines={1}>
              {activityLabel}
              {durationLabel ? <Text style={[styles.rowDuration, { color: theme.accent }]}>{"  · " + durationLabel}</Text> : null}
            </Text>
            <Text style={[styles.rowDate, { color: theme.textSecondary }]}>{dateLabel}</Text>
          </View>
          {entry.notes ? (
            <Text style={[styles.rowNotes, { color: theme.textSecondary }]} numberOfLines={1}>
              {entry.notes}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Swipeable>
  );
}

interface LogFormProps {
  initial: LogEntry | null;
  onClose: () => void;
  onSave: (entry: LogEntry) => void;
}

function LogForm({ initial, onClose, onSave }: LogFormProps) {
  const { theme } = useApp();
  const [activity, setActivity] = useState<Activity | "">((initial?.activity as Activity) ?? "");
  const [activityOther, setActivityOther] = useState(initial?.activityOther ?? "");
  const [date, setDate] = useState<Date>(initial ? new Date(initial.date) : new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [distance, setDistance] = useState(initial?.distanceKm ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const showDistance = activity === "Running" || activity === "Engine";
  const canSave = !!activity && duration.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const entry: LogEntry = {
      id: initial?.id ?? Date.now().toString(36),
      date: date.toISOString(),
      activity,
      activityOther: activity === "Other" ? activityOther.trim() || undefined : undefined,
      duration: duration.trim(),
      distanceKm: showDistance && distance.trim() ? distance.trim() : undefined,
      notes: notes.trim(),
    };
    onSave(entry);
  };

  return (
    <View style={[styles.modal, { backgroundColor: theme.background }]}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: theme.text }]}>{initial ? "Edit Workout" : "Log Workout"}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: theme.textSecondary }]}>ACTIVITY</Text>
        <View style={styles.activityWrap}>
          {ACTIVITIES.map((a) => (
            <TouchableOpacity
              key={a}
              style={[
                styles.activityPill,
                { borderColor: theme.border },
                activity === a && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={() => setActivity(a)}
            >
              <Text style={[styles.activityPillText, { color: activity === a ? "#fff" : theme.text }]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {activity === "Other" && (
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, marginTop: spacing.sm }]}
            placeholder="Specify activity"
            placeholderTextColor={theme.textSecondary}
            value={activityOther}
            onChangeText={setActivityOther}
          />
        )}

        <Text style={[styles.label, { color: theme.textSecondary }]}>DATE</Text>
        <TouchableOpacity
          style={[styles.dateBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
          onPress={() => setShowPicker((v) => !v)}
        >
          <Text style={[styles.dateText, { color: theme.text }]}>
            {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </Text>
          <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            themeVariant="dark"
            onChange={(_e, d) => {
              if (d) setDate(d);
            }}
          />
        )}

        <Text style={[styles.label, { color: theme.textSecondary }]}>DURATION</Text>
        <View style={styles.durationRow}>
          <NumericInputWithDone
            style={[styles.input, styles.durationInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            placeholder="e.g. 65"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            value={duration}
            onChangeText={setDuration}
          />
          <Text style={[styles.unitLabel, { color: theme.textSecondary }]}>min</Text>
        </View>

        {showDistance && (
          <>
            <Text style={[styles.label, { color: theme.textSecondary }]}>DISTANCE (KM)</Text>
            <NumericInputWithDone
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="optional"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              value={distance}
              onChangeText={setDistance}
            />
          </>
        )}

        <Text style={[styles.label, { color: theme.textSecondary }]}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.notesInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          placeholder="How did it go?"
          placeholderTextColor={theme.textSecondary}
          multiline
          value={notes}
          onChangeText={setNotes}
          inputAccessoryViewID={Platform.OS === "ios" ? KEYBOARD_DONE_ID : undefined}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: canSave ? 1 : 0.4 }]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnText}>{initial ? "Update" : "Save"}</Text>
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
      <DoneKeyboardToolbar />
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
  row: {
    minHeight: 72,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.sm,
    justifyContent: "center",
  },
  rowMain: {},
  rowTopLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  rowActivity: { fontSize: 15, fontWeight: "700", flexShrink: 1, paddingRight: spacing.sm },
  rowDuration: { fontSize: 14, fontWeight: "600" },
  rowDate: { fontSize: 12, fontWeight: "500" },
  rowNotes: { fontSize: 13 },
  swipeRight: { width: 100, justifyContent: "center" },
  deleteBtn: {
    width: 100,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  deleteText: { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 4 },
  undoWrap: { position: "absolute", bottom: spacing.md, left: 0, right: 0, alignItems: "center" },
  undoToast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.lg,
    minWidth: 240,
    justifyContent: "space-between",
  },
  undoLabel: { fontSize: 14, fontWeight: "500" },
  undoBtn: { fontSize: 14, fontWeight: "700" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, paddingTop: spacing.md },
  modalTitle: { fontSize: 22, fontWeight: "800" },
  form: { padding: spacing.lg },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderRadius: borderRadius.sm, padding: spacing.md - 2, fontSize: 15 },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  activityWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  activityPill: { paddingHorizontal: spacing.sm + 4, paddingVertical: 6, borderRadius: borderRadius.sm, borderWidth: 1 },
  activityPillText: { fontSize: 13, fontWeight: "600" },
  dateBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2, borderWidth: 1, borderRadius: borderRadius.sm },
  dateText: { fontSize: 15 },
  durationRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  durationInput: { flex: 1 },
  unitLabel: { fontSize: 14, fontWeight: "600" },
  saveBtn: { borderRadius: borderRadius.sm, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
