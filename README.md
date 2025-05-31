# Data Science Extension - Job Project Suggester

This repository contains a simple Chrome extension called **Job Project Suggester**. It captures the text content of the current browser tab and sends it to Google's Gemini API to generate tailored practice project ideas, particularly useful when viewing job listings. It also allows users to save the content of the current page (direct files or HTML pages) to their Google Drive.

## Key Features & Improvements

*   **Project Suggestions**: Analyzes text from the current tab (e.g., a job listing) and uses the Gemini API to suggest relevant practice projects.
*   **Save to Google Drive**: Saves the content of the current page to the user's Google Drive.
    *   Supports direct saving of files like PDFs, images, text files, etc.
    *   Saves full HTML content of web pages as `.html` files.
*   **Refined API Prompts**: The prompt sent to the Gemini API has been optimized to request projects that are designed to be completable within a week by a dedicated learner, focusing on actionable and scoped learning experiences.
*   **Enhanced Error Handling**: The extension's popup now features more specific error messages, providing clearer feedback for:
    *   Missing API Key.
    *   Network request failures (e.g., no internet connection).
    *   Errors returned by the Gemini API (including status codes and messages if available).
    *   Unexpected issues with the API response structure.
    *   Google Drive authentication and saving operations.

## Save to Google Drive Feature

This feature allows you to save the content of the currently active tab directly to your Google Drive.

### Feature Overview

The "Save to Google Drive" functionality handles two main scenarios:

1.  **Direct File Links**: If the current tab's URL points directly to a common file type (e.g., a PDF, PNG, JPG, TXT file), the extension will download this file and upload it to your Google Drive with its original filename and type.
2.  **HTML Web Pages**: If the current tab is displaying a regular HTML web page, the extension will capture the full HTML content of that page (`document.documentElement.outerHTML`) and save it as an `.html` file in your Google Drive. The filename will be derived from the page's title.

### Setup for Google Drive Integration (OAuth 2.0 Client ID)

**This setup is crucial for the "Save to Google Drive" feature to work.** The extension uses OAuth 2.0 to securely access your Google Drive on your behalf. You need to configure a Google Cloud Project and obtain an OAuth 2.0 Client ID.

1.  **Navigate to Google Cloud Console**: Go to [https://console.cloud.google.com/](https://console.cloud.google.com/).
2.  **Create or Select a Project**:
    *   If you don't have one, create a new project (e.g., "Chrome Extension Projects").
    *   If you have an existing project, you can use that.
3.  **Enable the Google Drive API**:
    *   In the sidebar, go to "APIs & Services" > "Library".
    *   Search for "Google Drive API" and select it.
    *   Click "Enable".
4.  **Configure the OAuth Consent Screen**:
    *   In the sidebar, go to "APIs & Services" > "OAuth consent screen".
    *   Choose User Type: **External**. Click "Create".
    *   **App information**:
        *   App name: e.g., "Job Project Suggester - Drive Saver" (or any name you prefer).
        *   User support email: Your email address.
        *   Developer contact information: Your email address.
    *   Click "Save and Continue" through the "Scopes" and "Optional info" sections. You don't need to add scopes here; the extension requests them.
    *   **Test users**: While your app is in "testing" status (default for new apps), you **must** add the Google accounts you want to test the extension with. Click "Add Users" and enter your Google email(s).
    *   Review the summary and click "Back to Dashboard".
5.  **Create OAuth 2.0 Client ID Credentials**:
    *   In the sidebar, go to "APIs & Services" > "Credentials".
    *   Click "+ CREATE CREDENTIALS" at the top and select "OAuth client ID".
    *   **Application type**: Select **Chrome app**.
    *   Name: Give it a name, e.g., "Job Suggester Extension Client".
    *   **Application ID (Chrome Extension ID)**: This is critical.
        *   Open Chrome and go to `chrome://extensions`.
        *   Make sure "Developer mode" is enabled (toggle in the top-right).
        *   If you haven't loaded the extension yet, click "Load unpacked" and select the `extension` folder of this project.
        *   Find the "Job Project Suggester" extension card. The **ID** will be a long string of characters (e.g., `abcdefghijklmnopqrstuvwxyzabcdef`). Copy this ID.
        *   Paste this copied Extension ID into the "Application ID" field on the Google Cloud Console form.
    *   Click "Create". A dialog will show your Client ID. Copy this value (e.g., `YOUR_CLIENT_ID.apps.googleusercontent.com`).
6.  **Update `manifest.json` with Your Client ID**:
    *   Open the `extension/manifest.json` file in this project.
    *   Locate the `oauth2` section. You need to replace the placeholder Client ID with the one you just obtained.
        ```json
        // extension/manifest.json
        // ...
        "oauth2": {
          "client_id": "YOUR_CLIENT_ID_FROM_GOOGLE_CLOUD_CONSOLE.apps.googleusercontent.com",
          "scopes": [
            "https://www.googleapis.com/auth/drive.file"
          ]
        },
        // ...
        ```
    *   **Important**: Replace `"YOUR_CLIENT_ID_FROM_GOOGLE_CLOUD_CONSOLE.apps.googleusercontent.com"` with your actual Client ID. The Client ID currently in the repository (`358208640342-vf9vt64lqk5nm4qhpa5q28psptp3i1b3.apps.googleusercontent.com`) is tied to a specific developer's setup and **will not work for you if you are setting this up independently**. You must use your own.
    *   After updating `manifest.json`, if the extension was already loaded in Chrome, go back to `chrome://extensions`, find the extension, and click its "reload" button (circular arrow icon).

### How to Use

1.  Ensure you have completed the "Setup for Google Drive Integration" steps above, especially updating `manifest.json` with your Client ID and reloading the extension.
2.  Open the extension popup by clicking its icon in the Chrome toolbar.
3.  Click the "Sign in with Google" button.
4.  A Google authentication window will appear. Follow the prompts to choose your account and grant the extension permission to "See, edit, create, and delete only the specific Google Drive files you use with this app." (This scope `drive.file` allows the app to create new files).
5.  Once signed in, the popup will show your email (if successfully fetched) or a generic "Signed in" message.
6.  Navigate to a web page whose content you want to save, or a direct link to a file (e.g., a PDF opened in the browser).
7.  Click the "Save Current Page to Google Drive" button in the extension popup.
8.  Status messages in the popup will indicate if it's processing, fetching, uploading, or if there's an error.
9.  Successfully saved files will be placed in the root directory of your Google Drive.

## Loading the extension

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (usually a toggle in the top right).
3.  Click **Load unpacked** and select the `extension` folder from this repository.
4.  Once loaded, click the extension icon in your Chrome toolbar.
5.  **API Keys**:
    *   For project suggestions: Provide your Gemini API key in the extension's popup and click "Save Key".
    *   For "Save to Drive": Ensure you have configured your own OAuth 2.0 Client ID in `manifest.json` as described in the "Setup for Google Drive Integration" section.
6.  Navigate to a webpage containing text you want to generate project suggestions from or content you wish to save to Drive.
7.  Use the respective buttons in the extension popup.

The Gemini API functionality uses the `generativelanguage.googleapis.com` endpoint. The Google Drive functionality uses `www.googleapis.com`.

## Permissions Used

This extension requests the following permissions:

*   `activeTab`: To access the content (URL and potentially text via scripting) of the currently active tab.
*   `storage`: To store your Gemini API key locally using `chrome.storage.sync`.
*   `scripting`: To inject scripts into the active tab for retrieving page text (for Gemini) or HTML content (for saving to Drive).
*   `identity`: To allow you to sign in with your Google account using `chrome.identity.getAuthToken` for Google Drive integration.
*   `host_permissions` for:
    *   `https://generativelanguage.googleapis.com/*`: To make API calls to the Gemini service.
    *   `https://www.googleapis.com/*`: To make API calls to Google services, specifically the Google Drive API and user info endpoint for OAuth.
*   **OAuth Scopes (requested during sign-in for Google Drive)**:
    *   `https://www.googleapis.com/auth/drive.file`: Allows the extension to create new files in your Google Drive. It does not grant general access to all your Drive files, only those created by the application or that you explicitly open with it.

## Running tests

Automated tests have been implemented for the core logic responsible for fetching and processing project suggestions (`fetchProjects` function in `extension/popup.js`). These tests use Jest and run in a Node.js environment.

**Setup and Execution:**

1.  **Install Dependencies**:
    If you haven't already, install the necessary Node.js packages (Jest is included as a dev dependency):
    ```bash
    npm install
    ```

2.  **Run Tests**:
    Execute the test suite using:
    ```bash
    npm test
    ```
    This command will run Jest, which discovers and executes test files (e.g., `extension/popup.test.js`).

**Note on Test Environment and DOM Code:**

The `fetchProjects` function is tested in isolation. The `extension/popup.js` file also contains JavaScript code for manipulating the extension's popup interface (DOM manipulation). To enable testing of `fetchProjects` in Node.js without a browser environment, this DOM-specific code is structured to only execute when the script runs in a browser (e.g., within `DOMContentLoaded` listeners). The `fetchProjects` function itself and its export for testing are outside these DOM-specific blocks.

While this setup generally allows Jest to import `fetchProjects` without issues, JavaScript parsers used by testing tools can sometimes be very sensitive to browser-specific code, even if it's conditionally run. If you encounter parsing errors related to DOM-specific sections of `popup.js` when running `npm test` (which would typically manifest as a syntax error before any tests can run), you can temporarily comment out the `document.addEventListener('DOMContentLoaded', () => { ... });` block within `extension/popup.js`. This will allow the tests for `fetchProjects` to run in complete isolation, though it will render the popup UI non-functional until uncommented.

This project uses Jest `^29.7.0`.
