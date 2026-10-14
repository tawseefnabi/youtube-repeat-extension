/** Shared popup/options i18n (chrome.i18n). */
function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.textContent = msg;
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const msg = chrome.i18n.getMessage(key);
    if (msg) el.setAttribute("placeholder", msg);
  });
  const titleKey = document.documentElement.getAttribute("data-i18n-title");
  if (titleKey) {
    const t = chrome.i18n.getMessage(titleKey);
    if (t) document.title = t;
  }
}
