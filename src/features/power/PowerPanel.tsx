import { Power, Zap } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { ActionButton } from "../../components/ActionButton";
import { Section } from "../../components/Section";
import { TextField } from "../../components/TextField";
import type { AppColors } from "../../theme/palette";
import type { RemoteSettings, WakeStatus } from "../../types/remote";

type PowerPanelProps = {
  colors: AppColors;
  onSettingsChange: (patch: Partial<RemoteSettings>) => void;
  onWake: () => void;
  settings: RemoteSettings;
  wakeStatus: WakeStatus;
};

export function PowerPanel({
  colors,
  onSettingsChange,
  onWake,
  settings,
  wakeStatus,
}: PowerPanelProps) {
  const styles = createStyles(colors);

  return (
    <Section colors={colors} eyebrow="Power" title="Wake PC">
      <TextField
        colors={colors}
        label="PC MAC address"
        onChangeText={(macAddress) => onSettingsChange({ macAddress })}
        placeholder="AA:BB:CC:DD:EE:FF"
        value={settings.macAddress}
      />

      <View style={styles.inputRow}>
        <TextField
          colors={colors}
          label="Broadcast"
          onChangeText={(broadcastAddress) =>
            onSettingsChange({ broadcastAddress })
          }
          placeholder="255.255.255.255"
          value={settings.broadcastAddress}
        />
        <TextField
          colors={colors}
          keyboardType="number-pad"
          label="WOL"
          onChangeText={(wolPort) => onSettingsChange({ wolPort })}
          placeholder="9"
          value={settings.wolPort}
          width={82}
        />
      </View>

      <ActionButton
        busy={wakeStatus === "sending"}
        colors={colors}
        icon={wakeStatus === "sent" ? Zap : Power}
        label={wakeStatus === "sending" ? "Sending" : "Wake"}
        onPress={onWake}
        tone="accent"
      />

      <Text style={styles.note}>
        Native UDP build required. Expo Go can connect, but cannot send WOL.
      </Text>
    </Section>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    inputRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
      marginBottom: 14,
    },
    note: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 17,
      marginTop: 10,
    },
  });
}
