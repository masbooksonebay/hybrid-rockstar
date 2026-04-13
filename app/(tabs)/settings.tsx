import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../lib/context";
import { DIVISIONS, GENDERS } from "../../constants/hyrox";
import { spacing, borderRadius } from "../../constants/theme";

export default function SettingsScreen() {
  const { settings, theme, updateSettings } = useApp();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Profile</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Division</Text>
            <View style={styles.pills}>
              {DIVISIONS.map((d) => (
                <TouchableOpacity key={d} style={[styles.pill, settings.division === d && { backgroundColor: theme.accent }]} onPress={() => updateSettings({ division: d })}>
                  <Text style={[styles.pillText, { color: settings.division === d ? "#fff" : theme.textSecondary }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Gender</Text>
            <View style={styles.pills}>
              {GENDERS.map((g) => (
                <TouchableOpacity key={g} style={[styles.pill, settings.gender === g && { backgroundColor: theme.accent }]} onPress={() => updateSettings({ gender: g })}>
                  <Text style={[styles.pillText, { color: settings.gender === g ? "#fff" : theme.textSecondary }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
            <Switch value={settings.darkMode} onValueChange={(v) => updateSettings({ darkMode: v })} trackColor={{ true: theme.accent }} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Units</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Unit System</Text>
            <View style={styles.pills}>
              {(["imperial", "metric"] as const).map((u) => (
                <TouchableOpacity key={u} style={[styles.pill, settings.units === u && { backgroundColor: theme.accent }]} onPress={() => updateSettings({ units: u })}>
                  <Text style={[styles.pillText, { color: settings.units === u ? "#fff" : theme.textSecondary }]}>{u === "imperial" ? "Imperial" : "Metric"}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Feedback</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border }]}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Rate the App</Text>
            <Ionicons name="star-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Send Feedback</Text>
            <Ionicons name="mail-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.version, { color: theme.textSecondary }]}>Hybrid Rockstar v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.sm, paddingLeft: spacing.xs },
  card: { borderRadius: borderRadius.md, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2, borderBottomWidth: 0 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  pill: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: "600" },
  version: { textAlign: "center", fontSize: 12, marginTop: spacing.md },
});
