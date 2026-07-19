// this will send message to background and set CmdUtils.selectedText
var sendSel = function(event) {
    // no response callback — the service worker never replies to 'selection'
    // and a dangling callback logs "message port closed" on every page
    if (chrome && chrome.runtime) chrome.runtime.sendMessage({
        message:"selection",
        data: window.getSelection().toString(),
        event: event.type
    })
};

// document.addEventListener('mouseup', sendSel);
// document.addEventListener('mousedown', sendSel);
// document.addEventListener('select', sendSel);
// document.addEventListener('selectstart', sendSel);
document.addEventListener('selectionchange', sendSel); // works in chrome
