import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { AppColors } from "../theme/palette";

export type AppDialogAction = {
  label: string;
  onPress: () => void;
  tone?: "primary" | "danger" | "neutral";
};

export type AppDialogState = {
  title: string;
  message: string;
  actions: AppDialogAction[];
};

type AppDialogProps = {
  colors: AppColors;
  dialog: AppDialogState | null;
};

export function AppDialog({ colors, dialog }: AppDialogProps) {
  const styles = createStyles(colors);

  return (
    <Modal animationType="fade" transparent visible={Boolean(dialog)}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{dialog?.title}</Text>
          <Text style={styles.message}>{dialog?.message}</Text>

          <View style={styles.actions}>
            {dialog?.actions.map((action) => (
              <Pressable
                accessibilityRole="button"
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.action,
                  action.tone === "primary" && styles.primary,
                  action.tone === "danger" && styles.danger,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.actionText,
                    action.tone !== "neutral" && styles.invertedText,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.58)",
      flex: 1,
      justifyContent: "center",
      padding: 22,
    },
    dialog: {
      backgroundColor: colors.panel,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      borderWidth: 1,
      padding: 18,
      width: "100%",
      maxWidth: 430,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "900",
      marginBottom: 8,
    },
    message: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
      marginBottom: 16,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "flex-end",
    },
    action: {
      alignItems: "center",
      backgroundColor: colors.panelAlt,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 44,
      minWidth: 92,
      paddingHorizontal: 14,
    },
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    danger: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    pressed: {
      opacity: 0.74,
    },
    actionText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "900",
    },
    invertedText: {
      color: colors.primaryText,
    },
  });
}
