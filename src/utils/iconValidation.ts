export function isImageIcon(icon?: string | null): icon is string {
  const value = icon?.trim();

  if (!value) return false;

  return (
    value.startsWith("data:image") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

export function isRemoteImage(value?: string | null) {
  const icon = value?.trim();

  if (!icon) return false;

  try {
    const url = new URL(icon);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isEmojiIcon(icon?: string | null): icon is string {
  const value = icon?.trim();

  if (!value || hasUnicodeLetter(value)) return false;

  return hasEmojiCodePoint(value) || isKeycapEmoji(value);
}

export function isValidButtonIcon(icon?: string | null) {
  return !icon || isImageIcon(icon) || isEmojiIcon(icon);
}

function hasUnicodeLetter(value: string) {
  try {
    return new RegExp("\\p{L}", "u").test(value);
  } catch {
    return [...value].some(
      (char) => char.toLocaleLowerCase() !== char.toLocaleUpperCase()
    );
  }
}

function hasEmojiCodePoint(value: string) {
  return [...value].some((char) => {
    const codePoint = char.codePointAt(0) ?? 0;

    return (
      (codePoint >= 0x1f000 && codePoint <= 0x1faff) ||
      (codePoint >= 0x2600 && codePoint <= 0x27bf) ||
      codePoint === 0x00a9 ||
      codePoint === 0x00ae ||
      codePoint === 0x3030 ||
      codePoint === 0x303d ||
      codePoint === 0x3297 ||
      codePoint === 0x3299
    );
  });
}

function isKeycapEmoji(value: string) {
  return /^[0-9#*]\ufe0f?\u20e3$/u.test(value);
}
