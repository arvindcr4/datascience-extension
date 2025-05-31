async function fetchProjects(apiKey, pageText) {
  if (!apiKey) throw new Error('Error: API key required'); // Keep this specific message

  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
    encodeURIComponent(apiKey);
  const prompt =
    'Suggest three detailed practice projects based on the following job listing text. ' +
    'For each project, include a brief description, key skills required, and expected learning outcomes. ' +
    'These projects should be designed to be completable within a week by a dedicated learner.\n\n' +
    pageText;

  const body = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      let errorDetail = `Error: Request failed with status: ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData && errorData.error && errorData.error.message) {
          errorDetail += ` - ${errorData.error.message}`;
        }
      } catch (jsonError) {
        // Not a JSON error response, or failed to parse it
        errorDetail += ' - Could not parse error response.';
      }
      throw new Error(errorDetail);
    }

    const data = await res.json();

    // Safer access to response data
    if (!data) {
      throw new Error('Error: Unexpected response structure from API.');
    }
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error('Error: Unexpected response structure from API.');
    }
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts)) {
      // Corrected typo here
      throw new Error('Error: Unexpected response structure from API.');
    }

    if (candidate.content.parts.length === 0) {
      return 'No suggestions returned.';
    }

    const suggestionText = candidate.content.parts.map(p => p.text).join('');
    return suggestionText || 'No suggestions returned.'; // Ensure empty text also leads to "No suggestions"

  } catch (err) {
    // Handle network errors and other errors from fetch or processing
    if (err instanceof TypeError && err.message === 'Failed to fetch') { // Checking for a common network error message
        throw new Error('Error: Network request failed. Check your internet connection.');
    }
    // Re-throw other errors (including custom ones thrown above)
    // If it's already one of our structured errors, use its message, otherwise wrap it.
    if (err.message && err.message.startsWith('Error:')) {
        throw err;
    }
    throw new Error('Error: ' + err.message);
  }
}

// DOM specific code, runs when the extension popup is opened
document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const getProjectsBtn = document.getElementById('getProjects');
  const output = document.getElementById('output');

  // Load API key from storage
  chrome.storage.sync.get('apiKey', data => {
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey;
    }
  });

  saveKeyBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ apiKey: apiKeyInput.value }, () => {
      saveKeyBtn.textContent = 'Saved';
      setTimeout(() => (saveKeyBtn.textContent = 'Save Key'), 1000);
    });
  });

  getProjectsBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0].id;
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: () => document.body.innerText
        },
        results => {
          // Ensure results and results[0].result are valid before proceeding
          if (results && results[0] && typeof results[0].result === 'string') {
            const pageText = results[0].result;
            fetchProjects(apiKeyInput.value, pageText)
              .then(text => (output.textContent = text))
              .catch(err => (output.textContent = err.message));
          } else {
            // Handle cases where page text could not be retrieved
            output.textContent = 'Error: Could not retrieve text from the page.';
          }
        }
      );
    });
  });
});

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchProjects };
}
