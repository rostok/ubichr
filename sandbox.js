// UbiChr Sandbox Script
// Runs inside a sandboxed iframe (no chrome.* API access, but eval() is allowed).
// Communicates with the popup via postMessage.
//
// Message protocol (sandbox → popup):
//   {type: 'sandbox-ready'}                         — sandbox initialized
//   {type: 'register-command', name, names, icon, description, builtIn: false}
//   {type: 'pblock-update', html}                   — pblock innerHTML changed
//   {type: 'chrome-call', id, method, args}         — request chrome.* call
//   {type: 'eval-error', message}                   — custom script eval failed
//   {type: 'eval-ok', commands}                     — eval succeeded, list of command names
//
// Message protocol (popup → sandbox):
//   {type: 'eval', code}                            — evaluate custom scripts
//   {type: 'preview', name, args}                   — call command preview
//   {type: 'execute', name, args}                   — call command execute
//   {type: 'chrome-result', id, result, error}      — result of chrome.* call
//   {type: 'unload-custom'}                         — remove all non-builtin commands

// ── State ────────────────────────────────────────────────────────────────────

var sandboxCommands = {};       // name → command struct (for custom commands)
var pendingCallbacks = {};      // id → {resolve, reject} for proxied chrome.* calls
var pblockEl = document.getElementById('sandbox-pblock');

// ── postMessage bridge helpers ────────────────────────────────────────────────

function sendToPopup(msg) {
    parent.postMessage(msg, '*');
}

// Call a chrome.* method via popup proxy; returns a Promise
var _callId = 0;
function chromeProxy(method, args) {
    return new Promise(function(resolve, reject) {
        var id = 'sb_' + (++_callId);
        pendingCallbacks[id] = { resolve: resolve, reject: reject };
        sendToPopup({ type: 'chrome-call', id: id, method: method, args: args || [] });
    });
}

// ── pblock proxy ─────────────────────────────────────────────────────────────
// Commands write to pblock.innerHTML; we mirror it to the popup via MutationObserver.

var _pblockObserver = new MutationObserver(function() {
    sendToPopup({ type: 'pblock-update', html: pblockEl.innerHTML });
});
_pblockObserver.observe(pblockEl, { subtree: true, childList: true, characterData: true, attributes: true });

// MutationObserver covers all DOM changes (innerHTML, appendChild, css, etc.)
// pblockEl is passed directly to preview functions — no Proxy needed.

// ── Proxy CmdUtils ─────────────────────────────────────────────────────────────
// All chrome.* calls and DOM updates are forwarded to the popup.

var Utils = {
    urlToParams: function(url) {
        var result = {};
        var parts = url.split('?');
        if (parts.length < 2) return result;
        parts[1].split('&').forEach(function(p) {
            var kv = p.split('=');
            result[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
        return result;
    }
};

var CmdUtils = {
    VERSION: '0.1.0.63',
    DEBUG: false,
    CommandList: [],
    expandOnExecute: false,
    history: [],
    selectedText: '',
    selectedHTML: '',
    active_tab: null,
    loadLastInput: true,
    updateHandlers: [],
    lastError: '',

    log: function() { console.log.apply(console, arguments); },
    error: function() { console.error.apply(console, arguments); },
    trace: function() { console.trace.apply(console, arguments); },
    deblog: function() { if (CmdUtils.DEBUG) console.log.apply(console, arguments); },

    // ── Command registration ──────────────────────────────────────────────────
    CreateCommand: function(cs) {
        if (Array.isArray(cs.name)) {
            cs.names = cs.name;
            cs.name = cs.name[0];
        } else {
            cs.name = cs.name || cs.names[0];
            cs.names = cs.names || [cs.name];
        }
        if (typeof cs.test === 'object' && typeof cs.test.name === 'undefined') {
            cs.test.name = cs.name;
        }
        if (typeof cs.execute !== 'function') cs.execute = function(args) {};

        var to = parseFloat(cs.timeout || 0);
        if (to > 0) {
            if (typeof cs.preview === 'function') {
                cs.preview_timeout = cs.preview;
                cs.preview = function(b, a) {
                    clearTimeout(cs.lastPrevTimeoutID);
                    cs.lastPrevTimeoutID = setTimeout(function() {
                        (cs.preview_timeout.bind(cs))(b, a);
                    }, to);
                };
            }
            if (typeof cs.execute === 'function') {
                cs.execute_timeout = cs.execute;
                cs.execute = function(a) {
                    clearTimeout(cs.lastExecTimeoutID);
                    cs.lastExecTimeoutID = setTimeout(function() {
                        (cs.execute_timeout.bind(cs))(a);
                    }, to);
                };
            }
        }

        sandboxCommands[cs.name] = cs;
        sendToPopup({
            type: 'register-command',
            name: cs.name,
            names: cs.names,
            icon: cs.icon || '',
            description: cs.description || '',
            help: cs.help || '',
            external: cs.external || false,
            test: (function(t) {
                if (!t || typeof t === 'function') return null;
                try { return JSON.parse(JSON.stringify(t)); } catch(e) { return null; }
            })(cs.test),
            // Original function sources for command-source/dump
            previewSrc: typeof cs.preview === 'function' ? cs.preview.toString() : (typeof cs.preview === 'string' ? cs.preview : null),
            executeSrc: typeof cs.execute === 'function' ? cs.execute.toString() : null,
            extraProps: (function() {
                var skip = {name:1,names:1,icon:1,description:1,help:1,external:1,test:1,preview:1,execute:1,timeout:1,builtIn:1};
                var p = {};
                Object.keys(cs).forEach(function(k) {
                    if (!skip[k] && typeof cs[k] !== 'function') {
                        try { p[k] = JSON.parse(JSON.stringify(cs[k])); } catch(e) {}
                    }
                });
                return p;
            })()
        });
    },

    // Stub for built-in commands compatibility
    makeSearchCommand: function(cs) {
        // Minimal search command factory (from cmdutils.js pattern)
        var url = cs.url || '';
        cs.execute = cs.execute || function(args) {
            var finalurl = url.replace(/\{QUERY\}|\{text\}/g, encodeURIComponent(args.text));
            CmdUtils.addTab(finalurl);
        };
        cs.preview = cs.preview || function(pblock, args) {
            pblock.innerHTML = cs.description || 'Search: ' + args.text;
        };
        CmdUtils.CreateCommand(cs);
    },

    getcmd: function(name) {
        if (sandboxCommands[name]) return sandboxCommands[name];
        // Command is in popup (built-in) — return proxy that forwards property sets
        return new Proxy({}, {
            get: function(t, prop) { return t[prop]; },
            set: function(t, prop, value) {
                t[prop] = value;
                if (typeof value !== 'function')
                    sendToPopup({type: 'set-cmd-prop', name: name, prop: prop, value: value});
                return true;
            }
        });
    },

    getcmdpart: function(name) {
        if (!name) return null;
        name = name.trim().toLowerCase();
        for (var k in sandboxCommands) {
            var c = sandboxCommands[k];
            for (var i = 0; i < c.names.length; i++) {
                if (c.names[i].toLowerCase() === name) return c;
            }
        }
        for (var k in sandboxCommands) {
            var c = sandboxCommands[k];
            for (var i = 0; i < c.names.length; i++) {
                if (c.names[i].toLowerCase().startsWith(name)) return c;
            }
        }
        return null;
    },

    unloadCustomScripts: function() {
        sandboxCommands = {};
    },

    loadCustomScripts: function() {
        // In sandbox, eval is called directly when popup sends {type:'eval'}
    },

    // ── UI proxies ─────────────────────────────────────────────────────────────
    // compat shim: some custom commands expect a preview-block getter
    getPreviewBlock: function() { return pblockEl; },
    setPreview: function(html) {
        sendToPopup({ type: 'set-preview', html: html });
    },
    setResult: function(html) {
        sendToPopup({ type: 'set-result', html: html });
    },
    setTip: function(html) {
        sendToPopup({ type: 'set-tip', html: html });
    },
    setBadge: function(text, color) {
        sendToPopup({ type: 'set-badge', text: text || 'OK', color: color || '#77c' });
    },
    notify: function(message, title) {
        chromeProxy('notifications.create', [null, {
            type: 'basic',
            iconUrl: 'res/icon-128.png',
            title: title || 'UbiChr',
            message: String(message)
        }]);
    },

    // ── Tab operations ─────────────────────────────────────────────────────────
    addTab: function(url, inactive) {
        chromeProxy('tabs.create', [{ url: url, active: !inactive }]);
    },
    addInactiveTab: function(url) {
        CmdUtils.addTab(url, true);
    },
    getLocation: function() {
        return CmdUtils.active_tab ? CmdUtils.active_tab.url : '';
    },

    SimpleUrlBasedCommand: function(url) {
        if (!url) return function() {};
        return function(directObj) {
            var opt = directObj._opt_val || '';
            if (opt.includes('://')) {
                CmdUtils.addTab(opt);
            } else {
                var text = encodeURIComponent(directObj.text);
                var finalurl = url.replace(/\{text\}|\{QUERY\}/g, text)
                                  .replace(/\{location\}/g, CmdUtils.getLocation());
                CmdUtils.addTab(finalurl);
            }
        };
    },

    // ── Clipboard ──────────────────────────────────────────────────────────────
    _clipboardText: '',
    setClipboard: function(text) {
        sendToPopup({ type: 'set-clipboard', text: String(text) });
    },
    getClipboard: function() {
        return CmdUtils._clipboardText;
    },

    // ── Network requests ───────────────────────────────────────────────────────
    // Route through popup to avoid CORS issues with null origin
    ajaxGet: function(url, callback) {
        chromeProxy('fetch', [url]).then(function(result) {
            if (callback) callback(result);
        }).catch(function(e) {
            console.error('ajaxGet failed', e);
        });
    },
    get: async function(url) {
        var text = await chromeProxy('fetch', [url]);
        // Use jQuery(text) — same as MV2 popup where $.ajax returned responseText
        // and commands used jQuery(selector, responseText) as context
        try { return jQuery(text); } catch(e) { return text; }
    },

    // ── Script injection ───────────────────────────────────────────────────────
    inject: function(url, oninject) {
        chromeProxy('scripting.injectScript', [url]);
    },
    // Remote libraries CAN load here: fetch the source through the popup proxy
    // (bypasses the null-origin CORS) and eval it (sandbox CSP allows eval).
    // Used for command require/requirePopup (xlsx, html2canvas, FileSaver, ...).
    loadScripts: function(url, callback, wnd) {
        url = url || [];
        if (url.constructor === String) url = [url];
        window.loadedScripts = window.loadedScripts || [];
        var toLoad = url.filter(function(u) { return !window.loadedScripts.includes(u); });
        if (toLoad.length === 0) { if (callback) callback(); return; }
        console.log('sandbox loadScripts >>>', toLoad.join());
        // sequential, so multi-script requires keep their order
        toLoad.reduce(function(p, u) {
            return p.then(function() {
                return chromeProxy('fetch', [u]).then(function(code) {
                    (0, eval)(code); // indirect eval → global scope
                    window.loadedScripts.push(u);
                });
            });
        }, Promise.resolve())
        .then(function() { if (callback) callback(); })
        .catch(function(e) {
            console.error('sandbox loadScripts failed:', e);
            sendToPopup({ type: 'set-tip', html: '<span style="color:red">loadScripts failed: ' + ((e && e.message) || e) + '</span>' });
        });
    },

    // ── Selection ─────────────────────────────────────────────────────────────
    setSelection: function(s) {
        chromeProxy('scripting.setSelection', [String(s)]);
    },

    // ── History ───────────────────────────────────────────────────────────────
    saveToHistory: function(cmdline) {
        sendToPopup({ type: 'save-history', cmdline: cmdline });
    },
    saveToHistoryPreview: function(cmdline) {
        sendToPopup({ type: 'save-history-preview', cmdline: cmdline });
    },
    loadHistory: function() {},

    // ── Update handlers ───────────────────────────────────────────────────────
    addUpdateHandler: function(name, handler) {
        if (!name || typeof handler !== 'function') return;
        CmdUtils.updateHandlers = CmdUtils.updateHandlers.filter(h => h.name !== name);
        CmdUtils.updateHandlers.push({ name: name, handler: handler });
    },
    removeUpdateHandler: function(name) {
        if (name === undefined) return CmdUtils.updateHandlers = [];
        CmdUtils.updateHandlers = CmdUtils.updateHandlers.filter(v => v.name !== name);
    },
    updateActiveTab: function() {},

    // ── Misc ──────────────────────────────────────────────────────────────────
    timeSinceInputUpdate: function() { return 0; },
    inputUpdateTime: 0,
    onPopup: function() {},
    // Stub for scripts using CmdUtils.backgroundWindow.chrome.* — silently no-ops in sandbox
    backgroundWindow: (function() {
        function deepProxy() {
            return new Proxy(function(){}, {
                get: () => deepProxy(),
                apply: () => undefined,
                set: () => true,
            });
        }
        return { chrome: deepProxy() };
    })(),
    refreshPreview: function() {
        sendToPopup({ type: 'refresh-preview' });
    },
    createTab: function(props, callback) {
        chromeProxy('createTab', [props]).then(callback || function() {});
    },
    postNewTab: function(url, data) {
        chromeProxy('tabs.postNewTab', [url, data]);
    },
    execute: function(command, args) {
        var c = CmdUtils.getcmdpart(command);
        if (!c) return null;
        if (typeof args === 'undefined') args = { text: '' };
        if (typeof args === 'string') args = { text: args };
        return (c.execute.bind(c))(args);
    },
    preview: function(command, pblock, args) {
        var c = CmdUtils.getcmdpart(command);
        if (!c) return null;
        if (typeof args === 'undefined') args = { text: '' };
        if (typeof args === 'string') args = { text: args };
        return (c.preview.bind(c))(pblock, args);
    }
};

// ── chrome.* shim for legacy custom commands ─────────────────────────────────
// The sandbox has no extension context, but many MV2-era custom commands call
// chrome.tabs.* directly. This shim forwards the common calls to the popup via
// chromeProxy; executeScript with a {code} string goes through the service
// worker's userScripts channel (needs the "Allow User Scripts" toggle), except
// for the ubiquitous document.body.innerText/innerHTML snippet which the popup
// serves via chrome.scripting without the toggle.
var chrome = {
    runtime: { lastError: undefined },
    tabs: {
        query: function(q, cb) { chromeProxy('tabs.query', [q]).then(cb || function() {}); },
        create: function(props, cb) { chromeProxy('tabs.create', [props]).then(cb || function() {}); },
        update: function(id, props, cb) {
            if (typeof id === 'object') { cb = props; props = id; id = null; }
            chromeProxy('tabs.update', id == null ? [props] : [id, props]).then(cb || function() {});
        },
        executeScript: function(a, b, c) { // (tabId, details, cb) or (details, cb)
            var tabId = null, details, cb;
            if (typeof a === 'number') { tabId = a; details = b; cb = c; }
            else { details = a; cb = b; }
            chromeProxy('tabs.executeScript', [tabId, details])
                .then(function(r) { if (cb) cb(r); })
                .catch(function(e) {
                    console.error('tabs.executeScript (shim) failed:', e.message);
                    sendToPopup({ type: 'set-tip', html: '<span style="color:red">' + e.message + '</span>' });
                    if (cb) cb(undefined);
                });
        },
    },
    extension: {
        // legacy: identify-movies etc. — returns the inert backgroundWindow stub
        getBackgroundPage: function() { return CmdUtils.backgroundWindow; },
        getViews: function() { return []; },
    },
};

// ── Message handler ───────────────────────────────────────────────────────────

window.addEventListener('message', function(event) {
    // Only accept messages from the parent popup
    if (event.source !== parent) return;
    var msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'eval': {
            // Evaluate custom user scripts
            var code = msg.code || '';
            var registered = Object.keys(sandboxCommands);
            try {
                eval(code); // eslint-disable-line no-eval
                var newCmds = Object.keys(sandboxCommands).filter(n => registered.indexOf(n) === -1);
                sendToPopup({ type: 'eval-ok', commands: newCmds });
            } catch (e) {
                sendToPopup({ type: 'eval-error', message: e.message, stack: e.stack });
            }
            break;
        }

        case 'unload-custom': {
            sandboxCommands = {};
            break;
        }

        case 'preview': {
            var cmd = sandboxCommands[msg.name];
            if (!cmd) break;
            if (msg.selectedText !== undefined) CmdUtils.selectedText = msg.selectedText;
            if (msg.activeTab !== undefined) CmdUtils.active_tab = msg.activeTab;
            if (msg.clipboardText !== undefined) CmdUtils._clipboardText = msg.clipboardText;

            pblockEl.innerHTML = '';
            var runPreview = function() {
                try {
                    var previewFn = cmd.preview;
                    if (typeof previewFn === 'string') {
                        sendToPopup({ type: 'pblock-update', html: previewFn });
                    } else if (typeof previewFn === 'function') {
                        var previewResult = (previewFn.bind(cmd))(pblockEl, msg.args || { text: '' });
                        if (previewResult && typeof previewResult.then === 'function') {
                            previewResult.catch(function(e) {
                                console.error('sandbox async preview error', e);
                                sendToPopup({ type: 'preview-error', name: msg.name, message: e.message });
                            });
                        }
                    }
                } catch (e) {
                    console.error('sandbox preview error', e);
                    sendToPopup({ type: 'preview-error', name: msg.name, message: e.message });
                }
            };
            CmdUtils.loadScripts(cmd.require, function() { CmdUtils.loadScripts(cmd.requirePopup, runPreview); });
            break;
        }

        case 'execute': {
            var cmd = sandboxCommands[msg.name];
            if (!cmd) break;
            if (msg.selectedText !== undefined) CmdUtils.selectedText = msg.selectedText;
            if (msg.activeTab !== undefined) CmdUtils.active_tab = msg.activeTab;
            if (msg.clipboardText !== undefined) CmdUtils._clipboardText = msg.clipboardText;
            var runExecute = function() {
                try {
                    var execArgs = msg.args || { text: '' };
                    execArgs.pblock = pblockEl; // popup dispatch passes pblock in args too
                    var execResult = (cmd.execute.bind(cmd))(execArgs);
                    if (execResult && typeof execResult.then === 'function') {
                        execResult.catch(function(e) {
                            console.error('sandbox async execute error', e);
                            sendToPopup({ type: 'preview-error', name: msg.name, message: e.message });
                        });
                    }
                } catch (e) {
                    console.error('sandbox execute error', e);
                }
            };
            CmdUtils.loadScripts(cmd.require, function() { CmdUtils.loadScripts(cmd.requirePopup, runExecute); });
            break;
        }

        case 'chrome-result': {
            var pending = pendingCallbacks[msg.id];
            if (pending) {
                delete pendingCallbacks[msg.id];
                if (msg.error) {
                    pending.reject(new Error(msg.error));
                } else {
                    pending.resolve(msg.result);
                }
            }
            break;
        }
    }
});

// jQuery plugins from cmdutils.js — needed by custom commands running in sandbox

jQuery.fn.blankify = function() { return this.find('a').attr('target', '_blank'); };

jQuery.fn.absolutize = function(origin) {
    if (!origin) origin = '';
    return this.each(function(i, e) {
        var $e = jQuery(e);
        var href = $e.attr('href');
        if (href && !href.match(/^https?:\/\//) && !href.match(/^javascript:/)) {
            $e.attr('href', href.startsWith('/') ? origin.replace(/\/$/, '') + href : origin + href);
        }
        if (e.tagName === 'IMG') {
            var src = $e.attr('src');
            if (src && !src.match(/^https?:\/\//)) {
                $e.attr('src', src.startsWith('/') ? origin.replace(/\/$/, '') + src : origin + src);
            }
        }
    });
};

// jQuery plugin: loadAbs — fetches URL via popup proxy, extracts selector, puts in element
// Supports jQuery .load() syntax: $(el).loadAbs("url selector", callback)
jQuery.fn.loadAbs = function(urlAndSelector, complete) {
    var el = this;
    var m = urlAndSelector.match(/^(\S+)\s+(.+)$/);
    var url = m ? m[1] : urlAndSelector.trim();
    var selector = m ? m[2].trim() : null;

    chromeProxy('fetch', [url]).then(function(html) {
        console.log('loadAbs fetched', url, 'len:', html ? html.length : 0, 'selector:', selector);
        var $doc = jQuery('<div>').html(html);
        var $content = selector ? $doc.find(selector) : $doc.children();
        console.log('loadAbs selector matched:', $content.length, 'elements');

        // Fix relative URLs
        var base = url.replace(/^(https?:\/\/[^/]+).*/, '$1');
        $content.find('a[href]').each(function() {
            var h = jQuery(this).attr('href') || '';
            if (!h.match(/^https?:\/\//) && !h.match(/^javascript:/)) {
                jQuery(this).attr('href', h.startsWith('/') ? base + h : base + '/' + h);
            }
            jQuery(this).attr('target', '_blank');
        });
        $content.find('img[src]').each(function() {
            var s = jQuery(this).attr('src') || '';
            if (!s.match(/^https?:\/\//)) jQuery(this).attr('src', s.startsWith('/') ? base + s : base + '/' + s);
        });

        el.empty().append($content);
        if (complete) complete.call(el[0]);
    }).catch(function(e) {
        console.error('loadAbs error:', e);
    });
    return this;
};

// Route ALL jQuery ajax through the popup XHR proxy — the sandbox has a null
// origin, so any direct XHR/fetch from custom commands is blocked by CORS.
// (CmdUtils.get/ajaxGet/loadAbs already proxy explicitly; this covers custom
// commands calling $.ajax / $.get / $().load directly.)
jQuery.ajaxTransport("+*", function(options, originalOptions, jqXHR) {
    return {
        send: function(headers, complete) {
            // for GET jQuery has already appended processed data to options.url
            var data = options.data != null ? options.data : null;
            chromeProxy('fetch', [{
                url: options.url,
                method: (options.type || 'GET').toUpperCase(),
                data: data,
                headers: headers,
                raw: true
            }]).then(function(r) {
                complete(r.status, r.statusText, { text: r.responseText }, r.headers);
            }).catch(function(e) {
                complete(0, e && e.message || 'proxy error', { text: '' }, '');
            });
        },
        abort: function() {}
    };
});

// Signal that sandbox is ready
sendToPopup({ type: 'sandbox-ready' });
console.log('UbiChr sandbox ready');
