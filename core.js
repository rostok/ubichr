// common script for UI pages that initializes global objects

var backgroundPage = chrome.extension.getBackgroundPage();
var Utils = backgroundPage.Utils;
var CmdUtils = backgroundPage.CmdUtils;

var active_tab = {};
chrome.tabs.query({active:true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function(tab) { if (typeof tab !== 'undefined') active_tab = tab[0]; });
