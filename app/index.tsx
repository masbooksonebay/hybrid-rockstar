import { Redirect } from "expo-router";
import { useApp } from "../lib/context";

// First-run gate. Unfinished onboarding → /onboarding/welcome; otherwise /train.
// Resumption: backgrounded apps preserve their expo-router stack position
// natively. Cold-launched apps land back on welcome because
// hasCompletedOnboarding is only written on the final screen.
export default function Index() {
  const { settings } = useApp();
  if (!settings.hasCompletedOnboarding) {
    return <Redirect href="/onboarding/welcome" />;
  }
  return <Redirect href="/train" />;
}
