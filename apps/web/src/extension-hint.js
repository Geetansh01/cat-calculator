/* Subtle "get the floating calculator" hint.
 *
 * Design rules:
 *  - Shows nothing until a store URL exists for the visitor's browser (safe to deploy before publishing).
 *  - Desktop browsers only (extensions don't apply on phones).
 *  - Appears only after the visitor has actually used the calculator (0 key presses) or stayed 0s.
 *  - One line, bottom of the viewport, never overlaps the calculator on normal screens, no animation
 *    beyond one fade, dismissible, and a dismissal is remembered for 0 days.
 */
(function () {
  // ---- Fill these in as each listing goes live. Leave "" for "not published yet". ----
  var STORE_URLS = {
    chrome: "https://chrome.google.com/webstore/detail/gkjjpbnhcofpjjkfiajamobhdbmmhmdf",   // https://chromewebstore.google.com/detail/<slug>/<id>
    edge: "https://microsoftedge.microsoft.com/addons/detail/lgikacifhknbbdnhjdhboaeajofglccb",     // https://microsoftedge.microsoft.com/addons/detail/<slug>/<id>
    firefox: ""   // https://addons.mozilla.org/firefox/addon/<slug>/
  };
  var LABELS = { chrome: "Chrome", edge: "Edge", firefox: "Firefox" };
  var DISMISS_KEY = "catcalc.extHint.dismissedAt";
  var DISMISS_DAYS = 0;
  var SHOW_AFTER_PRESSES = 0;
  var SHOW_AFTER_MS = 0;

  function detectBrowser() {
    var ua = navigator.userAgent || "";
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) return null;
    if (/Firefox\//.test(ua)) return "firefox";
    if (/Edg\//.test(ua)) return "edge";
    if (/Safari\//.test(ua) && !/Chrome\/|Chromium\//.test(ua)) return null; // Safari: not yet
    if (/Chrome\/|Chromium\//.test(ua)) return "chrome"; // Chrome, Brave, Opera, Vivaldi...
    return null;
  }

  function dismissedRecently() {
    try {
      var t = parseInt(localStorage.getItem(DISMISS_KEY), 10);
      return t && Date.now() - t < DISMISS_DAYS * 864e5;
    } catch (e) { return false; }
  }

  function track(name, browser) {
    if (typeof gtag === "function") gtag("event", name, { browser: browser });
  }

  var browser = detectBrowser();
  if (!browser || !STORE_URLS[browser] || dismissedRecently()) return;

  var shown = false;
  function show() {
    if (shown) return;
    shown = true;

    var bar = document.createElement("div");
    bar.className = "ext-hint";
    bar.setAttribute("role", "note");

    var text = document.createElement("span");
    text.textContent = "Solving questions on another website? Keep this calculator floating on top of any page. ";

    var link = document.createElement("a");
    link.href = STORE_URLS[browser];
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Get the free " + LABELS[browser] + " extension";
    link.addEventListener("click", function () { track("ext_hint_click", browser); });

    var close = document.createElement("button");
    close.type = "button";
    close.className = "ext-hint-close";
    close.setAttribute("aria-label", "Dismiss");
    close.textContent = "\u2715";
    close.addEventListener("click", function () {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
      bar.remove();
      track("ext_hint_dismiss", browser);
    });

    bar.appendChild(text);
    bar.appendChild(link);
    bar.appendChild(close);
    document.body.appendChild(bar);
    track("ext_hint_shown", browser);
  }

  var presses = 0;
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#keyPad a") && ++presses >= SHOW_AFTER_PRESSES) show();
  });
  setTimeout(show, SHOW_AFTER_MS);
})();
