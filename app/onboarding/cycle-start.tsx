import { useState, useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp } from "../../lib/context";
import { spacing } from "../../constants/theme";
import { HeaderRow, PrimaryButton } from "../../components/onboarding/Chrome";

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function weeksBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (7 * 86400000));
}

export default function CycleStart() {
  const { theme, settings, updateSettings } = useApp();
  const router = useRouter();

  // Default: today. Race date must exist by this screen — it's set in step 2.
  const today = startOfDay(new Date());
  const raceDate = settings.raceDate ? startOfDay(new Date(settings.raceDate)) : null;

  const [date, setDate] = useState<Date>(
    settings.cycleStartDate ? new Date(settings.cycleStartDate) : today
  );

  const minDate = today;
  // Max: race date minus 1 day. If no race date set (edge case), allow up to 2y out.
  const maxDate = raceDate ? addDays(raceDate, -1) : addDays(today, 365 * 2);

  const weeksToRace = useMemo(() => {
    if (!raceDate) return null;
    return weeksBetween(date, raceDate);
  }, [date, raceDate]);

  const underTwelve = weeksToRace != null && weeksToRace < 12;

  const onContinue = () => {
    updateSettings({ cycleStartDate: date.toISOString() });
    router.push("/onboarding/goal");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <HeaderRow step={2} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={[styles.heading, { color: theme.text }]}>When do you want to start?</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          The standard cycle is 12 weeks. We recommend starting today.
        </Text>
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            minimumDate={minDate}
            maximumDate={maxDate}
            themeVariant="dark"
            onChange={(_e, d) => {
              if (d) setDate(d);
            }}
          />
        </View>
        {weeksToRace != null && (
          <Text
            style={[
              styles.helper,
              {
                color: underTwelve ? "#FF9500" : theme.textSecondary,
              },
            ]}
          >
            {underTwelve
              ? `Note: standard cycle is 12 weeks; you'll have ${weeksToRace} week${weeksToRace === 1 ? "" : "s"} of prep.`
              : `Your race is in ${weeksToRace} week${weeksToRace === 1 ? "" : "s"}.`}
          </Text>
        )}
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  heading: { fontSize: 28, fontWeight: "800", marginBottom: spacing.sm },
  sub: { fontSize: 15, lineHeight: 21, marginBottom: spacing.md },
  pickerWrap: { marginTop: spacing.sm },
  helper: { fontSize: 13, marginTop: spacing.sm, lineHeight: 18 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
});
