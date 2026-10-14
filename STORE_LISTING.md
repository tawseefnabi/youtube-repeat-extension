# Chrome Web Store listing (copy into Developer Dashboard)

## Extension name

YouTube Repeat

## Summary (max ~132 characters)

Loop the current YouTube video with one click. Repeat icon beside player settings. Syncs your on/off preference.

## Description

YouTube Repeat adds a simple **repeat** button on YouTube watch pages so you can loop the current video without workarounds.

**Features**

- Repeat icon next to the player settings gear
- Click to turn repeat on or off (white = on, dim = off)
- Toolbar popup toggle
- Preference syncs across Chrome via your Google account
- Works on youtube.com watch pages

**Permissions**

- Storage: saves your loop on/off setting
- YouTube access: shows the button and loops the video on YouTube only

**Privacy**

No analytics. No data sold. See the privacy policy URL in the dashboard.

## Category

Productivity (or Fun)

## Language

English

## Privacy policy URL

https://github.com/tawseefnabi/youtube-repeat-extension/blob/main/PRIVACY.md

## Single purpose

Provide a repeat/loop control for the current YouTube video.

## Permission justifications (if asked)

| Permission | Justification |
|------------|----------------|
| `storage` | Remember whether repeat is enabled |
| Host: `*.youtube.com` | Inject the repeat control and loop the video on YouTube |

## Screenshots (you must upload)

Take **1–5** screenshots (1280×800 or 640×400), for example:

1. YouTube watch page with repeat icon visible near settings (loop on, white icon)
2. Same with loop off (dim icon)
3. Extension popup open

## Promotional images (optional)

Small promo tile: 440×280  
Marquee (optional): 1400×560

## Upload package

Use the zip from:

```bash
./scripts/package-for-store.sh
```

File: `dist/youtube-repeat-store.zip`

## Publish steps

1. Pay the **one-time $5** fee and sign in: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. **New item** → upload `dist/youtube-repeat-store.zip`
3. Fill store listing using text above
4. Set visibility (Public or Unlisted)
5. Submit for review (usually a few days)
