console.log("hello from UbiChr background script");

// setup selection event sink
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (CmdUtils.DEBUG) {
        console.log("got message: ", request.message, request.data, request.event );
        //CmdUtils.notify(request.data, request.message+" / "+request.event );
    }
    switch(request.message)
    {
        case 'selection':
            CmdUtils.selectedText = request.data || "";
        break;

        default:
            sendResponse({data: 'Invalid arguments'});
        break;
    }
});

chrome.tabs.onUpdated.addListener( function(tabId, changeInfo, tab) {
    chrome.tabs.getSelected(null, function(tab) {
        if (tab.url.match('^https?://')) {
            if (CmdUtils.DEBUG) console.log("onUpdated", tab.url);  
            CmdUtils.active_tab = tab;
            CmdUtils.updateSelection();
        }
    });
})

chrome.tabs.onActivated.addListener(function(tabId, changeInfo, tab) {
    chrome.tabs.getSelected(null, function(tab) {
        if (tab.url.match('^https?://')){
            if (CmdUtils.DEBUG) console.log("onActivated", tab.url);  
            CmdUtils.active_tab = tab;
            CmdUtils.updateSelection();
        }
    });
});
