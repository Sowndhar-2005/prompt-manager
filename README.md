# Universal AI Prompt Manager

A modern, lightweight Google Chrome extension (Manifest V3) that lets you save reusable prompts and quickly insert them into **Google NotebookLM, Google Gemini, OpenAI ChatGPT, Anthropic Claude, DeepSeek, and Microsoft Copilot** using fast keyboard shortcuts and autocomplete, with universal access for all other websites via right-click context menus and a quick toolbar launcher.

---

## Features

- **⚡ In-Chat Shortcut Autocomplete**: Type any trigger symbol followed by your shortcut (e.g. `;book`, `\sum`, `~critique`, `!faq`) in NotebookLM, Gemini, ChatGPT, Claude, DeepSeek, or Copilot to open an instant autocomplete dropdown. Navigate with <kbd>↑</kbd> / <kbd>↓</kbd> and insert with <kbd>Enter</kbd> or <kbd>Tab</kbd>.
- **🎯 Selectable Trigger Symbols**: Choose from 15 non-conflicting symbols (`;`, `\`, `~`, `^`, `!`, `/`, `@`, `#`, `$`, `%`, `&`, `?`, `>`, `|`, `.`) via a dedicated dropdown to avoid conflicts with natural text.
- **🛡️ Safe Composer Insertion**: Inserts prompts without submitting or sending the chat message. Automatically preserves existing text before and after the shortcut token.
- **🌐 Universal Access Across All Websites**:
  - **Right-Click Context Menu**: Right-click any text input on any website (Google Docs, Notion, Slack, email, etc.) -> **AI Prompts** -> click to insert directly.
  - **Quick Launcher Popup**: Click the extension icon in Chrome toolbar to copy or insert prompts on any webpage.
  - **Global Keyboard Shortcut**: Press <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> anywhere to open the Prompt Manager.
- **🎨 Modern Dark Mode Prompt Manager**: Full management interface with folders, tags, favorites, real-time search, and responsive cards.
- **📂 JSON Backup & Restore**: Versioned JSON export and import with validation, duplicate detection, and choice of merge or replace.
- **🔒 100% Local & Private**: Stored locally in `chrome.storage.local`. No external requests, no tracking, no telemetry.

---

## Project Structure

```text
notebooklm-prompt-manager/
├── manifest.json                  # Chrome Extension Manifest V3
├── background.js                  # Background service worker (commands & lifecycle)
├── README.md                      # Documentation and usage guide
├── CHROMEWEBSTORE.md              # Chrome Web Store listing & justifications
│
├── assets/
│   └── icons/                     # Real PNG extension icons
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
│
├── popup/                         # Action popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
├── manager/                       # Full-screen Prompt Manager interface
│   ├── manager.html
│   ├── manager.css
│   └── manager.js
│
├── content/                       # Content scripts injected into NotebookLM
│   ├── content.js                 # Content script coordinator & in-page drawer
│   ├── notebooklm-adapter.js      # Resilient composer DOM adapter & event dispatcher
│   ├── autocomplete.js            # Shadow DOM autocomplete suggestion dropdown
│   ├── toolbar-button.js          # Prompts button injector with fallback
│   └── content.css                # Scoped styles
│
├── storage/                       # Storage module
│   └── storage.js                 # CRUD, validation, search, import/export
│
├── shared/                        # Shared utilities and constants
│   ├── constants.js               # Seed prompts, selectors, storage keys
│   └── utils.js                   # Shortcut validators, HTML escape, token extractors
│
├── scripts/
│   ├── generate-icons.py          # Icon generation script (Pillow)
│   └── package-extension.js       # Production zip packager
│
├── test/                          # Comprehensive automated test suite
│   ├── runner.js                  # Master test runner & syntax checker
│   ├── manifest.test.js           # MV3 static manifest validation
│   ├── storage.test.js            # Storage CRUD and import/export tests
│   └── adapter.test.js            # Shortcut parsing and insertion tests
│
└── dist/
    └── notebooklm-prompt-manager.zip # Packaged extension ready for distribution
```

---

## Installation Guide (Load Unpacked)

Follow these steps to load the extension into Google Chrome:

1. Open Google Chrome.
2. Navigate to `chrome://extensions/` in the address bar.
3. In the top-right corner, turn on the **Developer mode** toggle.
4. Click the **Load unpacked** button in the top-left toolbar.
5. Select the project folder:
   ```text
   d:\project\notebooklm-prompt-manager
   ```
6. The **NotebookLM Prompt Manager** card will appear in your extensions list.
7. (Optional) Pin the extension to your Chrome toolbar for quick access.

---

## How to Use

### 1. In NotebookLM Chat (Autocomplete)
1. Navigate to [https://notebooklm.google.com](https://notebooklm.google.com).
2. Open any notebook (or create a new blank one).
3. In the chat composer box, type a shortcut prefix such as `;book` or `;sum`.
4. An autocomplete popup will appear displaying matching prompts.
5. Use <kbd>Arrow Down</kbd> and <kbd>Arrow Up</kbd> to choose a prompt.
6. Press <kbd>Enter</kbd> or <kbd>Tab</kbd> (or click with your mouse) to insert the prompt.
7. The prompt will be placed into the composer, leaving the composer focused and ready for your edits.

### 2. Opening the Prompt Manager
You can open the Prompt Manager in three ways:
- **NotebookLM In-Page Prompts Button**: Click the **Prompts** button in the top toolbar or the purple floating button at the bottom-right.
- **Extension Action Popup**: Click the extension icon in your Chrome toolbar.
- **Keyboard Shortcut**: Press <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (or configure your preferred keybinding in `chrome://extensions/shortcuts`).
- **Full Screen Manager**: In the popup or in-page drawer, click the expand icon or open `manager/manager.html`.

### 3. Creating & Managing Prompts
1. Click **+ New Prompt**.
2. Fill in:
   - **Title**: Descriptive name (e.g. `Academic Textbook Creator`).
   - **Shortcut**: Must start with `;` followed by alphanumeric characters, hyphens, or underscores (e.g. `;book`). Must be unique.
   - **Folder**: Assign to an existing folder or leave unassigned.
   - **Tags**: Comma-separated tags (e.g. `study, academic`).
   - **Content**: Full prompt template.
3. Click **Save Prompt**.

### 4. Backup & Restore (JSON)
1. Open the Prompt Manager.
2. Click **Backup & Sync (JSON)** in the sidebar.
3. **Export**: Click **Download Backup JSON** to save a timestamped backup (`notebooklm-prompts-backup-YYYY-MM-DD.json`).
4. **Import**: Select a backup file, choose **Merge** (updates existing and adds new) or **Replace** (complete overwrite), and click **Start Import**.

---

## How to Reload After Code Changes

When you modify any extension files:
1. Navigate to `chrome://extensions/`.
2. Find **NotebookLM Prompt Manager**.
3. Click the 🔄 **Reload** icon on the card.
4. Refresh your open `https://notebooklm.google.com` tab to inject the updated scripts.

---

## Testing

Run the automated test suite directly using Node.js:

```powershell
node test/runner.js
```

The test runner performs:
- Complete JavaScript syntax validation via `node --check`
- Manifest V3 structure, permissions, and file existence checks
- Real PNG icon dimensions and integrity checks
- Storage architecture tests: CRUD, shortcut validation, folders, tags, merge/replace import
- Shortcut token regex extraction, replacement preservation, and XSS sanitization checks

---

## Packaging as a ZIP

To generate a distribution ZIP file that excludes test scripts and development files:

```powershell
node scripts/package-extension.js
```

The output archive is created at:
```text
dist/notebooklm-prompt-manager.zip
```

---

## Known NotebookLM Compatibility & Architecture Notes

- **Dynamic Selectors**: Google NotebookLM uses Material 3 / Angular custom elements that change across releases. The adapter evaluates visible composers at interaction time across a prioritized list of selectors (`textarea.query-input`, `textarea[placeholder*="Ask"]`, and `div[contenteditable="true"]`).
- **Shadow DOM Isolation**: Both the autocomplete dropdown and the in-page drawer are mounted inside isolated Shadow DOM trees (`#nlm-autocomplete-host` and `#nlm-drawer-host`) to prevent Google's CSS from interfering with the manager UI.
- **Framework Reactivity**: Text insertion uses the native prototype property descriptor (`HTMLTextAreaElement.prototype.value`) followed by synthetic `input` and `change` events so Angular and React change detection mechanisms register the updated content.

---

## Permissions & Privacy Explanation

- **`storage`**: Allows saving prompts, folders, tags, and settings locally on your computer via `chrome.storage.local`.
- **`commands`**: Powers the optional keyboard shortcut (<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>) to quickly toggle the prompt manager.
- **`https://notebooklm.google.com/*`**: Limits content script execution strictly to Google NotebookLM. The extension never runs on other websites.
- **Zero Remote Communications**: No data, telemetry, or user content is ever sent to any remote server.
