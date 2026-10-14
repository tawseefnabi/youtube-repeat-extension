(function () {
  const SCRIPT_VERSION = "1.3.3";
  const SCRIPT_KEY = "__YT_REPEAT_EXT__";
  if (globalThis[SCRIPT_KEY] === SCRIPT_VERSION) return;
  document.getElementById("yt-repeat-extension-root")?.remove();
  globalThis[SCRIPT_KEY] = SCRIPT_VERSION;

  const ROOT_ID = "yt-repeat-extension-root";
  const LOOP_CLASS = "yt-repeat-btn";
  const LOOP_ACTIVE_CLASS = "yt-repeat-active";
  const STORAGE_KEY = "ytRepeatEnabled";
  const LIMIT_KEY = "ytRepeatLimit";
  const AB_ENABLED_KEY = "ytAbLoopEnabled";
  const AB_START_KEY = "ytAbStart";
  const AB_END_KEY = "ytAbEnd";
  const AB_VIDEO_KEY = "ytAbVideoId";
  const PORTION_ONLY_KEY = "ytLoopPortionOnly";
  const ONBOARDING_KEY = "ytOnboardingDone";
  const HIDE_SHORTS_KEY = "ytHideOnShorts";
  const LOOP_DELAY_KEY = "ytLoopDelaySec";
  const SESSION_REMAINING = "ytRepeatRemaining";
  const SESSION_REPLAYS = "ytSessionReplays";
  const TOTAL_REPLAYS_KEY = "ytReplayTotals";

  const LOOP_ICON_SVG =
    '<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%" aria-hidden="true">' +
    '<g transform="translate(4 4) scale(0.78)">' +
    '<path class="yt-repeat-icon" d="M30.2 10 23 4v4h-8C9.477 8 5 12.477 5 18c0 1.414.297 2.758.827 3.978l3.3-2.75A6 6 0 0 1 15 12h8v4l7.2-6zm-.026 4.023-3.301 2.75A6 6 0 0 1 21 24h-8v-4l-7.2 6 7.2 6v-4h8c5.522 0 10-4.478 10-10a9.965 9.965 0 0 0-.826-3.977z"></path>' +
    "</g></svg>";

  function t(key, ...subs) {
    const msg = chrome.i18n.getMessage(key, subs);
    return msg || key;
  }

  function platformId() {
    const h = location.hostname;
    if (h.includes("youtube.com")) return "youtube";
    if (h.includes("vimeo.com")) return "vimeo";
    return "unknown";
  }

  const platform = platformId();
  if (platform === "unknown") return;

  let loopEnabled = false;
  let repeatLimit = 0;
  let repeatsRemaining = 0;
  let abLoopEnabled = false;
  let abStart = null;
  let abEnd = null;
  let abVideoId = "";
  let portionOnly = false;
  let hideOnShorts = false;
  let loopDelaySec = 0;
  let onboardingDone = true;

  let boundVideo = null;
  let endedHandler = null;
  let timeupdateHandler = null;
  let shadowRoot = null;
  let loopButton = null;
  let panelEl = null;
  let hintEl = null;
  let refreshTimer = null;
  let panelOpen = false;
  let suppressPrimaryClickUntil = 0;

  function getVideoId() {
    if (platform === "youtube") {
      const path = location.pathname;
      if (path.startsWith("/shorts/")) return path.split("/")[2] || "";
      return new URL(location.href).searchParams.get("v") || "";
    }
    if (platform === "vimeo") {
      const m =
        location.pathname.match(/\/video\/(\d+)/) ||
        location.pathname.match(/^\/(\d+)/) ||
        location.href.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return m ? m[1] : "";
    }
    return "";
  }

  function videoStorageKey() {
    const id = getVideoId();
    return id ? `${platform}:${id}` : "";
  }

  function isShortsPage() {
    return platform === "youtube" && location.pathname.startsWith("/shorts/");
  }

  function getVideo() {
    if (platform === "youtube") {
      return document.querySelector("video.html5-main-video");
    }
    const candidates = document.querySelectorAll("video");
    let best = null;
    let bestArea = 0;
    candidates.forEach((v) => {
      const r = v.getBoundingClientRect();
      const area = r.width * r.height;
      if (area > bestArea) {
        bestArea = area;
        best = v;
      }
    });
    return best;
  }

  function getPlayerRoot() {
    const video = getVideo();
    if (!video) return null;
    if (platform === "youtube") {
      return video.closest(".html5-video-player");
    }
    return (
      video.closest(".player") ||
      video.closest('[data-player="true"]') ||
      video.closest(".vp-video-wrapper") ||
      video.parentElement
    );
  }

  function isLiveStream(player, video) {
    if (!video) return false;
    if (platform === "youtube") {
      return Boolean(player?.querySelector(".ytp-live-badge, .ytp-live"));
    }
    return Boolean(
      player?.querySelector(".vp-live, .live-badge, [data-live='true']") ||
        document.querySelector(".vp-live")
    );
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function isAbSegmentActive() {
    return (
      portionOnly &&
      abLoopEnabled &&
      abVideoId === getVideoId() &&
      abStart != null &&
      abEnd != null &&
      abEnd > abStart
    );
  }

  function getTooltipLabel() {
    if (!loopEnabled) return t("repeatVideo");
    if (repeatLimit > 0 && repeatsRemaining > 0) {
      return t("repeatLeft", String(repeatsRemaining));
    }
    return t("repeatIsOn");
  }

  function rectsOverlap(a, b, padding = 3) {
    return !(
      a.right <= b.left + padding ||
      a.left >= b.right - padding ||
      a.bottom <= b.top + padding ||
      a.top >= b.bottom - padding
    );
  }

  function makeBtnRect(left, top, size) {
    return { left, top, right: left + size, bottom: top + size };
  }

  function hitsObstacle(left, top, size, obstacles) {
    return obstacles.some((o) => rectsOverlap(makeBtnRect(left, top, size), o));
  }

  function getYouTubeControlButtonRects(player) {
    const rects = [];
    player.querySelectorAll(".ytp-chrome-bottom button.ytp-button").forEach((btn) => {
      if (!btn.isConnected) return;
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) rects.push(rect);
    });
    return rects;
  }

  function findYouTubeCaptionsButton(player) {
    return (
      player.querySelector(".ytp-subtitles-button") ||
      player.querySelector(".ytp-button[aria-label*='Subtitles']") ||
      player.querySelector(".ytp-button[aria-label*='Captions']")
    );
  }

  function fallbackControlPosition(container, btn) {
    const rect = container.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return null;
    const size = 40;
    btn.style.width = `${size}px`;
    btn.style.height = `${size}px`;
    return {
      left: Math.max(8, rect.right - size - 96),
      top: Math.max(8, rect.bottom - size - 52),
      size,
    };
  }

  function computeYouTubePosition(player, btn) {
    const settingsBtn = player.querySelector(".ytp-settings-button");
    if (!settingsBtn?.isConnected) return fallbackControlPosition(player, btn);

    const settingsRect = settingsBtn.getBoundingClientRect();
    const size = Math.max(36, Math.round(settingsRect.height || 48));
    const rowTop = settingsRect.top + (settingsRect.height - size) / 2;
    const gap = 2;

    btn.style.width = `${size}px`;
    btn.style.height = `${size}px`;

    const playerRect = player.getBoundingClientRect();
    const obstacles = getYouTubeControlButtonRects(player);

    let left = settingsRect.left - size - gap;
    const ccBtn = findYouTubeCaptionsButton(player);
    if (ccBtn?.isConnected) {
      const ccRect = ccBtn.getBoundingClientRect();
      if (rectsOverlap(makeBtnRect(left, rowTop, size), ccRect)) {
        left = ccRect.left - size - gap;
      }
    }

    while (hitsObstacle(left, rowTop, size, obstacles) && left > playerRect.left + 4) {
      left -= 4;
    }

    return { left: Math.max(playerRect.left + 4, left), top: rowTop, size };
  }

  function getVimeoControlButtonRects(player) {
    const rects = [];
    player.querySelectorAll("button, .vp-controls button, .vp-controls__control").forEach((btn) => {
      if (!btn.isConnected) return;
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) rects.push(rect);
    });
    return rects;
  }

  function computeVimeoPosition(player, btn) {
    const anchor =
      player.querySelector(".vp-prefs") ||
      player.querySelector('[data-prefs="true"]') ||
      player.querySelector('button[aria-label*="Settings"]') ||
      player.querySelector('button[aria-label*="settings"]') ||
      player.querySelector(".vp-controls__item:last-child button");

    const playerRect = player.getBoundingClientRect();
    const size = 40;
    btn.style.width = `${size}px`;
    btn.style.height = `${size}px`;

    if (anchor?.isConnected) {
      const anchorRect = anchor.getBoundingClientRect();
      const rowTop = anchorRect.top + (anchorRect.height - size) / 2;
      let left = anchorRect.left - size - 4;
      const obstacles = getVimeoControlButtonRects(player);
      while (hitsObstacle(left, rowTop, size, obstacles) && left > playerRect.left + 4) {
        left -= 4;
      }
      return { left: Math.max(playerRect.left + 4, left), top: rowTop, size };
    }

    const bottom = playerRect.bottom - size - 48;
    const left = playerRect.right - size - 12;
    return { left, top: bottom, size };
  }

  function computeAutoPosition(player, btn) {
    if (platform === "youtube") return computeYouTubePosition(player, btn);
    return computeVimeoPosition(player, btn);
  }

  function persistState() {
    chrome.storage.sync.set({
      [STORAGE_KEY]: loopEnabled,
      [LIMIT_KEY]: repeatLimit,
      [AB_ENABLED_KEY]: abLoopEnabled,
      [AB_START_KEY]: abStart,
      [AB_END_KEY]: abEnd,
      [AB_VIDEO_KEY]: abVideoId,
      [PORTION_ONLY_KEY]: portionOnly,
    });
  }

  function resetRepeatCounter() {
    repeatsRemaining = repeatLimit > 0 ? repeatLimit : 0;
    chrome.storage.session.set({
      [SESSION_REMAINING]: repeatsRemaining,
      [SESSION_REPLAYS]: 0,
    });
  }

  function incrementReplayCount() {
    chrome.storage.session.get(SESSION_REPLAYS, (data) => {
      const n = Number(data[SESSION_REPLAYS] || 0) + 1;
      chrome.storage.session.set({ [SESSION_REPLAYS]: n });
    });

    const key = videoStorageKey();
    if (!key) return;
    chrome.storage.local.get(TOTAL_REPLAYS_KEY, (data) => {
      const totals = data[TOTAL_REPLAYS_KEY] || {};
      totals[key] = Number(totals[key] || 0) + 1;
      chrome.storage.local.set({ [TOTAL_REPLAYS_KEY]: totals });
    });
  }

  function getTotalReplays(callback) {
    const key = videoStorageKey();
    if (!key) {
      callback(0);
      return;
    }
    chrome.storage.local.get(TOTAL_REPLAYS_KEY, (data) => {
      const totals = data[TOTAL_REPLAYS_KEY] || {};
      callback(Number(totals[key] || 0));
    });
  }

  function unbindVideo() {
    if (boundVideo && endedHandler) boundVideo.removeEventListener("ended", endedHandler);
    if (boundVideo && timeupdateHandler) boundVideo.removeEventListener("timeupdate", timeupdateHandler);
    boundVideo = null;
    endedHandler = null;
    timeupdateHandler = null;
  }

  function replayFromStart(video) {
    const seek = () => {
      video.currentTime = 0;
      video.play().catch(() => {});
      incrementReplayCount();
    };
    if (loopDelaySec > 0) setTimeout(seek, loopDelaySec * 1000);
    else seek();
  }

  function applyLoopToVideo() {
    const video = getVideo();
    const player = getPlayerRoot();
    if (!video) return;

    if (isLiveStream(player, video)) {
      video.loop = false;
      updateButtonState();
      return;
    }

    if (isAbSegmentActive()) {
      video.loop = false;
      return;
    }

    if (!loopEnabled) {
      video.loop = false;
      return;
    }

    video.loop = repeatLimit === 0;
  }

  function bindVideo(video) {
    if (!video || video === boundVideo) return;

    unbindVideo();
    boundVideo = video;
    applyLoopToVideo();

    endedHandler = () => {
      if (isAbSegmentActive()) return;
      if (!loopEnabled) return;

      if (repeatLimit > 0) {
        repeatsRemaining -= 1;
        chrome.storage.session.set({ [SESSION_REMAINING]: repeatsRemaining });
        if (repeatsRemaining <= 0) {
          setLoopEnabled(false, { persist: true, resetCounter: false });
          return;
        }
      }

      replayFromStart(video);
    };
    video.addEventListener("ended", endedHandler);

    timeupdateHandler = () => {
      if (!isAbSegmentActive()) return;
      if (video.currentTime >= abEnd - 0.08) {
        video.currentTime = abStart;
        incrementReplayCount();
      }
    };
    video.addEventListener("timeupdate", timeupdateHandler);

    if (!video.dataset.ytRepeatMetaBound) {
      video.dataset.ytRepeatMetaBound = "1";
      video.addEventListener("loadedmetadata", () => {
        applyLoopToVideo();
        updateButtonState();
        scheduleRefresh();
      });
    }
  }

  function suppressPrimaryClickBriefly() {
    suppressPrimaryClickUntil = Date.now() + 280;
  }

  function bindLoopButtonEvents(btn) {
    if (!btn || btn.dataset.ytRepeatBound === SCRIPT_VERSION) return;
    btn.dataset.ytRepeatBound = SCRIPT_VERSION;

    btn.addEventListener(
      "click",
      (e) => {
        if (e.button !== 0) return;
        if (Date.now() < suppressPrimaryClickUntil) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        dismissOnboarding();
        closePanel();
        toggleLoop();
      },
      true
    );

    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      suppressPrimaryClickBriefly();
      dismissOnboarding();
      if (panelOpen) closePanel();
      else openPanel();
    });
  }

  function updatePanelUi() {
    if (!panelEl) return;
    const loopRow = panelEl.querySelector('[data-action="toggle-loop"]');
    if (loopRow) {
      loopRow.classList.toggle("is-on", loopEnabled);
      loopRow.setAttribute("aria-checked", loopEnabled ? "true" : "false");
    }
    const portionCb = panelEl.querySelector(".yt-repeat-portion-cb");
    const rangeEl = panelEl.querySelector(".yt-repeat-panel-range");
    if (portionCb) portionCb.checked = portionOnly;
    if (rangeEl) {
      if (abStart != null && abEnd != null) {
        rangeEl.textContent = `${formatTime(abStart)} → ${formatTime(abEnd)}`;
      } else {
        rangeEl.textContent = "—";
      }
    }
  }

  function closePanel() {
    panelOpen = false;
    if (panelEl) panelEl.style.display = "none";
  }

  function openPanel() {
    panelOpen = true;
    ensureUiRoot();
    if (panelEl) {
      updatePanelUi();
      positionPanel();
      panelEl.style.display = "block";
    }
  }

  function positionPanel() {
    if (!panelEl || !loopButton) return;
    const rect = loopButton.getBoundingClientRect();
    panelEl.style.left = `${Math.max(8, rect.left - 80)}px`;
    panelEl.style.top = `${rect.top - panelEl.offsetHeight - 8}px`;
  }

  function updateButtonState() {
    if (!loopButton) return;
    const player = getPlayerRoot();
    const video = getVideo();
    const live = isLiveStream(player, video);
    const active = loopEnabled && !live;

    loopButton.classList.toggle(LOOP_ACTIVE_CLASS, active);
    loopButton.classList.toggle("active", active);
    loopButton.disabled = false;
    loopButton.style.opacity = live ? "0.45" : "1";
    loopButton.style.pointerEvents = live ? "none" : "auto";

    const label = live ? t("liveRepeatUnavailable") : getTooltipLabel();
    loopButton.setAttribute("aria-label", label);
    loopButton.setAttribute("title", label);
    loopButton.setAttribute("aria-pressed", active ? "true" : "false");
    updatePanelUi();
  }

  function setLoopEnabled(enabled, opts = {}) {
    const { persist = true, resetCounter = true } = opts;
    loopEnabled = enabled;
    if (enabled && resetCounter && repeatLimit > 0) resetRepeatCounter();
    if (persist) persistState();
    applyLoopToVideo();
    updateButtonState();
  }

  function setPortionOnly(on, opts = {}) {
    portionOnly = Boolean(on);
    if (!portionOnly) {
      abLoopEnabled = false;
    } else if (abStart != null && abEnd != null && abEnd > abStart && abVideoId === getVideoId()) {
      abLoopEnabled = true;
    }
    if (opts.persist !== false) persistState();
    applyLoopToVideo();
    updateButtonState();
  }

  function toggleLoop() {
    const video = getVideo();
    const player = getPlayerRoot();
    if (video && isLiveStream(player, video)) return;

    if (!loopEnabled && portionOnly) {
      portionOnly = false;
      abLoopEnabled = false;
    }

    setLoopEnabled(!loopEnabled);
  }

  function setAbPoint(which) {
    const video = getVideo();
    if (!video || isLiveStream(getPlayerRoot(), video)) return { ok: false };
    const time = video.currentTime;
    abVideoId = getVideoId();
    if (which === "A") abStart = time;
    if (which === "B") abEnd = time;
    if (abStart != null && abEnd != null && abEnd < abStart) {
      const tmp = abStart;
      abStart = abEnd;
      abEnd = tmp;
    }
    if (abStart != null && abEnd != null && abEnd > abStart) {
      abLoopEnabled = true;
    }
    persistState();
    applyLoopToVideo();
    updateButtonState();
    updatePanelUi();
    return { ok: true, abStart, abEnd, abVideoId, portionOnly };
  }

  function clearAbLoop() {
    abLoopEnabled = false;
    abStart = null;
    abEnd = null;
    abVideoId = "";
    portionOnly = false;
    persistState();
    applyLoopToVideo();
    updateButtonState();
    updatePanelUi();
  }

  function showOnboardingHint(btn) {
    if (onboardingDone || !shadowRoot) return;
    if (hintEl?.isConnected) return;

    hintEl = document.createElement("div");
    hintEl.className = "yt-repeat-hint";
    hintEl.textContent = t("onboardingHint");
    hintEl.addEventListener("click", dismissOnboarding);
    shadowRoot.appendChild(hintEl);

    const rect = btn.getBoundingClientRect();
    hintEl.style.top = `${rect.top - 36}px`;
    hintEl.style.left = `${Math.max(8, rect.left - 40)}px`;
    setTimeout(dismissOnboarding, 6000);
  }

  function dismissOnboarding() {
    onboardingDone = true;
    chrome.storage.sync.set({ [ONBOARDING_KEY]: true });
    hintEl?.remove();
    hintEl = null;
  }

  function ensureUiRoot() {
    let host = document.getElementById(ROOT_ID);
    if (host && !shadowRoot) {
      host.remove();
      host = null;
    }

    if (!host) {
      host = document.createElement("div");
      host.id = ROOT_ID;
      host.style.cssText =
        "pointer-events:none;position:fixed;inset:0;z-index:2147483647;margin:0;padding:0;border:0;overflow:visible;background:transparent";
      document.body.appendChild(host);
    }

    if (!shadowRoot) {
      shadowRoot = host.attachShadow({ mode: "closed" });
      const style = document.createElement("style");
      style.textContent =
        "button{margin:0;padding:6px;border:0;background:transparent;cursor:pointer;" +
        "width:48px;height:48px;min-width:48px;min-height:48px;box-sizing:content-box;position:fixed;" +
        "z-index:2147483647;display:none;pointer-events:auto;touch-action:manipulation;" +
        "-webkit-tap-highlight-color:transparent}" +
        "button:hover{opacity:1}" +
        "button:not(.active){opacity:1}" +
        "button.active{opacity:1}" +
        "svg{width:100%;height:100%;pointer-events:none;display:block}" +
        ".yt-repeat-icon{fill:rgba(255,255,255,.72);transition:fill .12s ease,filter .12s ease}" +
        "button.active .yt-repeat-icon{fill:#fff;filter:drop-shadow(0 0 2px rgba(0,0,0,.45))}" +
        ".yt-repeat-hint,.yt-repeat-panel{position:fixed;z-index:2147483647;background:rgba(28,28,28,.96);color:#fff;" +
        "font:400 13px/1.35 Roboto,Arial,sans-serif;border-radius:2px;" +
        "pointer-events:auto;box-shadow:0 8px 24px rgba(0,0,0,.45)}" +
        ".yt-repeat-hint{padding:8px 10px;white-space:nowrap;cursor:pointer}" +
        ".yt-repeat-panel{display:none;min-width:240px;padding:6px 0}" +
        ".yt-repeat-menu-item{display:flex;align-items:center;gap:10px;width:100%;margin:0;padding:8px 16px;" +
        "border:0;background:transparent;color:#fff;text-align:left;cursor:pointer;font:inherit}" +
        ".yt-repeat-menu-item:hover{background:rgba(255,255,255,.1)}" +
        ".yt-repeat-menu-item .menu-icon{width:20px;height:20px;opacity:.9;flex-shrink:0}" +
        ".yt-repeat-menu-item .menu-check{margin-left:auto;opacity:0;font-size:14px}" +
        ".yt-repeat-menu-item.is-on .menu-check{opacity:1}" +
        ".yt-repeat-menu-sep{height:1px;margin:4px 0;background:rgba(255,255,255,.12)}" +
        ".yt-repeat-panel-portion{padding:8px 16px;font-size:12px}" +
        ".yt-repeat-panel-portion label{display:flex;align-items:center;gap:8px;cursor:pointer}" +
        ".yt-repeat-panel .yt-repeat-panel-range{margin:0;padding:0 16px 8px;opacity:.75;font-size:11px}" +
        ".yt-repeat-panel .row{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 8px}" +
        ".yt-repeat-panel .row button{position:static;width:auto;height:auto;padding:6px 10px;" +
        "font:500 11px/1 Roboto,Arial,sans-serif;color:#fff;background:rgba(255,255,255,.12);border-radius:4px;cursor:pointer}" +
        ".yt-repeat-panel .row button:hover{background:rgba(255,255,255,.22)}";
      shadowRoot.appendChild(style);

      const menuLoopIcon =
        '<svg class="menu-icon" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="currentColor" d="M7 7h8v3l4-4-4-4v3H5v6h2V7zm10 10H9v-3l-4 4 4 4v-3h10v-6h-2v4z"/>' +
        "</svg>";

      panelEl = document.createElement("div");
      panelEl.className = "yt-repeat-panel";
      panelEl.innerHTML =
        `<button type="button" class="yt-repeat-menu-item" data-action="toggle-loop" role="menuitemcheckbox">` +
        `<span class="menu-icon-wrap">${menuLoopIcon}</span>` +
        `<span>${t("menuLoop") || t("repeatVideo")}</span>` +
        `<span class="menu-check" aria-hidden="true">✓</span>` +
        `</button>` +
        `<div class="yt-repeat-menu-sep"></div>` +
        `<div class="yt-repeat-panel-portion">` +
        `<label><input type="checkbox" class="yt-repeat-portion-cb" /> ${t("loopPortion")}</label>` +
        `</div>` +
        `<p class="yt-repeat-panel-range">—</p>` +
        `<div class="row">` +
        `<button type="button" data-ab="A">${t("panelSetA")}</button>` +
        `<button type="button" data-ab="B">${t("panelSetB")}</button>` +
        `<button type="button" data-ab="clear">${t("panelClear")}</button>` +
        `</div>`;

      panelEl.querySelector('[data-action="toggle-loop"]').addEventListener("click", (e) => {
        e.stopPropagation();
        toggleLoop();
        updatePanelUi();
      });
      panelEl.querySelector(".yt-repeat-portion-cb").addEventListener("change", (e) => {
        setPortionOnly(e.target.checked);
      });
      panelEl.querySelectorAll("[data-ab]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const kind = btn.getAttribute("data-ab");
          if (kind === "clear") clearAbLoop();
          else setAbPoint(kind);
        });
      });
      shadowRoot.appendChild(panelEl);

      document.addEventListener(
        "click",
        (e) => {
          if (!panelOpen) return;
          const host = document.getElementById(ROOT_ID);
          if (host && e.composedPath().includes(host)) return;
          closePanel();
        },
        true
      );
    }

    if (!panelEl) {
      panelEl = shadowRoot.querySelector(".yt-repeat-panel");
    }

    loopButton = shadowRoot.querySelector(`.${LOOP_CLASS}`);
    if (!loopButton) {
      loopButton = document.createElement("button");
      loopButton.type = "button";
      loopButton.className = LOOP_CLASS;
      loopButton.innerHTML = LOOP_ICON_SVG;
      shadowRoot.appendChild(loopButton);
    }

    bindLoopButtonEvents(loopButton);
    return loopButton;
  }

  function positionLoopButton() {
    const video = getVideo();
    const player = getPlayerRoot();
    const btn = ensureUiRoot();
    if (!btn || !video) return;

    if (isShortsPage() && hideOnShorts) {
      btn.style.display = "none";
      closePanel();
      return;
    }

    let pos = player ? computeAutoPosition(player, btn) : null;
    if (!pos) pos = fallbackControlPosition(video, btn);
    if (!pos) return;

    btn.style.left = `${pos.left}px`;
    btn.style.top = `${pos.top}px`;
    btn.style.display = "block";
    btn.style.visibility = "visible";
    if (panelOpen) positionPanel();
    showOnboardingHint(btn);
  }

  function refresh() {
    try {
      const video = getVideo();
      const vid = getVideoId();
      if (abVideoId && vid !== abVideoId && (abLoopEnabled || portionOnly)) {
        clearAbLoop();
      }
      ensureUiRoot();
      positionLoopButton();
      bindVideo(video);
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

  function loadFromStorage(data) {
    if (data[STORAGE_KEY] === undefined) {
      loopEnabled = true;
      chrome.storage.sync.set({ [STORAGE_KEY]: true });
    } else {
      loopEnabled = Boolean(data[STORAGE_KEY]);
    }
    repeatLimit = Math.min(999, Math.max(0, Number(data[LIMIT_KEY] || 0)));
    abLoopEnabled = Boolean(data[AB_ENABLED_KEY]);
    abStart = data[AB_START_KEY] != null ? Number(data[AB_START_KEY]) : null;
    abEnd = data[AB_END_KEY] != null ? Number(data[AB_END_KEY]) : null;
    abVideoId = data[AB_VIDEO_KEY] || "";
    portionOnly = Boolean(data[PORTION_ONLY_KEY]);
    hideOnShorts = Boolean(data[HIDE_SHORTS_KEY]);
    loopDelaySec = Math.min(5, Math.max(0, Number(data[LOOP_DELAY_KEY] || 0)));
    onboardingDone = Boolean(data[ONBOARDING_KEY]);

    chrome.storage.session.get([SESSION_REMAINING], (session) => {
      if (session[SESSION_REMAINING] != null && repeatLimit > 0) {
        repeatsRemaining = Number(session[SESSION_REMAINING]);
      } else if (repeatLimit > 0) {
        resetRepeatCounter();
      }
      scheduleRefresh();
    });
  }

  chrome.storage.sync.get(
    [
      STORAGE_KEY,
      LIMIT_KEY,
      AB_ENABLED_KEY,
      AB_START_KEY,
      AB_END_KEY,
      AB_VIDEO_KEY,
      PORTION_ONLY_KEY,
      ONBOARDING_KEY,
      HIDE_SHORTS_KEY,
      LOOP_DELAY_KEY,
    ],
    loadFromStorage
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
      if (changes[STORAGE_KEY]) loopEnabled = Boolean(changes[STORAGE_KEY].newValue);
      if (changes[LIMIT_KEY]) {
        repeatLimit = Math.min(999, Math.max(0, Number(changes[LIMIT_KEY].newValue || 0)));
        resetRepeatCounter();
      }
      if (changes[AB_ENABLED_KEY]) abLoopEnabled = Boolean(changes[AB_ENABLED_KEY].newValue);
      if (changes[AB_START_KEY]) abStart = Number(changes[AB_START_KEY].newValue);
      if (changes[AB_END_KEY]) abEnd = Number(changes[AB_END_KEY].newValue);
      if (changes[AB_VIDEO_KEY]) abVideoId = changes[AB_VIDEO_KEY].newValue || "";
      if (changes[PORTION_ONLY_KEY]) portionOnly = Boolean(changes[PORTION_ONLY_KEY].newValue);
      if (changes[HIDE_SHORTS_KEY]) hideOnShorts = Boolean(changes[HIDE_SHORTS_KEY].newValue);
      if (changes[LOOP_DELAY_KEY]) {
        loopDelaySec = Math.min(5, Math.max(0, Number(changes[LOOP_DELAY_KEY].newValue || 0)));
      }
      applyLoopToVideo();
      updateButtonState();
      scheduleRefresh();
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "TOGGLE_LOOP") {
      toggleLoop();
      sendResponse({ ok: true, loopEnabled });
      return;
    }
    if (message?.type === "SET_AB_A") {
      sendResponse(setAbPoint("A"));
      return;
    }
    if (message?.type === "SET_AB_B") {
      sendResponse(setAbPoint("B"));
      return;
    }
    if (message?.type === "CLEAR_AB") {
      clearAbLoop();
      sendResponse({ ok: true });
      return;
    }
    if (message?.type === "SET_PORTION_ONLY") {
      setPortionOnly(Boolean(message.enabled));
      sendResponse({ ok: true, portionOnly });
      return;
    }
    if (message?.type === "GET_STATUS") {
      chrome.storage.session.get(SESSION_REPLAYS, (session) => {
        getTotalReplays((totalReplays) => {
          sendResponse({
            platform,
            loopEnabled,
            repeatLimit,
            repeatsRemaining,
            abLoopEnabled,
            abStart,
            abEnd,
            abVideoId,
            portionOnly,
            videoId: getVideoId(),
            replays: Number(session[SESSION_REPLAYS] || 0),
            totalReplays,
            live: isLiveStream(getPlayerRoot(), getVideo()),
          });
        });
      });
      return true;
    }
  });

  if (platform === "youtube") {
    document.addEventListener("yt-navigate-finish", scheduleRefresh);
    window.addEventListener("yt-page-data-updated", scheduleRefresh);
  }

  window.addEventListener("resize", scheduleRefresh);
  window.addEventListener("scroll", scheduleRefresh, true);
  window.addEventListener("popstate", scheduleRefresh);

  scheduleRefresh();
  setInterval(scheduleRefresh, 1500);
})();
