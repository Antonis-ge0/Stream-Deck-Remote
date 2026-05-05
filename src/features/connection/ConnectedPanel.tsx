import { ChevronLeft, MonitorCheck, RefreshCw } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { ActionButton } from "../../components/ActionButton";
import { Section } from "../../components/Section";
import type { AppColors } from "../../theme/palette";

type ConnectedPanelProps = {
  buttonCount: number;
  colors: AppColors;
  endpoint: string;
  onBack: () => void;
  onSync: () => void;
  profileName: string;
};

export function ConnectedPanel({
  buttonCount,
  colors,
  endpoint,
  onBack,
  onSync,
  profileName,
}: ConnectedPanelProps) {
  const styles = createStyles(colors);

  return (
    <Section colors={colors} eyebrow="Live Remote" title="Connected to PC">
      <View style={styles.summaryRow}>
        <View style={styles.iconBox}>
          <MonitorCheck color={colors.accent} size={24} strokeWidth={2.4} />
        </View>

        <View style={styles.summaryText}>
          <Text style={styles.endpoint} numberOfLines={1}>
            {endpoint}
          </Text>
          <Text style={styles.profile} numberOfLines={1}>
            {profileName}
          </Text>
          <Text style={styles.meta}>
            {buttonCount} {buttonCount === 1 ? "button" : "buttons"} ready
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <ActionButton
          colors={colors}
          icon={ChevronLeft}
          label="Back"
          onPress={onBack}
          tone="neutral"
        />
        <ActionButton
          colors={colors}
          icon={RefreshCw}
          label="Sync"
          onPress={onSync}
          tone="primary"
        />
      </View>
    </Section>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    summaryRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      marginBottom: 14,
    },
    iconBox: {
      alignItems: "center",
      backgroundColor: colors.accentSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 54,
      justifyContent: "center",
      width: 54,
    },
    summaryText: {
      flex: 1,
      gap: 3,
    },
    endpoint: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800",
    },
    profile: {
      color: colors.text,
      fontSize: 19,
      fontWeight: "900",
    },
    meta: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
    },
  });
}
