import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../lib/context";
import { spacing, borderRadius, Theme } from "../../constants/theme";
import {
  HeaderRow,
  PrimaryButton,
  SecondaryButton,
} from "../../components/onboarding/Chrome";

const MIN_MIN = 2;
const MAX_MIN = 12;
const DEFAULT_MIN = 5;
const DEFAULT_SEC = 0;

// 5-second granularity on the seconds wheel — 12 values vs. 60 — keeps the
// list short enough to scroll naturally without sacrificing useful precision
// for 1km pace.
const SECOND_STEP = 5;
const MINUTES = Array.from({ length: MAX_MIN - MIN_MIN + 1 }, (_, i) => MIN_MIN + i);
const SECONDS = Array.from({ length: 60 / SECOND_STEP }, (_, i) => i * SECOND_STEP);

// Wheel geometry. ROW_H is the snap interval; VISIBLE rows × ROW_H is the
// total picker height. CENTER_OFFSET is the count of empty rows padded above
// and below the data so the first/last item can scroll to the center band.
const ROW_H = 40;
const VISIBLE = 5;
const CENTER_OFFSET = Math.floor(VISIBLE / 2);
const PICKER_H = ROW_H * VISIBLE;
// Column widths keep the three elements clustered tight to the colon — the
// minutes column right-aligns into the colon, seconds left-aligns out of it,
// like digital-clock segments.
const COL_W = 80;

function formatPace(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function snapToInitial(values: number[], value: number): number {
  // Map an arbitrary persisted value onto the nearest wheel index — needed
  // because old persisted paces may be off-grid (e.g. 4:37) but the wheel
  // only stops on SECOND_STEP boundaries.
  let bestIdx = 0;
  let bestDiff = Infinity;
  values.forEach((v, i) => {
    const d = Math.abs(v - value);
    if (d < bestDiff) {
      bestDiff = d;
      bestIdx = i;
    }
  });
  return bestIdx;
}

interface WheelColumnProps {
  data: number[];
  value: number;
  onChange: (v: number) => void;
  formatLabel: (v: number) => string;
  theme: Theme;
  width: number;
  align?: "left" | "right" | "center";
}

function alignItemsFor(align: "left" | "right" | "center") {
  return align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
}

function WheelColumn({
  data,
  value,
  onChange,
  formatLabel,
  theme,
  width,
  align = "center",
}: WheelColumnProps) {
  const ref = useRef<FlatList<number>>(null);

  // Scroll to initial value on mount (no animation — settle silently).
  useEffect(() => {
    const idx = snapToInitial(data, value);
    // requestAnimationFrame ensures the list has measured before we scroll.
    requestAnimationFrame(() => {
      ref.current?.scrollToOffset({ offset: idx * ROW_H, animated: false });
    });
    // We intentionally only sync on mount — wheel state owns position after.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ROW_H);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    const next = data[clamped];
    if (next !== value) onChange(next);
  };

  return (
    <FlatList
      ref={ref}
      style={{ height: PICKER_H, width }}
      data={data}
      keyExtractor={(item) => String(item)}
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW_H}
      decelerationRate="fast"
      getItemLayout={(_, i) => ({ length: ROW_H, offset: ROW_H * i, index: i })}
      contentContainerStyle={{ paddingVertical: CENTER_OFFSET * ROW_H }}
      onMomentumScrollEnd={commit}
      onScrollEndDrag={commit}
      renderItem={({ item }) => {
        const active = item === value;
        return (
          <View style={[styles.wheelRow, { alignItems: alignItemsFor(align) }]}>
            <Text
              style={[
                styles.wheelText,
                {
                  color: active ? theme.accent : theme.textTertiary,
                  fontSize: active ? 28 : 22,
                  fontWeight: active ? "700" : "500",
                },
              ]}
            >
              {formatLabel(item)}
            </Text>
          </View>
        );
      }}
    />
  );
}

export default function Pace() {
  const { theme, settings, updateSettings } = useApp();
  const router = useRouter();

  const initial = settings.paceSecondsPerKm;
  const initialMin = initial != null ? Math.floor(initial / 60) : DEFAULT_MIN;
  const initialSec = initial != null ? Math.round((initial % 60) / SECOND_STEP) * SECOND_STEP : DEFAULT_SEC;

  const [minutes, setMinutes] = useState<number>(
    MINUTES[snapToInitial(MINUTES, initialMin)]
  );
  const [seconds, setSeconds] = useState<number>(
    SECONDS[snapToInitial(SECONDS, initialSec)]
  );

  const totalSeconds = minutes * 60 + seconds;

  const finishOnboarding = (write: { paceSecondsPerKm: number | null }) => {
    // Single write so the gate can't flip without the field landing too.
    updateSettings({ ...write, hasCompletedOnboarding: true });
    // replace() — user can't swipe-back into onboarding.
    router.replace("/train");
  };

  const onSave = () => finishOnboarding({ paceSecondsPerKm: totalSeconds });
  const onSkip = () => finishOnboarding({ paceSecondsPerKm: null });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <HeaderRow step={4} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={[styles.heading, { color: theme.text }]}>What's your current 1km pace?</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          Optional — helps Coach Rob with running advice. You can add this later in Settings.
        </Text>

        <Text style={[styles.unitLabel, { color: theme.textTertiary }]}>minutes : seconds per km</Text>

        <View style={[styles.pickerWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Center band — visually anchors the selection point between the
              padded top/bottom row slots. */}
          <View
            pointerEvents="none"
            style={[
              styles.centerBand,
              {
                top: CENTER_OFFSET * ROW_H,
                borderTopColor: theme.border,
                borderBottomColor: theme.border,
              },
            ]}
          />
          <View style={styles.wheels}>
            <WheelColumn
              data={MINUTES}
              value={minutes}
              onChange={setMinutes}
              formatLabel={(v) => String(v)}
              theme={theme}
              width={COL_W}
              align="right"
            />
            <View style={styles.colonWrap} pointerEvents="none">
              <Text style={[styles.colon, { color: theme.text }]}>:</Text>
            </View>
            <WheelColumn
              data={SECONDS}
              value={seconds}
              onChange={setSeconds}
              formatLabel={(v) => v.toString().padStart(2, "0")}
              theme={theme}
              width={COL_W}
              align="left"
            />
          </View>
        </View>

        <Text style={[styles.preview, { color: theme.text }]}>
          {formatPace(totalSeconds)}
          <Text style={[styles.previewUnit, { color: theme.textSecondary }]}> / km</Text>
        </Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Save" onPress={onSave} />
        <SecondaryButton label="Skip" onPress={onSkip} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  heading: { fontSize: 28, fontWeight: "800", marginBottom: spacing.sm },
  sub: { fontSize: 15, lineHeight: 21, marginBottom: spacing.md },
  unitLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  pickerWrap: {
    height: PICKER_H,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  centerBand: {
    position: "absolute",
    left: 0,
    right: 0,
    height: ROW_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wheels: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  wheelRow: { height: ROW_H, justifyContent: "center", paddingHorizontal: 6 },
  wheelText: { fontVariant: ["tabular-nums"] },
  colonWrap: {
    width: 20,
    marginHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  colon: { fontSize: 26, fontWeight: "700" },
  preview: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.md,
  },
  previewUnit: { fontSize: 15, fontWeight: "500" },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 28,
    gap: spacing.xs,
  },
});
