import { useCallback, useEffect, useState } from "react";
import {
  bluetoothKeyboardAvailable,
  connectBluetoothKeyboardHost,
  getBluetoothKeyboardStatus,
  getBondedBluetoothHosts,
  openBluetoothKeyboardSettings,
  registerBluetoothKeyboard,
  requestBluetoothKeyboardPermissions,
  sendBluetoothKeyboardKey,
  subscribeBluetoothKeyboardStatus,
  unregisterBluetoothKeyboard,
  type BluetoothKeyboardStatus,
  type BondedBluetoothHost,
} from "../native/BluetoothKeyboard";

const DEFAULT_STATUS: BluetoothKeyboardStatus = {
  supported: false,
  permissionGranted: false,
  bluetoothEnabled: false,
  registered: false,
  connected: false,
};

export function useBluetoothKeyboard() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [bondedHosts, setBondedHosts] = useState<BondedBluetoothHost[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!bluetoothKeyboardAvailable) {
      setStatus(DEFAULT_STATUS);
      setError("Install and open the Android native dev build.");
      return;
    }

    try {
      const nextStatus = await getBluetoothKeyboardStatus();
      setStatus(nextStatus);
      setError(nextStatus.lastError ?? null);

      if (nextStatus.permissionGranted) {
        setBondedHosts(await getBondedBluetoothHosts());
      }
    } catch (caught) {
      setError(toError(caught).message);
    }
  }, []);

  useEffect(() => {
    refresh();

    const subscription = subscribeBluetoothKeyboardStatus((nextStatus) => {
      setStatus(nextStatus);
      setError(nextStatus.lastError ?? null);
    });

    return () => subscription.remove();
  }, [refresh]);

  const enable = useCallback(async () => {
    try {
      setBusy(true);
      setError(null);

      const granted = await requestBluetoothKeyboardPermissions();
      if (!granted) {
        setError("Bluetooth keyboard permission was not granted.");
        return;
      }

      setStatus(await registerBluetoothKeyboard());
      setBondedHosts(await getBondedBluetoothHosts());
    } catch (caught) {
      setError(toError(caught).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    try {
      setBusy(true);
      setError(null);
      setStatus(await unregisterBluetoothKeyboard());
    } catch (caught) {
      setError(toError(caught).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const connectHost = useCallback(async (address: string) => {
    try {
      setBusy(true);
      setError(null);
      setStatus(await connectBluetoothKeyboardHost(address));
    } catch (caught) {
      setError(toError(caught).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const sendKey = useCallback(async (key: string) => {
    try {
      setError(null);
      await sendBluetoothKeyboardKey(key);
    } catch (caught) {
      setError(toError(caught).message);
    }
  }, []);

  const openSettings = useCallback(async () => {
    try {
      setError(null);
      await openBluetoothKeyboardSettings();
    } catch (caught) {
      setError(toError(caught).message);
    }
  }, []);

  return {
    bondedHosts,
    busy,
    connectHost,
    disable,
    enable,
    error,
    openSettings,
    refresh,
    sendKey,
    status,
  };
}

function toError(error: unknown) {
  if (error instanceof Error) return error;
  return new Error(String(error));
}
