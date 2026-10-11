# Store listing copy (paste-ready)

**Name** (43 chars)
CAT On-Screen Calculator - Floating Overlay

**Summary / short description** (under 132 chars)
A draggable CAT exam calculator that floats on top of any website while you practise. Free, no ads, collects no data.

**Category:** Education

**Detailed description**
Practising CAT questions on a mock-test site, a PDF viewer or a coaching portal that has no calculator? Click the toolbar icon and the CAT on-screen calculator floats on top of the page. Drag it wherever you like, use it, close it with the cross, and bring it back with one click.

- Same layout and behaviour as the on-screen calculator you will see in the exam: memory keys, square root, reciprocal, percentage
- Draggable; remembers where you left it
- Opens only when you click it (or press Alt+Shift+C), only on that tab
- Does not read or change the pages you visit
- Free, no ads, no account, no data collected

Tip: if the browser's built-in pages (new tab page, settings, Web Store) don't allow extensions, the icon shows "!" there. It works on normal websites.

Unofficial practice tool. Not affiliated with, or endorsed by, the IIMs or the organisers of the CAT exam. Use the website version at cat-calculator-delta.vercel.app anytime.
Found a bug? Please report it at https://github.com/Geetansh01/cat-calculator/issues

**Single purpose (Chrome)**
Show a draggable on-screen calculator on top of the web page the user is currently viewing.

**Permission justifications**
- activeTab: Lets the extension add the calculator to the tab where the user clicked the toolbar button. Nothing is accessed on other tabs or before the click.
- scripting: Used only to inject the calculator overlay script into that active tab when the user clicks the button.
- storage: Saves the calculator's last on-screen position locally so it reopens in the same place. No other data is stored.
- web_accessible_resources (calculator/*): The calculator page is displayed in a frame on the current page, which requires it to be web-accessible.

**Remote code:** No. All code is packaged with the extension.
**Data collection:** None.
**Privacy policy URL:** https://cat-calculator-delta.vercel.app/privacy.html

**Notes for reviewers**
Open any website (e.g. https://example.com), click the toolbar icon: a calculator appears. Drag the blue title bar to move it; click the cross to hide it; click the icon again to show it. No login or setup is needed. Pages like chrome://extensions are restricted by the browser, so the icon shows a "!" badge there.
