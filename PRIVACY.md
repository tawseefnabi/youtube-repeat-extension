# Privacy Policy — YouTube Repeat

**Last updated:** October 14, 2025

YouTube Repeat adds a repeat control on **YouTube** and **Vimeo** watch pages. It runs entirely in your browser.

## Data collected

The extension **does not** collect, sell, or transmit personal data to the developer or third-party analytics servers. It does **not** access your YouTube or Vimeo account.

## Data stored locally

Settings and counters stay on your device using Chrome extension storage:

| Storage | What |
|--------|------|
| `chrome.storage.sync` | Loop on/off, repeat count (0–999), A–B segment times, “loop portion only”, onboarding flag, Shorts visibility, replay delay |
| `chrome.storage.session` | Remaining repeats and session replay count for the current browser session |
| `chrome.storage.local` | **Total replay count per video** (keyed by site + video id, e.g. `youtube:abc123`) |

Sync data may sync across Chrome profiles signed into the same Google account. Replay totals in `local` stay on this device unless you sync Chrome data through other means.

## Permissions

- **`storage`** — save preferences and replay counters.
- **`*://*.youtube.com/*`**, **`*://*.vimeo.com/*`**, **`*://player.vimeo.com/*`** — inject the repeat button and apply loop behavior only on those sites.

## Contact

For privacy questions, open an issue on the project repository:  
https://github.com/tawseefnabi/youtube-repeat-extension
