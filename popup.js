const STORAGE_KEY = "ytRepeatEnabled";
const toggle = document.getElementById("loopToggle");

chrome.storage.sync.get(STORAGE_KEY, (data) => {
  toggle.checked = Boolean(data[STORAGE_KEY]);
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ [STORAGE_KEY]: toggle.checked });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes[STORAGE_KEY]) return;
  toggle.checked = Boolean(changes[STORAGE_KEY].newValue);
});
