import { Image, StyleSheet, Text, View } from "react-native";
import type { AppColors } from "../theme/palette";
import { isEmojiIcon, isImageIcon } from "../utils/iconValidation";

type RemoteIconProps = {
  colors: AppColors;
  icon?: string | null;
  size: number;
};

export function RemoteIcon({ colors, icon, size }: RemoteIconProps) {
  const normalizedIcon = icon?.trim();

  if (isImageIcon(normalizedIcon)) {
    return (
      <Image
        source={{ uri: normalizedIcon }}
        style={{ width: size, height: size, resizeMode: "contain" }}
      />
    );
  }

  if (isEmojiIcon(normalizedIcon)) {
    return (
      <View style={{ width: size, height: size }}>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[
            styles.emoji,
            {
              color: colors.text,
              fontSize: Math.max(22, size * 0.78),
              height: size,
              lineHeight: size,
              width: size,
            },
          ]}
        >
          {normalizedIcon}
        </Text>
      </View>
    );
  }

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

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1,
  },
  emoji: {
    includeFontPadding: false,
    textAlign: "center",
    textAlignVertical: "center",
  },
});
