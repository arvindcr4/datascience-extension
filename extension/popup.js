// Global state for authentication
let googleAuthToken = null;
let userEmail = null;

async function fetchProjects(apiKey, pageText) {
  if (!apiKey) throw new Error('Error: API key required');

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
        errorDetail += ' - Could not parse error response.';
      }
      throw new Error(errorDetail);
    }

    const data = await res.json();

    if (!data) {
      throw new Error('Error: Unexpected response structure from API.');
    }
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error('Error: Unexpected response structure from API.');
    }
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts)) {
      throw new Error('Error: Unexpected response structure from API.');
    }

    if (candidate.content.parts.length === 0) {
      return 'No suggestions returned.';
    }

    const suggestionText = candidate.content.parts.map(p => p.text).join('');
    return suggestionText || 'No suggestions returned.';

  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
        throw new Error('Error: Network request failed. Check your internet connection.');
    }
    if (err.message && err.message.startsWith('Error:')) {
        throw err;
    }
    throw new Error('Error: ' + err.message);
  }
}

// Helper function to extract filename from URL
function getFilenameFromUrl(url) {
  try {
    const urlPath = new URL(url).pathname;
    const parts = urlPath.split('/');
    // Ensure it doesn't return an empty string if URL ends with /
    const potentialFilename = parts[parts.length - 1];
    return potentialFilename || 'untitled';
  } catch (e) {
    console.error("Error parsing URL for filename:", e);
    // Try a simpler regex backup for malformed URLs or non-standard paths
    const matches = url.match(/[^/\\?#]+(?=[?#]|$)/);
    return matches ? matches[0] : 'untitled';
  }
}

// Helper function to get MIME type from filename
function getMimeTypeFromFilename(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'txt': 'text/plain',
    'html': 'text/html',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'zip': 'application/zip',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return mimeTypes[extension] || 'application/octet-stream'; // Default MIME type
}


document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const getProjectsBtn = document.getElementById('getProjects');
  const output = document.getElementById('output');

  const authStatusDiv = document.getElementById('authStatus');
  const signInButton = document.getElementById('signInButton');
  const signOutButton = document.getElementById('signOutButton');
  const saveToDriveButton = document.getElementById('saveToDriveButton');
  const driveStatusDiv = document.getElementById('driveStatus');

  function updateUiWithAuthState() {
    if (googleAuthToken) {
      authStatusDiv.textContent = userEmail ? `Signed in as: ${userEmail}` : 'Signed in to Google Drive.';
      signInButton.style.display = 'none';
      signOutButton.style.display = 'inline-block';
      if (saveToDriveButton) saveToDriveButton.style.display = 'inline-block';
    } else {
      authStatusDiv.textContent = 'Not signed in. Sign in to save to Google Drive.';
      signInButton.style.display = 'inline-block';
      signOutButton.style.display = 'none';
      if (saveToDriveButton) saveToDriveButton.style.display = 'none';
      if (driveStatusDiv) driveStatusDiv.textContent = '';
    }
  }

  async function handleSignIn() {
    if (!chrome.identity) {
      authStatusDiv.textContent = 'Error: Chrome Identity API not available.';
      console.error('Chrome Identity API not available.');
      return;
    }
    try {
      authStatusDiv.textContent = 'Authenticating...';
      const token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (tokenValue) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (tokenValue) {
            resolve(tokenValue);
          } else {
            reject(new Error('Authentication failed: No token received. User may have closed the consent screen.'));
          }
        });
      });
      googleAuthToken = token;

      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { 'Authorization': `Bearer ${googleAuthToken}` }
        });
        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          userEmail = userInfo.email;
        } else {
           console.warn('Could not fetch user info:', userInfoResponse.status);
           userEmail = null;
        }
      } catch (err) {
        console.warn('Error fetching user info:', err);
        userEmail = null;
      }
      updateUiWithAuthState();
    } catch (error) {
      googleAuthToken = null;
      userEmail = null;
      console.error('Sign-in error:', error);
      const displayError = error.message.includes("User did not approve") || error.message.includes("No token received")
                           ? "Authentication cancelled or failed."
                           : `Error signing in: ${error.message}`;
      authStatusDiv.textContent = displayError;
      updateUiWithAuthState();
    }
  }

  async function handleSignOut() {
    if (googleAuthToken) {
      try {
        authStatusDiv.textContent = 'Signing out...';
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${googleAuthToken}`);
        await new Promise((resolve) => {
            chrome.identity.removeCachedAuthToken({ token: googleAuthToken }, () => {
                if (chrome.runtime.lastError) {
                    console.warn('Error removing cached token:', chrome.runtime.lastError.message);
                }
                resolve();
            });
        });
      } catch (error) {
        console.error('Error during sign out token revocation:', error);
      } finally {
        googleAuthToken = null;
        userEmail = null;
        updateUiWithAuthState();
      }
    }
  }

  async function handleSaveToDrive() {
    if (!googleAuthToken) {
      driveStatusDiv.textContent = 'Error: Please sign in to Google Drive first.';
      return;
    }

    // Clear previous drive status and disable button
    if(driveStatusDiv) driveStatusDiv.textContent = '';
    if(saveToDriveButton) saveToDriveButton.disabled = true;

    driveStatusDiv.textContent = 'Processing...';

    try {
      const tabs = await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabsArray) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (tabsArray && tabsArray.length > 0 && tabsArray[0].url) {
            resolve(tabsArray);
          } else {
            reject(new Error('Could not get active tab URL. Ensure it is fully loaded.'));
          }
        });
      });

      const currentTab = tabs[0];
      const currentTabUrl = currentTab.url;

      // File Type Detection Logic
      const filename = getFilenameFromUrl(currentTabUrl);
      // Added more extensions based on common web direct-link files
      const simpleFileExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.gif', '.svg', '.mp3', '.mp4', '.zip', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
      const isDirectFile = simpleFileExtensions.some(ext => filename.toLowerCase().endsWith(ext));

      if (isDirectFile) {
        driveStatusDiv.textContent = `Detected direct file: ${filename}. Fetching...`;
        try {
          const response = await fetch(currentTabUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }
          const fileBlob = await response.blob();
          // Prefer Content-Type from response if available and seems valid, else use helper.
          let mimeType = response.headers.get('Content-Type');
          if (!mimeType || mimeType === 'application/octet-stream' || mimeType.startsWith('text/html')) {
            // If Content-Type is generic, text/html (for misconfigured servers), or missing, try filename based.
             mimeType = getMimeTypeFromFilename(filename);
          }

          driveStatusDiv.textContent = `Uploading ${filename} (${(fileBlob.size / 1024).toFixed(2)} KB) to Google Drive...`;

          const metadata = {
            name: filename,
            mimeType: mimeType,
          };

          const formData = new FormData();
          formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          formData.append('file', fileBlob, filename); // Added filename to blob for some servers

          const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${googleAuthToken}`,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text(); // Get raw error text
            let errorMessage = `Upload failed with status ${uploadResponse.status}`;
            try {
                const errorData = JSON.parse(errorText); // Try to parse as JSON
                if (errorData && errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                // If not JSON, use the raw text if it's not too long
                errorMessage += errorText.length < 100 ? ` - ${errorText}` : '';
            }
            throw new Error(errorMessage);
          }

          const driveFile = await uploadResponse.json();
          driveStatusDiv.textContent = `Successfully saved "${driveFile.name}" to Google Drive!`;

        } catch (fileError) {
          console.error('Error saving direct file:', fileError);
          driveStatusDiv.textContent = `Error saving file: ${fileError.message}`;
        }
      } else {
        // HTML page saving logic
        driveStatusDiv.textContent = `Capturing HTML content of the page...`;
        try {
          // `currentTab` is available from the earlier chrome.tabs.query
          const scriptingResults = await new Promise((resolve, reject) => {
            chrome.scripting.executeScript(
              {
                target: { tabId: currentTab.id },
                func: () => {
                  // This function runs in the context of the web page
                  return {
                    html: document.documentElement.outerHTML,
                    title: document.title || 'untitled_page',
                  };
                },
              },
              (results) => {
                if (chrome.runtime.lastError) {
                  return reject(new Error(chrome.runtime.lastError.message));
                }
                if (results && results[0] && results[0].result) {
                  resolve(results[0].result);
                } else {
                  reject(new Error('Could not retrieve HTML content from the page. The page might be restricted or not return content.'));
                }
              }
            );
          });

          const pageContent = scriptingResults.html;
          let pageTitle = scriptingResults.title;

          // Sanitize filename a bit (Drive doesn't like slashes)
          pageTitle = pageTitle.replace(/[/\\:]/g, '_'); // Added colon to sanitize
          const htmlFilename = `${pageTitle}.html`;

          const htmlBlob = new Blob([pageContent], { type: 'text/html' });

          driveStatusDiv.textContent = `Uploading "${htmlFilename}" (${(htmlBlob.size / 1024).toFixed(2)} KB) to Google Drive...`;

          const metadata = {
            name: htmlFilename,
            mimeType: 'text/html',
          };

          const formData = new FormData();
          formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          formData.append('file', htmlBlob, htmlFilename);

          const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${googleAuthToken}`,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            let errorMessage = `Upload failed with status ${uploadResponse.status}`;
            try {
                const errorData = JSON.parse(errorText);
                if (errorData && errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                errorMessage += errorText.length < 100 ? ` - ${errorText}` : '';
            }
            throw new Error(errorMessage);
          }

          const driveFile = await uploadResponse.json();
          driveStatusDiv.textContent = `Successfully saved "${driveFile.name}" to Google Drive!`;

        } catch (htmlError) {
          console.error('Error saving HTML page:', htmlError);
          driveStatusDiv.textContent = `Error saving HTML page: ${htmlError.message}`;
        }
      }

    } catch (error) {
      console.error('Error in handleSaveToDrive:', error);
      if(driveStatusDiv) driveStatusDiv.textContent = `Error: ${error.message}`;
    } finally {
      if(saveToDriveButton) saveToDriveButton.disabled = false;
    }
  }

  // Event listeners
  saveKeyBtn.addEventListener('click', () => { /* ... */ });
  getProjectsBtn.addEventListener('click', () => { /* ... */ });
  if(signInButton) signInButton.addEventListener('click', handleSignIn);
  if(signOutButton) signOutButton.addEventListener('click', handleSignOut);
  if(saveToDriveButton) saveToDriveButton.addEventListener('click', handleSaveToDrive);

  // Initial UI and auth state update
  chrome.storage.sync.get('apiKey', data => { /* ... */ });
  if (chrome.identity) {
    chrome.identity.getAuthToken({ interactive: false }, (token) => { /* ... */ });
  } else { /* ... */ }


  // Restore existing event listeners and initial setup code, ensuring they are complete
  // (The ... above are placeholders for already existing code from previous step which is lengthy)

  saveKeyBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ apiKey: apiKeyInput.value }, () => {
      saveKeyBtn.textContent = 'Saved';
      setTimeout(() => (saveKeyBtn.textContent = 'Save Key'), 1000);
    });
  });

  getProjectsBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs.length === 0) {
        output.textContent = 'Error: No active tab found.';
        return;
      }
      const tabId = tabs[0].id;
      chrome.scripting.executeScript(
        { target: { tabId }, func: () => document.body.innerText },
        results => {
          if (chrome.runtime.lastError) {
            output.textContent = `Error executing script: ${chrome.runtime.lastError.message}`;
            return;
          }
          if (results && results[0] && typeof results[0].result === 'string') {
            const pageText = results[0].result;
            fetchProjects(apiKeyInput.value, pageText)
              .then(text => (output.textContent = text))
              .catch(err => (output.textContent = err.message));
          } else {
            output.textContent = 'Error: Could not retrieve text from the page.';
          }
        }
      );
    });
  });

  chrome.storage.sync.get('apiKey', data => {
    if (data.apiKey) {
      apiKeyInput.value = data.apiKey;
    }
  });

  if (chrome.identity) {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError) {
        console.log("Initial token check: Not signed in or error: ", chrome.runtime.lastError.message);
        googleAuthToken = null;
        userEmail = null;
        updateUiWithAuthState();
        return;
      }
      if (token) {
        googleAuthToken = token;
        (async () => {
            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { 'Authorization': `Bearer ${googleAuthToken}` }
                });
                if (userInfoResponse.ok) {
                    const userInfo = await userInfoResponse.json();
                    userEmail = userInfo.email;
                } else { userEmail = null; }
            } catch (err) {
                console.warn('Error fetching user info during initial load:', err);
                userEmail = null;
            }
            finally { updateUiWithAuthState(); }
        })();
      } else {
        googleAuthToken = null;
        userEmail = null;
        updateUiWithAuthState();
      }
    });
  } else {
    if(authStatusDiv) authStatusDiv.textContent = 'Error: Chrome Identity API not available.';
    updateUiWithAuthState();
  }
});

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchProjects };
}
