/**
 * Shared constants for Universal AI Prompt Manager.
 * Supports NotebookLM, Gemini, ChatGPT, Claude, DeepSeek, and Google Docs.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NLM_CONSTANTS = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return {
    SCHEMA_VERSION: 1,

    STORAGE_KEYS: {
      PROMPTS: 'nlm_prompts',
      FOLDERS: 'nlm_folders',
      SCHEMA_VERSION: 'nlm_schema_version',
      SETTINGS: 'nlm_settings'
    },

    MESSAGE_TYPES: {
      OPEN_MANAGER: 'NLM_OPEN_MANAGER',
      PROMPT_INSERTED: 'NLM_PROMPT_INSERTED',
      STORAGE_UPDATED: 'NLM_STORAGE_UPDATED',
      TRIGGER_AUTOCOMPLETE: 'NLM_TRIGGER_AUTOCOMPLETE'
    },

    SHORTCUT_PREFIX: ';',
    SUPPORTED_PREFIXES: [';', '\\', '~', '^', '!', '/', '@', '#', '$', '%', '&', '?', '>', '|', '.'],
    SHORTCUT_REGEX: /^[;\/\\~^!@#$%&?>|.-][a-zA-Z0-9_-]+$/,

    DEFAULT_FOLDERS: [
      { id: 'f_research', name: 'Research & Study' },
      { id: 'f_writing', name: 'Writing & Editing' },
      { id: 'f_analysis', name: 'Analysis & Synthesis' }
    ],

    DEFAULT_PROMPTS: [
      {
        id: 'p_academic_book',
        title: 'Academic Textbook Creator',
        shortcut: ';book',
        content: 'Create a comprehensive, university-level academic textbook chapter based on the provided sources. Include an executive overview, detailed theoretical foundations, key empirical evidence, practical case examples, a chapter summary, and critical thinking review questions.',
        folderId: 'f_research',
        tags: ['academic', 'textbook', 'study'],
        favorite: true,
        createdAt: '2026-11-10T12:00:00.000Z',
        updatedAt: '2026-11-10T12:00:00.000Z'
      },
      {
        id: 'p_executive_summary',
        title: 'Executive Summary',
        shortcut: ';sum',
        content: 'Generate a high-impact Executive Summary synthesizing all key findings from the source documents. Structure with: 1. Core Objectives, 2. Key Insights & Data Points, 3. Strategic Implications, and 4. Immediate Action Items. Keep language concise, authoritative, and bullet-pointed.',
        folderId: 'f_analysis',
        tags: ['summary', 'briefing', 'executive'],
        favorite: true,
        createdAt: '2026-11-10T12:00:00.000Z',
        updatedAt: '2026-11-10T12:00:00.000Z'
      },
      {
        id: 'p_faq_generator',
        title: 'Comprehensive FAQ Generator',
        shortcut: ';faq',
        content: 'Analyze all uploaded source materials and extract the top 10 most critical, frequently asked questions a newcomer or stakeholder would have. For each question, provide a thorough, accurate answer citing specific sections of the sources.',
        folderId: 'f_writing',
        tags: ['faq', 'q&a', 'reference'],
        favorite: false,
        createdAt: '2026-11-10T12:00:00.000Z',
        updatedAt: '2026-11-10T12:00:00.000Z'
      },
      {
        id: 'p_counter_arguments',
        title: 'Red Team & Counter-Arguments',
        shortcut: ';critique',
        content: 'Critically examine the assertions made in these sources. Act as an adversarial red team reviewer: identify unstated assumptions, logical vulnerabilities, alternative interpretations, and potential counter-arguments that challenge the central thesis.',
        folderId: 'f_analysis',
        tags: ['critique', 'analysis', 'redteam'],
        favorite: false,
        createdAt: '2026-11-10T12:00:00.000Z',
        updatedAt: '2026-11-10T12:00:00.000Z'
      },
      {
        id: 'p_study_flashcards',
        title: 'Active Recall Study Guide',
        shortcut: ';study',
        content: 'Convert the core concepts, terminology, and key formulas/theories in these sources into an active-recall study guide. Formulate pairs of high-yield questions and detailed answers formatted for spaced repetition memorization.',
        folderId: 'f_research',
        tags: ['flashcards', 'study', 'education'],
        favorite: false,
        createdAt: '2026-11-10T12:00:00.000Z',
        updatedAt: '2026-11-10T12:00:00.000Z'
      }
    ],

    MATCH_PATTERNS: [
      'https://notebooklm.google.com/*',
      'https://notebook.google.com/*',
      'https://notebooklm.google/*',
      'https://notebook.google/*',
      'https://gemini.google.com/*',
      'https://chatgpt.com/*',
      'https://chat.openai.com/*',
      'https://claude.ai/*',
      'https://chat.deepseek.com/*',
      'https://copilot.microsoft.com/*'
    ],

    SELECTORS: {
      COMPOSERS: [
        '#prompt-textarea',
        'div#prompt-textarea[contenteditable="true"]',
        'textarea[data-id="root"]',
        'div.ProseMirror[contenteditable="true"]',
        'div[contenteditable="true"][aria-label*="Write"]',
        'fieldset div[contenteditable="true"]',
        'rich-textarea div[contenteditable="true"]',
        'div.ql-editor[contenteditable="true"]',
        'textarea[aria-label*="Enter a prompt"]',
        'textarea#chat-input',
        'textarea[placeholder*="DeepSeek"]',
        'textarea.query-input',
        'textarea[placeholder*="Ask"]',
        'textarea[placeholder*="chat"]',
        'textarea[placeholder*="notebook"]',
        'textarea[aria-label*="Ask"]',
        'textarea[aria-label*="chat"]',
        'textarea[aria-label*="Prompt"]',
        'textarea[aria-label*="question"]',
        'form.chat-input textarea',
        'div.chat-input textarea',
        'div.query-bar textarea',
        'div.input-box textarea',
        'div.input-container textarea',
        'div[contenteditable="true"][aria-label*="Ask"]',
        'div[contenteditable="true"][role="combobox"]',
        'div[contenteditable="true"][role="textbox"]',
        'main textarea',
        'textarea',
        'div[contenteditable="true"]',
        'input[type="text"][placeholder*="Ask"]'
      ],

      TOOLBAR_CONTAINERS: [
        'header div:has(button)',
        'header .header-actions',
        'header div[role="toolbar"]',
        'header',
        'nav div:has(button)',
        '.chat-header-actions',
        'nav'
      ]
    }
  };
});
