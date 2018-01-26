    function insertCommandStub() {
    	var stub = 
`/* This is a template command. */
CmdUtils.CreateCommand({
  name: "example",
  description: "A short description of your command.",
  author: "Your Name",
  icon: "http://www.mozilla.com/favicon.ico",
  execute: function execute(args) {
    alert("EX:You input: " + args.text, this);
  },
  preview: function preview(pblock, args) {
    pblock.innerHTML = "PV:Your input is " + args.text + ".";
  },
});

`;
    	editor.setValue( stub + editor.getValue() );
    	saveScripts();
    }

    function saveScripts() {
    	var customscripts = editor.getValue();
    	// save
    	if (typeof chrome !== 'undefined' && chrome.storage) 
    		chrome.storage.local.set({'customscripts': customscripts});
    	
    	// eval
        try {
            $("#info").html("evalueated!").fadeIn(0).fadeOut(5000);
            eval(customscripts); 
        } catch (e) {
            $("#info").fadeOut(0).fadeIn(0).html("<pre>"+e.stack+"</pre>");
        }	

        // download link
        var a = document.getElementById("download");
        var file = new Blob([customscripts], {type: "text/plain"});
        a.href = URL.createObjectURL(file);
        a.download = "custom.js";
    }

	editor = CodeMirror.fromTextArea( document.getElementById("code"), {
		mode: "javascript",
		theme: "ambiance",
		lineWrapping: true,
		lineNumbers: true,
		styleActiveLine: true,
		matchBrackets: true
	});

	editor.on("blur", saveScripts);
	editor.on("change", saveScripts);

    $("#insertstub").click( insertCommandStub );	

    // load scrtips
    if (typeof chrome !== 'undefined' && chrome.storage) {
    	chrome.storage.local.get('customscripts', function(result) {
            editor.setValue(result.customscripts || "");
            saveScripts();
        });
    }
