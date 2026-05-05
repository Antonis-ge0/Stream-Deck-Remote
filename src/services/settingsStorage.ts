import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RemoteSettings } from "../types/remote";

const SETTINGS_KEY = "streamdeckRemote.settings.v1";

export const DEFAULT_REMOTE_SETTINGS: RemoteSettings = {
  host: "192.168.1.216",
  port: "37123",
  macAddress: "",
  broadcastAddress: "255.255.255.255",
  wolPort: "9",
};

export async function loadRemoteSettings(): Promise<RemoteSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);

  if (!raw) {
    return DEFAULT_REMOTE_SETTINGS;
  }

  try {
    return {
      ...DEFAULT_REMOTE_SETTINGS,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_REMOTE_SETTINGS;
  }
}

export async function saveRemoteSettings(settings: RemoteSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
