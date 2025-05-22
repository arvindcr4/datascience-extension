# Data Science Extension

This repository contains a simple Chrome extension called **Job Project Suggester**. It captures the text of the current tab and sends it to Google's Gemini API to generate practice project ideas based on a job listing.

## Loading the extension

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder in this repository.
4. Click the extension icon and provide your Gemini API key.
5. With a job listing page open, click **Suggest Projects** to receive project ideas in the popup.

The extension uses the `generativelanguage.googleapis.com` API endpoint. You must supply your own API key.

## Running tests

This project does not yet include automated tests. A placeholder `npm test` script is provided:

```
npm test
```

It simply prints `No tests specified` and exits successfully.
