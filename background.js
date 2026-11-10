/**
 * Background Service Worker for NotebookLM Prompt Manager (Manifest V3).
 * Stateless lifecycle - all persistent data resides in chrome.storage.local.
 */

// Initialize defaults on install
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    // Check if storage is initialized
    const data = await chrome.storage.local.get(['nlm_prompts', 'nlm_folders', 'nlm_schema_version']);
    if (!data.nlm_prompts || data.nlm_prompts.length === 0) {
      // Default seed prompts
      const defaultFolders = [
        { id: 'f_research', name: 'Research & Study' },
        { id: 'f_writing', name: 'Writing & Editing' },
        { id: 'f_analysis', name: 'Analysis & Synthesis' }
      ];

      const defaultPrompts = [
        {
          id: 'p_academic_book',
          title: 'Academic Textbook Creator',
          shortcut: ';book',
          content: 'Create a comprehensive, university-level academic textbook chapter based on the provided sources. Include an executive overview, detailed theoretical foundations, key empirical evidence, practical case examples, a chapter summary, and critical thinking review questions.',
          folderId: 'f_research',
          tags: ['academic', 'textbook', 'study'],
          favorite: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'p_executive_summary',
          title: 'Executive Summary',
          shortcut: ';sum',
          content: 'Generate a high-impact Executive Summary synthesizing all key findings from the source documents. Structure with: 1. Core Objectives, 2. Key Insights & Data Points, 3. Strategic Implications, and 4. Immediate Action Items. Keep language concise, authoritative, and bullet-pointed.',
          folderId: 'f_analysis',
          tags: ['summary', 'briefing', 'executive'],
          favorite: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'p_faq_generator',
          title: 'Comprehensive FAQ Generator',
          shortcut: ';faq',
          content: 'Analyze all uploaded source materials and extract the top 10 most critical, frequently asked questions a newcomer or stakeholder would have. For each question, provide a thorough, accurate answer citing specific sections of the sources.',
          folderId: 'f_writing',
          tags: ['faq', 'q&a', 'reference'],
          favorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'p_counter_arguments',
          title: 'Red Team & Counter-Arguments',
          shortcut: ';critique',
          content: 'Critically examine the assertions made in these sources. Act as an adversarial red team reviewer: identify unstated assumptions, logical vulnerabilities, alternative interpretations, and potential counter-arguments that challenge the central thesis.',
          folderId: 'f_analysis',
          tags: ['critique', 'analysis', 'redteam'],
          favorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'p_study_flashcards',
          title: 'Active Recall Study Guide',
          shortcut: ';study',
          content: 'Convert the core concepts, terminology, and key formulas/theories in these sources into an active-recall study guide. Formulate pairs of high-yield questions and detailed answers formatted for spaced repetition memorization.',
          folderId: 'f_research',
          tags: ['flashcards', 'study', 'education'],
          favorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      await chrome.storage.local.set({
        nlm_prompts: defaultPrompts,
        nlm_folders: defaultFolders,
        nlm_schema_version: 1
      });
      console.log('NotebookLM Prompt Manager: Default prompts initialized.');
    }

    setupContextMenus();
  } catch (err) {
    console.error('Failed to initialize default prompts:', err);
  }
});

// Setup context menus for accessing prompts anywhere on any website
function setupContextMenus() {
  if (!chrome.contextMenus) return;
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'nlm_context_root',
        title: 'AI Prompts',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'nlm_open_full_manager',
        parentId: 'nlm_context_root',
        title: 'Open Prompt Manager',
        contexts: ['all']
      });

      chrome.contextMenus.create({
        id: 'nlm_separator',
        parentId: 'nlm_context_root',
        type: 'separator',
        contexts: ['all']
      });

      chrome.storage.local.get(['nlm_prompts'], (res) => {
        const prompts = res.nlm_prompts || [];
        prompts.slice(0, 8).forEach((p) => {
          chrome.contextMenus.create({
            id: `nlm_prompt_${p.id}`,
            parentId: 'nlm_context_root',
            title: `${p.shortcut || ''} - ${p.title}`,
            contexts: ['editable', 'page', 'selection']
          });
        });
      });
    });
  } catch (err) {
    console.error('Failed to setup context menus:', err);
  }
}

// Rebuild context menus when prompts are added, edited, or deleted
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.nlm_prompts) {
    setupContextMenus();
  }
});

// Handle context menu clicks across any website
chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'nlm_open_full_manager') {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager/manager.html') });
    return;
  }

  if (typeof info.menuItemId === 'string' && info.menuItemId.startsWith('nlm_prompt_')) {
    const promptId = info.menuItemId.replace('nlm_prompt_', '');
    const data = await chrome.storage.local.get(['nlm_prompts']);
    const prompt = (data.nlm_prompts || []).find((p) => p.id === promptId);
    if (!prompt || !tab || !tab.id) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (textToInsert) => {
          const el = document.activeElement;
          if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
            const start = el.selectionStart || 0;
            const end = el.selectionEnd || 0;
            const val = el.value || '';
            el.value = val.slice(0, start) + textToInsert + val.slice(end);
            el.selectionStart = el.selectionEnd = start + textToInsert.length;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          }
          if (el && el.isContentEditable) {
            document.execCommand('insertText', false, textToInsert);
            return;
          }
          navigator.clipboard.writeText(textToInsert);
        },
        args: [prompt.content]
      });
    } catch {
      // Fallback
    }
  }
});

function isNotebookLMUrl(url) {
  if (!url) return false;
  return (
    url.startsWith('https://notebooklm.google.com') ||
    url.startsWith('https://notebook.google.com') ||
    url.startsWith('https://notebooklm.google') ||
    url.startsWith('https://notebook.google')
  );
}

// Handle keyboard command (e.g. Alt+Shift+P)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open_manager') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id && isNotebookLMUrl(tab.url)) {
        // Signal content script on active NotebookLM tab to toggle manager drawer
        chrome.tabs.sendMessage(tab.id, { type: 'NLM_TOGGLE_MANAGER_DRAWER' }).catch(() => {
          // If content script was not loaded yet, open manager in new tab
          chrome.tabs.create({ url: chrome.runtime.getURL('manager/manager.html') });
        });
      } else {
        // Open standalone manager tab
        chrome.tabs.create({ url: chrome.runtime.getURL('manager/manager.html') });
      }
    } catch (err) {
      console.error('Command handling error:', err);
    }
  }
});

// Handle runtime messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  if (message.type === 'NLM_OPEN_MANAGER_TAB') {
    (async () => {
      try {
        const managerUrl = chrome.runtime.getURL('manager/manager.html');
        const existingTabs = await chrome.tabs.query({ url: managerUrl });
        if (existingTabs && existingTabs.length > 0) {
          const tab = existingTabs[0];
          await chrome.tabs.update(tab.id, { active: true });
          if (tab.windowId) {
            await chrome.windows.update(tab.windowId, { focused: true });
          }
          sendResponse({ success: true, tabId: tab.id });
        } else {
          const tab = await chrome.tabs.create({ url: managerUrl });
          sendResponse({ success: true, tabId: tab.id });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open for async response
  }

  if (message.type === 'NLM_PING') {
    sendResponse({ status: 'ok', version: chrome.runtime.getManifest().version });
    return false;
  }

  return false;
});
