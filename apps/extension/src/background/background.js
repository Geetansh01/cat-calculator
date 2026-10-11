/* Toolbar-click / keyboard-shortcut handler.
 *
 * Classic (non-module) script on purpose: Chrome runs it as a service worker,
 * Firefox as an event page, and the same file works in both.
 *
 * Permission model: only `activeTab` + `scripting` (+ `storage` for the saved position).
 * Nothing is injected anywhere until the user clicks the icon (or presses the shortcut)
 * on that tab, so there is no "read and change all your data on all websites" warning
 * at install time.
 */
const api = globalThis.browser ?? globalThis.chrome;

async function toggle(tab) {
  if (!tab || tab.id == null) return;
  try {
    // overlay.js is idempotent: first run builds the calculator, later runs toggle it.
    await api.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/overlay.js"],
    });
    await api.action.setBadgeText({ tabId: tab.id, text: "" });
  } catch (err) {
    // Browser-restricted pages (chrome://, Web Store, about:, built-in PDF viewer...).
    await api.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#c0392b" });
    await api.action.setBadgeText({ tabId: tab.id, text: "!" });
    await api.action.setTitle({
      tabId: tab.id,
      title: "The calculator can't open on this page (restricted by the browser). Try it on a normal website.",
    });
  }
}

api.action.onClicked.addListener(toggle);
