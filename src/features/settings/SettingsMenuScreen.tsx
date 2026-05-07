import { useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Check,
  ChevronLeft,
  Download,
  HelpCircle,
  Info,
  MessageSquareMore,
  Moon,
  RefreshCw,
  Rocket,
  Settings,
  Sun,
} from "lucide-react-native";
import { ActionButton } from "../../components/ActionButton";
import { APP_CONFIG } from "../../config/appConfig";
import {
  installApkFromUrl,
  openApkInstallPermissionSettings,
} from "../../native/ApkInstaller";
import {
  checkForAppUpdate,
  type AvailableUpdate,
} from "../../services/updateService";
import type { AppColors } from "../../theme/palette";
import type { ThemeName } from "../../types/remote";

type MenuSection = "menu" | "general" | "help" | "feedback" | "updates" | "about";
type FeedbackStatus = "idle" | "error";
type UpdateStatus =
  | "idle"
  | "checking"
  | "current"
  | "available"
  | "installing"
  | "permission"
  | "error";

type SettingsMenuScreenProps = {
  colors: AppColors;
  onBack: () => void;
  onNotice: (title: string, message: string) => void;
  onThemeChange: (theme: ThemeName) => void;
  theme: ThemeName;
};

const HELP_TIPS = [
  {
    title: "Start your PC",
    description:
      "Use the Start PC section to send a Wake-on-LAN magic packet to the configured MAC address.",
  },
  {
    title: "Sign in from your phone",
    description:
      "Pair the Android HID keyboard with Windows, then tap digits or Sign In to send Enter.",
  },
  {
    title: "No PIN or password",
    description:
      "If the PC has no sign-in secret, open Sign In and tap Sign In to send Enter.",
  },
  {
    title: "Connect to the desktop app",
    description:
      "Use Desktop App to connect to the Windows app WebSocket server, then sync profiles.",
  },
  {
    title: "Run a button",
    description:
      "Open Desktop App, pick a profile, then tap a listed button and run it from its detail page.",
  },
  {
    title: "Edit a button",
    description:
      "Tap a button, change its name, action, or image icon, then press Save in the top bar.",
  },
  {
    title: "Delete a button",
    description:
      "Open a button detail page, press Delete, then confirm in the themed dialog.",
  },
  {
    title: "Use button icons",
    description:
      "Use emoji icons from the desktop app, choose an image from your phone album, or paste a valid http/https image URL.",
  },
] as const;

export function SettingsMenuScreen({
  colors,
  onBack,
  onNotice,
  onThemeChange,
  theme,
}: SettingsMenuScreenProps) {
  const styles = createStyles(colors);
  const [section, setSection] = useState<MenuSection>("menu");
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>("idle");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateMessage, setUpdateMessage] = useState(
    "Check if a new version is available."
  );
  const [availableUpdate, setAvailableUpdate] = useState<AvailableUpdate | null>(
    null
  );
  const sectionTitle = titleForSection(section);

  function handleSectionChange(nextSection: MenuSection) {
    setSection(nextSection);

    if (nextSection === "feedback") {
      setFeedbackStatus("idle");
    }
  }

  function goBack() {
    if (section !== "menu") {
      setSection("menu");
      return;
    }

    onBack();
  }

  async function openFeedbackForm() {
    setFeedbackStatus("idle");

    if (!APP_CONFIG.feedbackFormUrl) {
      setFeedbackStatus("error");
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(APP_CONFIG.feedbackFormUrl);

      if (!canOpen) {
        throw new Error("No browser is available for this link.");
      }

      await Linking.openURL(APP_CONFIG.feedbackFormUrl);
    } catch (error) {
      setFeedbackStatus("error");
      onNotice("Share Feedback", toError(error).message);
    }
  }

  async function openDefaultAppsSettings() {
    try {
      await Linking.sendIntent("android.settings.MANAGE_DEFAULT_APPS_SETTINGS");
    } catch {
      try {
        await Linking.openSettings();
      } catch (error) {
        onNotice("Default Apps Settings", toError(error).message);
      }
    }
  }

  async function checkForUpdates() {
    setSection("updates");
    setAvailableUpdate(null);
    setUpdateStatus("checking");
    setUpdateMessage("Checking for updates...");

    try {
      const update = await checkForAppUpdate();

      if (!update) {
        setUpdateStatus("current");
        setUpdateMessage("You are running the latest version.");
        return;
      }

      setAvailableUpdate(update);
      setUpdateStatus("available");
      setUpdateMessage(`Version ${update.version} is available.`);
    } catch (error) {
      setUpdateStatus("error");
      setUpdateMessage(toError(error).message);
    }
  }

  async function installUpdate() {
    if (!availableUpdate) return;

    if (!availableUpdate.apkUrl) {
      await openUpdateRelease();
      return;
    }

    setUpdateStatus("installing");
    setUpdateMessage("Downloading update and opening Android installer...");

    try {
      await installApkFromUrl(
        availableUpdate.apkUrl,
        availableUpdate.apkName ??
          `stream-deck-remote-${availableUpdate.version}.apk`
      );
      setUpdateStatus("available");
      setUpdateMessage("Approve the Android installer to replace this app.");
    } catch (error) {
      const message = toError(error).message;

      if (message.includes("Install permission")) {
        setUpdateStatus("permission");
        setUpdateMessage(
          "Allow this app to install unknown apps, then tap Install Update again."
        );
        return;
      }

      setUpdateStatus("error");
      setUpdateMessage(message);
    }
  }

  async function openUpdateRelease() {
    const url = availableUpdate?.releaseUrl ?? APP_CONFIG.latestReleaseUrl;

    try {
      await Linking.openURL(url);
    } catch (error) {
      onNotice("Check for Updates", toError(error).message);
    }
  }

  async function openInstallSettings() {
    try {
      await openApkInstallPermissionSettings();
    } catch (error) {
      onNotice("Install Permission", toError(error).message);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <ActionButton
          colors={colors}
          icon={ChevronLeft}
          label="Back"
          onPress={goBack}
          tone="neutral"
        />
        <Text style={styles.pageTitle}>{sectionTitle}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {section === "menu" ? (
          <View style={styles.menuList}>
            <MenuItem
              colors={colors}
              icon={Settings}
              label="General"
              onPress={() => handleSectionChange("general")}
            />
            <MenuItem
              colors={colors}
              icon={HelpCircle}
              label="Help"
              onPress={() => handleSectionChange("help")}
            />
            <MenuItem
              colors={colors}
              icon={MessageSquareMore}
              label="Share Feedback"
              onPress={() => handleSectionChange("feedback")}
            />
            <MenuItem
              colors={colors}
              icon={RefreshCw}
              label="Check for Updates"
              onPress={checkForUpdates}
            />
            <MenuItem
              colors={colors}
              icon={Info}
              label="About"
              onPress={() => handleSectionChange("about")}
            />
          </View>
        ) : null}

        {section === "general" ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Appearance</Text>
            <Text style={styles.hint}>Switch between Dark and Light mode.</Text>

            <View style={styles.choiceRow}>
              <ThemeChoice
                active={theme === "dark"}
                colors={colors}
                icon={Moon}
                label="Dark"
                onPress={() => onThemeChange("dark")}
              />
              <ThemeChoice
                active={theme === "light"}
                colors={colors}
                icon={Sun}
                label="Light"
                onPress={() => onThemeChange("light")}
              />
            </View>

            <Text style={styles.heading}>Remote Sections</Text>
            <InfoCard
              colors={colors}
              title="Start PC"
              description="Stores the MAC address, broadcast address, and Wake-on-LAN port used by your phone."
            />
            <InfoCard
              colors={colors}
              title="Sign In"
              description="Controls Android Bluetooth keyboard mode for manual Windows sign-in."
            />
            <InfoCard
              colors={colors}
              title="Desktop App"
              description="Connects to the Windows app, syncs profiles, and runs or edits remote buttons."
            />
          </View>
        ) : null}

        {section === "help" ? (
          <View style={styles.section}>
            {HELP_TIPS.map((tip) => (
              <InfoCard
                colors={colors}
                description={tip.description}
                key={tip.title}
                title={tip.title}
              />
            ))}
          </View>
        ) : null}

        {section === "feedback" ? (
          <View style={styles.section}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>General Feedback</Text>
              <Text style={styles.heroText}>
                How's your experience with Stream Deck so far? We'd love to
                hear your thoughts. Send ideas, bug reports, or UI notes
                through the feedback form below.
              </Text>
            </View>

            <ActionButton
              colors={colors}
              icon={Rocket}
              label="Open Feedback Form"
              onPress={openFeedbackForm}
              tone="primary"
            />

            {feedbackStatus === "error" ? (
              <>
                <Text style={styles.hint}>
                  The form could not be opened automatically. Check that Android
                  has a default browser selected for web links.
                </Text>

                <ActionButton
                  colors={colors}
                  icon={Settings}
                  label="Open Default Apps Settings"
                  onPress={openDefaultAppsSettings}
                  tone="neutral"
                />
              </>
            ) : null}
          </View>
        ) : null}

        {section === "updates" ? (
          <View style={styles.section}>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>{APP_CONFIG.name}</Text>
              <Text style={styles.heroText}>{updateMessage}</Text>
              {availableUpdate?.body ? (
                <Text style={styles.hint}>{availableUpdate.body}</Text>
              ) : null}
              <Text style={styles.hint}>Current version {APP_CONFIG.version}</Text>
            </View>

            <ActionButton
              colors={colors}
              icon={RefreshCw}
              label="Check Again"
              busy={updateStatus === "checking"}
              disabled={updateStatus === "installing"}
              onPress={checkForUpdates}
              tone="neutral"
            />

            {updateStatus === "available" || updateStatus === "installing" ? (
              <ActionButton
                colors={colors}
                icon={Download}
                label={availableUpdate?.apkUrl ? "Install Update" : "Open Release"}
                busy={updateStatus === "installing"}
                onPress={installUpdate}
                tone="primary"
              />
            ) : null}

            {updateStatus === "permission" ? (
              <>
                <ActionButton
                  colors={colors}
                  icon={Settings}
                  label="Allow APK Installs"
                  onPress={openInstallSettings}
                  tone="primary"
                />
                <ActionButton
                  colors={colors}
                  icon={Download}
                  label="Install Update"
                  onPress={installUpdate}
                  tone="neutral"
                />
              </>
            ) : null}
          </View>
        ) : null}

        {section === "about" ? (
          <View style={styles.section}>
            <View style={[styles.heroCard, styles.aboutCard]}>
              <Image
                source={require("../../../assets/128x128.png")}
                style={styles.aboutLogo}
              />
              <Text style={styles.heroTitle}>{APP_CONFIG.name}</Text>
              <Text style={styles.hint}>Version {APP_CONFIG.version}</Text>
              <Text style={styles.heroText}>
                A mobile remote for starting your PC, signing in with a phone
                keyboard, syncing Stream Deck profiles, and running desktop
                actions from Android.
              </Text>
              <Text style={styles.author}>Antonis Georgosopoulos</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

type MenuItemProps = {
  colors: AppColors;
  icon: typeof Settings;
  label: string;
  onPress: () => void;
};

function MenuItem({ colors, icon: Icon, label, onPress }: MenuItemProps) {
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
    >
      <Icon color={colors.text} size={19} strokeWidth={2.4} />
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
  );
}

type ThemeChoiceProps = {
  active: boolean;
  colors: AppColors;
  icon: typeof Moon;
  label: string;
  onPress: () => void;
};

function ThemeChoice({
  active,
  colors,
  icon: Icon,
  label,
  onPress,
}: ThemeChoiceProps) {
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        active && styles.activeChoice,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        color={active ? colors.primaryText : colors.text}
        size={18}
        strokeWidth={2.4}
      />
      <Text style={[styles.choiceLabel, active && styles.activeChoiceLabel]}>
        {label}
      </Text>
      {active ? (
        <Check color={colors.primaryText} size={16} strokeWidth={2.8} />
      ) : null}
    </Pressable>
  );
}

type InfoCardProps = {
  colors: AppColors;
  description: string;
  title: string;
};

function InfoCard({ colors, description, title }: InfoCardProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoText}>{description}</Text>
    </View>
  );
}

function titleForSection(section: MenuSection) {
  if (section === "general") return "General";
  if (section === "help") return "Help";
  if (section === "feedback") return "Share Feedback";
  if (section === "updates") return "Check for Updates";
  if (section === "about") return "About";
  return "Options";
}

function toError(error: unknown) {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    topBar: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    pageTitle: {
      color: colors.text,
      flex: 1,
      fontSize: 18,
      fontWeight: "900",
      textAlign: "right",
    },
    content: {
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 34,
    },
    menuList: {
      gap: 10,
    },
    menuItem: {
      alignItems: "center",
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      minHeight: 58,
      paddingHorizontal: 14,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 14,
    },
    menuLabel: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      fontWeight: "900",
    },
    section: {
      gap: 12,
    },
    heading: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "900",
      marginTop: 2,
    },
    hint: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    choiceRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 8,
    },
    choice: {
      alignItems: "center",
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: 8,
      minHeight: 50,
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    activeChoice: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    choiceLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "900",
    },
    activeChoiceLabel: {
      color: colors.primaryText,
    },
    infoCard: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      padding: 14,
    },
    infoTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900",
      marginBottom: 5,
    },
    infoText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19,
    },
    heroCard: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
      padding: 16,
    },
    aboutCard: {
      alignItems: "center",
    },
    aboutLogo: {
      height: 84,
      width: 84,
      resizeMode: "contain",
      marginBottom: 4,
    },
    heroTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "900",
      textAlign: "center",
    },
    heroText: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
      textAlign: "center",
    },
    author: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "900",
      marginTop: 6,
    },
    pressed: {
      opacity: 0.74,
    },
  });
}
