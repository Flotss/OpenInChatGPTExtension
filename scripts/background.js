chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openInChatGPT",
    title: "Open in ChatGPT",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  console.log("Context menu clicked");
  if (info.menuItemId === "openInChatGPT" && info.selectionText) {
    // Look for an already open ChatGPT tab
    chrome.tabs.query({ url: "https://chat.openai.com/*" }, (tabs) => {
      try {
        chrome.tabs.create(
          { url: "https://chat.openai.com/chat" },
          (newTab) => {
            chrome.tabs.onUpdated.addListener(function listener(
              tabId,
              changeInfo
            ) {
              if (tabId === newTab.id && changeInfo.status === "complete") {
                injectTextIntoChatGPT(newTab.id, info.selectionText);
                chrome.tabs.onUpdated.removeListener(listener);
              }
            });
          }
        );
      } catch (error) {
        console.error("Error processing ChatGPT tabs:", error);
        showNotification("error", "Failed to open text in ChatGPT");
      }
    });
  }
});

function injectTextIntoChatGPT(tabId, selectedText) {
  console.log("Injecting text into ChatGPT", new Date().toLocaleTimeString());
  chrome.scripting
    .executeScript({
      target: { tabId: tabId },
      func: (text) => {
        let attempts = 0;
        const maxAttempts = 50;
        const interval = setInterval(() => {
          attempts++;
          const promptDiv = document.getElementById("prompt-textarea");
          if (promptDiv) {
            promptDiv.innerHTML = `<p>${text}</p>`;
            promptDiv.dispatchEvent(new Event("input", { bubbles: true }));
            clearInterval(interval);
            return true;
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            throw new Error("Failed to find prompt textarea");
          }
        }, 100);
      },
      args: [selectedText],
    })
    .then(() => {
      console.log("Script executed successfully");
    })
    .catch((error) => {
      console.error("Error injecting text:", error);
    });
}
