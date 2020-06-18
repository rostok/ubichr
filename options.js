// jshint esversion: 6

// inserts stub (example command)
function insertExampleStub() {

    var stubs = {
  'insertnotifystub': // simple notify command 
`/* This is a template command. */
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
, 'insertsearchstub': // simple search / preview command (e. g. using ajax)
`/* This is a template command. */
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
, 'insertenhsearchstub': // enhanced search / preview command
`/* This is a template command. */
CmdUtils.makeSearchCommand({
  name: ["3example"],
  description: "Searches quant.com",
  author: {name: "Your Name", email: "your-mail@example.com"},
  icon: "https://www.qwant.com/favicon-152.png?1503916917494",
  url: "https://www.qwant.com/?q={QUERY}&t=all",
  prevAttrs: {zoom: 0.75, scroll: [100/*x*/, 0/*y*/], anchor: ["c_13", "c_22"]},
});

`
    };

    var stub = stubs[this.id];
    editor.replaceRange(stub, editor.getCursor());

    //editor.setValue( stub + editor.getValue() );
    saveScripts();
    return false;
}

// evaluates and saves scripts from editor
function saveScripts() {
    var customscripts = editor.getValue();
    // save
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({'customscripts': customscripts});
        chrome.storage.local.set({'cursor': editor.getCursor()});
	}
	    
    // eval
    try {
        $("#info").html("evaluated!");
        eval(customscripts);
        CmdUtils.unloadCustomScripts(); 
        CmdUtils.loadCustomScripts(); 
    } catch (e) {
        $("#info").html("<span style='background-color:red'>"+e.message+"</span>");
    }
    
    // download link
    var a = document.getElementById("download");
    var file = new Blob([customscripts], {type: "text/plain"});
    a.href = URL.createObjectURL(file);
    a.download = "ubichr-custom-scripts-"+(new Date()).toISOString().substr(0,10)+".js";
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
});

editor.on("blur", saveScripts);
editor.on("change", saveScripts);

$("#insertnotifystub").click( insertExampleStub );
$("#insertsearchstub").click( insertExampleStub );
$("#insertenhsearchstub").click( insertExampleStub );

// load scripts
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('customscripts', function(result) {
        editor.setValue(result.customscripts || "");
        saveScripts();
    });
    chrome.storage.local.get('cursor', function(result) {
        editor.setCursor(result.cursor || {line:0,ch:0});
    });
}