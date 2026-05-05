import { Plug, RefreshCw, Unplug, Wifi } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { ActionButton } from "../../components/ActionButton";
import { Section } from "../../components/Section";
import { TextField } from "../../components/TextField";
import type { AppColors } from "../../theme/palette";
import type { ConnectionStatus, RemoteSettings } from "../../types/remote";

type ConnectionPanelProps = {
  colors: AppColors;
  endpoint: string;
  lastError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  onSettingsChange: (patch: Partial<RemoteSettings>) => void;
  settings: RemoteSettings;
  status: ConnectionStatus;
};

export function ConnectionPanel({
  colors,
  endpoint,
  lastError,
  onConnect,
  onDisconnect,
  onRefresh,
  onSettingsChange,
  settings,
  status,
}: ConnectionPanelProps) {
  const styles = createStyles(colors);
  const connected = status === "connected";

  return (
    <Section colors={colors} eyebrow="Desktop" title="Connection">
      <View style={styles.statusRow}>
        <View
          style={[
            styles.dot,
            connected ? styles.onlineDot : styles.offlineDot,
          ]}
        />
        <Text style={styles.endpoint} numberOfLines={1}>
          {endpoint}
        </Text>
      </View>

      <View style={styles.inputRow}>
        <TextField
          colors={colors}
          label="PC address"
          onChangeText={(host) => onSettingsChange({ host })}
          placeholder="192.168.1.216"
          value={settings.host}
        />
        <TextField
          colors={colors}
          keyboardType="number-pad"
          label="Port"
          onChangeText={(port) => onSettingsChange({ port })}
          placeholder="37123"
          value={settings.port}
          width={92}
        />
      </View>

      {lastError ? <Text style={styles.error}>{lastError}</Text> : null}

      <View style={styles.actionRow}>
        {connected ? (
          <>
            <ActionButton
              colors={colors}
              icon={RefreshCw}
              label="Sync"
              onPress={onRefresh}
              tone="neutral"
            />
            <ActionButton
              colors={colors}
              icon={Unplug}
              label="Disconnect"
              onPress={onDisconnect}
              tone="danger"
            />
          </>
        ) : (
          <ActionButton
            busy={status === "connecting"}
            colors={colors}
            icon={status === "connecting" ? Wifi : Plug}
            label={status === "connecting" ? "Connecting" : "Connect"}
            onPress={onConnect}
            tone="primary"
          />
        )}
      </View>
    </Section>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    statusRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 9,
      marginBottom: 14,
    },
    dot: {
      width: 9,
      height: 9,
      borderRadius: 999,
    },
    onlineDot: {
      backgroundColor: colors.accent,
    },
    offlineDot: {
      backgroundColor: colors.warning,
    },
    endpoint: {
      color: colors.muted,
      flex: 1,
      fontSize: 13,
      fontWeight: "800",
    },
    inputRow: {
      flexDirection: "row",
      gap: 10,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: "700",
      marginTop: 10,
    },
  });
}
