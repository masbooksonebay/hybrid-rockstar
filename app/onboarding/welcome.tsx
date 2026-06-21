import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useApp } from "../../lib/context";
import { spacing } from "../../constants/theme";
import { PrimaryButton } from "../../components/onboarding/Chrome";

const ICON_SIZE = 96;
const BRAND_YELLOW = "#FFED00";

export default function Welcome() {
  const { theme } = useApp();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top spacer pushes content to ~28% from the top of the safe area. */}
      <View style={styles.topSpacer} />
      <View style={styles.body}>
        {/* New black/#FFED00 HYBRID brand tile (white wordmark + yellow
            underline). The asset is a square black tile, so the rounded corners
            + hairline border below render it as an app tile on the dark hero —
            mirroring the website hero badge. */}
        <Image
          source={require("../../assets/app-icon-hybrid-1024.png")}
          style={styles.icon}
          resizeMode="cover"
        />
        <View style={styles.headingBlock}>
          {/* Brand wordmark + HYROX TRAINING subtitle, matching the website
              hero: Roboto Mono, uppercase, letter-spaced; wordmark in brand
              yellow, subtitle in white. RN has no word-spacing, so the gap is
              approximated via letterSpacing; numberOfLines/adjustsFontSizeToFit
              keep it on one line across device widths. */}
          <Text
            style={styles.wordmark}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Hybrid Rockstar
          </Text>
          <Text style={styles.subtitleBrand}>HYROX Training</Text>
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    marginBottom: 36,
  },
  headingBlock: {
    alignItems: "center",
    marginBottom: 28,
  },
  wordmark: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 34,
    color: BRAND_YELLOW,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  subtitleBrand: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 12,
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
