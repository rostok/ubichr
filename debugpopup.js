$('iframe#sandbox-frame').siblings('iframe[src="options.html"]').remove();
$("<iframe src=options.html>")
.appendTo("html")
.css({right:0,top:0,width:1124,position:"absolute",height:"100%"})
.parent()
.css("overflow-y","hidden");

// DevTools helper: access popup's live CmdUtils from console
window.popupCmdUtils = function() {
    var views = chrome.extension.getViews({type: 'popup'});
    if (views.length) return views[0].CmdUtils;
    var tab = chrome.extension.getViews({type: 'tab'}).find(w => w.location.pathname.endsWith('/popup.html'));
    return tab ? tab.CmdUtils : null;
};
