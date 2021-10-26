// jshint esversion: 6

var stubs = {
  'notify': // simple notify command 
`// basic command template with notification
CmdUtils.CreateCommand({
    name: "1example",
    description: "A short description of your command.",
    author: "Your Name",
    icon: "http://www.mozilla.com/favicon.ico",
    execute: function execute(args) {
        CmdUtils.notify("Execute:Your input is: " + args.text);
    },
    preview: function preview(pblock, args) {
        pblock.innerHTML = "Preview:Your input is " + args.text + ".";
    },
});

`
, 'search': // simple search / preview command (e. g. using ajax)
`// a simple search template
CmdUtils.CreateCommand({
    name: "2example",
    description: "Commence DuckGoGo search.",
    icon: "http://www.duckduckgo.com/favicon.ico",
    execute: function execute(args) {   
        CmdUtils.addTab("https://duckduckgo.com/?q=" + encodeURIComponent(args.text));
    },
    preview: function preview(pblock, args) {
        var url = "https://duckduckgo.com/html?q=" + encodeURIComponent(args.text);
        CmdUtils.ajaxGet(url, function(data) {
            pblock.innerHTML = jQuery("#links", data).html(); 
        });
    },
});

`
, 'enhanced-search': // enhanced search / preview command
`// search template
CmdUtils.makeSearchCommand({
  name: ["3example"],
  description: "Searches quant.com",
  icon: "🔎",
  url: "https://www.qwant.com/?t=all&q={QUERY}",
  prevAttrs: {zoom: 0.75, scroll: [100/*x*/, 0/*y*/], anchor: ["c_13", "c_22"]},
});

`
, 'options': // command with options
`
// template to demonstrate preview options, browse them with Ctrl+up/down arrows
CmdUtils.CreateCommand({
    name: ["4example", "optionexample"],
    execute: function execute(args) {
      	CmdUtils.setTip("chosen option idx:"+args._opt_idx+" chosen option val:"+args._opt_val+"<hr>");
    },
    preview: function preview(pblock, args) {
        pblock.innerHTML  = "use Ctrl+↓/↑ to choose an option, then press Enter";
        pblock.innerHTML += "<div data-option data-option-value=one>option 1</div>";
        pblock.innerHTML += "<div data-option data-option-value=two>option 2</div>";
        pblock.innerHTML += "<div data-option data-option-value=thr>option 3</div>";
        pblock.innerHTML += "<div data-option data-option-value=fou>option 4</div>";
        pblock.innerHTML += "<div data-option data-option-value=fiv>option 5</div>";
    },
});
`
	};


// inserts stub (example command)
function insertExampleStub() {
    var stub = stubs[this.id];
    editor.replaceRange(stub, editor.getCursor());
    saveScripts();
    return false;
}

// evaluates and saves scripts from editor
async function saveScripts(instance, changeObj) {
    // console.log("saveScripts",instance);
    // console.log("saveScripts",changeObj);

    var customscripts = editor.getValue();
    // download link
    var a = document.getElementById("download");
    var file = new Blob([customscripts], {type: "text/plain"});
    a.href = URL.createObjectURL(file);
    a.download = "ubichr-custom-scripts-"+(new Date()).toISOString().substr(0,10)+".js";

    if (changeObj && changeObj.origin=='setValue') return; // save on user input
    if (customscripts.trim()=="") {
        console.trace();
        if (confirm("Are your sure you want remove all your scripts?")) {
            editor.setValue("// removed all the scripts");
        } else {
            await chrome.storage.local.get('customscripts', function(result) { editor.setValue(result.customscripts || "// storage was empty, sorry"); });
        }
    }

    // save
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({'customscripts': customscripts});
	}
	    
    $("#info").html("");
    // eval
    try {
        $("#info").html("evaluated!");
        eval(customscripts);
        CmdUtils.unloadCustomScripts(); 
        CmdUtils.loadCustomScripts(); 
    } catch (e) {
        var m = e.message;
        var l = /anonymous\>:(\d+)\:/.exec(e.stack);
        if (l != null) {
            l = l[1];
            m += " <a href=# id=linerror>LINE:"+l+"</a>";
        }
        console.log(e)
        console.log(l);
        $("#info").html("<span style='background-color:red'>"+m+"</span>");
        if (l != null) $("a#linerror").click( ()=>{ editor.setCursor({line:l,ch:0}); });
    }
}

function saveCursorPos() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({'cursor': editor.getCursor()});
	}
}

// initializes editor
editor = CodeMirror.fromTextArea( document.getElementById("code"), {
    mode: "javascript",
    theme: "ambiance",
    lineWrapping: true,
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    gutters: ["CodeMirror-lint-markers"],
    lint:true,
    autofocus:true,
    extraKeys: {
       'Ctrl-/': 'toggleComment'
    }
});

editor.on("cursorActivity", saveCursorPos);
editor.on("change", saveScripts);
saveScripts(null, {origin:'setValue'}); // prepare initial download

Object.keys(stubs).forEach( k=> {
    var s = $(`<a href=# id='${k}'>${k}</a>`);
    $(s).click( insertExampleStub );
	$("#stubs").append( s );
});
$("#stubs > a:not(:last)").after(" - ");

// load scripts
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('customscripts', function(result) {
        editor.setValue(result.customscripts || "// jshint esversion: 8\n// check out examples and HELP in lower right corner!");
    });
    chrome.storage.local.get('cursor', function(result) {
        editor.setCursor(result.cursor || {line:0,ch:0});
    });
}