import type { ComponentType } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import type { AppColors } from "../theme/palette";

type ActionButtonProps = {
  colors: AppColors;
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
  tone?: "primary" | "accent" | "danger" | "neutral";
  busy?: boolean;
  disabled?: boolean;
};

export function ActionButton({
  busy,
  colors,
  disabled,
  icon: Icon,
  label,
  onPress,
  tone = "neutral",
}: ActionButtonProps) {
  const styles = createStyles(colors);
  const fg = tone === "neutral" ? colors.text : colors.primaryText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[tone],
        (busy || disabled) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Icon color={fg} size={18} strokeWidth={2.5} />
      )}
      <Text style={[styles.label, tone !== "neutral" && styles.inverted]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    button: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 9,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      paddingHorizontal: 14,
    },
    neutral: {},
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    accent: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    danger: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.75,
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
    },
    inverted: {
      color: colors.primaryText,
    },
  });
}
