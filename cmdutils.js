// CmdUtils
// jshint esversion: 6 


var active_document = document;
var active_window = window;
var active_tab = {};

chrome.tabs.query({active:true, windowId: chrome.windows.WINDOW_ID_CURRENT}, function(tab) { if (typeof tab !== 'undefined') active_tab = tab[0]; });


if (!CmdUtils) var CmdUtils = { 
    __globalObject: this,
    jQuery: jQuery,
    ubiq_set_preview_func: function ubiq_set_preview_func(message, prepend) { console.log(message); },
    ubiq_set_result_func: function ubiq_set_result_func(message, prepend) { console.log(message); }
};
CmdUtils.VERSION = 0.01;
CmdUtils.CommandList = [];
CmdUtils.CreateCommand = function CreateCommand(args) {
    args.name = args.name || args.names[0];
    args.names = args.names || [args.name];
    if (CmdUtils.getcmd(args.name)) {
        // remove previously defined command with this name
        CmdUtils.CommandList = CmdUtils.CommandList.filter( cmd => cmd.name !== args.name );
    }
    //console.log("command created ", args.name);
    var to = parseFloat(args.timeout);
    if (to>0) {
    	args.timeoutFunc = null;
    	if (typeof args.preview == 'function') {
		    args.preview_timeout = args.preview;
			args.preview = function(b,a) {
                if (args.timeoutFunc !== null) {
                    clearTimeout(args.timeoutFunc);
                }
                args.timeoutFunc = setTimeout(function () { 
                	args.preview_timeout(b, a); 
                }, to);
			};
    	}
    	if (typeof args.execute == 'function') {
		    args.execute_timeout = args.execute;
			args.execute = function(a) {
                if (args.timeoutFunc !== null) {
                    clearTimeout(args.timeoutFunc);
                }
                args.timeoutFunc = setTimeout(function () {
					args.execute_timeout(a);
                }, to);
			};
    	}
    }
    CmdUtils.CommandList.push(args);
};
CmdUtils.closeTab = function closeTab() {
	chrome.tabs.query({active:true,currentWindow:true},function(tabs){
        if (tabs && tabs[0]) 
            chrome.tabs.remove(tabs[0].id, function() { });
        else 
            console.error("closeTab failed because 'tabs' is not set");
	});
};
CmdUtils.getDocument = function getDocument() {
    return active_document;
};
CmdUtils.getLocation = function getLocation() {
    if (active_tab.url) 
        return active_tab.url;
    else 
        return CmdUtils.getDocument().location; //this is wrong TODO: Fix
};
CmdUtils.getWindow = function getWindow() {
    return active_window;
};
CmdUtils.addTab = function addTab(url) {
	if (typeof browser !== 'undefined') {
		browser.tabs.create({ "url": url });
	} else 
	if (typeof chrome !== 'undefined') {
		chrome.tabs.create({ "url": url });
	} else {
		window.open(url);
	}
};

// 2nd order function
CmdUtils.SimpleUrlBasedCommand = function SimpleUrlBasedCommand(url) {
    if (!url) return;
    var search_func = function(directObj) {
        if (!directObj) return;
        var text = directObj.text;
        text = encodeURIComponent(text);
        var finalurl = url;
        finalurl = finalurl.replace('{text}', text);
        finalurl = finalurl.replace('{location}', CmdUtils.getLocation());
        Utils.openUrlInBrowser(finalurl);
    };
    return search_func;
};
CmdUtils.closePopup = function closePopup(w) {
    window.close();
};
CmdUtils.ajaxGetJSON = function ajaxGetJSON(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var resp = JSON.parse(xhr.responseText);
            callback(resp, xhr);
        }
    };
    xhr.send();
};
CmdUtils.ajaxGet = function ajaxGet(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            callback(xhr.responseText, xhr);
        }
    };
    xhr.send();
};
CmdUtils.get = function get(url) {
	return jQuery.ajax({
    	url: url,
        async: true
	});
};
CmdUtils.post = function post(url, data) {
	return jQuery.ajax({
    	url: url,
    	data: data,
        async: true
	});
};
// loads remote scripts
CmdUtils.loadedScripts = [];
CmdUtils.loadScripts = function loadScripts(url, callback) {
	url = url || [];
	if (url.constructor === String) url = [url];

	if (url.length == 0) 
		return callback();

	var thisurl = url.shift();
	tempfunc = function(data, textStatus, jqXHR) {
		return loadScripts(url, callback);
	};
	if (CmdUtils.loadedScripts.indexOf(thisurl)==-1) {
		console.log("loading :::: ", thisurl);
		CmdUtils.loadedScripts.push(thisurl);
    	jQuery.ajax({
            url: thisurl,
            dataType: 'script',
            success: tempfunc,
            async: true
        });
    }
    else {
    	tempfunc();
    }
};

CmdUtils.setSelection = function setSelection(s) {
    if (typeof s!=='string') s = s+'';
    s = s.replace('"', '\"');
    // http://jsfiddle.net/b3Fk5/2/
    var insertCode = `
    function replaceSelectedText(replacementText) {
        var sel, range;
        if (window.getSelection) {
            sel = window.getSelection();
            var activeElement = document.activeElement;
            if (activeElement.nodeName == "TEXTAREA" ||
                (activeElement.nodeName == "INPUT" && activeElement.type.toLowerCase() == "text")) {
                    var val = activeElement.value, start = activeElement.selectionStart, end = activeElement.selectionEnd;
                    activeElement.value = val.slice(0, start) + replacementText + val.slice(end);
                //alert("in text area");
            } else {
                if (sel.rangeCount) {
                    range = sel.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(replacementText));
                } else {
                    sel.deleteFromDocument();
                }
            }
        } else if (document.selection && document.selection.createRange) {
            range = document.selection.createRange();
            range.text = replacementText;
        }
    }
    replaceSelectedText("`+s+`");`;
    return chrome.tabs.executeScript( { code: insertCode } );
};

CmdUtils.getSelection = function getSelection(callback) {
    return chrome.tabs.executeScript( { code: "window.getSelection() ? window.getSelection().toString() : '';" }, callback(selection) );
};

CmdUtils.getSelection2 = function getSelection2( callback ) {
    return chrome.tabs.query({active:true, windowId: chrome.windows.WINDOW_ID_CURRENT}, 
        function(tab) {
          chrome.tabs.sendMessage(tab[0].id, {method: "getSelection"}, callback(response) );
        });
};

// for measuring time the input is changed
CmdUtils.inputUpdateTime = performance.now();
CmdUtils.timeSinceInputUpdate = function timeSinceInputUpdate() {
	return (performance.now() - CmdUtils.inputUpdateTime)*0.001;
};

CmdUtils.setPreview = function setPreview(m, prepend) {
    this.ubiq_set_preview_func(m, prepend);
};

CmdUtils.setResult = function setResult(m, prepend) {
    this.ubiq_set_result_func(m, prepend);
};

CmdUtils.getcmd = function getcmd(cmdname) {
    for (var c in CmdUtils.CommandList) 
        if (CmdUtils.CommandList[c].name == cmdname) return CmdUtils.CommandList[c];
    return null;
};
CmdUtils.unloadCustomScripts = function unloadCustomScripts() {
    this.CommandList = this.CommandList.filter((c)=>{
        return c['builtIn']==true;
    });
    
}
CmdUtils.loadCustomScripts = function loadCustomScripts() {
    //this.unloadCustomScripts();
    // mark built-int commands
    this.CommandList.forEach((c)=>{c['builtIn']=true;});

    // load custom scripts
    chrome.storage.local.get('customscripts', function(result) {
    	try {
    		eval(result.customscripts || "");
    	} catch (e) {
    		console.error("custom scripts eval failed", e);
    	}
    });
};
