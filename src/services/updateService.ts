import { APP_CONFIG } from "../config/appConfig";

export type AvailableUpdate = {
  apkName: string | null;
  apkUrl: string | null;
  body: string | null;
  releaseUrl: string;
  version: string;
};

type GitHubRelease = {
  assets?: GitHubReleaseAsset[];
  body?: string | null;
  html_url?: string;
  tag_name?: string;
};

type GitHubReleaseAsset = {
  browser_download_url?: string;
  name?: string;
};

export async function checkForAppUpdate() {
  const response = await fetch(APP_CONFIG.latestReleaseApiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Could not check for updates. Try again later.");
  }

  const release = (await response.json()) as GitHubRelease;
  const latestVersion = release.tag_name?.trim();

  if (!latestVersion) {
    throw new Error("Updater metadata was not found.");
  }

  if (compareVersions(latestVersion, APP_CONFIG.version) <= 0) {
    return null;
  }

  const apkAsset = release.assets?.find((asset) =>
    asset.name?.toLowerCase().endsWith(".apk")
  );

  return {
    apkName: apkAsset?.name ?? null,
    apkUrl: apkAsset?.browser_download_url ?? null,
    body: release.body?.trim() || null,
    releaseUrl: release.html_url ?? APP_CONFIG.latestReleaseUrl,
    version: latestVersion,
  } satisfies AvailableUpdate;
}

export function compareVersions(left: string, right: string) {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);

    if (diff !== 0) {
      return diff > 0 ? 1 : -1;
    }
  }

  return 0;
}

function versionParts(version: string) {
  const normalized = version.trim().replace(/^v/i, "");
  return normalized
    .split(/[.+-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}
