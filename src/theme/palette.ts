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
    bg: "#f4f7fb",
    panel: "#ffffff",
    panelAlt: "#eef3f7",
    text: "#15171c",
    muted: "#667085",
    border: "#d9e2ec",
    borderStrong: "#b8c4d2",
    primary: "#2563eb",
    primarySoft: "#dbeafe",
    primaryText: "#ffffff",
    accent: "#0f9f6e",
    accentSoft: "#d8f5ea",
    warning: "#b7791f",
    warningSoft: "#fff3d6",
    danger: "#d92d20",
    dangerSoft: "#fee4e2",
    shadow: "rgba(17, 24, 39, 0.08)",
  },
  dark: {
    bg: "#101214",
    panel: "#181b1f",
    panelAlt: "#22272e",
    text: "#f6f3ee",
    muted: "#a4a8b2",
    border: "#303741",
    borderStrong: "#47515f",
    primary: "#5b9dff",
    primarySoft: "#172b4d",
    primaryText: "#07111f",
    accent: "#42d392",
    accentSoft: "#153526",
    warning: "#e0a63b",
    warningSoft: "#3b2b12",
    danger: "#f97066",
    dangerSoft: "#3d1816",
    shadow: "rgba(0, 0, 0, 0.28)",
  },
};
