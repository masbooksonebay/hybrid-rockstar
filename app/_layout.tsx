import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed";
import * as Notifications from "expo-notifications";
import { AppProvider, useApp } from "../lib/context";
import { getCycleProgress } from "../lib/cycleProgress";
import { rescheduleNotifications } from "../lib/notifications";
import { UnlockToast } from "../components/achievements/UnlockToast";
import { ReviewPromptTrigger } from "../components/achievements/ReviewPromptTrigger";

// Foreground behavior for an arriving notification while the app is open.
// Banner + list visible, sound on, no badge — matches the spec.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function Inner() {
  const { theme, isDark, settings } = useApp();

  // On every app open, refresh the scheduled notification so its body reflects
  // current cycle progress. No-op if notifications are disabled (the helper
  // cancels everything in that branch).
  useEffect(() => {
    (async () => {
      const progress = await getCycleProgress();
      await rescheduleNotifications(settings, progress);
    })();
    // Re-run when notification-relevant settings change so a toggle-on inside
    // Settings is mirrored on app foregrounding.
  }, [settings.notificationsEnabled, settings.notificationsTime]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        {/* index MUST be listed explicitly. Without this, expo-router falls
            back to the first registered screen as the initial route and the
            hasCompletedOnboarding gate in app/index.tsx never runs — fresh
            installs land on /train instead of /onboarding/welcome. */}
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
      <UnlockToast />
      <ReviewPromptTrigger />
    </View>
  );
}

export default function RootLayout() {
  // Barlow Condensed Bold backs the brand wordmark + subtitle (welcome screen)
  // only — everything else stays on the system font. Gate the tree on load so
  // glyphs don't pop in; black matches the splash background so there's no flash.
  const [fontsLoaded] = useFonts({ BarlowCondensed_700Bold });
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <Inner />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
