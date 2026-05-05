import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_REMOTE_SETTINGS,
  loadRemoteSettings,
  saveRemoteSettings,
} from "../services/settingsStorage";
import type { RemoteSettings } from "../types/remote";

export function useRemoteSettings() {
  const [settings, setSettings] = useState(DEFAULT_REMOTE_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadRemoteSettings()
      .then((loaded) => {
        if (mounted) {
          setSettings(loaded);
        }
      })
      .finally(() => {
        if (mounted) {
          setHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<RemoteSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveRemoteSettings(next).catch(() => {});
      return next;
    });
  }, []);

  return {
    hydrated,
    settings,
    updateSettings,
  };
}
