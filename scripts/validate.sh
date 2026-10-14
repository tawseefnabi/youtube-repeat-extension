#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "→ Syntax check (JS)"
for js in content.js popup.js background.js options.js i18n-ui.js; do
  node --check "$js"
done

echo "→ Manifest, i18n, and locales"
node <<'NODE'
const fs = require("fs");
const path = require("path");

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

if (manifest.manifest_version !== 3) {
  throw new Error("manifest_version must be 3");
}
if (manifest.default_locale !== "en") {
  throw new Error('default_locale must be "en"');
}
if (manifest.name !== "__MSG_extName__") {
  throw new Error('manifest name must be "__MSG_extName__"');
}
if (manifest.description !== "__MSG_extDesc__") {
  throw new Error('manifest description must be "__MSG_extDesc__"');
}
if (!manifest.background?.service_worker) {
  throw new Error("background.service_worker is required");
}
if (!manifest.options_ui?.page) {
  throw new Error("options_ui.page is required");
}

const requiredHosts = [
  "*://*.youtube.com/*",
  "*://*.vimeo.com/*",
  "*://player.vimeo.com/*",
];
const hosts = manifest.host_permissions || [];
for (const h of requiredHosts) {
  if (!hosts.includes(h)) {
    throw new Error(`Missing host_permissions entry: ${h}`);
  }
}

const matches = manifest.content_scripts?.[0]?.matches || [];
for (const m of requiredHosts) {
  if (!matches.includes(m)) {
    throw new Error(`Missing content_scripts matches entry: ${m}`);
  }
}

const enPath = path.join("_locales", "en", "messages.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

const requiredMsgKeys = [
  "extName",
  "extDesc",
  "popupTitle",
  "loopCurrentVideo",
  "repeatVideo",
  "loopPortion",
  "openVideoPage",
];
for (const key of requiredMsgKeys) {
  if (!en[key]?.message) {
    throw new Error(`Missing _locales/en/messages.json key: ${key}`);
  }
}

const EXT_NAME = "YouTube Repeat";
if (en.extName.message !== EXT_NAME) {
  throw new Error(
    `extName must be "${EXT_NAME}" (got "${en.extName.message}"). Update _locales/en and run node scripts/generate-locales.js`
  );
}
if (en.popupTitle.message !== EXT_NAME) {
  throw new Error(`popupTitle must match extName ("${EXT_NAME}")`);
}

const desc = en.extDesc.message;
if (desc.length > 132) {
  throw new Error(`extDesc is ${desc.length} chars; Chrome store summary max is 132`);
}

const CHROME_LOCALES = [
  "am", "ar", "bg", "bn", "ca", "cs", "da", "de", "el", "en", "en_AU", "en_GB", "en_US",
  "es", "es_419", "et", "fa", "fi", "fil", "fr", "gu", "he", "hi", "hr", "hu", "id", "it",
  "ja", "kn", "ko", "lt", "lv", "ml", "mr", "ms", "nl", "no", "pl", "pt_BR", "pt_PT", "ro",
  "ru", "sk", "sl", "sr", "sv", "sw", "ta", "te", "th", "tr", "uk", "vi", "zh_CN", "zh_TW",
];

const missingLocales = [];
for (const locale of CHROME_LOCALES) {
  const file = path.join("_locales", locale, "messages.json");
  if (!fs.existsSync(file)) {
    missingLocales.push(locale);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (data.extName?.message !== EXT_NAME) {
    throw new Error(
      `_locales/${locale}/messages.json extName must be "${EXT_NAME}". Run: node scripts/generate-locales.js`
    );
  }
}
if (missingLocales.length) {
  throw new Error(
    `Missing locale folders: ${missingLocales.join(", ")}. Run: node scripts/generate-locales.js`
  );
}

console.log(`  manifest version ${manifest.version}`);
console.log(`  extName: ${EXT_NAME}`);
console.log(`  extDesc: ${desc.length} chars`);
console.log(`  locales: ${CHROME_LOCALES.length} OK`);
NODE

echo "→ Required files"
for f in manifest.json content.js content.css popup.html popup.js popup.css i18n-ui.js \
  background.js options.html options.js options.css \
  _locales/en/messages.json PRIVACY.md \
  icons/icon16.png icons/icon48.png icons/icon128.png README.md; do
  test -f "$f" || { echo "Missing: $f"; exit 1; }
done

fail_if_match() {
  local pattern=$1
  local message=$2
  if grep -En "$pattern" content.js >/dev/null 2>&1; then
    grep -En "$pattern" content.js
    echo "$message"
    exit 1
  fi
}

echo "→ Dangerous DOM APIs (overlay uses appendChild only)"
fail_if_match 'insertAdjacentElement|\.insertBefore\(' \
  "Remove insertAdjacentElement / insertBefore from content.js"
fail_if_match 'ytp-tooltip' \
  "Do not touch YouTube tooltip DOM in content.js"

echo "✓ Validation passed"
