# Chrome Web Store listing (SEO + copy-paste)

Chrome Web Store **does not have a separate “tags” field** anymore. Search ranking uses your **name**, **short description**, **long description**, category, ratings, and install count — like [YouTube Repeat on the store](https://chromewebstore.google.com/detail/youtube-repeat/jhkfddihpaahlogkaaljcfjlfpiomacl?hl=en).

Use the keyword list below **naturally** in title + descriptions (no keyword stuffing spam — Google can reject listings).

---

## Target searches (use these phrases in listing text)

Primary:

- youtube loop
- youtube repeat
- loop youtube video
- repeat youtube video
- youtube video loop
- auto replay youtube

Secondary:

- looper for youtube
- replay youtube
- listen on repeat
- loop song youtube
- repeat button youtube

---

## Extension name (store + manifest)

**Recommended store name:**

`YouTube Repeat`

*(Note: another listing may already use “YouTube Repeat” on the store. If the dashboard rejects a duplicate name, try `YouTube Repeat - Loop Video` or your GitHub publisher name as prefix.)*

---

## Short description / summary (max 132 characters)

Paste into **Summary** in the dashboard (and matches `manifest.json` `description`):

```
YouTube loop in one click: repeat the current video. Auto replay with a player button by settings. Simple looper for YouTube.
```

(131 characters)

---

## Long description (paste into Store listing → Description)

```
YouTube Repeat — loop YouTube videos in one click

Looking for a youtube loop or youtube repeat tool? This extension adds a repeat button on YouTube watch pages so you can loop the current video automatically — no extra tabs, no hacks.

How to loop a YouTube video

1. Install the extension from the Chrome Web Store.
2. Open any video on YouTube.
3. Click the repeat icon next to the player settings (gear).
4. When repeat is on, the icon turns white; the video replays from the start when it ends.
5. Turn loop off anytime from the icon or the extension popup.

Features

• YouTube loop / repeat for the full video
• Repeat button beside native player controls (settings area)
• Clear on/off state (white = loop on, dim = off)
• YouTube **and Vimeo** watch pages
• Toolbar popup: custom repeat count (0–999), “Loop a portion only”, A–B segment
• Right‑click player repeat button for A–B panel (Set A / Set B / Clear)
• Session replay counter + total replays per video (stored locally)
• Keyboard shortcut Alt+L (customize at chrome://extensions/shortcuts)
• 55 Chrome UI locales (`_locales/`)
• Options: hide button on Shorts, optional delay before replay
• Live streams: loop disabled automatically
• Loop preference syncs with Chrome (storage sync)
• Lightweight — works on youtube.com only
• No account required

Who is this for?

• Music — loop a song on YouTube while you work
• Learning — replay a lesson clip until it sticks
• Language practice — repeat a phrase or segment
• Fitness / dance — replay a short section of a workout video

Privacy

• No analytics
• No selling of user data
• Only stores your loop on/off preference locally / sync storage

Permissions

• storage — remember loop on/off
• youtube.com — show the repeat control and loop the video on YouTube

FAQ

How do I loop a YouTube video?
Open a video and click the repeat icon by the settings button, or use the extension popup.

Does this loop the whole video?
Yes — the entire current video repeats when it ends while loop is enabled.

Does it work on playlists?
It loops the current playing video. When the next video starts, use repeat again if you want that video to loop.

Is it free?
Yes.

Support

Issues and feedback: https://github.com/tawseefnabi/youtube-repeat-extension

Enjoy your YouTube loop and repeat playback.
```

---

## Category

**Productivity** (first choice) or **Fun**

---

## Language

English (add more languages later if you translate the description)

---

## Privacy policy URL

https://github.com/tawseefnabi/youtube-repeat-extension/blob/main/PRIVACY.md

---

## Single purpose (dashboard)

Loop / repeat the current YouTube video when the user turns repeat on.

---

## Permission justifications

| Permission | Justification |
|------------|----------------|
| `storage` | Save whether YouTube loop / repeat is enabled |
| Host: `*.youtube.com` | Add the repeat button and loop playback on YouTube watch pages only |

---

## Store SEO checklist (after publish)

- [ ] Title includes **YouTube** + **loop** or **repeat**
- [ ] Short description includes **youtube loop** and **repeat**
- [ ] Long description uses primary keywords in first 2 paragraphs
- [ ] 3–5 **screenshots** showing the button on a real YouTube watch page
- [ ] Ask early users for **reviews** (rating count affects ranking)
- [ ] Update listing when you ship features (Google favors maintained items)

**Note:** You cannot guarantee #1 rank. The [existing “YouTube Repeat” listing](https://chromewebstore.google.com/detail/youtube-repeat/jhkfddihpaahlogkaaljcfjlfpiomacl?hl=en) has years of installs and reviews. Strong copy + screenshots + reviews over time improves visibility for searches like “youtube loop”.

---

## Screenshots

1280×800 or 640×400 — caption ideas:

1. “YouTube loop — repeat icon by settings”
2. “Repeat on — video auto replay”
3. “Extension popup — toggle loop”

---

## Upload package

```bash
./scripts/package-for-store.sh
```

Upload: `dist/youtube-repeat-store.zip`

---

## Publish

[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **New item** → upload zip → paste fields above → Submit for review.
