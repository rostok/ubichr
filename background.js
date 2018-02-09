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
    if (CmdUtils.DEBUG) if (tab) console.log("onUpdated", tab.url);  
    CmdUtils.updateActiveTab();  
})

chrome.tabs.onActivated.addListener(function(actInfo) {
    if (CmdUtils.DEBUG) console.log("onActivated", actInfo);
    CmdUtils.updateActiveTab();  
});

chrome.tabs.onHighlighted.addListener( function(higInfo) {
    if (CmdUtils.DEBUG) console.log("onHighlighted", higInfo);  
    CmdUtils.updateActiveTab();  
})

