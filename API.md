# UbiChr API Reference

> For user-facing documentation, installation instructions, and annotated command examples see **[README.md](README.md)**.  
> This document is the developer/API reference for the extension's internals.

UbiChr is a Chrome/Firefox browser extension that provides a keyboard-driven command launcher inspired by Mozilla Ubiquity. The architecture consists of four layers:

- **`cmdutils.js`** — core API namespace (`CmdUtils`), shared between the background page and popup
- **`popup.js`** — popup UI, input handling, command matching and dispatch
- **`background.js`** — background service listeners that keep `CmdUtils` state current
- **`utils.js`** — standalone URL/query-string utilities (`Utils`)
- **`tests.js`** — test framework and test suite

---

## Architecture Overview

```
background page (background.js)
│   owns the single CmdUtils instance
│   listens to tab events → calls CmdUtils.updateActiveTab()
│   listens to content-script messages → updates CmdUtils.selectedText
│
popup window (popup.html + popup.js)
│   shares CmdUtils from the background page via backgroundPage reference
│   renders the input field, suggestions list, preview panel, result panel, tip panel
│   handles all keyboard input
│   calls CmdUtils.preview() / CmdUtils.execute() on the matched command
│
commands (commands.js, custom scripts stored in chrome.storage.local)
│   each command is a plain object registered via CmdUtils.CreateCommand()
│   defines name/names, description, icon, preview function, execute function
│
content scripts (selection.js)
    run in page context, post selection events back to the background page
```

Two window references connect the layers:

| Property | Points to |
|---|---|
| `CmdUtils.backgroundWindow` | The background page `window` |
| `CmdUtils.popupWindow` | The currently open popup `window` |

---

## `CmdUtils` Namespace

Defined in `cmdutils.js`. The object is created once with `if (!CmdUtils) var CmdUtils = { … }` so it survives across re-loads of the background page.

### Static Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `VERSION` | `string` | manifest version | Extension version read from `chrome.runtime.getManifest()`. |
| `DEBUG` | `boolean` | `false` | When `true` enables verbose `deblog()` output. |
| `CommandList` | `Array<CommandStruct>` | `[]` | Ordered list of all registered command objects. |
| `expandOnExecute` | `boolean` | `false` | If `true`, a partial command word is expanded to the matched command name on execute (e.g. `go` → `google`). |
| `history` | `string[]` | `[]` | Command-line history stack; index 0 is the most recent entry. Capped at 64 entries, persisted to `chrome.storage.local`. |
| `jQuery` | `jQuery` | `jQuery` | Reference to jQuery, available inside command preview/execute functions. |
| `backgroundWindow` | `Window` | `window` | Reference to the background page window; set at startup. |
| `popupWindow` | `Window\|null` | `null` | Reference to the active popup window; set when the popup opens. |
| `lastKeyEvent` | `KeyboardEvent\|null` | `null` | The most recent `keydown` event; used to detect Shift key state during `addTab()`. |
| `lastError` | `string` | `""` | Stores the stack trace of the most recent preview or execute exception. |
| `loadLastInput` | `boolean` | `true` | When `false` the popup does not restore the last typed command on open (used by the test framework). |
| `updateHandlers` | `Array<{name,handler}>` | `[]` | Named callbacks invoked whenever the active tab changes. |
| `active_tab` | `Tab\|null` | `null` | The Chrome `tabs.Tab` object for the currently active tab; `null` if not on an `http(s)` page. |
| `selectedText` | `string` | `""` | Plain-text content of the current page selection, kept in sync by `background.js`. |
| `selectedHTML` | `string` | `""` | HTML content of the current page selection (updated by the selection content script). |
| `inputUpdateTime` | `DOMHighResTimeStamp` | `performance.now()` | Timestamp of the last key event; used by `timeSinceInputUpdate()`. |
| `lastNotification` | `string` | `""` | De-duplication key for `notify()`; prevents showing the same notification twice consecutively. |
| `testing` | `Object` | `{}` | Test-framework dictionary, keyed by test name. Populated by `tests.js`. |

### Output Shortcuts (assigned by `popup.js` on load)

These are stub implementations in `cmdutils.js`; `popup.js` replaces them with functions that write to the actual DOM panels.

| Property | Signature | Description |
|---|---|---|
| `CmdUtils.setPreview` | `(html, prepend?)` | Write HTML into the preview panel. |
| `CmdUtils.setResult` | `(html, prepend?)` | Write HTML into the result panel. |
| `CmdUtils.setTip` | `(html, prepend?)` | Write HTML into the tip panel. |

---

### Logging

#### `CmdUtils.log(...args)`
Normal log. Forwards `console.log` to both the background page console and the popup console (if open), plus the caller's own console.

#### `CmdUtils.error(...args)`
Same multi-target routing as `log` but uses `console.error`.

#### `CmdUtils.trace(...args)`
Same multi-target routing as `log` but uses `console.trace`.

#### `CmdUtils.deblog(...args)`
Debug-only log. Only emits output when `CmdUtils.DEBUG === true`.

---

### Extension UI

#### `CmdUtils.setBadge(text = 'OK', color = '#77c')`
Sets the browser-action badge text and background colour. The text is displayed for ~1 second and then cleared automatically. Used to give quick feedback (e.g. `"!"` in red on errors).

#### `CmdUtils.notify(message, title)`
Shows a Chrome desktop notification with the given `message` and optional `title`. Includes a simple de-duplication check — identical consecutive calls are silently dropped.

#### `CmdUtils.closePopup()`
Closes the popup window. Safe to call from command execute functions.

#### `CmdUtils.refreshPreview()`
Forces the popup to re-run `ubiq_show_matching_commands()`, effectively refreshing the preview panel. Achieved by resetting the cached `lcmd` value.

#### `CmdUtils.onPopup()`
No-op hook. Replaced by `tests.js` during testing. Called by `popup.js` after the popup DOM is ready and the last command input has been loaded.

---

### Command Registration

#### `CmdUtils.CreateCommand(cs)`

Registers a command. `cs` is a plain JavaScript object (the **command struct**) with the following properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes (or `names`) | Primary command name. If an array is passed it is treated as `names`. |
| `names` | `string[]` | yes (or `name`) | All aliases for the command. |
| `description` | `string` | recommended | Short human-readable description shown in suggestions and previews. |
| `help` | `string` | optional | Longer help text. |
| `icon` | `string` | optional | URL or 1–2 character emoji/unicode string. Short strings render as `<span class="texticon">`, longer strings are loaded as `<img>`. |
| `preview` | `function(pblock, args)\|string\|undefined` | recommended | Called while the user is typing. `pblock` is the preview `div` DOM element. `args` is a `DirectObj`. A string value is rendered verbatim as HTML. `undefined` renders `description`. |
| `execute` | `function(args)` | recommended | Called when the user presses Enter. `args` is a `DirectObj`. |
| `timeout` | `number` | optional | Milliseconds. When > 0, both `preview` and `execute` are wrapped in a debounce: the real function runs only after the user stops typing/pressing for this duration. |
| `require` | `string\|string[]` | optional | Script URL(s) loaded into the background window before preview/execute run. Cached once loaded. |
| `requirePopup` | `string\|string[]` | optional | Script URL(s) loaded into the popup window before preview/execute run. |
| `url` | `string` | optional (search commands) | URL template with `{text}`, `{QUERY}`, `{location}` placeholders. Used by `makeSearchCommand()`. |
| `prevAttrs` | `object` | optional | Preview behaviour flags for `_searchCommandPreview`: `zoom` (number, default 0.85), `anchor` (string or string[]), `scroll` ([x,y]), `url` (override), `backgroundColor`. |
| `builtIn` | `boolean` | internal | Set automatically by `loadCustomScripts()` to mark built-in vs user commands. |
| `test` | `object` | optional | Test definition embedded in the command; merged into the test suite by `tests.js`. |
| `external` | `boolean` | optional | Adds the `external` CSS class to the suggestion list item. |

If a command with the same `name` already exists it is silently replaced.

**DirectObj** — the argument object passed to `preview` and `execute`:

| Key | Description |
|---|---|
| `text` | The command-line text after the command word, or `CmdUtils.selectedText` if the text part is empty. |
| `_selection` | `true` when `text` equals `CmdUtils.selectedText`. |
| `_cmd` | Reference to the command struct itself. |
| `_opt_idx` | Index of the currently selected `[data-option]` element in the preview panel (–1 if none). |
| `_opt_val` | The `data-option-value` attribute of the selected option element. |
| `pblock` | (execute only) The preview `div` DOM element at the time of execution. |

### Preview Options (`data-option`)

Commands can expose a list of selectable options inside the preview panel. Any DOM element in the preview with a `data-option` attribute participates in keyboard navigation:

- `Ctrl+↑` / `Ctrl+↓` cycles through them, updating `ubiq_selected_option`.
- The selected element gets `data-option="selected"`; all others get `data-option=""`.
- The selected element receives a custom `data-option-selected` DOM event — commands can attach handlers for immediate feedback (e.g. copy to clipboard on selection).
- At execute time, `args._opt_idx` holds the index (–1 if none selected) and `args._opt_val` holds the element's `data-option-value` attribute.

```html
<!-- example preview HTML -->
<div data-option data-option-value="one">Option 1</div>
<div data-option data-option-value="two">Option 2</div>
```

```js
// react immediately when an option is highlighted
jQuery(e).on("data-option-selected", e => CmdUtils.setClipboard($(e.target).text()));
```

---

#### `CmdUtils.makeSearchCommand(args)`

Convenience wrapper around `CreateCommand` for URL-based search commands. Requires `args.url` containing `{text}` or `{QUERY}` placeholder.

- Generates a default `execute` that calls `CmdUtils.addTab(url)` with the encoded query.
- Generates a default `preview` (`_searchCommandPreview`) that renders an iframe preview of the target page after a 300 ms delay.
- Stores the original generated functions as `execute_org` and `preview_org` so user-supplied functions can still call them.
- If `args.preview == 'none'` no preview is set.
- Default `prevAttrs.zoom` is 0.85.

#### `CmdUtils.SimpleUrlBasedCommand(url)`

Returns a standalone execute function (not a full command). When called with a `directObj`, it opens `url` with `{text}`/`{QUERY}`/`{location}` replaced. If `directObj._opt_val` contains `://` it opens that URL directly instead.

---

### Command Lookup

#### `CmdUtils.getcmd(cmdname) → CommandStruct | null`
Returns the command whose `name` or any element of `names` equals `cmdname` exactly. Returns `null` if not found.

#### `CmdUtils.getcmdpart(cmdname) → CommandStruct | null`
Two-pass lookup (case-insensitive, trims input):
1. Exact match against any name.
2. Prefix match against any name.

Returns the first hit, or `null`.

---

### Command Execution Shortcuts

#### `CmdUtils.execute(command, args)`
Looks up `command` via `getcmdpart`, builds a minimal `DirectObj` from `args` (string → `{text: args}`), and calls `cmd.execute`. Returns `null` if command not found.

#### `CmdUtils.preview(command, pblock, args)`
Same as `execute` but calls `cmd.preview(pblock, directObj)`. If `pblock` is a string and `args` is undefined, `pblock` is treated as `args` and the default popup preview element is used.

---

### Tab Management

#### `CmdUtils.addTab(url, active = true)`
Opens `url` in a new tab. If `CmdUtils.lastKeyEvent.shiftKey` is `true`, `active` is forced to `false` (background tab). Handles Firefox (`browser.tabs`), Chrome (`chrome.tabs`), and fallback (`window.open`). On Firefox, also closes the popup.

#### `CmdUtils.closeTab()`
Closes the currently active tab using `chrome.tabs.query`.

#### `CmdUtils.createTab(props, callback)`
Extended wrapper around `chrome.tabs.create()`. `props` accepts all standard Chrome tab properties plus additional keys processed before the tab is created:

| Extra Key | Description |
|---|---|
| `input` | CSS selector for an input element to fill. |
| `value` | Value to assign to the `input` element; a `change` event is dispatched. |
| `submit` | CSS selector for element(s) to `.click()`. |
| `form` | CSS selector for form(s) to `.submit()`. |
| `delay` | Milliseconds to wait inside the tab before performing the above actions (default 0). |
| `complete` | If `true`, actions are deferred until `document.readyState == "complete"`. |
| `initcode` | Raw JS string executed immediately before the delay loop. |
| `begincode` | Raw JS string executed at the start of the delay callback. |
| `endcode` | Raw JS string executed after submit/form actions. |

The generated code is injected via `chrome.tabs.executeScript`. `callback(tab)` is invoked after the tab is created.

#### `CmdUtils.postNewTab(url, data)`
Opens a new tab by programmatically creating and submitting an HTML `<form method="post">`. `data` can be a query string or a key-value object (parsed with `Utils.urlToParams` if a string).

#### `CmdUtils.inject(url, oninject)`
Injects a `<script src="url">` tag into the current tab's page by executing a small snippet via `chrome.tabs.executeScript`.

---

### Location Helpers

#### `CmdUtils.getLocation() → string`
Returns `CmdUtils.active_tab.url` or `""` if no active tab is set.

#### `CmdUtils.getLocationOrigin(url = "") → string`
Returns the `origin` portion of `url`. If `url` is empty, uses the active tab's URL. Returns `""` on parse error.

---

### Selection

#### `CmdUtils.updateSelection(tab_id)`
Executes `window.getSelection().toString()` in the given tab and stores the result in `CmdUtils.selectedText`.

#### `CmdUtils.setSelection(s)`
Replaces the current selection in the active tab with the string `s`. Works in both plain text inputs and rich content via `Range`. Falls back to `document.selection` for older IE-style APIs.

---

### Active Tab / Update Handlers

#### `CmdUtils.updateActiveTab()`
Queries `chrome.tabs` for the currently active tab. If the URL starts with `http(s)://`, updates `CmdUtils.active_tab` and calls `updateSelection()`. Then fires all registered update handlers. Called from `background.js` on every tab activation/update event.

#### `CmdUtils.addUpdateHandler(name, handler)`
Registers a named callback `handler` that is called on every `updateActiveTab()` invocation. If a handler with `name` already exists it is replaced.

#### `CmdUtils.removeUpdateHandler(name?)`
Removes the handler with the given `name`. If called with no argument, clears all handlers.

---

### HTTP / AJAX

#### `CmdUtils.ajaxGetJSON(url, callback)`
Plain `XMLHttpRequest` GET. On completion, parses the response as JSON and calls `callback(parsedObject, xhr)`.

#### `CmdUtils.ajaxGet(url, callback)`
Plain `XMLHttpRequest` GET. Calls `callback(responseText, xhr)` on completion.

#### `CmdUtils.get(url, success?) → jqXHR`
jQuery `$.ajax` GET (async). Returns a jQuery Deferred/Promise. `success` is optional.

#### `CmdUtils.post(url, data) → jqXHR`
jQuery `$.ajax` POST (async). Returns a jQuery Deferred/Promise.

#### `CmdUtils.loadScripts(url, callback, wnd = window)`
Loads one or more script URLs into `wnd` using `jQuery.getScript`. Skips URLs already in `wnd.loadedScripts`. On completion calls `callback()`. Silently calls `callback()` immediately if `url` is empty.

---

### Clipboard

#### `CmdUtils.setClipboard(text)`
Copies plain text to the system clipboard using `document.execCommand('Copy')`.

#### `CmdUtils.getClipboard() → string`
Pastes from the system clipboard into a temporary element and returns the plain text content.

#### `CmdUtils.setClipboardHTML(html) → Promise`
Async version. Copies `html` as rich HTML to the clipboard using `document.execCommand('copy')` on a content-editable element.

#### `CmdUtils.getClipboardHTML() → string`
Pastes from the clipboard into a content-editable element and returns the `.innerHTML`.

---

### History

#### `CmdUtils.saveToHistory(cmdline)`
Pushes `cmdline` onto the front of `CmdUtils.history`. Skips if the line starts with `"hist"` or is identical to the most recent entry. Caps the buffer at 64 entries and persists to `chrome.storage.local`.

#### `CmdUtils.saveToHistoryPreview(cmdline)`
Like `saveToHistory` but replaces the most recent entry instead of prepending when the command word matches. Called with a 3-second delay from `ubiq_show_preview()` in `popup.js`.

#### `CmdUtils.loadHistory()`
Reads `history` from `chrome.storage.local` into `CmdUtils.history`.

---

### Custom Script Management

#### `CmdUtils.loadCustomScripts()`
1. Calls `unloadCustomScripts()` to remove all user commands.
2. Marks all remaining (built-in) commands with `builtIn = true`.
3. Reads `customscripts` from `chrome.storage.local` and `eval`s the content, registering any new commands defined there.

#### `CmdUtils.unloadCustomScripts()`
Filters `CmdUtils.CommandList` to keep only commands where `builtIn === true`.

---

### Timing

#### `CmdUtils.timeSinceInputUpdate() → number`
Returns seconds elapsed since the last `keydown` event (based on `performance.now()`).

---

### Debugging

#### `CmdUtils.dump(cmd) → string`
Returns a JavaScript source string that recreates the named command (looked up via `getcmdpart`). Functions are stringified with `toString()`.

---

### Internal Preview Helpers

These are internal methods used by `makeSearchCommand` and are not intended for direct use in commands.

#### `CmdUtils._searchCommandPreview(pblock, {text})`
Default preview function assigned by `makeSearchCommand`. Shows a brief description immediately, then after 300 ms loads the search URL in an `<iframe>` inside the preview panel. Handles zoom (`--zoom` CSS variable), scroll restoration, anchor navigation, and focus management.

#### `CmdUtils._restoreFocusToInput(event)`
`blur` event listener attached to the popup window when an iframe preview is shown. Restores keyboard focus to `#ubiq_input` and restores the preview scroll position.

#### `CmdUtils._afterLoadPreview(ifrm)`
`iframe.onload` handler. Jumps to the configured anchor within the iframe (tries each anchor in order) and removes the blur listener.

---

## jQuery Extensions (`cmdutils.js`)

Registered on the shared `jQuery` instance.

### `$.fn.blankify()`
Sets `target="_blank"` on all `<a>` elements in the matched set.

### `$.fn.loadAbs(url, complete?)`
Calls jQuery `.load(url)` then rewrites all relative `href` and `src` attributes in the loaded content to absolute URLs based on `url`'s hostname.

### `$.fn.absolutize(origin?)`
Rewrites `href` (and `src` for `<img>`) of all elements in the set to absolute URLs. Defaults to `window.origin` when `origin` is omitted.

### `$.fn.scrollTo(elem, speed?)`
Scrolls the matched container so that `elem` is visible. Only scrolls if `elem` is outside the container's viewport. Defaults to 100 ms animation.

### `$.fn.ensureInView(container, element)`
Adjusts `container.scrollTop` by the minimum amount to bring `element` into view. No animation.

### `$.fn.inView(container, element) → boolean`
Returns `true` if `element` is fully within `container`'s scroll viewport.

### `$.fn.inViewport() → boolean`
Returns `true` if the matched element is within the browser's current viewport.

### `url_domain(data) → string`
Module-level helper (also exposed as `CmdUtils.url_domain`). Extracts the `hostname` from a URL string by creating a temporary `<a>` element.

---

## `Utils` Namespace

Defined in `utils.js`.

### `Utils.paramsToString(params, prefix = "?") → string`

Serialises a key-value object to a URL query string. Array values produce repeated keys. `null` and `undefined` values and function values are silently omitted. The `prefix` can be set to `""` to omit the leading `?`.

```js
Utils.paramsToString({q: 'hello world', page: 1})
// → "?q=hello%20world&page=1"
```

### `Utils.urlToParams(urlString) → object`

Parses the query string portion of `urlString` into a plain object. Handles `+` as a space, `decodeURIComponent`, and duplicate keys (duplicate values become an array).

```js
Utils.urlToParams('https://example.com/search?q=hello&q=world')
// → {q: ['hello', 'world']}
```

---

## Popup Layer (`popup.js`)

`popup.js` runs inside the popup window (`popup.html`). It owns all DOM interaction and routes user input to the command layer.

### State Variables

| Variable | Description |
|---|---|
| `ubiq_selected_command` | Index into the current `matches[]` array; which suggestion is highlighted. |
| `ubiq_selected_option` | Index of the selected `[data-option]` element within the preview panel (–1 = none). |
| `ubiq_first_match` | Name of the first/selected command match; set during rendering, consumed by `ubiq_dispatch_command`. |
| `ubiq_history_index` | Current position in `CmdUtils.history` during Ctrl+P/N navigation. |
| `ubiq_last_preview_command_index` | Index into `CmdUtils.CommandList` for the most recently previewed command; used to avoid clearing the panel when the command has not changed. |
| `ubiq_last_preview_cmd` | The most recently previewed command struct. |
| `ubiq_preview_org_html` | Saved `outerHTML` of `#ubiq-command-preview`; used to recreate it in `ubiq_reset_preview()`. |
| `lcmd` | Cached value of the input field; used to short-circuit redundant `ubiq_show_matching_commands()` calls. |

### DOM Panel Functions

#### `ubiq_preview_el() → HTMLElement`
Returns `document.getElementById('ubiq-command-preview')`.

#### `ubiq_result_el() → HTMLElement`
Returns `document.getElementById('ubiq-result-panel')`.

#### `ubiq_set_preview(html, prepend?)`
Sets the `.innerHTML` of the preview panel. If `prepend` is `true`, existing content is kept below an `<hr>`.

#### `ubiq_set_result(html, prepend?)`
Same as `ubiq_set_preview` but for the result panel.

#### `ubiq_set_tip(html)`
Sets the `.innerHTML` of `#ubiq-command-tip`.

#### `ubiq_clear()`
Clears tip, result, and preview panels.

#### `ubiq_reset_preview()`
Recreates `#ubiq-command-preview` by removing the current element and inserting a fresh clone from `ubiq_preview_org_html`. This terminates any in-flight async operations that hold a reference to the old element — the preferred guard pattern in command previews is `if (!CmdUtils.popupWindow.document.contains(pblock)) return;`.

#### `ubiq_preview_set_visible(v)`
Shows or hides `#ubiq-command-panel`. When hidden, adds class `"result"` to the result panel to expand it.

#### `ubiq_result_autoresize()`
Adjusts the CSS `width` and `max-width` of the preview/tip/command panels based on whether the result panel is visible. If result panel width > 0, panels shrink to 540 px; otherwise they expand to 780 px. Attached to a `ResizeObserver` on `#ubiq-result-panel`.

### Input Functions

#### `ubiq_command() → string`
Returns the current value of `#ubiq_input`.

#### `ubiq_set_input(value, select = true)`
Sets `#ubiq_input` value and optionally selects all text.

#### `ubiq_save_input()`
Persists the current input value to `chrome.storage.local` under the key `lastCmd`.

#### `ubiq_load_input(callback)`
Loads `lastCmd` from `chrome.storage.local` into the input element, then calls `callback()`. Always calls `callback` even if storage is unavailable.

#### `ubiq_focus()`
Selects all text in `#ubiq_input` and calls `.focus()`.

### Command Matching

#### `ubiq_fuzzy_search(needle, haystack) → number`
Weighted fuzzy-match scorer. Returns:
- `0x7fffffff` for exact case-insensitive match
- `nlen * 16` or `nlen * 8` for a prefix match at a word boundary
- A positive float for partial/subsequence matches (higher = better match)
- `0` if no match

#### `ubiq_match_first_command(text?) → string`
Returns the name of the first command whose name starts with `text` (via simple `RegExp` prefix test). Returns `ubiq_first_match` if that is set (i.e. the user has navigated the suggestion list with cursor keys).

#### `ubiq_show_matching_commands(text?)`
Main rendering function. Computes up to 15 fuzzy matches for the first word of `text`, renders the suggestion `<ul>`, calls `ubiq_show_preview()` for the selected command, and updates panel visibility. Shows the help screen if no matches are found.

### Command Execution

#### `ubiq_execute()`
Reads the current command line and calls `ubiq_dispatch_command()`.

#### `ubiq_dispatch_command(line)`
Parses `line` into command + arguments, looks up the command struct, constructs a `DirectObj`, optionally loads required scripts via `CmdUtils.loadScripts()`, and calls `cmd.execute`. On error: sets the error badge, stores the stack in `CmdUtils.lastError`, shows a notification, and logs to console.

### Preview Rendering

#### `ubiq_show_preview(cmd_struct)`
Dispatches the preview for a command struct:
- `undefined` preview → renders `description` or `help` text
- `string` preview → renders the string as HTML
- `function` preview → builds `DirectObj`, enqueues a `saveToHistoryPreview` with a 3-second debounce, loads any required scripts, then calls `preview_func.bind(cmd_struct)(pblock, directObj)`. Errors are caught and reported via badge/notification.

#### `ubiq_show_preview` — Script Loading Chain
Scripts are loaded in two stages before the preview function runs:
```
CmdUtils.loadScripts(cmd_struct.require,
  () => CmdUtils.loadScripts(cmd_struct.requirePopup, pfunc, window)
)
```
`require` scripts go into the background window; `requirePopup` scripts into the popup window.

### Options Navigation

#### `ubiq_update_options()`
Updates the `data-option` attribute on elements within the preview panel to reflect `ubiq_selected_option`. Scrolls the selected option into view using `ensureInView()`, and fires a `data-option-selected` event on the selected element.

### Suggestion Navigation

#### `ubiq_tabsuggest()`
Expands the first word of the input to the currently matched command name and appends a space (preparing for argument entry).

#### `ubiq_replace_first_word(w)`
Replaces the first space-delimited word of the input field with `w`.

### Rendering Helpers

#### `ubiq_command_icon(c) → string`
Returns the HTML for a command's icon. Short strings (1–2 chars) render as `<span class="texticon">emoji</span>`; longer strings load as an `<img>`; absent icon defaults to `res/spacer.png`.

#### `ubiq_command_name(c) → string`
Returns `CmdUtils.CommandList[c].name`.

#### `ubiq_html_encode(text) → string`
HTML-escapes a string using a cached jQuery div element.

#### `ubiq_help() → string`
Builds and returns the help screen HTML showing all registered commands and keyboard shortcut reference.

### Keyboard Shortcuts

Handled by `ubiq_keydown_handler(evt)`:

| Key | Action |
|---|---|
| `Tab` | Expand current suggestion (`ubiq_tabsuggest`) |
| `Space` (with full selection) | Strip arguments, keep only command word |
| `Enter` | Execute command |
| `F5` | Reload extension (`chrome.runtime.reload()`) |
| `Ctrl+C` | Copy preview panel `innerText` to clipboard |
| `Ctrl+P` / `Ctrl+E` | Navigate history backwards |
| `Ctrl+N` / `Ctrl+X` | Navigate history forwards |
| `Ctrl+R` / `Alt+F8` | Set input to `"history "` |
| `Ctrl+↑` | Select previous preview option |
| `Ctrl+↓` | Select next preview option |
| `↑` | Select previous command suggestion |
| `↓` | Select next command suggestion (max 14) |

`ubiq_keyup_handler(evt)` re-runs `ubiq_show_matching_commands()` if the input value changed.

### Initialisation (`window.load`)

On popup load:
1. Saves `ubiq_preview_org_html` for later reset operations.
2. Assigns `CmdUtils.setPreview`, `CmdUtils.setResult`, `CmdUtils.setTip` to DOM-writing implementations.
3. Sets `CmdUtils.popupWindow = window`.
4. Calls `CmdUtils.updateActiveTab()`.
5. Attaches `keydown`, `keyup`, and `input` event listeners.
6. Focuses the input field.
7. Loads the last command from storage (if `CmdUtils.loadLastInput`), then calls `ubiq_show_matching_commands()` and `CmdUtils.onPopup(window)`.

---

## Background Script (`background.js`)

Runs as the extension's persistent background page. Responds to three Chrome events:

### `chrome.runtime.onMessage` — `'selection'`
Receives selection data posted by the content script (`selection.js`). Stores `request.data` in `CmdUtils.selectedText`.

### `chrome.tabs.onUpdated`
Fires when a tab's URL or loading state changes. Calls `CmdUtils.updateActiveTab()`.

### `chrome.tabs.onActivated`
Fires when the user switches to a different tab. Calls `CmdUtils.updateActiveTab()`.

### `chrome.tabs.onHighlighted`
Fires when the highlighted tab in a window changes. Calls `CmdUtils.updateActiveTab()`.

All three listeners return `true` to keep the message channel open for asynchronous responses.

---

## Test Framework (`tests.js`)

### Test Object Schema

Each entry in the `tests` array (and embedded `command.test` objects) supports:

| Property | Type | Description |
|---|---|---|
| `name` | `string` | UbiChr command name to test. |
| `args` | `string` | Arguments to append after the command name in the input field. |
| `exec` | `boolean` | If `true`, presses Enter to execute the command after rendering. |
| `timeout` | `number` | Milliseconds to wait before checking assertions. |
| `text` | `string` | Preview panel `innerText` must equal this exactly. |
| `starsWithText` | `string` | Preview panel `innerText` must start with this string. |
| `includesText` | `string` | Preview panel `innerText` must include this string. |
| `includesTextLC` | `string` | Same, case-insensitive (both sides lowercased). |
| `html` | `string` | Preview panel `innerHTML` must equal this exactly. |
| `includesHTML` | `string` | Preview panel `innerHTML` must include this string. |
| `url` | `string\|string[]` | One or more URL patterns (Chrome `tabs.query` format, wildcards allowed). All must match open tabs after execution. |
| `internal` | `boolean` | If `true`, the test runs directly in the tests window instead of opening a new popup tab. |
| `init(window)` | `function` | Called before the timeout; use to set up state or open required tabs. |
| `test(window)` | `function\|async function` | Custom assertion; should return `true` to pass. Replaces all other assertion properties if provided. |
| `exit(window)` | `function` | Called after assertions; use for cleanup. |

### Auto-Added Properties

| Property | Description |
|---|---|
| `pass(msg)` | Call to mark the test as passed; updates the UI with a ✅. |
| `fail(msg)` | Call to mark the test as failed; updates the UI with a ❌. |
| `result` | `"pass"` or `"fail"` string set after the test completes. |
| `el` | The DOM element `<div class="status" name="…">` for this test. |

### Key Functions

#### `initTests()`
Sets `CmdUtils.loadLastInput = false` and installs a `CmdUtils.onPopup` handler. The handler reads the URL hash (e.g. `#testcalc`), looks up the test in `CmdUtils.testing`, calls `init()`, sets the input, fires a synthetic keydown, optionally executes the command, waits `timeout` ms, then runs all assertions. On pass/fail calls `t.pass()`/`t.fail()`, then `exit()` and `postexit()`.

#### `runSingleTest(t, delay = 0)`
Runs a single test after `delay` ms:
- For `internal` tests: runs `init()`, then checks `test()` after `t.timeout`.
- For normal tests: opens a new popup tab with URL `popup.html#test<name>`, where the `onPopup` hook performs the actual test.

Also ensures the tests window regains focus ~2 seconds after opening the test tab.

#### `runAllTests()`
Clears `#tests` and calls `runSingleTest()` for every test in the array.

### UI Controls

| Element | Action |
|---|---|
| `#start` | Run all tests (10× timeout multiplier) |
| `#startslow` | Run all tests (5 s minimum timeout, 10× multiplier) |
| `#startseq` | Run all tests sequentially, 500 ms apart |
| `#rempass` | Remove passed tests from the UI and the `tests` array |
| `#retry` | Re-run all failed tests, 500 ms apart |
| `#close` | Stop testing; close all test-related tabs |
| `#generate` | Generate JSON stubs for untested commands that have a `url` property |
| `#autoclose` | Checkbox; when checked, each test's `postexit` closes its result tabs and the popup |
| `a.runsingle` | Click any test name to run that single test |

### Test Suite Composition

The final `tests` array is built at startup by:
1. Keeping only entries with more than one property (skips bare name-only stubs).
2. Appending embedded `command.test` objects from `CmdUtils.CommandList`.
3. Sorting alphabetically by name.
4. Filling defaults: `args = ""`, `init = ()=>{}`, `exit = ()=>{}`, `postexit = ()=>{}`.
5. Validating uniqueness of names (logs an error and sets the error badge on duplicates).
