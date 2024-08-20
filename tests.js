// tests.html / tests.js provide rudimental framework to test ubichr commands
// all cases are defined in `tests` array as objects with properties below
//     name: string with ubichr command [necessary]
//     args: command arguments
// 
//     text: expected preview block .innerText result 
//     starsWithText: preview block .innerText is expected to start with this string
//     includesText: preview block .innerText is expected to include this string
//     includesTextLC: preview block .innerText is expected to include this string, all in lower case 
//     html: expected preview block .innerHTML result
//     includesHTML: preview block .innerHTML is expected to include this string
//     url: expected an open tab with this url, if url is array all urls must be opened, the syntax is compatible with chrome.tabs.query url option parameter with wildcards
// 
//     exec: true if command should be executed
// 
//     timeout: check is perfomed after this delay
//     init(window): custom function executed when testing is started, before timeout!
//     test(window): custom test function, should return true if OK
//     exit(window): custom function executed after test is complete (ie. for cleanup)
//     postexit(window): internal function executed after exit
//
//     attributes added automatically:
//     pass(message): called on test sucess
//     fail(message): called on test failure
//     result: string with pass/fail
//     el: element with test status with the followin structure
//
//              <div class=status name=testname>
//                  <span class=resulticon></span>
//                  <a class=runsingle name=>testname</a>
//                  <span class=resultmsg></span>
//              </div>
//
// custom commands may include above object inside a 'test' property
//
// once testing is started for each command a separate tab is opened and input is entered as defined above
// CmdUtils.onPopup() handler is executed that handles all the testing
// to prevent race condition of previous command preview asynchronous load the CmdUtils.loadLastInput is set to false so tabs with ubichr wont show last command

// tests will be passed here
CmdUtils.testing = {};
CmdUtils.loadLastInput = true; // this is set to false in initTests

var timeoutMin = 0;
var timeoutMultiplier = 1;
var extprefix =  navigator.userAgent.indexOf("Firefox") != -1 ? `moz-extension` : `chrome-extension`; 
var testurl = `${extprefix}://${window.location.host}/popup.html#test`;
var tests = [
    // internal methods tests
    { 
        internal:true,
        name: 'CmdUtils.addTab',
        exec: true,
        init: function (window) {
            CmdUtils.addTab('https://www.example.com');
        },
        test: async function (window) {
            const tabs = await chrome.tabs.query({ url: 'https://www.example.com/*' });
            return tabs.length > 0;
        },
        exit: function (window) {
            // Cleanup: Close the opened tab
            chrome.tabs.query({ url: 'https://www.example.com/*' }, (tabs) => {
                chrome.tabs.remove(tabs.map(tab => tab.id));
            });
        },
        timeout: 1000
    },{ 
        internal:true,
        name: 'CmdUtils.createCommand',
        exec: false,
        init: function (window) {
            CmdUtils.CreateCommand({
                name: "testCommand",
                description: "This is a test command",
                execute: function () {
                    console.log("Test Command Executed");
                }
            });
        },
        test: function (window) {
            return CmdUtils.CommandList.some(cmd => cmd.name === "testCommand");
        },
        exit: function (window) {
            // Cleanup: Remove the test command from the list
            CmdUtils.CommandList = CmdUtils.CommandList.filter(cmd => cmd.name !== "testCommand");
        },
        timeout: 1000
    },{ 
        internal:true,
        name: 'CmdUtils.setBadge',
        exec: false,
        init: function (window) {
            CmdUtils.setBadge('Test', '#FF0000');
        },
        test: function (window) {
            return new Promise((resolve) => {
                chrome.browserAction.getBadgeText({}, function(text) {
                    resolve(text === 'Test');
                });
            });
        },
        exit: function (window) {
            // Reset the badge to empty
            CmdUtils.setBadge('');
        },
        timeout: 1000
    },{ 
        internal:true,
        name: 'CmdUtils.ajaxGetJSON',
        exec: false,
        init: function (window) {
            CmdUtils.ajaxGetJSON('https://raw.githubusercontent.com/rostok/ubichr/master/manifest.json', (resp) => {
                this.response = resp;
            });
        },
        test: function () {
            return this.response && this.response.short_name == "UbiChr";
        },
        timeout: 1000
    },{ 
        internal:true,
        name: 'CmdUtils.ajaxGet',
        exec: false,
        init: function (window) {
            CmdUtils.ajaxGet('https://raw.githubusercontent.com/rostok/ubichr/master/manifest.json', (resp) => {
                this.response = JSON.parse(resp);
            });
        },
        test: function () {
            return this.response && this.response.short_name == "UbiChr";
        },
        timeout: 1000
    },{ 
        internal:true,
        name: 'CmdUtils.loadScripts',
        exec: false,
        init: function (window) {
            window.loadedScripts = window.loadedScripts || []
            var url = 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js';
            window.loadedScripts = window.loadedScripts.filter(u => u !== url);
            CmdUtils.loadScripts(url, () => {
                this.loadScripts_scriptLoaded = window._.VERSION == '4.17.21'; // Lodash exposes a global `_` object
            },window);
        },
        test: function () {
            return this.loadScripts_scriptLoaded === true;
        },
        exit: function () {
            delete window._; // Cleanup Lodash after the test
        },
        timeout: 1000
    },{ 
        internal:true,
        name: 'CmdUtils.setClipboard',
        exec: false,
        init: function (window) {
            CmdUtils.setClipboard('Clipboard Text');
            this.clipboardSet = CmdUtils.getClipboard() === 'Clipboard Text';
        },
        test: function () {
            return this.clipboardSet === true;
        },
        timeout: 500
    },{ 
        internal:true,
        name: 'CmdUtils.getClipboard',
        exec: false,
        init: function (window) {
            CmdUtils.setClipboard('Clipboard Text');
            this.clipboardText = CmdUtils.getClipboard();
        },
        test: function () {
            return this.clipboardText === 'Clipboard Text';
        },
        timeout: 500
    },{ 
        internal:true,
        name: 'CmdUtils.setClipboardHTML',
        exec: false,
        init: function (window) {
            CmdUtils.setClipboardHTML('<b>Bold Text</b>');
            this.clipboardHTMLSet = CmdUtils.getClipboardHTML() === '<b>Bold Text</b>';
        },
        test: function () {
            return this.clipboardHTMLSet === true;
        },
        timeout: 500
    },{ 
        internal:true,
        name: 'CmdUtils.getClipboardHTML',
        exec: false,
        init: function (window) {
            CmdUtils.setClipboardHTML('<b>Bold Text</b>');
            this.clipboardHTML = CmdUtils.getClipboardHTML();
        },
        test: function () {
            return this.clipboardHTML === '<b>Bold Text</b>';
        },
        timeout: 500
    },    
    // commands tests
    {
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
        url: `${extprefix}://${window.location.host}/popup.html`,
    }, {
        name: 'debug-popup-editor',
        exec: true,
        url: `${extprefix}://${window.location.host}/debugpopup.html`,
    }, {
        name: 'edit-ubiquity-commands',
        exec: true,
        url: `${extprefix}://${window.location.host}/options.html`,
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
        includesText: `${extprefix}://`,
        timeout: 2000,
    }, {
        name: 'image-search',
        args: 'test',
        exec: true,
        timeout: 3000,
        includesHTML: CmdUtils.getcmd("gimages").key ? '<img' : undefined, // images available if command has registered credentials
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
        url: `${extprefix}://${window.location.host}/help.html`,
    }, {
        name: 'history',
        includesText: 'help help',
        timeout: 2000,
    }, {
        name: 'imdb',
        args: 'Nausicaa of the Valley of the Wind',
        includesHTML: 'tt0087544',
        timeout: 3000
    }, {
        name: 'grep',
        args: 'Questions',
        url: 'https://stackoverflow.com/',
        timeout: 3000,
        includesText: 'Questions',
        init: function (w) {
            [this.url].flat().forEach(u=>CmdUtils.addTab(u, false));
            w.setTimeout(() => {
                w.ubiq_show_matching_commands();
            }, this.timeout *.1);
        },
    }, {
        name: 'lasterror',
        args: '',
        timeout: 500,
        includesText: 'ReferenceError: q is not defined',
        init: function (w) {
            try { CmdUtils.popupWindow.ubiq_show_preview({name:'failingcmd',preview:()=>console.log(q)}) } catch(e) { }
        },
    }, {
        name: 'indexof',
        args: 'Blade.Runner.1982',
        exec: true,
        url: `*://www.google.com/search?*q=intitle*`,
    }, {
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
        name: 'cpan',
        args: 'ubiquity',
        exec: true,
        url:  '*://metacpan.org/search?q=ubiquity'
    }, {
        name: 'reload-ubiquity'
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
        name: 'msn-search',
        args: 'test',
        exec: true,
        url: '*://www.bing.com/search?q=test*'
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
        name: 'slideshare',
        args: 'test',
        exec: true,
        url: '*://www.slideshare.net/search/slideshow?q=*'
    }, {
        name: 'stackoverflow-search',
        args: 'ubiquity',
        timeout: 3000,
        url: '*://stackoverflow.com/search?q=ubiquity*'
    }, {
        name: 'translate',
        args: 'kakao jest już zimne',
        timeout: 1000,
        includesTextLC: 'cocoa is already cold'
    }, {
        name: 'translate-google',
        args: 'weltschmerz',
        exec: true,
        timeout: 1000,
        url: '*://translate.google.com/?sl=auto&*text=weltschmerz'
    }, {
        name: 'save',
        args: 'https://code.jquery.com/jquery-3.6.0.slim.min.js',
        exec: true,
        timeout: 4000,
        includesHTML: 'download="bulk.zip"'
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
        args: 'stackoverflow questions',
        url: 'https://stackoverflow.com/',
        timeout: 3000,
        includesText: 'https://stackoverflow.com/questions',
        init: function (w) {
            [this.url].flat().forEach(u=>CmdUtils.addTab(u, false));
            // w.setTimeout(() => {
            //     w.ubiq_show_matching_commands();
            // }, this.timeout * .9);
        },
    }, {
        name: 'links-open'
    }, {
        name: 'thesaurus',
        args: 'ubiquitous',
        timeout: 2000,
        includesText: 'omnipresent'
    }, {
        name: 'settings-chrome',
        timeout: 1000,
        exec: true,
        url: 'chrome://settings/'
    }, {
        name: 'replace-selection'
    }, {
        name: 'cookies',
        starsWithText: '# Enter to save',
        timeout: 500,
        includesText: 'FALSE'
    }, {
        name: 'translate-en',
        args: 'kakao jest już zimne',
        timeout: 1000,
        includesTextLC: 'cocoa is already cold'
    }, {
        name: 'translate-pl',
        args: 'cocoa is already cold',
        timeout: 1000,
        includesTextLC: 'kakao jest już zimne'
    }, {
        name: 'pwd-chrome',
        exec: true,
        url: 'chrome://settings/passwords'
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
        timeout: 2000,
        includesText: '✠',
        url: '*://unicode-search.net/*maltese*'
    }, {
        name: 'jquery'
    }, {
        name: 'inject-js'
    }, {
        name: 'whois',
        args: '3e.pl',
        exec: true,
        url: '*://who.is/whois/3e.pl*'
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
        name: 'open',
        args: '3e.pl wired.com',
        exec: true,
        url: ["*://3e.pl/*","*://www.wired.com/*"]
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
tests.map(t=>t.name)
// return true if current window includes tab with this url
async function isTabOpen(url) {
    // var t = await asyncfy(chrome.tabs.query)({url: url, currentWindow: true});
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
            if (t.exec) wnd.console.log('executing',wnd.loadedScripts);
            if (t.exec) wnd.ubiq_execute.apply(wnd);

            function assert(cond, msg) { if (!cond) throw(msg); }

            wnd.setTimeout(async () => {
                var error = "";
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
                    if (typeof t.includesTextLC === 'string')
                        assert(wnd.ubiq_preview_el().innerText.toLowerCase().includes(t.includesTextLC.toLowerCase()), 'includesText mismatch');
                    if (typeof t.html === 'string')
                        assert(wnd.ubiq_preview_el().innerHTML == t.html, 'html mismatch');
                    if (typeof t.includesHTML === 'string')
                        assert(wnd.ubiq_preview_el().innerHTML.includes(t.includesHTML), 'includesHTML mismatch');
                    if (typeof t.test === 'function')
                        assert(t.test(wnd), 'test mismatch');
                } catch (e) {
                    console.error(t.name, 'failed with', e);
                    error = e;
                }

                var aftershot = ()=>{};
                if (error == "") {
                    t.pass('');
                    if (wnd.location.href!==`${extprefix}://${window.location.host}/tests.html`) aftershot = ()=>{ wnd.close() };
                    // var urls = [];
                    // if (typeof t.url === 'string') urls.push(t.url)
                    // chrome.tabs.query({url:urls}, (t) => {
                    //     t.filter(b=>!b.url.includes('/tests.html')).map((b) => { chrome.tabs.remove(b.id, () => {}); });
                    // });
                } else {
                    t.fail(error);
                }
                // takeShot(wnd, t, aftershot);
                aftershot();
                t.exit(wnd);
                t.postexit(wnd);
            }, t.timeout);
        }
    };
}

function runSingleTest(t, delay=0) {
    initTests();
    if (typeof t==='undefined') return;
    t.timeout = t.timeoutOrg * timeoutMultiplier || timeoutMin;
    t.el = $(`div.status[name='${t.name}']`).toArray().shift();
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
    if (t.internal) {
        // Run internal test directly with timeout
        setTimeout(() => {
            try {
                t.init(window);
                setTimeout(() => {
                    if (t.test(window)) {
                        t.pass();
                    } else {
                        t.fail("Test failed");
                    }
                    t.exit(window);
                }, t.timeout);
            } catch (e) {
                t.fail(e.message || "Test exception");
                t.exit(window);
            }
        }, delay);
    } else {
        // Open new tab and run test as before
        setTimeout(() => {
            CmdUtils.addTab(testurl + t.name, false);

            // wait a while and get back to this tab
            chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                setTimeout(() => {
                    chrome.tabs.update(tabs[0].id, { selected: true, active: true });
                }, 2000 * timeoutMultiplier);
            });
        }, delay);
    }
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
             .filter(t=>Object.getOwnPropertyNames(t).length>1) // only full tests should be run
             .concat( CmdUtils.CommandList.filter(t=>typeof t.test !== 'undefined').map(c=>{return {...c.test, name:c.name}}) )
             .sort((a, b) => a.name.localeCompare(b.name));

// initialize with default values
tests.forEach(t => {
    t.args = t.args || '';
    t.init = t.init || (()=>{});
    t.exit = t.exit || (()=>{});
    t.postexit = (()=>{});
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

$("#ubiversion").html("UbiChr v"+CmdUtils.VERSION);
$('#tests').append( tests.map(t=>t.name).map(t=>`<div class=status name='${t}'><a class=runsingle name='${t}' href=#>${t}</a></div>`).join('') );
$('#untested').append( CmdUtils.CommandList.filter(c=>c.builtIn).map(c=>c.name).filter(c=>tests.map(t=>t.name).indexOf(c)<0).sort().join('<br>') );
$('#untestedcustom').append( CmdUtils.CommandList.filter(c=>!c.builtIn).map(c=>c.name).filter(c=>tests.map(t=>t.name).indexOf(c)<0).sort().join('<br>') );
$('a.runsingle').click(function() { runSingleTest(tests.find(t=>t.name==$(this).attr('name'))); });
$('#autoclose').click( ()=>{
    tests.forEach(t=>t.postexit=(()=>{}));
    if ($('#autoclose').is(':checked')) 
        tests.filter(t=>typeof t.url !== 'undefined').forEach(t=>t.postexit = function(w) {
            chrome.tabs.query({}, (tb)=>console.log(`AUTOCLOSING ${t.url} FOUND ${tb.map(b=>b.url)}`) ); 
            chrome.tabs.query({url:this.url,currentWindow:true}, tb => chrome.tabs.remove( tb.map(b=>b.id) ) ); 
            w.close();
        });
});
$('#start').click(() => {
    timeoutMin = 0;
    timeoutMultiplier = 10;
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
});

$('#retry').click(() => {
    var i = 0;
    tests.filter(t=>t.result=="fail").forEach(t=>runSingleTest(t, (++i)*500));
});

$('#close').click(() => {
    CmdUtils.onPopup = function () {};
    var urls = tests.map(t=>t.url).filter(t=>typeof t!=='undefined').flat();
    // console.log("closing",urls);
    chrome.tabs.query({url:urls,currentWindow:true}, (t) => chrome.tabs.remove(t.map(b=>b.id), () => {}) );
    chrome.tabs.query({active:false,currentWindow:true}, (t) => chrome.tabs.remove(t.filter(b=>b.url.startsWith(testurl)).map(b=>b.id), () => {}) );
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