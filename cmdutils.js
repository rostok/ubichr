// CmdUtils
// jshint esversion: 8

if (!CmdUtils) var CmdUtils = { 
    VERSION: typeof chrome !== 'undefined' && typeof chrome.runtime!== 'undefined' ? chrome.runtime.getManifest().version : "N/A",
    DEBUG: false,
    CommandList: [],
    expandOnExecute: false, // for user to decide if partial command should be expanded, as this may prevent easy cycling through other similar commands after execution 
    history: [],        // array of cmdline strings, first element is the most recent (like stack)
    jQuery: jQuery,
    backgroundWindow: window,
    popupWindow: null,
    lastKeyEvent:null,
    lastError:"",       // used for storing last exception
    loadLastInput:true, // for testing purposes if set to false this will disable preview of last command as this may result with ajax race condition for preview element content loading
    log: console.log,
    updateHandlers: [], // array of {name,handler} objects, handler functions are executed on CmdUtils.updateActiveTab(), +/- addUpdateHandler() removeUpdateHandler()
    active_tab: null,   // tab that is currently active, updated via background.js 
    selectedText: "",   // currently selected text, update via content script selection.js
    selectedHTML: "",   // currently selected text, update via content script selection.js
    setPreview: function setPreview(message, prepend) { console.log(message); }, // warning setPreview shortcut may refer to different preview div when multiple popups are open
    setResult: function setResult(message, prepend) { console.log(message); },
    setTip: function setTip(message, prepend) { console.log(message); },
};

// normal log, should popup everywhere
CmdUtils.log = function (...args) {
    if (CmdUtils.backgroundWindow) CmdUtils.backgroundWindow.console.log.apply(CmdUtils.backgroundWindow.console, args);
    if (CmdUtils.popupWindow) CmdUtils.popupWindow.console.log.apply(CmdUtils.popupWindow.console, args);
    console.log.apply(console, args);
};
CmdUtils.error = function (...args) {
    if (CmdUtils.backgroundWindow) CmdUtils.backgroundWindow.console.error.apply(CmdUtils.backgroundWindow.console, args);
    if (CmdUtils.popupWindow) CmdUtils.popupWindow.console.error.apply(CmdUtils.popupWindow.console, args);
    console.error.apply(console, args);
};
CmdUtils.trace = function (...args) {
    if (CmdUtils.backgroundWindow) CmdUtils.backgroundWindow.console.trace.apply(CmdUtils.backgroundWindow.console, args);
    if (CmdUtils.popupWindow) CmdUtils.popupWindow.console.trace.apply(CmdUtils.popupWindow.console, args);
    console.trace.apply(console, args);
};
  
  // debug log
CmdUtils.deblog = function (...args) {
    if(CmdUtils.DEBUG) {
        if (CmdUtils.backgroundWindow) CmdUtils.backgroundWindow.console.log.apply(CmdUtils.backgroundWindow.console, args)
        if (CmdUtils.popupWindow) CmdUtils.popupWindow.console.log.apply(CmdUtils.popupWindow.console, args)
        console.log.apply(console, args);
    }
};

// executed after popup is opened, used for testing 
CmdUtils.onPopup = function () {};

// sets chrome extension badge
CmdUtils.setBadge = function(text='OK', color='#77c') {
  chrome.browserAction.setBadgeBackgroundColor({color:color});
  setTimeout(function(){
    chrome.browserAction.setBadgeText({'text':text});
    setTimeout(function(){
      chrome.browserAction.setBadgeText({'text':''});
    }, 1000);
  }, 0);
};

// creates command and adds it to command array, name or names must be provided and preview execute functions, cs is command structure object
CmdUtils.CreateCommand = function CreateCommand(cs) {
    if (Array.isArray(cs.name)) {
        cs.names = cs.name;
        cs.name = cs.name[0];
    } else {
        cs.name = cs.name || cs.names[0];
        cs.names = cs.names || [cs.name];
    }
    if (CmdUtils.getcmd(cs.name)) {
        // remove previously defined command with this name
        CmdUtils.CommandList = CmdUtils.CommandList.filter( c => c.name !== cs.name );
    }
    if (typeof cs.test === 'object' && typeof cs.test.name === 'undefined') cs.test.name = cs.name; // if test is included name can be skipped

    // insert blank preview/execute functions if none provided
    if (typeof cs.execute != 'function') cs.execute = function (args) {};
    // if (typeof cs.preview != 'function') cs.preview = function (pblock, args) {}; // preview can be function, string or undefined
    
    var to = parseFloat(cs.timeout || 0);
    if (to>0) {
        if (typeof cs.preview == 'function') {
            cs.preview_timeout = cs.preview;
            cs.preview = function(b,a) {
                clearTimeout(cs.lastPrevTimeoutID); // keep lastPrevTimeoutID in cmd_struct instead of global var
                cs.lastPrevTimeoutID = setTimeout(function () { 
                    (cs.preview_timeout.bind(this))(b, a); 
                }, to);
            };
        }
        if (typeof cs.execute == 'function') {
            cs.execute_timeout = cs.execute;
            cs.execute = function(a) {
                clearTimeout(cs.lastExecTimeoutID); // keep lastExecTimeoutID in cmd_struct instead of global var
                cs.lastExecTimeoutID = setTimeout(function () {
                    (cs.execute_timeout.bind(this))(a);
                }, to);
            };
        }
    }
    CmdUtils.CommandList.push(cs);
};

// creates a simple search command using url
// returns Command object with predefined execute and preview functions
// predefined functions are always avaiable as execute_org and preview_org
// in case args is provided with user defined execute/preview the predefined
// functions will not overwrite them, and can be accessed via execute_org
// the provided argument should include url property that defines target url
// in the url {QUERY} and {text} will be replaced with command arguments (encoded)
// also {location} will be replaced with current tab address
CmdUtils.makeSearchCommand = function makeSearchCommand(args) {
    args.execute_org = function(a) {
        var url = args.url || "";
        url = url.replace(/\{text\}|\{QUERY\}/g, encodeURIComponent(a.text));
        url = url.replace(/\{location\}/g, encodeURIComponent(CmdUtils.getLocation()));
        CmdUtils.addTab(url);
    }
    args.preview_org = CmdUtils._searchCommandPreview;
    if (args.prevAttrs == null) {
        args.prevAttrs = {zoom: 0.85};
    }
    if ((typeof args.preview != 'function') && args.preview != 'none') args.preview = args.preview_org;
    if ((typeof args.execute != 'function')) args.execute = args.execute_org;
    CmdUtils.CreateCommand(args);
};

// helper to avoid stealing focus in preview
CmdUtils._restoreFocusToInput = function(event) {
    var wnd = event.currentTarget || event.view;
    var doc;
    if (!wnd.closed && !((doc = wnd.document).hidden || doc.webkitHidden || doc.mozHidden || doc.msHidden)) {
        wnd.setTimeout( function() {
            wnd.document.getElementById('ubiq_input').focus();
        }, 0);
        var self = wnd._ubiq_recent_cmd;
        // may be scrolled by set of focus - so restore it now:
        if (self.prevAttrs.scroll) {
            var scrollOffs = self.prevAttrs.scroll;
            wnd.setTimeout( function() {
                var pblock = wnd.document.getElementById('ubiq-preview-div');
                if (pblock) {
                    pblock.scrollLeft = scrollOffs[0];
                    pblock.scrollTop = scrollOffs[1];
                }
            }, 0);
        }
        wnd.setTimeout(function() {
            wnd.removeEventListener("blur", CmdUtils._restoreFocusToInput, { capture: true });
        }, 150);
    } else {
        wnd.removeEventListener("blur", CmdUtils._restoreFocusToInput, { capture: true });
    }
};

CmdUtils._afterLoadPreview = function(ifrm) {
    var doc = ifrm.ownerDocument;
    var wnd = doc.defaultView || doc.parentWindow;
    wnd.focus();
    // jump to anchor (try multiple one by one):
    if (this.prevAttrs.anchor != null) {
      var url = ifrm.src;
      for (var ha of this.prevAttrs.anchor) {
        ifrm.src = url.replace(/(?:\#[^#]+)?$/, '#' + ha);
      }
    }
    // restore focus:
    wnd.focus();
    wnd.removeEventListener("blur", CmdUtils._restoreFocusToInput, { capture: true });
}

// default common preview for search commands
CmdUtils._searchCommandPreview = function _searchCommandPreview( pblock, {text: text} ) {
    var q = text;
    var code = (this.description || "Search") + " for <b> '" + (q || "...") + "'</b>";
    pblock.innerHTML = code;
    if (q == null || q == '') {
      return;
    }
    if (!this.prevAttrs) this.prevAttrs = {};
    var url = (this.prevAttrs.url || this.url || "").replace(/\{text\}|\{QUERY\}/g, encodeURIComponent(q));
    // hash-anchor:
    var hashanch = null;
    if (this.prevAttrs.anchor != null) {
      var hashanch = this.prevAttrs.anchor;
      if (!Array.isArray(hashanch)) {
        hashanch = this.prevAttrs.anchor = [hashanch];
      }
      url += '#'+hashanch[0];
    }
    var zoom = this.prevAttrs.zoom || 0.85;
    var doc = pblock.ownerDocument;
    var wnd = doc.defaultView || doc.parentWindow;
    if (wnd._ubi_prevTO != null) {
      wnd.clearTimeout(wnd._ubi_prevTO);
      wnd._ubi_prevTO = null;
    }
    var to = 300;
    var self = this;
    // show it:
    wnd._ubi_prevTO = wnd.setTimeout(function () {
      // avoid stealing focus (and re-scroll):
      wnd.removeEventListener("blur", CmdUtils._restoreFocusToInput, { capture: true });
      wnd.addEventListener("blur", CmdUtils._restoreFocusToInput, { capture: true });
      wnd._ubiq_recent_cmd = self;
      // parent block in order to handle scroll ("cross origin" issue) and to provide zoom
      pblock.innerHTML = 
    '<div id="ubiq-preview-div" style="--zoom:'+ zoom +'">'+ code +'</div>';
      pblock = pblock.lastChild;
      // scrollTo in frame cross origin not allowed in some browsers - scroll later inside parent div:
      var scrollOffs = [0, 0];
      if (self.prevAttrs.scroll) {
        scrollOffs = self.prevAttrs.scroll;
      }
      pblock.innerHTML =
     '<iframe id="ubiq-preview-frm"' +
       ' sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"' +
       ' style="--scrollX:'+ scrollOffs[0] +'px; --scrollY:'+ scrollOffs[1] +'px; background-color:'+self.prevAttrs.backgroundColor+'; "'+
       ' src="' + url + '"/>';
      var ifrm = pblock.lastChild;
      ifrm.onload = function() { 
        (CmdUtils._afterLoadPreview.bind(self))(pblock.lastChild); 
      };
      // zoom overflow dirty fix
      CmdUtils.popupWindow.jQuery("#ubiq-command-preview").css("overflow", "hidden"); 
      if (scrollOffs[0] || scrollOffs[1]) {
        wnd.setTimeout(function() {
          pblock.scrollLeft = scrollOffs[0];
          pblock.scrollTop = scrollOffs[1];
        }, 10);
      }
    }, to);
}

// closes current tab
CmdUtils.closeTab = function closeTab() {
    chrome.tabs.query({active:true,currentWindow:true},function(tabs){
        if (tabs && tabs[0]) 
            chrome.tabs.remove(tabs[0].id, function() { });
        else 
            console.error("closeTab failed because 'tabs' is not set");
    });
};

// returns active tabs URL if avaiable
CmdUtils.getLocation = function getLocation() {
    if (CmdUtils.active_tab && CmdUtils.active_tab.url) 
        return CmdUtils.active_tab.url;
    else 
        return ""; 
};

// returns url origin or if empty an active tabs origin URL, if avaiable
CmdUtils.getLocationOrigin = function getLocationOrigin(url="") {
    if (url=="" && CmdUtils.active_tab && CmdUtils.active_tab.url) url = CmdUtils.active_tab.url;
    try {
        var u = new URL(url);
        return u.origin;
    } catch (e) {
        return "";
    }
};

// opens new tab with provided url
CmdUtils.addTab = function addTab(url, active=true) {
    if (CmdUtils.lastKeyEvent && CmdUtils.lastKeyEvent.shiftKey) active = false;

    if (typeof browser !== 'undefined') {
        browser.tabs.create({ "url": url, "active": active });
    } else 
    if (typeof chrome !== 'undefined' && typeof chrome.tabs !== 'undefined') {
        chrome.tabs.create({ "url": url, "active": active });
    } else {
        window.open(url);
    }
};

// this helper wraps chrome.tabs.create() function however properties object 
// can have additional and optional keys set:
//  input - DOM element with input selector...
//  value - ...will be assigned value, and bubbled change event dispatched
//  submit - then DOM element with submit selector will be clicked 
//  form - then DOM element with form selector will be submitted
//  delay
//  complete - if set to true the all values and bubble events will be 
//             executed when document.readystate == "complete"
//  initcode - executed immediately, before complete event
//  begincode - before timeout, after complete event
//  endcode - after form is submitted
// 
// use this to immediately fill in and submit form after delay (default is 0ms)
// selectors should be strings for document.querySelector() query
//
// finally callback is called after tab is created
CmdUtils.createTab = (props, callback=undefined) => {
    callback = callback || (()=>{});
    var cb = callback;
    var inp = props.input || "";  delete props.input;
    var val = props.value; delete props.value;
    var sub = props.submit || ""; delete props.submit;
    var frm = props.form || ""; delete props.form;
    var inc = props.initcode || ""; delete props.initcode;
    var bgc = props.begincode || ""; delete props.begincode;
    var enc = props.endcode || ""; delete props.endcode;
    var del = parseInt(props.delay) || 0;  delete props.delay;
    var cmp = props.complete; delete props.complete;
    if ( (inp != "" && val !== undefined) || sub != "" ) cb = (tab) => {
      var code = `
      ${bgc}
      try {
        window.setTimeout(()=>{
          console.log("CmdUtils.createTab() starts i:${inp} v:${val} s:${sub} d:${del} ");
          if ("${inp}"!="") {
            var i = document.querySelector("${inp}");
            i.value = ${JSON.stringify(val)};
            i.dispatchEvent(new Event('change', { 'bubbles': true }))
          }
          if ("${sub}"!="") document.querySelectorAll("${sub}").forEach(i=>i.click()); 
          if ("${frm}"!="") document.querySelectorAll("${frm}").forEach(i=>i.submit()); 
          ${enc}
          console.log("CmdUtils.createTab() ends");
        },${del});
      } 
      catch(e) {
        console.error("CmdUtils.createTab() failed", e);
      }`;
      if (props.complete) {
              code = `function start() { ${code} }
              document.onreadystatechange = ()=>{ if (document.readyState == "complete") start() };
              document.onreadystatechange();`;
      }
      code = `${inc}${code}`;
      CmdUtils.log(tab);
      chrome.tabs.executeScript(tab.id, {code:code}, (ret)=>{
        // script was injected, nothing to do here
      });
      callback(tab);
    };
    chrome.tabs.create(props, cb);
};
  
// opens new tab with post request and provided data
CmdUtils.postNewTab = function postNewTab(url, data) {
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", url);
    form.setAttribute("target", "_blank");

    if (typeof data === 'string') data = Utils.urlToParams(data);
    for (var i in data) {
        if (data.hasOwnProperty(i)) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = i;
            input.value = data[i];
            form.appendChild(input);
        }
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
}

// returns a function that opens new tab with substituted {text}/{QUERY} and {location}
// in case data-option-value attribute is link and _opt_val is passed function will open that url istead
CmdUtils.SimpleUrlBasedCommand = function SimpleUrlBasedCommand(url) {
    if (!url) return;
    var search_func = function(directObj) {
        if (!directObj) return;

        var opt = directObj._opt_val || "";
        if(opt.includes("://")) {
            CmdUtils.addTab(opt);
        }
        else {
            var text = directObj.text;
            text = encodeURIComponent(text);
            var finalurl = url;
            finalurl = finalurl.replace(/\{text}|\{QUERY\}/g, text);
            finalurl = finalurl.replace(/\{location\}/g, CmdUtils.getLocation());
            CmdUtils.addTab(finalurl);
        }
    };
    return search_func;
};

// hackish refresh preview; as alternative command can call this.preview(args.pblock, args);
CmdUtils.refreshPreview = ()=>{
    if (CmdUtils.popupWindow) {
        CmdUtils.popupWindow.lcmd="";
        CmdUtils.popupWindow.ubiq_show_matching_commands();
    }
};

// closes ubiquity popup
CmdUtils.closePopup = function closePopup(w) {
    if (typeof popupWindow !== 'undefined') popupWindow.close();
};

// gets json with xhr
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

// gets page with xhr
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

// performs jQuery get and returns jqXHR that implements Promise 
CmdUtils.get = function get(url, success) {
    var o = {
        url: url,
        async: true
    };
    if (typeof success === 'function') o.success = success;
    return jQuery.ajax(o);
};

// performs jQuery post and return jsXHR
CmdUtils.post = function post(url, data) {
    return jQuery.ajax({
        url: url,
        data: data,
        async: true
    });
};

// loads remote scripts into specified window (or backround if not specified)
CmdUtils.loadScripts = function loadScripts(url, callback, wnd=window) {
    wnd.loadedScripts = wnd.loadedScripts || []; // this array will hold all loaded scripts into this window
    url = url || [];
    if (url.constructor === String) url = [url];

    if (typeof wnd.jQuery === 'undefined') {
        console.error("there's no jQuery at "+wnd+".");
        return false;
    }
    if (url.length == 0) return callback();
        
    CmdUtils.log("loadingScripts >>> ", url.join(), wnd.loadedScripts.join());

    url = url.filter(script => !wnd.loadedScripts.includes(script));

    wnd.jQuery.when.apply(wnd.jQuery, wnd.jQuery.map(url, (u) => {
        return wnd.jQuery.getScript(u);
    })).done(() => { // All scripts have finished loading
        wnd.loadedScripts = [...new Set([...wnd.loadedScripts ,...url])];
        return callback();
    }).fail((jqxhr, settings, exception) => {
        CmdUtils.error("failed loading scripts",urls.join(),exception);
    });
};


// updates selectedText variable
CmdUtils.updateSelection = function (tab_id) {
    chrome.tabs.executeScript( tab_id, { code: "window ? window.getSelection().toString() : '';" }, function(selection) {
        if (selection && selection.length>0) CmdUtils.selectedText = selection[0] || "";
        CmdUtils.deblog("selectedText is ", CmdUtils.selectedText);  
    });
};

// adds named handler function to CmdUtils.updateHandlers array, handler must be a function
CmdUtils.addUpdateHandler = function (name, handler) {
    name ||= "";
    if (name==""||typeof handler !== 'function') return;
    CmdUtils.updateHandlers = CmdUtils.updateHandlers.filter(h=>h.name!=name);
    CmdUtils.updateHandlers.push( {name:name, handler:handler});
    CmdUtils.deblog("update handler",name,"added");
};

// removes named handler from CmdUtils.updateHandlers array
CmdUtils.removeUpdateHandler = function (name) {
    if (name === undefined) return CmdUtils.updateHandlers = [];
    CmdUtils.updateHandlers = CmdUtils.updateHandlers.filter(v=>v.name!=name);
    CmdUtils.deblog("update handler",name,"removed");
};

// called when tab is switched or changed, updates selectedText and activeTab
CmdUtils.updateActiveTab = function () {
    CmdUtils.active_tab = null;
    CmdUtils.selectedText = '';
    // chrome.tabs.getSelected is deprecated since Chrome 38. Please use tabs.query {active: true}.
    if (chrome.tabs && chrome.tabs.query)
    chrome.tabs.query({active:true, currentWindow:true}, function(tab) {
        tab = tab[0];
        if (tab.url.match('^https?://')) {
            CmdUtils.active_tab = tab;
            CmdUtils.updateSelection(tab.id);
        }
        CmdUtils.updateHandlers.forEach(v=>v.handler());
    });
};

// replaces current selection with string provided
CmdUtils.setSelection = function setSelection(s) {
    console.log("CmdUtils.setSelection"+s)
    if (typeof s!=='string') s = s+'';
    s = s.replace(/(['"])/g, "\\$1");
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
    replaceSelectedText("${s}");`;
    if (CmdUtils.active_tab && CmdUtils.active_tab.id)
        return chrome.tabs.executeScript( CmdUtils.active_tab.id, { code: insertCode } );
    else 
        return chrome.tabs.executeScript( { code: insertCode } );
};

// for measuring time the input is changed
CmdUtils.inputUpdateTime = performance.now();
CmdUtils.timeSinceInputUpdate = function timeSinceInputUpdate() {
    return (performance.now() - CmdUtils.inputUpdateTime)*0.001;
};

// returns command with this name
CmdUtils.getcmd = function getcmd(cmdname) {
    for (var c in CmdUtils.CommandList) 
        if (CmdUtils.CommandList[c].name == cmdname || CmdUtils.CommandList[c].names.indexOf(cmdname)>-1) return CmdUtils.CommandList[c];
    return null;
};

// returns command that name starts with arg
CmdUtils.getcmdpart = function getcmdpart(cmdname) {
    if (cmdname == null || cmdname == '') return null;

    cmdname = cmdname.trim().toLowerCase()

    for (let [ci,c] of Object.entries(CmdUtils.CommandList)) for (let n of c.names) if (n.toLowerCase()==cmdname) return c;

    for (let [ci,c] of Object.entries(CmdUtils.CommandList)) for (let n of c.names) if (n.toLowerCase().startsWith(cmdname)) return c;

    return null;
};

// execute shortcut
CmdUtils.execute = function execute(command, args) {
    var c = CmdUtils.getcmdpart(command);
    if (c == null) return null;
    if (typeof args === 'undefined') args = {text:''};
    if (typeof args === 'string') args = {text:args};
    args._selection = args.text==CmdUtils.selectedText;
    args._opt_idx = -1;
    args._opt_val = '';
    args._cmd = c;
    return (c.execute.bind(c))(args);
};

// preview shortcut, first param may be string in that case default pblock is used
CmdUtils.preview = function preview(command, pblock, args) {
    var c = CmdUtils.getcmdpart(command);
    if (c == null) return null;
    if (typeof pblock === 'string' && typeof args === 'undefined') { args = pblock; pblock = CmdUtils.popupWindow.ubiq_preview_el(); }
    if (typeof args === 'undefined') args = {text:''};
    if (typeof args === 'string') args = {text:args};
    args._selection = args.text==CmdUtils.selectedText;
    args._opt_idx = -1;
    args._opt_val = '';
    args._cmd = c;
    return (c.preview.bind(c))(pblock,args);
};

// sets clipboard
CmdUtils.setClipboard = function setClipboard (t) {
    var input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = t;
    input.focus();
    input.select();
    document.execCommand('Copy');
    input.remove();
};

// gets clipboard
CmdUtils.getClipboard = function getClipboard () {
    var input = document.createElement('textarea');
    document.body.appendChild(input);
    input.focus();
    input.select();
    document.execCommand('paste');
    var r = input.value;
    input.remove();
    return r || "";
};

// sets clipboard
CmdUtils.setClipboardHTML = function setClipboard (t) {
    var input = document.createElement('div');
    document.body.appendChild(input);
    input.contentEditable = true;
    var range = document.createRange();
    range.selectNode(input);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    input.innerHTML = t;
    input.focus();
    input.select();
    document.execCommand('Copy');
    input.remove();
};

CmdUtils.setClipboardHTML = async function setClipboardHTML(htmlContent) {
    // Create a temporary content-editable element to hold the HTML
    const tempEl = document.createElement('div');
    tempEl.contentEditable = 'true';
    tempEl.style.position = 'absolute';
    tempEl.style.left = '-9999px'; // Hide the element off-screen

    document.body.appendChild(tempEl);
    tempEl.innerHTML = htmlContent; // Insert the HTML content to copy
    tempEl.unselectable = "off";
    tempEl.focus();

    // Select the content
    document.getSelection().selectAllChildren(tempEl);

    // Use the Clipboard API to write the selected content as text
    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
    } catch (err) {
        console.error('Failed to copy', err);
    }

    // Clean up
    document.body.removeChild(tempEl);
};

// Usage example:
// CmdUtils.setClipboardHTML('<p style="color: red;">This is some text!</p>');

// gets clipboard as HTML https://stackoverflow.com/a/43375402/2451546
CmdUtils.getClipboardHTML = function getClipboard () {
    var input = document.createElement('div');
    document.body.appendChild(input);
    input.contentEditable = true;
    var range = document.createRange();
    range.selectNode(input);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    input.focus();    
    document.execCommand("Paste");
    var r = input.innerHTML;
    input.remove();
    return r || "";
};

CmdUtils.unloadCustomScripts = function unloadCustomScripts() {
    CmdUtils.CommandList = CmdUtils.CommandList.filter((c)=>{
        return c['builtIn']==true;
    });
    
}

CmdUtils.loadCustomScripts = function loadCustomScripts() {
    CmdUtils.unloadCustomScripts();
    // mark built-int commands
    CmdUtils.CommandList.forEach((c)=>{c['builtIn']=true;});

    if (typeof chrome === 'undefined' || typeof chrome.storage === 'undefined') return;
    try {
        // load custom scripts
        chrome.storage.local.get('customscripts', function(result) {
            try {
                eval(result.customscripts || "");
            } catch (e) {
                console.error("custom scripts eval failed", e);
            }
        });
    } catch (e) {
        console.error("load custom scripts from chrome.storage failed", e);
    }
};

// injcects script from url
CmdUtils.inject = function inject(url, oninject) {
    chrome.tabs.executeScript({
        code:"((e,s)=>{e.src=s;e.onload=function(){console.log('script injected')};document.head.appendChild(e);})(document.createElement('script'),'"+url+"')"
        }, oninject
    );
};

// show browser notification with simple limiter 
CmdUtils.lastNotification = "";
CmdUtils.notify = function (message, title) {
    if (CmdUtils.lastNotification == title+"/"+message) return;
    chrome.notifications.create({
        "type": "basic",
        "iconUrl": chrome.extension.getURL("res/icon-128.png"),
        "title": title || "UbiChr",
        "message": message
    });
    CmdUtils.lastNotification = title+"/"+message;
};

// saves cmdline to history buffer and stores it 
// history commands, or command same as the first in history are not saved
CmdUtils.saveToHistory = function (cmdline) {
    if (cmdline.trim().startsWith("hist")) return;
    if (CmdUtils.history.length>0 && CmdUtils.history[0]==cmdline) return;
    if (cmdline.trim()!="") CmdUtils.history.unshift( cmdline );
    if (CmdUtils.history.length > 64) CmdUtils.history.length = 64; // keep the cap
    if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.set({'history': CmdUtils.history});
};

// saves preview cmdline to history buffer and stores it 
// in case this is the same command than last it is only updated
// preview commands are saved with couple of seconds delay (see popup.js::ubiq_show_preview())
// history commands are not saved
CmdUtils.saveToHistoryPreview = function (cmdline) {
    if (cmdline.trim().startsWith("hist")) return;
    if (CmdUtils.history.length>1) {
        var curr = cmdline.split(' ')[0];
        var last = CmdUtils.history[0].split(' ')[0];
        if(curr==last) CmdUtils.history.shift();
    }
    CmdUtils.saveToHistory(cmdline);
}

// load history
CmdUtils.loadHistory = function () {
    if (typeof chrome === 'undefined' || typeof chrome.storage === 'undefined') return;
    try {
        chrome.storage.local.get('history', function(result) { 
            CmdUtils.history = result.history; 
            if(!Array.isArray(CmdUtils.history)) CmdUtils.history = [];
        });
    } catch (e) {
        console.error("history load failed", e);
    }
};

// dumps command definition along with all functions, by partial name
CmdUtils.dump = (cmd) => {
    var c = CmdUtils.getcmdpart(cmd);
    if (c==null) return "";
    var r = "// UbiChr '"+c.name+"' command\n";
    r += "CmdUtils.CreateCommand({\n";
    r += Object.entries(c).map(([k,v])=> "\t"+k+":"+(typeof v==='function' ? unescape(v.toString()) : JSON.stringify(v))).join(",\n");
    r += "\n});\n";
    return r;
};


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - JQUERY EXTRA FUNCTIONS  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// changes anchors target to _blank
(function ( $ ) {
    $.fn.blankify_old = function( url ) {
        return this.find("a").not('[href^="http"],[href^="//:"],[href^="mailto:"],[href^="#"]').each(function() {
            $(this).attr("target", "_blank").attr('href', function(index, value) {
                if (value.substr(0,1) !== "/") value = "/"+value;
                return url + value;
            });
        });
    };
}( jQuery ));

(function ( $ ) {
    $.fn.blankify = function( url ) { return this.find("a").attr("target", "_blank"); };
}( jQuery ));

// returns domain/hostname from url
// https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
function url_domain(data) {
    var    a      = document.createElement('a');
           a.href = data;
    return a.hostname;
}

CmdUtils.url_domain = url_domain;

// loads absolute urls
(function ( $ ) {
    $.fn.loadAbs = function( url, complete ) {
        var result = this;
        return this.load(url, function() {
            url = "https://"+url_domain( url );
            result.find("a")
                    .attr("target", "_blank")
                    .not('[href^="http"],[href^="//:"],[href^="mailto:"],[href^="#"],[href^="//"]')
                    .attr('href', function(index, value) {
                if (typeof value === 'undefined') return url;
                if (value.substr(0,1) !== "/") value = "/" + value;
                return url + value;
            });
            result.find("img")
                    .not('[src^="http"],[src^="//:"],[src^="mailto:"],[src^="#"],[src^="//"]')
                    .attr('src', function(index, value) {
                if (typeof value === 'undefined') return url;
                if (value.substr(0,1) !== "/") value = "/" + value;
                return url + value;
            });
            if (typeof complete === 'function') complete();
        });
    };
}( jQuery ));

// changes src and href attributes in jQuery resultset with absolute urls
(function ( $ ) {
    $.fn.absolutize = function(origin) { 
        if (typeof origin === 'undefined' || origin == '') origin = window.origin;
        return this.each((i,e)=>{ 
                                 $(e).attr('href', origin+$(e).prop('pathname')+$(e).prop('search')); 
                                 if (e.tagName=="IMG") {
                                     try {
                                         var u = new URL(e.src);
                                         $(e).attr('src',  origin+u.pathname); 
                                     } catch (e) { }
                                 }
                                });        
    };
}( jQuery ));

// changes src and href attributes in jQuery resultset with absoulute urls, the old version
(function ( $ ) {
    $.fn.absolutizeOld = function( url ) {
        if (typeof url === 'undefined' || url == '') url = window.location;
        var others = this.find('[href^="http"],[href^="//:"],[href^="mailto:"],[href^="#"],[href!=""][href],[href^="//"]') 
                         .add('[src^="http"],[src^="//:"],[src^="mailto:"],[src^="#"],[src!=""][src],[src^="//"]');
        var anchors = this.not('[href^="http"],[href^="//:"],[href^="mailto:"],[href^="#"],[href^="//"]')
                    .attr('href', function(index, value) {
                        if (typeof value === 'undefined') return url;
                        if (value.substr(0,1) !== "/" && url.substr(-1) !== "/") value = "/" + value;
                        return url + value;
                    });
        var images = this.not('[src^="http"],[src^="//:"],[src^="mailto:"],[src^="#"],[src^="//"]')
                    .attr('src', function(index, value) {
                        if (typeof value === 'undefined') return url;
                        if (value.substr(0,1) !== "/" && url.substr(-1) !== "/") value = "/" + value;
                        return url + value;
                    });
        return others.add(anchors).add(images);
    };
}( jQuery ));

// neat function by mike https://stackoverflow.com/questions/2346011/how-do-i-scroll-to-an-element-within-an-overflowed-div
(function ( $ ) {
    $.fn.scrollTo = function(elem, speed) {
        var $this = jQuery(this);
        var $this_top = $this.offset().top;
        var $this_bottom = $this_top + $this.height();
        var $elem = jQuery(elem);
        var $elem_top = $elem.offset().top;
        var $elem_bottom = $elem_top + $elem.height();
    
        if ($elem_top > $this_top && $elem_bottom < $this_bottom) {
            // in view so don't do anything
            return;
        }
        var new_scroll_top;
        if ($elem_top < $this_top) {
            new_scroll_top = {scrollTop: $this.scrollTop() - $this_top + $elem_top};
        } else {
            new_scroll_top = {scrollTop: $elem_bottom - $this_bottom + $this.scrollTop()};
        }
        $this.animate(new_scroll_top, speed === undefined ? 100 : speed);
        return this;
    };
}( jQuery ));

// https://stackoverflow.com/posts/37285344
(function ( $ ) {
    $.fn.inView = function(container, element) {
        //Determine container top and bottom
        let cTop = container.scrollTop;
        let cBottom = cTop + container.clientHeight;
        //Determine element top and bottom
        let eTop = element.offsetTop;
        let eBottom = eTop + element.clientHeight;
        //Check if out of view
        return (eTop > cTop || eBottom < cBottom)
    };
}( jQuery ));

// https://stackoverflow.com/posts/37285344
(function ( $ ) {
    $.fn.ensureInView = function(container, element) {
        //Determine container top and bottom
        let cTop = container.scrollTop;
        let cBottom = cTop + container.clientHeight;
        //Determine element top and bottom
        let eTop = element.offsetTop;
        let eBottom = eTop + element.clientHeight;
        //Check if out of view
        if (eTop < cTop) { container.scrollTop -= (cTop - eTop); }
        else if (eBottom > cBottom) { container.scrollTop += (eBottom - cBottom); }
    };
}( jQuery ));

// https://stackoverflow.com/a/40658647/2451546
(function ( $ ) {
    $.fn.inViewport = function() {
        var elementTop = $(this).offset().top;
        var elementBottom = elementTop + $(this).outerHeight();

        var viewportTop = $(window).scrollTop();
        var viewportBottom = viewportTop + $(window).height();

        return elementBottom > viewportTop && elementTop < viewportBottom;
    };
}( jQuery ));
