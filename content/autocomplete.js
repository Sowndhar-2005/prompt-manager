/**
 * Autocomplete Component for NotebookLM Chat Composer.
 * Uses Shadow DOM for total style isolation from NotebookLM.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const constants = require('../shared/constants.js');
    const utils = require('../shared/utils.js');
    module.exports = factory(constants, utils);
  } else {
    root.NLM_AUTOCOMPLETE = factory(root.NLM_CONSTANTS, root.NLM_UTILS);
  }
})(typeof self !== 'undefined' ? self : this, function (CONSTANTS, UTILS) {
  'use strict';

  class AutocompleteController {
    constructor(adapter, storage, onOpenDrawer = null, onNewPrompt = null) {
      this.adapter = adapter;
      this.storage = storage;
      this.onOpenDrawer = onOpenDrawer;
      this.onNewPrompt = onNewPrompt;
      this.prompts = [];
      this.matches = [];
      this.selectedIndex = 0;
      this.currentToken = null;
      this.activeComposer = null;
      this.isVisible = false;
      this.hostElement = null;
      this.shadowRoot = null;

      this.handleInput = UTILS.debounce(this.onInput.bind(this), 50);
      this.handleKeyDown = this.onKeyDown.bind(this);
      this.handleBlur = this.onBlur.bind(this);
      this.handleClickOutside = this.onClickOutside.bind(this);

      this.initPrompts();
      this.setupShadowDom();
      this.bindGlobalListeners();
    }

    async initPrompts() {
      try {
        this.prompts = await this.storage.getPrompts();
      } catch (err) {
        console.error('Failed to load prompts for autocomplete:', err);
      }
    }

    reloadPrompts(prompts) {
      this.prompts = prompts || [];
    }

    setupShadowDom() {
      if (document.getElementById('nlm-autocomplete-host')) return;

      this.hostElement = document.createElement('div');
      this.hostElement.id = 'nlm-autocomplete-host';
      this.hostElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 0;
        overflow: visible;
        pointer-events: none;
        z-index: 2147483640;
      `;

      this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --nlm-bg: #181920;
            --nlm-surface: #222430;
            --nlm-border: #323647;
            --nlm-text-primary: #f1f5f9;
            --nlm-text-secondary: #94a3b8;
            --nlm-accent: #6366f1;
            --nlm-accent-bg: rgba(99, 102, 241, 0.15);
            --nlm-shortcut-bg: #2e3146;
            --nlm-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }

          .dropdown {
            display: none;
            position: absolute;
            width: 380px;
            max-width: calc(100vw - 32px);
            background: var(--nlm-bg);
            border: 1px solid var(--nlm-border);
            border-radius: 12px;
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05);
            font-family: var(--nlm-font);
            color: var(--nlm-text-primary);
            overflow: hidden;
            pointer-events: auto;
            flex-direction: column;
            animation: fadeIn 0.12s ease-out;
          }

          .dropdown.visible {
            display: flex;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: var(--nlm-surface);
            border-bottom: 1px solid var(--nlm-border);
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--nlm-text-secondary);
          }

          .header-title {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #c7d2fe;
            user-select: none;
          }

          .header-hint {
            font-weight: 400;
            font-size: 11px;
          }

          .list {
            max-height: 260px;
            overflow-y: auto;
            padding: 4px;
            margin: 0;
            list-style: none;
          }

          .list::-webkit-scrollbar {
            width: 6px;
          }

          .list::-webkit-scrollbar-thumb {
            background: #3b3f54;
            border-radius: 3px;
          }

          .item {
            padding: 8px 10px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 3px;
            transition: background 0.1s ease;
          }

          .item:hover, .item.selected {
            background: var(--nlm-accent-bg);
            border-left: 3px solid var(--nlm-accent);
          }

          .item-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }

          .item-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--nlm-text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .item-shortcut {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11px;
            font-weight: 700;
            color: #a5b4fc;
            background: var(--nlm-shortcut-bg);
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid rgba(165, 180, 252, 0.2);
            white-space: nowrap;
          }

          .item-preview {
            font-size: 11px;
            line-height: 1.4;
            color: var(--nlm-text-secondary);
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }

          .empty-state {
            padding: 16px;
            text-align: center;
            font-size: 12px;
            color: var(--nlm-text-secondary);
          }

          .footer-hints {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px;
            background: #14151b;
            border-top: 1px solid var(--nlm-border);
            font-size: 10px;
            color: var(--nlm-text-secondary);
          }

          .key-badge {
            background: #252837;
            padding: 1px 4px;
            border-radius: 3px;
            border: 1px solid #3d4157;
            color: #e2e8f0;
          }

          .btn-add-quick {
            background: rgba(99, 102, 241, 0.2);
            color: #c7d2fe;
            border: 1px solid rgba(129, 140, 248, 0.45);
            border-radius: 4px;
            padding: 2px 7px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.12s ease;
          }

          .btn-add-quick:hover {
            background: #6366f1;
            color: #ffffff;
            border-color: #818cf8;
          }
        </style>

        <div class="dropdown" id="dropdown">
          <div class="header">
            <span class="header-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:2px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span>Prompts</span>
            </span>
            <span class="header-hint"><span class="key-badge">↑</span> <span class="key-badge">↓</span> navigate</span>
          </div>
          <ul class="list" id="prompt-list"></ul>
          <div class="footer-hints">
            <span>Press <span class="key-badge">Enter</span> or <span class="key-badge">Tab</span> to insert</span>
            <span><span class="key-badge">Esc</span> to dismiss</span>
          </div>
        </div>
      `;

      document.body.appendChild(this.hostElement);
    }

    bindGlobalListeners() {
      // Listen on document for input/keydown, delegating to active composer
      document.addEventListener('input', (e) => {
        const composer = this.adapter.getComposerRoot(e.target);
        if (composer) {
          this.activeComposer = composer;
          this.handleInput(e);
        }
      }, true);

      document.addEventListener('keydown', (e) => {
        const composer = this.adapter.getComposerRoot(e.target);
        if (this.isVisible && composer) {
          this.handleKeyDown(e);
        }
      }, true);

      document.addEventListener('click', this.handleClickOutside, true);
    }

    onInput(e) {
      const composer = this.adapter.getComposerRoot(e.target) || e.target;
      this.activeComposer = composer;
      const state = this.adapter.getComposerState(composer);

      const token = UTILS.extractShortcutToken(state.text, state.start);
      if (!token.hasMatch) {
        this.hide();
        return;
      }

      this.currentToken = token;
      const query = token.shortcut.toLowerCase();
      const querySlug = query.replace(/^[;\/\\~^!@#$%&?>|.-]+/, '');

      // Find matching prompts: exact prefix match first, then substring match
      this.matches = this.prompts.filter((p) => {
        const sc = (p.shortcut || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        return (
          sc.startsWith(query) ||
          (querySlug && (sc.includes(querySlug) || title.includes(querySlug)))
        );
      });

      if (this.matches.length === 0) {
        this.hide();
        return;
      }

      this.selectedIndex = 0;
      this.show(composer);
    }

    onKeyDown(e) {
      if (!this.isVisible || this.matches.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        this.selectedIndex = (this.selectedIndex + 1) % this.matches.length;
        this.renderList();
        this.scrollSelectedIntoView();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        this.selectedIndex = (this.selectedIndex - 1 + this.matches.length) % this.matches.length;
        this.renderList();
        this.scrollSelectedIntoView();
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        // Prevent sending message or tabbing out
        e.preventDefault();
        e.stopPropagation();
        this.insertSelectedPrompt();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    }

    onBlur() {
      // Delay hide to allow mouse click on dropdown items
      setTimeout(() => {
        if (!this.hostElement.contains(document.activeElement)) {
          this.hide();
        }
      }, 200);
    }

    onClickOutside(e) {
      if (!this.isVisible) return;
      const path = (e.composedPath && e.composedPath()) || [];
      if (path.includes(this.hostElement) || path.includes(this.activeComposer)) {
        return;
      }
      this.hide();
    }

    show(composer) {
      this.positionDropdown(composer);
      this.renderList();
      const dropdown = this.shadowRoot.getElementById('dropdown');
      if (dropdown) dropdown.classList.add('visible');
      this.isVisible = true;
    }

    hide() {
      const dropdown = this.shadowRoot?.getElementById('dropdown');
      if (dropdown) dropdown.classList.remove('visible');
      this.isVisible = false;
      this.currentToken = null;
    }

    positionDropdown(composer) {
      const dropdown = this.shadowRoot.getElementById('dropdown');
      if (!dropdown || !composer) return;

      const rect = composer.getBoundingClientRect();
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      // Position above composer by default if space permits, else below
      const dropdownHeight = Math.min(this.matches.length * 60 + 80, 320);
      let top = rect.top + scrollY - dropdownHeight - 8;
      let left = rect.left + scrollX;

      if (top < scrollY + 10) {
        // Not enough space above, position below
        top = rect.bottom + scrollY + 8;
      }

      // Constrain left edge to viewport
      const maxWidth = 380;
      if (left + maxWidth > window.innerWidth - 16) {
        left = window.innerWidth - maxWidth - 16;
      }
      if (left < 16) left = 16;

      dropdown.style.top = `${top}px`;
      dropdown.style.left = `${left}px`;
    }

    renderList() {
      const list = this.shadowRoot.getElementById('prompt-list');
      if (!list) return;

      list.innerHTML = '';

      if (this.matches.length === 0) {
        list.innerHTML = `
          <li class="empty-state">
            <div>No matching prompts found</div>
            <button class="btn-add-quick" style="margin-top:8px;" id="btn-empty-add-prompt">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>+ Create Prompt</span>
            </button>
          </li>
        `;
        list.querySelector('#btn-empty-add-prompt')?.addEventListener('click', (e) => {
          e.preventDefault();
          this.hide();
          window.dispatchEvent(new CustomEvent('nlm_open_new_prompt'));
        });
        return;
      }

      this.matches.forEach((prompt, idx) => {
        const item = document.createElement('li');
        item.className = `item ${idx === this.selectedIndex ? 'selected' : ''}`;
        item.dataset.index = idx;

        const safeTitle = UTILS.escapeHtml(prompt.title);
        const safeShortcut = UTILS.escapeHtml(prompt.shortcut);
        const safePreview = UTILS.escapeHtml(prompt.content.slice(0, 100));

        item.innerHTML = `
          <div class="item-top">
            <span class="item-title">${safeTitle}</span>
            <span class="item-shortcut">${safeShortcut}</span>
          </div>
          <div class="item-preview">${safePreview}</div>
        `;

        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.selectedIndex = idx;
          this.insertSelectedPrompt();
        });

        list.appendChild(item);
      });

      // Quick "+ Add New Prompt" footer entry in list
      const addFooter = document.createElement('li');
      addFooter.className = 'item';
      addFooter.style.cssText = 'border-top: 1px dashed var(--nlm-border); opacity: 0.85; padding: 7px 12px; cursor: pointer;';
      addFooter.innerHTML = `
        <div class="item-top" style="color: #a5b4fc; font-size: 11px; gap: 6px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Create New Prompt...</span>
        </div>
      `;
      addFooter.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
        window.dispatchEvent(new CustomEvent('nlm_open_new_prompt'));
      });
      list.appendChild(addFooter);
    }

    scrollSelectedIntoView() {
      const list = this.shadowRoot.getElementById('prompt-list');
      const selected = list?.querySelector('.item.selected');
      if (selected && list) {
        const itemTop = selected.offsetTop;
        const itemBottom = itemTop + selected.offsetHeight;
        if (itemTop < list.scrollTop) {
          list.scrollTop = itemTop;
        } else if (itemBottom > list.scrollTop + list.offsetHeight) {
          list.scrollTop = itemBottom - list.offsetHeight;
        }
      }
    }

    insertSelectedPrompt() {
      const selectedPrompt = this.matches[this.selectedIndex];
      if (!selectedPrompt) return;

      const composer = this.activeComposer || this.adapter.findComposer();
      this.adapter.insertPrompt(composer, selectedPrompt.content, this.currentToken);
      this.hide();
    }
  }

  return AutocompleteController;
});
