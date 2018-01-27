// content script asks (pull)
// https://stackoverflow.com/questions/14349263/creating-a-chrome-extension-which-takes-highlighted-text-on-the-page-and-inserts#answer-14351458
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.method == "getSelection")
    sendResponse({data: window.getSelection().toString()});
  else
    sendResponse({}); // snub them.
});

// page sends (push)
// https://stackoverflow.com/questions/2626859/chrome-extension-how-to-capture-selected-text-and-send-to-a-web-service