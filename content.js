(function () {
  const LOOP_CLASS = "yt-repeat-btn";
  const LOOP_ACTIVE_CLASS = "yt-repeat-active";
  const STORAGE_KEY = "ytRepeatEnabled";

  let loopEnabled = false;
  let endedHandler = null;
  let boundVideo = null;

  function getVideo() {
    return document.querySelector("video.html5-main-video");
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

  function updateButtons() {
    document.querySelectorAll(`.${LOOP_CLASS}`).forEach((btn) => {
      btn.classList.toggle(LOOP_ACTIVE_CLASS, loopEnabled);
      btn.setAttribute(
        "aria-label",
        loopEnabled ? "Loop video (on)" : "Loop video (off)"
      );
      btn.setAttribute("aria-pressed", loopEnabled ? "true" : "false");
    });
  }

  function setLoopEnabled(enabled) {
    loopEnabled = enabled;
    chrome.storage.sync.set({ [STORAGE_KEY]: loopEnabled });
    syncLoopAttribute(getVideo());
    updateButtons();
  }

  function toggleLoop() {
    setLoopEnabled(!loopEnabled);
  }

  function createLoopButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `ytp-button ${LOOP_CLASS}`;
    btn.title = "Loop video";
    btn.innerHTML =
      '<svg height="100%" viewBox="0 0 24 24" width="100%" aria-hidden="true"><path fill="currentColor" d="M17 17H7V7h3V5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3h-2v3zM15 5v2h3.59l-9.83 9.83 1.41 1.41L20 8.41V12h2V5h-7z"/></svg>';
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLoop();
    });
    return btn;
  }

  function injectLoopButton() {
    const rightControls = document.querySelector(".ytp-right-controls");
    if (!rightControls) return;
    if (rightControls.querySelector(`.${LOOP_CLASS}`)) return;

    const btn = createLoopButton();
    const settingsBtn = rightControls.querySelector(".ytp-settings-button");
    if (settingsBtn) {
      rightControls.insertBefore(btn, settingsBtn);
    } else {
      rightControls.appendChild(btn);
    }
    updateButtons();
  }

  function refresh() {
    injectLoopButton();
    bindVideo(getVideo());
  }

  chrome.storage.sync.get(STORAGE_KEY, (data) => {
    loopEnabled = Boolean(data[STORAGE_KEY]);
    refresh();
    updateButtons();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes[STORAGE_KEY]) return;
    loopEnabled = Boolean(changes[STORAGE_KEY].newValue);
    syncLoopAttribute(getVideo());
    updateButtons();
  });

  const observer = new MutationObserver(() => {
    refresh();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  document.addEventListener("yt-navigate-finish", refresh);
  window.addEventListener("yt-page-data-updated", refresh);

  setInterval(refresh, 2000);
})();
