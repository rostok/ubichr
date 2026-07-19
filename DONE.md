# UbiChr DONE

Archive of completed and confirmed work. Open items live in TODO.md.

## MV3 migration

- MV3 migration (manifest v3) — completed
- sequential ajax handling via jQuery.loadAbs .load etc — fixed by replacing pblock element
- `createTab` `endcode` restored via `chrome.userScripts.execute()` (Chrome 135+, requires "Allow User Scripts" toggle in chrome://extensions) — eval is blocked in MV3 content scripts, so endcode strings are injected into the USER_SCRIPT world by the service worker after the structured input/submit step; fixes custom commands `krs`, `krs-dok-fin`, `krs-old` (krs-old rewritten from `backgroundWindow.eval` to `createTab`+`endcode`)
- `CmdUtils.getClipboard` / `setClipboard` migrated from deprecated `execCommand` to `navigator.clipboard` API
- built-in commands ported to MV3 APIs (`chrome.scripting.executeScript` with `func:`): `grep`, `regexp`, `grepInnerHTML`, `links`, `get-urls`, `extensions-chrome`, `settings-chrome`, `pwd-chrome` (chrome.tabs.query/update are MV3-fine when called from the popup)

## fixes20260717 — code review round 1 (2026-07-17)

Confirmed by user: merge-tabs, close/close-tabs, isdown, setBadge, mark (from popup).

- [x] `merge-tabs` used `chrome.tabs.getAllInWindow()` — removed in MV3, command crashed; rewritten with `windows.getAll({populate})` only — **confirmed**
- [x] duplicate command name `close` — second definition (close tabs matching URLs) silently replaced "close current tab"; renamed second to `close-tabs`/`close-matching` — **confirmed**
- [x] `mark`/`highlight` execute referenced undefined `pblock` — ReferenceError on every execute; now destructured from args — **confirmed (popup path)**
- [x] `killcookies` execute callback referenced undefined `pblock` — ReferenceError after clearing cookies; uses `CmdUtils.setTip`
- [x] `translate` execute: `typeof isSelected` check always false (MV2 leftover) so selection was never replaced; undefined `pblock` in too-long branch
- [x] `pwd-chrome` opened literal `{url}?q=...` — template literal typo
- [x] `CmdUtils.closePopup()` was a no-op — referenced undefined global `popupWindow` instead of `CmdUtils.popupWindow`
- [x] service worker: `chrome.storage.session` empty after browser restart until first tab event — `active_tab`/`selectedText` null in popup; `updateActiveTab()` now called at SW top level — **confirmed (isdown works)**
- [x] update-handlers mechanism dead in MV3 — `mark` permanent highlighting lost when popup closes; highlights now stored in `storage.session` (`markHighlights`) and re-injected by the service worker on tab load and tab activation
- [x] selection.js passed a response callback but SW never responds for `selection` — "message port closed" console noise on pages; callback removed
- [x] tests.js used `chrome.browserAction.getBadgeText` — MV3 removed it, `CmdUtils.setBadge` test always failed; now `chrome.action` — **confirmed**
- [x] popup.js `ubiq_dispatch_command`/`ubiq_tabsuggest`: `ubiq_match_first_command(cmd)` passed hoisted-undefined `cmd` instead of the typed command word
- [x] popup.js `ubiq_show_matching_commands`: `if (sr == 0x7fffffff)` compared array to number — exact matches never took the exact-match path; now `sr[2]`
- [x] popup.js sandbox stub dropped `test` property from `register-command` (sandbox-bridge.js kept it)
- [x] SPECS.md popup script list was missing `commands-legacy.js` (loaded by popup.html); `background.js` and `help.js` remain dead files (kept for reference, not loaded anywhere)
- [x] `grepInnerHTML`: `t.reduce()` without initial value skipped the first tab; missing guards for restricted tabs — now matches `grep`'s structure

## fixes20260717 — round 2/3 (after user verification of round 1)

Implemented; verification checklist in TODO.md.

- [x] `pwd-chrome` opened `about:logins` in Chrome — Chrome 136+ also defines the `browser` namespace alias, so `typeof browser !== 'undefined'` no longer means Firefox; added `CmdUtils.isFirefox` (UA sniff) and used it in `CmdUtils.addTab` and `pwd-chrome` (this also stops `addTab` from routing through the Firefox branch and force-closing the popup on Shift+Enter)
- [x] `close`/`close-tabs` — clarified descriptions, added `help` text and cross-references — **confirmed**
- [x] `killcookies` preview showed nothing — old code read `document.cookie` (empty when cookies are HttpOnly); rewritten with `chrome.cookies.getAll/remove` — preview lists cookies like the `cookies` command, execute now kills HttpOnly cookies too
- [x] `translate`/`translate-en`/`translate-pl` dead — `api.microsofttranslator.com` V2 Ajax API no longer exists (uncaught promise at commands.js:772); `msTranslator()` reimplemented on top of the public `translate.googleapis.com/translate_a/single?client=gtx` endpoint (verified with curl); async preview/execute wrapped in try/catch so failures render instead of unhandled rejections
- [x] `imdb` test failure — IMDb search-page scraping replaced with the stable public suggestion API `v3.sg.media-imdb.com/suggestion` (verified with curl it returns tt0087544 for the test query); preview still produces data-option entries
- [x] CORS `origin 'null'` errors from custom commands (e.g. XHR to praca.office.3e.pl) — sandbox has a null origin so direct `$.ajax`/`$.get`/`$().load` are CORS-blocked; added a jQuery `ajaxTransport` override in sandbox.js that routes every ajax call through the popup XHR proxy (with credentials); popup.js/sandbox-bridge.js `fetch` chrome-call extended to accept `{url, method, data, headers, raw}`
- [x] `clipregex` was buggy itself: `.map(s=>s.match(re))` returned only the matched fragment instead of filtering lines; fixed in `custom-cmds/ubichr-custom-scripts-2026-06-12.js` (must be re-pasted into the options editor — the runtime copy lives in chrome.storage)
- [x] `history` test depended on the `help` test running first; now seeds history itself via `init`
- [x] mark-after-page-reload only worked once popup reopened — service worker now also re-applies highlights on tab activation (MV2 parity) and logs `reapplying mark highlights...` / injection errors to the SW console; highlights are stored **on execute (Enter)** — preview-only marking is transient by design
- [x] `cliptab*` (and all clipboard-default commands) didn't see the clipboard when run with no arguments — the popup read the system clipboard only **once** on load (`readClipboard()` can silently fail when the document isn't focused yet, and its catch was empty). Fixed: sandbox stubs do a fresh `readClipboard()` before every preview/execute message, the popup re-renders the preview once the load-time read resolves, re-reads on window focus, and `readClipboard` failures are logged. In test mode (`#test`) the popup deliberately does NOT read the system clipboard — tests propagate it via `setClipboard`/`getViews`, and the load-time read was overwriting that with stale system content (the likely cause of flaky cliptab* test results)
- [x] `lasterror` test — fixed earlier: CmdUtils.popupWindow now set in initTests

## fixes20260717 — round 4: automated test harness + loadScripts

- [x] **Playwright test harness** (`harness/`) — isolated Chromium (own binary + `harness/.profile`, never the user's browser) loads the extension, seeds the newest `custom-cmds/ubichr-custom-scripts-*.js` into storage, drives tests.html and popup.html. `run-tests.mjs` (serial by default), `run-command.mjs` (single-command inspection), `probe.mjs` (diagnostics). Documented in SPECS.md §7.
- [x] diagnosed the parallel test runner as inherently racy: `setClipboard` propagates to every open popup (any test clobbers clipboard-based tests — observed tinyurl output in all popups), and ~40 simultaneous 200KB sandbox evals outrun popup.js's 2s test-mode fallback so inputs get typed before custom commands register. Serial mode added to the harness; suite went 95→109/115 with zero code changes.
- [x] `CmdUtils.loadScripts` (popup) was doubly broken in MV3: remote scripts blocked by CSP AND local files failed because jQuery.getScript inline-evals same-origin responses (also CSP-blocked). Rewritten with `<script src>` tags (`async=false` keeps order) — bundled files load again, remote URLs get a clear console error.
- [x] **remote `require`/`requirePopup` restored for custom (sandbox) commands** — sandbox `loadScripts` fetches the source through the popup XHR proxy (bypasses null-origin CORS) and indirect-`eval`s it (sandbox CSP allows eval); preview/execute wait for requires before running. Verified E2E: `clipxlsx` loads xlsx.full.min.js from cdnjs and generates the file. Beneficiaries: `clipxlsx`, `ss` (html2canvas), FileSaver-based commands. Tampermonkey-style page injection remains available via `chrome.userScripts` (endcode flow).
- [x] internal `CmdUtils.loadScripts` test rewritten to load a bundled file (`lib/mark.min.js` → `window.Mark`) — CDN-into-extension-page is impossible in MV3, so the old lodash test could never pass
- [x] `killcookies` test failure was a stale assertion: expected the pre-rewrite `cookies:` preview prefix; the command itself works (harness showed correct "no cookies for …" in a cookie-less fresh profile). Test now matches both wordings.
- [x] `history` test v2: also patches the already-loaded popup history (storage write in `init` came after the popup had read it)
- [x] sandbox compat shims: `CmdUtils.getPreviewBlock()` and `args.pblock` in execute (popup dispatch passes pblock too; some AI-generated custom commands expect them)
- [x] harness-verified green (serial run): all clip* commands, clipregex, history, cookies, killcookies, imdb, translate/-en/-pl, shorten-url, dictionary, thesaurus, longman, isdown, lasterror, CmdUtils.setBadge, CmdUtils.loadScripts and ~90 more

## fixes20260717 — round 5: harness ergonomics, invert, test hygiene

User confirmed working: **pwd-chrome**, **translate**, **mark** ("bardzo dobrze"), **killcookies preview**; CORS/heartbeat issue parked (heartbeats disabled by user). Final confirmations 2026-07-17: **Shift+Enter** (inactive tab, popup stays open), **killcookies execute**, **smart invert** — all fixes20260717 items closed.

- [x] tests.html never closed the tabs opened by url-tests — the autoclose checkbox is checked by default but its `postexit` wiring only ran on *click*; now applied on load and after custom tests register (`applyAutoclose()`)
- [x] `unittests <substring>` / `tests.html?f=substring` — filters shown tests (and untested lists) by name substring, e.g. `unittests clip`; harness maps `--filter=str` to it
- [x] harness batch mode — default runs 8 tests at a time, clipboard-writing tests (`clip*`, shorten-url, save, open) one at a time since `setClipboard` propagates to every open popup; `--serial` for one-by-one, `--parallel` for the old racy `#start`; full suite parity with serial results at a fraction of the time
- [x] harness `run-command.mjs --target=url --shot=f.png` — opens a page, wires it as `CmdUtils.active_tab` (popup-as-tab otherwise nulls it) and takes before/after screenshots; used to debug `invert` visually
- [x] `invert` rewritten as **smart invert** — plain `filter: invert(100%)` turned photos into negatives and shifted all hues (blue→orange); now `invert(100%) hue-rotate(180deg)` on html + counter-filter on img/video/canvas/iframe media, explicit white canvas background; verified with harness screenshots (dark page, original-color images, links stay blue)
- [x] sandbox compat: `getPreviewBlock()` shim + `args.pblock` in execute (clipxlsx-style commands)
- [x] `grep`/`links` tests permanently failed in automation — stackoverflow.com serves a Cloudflare captcha to automated browsers (user confirmed seeing it too); retargeted both tests to example.com (updated to its 2026 copy: "documentation examples", link without www); `links` also had its load-refresh commented out — restored at 0.5×timeout
- [x] harness solo group extended to tab-scanning tests (grep, regexp, grepInnerHTML, links, omnijquery, close-containing, get-urls, context) — they grep ALL open tabs, so concurrent tests polluted them and autoclose closed shared target tabs mid-test
- [x] **final suite: 112/115 in 2m38s** (batched) — remaining: mobygames (Cloudflare-blocked API), oldmaps/newmaps (won't fix)

## fixes20260717 — round 6: chrome.* shim for legacy custom commands

- [x] sandbox `chrome.*` shim (sandbox.js) — MV2-era custom commands calling `chrome.tabs.*` directly work again in the sandbox: `tabs.query/create/update` proxy through the popup (`chrome-call`), `extension.getBackgroundPage()` returns the inert stub
- [x] MV2-compat `chrome.tabs.executeScript(tabId?, {code}, cb)` restored — arbitrary code strings run through the service worker's `chrome.userScripts.execute` channel (same as `endcode`; needs the "Allow User Scripts" toggle, returns results). The ubiquitous `document.body.innerText/innerHTML` snippet is special-cased through `chrome.scripting.executeScript` and needs no toggle. New chrome-call cases `tabs.query`/`tabs.executeScript` in popup.js and sandbox-bridge.js, new `executeCode` message in service_worker.js
- [x] `grep2urls`/`find-in-tabs` revived — also fixed its own bugs (`indexOf(text)>0` missed matches at position 0, `arr.replaceAll` TypeError on an array, object dedup that never deduped); harness test added (greps example.com, returns its url) — **passes**
- [x] `allpages2clip` revived via the shim — harness-verified E2E (page text lands in the clipboard, preview reports pages/size)

## Closed — won't fix

- `CmdUtils.loadScripts` test — MV3 CSP blocks CDN script loading in extension pages; commands with `require:` must bundle locally or run in the sandbox (ref: https://github.com/Tampermonkey/tampermonkey/issues/644)
- `oldmaps`/`newmaps` (custom commands) — they `requirePopup` the Google Maps JS API from maps.googleapis.com; MV3 CSP forbids remote scripts in extension pages and the sandboxed frame's null origin breaks Maps API key/referer checks. Rewrite path (if ever needed) is an `<iframe>` embed like the built-in `maps` command — tracked in TODO.md backlog.
