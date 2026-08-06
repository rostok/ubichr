// Sandbox bridge — shared sandbox protocol handler for pages without popup.js
// Requires: cmdutils.js (CmdUtils), jquery

function ubiq_create_sandbox_stub(info) {
    var name = info.name;
    return {
        name: name,
        names: info.names || [name],
        icon: info.icon || '',
        description: info.description || '',
        help: info.help || '',
        external: info.external || false,
        builtIn: false,
        test: info.test,
        preview: function(pblock, args) {
            var sf = document.getElementById('sandbox-frame');
            if (!sf) return;
            sf.contentWindow.postMessage({
                type: 'preview', name: name,
                args: { text: args.text || '', _opt_idx: args._opt_idx, _opt_val: args._opt_val, _selection: args._selection },
                selectedText: CmdUtils.selectedText, activeTab: CmdUtils.active_tab,
                clipboardText: CmdUtils._clipboardText
            }, '*');
        },
        execute: function(args) {
            var sf = document.getElementById('sandbox-frame');
            if (!sf) return;
            sf.contentWindow.postMessage({
                type: 'execute', name: name,
                args: { text: args.text || '', _opt_idx: args._opt_idx, _opt_val: args._opt_val, _selection: args._selection },
                selectedText: CmdUtils.selectedText, activeTab: CmdUtils.active_tab,
                clipboardText: CmdUtils.getClipboard()
            }, '*');
        }
    };
}

function ubiq_handle_chrome_call(msg) {
    var sf = document.getElementById('sandbox-frame');
    function sendResult(result, error) {
        if (sf) sf.contentWindow.postMessage({
            type: 'chrome-result', id: msg.id,
            result: result, error: error || null
        }, '*');
    }
    switch (msg.method) {
        case 'createTab':
            CmdUtils.createTab(msg.args[0], function(tab) { sendResult(tab); });
            break;
        case 'tabs.create':
            chrome.tabs.create.apply(chrome.tabs, msg.args.concat([function(tab) {
                sendResult(tab, chrome.runtime.lastError && chrome.runtime.lastError.message);
            }]));
            break;
        case 'tabs.update':
            chrome.tabs.update.apply(chrome.tabs, msg.args.concat([function(tab) { sendResult(tab); }]));
            break;
        case 'tabs.query':
            chrome.tabs.query(msg.args[0] || {}, function(tabs) { sendResult(tabs); });
            break;
        case 'tabs.executeScript': {
            // MV2-compat path — see popup.js for the full story
            var xTabId = msg.args[0];
            var details = msg.args[1] || {};
            if (xTabId == null) xTabId = CmdUtils.active_tab && CmdUtils.active_tab.id;
            if (!xTabId) { sendResult(null, 'No target tab'); break; }
            var code = details.code || '';
            var known = code.match(/^\s*document\.body\.inner(Text|HTML)(?:\.toString\(\))?\s*;?\s*$/);
            if (known) {
                chrome.scripting.executeScript({
                    target: { tabId: xTabId },
                    func: function(kind) { return document.body['inner' + kind]; },
                    args: [known[1]]
                }, function(results) {
                    if (chrome.runtime.lastError) { sendResult(null, chrome.runtime.lastError.message); return; }
                    sendResult((results || []).map(function(r) { return r.result; }));
                });
            } else {
                chrome.runtime.sendMessage({ message: 'executeCode', tabId: xTabId, code: code }, function(resp) {
                    if (chrome.runtime.lastError) { sendResult(null, chrome.runtime.lastError.message); return; }
                    if (resp && resp.error) { sendResult(null, resp.error); return; }
                    sendResult(resp && resp.results);
                });
            }
            break;
        }
        case 'notifications.create':
            chrome.notifications.create(msg.args[0], msg.args[1], function(id) { sendResult(id); });
            break;
        case 'fetch': {
            // string url (legacy) or {url, method, data, headers, raw} — see popup.js
            var req = msg.args[0];
            if (typeof req === 'string') req = { url: req };
            fetch(req.url, {
                method: req.method || 'GET',
                headers: req.headers || {},
                body: req.data != null ? req.data : undefined,
                credentials: req.credentials || 'include'
            })
                .then(function(r) { return r.text().then(function(t) { return { r: r, t: t }; }); })
                .then(function(o) {
                    if (req.raw) sendResult({ status: o.r.status, statusText: o.r.statusText, responseText: o.t, headers: '' });
                    else sendResult(o.t);
                })
                .catch(function(e) { sendResult(null, e.message); });
            break;
        }
        case 'scripting.setSelection':
            CmdUtils.setSelection(msg.args[0]);
            sendResult(true);
            break;
        default:
            sendResult(null, 'Unknown method: ' + msg.method);
    }
}

window.addEventListener('message', function(e) {
    var sf = document.getElementById('sandbox-frame');
    if (!sf || e.source !== sf.contentWindow) return;
    var msg = e.data;
    if (!msg || !msg.type) return;
    switch (msg.type) {
        case 'sandbox-ready':
            CmdUtils.sandboxFrame = sf;
            CmdUtils.loadCustomScripts();
            break;
        case 'set-cmd-prop': {
            var cmd = CmdUtils.getcmd(msg.name);
            if (cmd) cmd[msg.prop] = msg.value;
            break;
        }
        case 'register-command':
            CmdUtils.CommandList = CmdUtils.CommandList.filter(function(c) { return c.name !== msg.name; });
            CmdUtils.CommandList.push(ubiq_create_sandbox_stub(msg));
            break;
        case 'chrome-call':
            ubiq_handle_chrome_call(msg);
            break;
        case 'set-clipboard':
            CmdUtils.setClipboard(msg.text);
            break;
        case 'eval-ok':
            window.dispatchEvent(new CustomEvent('sandbox-eval-ok'));
            break;
        case 'eval-error':
            console.warn('Custom script error:', msg.message);
            window.dispatchEvent(new CustomEvent('sandbox-eval-ok')); // refresh even on error
            break;
    }
});
