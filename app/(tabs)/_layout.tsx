import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../lib/context";

export default function TabLayout() {
  const { theme } = useApp();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Train", headerShown: false, tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "flame" : "flame-outline"} size={size} color={color} /> }} />
      <Tabs.Screen name="race" options={{ title: "Race", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "stopwatch" : "stopwatch-outline"} size={size} color={color} /> }} />
      <Tabs.Screen name="coach" options={{ title: "Coach Rob", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={size} color={color} /> }} />
      <Tabs.Screen name="log" options={{ title: "Log", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "document-text" : "document-text-outline"} size={size} color={color} /> }} />
      <Tabs.Screen name="shop" options={{ title: "Shop", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "bag" : "bag-outline"} size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "settings" : "settings-outline"} size={size} color={color} /> }} />
    </Tabs>
  );
}
