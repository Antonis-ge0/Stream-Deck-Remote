import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { ChevronLeft, RefreshCw, Save, Settings, Trash } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "../components/ActionButton";
import { AppDialog, type AppDialogState } from "../components/AppDialog";
import { ConnectionPanel } from "../features/connection/ConnectionPanel";
import {
  DeckButtonEditor,
  isValidButtonIcon,
} from "../features/deck/DeckButtonEditor";
import { DeckButtonList } from "../features/deck/DeckButtonList";
import { DeckEmptyState } from "../features/deck/DeckEmptyState";
import { ProfileDropdown } from "../features/deck/ProfileDropdown";
import { HomeScreen } from "../features/home/HomeScreen";
import { KeyboardSignInPanel } from "../features/keyboard/KeyboardSignInPanel";
import { PowerPanel } from "../features/power/PowerPanel";
import { SettingsMenuScreen } from "../features/settings/SettingsMenuScreen";
import { useBluetoothKeyboard } from "../hooks/useBluetoothKeyboard";
import { useDeckConnection } from "../hooks/useDeckConnection";
import { useRemoteSettings } from "../hooks/useRemoteSettings";
import { isValidMacAddress, sendWakeOnLan } from "../services/wakeOnLan";
import { palettes, type AppColors } from "../theme/palette";
import type { DeckButton, DeckConfig } from "../types/deck";
import type { ThemeName, WakeStatus } from "../types/remote";

type AppSection = "home" | "power" | "signIn" | "desktop" | "settings";

export function RemoteControllerApp() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [activeSection, setActiveSection] = useState<AppSection>("home");
  const [wakeStatus, setWakeStatus] = useState<WakeStatus>("idle");
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<DeckButton | null>(null);
  const [dialog, setDialog] = useState<AppDialogState | null>(null);
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
    saveConfig,
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

  const editingButton = useMemo(
    () => activeProfile?.buttons.find((button) => button.id === editingButtonId),
    [activeProfile, editingButtonId]
  );

  useEffect(() => {
    if (editingButtonId && !editingButton) {
      closeEditor();
    }
  }, [editingButton, editingButtonId]);

  function showNotice(title: string, message: string) {
    setDialog({
      title,
      message,
      actions: [
        {
          label: "OK",
          onPress: () => setDialog(null),
          tone: "primary",
        },
      ],
    });
  }

  function closeEditor() {
    setEditingButtonId(null);
    setEditingDraft(null);
  }

  function goHome() {
    closeEditor();
    setActiveSection("home");
  }

  async function wakePc() {
    if (!isValidMacAddress(settings.macAddress)) {
      showNotice("Start PC", "Enter the PC network adapter MAC address first.");
      return;
    }

    const wolPort = Number.parseInt(settings.wolPort, 10);

    if (!Number.isFinite(wolPort) || wolPort < 1 || wolPort > 65535) {
      showNotice("Start PC", "Enter a valid Wake-on-LAN port.");
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
      showNotice("Start PC", "Start PC signal sent.");
    } catch (error) {
      setWakeStatus("failed");
      showNotice("Start PC Failed", toError(error).message);
    }
  }

  function trigger(buttonId: string) {
    const sent = triggerButton(buttonId, activeProfile?.id);

    if (!sent) {
      showNotice("Not Connected", "Connect to the desktop app first.");
    }
  }

  function persistConfig(nextConfig: DeckConfig) {
    const sent = saveConfig(nextConfig);

    if (!sent) {
      showNotice(
        "Saved locally",
        "The app is not connected, so this change was not sent to the PC."
      );
    }
  }

  function openButtonEditor(buttonId: string) {
    const button = activeProfile?.buttons.find((item) => item.id === buttonId);
    if (!button) return;
    setEditingButtonId(button.id);
    setEditingDraft({
      ...button,
      icon: isValidButtonIcon(button.icon) ? button.icon : null,
    });
  }

  function saveButton(nextButton = editingDraft) {
    if (!config || !activeProfile) return;
    if (!nextButton) return;

    if (!isValidButtonIcon(nextButton.icon)) {
      showNotice(
        "Invalid Icon",
        "Use an emoji, choose an image from your album, or paste a valid http/https image URL."
      );
      return;
    }

    persistConfig({
      ...config,
      profiles: config.profiles.map((profile) =>
        profile.id === activeProfile.id
          ? {
              ...profile,
              buttons: profile.buttons.map((button) =>
                button.id === nextButton.id ? nextButton : button
              ),
            }
          : profile
      ),
    });

    closeEditor();
  }

  function deleteButton(buttonId: string) {
    if (!config || !activeProfile) return;

    persistConfig({
      ...config,
      profiles: config.profiles.map((profile) =>
        profile.id === activeProfile.id
          ? {
              ...profile,
              buttons: profile.buttons.filter((button) => button.id !== buttonId),
            }
          : profile
      ),
    });

    closeEditor();
  }

  function confirmDeleteButton() {
    if (!editingDraft) return;

    setDialog({
      title: "Delete Button",
      message: `Delete "${editingDraft.label || "this button"}"?`,
      actions: [
        {
          label: "Cancel",
          onPress: () => setDialog(null),
          tone: "neutral",
        },
        {
          label: "Delete",
          onPress: () => {
            const id = editingDraft.id;
            setDialog(null);
            deleteButton(id);
          },
          tone: "danger",
        },
      ],
    });
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={styles.header}>
        {activeSection === "home" ? (
          <View style={styles.headerSpacer} />
        ) : (
          <View style={styles.titleGroup}>
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              numberOfLines={1}
              style={styles.title}
            >
              Stream Deck Remote
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
        )}

        <Pressable
          accessibilityLabel="Options"
          accessibilityRole="button"
          onPress={() => setActiveSection("settings")}
          style={({ pressed }) => [
            styles.settingsButton,
            activeSection === "settings" && styles.activeSettingsButton,
            pressed && styles.pressed,
          ]}
        >
          <Settings
            color={
              activeSection === "settings" ? colors.primaryText : colors.text
            }
            size={20}
            strokeWidth={2.5}
          />
        </Pressable>
      </View>

      {activeSection === "home" ? (
        <HomeScreen
          colors={colors}
          onDesktop={() => setActiveSection("desktop")}
          onPower={() => setActiveSection("power")}
          onSignIn={() => setActiveSection("signIn")}
        />
      ) : activeSection === "settings" ? (
        <SettingsMenuScreen
          colors={colors}
          onBack={goHome}
          onNotice={showNotice}
          onThemeChange={setTheme}
          theme={theme}
        />
      ) : activeSection === "desktop" && status === "connected" ? (
        <View style={styles.connected}>
          <View style={styles.connectedTopBar}>
            <ActionButton
              colors={colors}
              icon={ChevronLeft}
              label="Back"
              onPress={editingDraft ? closeEditor : goHome}
              tone="neutral"
            />
            {editingDraft ? (
              <View style={styles.editTopActions}>
                <ActionButton
                  colors={colors}
                  icon={Save}
                  label="Save"
                  onPress={() => saveButton()}
                  tone="primary"
                />
                <ActionButton
                  colors={colors}
                  icon={Trash}
                  label="Delete"
                  onPress={confirmDeleteButton}
                  tone="danger"
                />
              </View>
            ) : (
              <ActionButton
                colors={colors}
                icon={RefreshCw}
                label="Sync"
                onPress={refreshConfig}
                tone="primary"
              />
            )}
          </View>

          {!editingDraft ? (
            <View style={styles.connectedPanelWrap}>
              <ProfileDropdown
                activeProfileId={activeProfile?.id ?? null}
                colors={colors}
                onSelect={setActiveProfileId}
                profiles={config?.profiles ?? []}
              />
            </View>
          ) : null}

          {editingDraft ? (
            <DeckButtonEditor
              button={editingDraft}
              colors={colors}
              onChange={setEditingDraft}
              onNotice={showNotice}
              onRun={trigger}
            />
          ) : !activeProfile ? (
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
            <DeckButtonList
              buttons={activeProfile.buttons}
              colors={colors}
              onSelect={openButtonEditor}
            />
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.setupContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionTopBar}>
            <ActionButton
              colors={colors}
              icon={ChevronLeft}
              label="Back"
              onPress={goHome}
              tone="neutral"
            />
          </View>

          {activeSection === "power" ? (
            <PowerPanel
              colors={colors}
              onSettingsChange={updateSettings}
              onWake={wakePc}
              settings={settings}
              wakeStatus={wakeStatus}
            />
          ) : null}

          {activeSection === "signIn" ? (
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
          ) : null}

          {activeSection === "desktop" ? (
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
          ) : null}
        </ScrollView>
      )}

      <AppDialog colors={colors} dialog={dialog} />
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
      minHeight: 68,
      paddingBottom: 12,
      paddingHorizontal: 16,
      paddingRight: 76,
      paddingTop: 14,
      position: "relative",
    },
    titleGroup: {
      flex: 1,
    },
    headerSpacer: {
      flex: 1,
    },
    settingsButton: {
      alignItems: "center",
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      position: "absolute",
      right: 16,
      top: 18,
      width: 44,
    },
    activeSettingsButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
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
    sectionTopBar: {
      alignItems: "flex-start",
      marginBottom: 2,
    },
    connected: {
      flex: 1,
    },
    connectedTopBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      paddingBottom: 10,
      paddingHorizontal: 16,
    },
    editTopActions: {
      flexDirection: "row",
      gap: 8,
    },
    connectedPanelWrap: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
