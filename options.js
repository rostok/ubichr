	function saveScripts() {
    	var customscripts = $("#content").val();
    	// save
    	if (typeof chrome !== 'undefined' && chrome.storage) 
			chrome.storage.local.set({'customscripts': customscripts});
		
		// eval
        try {
            eval(customscripts); 
            $("#info").html("evalueated!").fadeIn(0).fadeOut(5000);
        } catch (e) {
            if (e instanceof SyntaxError) {
                $("#info").fadeIn(0).html(e.message);
            }
        }	
	}

	$("#content").bind('input propertychange', saveScripts );
	$("#savebutton").click( saveScripts );	

    if (typeof chrome !== 'undefined' && chrome.storage) {
    	chrome.storage.local.get('customscripts', function(result) {
    		$("#content").val(result.customscripts || "");
	    });
	}
