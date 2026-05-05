import { MonitorCog } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import type { AppColors } from "../../theme/palette";

type DeckEmptyStateProps = {
  colors: AppColors;
  title: string;
  message: string;
};

export function DeckEmptyState({ colors, message, title }: DeckEmptyStateProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.empty}>
      <View style={styles.iconBox}>
        <MonitorCog color={colors.primary} size={34} strokeWidth={2.2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    empty: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: 30,
    },
    iconBox: {
      alignItems: "center",
      backgroundColor: colors.primarySoft,
      borderRadius: 8,
      height: 64,
      justifyContent: "center",
      marginBottom: 14,
      width: 64,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "900",
      marginBottom: 7,
      textAlign: "center",
    },
    message: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
      textAlign: "center",
    },
  });
}
