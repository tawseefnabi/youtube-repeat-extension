function isSupportedVideoUrl(url) {
  if (!url) return false;
  return /youtube\.com|vimeo\.com|player\.vimeo\.com/.test(url);
}

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-loop") return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id || !isSupportedVideoUrl(tab.url)) return;
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_LOOP" }).catch(() => {});
  });
});
