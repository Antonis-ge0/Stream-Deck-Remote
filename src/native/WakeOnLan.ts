import { NativeModules, Platform } from "react-native";

type WakeOnLanNativeModule = {
  send: (
    macAddress: string,
    broadcastAddress: string,
    port: number
  ) => Promise<void>;
};

const nativeModule = NativeModules.WakeOnLan as
  | WakeOnLanNativeModule
  | undefined;

export const nativeWakeOnLanAvailable =
  Platform.OS === "android" && Boolean(nativeModule);

export async function sendNativeWakeOnLan(
  macAddress: string,
  broadcastAddress: string,
  port: number
) {
  if (!nativeModule) {
    throw new Error(
      "Wake-on-LAN requires the Android native dev build. Open the app installed by npm run android:dev, not Expo Go."
    );
  }

  await nativeModule.send(macAddress, broadcastAddress, port);
}
