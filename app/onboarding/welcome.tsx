import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../lib/context";
import { spacing } from "../../constants/theme";
import { PrimaryButton } from "../../components/onboarding/Chrome";

const ICON_SIZE = 88;

export default function Welcome() {
  const { theme } = useApp();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top spacer pushes content to ~28% from the top of the safe area. */}
      <View style={styles.topSpacer} />
      <View style={styles.body}>
        {/* app-icon-mark.png is a transparent-bg variant of app-icon-1024.png,
            generated offline so the mark floats on theme.background with no
            tile. The original app-icon-1024.png is still used for app.json's
            launch icon + splash. */}
        <Image
          source={require("../../assets/app-icon-mark.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <View style={styles.headingBlock}>
          <Text style={[styles.lineWelcome, { color: theme.text }]}>Welcome</Text>
          <Text style={[styles.lineTo, { color: theme.textSecondary }]}>to</Text>
          <Text style={[styles.lineBrand, { color: theme.accent }]}>Hybrid Rockstar</Text>
        </View>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          Let's set up your race prep. Your answers help us personalize your training advice.
        </Text>
      </View>
      <View style={styles.bottomSpacer} />
      <View style={styles.footer}>
        <PrimaryButton label="Get Started" onPress={() => router.push("/onboarding/division")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // 1 : 2.5 ratio puts content ~28% from the top within the safe area.
  topSpacer: { flex: 1 },
  bottomSpacer: { flex: 2.5 },
  body: {
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginBottom: 40,
  },
  headingBlock: {
    alignItems: "center",
    marginBottom: 28,
  },
  lineWelcome: {
    fontSize: 32,
    fontWeight: "500",
    lineHeight: 36,
    textAlign: "center",
  },
  lineTo: {
    fontSize: 18,
    fontWeight: "300",
    lineHeight: 24,
    textAlign: "center",
    marginVertical: 2,
  },
  lineBrand: {
    fontSize: 44,
    fontWeight: "800",
    lineHeight: 48,
    letterSpacing: -0.8,
    textAlign: "center",
  },
  sub: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 28,
  },
});
