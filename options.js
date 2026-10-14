const HIDE_SHORTS_KEY = "ytHideOnShorts";
const LOOP_DELAY_KEY = "ytLoopDelaySec";

const hideOnShorts = document.getElementById("hideOnShorts");
const loopDelay = document.getElementById("loopDelay");
const saved = document.getElementById("saved");

function flashSaved() {
  saved.hidden = false;
  setTimeout(() => {
    saved.hidden = true;
  }, 1500);
}

chrome.storage.sync.get([HIDE_SHORTS_KEY, LOOP_DELAY_KEY], (data) => {
  hideOnShorts.checked = Boolean(data[HIDE_SHORTS_KEY]);
  loopDelay.value = String(Number(data[LOOP_DELAY_KEY] || 0));
});

hideOnShorts.addEventListener("change", () => {
  chrome.storage.sync.set({ [HIDE_SHORTS_KEY]: hideOnShorts.checked }, flashSaved);
});

loopDelay.addEventListener("change", () => {
  const v = Math.min(5, Math.max(0, Number(loopDelay.value) || 0));
  loopDelay.value = String(v);
  chrome.storage.sync.set({ [LOOP_DELAY_KEY]: v }, flashSaved);
});
