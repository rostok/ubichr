// common script for UI pages that initializes global objects

var backgroundPage;
switch(window.location.protocol) {
   case 'http:':
   case 'https:':
   case 'file:':	// for local file debugging
   					backgroundPage = window;
   					var head = document.getElementsByTagName("head")[0];
					var s;
					["utils.js","cmdutils.js","commands.js"].forEach(v=>{
    					s = document.createElement("script");
    					s.type = "text/javascript";
    					s.src = v;
    					head.appendChild(s);
					});
     				break;

   case 'chrome-extension:':
   default: 
     				backgroundPage = chrome.extension.getBackgroundPage();
}

//var backgroundPage = chrome.extension.getBackgroundPage();
var Utils = backgroundPage.Utils;
var CmdUtils = backgroundPage.CmdUtils;
