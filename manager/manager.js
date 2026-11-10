/**
 * Controller for Universal AI Prompt Manager (Full Screen).
 * Handles CRUD, folders, tags, search, import/export, and insertion across all AI platforms.
 */
document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const STORAGE = window.NLM_STORAGE;
  const UTILS = window.NLM_UTILS;
  const CONSTANTS = window.NLM_CONSTANTS;

  // Clean Lucide SVG Icons
  const ICONS = {
    FOLDER: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`,
    STAR: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    STAR_OUTLINE: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    EDIT: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
    DELETE: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
    COPY: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    INSERT: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>`,
    FILE_TEXT: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`
  };

  // State
  let prompts = [];
  let folders = [];
  let activeFilter = { type: 'all', id: null, label: 'All Prompts' };
  let searchQuery = '';
  let editingPromptId = null;
  let editingFolderId = null;
  let pendingDelete = null;
  let importFileContent = null;
  let isEditorFavActive = false;

  // DOM Elements - Main
  const promptsContainer = document.getElementById('prompts-container');
  const viewTitle = document.getElementById('view-title');
  const activeFilterBadge = document.getElementById('active-filter-badge');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const countAll = document.getElementById('count-all');
  const countFav = document.getElementById('count-fav');
  const folderList = document.getElementById('folder-list');
  const tagsCloud = document.getElementById('tags-cloud');
  const navAll = document.getElementById('nav-all');
  const navFav = document.getElementById('nav-favorites');

  // DOM Elements - Prompt Editor
  const editorModalBackdrop = document.getElementById('editor-modal-backdrop');
  const editorModalTitle = document.getElementById('editor-modal-title');
  const editorValidationError = document.getElementById('editor-validation-error');
  const promptTitleInput = document.getElementById('prompt-title');
  const promptPrefixSelect = document.getElementById('prompt-prefix-select');
  const promptShortcutSlugInput = document.getElementById('prompt-shortcut-slug');
  const promptFolderSelect = document.getElementById('prompt-folder');
  const promptTagsInput = document.getElementById('prompt-tags');
  const promptContentTextarea = document.getElementById('prompt-content');
  const btnEditorFav = document.getElementById('btn-editor-fav');
  const btnSavePrompt = document.getElementById('btn-save-prompt');
  const btnCancelEditor = document.getElementById('btn-cancel-editor');
  const btnCloseEditor = document.getElementById('btn-close-editor');
  const btnNewPrompt = document.getElementById('btn-new-prompt');

  // DOM Elements - Folder Modal
  const folderModalBackdrop = document.getElementById('folder-modal-backdrop');
  const folderModalTitle = document.getElementById('folder-modal-title');
  const folderValidationError = document.getElementById('folder-validation-error');
  const folderNameInput = document.getElementById('folder-name');
  const btnSaveFolder = document.getElementById('btn-save-folder');
  const btnCancelFolder = document.getElementById('btn-cancel-folder');
  const btnCloseFolder = document.getElementById('btn-close-folder');
  const btnAddFolder = document.getElementById('btn-add-folder');

  // DOM Elements - Confirmation Modal
  const confirmModalBackdrop = document.getElementById('confirm-modal-backdrop');
  const confirmModalMessage = document.getElementById('confirm-modal-message');
  const btnExecuteConfirm = document.getElementById('btn-execute-confirm');
  const btnCancelConfirm = document.getElementById('btn-cancel-confirm');
  const btnCloseConfirm = document.getElementById('btn-close-confirm');

  // DOM Elements - Backup Modal
  const backupModalBackdrop = document.getElementById('backup-modal-backdrop');
  const btnOpenBackupModal = document.getElementById('btn-open-backup-modal');
  const btnCloseBackup = document.getElementById('btn-close-backup');
  const btnCancelBackup = document.getElementById('btn-cancel-backup');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnSelectFile = document.getElementById('btn-select-file');
  const importFileInput = document.getElementById('import-file-input');
  const selectedFileName = document.getElementById('selected-file-name');
  const btnExecuteImport = document.getElementById('btn-execute-import');
  const importErrorBanner = document.getElementById('import-error-banner');
  const importSuccessBanner = document.getElementById('import-success-banner');

  async function loadData() {
    try {
      const data = await STORAGE.getAllData();
      prompts = data.prompts || [];
      folders = data.folders || [];
      renderSidebar();
      renderPrompts();
    } catch (err) {
      showToast('Failed to load storage: ' + err.message);
    }
  }

  function renderSidebar() {
    countAll.textContent = prompts.length;
    countFav.textContent = prompts.filter((p) => p.favorite).length;

    // Render Folders
    folderList.innerHTML = '';
    folders.forEach((f) => {
      const count = prompts.filter((p) => p.folderId === f.id).length;
      const row = document.createElement('div');
      row.className = 'folder-item-row';

      const isActive = activeFilter.type === 'folder' && activeFilter.id === f.id;
      row.innerHTML = `
        <button class="nav-item ${isActive ? 'active' : ''}" data-folder-id="${f.id}">
          <span class="nav-icon">${ICONS.FOLDER}</span>
          <span class="nav-label">${UTILS.escapeHtml(f.name)}</span>
          <span class="nav-count">${count}</span>
        </button>
        <button class="folder-action-btn btn-edit-folder" title="Rename Folder" data-id="${f.id}">${ICONS.EDIT}</button>
        <button class="folder-action-btn btn-del-folder" title="Delete Folder" data-id="${f.id}">${ICONS.DELETE}</button>
      `;

      row.querySelector('.nav-item').addEventListener('click', () => {
        setFilter('folder', f.id, f.name);
      });

      row.querySelector('.btn-edit-folder').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditFolderModal(f);
      });

      row.querySelector('.btn-del-folder').addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteConfirm('folder', f.id, f.name);
      });

      folderList.appendChild(row);
    });

    // Render Tags Cloud
    const tagCounts = {};
    prompts.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          const norm = t.trim().toLowerCase();
          if (norm) tagCounts[norm] = (tagCounts[norm] || 0) + 1;
        });
      }
    });

    tagsCloud.innerHTML = '';
    const sortedTags = Object.keys(tagCounts).sort();
    sortedTags.forEach((t) => {
      const pill = document.createElement('span');
      const isActive = activeFilter.type === 'tag' && activeFilter.id === t;
      pill.className = `tag-filter-pill ${isActive ? 'active' : ''}`;
      pill.textContent = `#${t} (${tagCounts[t]})`;
      pill.addEventListener('click', () => {
        if (isActive) {
          setFilter('all', null, 'All Prompts');
        } else {
          setFilter('tag', t, `#${t}`);
        }
      });
      tagsCloud.appendChild(pill);
    });

    navAll.classList.toggle('active', activeFilter.type === 'all');
    navFav.classList.toggle('active', activeFilter.type === 'favorites');
  }

  function renderPrompts() {
    viewTitle.textContent = activeFilter.label;

    if (searchQuery) {
      activeFilterBadge.style.display = 'inline-block';
      activeFilterBadge.textContent = `Search: "${searchQuery}"`;
    } else if (activeFilter.type !== 'all') {
      activeFilterBadge.style.display = 'inline-block';
      activeFilterBadge.textContent = activeFilter.label;
    } else {
      activeFilterBadge.style.display = 'none';
    }

    const filtered = prompts.filter((p) => {
      if (activeFilter.type === 'favorites' && !p.favorite) return false;
      if (activeFilter.type === 'folder' && p.folderId !== activeFilter.id) return false;
      if (
        activeFilter.type === 'tag' &&
        (!Array.isArray(p.tags) || !p.tags.map((t) => t.toLowerCase()).includes(activeFilter.id.toLowerCase()))
      ) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const tMatch = (p.title || '').toLowerCase().includes(q);
        const sMatch = (p.shortcut || '').toLowerCase().includes(q);
        const cMatch = (p.content || '').toLowerCase().includes(q);
        const tagMatch = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q));
        return tMatch || sMatch || cMatch || tagMatch;
      }

      return true;
    });

    promptsContainer.innerHTML = '';

    if (filtered.length === 0) {
      promptsContainer.innerHTML = `
        <div class="empty-state-view">
          <div class="empty-state-icon">${ICONS.FILE_TEXT}</div>
          <div class="empty-state-title">No prompts found</div>
          <div class="empty-state-desc">
            ${searchQuery ? 'Try adjusting your search query or clear the active filter.' : 'Create your first prompt or import from a backup.'}
          </div>
          <button class="btn-primary" id="btn-empty-new">+ Create New Prompt</button>
        </div>
      `;
      document.getElementById('btn-empty-new')?.addEventListener('click', () => openNewPromptModal());
      return;
    }

    filtered.forEach((prompt) => {
      const card = createPromptCard(prompt);
      promptsContainer.appendChild(card);
    });
  }

  function createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';

    const safeTitle = UTILS.escapeHtml(prompt.title);
    const safeShortcut = UTILS.escapeHtml(prompt.shortcut);
    const safeContent = UTILS.escapeHtml(prompt.content);

    const folder = folders.find((f) => f.id === prompt.folderId);
    const folderHtml = folder ? `<span class="card-folder-badge">${ICONS.FOLDER} <span>${UTILS.escapeHtml(folder.name)}</span></span>` : '';

    const tagsHtml = (prompt.tags || [])
      .map((t) => `<span class="card-tag-pill">#${UTILS.escapeHtml(t)}</span>`)
      .join('');

    card.innerHTML = `
      <div class="card-top">
        <div class="card-title-group">
          <h3 class="card-title">${safeTitle}</h3>
          ${folderHtml}
        </div>
        <span class="card-shortcut">${safeShortcut}</span>
      </div>
      <div class="card-content-preview">${safeContent}</div>
      <div class="card-tags">${tagsHtml}</div>
      <div class="card-footer">
        <div class="card-actions-left">
          <button class="btn-card-icon btn-fav ${prompt.favorite ? 'active-fav' : ''}" title="${prompt.favorite ? 'Unmark Favorite' : 'Mark Favorite'}">
            ${prompt.favorite ? ICONS.STAR : ICONS.STAR_OUTLINE}
          </button>
          <button class="btn-card-icon btn-edit" title="Edit Prompt">
            ${ICONS.EDIT}
          </button>
          <button class="btn-card-icon btn-delete" title="Delete Prompt">
            ${ICONS.DELETE}
          </button>
        </div>
        <div class="card-actions-right">
          <button class="btn-card-action btn-copy" title="Copy to clipboard">
            ${ICONS.COPY} <span>Copy</span>
          </button>
          <button class="btn-card-action btn-insert" title="Insert into active chat">
            ${ICONS.INSERT} <span>Insert</span>
          </button>
        </div>
      </div>
    `;

    card.querySelector('.btn-fav').addEventListener('click', async () => {
      try {
        await STORAGE.toggleFavorite(prompt.id);
        await loadData();
      } catch (err) {
        showToast('Error toggling favorite: ' + err.message);
      }
    });

    card.querySelector('.btn-edit').addEventListener('click', () => {
      openEditPromptModal(prompt);
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
      openDeleteConfirm('prompt', prompt.id, prompt.title);
    });

    card.querySelector('.btn-copy').addEventListener('click', async () => {
      await navigator.clipboard.writeText(prompt.content);
      showToast(`Copied "${prompt.title}" to clipboard!`);
    });

    card.querySelector('.btn-insert').addEventListener('click', async () => {
      await handlePromptInsertion(prompt);
    });

    return card;
  }

  async function handlePromptInsertion(prompt) {
    try {
      const tabs = await chrome.tabs.query({
        url: CONSTANTS.MATCH_PATTERNS
      });

      if (tabs && tabs.length > 0) {
        const targetTab = tabs.find((t) => t.active) || tabs[0];
        chrome.tabs.sendMessage(
          targetTab.id,
          {
            type: 'NLM_INSERT_PROMPT_DIRECT',
            content: prompt.content
          },
          (response) => {
            if (chrome.runtime.lastError || !response || !response.success) {
              navigator.clipboard.writeText(prompt.content);
              showToast('Prompt copied to clipboard! (Paste with Ctrl+V)');
            } else {
              showToast(`Inserted "${prompt.title}" into chat!`);
              chrome.tabs.update(targetTab.id, { active: true });
            }
          }
        );
      } else {
        await navigator.clipboard.writeText(prompt.content);
        showToast(`Copied "${prompt.title}" to clipboard!`);
      }
    } catch {
      await navigator.clipboard.writeText(prompt.content);
      showToast(`Copied "${prompt.title}" to clipboard!`);
    }
  }

  function setFilter(type, id, label) {
    activeFilter = { type, id, label };
    renderSidebar();
    renderPrompts();
  }

  searchInput.addEventListener(
    'input',
    UTILS.debounce((e) => {
      searchQuery = e.target.value.trim();
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      renderPrompts();
    }, 150)
  );

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderPrompts();
  });

  navAll.addEventListener('click', () => setFilter('all', null, 'All Prompts'));
  navFav.addEventListener('click', () => setFilter('favorites', null, 'Favorites'));

  // --- Prompt Editor Modal Logic (with prefix dropdown selector) ---
  function openNewPromptModal() {
    editingPromptId = null;
    editorModalTitle.textContent = 'New Prompt';
    editorValidationError.style.display = 'none';

    promptTitleInput.value = '';
    promptPrefixSelect.value = ';';
    promptShortcutSlugInput.value = '';
    promptContentTextarea.value = '';
    promptTagsInput.value = '';
    isEditorFavActive = false;
    btnEditorFav.setAttribute('aria-pressed', 'false');

    populateFolderDropdown();
    editorModalBackdrop.classList.add('visible');
    promptTitleInput.focus();
  }

  function openEditPromptModal(prompt) {
    editingPromptId = prompt.id;
    editorModalTitle.textContent = 'Edit Prompt';
    editorValidationError.style.display = 'none';

    promptTitleInput.value = prompt.title || '';
    const parsed = UTILS.parseShortcut(prompt.shortcut || ';');
    promptPrefixSelect.value = parsed.prefix;
    promptShortcutSlugInput.value = parsed.slug;
    promptContentTextarea.value = prompt.content || '';
    promptTagsInput.value = (prompt.tags || []).join(', ');
    isEditorFavActive = Boolean(prompt.favorite);
    btnEditorFav.setAttribute('aria-pressed', isEditorFavActive ? 'true' : 'false');

    populateFolderDropdown(prompt.folderId);
    editorModalBackdrop.classList.add('visible');
    promptTitleInput.focus();
  }

  function closeEditorModal() {
    editorModalBackdrop.classList.remove('visible');
    editingPromptId = null;
  }

  function populateFolderDropdown(selectedFolderId = '') {
    promptFolderSelect.innerHTML = '<option value="">(None - Root)</option>';
    folders.forEach((f) => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      if (f.id === selectedFolderId) opt.selected = true;
      promptFolderSelect.appendChild(opt);
    });
  }

  btnEditorFav.addEventListener('click', () => {
    isEditorFavActive = !isEditorFavActive;
    btnEditorFav.setAttribute('aria-pressed', isEditorFavActive ? 'true' : 'false');
  });

  btnSavePrompt.addEventListener('click', async () => {
    editorValidationError.style.display = 'none';

    const title = promptTitleInput.value.trim();
    const prefix = promptPrefixSelect.value || ';';
    const slug = promptShortcutSlugInput.value.replace(/^[;\/\\~^!@#$%&?>|.-]+/, '').trim();
    const shortcut = prefix + slug;
    const content = promptContentTextarea.value.trim();
    const folderId = promptFolderSelect.value || null;
    const tags = promptTagsInput.value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await STORAGE.savePrompt({
        id: editingPromptId,
        title,
        shortcut,
        content,
        folderId,
        tags,
        favorite: isEditorFavActive
      });

      closeEditorModal();
      await loadData();
      showToast(editingPromptId ? 'Prompt updated!' : 'Prompt created!');
    } catch (err) {
      editorValidationError.textContent = err.message;
      editorValidationError.style.display = 'block';
    }
  });

  btnNewPrompt.addEventListener('click', openNewPromptModal);
  btnCancelEditor.addEventListener('click', closeEditorModal);
  btnCloseEditor.addEventListener('click', closeEditorModal);

  // --- Folder Modal Logic ---
  function openAddFolderModal() {
    editingFolderId = null;
    folderModalTitle.textContent = 'New Folder';
    folderValidationError.style.display = 'none';
    folderNameInput.value = '';
    folderModalBackdrop.classList.add('visible');
    folderNameInput.focus();
  }

  function openEditFolderModal(folder) {
    editingFolderId = folder.id;
    folderModalTitle.textContent = 'Rename Folder';
    folderValidationError.style.display = 'none';
    folderNameInput.value = folder.name;
    folderModalBackdrop.classList.add('visible');
    folderNameInput.focus();
  }

  function closeFolderModal() {
    folderModalBackdrop.classList.remove('visible');
    editingFolderId = null;
  }

  btnSaveFolder.addEventListener('click', async () => {
    folderValidationError.style.display = 'none';
    const name = folderNameInput.value.trim();

    try {
      await STORAGE.saveFolder({
        id: editingFolderId,
        name
      });
      closeFolderModal();
      await loadData();
      showToast(editingFolderId ? 'Folder renamed!' : 'Folder created!');
    } catch (err) {
      folderValidationError.textContent = err.message;
      folderValidationError.style.display = 'block';
    }
  });

  btnAddFolder.addEventListener('click', openAddFolderModal);
  btnCancelFolder.addEventListener('click', closeFolderModal);
  btnCloseFolder.addEventListener('click', closeFolderModal);

  // --- Confirmation Modal Logic ---
  function openDeleteConfirm(type, id, name) {
    pendingDelete = { type, id, name };
    confirmModalMessage.textContent =
      type === 'prompt'
        ? `Are you sure you want to delete prompt "${name}"? This action cannot be undone.`
        : `Delete folder "${name}"? Prompts in this folder will remain in root.`;
    confirmModalBackdrop.classList.add('visible');
  }

  function closeConfirmModal() {
    confirmModalBackdrop.classList.remove('visible');
    pendingDelete = null;
  }

  btnExecuteConfirm.addEventListener('click', async () => {
    if (!pendingDelete) return;

    try {
      if (pendingDelete.type === 'prompt') {
        await STORAGE.deletePrompt(pendingDelete.id);
        showToast('Prompt deleted.');
      } else if (pendingDelete.type === 'folder') {
        await STORAGE.deleteFolder(pendingDelete.id);
        if (activeFilter.type === 'folder' && activeFilter.id === pendingDelete.id) {
          activeFilter = { type: 'all', id: null, label: 'All Prompts' };
        }
        showToast('Folder deleted.');
      }
      closeConfirmModal();
      await loadData();
    } catch (err) {
      showToast('Error deleting: ' + err.message);
    }
  });

  btnCancelConfirm.addEventListener('click', closeConfirmModal);
  btnCloseConfirm.addEventListener('click', closeConfirmModal);

  // --- Backup & JSON Import/Export Logic ---
  btnOpenBackupModal.addEventListener('click', () => {
    importFileContent = null;
    selectedFileName.textContent = 'No file selected';
    btnExecuteImport.disabled = true;
    importErrorBanner.style.display = 'none';
    importSuccessBanner.style.display = 'none';
    backupModalBackdrop.classList.add('visible');
  });

  function closeBackupModal() {
    backupModalBackdrop.classList.remove('visible');
  }

  btnCloseBackup.addEventListener('click', closeBackupModal);
  btnCancelBackup.addEventListener('click', closeBackupModal);

  btnExportJson.addEventListener('click', async () => {
    try {
      const backupData = await STORAGE.exportData();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `universal-prompts-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Backup JSON downloaded successfully!');
    } catch (err) {
      showToast('Export failed: ' + err.message);
    }
  });

  btnSelectFile.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    selectedFileName.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      importFileContent = event.target.result;
      btnExecuteImport.disabled = false;
      importErrorBanner.style.display = 'none';
      importSuccessBanner.style.display = 'none';
    };
    reader.onerror = () => {
      importErrorBanner.textContent = 'Failed to read file.';
      importErrorBanner.style.display = 'block';
    };
    reader.readAsText(file);
  });

  btnExecuteImport.addEventListener('click', async () => {
    if (!importFileContent) return;

    importErrorBanner.style.display = 'none';
    importSuccessBanner.style.display = 'none';

    const selectedMode = document.querySelector('input[name="import-mode"]:checked')?.value || 'merge';

    try {
      const result = await STORAGE.importData(importFileContent, selectedMode);
      importSuccessBanner.textContent = `Import complete (${result.mode})! Added: ${result.added}, Updated: ${result.updated}, Skipped: ${result.skipped}. Total prompts: ${result.totalPrompts}.`;
      importSuccessBanner.style.display = 'block';
      await loadData();
      showToast('Import completed successfully!');
    } catch (err) {
      importErrorBanner.textContent = err.message;
      importErrorBanner.style.display = 'block';
    }
  });

  function showToast(msg) {
    const shelf = document.getElementById('toast-shelf');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    shelf.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  STORAGE.addStorageChangeListener(async () => {
    await loadData();
  });

  await loadData();
});
