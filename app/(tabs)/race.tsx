import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useApp } from "../../lib/context";
import { RACE_SEQUENCE } from "../../constants/race";
import { spacing, borderRadius } from "../../constants/theme";
import {
  DivisionContext,
  StationSlug,
  STATION_LABELS,
  getStationWeight,
} from "../../lib/divisions";
import {
  StationOverride,
  clearOverride,
  loadAllOverrides,
  saveOverride,
} from "../../lib/stationOverrides";
import { formatMinSec, formatSeconds, parseTimeToSeconds } from "../../lib/timeFormat";
import { daysUntil } from "../../lib/dates";
import { Format, Tier } from "../../lib/store";

type Mode = "predict" | "goal";

const STATION_NAME_TO_SLUG: Record<string, StationSlug> = {
  "Sled Push": "sled_push",
  "Sled Pull": "sled_pull",
  "Farmers Carry": "farmers_carry",
  "Sandbag Lunges": "sandbag_lunges",
  "Wall Balls": "wall_balls",
};

const ALL_SLUGS: StationSlug[] = ["sled_push", "sled_pull", "farmers_carry", "sandbag_lunges", "wall_balls"];

const DIVISION_OPTIONS: { format: Format; tier: Tier | null; label: string }[] = [
  { format: "Individual", tier: "Open", label: "Individual · Open" },
  { format: "Individual", tier: "Pro", label: "Individual · Pro" },
  { format: "Doubles", tier: "Open", label: "Doubles · Open" },
  { format: "Doubles", tier: "Pro", label: "Doubles · Pro" },
  { format: "Mixed Doubles", tier: null, label: "Mixed Doubles" },
  { format: "Relay", tier: null, label: "Relay" },
];

const BANNER_DISMISSED_KEY = "hr_settings_race_banner_dismissed";

const TRANSITION_EST_SEC = 8 * 60;

export default function RaceScreen() {
  const { theme, settings, updateSettings } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("predict");
  const [paceInput, setPaceInput] = useState("");
  const [stationInput, setStationInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [paceErr, setPaceErr] = useState(false);
  const [stationErr, setStationErr] = useState(false);
  const [goalErr, setGoalErr] = useState(false);
  const [overrides, setOverrides] = useState<Record<StationSlug, StationOverride>>(() => ({
    sled_push: {},
    sled_pull: {},
    farmers_carry: {},
    sandbag_lunges: {},
    wall_balls: {},
  }));
  const [editingSlug, setEditingSlug] = useState<StationSlug | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [divisionPickerOpen, setDivisionPickerOpen] = useState(false);

  useEffect(() => {
    loadAllOverrides(ALL_SLUGS).then(setOverrides);
    AsyncStorage.getItem(BANNER_DISMISSED_KEY).then((v) => {
      if (v === "true") setBannerDismissed(true);
    });
  }, []);

  const ctx: DivisionContext = useMemo(
    () => ({ format: settings.format, tier: settings.tier, gender: settings.gender }),
    [settings.format, settings.tier, settings.gender]
  );

  const paceSec = useMemo(() => parseTimeToSeconds(paceInput), [paceInput]);
  const stationSec = useMemo(() => parseTimeToSeconds(stationInput), [stationInput]);
  const goalSec = useMemo(() => parseTimeToSeconds(goalInput), [goalInput]);

  const predictTotal =
    mode === "predict" && paceSec != null && stationSec != null
      ? paceSec * 8 + stationSec * 8 + TRANSITION_EST_SEC
      : null;

  const goalRunPace = mode === "goal" && goalSec ? (goalSec * 0.6) / 8 : null;
  const goalStationAvg = mode === "goal" && goalSec ? (goalSec * 0.4) / 8 : null;

  const splitFor = (kind: "run" | "station"): number | null => {
    if (mode === "predict") {
      return kind === "run" ? paceSec : stationSec;
    }
    return kind === "run" ? goalRunPace : goalStationAvg;
  };

  const onSaveOverride = useCallback(async (slug: StationSlug, next: StationOverride) => {
    await saveOverride(slug, next);
    setOverrides((m) => ({ ...m, [slug]: next }));
    setEditingSlug(null);
  }, []);

  const onClearOverride = useCallback(async (slug: StationSlug) => {
    await clearOverride(slug);
    setOverrides((m) => ({ ...m, [slug]: {} }));
    setEditingSlug(null);
  }, []);

  const onDismissBanner = async () => {
    setBannerDismissed(true);
    await AsyncStorage.setItem(BANNER_DISMISSED_KEY, "true");
  };

  const raceDays = settings.raceDate ? daysUntil(settings.raceDate) : null;
  const showOnboarding = !settings.format && !bannerDismissed;

  const formatLabel =
    settings.format
      ? settings.format === "Individual" || settings.format === "Doubles"
        ? `${settings.format} · ${settings.tier ?? "Open"}${settings.gender ? " · " + settings.gender : ""}`
        : `${settings.format}${settings.gender ? " · " + settings.gender : ""}`
      : "Set division";

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

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {showOnboarding && (
          <View style={[styles.banner, { borderColor: theme.accent, backgroundColor: theme.accent + "12" }]}>
            <Text style={[styles.bannerText, { color: theme.text }]}>
              Set your division to see weights and times tailored to you.
            </Text>
            <View style={styles.bannerActions}>
              <TouchableOpacity onPress={() => router.push("/settings")}>
                <Text style={[styles.bannerCta, { color: theme.accent }]}>Go to Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDismissBanner}>
                <Text style={[styles.bannerDismiss, { color: theme.textSecondary }]}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {raceDays !== null && (
          <View style={[styles.countdownBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="calendar-outline" size={16} color={theme.accent} />
            <Text style={[styles.countdownText, { color: theme.text }]}>
              {raceDays === 0
                ? "Race today!"
                : raceDays > 0
                ? `${raceDays} day${raceDays === 1 ? "" : "s"} until your next race`
                : `Race was ${Math.abs(raceDays)} day${Math.abs(raceDays) === 1 ? "" : "s"} ago — update your race date in Settings`}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.divisionPill, { borderColor: theme.border, backgroundColor: theme.card }]}
          onPress={() => setDivisionPickerOpen(true)}
        >
          <Text style={[styles.divisionPillLabel, { color: theme.textSecondary }]}>DIVISION</Text>
          <View style={styles.divisionPillValueRow}>
            <Text style={[styles.divisionPillValue, { color: settings.format ? theme.text : theme.textTertiary }]}>
              {formatLabel}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

        {mode === "predict" ? (
          <>
            <LabeledInput
              theme={theme}
              label="AVERAGE 1KM PACE"
              value={paceInput}
              onChange={setPaceInput}
              onBlur={() => setPaceErr(paceInput.length > 0 && parseTimeToSeconds(paceInput) == null)}
              placeholder="e.g. 5:30"
              error={paceErr}
            />
            <LabeledInput
              theme={theme}
              label="AVERAGE STATION TIME"
              value={stationInput}
              onChange={setStationInput}
              onBlur={() => setStationErr(stationInput.length > 0 && parseTimeToSeconds(stationInput) == null)}
              placeholder="e.g. 4:00"
              error={stationErr}
            />

            {predictTotal != null && (
              <ResultCard theme={theme}>
                <Text style={[styles.resultTitle, { color: theme.accent }]}>PREDICTED FINISH</Text>
                <Text style={[styles.resultTime, { color: theme.text }]}>{formatSeconds(predictTotal)}</Text>
                <Text style={[styles.resultBreakdown, { color: theme.textSecondary }]}>
                  Run {formatSeconds(paceSec! * 8)} · Stations {formatSeconds(stationSec! * 8)} · Transitions ~{TRANSITION_EST_SEC / 60}m
                </Text>
              </ResultCard>
            )}
          </>
        ) : (
          <>
            <LabeledInput
              theme={theme}
              label="TARGET FINISH TIME"
              value={goalInput}
              onChange={setGoalInput}
              onBlur={() => setGoalErr(goalInput.length > 0 && parseTimeToSeconds(goalInput) == null)}
              placeholder="e.g. 1:15:00"
              error={goalErr}
            />

            {goalRunPace != null && goalStationAvg != null && (
              <ResultCard theme={theme}>
                <Text style={[styles.resultTitle, { color: theme.accent }]}>REQUIRED SPLITS</Text>
                <Text style={[styles.resultTime, { color: theme.text }]}>{formatSeconds(goalSec!)}</Text>
                <Text style={[styles.resultBreakdown, { color: theme.textSecondary }]}>
                  {formatMinSec(goalRunPace)}/km pace · {formatMinSec(goalStationAvg)}/station avg
                </Text>
              </ResultCard>
            )}
          </>
        )}

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>RACE ORDER</Text>
        {RACE_SEQUENCE.map((seg) => {
          const slug = STATION_NAME_TO_SLUG[seg.name] ?? null;
          const baseWeight = slug ? getStationWeight(slug, ctx) : null;
          const ov = slug ? overrides[slug] : undefined;
          const overrideWeight = ov?.weight;
          const overrideReps = ov?.reps;
          const displayWeight = overrideWeight ?? baseWeight?.primary ?? null;
          const displayReps =
            seg.reps != null
              ? Number(overrideReps ?? seg.reps)
              : baseWeight?.reps ?? null;
          const isOverridden = !!(overrideWeight || overrideReps);
          const split = splitFor(seg.kind);

          const distancePiece = seg.distance ?? (displayReps != null ? `${displayReps} reps` : "");
          const weightPiece = displayWeight ? ` · ${displayWeight}` : "";
          const subtitle = `${distancePiece}${weightPiece}`.trim();

          const tappable = !!slug && !!settings.format;

          const Inner = (
            <>
              <View style={[styles.stationNum, { backgroundColor: theme.accent + "20" }]}>
                <Text style={[styles.stationNumText, { color: theme.accent }]}>{seg.order}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stationName, { color: theme.text }]}>{seg.name}</Text>
                <View style={styles.stationSubRow}>
                  <Text style={[styles.stationDist, { color: theme.textSecondary }]}>{subtitle || "—"}</Text>
                  {isOverridden && <Ionicons name="pencil" size={11} color={theme.accent} style={{ marginLeft: 4 }} />}
                </View>
              </View>
              <Text style={[styles.stationSplit, { color: split != null ? theme.accent : theme.textTertiary }]}>
                {split != null ? formatMinSec(split) : "—"}
              </Text>
            </>
          );

          return tappable ? (
            <Pressable
              key={seg.order}
              onPress={() => slug && setEditingSlug(slug)}
              style={({ pressed }) => [
                styles.stationRow,
                { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              {Inner}
            </Pressable>
          ) : (
            <View key={seg.order} style={[styles.stationRow, { borderBottomColor: theme.border }]}>
              {Inner}
            </View>
          );
        })}
        <View style={{ height: 60 }} />
      </ScrollView>

      <DivisionPickerModal
        visible={divisionPickerOpen}
        current={settings.format}
        currentTier={settings.tier}
        theme={theme}
        onPick={(opt) => {
          updateSettings({ format: opt.format, tier: opt.tier });
          setDivisionPickerOpen(false);
          if (showOnboarding) onDismissBanner();
        }}
        onClose={() => setDivisionPickerOpen(false)}
      />

      {editingSlug && (
        <OverrideModal
          slug={editingSlug}
          base={getStationWeight(editingSlug, ctx)}
          baseReps={editingSlug === "wall_balls" ? (ctx.gender === "Female" ? 75 : 100) : null}
          override={overrides[editingSlug]}
          theme={theme}
          onSave={(next) => onSaveOverride(editingSlug, next)}
          onReset={() => onClearOverride(editingSlug)}
          onClose={() => setEditingSlug(null)}
        />
      )}
    </View>
  );
}

interface LabeledInputProps {
  theme: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder: string;
  error: boolean;
}

function LabeledInput({ theme, label, value, onChange, onBlur, placeholder, error }: LabeledInputProps) {
  return (
    <>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBg, borderColor: error ? "#FF3B30" : theme.border, color: theme.text },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        keyboardType="numbers-and-punctuation"
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {error && <Text style={styles.inputError}>Use mm:ss (or h:mm:ss).</Text>}
    </>
  );
}

function ResultCard({ theme, children }: { theme: any; children: React.ReactNode }) {
  return (
    <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.accent }]}>{children}</View>
  );
}

interface DivisionPickerProps {
  visible: boolean;
  current: Format | null;
  currentTier: Tier | null;
  theme: any;
  onPick: (opt: { format: Format; tier: Tier | null }) => void;
  onClose: () => void;
}

function DivisionPickerModal({ visible, current, currentTier, theme, onPick, onClose }: DivisionPickerProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Select Division</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          {DIVISION_OPTIONS.map((opt) => {
            const active = current === opt.format && currentTier === opt.tier;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[styles.optionRow, { borderBottomColor: theme.border }]}
                onPress={() => onPick(opt)}
              >
                <Text style={[styles.optionText, { color: theme.text }]}>{opt.label}</Text>
                {active && <Ionicons name="checkmark" size={20} color={theme.accent} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

interface OverrideModalProps {
  slug: StationSlug;
  base: { primary: string; reps?: number } | null;
  baseReps: number | null;
  override: StationOverride | undefined;
  theme: any;
  onSave: (next: StationOverride) => void;
  onReset: () => void;
  onClose: () => void;
}

function OverrideModal({ slug, base, baseReps, override, theme, onSave, onReset, onClose }: OverrideModalProps) {
  const [weight, setWeight] = useState(override?.weight ?? "");
  const [reps, setReps] = useState(override?.reps ?? "");
  const showReps = slug === "wall_balls";

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Edit {STATION_LABELS[slug]}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>WEIGHT</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            placeholder={base?.primary ?? "e.g. 152kg"}
            placeholderTextColor={theme.textTertiary}
            value={weight}
            onChangeText={setWeight}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.helpText, { color: theme.textTertiary }]}>
            Default: {base?.primary ?? "—"}
          </Text>

          {showReps && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary, marginTop: spacing.md }]}>REPS</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder={baseReps != null ? String(baseReps) : "e.g. 100"}
                placeholderTextColor={theme.textTertiary}
                keyboardType="number-pad"
                value={reps}
                onChangeText={setReps}
              />
              <Text style={[styles.helpText, { color: theme.textTertiary }]}>
                Default: {baseReps ?? "—"} reps
              </Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.accent }]}
            onPress={() =>
              onSave({
                weight: weight.trim() || undefined,
                reps: showReps ? (reps.trim() || undefined) : undefined,
              })
            }
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: theme.border }]}
            onPress={() =>
              Alert.alert("Reset to default?", "Clear your custom value for this station.", [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: onReset },
              ])
            }
          >
            <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>Reset to Default</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modeRow: { flexDirection: "row", marginHorizontal: spacing.md, marginTop: spacing.sm, borderRadius: borderRadius.sm, borderWidth: 1, overflow: "hidden" },
  modeBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.sm + 4 },
  modeText: { fontSize: 13, fontWeight: "700" },
  content: { padding: spacing.md },
  banner: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  bannerText: { fontSize: 14, lineHeight: 19, marginBottom: spacing.sm },
  bannerActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bannerCta: { fontSize: 14, fontWeight: "700" },
  bannerDismiss: { fontSize: 13, fontWeight: "500" },
  countdownBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, marginBottom: spacing.md },
  countdownText: { fontSize: 13, fontWeight: "600", flex: 1 },
  divisionPill: { borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, marginBottom: spacing.md },
  divisionPillLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  divisionPillValueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  divisionPillValue: { fontSize: 15, fontWeight: "600" },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.xs, marginTop: spacing.md },
  input: { borderWidth: 1, borderRadius: borderRadius.sm, padding: spacing.md - 2, fontSize: 16 },
  inputError: { fontSize: 11, color: "#FF3B30", marginTop: 4 },
  resultCard: { borderRadius: borderRadius.md, padding: spacing.lg, marginTop: spacing.lg, borderWidth: 1, alignItems: "center" },
  resultTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: spacing.sm },
  resultTime: { fontSize: 36, fontWeight: "800" },
  resultBreakdown: { fontSize: 12, marginTop: spacing.sm, textAlign: "center" },
  sectionHeader: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.sm },
  stationRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm + 4, borderBottomWidth: 0.5, gap: spacing.md },
  stationNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stationNumText: { fontSize: 13, fontWeight: "800" },
  stationName: { fontSize: 15, fontWeight: "600" },
  stationSubRow: { flexDirection: "row", alignItems: "center", marginTop: 1 },
  stationDist: { fontSize: 12 },
  stationSplit: { fontSize: 14, fontWeight: "700", minWidth: 60, textAlign: "right" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, paddingTop: spacing.md },
  modalTitle: { fontSize: 22, fontWeight: "800" },
  modalScroll: { paddingBottom: spacing.lg },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  optionText: { fontSize: 15 },
  form: { padding: spacing.lg },
  helpText: { fontSize: 11, marginTop: 4 },
  saveBtn: { borderRadius: borderRadius.sm, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  resetBtn: { borderRadius: borderRadius.sm, paddingVertical: 14, alignItems: "center", marginTop: spacing.sm, borderWidth: 1 },
  resetBtnText: { fontSize: 14, fontWeight: "600" },
});
