export type DeckConfig = {
  activeProfileId: string;
  profiles: Profile[];
};

export type Profile = {
  id: string;
  name: string;
  buttons: DeckButton[];
};

export type DeckButton = {
  id: string;
  label: string;
  icon?: string | null;
  actions?: DeckAction[];
};

export type DeckAction =
  | { type: "openUrl"; url: string }
  | { type: "launchApp"; path: string; args?: string[] }
  | { type: "playSound"; sound: string };
