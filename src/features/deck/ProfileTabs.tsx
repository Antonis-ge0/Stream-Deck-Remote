import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import type { AppColors } from "../../theme/palette";
import type { Profile } from "../../types/deck";

type ProfileTabsProps = {
  activeProfileId: string | null;
  colors: AppColors;
  onSelect: (profileId: string) => void;
  profiles: Profile[];
};

export function ProfileTabs({
  activeProfileId,
  colors,
  onSelect,
  profiles,
}: ProfileTabsProps) {
  const styles = createStyles(colors);

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={profiles}
      horizontal
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const active = item.id === activeProfileId;

        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => [
              styles.tab,
              active && styles.activeTab,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>
              {item.name}
            </Text>
          </Pressable>
        );
      }}
      showsHorizontalScrollIndicator={false}
    />
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    tab: {
      alignItems: "center",
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: 14,
    },
    activeTab: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pressed: {
      opacity: 0.72,
    },
    label: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900",
    },
    activeLabel: {
      color: colors.primaryText,
    },
  });
}
