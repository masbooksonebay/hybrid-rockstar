import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as StoreReview from "expo-store-review";
import * as Notifications from "expo-notifications";
import { useApp } from "../../lib/context";
import { Format, Tier, ThemeMode } from "../../lib/store";
import { spacing, borderRadius } from "../../constants/theme";

const FORMATS: Format[] = ["Individual", "Doubles", "Mixed Doubles", "Relay"];
const TIERS: Tier[] = ["Open", "Pro"];
const GENDERS = ["Male", "Female"];
const AGE_GROUPS = ["16–24", "25–29", "30–34", "35–39", "40–44", "45–49", "50–54", "55–59", "60–64", "65–69", "70+", "Prefer not to say"];

export default function SettingsScreen() {
  const { settings, theme, updateSettings } = useApp();
  const [ageOpen, setAgeOpen] = useState(false);
  const [racePickerOpen, setRacePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const showTier = settings.format === "Individual" || settings.format === "Doubles";

  const onToggleNotifications = async (val: boolean) => {
    if (val) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Enable notifications in iOS Settings to receive training reminders."
        );
        updateSettings({ notificationsEnabled: false });
        return;
      }
    }
    updateSettings({ notificationsEnabled: val });
  };

  const onRateApp = async () => {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      } else {
        Alert.alert("Not available", "App Store review isn't available right now.");
      }
    } catch (err) {
      console.error("[Settings] StoreReview error", err);
    }
  };

  const onSendFeedback = () => {
    Linking.openURL("mailto:support@hybridrockstar.shop?subject=Hybrid%20Rockstar%20Feedback").catch((err) => {
      console.error("[Settings] mailto error", err);
      Alert.alert("Couldn't open Mail", "Send feedback to support@hybridrockstar.shop");
    });
  };

  const onResetOverrides = () => {
    Alert.alert(
      "Reset all overrides?",
      "This will restore default weights and settings. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const keys = await AsyncStorage.getAllKeys();
            const overrides = keys.filter((k) => k.startsWith("hr_station_override_"));
            if (overrides.length) await AsyncStorage.multiRemove(overrides);
          },
        },
      ]
    );
  };

  const onOpenPrivacy = () => {
    Linking.openURL("https://hybridrockstar.shop/privacy").catch(() => {});
  };

  const themeModes: { v: ThemeMode; label: string }[] = [
    { v: "light", label: "Light" },
    { v: "dark", label: "Dark" },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* DIVISION */}
      <Section title="Division" theme={theme}>
        <Card theme={theme}>
          <PillRow
            label="Format"
            options={FORMATS}
            value={settings.format ?? null}
            onChange={(v) => updateSettings({ format: v as Format })}
            theme={theme}
            divider
          />
          {showTier && (
            <PillRow
              label="Tier"
              options={TIERS}
              value={settings.tier ?? null}
              onChange={(v) => updateSettings({ tier: v as Tier })}
              theme={theme}
              divider
            />
          )}
          <PillRow
            label="Gender"
            options={GENDERS}
            value={settings.gender}
            onChange={(v) => updateSettings({ gender: v })}
            theme={theme}
            divider
          />
          <Row theme={theme} onPress={() => setAgeOpen(true)}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Age Group</Text>
            <Text style={[styles.rowValue, { color: settings.ageGroup ? theme.text : theme.textTertiary }]}>
              {settings.ageGroup ?? "Set"}
            </Text>
          </Row>
        </Card>
      </Section>

      {/* TRAINING */}
      <Section title="Training" theme={theme}>
        <Card theme={theme}>
          <Row theme={theme} onPress={() => setRacePickerOpen(true)}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Next Race Date</Text>
            <Text style={[styles.rowValue, { color: settings.raceDate ? theme.text : theme.textTertiary }]}>
              {settings.raceDate
                ? new Date(settings.raceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Set"}
            </Text>
          </Row>
          {settings.raceDate && (
            <View style={styles.subRow}>
              <TouchableOpacity onPress={() => updateSettings({ raceDate: null })}>
                <Text style={[styles.linkText, { color: theme.accent }]}>Clear race date</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </Section>

      {/* APPEARANCE */}
      <Section title="Appearance" theme={theme}>
        <Card theme={theme}>
          <View style={styles.pillRow}>
            <Text style={[styles.rowLabel, { color: theme.text, marginBottom: spacing.sm }]}>Theme</Text>
            <View style={styles.pills}>
              {themeModes.map((m) => {
                const active = settings.themeMode === m.v;
                return (
                  <TouchableOpacity
                    key={m.v}
                    style={[
                      styles.pill,
                      { borderColor: theme.border },
                      active && { backgroundColor: theme.accent, borderColor: theme.accent },
                    ]}
                    onPress={() => updateSettings({ themeMode: m.v })}
                  >
                    <Text style={[styles.pillText, { color: active ? "#fff" : theme.text }]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>
      </Section>

      {/* NOTIFICATIONS */}
      <Section title="Notifications" theme={theme}>
        <Card theme={theme}>
          <Row theme={theme} divider>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Daily training reminder</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ true: theme.accent, false: theme.border }}
            />
          </Row>
          {settings.notificationsEnabled && (
            <Row theme={theme} onPress={() => setTimePickerOpen(true)}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Reminder time</Text>
              <Text style={[styles.rowValue, { color: theme.text }]}>{formatTime(settings.notificationsTime)}</Text>
            </Row>
          )}
        </Card>
      </Section>

      {/* PRIVACY */}
      <Section title="Privacy" theme={theme}>
        <Card theme={theme}>
          <Row theme={theme} divider>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Anonymous tap analytics</Text>
              <Text style={[styles.rowSub, { color: theme.textTertiary }]}>
                Helps us improve Shop recommendations. Data stays on your device.
              </Text>
            </View>
            <Switch
              value={settings.analyticsEnabled}
              onValueChange={(v) => updateSettings({ analyticsEnabled: v })}
              trackColor={{ true: theme.accent, false: theme.border }}
            />
          </Row>
          <Row theme={theme} onPress={onOpenPrivacy}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
          </Row>
        </Card>
      </Section>

      {/* DATA */}
      <Section title="Data" theme={theme}>
        <Card theme={theme}>
          <Row theme={theme} onPress={onResetOverrides}>
            <Text style={[styles.rowLabel, { color: "#FF3B30" }]}>Reset All Overrides</Text>
            <Ionicons name="refresh" size={18} color="#FF3B30" />
          </Row>
        </Card>
      </Section>

      {/* FEEDBACK */}
      <Section title="Feedback" theme={theme}>
        <Card theme={theme}>
          <Row theme={theme} divider onPress={onRateApp}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Rate the App</Text>
            <Ionicons name="star-outline" size={18} color={theme.textSecondary} />
          </Row>
          <Row theme={theme} onPress={onSendFeedback}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Send Feedback</Text>
            <Ionicons name="mail-outline" size={18} color={theme.textSecondary} />
          </Row>
        </Card>
      </Section>

      <Text style={[styles.version, { color: theme.textTertiary }]}>Hybrid Rockstar v1.0.0</Text>
      <View style={{ height: 60 }} />

      {/* Age group picker */}
      <Modal visible={ageOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAgeOpen(false)}>
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Age Group</Text>
            <TouchableOpacity onPress={() => setAgeOpen(false)}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {AGE_GROUPS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.optionRow, { borderBottomColor: theme.border }]}
                onPress={() => {
                  updateSettings({ ageGroup: g === "Prefer not to say" ? null : g });
                  setAgeOpen(false);
                }}
              >
                <Text style={[styles.optionText, { color: theme.text }]}>{g}</Text>
                {settings.ageGroup === g && <Ionicons name="checkmark" size={20} color={theme.accent} />}
                {!settings.ageGroup && g === "Prefer not to say" && <Ionicons name="checkmark" size={20} color={theme.accent} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Race date picker */}
      <Modal visible={racePickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setRacePickerOpen(false)}>
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Next Race Date</Text>
            <TouchableOpacity onPress={() => setRacePickerOpen(false)}>
              <Text style={[styles.linkText, { color: theme.accent, fontSize: 16 }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={settings.raceDate ? new Date(settings.raceDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              themeVariant="dark"
              onChange={(_e, d) => {
                if (d) updateSettings({ raceDate: d.toISOString() });
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Reminder time picker */}
      <Modal visible={timePickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTimePickerOpen(false)}>
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Reminder Time</Text>
            <TouchableOpacity onPress={() => setTimePickerOpen(false)}>
              <Text style={[styles.linkText, { color: theme.accent, fontSize: 16 }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={parseTimeToDate(settings.notificationsTime)}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              themeVariant="dark"
              onChange={(_e, d) => {
                if (d) {
                  const h = d.getHours().toString().padStart(2, "0");
                  const m = d.getMinutes().toString().padStart(2, "0");
                  updateSettings({ notificationsTime: `${h}:${m}` });
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Card({ children, theme }: { children: React.ReactNode; theme: any }) {
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>;
}

function Row({
  children,
  divider,
  onPress,
  theme,
}: {
  children: React.ReactNode;
  divider?: boolean;
  onPress?: () => void;
  theme: any;
}) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      onPress={onPress}
      style={[
        styles.row,
        divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}
    >
      {children}
    </Wrap>
  );
}

function PillRow({
  label,
  options,
  value,
  onChange,
  theme,
  divider,
}: {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (v: string) => void;
  theme: any;
  divider?: boolean;
}) {
  return (
    <View
      style={[
        styles.pillRow,
        divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}
    >
      <Text style={[styles.rowLabel, { color: theme.text, marginBottom: spacing.sm }]}>{label}</Text>
      <View style={styles.pills}>
        {options.map((o) => {
          const active = value === o;
          return (
            <TouchableOpacity
              key={o}
              style={[
                styles.pill,
                { borderColor: theme.border },
                active && { backgroundColor: theme.accent, borderColor: theme.accent },
              ]}
              onPress={() => onChange(o)}
            >
              <Text style={[styles.pillText, { color: active ? "#fff" : theme.text }]}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function parseTimeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.sm, paddingLeft: spacing.xs },
  card: { borderRadius: borderRadius.md, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md - 2 },
  subRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm + 2 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowValue: { fontSize: 15, fontWeight: "500" },
  rowSub: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  linkText: { fontSize: 13, fontWeight: "600" },
  pillRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4 },
  pills: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  pill: { borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm + 4, paddingVertical: 6, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: "600" },
  modal: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, paddingTop: spacing.md },
  modalTitle: { fontSize: 22, fontWeight: "800" },
  modalScroll: { paddingBottom: spacing.lg },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  optionText: { fontSize: 15 },
  pickerWrap: { padding: spacing.md },
  version: { textAlign: "center", fontSize: 12, marginTop: spacing.md },
});
