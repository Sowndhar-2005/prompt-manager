/**
 * Storage architecture for NotebookLM Prompt Manager.
 * Operates over chrome.storage.local. Provides complete CRUD, validation, import/export.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const constants = require('../shared/constants.js');
    const utils = require('../shared/utils.js');
    module.exports = factory(constants, utils);
  } else {
    root.NLM_STORAGE = factory(root.NLM_CONSTANTS, root.NLM_UTILS);
  }
})(typeof self !== 'undefined' ? self : this, function (CONSTANTS, UTILS) {
  'use strict';

  // Fallback storage mock for non-extension or test environments
  let memoryStorage = null;

  function getStorageBackend() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return chrome.storage.local;
    }
    if (!memoryStorage) {
      const store = {};
      memoryStorage = {
        async get(keys) {
          if (!keys) return { ...store };
          if (typeof keys === 'string') return { [keys]: store[keys] };
          if (Array.isArray(keys)) {
            const res = {};
            keys.forEach((k) => (res[k] = store[k]));
            return res;
          }
          const res = {};
          for (const k of Object.keys(keys)) {
            res[k] = store[k] !== undefined ? store[k] : keys[k];
          }
          return res;
        },
        async set(items) {
          Object.assign(store, items);
        },
        async remove(keys) {
          const list = Array.isArray(keys) ? keys : [keys];
          list.forEach((k) => delete store[k]);
        },
        async clear() {
          for (const k of Object.keys(store)) delete store[k];
        }
      };
    }
    return memoryStorage;
  }

  async function rawGet(keys) {
    const backend = getStorageBackend();
    return await backend.get(keys);
  }

  async function rawSet(items) {
    const backend = getStorageBackend();
    return await backend.set(items);
  }

  /**
   * Initializes storage with default folders and prompts if none exist.
   */
  async function initDefaults(force = false) {
    const keys = CONSTANTS.STORAGE_KEYS;
    const data = await rawGet([keys.PROMPTS, keys.FOLDERS, keys.SCHEMA_VERSION]);

    const hasPrompts = Array.isArray(data[keys.PROMPTS]) && data[keys.PROMPTS].length > 0;
    const hasFolders = Array.isArray(data[keys.FOLDERS]) && data[keys.FOLDERS].length > 0;

    if (!hasPrompts || force) {
      await rawSet({
        [keys.PROMPTS]: CONSTANTS.DEFAULT_PROMPTS,
        [keys.FOLDERS]: CONSTANTS.DEFAULT_FOLDERS,
        [keys.SCHEMA_VERSION]: CONSTANTS.SCHEMA_VERSION
      });
      return { initialized: true };
    }

    if (!hasFolders) {
      await rawSet({ [keys.FOLDERS]: CONSTANTS.DEFAULT_FOLDERS });
    }

    return { initialized: false };
  }

  async function getAllData() {
    await initDefaults(false);
    const keys = CONSTANTS.STORAGE_KEYS;
    const data = await rawGet([keys.PROMPTS, keys.FOLDERS, keys.SCHEMA_VERSION]);
    return {
      schemaVersion: data[keys.SCHEMA_VERSION] || CONSTANTS.SCHEMA_VERSION,
      prompts: Array.isArray(data[keys.PROMPTS]) ? data[keys.PROMPTS] : [],
      folders: Array.isArray(data[keys.FOLDERS]) ? data[keys.FOLDERS] : []
    };
  }

  async function getPrompts() {
    const data = await getAllData();
    return data.prompts;
  }

  async function getFolders() {
    const data = await getAllData();
    return data.folders;
  }

  async function getPromptById(id) {
    const prompts = await getPrompts();
    return prompts.find((p) => p.id === id) || null;
  }

  async function getPromptByShortcut(shortcut) {
    if (!shortcut) return null;
    const norm = shortcut.trim().toLowerCase();
    const prompts = await getPrompts();
    return prompts.find((p) => p.shortcut && p.shortcut.trim().toLowerCase() === norm) || null;
  }

  async function searchPrompts(query = '', filter = {}) {
    const prompts = await getPrompts();
    const q = (query || '').trim().toLowerCase();
    const { folderId, tag, favoriteOnly } = filter;

    return prompts.filter((p) => {
      if (favoriteOnly && !p.favorite) return false;
      if (folderId && p.folderId !== folderId) return false;
      if (tag && (!Array.isArray(p.tags) || !p.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()))) {
        return false;
      }

      if (!q) return true;

      const titleMatch = (p.title || '').toLowerCase().includes(q);
      const shortcutMatch = (p.shortcut || '').toLowerCase().includes(q);
      const contentMatch = (p.content || '').toLowerCase().includes(q);
      const tagMatch = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q));

      return titleMatch || shortcutMatch || contentMatch || tagMatch;
    });
  }

  /**
   * Saves a prompt (creates if no id or updates existing).
   */
  async function savePrompt(promptInput) {
    if (!promptInput.title || !promptInput.title.trim()) {
      throw new Error('Prompt title is required.');
    }
    if (!promptInput.content || !promptInput.content.trim()) {
      throw new Error('Prompt content is required.');
    }

    const prompts = await getPrompts();
    const isNew = !promptInput.id;
    const promptId = isNew ? UTILS.generateId('p') : promptInput.id;

    // Validate shortcut
    const shortcutValidation = UTILS.validateShortcut(promptInput.shortcut, prompts, promptId);
    if (!shortcutValidation.valid) {
      throw new Error(shortcutValidation.error);
    }

    const now = new Date().toISOString();
    const sanitizedPrompt = {
      id: promptId,
      title: promptInput.title.trim(),
      shortcut: shortcutValidation.normalized,
      content: promptInput.content.trim(),
      folderId: promptInput.folderId || null,
      tags: Array.isArray(promptInput.tags)
        ? [...new Set(promptInput.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))]
        : [],
      favorite: Boolean(promptInput.favorite),
      createdAt: promptInput.createdAt || now,
      updatedAt: now
    };

    let updatedList;
    if (isNew) {
      updatedList = [sanitizedPrompt, ...prompts];
    } else {
      const idx = prompts.findIndex((p) => p.id === promptId);
      if (idx === -1) {
        updatedList = [sanitizedPrompt, ...prompts];
      } else {
        updatedList = [...prompts];
        updatedList[idx] = sanitizedPrompt;
      }
    }

    await rawSet({ [CONSTANTS.STORAGE_KEYS.PROMPTS]: updatedList });
    return sanitizedPrompt;
  }

  async function deletePrompt(id) {
    const prompts = await getPrompts();
    const filtered = prompts.filter((p) => p.id !== id);
    await rawSet({ [CONSTANTS.STORAGE_KEYS.PROMPTS]: filtered });
    return { success: true, count: filtered.length };
  }

  async function toggleFavorite(id) {
    const prompts = await getPrompts();
    const prompt = prompts.find((p) => p.id === id);
    if (!prompt) throw new Error(`Prompt not found: ${id}`);

    prompt.favorite = !prompt.favorite;
    prompt.updatedAt = new Date().toISOString();

    await rawSet({ [CONSTANTS.STORAGE_KEYS.PROMPTS]: prompts });
    return prompt;
  }

  async function saveFolder(folderInput) {
    if (!folderInput.name || !folderInput.name.trim()) {
      throw new Error('Folder name is required.');
    }

    const folders = await getFolders();
    const isNew = !folderInput.id;
    const folderId = isNew ? UTILS.generateId('f') : folderInput.id;
    const name = folderInput.name.trim();

    // Check duplicate folder name
    const dup = folders.find((f) => f.id !== folderId && f.name.toLowerCase() === name.toLowerCase());
    if (dup) {
      throw new Error(`Folder named "${name}" already exists.`);
    }

    const folderObj = { id: folderId, name };
    let updatedFolders;
    if (isNew) {
      updatedFolders = [...folders, folderObj];
    } else {
      updatedFolders = folders.map((f) => (f.id === folderId ? folderObj : f));
    }

    await rawSet({ [CONSTANTS.STORAGE_KEYS.FOLDERS]: updatedFolders });
    return folderObj;
  }

  async function deleteFolder(id) {
    const folders = await getFolders();
    const updatedFolders = folders.filter((f) => f.id !== id);

    // Also unassign prompts linked to this folder
    const prompts = await getPrompts();
    let promptsModified = false;
    const updatedPrompts = prompts.map((p) => {
      if (p.folderId === id) {
        promptsModified = true;
        return { ...p, folderId: null, updatedAt: new Date().toISOString() };
      }
      return p;
    });

    const writes = { [CONSTANTS.STORAGE_KEYS.FOLDERS]: updatedFolders };
    if (promptsModified) {
      writes[CONSTANTS.STORAGE_KEYS.PROMPTS] = updatedPrompts;
    }

    await rawSet(writes);
    return { success: true };
  }

  async function exportData() {
    const all = await getAllData();
    return {
      schemaVersion: CONSTANTS.SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      extension: 'NotebookLM Prompt Manager',
      prompts: all.prompts,
      folders: all.folders
    };
  }

  /**
   * Imports JSON data.
   * mode: 'merge' (default) or 'replace'
   */
  async function importData(jsonData, mode = 'merge') {
    let parsed = jsonData;
    if (typeof jsonData === 'string') {
      try {
        parsed = JSON.parse(jsonData);
      } catch (err) {
        throw new Error('Invalid JSON format: ' + err.message);
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Import data must be a JSON object.');
    }

    if (!Array.isArray(parsed.prompts)) {
      throw new Error('Import data missing "prompts" array.');
    }

    const importedPrompts = parsed.prompts;
    const importedFolders = Array.isArray(parsed.folders) ? parsed.folders : [];

    // Validate imported prompts structure
    for (let i = 0; i < importedPrompts.length; i++) {
      const p = importedPrompts[i];
      if (!p.title || typeof p.title !== 'string') {
        throw new Error(`Prompt at index ${i} is missing a valid title.`);
      }
      if (!p.content || typeof p.content !== 'string') {
        throw new Error(`Prompt "${p.title}" is missing content.`);
      }
      const shortcutCheck = UTILS.validateShortcut(p.shortcut);
      if (!shortcutCheck.valid) {
        throw new Error(`Prompt "${p.title}" has invalid shortcut: ${shortcutCheck.error}`);
      }
    }

    const currentData = await getAllData();
    let finalFolders = [];
    let finalPrompts = [];
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    if (mode === 'replace') {
      finalFolders = importedFolders.map((f) => ({
        id: f.id || UTILS.generateId('f'),
        name: (f.name || 'Untitled Folder').trim()
      }));

      const seenShortcuts = new Set();
      finalPrompts = [];

      for (const p of importedPrompts) {
        const normShortcut = p.shortcut.trim().toLowerCase();
        if (seenShortcuts.has(normShortcut)) {
          skippedCount++;
          continue;
        }
        seenShortcuts.add(normShortcut);

        finalPrompts.push({
          id: p.id || UTILS.generateId('p'),
          title: p.title.trim(),
          shortcut: normShortcut,
          content: p.content.trim(),
          folderId: p.folderId || null,
          tags: Array.isArray(p.tags) ? p.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [],
          favorite: Boolean(p.favorite),
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString()
        });
        addedCount++;
      }
    } else {
      // Merge mode
      // Merge folders by name or id
      finalFolders = [...currentData.folders];
      for (const f of importedFolders) {
        const existing = finalFolders.find(
          (ef) => ef.id === f.id || ef.name.toLowerCase() === (f.name || '').trim().toLowerCase()
        );
        if (!existing) {
          finalFolders.push({
            id: f.id || UTILS.generateId('f'),
            name: (f.name || 'Folder').trim()
          });
        }
      }

      finalPrompts = [...currentData.prompts];

      for (const p of importedPrompts) {
        const normShortcut = p.shortcut.trim().toLowerCase();
        const existingIdx = finalPrompts.findIndex(
          (ep) => (p.id && ep.id === p.id) || ep.shortcut.toLowerCase() === normShortcut
        );

        if (existingIdx !== -1) {
          // Update existing prompt
          finalPrompts[existingIdx] = {
            ...finalPrompts[existingIdx],
            title: p.title.trim(),
            shortcut: normShortcut,
            content: p.content.trim(),
            folderId: p.folderId || finalPrompts[existingIdx].folderId,
            tags: Array.isArray(p.tags)
              ? [...new Set([...(finalPrompts[existingIdx].tags || []), ...p.tags.map((t) => t.trim().toLowerCase())])]
              : finalPrompts[existingIdx].tags,
            favorite: p.favorite !== undefined ? Boolean(p.favorite) : finalPrompts[existingIdx].favorite,
            updatedAt: new Date().toISOString()
          };
          updatedCount++;
        } else {
          // Add new
          finalPrompts.push({
            id: p.id || UTILS.generateId('p'),
            title: p.title.trim(),
            shortcut: normShortcut,
            content: p.content.trim(),
            folderId: p.folderId || null,
            tags: Array.isArray(p.tags) ? p.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [],
            favorite: Boolean(p.favorite),
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          addedCount++;
        }
      }
    }

    await rawSet({
      [CONSTANTS.STORAGE_KEYS.PROMPTS]: finalPrompts,
      [CONSTANTS.STORAGE_KEYS.FOLDERS]: finalFolders,
      [CONSTANTS.STORAGE_KEYS.SCHEMA_VERSION]: CONSTANTS.SCHEMA_VERSION
    });

    return {
      success: true,
      mode,
      added: addedCount,
      updated: updatedCount,
      skipped: skippedCount,
      totalPrompts: finalPrompts.length,
      totalFolders: finalFolders.length
    };
  }

  function addStorageChangeListener(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          callback(changes);
        }
      });
    }
  }

  return {
    initDefaults,
    getAllData,
    getPrompts,
    getFolders,
    getPromptById,
    getPromptByShortcut,
    searchPrompts,
    savePrompt,
    deletePrompt,
    toggleFavorite,
    saveFolder,
    deleteFolder,
    exportData,
    importData,
    addStorageChangeListener
  };
});
