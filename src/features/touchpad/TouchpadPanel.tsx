import { useMemo, useRef } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { MousePointerClick, ScrollText } from "lucide-react-native";
import type { AppColors } from "../../theme/palette";

type TouchpadPanelProps = {
  colors: AppColors;
  endpoint: string;
  onMouseClick: (button: "left" | "right") => boolean;
  onMouseMove: (dx: number, dy: number) => boolean;
  onMouseScroll: (dy: number) => boolean;
  onNotice: (title: string, message: string) => void;
};

const TAP_MOVE_LIMIT = 8;
const TAP_TIME_LIMIT = 350;

export function TouchpadPanel({
  colors,
  endpoint,
  onMouseClick,
  onMouseMove,
  onMouseScroll,
  onNotice,
}: TouchpadPanelProps) {
  const styles = createStyles(colors);
  const lastMove = useRef({ x: 0, y: 0 });
  const lastScrollY = useRef(0);
  const gestureStart = useRef({ moved: false, time: 0 });
  const lastOfflineNotice = useRef(0);

  function showConnectionNotice() {
    const now = Date.now();

    if (now - lastOfflineNotice.current < 1600) {
      return;
    }

    lastOfflineNotice.current = now;
    onNotice("Touchpad Offline", "Connect to the desktop app first.");
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          lastMove.current = { x: 0, y: 0 };
          gestureStart.current = { moved: false, time: Date.now() };
        },
        onPanResponderMove: (_, gesture) => {
          const dx = gesture.dx - lastMove.current.x;
          const dy = gesture.dy - lastMove.current.y;

          lastMove.current = { x: gesture.dx, y: gesture.dy };

          if (Math.hypot(gesture.dx, gesture.dy) > TAP_MOVE_LIMIT) {
            gestureStart.current.moved = true;
          }

          if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) {
            return;
          }

          const sent = onMouseMove(dx * 1.25, dy * 1.25);

          if (!sent) {
            showConnectionNotice();
          }
        },
        onPanResponderRelease: (_, gesture) => {
          const wasTap =
            !gestureStart.current.moved &&
            Math.hypot(gesture.dx, gesture.dy) <= TAP_MOVE_LIMIT &&
            Date.now() - gestureStart.current.time <= TAP_TIME_LIMIT;

          if (wasTap && !onMouseClick("left")) {
            showConnectionNotice();
          }
        },
      }),
    [onMouseClick, onMouseMove]
  );

  const scrollResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          lastScrollY.current = 0;
        },
        onPanResponderMove: (_, gesture) => {
          const deltaY = gesture.dy - lastScrollY.current;
          lastScrollY.current = gesture.dy;

          if (Math.abs(deltaY) < 0.5) {
            return;
          }

          const sent = onMouseScroll(Math.round(-deltaY * 7));

          if (!sent) {
            showConnectionNotice();
          }
        },
      }),
    [onMouseScroll]
  );

  function click(button: "left" | "right") {
    const sent = onMouseClick(button);

    if (!sent) {
      showConnectionNotice();
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Touchpad</Text>
          <Text style={styles.title}>Mouse Control</Text>
          <Text style={styles.subtitle}>Connected to {endpoint}</Text>
        </View>

        <View style={styles.padRow}>
          <View
            accessibilityLabel="Touchpad"
            accessibilityRole="adjustable"
            style={styles.touchpad}
            {...panResponder.panHandlers}
          >
            <MousePointerClick
              color={colors.muted}
              size={28}
              strokeWidth={2.2}
            />
            <Text style={styles.touchpadText}>Drag to move</Text>
            <Text style={styles.touchpadHint}>Tap for left click</Text>
          </View>

          <View style={styles.scrollPad} {...scrollResponder.panHandlers}>
            <ScrollText color={colors.muted} size={20} strokeWidth={2.2} />
            <Text style={styles.scrollText}>Scroll</Text>
          </View>
        </View>

        <View style={styles.clickRow}>
          <ClickButton colors={colors} label="Left Click" onPress={() => click("left")} />
          <ClickButton
            colors={colors}
            label="Right Click"
            onPress={() => click("right")}
          />
        </View>
      </View>
    </View>
  );
}

type ClickButtonProps = {
  colors: AppColors;
  label: string;
  onPress: () => void;
};

function ClickButton({ colors, label, onPress }: ClickButtonProps) {
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.clickButton, pressed && styles.pressed]}
    >
      <Text style={styles.clickText}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 18,
    },
    panel: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      gap: 14,
      padding: 14,
    },
    header: {
      gap: 4,
    },
    eyebrow: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
    },
    subtitle: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
    },
    padRow: {
      flex: 1,
      flexDirection: "row",
      gap: 10,
      minHeight: 320,
    },
    touchpad: {
      alignItems: "center",
      backgroundColor: colors.panelAlt,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 320,
    },
    touchpadText: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "900",
      marginTop: 10,
    },
    touchpadHint: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      marginTop: 4,
    },
    scrollPad: {
      alignItems: "center",
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 320,
      width: 72,
    },
    scrollText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
      marginTop: 8,
      transform: [{ rotate: "-90deg" }],
    },
    clickRow: {
      flexDirection: "row",
      gap: 10,
    },
    clickButton: {
      alignItems: "center",
      backgroundColor: colors.panelAlt,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: 12,
    },
    clickText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
      textAlign: "center",
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
