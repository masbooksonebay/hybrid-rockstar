import { InputAccessoryView, Keyboard, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "../lib/context";
import { spacing } from "../constants/theme";

export const KEYBOARD_DONE_ID = "hr-done-toolbar";

export default function DoneKeyboardToolbar({ nativeID = KEYBOARD_DONE_ID }: { nativeID?: string }) {
  const { theme } = useApp();
  if (Platform.OS !== "ios") return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={[styles.bar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity onPress={() => Keyboard.dismiss()} hitSlop={8}>
          <Text style={[styles.done, { color: theme.accent }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  done: { fontSize: 16, fontWeight: "600" },
});
