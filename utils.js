//
// Utils
//

if (!Utils) var Utils = {};

// opens new tab
Utils.openUrlInBrowser = function (url) {
	if (typeof browser !== 'undefined') {
		browser.tabs.create({
			"url": url
		});
	} else {
		window.open(url);
	}
};

// === {{{ Utils.paramsToString(params, prefix = "?") }}} ===
// Takes the given object containing keys and values into a query string
// suitable for inclusion in an HTTP GET or POST request.
//
// {{{params}}} is the object of key-value pairs.
//
// {{{prefix}}} is an optional string prepended to the result,
// which defaults to {{{"?"}}}.
Utils.paramsToString = function paramsToString(params, prefix) {
	var stringPairs = [];

	function addPair(key, value) {
		// explicitly ignoring values that are functions/null/undefined
		if (typeof value !== "function" && value != null)
			stringPairs.push(
				encodeURIComponent(key) + "=" + encodeURIComponent(value));
	}
	for (var key in params)
		if (Utils.isArray(params[key]))
			params[key].forEach(function p2s_each(item) {
				addPair(key, item)
			});
		else
			addPair(key, params[key]);
	return (prefix == null ? "?" : prefix) + stringPairs.join("&");
};

// === {{{ Utils.urlToParams(urlString) }}} ===
// Given a {{{urlString}}}, returns an object containing keys and values
// retrieved from its query-part.
Utils.urlToParams = function urlToParams(url) {
	var params = {},
		dict = {
			__proto__: null
		};
	for (let param of /^(?:[^?]*\?)?([^#]*)/.exec(url)[1].split("&")) {
		let [key, val] = /[^=]*(?==?(.*))/.exec(param);
		val = val.replace(/\+/g, " ");
		try {
			key = decodeURIComponent(key)
		} catch (e) {};
		try {
			val = decodeURIComponent(val)
		} catch (e) {};
		params[key] = key in dict ? [].concat(params[key], val) : val;
		dict[key] = 1;
	}
	return params;
}

// opens new tab with post request and provided data
Utils.postNewTab = function postNewTab(url, data) {
	var form = document.createElement("form");
	form.setAttribute("method", "post");
	form.setAttribute("action", url);
	form.setAttribute("target", "_blank");

	if (typeof data === 'string') data = Utils.urlToParams(data);
	for (var i in data) {
		if (data.hasOwnProperty(i)) {
			var input = document.createElement('input');
			input.type = 'hidden';
			input.name = i;
			input.value = data[i];
			form.appendChild(input);
		}
	}

	document.body.appendChild(form);
	form.submit();
	document.body.removeChild(form);
}