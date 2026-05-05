import { StatusBar } from "expo-status-bar";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Moon, Sun } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { IconButton } from "../components/IconButton";
import { ConnectedPanel } from "../features/connection/ConnectedPanel";
import { ConnectionPanel } from "../features/connection/ConnectionPanel";
import { DeckEmptyState } from "../features/deck/DeckEmptyState";
import { DeckGrid } from "../features/deck/DeckGrid";
import { ProfileTabs } from "../features/deck/ProfileTabs";
import { KeyboardSignInPanel } from "../features/keyboard/KeyboardSignInPanel";
import { PowerPanel } from "../features/power/PowerPanel";
import { SecureSignInNotice } from "../features/security/SecureSignInNotice";
import { useBluetoothKeyboard } from "../hooks/useBluetoothKeyboard";
import { useDeckConnection } from "../hooks/useDeckConnection";
import { useRemoteSettings } from "../hooks/useRemoteSettings";
import { isValidMacAddress, sendWakeOnLan } from "../services/wakeOnLan";
import { palettes, type AppColors } from "../theme/palette";
import type { ThemeName, WakeStatus } from "../types/remote";

export function RemoteControllerApp() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [wakeStatus, setWakeStatus] = useState<WakeStatus>("idle");
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const colors = palettes[theme];
  const styles = createStyles(colors);

  const { settings, updateSettings } = useRemoteSettings();
  const bluetoothKeyboard = useBluetoothKeyboard();
  const {
    config,
    connect,
    disconnect,
    endpoint,
    lastError,
    refreshConfig,
    status,
    triggerButton,
  } = useDeckConnection(settings);

  useEffect(() => {
    if (!config) {
      setActiveProfileId(null);
      return;
    }

    const currentProfileStillExists = config.profiles.some(
      (profile) => profile.id === activeProfileId
    );

    if (!currentProfileStillExists) {
      setActiveProfileId(config.activeProfileId || config.profiles[0]?.id);
    }
  }, [activeProfileId, config]);

  const activeProfile = useMemo(() => {
    if (!config) return null;

    return (
      config.profiles.find((profile) => profile.id === activeProfileId) ??
      config.profiles.find((profile) => profile.id === config.activeProfileId) ??
      config.profiles[0] ??
      null
    );
  }, [activeProfileId, config]);

  async function wakePc() {
    if (!isValidMacAddress(settings.macAddress)) {
      Alert.alert("Wake PC", "Enter the PC network adapter MAC address first.");
      return;
    }

    const wolPort = Number.parseInt(settings.wolPort, 10);

    if (!Number.isFinite(wolPort) || wolPort < 1 || wolPort > 65535) {
      Alert.alert("Wake PC", "Enter a valid Wake-on-LAN port.");
      return;
    }

    try {
      setWakeStatus("sending");
      await sendWakeOnLan({
        broadcastAddress: settings.broadcastAddress.trim(),
        macAddress: settings.macAddress,
        port: wolPort,
      });
      setWakeStatus("sent");
    } catch (error) {
      setWakeStatus("failed");
      Alert.alert("Wake PC failed", toError(error).message);
    }
  }

  function trigger(buttonId: string) {
    const sent = triggerButton(buttonId, activeProfile?.id);

    if (!sent) {
      Alert.alert("Not connected", "Connect to the desktop app first.");
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            numberOfLines={1}
            style={styles.title}
          >
            StreamDeck Remote
          </Text>
          <View style={styles.statusLine}>
            <View
              style={[
                styles.statusDot,
                status === "connected" && styles.connectedDot,
                status === "connecting" && styles.connectingDot,
              ]}
            />
            <Text style={styles.subtitle}>{statusLabel(status)}</Text>
          </View>
        </View>

        <IconButton
          colors={colors}
          icon={theme === "dark" ? Sun : Moon}
          label={theme === "dark" ? "Light" : "Dark"}
          onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
      </View>

      {status === "connected" ? (
        <View style={styles.connected}>
          <View style={styles.connectedPanelWrap}>
            <ConnectedPanel
              buttonCount={activeProfile?.buttons.length ?? 0}
              colors={colors}
              endpoint={endpoint}
              onBack={disconnect}
              onSync={refreshConfig}
              profileName={activeProfile?.name ?? "No profile selected"}
            />
          </View>

          <ProfileTabs
            activeProfileId={activeProfile?.id ?? null}
            colors={colors}
            onSelect={setActiveProfileId}
            profiles={config?.profiles ?? []}
          />

          {!activeProfile ? (
            <DeckEmptyState
              colors={colors}
              message="Create a profile in the Windows app, then sync again."
              title="No profiles found"
            />
          ) : activeProfile.buttons.length === 0 ? (
            <DeckEmptyState
              colors={colors}
              message="Add buttons in the Windows app and sync this remote."
              title={activeProfile.name}
            />
          ) : (
            <DeckGrid
              buttons={activeProfile.buttons}
              colors={colors}
              onTrigger={trigger}
            />
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.setupContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PowerPanel
            colors={colors}
            onSettingsChange={updateSettings}
            onWake={wakePc}
            settings={settings}
            wakeStatus={wakeStatus}
          />

          <KeyboardSignInPanel
            bondedHosts={bluetoothKeyboard.bondedHosts}
            busy={bluetoothKeyboard.busy}
            colors={colors}
            error={bluetoothKeyboard.error}
            onConnectHost={bluetoothKeyboard.connectHost}
            onDisable={bluetoothKeyboard.disable}
            onEnable={bluetoothKeyboard.enable}
            onOpenSettings={bluetoothKeyboard.openSettings}
            onRefresh={bluetoothKeyboard.refresh}
            onSendKey={bluetoothKeyboard.sendKey}
            status={bluetoothKeyboard.status}
          />

          <ConnectionPanel
            colors={colors}
            endpoint={endpoint}
            lastError={lastError}
            onConnect={connect}
            onDisconnect={disconnect}
            onRefresh={refreshConfig}
            onSettingsChange={updateSettings}
            settings={settings}
            status={status}
          />

          <SecureSignInNotice colors={colors} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function statusLabel(status: string) {
  if (status === "connected") return "Connected";
  if (status === "connecting") return "Connecting";
  return "Offline";
}

function toError(error: unknown) {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      backgroundColor: colors.bg,
      flex: 1,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      paddingBottom: 12,
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    titleGroup: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: "900",
    },
    statusLine: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    statusDot: {
      backgroundColor: colors.warning,
      borderRadius: 999,
      height: 8,
      width: 8,
    },
    connectedDot: {
      backgroundColor: colors.accent,
    },
    connectingDot: {
      backgroundColor: colors.primary,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "800",
    },
    setupContent: {
      gap: 12,
      padding: 16,
      paddingBottom: 28,
    },
    connected: {
      flex: 1,
    },
    connectedPanelWrap: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
  });
}
