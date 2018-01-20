//
// Ubiquity for Chrome
// http://github.com/cosimo/ubiquity-chrome/
// -------------------------------------------
//
// A (very limited) attempt to rewrite Firefox's Ubiquity extension
// for Google Chrome using Greasemonkey-like UserJS.
//
// Original Ubiquity Project: http://labs.mozilla.org/ubiquity/
// My Ubiquity for Opera port: http://github.com/cosimo/ubiquity-opera/
//
// Have fun!
//
// ----------------------------------------------
// Cosimo Streppone, <cosimo@cpan.org>
// First Chrome version: 06/09/2010
// ----------------------------------------------
//

// -----------------------------------------------
//
//       Firefox Ubiquity emulation layer
//
// -----------------------------------------------

//
// CmdUtils
//

var active_document = document; // initially this is popup
var active_window = window; // initially this is popup

if (CmdUtils == undefined) var CmdUtils = { 
    __globalObject: this,
    jQuery: jQuery,
};
noun_arb_text = 1;
CmdUtils.VERSION = 0.01;
CmdUtils.CommandList = [];
CmdUtils.CreateCommand = function CreateCommand(args) {
    var cmd_name = args.name;
    var cmd_list = CmdUtils.CommandList;
    if (cmd_name in cmd_list) {
        return;
    }
    CmdUtils.CommandList.push(args);
};
CmdUtils.closeWindow = function closeWindow() {
    CmdUtils.saveLastCommand();
    CmdUtils.getWindow().close();
};
CmdUtils.getDocument = function getDocument() {
    return active_document;
};
CmdUtils.getLocation = function getLocation() {
    return CmdUtils.getDocument().location;
};
CmdUtils.getWindow = function getWindow() {
    return active_window;
};
CmdUtils.openWindow = function openWindow(url, name) {
    if (!name) {
        window.open(url);
    } else {
        window.open(url, name);
    }
};
// 2nd order function
CmdUtils.SimpleUrlBasedCommand = function SimpleUrlBasedCommand(url) {
    if (!url) return;
    var search_func = function(directObj) {
        if (!directObj) return;
        ubiq_set_results(url);
        var text = directObj.text;
        text = encodeURIComponent(text);
        url = url.replace('{text}', text);
        url = url.replace('{location}', CmdUtils.getLocation());
        Utils.openUrlInBrowser(url);
        //CmdUtils.toggleUbiquityWindow();
    };
    return search_func;
};
CmdUtils.saveLastCommand = function saveLastCommand(extra) {
    extra = extra || "";
    if (chrome.storage) chrome.storage.local.set({ 'lastCmd':ubiq_command() });
};
CmdUtils.toggleUbiquityWindow = function toggleUbiquityWindow(w) {
    if (!w) w = ubiq_window;
    var vis = w.style.visibility;
    if (vis == 'visible') {
        CmdUtils.saveLastCommand();
        window.close();
    }
    return;
};

//
// Utils
//
if (Utils == undefined) var Utils = {};
Utils.openUrlInBrowser = function(url) {
    window.open(url);
};

//
// Application
//
if (Application == undefined) var Application = {
    activeWindow: {
        activeTab: window
    }
};

var ubiq_window;
var ubiq_selection;
var ubiq_element;
var ubiq_remote_server = 'res'; //http://people.opera.com/cosimo/ubiquity';
var ubiq_selected_command;
var ubiq_first_match;

// Used to get css url of images and other resources
function ubiq_url_for(path) {
    var url = 'url(';
    url += ubiq_remote_server;
    url += '/';
    url += path;
    url += ')';
    return url;
}

// Used to get css url of images and other resources
function ubiq_url(path) {
    var url = '';
    url += ubiq_remote_server;
    url += '/';
    url += path;
    return url;
}

function ubiq_create_window() {
    return;
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    //////////////////////////////////////
    var doc = window.document;
    var wnd = document.createElement('div');
    var stl = wnd.style;
    wnd.setAttribute('id', 'ubiq_window');
    stl.position = 'fixed';
    stl.left = '1px';
    stl.top = '1px';
    stl.visibility = 'hidden';
    stl.width = '810px';
    stl.height = '561px';
    stl.border = '0';
    stl.padding = '0';
    // Our window should appear on top of everything 
    stl.zIndex = '99999';
    stl.background = ubiq_url_for('ubiq_background.png');
    wnd.innerHTML = ubiq_start_mode();
    doc.body.appendChild(wnd);
    return wnd;
}

function ubiq_start_mode() {
    var input_style =
        'width:760px; border:0; padding:0; height:32px; margin-top:16px;' +
        'margin-left:10px; background:none; color:black;' +
        'font-family: Trebuchet MS, Arial, Helvetica; font-size: 28px;';
    var div_style = 'border:0; display:block; float:left; margin:0;';
    var results_panel_style = div_style +
        'clear:both; text-align: left; padding-top:2px; font-size: 19px; ' +
        'font-weight: normal; color:white; height: 502px;';

    var html =
        '<div id="ubiq-input-panel" style="' + div_style + ';width:99%;height:55px">' +
        '<form id="ubiq1" onsubmit="return false">' +
        '<input autocomplete="off" id="ubiq_input" style="' + input_style + '" type="text" size="60" maxlength="500">' +
        '</form>' +
        '</div>' +
        '<br/>' +
        '<div id="ubiq-results-panel" style="width:100%;' + results_panel_style + '">' +
        ubiq_help() +
        '</div>' +
        '<div id="ubiq-command-tip" style="position:absolute;left:310px;top:65px;display:block;border:0;color:#ddd;font-family:Helvetica,Arial;font-style:italic;font-size:11pt"></div>' +
        '<div id="ubiq-command-preview" style="position:absolute;left:310px;top:85px;display:block;overflow:auto;border:0;color:#ddd;"></div>';
    return html;
}

function ubiq_set_results(v) {
    var el = document.getElementById('ubiq-results-panel');
    if (!el) return;
    el.innerHTML = v + "<hr/>" + el.innerHTML;
}

function ubiq_show_preview(cmd) {
    var el = document.getElementById('ubiq-command-preview');
    if (!el) return;
    if (!cmd) {
        el.innerHTML = '';
        return;
    }
    preview_func = CmdUtils.CommandList[cmd]['preview'];
    if (typeof preview_func == 'string') {
        el.innerHTML = preview_func;
    } else {

        var words = ubiq_command().split(' ');
        var cmd = words[0];
    
        var text;
        if (ubiq_selection) {
            text = ubiq_selection;
        } else {
            words.shift();
            text = words.join(' ');
        }
            
        var directObj = {
            text: text,
        };
        preview_func(el, directObj);
    }
    return;
}

//  ubiq_xml_http(url, function(ajax){
//      if (! ajax) return;
//      var text=ajax.responseText;
//      if (! text) return;
//      var preview_block=document.getElementById('ubiq-command-preview');
//      if (! preview_block) return;
//      preview_block.innerHTML=text;
//  });

function ubiq_show_tip(tip) {
    var el = document.getElementById('ubiq-command-tip');
    if (!el) return;
    if (!tip) {
        el.innerHTML = '';
        return;
    }
    tip = CmdUtils.CommandList[tip]['description'];
    el.innerHTML = tip;
    return;
}

function ubiq_execute() {
    var cmd = ubiq_command();
    if (!cmd) return false;
    ubiq_dispatch_command(cmd);
    return false;
}

function ubiq_dispatch_command(line) {
    var words = line.split(' ');
    var cmd = words[0];

    var text;
    if (ubiq_selection) {
        text = ubiq_selection;
    } else {
        words.shift();
        text = words.join(' ');
    }

    // Expand match (typing 'go' will expand to 'google')
    cmd = ubiq_match_first_command(cmd);
    ubiq_replace_first_word(cmd);

    // Find command element
    var cmd_struct;
    for (var c in CmdUtils.CommandList) {
        var cmd_name = CmdUtils.CommandList[c]['name'];
        if (cmd_name == cmd) {
            cmd_struct = CmdUtils.CommandList[c];
            break;
        }
    }

    if (!cmd_struct) {
        return;
    }

    // Create a fake Ubiquity-like object, to pass to
    // command's "execute" function
    var cmd_func = cmd_struct['execute'];
    var direct_obj = { "text": text };

    // Run command's "execute" function
    cmd_func(direct_obj);

    return;
}

function ubiq_display_results(text) {
    var div = document.getElementById('ubiq-results-panel');
    if (!div) alert('no div!');
    div.innerHTML = text;
    div.style.visibility = 'show';
}

function ubiq_help() {
    var style = 'font-size:17px; padding:8px; font-weight:normal';
    var html = '<p style="' + style + '">Type the name of a command and press enter to execute it, or <b>help</b> for assistance.</p>';
    html += "<p>commands loaded:<BR>"
    for (var c in CmdUtils.CommandList) {
        html += CmdUtils.CommandList[c]['name']+", ";
    }
    return html;
}

function ubiq_get_selection() {
    var str = '';
    //if (document.getSelection) {
    //    str = document.getSelection();
    //}
    if (document.selection && document.selection.createRange) {
        var range = document.selection.createRange();
        str = range.text;
    }
    return (ubiq_selection = str);
}

function ubiq_toggle_window(w) {
    CmdUtils.toggleUbiquityWindow(w);
    //if (!w) w = ubiq_window;
    //var vis = w.style.visibility;
    //vis = (vis=='hidden') ? 'visible' : 'hidden';
    //w.style.visibility=vis;
    //return;
}

function ubiq_focus() {
    line = 'ubiq_input';
    el = document.getElementById(line);
    if (el.createTextRange) {
        var oRange = el.createTextRange();
        oRange.moveStart("character", 0);
        oRange.moveEnd("character", el.value.length);
        oRange.select();
    } else if (el.setSelectionRange) {
        el.setSelectionRange(0, el.value.length);
    }
    el.focus();
}

function ubiq_enabled() {
    var wnd = ubiq_window;
    if (!wnd) return;
    var vis = wnd.style.visibility;
    if (vis == 'hidden') return false;
    return true;
}

function ubiq_command() {
    var cmd = document.getElementById('ubiq_input');
    if (!cmd) {
        ubiq_selected_command = -1;
        return '';
    }
    return cmd.value;
}

// Gets current selection element
function ubiq_get_current_element() {
    var el;
    if (document.selection && document.selection.createRange) {
        var range = document.selection.createRange();
        el = range.parentElement();
    }
    return (ubiq_element = el);
}

function ubiq_match_first_command(text) {
    if (!text) text = ubiq_command();
    var first_match = '';

    // Command selected through cursor UP/DOWN
    if (ubiq_first_match) {
        return ubiq_first_match;
    }

    if (text.length > 0) {
        for (var c in CmdUtils.CommandList) {
            c = CmdUtils.CommandList[c]['name'];
            if (c.match('^' + text)) {
                first_match = c;
                break;
            }
        }
    }
    return first_match;
}

function ubiq_command_icon(c) {
    var icon = CmdUtils.CommandList[c]['icon'];
    if (!icon) {
        icon = ubiq_url('spacer.png');
    }
    icon = '<img src="' + icon + '" width="16" height="16" border="0" alt="" align="absmiddle"> ';
    return icon;
}

function ubiq_command_name(c) {
    return CmdUtils.CommandList[c]['name'];
}

function ubiq_replace_first_word(w) {
    if (!w) return;
    var text = ubiq_command();
    var words = text.split(' ');
    words[0] = w;
    var cmd_line = document.getElementById('ubiq_input');
    if (!cmd_line) return;
    cmd_line.value = words.join(' ');
    return;
}

function ubiq_show_matching_commands(text) {
    if (!text) text = ubiq_command();

    // Always consider 1st word only
    text = text.split(' ')[0];

    ubiq_first_match = null;

    var show_all = text == '*all';
    var matches = new Array();
    var substr_matches = new Array();
    if (text.length > 0) {
        for (var c in CmdUtils.CommandList) {
            var cmd = CmdUtils.CommandList[c]['name'];
            // Starting match only /^command/
            if (show_all || cmd.match('^' + text)) {
                matches.push(c);
            }
            // Substring matching as well, in a separate list
            else if (cmd.match(text)) {
                substr_matches.push(c);
            }
        }
    }

    // Some substring matches found, append to list of matches
    if (substr_matches.length > 0) {
        var full_matches = matches.length;
        for (m in substr_matches) {
            matches.push(substr_matches[m]);
            // Too long lists overflow from the layer
            if ((parseInt(m) + full_matches) > 11) {
                matches.push('...');
                break;
            }
        }
    }

    // Where to show the results
    var results_panel = document.getElementById('ubiq-results-panel');

    // Don't navigate outside boundaries of the list of matches
    if (ubiq_selected_command >= matches.length) {
        ubiq_selected_command = matches.length - 1;
    } else if (ubiq_selected_command == -1) {
        ubiq_selected_command = 0;
    }

    // We have matches, show a list
    if (matches.length > 0) {

        var suggestions_div = document.createElement('div');
        var suggestions_list = document.createElement('ul');
        suggestions_list.setAttribute('style', 'padding:0; margin:0');

        //ubiq_show_tip(matches[ubiq_selected_command]);
        ubiq_show_preview(matches[ubiq_selected_command]);

        for (var c in matches) {
            var is_selected = (c == ubiq_selected_command);
            var li = document.createElement('li');
            var li_bg = ubiq_url_for(is_selected ? 'selected_background.png' : 'command_background.png');
            c = matches[c];
            if (c == '...') {
                li.innerHTML = c;
            } else {
                var icon = ubiq_command_icon(c);
                var cmd = ubiq_command_name(c);
                if (is_selected) ubiq_first_match = cmd;
                li.innerHTML = icon + cmd;
            }
            li.setAttribute('style', 'color: black; list-style: none; margin:0; padding-top:8px; padding-left:12px;' +
                'font-family: Helvetica,Arial; font-size: 14px; height:26px;' +
                'background-image:' + li_bg + '; width:290px; background-repeat: repeat;');
            suggestions_list.appendChild(li);
        }

        suggestions_div.appendChild(suggestions_list);
        results_panel.innerHTML = suggestions_div.innerHTML;

    } else {
        ubiq_selected_command = -1;
        ubiq_show_tip(null);
        results_panel.innerHTML = ubiq_help();
    }

    return;
}

function ubiq_key_handler(userjs_event) {
    if (!userjs_event) return;
    var ev = userjs_event;
    var kc = ev.keyCode;

    // On ENTER, execute the given command
    if (kc == 13) {
        CmdUtils.saveLastCommand();
        ubiq_execute();
        return;
    }

    // Cursor up
    if (kc == 38) {
        ubiq_select_prev_command();
    }
    // Cursor Down
    else if (kc == 40) {
        ubiq_select_next_command();
    }

    ubiq_show_matching_commands();
}

function ubiq_select_prev_command() {
    if (ubiq_selected_command > 0) {
        ubiq_selected_command--;
    }
}

function ubiq_select_next_command() {
    ubiq_selected_command++;
}

function ubiq_xml(node) {
    return (node && node.nodeType) ? new XMLSerializer().serializeToString(node) : '(' + node + ')';
}

function ubiq_xml_http(url, callback) {
    //NIY
    alert("NOT IMPLEMENTED YET");
}


ubiq_window = document.getElementById("ubiq_window");
ubiq_get_selection();
ubiq_get_current_element();
ubiq_focus();

cmd = document.getElementById('ubiq_input');
cmd.select();
if (chrome.storage) chrome.storage.local.get('lastCmd', function(result) {
    lastCmd = result.lastCmd || "";
    cmd.value = lastCmd;
    cmd.select();
});

/*
async function doSomething(script) {
    try {
        // Query the tabs and continue once we have the result 
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        cmd.select();
        //active_document = activeTab.document;

        // Execute the injected script and continue once we have the result 
        const results = await chrome.tabs.executeScript(activeTab.id, { code: script });
        const firstScriptResult = results[0];
        return firstScriptResult;
    } catch (err) {
        // Handle errors from chrome.tabs.query, chrome.tabs.executeScript or my code 
    }
}

// If you want to use the same callback you can use Promise syntax too: 
doSomething("").then(function() {});
*/

// alert(activeTab.url);
console.log("hello from UbiChr");

// Add event handler to window 
document.addEventListener('keyup', function(e) { ubiq_key_handler(e) }, false);

ubiq_show_matching_commands();
