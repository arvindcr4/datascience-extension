console.log("Content script loaded");

function extractPageText() {
  return document.body.innerText;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const pageText = extractPageText();
    sendResponse({ content: pageText });
    return true; // Indicate that sendResponse will be called asynchronously
  }
});
