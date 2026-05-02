import { Stack } from "expo-router";
import { useApp } from "../../../../lib/context";

export default function CycleStackLayout() {
  const { theme } = useApp();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="week" />
      <Stack.Screen name="session" />
    </Stack>
  );
}
