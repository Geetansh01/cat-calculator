/* Extension-only glue around the shared calculator page. Does not touch calculator logic. */
(function () {
  var dialog = document.querySelector(".ui-dialog");
  var titlebar = dialog.querySelector(".ui-dialog-titlebar");
  var closeBtn = dialog.querySelector(".ui-dialog-titlebar-close");

  function post(msg) {
    msg.source = "cat-calculator";
    parent.postMessage(msg, "*"); // payload is only geometry / "close"; no secrets
  }

  closeBtn.setAttribute("aria-label", "Close calculator");
  closeBtn.title = "Close";
  closeBtn.addEventListener("click", function () { post({ type: "close" }); });

  // Pressing a key must not move focus away from whatever the user was typing into.
  document.addEventListener("mousedown", function (e) {
    if (e.target.closest("a, button")) e.preventDefault();
  });

  function reportSize() {
    var d = dialog.getBoundingClientRect();
    var t = titlebar.getBoundingClientRect();
    var c = closeBtn.getBoundingClientRect();
    post({
      type: "size",
      width: Math.ceil(d.width),
      height: Math.ceil(d.height),
      titlebarHeight: Math.ceil(t.bottom - d.top),
      closeWidth: Math.ceil(d.right - c.left) + 4,
    });
  }
  if (document.readyState === "complete") reportSize();
  else window.addEventListener("load", reportSize);

  // The calculator can change height after load (e.g. pressing M+ shows the "M" memory
  // indicator, which adds a line). Tell the overlay each time so its frame never clips the keys.
  if (window.ResizeObserver) {
    var scheduled = false;
    new ResizeObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () { scheduled = false; reportSize(); });
    }).observe(dialog);
  }
})();
