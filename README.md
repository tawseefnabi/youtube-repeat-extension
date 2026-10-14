# YouTube Repeat

A Chrome extension (Manifest V3) that loops **YouTube** and **Vimeo** videos. A loop button sits on the player; **right‑click** it for A–B controls. The popup adds custom **repeat count (0–999)**, **Loop a portion only**, session + **total replay counter**, and **Alt+L**. UI strings support **55 Chrome locales** (see `_locales/`). Settings sync across tabs.

## Install (developer / unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select this folder: `youtube-repeat-extension`.

## Use

1. Open any video on [YouTube](https://www.youtube.com).
2. Click the **repeat** icon in the player bar (before settings). Hover for the tooltip.
3. Or click the extension icon: toggle loop, choose **Forever / 2 / 5 / 10** repeats, or set **A** and **B** at the playhead for a segment loop.
4. Press **Alt+L** on YouTube to toggle loop (when the tab is focused).
5. **Options** (right-click extension → Options): hide the button on Shorts, add a short delay before replay.

Live streams disable loop automatically. Loop defaults **on** for new installs.

## Project layout

| File           | Role                                      |
|----------------|-------------------------------------------|
| `manifest.json`| Extension config                          |
| `content.js`   | Injects player button, handles loop logic |
| `content.css`  | Active loop button styling                |
| `popup.html/js`| Toolbar popup (loop, repeat count, A–B)     |
| `background.js`| Keyboard shortcut → content script        |
| `options.html/js`| Shorts visibility, replay delay         |
| `icons/`       | Extension icons                           |

## Check before upload / publish

From this folder:

```bash
./scripts/validate.sh
```

Then in Chrome:

1. Reload the extension on `chrome://extensions` (version **1.3.0**).
2. Hard refresh a YouTube watch page (`Cmd+Shift+R`).
3. Open the extension **Errors** card → **Clear all**.
4. Play a video, toggle repeat, change videos — confirm **Errors** stays empty.

## Firefox

This build targets Chrome MV3. For Firefox, use `about:debugging` → **This Firefox** → **Load Temporary Add-on** and pick `manifest.json`. Minor manifest tweaks may be needed for a permanent Firefox add-on.

## License

MIT
