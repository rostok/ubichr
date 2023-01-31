var bgp = chrome.extension.getBackgroundPage();
document.body.innerHTML = bgp.resultview;
bgp.resultview = "";
eval(bgp.resultcode);
bgp.resultcode = "";