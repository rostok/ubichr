// MV3: result page reads shared HTML from chrome.storage.session
// (replaces MV2 getBackgroundPage().resultview / eval pattern)
chrome.storage.session.get('resultview', function(data) {
    document.body.innerHTML = data.resultview || '';
    chrome.storage.session.remove('resultview');
});
