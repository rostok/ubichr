// jshint esversion: 6

// inserts simple notify command 
function insertNotifyStub() {
    var stub = 
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

`;
    editor.replaceRange(stub, editor.getCursor());
    saveScripts();
}

// inserts simple search / preview command
function insertSearchStub() {
    var stub = 
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

`;
    editor.replaceRange(stub, editor.getCursor());

    //editor.setValue( stub + editor.getValue() );
    saveScripts();
}

// evaluates and saves scripts from editor
function saveScripts() {
    var customscripts = editor.getValue();
    // save
    if (typeof chrome !== 'undefined' && chrome.storage) 
        chrome.storage.local.set({'customscripts': customscripts});
    
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
    a.download = "custom.js";
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

$("#insertnotifystub").click( insertNotifyStub );	
$("#insertsearchstub").click( insertSearchStub );	

// load scrtips
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('customscripts', function(result) {
        editor.setValue(result.customscripts || "");
        saveScripts();
    });
}
