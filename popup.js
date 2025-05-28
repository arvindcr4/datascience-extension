document.addEventListener('DOMContentLoaded', () => {
  const getSuggestionsBtn = document.getElementById('getSuggestionsBtn');
  // skillsContainer will be used as the resultsContainer for Gemini suggestions
  const resultsContainer = document.getElementById('skillsContainer'); 
  // projectsContainer is no longer used for primary suggestions, clear it or hide it.
  const projectsContainer = document.getElementById('projectsContainer'); 

  if (getSuggestionsBtn) {
    getSuggestionsBtn.addEventListener('click', () => {
      console.log('Get Suggestions button clicked');
      getSuggestionsBtn.disabled = true; // Disable button
      getSuggestionsBtn.textContent = 'Analyzing...';
      
      projectsContainer.innerHTML = ''; // Clear the other container as it's not used
      resultsContainer.innerHTML = ''; // Clear previous results
      
      const loadingMsg1 = document.createElement('p');
      loadingMsg1.className = 'loading-message';
      loadingMsg1.textContent = 'Fetching page content...';
      resultsContainer.appendChild(loadingMsg1);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          console.error("No active tab found.");
          resultsContainer.innerHTML = '';
          const errorP = document.createElement('p');
          errorP.className = 'error-message';
          errorP.textContent = 'Error: No active tab found. Cannot retrieve page content.';
          resultsContainer.appendChild(errorP);
          getSuggestionsBtn.disabled = false; // Re-enable button
          getSuggestionsBtn.textContent = 'Analyze Job Page & Get Project Ideas';
          return;
        }
        const tabId = tabs[0].id;

        chrome.tabs.sendMessage(tabId, { action: "getPageContent" }, (response) => {
          resultsContainer.innerHTML = ''; // Clear "Fetching page content..."
          if (chrome.runtime.lastError) {
            console.error("Error communicating with content script:", chrome.runtime.lastError.message);
            const errorP = document.createElement('p');
            errorP.className = 'error-message';
            errorP.textContent = `Error: Could not access page content. ${chrome.runtime.lastError.message}. Ensure the extension has permissions and the page is fully loaded. You might need to reload the page or the extension.`;
            resultsContainer.appendChild(errorP);
            getSuggestionsBtn.disabled = false; // Re-enable button
            getSuggestionsBtn.textContent = 'Analyze Job Page & Get Project Ideas';
            return;
          }

          if (response && response.content) {
            const pageText = response.content;
            const loadingMsg2 = document.createElement('p');
            loadingMsg2.className = 'loading-message';
            loadingMsg2.textContent = 'Fetching project idea from Gemini...';
            resultsContainer.appendChild(loadingMsg2);

            chrome.runtime.sendMessage(
              { action: "getGeminiSuggestion", pageText: pageText },
              (geminiResponse) => {
                resultsContainer.innerHTML = ''; // Clear "Fetching project idea..."

                if (chrome.runtime.lastError) {
                  console.error("Error communicating with background script:", chrome.runtime.lastError.message);
                  const errorP = document.createElement('p');
                  errorP.className = 'error-message';
                  errorP.textContent = "Error: " + chrome.runtime.lastError.message;
                  resultsContainer.appendChild(errorP);
                } else if (geminiResponse) {
                  if (geminiResponse.error) {
                    console.error("Error from Gemini:", geminiResponse.error);
                    const errorP = document.createElement('p');
                    errorP.className = 'error-message';
                    errorP.textContent = "Error: " + geminiResponse.error;
                    resultsContainer.appendChild(errorP);
                  } else if (geminiResponse.suggestion) {
                    const projectIdeaElement = document.createElement('p');
                    // projectIdeaElement.className = 'success-message'; // Optional: if you add a specific success class
                    let suggestionText = geminiResponse.suggestion;
                    suggestionText = suggestionText.replace(/Project Name:/gi, "<strong>Project Name:</strong>");
                    suggestionText = suggestionText.replace(/Description:/gi, "<br><strong>Description:</strong>");
                    projectIdeaElement.innerHTML = suggestionText;
                    resultsContainer.appendChild(projectIdeaElement);
                  } else {
                    const errorP = document.createElement('p');
                    errorP.className = 'error-message'; // Or a general message class
                    errorP.textContent = "Received an empty response from the background script. The API might be busy or the content too short.";
                    resultsContainer.appendChild(errorP);
                  }
                } else {
                  const errorP = document.createElement('p');
                  errorP.className = 'error-message';
                  errorP.textContent = "No response from background script. Ensure the background service worker is running correctly.";
                  resultsContainer.appendChild(errorP);
                }
                getSuggestionsBtn.disabled = false; // Re-enable button
                getSuggestionsBtn.textContent = 'Analyze Job Page & Get Project Ideas';
              }
            );
          } else {
            console.error("Could not retrieve content from the page.");
            resultsContainer.innerHTML = '';
            const errorP = document.createElement('p');
            errorP.className = 'error-message';
            errorP.textContent = 'Could not retrieve content from the page. Ensure the page is not empty or a restricted page.';
            resultsContainer.appendChild(errorP);
            getSuggestionsBtn.disabled = false; // Re-enable button
            getSuggestionsBtn.textContent = 'Analyze Job Page & Get Project Ideas';
          }
        });
      });
    });
  } else {
    console.error('Get Suggestions button not found');
  }
});
