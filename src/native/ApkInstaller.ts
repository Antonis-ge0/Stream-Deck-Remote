import { NativeModules, Platform } from "react-native";

type ApkInstallerNativeModule = {
  installFromUrl: (url: string, fileName: string) => Promise<void>;
  openInstallPermissionSettings: () => Promise<void>;
};

const nativeModule = NativeModules.ApkInstaller as
  | ApkInstallerNativeModule
  | undefined;

export async function installApkFromUrl(url: string, fileName: string) {
  return getNativeModule().installFromUrl(url, fileName);
}

export async function openApkInstallPermissionSettings() {
  return getNativeModule().openInstallPermissionSettings();
}

function getNativeModule() {
  if (Platform.OS !== "android" || !nativeModule) {
    throw new Error("APK updates are only available in the Android native build.");
  }

  return nativeModule;
}
