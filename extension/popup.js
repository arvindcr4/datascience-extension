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
          const pageText = results[0].result;
          fetchProjects(apiKeyInput.value, pageText)
            .then(text => (output.textContent = text))
            .catch(err => (output.textContent = 'Error: ' + err.message));
        }
      );
    });
  });
});

async function fetchProjects(apiKey, pageText) {
  if (!apiKey) throw new Error('API key required');
  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
    encodeURIComponent(apiKey);
  const prompt =
    'Suggest three detailed practice projects based on the following job listing text. ' +
    'Include project descriptions, required skills, and expected outcomes.\n\n' +
    pageText;

  const body = { contents: [{ parts: [{ text: prompt }] }] };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Request failed');
  const data = await res.json();
  if (data.candidates && data.candidates.length > 0) {
    return data.candidates[0].content.parts.map(p => p.text).join('');
  }
  return 'No suggestions returned.';
}
