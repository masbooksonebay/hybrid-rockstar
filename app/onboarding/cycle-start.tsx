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

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function CycleStart() {
  const { theme, settings, updateSettings } = useApp();
  const router = useRouter();

  const today = startOfDay(new Date());

  const [date, setDate] = useState<Date>(
    settings.cycleStartDate ? new Date(settings.cycleStartDate) : today
  );

  const minDate = today;
  const maxDate = addDays(today, 365 * 2);

  const onContinue = () => {
    updateSettings({ cycleStartDate: date.toISOString() });
    router.push("/onboarding/goal");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <HeaderRow step={1} onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={[styles.heading, { color: theme.text }]}>When do you want to start?</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          Choose when you'd like to begin your first session.
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
