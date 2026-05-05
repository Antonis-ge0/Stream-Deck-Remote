import { NativeModules } from "react-native";
import UdpSockets from "react-native-udp";
import {
  nativeWakeOnLanAvailable,
  sendNativeWakeOnLan,
} from "../native/WakeOnLan";

export type WakeOnLanOptions = {
  macAddress: string;
  broadcastAddress: string;
  port: number;
};

export function normalizeMacAddress(value: string) {
  return value.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
}

export function isValidMacAddress(value: string) {
  return normalizeMacAddress(value).length === 12;
}

export function createMagicPacket(macAddress: string) {
  const normalized = normalizeMacAddress(macAddress);

  if (normalized.length !== 12) {
    throw new Error("Enter a valid 12-digit MAC address.");
  }

  const macBytes = normalized.match(/.{2}/g)?.map((byte) => {
    return Number.parseInt(byte, 16);
  });

  if (!macBytes || macBytes.some((byte) => Number.isNaN(byte))) {
    throw new Error("Enter a valid MAC address.");
  }

  return [
    ...Array.from({ length: 6 }, () => 0xff),
    ...Array.from({ length: 16 }).flatMap(() => macBytes),
  ];
}

export async function sendWakeOnLan(options: WakeOnLanOptions) {
  const packet = createMagicPacket(options.macAddress);

  if (nativeWakeOnLanAvailable) {
    await sendNativeWakeOnLan(
      options.macAddress,
      options.broadcastAddress,
      options.port
    );
    return;
  }

  const udpNativeAvailable =
    Boolean(NativeModules.UdpSockets) &&
    Boolean(UdpSockets) &&
    typeof UdpSockets.createSocket === "function";

  if (!udpNativeAvailable) {
    throw new Error(
      "Wake-on-LAN requires the Android native dev build. Open the app installed by npm run android:dev, not Expo Go."
    );
  }

  return new Promise<void>((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let socket: ReturnType<typeof UdpSockets.createSocket> | undefined;
    let settled = false;

    function finish(error?: Error) {
      if (settled) return;

      settled = true;

      if (timeout) {
        clearTimeout(timeout);
      }

      try {
        socket?.close();
      } catch {}

      if (error) {
        reject(error);
        return;
      }

      resolve();
    }

    try {
      socket = UdpSockets.createSocket({ type: "udp4", reusePort: true });
      socket.on("error", (error) => finish(error));

      timeout = setTimeout(() => {
        finish(new Error("Wake packet timed out."));
      }, 5000);

      socket.bind(0, () => {
        try {
          socket?.setBroadcast(true);
          socket?.send(
            packet,
            undefined,
            undefined,
            options.port,
            options.broadcastAddress,
            (error?: Error) => finish(error)
          );
        } catch (error) {
          finish(toError(error));
        }
      });
    } catch (error) {
      finish(
        new Error(
          `${toError(error).message} Wake-on-LAN needs a native build with UDP support.`
        )
      );
    }
  });
}

function toError(error: unknown) {
  if (error instanceof Error) return error;
  return new Error(String(error));
}
