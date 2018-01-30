// this will send message to background and set CmdUtils.selectedText
var sendSel = function(event) {
    var sel = window.getSelection().toString();
    chrome.extension.sendRequest({'message':'selection','data': sel, 'event': event.type },function(response){})
};

//document.addEventListener('mouseup', sendSel);
//document.addEventListener('mousedown', sendSel);
//document.addEventListener('select', sendSel);
//document.addEventListener('selectstart', sendSel);
document.addEventListener('selectionchange', sendSel); // works in chrome
