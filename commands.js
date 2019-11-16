// BuildIn CmdUtils command definitions
// jshint esversion: 6 

CmdUtils.CreateCommand({
    name: "amazon-search",
    description: "Search Amazon for books matching:",
    author: {},
    icon: "http://www.amazon.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Amazon for books matching:",
    execute: CmdUtils.SimpleUrlBasedCommand(
        'http://www.amazon.com/s/ref=nb_ss_gw?url=search-alias%3Dstripbooks&field-keywords={text}'
    )
});

CmdUtils.CreateCommand({
    name: "answers-search",
    description: "Search Answers.com for:",
    author: {},
    icon: "http://www.answers.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Answers.com for:",
    execute: CmdUtils.SimpleUrlBasedCommand('http://www.answers.com/search?q={text}')
});

CmdUtils.CreateCommand({
    name: "ask-search",
    description: "Search Ask.com for the given words",
    author: {},
    icon: "http://www.ask.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Ask.com for the given words:",
    execute: CmdUtils.SimpleUrlBasedCommand('http://www.ask.com/web?q={text}')
});

CmdUtils.CreateCommand({
    name: "bugzilla",
    description: "Perform a bugzilla search for",
    author: {},
    icon: "http://www.mozilla.org/favicon.ico",
    homepage: "",
    license: "",
    preview: "Perform a bugzilla search for",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "https://bugzilla.mozilla.org/buglist.cgi?query_format=specific&order=relevance+desc&bug_status=__open__&content={text}"
    )
});

CmdUtils.CreateCommand({
    name: "close",
    takes: {},
    description: "Close the current tab",
    author: {},
    icon: "",
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
    execute: async function execute({text:text}) {
            var xtoken = CmdUtils.get("http://yippy.com/");
            xtoken = jQuery("#xtoken", xtoken).val();
            CmdUtils.postNewTab("http://yippy.com/search/?v%3Aproject=clusty-new&query=kakao&xtoken="+xtoken);//, {"v:project":"clusty-new", xtoken:xtoken});
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
    icon: "http://search.cpan.org/favicon.ico",
    description: "Search for a CPAN package information",
    homepage: "",
    author: {
        name: "Cosimo Streppone",
        email: "cosimo@cpan.org"
    },
    license: "",
    preview: "Search for a CPAN package information",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "http://search.cpan.org/dist/{text}"
    )
});

CmdUtils.CreateCommand({
    name: "currency-converter",
    description: "Convert currency using xe.com converter service.<br/><i>Ex.: 5000 NOK to EUR</i>",
    author: {
        name: "Cosimo Streppone",
        email: "cosimo@cpan.org"
    },
    icon: "http://www.xe.com/favicon.ico",
    homepage: "http://xe.com/ucc/",
    license: "",
    preview: async function (pblock, directObj) {
        pblock.innerHTML = "Convert currency values using xe.com converter service.";
        var currency_spec = directObj.text;
        var matches = currency_spec.match(/^([\d\.]+)\s+(\w+)\s+to\s+(\w+)$/);
        if (!matches || matches.length<3) return;
        var amount = matches[1];
        var curr_from = matches[2].toUpperCase();
        var curr_to = matches[3].toUpperCase();
        var xe_url = "http://www.xe.com/ucc/convert.cgi?Amount=" + escape(amount) +
            "&From=" + escape(curr_from) + "&To=" + escape(curr_to);
        jQuery(pblock).load( xe_url+" .uccAmountWrap");
    },
    execute: function (directObj) {
        var currency_spec = directObj.text;
        var matches = currency_spec.match(/^([\d\.]+)\s+(\w+)\s+to\s+(\w+)$/);
        var amount = matches[1];
        var curr_from = matches[2].toUpperCase();
        var curr_to = matches[3].toUpperCase();
        var xe_url = "http://www.xe.com/ucc/convert.cgi?Amount=" + escape(amount) +
            "&From=" + escape(curr_from) + "&To=" + escape(curr_to);
        CmdUtils.addTab(xe_url);
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
    icon: "http://dictionary.reference.com/favicon.ico",
    execute: function ({text: text}) {
        CmdUtils.addTab("http://dictionary.reference.com/search?q=" + escape(text));
    },
    preview: async function define_preview(pblock, {text: text}) {
        pblock.innerHTML = "Gives the meaning of a word.";
        var doc = await CmdUtils.get("http://dictionary.reference.com/search?q="+encodeURIComponent(text)+"&s=tt&ref_=fn_al_tt_mr" );
        doc = jQuery("div.source-box", doc)
                .find("button", doc).remove().end()
                .find("ul.headword-bar-list").remove().end()
                .find(".deep-link-synonyms").remove().end()
                .html();
        pblock.innerHTML = doc;
    },
});

CmdUtils.CreateCommand({
    name: "dramatic-chipmunk",
    takes: {},
    description: "Prepare for a dramatic moment of your life",
    author: {},
    icon: "http://www.youtube.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Prepare for a dramatic moment of your life",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "http://www.youtube.com/watch?v=a1Y73sPHKxw"
    )
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
        "http://www.flickr.com/search/?q={text}&w=all"
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
        "http://www.google.com/search?q={text}&ie=utf-8&oe=utf-8"
    )
});

CmdUtils.CreateCommand({
    names: ["help", "command-list"],
    description: "Provides basic help on using Ubiquity",
    icon: "res/icon-128.png",
    preview: "lists all avaiable commands",
    execute: CmdUtils.SimpleUrlBasedCommand("help.html")
});

CmdUtils.CreateCommand({
    names: ["debug-popup"],
    description: "Open popup in window",
    icon: "res/icon-128.png",
    preview: "lists all avaiable commands",
    execute: CmdUtils.SimpleUrlBasedCommand("popup.html")
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

CmdUtils.CreateCommand({
    name: "image-search",
    description: "Search on Google for images",
    author: {},
    icon: "http://www.google.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search on Google for images",
    execute: CmdUtils.SimpleUrlBasedCommand("http://images.google.com/images?hl=en&q={text}")
});

CmdUtils.CreateCommand({
    name: "imdb",
    description: "Searches for movies on IMDb",
    author: {},
    icon: "http://www.imdb.com/favicon.ico",
    homepage: "",
    license: "",
    preview: async function define_preview(pblock, {text: text}) {
        pblock.innerHTML = "Searches for movies on IMDb";
        if (text.trim()!="") 
        jQuery(pblock).loadAbs("http://www.imdb.com/find?q="+encodeURIComponent(text)+"&s=tt&ref_=fn_al_tt_mr table.findList", ()=>{
            jQuery(pblock).find(".findResult").each((i,e)=>{
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
            var old = CmdUtils.SimpleUrlBasedCommand("http://www.imdb.com/find?s=tt&ref_=fn_al_tt_mr&q={text}");
            old(args)
        }
    },
    old_execute: CmdUtils.SimpleUrlBasedCommand(
        "http://www.imdb.com/find?s=tt&ref_=fn_al_tt_mr&q={text}"
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
    preview: function (pblock, directObject) {
        //ubiq_show_preview(urlString);
        //searchText = jQuery.trim(directObject.text);
        var host = directObject.text;
        if (host.length < 1) {
            pblock.innerHTML = "Checks if URL is down";
            return;
        }
        var previewTemplate = "Press Enter to check if <b>" + host + "</b> is down.";
        pblock.innerHTML = previewTemplate;
    },
    execute: async function (directObject) {
        var url = "http://downforeveryoneorjustme.com/{QUERY}";
        var query = directObject.text;
        CmdUtils.setPreview("checking "+query);
        // Get the hostname from url
        if (!query) {
            var host = window.location.href;
            var url_comp = host.split('/');
            query = url_comp[2];
        }
        var urlString = url.replace("{QUERY}", query);
        //CmdUtils.addTab(urlString);
        ajax = await CmdUtils.get(urlString);
        {
            if (!ajax) return;
            if (ajax.match('is up.')) {
                CmdUtils.setPreview('<br/><p style="font-size: 18px;">It\'s just you. The site is <b>up!</b></p>');
            } else {
                CmdUtils.setPreview('<br/><p style="font-size: 18px;">It\'s <b>not</b> just you. The site is <b>down!</b></p>');
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
    execute: function({text:text}) {
        if (text.substr(-2)=="-l") text = text.slice(0,-2);
        CmdUtils.addTab("http://maps.google.com/maps?q="+encodeURIComponent(text));
    },
    preview: function preview(pblock, {text:text}) {
        if (text=="") {
            pblock.innerHTML = "show objects or routes on google maps.<p>syntax: <pre>\tmaps [place]\n\tmaps [start] to [finish]</pre>"; 
            return;
        }
        pblock.innerHTML = `
                <div class="mapouter">
                    <div class="gmap_canvas">
                        <iframe width="540" height="505" id="gmap_canvas" src="https://maps.google.com/maps?q=`+encodeURIComponent(text)+`&t=&z=13&ie=UTF8&iwloc=&output=embed" 
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
    requirePopup: "https://maps.googleapis.com/maps/api/js?sensor=false",
    preview: async function mapsPreview(previewBlock, args) {
        var GM = CmdUtils.popupWindow.google.maps;
        
        // http://jsfiddle.net/user2314737/u9no8te4/
        var text = args.text.trim();
        if (text=="") {
            previewBlock.innerHTML = "show objects or routes on google maps.<p>syntax: <pre>\tmaps [place] [-l]\n\tmaps [start] to [finish] [-l]\n\n -l narrow search to your location</pre>"; 
            return;
        }
        cc = "";
        if (text.substr(-2)=="-l") {
	        var geoIP = await CmdUtils.get("http://freegeoip.net/json/"); // search locally
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
    execute: function({text:text}) {
        if (text.substr(-2)=="-l") text = text.slice(0,-2);
        CmdUtils.addTab("http://maps.google.com/maps?q="+encodeURIComponent(text));
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
    name: "new-tab",
    description: "Open a new tab (or window) with the specified URL",
    author: {},
    icon: "",
    homepage: "",
    license: "",
    preview: "Open a new tab (or window) with the specified URL",
    execute: function ({text:text}) {
        if (!text.match('^https?://')) text = "http://"+text;
        CmdUtils.addTab(text);
    }
});

CmdUtils.CreateCommand({
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
        "http://www.google.com/search?q={text}&ie=utf-8&oe=utf-8"
    )
});


var bitly_api_user = "ubiquityopera";
var bitly_api_key = "R_59da9e09c96797371d258f102a690eab";
CmdUtils.CreateCommand({
    names: ["shorten-url", "bitly"],
    icon: "https://dl6fh5ptkejqa.cloudfront.net/0482a3c938673192a591f2845b9eb275.png",
    description: "Shorten your URLs with the least possible keystrokes",
    homepage: "http://bit.ly",
    author: {
        name: "Cosimo Streppone",
        email: "cosimo@cpan.org"
    },
    license: "GPL",
    preview: async function (pblock, {text:text}) {
        var words = text.split(' ');
        var host = words[1];
        pblock.innerHTML = "Shortens an URL (or the current tab) with bit.ly";
    },
    execute: async function (directObject) {
        var url = "http://api.bit.ly/shorten?version=2.0.1&longUrl={QUERY}&login=" +
            bitly_api_user + "&apiKey=" + bitly_api_key;
        var query = directObject.text;
        // Get the url from current open tab if none specified
        if (!query || query == "") query = CmdUtils.getLocation();
        var urlString = url.replace("{QUERY}", query);

        var url = "http://api.bit.ly/shorten?version=2.0.1&longUrl={QUERY}&login=" + bitly_api_user + "&apiKey=" + bitly_api_key;
        // Get the url from current open tab if none specified
        var ajax = await CmdUtils.get(urlString);
        //ajax = JSON.parse(ajax);
        //if (!ajax) return;
        var err_code = ajax.errorCode;
        var err_msg = ajax.errorMessage;
        // Received an error from bit.ly API?
        if (err_code > 0 || err_msg) {
            CmdUtils.setPreview('<br/><p style="font-size: 18px; color:orange">' + 'Bit.ly API error ' + err_code + ': ' + err_msg + '</p>');
            return;
        }

        var short_url = ajax.results[query].shortUrl;
        CmdUtils.setPreview('<br/><p style="font-size: 24px; font-weight: bold; color: #ddf">' +
            '<a target=_blank href="' + short_url + '">' + short_url + '</a>' +
            '</p>');
        CmdUtils.setClipboard(short_url);
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
        "http://www.slideshare.net/search/slideshow?q={text}&submit=post&searchfrom=header&x=0&y=0"
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
        "http://stackoverflow.com/search?q={text}"
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
        CmdUtils.addTab("http://thepiratebay.org/search.php?q=" + search_string);
        CmdUtils.addTab("https://rarbgmirror.org/torrents.php?search=" + search_string);
        CmdUtils.addTab("http://1337x.to/search/harakiri/" + search_string+'/');
        CmdUtils.addTab("https://torrentz2.eu/search?f=" + search_string+'/');
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
        url: "http://api.microsofttranslator.com/V2/Ajax.svc/" + method,
        data: params,
    });
}

CmdUtils.CreateCommand({
    name: "translate",
    description: "Translates from one language to another.",
    icon: "https://www.bing.com/translator/favicon.ico",
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
    <a href="http://www.microsofttranslator.com">Bing Translator</a> toolbar.\
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
            if (T[0] = '"') T.split("").slice(1, -1).join("");
            if (typeof isSelected !== 'undefined' && _selection == true) {
                CmdUtils.setSelection(T);
                CmdUtils.closePopup();
            }
        } else {
            CmdUtils.setPreview("text is too short or too long. try translating <a target=_blank href=https://www.bing.com/translator/>manually</a>");
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
            if (T[0] = '"') T.split("").slice(1, -1).join("");
            CmdUtils.setPreview(T);
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
        jQuery(pblock).load("http://validator.w3.org/check?uri="+encodeURI(CmdUtils.getLocation())+" div#results");
    },
    execute: CmdUtils.SimpleUrlBasedCommand("http://validator.w3.org/check?uri={location}")
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
    icon: "http://web.archive.org/static/images/archive.ico",
    preview: function (pblock, theShout) {
        pblock.innerHTML = "Buscar versiones antiguas del sitio <b>" + theShout.text + "</b>";
    },
    execute: function (directObj) {
        CmdUtils.closePopup();
        var url = directObj.text;
        if (!url) url = CmdUtils.getLocation();
        var wayback_machine = "http://web.archive.org/web/*/" + url;
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
    execute: CmdUtils.SimpleUrlBasedCommand("http://www.wunderground.com/cgi-bin/findweather/getForecast?query={text}")
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
        var apiUrl = "http://" + langCode + ".wikipedia.org/w/api.php";

        CmdUtils.ajaxGetJSON("https://" + langCode + ".wikipedia.org/w/api.php?action=query&list=search&srsearch="+searchText+"&srlimit=5&format=json", function (resp) {
            function generateWikipediaLink(title) {
                return "http://" + langCode + ".wikipedia.org/wiki/" +title.replace(/ /g, "_");
            }
            function wikiAnchor(title) {
                return "<a target=_blank href='"+generateWikipediaLink(title)+"'>"+title+"</a>";
            }
            previewBlock.innerHTML = "";
            for (var i = 0; i < resp.query.search.length; i++) {
                previewBlock.innerHTML += "<p>"+wikiAnchor(resp.query.search[i].title) + "<br>"+resp.query.search[i].snippet+"</p>";
            }
        });
    },
    execute: CmdUtils.SimpleUrlBasedCommand("http://en.wikipedia.org/wiki/Special:Search?search={text}")
});

CmdUtils.CreateCommand({
    name: "yahoo-answers",
    description: "Search Yahoo! Answers for",
    author: {},
    icon: "http://l.yimg.com/a/i/us/sch/gr/answers_favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Yahoo! Answers for",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "http://answers.yahoo.com/search/search_result;_ylv=3?p={text}"
    )
});

CmdUtils.CreateCommand({
    name: "yahoo-search",
    description: "Search Yahoo! for",
    author: {},
    icon: "http://www.yahoo.com/favicon.ico",
    homepage: "",
    license: "",
    preview: "Search Yahoo! for",
    execute: CmdUtils.SimpleUrlBasedCommand(
        "http://search.yahoo.com/search?p={text}&ei=UTF-8"
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
    icon: "https://png.icons8.com/metro/50/000000/calculator.png",
    require: "https://cdnjs.cloudflare.com/ajax/libs/mathjs/3.20.1/math.min.js",
    preview: pr = function preview(previewBlock, {text:text}) {
    	if (text.trim()!='') {
    		var m = new math.parser();
    		text = text.replace(/,/g,".");
    		text = text.replace(/ /g,"");
	        previewBlock.innerHTML = m.eval(text);
	        //CmdUtils.ajaxGet("http://api.mathjs.org/v1/?expr="+encodeURIComponent(args.text), (r)=>{ previewBlock.innerHTML = r; });
	    }
		else
	        previewBlock.innerHTML = desc;
    },
    execute: function ({text:text}) { 
    	if (text.trim()!='') {
    		var m = new math.parser();
    		text = text.replace(",",".");
    		text = text.replace(" ","");
            text = m.eval(text);
            CmdUtils.setSelection(text); 
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
    description: "Gives the meaning of a word, using answers.com.",
    help: "Try issuing &quot;define aglet&quot;",
    icon: "http://www.answers.com/favicon.ico",
//    timeout: 500,
    execute: CmdUtils.SimpleUrlBasedCommand(
        "http://answers.com/search?q={text}"
    ),
    preview: async function define_preview(pblock, {text: text}) {
        if (text.trim()=="") {
            pblock.innerHTML = "Gives the definition from answers.com";
            return;
        }
        pblock.innerHTML = "Gives the definition of the word "+text;
        var xml = await CmdUtils.post("http://services.aonaware.com/DictService/DictService.asmx/DefineInDict", { text: text, dictId: "wn" } );
        pblock.innerHTML = (
            jQuery(xml)
            .find("WordDefinition > Definitions > Definition:first-child > WordDefinition")
            .text()
            .replace(/^\s*.+/, "<h2>$&</h2>")
            .replace(/\[[^\]]*\]/g, "")
            .replace(/\d+:/g, "<br/><strong>$&</strong>")
            .replace(/1:/g, "<br/>$&"));
        }
});

CmdUtils.CreateCommand({
    names: ["base64decode","b64d","atob"],
    description: "base64decode",
    author: {
        name: "rostok",
    },
    license: "GPL",
    execute: function execute({text:text}) {
        CmdUtils.setSelection(atob(text));
    },
    preview: function preview(pblock, {text:text}) {
        pblock.innerHTML = atob(text);
    },
});

CmdUtils.CreateCommand({
    names: ["base64encode","b64e", "btoa"],
    description: "base64encode",
    author: {
        name: "rostok",
    },
    license: "GPL",
    execute: function execute({text:text}) {
        CmdUtils.setSelection(btoa(text));
    },
    preview: function preview(pblock, {text:text}) {
        pblock.innerHTML = btoa(text);
    },
});

CmdUtils.CreateCommand({
    names: ["urldecode"],
    description: "urldecode",
    author: {
        name: "rostok",
    },
    license: "GPL",
    execute: function execute({text:text}) {
        CmdUtils.setSelection(decodeURI(text));
    },
    preview: function preview(pblock, {text:text}) {
        pblock.innerHTML = decodeURI(text);
    },
});

CmdUtils.CreateCommand({
    names: ["urlencode"],
    description: "urlencode",
    author: {
        name: "rostok",
    },
    license: "GPL",
    execute: function execute({text:text}) {
        CmdUtils.setSelection(encodeURI(text));
    },
    preview: function preview(pblock, {text:text}) {
        pblock.innerHTML = encodeURI(text);
    },
});

CmdUtils.CreateCommand({
    name: "invert",
    description: "Inverts all colors on current page<br><br>Based on <a target=_blank href=https://stackoverflow.com/questions/4766201/javascript-invert-color-on-all-elements-of-a-page>this</a>.",
    execute: function execute(){
        chrome.tabs.executeScript({code:`
        javascript: (
            function () { 
            // the css we are going to inject
            var css = 'html {-webkit-filter: invert(100%);' +
                '-moz-filter: invert(100%);' + 
                '-o-filter: invert(100%);' + 
                '-ms-filter: invert(100%); }',
            
            head = document.getElementsByTagName('head')[0],
            style = document.createElement('style');
            
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

            document.body.style.backgroundColor = "rgb("+invert(window.getComputedStyle(document.body, null).getPropertyValue('background-color')).join(",")+")";
            }());
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
            pblock.innerHTML = _cmd.description+"<br><br>to grep make the argument longer ("+text.length+"/3)";
        } else {
            var arr = [];
            chrome.extension.getBackgroundPage().resultview = pblock.innerHTML = "";
            chrome.tabs.query({}, (t)=>{
            t.map((b)=>{
              if (b.url.match('^https?://'))
              chrome.tabs.executeScript(b.id, 
                                        {code:"document.body.innerText.toString();"}, 
                                        (ret)=>{
                                          if (typeof ret==='undefined') return;
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
    icon: "http://dl1.cbsistatic.com/i/r/2017/07/06/0804523a-72e9-47ec-bcd9-e003548e6617/thumbnail/64x64/772606befe50fb3181b20c32020629cf/imgingest-1637296860404337622.png",
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
            pblock.innerHTML = _cmd.description+"<br><br>to regexp make the argument longer ("+text.length+"/3)";
        } else {
            var arr = [];
            chrome.extension.getBackgroundPage().resultview = pblock.innerHTML = "";
            chrome.tabs.query({}, (t)=>{
            t.map((b)=>{
              if (b.url.match('^http'))
              chrome.tabs.executeScript(b.id, 
                                        {code:"document.body.innerText.toString();"}, 
                                        (ret)=>{
                                          if (typeof ret==='undefined') return;
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
    preview: function preview(pblock, {text:text, _cmd}) {
        text = text.trim();
        if (text.length <= 2) {
            pblock.innerHTML = _cmd.description+"<br><br>to grep make the argument longer ("+text.length+"/3)";
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
    author: {
        name: "rostok"
    },
    license: "MIT",
    execute: ()=> {
      CmdUtils.addTab("result.html");
    },
    preview: function preview(pblock, {text:text, _cmd}) {
        text = text.trim().toLowerCase();
        var substrings = text.split(/\s+/);
        if (text.length <= 2) {
            pblock.innerHTML = _cmd.description+"<br><br>to filter make the argument longer ("+text.length+"/3)";
        } else {
            var arr = [];
            chrome.extension.getBackgroundPage().resultview = pblock.innerHTML = "";
            chrome.tabs.query({}, (t)=>{
            t.reduce((a,b)=>{
              console.log(b.id);
              chrome.tabs.executeScript(b.id, 
                                        {code:"document.body.innerHTML.toString();"}, 
                                        (ret)=>{
                                          arr = arr.concat( 
                                            		jQuery('a', ret[0])
                                            		.absolutize(CmdUtils.getLocation())
                                            		.map( function() { return jQuery(this).attr('href'); })
                                            		.get()
                                            		//.filter(s=>s.indexOf(text)>=0) 
                                            		.filter(s=>substrings.every(subs => s.toLowerCase().indexOf(subs)>=0))                                             
                                          );
                						  pblock.innerHTML = arr.filter((v, i, a) => a.indexOf(v) === i).join("<br/>");
                                          chrome.extension.getBackgroundPage().resultview = pblock.innerHTML;
                                        });
            });
          });
        }
    },
});


CmdUtils.CreateCommand({
    names: ["get-urls"],
    icon: "",
    description: "gets all open tab urls, add argument for filter",
    author: {
        name: "rostok"
    },
    license: "MIT",
    execute: ()=> {
      CmdUtils.addTab("result.html");
    },
    preview: function preview(pblock, {text:text}) {
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
        CmdUtils.addTab("http://www.mobygames.com/search/quick?q=" + encodeURIComponent(args.text));
    },
    preview: function preview(pblock, {text:text}) {
        pblock.innerHTML = "Search MobyGames";
        if (text.trim()!="") 
        	jQuery(pblock).loadAbs("http://www.mobygames.com/search/quick?q=" + encodeURIComponent(text)+" #searchResults");
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
    execute: function execute({text:text}) {   
        CmdUtils.addTab("http://www.google.com/search?q=intitle%3A\"index of\" %2B\"Last Modified\" "+ encodeURIComponent(text) );
    },
    preview: function preview(pblock, args) {
        pblock.innerHTML = "just press enter and don't delay";
    },
});

CmdUtils.CreateCommand({
    names: ["thesaurus", "english-thesaurus"],
    description: "Searches different words with the same meaning",
    icon: "http://cdn.sfdict.com/hp/502812f9.ico",
	preview: function preview(pblock, {text:text}) {
        pblock.innerHTML = "Searches different words with the same meaning "+text;
        if (text=="") return;
        var url = "http://www.thesaurus.com/browse/" + encodeURIComponent(text);
        CmdUtils.ajaxGet(url, function(data) {
            pblock.innerHTML = jQuery(".MainContentContainer", data).html();
            jQuery("a", pblock).each(function() {
               $(this).attr("target", "_blank").attr("href", 'http://www.thesaurus.com'+$(this).attr("href"));
            });
            if (pblock.innerHTML=="undefined") pblock.innerHTML = "no words";
        });
    },
    execute: CmdUtils.SimpleUrlBasedCommand("http://www.thesaurus.com/browse/{text}") 
});

CmdUtils.CreateCommand({
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
    name: "open",
    description: "opens multiple links from clipboard or argument list in separate tabs",
    author: "rostok",
    icon: "res/icon-128.png",
    execute: function execute({text:text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        text.trim().split(/\s+/).forEach( s => { if (s.trim()!='') CmdUtils.addTab(s) } );
    },
    preview: function preview(pblock, {text:text}) {
        if (text.trim()=="") text = CmdUtils.getClipboard();
        text = text.trim().split(/\s+/).map( (s,a) => { return "<br><a target=_blank href='"+s+"'>"+s+"</a>"; } ).join("");
        pblock.innerHTML = "open:" + text;
    },
});

CmdUtils.CreateCommand({
    name: "cookies",
    description: "gets cookies, press Enter to save file, filter by domain or * for all",
    author: "Genuinous/rostok",
    require: ["https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js"],
    execute: function execute(args) {
        var blob = new Blob([CmdUtils.popupWindow.jQuery("#ubiq-command-preview").text()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "cookies.txt");
    },
    preview: function preview(pblock, {text:text}) {
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

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

// mark built-int commands
CmdUtils.CommandList.forEach((c)=>{c['builtIn']=true;});

// load custom scripts
if (typeof chrome!=='undefined')
if (chrome.storage)
chrome.storage.local.get('customscripts', function(result) {
	try {
		eval(result.customscripts || "");
	} catch (e) {
		console.error("custom scripts eval failed", e);
	}
});

