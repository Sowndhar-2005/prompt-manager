/**
 * Shared utility functions for NotebookLM Prompt Manager.
 * Compatible with Node.js tests, content scripts, and extension pages.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NLM_UTILS = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function generateId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  const SUPPORTED_PREFIXES = [';', '\\', '~', '^', '!', '/', '@', '#', '$', '%', '&', '?', '>', '|', '.'];

  function parseShortcut(shortcut) {
    if (!shortcut || typeof shortcut !== 'string') {
      return { prefix: ';', slug: '' };
    }
    const trimmed = shortcut.trim();
    const firstChar = trimmed.charAt(0);
    if (SUPPORTED_PREFIXES.includes(firstChar)) {
      return { prefix: firstChar, slug: trimmed.slice(1) };
    }
    return { prefix: ';', slug: trimmed };
  }

  function normalizeShortcut(shortcut) {
    if (!shortcut) return '';
    const { prefix, slug } = parseShortcut(shortcut);
    return prefix + slug.toLowerCase();
  }

  function validateShortcut(shortcut, existingPrompts = [], currentPromptId = null) {
    if (!shortcut || typeof shortcut !== 'string') {
      return { valid: false, error: 'Shortcut is required.' };
    }

    const { prefix, slug } = parseShortcut(shortcut);
    if (!slug) {
      return { valid: false, error: 'Shortcut must contain characters after the trigger symbol.' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return {
        valid: false,
        error: 'Shortcut can only contain letters, numbers, hyphens, and underscores after the prefix.'
      };
    }

    const normalized = prefix + slug.toLowerCase();
    const isDuplicate = existingPrompts.some(
      (p) => p.id !== currentPromptId && p.shortcut && p.shortcut.trim().toLowerCase() === normalized
    );

    if (isDuplicate) {
      return { valid: false, error: `Shortcut "${normalized}" is already used by another prompt.` };
    }

    return { valid: true, error: null, normalized };
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Detects if cursor is currently preceded by a shortcut prefix (;something).
   * Returns: { hasMatch: boolean, shortcut: string, start: number, end: number }
   */
  function extractShortcutToken(text, cursorPos) {
    if (typeof text !== 'string' || cursorPos <= 0) {
      return { hasMatch: false, shortcut: '', start: -1, end: -1 };
    }

    // Inspect text up to current cursor position
    const textBeforeCursor = text.slice(0, cursorPos);

    // Look for a trigger symbol token (; \ ~ ^ ! / @ # $ % & ? > | .) anchored to whitespace or start of line
    const match = textBeforeCursor.match(/(?:^|\s)([;\/\\~^!@#$%&?>|.-][a-zA-Z0-9_-]*)$/);
    if (!match) {
      return { hasMatch: false, shortcut: '', start: -1, end: -1 };
    }

    const shortcutToken = match[1]; // includes the ';'
    const tokenStart = textBeforeCursor.length - shortcutToken.length;
    const tokenEnd = cursorPos;

    return {
      hasMatch: true,
      shortcut: shortcutToken,
      start: tokenStart,
      end: tokenEnd
    };
  }

  /**
   * Replaces shortcut token with full prompt in a given string.
   * Returns: { newText: string, newCursorPos: number }
   */
  function replaceShortcutWithPrompt(originalText, start, end, promptContent) {
    const before = originalText.slice(0, start);
    const after = originalText.slice(end);
    const newText = before + promptContent + after;
    const newCursorPos = before.length + promptContent.length;
    return { newText, newCursorPos };
  }

  return {
    SUPPORTED_PREFIXES,
    parseShortcut,
    generateId,
    normalizeShortcut,
    validateShortcut,
    escapeHtml,
    formatDate,
    debounce,
    throttle,
    extractShortcutToken,
    replaceShortcutWithPrompt
  };
});
