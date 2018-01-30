console.log("hello from background script");

// setup selection event sink
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    switch(request.message)
    {
        case 'selection':
        	// console.log("got sel", request.event, request.data);
            CmdUtils.selectedText = request.data;
        break;

        default:
            sendResponse({data: 'Invalid arguments'});
        break;
    }
});