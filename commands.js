// BuildIn CmdUtils command definitions
// jshint esversion: 6 

// tinyurl 
// https://tinyurl.com/api-create.php?url=https://admin.google.com/ac/users/4349123432/profile

// api directory search
CmdUtils.makeSearchCommand({
    name: "api-search",
    description: "searches api directory at programmableweb.com",
    icon: "https://www.programmableweb.com/sites/default/files/pwfav.png",
    url: "https://www.programmableweb.com/category/all/apis?keyword={QUERY}",
    preview: function preview(pblock, args) {
        $(pblock).loadAbs(this.url.replace("{QUERY}",encodeURIComponent(args.text))+
                          " div.view-display-id-directory_search > div.view-content > table", ()=>{
          $("table",pblock).attr("border",1);
          $('th:nth-child(4)',pblock).html("F");
        });
    },
});

// runs ubichr unit tests
CmdUtils.CreateCommand({
    name: "unittests",
    description: "perform UbiChr unit tests for builtin commands",
    icon: "res/icon-128.png",
    execute: function execute(args) {
        CmdUtils.addTab("tests.html");
    },
});

// exceptions are stored in CmdUtils.lastError
CmdUtils.CreateCommand({
    name: "lasterror",
    icon: "res/icon-128.png",
    description: "show last UbiChr error, clear on execute",
    execute: function (args) {
        CmdUtils.lastError = "";
    },
    preview: function preview(pblock, args) {
        CmdUtils.setTip(args._cmd.description);
        pblock.innerHTML = (CmdUtils.lastError || "").replace("\n", "<br>");
        if (pblock.innerHTML != "") window.setTimeout(() => {
            CmdUtils.setResult("");
            CmdUtils.setTip("");
        }, 125);
    },
});
  
// shows command source in preview
CmdUtils.CreateCommand({
    name: "command-source",
    description: "dumps command source",
    icon: "res/icon-128.png",
    execute: (args) => {
        var d = CmdUtils.dump(args.text);
        CmdUtils.setClipboard(d);
        CmdUtils.setTip("copied");
    },
    preview: (pblock, args) => {
        var d = CmdUtils.dump(args.text);
        d = new Option(d).innerHTML;
        pblock.innerHTML = "<pre>"+d;
    },
});

// fills gist.github.com form without submitting
// injects code via new script element https://stackoverflow.com/a/9517879/2451546
CmdUtils.CreateCommand({
    name: "command-gist",
    description: "prefill gist form with a command source without submitting",
    icon: "res/icon-128.png",
    execute: (args) => {
        var c = CmdUtils.getcmd(args.text);
        if (c === undefined) return;
        var d = CmdUtils.dump(args.text);
        d = JSON.stringify(d);
        d = JSON.stringify(`
                var i = setInterval( ()=>{
                                          var cm = document.getElementsByClassName("CodeMirror")[0]; 
                                          if (cm && cm.CodeMirror) {
                                              cm.CodeMirror.setValue(${d});
                                              document.querySelector("input[name='gist[description]']").value = "${c.name} command for UbiChr";
                                              document.querySelector("input[name='gist[contents][][name]']").value = "${c.name}.ubichr.js";
                                              clearInterval(i);
                                          }
                                       }, 500);
        `);
        CmdUtils.gist_command_callback = (tab) => {
            if (tab.pendingUrl!='https://gist.github.com/') return;
            chrome.tabs.onCreated.removeListener( CmdUtils.gist_command_callback );
            CmdUtils.gist_command_callback = null;
            chrome.tabs.executeScript( tab.id, { code: `
                  var script = document.createElement('script');
                  script.textContent = ${d};
                   (document.head || document.documentElement).append(script);
                  script.remove();
           `});
       };
       chrome.tabs.onCreated.addListener( CmdUtils.gist_command_callback );
       CmdUtils.addTab("https://gist.github.com/");
    },
    preview: (pblock, args) => {
        CmdUtils.setTip("execute to paste this into gist.github.com");
        var d = CmdUtils.dump(args.text);
        d = new Option(d).innerHTML;
        pblock.innerHTML = `<pre>${d}</pre>`;
    },
});

CmdUtils.CreateCommand({
    name: "amazon-search",
    description: "Search Amazon for books matching:",
    author: {},
    icon: "http://www.amazon.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Amazon for books matching:",
    execute: CmdUtils.SimpleUrlBasedCommand('https://www.amazon.com/s/ref=nb_ss_gw?url=search-alias%3Dstripbooks&field-keywords={text}')
});

CmdUtils.CreateCommand({
    name: "answers-search",
    description: "Search Answers.com for:",
    author: {},
    icon: "http://www.answers.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Answers.com for:",
    execute: CmdUtils.SimpleUrlBasedCommand('https://www.answers.com/search?q={text}')
});

CmdUtils.CreateCommand({
    name: "ask-search",
    description: "Search Ask.com for the given words",
    author: {},
    icon: "http://www.ask.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Ask.com for the given words:",
    execute: CmdUtils.SimpleUrlBasedCommand('https://www.ask.com/web?q={text}')
});

CmdUtils.CreateCommand({
    name: "bugzilla",
    description: "Perform a bugzilla search for",
    author: {},
    icon: "http://www.mozilla.org/favicon.ico",
    homepage: "",
    license: "",
    preview: "Perform a bugzilla search for",
    execute: CmdUtils.SimpleUrlBasedCommand("https://bugzilla.mozilla.org/buglist.cgi?query_format=specific&order=relevance+desc&bug_status=__open__&content={text}")
});

CmdUtils.CreateCommand({
    icon: "⮽",
    name: "close",
    takes: {},
    description: "Close the current tab",
    author: {},
    homepage: "",
    license: "",
    preview: "Close the current tab",
    execute: function (directObj) {
        CmdUtils.closeTab();
    }
});

CmdUtils.CreateCommand({
    name: "yippy",
    description: "Perform a clustered search through yippy.com",
    author: {},
    icon: "http://cdn2.hubspot.net/hubfs/2571411/YippyInc_Oct2016/favicon.png",
    homepage: "",
    license: "",
    preview: "Perform a clustered search through yippy.com",
    execute: async function execute({text}) {
            var xtoken = CmdUtils.get("http://yippy.com/");
            xtoken = jQuery("#xtoken", xtoken).val();
            CmdUtils.postNewTab("https://yippy.com/search/?v%3Aproject=clusty-new&query=kakao&xtoken="+xtoken);//, {"v:project":"clusty-new", xtoken:xtoken});
        }
});

CmdUtils.CreateCommand({
    name: "code-search",
    description: "Search any source code for the given string",
    icon: "https://searchcode.com/static/favicon.ico",
    homepage: "https://searchcode.com/",
    license: "",
    preview: "Search any source code for the given string",
    execute: CmdUtils.SimpleUrlBasedCommand(
        'https://searchcode.com/?q={text}'
    )
});

CmdUtils.CreateCommand({
    name: "cpan",
    icon: "https://metacpan.org/favicon.ico",
    description: "Search for a CPAN package information",
    homepage: "",
    author: {
        name: "Cosimo Streppone",
        email: "cosimo@cpan.org"
    },
    license: "",
    preview: "Search for a CPAN package information",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://metacpan.org/search?q={text}"
    )
});

CmdUtils.CreateCommand({
    name: "currency-converter",
    description: "Convert currency using x-rates.com",
    help: "Convert currency using x-rates.com<br>Example arguments:<br><br>5000 NOK to EUR<br>5000 NOKEUR<br>NOKEUR 5000",
    author: "rostok",
    icon: "https://www.x-rates.com/favicon.ico",
    license: "",
    preview: function (pblock, directObj) {
        var curr_from, curr_to;
        var currency_spec = directObj.text.trim().toUpperCase();
        var matches = currency_spec.match(/^([\d\.]+)\s+(\w+)\s+TO\s+(\w+)$/);
        var amount;
        if (matches && matches.length>=4) {
            amount = matches[1];
            curr_from = matches[2];
            curr_to = matches[3];
        } else {
            matches = currency_spec.match(/^([\d\.\+\-\\\/\*]+)\s+(\w{6})$/);
            if (matches && matches.length>=3) {
                amount = matches[1];
                curr_from = matches[2].substring(0,3);
                curr_to = matches[2].substring(3);
            } else {
                matches = currency_spec.match(/^(\w{6})\s+([\d\.]+)$/);
                if (!matches || matches.length<3) return;
                amount = matches[2];
                curr_from = matches[1].substring(0,3);
                curr_to = matches[1].substring(3);
            }
        }
        try {
          amount = eval(amount);
        } catch (e) {
          amount = parseFloat(amount) || 0;
        }
        jQuery(pblock).loadAbs(`https://www.x-rates.com/calculator/?from=${curr_from}&to=${curr_to}&amount=${amount} `+" span.ccOutputRslt", ()=>{
            jQuery(pblock).html(amount+" "+curr_from+" = " + jQuery(pblock).text());
        });
    },
    execute: function (directObj) {
        var curr_from, curr_to;
        var currency_spec = directObj.text.trim().toUpperCase();
        var matches = currency_spec.match(/^([\d\.]+)\s+(\w+)\s+TO\s+(\w+)$/);
        var amount;
        if (matches && matches.length>=4) {
            amount = matches[1];
            curr_from = matches[2];
            curr_to = matches[3];
        } else {
            matches = currency_spec.match(/^([\d\.]+)\s+(\w{6})$/);
            if (matches && matches.length>=3) {
                amount = matches[1];
                curr_from = matches[2].substring(0,3);
                curr_to = matches[2].substring(3);
            } else {
                matches = currency_spec.match(/^(\w{6})\s+([\d\.]+)$/);
                if (!matches || matches.length<3) return;
                amount = matches[2];
                curr_from = matches[1].substring(0,3);
                curr_to = matches[1].substring(3);
            }
        }
        CmdUtils.addTab(`https://www.x-rates.com/calculator/?from=${curr_from}&to=${curr_to}&amount=${amount}`);
    }
});

CmdUtils.CreateCommand({
    name: "dictionary",
    description: "Gives the meaning of a word.",
    author: {
        name: "Isidoros Passadis",
        email: "isidoros.passadis@gmail.com"
    },
    help: "Try issuing &quot;dictionary ubiquity&quot;",
    license: "MPL",
    icon: "https://www.dictionary.com/assets/favicon-d73532382d3943b0fef5b78554e2ee9a.png",
    execute: function ({text: text}) {
        CmdUtils.addTab("https://www.dictionary.com/browse/" + escape(text));
    },
    preview: async function define_preview(pblock, {text: text}) {
        var doc = await CmdUtils.get("https://www.dictionary.com/browse/"+encodeURIComponent(text));
        $("section#top-definitions-section", doc).parent("div").appendTo(pblock).find("button,div[role='tooltip'],div[data-save-word-tooltip]").remove();
    },
});

CmdUtils.CreateCommand({
    name: "ebay-search",
    description: "Search ebay for the given words",
    author: {},
    icon: "http://ebay.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search ebay for the given words",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://www.ebay.com/sch/i.html?_nkw={text}"
    )
});

CmdUtils.CreateCommand({
    name: "flickr",
    description: "Search photos on Flickr",
    author: {},
    icon: "http://flickr.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search photos on Flickr",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://www.flickr.com/search/?q={text}&w=all"
    )
});

CmdUtils.CreateCommand({
    name: "gcalculate",
    description: "Examples: 3^4/sqrt(2)-pi,  3 inch in cm,  speed of light,  0xAF in decimal (<a href=\"http://www.googleguide.com/calculator.html\">Command list</a>)",
    author: {},
    icon: "http://www.google.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Examples: 3^4/sqrt(2)-pi,  3 inch in cm,  speed of light,  0xAF in decimal (<a href=\"http://www.googleguide.com/calculator.html\">Command list</a>)",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://www.google.com/search?q={text}&ie=utf-8&oe=utf-8"
    )
});

CmdUtils.CreateCommand({
    names: ["help", "command-list"],
    description: "execute to list all commands<br>or type <pre>help command-name</pre> for specific command help",
    help: "Congratulations! Now you know how to help yourself!",
    icon: "res/icon-128.png",
    preview: function preview(pblock, {text, _cmd}) {
        pblock.innerHTML = this.description;
          var c = CmdUtils.getcmdpart(text.trim());
        if (c!=null) {
            var o = "";
            o += c.names.join(", ");
            o += "<hr>";
            o += (c.help || c.description)+"<br>";
            if (c.external) o += "WARNING! this command relies on external script!<br>";
            o += "<br><br>";
            if (typeof c.author !== 'undefined') o += "author: "+(c.author.name||c.author)+"<br>";
            if (typeof c.homepage !== 'undefined' && c.homepage!="") o += "homepage : <a target=_blank href="+c.homepage+">"+c.homepage +"</a><br>";
            pblock.innerHTML = o;
        }
    },
    execute: CmdUtils.SimpleUrlBasedCommand("help.html")
});

CmdUtils.CreateCommand({
    names: ["debug-popup"],
    description: "Opens UbiChr popup in a tab",
    icon: "res/icon-128.png",
    execute: CmdUtils.SimpleUrlBasedCommand("popup.html")
});

CmdUtils.CreateCommand({
    names: ["debug-popup-editor","debug-sandbox"],
    description: "Opens UbiChr popup in a tab and with commands editor",
    icon: "res/icon-128.png",
    execute: CmdUtils.SimpleUrlBasedCommand("debugpopup.html")
});

CmdUtils.CreateCommand({
    names: ["reload-ubiquity", "restart-ubiquity"],
    description: "Reloads Ubiquity extension",
    icon: "res/icon-128.png",
    preview: "reloads Ubiquity extension",
    execute: ()=>{
        chrome.runtime.reload();
    }
});

CmdUtils.makeSearchCommand({
    name: ["image-search","gimages"],
    timeout: 1000,
    author: {name: "Federico Parodi", email: "getimages@jimmy2k.it"},
    contributor: "satyr,rostok",
    homepage: "http://www.jimmy2k.it/getimagescommand",
    license: "MPL",
    icon: "https://support.google.com/favicon.ico",
    description: "Browse pictures from Google Images.",
    url: "https://www.google.com/search?tbm=isch&q={QUERY}",
    preview: function gi_preview(pblock, args) {
      if (!args.text) { pblock.innerText = 'no args'; return; }
      pblock.innerHTML = "";
      var options = {
        data: {q: args.text, start: 0, count:10, searchType:"image", key:args._cmd.key, cx:args._cmd.cx}, 
        url: "https://customsearch.googleapis.com/customsearch/v1",
        error: xhr => {
          pblock.innerHTML += `<a target=_blank href='${options.url}/?q=${options.data.q}&start=${options.data.start}&searchType=${options.data.searchType}&key=${options.data.key}&cx=${options.data.cx}'>link</a>`;
          pblock.innerHTML += `<em class=error>${xhr.status} ${xhr.statusText}</em>`;
          pblock.innerHTML += `<em class=error><div><pre>${JSON.stringify(xhr.responseJSON,0,4)}</pre></div></em>`;
          pblock.innerHTML += JSON.stringify(options,0,4);
        },
        success: (json, status, xhr) => {
          var info = "";
          json
          .items.sort((a,b)=>a.image.thumbnailHeight-b.image.thumbnailHeight)
          .forEach(item => {
            info += `<a target=_blank href='${item.link}'><img width=102 src='${item.image.thumbnailLink}'></a>`;
          });
          // info = "<pre>"+JSON.stringify(json.items,0,4);
          pblock.innerHTML += info;
          
          $(pblock).on('scroll', (e)=>{
            var elem = $(e.currentTarget);
            if (options.data.start<240 && CmdUtils.popupWindow.ubiq_last_preview_cmd==args._cmd && elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
              options.data.start+=10;
              CmdUtils.jQuery.ajax(options);
            }
          });
          
        },
      };
      if (args._cmd.key !== undefined && args._cmd.cx !== undefined) {
          for (options.data.start=0; options.data.start<30; options.data.start+=10) CmdUtils.jQuery.ajax(options);
      } else {
            pblock.innerHTML = `
          To get the preview you need to obtain key/cx API credentials here:<p>
          <a target=_blank href="https://developers.google.com/custom-search/v1/introduction">google_cse_api_key</a><br>
          <a target=_blank href="https://support.google.com/programmable-search/answer/2649143">google_cse_api_id</a><p>
          Afterward paste them using 'edit' command like this:
          <pre>  CmdUtils.getcmd("gimages").key = "your-key";\n  CmdUtils.getcmd("gimages").cx = "your-search-engine-id";</pre>
          `;
      }
    }
});
  
CmdUtils.CreateCommand({
    name: ["imdb", "imdb-movies"],
    description: "Searches for movies on IMDB. Dots are replaced with spaces, if last word is a year (may be in brackets) it narrows down results",
    author: {},
    icon: "http://www.imdb.com/favicon.ico",
    homepage: "",
    license: "",
    timeout: 250,
    preview: async function define_preview(pblock, args) {
        pblock.innerHTML = "Searches for movies on IMDB";
        args.text = args.text.replace(/[\.\\\/\s]+/g," ").trim();
        year = parseInt(args.text.replace(/[(\s)]/g," ").trim().split(/\s+/).slice(-1));
        var release_date = "";
        if(year>1900 && year<2050) {
          args.text = args.text.split(/[(\s]+/).slice(0,-1).join(" ");
          release_date = "&release_date="+year;
        }
        if (args.text.trim()!="") {
          jQuery(pblock).loadAbs("https://www.imdb.com/search/title?title="+encodeURIComponent(args.text)+release_date+" div.lister-list", ()=>{
            jQuery(pblock).find("div.ratings-user-rating").remove();
            jQuery(pblock).find("p.sort-num_votes-visible").hide();
            jQuery(pblock).find("span.lister-item-index.unbold.text-primary").remove();
            jQuery(pblock).find("div.ratings-metascore").remove();
            jQuery(pblock).find(".lister-top-right").remove();
            jQuery(pblock).find("div.lister-item").each((i,e)=>{
                jQuery(e).attr("data-option","");
                jQuery(e).attr("data-option-value", jQuery(e).find("a").first().attr("href"));
              
                var img = "<img style='float:left' aling=bottom src='"+jQuery(e).find("img.loadlate").first().attr("loadlate")+"'>";
                var title = "<a href='"+jQuery(e).find("a").first().attr("href")+"'>"+jQuery(e).find("h3").text().trim()+"</a> ";
                var info = "<span>"    +jQuery(e).find(".runtime").text()+" | "
                                    +jQuery(e).find(".genre").text()+" | "
                                    +"<span style='color:yellow'>"+jQuery(e).find(".ratings-imdb-rating").text()+"</span>"
                                    +"</span>";
                var syno = "<br><span>"+jQuery(e).find(".ratings-bar").next("p").text()+"</span>";
                jQuery(e).html("<div style='clear:both;overflow-y:auto;'>"+img+"<div style=''>"+ title + info + syno + "</div></div><p>");
            });
          });
        }
    },
    execute: function execute(args) {
        args.text = args.text.replace(/[\.\\\/\s]+/g," ").trim();
        var release_date = "";  
        year = parseInt(args.text.replace(/[(\s)]/g," ").trim().split(/\s+/).slice(-1));
        if(year>1900 && year<2050) {
          args.text = args.text.split(/[(\s]+/).slice(0,-1).join(" ");
          release_date = "&release_date="+year;
        }
        var opt = args._opt_val || "";
        if(opt.includes("://")) 
            CmdUtils.addTab(opt);
        else 
            CmdUtils.addTab("https://www.imdb.com/search/title?title="+encodeURIComponent(args.text)+release_date);
    }
});

CmdUtils.CreateCommand({
    name: "imdb-old",
    description: "Searches for movies on IMDb",
    author: {},
    icon: "http://www.imdb.com/favicon.ico",
    homepage: "",
    license: "",
    preview: async function define_preview(pblock, {text: text}) {
        pblock.innerHTML = "Searches for movies on IMDb";
        text = text.replace(/[\.\\\/\s]+/g," ").trim();
        if (text.trim()!="") 
        jQuery(pblock).loadAbs("https://www.imdb.com/find?q="+encodeURIComponent(text)+"&s=tt&ref_=fn_al_tt_mr table.findList", ()=>{
            jQuery(pblock).find(".findResult").each((i,e)=>{
                jQuery(e).attr("data-option","");
                jQuery(e).attr("data-option-value", jQuery(e).find("a").first().attr("href"));
            });
        });
    },
    execute: function execute(args) {
        args.text = args.text.replace(/[\.\\\/\s]+/g," ").trim();
        var opt = args._opt_val || "";
        if(opt.includes("://")) 
            CmdUtils.addTab(opt);
        else {
            var old = CmdUtils.SimpleUrlBasedCommand("https://www.imdb.com/find?s=tt&ref_=fn_al_tt_mr&q={text}");
            old(args);
        }
    },
    old_execute: CmdUtils.SimpleUrlBasedCommand(
        "https://www.imdb.com/find?s=tt&ref_=fn_al_tt_mr&q={text}"
    )
});

//
// From Ubiquity feed:
// https://ubiquity.mozilla.com/herd/all-feeds/9b0b1de981e80b6fcfee0659ffdbb478d9abc317-4742/
//
// Modified to get the current window domain
//
CmdUtils.CreateCommand({
    name: "isdown",
    icon: "http://downforeveryoneorjustme.com/favicon.ico",
    description: "Check if selected/typed URL is down",
    homepage: "http://www.andyfilms.net",
    author: {
        name: "Andy Jarosz",
        email: "andyfilms1@yahoo.com"
    },
    license: "GPL",
    preview: function (pblock, args) {
        //ubiq_show_preview(urlString);
        //searchText = jQuery.trim(args.text);
        var host = args.text;
        if (host.length < 1) {
            pblock.innerHTML = "Checks if URL is down";
            return;
        }
        var previewTemplate = "Press Enter to check if <b>" + host + "</b> is down.";
        pblock.innerHTML = previewTemplate;
    },
    execute: async function (args) {
        var url = "https://api-prod.downfor.cloud/httpcheck/{QUERY}";
        var query = args.text;
        pblock.innerHTML = "checking "+query;
        // Get the hostname from url
        if (!query) {
            var host = window.location.href;
            var url_comp = host.split('/');
            query = url_comp[2];
        }
        var urlString = url.replace("{QUERY}", query);
        ajax = await CmdUtils.get(urlString);
        {
            if (!ajax) return;
            if (ajax.isDown) {
                pblock.innerHTML = `<p style="font-size: 18px;">It\'s <b>not</b> just you. The site <u>${query}</u> is <b>down!</b></p>`;
            } else {
                pblock.innerHTML = `<p style="font-size: 18px;">It\'s just you. The site <u>${query}</u> is <b>up!</b></p>`;
            }
        };
    }
});

CmdUtils.CreateCommand({
    name: "lastfm",
    description: "Listen to some artist radio on Last.fm",
    author: {},
    icon: "https://www.last.fm/static/images/favicon.ico",
    homepage: "",
    license: "",
    preview: "Listen to some artist radio on Last.fm",
    execute: CmdUtils.SimpleUrlBasedCommand("https://www.last.fm/music/{text}/+similar")
});

/// since June 2018 Google Maps no longer work without license key
CmdUtils.CreateCommand({
    name: "maps",
    description: "Shows a location on the map, iframe version",
    icon: "http://www.google.com/favicon.ico",
    execute: function({text}) {
        if (text.substr(-2)=="-l") text = text.slice(0,-2);
        CmdUtils.addTab("https://maps.google.com/maps?q="+encodeURIComponent(text));
    },
    preview: function preview(pblock, {text}) {
        if (text=="") {
            pblock.innerHTML = "show objects or routes on google maps.<p>syntax: <pre>\tmaps [place]\n\tmaps [start] to [finish]</pre>"; 
            return;
        }
        pblock.innerHTML = `
                <div class="mapouter">
                    <div class="gmap_canvas">
                        <iframe width="540" height="505" id="gmap_canvas" src="https://maps.google.com/maps?q=${encodeURIComponent(text)}&t=&z=13&ie=UTF8&iwloc=&output=embed" 
                        frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>
                    </div>
                <style>
                    .mapouter{text-align:right;height:505px;width:540px;}
                    .gmap_canvas {overflow:hidden;background:none!important;height:504px;width:540px;}
                </style>
                </div>`;
    },
});

CmdUtils.CreateCommand({
    name: "oldmaps",
    description: "Shows a location on the map",
    author: {},
    icon: "http://www.google.com/favicon.ico",
    homepage: "",
    timeout: 600,
    license: "",
    external: true,
    requirePopup: "https://maps.googleapis.com/maps/api/js?sensor=false",
    preview: async function mapsPreview(previewBlock, args) {
        var GM = CmdUtils.popupWindow.google.maps;
        
        // brighten the maps and remove prompt
        var cleanup;
        cleanup = ()=>{
            $(".dismissButton",previewBlock).closest("div").remove()
            $("img",previewBlock).each((i,v)=>{ $(v).attr("src", $(v).attr("src").replace("sstyles!","sstyles!x") ); });
            setTimeout(cleanup, 100);
        };
        cleanup();
    
        // http://jsfiddle.net/user2314737/u9no8te4/
        var text = args.text.trim();
        if (text=="") {
            previewBlock.innerHTML = "show objects or routes on google maps.<p>syntax: <pre>\tmaps [place] [-l]\n\tmaps [start] to [finish] [-l]\n\n -l narrow search to your location</pre>"; 
            return;
        }
        cc = "";
        if (text.substr(-2)=="-l") {
            var geoIP = await CmdUtils.get("https://freegeoip.net/json/"); // search locally
            var cc = geoIP.country_code || "";
            cc = cc.toLowerCase();
            text = text.slice(0,-2);
        }
        from = text.split(' to ')[0];
        dest = text.split(' to ').slice(1).join();
        var A = await CmdUtils.get("https://nominatim.openstreetmap.org/search.php?q="+encodeURIComponent(from)+"&polygon_geojson=1&viewbox=&format=json&countrycodes="+cc);
        if (!A[0]) return;
        CmdUtils.deblog("A",A[0]);
        previewBlock.innerHTML = '<div id="map-canvas" style="width:540px;height:505px"></div>';

        var pointA = new GM.LatLng(A[0].lat, A[0].lon);
        var myOptions = {
            zoom: 10,
            center: pointA
        };
        var map = new GM.Map(previewBlock.ownerDocument.getElementById('map-canvas'), myOptions);
        var markerA = new GM.Marker({
            position: pointA,
            title: from,
            label: "A",
            map: map
        });

        map.data.addGeoJson(geoJson = {"type": "FeatureCollection", "features": [{ "type": "Feature", "geometry": A[0].geojson, "properties": {} }]});
        if (dest.trim()!='') {
            var B = await CmdUtils.get("https://nominatim.openstreetmap.org/search.php?q="+encodeURIComponent(dest)+"&polygon_geojson=1&viewbox=&format=json");
            if (!B[0]) { 
                map.fitBounds( new GM.LatLngBounds( new GM.LatLng(A[0].boundingbox[0],A[0].boundingbox[2]), new GM.LatLng(A[0].boundingbox[1],A[0].boundingbox[3]) ) );
                map.setZoom(map.getZoom()-1);
                return;
            }
            CmdUtils.deblog("B", B[0]);
            var pointB = new GM.LatLng(B[0].lat, B[0].lon);
            // Instantiate a directions service.
            directionsService = new GM.DirectionsService();
            directionsDisplay = new GM.DirectionsRenderer({
                map: map
            });
            this.markerB = new GM.Marker({
                position: pointB,
                title: dest,
                label: "B",
                map: map
            });

            // get route from A to B
            directionsService.route({
                origin: pointA,
                destination: pointB,
                avoidTolls: true,
                avoidHighways: false,
                travelMode: GM.TravelMode.DRIVING
            }, function (response, status) {
                if (status == GM.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
        }
    },
    execute: function({text}) {
        if (text.substr(-2)=="-l") text = text.slice(0,-2);
        CmdUtils.addTab("https://maps.google.com/maps?q="+encodeURIComponent(text));
    }
});

CmdUtils.CreateCommand({
    name: "msn-search",
    description: "Search MSN for the given words",
    author: {},
    icon: "http://www.msn.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Searches MSN for the given words",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://www.bing.com/search?q={text}"
    )
});

CmdUtils.CreateCommand({
    icon: "🗔",
    name: "new-tab",
    description: "Open a new tab (or window) with the specified URL",
    author: {},
    homepage: "",
    license: "",
    preview: "Open a new tab (or window) with the specified URL",
    execute: function ({text}) {
        if (!text.match('^https?://')) text = "https://"+text;
        CmdUtils.addTab(text);
    }
});

CmdUtils.CreateCommand({
    icon: "🖨️",
    name: "print",
    description: "Print the current page",
    preview: "Print the current page",
    execute: function (directObj) {
        chrome.tabs.executeScript( { code:"window.print();" } );
    }
});

CmdUtils.CreateCommand({
    names: ["search", "google-search"],
    description: "Search on Google for the given words",
    author: {},
    icon: "http://www.google.com/favicon.ico",
    homepage: "",
    license: "",
    preview: async function define_preview(pblock, {text: text}) {
        text = text.trim();
        pblock.innerHTML = "Search on Google for "+text;
        if (text!="") {
            var doc = await CmdUtils.get("https://www.google.pl/search?q="+encodeURIComponent(text) );
            doc = jQuery("div#rso", doc)
            .find("a").each(function() { $(this).attr("target", "_blank")}).end()
            .find("cite").remove().end()
            .find(".action-menu").remove().end()
            .html();
            pblock.innerHTML = doc;
        }
    },
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://www.google.com/search?q={text}&ie=utf-8&oe=utf-8"
    )
});

// the old command for url shorteing with bit.ly is replaced with tinyurl one
CmdUtils.CreateCommand({
    names: ["shorten-url", "tiny-url"],
    icon: "https://tinyurl.com/favicon.ico",
    description: "Shorten your URLs with the least possible keystrokes",
    preview: async function (pblock, {text}) {
      var words = text.split(/\s+/);
      if (text.trim()=='') words[0]=CmdUtils.getLocation();
      pblock.innerHTML = "Shorten URL for:<br>"+words.join("<br>");
    },
    execute: function (args) {
      var pblock = args.pblock;
      var words = args.text.split(/\s+/);
      if (args.text.trim()=='') words[0]=CmdUtils.getLocation();
	  $(pblock).empty();
      words.forEach(w=>{
        CmdUtils.get(`https://tinyurl.com/api-create.php?url=${w}`, (r)=>{
          $(pblock).append(r +"<br>");
          CmdUtils.setClipboard($(pblock).text());
          CmdUtils.setTip("copied!");
        });
      });
    }
});


CmdUtils.CreateCommand({
    name: "slideshare",
    icon: "http://www.slideshare.com/favicon.ico",
    description: "Search for online presentations on SlideShare",
    homepage: "",
    author: {
        name: "Cosimo Streppone",
        email: "cosimo@cpan.org"
    },
    license: "",
    preview: "Search for online presentations on SlideShare",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://www.slideshare.net/search/slideshow?q={text}&submit=post&searchfrom=header&x=0&y=0"
    )
});

CmdUtils.CreateCommand({
    name: "stackoverflow-search",
    description: "Searches questions and answers on stackoverflow.com",
    author: {
        name: "Cosimo Streppone",
        email: "cosimo@cpan.org"
    },
    icon: "http://stackoverflow.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Searches questions and answers on stackoverflow.com",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://stackoverflow.com/search?q={text}"
    )
});

CmdUtils.CreateCommand({
    name: "torrent-search",
    description: "Search PirateBay, RARBG, 1337x, torrentz2",
    icon: "https://thepiratebay.org/favicon.ico",
    author: {
        name: "Axel Boldt",
        email: "axelboldt@yahoo.com"
    },
    homepage: "http://math-www.uni-paderborn.de/~axel/",
    license: "Public domain",
    preview: "Search for torrent on PirateBay, RARBG, 1337x, torrentz2",
    execute: function (directObj) {
        var search_string = encodeURIComponent(directObj.text);
        CmdUtils.addTab("https://thepiratebay.org/search.php?q=" + search_string);
        CmdUtils.addTab("https://rarbgmirror.org/torrents.php?search=" + search_string);
        CmdUtils.addTab("https://1337x.to/search/" + search_string + '/test/');
        CmdUtils.addTab("https://isohunt.nz/torrent/?ihq=" + search_string);
    }
});

// -----------------------------------------------------------------
// TRANSLATE COMMANDS
// -----------------------------------------------------------------

const MS_TRANSLATOR_LIMIT = 1e4,
    MS_LANGS = {},
    MS_LANGS_REV = {
        ar: "Arabic",
        bg: "Bulgarian",
        ca: "Catalan",
        cs: "Czech",
        da: "Danish",
        nl: "Dutch",
        en: "English",
        et: "Estonian",
        fi: "Finnish",
        fr: "French",
        de: "German",
        el: "Greek",
        he: "Hebrew",
        hi: "Hindi",
        hu: "Hungarian",
        id: "Indonesian",
        it: "Italian",
        ja: "Japanese",
        ko: "Korean",
        lv: "Latvian",
        lt: "Lithuanian",
        no: "Norwegian",
        pl: "Polish",
        pt: "Portuguese",
        ro: "Romanian",
        ru: "Russian",
        sk: "Slovak",
        sl: "Slovenian",
        es: "Spanish",
        sv: "Swedish",
        th: "Thai",
        tr: "Turkish",
        uk: "Ukrainian",
        vi: "Vietnamese",
        "zh-CN": "Chinese Simplified",
        "zh-TW": "Chinese Traditional"
    };

for (let code in MS_LANGS_REV) MS_LANGS[code] = MS_LANGS_REV[code];

function msTranslator(method, params, back) {
    params.to = params.to || "en";
    params.appId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + new Date % 10;
    return CmdUtils.jQuery.ajax({
        url: "https://api.microsofttranslator.com/V2/Ajax.svc/" + method,
        data: params,
    });
}

CmdUtils.CreateCommand({
    name: "translate",
    description: "Translates from one language to another.",
    icon: "http://www.microsoft.com/en-us/translator/wp-content/themes/ro-translator/img/banner-app-icon.png",
    help: '\
    You can specify the language to translate to,\
    and the language to translate from.\
    For example, try issuing "translate mother from english to chinese".\
    If you leave out the languages, it will try to guess what you want.\
    It works on selected text in any web page,\
    but there&#39;s a limit (a couple of paragraphs)\
    to how much it can translate a selection at once.\
    If you want to translate a lot of text, leave out the input and\
    it will load\
    <a href="https://www.microsofttranslator.com">Bing Translator</a> toolbar.\
  ',
    author: "based on original ubiquity translate command",
    execute: async function translate_execute({text: text, _selection: _selection}) {
        var words = text.split(/\s+/);
        var dest = 'en';

        if (words.length >= 3 && words[words.length - 2].toLowerCase() == 'to') {
            dest = words.pop();
            words.pop();
            text = words.join('');
        }

        if (text && text.length <= MS_TRANSLATOR_LIMIT) {
            var T = await msTranslator("Translate", {
                contentType: "text/html",
                text: text,
                from: "",
                to: dest
            });
            T = JSON.parse(T);
            if (typeof isSelected !== 'undefined' && _selection == true) {
                CmdUtils.setSelection(T);
                CmdUtils.closePopup();
            }
        } else {
            pblock.innerHTML = "text is too short or too long. try translating <a target=_blank href=https://www.bing.com/translator/>manually</a>";
        }
    },
    preview: async function translate_preview(pblock, {text: text}) {
        var words = text.split(/\s+/);
        var dest = 'en';

        if (words.length >= 3 && words[words.length - 2].toLowerCase() == 'to') {
            dest = words.pop();
            words.pop();
            text = words.join(' ');
        }

        if (text && text.length <= MS_TRANSLATOR_LIMIT) {
            var T = await msTranslator("Translate", {
                contentType: "text/html",
                text: text,
                from: "",
                to: dest
            });
            T = JSON.parse(T);
            pblock.innerHTML = T;
        } else {
            pblock.innerHTML = "text is too short or too long<BR><BR>[" + text + "]";
        }
    },
});

CmdUtils.CreateCommand({
    name: "validate",
    icon: "https://validator.w3.org/images/favicon.ico",
    description: "Checks the markup validity of the current Web document",
    preview: async function(pblock, args) {
        jQuery(pblock).load("https://validator.w3.org/check?uri="+encodeURI(CmdUtils.getLocation())+" div#results");
    },
    execute: CmdUtils.SimpleUrlBasedCommand("https://validator.w3.org/check?uri={location}")
});

CmdUtils.CreateCommand({
    name: "wayback",
    homepage: "http://www.pendor.com.ar/ubiquity",
    author: {
        name: "Juan Pablo Zapata",
        email: "admin@pendor.com.ar"
    },
    description: "Search old versions of a site using the Wayback Machine (archive.org)",
    help: "wayback <i>sitio a buscar</i>",
    icon: "http://archive.org/favicon.ico",
    preview: function (pblock, theShout) {
        pblock.innerHTML = "Buscar versiones antiguas del sitio <b>" + theShout.text + "</b>";
    },
    execute: function (directObj) {
        CmdUtils.closePopup();
        var url = directObj.text;
        if (!url) url = CmdUtils.getLocation();
        var wayback_machine = "https://web.archive.org/web/*/" + url;
        // Take me back!
        CmdUtils.addTab(wayback_machine);
    }
});

CmdUtils.CreateCommand({
    name: "weather",
    description: "Show the weather forecast for",
    author: {},
    icon: "http://www.accuweather.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Show the weather forecast",
    execute: CmdUtils.SimpleUrlBasedCommand("https://www.wunderground.com/weather/pl/{text}")
});

CmdUtils.CreateCommand({
    name: "wikipedia",
    description: "Search Wikipedia for the given words",
    author: {},
    icon: "http://en.wikipedia.org/favicon.ico",
    homepage: "",
    license: "",
    preview: function wikipedia_preview(previewBlock, args) {
        var args_format_html = "English";
        var searchText = args.text.trim();
        if (!searchText) {
            previewBlock.innerHTML = "Searches Wikipedia in " + args_format_html + ".";
            return;
        }
        previewBlock.innerHTML = "Searching Wikipedia for <b>" + args.text + "</b> ...";

        function onerror() {
            previewBlock.innerHTML =
                "<p class='error'>" + "Error searching Wikipedia" + "</p>";
        }

        var langCode = "en";
        var apiUrl = "https://" + langCode + ".wikipedia.org/w/api.php";

        CmdUtils.ajaxGetJSON("https://" + langCode + ".wikipedia.org/w/api.php?action=query&list=search&srsearch="+searchText+"&srlimit=5&format=json", function (resp) {
            function generateWikipediaLink(title) {
                return "https://" + langCode + ".wikipedia.org/wiki/" +title.replace(/ /g, "_");
            }
            function wikiAnchor(title) {
                return "<a target=_blank href='"+generateWikipediaLink(title)+"'>"+title+"</a>";
            }
            previewBlock.innerHTML = "";
            for (var i = 0; i < resp.query.search.length; i++) {
                previewBlock.innerHTML += "<p>"+wikiAnchor(resp.query.search[i].title) + "<br>"+resp.query.search[i].snippet+"</p>";
            }
            jQuery(previewBlock).find("p").each((i,e)=>{
                jQuery(e).attr("data-option","");
                jQuery(e).attr("data-option-value", jQuery(e).find("a").first().attr("href"));
            });

        });
    },
    execute: function execute(args) {
        var opt = args._opt_val || "";
        if(opt.includes("://")) 
            CmdUtils.addTab(opt);
        else {
            var old = CmdUtils.SimpleUrlBasedCommand("https://en.wikipedia.org/wiki/Special:Search?search={text}");
            old(args);
        }
    },
    old_execute: CmdUtils.SimpleUrlBasedCommand("https://en.wikipedia.org/wiki/Special:Search?search={text}")
});

CmdUtils.CreateCommand({
    name: "yahoo-search",
    description: "Search Yahoo! for",
    author: {},
    icon: "https://s.yimg.com/rz/l/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Yahoo! for",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://search.yahoo.com/search?p={text}&ei=UTF-8"
    )
});

CmdUtils.CreateCommand({
    name: "youtube",
    description: "Search for videos on YouTube",
    author: {},
    icon: "http://www.youtube.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search for videos on YouTube",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://www.youtube.com/results?search=Search&search_query={text}"
    )
});

CmdUtils.CreateCommand({
    name: "calc",
    description: desc = "evals math expressions",
    icon: "➕",
    external: true,
    require: "https://cdnjs.cloudflare.com/ajax/libs/mathjs/3.20.1/math.min.js",
    preview: pr = function preview(previewBlock, {text}) {
        if (text.trim()!='') {
            var m = new math.parser();
            text = text.replace(/,/g,".");
            text = text.replace(/ /g,"");
            try {
                previewBlock.innerHTML = m.eval(text);
            } catch (e) {
                previewBlock.innerHTML = "eval error:"+e; // catching all errors as mathjs likes to throw them around
            }
            //CmdUtils.ajaxGet("http://api.mathjs.org/v1/?expr="+encodeURIComponent(args.text), (r)=>{ previewBlock.innerHTML = r; });
        }
        else
            previewBlock.innerHTML = desc;
        return previewBlock.innerText;
    },
    execute: function ({text}) { 
        if (text.trim()!='') {
            var m = new math.parser();
            text = text.replace(",",".");
            text = text.replace(" ","");
            try {
                text = m.eval(text);
                CmdUtils.setSelection(text); 
                CmdUtils.popupWindow.ubiq_set_input("calc "+text, false);
            } catch (e) {
                previewBlock.innerHTML = "eval error:"+e;
            }
        }
    }
});

CmdUtils.CreateCommand({
    name: "edit-ubiquity-commands",
    icon: "res/icon-128.png",
    description: "Takes you to the Ubiquity command <a href=options.html target=_blank>editor page</a>.",
    execute: function () { 
        chrome.runtime.openOptionsPage();
    }
});

CmdUtils.CreateCommand({
    name: "define",
    description: "Gives the meaning of a word, using wordnik.com.",
    help: "Try issuing &quot;define aglet&quot;",
    icon: "https://wordnik.com/img/favicon.png",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://wordnik.com/words/{text}"
    ),
    preview: function define_preview(pblock, {text: text}) {
        if (text.trim()=="") return pblock.innerHTML = this.description;
        pblock.innerHTML = "Gives the definition of the word "+text;
        $(pblock).loadAbs(`https://wordnik.com/words/${encodeURI(text)} div#define > div.active`, ()=>{
        });
    }        
});

CmdUtils.CreateCommand({
    names: ["base64decode","b64d","atob"],
    description: "base64decode",
    author: {
        name: "rostok",
    },
    license: "GPL",
    execute: function execute({text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        try{
            CmdUtils.setSelection(window.atob(text));
        } catch (e) {
        }
    },
    preview: function preview(pblock, {text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        var out = "";
        try{
            out = window.atob(text);
        } catch (e) {
            out = "error";
        }
        pblock.innerHTML = out;
    },
});

CmdUtils.CreateCommand({
    names: ["base64encode","b64e", "btoa"],
    description: "base64encode",
    author: {
        name: "rostok",
    },
    license: "GPL",
    execute: function execute({text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        try{
            CmdUtils.setSelection(window.btoa(text));
        } catch (e) {
        }
    },
    preview: function preview(pblock, {text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        var out = "";
        try{
            out = window.btoa(text);
        } catch (e) {
            out = "error";
        }
        pblock.innerHTML = out;
    },
});

CmdUtils.CreateCommand({
    icon: "🔣",
    names: ["urldecode"],
    description: "urldecode",
    author: {
        name: "rostok",
    },
    license: "GPL",
    execute: function execute({text}) {
        CmdUtils.setSelection(decodeURI(text));
    },
    preview: function preview(pblock, {text}) {
        pblock.innerHTML = decodeURI(text);
    },
});

CmdUtils.CreateCommand({
    icon: "🔣",
    names: ["urlencode"],
    description: "urlencode",
    author: {
        name: "rostok",
    },
    license: "GPL",
    execute: function execute({text}) {
        CmdUtils.setSelection(encodeURI(text));
    },
    preview: function preview(pblock, {text}) {
        pblock.innerHTML = encodeURI(text);
    },
});

CmdUtils.CreateCommand({
    icon: "🙾",
    name: "invert",
    description: "Inverts all colors on current page. Based on <a target=_blank href=https://stackoverflow.com/questions/4766201/javascript-invert-color-on-all-elements-of-a-page>this</a>.",
    execute: function execute(){
        chrome.tabs.executeScript({code:`
            (()=>{ 
            // the css we are going to inject
            var css = 'html {-webkit-filter: invert(100%);' +
                '-moz-filter: invert(100%);' + 
                '-o-filter: invert(100%);' + 
                '-ms-filter: invert(100%); }',
            
            head = document.getElementsByTagName('head')[0],
            style = document.createElement('style');
            
            if (document.body.style.backgroundColor=='') document.body.style.backgroundColor="white";
            // a hack, so you can "invert back" clicking the bookmarklet again
            if (!window.counter) { window.counter = 1;} else  { window.counter ++;
            if (window.counter % 2 == 0) { var css ='html {-webkit-filter: invert(0%); -moz-filter:    invert(0%); -o-filter: invert(0%); -ms-filter: invert(0%); }'}
             };
            
            style.type = 'text/css';
            if (style.styleSheet){
            style.styleSheet.cssText = css;
            } else {
            style.appendChild(document.createTextNode(css));
            }
            
            //injecting the css to the head
            head.appendChild(style);

            function invert(rgb) {
                rgb = Array.prototype.join.call(arguments).match(/(-?[0-9\.]+)/g);
                for (var i = 0; i < rgb.length; i++) {
                  rgb[i] = (i === 3 ? 1 : 255) - rgb[i];
                }
                return rgb;
            }
            // document.body.style.backgroundColor = "rgb("+invert(window.getComputedStyle(document.body, null).getPropertyValue('background-color')).join(",")+")";
            })();
        `})
    },
});

CmdUtils.CreateCommand({
    names: ["grep"],
    icon: "https://www.iconsdb.com/icons/download/black/search-13-32.png",
    description: "grep pages for patterns",
    author: {
        name: "rostok"
    },
    license: "MIT",
    execute: ()=> {
      CmdUtils.addTab("result.html");
    },
    preview: function preview(pblock, {text, _cmd}) {
        text = text.trim();
        if (text.length <= 2) {
            pblock.innerHTML = this.description+"<br><br>to grep make the argument longer ("+text.length+"/3)";
        } else {
            var arr = [];
            chrome.extension.getBackgroundPage().resultview = pblock.innerHTML = "";
            chrome.tabs.query({}, (t)=>{
            t.map((b)=>{
              if (b.url.match('^https?://'))
              chrome.tabs.executeScript(b.id, 
                                        {code:"document.body.innerText.toString();"}, 
                                        (ret)=>{
                                          if (typeof ret === 'undefined') return;
                                          //console.log("ret",ret);
                                          arr = arr.concat( ret[0].split(/\s/).filter(s=>s.indexOf(text)>=0) );
                                          pblock.innerHTML = arr.filter((v, i, a) => a.indexOf(v) === i).join("<br/>");
                                          chrome.extension.getBackgroundPage().resultview = pblock.innerHTML;
                                        });
            });
          });
        }
    },
});

CmdUtils.CreateCommand( {
    names: ["regexp"],
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/OOjs_UI_icon_regular-expression.svg/24px-OOjs_UI_icon_regular-expression.svg.png",
    description: "search pages with regexp /<i>param</i>/g pattern",
    author: {
        name: "rostok"
    },
    execute: ()=> {
      CmdUtils.addTab("result.html");
    },
    preview: function preview(pblock, {text, _cmd}) {
        text = text.trim();
        if (text.length <= 2) {
            pblock.innerHTML = this.description+"<br><br>to regexp make the argument longer ("+text.length+"/3)";
        } else {
            var arr = [];
            chrome.extension.getBackgroundPage().resultview = pblock.innerHTML = "";
            chrome.tabs.query({}, (t)=>{
            t.map((b)=>{
              if (b.url.match('^http'))
              chrome.tabs.executeScript(b.id, 
                                        {code:"document.body.innerText.toString();"}, 
                                        (ret)=>{
                                          if (typeof ret === 'undefined') return;
                                          var re = new RegExp(text, "gi");
                                          var m;
                                          do {
                                              m = re.exec(ret);
                                              if (m) arr = arr.concat(m[0]);
                                          } while (m);
                                          if (arr.length==0) return;
                                          arr = Array.from(new Set(arr));
                                          pblock.innerHTML = arr.map(e=>"<a data-txt='"+escape(e)+"' href=# class=chtab data-id="+b.id+">"+e+"</a>").sort().join("<br/>")+"<br>";
                                          jQuery("a.chtab", pblock).click( (e)=>{ chrome.tabs.update(jQuery(e.target).data("id"), {active: true}); } );
                                          chrome.extension.getBackgroundPage().resultview = pblock.innerHTML;
                                        });
            });
          });
        }
    },
});


CmdUtils.CreateCommand({
    names: ["grepInnerHTML"],
    icon: "https://www.iconsdb.com/icons/download/black/search-13-32.png",
    description: "grep the HTML of the pages for patterns",
    author: {
        name: "rostok"
    },
    license: "MIT",
    execute: ()=> {
      CmdUtils.addTab("result.html");
    },
    preview: function preview(pblock, {text, _cmd}) {
        text = text.trim();
        if (text.length <= 2) {
            pblock.innerHTML = this.description+"<br><br>to grep make the argument longer ("+text.length+"/3)";
        } else {
            var arr = [];
            chrome.extension.getBackgroundPage().resultview = pblock.innerHTML = "";
            chrome.tabs.query({}, (t)=>{
            t.reduce((a,b)=>{
              console.log(b.id);
              chrome.tabs.executeScript(b.id, 
                                        {code:"document.body.innerHTML.toString();"}, 
                                        (ret)=>{
                                          arr = arr.concat( ret[0].split(/\s/).filter(s=>s.indexOf(text)>=0) );
                                          pblock.innerHTML = arr.filter((v, i, a) => a.indexOf(v) === i).join("<br/>");
                                          chrome.extension.getBackgroundPage().resultview = pblock.innerHTML;
                                        });
            });
          });
        }
    },
});

CmdUtils.CreateCommand({
    names: ["links"],
    icon: "https://www.iconsdb.com/icons/download/black/search-13-32.png",
    description: "search and filter links on all tabs, case insensitive",
    author: "rostok",
    license: "MIT",
    execute: ({text, _cmd})=>{
        CmdUtils.setClipboard(_cmd.arr.join("\n"));
        CmdUtils.setTip("copied");
    },
    preview: function preview(pblock, {text, _cmd}) {
      text = text.trim().toLowerCase();
      var substrings = text.split(/\s+/);
      if (text.length <= 2) {
        pblock.innerHTML = this.description+"<br><br>to filter make the argument longer ("+text.length+"/3)";
      } else {
        _cmd.arr = [];
        chrome.extension.getBackgroundPage().resultview = pblock.innerHTML = "";
        chrome.tabs.query({lastFocusedWindow:true}, (t)=>{
        t = t.filter(t=>!t.url.startsWith("chrome:"));
        t.map(b=>{
              chrome.tabs.executeScript(b.id, 
                {code:"[...document.querySelectorAll('a')].map(a=>a.href).filter(a=>a!='');"}, 
                (ret)=>{
                if (typeof ret==='undefined') return;
                var rrr = [];
                ret.forEach(a => rrr=rrr.concat(a)); // ret is array of values for every frame !
                _cmd.arr = _cmd.arr
                            .concat( rrr.filter(s=>substrings.every(subs => s.toLowerCase().includes(subs))) )
                            .filter( (v, i, a) => a.indexOf(v) === i );
                $(pblock).html(_cmd.arr.join("<br/>")).css({"width":"540px","height":"505px","overflow-x":"hidden"});
              });
          });
        });
    }
    },
});

CmdUtils.CreateCommand({
    name: "links-open",
    description: "search and filter links on all tabs, case insensitive; open them on execute",
    author: "rostok",
    execute: function execute(args) { CmdUtils.getcmd("open").execute({text:(args._cmd.arr||[]).join(" ")});  },
    preview: CmdUtils.getcmd("links").preview
});


CmdUtils.CreateCommand({
    names: ["get-urls"],
    icon: "https://www.iconsdb.com/icons/download/black/search-13-32.png",
    description: "gets all open tab urls, add argument to filter",
    author: "rostok",
    license: "MIT",
    execute: ()=> {
      CmdUtils.addTab("result.html");
    },
    preview: function preview(pblock, {text}) {
        text = text.trim()+'';
        var arr = [];
        chrome.extension.getBackgroundPage().resultview = pblock.innerHTML = "";
        chrome.tabs.query({}, (t)=>{
          t.forEach((a)=>{
            if (text=='' || a.url.indexOf(text)!=-1) 
                  pblock.innerHTML += "<a target='_blank' href='"+a.url+"'>"+a.url+"</a><br/>";
             chrome.extension.getBackgroundPage().resultview = pblock.innerHTML;
          });
        });
    },
});

CmdUtils.CreateCommand({
    name: "mobygames",
    description: "search MobyGames database.",
    icon: "http://www.mobygames.com/favicon.ico",
    author: {
        name: "rostok"
    },
    execute: function execute(args) {   
        CmdUtils.addTab("https://www.mobygames.com/search/quick?q=" + encodeURIComponent(args.text));
    },
    preview: function preview(pblock, {text}) {
        pblock.innerHTML = "Search MobyGames";
        if (text.trim()!="") 
            jQuery(pblock).loadAbs("https://www.mobygames.com/search/quick?q=" + encodeURIComponent(text)+" #searchResults");
    },
});

CmdUtils.CreateCommand({
    name: "indexof",
    icon: "http://www.google.com/favicon.ico",
    description: "use google to search for files",
    help: "enter filename to find",
    author: {
        name: "rostok"
    },
    execute: function execute({text}) {   
        CmdUtils.addTab("https://www.google.com/search?q=intitle%3A\"index of\" %2B\"Last Modified\" "+ encodeURIComponent(text) );
    },
    preview: function preview(pblock, args) {
        pblock.innerHTML = "just press enter and don't delay";
    },
});

CmdUtils.CreateCommand({
    names: ["thesaurus", "english-thesaurus"],
    description: "Searches for different words with the same meaning",
    icon: "http://cdn.sfdict.com/hp/502812f9.ico",
    preview: function preview(pblock, {text}) {
      pblock.innerText = this.description;  
      if (text=="") return;
        var url = "https://www.thesaurus.com/browse/" + encodeURIComponent(text);
        var d = $("<div style='background-color:white; max-width:500px'></div>");
        $(d).load(url+" section.MainContentContainer", ()=>{
            $("a", d).each(function() {
                var href = $(this).attr("href");
                if (href === undefined) return;
                $(this).attr("target", "_blank").attr("href", 'https://www.thesaurus.com'+href);
            });
          $(pblock).empty();
          $("div#meanings",d).parent().find("ul:first > li > a").each((i,v)=>{
            $(pblock).append("<p>");
            $(pblock).append($(v).html());
            $(pblock).append("<br>");
            $("div#meanings",d).parent().find("ul:nth("+(1+i)+") > li > a").each((j,w)=>{
            	$(pblock).append( " " ).append( $(w).attr("style", "text-decoration:none; line-height: 2em; border-radius:2em; margin: .1em; white-space: nowrap; padding:.25em; background:#666") );
            });
          });
        });
    },
    execute: CmdUtils.SimpleUrlBasedCommand("https://www.thesaurus.com/browse/{text}") 
});

CmdUtils.CreateCommand({
    icon: "🔌",
    name: "extensions-chrome",
    description: "opens chrome extensions tab",
    execute: function execute(args) {
      chrome.tabs.query({}, (t)=>{
        var found = false;
        t.map((b)=>{
          if (b.url=="chrome://extensions/") {
            chrome.tabs.update(b.id, {highlighted: true});
            found = true;
              return;
          }
        });
        if (!found) CmdUtils.addTab("chrome://extensions/");
      });
    },
});

CmdUtils.CreateCommand({
    name: "settings-chrome",
    icon: "https://www.iconsdb.com/icons/download/black/settings-32.png",
    description: "opens chrome settings tab",
    execute: function execute(args) {
      chrome.tabs.query({}, (t)=>{
        var found = false;
        t.map((b)=>{
          if (b.url=="chrome://settings/") {
            chrome.tabs.update(b.id, {highlighted: true});
            found = true;
              return;
          }
        });
        if (!found) CmdUtils.addTab("chrome://settings/");
      });
    },
});

CmdUtils.CreateCommand({
    name: "replace-selection",
    icon: "http://www.mozilla.com/favicon.ico",
    execute: function execute(args) {
      CmdUtils.setSelection(args.text);
    },
    preview: "replace selected text with args",
});

CmdUtils.CreateCommand({
    icon: "🍪",
    name: "cookies",
    description: "gets cookies, press Enter to save file, filter by domain or * for all",
    author: "Genuinous/rostok",
    external: true,
    require: ["https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js"],
    execute: function execute(args) {
        var blob = new Blob([CmdUtils.popupWindow.jQuery("#ubiq-command-preview").text()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "cookies.txt");
    },
    preview: function preview(pblock, {text}) {
        var b = CmdUtils.getLocation();
      
        function parse(a) {
            return String(a).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }
        function request(search) {
            if(text=="") text = CmdUtils.getLocation().split("//").pop().split("/").shift() || "";
            var s="";
            var i;
            for (i in search) {
                var obj = search[i];
                var indent = parse(obj.domain) + "\t";
                indent = indent + (parse((!obj.hostOnly).toString().toUpperCase()) + "\t");
                indent = indent + (parse(obj.path) + "\t");
                indent = indent + (parse(obj.secure.toString().toUpperCase()) + "\t");
                indent = indent + (parse(obj.expirationDate ? Math.round(obj.expirationDate) : "0") + "\t");
                indent = indent + (parse(obj.name) + "\t");
                indent = indent + parse(obj.value);
                indent = indent + "\n";
                if (text=="*") 
                    s = s + indent;
                else if (obj.domain.includes(text)) {
                    s = s + indent;
            }
        }

        var data = "data:application/octet-stream;base64," + btoa(unescape(encodeURIComponent(info + s)));
        var link = "<a href=" + data + " download='cookies.txt'>cookies.txt</a>";
        var info = "# Enter to save " + link + "\n";
        info += "# Filter by domain or * for all\n#\n";
        info += "# HTTP Cookie File for <b>" + parse(text) + "</b> by Genuinous @genuinous.\n";
        info += "# This file can be used by wget, curl, aria2c and other standard compliant tools.\n";
        info += "# Usage Examples:\n";
        info += ('#   1) wget -x --load-cookies cookies.txt "' + parse(b) + '"\n');
        info += ('#   2) curl --cookie cookies.txt "' + parse(b) + '"\n');
        info += ('#   3) aria2c --load-cookies cookies.txt "' + parse(b) + '"\n');
        info += "#\n";
        if (s) {
                    info = "\n" + info + s;
        } else {
                    info = "\n# No cookies for " + text;
        }
                pblock.innerHTML = "<pre>"+info+"</pre>";
      }
      chrome.cookies.getAll({}, request);
    },
});

CmdUtils.CreateCommand({
    icon: "http://www.microsoft.com/en-us/translator/wp-content/themes/ro-translator/img/banner-app-icon.png",
    name: "translate-en",
    execute: function translate_execute({text: text, _selection: _selection}) {
        text = text.trim() + " to en";
        CmdUtils.getcmd("translate").execute({text, _selection:_selection}).then();
    },
    preview: function translate_preview(pblock, {text: text}) {
        text = text.trim() + " to en";
        CmdUtils.getcmd("translate").preview(pblock, {text}).then();
    }
});

CmdUtils.CreateCommand({
    icon: "http://www.microsoft.com/en-us/translator/wp-content/themes/ro-translator/img/banner-app-icon.png",
    name: "translate-pl",
    execute: function translate_execute(args) {
        args.text = args.text.trim() + " to pl";
        CmdUtils.getcmd("translate").execute(args).then();
    },
    preview: function translate_preview(pblock, args) {
        args.text = args.text.trim() + " to pl";
        CmdUtils.getcmd("translate").preview(pblock, args).then();
    }
});

CmdUtils.CreateCommand({
    icon: "🔑",
    name: "pwd-chrome",
    description: "opens chrome passwords tab",
    execute: function execute(args) {
      chrome.tabs.query({}, (t)=>{
        var found = false;
        t.map((b)=>{
          if (b.url=="chrome://settings/passwords") {
            chrome.tabs.update(b.id, {highlighted: true});
            found = true;
              return;
          }
        });
        if (!found) CmdUtils.addTab("chrome://settings/passwords");
      });
    },
});

CmdUtils.makeSearchCommand({
    icon: "http://www.google.com/favicon.ico",
    name: "site-search",
    url: "https://google.com/search?q={QUERY}",
    description: "searches current site with google and 'site:'",
    author: { name: "rostok" },
    newexecute: function execute(args) {
      if (args.text.trim()!="" && CmdUtils.getLocation()!="") {
        var url = new URL(CmdUtils.getLocation());
        args.text = args.text + " site:"+url.hostname;
        CmdUtils.getcmd("site-search").oldexecute(args);
      }
    },
    newpreview: function preview(pblock, args) {
      if (args.text.trim()!="" && CmdUtils.getLocation()!="") {
        var url = new URL(CmdUtils.getLocation());
        args.text = args.text + " site:"+url.hostname;
        CmdUtils.setResult("");
        CmdUtils.getcmd("site-search").oldpreview(pblock, args);
        CmdUtils.setResult("");
      }
    },
});
CmdUtils.getcmd("site-search").oldexecute = CmdUtils.getcmd("site-search").execute;
CmdUtils.getcmd("site-search").execute = CmdUtils.getcmd("site-search").newexecute;
CmdUtils.getcmd("site-search").oldpreview = CmdUtils.getcmd("site-search").preview;
CmdUtils.getcmd("site-search").preview = CmdUtils.getcmd("site-search").newpreview;

CmdUtils.makeSearchCommand({
    name: ["giphy","gif"],
    description: "Giphy search.",
    icon: "https://giphy.com/static/img/favicon.png",
    url: "https://giphy.com/search/{QUERY}",
    prevAttrs: {zoom: 0.5, scroll: [0, 128]},
});

CmdUtils.CreateCommand({
    name: "save",
    description: "saves multiple links from clipboard or argument list to a single zip",
    author: "rostok",
    icon: "res/icon-128.png",
    external: true,
    require: ["https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js", "https://fastcdn.org/FileSaver.js/1.1.20151003/FileSaver.js"],
    execute: function execute({text, _cmd}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        this.lastDownload = undefined;
        this.lastFile = "";
        this.progress = [];
        var time = 0;
        var delay= 10;
        var links = text.trim().split(/\s+/);
        var zip = new JSZip();
        var i=0;
        links.forEach((l, idx, array)=>{
            setTimeout( ()=>{
            var oReq = new XMLHttpRequest();
            oReq.open("GET", l, true);
            oReq.responseType = "blob";//"arraybuffer";
            oReq.onprogress = (e)=>{
                // CmdUtils.popupWindow.console.log(e);
                _cmd.progress[e.currentTarget.responseURL] = {loaded:e.loaded, total:e.total};
                var lt = Object.values(_cmd.progress).reduce( (acc, cur)=>{console.log("a",acc,"c",cur); return {loaded:acc.loaded+cur.loaded,total:acc.total+cur.total}});
                if (CmdUtils.popupWindow.ubiq_match_first_command()==_cmd.name) {
                    var prc = Math.round(lt.loaded*100/lt.total,1);
                    var s = "";
                    s += "<progress style='width:530px' value='"+prc+"' max='100'></progress><br><br>";
                    s += "loaded:"+lt.loaded+" / total:"+lt.total+" ("+prc+"%)<br><br>"
                    s += _cmd.lastFile;
                    pblock.innerHTML = s;
                }                    
                //CmdUtils.popupWindow.console.log("loaded:"+lt.loaded+" / total:"+lt.total+" ("+Math.round(lt.loaded*100/lt.total,1)+"%)");
            };
            oReq.onload = function(oEvent) {
                var arrayBuffer = oReq.response;
                var byteArray = new Uint8Array(arrayBuffer);
                var f = l.replace(/[:\/\\&?]/g,"-");
                var ext = "";

                switch (oReq.response.type) {
                case "audio/aac": ext = ".aac"; break;
                case "application/x-abiword": ext = ".abw"; break;
                case "application/octet-stream": ext = ".arc"; break;
                case "video/x-msvideo": ext = ".avi"; break;
                case "application/vnd.amazon.ebook": ext = ".azw"; break;
                case "application/octet-stream": ext = ".bin"; break;
                case "image/bmp": ext = ".bmp"; break;
                case "application/x-bzip": ext = ".bz"; break;
                case "application/x-bzip2": ext = ".bz2"; break;
                case "application/x-csh": ext = ".csh"; break;
                case "text/css": ext = ".css"; break;
                case "text/csv": ext = ".csv"; break;
                case "application/msword": ext = ".doc"; break;
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ext = ".docx"; break;
                case "application/vnd.ms-fontobject": ext = ".eot"; break;
                case "application/epub+zip": ext = ".epub"; break;
                case "image/gif": ext = ".gif"; break;
                case "text/html": ext = ".html"; break;
                case "image/x-icon": ext = ".ico"; break;
                case "text/calendar": ext = ".ics"; break;
                case "application/java-archive": ext = ".jar"; break;
                case "image/jpeg": ext = ".jpg"; break;
                case "text/javascript": ext = ".js"; break;
                case "application/json": ext = ".json"; break;
                case "audio/midi audio/x-midi": ext = ".midi"; break;
                case "text/javascript": ext = ".mjs"; break;
                case "audio/mpeg": ext = ".mp3"; break;
                case "video/mpeg": ext = ".mpeg"; break;
                case "application/vnd.apple.installer+xml": ext = ".mpkg"; break;
                case "application/vnd.oasis.opendocument.presentation": ext = ".odp"; break;
                case "application/vnd.oasis.opendocument.spreadsheet": ext = ".ods"; break;
                case "application/vnd.oasis.opendocument.text": ext = ".odt"; break;
                case "audio/ogg": ext = ".oga"; break;
                case "video/ogg": ext = ".ogv"; break;
                case "application/ogg": ext = ".ogx"; break;
                case "font/otf": ext = ".otf"; break;
                case "image/png": ext = ".png"; break;
                case "application/pdf": ext = ".pdf"; break;
                case "application/vnd.ms-powerpoint": ext = ".ppt"; break;
                case "application/vnd.openxmlformats-officedocument.presentationml.presentation": ext = ".pptx"; break;
                case "application/x-rar-compressed": ext = ".rar"; break;
                case "application/rtf": ext = ".rtf"; break;
                case "application/x-sh": ext = ".sh"; break;
                case "image/svg+xml": ext = ".svg"; break;
                case "application/x-shockwave-flash": ext = ".swf"; break;
                case "application/x-tar": ext = ".tar"; break;
                case "image/tiff": ext = ".tiff"; break;
                case "application/typescript": ext = ".ts"; break;
                case "font/ttf": ext = ".ttf"; break;
                case "text/plain": ext = ".txt"; break;
                case "application/vnd.visio": ext = ".vsd"; break;
                case "audio/wav": ext = ".wav"; break;
                case "audio/webm": ext = ".weba"; break;
                case "video/webm": ext = ".webm"; break;
                case "image/webp": ext = ".webp"; break;
                case "font/woff": ext = ".woff"; break;
                case "font/woff2": ext = ".woff2"; break;
                case "application/xhtml+xml": ext = ".xhtml"; break;
                case "application/vnd.ms-excel": ext = ".xls"; break;
                case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ext = ".xlsx"; break;
                case "application/xml": ext = ".xml"; break;
                case "application/vnd.mozilla.xul+xml": ext = ".xul"; break;
                case "application/zip": ext = ".zip"; break;
                case "video/3gpp": ext = ".3gp"; break;
                case "video/3gpp2": ext = ".3g2"; break;
                case "application/x-7z-compressed": ext = ".7z"; break;
                }
              
                var filename = "";
                var disposition = oReq.getResponseHeader('Content-Disposition');
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    var matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) { 
                      filename = matches[1].replace(/['"]/g, '');
                    }
                }
                if (filename!="") f=filename;
                   if (!f.endsWith(ext)) f += ext;

                zip.file(f, arrayBuffer);
                i++;
                //l+="<pre>"+JSON.stringify(filename)+"</pre>";
                //pblock.innerHTML = l+"<br>"+f+"<br>file:"+i+"/"+(array.length-1)+" <br>type:"+oReq.response.type);//+" <br>resp type:"+oReq.responseType;
                _cmd.lastFile = l+"("+oReq.response.type+")";
                if (i==array.length) {
                    pblock.innerHTML = "done!";
                  
                    zip.generateAsync({type:"blob"})
                    .then(function (blob) {
                        var url = window.webkitURL || window.URL || window.mozURL || window.msURL;
                        var a = document.createElement('a');
                        a.download = 'bulk.zip';
                        a.href = url.createObjectURL(blob);
                        pblock.innerHTML = "";
                        a.textContent = 'save zip';
                        a.dataset.downloadurl = ['zip', a.download, a.href].join(':');
                        _cmd.lastDownload = a;
                        CmdUtils.popupWindow.jQuery("#ubiq-command-preview").append(a);
                    });
                }
            };
            oReq.send();
            }, time+=delay);
        });
    },
    preview: function preview(pblock, {text,_cmd}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        text = text.trim().split(/\s+/).map( (s,a) => { return "<br><a target=_blank href='"+s+"'>"+s+"</a>"; } ).join("");
        pblock.innerHTML = "download & zip:" + text;
        if(_cmd.lastDownload !== undefined) {
            jQuery(pblock).append("<hr>last download: ").append(_cmd.lastDownload);
        }
    },
});

CmdUtils.CreateCommand({
    icon: "💀",
    name: "killcookies",
    description: "kills cookies on current page",
    author: { name: "rostok" },
    execute: function execute(args) {
        chrome.tabs.executeScript({code:`
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i];
                var eqPos = cookie.indexOf('=');
                var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
            `
        }, (r)=>{
            pblock.innerHTML = "cookies killed";
        });    
    },
    preview: function preview(pblock, args) {
        // preview will only show cookies
          pblock = "";
          chrome.tabs.executeScript({code:"document.cookie.toString();"}, (r)=>{
              r=r+"";
              r=r.replace(/;\s*/g,";\n");
              r="<pre>"+r+"</pre>";
              pblock.innerHTML = "cookies:"+r;
          });    
    },
});

CmdUtils.CreateCommand({
    name: "unicode",
    description: "finds unicode characters, ctrl+up/down copies to clipboard",
    icon: "https://unicode.org/webscripts/logo60s2.gif",
    preview: async function preview(pblock, {text}) {  
        if (text === "") {
            pblock.innerHTML = this.description;
        } else {
            pblock.innerHTML = "";
            var res = await CmdUtils.get( "https://unicode-search.net/unicode-namesearch.pl?print=1&.submit=Search&term=" + encodeURIComponent(text) );   
            var div = jQuery("td.character,td.onecharacter", res).map((a,e)=>{return "<span>"+e.innerHTML+"</span>";}).get().join(" ");
//            pblock.innerHTML = "<div style='font-face:\"FreeSans, Adobe Notdef\"; url(https://www.gnu.org/software/freefont/tt/full/FreeSans.woff) format(truetype); url(//db.onlinewebfonts.com/t/759da426cfd9b68abfd48a04230d2184.ttf) format(truetype); font-size:2em'>"+div+"</font>";
            pblock.innerHTML = "<div style='font-face:Segoe Symbol; font-size:2em'>"+div+"</font>";
            jQuery("span", pblock).each((i,e)=>{
                jQuery(e).attr("data-option","");
                jQuery(e).on("data-option-selected", e=>CmdUtils.setClipboard($(e.target).html()) );
                jQuery(e).attr("data-option-value", jQuery(e).find("a").first().attr("href"));
            });
        }
    },
    execute: CmdUtils.SimpleUrlBasedCommand("https://unicode-search.net/unicode-namesearch.pl?.submit=Search&term={text}")
});
             
CmdUtils.makeSearchCommand({
    name: ["emoji"],
    description: "Search Emojipedia",
    icon: "https://emojipedia.org/static/img/favicons/favicon-32x32.png",
    execute: CmdUtils.SimpleUrlBasedCommand("https://emojipedia.org/search/?q={text}"),
    url: "https://emojipedia.org/search/?q={QUERY}",
    timeout: 250,
    preview: function preview(pblock, args) {
        if (args.text === "")
            pblock.innerHTML = "enter EMOJI description";
        else {
            pblock.innerHTML = "";
            jQuery(pblock).loadAbs("https://emojipedia.org/search/?q=" + encodeURIComponent(args.text)+ " div.content", ()=>{
              pblock.innerHTML = "<font size=12>"+jQuery("span.emoji", pblock).map((i,e)=>e.outerHTML).toArray().join("")+"</font>";
              jQuery("span", pblock).each((i,e)=>{
                jQuery(e).attr("data-option","");
                jQuery(e).on("data-option-selected", e=>CmdUtils.setClipboard($(e.target).html()) );
                jQuery(e).attr("data-option-value", jQuery(e).find("a").first().attr("href"));
              });
            });
        }
    }
});

CmdUtils.CreateCommand({
    name: "jquery",
    description: "injects jQuery to current tab (v2)",
    icon: "https://jquery.com/favicon.ico",
    execute: async function execute(args) { 
      var jq = chrome.runtime.getManifest().background.scripts.filter(a=>a.includes("jquery")).pop();
      jq = await CmdUtils.get(jq);
      jq = JSON.stringify(jq);
      chrome.tabs.executeScript( { code: `
      	var script = document.createElement('script'); 
        script.textContent = ${jq}; 
        (document.head || document.documentElement).append(script); 
        script.remove();
        console.log('💉jQuery injected');
      `});
    },
});

// content security policy may forbid external scripts
CmdUtils.CreateCommand({
    name: "inject-js",
    description: "injects JavaScript from url",
    icon: "https://jquery.com/favicon.ico",
    execute: function execute({text}) {
      text = text.replace("http:", "");
      text = text.replace("https:", "");
      chrome.tabs.executeScript({code:"((e,s)=>{e.src=s;e.onload=function(){console.log('script injected')};document.head.appendChild(e);})(document.createElement('script'),'"+text+"')"}, (r)=>{
      CmdUtils.notify(r+'', "Script injected.");
      });
    },
});

CmdUtils.CreateCommand({
    name: "whois",
    description: "Searches WHO.IS by IP or domain",
    icon: "https://who.is/favicon.ico",
    execute: function execute(args) { this.preview(null, args); },
    preview: function preview(pblock, args) {
        this.url = "https://who.is/whois/{QUERY}";
        if (args.text.trim()=="") args.text = url_domain(CmdUtils.getLocation());
        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(args.text)) 
          this.url = "https://who.is/whois-ip/ip-address/{QUERY}";

        if (!pblock) return CmdUtils.addTab(this.url.replace(/\{QUERY\}/g, encodeURIComponent(args.text)));
        
        this.tmp = CmdUtils._searchCommandPreview;  
        this.tmp( pblock, args );
    },
    prevAttrs: {zoom: 0.75, scroll: [0, 0]},
});

CmdUtils.CreateCommand({
    name: "allow-text-selecion",
    author: "Alan Hogan",
    icon: "Ꮖ",
    external: true,
    description: "Allows text selection by undoing user-select:none CSS rules.",
    homepage: "https://alanhogan.com/bookmarklets",
    execute: function execute(args) { CmdUtils.inject("https://cdn.jsdelivr.net/gh/alanhogan/bookmarklets/enable-text-selection.js"); },
});

CmdUtils.CreateCommand({
    name: ["grayscale","greyscale"],
    author: "Alan Hogan",
    icon: "🎨",
    external: true,
    description: "Removes colors.",
    homepage: "https://alanhogan.com/bookmarklets",
    execute: function execute(args) { CmdUtils.inject("https://cdn.jsdelivr.net/gh/alanhogan/bookmarklets/grayscale.js"); },
});

CmdUtils.makeSearchCommand({
    name: ["wolfram"],
    description: "Wolfram Alpha query",
    icon: "http://www.wolframalpha.com/favicon.ico",
    url: "https://www.wolframalpha.com/input/?i={QUERY}",
    timeout: 500,
    prevAttrs: {backgroundColor: "#FFFFFF", zoom: 0.75, scroll: [0/*x*/, 0/*y*/], anchor: ["c_13", "c_22"]},
});

CmdUtils.CreateCommand({
    name: "history",
    icon: "res/icon-128.png",
    description: "browse and filter previously executed commands",
    execute: function execute(args) {   
      CmdUtils.popupWindow.ubiq_set_input(args._opt_val);
    },
    preview: function preview(pblock, args) {
      var dos = "=selected ";
      var o = "";
      o += "<pre>";
      o += "enter pattern to filter; select with Ctrl+up/down:\n\n";
      CmdUtils.history.filter(c=>c.indexOf(args.text)>=0 || args.text=="").forEach((c)=>{
          o += `<span data-option${dos} data-option-value='${c}'>${c}</span>\n`;  
          dos = '';
      });
      o += "</pre>";
      pblock.innerHTML = o;
      if (CmdUtils.popupWindow) {
        CmdUtils.popupWindow.ubiq_selected_option=0;
        CmdUtils.popupWindow.ubiq_update_options();
      }
    },
});

CmdUtils.CreateCommand({
    name: "history-clear",
    icon: "res/icon-128.png",
    description: "execute to clear UbiChr history buffer",
    execute: function execute(args) {   
        CmdUtils.history = [];
        CmdUtils.saveToHistory("");
    },
});

CmdUtils.CreateCommand({
    name: ["unmark","mark-remove","highlight-remove"],
    description: "removes highlight/mark",
    icon: "🟨",
    execute: function () { 
        CmdUtils.removeUpdateHandler("markHandler"); 
        var c = CmdUtils.popupWindow.ubiq_command().split(' ').shift();
        switch (c) {
        case "unmark":      c = "mark "; break;
        case "mark-remove": c = "mark "; break;
        default:            c = "highlight "; break;
        }
        CmdUtils.popupWindow.ubiq_set_input(c, false);
        if (CmdUtils.getcmd("mark")) CmdUtils.getcmd("mark").highlights=""; 
    }
});

CmdUtils.CreateCommand({
    name: ["mark","highlight"],
    description: "highlights/marks arguments on current tab, permanent on execute, clear on empty",
    timeout: 250,
    external: true, // uses vanilla mark.js v8.11.1 
    icon: "🟨",
    execute: function ({text, _cmd}) {
      if (text=="") 
        CmdUtils.removeUpdateHandler("markHandler");
      else
        CmdUtils.addUpdateHandler("markHandler", ()=>{ _cmd.preview(null, {text}); });
      _cmd.highlights = text;
      pblock.innerHTML = _cmd.description+"<hr>highlights: "+_cmd.highlights;
    },
    preview: function preview(pblock, {text, _cmd}) {   
      CmdUtils.ajaxGet("https://cdnjs.cloudflare.com/ajax/libs/mark.js/8.11.1/mark.min.js", (data)=>{
          var code = data + `
                var args='${text}'.split(/\\s+/);
                var markinstance = new Mark(document.querySelector("body"));
				markinstance.unmark({done:()=>markinstance.mark(args)});
                `;
          chrome.tabs.executeScript({ code: code });
      });
      if (_cmd)pblock.innerHTML = _cmd.description+"<hr>highlights: "+_cmd.highlights;
    }
});


CmdUtils.CreateCommand({
    name: "open",
    description: "opens multiple links from clipboard or argument list in separate tabs",
    author: "rostok",
    icon: "res/icon-128.png",
    conv: function(text) {
        return [...new Set(text.split(/\s+/)
                               .filter( v => v!="" )
                               .map( v => v.startsWith("//") ? "https:"+v : v )
                               .map( v => v.includes("://") ? v : "https://"+v ))]
    },
    execute: function execute({text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        this.conv(text).forEach( s => CmdUtils.addTab(s) );
    },
    preview: function preview(pblock, {text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        text = this.conv(text).map( s => "<br><a target=_blank href='"+s+"'>"+s+"</a>" ).join("");
        pblock.innerHTML = "open:" + text;
    },
});

CmdUtils.makeSearchCommand({
  name: ["man"],
  description: "linux man via www",
  icon: "📄",
  url: "http://man.he.net/?section=all&topic={QUERY}",
  prevAttrs: {zoom: 1, scroll: [100/*x*/, 0/*y*/], anchor: ["c_13", "c_22"]},
});

CmdUtils.CreateCommand({
    name: "merge-tabs",
    icon: "🗀",
    description: "merge chrome tabs to a single window",
    execute: function execute(args) {   
            chrome.windows.getCurrent(
                  (win)=>{
                        targetWindow = win;
                        chrome.tabs.getAllInWindow(targetWindow.id, 
                            (tabs)=>{
                                      chrome.windows.getAll({"populate" : true}, 
                                        (windows)=>{
                                          for (var i = 0; i < windows.length; i++) {
                                            var win = windows[i];
                                            if (targetWindow.id != win.id && win.type==='normal') {
                                              for (var j = 0; j < win.tabs.length; j++) {
                                                var tab = win.tabs[j];
                                                chrome.tabs.move(tab.id,{"windowId": targetWindow.id, "index": -1});
                                                if(tab.pinned==true){chrome.tabs.update(tab.id, {"pinned":true});}
                                              }
                                            }
                                          }
                                      });
                        });
            });

    },
});


CmdUtils.CreateCommand({
    name: ["translate-google", "google-translate"],
    description: "translate text, selection or current tab with Google Translate",
    icon: "https://translate.google.com/favicon.ico",
    preview: (pblock, args)=>{
              this.url = "https://translate.google.com/translate?hl=&sl=auto&tl={text}&u={location}";
            // empty args translates URL, text or selection opens standard translate form
            if(args.text=="") {
              args.text="EN";
            } else {
              this.url = "https://translate.google.com/?sl=auto&tl=pl&op=translate&text={text}";
            }
              (CmdUtils._searchCommandPreview.bind(args._cmd))(pblock, args);
            },
    execute: (args)=>{
              var url = "https://translate.google.com/translate?hl=&sl=auto&tl={text}&u={location}";
            // empty args translates URL, text or selection opens standard translate form
            if(args.text=="") {
              args.text="EN";
            } else {
              url = "https://translate.google.com/?sl=auto&tl=pl&op=translate&text={text}";
            }
            url = url.replace(/\{text\}/g, "{QUERY}").replace(/\{QUERY\}/g, encodeURIComponent(args.text));
            url = url.replace(/\{location\}/g, encodeURIComponent(CmdUtils.getLocation()));
            CmdUtils.addTab(url);
        },
});

CmdUtils.CreateCommand({
    name: "sum",
    description: "sums selected numbers",
    icon: "https://www.greeksymbols.net/img/sigma-symbol-capital.png",
    author: { name: "rostok" },
    license: "MIT",
    main: function main(args) {
        return args.text.replace(/,/g, ".").split(/[ +;\n\t\r]+/).reduce(function(a, b) { return (parseFloat(a) || 0) + (parseFloat(b) || 0); }, 0);
    },
    execute: function execute(args) {
        if (args.text.trim()=="") args.text = CmdUtils.getClipboard();
        CmdUtils.setSelection(this.main(args));
    },
    preview: function preview(pblock, args) {
    	if (args.text.trim()=="") args.text = CmdUtils.getClipboard();
        pblock.innerHTML = "" + this.main(args);
    },
});

CmdUtils.CreateCommand({
    name: "alarm-clear",
    icon: "⏰",
    description: "clears all alarms",
  	execute: function execute({text}) {
      CmdUtils.setTip("alarms cleared");
      chrome.alarms.clearAll();
      CmdUtils.refreshPreview();
    },
    preview: async function preview(pblock, {text}) {
	  pblock.innerHTML = "";
      chrome.alarms.getAll((a)=>{
        pblock.innerHTML += "<pre>current alarms:\n"+a.map((v)=>v.name +"\tin\t"+Math.round((v.scheduledTime-new Date())/1000/60*10)/10+" minutes").join("\n");
      });
    },
});

CmdUtils.CreateCommand({
    name: "alarm",
    icon: "⏰",
    description: "sets alarm notification in defined time. syntax: [alarm-name] [hh:]mm",
    lastalarmname: "ALARM",
    nametime: function (text) {
          var a = text.split(/\s+/);
          for (var p=a.pop().split(':'), s=0, m=1; p.length>0; m*=60) s+=m*(parseFloat(p.pop(),10)||0);
          var n = this.lastalarmname;
          if (a.length>0) n = a[0]; 
          return {name:n,time:s};
    },
  	execute: function execute({text}) {
      var {name,time} = this.nametime(text);
      if (time<=0) return;
      CmdUtils.setTip("alarm set!");
      CmdUtils.refreshPreview();
      chrome.alarms.create(name,{delayInMinutes:time});
      chrome.alarms.onAlarm.addListener(function( alarm ) { if (alarm.name==name) CmdUtils.notify("alarm: "+name); });
    },
    preview: async function preview(pblock, {text}) {
	  pblock.innerHTML = "";
      if (text!="") {
        var {name,time} = this.nametime(text);
        pblock.innerHTML += `<pre>set alarm '${name}' in ${time} minutes (${text.split(/\s+/).pop()})</pre>`;
      } else {
        CmdUtils.setTip(this.description);
      }
      chrome.alarms.getAll((a)=>{
        pblock.innerHTML += "<pre>current alarms:\n"+
        a.map(v=>{
          this.lastalarmname = v.name.split("-").shift()+"-"+((parseInt(v.name.split("-").pop())||0)+1);
          return `${v.name}\tin\t${(Math.round((v.scheduledTime-new Date())/1000/60*10)/10).toString()} minutes`;
        }).join("\n")+"</pre>";
      });
    },
});

CmdUtils.CreateCommand({
    name: "urban",
    description: "neural language adapter for boomers",
    author: "rostok",
    icon: "https://www.urbandictionary.com/favicon.ico",
    execute: function execute({text}) {
        CmdUtils.addTab(`https://www.urbandictionary.com/define.php?term=${text}`);
    },
    preview: async function preview(pblock, {text}) {
        if (text != '') {
            var u = await CmdUtils.get("https://www.urbandictionary.com/define.php?term=" + encodeURIComponent(text));
            // content
            $(pblock)
                .append($("div#content", u))
                .find("a,img")
                .absolutize("https://www.urbandictionary.com").prop("target", "_blank");
            // style, if anything should change contnet looks allright w/o styling as well
            var s = await CmdUtils.get(u.split(".css").shift().split("href=\"").pop() + ".css");
            s = s.replace(/body/g, "b");
            s = s.replace(/html/g, "h");
            $("a", pblock).css("color", "blue");
            $(pblock).append(`<style> a.autolink {text-color:blue !important;}${s}</style>`);
            // cleanup
            $("a.mug-ad,a.social-interaction addthis_button_twitter,img,i,svg,.contributor,a.circle-link,.thumbs,.ad-panel", pblock).remove();
        } else {
            pblock.innerHTML = this.description;
        }
    },
});

CmdUtils.CreateCommand({
    name: "color-picker",
    author: "rostok",
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAAG1BMVEUAo9TwK1Y3TaTo2ie/KZD4gSgArYkPr1p8xkpAC8JZAAAAUElEQVQ"+
          "okWMQDTU27ihPY2BgUlJycREUZIAKJDAwoAqAVKi4ODoiCRBSATZDBVOFILoZjrhVJGBVoUIFMzDcoUIFM/C6lFwzMNyB16VUDVMAh/5pgpJEPwwAAAAASUVORK5CYII=",
    description: "shows color picker, press Enter to copy selected color to clipboard",
    execute: function execute({text}) {
      CmdUtils.setClipboard(text);
    },
    preview: async function preview(pblock, {text}) {
      Math.clamp=function(a,b,c){return Math.max(b,Math.min(c,a));};
      log = pblock.ownerDocument.defaultView.console.log;
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      if (text=="") text = "white";
      context.fillStyle = text;
      context.fillRect(0,0,1,1);
      var k =[...context.getImageData(0,0,1,1).data];
      var c = {r:255,g:255,b:255,a:255,h:0,s:0,l:100}; // rgb 0..255, h 0..360, sl 0..100
      c.r = k[0]; c.g=k[1]; c.b=k[2];
      function bi(){return `url("data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg preserveAspectRatio='none' viewBox='0 0 1 1' version='1.1' xmlns='http://www.w3.org/2000/svg'>
      <defs>
      <linearGradient id='g'>
      <stop offset='0' stop-color='#fff' stop-opacity='0'/>
      <stop offset='1' stop-color='#fff' stop-opacity='1'/>
      </linearGradient>
      <mask id='m'><rect x='0' y='0' width='1' height='1' fill='url(#g)'></rect></mask>
      <linearGradient id='a' gradientTransform='rotate(90)'>
      <stop offset='0' stop-color='white'/>
      <stop offset='0.5' stop-color='hsl(${c.h} 100% 50%)'/>
      <stop offset='1' stop-color='black'/>
      </linearGradient>
      <linearGradient id='b' gradientTransform='rotate(90)'>
      <stop offset='0' stop-color='black'/>
      <stop offset='1' stop-color='white'/>
      </linearGradient>
      </defs>
      <rect x='0' y='0' width='1' height='1' fill='url(#a)' mask='url(#m)'></rect>
      <rect x='0' y='0' width='1' height='1' fill='url(#b)' mask='url(#m)' transform='translate(1,1) rotate(180)'/>
      </svg>`)}")`;}
      pblock.innerHTML=`
<style>
#snl{ margin:2px 2px; display:inline-block; width:256px; height:256px; xbackground-image:${bi()}; }
#sl{mix-blend-mode:difference;position:absolute;transform:translate(-50%,-50%);pointer-events: none;}
#picker { user-select: none; }
input.slider { display:inline; width:256px; left:16px; color:pink; }
input[type='range'] { -webkit-appearance: none; overflow: hidden; background-color: gray; }
input[type='range']#alf { background: linear-gradient(to right,#0000,#ffff); }
input[type='range']#hue { background: linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00); }
input[type='range']::-webkit-slider-runnable-track { -webkit-appearance: none; }
input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; width: 8px; height: 20px; background: #000; }
#rgbc, #hslc { display:inline-block; width:64px; height:24px; border: 1px solid black; margin:8px 16px -8px 0px;}
</style>
        <br>
        <div id=picker>
        <input id=alf class=slider type=range min=0 max=255> α <br>
      	<input id=hue class=slider type=range min=0 max=360> H <br>
        <div id=snl><div id=sl>✛</div></div> L/S <br>
        <input id=red class=slider type=range min=0 max=255> R<br>
        <input id=grn class=slider type=range min=0 max=255> G<br>
        <input id=blu class=slider type=range min=0 max=255> B<br>
        <div id=rgbc></div><input id=rgb><br>
        <div id=hslc></div><input id=hsl>
        <div id=tmp></div>
        </div>
      `;
      function fromRGB(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let d = max - min;
        let h;
        if (d === 0) h = 0;
        else if (max === r) h = (g - b) / d % 6;
        else if (max === g) h = (b - r) / d + 2;
        else if (max === b) h = (r - g) / d + 4;
        let l = (min + max) / 2;
        let s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
        if(h<0)h+=360;
        c.h = Math.round(h*60);
        c.s = Math.round(s*100);
        c.l = Math.round(l*100);
      }
      function fromHSL(h, s, l) {
        s /= 100; l /= 100;
        let k = (1 - Math.abs(2 * l - 1)) * s;
        let hp = h / 60.0;
        let x = k * (1 - Math.abs((hp % 2) - 1));
        let rgb1;
        if (isNaN(h)) rgb1 = [0, 0, 0];
        else if (hp <= 1) rgb1 = [k, x, 0];
        else if (hp <= 2) rgb1 = [x, k, 0];
        else if (hp <= 3) rgb1 = [0, k, x];
        else if (hp <= 4) rgb1 = [0, x, k];
        else if (hp <= 5) rgb1 = [x, 0, k];
        else if (hp <= 6) rgb1 = [k, 0, x];
        let m = l - k * 0.5;
        c.r = Math.round(255 * (rgb1[0] + m));
        c.g = Math.round(255 * (rgb1[1] + m));
        c.b = Math.round(255 * (rgb1[2] + m));
      }
      function chg(prop, val, setinput=true) {
        if (setinput)pblock.ownerDocument.defaultView.ubiq_set_input("picker "+$("#rgb",pblock).val(),false);
        c[prop]=Math.round(val);
        if ("rgb".includes(prop)) fromRGB(c.r,c.g,c.b);
        else                      fromHSL(c.h,c.s,c.l);
        $("#alf",pblock).val(c.a);
        $("#hue",pblock).val(c.h);
        $("#sl",pblock).css("margin",`${(100-c.l)*2.55}px ${c.s*2.55}px`);
        $("#red",pblock).val(c.r);
        $("#grn",pblock).val(c.g);
        $("#blu",pblock).val(c.b);
        $("#rgb",pblock).val("#"+((256+c.r<<8|c.g)<<8|c.b).toString(16).slice(1));
        if (c.a<255) $("#rgb",pblock).val( $("#rgb",pblock).val() + (256+c.a).toString(16).slice(1) );
        $("#rgbc",pblock).css("background-color",$("#rgb",pblock).val());
        $("#hsl",pblock).val(`hsla(${c.h}, ${c.s}%, ${c.l}%, ${Math.round(c.a/255*100)}%)`);
        $("#hslc",pblock).css("background-color",$("#hsl",pblock).val());
        $("#snl",pblock).css("background-image",bi());
      }
      $("#snl",pblock).css("background-image",bi());
      $("#alf",pblock).on("input change", (e)=>chg("a",$(e.target).val()));
      $("#hue",pblock).on("input change", (e)=>chg("h",$(e.target).val()));
      $("#red",pblock).on("input change", (e)=>chg("r",$(e.target).val()));
      $("#grn",pblock).on("input change", (e)=>chg("g",$(e.target).val()));
      $("#blu",pblock).on("input change", (e)=>chg("b",$(e.target).val()));
      $("#snl",pblock).on("mousedown mousemove mouseout", (e)=>{
        if (e.buttons!=1) return;
        var po = $(e.target).offset(); 
        var x = Math.round(Math.clamp(e.offsetX,0,255));
        var y = Math.round(Math.clamp(e.offsetY,0,255));
        chg("s",(x)/2.55);
        chg("l",(255-y)/2.55);
      });
      chg("r",c.r,false);
      chg("g",c.g,false);
      chg("b",c.b,false);
    },
});

CmdUtils.CreateCommand({
    icon: "🔣",
    names: ["decodeuricomponent"],
    description: "urldecode",
    execute: function execute({text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        CmdUtils.setSelection(decodeURIComponent(text));
    },
    preview: function preview(pblock, {text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        pblock.innerHTML = decodeURIComponent(text);
    },
});

CmdUtils.CreateCommand({
    icon: "🔣",
    names: ["encodeuricomponent"],
    description: "urlencode",
    execute: function execute({text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        CmdUtils.setSelection(encodeURIComponent(text));
    },
    preview: function preview(pblock, {text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        pblock.innerHTML = encodeURIComponent(text);
    },
});

function escapeHTML(html) {
    return document.createElement('div').appendChild(document.createTextNode(html)).parentNode.innerHTML;
}
CmdUtils.CreateCommand( {
    names: ["omnijquery"],
    icon: "https://jquery.com/favicon.ico",
    description: "searches all tabs with jquery selector and shows tags found",
    author: "rostok",
    execute: function() {
      CmdUtils.addTab("result.html");
    },
    preview: function preview(pblock, {text, _cmd}) {
        text = text.trim();
        if (text.length < 2) {
            pblock.innerHTML = this.description+"<br><br>make the selector longer ("+text.length+"/3)";
        } else {
            var arr = [];
            chrome.extension.getBackgroundPage().resultview = pblock.innerHTML = "";
            chrome.tabs.query({}, (t)=>{
            t.map((b)=>{
              if (b.url.match('^http'))
              chrome.tabs.executeScript(b.id, 
                {code:"document.body.innerHTML;"}, 
                (ret)=>{
                  if (typeof ret==='undefined') return;
                  var r = CmdUtils.jQuery(text,ret[0]).get();
                   r = r.map(v=>v.outerHTML);
                   r = r.map(v=>escapeHTML(v));
                  arr = arr.concat( r );
                  CmdUtils.setTip(arr.length);  
                  $(pblock).html(arr.join("<br>")).css({"width":"540px","height":"505px","overflow-x":"hidden"});
                  chrome.extension.getBackgroundPage().resultview = pblock.innerHTML;
                });
            });
          });
        }
    },
});

CmdUtils.makeSearchCommand({
    name: ["discogs"],
    description: "search discogs",
    icon: "https://discogs.com/favicon.ico",
    url: "https://www.discogs.com/search/?type=all&q={text}"
});

CmdUtils.makeSearchCommand({
    name: ["genius","lyrics"],
    description: "search genius.com",
    icon: "https://genius.com/favicon.ico",
    url: "https://genius.com/search?q={QUERY}",
    prevAttrs: {zoom: 0.70},
});
  
CmdUtils.makeSearchCommand({
    name: "12ft",
    icon: "https://12ft.io/favicon.png",
    url: "https://12ft.io/proxy?q={location}",
    description: "skips paywalls with help of 12ft.io",
    author: "rostok",
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// mark built-int commands
CmdUtils.CommandList.forEach((c)=>{c['builtIn']=true;});

CmdUtils.loadCustomScripts();

CmdUtils.loadHistory();