import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../lib/context";
import { STATIONS } from "../../constants/hyrox";
import { spacing, borderRadius } from "../../constants/theme";

export default function RaceScreen() {
  const { theme, settings } = useApp();
  const [mode, setMode] = useState<"predict" | "goal">("predict");
  const [avgPace, setAvgPace] = useState(""); // min per km
  const [avgStation, setAvgStation] = useState(""); // min per station
  const [goalTime, setGoalTime] = useState(""); // total minutes

  // Predict mode calc
  const paceMin = parseFloat(avgPace);
  const stationMin = parseFloat(avgStation);
  const runTotal = !isNaN(paceMin) ? paceMin * 8 : 0;
  const stationTotal = !isNaN(stationMin) ? stationMin * 8 : 0;
  const transitionEst = 8; // ~1 min per transition
  const predictedTotal = runTotal + stationTotal + transitionEst;

  // Goal mode calc
  const goalMin = parseFloat(goalTime);
  const reqPace = goalMin > 0 ? ((goalMin - transitionEst) * 0.45 / 8) : 0; // 45% to running
  const reqStation = goalMin > 0 ? ((goalMin - transitionEst) * 0.55 / 8) : 0; // 55% to stations

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = Math.floor(min % 60);
    const s = Math.round((min % 1) * 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.modeRow, { borderColor: theme.border }]}>
        <TouchableOpacity style={[styles.modeBtn, mode === "predict" && { backgroundColor: theme.accent }]} onPress={() => setMode("predict")}>
          <Text style={[styles.modeText, { color: mode === "predict" ? "#fff" : theme.textSecondary }]}>Predict My Time</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeBtn, mode === "goal" && { backgroundColor: theme.accent }]} onPress={() => setMode("goal")}>
          <Text style={[styles.modeText, { color: mode === "goal" ? "#fff" : theme.textSecondary }]}>Goal Time Planner</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.divLabel, { color: theme.textSecondary }]}>{settings.division} {settings.gender}</Text>

        {mode === "predict" ? (
          <>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Average 1km Pace (minutes)</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="e.g. 5.5" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={avgPace} onChangeText={setAvgPace} />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Average Station Time (minutes)</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="e.g. 4" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={avgStation} onChangeText={setAvgStation} />

            {runTotal > 0 && stationTotal > 0 && (
              <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.accent }]}>
                <Text style={[styles.resultTitle, { color: theme.accent }]}>PREDICTED FINISH</Text>
                <Text style={[styles.resultTime, { color: theme.text }]}>{formatTime(predictedTotal)}</Text>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownText, { color: theme.textSecondary }]}>Running: {formatTime(runTotal)}</Text>
                  <Text style={[styles.breakdownText, { color: theme.textSecondary }]}>Stations: {formatTime(stationTotal)}</Text>
                  <Text style={[styles.breakdownText, { color: theme.textSecondary }]}>Transitions: ~{transitionEst} min</Text>
                </View>
                <Text style={[styles.tip, { color: theme.accent }]}>
                  {stationTotal > runTotal ? "Focus area: Station speed — your stations are slower than your runs." : "Focus area: Run speed — your runs are slower than your stations."}
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Target Finish Time (minutes)</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]} placeholder="e.g. 75" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={goalTime} onChangeText={setGoalTime} />

            {goalMin > 0 && (
              <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.accent }]}>
                <Text style={[styles.resultTitle, { color: theme.accent }]}>REQUIRED SPLITS</Text>
                <Text style={[styles.resultTime, { color: theme.text }]}>Goal: {formatTime(goalMin)}</Text>
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownText, { color: theme.textSecondary }]}>Avg 1km pace: {formatTime(reqPace)}</Text>
                  <Text style={[styles.breakdownText, { color: theme.textSecondary }]}>Avg station time: {formatTime(reqStation)}</Text>
                  <Text style={[styles.breakdownText, { color: theme.textSecondary }]}>Transition budget: ~{transitionEst} min</Text>
                </View>
                <Text style={[styles.tip, { color: theme.accent }]}>
                  {goalMin < 60 ? "Ambitious target. Requires elite fitness across all stations." :
                   goalMin < 80 ? "Competitive target. Consistent pacing is key." :
                   "Achievable with solid training. Focus on not walking the runs."}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Station reference */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>RACE ORDER</Text>
        {STATIONS.map((s, i) => (
          <View key={s.name} style={[styles.stationRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.stationNum, { backgroundColor: theme.accent + "20" }]}>
              <Text style={[styles.stationNumText, { color: theme.accent }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stationName, { color: theme.text }]}>{s.name}</Text>
              <Text style={[styles.stationDist, { color: theme.textSecondary }]}>{s.distance || `${s.reps} reps`}</Text>
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modeRow: { flexDirection: "row", marginHorizontal: spacing.md, marginTop: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, overflow: "hidden" },
  modeBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.sm + 4 },
  modeText: { fontSize: 13, fontWeight: "700" },
  content: { padding: spacing.md },
  divLabel: { fontSize: 12, fontWeight: "600", textAlign: "center", marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderRadius: borderRadius.sm, padding: spacing.md - 2, fontSize: 16 },
  resultCard: { borderRadius: borderRadius.md, padding: spacing.lg, marginTop: spacing.lg, borderWidth: 1, alignItems: "center" },
  resultTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: spacing.sm },
  resultTime: { fontSize: 36, fontWeight: "800" },
  breakdownRow: { marginTop: spacing.md, gap: 4 },
  breakdownText: { fontSize: 13, textAlign: "center" },
  tip: { fontSize: 13, fontWeight: "600", marginTop: spacing.md, textAlign: "center" },
  sectionHeader: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.sm },
  stationRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm + 4, borderBottomWidth: 0.5, gap: spacing.md },
  stationNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stationNumText: { fontSize: 13, fontWeight: "800" },
  stationName: { fontSize: 15, fontWeight: "600" },
  stationDist: { fontSize: 12 },
});
