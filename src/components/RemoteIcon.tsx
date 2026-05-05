import { Image, StyleSheet, Text, View } from "react-native";
import type { AppColors } from "../theme/palette";

type RemoteIconProps = {
  colors: AppColors;
  icon?: string | null;
  size: number;
};

export function RemoteIcon({ colors, icon, size }: RemoteIconProps) {
  if (!icon) {
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

  const isImage =
    icon.startsWith("data:") || icon.startsWith("http") || icon.startsWith("/");

  if (isImage) {
    return (
      <Image
        source={{ uri: icon }}
        style={{ width: size, height: size, resizeMode: "contain" }}
      />
    );
  }

  return (
    <Text
      style={{
        color: colors.text,
        fontSize: Math.max(24, size * 0.82),
        lineHeight: size,
      }}
    >
      {icon}
    </Text>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1,
  },
});
