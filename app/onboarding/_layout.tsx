import { Stack } from "expo-router";
import { useApp } from "../../lib/context";

// Onboarding stack: no header, no swipe-back. Users complete the flow in
// order; the parent Stack also has gestureEnabled:false to prevent dismissal.
export default function OnboardingLayout() {
  const { theme } = useApp();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    />
  );
}
