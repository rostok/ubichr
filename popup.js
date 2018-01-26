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

//
// CmdUtils
//
var active_document = document; // initially this is popup
var active_window = window; // initially this is popup

var ubiq_window;
var ubiq_selection;
var ubiq_element;
var ubiq_remote_server = 'res'; //http://people.opera.com/cosimo/ubiquity';
var ubiq_selected_command = 0;
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

function ubiq_set_results(v) {
    var el = document.getElementById('ubiq-results-panel');
    if (!el) return;
    el.innerHTML = v + "<hr/>" + el.innerHTML;
}

function ubiq_show_preview(cmd, args) {
    var el = document.getElementById('ubiq-command-preview');
    if (!el) return;
    if (!cmd) {
        el.innerHTML = '';
        return;
    }
    preview_func = CmdUtils.CommandList[cmd]['preview'];
    switch(typeof preview_func)
    {
    case 'undefined':
        	el.innerHTML = CmdUtils.CommandList[cmd]['description'];
        	break;
    case 'string': 
        	el.innerHTML = preview_func;
        	break;
    default:
        var words = ubiq_command().split(' ');
        var command = words.shift();
    
        var text = words.join(' ');

		if (typeof args === 'string') {
			text = args;
        } else {
            if (text.trim()=="") {
        		chrome.tabs.executeScript( {
        		    code: "window.getSelection().toString();"
        		}, function(selection) {
        			if (selection!="") {
                        ubiq_show_preview(cmd, selection.toString());
                    }
        		});
            	return;
            }
		}
		            
        var directObj = {
            text: text,
        };
		if (typeof CmdUtils.CommandList[cmd]['require'] !== 'undefined')
	        CmdUtils.loadScripts(CmdUtils.CommandList[cmd]['require'], ()=>{ preview_func(el, directObj) });
	    else
        	preview_func(el, directObj);
    }
    return;
}

function ubiq_clear() {
	$("#ubiq-results-panel").html("");
	$("#ubiq-command-tip").html("");
	$("#ubiq-command-preview").html("");
}

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

function ubiq_dispatch_command(line, args) {
    var words = ubiq_command().split(' ');
    var command = words.shift();

    var text = words.join(' ');

    if (typeof args === 'string') {
        text = args;
    } else {
        if (text.trim()=="") {
            chrome.tabs.executeScript( {
                code: "window.getSelection().toString();"
            }, function(selection) {
                if (selection!="") {
                    ubiq_dispatch_command(cmd, selection.toString());
                }
            });
            return;
        }
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
    html += "<p>commands loaded:<BR>";
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
        //ubiq_show_tip(matches[ubiq_selected_command]);
        //console.log("ubiq_show_preview pre ",ubiq_selected_command, matches);
        ubiq_show_preview(matches[ubiq_selected_command]);

        for (var c in matches) {
            var is_selected = (c == ubiq_selected_command);
            var li = document.createElement('li');
            c = matches[c];
            if (c == '...') {
                li.innerHTML = c;
            } else {
                var icon = ubiq_command_icon(c);
                var cmd = ubiq_command_name(c);
                if (is_selected) ubiq_first_match = cmd;
                li.innerHTML = icon + cmd;
            }
            li.setAttribute('class', is_selected ? 'selected' : '');
            suggestions_list.appendChild(li);
        }

        suggestions_div.appendChild(suggestions_list);
        results_panel.innerHTML = suggestions_div.innerHTML;

    } else {
        ubiq_selected_command = -1;
        ubiq_show_tip(null);
        ubiq_clear();
        results_panel.innerHTML = ubiq_help();
    }

    return;
}

function ubiq_key_handler(userjs_event) {
	// measure the input 
	CmdUtils.inputUpdateTime = performance.now();
	ubiq_save_input();

    if (!userjs_event) return;
    var ev = userjs_event;
    var kc = ev.keyCode;

    // On ENTER, execute the given command
    if (kc == 13) {
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

function ubiq_save_input() {
	cmd = document.getElementById('ubiq_input');
    if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.set({ 'lastCmd': cmd.value });
}

function ubiq_load_input() {
	cmd = document.getElementById('ubiq_input');
    if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.get('lastCmd', function(result) {
        lastCmd = result.lastCmd || "";
        cmd.value = lastCmd;
        cmd.select();
    });
}

ubiq_window = document.getElementById("ubiq_window");
ubiq_get_selection();
ubiq_get_current_element();

ubiq_load_input();

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

if (ubiq_command()!="") 
setTimeout(function() {
	document.body.focus();
    ubiq_show_matching_commands(ubiq_command());
    ubiq_focus();
	console.log("should focus");
	cmd.focus();
}, 500);