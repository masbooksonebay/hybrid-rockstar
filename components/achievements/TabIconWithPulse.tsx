import { ReactNode, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useUnreadCount } from "../../lib/achievements/unread";

interface Props {
  children: ReactNode;
}

const DOT_SIZE = 8;
const PULSE_DURATION = 1500;

export function TabIconWithPulse({ children }: Props) {
  const unread = useUnreadCount();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (unread <= 0) {
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: PULSE_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: PULSE_DURATION / 2,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [unread, scale]);

  return (
    <View style={styles.wrap}>
      {children}
      {unread > 0 && (
        <Animated.View
          style={[styles.dot, { transform: [{ scale }] }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  dot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#FF3B30",
  },
});
