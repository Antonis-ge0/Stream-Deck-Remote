import type { ThemeName } from "../types/remote";

export type AppColors = {
  bg: string;
  panel: string;
  panelAlt: string;
  text: string;
  muted: string;
  border: string;
  borderStrong: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  shadow: string;
};

export const palettes: Record<ThemeName, AppColors> = {
  light: {
    bg: "#ffffff",
    panel: "#ffffff",
    panelAlt: "rgba(17, 17, 19, 0.04)",
    text: "#111113",
    muted: "rgba(17, 17, 19, 0.62)",
    border: "rgba(17, 17, 19, 0.12)",
    borderStrong: "rgba(17, 17, 19, 0.24)",
    primary: "#111113",
    primarySoft: "rgba(17, 17, 19, 0.08)",
    primaryText: "#ffffff",
    accent: "#2563eb",
    accentSoft: "rgba(37, 99, 235, 0.12)",
    warning: "#b7791f",
    warningSoft: "rgba(183, 121, 31, 0.14)",
    danger: "#ef4444",
    dangerSoft: "rgba(239, 68, 68, 0.12)",
    shadow: "rgba(17, 17, 19, 0.08)",
  },
  dark: {
    bg: "#111113",
    panel: "#111113",
    panelAlt: "rgba(255, 255, 255, 0.06)",
    text: "#ffffff",
    muted: "rgba(255, 255, 255, 0.65)",
    border: "rgba(255, 255, 255, 0.13)",
    borderStrong: "rgba(255, 255, 255, 0.26)",
    primary: "#ffffff",
    primarySoft: "rgba(255, 255, 255, 0.12)",
    primaryText: "#111113",
    accent: "#93c5fd",
    accentSoft: "rgba(147, 197, 253, 0.16)",
    warning: "#e0a63b",
    warningSoft: "rgba(224, 166, 59, 0.16)",
    danger: "#ef7777",
    dangerSoft: "rgba(239, 119, 119, 0.18)",
    shadow: "rgba(0, 0, 0, 0.35)",
  },
};
