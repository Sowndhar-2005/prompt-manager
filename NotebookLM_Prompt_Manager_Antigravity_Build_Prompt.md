# Build from Scratch: NotebookLM Prompt Manager Chrome Extension

## Role

Act as a senior Chrome Extension engineer and frontend developer. Build a complete, production-minded Chrome extension named **NotebookLM Prompt Manager** from an empty project folder.

The extension recreates only the reusable Prompts feature shown in the reference screenshots. It is an independent extension for Google NotebookLM, not a clone of the entire Kortex toolkit.

Do not assume any existing source code. Create the complete project, all required files, and a clear README.

---

## 1. Product goal

Let users save reusable prompts and quickly insert them into Google NotebookLM's chat composer using shortcuts.

Example:

1. The user saves a prompt named `Academic Textbook Creator`.
2. They assign the shortcut `;book`.
3. In NotebookLM chat, they type `;boo`.
4. An autocomplete popup suggests `Academic Textbook Creator`.
5. They press Enter or Tab.
6. The extension inserts the full prompt into the chat composer.
7. The extension must **not** submit/send the prompt automatically.

The extension must also provide a visible **Prompts** button on NotebookLM so users can open the prompt manager without typing a shortcut.

Target website: `https://notebooklm.google.com/`

---

## 2. Required technology

Use:

- Chrome Extension Manifest V3
- HTML5
- CSS3
- Vanilla JavaScript (ES modules only where supported by the chosen architecture)
- Chrome Storage API (`chrome.storage.local`)
- Chrome Commands API for an optional keyboard shortcut
- Content scripts and a background service worker where needed

Avoid:

- React, Vue, Angular, or other frameworks unless there is a compelling technical reason
- External libraries and CDNs
- Remote code
- `eval()` and `new Function()`
- Backend services, login, or cloud sync in version 1

The extension must work offline after installation, apart from NotebookLM itself.

---

## 3. Main features

### A. Prompt manager

Build a polished, modern dark-mode interface.

The manager must support:

- View all saved prompts
- Search prompts by title, shortcut, content, or tag
- Create a prompt
- Edit a prompt
- Delete a prompt with confirmation
- Mark/unmark favorites
- Create, rename, and delete folders
- Assign a prompt to a folder
- Add multiple tags to a prompt
- Filter by folder, tag, and favorites
- Insert a prompt into the currently active NotebookLM composer
- Display useful empty states and validation messages

Prompt fields:

- Title (required)
- Prompt content (required)
- Shortcut (required; e.g. `;book`)
- Folder (optional)
- Tags (optional)
- Favorite state
- Created and updated timestamps

Shortcut rules:

- Must begin with `;`
- Must be unique, case-insensitively
- Allow letters, numbers, hyphens, and underscores after the semicolon
- Trim whitespace
- Reject invalid or duplicate shortcuts with a clear message

### B. Prompt autocomplete in NotebookLM

This is the core feature.

When the user types a shortcut prefix into the NotebookLM chat composer:

- Detect the typed `;` prefix.
- Search saved prompt shortcuts.
- Show a compact suggestion popup near the composer.
- Display prompt title, shortcut, and a short content preview.
- Update suggestions as the user types.
- Support Arrow Up and Arrow Down to navigate.
- Enter or Tab inserts the selected prompt.
- Escape closes the suggestion popup.
- Clicking a suggestion inserts it.
- If no match exists, show a small “No matching prompts” state or hide the popup.
- Do not steal normal keyboard behavior when the popup is closed.
- Do not trigger when the user is typing in an unrelated input, textarea, or editor.

When selected:

- Replace the shortcut text with the complete prompt content.
- Keep the composer focused.
- Dispatch the appropriate `input` and/or `beforeinput` events so the page framework detects the change.
- Do not send or submit the message.
- Do not erase unrelated text in the composer.
- Preserve the user's text before and after the shortcut where practical.

### C. NotebookLM toolbar button

Inject a visible **Prompts** button into the NotebookLM page toolbar.

Requirements:

- It must appear on blank notebooks as well as notebooks with sources.
- It must not depend on the presence of sources.
- It must not be duplicated after rerenders or navigation.
- It should visually fit NotebookLM's current toolbar.
- Clicking it opens the prompt manager.
- If the ideal toolbar location cannot be detected, use a safe fallback such as an extension-owned floating button. Do not silently fail.
- Use a MutationObserver carefully and disconnect/reconnect when appropriate.
- Handle NotebookLM single-page-app navigation.

### D. Prompt manager access

Provide these access methods:

1. Injected **Prompts** button on NotebookLM.
2. Extension action popup from the Chrome toolbar.
3. Optional keyboard shortcut, such as `Ctrl+Shift+P`, configurable through Chrome's extension shortcuts page.

The manager should be usable even if NotebookLM's toolbar integration fails.

### E. Import and export

Use JSON backup files.

Export:

- All prompts
- Folders
- Tags (if stored separately)
- Favorites
- Schema version
- Export timestamp

Import:

- Accept a previously exported JSON file.
- Validate the schema and required fields.
- Reject malformed files with a helpful error.
- Detect duplicate IDs and shortcuts.
- Offer a clear merge or replace choice.
- Never overwrite existing user data without explicit confirmation.
- Show an import summary (added, skipped, updated).

Use a versioned JSON schema so future versions can migrate old backups.

---

## 4. Interface and design direction

Create a modern, polished dark UI. Do not copy Kortex branding or assets.

Visual direction:

- Dark charcoal background
- Slightly lighter sidebar and cards
- Clear typography and spacing
- Subtle borders
- Rounded corners
- Blue or violet accent color
- Accessible contrast
- Responsive layout
- Small, restrained transitions
- Clear focus indicators
- Keyboard-friendly controls

Suggested manager layout:

### Sidebar
- App name and icon
- All prompts
- Favorites
- Folders
- Tags
- Settings / backup

### Main area
- Page title
- Search field
- New Prompt button
- Prompt list or cards
- Prompt title
- Shortcut badge
- Tags
- Favorite toggle
- Edit and delete actions
- Insert action

### Prompt editor
- Title input
- Shortcut input
- Large prompt content editor
- Folder selector
- Tags input
- Favorite toggle
- Save and Cancel actions

### Autocomplete
- Compact dropdown positioned near the chat composer
- Prompt title
- Shortcut
- Content preview
- Selected-row highlight
- Keyboard navigation hint

Do not obscure NotebookLM controls or cover the chat composer unnecessarily.

---

## 5. Storage architecture

Use `chrome.storage.local` as the source of truth.

Suggested data structure:

```json
{
  "schemaVersion": 1,
  "prompts": [
    {
      "id": "unique-id",
      "title": "Academic Textbook Creator",
      "shortcut": ";book",
      "content": "Create a complete academic textbook...",
      "folderId": null,
      "tags": ["study", "academic"],
      "favorite": true,
      "createdAt": "ISO-8601 timestamp",
      "updatedAt": "ISO-8601 timestamp"
    }
  ],
  "folders": [
    {
      "id": "unique-id",
      "name": "Academic"
    }
  ]
}
```

Implement a storage module with functions such as:

- `getAllData()`
- `getPrompts()`
- `savePrompt(prompt)`
- `deletePrompt(id)`
- `getFolders()`
- `saveFolder(folder)`
- `deleteFolder(id)`
- `exportData()`
- `importData(data, mode)`

Requirements:

- Handle missing or corrupt storage safely.
- Use async/await.
- Catch and report storage errors.
- Keep storage logic separate from UI logic.
- Do not store prompt data only in page memory.
- Avoid unnecessary writes.
- Never silently discard user data.

---

## 6. NotebookLM integration engineering

NotebookLM's DOM is a changing third-party interface. Treat selectors as unstable.

Implement a dedicated integration module.

Requirements:

1. Match only `https://notebooklm.google.com/*`.
2. Detect page load and SPA route changes.
3. Wait for the chat composer to exist.
4. Detect the active composer at interaction time rather than caching a stale node indefinitely.
5. Support `textarea`, `input`, and `contenteditable` where applicable.
6. Inspect accessible labels, roles, and visible DOM structure when locating the composer.
7. Keep selectors centralized so they can be updated easily.
8. Avoid brittle selectors based only on generated class names.
9. Use a MutationObserver with throttling/debouncing.
10. Avoid repeated full-page scans.
11. Avoid duplicate toolbar buttons and event listeners.
12. Use an isolated extension UI, preferably Shadow DOM, to prevent NotebookLM CSS collisions.
13. Keep extension styles scoped.
14. Do not access NotebookLM private APIs or user data unrelated to prompt insertion.

For insertion, implement separate strategies:

- Textarea/input: use the native value setter where necessary and dispatch bubbling `input` and `change` events.
- Contenteditable: focus the element, use a suitable editing/insertion method, and dispatch appropriate input events.
- If the editor cannot be safely updated, show an actionable error and offer a copy-to-clipboard fallback.

Do not claim support for a composer type unless it has been tested.

---

## 7. Permissions and security

Request only the permissions needed.

Likely permissions:

- `storage`
- `activeTab` only if genuinely needed
- `scripting` only if genuinely needed
- `commands` only if using keyboard commands

Host permissions should be limited to:

- `https://notebooklm.google.com/*`

Security requirements:

- No remote scripts.
- No analytics or telemetry.
- No collection of NotebookLM source contents.
- No transmission of prompt data to external servers.
- Sanitize or safely render user-provided prompt titles, tags, and previews.
- Use `textContent` rather than unsafe HTML insertion for user content.
- Validate imported JSON before writing.
- Do not request broad permissions without justification.

---

## 8. Suggested project structure

Create a clean structure similar to:

```text
notebooklm-prompt-manager/
│
├── manifest.json
├── background.js
├── README.md
│
├── assets/
│   └── icons/
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
│
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
├── manager/
│   ├── manager.html
│   ├── manager.css
│   └── manager.js
│
├── content/
│   ├── content.js
│   ├── notebooklm-adapter.js
│   ├── autocomplete.js
│   ├── toolbar-button.js
│   └── content.css
│
├── storage/
│   └── storage.js
│
└── shared/
    ├── constants.js
    └── utils.js
```

You may adjust the structure if needed, but keep responsibilities separated and paths consistent.

Important: Ensure the manifest references files that actually exist. Do not leave placeholder files or broken imports.

---

## 9. Testing requirements

Create a practical test checklist and test what can be tested locally.

### Static checks
- Parse `manifest.json`.
- Check every referenced file exists.
- Run syntax checks on all JavaScript files.
- Check import paths.
- Check permissions.
- Check for duplicate IDs or shortcut logic errors.

### Functional checks
- Create a prompt.
- Edit a prompt.
- Delete a prompt.
- Search prompts.
- Favorite/unfavorite.
- Create and delete folders.
- Assign tags.
- Export JSON.
- Import JSON.
- Reload Chrome and verify data persists.

### NotebookLM checks
- Open a blank NotebookLM notebook.
- Confirm the Prompts button appears.
- Open the manager.
- Type `;boo` in the chat composer.
- Confirm `;book` appears.
- Select it with Enter.
- Confirm the full prompt is inserted.
- Confirm the message is not sent.
- Repeat with Tab and mouse selection.
- Navigate to another notebook and back.
- Confirm no duplicate buttons or observers appear.

If browser access or a real NotebookLM session is unavailable, do not pretend these tests passed. Clearly list the tests that remain for the user.

---

## 10. README and installation guide

Write a complete `README.md` containing:

- Product overview
- Features
- Project structure
- Requirements
- Installation from source
- How to load unpacked in Chrome
- How to create and use shortcuts
- How to import/export backups
- How to reload after code changes
- Troubleshooting
- Known NotebookLM compatibility limitations
- Privacy and permissions explanation

Installation instructions must include:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the extension root folder containing `manifest.json`.
5. Open or refresh NotebookLM.
6. Test the Prompts button and shortcut autocomplete.

---

## 11. Development sequence

Work in this order:

### Phase 1: Foundation
- Create the project structure.
- Create a valid Manifest V3 manifest.
- Add the service worker and storage module.
- Confirm the extension loads without errors.

### Phase 2: Prompt manager
- Build the modern manager UI.
- Implement prompt CRUD.
- Implement search, favorites, folders, and tags.
- Implement JSON import/export.

### Phase 3: NotebookLM toolbar integration
- Detect NotebookLM.
- Inject the Prompts button.
- Open the manager.
- Test on a blank notebook.

### Phase 4: Shortcut autocomplete
- Detect the active composer.
- Implement shortcut matching.
- Implement suggestion UI.
- Implement keyboard and mouse selection.
- Insert text without submitting.

### Phase 5: Quality assurance
- Run syntax and manifest checks.
- Fix all discovered issues.
- Verify paths and permissions.
- Document any unverified browser-specific behavior.

Do not skip ahead while earlier phases are broken.

---

## 12. Final delivery requirements

Create all source files directly in the current project workspace.

At completion, report:

1. What was created.
2. The final project tree.
3. Features implemented.
4. Tests actually performed and their results.
5. Any NotebookLM integration behavior not verified.
6. Exact installation instructions.
7. How to package the folder as a ZIP.

Do not stop after writing a plan. Implement the extension.

**Highest priority:** The extension must load successfully in Chrome, and the Prompts manager must be accessible even if NotebookLM's toolbar DOM changes. Then make shortcut autocomplete and insertion work reliably.

Begin by creating the project from scratch.
