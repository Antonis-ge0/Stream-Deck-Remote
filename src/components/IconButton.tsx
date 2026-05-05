import type { ComponentType } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { AppColors } from "../theme/palette";

type IconButtonProps = {
  colors: AppColors;
  icon: ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
  selected?: boolean;
};

export function IconButton({
  colors,
  icon: Icon,
  label,
  onPress,
  selected,
}: IconButtonProps) {
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        color={selected ? colors.primaryText : colors.text}
        size={18}
        strokeWidth={2.4}
      />
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    button: {
      minHeight: 42,
      minWidth: 42,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.panel,
      paddingHorizontal: 12,
    },
    selected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pressed: {
      opacity: 0.72,
    },
    label: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
    },
    selectedLabel: {
      color: colors.primaryText,
    },
  });
}
