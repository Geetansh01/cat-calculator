/* CAT Calculator overlay (content script, injected on demand).
 *
 * Renders the *unchanged* website calculator (calculator/calculator.html) inside an
 * iframe, wrapped in a Shadow DOM host so the host page's CSS can't touch it.
 * Dragging is handled here (parent side) with a transparent strip laid over the
 * calculator's title bar; the iframe never has to know it is being moved.
 */
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const KEY = "__catCalculatorOverlay__";

  // Second+ injection on the same page: just toggle.
  if (window[KEY]) {
    window[KEY].toggle();
    return;
  }

  const SRC = api.runtime.getURL("calculator/calculator.html");
  const EDGE = 8;            // min px of the calculator kept inside the viewport
  const MARGIN = 24;         // default distance from the top-right corner
  const LOAD_TIMEOUT = 2500; // ms before we assume the page blocked our iframe
  const STORE_KEY = "overlayPosition";

  let size = { width: 225, height: 320, titlebarHeight: 40, closeWidth: 36 };
  let pos = null;            // {x, y} in CSS px, viewport coordinates
  let ready = false;

  /* ---------- DOM ---------- */
  const host = document.createElement("div");
  host.setAttribute("data-cat-calculator", "");
  host.style.cssText =
    "all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .frame {
      position: fixed; display: none; border-radius: 5px; overflow: hidden;
      background: transparent; box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.25);
    }
    .frame.open { display: block; }
    .frame.loading { visibility: hidden; }
    iframe { display: block; width: 100%; height: 100%; border: 0; background: transparent; color-scheme: light; }
    .drag { position: absolute; left: 0; top: 0; cursor: move; touch-action: none; }
    .frame.dragging iframe { pointer-events: none; }
    .frame.dragging .drag { cursor: grabbing; }
    .notice {
      position: fixed; display: none; max-width: 280px; padding: 12px 14px; border-radius: 6px;
      font: 13px/1.4 system-ui, sans-serif; color: #fff; background: #2d70b6;
      box-shadow: 0 10px 30px rgba(0,0,0,.35); cursor: pointer;
    }
    .notice.open { display: block; }
  `;

  const frame = document.createElement("div");
  frame.className = "frame loading";
  const iframe = document.createElement("iframe");
  iframe.title = "CAT calculator";
  iframe.setAttribute("allowtransparency", "true");
  const drag = document.createElement("div");
  drag.className = "drag";
  drag.title = "Drag to move";
  frame.append(iframe, drag);

  const notice = document.createElement("div");
  notice.className = "notice";
  notice.textContent =
    "This website blocks embedded extension content, so the calculator can't open here. " +
    "You can use it at cat-calculator-delta.vercel.app instead. (Click to dismiss)";
  notice.addEventListener("click", () => notice.classList.remove("open"));

  shadow.append(style, frame, notice);

  /* ---------- layout ---------- */
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  function applySize() {
    frame.style.width = size.width + "px";
    frame.style.height = size.height + "px";
    drag.style.width = Math.max(0, size.width - size.closeWidth) + "px";
    drag.style.height = size.titlebarHeight + "px";
  }

  function place(x, y) {
    // Keep the title bar reachable so the calculator can never be dragged out of sight.
    const maxX = Math.max(EDGE, window.innerWidth - size.width - EDGE);
    const maxY = Math.max(EDGE, window.innerHeight - size.titlebarHeight - EDGE);
    pos = { x: clamp(x, 100 - size.width, maxX), y: clamp(y, 0, maxY) };
    frame.style.left = pos.x + "px";
    frame.style.top = pos.y + "px";
  }

  function defaultPosition() {
    place(window.innerWidth - size.width - MARGIN, 80);
  }

  /* ---------- dragging ---------- */
  let dragOffset = null;
  drag.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragOffset = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    drag.setPointerCapture(e.pointerId);
    frame.classList.add("dragging");
    e.preventDefault();
  });
  drag.addEventListener("pointermove", (e) => {
    if (dragOffset) place(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
  });
  const endDrag = (e) => {
    if (!dragOffset) return;
    dragOffset = null;
    frame.classList.remove("dragging");
    try { drag.releasePointerCapture(e.pointerId); } catch (_) {}
    savePosition();
  };
  drag.addEventListener("pointerup", endDrag);
  drag.addEventListener("pointercancel", endDrag);

  window.addEventListener("resize", () => pos && place(pos.x, pos.y));

  /* ---------- persistence (remember where the user parked it) ---------- */
  async function loadPosition() {
    try {
      const data = await api.storage.local.get(STORE_KEY);
      const p = data && data[STORE_KEY];
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return p;
    } catch (_) {}
    return null;
  }
  function savePosition() {
    try { api.storage.local.set({ [STORE_KEY]: pos }); } catch (_) {}
  }

  /* ---------- messages from the calculator iframe ---------- */
  window.addEventListener("message", (e) => {
    if (e.source !== iframe.contentWindow) return;
    const msg = e.data;
    if (!msg || msg.source !== "cat-calculator") return;

    if (msg.type === "size") {
      size = {
        width: msg.width, height: msg.height,
        titlebarHeight: msg.titlebarHeight, closeWidth: msg.closeWidth,
      };
      applySize();
      if (pos) place(pos.x, pos.y);
      ready = true;
      clearTimeout(loadTimer);
      frame.classList.remove("loading");
    } else if (msg.type === "close") {
      hide();
    }
  });

  /* ---------- show / hide ---------- */
  let mounted = false;
  let loadTimer = null;

  async function show() {
    if (!host.isConnected) (document.fullscreenElement || document.documentElement).append(host);
    if (!mounted) {
      mounted = true;
      applySize();
      const saved = await loadPosition();
      saved ? place(saved.x, saved.y) : defaultPosition();
      frame.classList.add("open");
      iframe.src = SRC;
      loadTimer = setTimeout(() => {
        if (ready) return;
        // The page's CSP (or similar) prevented the iframe from loading.
        frame.classList.remove("open");
        notice.style.right = MARGIN + "px";
        notice.style.top = "80px";
        notice.classList.add("open");
        mounted = false;       // allow a retry on the next click
        iframe.removeAttribute("src");
      }, LOAD_TIMEOUT);
      return;
    }
    notice.classList.remove("open");
    frame.classList.add("open");
    place(pos.x, pos.y);
  }

  function hide() {
    // Hidden, not destroyed: memory (M+) and the current entry survive until the page reloads.
    frame.classList.remove("open");
  }

  function toggle() {
    frame.classList.contains("open") ? hide() : show();
  }

  // Exam sites sometimes go fullscreen on a single element; anything outside it disappears.
  document.addEventListener("fullscreenchange", () => {
    const target = document.fullscreenElement || document.documentElement;
    if (host.parentNode !== target) target.append(host);
  });

  window[KEY] = { toggle, show, hide };
  show();
})();
