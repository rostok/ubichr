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

function ubiq_preview_el() {
    return document.getElementById('ubiq-command-preview');
}

// sets preview panel, prepend allows to add new contnet to the top separated by HR
function ubiq_set_preview(v, prepend) {
    v = v || "";
    prepend = prepend === true;
    var el = ubiq_preview_el();
    if (!el) return;
    el.innerHTML = v + (prepend ? "<hr/>" + el.innerHTML : "");
}

function ubiq_result_el() {
    return document.getElementById('ubiq-result-panel');
}

// sets result panel, prepend allows to add new contnet to the top separated by HR
function ubiq_set_result(v, prepend) {
    v = v || "";
    prepend = prepend === true;
    var el = ubiq_result_el();
    if (!el) return;
    el.innerHTML = v + (prepend ? "<hr/>" + el.innerHTML : "");
    if (v!="") ubiq_set_preview("");
}

// clears tip, result and preview panels
function ubiq_clear() {
    ubiq_set_tip("");
    ubiq_set_result("");
    ubiq_set_preview("");
}

// shows preview for command, cmd is command index
function ubiq_show_preview(parsed) {
    if (!parsed) return;

    var cmd_struct = parsed._cmd;
    var preview_func = cmd_struct.preview;

    switch(typeof preview_func)
    {
    case 'undefined':
        	ubiq_set_preview( cmd_struct.description );
        	break;
    case 'string':
            ubiq_set_preview( preview_func );
        	break;
    default:
        var pfunc = ()=>{
            // zoom overflow dirty fix
            CmdUtils.popupWindow.jQuery("#ubiq-command-preview").css("overflow-y", "auto");
            try {
                (preview_func.bind(cmd_struct))(ubiq_preview_el(), parsed);
            } catch (e) {
                CmdUtils.notify(e.toString(), "preview function error")
                console.error(e.stack);
                if (CmdUtils.backgroundWindow && CmdUtils.backgroundWindow.error) {
                    CmdUtils.backgroundWindow.error(e.stack);
                }
            }
        }

		if (typeof cmd_struct.require !== 'undefined')
	        CmdUtils.loadScripts( cmd_struct.require, ()=>{ pfunc(); } );
	    else
            if (typeof cmd_struct.requirePopup !== 'undefined')
                CmdUtils.loadScripts( cmd_struct.requirePopup, ()=>{ pfunc(); }, window );
            else
                pfunc();
    }
    return;
}

function ubiq_basic_parse() {
    var text = ubiq_command();
    var words = text.split(' ');
    var command = words.shift();

    var input = words.join(' ').trim();
    if (text === "") input = CmdUtils.selectedText;

    // Find command element
    var cmd_struct = CmdUtils.getcmd(command);
    if (!cmd_struct) return null;

    var parsed_object = {
        text: text,
        command: command,
        input: input,
        _selection: (input==CmdUtils.selectedText),
        _cmd: cmd_struct
    };

    if ("options" in cmd_struct) {
        // Init the parsed object
        for (var key in cmd_struct["options"])
            parsed_object[key] = null;

        parsed_object["args"] = [];
        parsed_object["input"] = "";

        var current_key = null;
        var current_value = [];
        var value_open = false

        var update_parsed = function(key, value) {
            if (value === null || value === "") return null;
            if (key !== null) {
                switch (cmd_struct["options"][key]["type"]) {
                    case "boolean": parsed_object[key] = value; break;
                    case "string": parsed_object[key] = value; break;
                    case "list": {
                        if (!parsed_object[key]) parsed_object[key] = [value];
                        else parsed_object[key].push(value);
                        break;
                    }
                };
                // Add the new key in the args, so that they are sorted by
                // apparition.
                if (parsed_object["args"].indexOf(key) === -1)
                    parsed_object["args"].push(key);
            } else {
                parsed_object["input"] = parsed_object["input"].concat(" ").concat(value);
            }
        };

        for (var i = 0; i < words.length; i++) {
            // Option names bypass quotes
            if (words[i].startsWith("-") && words[i].substr(1) in cmd_struct["options"]) {
                // If a multi-token word was open, but we got the option, we
                // add what we had anyway to the previous key.
                if (value_open !== false) {
                    update_parsed(current_key, current_value.join(' '));
                    value_open = false
                    current_value = []
                }
                // Then we signal we're going to add a word to this key now.
                current_key = words[i].substr(1);
                // But if the key is a bool (matters only if it is present or
                // not), then we simply set it as true and we're done.
                if (cmd_struct["options"][current_key]["type"] === "boolean") {
                    update_parsed(current_key, true);
                    current_key = null;
                }
                continue;
            }
            // If in the middle of parsing a multi-word token
            if (value_open !== false) {
                // If it does not end with the same token with which it
                // started, we add it to the list.
                if (!words[i].endsWith(value_open)) {
                    current_value.push(words[i]);
                    continue;
                }
                // Otherwise we are done, and we merge the various tokens.
                current_value.push(words[i].slice(0, -1));
                value_open = false

                current_value = current_value.join(' ');
            } else if ((words[i].startsWith("'") || words[i].startsWith('"')) && value_open === false) {
                // If the word starts with a quote, check if it also ends with
                // it, otherwise start a new multi-token word.
                if (words[i].endsWith(words[i][0])) {
                    current_value = words[i].slice(1, -1);
                } else {
                    value_open = words[i][0];

                    current_value.push(words[i].substr(1));
                    continue;
                }
            } else {
                // If no quotes, we simply add the word as-is
                current_value = words[i];
            }
            // Add value to key
            update_parsed(current_key, current_value);
            // Clear both value and key
            current_value = []
            current_key = null
        }
        // Add options that were defaulted and not specified
        for (key in cmd_struct["options"])
            if ("def" in cmd_struct["options"][key] && parsed_object["args"].indexOf(key) === -1)
                update_parsed(key, cmd_struct["options"][key]["def"]);
    }

    return parsed_object;
}

function ubiq_execute() {
    var words = ubiq_command().split(' ');
    var command = words.shift();

    var text = words.join(' ').trim();
    if (text=="") text = CmdUtils.selectedText;

    // Find command element
    cmd_struct = CmdUtils.getcmd(command);
    if (!cmd_struct) return;

    // Create a fake Ubiquity-like object, to pass to
    // command's "execute" function
    var cmd_func = cmd_struct.execute;
    var directObj = ubiq_basic_parse();
    if (!directObj) return;

    // Run command's "execute" function
    try {
        CmdUtils.deblog("executing [", cmd,"] [", text,"]");
        cmd_func(directObj);
    } catch (e) {
        CmdUtils.notify(e.toString(), "execute function error")
        console.error(e.stack);
        CmdUtils.backgroundWindow.error(e.stack);
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
    el = ubiq_input();
    setTimeout("el.focus()", 50);
}

function ubiq_input() {
    return document.getElementById('ubiq_input');
}

function ubiq_command() {
    var cmd = ubiq_input();

    if (!cmd) return '';
    return cmd.value;
}

function _ubiq_image_error(elm) {
    elm.src = 'res/spacer.png';
};
function ubiq_command_icon(c) {
    var icon = CmdUtils.CommandList[c].icon;
    if (!icon) {
        icon = 'res/spacer.png';
    }
    icon = '<img src="' + icon + '" border="0" alt="" onerror="_ubiq_image_error(this);" align="absmiddle"> ';
    return icon;
}

function ubiq_command_name(c) {
    return CmdUtils.CommandList[c].name;
}

function ubiq_fuzzy_search(needle, haystack) {
  var rc, prefpart, prev;
      hlen = haystack.length,
      nlen = needle.length;
  if (nlen > hlen) {
    return false;
  }
  needle = needle.toLocaleLowerCase();
  haystack = haystack.toLocaleLowerCase();
  if (nlen === hlen && needle === haystack) {
    return 0x7fffffff;
  }
  if (nlen < hlen && haystack.substr(0, nlen) === needle) {
    if (haystack.charAt(nlen).match(/\W/)) {
      return nlen * 16;
    }
    return nlen * 8;
  }
  prefpart = 0;
  for (var i = nlen; i >= 2; i--) {
    if (haystack.substr(0, i) === needle.substr(0, i)) {
      prefpart = i;
      break;
    }
  }
  rc = prefpart * 4;
  prev = prefpart;
  mcycle: for (var i = prefpart, j = prefpart; i < nlen; i++) {
    var nch = needle.charAt(i);
    while (j < hlen) {
      if (haystack.charAt(j++) === nch) {
        rc += (nlen - i)*1.5 / (j - prev);
        prev = j;
        continue mcycle;
      }
    }
    return 0;
  }
  return rc > 0 ? rc : 0;
}

// html-escape
// todo: rewrite it without inline div creation...
var ubiq_html_encoder = null;
function ubiq_html_encode(text) {
    if (!ubiq_html_encoder)
        ubiq_html_encoder = $('<div>')
    return ubiq_html_encoder.html(text).text();
}

function ubiq_complete_command(text) {
    if (!text) text = ubiq_command();

    var words = text.split(' ');
    if (words.length > 1) return null;

    var command = words[0];
    if (command.length == 0) return null;

    matches = [];
    for (var c in CmdUtils.CommandList) {
        var cmdnames = CmdUtils.CommandList[c].names;
        for (var cmd of cmdnames)
            if (cmd.startsWith(command))
                matches.push(cmd);
    }

    if (matches.length == 0) return null;
    if (matches.length == 1) return matches[0];

    ubiq_set_preview(matches.join(', '));
    return null;
}

function ubiq_show_command_options(parsed) {
    if (!parsed) return;

    var cmd_struct = parsed._cmd;
    if (!("options" in cmd_struct)) return;

    var options_div = document.createElement('div');
    var options_list = document.createElement('ul');

    for (var key in cmd_struct["options"]) {
        li = document.createElement('LI');
        var val = cmd_struct["options"][key]["type"];
        if (parsed[key] !== null)
            val = String(parsed[key]);
        li.innerHTML = ubiq_html_encode(key + " => " + val);

        options_list.appendChild(li);
    }

    li = document.createElement('LI');
    li.innerHTML = ubiq_html_encode("input => " + parsed["input"]);
    options_list.appendChild(li);

    options_div.appendChild(options_list);
    ubiq_result_el().innerHTML = options_div.innerHTML;
}

// will also call preview
function ubiq_show_matching_commands(text) {
    const max_matches = 15;
    if (!text) text = ubiq_command();

    // Always consider 1st word only
    text = text.split(' ')[0];

    ubiq_first_match = null;

    var show_all = text == '*all';
    var matches = [];
    var fuzzy_matches = [];
    if (text.length > 0) {
        for (var c in CmdUtils.CommandList) {
            if (show_all) {
                matches.push(c);
                continue;
            }
            var cmdnames = CmdUtils.CommandList[c].names;
            var sr2, sr = [c, null, 0];
            for (var cmd of cmdnames) {
                sr2 = ubiq_fuzzy_search(text, cmd);
                if (sr2 > sr[2]) {
                    sr[1] = cmd;
                    sr[2] = sr2;
                }
            }
            if (!sr[2]) continue;
            if (sr == 0x7fffffff) {
                matches.push(sr);
            } else {
                fuzzy_matches.push(sr);
            }
        }
    }

    // Some substring matches found, append to list of matches
    if (fuzzy_matches.length && matches.length <= max_matches) {
        // sort by weights (desc) and found name (asc):
        fuzzy_matches = fuzzy_matches.sort(function(a, b) {
            // if equal weights:
            if (b[2] == a[2]) {
                // alphabetical:
                return a[1].localeCompare(b[1]);
            }
            // larger weights first:
            return b[2] - a[2];
        })
        for (var c of fuzzy_matches) {
            matches.push(c);
            if (matches.length > max_matches) {
                break;
            }
        }
    }
    // Too long lists overflow from the layer
    if (matches.length > max_matches) {
        matches.length = max_matches;
        matches.push('...');
    }

    // Don't navigate outside boundaries of the list of matches
    if (ubiq_selected_command >= matches.length) {
        ubiq_selected_command = matches.length - 1;
    } else if (ubiq_selected_command < 0) {
        ubiq_selected_command = 0;
    }
    // We have matches, show a list
    if (matches.length > 0) {
        var suggestions_div = document.createElement('div');
        var suggestions_list = document.createElement('ul');
        var selcmdidx = matches[ubiq_selected_command][0];
        ubiq_set_tip( CmdUtils.CommandList[ selcmdidx ].description );
        ubiq_show_preview(selcmdidx);

        for (var c in matches) {
            var is_selected = (c == ubiq_selected_command);
            c = matches[c];
            var li;
            if (c == '...') {
                li = document.createElement('DIV');
                li.setAttribute('class', 'more-commands');
                li.innerHTML = c;
            } else {
                li = document.createElement('LI');
                var foundname = c[1];
                c = c[0];
                var cmd = ubiq_command_name(c);
                var icon = ubiq_command_icon(c);
                if (is_selected) ubiq_first_match = cmd;
                //if (foundname != cmd) { foundname = cmd + " (" + foundname + ")" };
                li.innerHTML = icon + ubiq_html_encode(foundname);
            }
            if (is_selected)
                li.setAttribute('class', 'selected');
            suggestions_list.appendChild(li);
        }

        suggestions_div.appendChild(suggestions_list);
        ubiq_result_el().innerHTML = suggestions_div.innerHTML; // shouldn't clear the preview
        // ubiq_preview_set_visible(true);
    } else {
        // ubiq_preview_set_visible(false);
        ubiq_selected_command = -1;
        ubiq_clear();
        ubiq_set_result( ubiq_help() );
        if (text.length)
            ubiq_set_result( 'no commands found for <b>'+ ubiq_html_encode(text) +'</b>', true );
    }

    return;
}

function ubiq_keydown_handler(evt) {
	// measure the input
	CmdUtils.inputUpdateTime = performance.now();
	ubiq_save_input();

    if (!evt) return;
    var kc = evt.keyCode;

    // On ENTER, execute the given command
    if (kc == 13) {
        ubiq_execute();
        return;
    }

    // On TAB, try to autocomplete command
    if (kc == 9) {
        command = ubiq_complete_command();
        if (command !== null) {
            ubiq_input().value = command;
        }
        ubiq_focus();
        return;
    }

    // On F5 restart extension
    if (kc == 116) {
        chrome.runtime.reload();
        return;
    }

    // Ctrl+C copies preview to clipboard
    if (kc == 67 && evt.ctrlKey) {
        backgroundPage.console.log("copy to clip");
        var el = ubiq_preview_el();
        if (!el) return;
        CmdUtils.setClipboard( el.innerText );
    }
}

function ubiq_keyup_handler(evt) {
    var parsed = ubiq_basic_parse();
    ubiq_show_command_options(parsed);
    ubiq_show_preview(parsed);
}

function ubiq_save_input() {
	cmd = ubiq_input();
    if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.set({ 'lastCmd': cmd.value });
}

function ubiq_load_input(callback) {
	cmd = ubiq_input();
    if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.get('lastCmd', function(result) {
        lastCmd = result.lastCmd || "";
        cmd.value = lastCmd;
        cmd.select();
        callback();
    });
}


$(window).on('load', function() {
    if (typeof CmdUtils !== 'undefined' && typeof Utils !== 'undefined' && typeof backgroundPage !== 'undefined' ) {
        CmdUtils.setPreview = ubiq_set_preview;
        CmdUtils.setResult = ubiq_set_result;
        CmdUtils.popupWindow = window;
        CmdUtils.updateActiveTab();

        ubiq_load_input(()=>{ubiq_keyup_handler(null);});

        // Add event handler to window
        document.addEventListener('keydown', function(e) { ubiq_keydown_handler(e); }, false);
        document.addEventListener('keyup', function(e) { ubiq_keyup_handler(e); }, false);

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
});
