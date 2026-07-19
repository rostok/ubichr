# UbiChr TODO

Completed and confirmed work is archived in DONE.md.
Automated testing: `harness/` (Playwright, isolated Chromium) — see SPECS.md §7. Most fixes below are already machine-verified by `node harness/run-tests.mjs`; the remaining manual checks need a real environment.

All fixes20260717 items are user-confirmed — see DONE.md.

## Failing tests (harness batched run, 2026-07-17: 112/115 in 2m38s)

| Test | Failure | Root cause |
|------|---------|------------|
| `mobygames` | preview shows "error" | mobygames API blocks non-browser clients (Cloudflare) — external |
| `oldmaps` / `newmaps` | includesHTML mismatch | WON'T FIX as-is (Maps JS API; see DONE.md) — rewrite to iframe embed |

## Backlog

- `command-gist` — registers a `chrome.tabs.onCreated` listener in the popup, then opens a tab; the popup (and the listener) dies as soon as the tab activates, so the gist form is probably never filled. Verify and, if broken, delegate to the service worker (same pattern as `createTabAndInject`).
- `clipxlsx` (custom) — calls `navigator.clipboard.write()` directly from the sandbox iframe → NotAllowedError ("Document is not focused"); should route the ClipboardItem write through the popup (new chrome-call, or a `set-clipboard-blob` message).
- harness: `cookies`/`killcookies`-style tests run against a cookie-less fresh profile — consider a test `init` that seeds a cookie via `chrome.cookies.set`.
- `translate` "to XX" argument syntax is awkward — parked per user ("można olać"); possible future: accept `translate pl <text>` or infer target language from input.
- `oldmaps`/`newmaps` custom commands — rewrite to an `<iframe>` embed like the built-in `maps` command (Maps JS API cannot run in MV3 extension pages / null-origin sandbox — see DONE.md).
- `chrome.extension.getViews()` used in tests and setClipboard propagation — deprecated in MV3, still works; migrate eventually.
- commands with `require:` loading from CDN are blocked in extension pages (MV3) — bundle locally or run in sandbox (ref: https://github.com/Tampermonkey/tampermonkey/issues/644).

## Untested built-in commands (no test defined)

alarm, alarm-clear, allow-text-selection, bugzilla, correct-english, grayscale, grepInnerHTML,
history-clear, inject-js, invert, jquery, killcookies, links-open, mark, merge-tabs, omnijquery,
perplexity, print, regexp, reload-ubiquity, replace-selection, search, unittests, unmark, validate

## Custom commands requiring MV3 porting (user scripts)

The sandbox now ships a `chrome.*` shim (sandbox.js): `tabs.query/create/update` proxy through the popup, and MV2-style `tabs.executeScript({code})` runs via `chrome.userScripts` (needs the "Allow User Scripts" toggle) — except the common `document.body.innerText/innerHTML` snippet, served through `chrome.scripting` without the toggle. **Working again: `grep2urls`/`find-in-tabs` (harness test added), `allpages2clip` (harness-verified E2E).** Commands running non-trivial `code:` strings work only with the toggle on.

Still broken:

| Command | Issue |
|---------|-------|
| `frames` | arbitrary `code:` strings — works only with "Allow User Scripts" toggle |
| `identify-movies` | `chrome.extension.getBackgroundPage()` state — shim returns an inert stub; needs a rewrite on `chrome.storage.session` (resultview pattern) |
| `identify-movies-links` | as above + `code:` strings |
| `killcookies` (custom) | superseded — the built-in `killcookies` won (builtIn precedence); remove from custom scripts |
| `invert` (custom, v5) | superseded — the built-in smart `invert` won; remove from custom scripts |
| `ss` | `chrome.tabs.captureVisibleTab` not shimmed, `chrome.extension.getViews` |
| `ekw-search`, `ekrs-wyszukiwanie` | `chrome.tabs.onCreated` not shimmed (consider `createTab`+`endcode` rewrite like krs) |

**Migration notes:**
- preferred: rewrite `{code: string}` to `CmdUtils.createTab` + `endcode`, or lean on the sandbox shim (see above)
- `chrome.extension.getBackgroundPage()` → removed; use `chrome.storage.session` or message passing
