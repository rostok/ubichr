//
// UbiChr a Ubiquity for Chrome
// rostok@3e.pl
// 
// based on http://github.com/cosimo/ubiquity-chrome/ by Cosimo Streppone, <cosimo@cpan.org>
//
// Original Ubiquity Project: http://labs.mozilla.org/ubiquity/
// jshint esversion: 6 

var ubiq_selected_command = 0;
var ubiq_first_match;

// sets the tip field (for time being this is the preview panel)
function ubiq_set_tip(v) {
    // var el = document.getElementById('ubiq-command-tip');
    // if (!el) return;
    // el.innerHTML = v;
    ubiq_set_preview(v);
}

// sets result panel, prepend allows to add new contnet to the top separated by HR
function ubiq_set_result(v, prepend) {
    prepend = prepend === true; 
    var el = document.getElementById('ubiq-result-panel');
    if (!el) return;
    el.innerHTML = v + (prepend ? "<hr/>" + el.innerHTML : "");
}

// sets preview panel, prepend allows to add new contnet to the top separated by HR
function ubiq_set_preview(v, prepend) {
    prepend = prepend === true; 
    var el = document.getElementById('ubiq-command-preview');
    if (!el) return;
    el.innerHTML = v + (prepend ? "<hr/>" + el.innerHTML : "");
}

// clears tip, result and preview panels
function ubiq_clear() {
    ubiq_set_tip("");
    ubiq_set_result("");
    ubiq_set_preview("");
}

// shows preview for command, cmd is command index
function ubiq_show_preview(cmd, args) {
    var el = document.getElementById('ubiq-command-preview');
    if (!el) return;
    if (!cmd) {
        el.innerHTML = '';
        return;
    }
    preview_func = CmdUtils.CommandList[cmd].preview;
    switch(typeof preview_func)
    {
    case 'undefined':
        	el.innerHTML = CmdUtils.CommandList[cmd].description;
        	break;
    case 'string': 
        	el.innerHTML = preview_func;
        	break;
    default:
        var words = ubiq_command().split(' ');
        var command = words.shift();
    
        var text = words.join(' ').trim();
        if (text=="") text = CmdUtils.selectedText;
    
        var cmd_struct = CmdUtils.CommandList[cmd];
        var directObj = {
            text: text,
            _selection: text==CmdUtils.selectedText,
            _cmd: cmd_struct
        };

        var pfunc = ()=>{
            try {
                preview_func(el, directObj);
            } catch (e) {
                CmdUtils.notify(e.toString(), "preview function error")
            }
        }

		if (typeof cmd_struct.require !== 'undefined')
	        CmdUtils.loadScripts( cmd_struct.require, ()=>{ pfunc(); } );
	    else
        	pfunc();
    }
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

    var text = words.join(' ').trim();
    if (text=="") text = CmdUtils.selectedText;

    // Expand match (typing 'go' will expand to 'google')
    cmd = ubiq_match_first_command(cmd);
    ubiq_replace_first_word(cmd);

    // Find command element
    var cmd_struct;
    for (var c in CmdUtils.CommandList) {
        var cmd_name = CmdUtils.CommandList[c].name;
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
    var cmd_func = cmd_struct.execute;
    var directObj = { 
        text: text,
        _selection: text==CmdUtils.selectedText,
        _cmd: cmd_struct
    };

    // Run command's "execute" function
    try {
        cmd_func(directObj);
    } catch (e) {
        CmdUtils.notify(e.toString(), "execute function error")
    }

    return;
}

function ubiq_help() {
    var html = '<p>Type the name of a command and press Enter to execute it, or <b>help</b> for assistance.</p>';
    html += "<p>commands loaded:<BR>";
    html += CmdUtils.CommandList.map((c)=>{
        return "<span fakeattr='"+c.name+"' href=# title='"+c.description+"'>"+(c.builtIn ? c.name : "<u>"+c.name+"</u>")+"</span>";
    }).sort().join(", ");
    html += "<p>";
    html += "<u>Keys:</u><br>";
    html += "Ctrl-C - copy preview to clipboard<br>";
    html += "up/down - cycle through commands suggestions<br>";
    html += "F5 - reload the extension";
    return html;
}

function ubiq_focus() {
    el = document.getElementById('ubiq_input');
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

function ubiq_command() {
    var cmd = document.getElementById('ubiq_input');
    if (!cmd) {
        ubiq_selected_command = -1;
        return '';
    }
    return cmd.value;
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
            c = CmdUtils.CommandList[c].name;
            if (c.match(RegExp('^'+text,"i"))) {
                first_match = c;
                break;
            }
        }
    }
    return first_match;
}

function ubiq_command_icon(c) {
    var icon = CmdUtils.CommandList[c].icon;
    if (!icon) {
        icon = 'res/spacer.png';
    }
    icon = '<img src="' + icon + '" width="16" height="16" border="0" alt="" align="absmiddle"> ';
    return icon;
}

function ubiq_command_name(c) {
    return CmdUtils.CommandList[c].name;
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

// will also call preview
function ubiq_show_matching_commands(text) {
    if (!text) text = ubiq_command();

    // Always consider 1st word only
    text = text.split(' ')[0];

    ubiq_first_match = null;

    var show_all = text == '*all';
    var matches = [];
    var substr_matches = [];
    if (text.length > 0) {
        for (var c in CmdUtils.CommandList) {
            var cmd = CmdUtils.CommandList[c].name;
            var cmdnames = CmdUtils.CommandList[c].names;
            // Starting match only /^command/
            if (show_all || cmd.match(RegExp('^'+text,"i")) || cmdnames.some((e)=>{return e.match(RegExp('^'+text,"i"));})) {
                matches.push(c);
            }
            // Substring matching as well, in a separate list
            else if (cmd.match(RegExp(text,"i")) || cmdnames.some((e)=>{return e.match(RegExp(text,"i"));})) {
                substr_matches.push(c);
            }
        }
    }

    // Some substring matches found, append to list of matches
    if (substr_matches.length > 0) {
        var full_matches = matches.length;
        for (var m in substr_matches) {
            matches.push(substr_matches[m]);
            // Too long lists overflow from the layer
            if ((parseInt(m) + full_matches) > 11) {
                matches.push('...');
                break;
            }
        }
    }

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
        ubiq_set_tip( CmdUtils.CommandList[ matches[ubiq_selected_command] ].description );
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
        ubiq_set_result( suggestions_div.innerHTML );

    } else {
        ubiq_selected_command = -1;
        ubiq_clear();
        ubiq_set_result( ubiq_help() );
    }

    return;
}

var lcmd = "";

function ubiq_key_handler(userjs_event) {
	// measure the input 
	CmdUtils.inputUpdateTime = performance.now();
	ubiq_save_input();

    if (!userjs_event) return;
    var kc = userjs_event.keyCode;

    // On ENTER, execute the given command
    if (kc == 13) {
        ubiq_execute();
        return;
    }

    // On F5 restart extension
    if (kc == 116) {
        chrome.runtime.reload();
        return;
    }

    // Ctrl+C copies preview to clipboard
    if (kc == 67 && userjs_event.ctrlKey) {
        backgroundPage.console.log("copy to clip");
        var el = document.getElementById('ubiq-command-preview');
        if (!el) return;
        CmdUtils.setClipboard( el.innerText );
    }

    // Cursor up
    if (kc == 38) {
        ubiq_select_prev_command();
        lcmd = "";
    }
    // Cursor Down
    else if (kc == 40) {
        ubiq_select_next_command();
        lcmd = "";
    }

    if (lcmd==ubiq_command()) return;
    ubiq_show_matching_commands();
    lcmd=ubiq_command();
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

if (typeof CmdUtils !== 'undefined' && typeof Utils !== 'undefined' && typeof backgroundPage !== 'undefined' ) {
    CmdUtils.setPreview = ubiq_set_preview;
    CmdUtils.setResult = ubiq_set_result;
    CmdUtils.popupWindow = window;
    CmdUtils.updateActiveTab();
    
    ubiq_load_input();

    // Add event handler to window 
    document.addEventListener('keyup', function(e) { ubiq_key_handler(e); }, false);

    console.log("hello from UbiChr");
} else {
    chrome.tabs.create({ "url": "chrome://extensions" });
    chrome.notifications.create({
        "type": "basic",
        "iconUrl": chrome.extension.getURL("res/icon-128.png"),
        "title": "UbiChr",
        "message": "there is something wrong, try restarting UbiChr"
    });
}