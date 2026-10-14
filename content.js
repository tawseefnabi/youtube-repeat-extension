(function () {
  const SCRIPT_KEY = "__YT_REPEAT_EXT_1_1_2__";
  if (globalThis[SCRIPT_KEY]) return;
  globalThis[SCRIPT_KEY] = true;

  const ROOT_ID = "yt-repeat-extension-root";
  const LOOP_CLASS = "yt-repeat-btn";
  const LOOP_ACTIVE_CLASS = "yt-repeat-active";
  const STORAGE_KEY = "ytRepeatEnabled";

  const LOOP_ICON_SVG =
    '<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%" aria-hidden="true">' +
    '<g transform="translate(4 4) scale(0.78)">' +
    '<path class="yt-repeat-icon" d="M30.2 10 23 4v4h-8C9.477 8 5 12.477 5 18c0 1.414.297 2.758.827 3.978l3.3-2.75A6 6 0 0 1 15 12h8v4l7.2-6zm-.026 4.023-3.301 2.75A6 6 0 0 1 21 24h-8v-4l-7.2 6 7.2 6v-4h8c5.522 0 10-4.478 10-10a9.965 9.965 0 0 0-.826-3.977z"></path>' +
    "</g></svg>";

  let loopEnabled = false;
  let endedHandler = null;
  let boundVideo = null;
  let shadowRoot = null;
  let loopButton = null;
  let refreshTimer = null;

  function getTooltipLabel() {
    return loopEnabled ? "Repeat is on" : "Repeat video";
  }

  function getVideo() {
    return document.querySelector("video.html5-main-video");
  }

  function getPlayerRoot() {
    const video = getVideo();
    return video ? video.closest(".html5-video-player") : null;
  }

  function rectsOverlap(a, b, padding = 3) {
    return !(
      a.right <= b.left + padding ||
      a.left >= b.right - padding ||
      a.bottom <= b.top + padding ||
      a.top >= b.bottom - padding
    );
  }

  function getControlButtonRects(player) {
    const rects = [];
    player.querySelectorAll(".ytp-chrome-bottom button.ytp-button").forEach((btn) => {
      if (!btn.isConnected) return;
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) rects.push(rect);
    });
    return rects;
  }

  function makeBtnRect(left, top, size) {
    return { left, top, right: left + size, bottom: top + size };
  }

  function hitsObstacle(left, top, size, obstacles) {
    return obstacles.some((o) => rectsOverlap(makeBtnRect(left, top, size), o));
  }

  function findCaptionsButton(player) {
    return (
      player.querySelector(".ytp-subtitles-button") ||
      player.querySelector(".ytp-button[aria-label*='Subtitles']") ||
      player.querySelector(".ytp-button[aria-label*='Captions']") ||
      player.querySelector(".ytp-button[aria-label*='subtitles']")
    );
  }

  function computeAutoPosition(player, btn) {
    const settingsBtn = player.querySelector(".ytp-settings-button");
    if (!settingsBtn?.isConnected) return null;

    const settingsRect = settingsBtn.getBoundingClientRect();
    const size = Math.max(36, Math.round(settingsRect.height || 48));
    const rowTop = settingsRect.top + (settingsRect.height - size) / 2;
    const gap = 2;

    btn.style.width = `${size}px`;
    btn.style.height = `${size}px`;

    const playerRect = player.getBoundingClientRect();
    const obstacles = getControlButtonRects(player);

    let left = settingsRect.left - size - gap;

    const ccBtn = findCaptionsButton(player);
    if (ccBtn?.isConnected) {
      const ccRect = ccBtn.getBoundingClientRect();
      if (rectsOverlap(makeBtnRect(left, rowTop, size), ccRect)) {
        left = ccRect.left - size - gap;
      }
    }

    while (hitsObstacle(left, rowTop, size, obstacles) && left > playerRect.left + 4) {
      left -= 4;
    }

    return { left: Math.max(playerRect.left + 4, left), top: rowTop };
  }

  function cleanupLegacyPlayerButtons() {
    document.querySelectorAll(`.${LOOP_CLASS}`).forEach((node) => {
      if (node.closest(`#${ROOT_ID}`)) return;
      try {
        node.remove();
      } catch {
        /* ignore */
      }
    });
    document.querySelectorAll(".yt-repeat-host").forEach((node) => {
      try {
        node.remove();
      } catch {
        /* ignore */
      }
    });
  }

  function ensureUiRoot() {
    if (shadowRoot && loopButton?.isConnected) return loopButton;

    let host = document.getElementById(ROOT_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = ROOT_ID;
      host.style.cssText =
        "pointer-events:none;position:fixed;inset:0;z-index:2147483647;margin:0;padding:0;border:0;width:0;height:0;overflow:visible";
      document.body.appendChild(host);
    }

    if (!host.shadowRoot) {
      shadowRoot = host.attachShadow({ mode: "closed" });
      const style = document.createElement("style");
      style.textContent =
        "button{margin:0;padding:0;border:0;background:transparent;cursor:pointer;" +
        "width:48px;height:48px;position:fixed;z-index:2147483647;display:none;" +
        "pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent}" +
        "button:hover{opacity:1}" +
        "button:not(.active){opacity:.85}" +
        "button.active{opacity:1}" +
        "svg{width:100%;height:100%;pointer-events:none}" +
        ".yt-repeat-icon{fill:rgba(255,255,255,.45);transition:fill .15s ease}" +
        "button.active .yt-repeat-icon{fill:#fff}";
      shadowRoot.appendChild(style);
    } else {
      shadowRoot = host.shadowRoot;
    }

    loopButton = shadowRoot.querySelector(`.${LOOP_CLASS}`);
    if (!loopButton) {
      loopButton = document.createElement("button");
      loopButton.type = "button";
      loopButton.className = LOOP_CLASS;
      loopButton.innerHTML = LOOP_ICON_SVG;
      loopButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleLoop();
      });
      shadowRoot.appendChild(loopButton);
    }

    return loopButton;
  }

  function positionLoopButton() {
    const player = getPlayerRoot();
    const btn = ensureUiRoot();
    if (!btn || !player) return;

    const pos = computeAutoPosition(player, btn);
    if (!pos) {
      btn.style.display = "none";
      return;
    }

    btn.style.left = `${pos.left}px`;
    btn.style.top = `${pos.top}px`;
    btn.style.display = "block";
  }

  function syncLoopAttribute(video) {
    if (!video) return;
    video.loop = loopEnabled;
  }

  function unbindVideo() {
    if (boundVideo && endedHandler) {
      boundVideo.removeEventListener("ended", endedHandler);
    }
    boundVideo = null;
    endedHandler = null;
  }

  function bindVideo(video) {
    if (!video || video === boundVideo) return;

    unbindVideo();
    boundVideo = video;
    syncLoopAttribute(video);

    endedHandler = () => {
      if (!loopEnabled) return;
      video.currentTime = 0;
      video.play().catch(() => {});
    };
    video.addEventListener("ended", endedHandler);
  }

  function updateButtonState() {
    if (!loopButton) return;
    const label = getTooltipLabel();
    loopButton.classList.toggle(LOOP_ACTIVE_CLASS, loopEnabled);
    loopButton.classList.toggle("active", loopEnabled);
    loopButton.setAttribute("aria-label", label);
    loopButton.setAttribute("title", label);
    loopButton.setAttribute("aria-pressed", loopEnabled ? "true" : "false");
  }

  function setLoopEnabled(enabled) {
    loopEnabled = enabled;
    chrome.storage.sync.set({ [STORAGE_KEY]: loopEnabled });
    syncLoopAttribute(getVideo());
    updateButtonState();
  }

  function toggleLoop() {
    setLoopEnabled(!loopEnabled);
  }

  function refresh() {
    try {
      cleanupLegacyPlayerButtons();
      ensureUiRoot();
      positionLoopButton();
      bindVideo(getVideo());
      updateButtonState();
    } catch {
      /* ignore */
    }
  }

  function scheduleRefresh() {
    if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      refreshTimer = null;
      refresh();
    }, 200);
  }

  chrome.storage.sync.remove(["ytRepeatOffsetX", "ytRepeatOffsetY"]);
  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    if (data[STORAGE_KEY] === undefined) {
      loopEnabled = true;
      chrome.storage.sync.set({ [STORAGE_KEY]: true });
    } else {
      loopEnabled = Boolean(data[STORAGE_KEY]);
    }
    scheduleRefresh();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes[STORAGE_KEY]) return;
    loopEnabled = Boolean(changes[STORAGE_KEY].newValue);
    syncLoopAttribute(getVideo());
    updateButtonState();
  });

  document.addEventListener("yt-navigate-finish", scheduleRefresh);
  window.addEventListener("yt-page-data-updated", scheduleRefresh);
  window.addEventListener("resize", scheduleRefresh);
  window.addEventListener("scroll", scheduleRefresh, true);

  cleanupLegacyPlayerButtons();
  scheduleRefresh();
  setInterval(scheduleRefresh, 1500);
})();
