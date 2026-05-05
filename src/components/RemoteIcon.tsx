import { Image, StyleSheet, View } from "react-native";
import type { AppColors } from "../theme/palette";

type RemoteIconProps = {
  colors: AppColors;
  icon?: string | null;
  size: number;
};

export function RemoteIcon({ colors, icon, size }: RemoteIconProps) {
  if (!isImageIcon(icon)) {
    return (
      <View
        style={[
          styles.empty,
          {
            width: size,
            height: size,
            borderRadius: Math.max(8, size * 0.22),
            backgroundColor: colors.panelAlt,
            borderColor: colors.border,
          },
        ]}
      />
    );
  }

  return (
    <Image
      source={{ uri: icon }}
      style={{ width: size, height: size, resizeMode: "contain" }}
    />
  );
}

function isImageIcon(icon?: string | null): icon is string {
  if (!icon) return false;

  return (
    icon.startsWith("data:image") ||
    icon.startsWith("http://") ||
    icon.startsWith("https://")
  );
}

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1,
  },
});
