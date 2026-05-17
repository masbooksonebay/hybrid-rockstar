import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { onAchievementsUnlocked } from "../../lib/achievements/events";
import { getAchievementById } from "../../lib/achievements/catalog";
import { AchievementDefinition, AchievementId } from "../../lib/achievements/types";

const TOAST_HEIGHT = 60;
const AUTO_DISMISS_MS = 3000;
const ANIM_MS = 200;
const QUEUE_GAP_MS = 200;

export function UnlockToast() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<AchievementDefinition | null>(null);
  const queueRef = useRef<AchievementId[]>([]);
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnimatingOut = useRef(false);

  const topOffset = insets.top + 8;

  // Pull the next id off the queue and present it, if nothing is showing and
  // we're not mid-dismiss. The state-deferred form below lets event-handler
  // pushes call `present()` synchronously without racing the unmount.
  const present = (def: AchievementDefinition) => {
    setActive(def);
    translateY.setValue(-200);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: ANIM_MS, useNativeDriver: true }),
    ]).start();
    dismissTimer.current = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
  };

  const pumpQueue = () => {
    if (isAnimatingOut.current) return;
    if (active) return;
    const nextId = queueRef.current.shift();
    if (!nextId) return;
    const def = getAchievementById(nextId);
    if (!def) {
      pumpQueue();
      return;
    }
    present(def);
  };

  const dismiss = (then?: () => void) => {
    if (isAnimatingOut.current) return;
    isAnimatingOut.current = true;
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, { toValue: -200, duration: ANIM_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
    ]).start(() => {
      setActive(null);
      isAnimatingOut.current = false;
      then?.();
      advanceTimer.current = setTimeout(() => pumpQueue(), QUEUE_GAP_MS);
    });
  };

  const onTap = () => {
    dismiss(() => router.push("/log"));
  };

  useEffect(() => {
    const unsubscribe = onAchievementsUnlocked((ids) => {
      queueRef.current.push(...ids);
      pumpQueue();
    });
    return () => {
      unsubscribe();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The pump only fires when `active` clears, so re-pump whenever that
  // transition occurs to drain any items pushed during the cooldown gap.
  useEffect(() => {
    if (active == null) {
      advanceTimer.current = setTimeout(() => pumpQueue(), QUEUE_GAP_MS);
    }
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { top: topOffset, transform: [{ translateY }], opacity },
      ]}
    >
      <Pressable onPress={onTap} style={styles.pressable}>
        <BlurView
          intensity={80}
          tint="dark"
          style={styles.blur}
        >
          <View style={styles.content}>
            <SymbolView
              name={active.sfSymbol as Parameters<typeof SymbolView>[0]["name"]}
              size={32}
              tintColor={active.colorHex}
              weight="regular"
              style={styles.icon}
            />
            <View style={styles.textCol}>
              <Text style={styles.eyebrow}>Achievement Unlocked</Text>
              <Text style={styles.name} numberOfLines={1}>
                {active.name}
              </Text>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    height: TOAST_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    // Shadow keeps it legible over light backdrops on iOS; Android elevation
    // gives a comparable lift.
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
    zIndex: 9999,
  },
  pressable: { flex: 1 },
  blur: { flex: 1 },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  icon: { width: 32, height: 32, marginRight: 12 },
  textCol: { flex: 1 },
  eyebrow: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 2,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
