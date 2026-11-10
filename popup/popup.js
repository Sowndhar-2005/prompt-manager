/**
 * Logic for Universal AI Prompts Popup.
 * Supports NotebookLM, Gemini, ChatGPT, Claude, DeepSeek, and Docs.
 */
document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const STORAGE = window.NLM_STORAGE;
  const UTILS = window.NLM_UTILS;
  const CONSTANTS = window.NLM_CONSTANTS;

  const ICONS = {
    COPY: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    INSERT: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>`
  };

  let prompts = [];
  let filterFav = false;
  let activeFolderId = null;
  let searchQ = '';

  const listEl = document.getElementById('popup-list');
  const searchInput = document.getElementById('popup-search');
  const tabAll = document.getElementById('tab-all');
  const tabFav = document.getElementById('tab-fav');
  const btnPopupAddFolder = document.getElementById('btn-popup-add-folder');
  const btnOpenFull = document.getElementById('btn-open-full');
  const btnPopupNew = document.getElementById('btn-popup-new');

  async function loadData() {
    try {
      prompts = await STORAGE.getPrompts();
      render();
    } catch (err) {
      console.error('Popup load error:', err);
    }
  }

  function isSupportedAiUrl(url) {
    if (!url) return false;
    const targets = [
      'https://notebooklm.google.com',
      'https://notebook.google.com',
      'https://notebooklm.google',
      'https://notebook.google',
      'https://gemini.google.com',
      'https://chatgpt.com',
      'https://chat.openai.com',
      'https://claude.ai',
      'https://chat.deepseek.com',
      'https://copilot.microsoft.com'
    ];
    return targets.some((domain) => url.startsWith(domain));
  }

  function render() {
    const filtered = prompts.filter((p) => {
      if (filterFav && !p.favorite) return false;
      if (activeFolderId && p.folderId !== activeFolderId) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        const t = (p.title || '').toLowerCase();
        const sc = (p.shortcut || '').toLowerCase();
        const c = (p.content || '').toLowerCase();
        return t.includes(q) || sc.includes(q) || c.includes(q);
      }
      return true;
    });

    listEl.innerHTML = '';

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="empty-view">No prompts found</div>`;
      return;
    }

    filtered.forEach((prompt) => {
      const item = document.createElement('div');
      item.className = 'prompt-item';

      const safeTitle = UTILS.escapeHtml(prompt.title);
      const safeShortcut = UTILS.escapeHtml(prompt.shortcut);
      const safeContent = UTILS.escapeHtml(prompt.content);

      item.innerHTML = `
        <div class="item-head">
          <span class="item-title">${safeTitle}</span>
          <span class="item-shortcut">${safeShortcut}</span>
        </div>
        <div class="item-snippet">${safeContent}</div>
        <div class="item-actions">
          <button class="btn-mini btn-mini-copy" title="Copy">
            ${ICONS.COPY} <span>Copy</span>
          </button>
          <button class="btn-mini btn-mini-insert" title="Insert into active chat">
            ${ICONS.INSERT} <span>Insert</span>
          </button>
        </div>
      `;

      item.querySelector('.btn-mini-copy').addEventListener('click', async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(prompt.content);
        const btn = e.target.closest('button');
        const originalHtml = btn.innerHTML;
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.innerHTML = originalHtml), 1200);
      });

      item.querySelector('.btn-mini-insert').addEventListener('click', async (e) => {
        e.stopPropagation();
        await insertPrompt(prompt);
      });

      listEl.appendChild(item);
    });
  }

  async function insertPrompt(prompt) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        if (isSupportedAiUrl(tab.url)) {
          chrome.tabs.sendMessage(
            tab.id,
            {
              type: 'NLM_INSERT_PROMPT_DIRECT',
              content: prompt.content
            },
            async (res) => {
              if (chrome.runtime.lastError || !res || !res.success) {
                await fallbackUniversalInsert(tab.id, prompt.content);
              }
              window.close();
            }
          );
        } else {
          // Any other website
          await fallbackUniversalInsert(tab.id, prompt.content);
          window.close();
        }
      } else {
        await navigator.clipboard.writeText(prompt.content);
        window.close();
      }
    } catch {
      await navigator.clipboard.writeText(prompt.content);
      window.close();
    }
  }

  async function fallbackUniversalInsert(tabId, text) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
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
            return true;
          }
          if (el && el.isContentEditable) {
            document.execCommand('insertText', false, textToInsert);
            return true;
          }
          navigator.clipboard.writeText(textToInsert);
          return false;
        },
        args: [text]
      });
    } catch {
      await navigator.clipboard.writeText(text);
    }
  }

  searchInput.addEventListener(
    'input',
    UTILS.debounce((e) => {
      searchQ = e.target.value.trim();
      render();
    }, 100)
  );

  tabAll.addEventListener('click', () => {
    filterFav = false;
    activeFolderId = null;
    tabAll.classList.add('active');
    tabFav.classList.remove('active');
    render();
  });

  tabFav.addEventListener('click', () => {
    filterFav = true;
    activeFolderId = null;
    tabFav.classList.add('active');
    tabAll.classList.remove('active');
    render();
  });

  btnPopupAddFolder?.addEventListener('click', async () => {
    const name = window.prompt('Enter new folder name:');
    if (!name || !name.trim()) return;

    try {
      await STORAGE.saveFolder({ name: name.trim() });
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  });

  btnOpenFull.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager/manager.html') });
    window.close();
  });

  btnPopupNew.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('manager/manager.html') });
    window.close();
  });

  await loadData();
});
