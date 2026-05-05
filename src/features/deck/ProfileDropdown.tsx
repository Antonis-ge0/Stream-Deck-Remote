import React from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { AppColors } from "../../theme/palette";
import type { Profile } from "../../types/deck";

type ProfileDropdownProps = {
  activeProfileId: string | null;
  colors: AppColors;
  onSelect: (profileId: string) => void;
  profiles: Profile[];
};

export function ProfileDropdown({
  activeProfileId,
  colors,
  onSelect,
  profiles,
}: ProfileDropdownProps) {
  const styles = createStyles(colors);
  const [open, setOpen] = React.useState(false);
  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
      >
        <View style={styles.iconBox}>
          <Layers color={colors.primary} size={19} strokeWidth={2.4} />
        </View>
        <View style={styles.triggerText}>
          <Text style={styles.label}>Profile</Text>
          <Text style={styles.value} numberOfLines={1}>
            {activeProfile?.name ?? "Select profile"}
          </Text>
        </View>
        <Text style={styles.count}>{profiles.length}</Text>
        <Chevron color={colors.text} size={20} strokeWidth={2.5} />
      </Pressable>

      {open ? (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          nestedScrollEnabled
          renderItem={({ item }) => {
            const active = item.id === activeProfile?.id;

            return (
              <Pressable
                onPress={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  active && styles.activeOption,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.optionText, active && styles.activeOptionText]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.buttonCount, active && styles.activeOptionText]}
                >
                  {item.buttons.length}
                </Text>
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
          style={styles.menu}
        />
      ) : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrapper: {
      gap: 8,
      marginTop: 10,
    },
    trigger: {
      alignItems: "center",
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: 10,
      minHeight: 58,
      paddingHorizontal: 12,
    },
    iconBox: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    triggerText: {
      flex: 1,
      gap: 2,
    },
    label: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    value: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900",
    },
    count: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900",
    },
    menu: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      maxHeight: 292,
    },
    option: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: 10,
      minHeight: 46,
      paddingHorizontal: 12,
    },
    activeOption: {
      backgroundColor: colors.primary,
    },
    optionText: {
      color: colors.text,
      flex: 1,
      fontSize: 14,
      fontWeight: "800",
    },
    activeOptionText: {
      color: colors.primaryText,
    },
    buttonCount: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
    },
    pressed: {
      opacity: 0.74,
    },
  });
}
