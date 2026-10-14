# YouTube Repeat

A Chrome extension (Manifest V3) that loops the current YouTube video. A loop button appears in the player controls; you can also toggle loop from the extension popup. Your choice syncs across tabs.

## Install (developer / unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select this folder: `youtube-repeat-extension`.

## Use

1. Open any video on [YouTube](https://www.youtube.com).
2. Click the **repeat** icon in the player bar (before settings). Hover for the tooltip.
3. Or click the extension icon in the toolbar and check **Loop current video**.

The video restarts from the beginning when it ends while loop is on.

## Project layout

| File           | Role                                      |
|----------------|-------------------------------------------|
| `manifest.json`| Extension config                          |
| `content.js`   | Injects player button, handles loop logic |
| `content.css`  | Active loop button styling                |
| `popup.html/js`| Toolbar popup toggle                        |
| `icons/`       | Extension icons                           |

## Check before upload / publish

From this folder:

```bash
./scripts/validate.sh
```

Then in Chrome:

1. Reload the extension on `chrome://extensions` (version **1.1.2+**).
2. Hard refresh a YouTube watch page (`Cmd+Shift+R`).
3. Open the extension **Errors** card → **Clear all**.
4. Play a video, toggle repeat, change videos — confirm **Errors** stays empty.

## Firefox

This build targets Chrome MV3. For Firefox, use `about:debugging` → **This Firefox** → **Load Temporary Add-on** and pick `manifest.json`. Minor manifest tweaks may be needed for a permanent Firefox add-on.

## License

MIT
