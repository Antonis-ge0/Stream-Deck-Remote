import { readFileSync, writeFileSync } from "node:fs";

const nextVersion = process.argv[2]?.trim().replace(/^v/i, "");

if (!nextVersion || !/^\d+\.\d+\.\d+$/.test(nextVersion)) {
  console.error("Usage: npm run version:bump -- 0.0.3");
  process.exit(1);
}

const androidVersionCode = toAndroidVersionCode(nextVersion);

updateJson("package.json", (json) => {
  json.version = nextVersion;
});

updateJson("package-lock.json", (json) => {
  json.version = nextVersion;

  if (json.packages?.[""]) {
    json.packages[""].version = nextVersion;
  }
});

updateJson("app.json", (json) => {
  json.expo.version = nextVersion;
  json.expo.android.versionCode = androidVersionCode;
});

replaceInFile(
  "src/config/appConfig.ts",
  /version: "v[^"]+"/,
  `version: "v${nextVersion}"`
);

replaceInFile(
  "android/app/build.gradle",
  /versionCode \d+/,
  `versionCode ${androidVersionCode}`
);

replaceInFile(
  "android/app/build.gradle",
  /versionName "[^"]+"/,
  `versionName "${nextVersion}"`
);

console.log(`Updated Stream Deck Remote to v${nextVersion}.`);

function updateJson(path, updater) {
  const json = JSON.parse(readFileSync(path, "utf8"));
  updater(json);
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}

function replaceInFile(path, pattern, replacement) {
  const current = readFileSync(path, "utf8");
  const next = current.replace(pattern, replacement);

  if (next === current) {
    throw new Error(`Could not update ${path}.`);
  }

  writeFileSync(path, next);
}

function toAndroidVersionCode(version) {
  const [major, minor, patch] = version.split(".").map((part) => Number(part));
  return major * 10000 + minor * 100 + patch;
}
