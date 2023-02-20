//
// UbiChr a Ubiquity for Chrome
// rostok@3e.pl
// 
// based on http://github.com/cosimo/ubiquity-chrome/ by Cosimo Streppone, <cosimo@cpan.org>
//
// Original Ubiquity Project: http://labs.mozilla.org/ubiquity/
// jshint esversion: 6 

var ubiq_selected_command = 0; // index for matches[]
var ubiq_selected_option = -1;
var ubiq_first_match;
var ubiq_history_index = 0;
var ubiq_last_preview_command_index = -1; // index for CommandList, changed from ubiq_last_preview_command
var ubiq_last_preview_cmd = null; // the last command structure
var ubiq_preview_org_html = '<div id="ubiq-command-preview"></div>';

// sets the tip field (for time being this is the preview panel)
function ubiq_set_tip(v) {
    var el = document.getElementById('ubiq-command-tip');
    if (!el) return;
    el.innerHTML = v;
}

function ubiq_preview_el() {
    return document.getElementById('ubiq-command-preview');
}

function ubiq_preview_set_visible(v) {
    document.getElementById('ubiq-command-panel').style.display = v ? '' : 'none';
    if (!v)
        ubiq_result_el().classList.add("result");
    else
        ubiq_result_el().classList.remove("result");
}

// sets preview panel, prepend allows to add new contnet to the top separated by HR
function ubiq_set_preview(v, prepend) {
    v = v || "";
    prepend = prepend === true; 
    var el = ubiq_preview_el();
    if (!el) return;
    el.innerHTML = v + (prepend ? "<hr/>" + el.innerHTML : "");
}

// recreates end empties preview/pblock element
// this hack addresses race condition for preview calls executed earlier and modifying pblock area once data is gathered ($.load / $.get)
// solution is to to recreate preview element by removing old one and creating exactly the same one based on its html code
// all custom properties will be lost, though
function ubiq_reset_preview() {
    var preel = ubiq_preview_el();
    var prevprev = $( preel ).prev().get(0);
    if (typeof prevprev !== "undefined") {
        $(preel).remove();
        $(prevprev).after( ubiq_preview_org_html );
    }
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
}

// clears tip, result and preview panels
function ubiq_clear() {
    ubiq_set_tip("");
    ubiq_set_result("");
    ubiq_set_preview("");
}

var savePreviewCmdTimeoutID = 0;

// shows preview for command, cmd is command struct
function ubiq_show_preview(cmd_struct) {
    if (typeof cmd_struct == 'undefined' || !cmd_struct) return;
    var preview_func = cmd_struct.preview;
    ubiq_last_preview_cmd = cmd_struct;
    switch(typeof preview_func)
    {
    case 'undefined':
            ubiq_reset_preview();
            ubiq_set_preview( cmd_struct.description );
            break;
    case 'string': 
            ubiq_reset_preview();
            ubiq_set_preview( preview_func );
            break;
    case 'function':
            var words = ubiq_command().split(' ');
            var command = words.shift();
        
            var text = words.join(' ').trim();
            if (text=="") text = CmdUtils.selectedText;
        
            var directObj = {
                text: text,
                _selection: text==CmdUtils.selectedText,
                _cmd: cmd_struct
            };

            // save the preview to command history
            window.clearTimeout(savePreviewCmdTimeoutID);
            savePreviewCmdTimeoutID = window.setTimeout(()=>{
                CmdUtils.saveToHistoryPreview(cmd_struct.name+" "+text);
            }, 3000);

            var pfunc = ()=>{
                // zoom overflow dirty fix
                CmdUtils.popupWindow.jQuery("#ubiq-command-preview").css("overflow-y", "auto"); 
                try {
                    CmdUtils.deblog("prev [", cmd_struct.name ,"] [", text,"]");
                    CmdUtils.backgroundWindow.clearTimeout(cmd_struct.lastPrevTimeoutID); // keep lastPrevTimeoutID in cmd_struct instead of global var
                    ubiq_reset_preview();
                    (preview_func.bind(cmd_struct))(ubiq_preview_el(), directObj);
                } catch (e) {
                    CmdUtils.setBadge("!", "red");
                    CmdUtils.lastError = `preview [${cmd_struct.name} [${text}]\n\n${e.stack}`;
                    CmdUtils.notify(e.toString(), "preview function error");
                    console.error(e.stack);
                    if (CmdUtils.backgroundWindow && typeof CmdUtils.backgroundWindow.error === 'function') {
                        CmdUtils.backgroundWindow.error(e.stack);
                    }
                }
            }
            // if (typeof cmd_struct.require !== 'undefined')
            //     CmdUtils.loadScripts( cmd_struct.require, ()=>{ pfunc(); } );
            // else
            //     if (typeof cmd_struct.requirePopup !== 'undefined')
            //         CmdUtils.loadScripts( cmd_struct.requirePopup, ()=>{ pfunc(); }, window );
            //     else
            //         pfunc();
            CmdUtils.loadScripts( cmd_struct.require, ()=>CmdUtils.loadScripts( cmd_struct.requirePopup, pfunc, window ) );
    }
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
    var command = words.shift();

    var text = words.join(' ').trim();
    if (text=="") text = CmdUtils.selectedText;

    var cmd = ubiq_match_first_command(cmd);
    // Expand match (typing 'go' will expand to 'google')
    if (CmdUtils.expandOnExecute) ubiq_replace_first_word(cmd);

    // Find command element
    var cmd_struct = CmdUtils.getcmd( cmd );

    if (!cmd_struct) {
        return;
    }

    // Create a fake Ubiquity-like object, to pass to
    var directObj = { 
        text: text,
        _selection: text==CmdUtils.selectedText,
        _cmd: cmd_struct,
        _opt_idx: ubiq_selected_option,
        _opt_val: $(ubiq_preview_el()).find("[data-option=selected]").data("option-value"),
        pblock: ubiq_preview_el()
    };

    // Run command's "execute" function
    var pfunc = ()=>{
        try {
            CmdUtils.deblog("exec [", cmd_struct.name ,"] [", text,"]");
            CmdUtils.backgroundWindow.clearTimeout(cmd_struct.lastExecTimeoutID); // keeping lastExecTimeoutID in cmd_struct instead of single global var
            CmdUtils.saveToHistory(cmd_struct.name+" "+text);
            (cmd_struct.execute.bind(cmd_struct))(directObj);
        } catch (e) {
            CmdUtils.setBadge("!", "red");
            CmdUtils.lastError = `execute [${cmd_struct.name} [${text}]\n\n${e.stack}`;
            CmdUtils.notify(e.toString(), "execute function error");
            console.error(e.stack);
            if (CmdUtils.backgroundWindow && typeof CmdUtils.backgroundWindow.error === 'function') {
                CmdUtils.backgroundWindow.error(e.stack);
            }
        }
    }
    CmdUtils.loadScripts( cmd_struct.require, ()=>CmdUtils.loadScripts( cmd_struct.requirePopup, pfunc, window ) );
}

function ubiq_help() {
    var html = '<div style="position:absolute; top:56px; right:0px; color: #666;">UbiChr v'+CmdUtils.VERSION+'</div>';
    html += 'Type the name of a command and press Enter to execute it, or <b>help</b> for assistance.</p>';
    html += "<p>commands loaded: ";
    html += CmdUtils.CommandList.map((c)=>{
        return "<span fakeattr='"+c.name+"' href=# title='"+c.description+"'>"+(c.builtIn ? c.name : "<u>"+c.name+"</u>")+"</span>";
    }).sort().join(", ");
    html += "<p>";
    html += "<div style='position: absolute; bottom: 0;'>";
    html += "<u>Keys:</u><br>";
    html += "<div style='column-count:3'>";
    html += "Enter - execute<br>";
    html += "Shift+Enter - execute to inactive tab<br>";
    html += "Ctrl+C - copy preview to clipboard<br>";
    html += "F5 - reload the extension<br>";
    html += "↑ / ↓ - select suggestion<br>";
    html += "Tab - expand suggestion<br>";
    html += "Space (selected input) - hide params<br>";
    html += "Ctrl+↑ / ↓ - select preview option<br>";
    html += "Ctrl+R / Alt+F8 - command history<br>";
    html += "Ctrl+P / Ctrl+E - previous command<br>";
    html += "Ctrl+N / Ctrl+X - next command<br>";
    html += "</div>";
    html += "</div>";
    return html;
}

function ubiq_focus() {
    var el = document.getElementById('ubiq_input');
    el.setSelectionRange(0, el.value.length);
    el.focus();
}

// returns command line
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

function ubiq_tabsuggest() {
    var cmd = ubiq_match_first_command(cmd);
    if (cmd.trim()=="") return;
    ubiq_replace_first_word(cmd);
    cmd = ubiq_command();
    if (cmd.includes(" ")) return;
    var cmd_line = document.getElementById('ubiq_input');
    cmd_line.value = cmd+" ";
}

function ubiq_command_icon(c) {
    var icon = CmdUtils.CommandList[c].icon || "";
    if (icon.length>0 && icon.length < 3) return `<span class='texticon'>${icon}</span>`; // emojis/unicode
    if (icon=="") icon = 'res/spacer.png';
    icon = `<span class="texticon"><img class="icon" src="${icon}" border="0" alt="" align="absmiddle"></span>`;
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
        if (selcmdidx!=ubiq_last_preview_command_index) ubiq_clear();
        ubiq_selected_option = -1;
        ubiq_last_preview_command_index = selcmdidx;
        ubiq_show_preview(CmdUtils.CommandList[selcmdidx]);

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

            var cmd_struct = CmdUtils.getcmd( cmd );
            if (cmd_struct && cmd_struct.external) $(li).addClass('external');
            suggestions_list.appendChild(li);
        }

        suggestions_div.appendChild(suggestions_list);
        ubiq_result_el().innerHTML = suggestions_div.innerHTML; // shouldn't clear the preview
        ubiq_preview_set_visible(true);
    } else {
        ubiq_preview_set_visible(false);
        ubiq_selected_command = -1;
        ubiq_clear();
        ubiq_set_result( ubiq_help() );
        if (text.length)
            ubiq_set_result( 'no commands found for <b>'+ ubiq_html_encode(text) +'</b>', true );
    }
    // replace missing icons 
    $(".icon").on("error", function(){ $(this).attr('src', 'res/spacer.png'); });    
    return;
}

function ubiq_update_options()
{
    var size = $(ubiq_preview_el()).find("[data-option]").length;
    if (ubiq_selected_option<0) ubiq_selected_option=-1;
    if (ubiq_selected_option>=size) ubiq_selected_option=size-1;
    // ubiq_set_tip("sel opt"+ubiq_selected_option);
    $(ubiq_preview_el()).find("[data-option]").attr("data-option","");
    if (ubiq_selected_option>=0) {
        $(ubiq_preview_el()).find("[data-option]:eq("+ubiq_selected_option+")").attr("data-option","selected");
        // CmdUtils.jQuery(ubiq_preview_el()).scrollTo($(ubiq_preview_el()).find("[data-option=selected]").first());
        CmdUtils.jQuery().ensureInView(ubiq_preview_el(),$(ubiq_preview_el()).find("[data-option=selected]")[0]);
        CmdUtils.jQuery(ubiq_preview_el()).find("[data-option=selected]").first().trigger("data-option-selected");
        //CmdUtils.notify($(ubiq_preview_el()).find("[data-option=selected]").first().html(), "op sel");
    }
}

var lcmd = null;

function ubiq_keydown_handler(evt) {
    // update the window 
    CmdUtils.popupWindow = window;

    // measure the input 
    CmdUtils.lastKeyEvent = evt;
    CmdUtils.inputUpdateTime = performance.now();
    ubiq_save_input();

    if (!evt) return;
    var kc = evt.keyCode;

    // TAB expands current command
    if (kc == 9) {
        ubiq_tabsuggest();
        evt.preventDefault();
        return;
    }

    // SPACE will remove everything beyond first word+space ONLY if whole input is selected
    if (kc == 32) {
        let el = document.getElementById('ubiq_input');
        if (el.selectionStart==0 && el.selectionEnd==el.value.length) ubiq_set_input(ubiq_command().split(" ").shift().trim(), false)
    }

    // On ENTER, execute the given command
    if (kc == 13) {
        ubiq_execute();
        evt.preventDefault();
        return;
    }

    // On F5 restart extension
    if (kc == 116) {
        chrome.runtime.reload();
        evt.preventDefault();
        return;
    }

    // Ctrl+C copies preview to clipboard
    if (kc == 67 && evt.ctrlKey) {
        backgroundPage.console.log("copy to clip");
        let el = ubiq_preview_el();
        if (!el) return;
        CmdUtils.setClipboard( el.innerText );
        evt.preventDefault();
    }

    // Ctrl+P / Ctrl+E selects previous commands
    if ((kc == 80 && evt.ctrlKey) || (kc == 69 && evt.ctrlKey)) {
        ubiq_history_index++;
        if (ubiq_history_index<0) ubiq_history_index = 0;
        if (ubiq_history_index>=CmdUtils.history.length) ubiq_history_index = CmdUtils.history.length-1;
        ubiq_set_input(CmdUtils.history[ubiq_history_index], false)
        evt.preventDefault();
        return;
    }

    // Ctrl+N / Ctrl+X selects previous commands
    if ((kc == 78 && evt.ctrlKey) || (kc == 88 && evt.ctrlKey)) {
        ubiq_history_index--;
        if (ubiq_history_index<0) ubiq_history_index = 0;
        if (ubiq_history_index>=CmdUtils.history.length) ubiq_history_index = CmdUtils.history.length-1;
        ubiq_set_input(CmdUtils.history[ubiq_history_index], false)
        evt.preventDefault();
        return;
    }

    // Ctrl+R / Alt+F8 shows history
    if ((kc == 82 && evt.ctrlKey) || (kc == 119 && evt.altKey)) {
        ubiq_set_input('history ', false)
        let cmd = document.getElementById('ubiq_input');
        evt.preventDefault();
        return;
    }

    // selecting options
    if (evt.ctrlKey) {
        // Cursor up
        if (kc == 38) {
            ubiq_selected_option--;
            ubiq_update_options();
            evt.preventDefault();
        }
        // Cursor Down
        else if (kc == 40) {
            ubiq_selected_option++;
            ubiq_update_options();
            evt.preventDefault();
        }
    }
    // selecting commands
    else {
        // Cursor up
        if (kc == 38) {
            ubiq_selected_command--;
            lcmd = null;
            evt.preventDefault();
        }
        // Cursor Down
        else if (kc == 40) {
            ubiq_selected_command++;
            ubiq_selected_command = Math.min(ubiq_selected_command, 14);
            lcmd = null;
            evt.preventDefault();
        }
    }
    if (lcmd==ubiq_command()) return;
    ubiq_show_matching_commands();
    lcmd=ubiq_command();
}

function ubiq_keyup_handler(evt) {
    if (lcmd==ubiq_command()) return;
    ubiq_show_matching_commands();
    lcmd=ubiq_command();
}

function ubiq_save_input() {
    let cmd = document.getElementById('ubiq_input');
    if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.local.set({ 'lastCmd': cmd.value });
}

function ubiq_set_input(v, select=true) {
    let cmd = document.getElementById('ubiq_input');
    cmd.value = v;
    if (select) cmd.select();
}

// loads last command into input element and calls callback, regardless of result of loading last command from local storage 
function ubiq_load_input(callback) {
    let cmd = document.getElementById('ubiq_input');
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get('lastCmd', function(result) {
            lastCmd = result.lastCmd || "";
            cmd.value = lastCmd;
            cmd.select();
            callback();
        });
    } 
    else 
    {
        callback();
    }
}


// detect ubiq-result-panel resizing and ses width/max-width of ubiq-command-panel, -tip and -preview
var resultResizeObserver = new ResizeObserver(entries => {
    var w = 780 - Math.min($("#ubiq-result-panel").width(),240)+ "px";
    $("#ubiq-command-panel,#ubiq-command-tip,#ubiq-command-preview").css({"width":w, "max-width":w});
});
resultResizeObserver.observe(document.querySelector('#ubiq-result-panel'));

$(window).on('load', function() {
    if (typeof CmdUtils !== 'undefined' && typeof Utils !== 'undefined' && typeof backgroundPage !== 'undefined' ) {
        ubiq_preview_org_html = ubiq_preview_el().outerHTML;
        CmdUtils.setPreview = ubiq_set_preview;
        CmdUtils.setResult = ubiq_set_result;
        CmdUtils.setTip = ubiq_set_tip;
        CmdUtils.popupWindow = window;
        CmdUtils.updateActiveTab();
        
        // Add event handler to window 
        document.addEventListener('keydown', function(e) { ubiq_keydown_handler(e); }, false);
        document.addEventListener('keyup', function(e) { ubiq_keyup_handler(e); }, false);
        
        console.log("hello from UbiChr");

        if (CmdUtils.loadLastInput)
            ubiq_load_input( ()=>{
                ubiq_show_matching_commands();
                CmdUtils.onPopup(window);
            });
        else            
            CmdUtils.onPopup(window);
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