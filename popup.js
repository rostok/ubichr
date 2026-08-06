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
var ubiq_test_mode = window.location.hash.startsWith('#test');

// fresh system-clipboard read for commands that use getClipboard(); in test mode
// tests.html propagates the clipboard via setClipboard/getViews and reading the
// system clipboard here would overwrite that with stale content
function ubiq_read_clipboard() {
    if (ubiq_test_mode) return Promise.resolve(CmdUtils._clipboardText);
    return CmdUtils.readClipboard();
}

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
// additional sanity check can be like this:
//          if (!CmdUtils.popupWindow.document.contains(pblock)) return; // well, user refreshed preview
// but proper way would be to keep track of all callbacks or requests and kill them
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
    ubiq_result_autoresize();
    ubiq_reset_preview();
    var preview_func = cmd_struct.preview;
    ubiq_last_preview_cmd = cmd_struct;
    switch(typeof preview_func)
    {
    case 'undefined':
            ubiq_reset_preview();
            ubiq_set_preview( cmd_struct.description || cmd_struct.help );
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
                    clearTimeout(cmd_struct.lastPrevTimeoutID); // keep lastPrevTimeoutID in cmd_struct instead of global var
                    ubiq_reset_preview();
                    (preview_func.bind(cmd_struct))(ubiq_preview_el(), directObj);
                } catch (e) {
                    CmdUtils.setBadge("!", "red");
                    CmdUtils.lastError = `preview [${cmd_struct.name} [${text}]\n\n${e.stack}`;
                    CmdUtils.notify(e.toString(), "preview function error");
                    console.error(e.stack);
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

    var cmd = ubiq_match_first_command(command);
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
            clearTimeout(cmd_struct.lastExecTimeoutID); // keeping lastExecTimeoutID in cmd_struct instead of single global var
            CmdUtils.saveToHistory(cmd_struct.name+" "+text);
            (cmd_struct.execute.bind(cmd_struct))(directObj);
        } catch (e) {
            CmdUtils.setBadge("!", "red");
            CmdUtils.lastError = `execute [${cmd_struct.name} [${text}]\n\n${e.stack}`;
            CmdUtils.notify(e.toString(), "execute function error");
            console.error(e.stack);
        }
    }
    CmdUtils.loadScripts( cmd_struct.require, ()=>CmdUtils.loadScripts( cmd_struct.requirePopup, pfunc, window ) );
}

function ubiq_help() {
    var html = '<div style="position:absolute; top:56px; right:0px; color: #666;">UbiChr v'+CmdUtils.VERSION+'</div>';
    if (typeof chrome.userScripts === 'undefined') {
        html += '<div style="color:yellow; font-weight:bold;">UbiChr v3 requires userScripts option being enabled in extension settings!</div>';
    }
    html += 'Type the name of a command and press Enter to execute it, or <b>help</b> for assistance.</p>';
    html += "<div id='ubiq-help' style='width:780px;max-height:390px; overflow-y: auto;'>";
    html += "commands loaded: ";
    html += CmdUtils.CommandList.map((c)=>{
        return "<span fakeattr='"+c.name+"' href=# title='"+c.description+"'>"+(c.builtIn ? c.name : "<u>"+c.name+"</u>")+"</span>";
    }).sort().join(", ");
    html += "</div>";
    html += "<div style='position: absolute; bottom: 0;'>";
    html += "<div style='column-count:3'>";
    html += "<u>Keys:</u><br>";
    html += "Enter - execute<br>";
    html += "Shift+Enter - execute to inactive tab<br>";
    html += "Ctrl+C - copy preview to clipboard<br>";
    html += "↑ / ↓ - select suggestion<br>";
    html += "Tab - expand suggestion<br>";
    html += "Space (selected input) - hide params<br>";
    html += "Ctrl+↑ / ↓ - select preview option<br>";
    html += "Ctrl+R / Alt+F8 - command history<br>";
    html += "Ctrl+P / Ctrl+E - previous command<br>";
    html += "Ctrl+N / Ctrl+X - next command<br>";
    html += "F5 - reload the extension<br>";
    html += "</div>";
    html += "</div>";
    return html;
}

function ubiq_focus() {
    var el = document.getElementById('ubiq_input');
    if (document.activeElement === el) {
        el.setSelectionRange(0, el.value.length);
    } else {
        el.addEventListener('focus', () => el.setSelectionRange(0, el.value.length), { once: true });
        el.focus();
    }
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
    var cmd = ubiq_match_first_command();
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
            if (sr[2] == 0x7fffffff) {
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


// detect ubiq-result-panel resizing and set width/max-width of ubiq-command-panel, -tip and -preview
function ubiq_result_autoresize(entries, observer) {
    //var w = 780 - Math.min($("#ubiq-result-panel").width(),240)+ "px";
    //var w = 780 - Math.min(ubiq_result_el().offsetWidth,240)+ "px";
    var w = !ubiq_result_el().checkVisibility() || $(ubiq_result_el()).width()<=0 ? 780 : 540;
    $("#ubiq-command-panel,#ubiq-command-tip,#ubiq-command-preview").css({"width":w, "max-width":w});
}
var resultResizeObserver = new ResizeObserver(ubiq_result_autoresize);
resultResizeObserver.observe(document.querySelector('#ubiq-result-panel'));

// ── Sandbox bridge ─────────────────────────────────────────────────────────────

// Create a stub command that forwards preview/execute to the sandbox
function ubiq_create_sandbox_stub(info) {
    var name = info.name;
    var stub = {
        name: name,
        names: info.names || [name],
        icon: info.icon || '',
        description: info.description || '',
        help: info.help || '',
        external: info.external || false,
        builtIn: false,
        test: info.test,
        preview: info.previewSrc
            ? function(pblock, args) {
                var sf = document.getElementById('sandbox-frame');
                if (!sf) return;
                ubiq_read_clipboard().then(function(clip) {
                    sf.contentWindow.postMessage({
                        type: 'preview',
                        name: name,
                        args: { text: args.text || '', _opt_idx: args._opt_idx, _opt_val: args._opt_val, _selection: args._selection },
                        selectedText: CmdUtils.selectedText,
                        activeTab: CmdUtils.active_tab,
                        clipboardText: clip
                    }, '*');
                });
              }
            : (info.description || info.help || ''),
        execute: function(args) {
            var sf = document.getElementById('sandbox-frame');
            if (!sf) return;
            ubiq_read_clipboard().then(function(clip) {
                sf.contentWindow.postMessage({
                    type: 'execute',
                    name: name,
                    args: { text: args.text || '', _opt_idx: args._opt_idx, _opt_val: args._opt_val, _selection: args._selection },
                    selectedText: CmdUtils.selectedText,
                    activeTab: CmdUtils.active_tab,
                    clipboardText: clip
                }, '*');
            });
        },
        // Original source for command-source/dump
        _previewSrc: info.previewSrc || null,
        _executeSrc: info.executeSrc || null,
        _extraProps: info.extraProps || {},
        _onAuthMode: info.onAuthMode || 'default'
    };
    return stub;
}

// Handle chrome.* proxy calls from the sandbox
function ubiq_handle_chrome_call(msg) {
    var sf = document.getElementById('sandbox-frame');
    function sendResult(result, error) {
        if (sf) sf.contentWindow.postMessage({
            type: 'chrome-result', id: msg.id,
            result: result, error: error
        }, '*');
    }

    switch (msg.method) {
        case 'createTab':
            CmdUtils.createTab(msg.args[0], function(tab) { sendResult(tab); });
            break;
        case 'tabs.create':
            chrome.tabs.create.apply(chrome.tabs, msg.args.concat([function(tab) {
                sendResult(tab, chrome.runtime.lastError && chrome.runtime.lastError.message);
            }]));
            break;
        case 'tabs.update':
            chrome.tabs.update.apply(chrome.tabs, msg.args.concat([function(tab) {
                sendResult(tab);
            }]));
            break;
        case 'tabs.query':
            chrome.tabs.query(msg.args[0] || {}, function(tabs) { sendResult(tabs); });
            break;
        case 'tabs.executeScript': {
            // MV2-compat path for legacy custom commands: [tabId|null, {code}]
            var xTabId = msg.args[0];
            var details = msg.args[1] || {};
            if (xTabId == null) xTabId = CmdUtils.active_tab && CmdUtils.active_tab.id;
            if (!xTabId) { sendResult(null, 'No target tab'); break; }
            var code = details.code || '';
            var known = code.match(/^\s*document\.body\.inner(Text|HTML)(?:\.toString\(\))?\s*;?\s*$/);
            if (known) {
                // the most common MV2 snippet — serve without the userScripts requirement
                chrome.scripting.executeScript({
                    target: { tabId: xTabId },
                    func: function(kind) { return document.body['inner' + kind]; },
                    args: [known[1]]
                }, function(results) {
                    if (chrome.runtime.lastError) { sendResult(null, chrome.runtime.lastError.message); return; }
                    sendResult((results || []).map(function(r) { return r.result; }));
                });
            } else {
                chrome.runtime.sendMessage({ message: 'executeCode', tabId: xTabId, code: code }, function(resp) {
                    if (chrome.runtime.lastError) { sendResult(null, chrome.runtime.lastError.message); return; }
                    if (resp && resp.error) { sendResult(null, resp.error); return; }
                    sendResult(resp && resp.results);
                });
            }
            break;
        }
        case 'notifications.create':
            chrome.notifications.create(msg.args[0], msg.args[1], function(id) {
                sendResult(id);
            });
            break;
        case 'fetch': {
            // args[0] is either a plain url string (legacy) or a request object
            // {url, method, data, headers, raw} — raw:true returns the full
            // {status, statusText, responseText, headers} for the sandbox ajax transport
            var req = msg.args[0];
            if (typeof req === 'string') req = { url: req };
            var xhr = new XMLHttpRequest();
            xhr.open(req.method || 'GET', req.url, true);
            xhr.withCredentials = true;
            if (req.headers) for (var h in req.headers) { try { xhr.setRequestHeader(h, req.headers[h]); } catch(e) {} }
            xhr.onload = function() {
                if (req.raw) sendResult({ status: xhr.status, statusText: xhr.statusText, responseText: xhr.responseText, headers: xhr.getAllResponseHeaders() });
                else sendResult(xhr.responseText);
            };
            xhr.onerror = function() { sendResult(null, 'XHR network error'); };
            xhr.send(req.data != null ? req.data : null);
            break;
        }
        case 'scripting.injectScript':
            var url = msg.args[0];
            if (CmdUtils.active_tab && CmdUtils.active_tab.id) {
                chrome.scripting.executeScript({
                    target: { tabId: CmdUtils.active_tab.id },
                    func: function(scriptUrl) {
                        var e = document.createElement('script');
                        e.src = scriptUrl;
                        e.onload = function() { console.log('script injected'); };
                        document.head.appendChild(e);
                    },
                    args: [url]
                }, function() { sendResult(true); });
            } else {
                sendResult(false, 'No active tab');
            }
            break;
        case 'scripting.setSelection':
            CmdUtils.setSelection(msg.args[0]);
            sendResult(true);
            break;
        default:
            sendResult(null, 'Unknown method: ' + msg.method);
    }
}

// Answers the service worker's onAuthRequired check (see service_worker.js): should
// the native HTTP-auth dialog be allowed for this background fetch, or suppressed?
// Delegates to the currently running command's cmd.onAuth:
//   true       → allow (native dialog shows as normal)
//   function   → suppress, and run the handler (built-ins run it directly here;
//                sandboxed custom commands get it forwarded into the sandbox, since
//                functions can't cross that postMessage boundary)
//   otherwise  → suppress, show a generic "requires basic auth" tip
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message !== 'authRequired') return;
    var cmd = ubiq_last_preview_cmd;
    if (cmd && cmd.onAuth === true) { sendResponse({allow: true}); return; }
    if (cmd && typeof cmd.onAuth === 'function') {
        cmd.onAuth(ubiq_preview_el());
        sendResponse({allow: false});
        return;
    }
    if (cmd && cmd._onAuthMode === 'allow') { sendResponse({allow: true}); return; }
    if (cmd && cmd._onAuthMode === 'function') {
        var sf = document.getElementById('sandbox-frame');
        if (sf) sf.contentWindow.postMessage({type: 'auth-required', name: cmd.name, url: request.url}, '*');
        sendResponse({allow: false});
        return;
    }
    ubiq_set_tip('<span style="color:orange">🔒 basic auth required <a href="' + request.url + '" target="_blank">' + request.url + '</a></span>');
    sendResponse({allow: false});
});

// Handle all postMessage events from the sandbox iframe
window.addEventListener('message', function(e) {
    var sf = document.getElementById('sandbox-frame');
    if (!sf || e.source !== sf.contentWindow) return;
    var msg = e.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'sandbox-ready':
            CmdUtils.sandboxFrame = sf;
            CmdUtils.loadCustomScripts();
            break;
        case 'set-cmd-prop': {
            var cmd = CmdUtils.getcmd(msg.name);
            if (cmd) cmd[msg.prop] = msg.value;
            break;
        }
        case 'register-command': {
            var _existing = CmdUtils.CommandList.find(function(c) { return c.name === msg.name; });
            if (_existing && _existing.builtIn) break; // built-ins take precedence over sandbox stubs
            CmdUtils.CommandList = CmdUtils.CommandList.filter(function(c) { return c.name !== msg.name; });
            CmdUtils.CommandList.push(ubiq_create_sandbox_stub(msg));
            break;
        }
        case 'pblock-update':
            var pblock = ubiq_preview_el();
            if (pblock) pblock.innerHTML = msg.html;
            break;
        case 'chrome-call':
            ubiq_handle_chrome_call(msg);
            break;
        case 'run-builtin': {
            var builtin = CmdUtils.getcmd(msg.name); // real getcmd (cmdutils.js) — sees built-ins
            if (!builtin) break;
            if (msg.method === 'execute' && typeof builtin.execute === 'function') builtin.execute.call(builtin, msg.args);
            if (msg.method === 'preview' && typeof builtin.preview === 'function') builtin.preview.call(builtin, ubiq_preview_el(), msg.args);
            break;
        }
        case 'set-tip':
            ubiq_set_tip(msg.html);
            break;
        case 'set-preview':
            ubiq_set_preview(msg.html);
            break;
        case 'set-result':
            ubiq_set_result(msg.html);
            break;
        case 'set-badge':
            CmdUtils.setBadge(msg.text, msg.color);
            break;
        case 'set-clipboard':
            CmdUtils.setClipboard(msg.text);
            break;
        case 'save-history':
            CmdUtils.saveToHistory(msg.cmdline);
            break;
        case 'save-history-preview':
            CmdUtils.saveToHistoryPreview(msg.cmdline);
            break;
        case 'refresh-preview':
            ubiq_show_matching_commands();
            break;
        case 'eval-ok':
            ubiq_show_matching_commands();
            break;
        case 'eval-error':
            CmdUtils.setTip('<span style="color:red">Custom script error: ' + msg.message + '</span>');
            break;
        case 'preview-error': {
            var pblock = ubiq_preview_el();
            if (pblock) pblock.innerHTML = '<span style="color:red">preview error: ' + msg.message + '</span>';
            CmdUtils.lastError = 'preview [' + msg.name + ']: ' + msg.message;
            CmdUtils.setBadge('!', 'red');
            break;
        }
    }
});

$(window).on('load', function() {
    if (typeof CmdUtils !== 'undefined' && typeof Utils !== 'undefined') {
        ubiq_preview_org_html = ubiq_preview_el().outerHTML;
        CmdUtils.setPreview = ubiq_set_preview;
        CmdUtils.setResult = ubiq_set_result;
        CmdUtils.setTip = ubiq_set_tip;
        CmdUtils.popupWindow = window;
        CmdUtils.backgroundWindow = window; // MV3: popup IS the main context

        // Read state stored by service worker
        chrome.storage.session.get(['selectedText', 'active_tab'], function(result) {
            CmdUtils.selectedText = result.selectedText || '';
            CmdUtils.active_tab = result.active_tab || null;
        });
        // populate clipboard cache for commands that use getClipboard(); re-render
        // the preview once it arrives (built-in clip* commands read it synchronously)
        if (!ubiq_test_mode) {
            CmdUtils.readClipboard().then(function() { lcmd = null; ubiq_show_matching_commands(); });
            window.addEventListener('focus', function() { CmdUtils.readClipboard(); });
        }
        CmdUtils.loadHistory();

        // Add event handler to window
        document.addEventListener('keydown', function(e) { ubiq_keydown_handler(e); }, false);
        document.addEventListener('keyup', function(e) { ubiq_keyup_handler(e); }, false);
        document.getElementById('ubiq_input').addEventListener('input', ubiq_save_input, false); // keydown fires before input is updated

        // preview HTML from the sandbox is mirrored in as a plain string (no live listeners
        // survive the trip), so click-to-copy for custom commands is handled here generically.
        // data-copy overrides what gets copied (defaults to the element's text);
        // data-copy-feedback, if present, replaces the element's content after copying.
        $(document).on('click', '#ubiq-command-preview .copydata', function(e) {
            e.preventDefault();
            var $t = $(this);
            var val = $t.attr('data-copy');
            CmdUtils.setClipboard(val != null ? val : $t.text());
            var feedback = $t.attr('data-copy-feedback');
            if (feedback != null) $t.text(feedback);
        });

        if (typeof chrome.userScripts === 'undefined') {
            CmdUtils.setTip('<span style="color:orange">&#9888; Developer mode disabled &mdash; script injection commands won\'t work. Enable in <a href="chrome://extensions" target="_blank">chrome://extensions</a></span>');
            CmdUtils.setBadge('DEV', 'orange');
        }

        console.log("hello from UbiChr");

        var isTestMode = ubiq_test_mode;
        if (isTestMode) {
            // Wait for sandbox to finish loading custom scripts before starting test
            var _doOnPopup = function() {
                var testViews = chrome.extension.getViews({type: 'tab'});
                var testsWnd = testViews.find(w => w.location.pathname.endsWith('/tests.html'));
                if (testsWnd && typeof testsWnd.CmdUtils !== 'undefined')
                    testsWnd.CmdUtils.onPopup(window);
            };
            var _testTimer = setTimeout(_doOnPopup, 2000); // fallback if no custom scripts
            window.addEventListener('message', function _waitEval(e) {
                var sf = document.getElementById('sandbox-frame');
                if (!sf || e.source !== sf.contentWindow) return;
                if (e.data && (e.data.type === 'eval-ok' || e.data.type === 'eval-error')) {
                    clearTimeout(_testTimer);
                    window.removeEventListener('message', _waitEval);
                    _doOnPopup();
                }
            });
        } else if (CmdUtils.loadLastInput) {
            ubiq_load_input( ()=>{
                ubiq_show_matching_commands();
                CmdUtils.onPopup(window);
                ubiq_focus();
            });
        } else {
            CmdUtils.onPopup(window);
            ubiq_focus();
        }
        // Note: custom scripts are loaded when sandbox sends 'sandbox-ready'
    } else {
        chrome.tabs.create({ "url": "chrome://extensions" });
        chrome.notifications.create({
            "type": "basic",
            "iconUrl": chrome.runtime.getURL("res/icon-128.png"),
            "title": "UbiChr",
            "message": "there is something wrong, try restarting UbiChr"
        });
    }
});