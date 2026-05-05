import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AppColors } from "../theme/palette";

type SectionProps = PropsWithChildren<{
  colors: AppColors;
  title: string;
  eyebrow?: string;
}>;

export function Section({ children, colors, eyebrow, title }: SectionProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    section: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
    },
    header: {
      marginBottom: 14,
    },
    eyebrow: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 2,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "900",
    },
  });
}
