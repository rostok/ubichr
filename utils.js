//
// Utils
//

if (!Utils) var Utils = {};
Utils.openUrlInBrowser = function(url) {
	if (typeof browser !== 'undefined') {
		browser.tabs.create({ "url": url });
	}
	else {
		window.open(url);
	}
};
