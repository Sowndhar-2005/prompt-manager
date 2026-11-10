# Chrome Web Store Listing — AI Prompt Manager (Universal)

> Last Updated: 2026-11-10

## Store Listing

**Extension Name**
AI Prompt Manager for NotebookLM & Chatbots

**Short Description (max 132 chars)**
Save reusable prompts and instantly insert them into NotebookLM, Gemini, ChatGPT, Claude, DeepSeek, and Copilot using shortcuts.

**Detailed Description**
AI Prompt Manager is a lightweight productivity extension that gives you a personal library of reusable prompts directly inside your favorite AI workspaces. Save your best synthesis queries, research workflows, coding templates, and analysis routines once, then trigger them in chat with simple keyboard shortcuts.

Key Features:
- ⚡ Real-Time Shortcut Autocomplete: Type your trigger symbol and shortcut keyword (e.g. ;book, \sum, !faq) directly into the chat composer on Google NotebookLM, Google Gemini, OpenAI ChatGPT, Anthropic Claude, DeepSeek, and Microsoft Copilot.
- 🎯 Custom Trigger Symbols: Choose from 15 non-conflicting symbols (;, \, ~, ^, !, /, @, #, $, %, &, ?, >, |, .) from a dedicated dropdown to prevent interference with natural typing.
- 🌐 Universal Access for All Other Websites: Right-click any text field or input on any website (Google Docs, Notion, Slack, Gmail, GitHub, etc.) to insert saved prompts via the context menu or toolbar quick launcher.
- 🛡️ Safe Composer Insertion: Seamlessly fills the chat composer while preserving your existing text before and after the shortcut, without auto-submitting the message.
- 🎨 Full Dark Mode Manager: Organize prompts with custom folders, searchable tags, and favorites.
- 📂 JSON Backup & Restore: Versioned export and import with duplicate detection and choice of merge or replace.
- 🔒 100% Private & Local: All prompts are stored strictly in your browser's local storage (`chrome.storage.local`). No external servers, no tracking, and no telemetry.

Supported Real-Time Autocomplete Platforms:
1. Google NotebookLM (notebook.google.com, notebooklm.google.com)
2. Google Gemini (gemini.google.com)
3. OpenAI ChatGPT (chatgpt.com, chat.openai.com)
4. Anthropic Claude (claude.ai)
5. DeepSeek (chat.deepseek.com)
6. Microsoft Copilot (copilot.microsoft.com)

Category:
Productivity / Workflow

Single Purpose:
Saves and organizes reusable prompts for keyboard shortcut autocomplete in AI chat composers and quick insertion across web applications.

Primary Language:
English

## Permissions Justification

| Permission | Type | Justification |
| :--- | :--- | :--- |
| `storage` | permissions | Persists saved user prompts, custom folders, tags, and favorite preferences locally in the browser (`chrome.storage.local`). |
| `commands` | permissions | Enables the global keyboard shortcut (Alt+Shift+P) to quickly toggle the prompt manager. |
| `contextMenus` | permissions | Adds the "AI Prompts" right-click menu so users can insert prompts into text fields on any website. |
| `activeTab` | permissions | Allows the toolbar quick launcher popup to insert prompts into the currently active tab when the user clicks "Insert". |
| `scripting` | permissions | Injects prompt text into active text inputs when user triggers insertion from the context menu or popup on non-AI web pages. |
| Host Permissions (`notebooklm.google.com`, `gemini.google.com`, `chatgpt.com`, `claude.ai`, `chat.deepseek.com`, `copilot.microsoft.com`) | host_permissions | Injects in-page content scripts to detect shortcut triggers in the chat composer and provide real-time autocomplete suggestions. |

## Privacy & Data Use Certification
- **User Data Collection**: None. The extension does not collect, transmit, or sell any personal or browsing data.
- **Remote Communications**: Zero remote network requests. All data stays strictly in local storage.
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Distribution
**Visibility**: Public
**Regions**: All regions

## Developer Info
**Publisher Name**: NotebookLM Prompt Manager Contributors
**Contact Email**: support@example.com

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-11-10 | Initial release: autocomplete, prompt manager, in-page drawer, JSON backup/restore. | Draft |
