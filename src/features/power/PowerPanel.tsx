import { Power, Zap } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
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
    <Section colors={colors} eyebrow="Power" title="Start PC">
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
        label={wakeStatus === "sending" ? "Sending" : "Start PC"}
        onPress={onWake}
        tone="accent"
      />
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
  });
}
