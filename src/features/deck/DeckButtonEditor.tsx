import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  AppWindow,
  Folder,
  Image as ImageIcon,
  Link,
  Play,
  Volume2,
  X,
} from "lucide-react-native";
import { ActionButton } from "../../components/ActionButton";
import { RemoteIcon } from "../../components/RemoteIcon";
import { Section } from "../../components/Section";
import { TextField } from "../../components/TextField";
import type { AppColors } from "../../theme/palette";
import type { DeckAction, DeckButton } from "../../types/deck";
import {
  isRemoteImage,
  isValidButtonIcon,
} from "../../utils/iconValidation";

export { isValidButtonIcon };

type DeckButtonEditorProps = {
  button: DeckButton;
  colors: AppColors;
  onChange: (button: DeckButton) => void;
  onNotice: (title: string, message: string) => void;
  onRun: (buttonId: string) => void;
};

const ACTION_TYPES: Array<{
  icon: typeof Link;
  label: string;
  type: DeckAction["type"];
}> = [
  { icon: Link, label: "URL", type: "openUrl" },
  { icon: AppWindow, label: "App", type: "launchApp" },
  { icon: Folder, label: "Folder", type: "openFolder" },
  { icon: Volume2, label: "Sound", type: "playSound" },
];

export function DeckButtonEditor({
  button,
  colors,
  onChange,
  onNotice,
  onRun,
}: DeckButtonEditorProps) {
  const styles = createStyles(colors);
  const [iconUrl, setIconUrl] = useState(isRemoteImage(button.icon) ? button.icon ?? "" : "");
  const action = useMemo(() => primaryAction(button), [button]);

  function patchButton(patch: Partial<DeckButton>) {
    onChange({ ...button, ...patch });
  }

  function setAction(nextAction: DeckAction) {
    patchButton({ actions: [nextAction] });
  }

  function setActionType(type: DeckAction["type"]) {
    if (type === "openUrl") setAction({ type, url: "" });
    if (type === "launchApp") setAction({ type, path: "", args: [] });
    if (type === "openFolder") setAction({ type, path: "" });
    if (type === "playSound") setAction({ type, sound: "" });
  }

  function updateActionValue(value: string) {
    if (action.type === "openUrl") setAction({ ...action, url: value });
    if (action.type === "launchApp") setAction({ ...action, path: value });
    if (action.type === "openFolder") setAction({ ...action, path: value });
    if (action.type === "playSound") setAction({ ...action, sound: value });
  }

  function updateIconUrl(value: string) {
    setIconUrl(value);

    if (value.trim() === "") {
      patchButton({ icon: null });
      return;
    }

    if (isRemoteImage(value)) {
      patchButton({ icon: value.trim() });
      return;
    }

    patchButton({ icon: null });
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      onNotice(
        "Photo Access Needed",
        "Allow photo access so you can choose an icon from your phone album."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      base64: true,
      mediaTypes: ["images"],
      quality: 0.78,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (!asset.base64) {
      onNotice("Icon Not Loaded", "The selected image could not be read.");
      return;
    }

    const mimeType = asset.mimeType ?? "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${asset.base64}`;
    setIconUrl("");
    patchButton({ icon: dataUrl });
  }

  const iconUrlInvalid = iconUrl.trim().length > 0 && !isRemoteImage(iconUrl);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Section colors={colors} eyebrow="Button" title="Edit Button">
        <View style={styles.preview}>
          <RemoteIcon colors={colors} icon={button.icon} size={58} />
          <View style={styles.previewText}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {button.label || "Untitled button"}
            </Text>
            <Text style={styles.previewMeta} numberOfLines={1}>
              {actionLabel(action)}
            </Text>
          </View>
        </View>

        <TextField
          colors={colors}
          label="Name"
          onChangeText={(label) => patchButton({ label })}
          placeholder="Button name"
          value={button.label}
        />

        <View style={styles.fieldGap} />

        <TextField
          colors={colors}
          label="Icon URL"
          onChangeText={updateIconUrl}
          placeholder="https://example.com/icon.png"
          value={iconUrl}
        />

        {iconUrlInvalid ? (
          <Text style={styles.fieldError}>
            Icons must be uploaded from your album or use a valid image URL.
          </Text>
        ) : null}

        <View style={styles.iconActions}>
          <ActionButton
            colors={colors}
            icon={ImageIcon}
            label="Album"
            onPress={pickImage}
            tone="neutral"
          />
          <ActionButton
            colors={colors}
            icon={X}
            label="Clear"
            onPress={() => {
              setIconUrl("");
              patchButton({ icon: null });
            }}
            tone="neutral"
          />
        </View>
      </Section>

      <Section colors={colors} eyebrow="Action" title="What It Does">
        <View style={styles.typeRow}>
          {ACTION_TYPES.map((item) => {
            const Icon = item.icon;
            const active = action.type === item.type;

            return (
              <Pressable
                key={item.type}
                onPress={() => setActionType(item.type)}
                style={({ pressed }) => [
                  styles.typeButton,
                  active && styles.activeType,
                  pressed && styles.pressed,
                ]}
              >
                <Icon
                  color={active ? colors.primaryText : colors.text}
                  size={18}
                  strokeWidth={2.4}
                />
                <Text style={[styles.typeLabel, active && styles.activeTypeText]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextField
          colors={colors}
          label={actionInputLabel(action)}
          onChangeText={updateActionValue}
          placeholder={actionPlaceholder(action)}
          value={actionValue(action)}
        />
      </Section>

      <ActionButton
        colors={colors}
        icon={Play}
        label="Run Button"
        onPress={() => onRun(button.id)}
        tone="accent"
      />
    </ScrollView>
  );
}

function primaryAction(button: DeckButton): DeckAction {
  return button.actions?.[0] ?? { type: "openUrl", url: "" };
}

function actionLabel(action: DeckAction) {
  if (action.type === "openUrl") return action.url || "URL action";
  if (action.type === "launchApp") return action.path || "App action";
  if (action.type === "openFolder") return action.path || "Folder action";
  return action.sound || "Sound action";
}

function actionInputLabel(action: DeckAction) {
  if (action.type === "openUrl") return "URL";
  if (action.type === "launchApp") return "Application path";
  if (action.type === "openFolder") return "Folder path";
  return "Sound path or data URL";
}

function actionPlaceholder(action: DeckAction) {
  if (action.type === "openUrl") return "https://example.com";
  if (action.type === "launchApp") return "C:\\Program Files\\App\\app.exe";
  if (action.type === "openFolder") return "C:\\Users\\PC\\Desktop";
  return "C:\\Sounds\\sound.mp3";
}

function actionValue(action: DeckAction) {
  if (action.type === "openUrl") return action.url;
  if (action.type === "launchApp") return action.path;
  if (action.type === "openFolder") return action.path;
  return action.sound;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      gap: 12,
      padding: 16,
      paddingBottom: 34,
    },
    preview: {
      alignItems: "center",
      flexDirection: "row",
      gap: 14,
      marginBottom: 16,
    },
    previewText: {
      flex: 1,
      gap: 4,
    },
    previewTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "900",
    },
    previewMeta: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "800",
    },
    fieldGap: {
      height: 12,
    },
    fieldError: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 17,
      marginTop: 8,
    },
    iconActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 12,
    },
    typeRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
    },
    typeButton: {
      alignItems: "center",
      backgroundColor: colors.panelAlt,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: 7,
      justifyContent: "center",
      minHeight: 46,
      paddingHorizontal: 8,
    },
    activeType: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "900",
    },
    activeTypeText: {
      color: colors.primaryText,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}
