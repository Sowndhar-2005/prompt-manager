/**
 * Main Content Script for Universal AI Prompt Manager.
 * Operates across NotebookLM, Gemini, ChatGPT, Claude, DeepSeek, and Docs.
 * In-Page Shadow DOM drawer with locked ';' shortcut prefix, inline folder creation, and clean SVG icons.
 */
(function () {
  'use strict';

  const CONSTANTS = window.NLM_CONSTANTS;
  const UTILS = window.NLM_UTILS;
  const STORAGE = window.NLM_STORAGE;
  const ADAPTER = window.NLM_ADAPTER;
  const Autocomplete = window.NLM_AUTOCOMPLETE;
  const ToolbarManager = window.NLM_TOOLBAR;

  if (!STORAGE || !ADAPTER || !Autocomplete) {
    console.warn('AI Prompt Manager: Core dependencies not ready.');
    return;
  }

  // SVGs for clean professional UI
  const ICONS = {
    SPARKLES: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    STAR: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    STAR_OUTLINE: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    FOLDER: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
    PLUS: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    COPY: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    CORNER_DOWN_LEFT: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>`,
    TRASH: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    EDIT: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
    EXTERNAL: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
    CLOSE: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
  };

  STORAGE.initDefaults();

  let inPageDrawer = null;

  const autocomplete = new Autocomplete(
    ADAPTER,
    STORAGE,
    () => inPageDrawer?.open(),
    () => {
      inPageDrawer?.open();
      inPageDrawer?.showEditor();
    }
  );

  class InPageDrawer {
    constructor() {
      this.isOpen = false;
      this.host = null;
      this.shadow = null;
      this.prompts = [];
      this.folders = [];
      this.activeTab = 'all';
      this.searchQuery = '';
      this.editingPrompt = null;
      this.isCreatingFolder = false;

      this.setupDOM();
      this.loadData();
    }

    setupDOM() {
      if (document.getElementById('nlm-drawer-host')) return;

      this.host = document.createElement('div');
      this.host.id = 'nlm-drawer-host';
      this.host.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2147483645;
      `;

      this.shadow = this.host.attachShadow({ mode: 'open' });
      this.render();
      document.body.appendChild(this.host);

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }

    async loadData() {
      try {
        const data = await STORAGE.getAllData();
        this.prompts = data.prompts || [];
        this.folders = data.folders || [];
        autocomplete.reloadPrompts(this.prompts);
        if (this.isOpen) {
          this.renderTabs();
          this.renderContent();
        }
      } catch (err) {
        console.error('Failed to load data for in-page drawer:', err);
      }
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.editingPrompt = null;
      this.isCreatingFolder = false;
      this.loadData();
      const backdrop = this.shadow.getElementById('drawer-backdrop');
      const panel = this.shadow.getElementById('drawer-panel');
      if (backdrop && panel) {
        this.host.style.pointerEvents = 'auto';
        backdrop.classList.add('visible');
        panel.classList.add('visible');
        setTimeout(() => {
          this.shadow.getElementById('drawer-search')?.focus();
        }, 120);
      }
    }

    close() {
      this.isOpen = false;
      const backdrop = this.shadow.getElementById('drawer-backdrop');
      const panel = this.shadow.getElementById('drawer-panel');
      if (backdrop && panel) {
        backdrop.classList.remove('visible');
        panel.classList.remove('visible');
        setTimeout(() => {
          this.host.style.pointerEvents = 'none';
        }, 220);
      }
    }

    render() {
      this.shadow.innerHTML = `
        <style>
          :host {
            --nlm-bg: #0f1117;
            --nlm-surface: #171923;
            --nlm-card: #1f2230;
            --nlm-card-hover: #262a3c;
            --nlm-border: #2c3245;
            --nlm-border-subtle: #222636;
            --nlm-text: #f8fafc;
            --nlm-text-muted: #94a3b8;
            --nlm-accent: #6366f1;
            --nlm-accent-hover: #4f46e5;
            --nlm-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --nlm-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          .backdrop {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.65);
            backdrop-filter: blur(3px);
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
          }

          .backdrop.visible {
            opacity: 1;
            pointer-events: auto;
          }

          .panel {
            position: absolute;
            top: 0;
            right: 0;
            width: 440px;
            max-width: 92vw;
            height: 100%;
            background: var(--nlm-bg);
            border-left: 1px solid var(--nlm-border);
            box-shadow: -10px 0 35px rgba(0, 0, 0, 0.65);
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: var(--nlm-font);
            color: var(--nlm-text);
            pointer-events: auto;
            overflow: hidden;
          }

          .panel.visible {
            transform: translateX(0);
          }

          .header {
            padding: 16px 20px 14px;
            background: var(--nlm-surface);
            border-bottom: 1px solid var(--nlm-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .header-brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .brand-icon {
            background: linear-gradient(135deg, #6366f1, #4338ca);
            color: #fff;
            width: 30px;
            height: 30px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header-title {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: -0.2px;
            color: var(--nlm-text);
          }

          .header-actions {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .icon-btn {
            background: transparent;
            border: 1px solid transparent;
            color: var(--nlm-text-muted);
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            transition: all 0.12s ease;
          }

          .icon-btn:hover {
            background: var(--nlm-card);
            border-color: var(--nlm-border);
            color: var(--nlm-text);
          }

          .search-bar-wrap {
            padding: 12px 20px;
            background: var(--nlm-bg);
            border-bottom: 1px solid var(--nlm-border);
          }

          .search-input {
            width: 100%;
            padding: 9px 12px;
            background: var(--nlm-surface);
            border: 1px solid var(--nlm-border);
            border-radius: 8px;
            color: var(--nlm-text);
            font-size: 13px;
            outline: none;
            transition: border-color 0.15s;
          }

          .search-input:focus {
            border-color: var(--nlm-accent);
          }

          .tabs-nav {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 20px;
            overflow-x: auto;
            border-bottom: 1px solid var(--nlm-border);
            background: var(--nlm-surface);
          }

          .tabs-nav::-webkit-scrollbar {
            display: none;
          }

          .tab-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: transparent;
            border: 1px solid transparent;
            color: var(--nlm-text-muted);
            font-size: 12px;
            font-weight: 500;
            padding: 4px 10px;
            border-radius: 14px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.12s;
          }

          .tab-pill.active {
            background: var(--nlm-card);
            border-color: var(--nlm-border);
            color: #c7d2fe;
            font-weight: 600;
          }

          .btn-add-folder-tab {
            color: #818cf8;
            border: 1px dashed rgba(129, 140, 248, 0.4);
          }

          .btn-add-folder-tab:hover {
            background: rgba(99, 102, 241, 0.15);
            color: #ffffff;
          }

          .content-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .content-body::-webkit-scrollbar {
            width: 6px;
          }

          .content-body::-webkit-scrollbar-thumb {
            background: var(--nlm-border);
            border-radius: 3px;
          }

          .prompt-card {
            background: var(--nlm-card);
            border: 1px solid var(--nlm-border);
            border-radius: 10px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: border-color 0.15s, background 0.15s;
          }

          .prompt-card:hover {
            border-color: #3e455e;
            background: var(--nlm-card-hover);
          }

          .card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 8px;
          }

          .card-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--nlm-text);
          }

          .shortcut-chip {
            font-family: var(--nlm-mono);
            font-size: 11px;
            font-weight: 700;
            background: rgba(99, 102, 241, 0.15);
            color: #a5b4fc;
            padding: 2px 7px;
            border-radius: 5px;
            border: 1px solid rgba(165, 180, 252, 0.25);
            white-space: nowrap;
          }

          .card-content-preview {
            font-size: 12px;
            color: var(--nlm-text-muted);
            line-height: 1.45;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            background: rgba(0, 0, 0, 0.2);
            padding: 8px 10px;
            border-radius: 6px;
            border-left: 2px solid var(--nlm-accent);
          }

          .card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 4px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }

          .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }

          .tag-pill {
            font-size: 10px;
            background: rgba(255, 255, 255, 0.06);
            color: #cbd5e1;
            padding: 2px 6px;
            border-radius: 4px;
          }

          .card-actions {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .btn-sm {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 11px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.12s;
          }

          .btn-insert {
            background: var(--nlm-accent);
            color: #ffffff;
          }

          .btn-insert:hover {
            background: var(--nlm-accent-hover);
          }

          .btn-secondary {
            background: rgba(255, 255, 255, 0.08);
            color: var(--nlm-text);
          }

          .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
          }

          .empty-box {
            text-align: center;
            padding: 40px 20px;
            color: var(--nlm-text-muted);
          }

          .footer {
            padding: 12px 20px;
            background: var(--nlm-surface);
            border-top: 1px solid var(--nlm-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          /* Editor View */
          .editor-wrap {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 4px 0;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .form-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--nlm-text-muted);
          }

          .form-input, .form-textarea, .form-select {
            width: 100%;
            background: var(--nlm-surface);
            border: 1px solid var(--nlm-border);
            border-radius: 6px;
            padding: 8px 10px;
            color: var(--nlm-text);
            font-family: inherit;
            font-size: 13px;
            outline: none;
          }

          .form-textarea {
            min-height: 120px;
            resize: vertical;
            line-height: 1.45;
          }

          .form-input:focus, .form-textarea:focus, .form-select:focus {
            border-color: var(--nlm-accent);
          }

          /* Prefix & Shortcut Group */
          .shortcut-input-group {
            display: flex;
            align-items: stretch;
          }

          .shortcut-prefix-select {
            background: #252839;
            color: #a5b4fc;
            font-family: var(--nlm-mono);
            font-weight: 700;
            font-size: 15px;
            width: 46px;
            min-width: 46px;
            max-width: 46px;
            text-align: center;
            padding: 0 4px;
            border: 1px solid var(--nlm-border);
            border-right: none;
            border-radius: 6px 0 0 6px;
            outline: none;
            cursor: pointer;
            flex: 0 0 46px;
          }

          .shortcut-input-group .form-input {
            border-radius: 0 6px 6px 0;
            font-family: var(--nlm-mono);
          }

          .editor-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 10px;
          }

          .error-msg {
            color: #f87171;
            font-size: 12px;
            padding: 6px 10px;
            background: rgba(248, 113, 113, 0.1);
            border-radius: 6px;
            display: none;
          }
        </style>

        <div class="backdrop" id="drawer-backdrop"></div>
        <div class="panel" id="drawer-panel">
          <div class="header">
            <div class="header-brand">
              <div class="brand-icon">${ICONS.SPARKLES}</div>
              <span class="header-title">Prompts</span>
            </div>
            <div class="header-actions">
              <button class="icon-btn" id="btn-new-prompt" title="New Prompt">
                ${ICONS.PLUS}
              </button>
              <a class="icon-btn" id="btn-open-tab" href="${chrome.runtime.getURL('manager/manager.html')}" target="_blank" rel="noopener noreferrer" title="Open Full Manager in New Tab">
                ${ICONS.EXTERNAL}
              </a>
              <button class="icon-btn" id="btn-close-drawer" title="Close">
                ${ICONS.CLOSE}
              </button>
            </div>
          </div>

          <div class="search-bar-wrap">
            <input type="text" class="search-input" id="drawer-search" placeholder="Search prompts..." />
          </div>

          <div class="tabs-nav" id="drawer-tabs"></div>

          <div class="content-body" id="drawer-list"></div>

          <div class="footer">
            <span style="font-size: 11px; color: var(--nlm-text-muted);">Type <span class="shortcut-chip">;shortcut</span> in chat to autocomplete</span>
            <button class="btn-sm btn-secondary" id="btn-quick-new">
              ${ICONS.PLUS} <span>New</span>
            </button>
          </div>
        </div>
      `;

      this.bindEvents();
    }

    bindEvents() {
      this.shadow.getElementById('drawer-backdrop')?.addEventListener('click', () => this.close());
      this.shadow.getElementById('btn-close-drawer')?.addEventListener('click', () => this.close());

      this.shadow.getElementById('btn-open-tab')?.addEventListener('click', (e) => {
        try {
          chrome.runtime.sendMessage({ type: 'NLM_OPEN_MANAGER_TAB' });
        } catch {
          // Native link href handles navigation as fallback
        }
      });

      this.shadow.getElementById('btn-new-prompt')?.addEventListener('click', () => this.showEditor());
      this.shadow.getElementById('btn-quick-new')?.addEventListener('click', () => this.showEditor());

      const searchInput = this.shadow.getElementById('drawer-search');
      searchInput?.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderContent();
      });

      this.renderTabs();
      this.renderContent();
    }

    renderTabs() {
      const tabsWrap = this.shadow.getElementById('drawer-tabs');
      if (!tabsWrap) return;

      tabsWrap.innerHTML = `
        <button class="tab-pill ${this.activeTab === 'all' ? 'active' : ''}" data-tab="all">All (${this.prompts.length})</button>
        <button class="tab-pill ${this.activeTab === 'favorites' ? 'active' : ''}" data-tab="favorites">
          ${ICONS.STAR} <span>Favorites</span>
        </button>
      `;

      this.folders.forEach((f) => {
        const count = this.prompts.filter((p) => p.folderId === f.id).length;
        const btn = document.createElement('button');
        btn.className = `tab-pill ${this.activeTab === f.id ? 'active' : ''}`;
        btn.dataset.tab = f.id;
        btn.innerHTML = `${ICONS.FOLDER} <span>${UTILS.escapeHtml(f.name)} (${count})</span>`;
        tabsWrap.appendChild(btn);
      });

      // Inline "+ Folder" button
      const addFolderBtn = document.createElement('button');
      addFolderBtn.className = 'tab-pill btn-add-folder-tab';
      addFolderBtn.innerHTML = `${ICONS.PLUS} <span>Folder</span>`;
      addFolderBtn.title = 'Add New Folder';
      addFolderBtn.addEventListener('click', () => this.showFolderPrompt());
      tabsWrap.appendChild(addFolderBtn);

      tabsWrap.querySelectorAll('.tab-pill:not(.btn-add-folder-tab)').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.activeTab = btn.dataset.tab;
          this.shadow.querySelectorAll('.tab-pill').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.editingPrompt = null;
          this.renderContent();
        });
      });
    }

    renderContent() {
      const container = this.shadow.getElementById('drawer-list');
      if (!container) return;

      if (this.editingPrompt !== null) {
        this.renderEditor(container);
        return;
      }

      let filtered = this.prompts.filter((p) => {
        if (this.activeTab === 'favorites' && !p.favorite) return false;
        if (this.activeTab !== 'all' && this.activeTab !== 'favorites' && p.folderId !== this.activeTab) {
          return false;
        }

        if (this.searchQuery) {
          const matchTitle = (p.title || '').toLowerCase().includes(this.searchQuery);
          const matchShortcut = (p.shortcut || '').toLowerCase().includes(this.searchQuery);
          const matchContent = (p.content || '').toLowerCase().includes(this.searchQuery);
          const matchTag = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(this.searchQuery));
          return matchTitle || matchShortcut || matchContent || matchTag;
        }

        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-box">
            <p>No prompts found.</p>
            <button class="btn-sm btn-insert" style="margin-top: 12px;" id="empty-create-btn">
              ${ICONS.PLUS} <span>Create Prompt</span>
            </button>
          </div>
        `;
        container.querySelector('#empty-create-btn')?.addEventListener('click', () => this.showEditor());
        return;
      }

      container.innerHTML = '';
      filtered.forEach((prompt) => {
        const card = document.createElement('div');
        card.className = 'prompt-card';

        const safeTitle = UTILS.escapeHtml(prompt.title);
        const safeShortcut = UTILS.escapeHtml(prompt.shortcut);
        const safePreview = UTILS.escapeHtml(prompt.content);

        const tagsHtml = (prompt.tags || [])
          .map((t) => `<span class="tag-pill">#${UTILS.escapeHtml(t)}</span>`)
          .join('');

        card.innerHTML = `
          <div class="card-header">
            <span class="card-title">${safeTitle}</span>
            <span class="shortcut-chip">${safeShortcut}</span>
          </div>
          <div class="card-content-preview">${safePreview}</div>
          <div class="card-footer">
            <div class="tag-list">${tagsHtml}</div>
            <div class="card-actions">
              <button class="btn-sm btn-secondary btn-copy" title="Copy to clipboard">
                ${ICONS.COPY} <span>Copy</span>
              </button>
              <button class="btn-sm btn-insert btn-insert-action" title="Insert into active chat">
                ${ICONS.CORNER_DOWN_LEFT} <span>Insert</span>
              </button>
            </div>
          </div>
        `;

        card.querySelector('.btn-copy').addEventListener('click', async (e) => {
          e.stopPropagation();
          await navigator.clipboard.writeText(prompt.content);
          ADAPTER.showToast(`Copied "${prompt.title}" to clipboard!`, 'info');
        });

        card.querySelector('.btn-insert-action').addEventListener('click', (e) => {
          e.stopPropagation();
          const composer = ADAPTER.findComposer();
          ADAPTER.insertPrompt(composer, prompt.content, null);
          this.close();
        });

        container.appendChild(card);
      });
    }

    showEditor(promptToEdit = {}) {
      this.editingPrompt = promptToEdit;
      this.renderContent();
    }

    renderEditor(container) {
      const isNew = !this.editingPrompt.id;
      const title = this.editingPrompt.title || '';
      const parsed = UTILS.parseShortcut(this.editingPrompt.shortcut || ';');
      const content = this.editingPrompt.content || '';
      const folderId = this.editingPrompt.folderId || '';
      const tags = (this.editingPrompt.tags || []).join(', ');

      const folderOptions = this.folders
        .map((f) => `<option value="${f.id}" ${f.id === folderId ? 'selected' : ''}>${UTILS.escapeHtml(f.name)}</option>`)
        .join('');

      const prefixList = [';', '\\', '~', '^', '!', '/', '@', '#', '$', '%', '&', '?', '>', '|', '.'];
      const prefixOptions = prefixList
        .map((sym) => `<option value="${UTILS.escapeHtml(sym)}" ${sym === parsed.prefix ? 'selected' : ''}>${UTILS.escapeHtml(sym)}</option>`)
        .join('');

      container.innerHTML = `
        <div class="editor-wrap">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="font-size:14px; font-weight:700;">${isNew ? 'New Prompt' : 'Edit Prompt'}</h3>
            <button class="icon-btn" id="btn-cancel-editor">${ICONS.CLOSE}</button>
          </div>
          <div class="error-msg" id="editor-error"></div>
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" class="form-input" id="edit-title" value="${UTILS.escapeHtml(title)}" placeholder="e.g. Executive Summary" />
          </div>
          <div class="form-group">
            <label class="form-label">Trigger & Shortcut *</label>
            <div class="shortcut-input-group">
              <select id="edit-prefix-select" class="shortcut-prefix-select" title="Trigger Symbol">
                ${prefixOptions}
              </select>
              <input type="text" class="form-input" id="edit-shortcut-slug" value="${UTILS.escapeHtml(parsed.slug)}" placeholder="book" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Folder</label>
            <select class="form-select" id="edit-folder">
              <option value="">(No folder)</option>
              ${folderOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tags (comma-separated)</label>
            <input type="text" class="form-input" id="edit-tags" value="${UTILS.escapeHtml(tags)}" placeholder="summary, analysis" />
          </div>
          <div class="form-group">
            <label class="form-label">Prompt Content *</label>
            <textarea class="form-textarea" id="edit-content" placeholder="Write full prompt template here...">${UTILS.escapeHtml(content)}</textarea>
          </div>
          <div class="editor-actions">
            <button class="btn-sm btn-secondary" id="btn-cancel-editor-bottom">Cancel</button>
            <button class="btn-sm btn-insert" id="btn-save-prompt">Save Prompt</button>
          </div>
        </div>
      `;

      const cancel = () => {
        this.editingPrompt = null;
        this.renderContent();
      };

      container.querySelector('#btn-cancel-editor')?.addEventListener('click', cancel);
      container.querySelector('#btn-cancel-editor-bottom')?.addEventListener('click', cancel);

      container.querySelector('#btn-save-prompt')?.addEventListener('click', async () => {
        const errorEl = container.querySelector('#editor-error');
        errorEl.style.display = 'none';

        const newTitle = container.querySelector('#edit-title').value;
        const prefix = container.querySelector('#edit-prefix-select').value;
        const slug = container.querySelector('#edit-shortcut-slug').value.replace(/^[;\/\\~^!@#$%&?>|.-]+/, '').trim();
        const newShortcut = prefix + slug;
        const newContent = container.querySelector('#edit-content').value;
        const newFolder = container.querySelector('#edit-folder').value || null;
        const rawTags = container.querySelector('#edit-tags').value;
        const newTags = rawTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        try {
          await STORAGE.savePrompt({
            id: this.editingPrompt.id || null,
            title: newTitle,
            shortcut: newShortcut,
            content: newContent,
            folderId: newFolder,
            tags: newTags,
            favorite: this.editingPrompt.favorite || false
          });

          this.editingPrompt = null;
          await this.loadData();
          ADAPTER.showToast('Prompt saved successfully!', 'info');
        } catch (err) {
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';
        }
      });
    }

    async showFolderPrompt() {
      const folderName = window.prompt('Enter new folder name:');
      if (!folderName || !folderName.trim()) return;

      try {
        const folder = await STORAGE.saveFolder({ name: folderName.trim() });
        await this.loadData();
        this.activeTab = folder.id;
        this.renderTabs();
        this.renderContent();
        ADAPTER.showToast(`Folder "${folder.name}" created!`, 'info');
      } catch (err) {
        alert(err.message);
      }
    }
  }

  inPageDrawer = new InPageDrawer();

  // Injected toolbar button permanently purged and suppressed from all pages
  function purgePromptsButton() {
    document
      .querySelectorAll('#nlm-prompts-toolbar-btn, .nlm-prompts-toolbar-btn, #nlm-prompts-floating-btn')
      .forEach((b) => b.remove());
  }
  purgePromptsButton();

  try {
    const purgeObserver = new MutationObserver(purgePromptsButton);
    if (document.body) {
      purgeObserver.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        purgePromptsButton();
        if (document.body) {
          purgeObserver.observe(document.body, { childList: true, subtree: true });
        }
      });
    }
  } catch {}

  // Listen for quick new prompt event
  window.addEventListener('nlm_open_new_prompt', () => {
    inPageDrawer?.open();
    inPageDrawer?.showEditor();
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    if (message.type === 'NLM_TOGGLE_MANAGER_DRAWER') {
      inPageDrawer.toggle();
      sendResponse({ success: true });
      return false;
    }

    if (message.type === 'NLM_INSERT_PROMPT_DIRECT') {
      const composer = ADAPTER.findComposer();
      const result = ADAPTER.insertPrompt(composer, message.content || '');
      sendResponse(result);
      return false;
    }

    return false;
  });

  STORAGE.addStorageChangeListener(async () => {
    await inPageDrawer.loadData();
  });

  console.log('Universal AI Prompt Manager: Content script active.');
})();
