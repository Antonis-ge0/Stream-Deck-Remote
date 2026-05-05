export type ThemeName = "light" | "dark";

export type ConnectionStatus = "idle" | "connecting" | "connected";

export type RemoteSettings = {
  host: string;
  port: string;
  macAddress: string;
  broadcastAddress: string;
  wolPort: string;
};

export type WakeStatus = "idle" | "sending" | "sent" | "failed";
