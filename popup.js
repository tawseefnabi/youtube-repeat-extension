const STORAGE_KEY = "ytRepeatEnabled";
const LIMIT_KEY = "ytRepeatLimit";
const PORTION_ONLY_KEY = "ytLoopPortionOnly";

const toggle = document.getElementById("loopToggle");
const repeatLimit = document.getElementById("repeatLimit");
const portionOnly = document.getElementById("portionOnly");
const remainingText = document.getElementById("remainingText");
const abText = document.getElementById("abText");
const statusText = document.getElementById("statusText");
const totalText = document.getElementById("totalText");
const setA = document.getElementById("setA");
const setB = document.getElementById("setB");
const clearAb = document.getElementById("clearAb");

applyI18n();

function activeTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => tabs[0]);
}

function isVideoPageUrl(url) {
  return url && (url.includes("youtube.com") || url.includes("vimeo.com"));
}

function sendToTab(message) {
  return activeTab().then((tab) => {
    if (!tab?.id || !isVideoPageUrl(tab.url)) {
      throw new Error(chrome.i18n.getMessage("openVideoPage"));
    }
    return chrome.tabs.sendMessage(tab.id, message);
  });
}

function formatTime(sec) {
  if (sec == null || Number.isNaN(sec)) return "--:--";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function refreshUiFromStatus(status) {
  if (!status) return;
  toggle.checked = Boolean(status.loopEnabled);
  if (status.repeatLimit != null) repeatLimit.value = String(status.repeatLimit);
  portionOnly.checked = Boolean(status.portionOnly);

  if (status.live) {
    statusText.textContent = chrome.i18n.getMessage("liveUnavailable");
  } else {
    statusText.textContent = chrome.i18n.getMessage("sessionReplays", [
      String(status.replays ?? 0),
    ]);
  }

  totalText.textContent = chrome.i18n.getMessage("totalReplays", [
    String(status.totalReplays ?? 0),
  ]);

  if (status.repeatLimit > 0) {
    remainingText.textContent = chrome.i18n.getMessage("remaining", [
      String(status.repeatsRemaining ?? status.repeatLimit),
    ]);
  } else {
    remainingText.textContent = chrome.i18n.getMessage("forever");
  }

  if (status.abLoopEnabled && status.abStart != null && status.abEnd != null) {
    abText.textContent = chrome.i18n.getMessage("segmentRange", [
      formatTime(status.abStart),
      formatTime(status.abEnd),
    ]);
  } else {
    abText.textContent = chrome.i18n.getMessage("noAbSegment");
  }
}

function saveRepeatLimit() {
  const v = Math.min(999, Math.max(0, Number(repeatLimit.value) || 0));
  repeatLimit.value = String(v);
  chrome.storage.sync.set({ [LIMIT_KEY]: v });
}

function loadPopup() {
  chrome.storage.sync.get([STORAGE_KEY, LIMIT_KEY, PORTION_ONLY_KEY], (data) => {
    if (data[STORAGE_KEY] === undefined) {
      toggle.checked = true;
      chrome.storage.sync.set({ [STORAGE_KEY]: true });
    } else {
      toggle.checked = Boolean(data[STORAGE_KEY]);
    }
    repeatLimit.value = String(Math.min(999, Number(data[LIMIT_KEY] || 0)));
    portionOnly.checked = Boolean(data[PORTION_ONLY_KEY]);
  });

  sendToTab({ type: "GET_STATUS" })
    .then(refreshUiFromStatus)
    .catch((err) => {
      statusText.textContent = err.message;
      totalText.textContent = "";
    });
}

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ [STORAGE_KEY]: toggle.checked });
});

repeatLimit.addEventListener("change", () => {
  saveRepeatLimit();
  sendToTab({ type: "GET_STATUS" }).then(refreshUiFromStatus).catch(() => {});
});

portionOnly.addEventListener("change", () => {
  chrome.storage.sync.set({ [PORTION_ONLY_KEY]: portionOnly.checked });
  sendToTab({ type: "SET_PORTION_ONLY", enabled: portionOnly.checked })
    .then(() => sendToTab({ type: "GET_STATUS" }))
    .then(refreshUiFromStatus)
    .catch((err) => {
      statusText.textContent = err.message;
    });
});

setA.addEventListener("click", () => {
  sendToTab({ type: "SET_AB_A" })
    .then(() => sendToTab({ type: "GET_STATUS" }))
    .then(refreshUiFromStatus)
    .catch((err) => {
      statusText.textContent = err.message;
    });
});

setB.addEventListener("click", () => {
  sendToTab({ type: "SET_AB_B" })
    .then(() => sendToTab({ type: "GET_STATUS" }))
    .then(refreshUiFromStatus)
    .catch((err) => {
      statusText.textContent = err.message;
    });
});

clearAb.addEventListener("click", () => {
  sendToTab({ type: "CLEAR_AB" })
    .then(() => sendToTab({ type: "GET_STATUS" }))
    .then(refreshUiFromStatus)
    .catch((err) => {
      statusText.textContent = err.message;
    });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes[STORAGE_KEY]) toggle.checked = Boolean(changes[STORAGE_KEY].newValue);
  if (changes[LIMIT_KEY]) {
    repeatLimit.value = String(Math.min(999, Number(changes[LIMIT_KEY].newValue || 0)));
  }
  if (changes[PORTION_ONLY_KEY]) portionOnly.checked = Boolean(changes[PORTION_ONLY_KEY].newValue);
});

loadPopup();
