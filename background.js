console.log("hello from UbiChr background script");

// setup selection event sink
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    //console.log("got message: ", request.message, request.data, request.event );
    //CmdUtils.notify(request.data, request.message+" / "+request.event );
    switch(request.message)
    {
        case 'selection':
            CmdUtils.selectedText = request.data;
        break;

        default:
            sendResponse({data: 'Invalid arguments'});
        break;
    }
});