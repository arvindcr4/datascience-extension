# Data Science Extension - Job Project Suggester

This repository contains a simple Chrome extension called **Job Project Suggester**. It captures the text content of the current browser tab and sends it to Google's Gemini API to generate tailored practice project ideas, particularly useful when viewing job listings.

## Key Features & Improvements

*   **Project Suggestions**: Analyzes text from the current tab (e.g., a job listing) and uses the Gemini API to suggest relevant practice projects.
*   **Refined API Prompts**: The prompt sent to the Gemini API has been optimized to request projects that are designed to be completable within a week by a dedicated learner, focusing on actionable and scoped learning experiences.
*   **Enhanced Error Handling**: The extension's popup now features more specific error messages, providing clearer feedback for:
    *   Missing API Key.
    *   Network request failures (e.g., no internet connection).
    *   Errors returned by the Gemini API (including status codes and messages if available).
    *   Unexpected issues with the API response structure.

## Loading the extension

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (usually a toggle in the top right).
3.  Click **Load unpacked** and select the `extension` folder from this repository.
4.  Once loaded, click the extension icon in your Chrome toolbar.
5.  You will need to provide your own Gemini API key in the extension's popup. Save the key.
6.  Navigate to a webpage containing text you want to generate project suggestions from (e.g., a software engineering job listing).
7.  Click the **Suggest Projects** button in the extension popup to receive project ideas.

The extension uses the `generativelanguage.googleapis.com` API endpoint.

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

[end of README.md]
