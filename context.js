CmdUtils.CreateCommand({
    name: "context",
    description: "Create context from all tabs' visible text.",
    author: "Gemini",
    license: "MIT",
    icon: "res/icon-128.png",
    preview: function(pblock, {selection}) {
        pblock.innerHTML = "Creating context from all tabs...";
        chrome.tabs.query({currentWindow: true, status: "complete"}, (tabs) => {
            // Filter for http/https tabs that are actually loaded
            let validTabs = tabs.filter(t => t.url && (t.url.startsWith("http")));

            if (validTabs.length === 0) {
                pblock.innerHTML = "No http/https tabs found in the current window.";
                return;
            }

            let fullText = "";
            let count = 0;

            validTabs.forEach(tab => {
                // MV3: use chrome.scripting.executeScript with func instead of code string
                chrome.scripting.executeScript(
                    { target: { tabId: tab.id }, func: () => document.body.innerText },
                    (results) => {
                        count++;
                        fullText += `# ${tab.url}\n\n`;

                        if (chrome.runtime.lastError) {
                            fullText += `Could not access tab: ${chrome.runtime.lastError.message}\n\n`;
                        } else if (results && results[0] && results[0].result) {
                            fullText += results[0].result + "\n\n";
                        } else {
                            fullText += "No content retrieved from this tab.\n\n";
                        }

                        if (count === validTabs.length) {
                            pblock.innerHTML = `<textarea style="width: 100%; height: 400px; box-sizing: border-box;">${fullText}</textarea>`;
                        }
                    }
                );
            });
        });
    },
    execute: function() {
        const textarea = document.querySelector("#ubiq-command-preview textarea");
        if (textarea) {
            CmdUtils.setClipboard(textarea.value);
            CmdUtils.setTip("Copied to clipboard!");
        } else {
            CmdUtils.setTip("No context to copy.");
        }
    }
});
