import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

export type BluetoothKeyboardStatus = {
  supported: boolean;
  permissionGranted: boolean;
  bluetoothEnabled: boolean;
  registered: boolean;
  connected: boolean;
  connectedHostName?: string | null;
  connectedHostAddress?: string | null;
  lastError?: string | null;
};

export type BondedBluetoothHost = {
  name: string;
  address: string;
};

type BluetoothKeyboardNativeModule = {
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
  getStatus: () => Promise<BluetoothKeyboardStatus>;
  registerKeyboard: () => Promise<BluetoothKeyboardStatus>;
  unregisterKeyboard: () => Promise<BluetoothKeyboardStatus>;
  getBondedHosts: () => Promise<BondedBluetoothHost[]>;
  connectHost: (address: string) => Promise<BluetoothKeyboardStatus>;
  sendKey: (key: string) => Promise<void>;
  openBluetoothSettings: () => Promise<void>;
};

const nativeModule = NativeModules.BluetoothKeyboard as
  | BluetoothKeyboardNativeModule
  | undefined;

export const bluetoothKeyboardAvailable =
  Platform.OS === "android" && Boolean(nativeModule);

export async function requestBluetoothKeyboardPermissions() {
  if (Platform.OS !== "android") {
    return false;
  }

  const androidVersion = Number(Platform.Version);

  if (androidVersion < 31) {
    return true;
  }

  const permissions = PermissionsAndroid.PERMISSIONS as Record<string, string>;
  const requested = [
    permissions.BLUETOOTH_CONNECT ?? "android.permission.BLUETOOTH_CONNECT",
    permissions.BLUETOOTH_ADVERTISE ?? "android.permission.BLUETOOTH_ADVERTISE",
  ] as Parameters<typeof PermissionsAndroid.requestMultiple>[0];

  const result = await PermissionsAndroid.requestMultiple(requested);

  return requested.every(
    (permission) =>
      result[permission as keyof typeof result] ===
      PermissionsAndroid.RESULTS.GRANTED
  );
}

export async function getBluetoothKeyboardStatus() {
  return getNativeModule().getStatus();
}

export async function registerBluetoothKeyboard() {
  return getNativeModule().registerKeyboard();
}

export async function unregisterBluetoothKeyboard() {
  return getNativeModule().unregisterKeyboard();
}

export async function getBondedBluetoothHosts() {
  return getNativeModule().getBondedHosts();
}

export async function connectBluetoothKeyboardHost(address: string) {
  return getNativeModule().connectHost(address);
}

export async function sendBluetoothKeyboardKey(key: string) {
  return getNativeModule().sendKey(key);
}

export async function openBluetoothKeyboardSettings() {
  return getNativeModule().openBluetoothSettings();
}

export function subscribeBluetoothKeyboardStatus(
  listener: (status: BluetoothKeyboardStatus) => void
) {
  if (!bluetoothKeyboardAvailable || !nativeModule) {
    return { remove: () => {} };
  }

  return new NativeEventEmitter(nativeModule).addListener(
    "BluetoothKeyboardStatus",
    listener
  );
}

function getNativeModule() {
  if (!nativeModule) {
    throw new Error(
      "Bluetooth keyboard mode is only available in the Android native dev build."
    );
  }

  return nativeModule;
}
