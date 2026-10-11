/* Extension-only. calciLogic.js calls inBox.focus() after every key press; its own
 * focus handler immediately blurs again. Inside the overlay that would pull keyboard
 * focus out of the page the user is working on (e.g. an answer box). Making focus()
 * a no-op keeps the page's focus where it was. Must load BEFORE calciLogic.js. */
HTMLElement.prototype.focus = function () {};
