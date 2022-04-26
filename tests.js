// test.html / test.js provide rudimental framework to test ubichr commands
// all tests should are defined in `tests` array as objects with properties below
//     name: string with ubichr command 
//     args: command arguments
//     text: expected preview block .innerText result 
//     starsWithText: preview block .innerText is expected to start with this string
//     includesText: preview block .innerText is expected to include this string
//     html: expected preview block .innerHTML result
//     url: expected an open tab with this url 
//     exec: should command be executed
//     timeout: check after this delay
//     test(window): custom test function, should return true if OK; executed with bind() to this test struct
//
//	   attributes added automatically:
//     pass(message): called on test sucess
//     fail(message): called on test failure
// 
// once testing is started for each command a separate tab is opened and input is entered as defined above
// CmdUtils.onPopup() handler is executed that handles all the testing

var tests = [{
		name: 'calc',
		args: '2+2',
		text: '4',
		timeout: 1000,
	},
	{
		name: 'base64decode',
		args: 'QQ==',
		text: 'A'
	},
	{
		name: 'base64encode',
		args: 'A',
		text: 'QQ=='
	},
	{
		name: 'color-picker',
		args: '#ffff00',
		test: function (wnd) {
			return $("#rgbc", wnd.document).css("background-color") == 'rgb(255, 255, 0)';
		}
	},
	{
		name: 'sum',
		args: '1 2 3 4',
		text: '10'
	},
	{
		name: 'amazon',
		args: 'test',
		exec: true,
		url: '*://www.amazon.com/s?*k=test*',
		timeout: 1000,
	},
	{
		name: 'answer',
		args: 'ubiquity',
		exec: true,
		url: '*://www.answers.com/search?q=ubiquity&filter=all*',
		timeout: 1000,
	},
	{
		name: 'ask',
		args: 'test',
		exec: true,
		url: '*://www.ask.com/web?q=test*',
		timeout: 1000,
	},
	{
		name: 'code-search',
		args: 'test',
		exec: true,
		url: 'https://searchcode.com/?q=test',
		timeout: 1000,
	},
	{
		name: 'currency-converter',
		args: '100 EURPLN',
		starsWithText: '100 EUR =',
		timeout: 1000,
	},
	{
		name: 'command-gist',
		args: 'command-gist',
		starsWithText: "// UbiChr 'command-gist' command",
	},
	{
		name: 'debug-popup',
		exec: true,
		url: `chrome-extension://${window.location.host}/popup.html`,
	},
	{
		name: 'debug-popup-editor',
		exec: true,
		url: `chrome-extension://${window.location.host}/debugpopup.html`,
	},
	{
		name: 'encodeuricomponent',
		args: 'ąę',
		text: '%C4%85%C4%99',
	},
	{
		name: 'decodeuricomponent',
		args: '%C4%85%C4%99',
		text: 'ąę',
	},
	{
		name: 'define',
		args: 'test',
		timeout: 1000,
		starsWithText: 'from'
	},
	{
		name: 'dictionary',
		args: 'ubiquity',
		includesText: 'the state or capacity of being everywhere',
		timeout: 1000,
	},

];

var testurl = `chrome-extension://${window.location.host}/popup.html#test`;

$("#close").click(() => {
	CmdUtils.onPopup = function () {};
	var urls = tests.map(t=>t.url).filter(t=>typeof t!=='undefined');
	chrome.tabs.query({url:urls, active:false}, (t) => {
		t.map((b) => { chrome.tabs.remove(b.id, () => {}); });
	});
	chrome.tabs.query({active:false}, (t) => {
		t.map((b) => { 
			if(b.url.startsWith(testurl)) chrome.tabs.remove(b.id, () => {}); 
		});
	});
});

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

// return true if current window includes tab with this url
async function isTabOpen(url) {
	var t = await asyncfy(chrome.tabs.query)({url: url, currentWindow: true});
	return Array.isArray(t) && t.length > 0;
}

$("#start").click(() => {
	// are all names unique?
	if (tests.map(a => a.name).length !== [...new Set(tests.map(a => a.name))].length) {
		console.error("found not unique names in tests array:", tests.map(a => a.name).filter((e, i, a) => a.indexOf(e) !== i).join(","));
		CmdUtils.setBadge("!", "red");
		return;
	};
	tests = tests.sort((a, b) => a.name.localeCompare(b.name));

	// tests will be passed here
	CmdUtils.testing = {};

	// after popup window is open, this handler is executed and performs the test
	CmdUtils.onPopup = function (wnd) {
		if (wnd === undefined) return;
		var hash = wnd.location.hash || "";
		console.log(hash, hash.startsWith("#test"));
		if (hash.startsWith("#test")) {
			hash = hash.replace("#test", "");
			var t = CmdUtils.testing[hash];
			console.log("test", t, t.args);
			wnd.console.log("wnd", t.name, t.args, hash);
			wnd.ubiq_set_input(t.name + " " + t.args);
			wnd.ubiq_keydown_handler({
				keyCode: null,
				shiftKey: true
			}); // force new tabs to open in background
			if (t.exec) wnd.ubiq_execute();

			wnd.setTimeout(() => {
				var result = "❔ no test defined";
				if (typeof t.text === 'string') {
					result = "";
					if (wnd.ubiq_preview_el().innerText != t.text) return t.fail("text mismatch");
				} else
				if (typeof t.starsWithText === 'string') {
					result = "";
					if (!wnd.ubiq_preview_el().innerText.startsWith(t.starsWithText)) return t.fail("starsWithText mismatch");
				} else
				if (typeof t.includesText === 'string') {
					result = "";
					if (!wnd.ubiq_preview_el().innerText.includes(t.includesText)) return t.fail("includesText mismatch");
				} else
				if (typeof t.html === 'string') {
					result = "";
					if (wnd.ubiq_preview_el().innerHTML != t.html) return t.fail("html mismatch");
				} else
				if (typeof t.url === 'string') {
					result = "";
					if (!isTabOpen(t.url)) return t.fail("tab/url not found");
				} else
				if (typeof t.test === 'function') {
					result = "";
					if (!(t.test.bind(t))(wnd)) return t.fail("test mismatch");
				}
				t.pass(result);
			}, t.timeout);
		}
	};

	$("#builtin").empty();
	tests.forEach(t => {
		t.timeout = t.timeout || 0;
		t.el = $(`<span>${t.name}</span><br/>`).appendTo("#builtin");
		t.pass = function (msg = "") {
			$(t.el).prepend("✅").append(" " + msg);
		};
		t.fail = function (msg = "") {
			$(t.el).prepend("❌").append(" " + msg);
		};
		CmdUtils.testing[t.name] = t;
		CmdUtils.addTab(testurl + t.name, false);
	});
});