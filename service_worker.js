// UbiChr MV3 Service Worker
// Replaces the persistent background page from MV2.
// State shared with popup via chrome.storage.session.

console.log("UbiChr service worker started");

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.message) {
        case 'selection':
            // Store selected text from content script (selection.js)
            chrome.storage.session.set({ selectedText: request.data || "" });
            break;

        case 'setBadge':
            // Popup routes badge updates here since service worker owns action API
            chrome.action.setBadgeBackgroundColor({ color: request.color || '#77c' });
            chrome.action.setBadgeText({ text: request.text || '' });
            if (request.text) {
                setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1000);
            }
            break;

        case 'createTabAndInject': {
            const { url, inp, val, sub, frm, del, enc } = request;
            chrome.tabs.create({ url }, function(tab) {
                function onUpdated(tabId, changeInfo) {
                    if (tabId !== tab.id || changeInfo.status !== 'complete') return;
                    chrome.tabs.onUpdated.removeListener(onUpdated);
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: function(inp, val, sub, frm, del) {
                            // Poll until key element appears (Angular SPA may not be ready at readyState=complete).
                            // Returns a Promise so endcode can be sequenced after these actions.
                            return new Promise(function(resolve) {
                                var deadline = Date.now() + 10000;
                                function tryRun() {
                                    if (inp && !document.querySelector(inp)) {
                                        if (Date.now() < deadline) { setTimeout(tryRun, 150); return; }
                                    }
                                    setTimeout(function() {
                                        try {
                                            if (inp) {
                                                var el = document.querySelector(inp);
                                                if (el) {
                                                    el.value = val;
                                                    el.dispatchEvent(new Event('change', { bubbles: true }));
                                                }
                                            }
                                            if (sub) document.querySelectorAll(sub).forEach(function(el) { el.click(); });
                                            if (frm) document.querySelectorAll(frm).forEach(function(el) { el.submit(); });
                                        } catch(e) {
                                            console.error('createTabAndInject failed:', e);
                                        }
                                        resolve();
                                    }, del || 0);
                                }
                                tryRun();
                            });
                        },
                        args: [inp || '', val !== undefined ? val : null, sub || '', frm || '', del || 0]
                    }).then(function() {
                        if (!enc) return;
                        // eval() is blocked in MV3 content scripts (isolated world inherits
                        // extension CSP) — arbitrary endcode strings must go through userScripts
                        try {
                            chrome.userScripts.execute({
                                target: { tabId: tab.id },
                                js: [{ code: enc }],
                                injectImmediately: true
                            }).catch(function(e) { console.error('endcode failed:', e); });
                        } catch (e) {
                            console.error('endcode needs the userScripts API:', e);
                            chrome.notifications.create({
                                type: 'basic',
                                iconUrl: 'res/icon-128.png',
                                title: 'UbiChr',
                                message: 'Enable "Allow User Scripts" for UbiChr in chrome://extensions to run this command.'
                            });
                        }
                    }).catch(function(e) { console.error('executeScript failed:', e); });
                }
                chrome.tabs.onUpdated.addListener(onUpdated);
            });
            return true;
        }

        case 'executeCode': {
            // MV2-compat: run an arbitrary code string in a tab and return the result.
            // eval is banned in MV3 content scripts, so this goes through the
            // userScripts API (USER_SCRIPT world; needs the "Allow User Scripts" toggle).
            const { tabId, code } = request;
            try {
                chrome.userScripts.execute({
                    target: { tabId: tabId },
                    js: [{ code: code }],
                    injectImmediately: true
                }).then(function(results) {
                    sendResponse({ results: (results || []).map(r => r.result) });
                }).catch(function(e) { sendResponse({ error: e.message }); });
            } catch (e) {
                sendResponse({ error: 'userScripts API unavailable — enable "Allow User Scripts" for UbiChr in chrome://extensions (' + e.message + ')' });
            }
            return true;
        }

        default:
            sendResponse({ data: 'Invalid arguments' });
            break;
    }
    return true;
});

// Update active tab info in session storage when tabs change
function updateActiveTab() {
    if (chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (!tabs || !tabs[0]) return;
            var tab = tabs[0];
            if (tab.url && tab.url.match('^https?://')) {
                chrome.storage.session.set({ active_tab: tab });
                // Get selected text from the tab
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => window.getSelection ? window.getSelection().toString() : ''
                }, function(results) {
                    if (chrome.runtime.lastError) return;
                    var text = (results && results[0] && results[0].result) || '';
                    chrome.storage.session.set({ selectedText: text });
                });
            } else {
                chrome.storage.session.set({ active_tab: null });
            }
        });
    }
}

// re-applies permanent highlights set by the 'mark' command (popup dies with its
// update handlers, so the service worker owns cross-navigation highlighting)
function reapplyMarkHighlights(tabId) {
    chrome.storage.session.get('markHighlights', function(result) {
        var words = (result.markHighlights || '').trim();
        if (!words) return;
        console.log('reapplying mark highlights on tab', tabId, ':', words);
        chrome.scripting.executeScript({ target: { tabId: tabId }, files: ['lib/mark.min.js'] }, function() {
            if (chrome.runtime.lastError) { console.error('mark.js injection failed:', chrome.runtime.lastError.message); return; }
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: function(words) {
                    var m = new Mark(document.body);
                    m.unmark({ done: function() { m.mark(words); } });
                },
                args: [words.split(/\s+/)]
            }, function() {
                if (chrome.runtime.lastError) console.error('mark call failed:', chrome.runtime.lastError.message);
            });
        });
    });
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    updateActiveTab();
    if (changeInfo.status === 'complete' && tab.url && tab.url.match('^https?://'))
        reapplyMarkHighlights(tabId);
    return true;
});

chrome.tabs.onActivated.addListener(function(actInfo) {
    updateActiveTab();
    // MV2 parity: updateActiveTab handlers (mark) also ran on tab activation
    chrome.tabs.get(actInfo.tabId, function(tab) {
        if (chrome.runtime.lastError) return;
        if (tab && tab.url && tab.url.match('^https?://') && tab.status === 'complete')
            reapplyMarkHighlights(actInfo.tabId);
    });
    return true;
});

chrome.tabs.onHighlighted.addListener(function(higInfo) {
    updateActiveTab();
    return true;
});

// storage.session is cleared on browser restart and tab events may not have fired
// yet when the popup first opens — populate active_tab/selectedText on SW startup
updateActiveTab();

// Suppresses the native HTTP Basic/Digest auth dialog for UbiChr's own background
// fetches (details.tabId === -1 — not tied to any real browser tab, i.e. requests
// made via the sandbox's fetch proxy). Real tab navigations keep the normal native
// prompt. The suppress/allow decision (and any custom handling) is delegated to
// whichever command is currently running, via the popup — see cmd.onAuth in README.
chrome.webRequest.onAuthRequired.addListener(
    function(details, asyncCallback) {
        if (details.tabId !== -1) { asyncCallback({}); return; } // real tab — default browser behavior
        chrome.runtime.sendMessage({ message: 'authRequired', url: details.url }, function(resp) {
            asyncCallback(!chrome.runtime.lastError && resp && resp.allow ? {} : { cancel: true });
        });
    },
    { urls: ["<all_urls>"] },
    ["asyncBlocking"]
);
