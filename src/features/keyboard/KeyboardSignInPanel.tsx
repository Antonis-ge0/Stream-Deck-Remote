import {
  Bluetooth,
  Delete,
  Keyboard,
  Link as LinkIcon,
  LogIn,
  RefreshCw,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActionButton } from "../../components/ActionButton";
import { Section } from "../../components/Section";
import type { BondedBluetoothHost } from "../../native/BluetoothKeyboard";
import type { AppColors } from "../../theme/palette";
import type { BluetoothKeyboardStatus } from "../../native/BluetoothKeyboard";

type KeyboardSignInPanelProps = {
  bondedHosts: BondedBluetoothHost[];
  busy: boolean;
  colors: AppColors;
  error: string | null;
  onConnectHost: (address: string) => void;
  onDisable: () => void;
  onEnable: () => void;
  onRefresh: () => void;
  onSendKey: (key: string) => void;
  onOpenSettings: () => void;
  status: BluetoothKeyboardStatus;
};

const keypadRows = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["BACKSPACE", "0", "ENTER"],
];

export function KeyboardSignInPanel({
  bondedHosts,
  busy,
  colors,
  error,
  onConnectHost,
  onDisable,
  onEnable,
  onOpenSettings,
  onRefresh,
  onSendKey,
  status,
}: KeyboardSignInPanelProps) {
  const styles = createStyles(colors);
  const ready = status.registered && status.connected;
  const canEnable = status.supported && status.bluetoothEnabled;

  return (
    <Section colors={colors} eyebrow="Sign-In" title="Phone Keyboard">
      <View style={styles.statusRow}>
        <View style={[styles.statusIcon, ready && styles.readyIcon]}>
          <Keyboard
            color={ready ? colors.accent : colors.warning}
            size={20}
            strokeWidth={2.4}
          />
        </View>

        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>{statusTitle(status)}</Text>
          <Text style={styles.statusMeta} numberOfLines={2}>
            {status.connectedHostName
              ? `Connected to ${status.connectedHostName}`
              : "Pair this phone with Windows as a Bluetooth keyboard."}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <ActionButton
          busy={busy}
          colors={colors}
          disabled={!canEnable && !status.registered}
          icon={Bluetooth}
          label={status.registered ? "Disable" : "Enable"}
          onPress={status.registered ? onDisable : onEnable}
          tone={status.registered ? "danger" : "primary"}
        />
        <ActionButton
          colors={colors}
          icon={RefreshCw}
          label="Refresh"
          onPress={onRefresh}
          tone="neutral"
        />
      </View>

      {bondedHosts.length > 0 && status.registered ? (
        <View style={styles.hostList}>
          <Text style={styles.subheading}>Paired hosts</Text>
          {bondedHosts.map((host) => (
            <Pressable
              key={host.address}
              onPress={() => onConnectHost(host.address)}
              style={({ pressed }) => [
                styles.hostButton,
                pressed && styles.pressed,
              ]}
            >
              <LinkIcon color={colors.text} size={16} strokeWidth={2.4} />
              <Text style={styles.hostLabel} numberOfLines={1}>
                {host.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <ActionButton
        colors={colors}
        disabled={!ready}
        icon={LogIn}
        label="Sign In"
        onPress={() => onSendKey("ENTER")}
        tone="accent"
      />

      <View style={[styles.keypad, !ready && styles.disabledKeypad]}>
        {keypadRows.map((row) => (
          <View key={row.join("-")} style={styles.keypadRow}>
            {row.map((key) => (
              <Pressable
                accessibilityRole="keyboardkey"
                disabled={!ready}
                key={key}
                onPress={() => onSendKey(key)}
                style={({ pressed }) => [
                  styles.key,
                  key === "ENTER" && styles.enterKey,
                  pressed && styles.pressed,
                ]}
              >
                {key === "BACKSPACE" ? (
                  <Delete color={colors.text} size={21} strokeWidth={2.5} />
                ) : (
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    numberOfLines={1}
                    style={[
                      styles.keyLabel,
                      key === "ENTER" && styles.enterLabel,
                    ]}
                  >
                    {key === "ENTER" ? "Enter" : key}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.note}>
        Keep this app open while pairing and signing in. Windows receives only
        the keys you tap here.
      </Text>

      <Pressable onPress={onOpenSettings} style={styles.link}>
        <Text style={styles.linkText}>Open Android Bluetooth settings</Text>
      </Pressable>
    </Section>
  );
}

function statusTitle(status: BluetoothKeyboardStatus) {
  if (!status.supported) return "Android HID keyboard is not available";
  if (!status.permissionGranted) return "Bluetooth permission needed";
  if (!status.bluetoothEnabled) return "Bluetooth is turned off";
  if (status.connected) return "Keyboard connected";
  if (status.registered) return "Keyboard waiting for Windows";
  return "Keyboard disabled";
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    statusRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      marginBottom: 14,
    },
    statusIcon: {
      alignItems: "center",
      backgroundColor: colors.warningSoft,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    readyIcon: {
      backgroundColor: colors.accentSoft,
    },
    statusText: {
      flex: 1,
      gap: 3,
    },
    statusTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
    },
    statusMeta: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 17,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 14,
    },
    hostList: {
      gap: 8,
      marginBottom: 14,
    },
    subheading: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    hostButton: {
      alignItems: "center",
      backgroundColor: colors.panelAlt,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: 9,
      minHeight: 42,
      paddingHorizontal: 12,
    },
    hostLabel: {
      color: colors.text,
      flex: 1,
      fontSize: 14,
      fontWeight: "800",
    },
    keypad: {
      gap: 9,
      marginTop: 12,
    },
    disabledKeypad: {
      opacity: 0.46,
    },
    keypadRow: {
      flexDirection: "row",
      gap: 9,
    },
    key: {
      alignItems: "center",
      backgroundColor: colors.panelAlt,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      height: 54,
      justifyContent: "center",
    },
    enterKey: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    keyLabel: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "900",
    },
    enterLabel: {
      color: colors.primaryText,
      fontSize: 16,
    },
    pressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: "800",
      lineHeight: 18,
      marginTop: 12,
    },
    note: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 17,
      marginTop: 12,
    },
    link: {
      marginTop: 10,
    },
    linkText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "900",
    },
  });
}
