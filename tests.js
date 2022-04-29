// test.html / test.js provide rudimental framework to test ubichr commands
// all cases are defined in `tests` array as objects with properties below
//     name: string with ubichr command [necessary]
//     args: command arguments
// 
//     text: expected preview block .innerText result 
//     starsWithText: preview block .innerText is expected to start with this string
//     includesText: preview block .innerText is expected to include this string
//     html: expected preview block .innerHTML result
//     includesHTML: preview block .innerHTML is expected to include this string
//     url: expected an open tab with this url 
// 
//     exec: true if should command be executed
// 
//     timeout: check is perfomed after this delay
//     init(window): custom function executed when testing is started, before timeout!
//     test(window): custom test function, should return true if OK
//     exit(window): custom function executed after test is complete (ie. for cleanup)
//
//     attributes added automatically:
//     pass(message): called on test sucess
//     fail(message): called on test failure
// 
// custom commands may include above object inside test property
//
// once testing is started for each command a separate tab is opened and input is entered as defined above
// CmdUtils.onPopup() handler is executed that handles all the testing


// tests will be passed here
CmdUtils.testing = {};
CmdUtils.loadLastInput = true; // this is set to false in initTests

var timeoutMin = 0;
var timeoutMultiplier = 1;
var testurl = `chrome-extension://${window.location.host}/popup.html#test`;
var tests = [{
        name: 'calc',
        args: '2+2',
        text: '4',
        timeout: 1000,
    }, {
        name: 'base64decode',
        args: 'QQ==',
        text: 'A'
    }, {
        name: 'base64encode',
        args: 'A',
        text: 'QQ=='
    }, {
        name: 'color-picker',
        args: '#ffff00',
        test: function (wnd) {
            return $('#rgbc', wnd.document).css('background-color') == 'rgb(255, 255, 0)';
        }
    }, {
        name: 'sum',
        args: '1 2 3 4',
        text: '10'
    }, {
        name: 'amazon-search',
        args: 'test',
        exec: true,
        url: '*://www.amazon.com/s?*k=test*',
        timeout: 1000,
    }, {
        name: 'answers-search',
        args: 'ubiquity',
        exec: true,
        url: '*://www.answers.com/search?q=ubiquity&filter=all*',
        timeout: 1000,
    }, {
        name: 'ask-search',
        args: 'test',
        exec: true,
        url: '*://www.ask.com/web?q=test*',
        timeout: 1000,
    }, {
        name: 'code-search',
        args: 'test',
        exec: true,
        url: 'https://searchcode.com/?q=test',
        timeout: 1000,
    }, {
        name: 'currency-converter',
        args: '100 EURPLN',
        starsWithText: '100 EUR =',
        timeout: 1000,
    }, {
        name: 'command-gist',
        args: 'command-gist',
        starsWithText: "// UbiChr 'command-gist' command",
        exec: true,
        timeout: 2000,
        url: 'https://gist.github.com/'
    }, {
        name: 'debug-popup',
        exec: true,
        url: `chrome-extension://${window.location.host}/popup.html`,
    }, {
        name: 'debug-popup-editor',
        exec: true,
        url: `chrome-extension://${window.location.host}/debugpopup.html`,
    }, {
        name: 'edit-ubiquity-commands',
        exec: true,
        url: `chrome-extension://${window.location.host}/options.html`,
    }, {
        name: 'discogs',
        args: 'seefeel',
        exec: true,
        url: `https://www.discogs.com/search/?type=all&q=seefeel`,
    }, {
        name: 'ebay-search',
        args: 'test',
        exec: true,
        url: `https://www.ebay.com/sch/i.html?_nkw=test`,
    }, {
        name: 'encodeuricomponent',
        args: 'ąę',
        text: '%C4%85%C4%99',
    }, {
        name: 'decodeuricomponent',
        args: '%C4%85%C4%99',
        text: 'ąę',
    }, {
        name: 'define',
        args: 'charcoal',
        timeout: 1000,
        starsWithText: 'from'
    }, {
        name: 'dictionary',
        args: 'ubiquity',
        includesText: 'the state or capacity of being everywhere',
        timeout: 2000,
    }, {
        name: 'emoji',
        args: 'exploding head',
        includesText: '🤯',
        timeout: 3000,
    }, {
        name: 'extensions-chrome',
        exec: true,
        url: `chrome://extensions/`,
    }, {
        name: 'flickr',
        args: 'test',
        exec: true,
        url: `https://www.flickr.com/search/?q=test&w=all`,
    }, {
        name: 'gcalculate',
        args: '4+4',
        exec: true,
        url: '*://www.google.com/search?q=4%2B4*'
    }, {
        name: 'lyrics',
        args: 'Here’s to You Joan Baez',
        exec: true,
        url: '*://genius.com/search?q=Here*'
    }, {
        name: 'get-urls',
        includesText: 'chrome-extension://',
        timeout: 2000,
    }, {
        name: 'image-search',
        args: 'test',
        exec: true,
        timeout: 3000,
        includesHTML: '<img',
        url: '*://www.google.com/search?tbm=isch&q=test*'
    }, {
        name: 'giphy',
        args: 'test',
        exec: true,
        url: '*://giphy.com/search/test*'
    }, {
        name: 'help',
        args: 'help',
        exec: true,
        includesText: 'Congratulations',
        url: `chrome-extension://${window.location.host}/help.html`,
    }, {
        name: 'history',
        includesText: 'help help',
        timeout: 2000,
    }, {
        name: 'imdb',
        args: 'Nausicaa of the Valley of the Wind',
        includesText: 'Kaze no tani',
        timeout: 3000
    }, {
        name: 'grep',
        args: 'Questions',
        url: 'https://stackoverflow.com/',
        timeout: 3000,
        includesText: 'Questions',
        init: function (w) {
            CmdUtils.addTab(this.url, false);
            w.setTimeout(() => {
                w.ubiq_show_matching_commands();
            }, this.timeout *.1);
        },
    }, {
        name: 'indexof',
        args: 'Blade.Runner.1982',
        exec: true,
        url: `*://www.google.com/search?*q=intitle*`,
    },
    {
        name: 'isdown',
        args: '3e.pl',
        exec: true,
        includesText: 'is up',
        timeout: 2000
    }, {
        name: 'command-source',
        args: 'command-gist',
        starsWithText: "// UbiChr 'command-gist' command",
    }, {
        name: 'bugzilla'
    }, {
        name: 'close'
    }, {
        name: 'yippy'
    }, {
        name: 'cpan'
    }, {
        name: 'reload-ubiquity'
    }, {
        name: 'imdb-old',
        args: 'precious find',
        timeout: 2000,
        includesText: 'Precious Find (1996)',
        exec: true,
        url: '*://www.imdb.com/find?*q=precious%20find*'
    }, {
        name: 'lastfm',
        args: 'autechre',
        timeout: 2000,
        exec: true,
        url: '*://www.last.fm/music/Autechre*'
    }, {
        name: 'maps',
        args: 'warsaw',
        timeout: 2000,
        exec: true,
        includesHTML: '<iframe',
        url: '*://www.google.com/maps/place/Wars*'
    }, {
        name: 'oldmaps',
        args: 'warsaw',
        timeout: 5000,
        exec: true,
        includesHTML: 'map-canvas',
        url: '*://www.google.com/maps/place/Wars*'
    }, {
        name: 'msn-search'
    }, {
        name: 'new-tab',
        args: '3e.pl',
        exec: true,
        url: '*://www.3e.pl/*',
        timeout: 2000
    }, {
        name: 'print'
    }, {
        name: 'search'
    }, {
        name: 'shorten-url',
        args: 'https://github.com/rostok/ubichr',
        exec: true,
        timeout: 2000,
        includesText: 'https://tinyurl.com/y2bvysun'
    }, {
        name: 'slideshare'
    }, {
        name: 'stackoverflow-search',
        args: 'ubiquity',
        timeout: 3000,
        url: '*://stackoverflow.com/search?q=ubiquity*'
    }, {
        name: 'translate',
        args: 'kakao jest już zimne',
        timeout: 1000,
        includesText: 'cocoa is already cold'
    }, {
        name: 'validate'
    }, {
        name: 'wayback',
        args: '3e.pl',
        timeout: 3000,
        url: '*://web.archive.org/web/*/3e.pl'
    }, {
        name: 'weather',
        timeout: 1000,
        args: 'warsaw',
        exec: true,
        url: '*://www.wunderground.com/weather/pl/warsaw'
    }, {
        name: 'wikipedia',
        args: 'rutger hauer',
        includesText: 'Rutger',
        exec: true,
        timeout: 2500,
        url: '*://en.wikipedia.org/wiki/*Rutger*'
    }, {
        name: 'yahoo-search',
        args: 'ubichr',
        exec: true,
        url: '*://search.yahoo.com/search?p=ubichr*'
    }, {
        name: 'youtube',
        args: 'bvovb',
        exec: true,
        url: '*://www.youtube.com/results?search_query=bvovb*'
    }, {
        name: 'urldecode',
        args: 'url%20encode',
        includesText: 'url encode',
    }, {
        name: 'urlencode',
        args: 'url encode',
        includesText: 'url%20encode'
    }, {
        name: 'invert'
    }, {
        name: 'regexp'
    }, {
        name: 'grepInnerHTML'
    }, {
        name: 'links',
        args: 'stackoverflow questions tagged',
        url: 'https://stackoverflow.com/',
        timeout: 3000,
        includesText: 'https://stackoverflow.com/questions/tagged/',
        init: function (w) {
            [this.url].flat().forEach(u=>CmdUtils.addTab(u, false));
            // w.setTimeout(() => {
            //     w.ubiq_show_matching_commands();
            // }, this.timeout * .9);
        },
    }, {
        name: 'links-open'
    }, {
        name: 'mobygames',
        args: 'shadow of the beast',
        timeout: 2000,
        includesText: 'Shadow of the Beast',
        exec: true,
        url: '*://www.mobygames.com/search/quick?q=shadow*beast*'
    }, {
        name: 'thesaurus',
        args: 'ubiquity',
        timeout: 2000,
        includesText: 'omnipresence'
    }, {
        name: 'settings-chrome',
        timeout: 1000,
        exec: true,
        url: 'chrome://settings/'
    }, {
        name: 'replace-selection'
    }, {
        name: 'cookies'
    }, {
        name: 'translate-en',
        args: 'kakao jest już zimne',
        timeout: 1000,
        includesText: 'cocoa is already cold'
    }, {
        name: 'translate-pl',
        args: 'cocoa is already cold',
        timeout: 1000,
        includesText: 'kakao jest już zimne'
    }, {
        name: 'pwd-chrome'
    }, {
        name: 'site-search',
        'args': 'test',
        'exec': true,
        'timeout': 1000,
        'url': 'https://google.com/search?q=test'
    }, {
        name: 'save'
    }, {
        name: 'unicode',
        args: 'maltese cross',
        timeout: 1000,
        includesText: '✠',
        url: '*://unicode-search.net/*maltese*'
    }, {
        name: 'jquery'
    }, {
        name: 'inject-js'
    }, {
        name: 'whois'
    }, {
        name: 'allow-text-selecion'
    }, {
        name: 'grayscale'
    }, {
        name: 'wolfram',
        'args': 'test',
        'exec': true,
        'timeout': 1000,
        'url': 'https://www.wolframalpha.com/input/?i=test'
    }, {
        name: 'history-clear'
    }, {
        name: 'unmark'
    }, {
        name: 'mark'
    }, {
        name: 'open'
    }, {
        name: 'man',
        'args': 'test',
        'exec': true,
        'timeout': 1000,
        'url': 'http://man.he.net/?section=all&topic=test'
    }, {
        name: 'merge-tabs'
    }, {
        name: 'translate-google'
    }, {
        name: 'alarm-clear'
    }, {
        name: 'alarm'
    }, {
        name: 'urban',
        args: 'shiv',
        exec: true,
        url: '*://www.urbandictionary.com/define.php?term=shiv',
        timeout: 1000
    }, {
        name: 'omnijquery'
    }, {
        name: 'genius',
        'args': 'test',
        'exec': true,
        'timeout': 1000,
        'url': 'https://genius.com/search?q=test'
    }, {
        name: '12ft',
    },{
        name: 'api-search',
        args: 'bit.ly',
        timeout: 1000,
        includesText: 'bit.ly allows users to shorten',
        url: '*://www.programmableweb.com/category/all/apis?keyword=bit.ly*'
    },{
        name: 'torrent-search',
        args: 'harakiri',
        exec: true,
        timeout: 3000,
        url: [
            "*://thepiratebay.org/search.php?q=*",
            "*://rarbgmirror.org/torrents.php?search=*",
            "*://1337x.to/search/*",
            "*://isohunt.nz/torrent/?ihq=*",
        ]
    }
];

// helper functions
// https://gist.github.com/BigSully/4468a58848df07736757a73d722d81f5
let asyncfy = fn => (...args) => {
    return new Promise((resolve, reject) => {
        fn(...args, (...results) => {
            let {
                lastError
            } = chrome.runtime
            if (typeof lastError !== 'undefined') reject(lastError);
            else results.length == 1 ? resolve(results[0]) : resolve(results);
        });
    });
};

function getTab(url) {
    return new Promise((resolve, reject) => {
        try {
            chrome.tabs.query({url:url,currentWindow: true,}, function (tabs) { resolve(tabs); })
        } catch (e) {
            reject(e);
        }
    })
}

// return true if current window includes tab with this url
async function isTabOpen(url) {
    var t = await asyncfy(chrome.tabs.query)({url: url, currentWindow: true});
	var t;
    try{
		t = await chrome.tabs.query({url: url, currentWindow: true},(tt)=>{});
    } catch(e){
        return false;
    }
    return Array.isArray(t) && t.length > 0;
}

function initTests() {
    // CmdUtils.DEBUG = true;
    CmdUtils.loadLastInput = false;

    // after popup window is open, this handler is executed and performs the test
    CmdUtils.onPopup = function (wnd) {
        if (wnd === undefined) return;
        var hash = wnd.location.hash || '';
        if (hash.startsWith('#test')) {
            wnd.console.log('hash',hash);
            hash = hash.replace('#test', '');
            var t = CmdUtils.testing[hash];
            wnd.console.log('callint init',t);
            t.init(wnd); 
            wnd.console.log('setting input',t.name + ' ' + t.args);
            wnd.ubiq_set_input(t.name + ' ' + t.args);
            wnd.console.log('sending keydown');
            wnd.ubiq_keydown_handler({keyCode: null,shiftKey: true}); // force new tabs to open in background
            if (t.exec) wnd.console.log('executing');
            if (t.exec) wnd.ubiq_execute();

            function assert(cond, msg) {
                if (!cond) {
                    t.fail(msg);
                    if(typeof t.exit === 'function') t.exit(wnd);
                    throw(t.name+' test failed!');
                }
            }

            wnd.setTimeout(async () => {
                try {
                    if (typeof t.url === 'string')
                        t.url = [t.url];
                    if (Array.isArray(t.url)) {
						var cond = true;
						t.url.forEach(async (v)=>{
							cond = cond && await isTabOpen(v);
						})
                        assert(cond, 'tabs/urls not found');
					}
                    if (typeof t.text === 'string')
                        assert(wnd.ubiq_preview_el().innerText == t.text, 'text mismatch');
                    if (typeof t.starsWithText === 'string')
                        assert(wnd.ubiq_preview_el().innerText.startsWith(t.starsWithText), 'starsWithText mismatch');
                    if (typeof t.includesText === 'string')
                        assert(wnd.ubiq_preview_el().innerText.includes(t.includesText), 'includesText mismatch');
                    if (typeof t.html === 'string')
                        assert(wnd.ubiq_preview_el().innerHTML == t.html, 'html mismatch');
                    if (typeof t.includesHTML === 'string')
                        assert(wnd.ubiq_preview_el().innerHTML.includes(t.includesHTML), 'includesHTML mismatch');
                    if (typeof t.test === 'function')
                        assert(t.test(wnd), 'test mismatch');
                } catch (e) {
                    console.error(e);
                    t.exit(wnd);
                    return;
                }
                t.pass('');
                t.exit(wnd);

                if (wnd.location.href!==`chrome-extension://${window.location.host}/tests.html`) wnd.close();
                // var urls = [];
                // if (typeof t.url === 'string') urls.push(t.url)
                // chrome.tabs.query({url:urls}, (t) => {
                //     t.filter(b=>!b.url.includes('/tests.html')).map((b) => { chrome.tabs.remove(b.id, () => {}); });
                // });
            
            }, t.timeout);
        }
    };
}

function runSingleTest(t, delay=0) {
    initTests();
    if (typeof t==='undefined') return;
    t.timeout = t.timeoutOrg * timeoutMultiplier || timeoutMin;
    t.el = $(`div.status[name='${t.name}']`).toArray().shift();
	console.log(t.el);
    if (typeof t.el==='undefined') 
        t.el = $(`<a class=runsingle name='${t.name}' href=#>${t.name}</a>`)
               .click(function() { runSingleTest(tests.find(t=>t.name==$(this).attr('name'))); })
               .wrap(`<div class=status name='${t.name}'></div>`)
			   .parent()
               .appendTo('#tests');
    $("span.resulticon,span.resultmsg",t.el).remove();
    t.result = "";
    t.pass = function (msg = '') {
        $("span.resulticon,span.resultmsg",t.el).remove();
        $(t.el).prepend('<span class=resulticon>✅</span>').append(` <span class=resultmsg><font color=green>${msg}</font></span>`);
        t.result = "pass";
    };
    t.fail = function (msg = '') {
        $("span.resulticon,span.resultmsg",t.el).remove();
        $(t.el).prepend('<span class=resulticon>❌</span>').append(` <span class=resultmsg><font color=red>${msg}</font></span>`);
        t.result = "fail";
    };
    CmdUtils.testing[t.name] = t;
    setTimeout(()=>{
        CmdUtils.addTab(testurl + t.name, false);

        // wait a while and get back to this tab
        chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
            setTimeout(()=>{
                chrome.tabs.update(tabs[0].id, {selected:true, active:true});
            },2000*timeoutMultiplier);
        });
    }, delay);
}

function runAllTests() {
    $('#tests').empty();
    tests.forEach(t => {
        runSingleTest(t);
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// start - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

tests = tests.filter(t=>true)
            //  .filter(t=>'isdown'.split(',').indexOf(t.name)>-1)
            //  .filter(t=>'define,dictionary'.split(',').indexOf(t.name)>-1)
             .filter(t=>Object.getOwnPropertyNames(t).length>1) // only full tests should be run
             .concat( CmdUtils.CommandList.filter(t=>typeof t.test !== 'undefined').map(c=>{return {...c.test, name:c.name}}) )
             .sort((a, b) => a.name.localeCompare(b.name));

// initialize with default values
tests.forEach(t => {
    t.args = t.args || '';
    t.init = t.init || (()=>{});
    t.exit = t.exit || (()=>{});
    t.timeoutOrg = t.timeout;
    t.timeout = t.timeoutOrg * timeoutMultiplier || timeoutMin;
});

// are all names unique?
if (tests.map(a => a.name).length !== [...new Set(tests.map(a => a.name))].length) {
    console.error('found not unique names in tests array:', tests.map(a => a.name).filter((e, i, a) => a.indexOf(e) !== i).join(','));
    CmdUtils.setBadge('!', 'red');
};


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// front-end - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

$('#tests').append( tests.map(t=>t.name).map(t=>`<div class=status name='${t}'><a class=runsingle name='${t}' href=#>${t}</a></div>`).join('') );
$('#untested').append( CmdUtils.CommandList.filter(c=>c.builtIn).map(c=>c.name).filter(c=>tests.map(t=>t.name).indexOf(c)<0).sort().join('<br>') );
$('#untestedcustom').append( CmdUtils.CommandList.filter(c=>!c.builtIn).map(c=>c.name).filter(c=>tests.map(t=>t.name).indexOf(c)<0).sort().join('<br>') );
$('a.runsingle').click(function() { runSingleTest(tests.find(t=>t.name==$(this).attr('name'))); });

$('#start').click(() => {
    timeoutMin = 0;
    timeoutMultiplier = 1;
    initTests();
    runAllTests();
});

$('#startslow').click(() => {
    timeoutMin = 5000;
    timeoutMultiplier = 10;
    initTests();
    runAllTests();
});

$('#startseq').click(() => {
    initTests();
    $('#tests').empty();

    var i = 0;
    tests.forEach(t => {
        runSingleTest(t, (++i)*500);
    });
});

$('#rempass').click(() => {
    tests.filter(t=>t.result=="pass").forEach(t=>{
        $(`div.status[name='${t.name}']`).remove();
    });
    tests = tests.filter(t=>t.result!="pass");
    // $('#tests').empty();
    // $('#tests').append( tests.map(t=>t.name).map(t=>`<span><a class=runsingle name='${t}' href=#>${t}</a></span>`).join('<br>') );
});

$('#close').click(() => {
    CmdUtils.onPopup = function () {};
    var urls = tests.map(t=>t.url).filter(t=>typeof t!=='undefined').flat();
    chrome.tabs.query({url:urls, active:false}, (t) => {
        t.map((b) => { chrome.tabs.remove(b.id, () => {}) });
    });
    chrome.tabs.query({active:false}, (t) => {
        t.map((b) => { 
            if(b.url.startsWith(testurl)) chrome.tabs.remove(b.id, () => {}); 
        });
    });
});

$('#generate').click(()=>{
    var a = CmdUtils.CommandList.filter(c=>c.tests)
                                .filter(c=>!(','+tests.map(t=>t.name).join()).includes(','+c.name))
                                .map(c=>{
                                    var t = {name: c.name};
                                    if(typeof c.url!=='undefined') {
                                        t.args = 'test';
                                        t.exec = true;
                                        t.timeout = 1000;
                                        t.url = c.url.replace('{QUERY}','test');
                                    }
                                    return t;
                                });
                                // .map(c=>return new{url:c.url, name:c.name});
    $('#tests').empty().append('<pre>'+JSON.stringify(a,0,2));
});