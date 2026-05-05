import { ChevronRight } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { RemoteIcon } from "../../components/RemoteIcon";
import type { AppColors } from "../../theme/palette";
import type { DeckButton } from "../../types/deck";

type DeckButtonListProps = {
  buttons: DeckButton[];
  colors: AppColors;
  onSelect: (buttonId: string) => void;
};

export function DeckButtonList({
  buttons,
  colors,
  onSelect,
}: DeckButtonListProps) {
  const styles = createStyles(colors);

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={buttons}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.label}
          onPress={() => onSelect(item.id)}
          style={({ pressed }) => [
            styles.row,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.index}>{String(index + 1).padStart(2, "0")}</Text>
          <RemoteIcon colors={colors} icon={item.icon} size={42} />
          <View style={styles.textGroup}>
            <Text numberOfLines={1} style={styles.title}>
              {item.label || "Untitled button"}
            </Text>
            <Text numberOfLines={1} style={styles.meta}>
              {buttonMeta(item)}
            </Text>
          </View>
          <ChevronRight color={colors.muted} size={20} strokeWidth={2.4} />
        </Pressable>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

function buttonMeta(button: DeckButton) {
  const count = button.actions?.length ?? 0;
  if (count === 0) return "Tap to run";
  if (count === 1) return "1 action";
  return `${count} actions`;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      gap: 9,
      paddingBottom: 34,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    row: {
      alignItems: "center",
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      minHeight: 72,
      paddingHorizontal: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 12,
    },
    pressed: {
      opacity: 0.74,
      transform: [{ scale: 0.99 }],
    },
    index: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
      width: 24,
    },
    textGroup: {
      flex: 1,
      gap: 4,
    },
    title: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    meta: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800",
    },
  });
}
