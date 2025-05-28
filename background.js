// IMPORTANT: Developer placeholder for Gemini API Key.
// For actual use, this key should be configured via an options page and stored securely.
const GEMINI_API_KEY = "YOUR_API_KEY_HERE"; // Replace with the actual API key you will provide.

if (GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
    console.warn("Gemini API Key is using the placeholder value. Please replace it in background.js for the extension to work.");
} else {
    console.info("Gemini API Key has been set in background.js.");
}

}

console.log("Background script running");

async function fetchGeminiProjectSuggestion(pageText) {
  if (GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("API key not configured. Please set it in the extension's background script.");
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
  
  const prompt = `Based on the following job description, please suggest a single, actionable project idea (including a name and a brief 2-3 sentence description) that would help someone practice the skills required for this role. Job Description: ${pageText}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorData = await response.json();
        errorDetails = errorData.error ? errorData.error.message : errorDetails;
      } catch (e) {
        // Ignore if error response is not JSON
      }
      throw new Error(`Gemini API Error: ${response.status} ${errorDetails}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected Gemini API response structure:", data);
      throw new Error("Could not parse project suggestion from Gemini response. Unexpected structure.");
    }
  } catch (error) {
    console.error("Error fetching Gemini suggestion:", error);
    throw new Error(`Failed to get suggestion from Gemini: ${error.message}`);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getGeminiSuggestion") {
    if (request.pageText) {
      fetchGeminiProjectSuggestion(request.pageText)
        .then(suggestion => sendResponse({ suggestion: suggestion }))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Indicate asynchronous response
    } else {
      sendResponse({ error: "No page text provided for Gemini suggestion." });
      return false;
    }
  }
});
