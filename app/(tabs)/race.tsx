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
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useApp } from "../../lib/context";
import { RACE_SEQUENCE, RaceSegment } from "../../constants/race";
import { spacing, borderRadius } from "../../constants/theme";
import {
  DivisionContext,
  StationSlug,
  getStationWeight,
} from "../../lib/divisions";
import {
  Scenario,
  SegmentOverride,
  ScenarioOverrides,
  loadScenarioOverrides,
  saveSegmentOverride,
  clearSegmentOverride,
  loadTopInput,
  saveTopInput,
  migrateBuildCIfNeeded,
} from "../../lib/raceOverrides";
import { formatMinSec, formatSeconds, parseTimeToSeconds } from "../../lib/timeFormat";
import { daysUntil } from "../../lib/dates";
import DoneKeyboardToolbar, { KEYBOARD_DONE_ID } from "../../components/DoneKeyboardToolbar";
import InfoModal from "../../components/InfoModal";

type Mode = Scenario;

const STATION_NAME_TO_SLUG: Record<string, StationSlug> = {
  "Sled Push": "sled_push",
  "Sled Pull": "sled_pull",
  "Farmers Carry": "farmers_carry",
  "Sandbag Lunges": "sandbag_lunges",
  "Wall Balls": "wall_balls",
};

const BANNER_DISMISSED_KEY = "hr_settings_race_banner_dismissed";
const TRANSITION_EST_SEC = 8 * 60;
const ALL_ORDERS = RACE_SEQUENCE.map((s) => s.order);
const STATION_ORDERS = RACE_SEQUENCE.filter((s) => s.kind === "station").map((s) => s.order);

const PREDICT_INFO_TITLE = "How Your Time Is Predicted";
const PREDICT_INFO_BODY =
  "We calculate your predicted finish time by:\n\n• Summing 8 × your average 1km run pace for all the runs\n• Summing your per-station times (or the running average if you're using blanket station time)\n• Adding a ~3-5 minute transition estimate between stations\n\nThe more accurate your per-station times, the more accurate your prediction. Tap any station row to enter a custom time.\n\nDefault station weights and run distances are based on your division in Settings.";

const GOAL_INFO_TITLE = "How Target Splits Are Calculated";
const GOAL_INFO_BODY =
  "We estimate your required splits using a 60/40 run-to-station ratio:\n\n• 60% of your goal time is distributed across the 8 km of running\n• 40% of your goal time is distributed across the 8 stations (average)\n• ~3-5 minutes are reserved for transitions between stations\n\nThese are rough targets to help you plan your race. Individual station times vary significantly based on your strengths — for example, strong rowers typically finish rowing faster than average, while wall balls often take longer for most athletes. Use per-station overrides in the race order list to adjust.\n\nDefault station weights and run distances are based on your division in Settings.";

export default function RaceScreen() {
  const { theme, settings } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("predict");

  const [paceInput, setPaceInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [paceErr, setPaceErr] = useState(false);
  const [goalErr, setGoalErr] = useState(false);

  const [predictOverrides, setPredictOverrides] = useState<ScenarioOverrides>({});
  const [goalOverrides, setGoalOverrides] = useState<ScenarioOverrides>({});

  const [editingOrder, setEditingOrder] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [predictInfoOpen, setPredictInfoOpen] = useState(false);
  const [goalInfoOpen, setGoalInfoOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        await migrateBuildCIfNeeded();
        const [predict, goal, paceVal, goalVal, banner] = await Promise.all([
          loadScenarioOverrides("predict", ALL_ORDERS),
          loadScenarioOverrides("goal", ALL_ORDERS),
          loadTopInput("predict"),
          loadTopInput("goal"),
          AsyncStorage.getItem(BANNER_DISMISSED_KEY),
        ]);
        if (cancelled) return;
        setPredictOverrides(predict);
        setGoalOverrides(goal);
        setPaceInput(paceVal);
        setGoalInput(goalVal);
        setBannerDismissed(banner === "true");
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const ctx: DivisionContext = useMemo(
    () => ({ format: settings.format, tier: settings.tier, gender: settings.gender }),
    [settings.format, settings.tier, settings.gender]
  );

  const activeOverrides = mode === "predict" ? predictOverrides : goalOverrides;
  const paceSec = useMemo(() => parseTimeToSeconds(paceInput), [paceInput]);
  const goalSec = useMemo(() => parseTimeToSeconds(goalInput), [goalInput]);

  const stationOverrideTimes: number[] = useMemo(() => {
    const out: number[] = [];
    for (const order of STATION_ORDERS) {
      const raw = activeOverrides[order]?.time;
      if (raw) {
        const s = parseTimeToSeconds(raw);
        if (s != null) out.push(s);
      }
    }
    return out;
  }, [activeOverrides]);

  const stationAvgFromOverrides: number | null = stationOverrideTimes.length
    ? stationOverrideTimes.reduce((a, b) => a + b, 0) / stationOverrideTimes.length
    : null;

  const goalRunPace = mode === "goal" && goalSec ? (goalSec * 0.6) / 8 : null;
  const goalStationAvg = mode === "goal" && goalSec ? (goalSec * 0.4) / 8 : null;

  const defaultSplitForRun = (): number | null => {
    if (mode === "predict") return paceSec;
    return goalRunPace;
  };
  const defaultSplitForStation = (): number | null => {
    if (mode === "predict") return stationAvgFromOverrides;
    return goalStationAvg;
  };

  // Display: returns the override only (no fallbacks). Used for the right
  // column on each station row, so non-overridden rows render "—".
  const displaySplitFor = (seg: RaceSegment): number | null => {
    const override = activeOverrides[seg.order]?.time;
    if (!override) return null;
    return parseTimeToSeconds(override);
  };

  // Total: returns override-or-fallback. Used only for PREDICTED FINISH /
  // mismatch math, never for the per-row display.
  const totalSplitFor = (seg: RaceSegment): number | null => {
    const fromOverride = displaySplitFor(seg);
    if (fromOverride != null) return fromOverride;
    return seg.kind === "run" ? defaultSplitForRun() : defaultSplitForStation();
  };

  const totalFinish = useMemo(() => {
    let any = false;
    let total = 0;
    for (const seg of RACE_SEQUENCE) {
      const s = totalSplitFor(seg);
      if (s == null) return null;
      any = true;
      total += s;
    }
    return any ? total + TRANSITION_EST_SEC : null;
  }, [activeOverrides, paceSec, goalRunPace, goalStationAvg, mode, stationAvgFromOverrides]);

  const goalTimeOverrideCount = useMemo(() => {
    let n = 0;
    for (const order of ALL_ORDERS) {
      if (goalOverrides[order]?.time) n++;
    }
    return n;
  }, [goalOverrides]);

  const goalMismatch = useMemo(() => {
    if (mode !== "goal" || goalSec == null || totalFinish == null) return null;
    if (goalTimeOverrideCount === 0) return null;
    const diff = totalFinish - goalSec;
    if (Math.abs(diff) < 30) return null;
    return diff;
  }, [mode, goalSec, totalFinish, goalTimeOverrideCount]);

  const onDismissBanner = async () => {
    setBannerDismissed(true);
    await AsyncStorage.setItem(BANNER_DISMISSED_KEY, "true");
  };

  const raceDays = settings.raceDate ? daysUntil(settings.raceDate) : null;
  const divisionSet = !!settings.format;
  const showOnboarding = !divisionSet && !bannerDismissed;

  const divisionLabel = divisionSet
    ? [
        settings.format,
        settings.format === "Individual" || settings.format === "Doubles" ? settings.tier : null,
        settings.gender,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const goToSettings = () => router.push("/settings");

  const onPaceChange = (v: string) => {
    setPaceInput(v);
    if (paceErr) setPaceErr(false);
  };
  const onPaceBlur = () => {
    const valid = paceInput === "" || parseTimeToSeconds(paceInput) != null;
    setPaceErr(!valid);
    if (valid) saveTopInput("predict", paceInput);
  };
  const onGoalChange = (v: string) => {
    setGoalInput(v);
    if (goalErr) setGoalErr(false);
  };
  const onGoalBlur = () => {
    const valid = goalInput === "" || parseTimeToSeconds(goalInput) != null;
    setGoalErr(!valid);
    if (valid) saveTopInput("goal", goalInput);
  };

  const onSaveOverride = async (order: number, next: SegmentOverride) => {
    await saveSegmentOverride(mode, order, next);
    const setter = mode === "predict" ? setPredictOverrides : setGoalOverrides;
    setter((m) => ({ ...m, [order]: next }));
    setEditingOrder(null);
  };

  const onResetOverride = async (order: number) => {
    await clearSegmentOverride(mode, order);
    const setter = mode === "predict" ? setPredictOverrides : setGoalOverrides;
    setter((m) => {
      const copy = { ...m };
      delete copy[order];
      return copy;
    });
    setEditingOrder(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.modeRow, { borderColor: theme.border }]}>
        <TouchableOpacity style={[styles.modeBtn, mode === "predict" && { backgroundColor: theme.accent }]} onPress={() => setMode("predict")}>
          <Text style={[styles.modeText, { color: mode === "predict" ? "#fff" : theme.textSecondary }]}>Target Time</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeBtn, mode === "goal" && { backgroundColor: theme.accent }]} onPress={() => setMode("goal")}>
          <Text style={[styles.modeText, { color: mode === "goal" ? "#fff" : theme.textSecondary }]}>Target Splits</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {showOnboarding ? (
          <View style={[styles.banner, { borderColor: theme.accent, backgroundColor: theme.accent + "12" }]}>
            <Text style={[styles.bannerText, { color: theme.text }]}>
              Set your division to see weights and times tailored to you.
            </Text>
            <View style={styles.bannerActions}>
              <TouchableOpacity onPress={goToSettings}>
                <Text style={[styles.bannerCta, { color: theme.accent }]}>Go to Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDismissBanner}>
                <Text style={[styles.bannerDismiss, { color: theme.textSecondary }]}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : divisionSet ? (
          <TouchableOpacity
            style={[styles.divisionRow, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={goToSettings}
          >
            <View>
              <Text style={[styles.divisionLabel, { color: theme.textSecondary }]}>DIVISION</Text>
              <Text style={[styles.divisionValue, { color: theme.text }]}>{divisionLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}

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

        {mode === "predict" ? (
          <>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>AVERAGE 1KM PACE</Text>
              <TouchableOpacity onPress={() => setPredictInfoOpen(true)} hitSlop={10} style={styles.labelInfo}>
                <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, borderColor: paceErr ? "#FF3B30" : theme.border, color: theme.text },
              ]}
              placeholder="e.g. 5:30"
              placeholderTextColor={theme.textTertiary}
              keyboardType="numbers-and-punctuation"
              value={paceInput}
              onChangeText={onPaceChange}
              onBlur={onPaceBlur}
              autoCorrect={false}
              autoCapitalize="none"
              inputAccessoryViewID={Platform.OS === "ios" ? KEYBOARD_DONE_ID : undefined}
            />
            {paceErr && <Text style={styles.inputError}>Use mm:ss (or h:mm:ss).</Text>}
            <Text style={[styles.helper, { color: theme.textSecondary }]}>Enter your target pace for each 1km run</Text>

            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>AVERAGE STATION TIME</Text>
              <TouchableOpacity onPress={() => setPredictInfoOpen(true)} hitSlop={10} style={styles.labelInfo}>
                <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.input,
                styles.displayInput,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
            >
              <Text
                style={[
                  styles.displayInputText,
                  {
                    color: stationAvgFromOverrides != null ? theme.text : theme.textTertiary,
                    fontStyle: stationAvgFromOverrides != null ? "italic" : "normal",
                  },
                ]}
              >
                {stationAvgFromOverrides != null ? formatMinSec(stationAvgFromOverrides) : ""}
              </Text>
            </View>
            <Text style={[styles.helper, { color: theme.textSecondary }]}>Enter time for each station below</Text>

            {totalFinish != null && (
              <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.accent }]}>
                <Text style={[styles.resultTitle, { color: theme.accent }]}>PREDICTED FINISH</Text>
                <Text style={[styles.resultTime, { color: theme.text }]}>{formatSeconds(totalFinish)}</Text>
                <Text style={[styles.resultBreakdown, { color: theme.textSecondary }]}>
                  Includes ~{TRANSITION_EST_SEC / 60}m transition estimate
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.goalExplainerRow}>
              <Text style={[styles.goalExplainer, { color: theme.textSecondary }]}>
                Enter your goal time and we'll calculate your target splits.
              </Text>
              <TouchableOpacity onPress={() => setGoalInfoOpen(true)} hitSlop={10} style={styles.labelInfo}>
                <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>TARGET FINISH TIME</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.inputBg, borderColor: goalErr ? "#FF3B30" : theme.border, color: theme.text },
              ]}
              placeholder="e.g. 1:15:00"
              placeholderTextColor={theme.textTertiary}
              keyboardType="numbers-and-punctuation"
              value={goalInput}
              onChangeText={onGoalChange}
              onBlur={onGoalBlur}
              autoCorrect={false}
              autoCapitalize="none"
              inputAccessoryViewID={Platform.OS === "ios" ? KEYBOARD_DONE_ID : undefined}
            />
            {goalErr && <Text style={styles.inputError}>Use mm:ss (or h:mm:ss).</Text>}

            {goalRunPace != null && goalStationAvg != null && (
              <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.accent }]}>
                <Text style={[styles.resultTitle, { color: theme.accent }]}>REQUIRED SPLITS</Text>
                <Text style={[styles.resultTime, { color: theme.text }]}>{formatSeconds(goalSec!)}</Text>
                <Text style={[styles.resultBreakdown, { color: theme.textSecondary }]}>
                  {formatMinSec(goalRunPace)}/km pace · {formatMinSec(goalStationAvg)}/station avg
                </Text>
              </View>
            )}

            {goalMismatch != null && (
              <View style={[styles.warnBanner, { backgroundColor: "#FF3B30" + "15", borderColor: "#FF3B30" }]}>
                <Ionicons name="warning-outline" size={16} color="#FF3B30" />
                <Text style={[styles.warnText, { color: theme.text }]}>
                  Your custom splits total {formatSeconds(totalFinish!)}; target is {formatSeconds(goalSec!)}. Adjust overrides or target.
                </Text>
              </View>
            )}
          </>
        )}

        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>RACE ORDER</Text>
        {RACE_SEQUENCE.map((seg) => {
          const slug = STATION_NAME_TO_SLUG[seg.name] ?? null;
          const baseWeight = slug && divisionSet ? getStationWeight(slug, ctx) : null;
          const ov = activeOverrides[seg.order];
          const overrideWeight = ov?.weight;
          const overrideReps = ov?.reps;
          const overrideTime = ov?.time;
          const displayWeight = overrideWeight ?? baseWeight?.primary ?? null;
          const displayReps =
            seg.reps != null
              ? Number(overrideReps ?? seg.reps)
              : baseWeight?.reps ?? null;
          const isOverridden = !!(overrideWeight || overrideReps || overrideTime);
          const split = displaySplitFor(seg);

          const distancePiece = seg.distance ?? (displayReps != null ? `${displayReps} reps` : "");
          const weightPiece = displayWeight ? ` · ${displayWeight}` : "";
          const subtitle = `${distancePiece}${weightPiece}`.trim();

          return (
            <Pressable
              key={seg.order}
              onPress={() => setEditingOrder(seg.order)}
              style={({ pressed }) => [
                styles.stationRow,
                { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View style={[styles.stationNum, { backgroundColor: theme.accent + "20" }]}>
                <Text style={[styles.stationNumText, { color: theme.accent }]}>{seg.order}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stationName, { color: theme.text }]}>{seg.name}</Text>
                <Text style={[styles.stationDist, { color: theme.textSecondary }]}>{subtitle || "—"}</Text>
              </View>
              <Text style={[styles.stationSplit, { color: split != null ? theme.accent : theme.textTertiary }]}>
                {split != null ? formatMinSec(split) : "—"}
              </Text>
              {isOverridden && <Ionicons name="pencil" size={11} color={theme.accent} style={styles.pencil} />}
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>
          );
        })}
        <View style={{ height: 60 }} />
      </ScrollView>

      {editingOrder != null && (
        <SegmentEditModal
          seg={RACE_SEQUENCE.find((s) => s.order === editingOrder)!}
          ctx={ctx}
          divisionSet={divisionSet}
          existing={activeOverrides[editingOrder] ?? {}}
          theme={theme}
          onSave={(v) => onSaveOverride(editingOrder, v)}
          onReset={() => onResetOverride(editingOrder)}
          onClose={() => setEditingOrder(null)}
        />
      )}

      <InfoModal
        visible={predictInfoOpen}
        title={PREDICT_INFO_TITLE}
        body={PREDICT_INFO_BODY}
        onClose={() => setPredictInfoOpen(false)}
      />
      <InfoModal
        visible={goalInfoOpen}
        title={GOAL_INFO_TITLE}
        body={GOAL_INFO_BODY}
        onClose={() => setGoalInfoOpen(false)}
      />

      <DoneKeyboardToolbar />
    </View>
  );
}

interface SegmentEditProps {
  seg: RaceSegment;
  ctx: DivisionContext;
  divisionSet: boolean;
  existing: SegmentOverride;
  theme: any;
  onSave: (v: SegmentOverride) => void;
  onReset: () => void;
  onClose: () => void;
}

function SegmentEditModal({ seg, ctx, divisionSet, existing, theme, onSave, onReset, onClose }: SegmentEditProps) {
  const slug = STATION_NAME_TO_SLUG[seg.name] ?? null;
  const showWeight = !!slug;
  const showReps = slug === "wall_balls";

  const [weight, setWeight] = useState(existing.weight ?? "");
  const [reps, setReps] = useState(existing.reps ?? "");
  const [time, setTime] = useState(existing.time ?? "");
  const [timeErr, setTimeErr] = useState(false);

  const baseWeightObj = slug && divisionSet ? getStationWeight(slug, ctx) : null;
  const baseWeightDisplay = baseWeightObj?.primary ?? "—";
  const baseReps =
    slug === "wall_balls"
      ? (ctx.gender === "Female" ? 75 : 100)
      : seg.reps ?? null;

  const MODAL_DONE_ID = "hr-done-toolbar-edit-station";

  const handleSave = () => {
    if (time && parseTimeToSeconds(time) == null) {
      setTimeErr(true);
      return;
    }
    Keyboard.dismiss();
    onSave({
      weight: showWeight ? weight.trim() || undefined : undefined,
      reps: showReps ? reps.trim() || undefined : undefined,
      time: time.trim() || undefined,
    });
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Edit {seg.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {showWeight && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>WEIGHT</Text>
              <View style={styles.unitRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.unitInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                  ]}
                  placeholder={baseWeightDisplay === "—" ? "e.g. 152" : baseWeightDisplay.replace(/kg/gi, "").trim()}
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numbers-and-punctuation"
                  value={weight}
                  onChangeText={setWeight}
                  autoCorrect={false}
                  autoCapitalize="none"
                  inputAccessoryViewID={Platform.OS === "ios" ? MODAL_DONE_ID : undefined}
                />
                <Text style={[styles.unitLabel, { color: theme.textSecondary }]}>kg</Text>
              </View>
              <Text style={[styles.helpText, { color: theme.textTertiary }]}>Default: {baseWeightDisplay}</Text>
            </>
          )}

          <Text style={[styles.label, { color: theme.textSecondary, marginTop: showWeight ? spacing.md : 0 }]}>
            PREDICTED TIME (mm:ss)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.inputBg, borderColor: timeErr ? "#FF3B30" : theme.border, color: theme.text },
            ]}
            placeholder={seg.kind === "run" ? "e.g. 5:30" : "e.g. 4:00"}
            placeholderTextColor={theme.textTertiary}
            keyboardType="numbers-and-punctuation"
            value={time}
            onChangeText={(v) => {
              setTime(v);
              if (timeErr) setTimeErr(false);
            }}
            autoCorrect={false}
            autoCapitalize="none"
            inputAccessoryViewID={Platform.OS === "ios" ? MODAL_DONE_ID : undefined}
          />
          {timeErr && <Text style={styles.inputError}>Use mm:ss format.</Text>}
          <Text style={[styles.helpText, { color: theme.textTertiary }]}>
            Falls back to the average at the top of the page when empty.
          </Text>

          {showReps && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary, marginTop: spacing.md }]}>REPS</Text>
              <View style={styles.unitRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.unitInput,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                  ]}
                  placeholder={baseReps != null ? String(baseReps) : "e.g. 100"}
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="number-pad"
                  value={reps}
                  onChangeText={setReps}
                  inputAccessoryViewID={Platform.OS === "ios" ? MODAL_DONE_ID : undefined}
                />
                <Text style={[styles.unitLabel, { color: theme.textSecondary }]}>reps</Text>
              </View>
              <Text style={[styles.helpText, { color: theme.textTertiary }]}>
                Default: {baseReps ?? "—"} reps
              </Text>
            </>
          )}

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: theme.border }]}
            onPress={() =>
              Alert.alert("Reset to default?", "Clear your custom values for this row.", [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: onReset },
              ])
            }
          >
            <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>Reset to Default</Text>
          </TouchableOpacity>
        </ScrollView>
        <DoneKeyboardToolbar nativeID={MODAL_DONE_ID} />
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
  divisionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  divisionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  divisionValue: { fontSize: 15, fontWeight: "600" },
  labelRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.xs, marginTop: spacing.md },
  labelInfo: { marginLeft: 6, padding: 2, marginTop: spacing.md - 2 },
  input: { borderWidth: 1, borderRadius: borderRadius.sm, padding: spacing.md - 2, fontSize: 16 },
  inputError: { fontSize: 11, color: "#FF3B30", marginTop: 4 },
  displayInput: { justifyContent: "center" },
  displayInputText: { fontSize: 16 },
  helper: { fontSize: 13, fontStyle: "italic", marginTop: 4 },
  goalExplainerRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm, marginBottom: spacing.xs },
  goalExplainer: { flexShrink: 1, fontSize: 13, fontStyle: "italic" },
  resultCard: { borderRadius: borderRadius.md, padding: spacing.lg, marginTop: spacing.lg, borderWidth: 1, alignItems: "center" },
  resultTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: spacing.sm },
  resultTime: { fontSize: 36, fontWeight: "800" },
  resultBreakdown: { fontSize: 12, marginTop: spacing.sm, textAlign: "center" },
  warnBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.sm + 4,
    marginTop: spacing.sm,
  },
  warnText: { flex: 1, fontSize: 12, lineHeight: 17 },
  sectionHeader: { fontSize: 12, fontWeight: "700", letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.sm },
  stationRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm + 4, borderBottomWidth: 0.5, gap: spacing.md },
  stationNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stationNumText: { fontSize: 13, fontWeight: "800" },
  stationName: { fontSize: 15, fontWeight: "600" },
  stationDist: { fontSize: 12, marginTop: 1 },
  stationSplit: { fontSize: 14, fontWeight: "700", minWidth: 54, textAlign: "right" },
  pencil: { marginLeft: -6 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, paddingTop: spacing.md },
  modalTitle: { fontSize: 22, fontWeight: "800" },
  form: { padding: spacing.lg },
  unitRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  unitInput: { flex: 1 },
  unitLabel: { fontSize: 15, fontWeight: "600" },
  helpText: { fontSize: 11, marginTop: 4 },
  saveBtn: { borderRadius: borderRadius.sm, paddingVertical: 16, alignItems: "center", marginTop: spacing.lg },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  resetBtn: { borderRadius: borderRadius.sm, paddingVertical: 14, alignItems: "center", marginTop: spacing.sm, borderWidth: 1 },
  resetBtnText: { fontSize: 14, fontWeight: "600" },
});
