#!/usr/bin/env node
/**
 * Generates _locales/* from en + optional translated overrides.
 * Run: node scripts/generate-locales.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const EN_PATH = path.join(ROOT, "_locales", "en", "messages.json");
const en = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));

const CHROME_LOCALES = [
  "am", "ar", "bg", "bn", "ca", "cs", "da", "de", "el", "en", "en_AU", "en_GB", "en_US",
  "es", "es_419", "et", "fa", "fi", "fil", "fr", "gu", "he", "hi", "hr", "hu", "id", "it",
  "ja", "kn", "ko", "lt", "lv", "ml", "mr", "ms", "nl", "no", "pl", "pt_BR", "pt_PT", "ro",
  "ru", "sk", "sl", "sr", "sv", "sw", "ta", "te", "th", "tr", "uk", "vi", "zh_CN", "zh_TW",
];

const overrides = {
  es: {
    loopCurrentVideo: "Repetir video actual",
    loopPortion: "Repetir solo un fragmento",
    setA: "Punto A",
    setB: "Punto B",
    clear: "Borrar",
    forever: "Siempre",
  },
  fr: {
    loopCurrentVideo: "Boucler la vidéo",
    loopPortion: "Boucler une portion seulement",
    setA: "Point A",
    setB: "Point B",
  },
  de: {
    loopCurrentVideo: "Video wiederholen",
    loopPortion: "Nur Abschnitt wiederholen",
    setA: "Punkt A",
    setB: "Punkt B",
  },
  pt_BR: {
    loopCurrentVideo: "Repetir vídeo atual",
    loopPortion: "Repetir apenas um trecho",
  },
  hi: { loopCurrentVideo: "वीडियो लूप करें", loopPortion: "केवल हिस्सा लूप करें" },
  ja: { loopCurrentVideo: "動画をループ", loopPortion: "部分ループのみ" },
  ko: { loopCurrentVideo: "동영상 반복", loopPortion: "구간만 반복" },
  zh_CN: { loopCurrentVideo: "循环当前视频", loopPortion: "仅循环片段" },
  ar: { loopCurrentVideo: "تكرار الفيديو", loopPortion: "تكرار جزء فقط" },
  ru: { loopCurrentVideo: "Повтор видео", loopPortion: "Повтор фрагмента" },
  it: { loopCurrentVideo: "Ripeti video", loopPortion: "Ripeti solo un segmento" },
  nl: { loopCurrentVideo: "Video herhalen", loopPortion: "Alleen deel herhalen" },
  pl: { loopCurrentVideo: "Zapętlaj wideo", loopPortion: "Zapętlaj tylko fragment" },
  tr: { loopCurrentVideo: "Videoyu tekrarla", loopPortion: "Yalnızca bölümü tekrarla" },
  vi: { loopCurrentVideo: "Lặp video", loopPortion: "Chỉ lặp đoạn" },
  id: { loopCurrentVideo: "Ulangi video", loopPortion: "Ulangi bagian saja" },
  th: { loopCurrentVideo: "วนซ้ำวิดีโอ", loopPortion: "วนซ้ำเฉพาะช่วง" },
};

function localeOverrides(locale) {
  const base = locale.split("_")[0];
  return { ...(overrides[base] || {}), ...(overrides[locale] || {}) };
}

for (const locale of CHROME_LOCALES) {
  const out = {};
  const o = localeOverrides(locale);
  for (const [key, val] of Object.entries(en)) {
    if (o[key]) {
      out[key] = { message: o[key] };
    } else {
      out[key] = val;
    }
  }
  const dir = path.join(ROOT, "_locales", locale);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "messages.json"), JSON.stringify(out, null, 2) + "\n");
}

console.log(`Generated ${CHROME_LOCALES.length} locales in _locales/`);
