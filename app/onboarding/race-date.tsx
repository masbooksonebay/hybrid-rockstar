import { useState } from "react";
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

// Default to 12 weeks out so the standard cycle window fits exactly.
function defaultRaceDate(): Date {
  return addDays(new Date(), 12 * 7);
}

export default function RaceDate() {
  const { theme, settings, updateSettings } = useApp();
  const router = useRouter();

  // Seed picker from settings if user already set this, else default to +12w.
  const [date, setDate] = useState<Date>(
    settings.raceDate ? new Date(settings.raceDate) : defaultRaceDate()
  );

  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 365 * 2);

  const onContinue = () => {
    updateSettings({ raceDate: date.toISOString() });
    router.push("/onboarding/cycle-start");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <HeaderRow step={1} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={[styles.heading, { color: theme.text }]}>When's your race?</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>We use this to schedule your cycle.</Text>
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
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
});
