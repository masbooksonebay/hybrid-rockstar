import { StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useApp } from "../../lib/context";
import {
  AchievementDefinition,
  AchievementState,
} from "../../lib/achievements/types";
import { borderRadius, spacing } from "../../constants/theme";

interface Props {
  definition: AchievementDefinition;
  state: AchievementState;
}

const ICON_SIZE = 40;

function formatUnlockDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function AchievementCard({ definition, state }: Props) {
  const { theme } = useApp();
  const unlocked = state.unlocked;
  const iconColor = unlocked ? definition.colorHex : theme.textTertiary;
  const nameColor = unlocked ? theme.text : theme.textSecondary;

  const statusText = unlocked && state.unlockedAt
    ? `Unlocked ${formatUnlockDate(state.unlockedAt)}`
    : "Locked";

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.iconWrap, !unlocked && styles.locked]}>
        <SymbolView
          name={definition.sfSymbol as Parameters<typeof SymbolView>[0]["name"]}
          size={ICON_SIZE}
          tintColor={iconColor}
          weight={unlocked ? "regular" : "light"}
          resizeMode="scaleAspectFit"
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
        />
      </View>
      <View style={styles.textCol}>
        <Text
          style={[styles.name, { color: nameColor }, !unlocked && styles.lockedText]}
        >
          {definition.name}
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {definition.description}
        </Text>
        <Text style={[styles.status, { color: theme.textTertiary }]}>
          {statusText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginVertical: 6,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  locked: { opacity: 0.5 },
  lockedText: { opacity: 0.5 },
  textCol: {
    flex: 1,
    marginLeft: 12,
  },
  name: { fontSize: 16, fontWeight: "600" },
  description: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  status: { fontSize: 12, marginTop: 4, fontWeight: "500" },
});
