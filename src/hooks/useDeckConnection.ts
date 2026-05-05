import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DeckConfig } from "../types/deck";
import type { ConnectionStatus, RemoteSettings } from "../types/remote";

type DesktopMessage =
  | { type: "config"; config: DeckConfig }
  | { type: "error"; message?: string };

export function useDeckConnection(settings: RemoteSettings) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [config, setConfig] = useState<DeckConfig | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const endpoint = useMemo(() => {
    return `ws://${settings.host.trim()}:${settings.port.trim()}`;
  }, [settings.host, settings.port]);

  const send = useCallback((message: object) => {
    const ws = wsRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    ws.send(JSON.stringify(message));
    return true;
  }, []);

  const refreshConfig = useCallback(() => {
    return send({ type: "getConfig" });
  }, [send]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConfig(null);
    setStatus("idle");
  }, []);

  const connect = useCallback(() => {
    wsRef.current?.close();
    setStatus("connecting");
    setLastError(null);

    const ws = new WebSocket(endpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      ws.send(JSON.stringify({ type: "getConfig" }));
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as DesktopMessage;

        if (parsed.type === "config") {
          setConfig(parsed.config);
        }

        if (parsed.type === "error") {
          setLastError(parsed.message ?? "Desktop app returned an error.");
        }
      } catch {
        setLastError("Received an unreadable desktop response.");
      }
    };

    ws.onerror = () => {
      setLastError(`Could not connect to ${endpoint}.`);
      setStatus("idle");
    };

    ws.onclose = () => {
      wsRef.current = null;
      setConfig(null);
      setStatus("idle");
    };
  }, [endpoint]);

  const triggerButton = useCallback(
    (buttonId: string, profileId?: string | null) => {
      return send({
        type: "triggerButton",
        buttonId,
        profileId: profileId ?? null,
      });
    },
    [send]
  );

  const saveConfig = useCallback(
    (nextConfig: DeckConfig) => {
      setConfig(nextConfig);
      return send({
        type: "saveConfig",
        config: nextConfig,
      });
    },
    [send]
  );

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    config,
    connect,
    disconnect,
    endpoint,
    lastError,
    refreshConfig,
    saveConfig,
    status,
    triggerButton,
  };
}
