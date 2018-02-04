//
// Utils
//

if (!Utils) var Utils = {};

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
