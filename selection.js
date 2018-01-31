// this will send message to background and set CmdUtils.selectedText
var sendSel = function(event) {
    chrome.runtime.sendMessage({
        message:"selection", 
        data: window.getSelection().toString(), 
        event: event.type
    },function(response){})
};

// document.addEventListener('mouseup', sendSel);
// document.addEventListener('mousedown', sendSel);
// document.addEventListener('select', sendSel);
// document.addEventListener('selectstart', sendSel);
document.addEventListener('selectionchange', sendSel); // works in chrome
