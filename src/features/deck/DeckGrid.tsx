import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useWindowDimensions } from "react-native";
import { RemoteIcon } from "../../components/RemoteIcon";
import type { AppColors } from "../../theme/palette";
import type { DeckButton } from "../../types/deck";

type DeckGridProps = {
  buttons: DeckButton[];
  colors: AppColors;
  onTrigger: (buttonId: string) => void;
};

export function DeckGrid({ buttons, colors, onTrigger }: DeckGridProps) {
  const { width, height } = useWindowDimensions();
  const styles = createStyles(colors);
  const landscape = width > height;

  let columns = 2;

  if (width >= 1100) columns = 7;
  else if (width >= 900) columns = 6;
  else if (width >= 720) columns = 5;
  else if (width >= 560) columns = 4;
  else if (width >= 380) columns = 3;

  if (landscape && width >= 700) {
    columns = Math.min(columns + 1, 8);
  }

  const gap = 10;
  const horizontalPadding = 32;
  const availableWidth = Math.max(0, width - horizontalPadding);
  const rawSize = Math.floor((availableWidth - gap * (columns - 1)) / columns);
  const buttonSize = Math.max(94, Math.min(rawSize, 158));
  const iconSize = Math.max(34, Math.min(buttonSize * 0.4, 60));
  const fontSize = Math.max(12, Math.min(buttonSize * 0.13, 16));

  return (
    <FlatList
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      contentContainerStyle={styles.content}
      data={buttons}
      key={columns}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      renderItem={({ item }) => (
        <View style={{ padding: gap / 2 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={() => onTrigger(item.id)}
            style={({ pressed }) => [
              styles.button,
              {
                height: buttonSize,
                width: buttonSize,
              },
              pressed && styles.pressed,
            ]}
          >
            <RemoteIcon colors={colors} icon={item.icon} size={iconSize} />
            <Text
              numberOfLines={2}
              style={[styles.label, { fontSize }]}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {item.label}
            </Text>
          </Pressable>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      alignItems: "center",
      paddingBottom: 34,
      paddingHorizontal: 11,
      paddingTop: 8,
    },
    row: {
      justifyContent: "center",
    },
    button: {
      alignItems: "center",
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: "center",
      padding: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 14,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    label: {
      color: colors.text,
      fontWeight: "900",
      marginTop: 8,
      minHeight: 32,
      textAlign: "center",
    },
  });
}
