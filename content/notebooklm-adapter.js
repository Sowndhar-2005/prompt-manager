/**
 * NotebookLM DOM Adapter.
 * Encapsulates resilient detection, text extraction, and text insertion
 * across different generations of NotebookLM's chat composer.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const constants = require('../shared/constants.js');
    const utils = require('../shared/utils.js');
    module.exports = factory(constants, utils);
  } else {
    root.NLM_ADAPTER = factory(root.NLM_CONSTANTS, root.NLM_UTILS);
  }
})(typeof self !== 'undefined' ? self : this, function (CONSTANTS, UTILS) {
  'use strict';

  class NotebookLMAdapter {
    constructor() {
      this.cachedComposer = null;
    }

    /**
     * Finds the currently active or most relevant chat composer on the page.
     * Evaluates dynamically at interaction time to avoid stale references.
     */
    findComposer() {
      // 1. If active element is a composer, use it immediately
      const active = document.activeElement;
      if (active && this.isComposerElement(active)) {
        this.cachedComposer = active;
        return active;
      }

      // 2. Query against prioritized selector list
      const selectors = CONSTANTS.SELECTORS.COMPOSERS;
      for (const sel of selectors) {
        try {
          const elements = document.querySelectorAll(sel);
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (this.isVisible(el) && !el.disabled && !el.readOnly) {
              this.cachedComposer = el;
              return el;
            }
          }
        } catch {
          // Ignore invalid selectors
        }
      }

      // 3. Fallback: inspect any visible textarea in the document
      const allTextareas = document.querySelectorAll('textarea');
      for (const ta of allTextareas) {
        if (this.isVisible(ta) && !ta.disabled && !ta.readOnly) {
          this.cachedComposer = ta;
          return ta;
        }
      }

      return null;
    }

    getComposerRoot(el) {
      if (!el || !(el instanceof HTMLElement)) return null;
      if (this.isComposerElement(el)) return el;
      const editableParent = el.closest('[contenteditable="true"]');
      if (editableParent) return editableParent;
      return null;
    }

    isComposerElement(el) {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'textarea') return true;
      if (tag === 'input' && (el.type === 'text' || el.type === 'search' || !el.type)) return true;
      if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') return true;
      if (el.getAttribute('role') === 'textbox' || el.getAttribute('role') === 'combobox') return true;
      return false;
    }

    isVisible(el) {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetHeight > 0;
    }

    /**
     * Gets current text content and cursor selection range from composer.
     */
    getComposerState(composer) {
      if (!composer) return { text: '', start: 0, end: 0, type: 'none' };

      if (composer.tagName.toLowerCase() === 'textarea' || composer.tagName.toLowerCase() === 'input') {
        return {
          text: composer.value || '',
          start: composer.selectionStart || 0,
          end: composer.selectionEnd || 0,
          type: 'textarea'
        };
      }

      if (composer.isContentEditable || composer.getAttribute('contenteditable') === 'true') {
        const sel = window.getSelection();
        let text = composer.innerText || composer.textContent || '';
        let start = 0;
        let end = 0;

        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const preRange = range.cloneRange();
          preRange.selectNodeContents(composer);
          preRange.setEnd(range.startContainer, range.startOffset);
          start = preRange.toString().length;
          end = start + range.toString().length;
        }

        return { text, start, end, type: 'contenteditable' };
      }

      return { text: '', start: 0, end: 0, type: 'unknown' };
    }

    /**
     * Replaces shortcut token with full prompt in the active composer.
     * Preserves surrounding text, sets cursor position, and triggers necessary events.
     */
    insertPrompt(composer, promptContent, shortcutTokenInfo = null) {
      if (!composer) {
        composer = this.findComposer();
      }

      if (!composer) {
        this.fallbackCopyToClipboard(promptContent);
        return { success: false, method: 'clipboard-fallback', error: 'No active composer found.' };
      }

      composer.focus();
      const state = this.getComposerState(composer);

      let start = state.start;
      let end = state.end;

      if (shortcutTokenInfo && typeof shortcutTokenInfo.start === 'number') {
        start = shortcutTokenInfo.start;
        end = shortcutTokenInfo.end;
      }

      const { newText, newCursorPos } = UTILS.replaceShortcutWithPrompt(
        state.text,
        start,
        end,
        promptContent
      );

      if (state.type === 'textarea' || state.type === 'input') {
        return this.insertIntoTextarea(composer, newText, newCursorPos);
      } else if (state.type === 'contenteditable') {
        return this.insertIntoContentEditable(composer, promptContent, shortcutTokenInfo);
      }

      // Default fallback
      this.fallbackCopyToClipboard(promptContent);
      return { success: false, method: 'clipboard-fallback' };
    }

    insertIntoTextarea(element, newText, newCursorPos) {
      try {
        element.focus();

        // Support both HTMLTextAreaElement and HTMLInputElement prototypes
        const proto =
          element instanceof HTMLTextAreaElement
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;

        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

        if (nativeSetter) {
          nativeSetter.call(element, newText);
        } else {
          element.value = newText;
        }

        // Restore cursor position
        if (typeof element.setSelectionRange === 'function') {
          element.setSelectionRange(newCursorPos, newCursorPos);
        } else {
          element.selectionStart = newCursorPos;
          element.selectionEnd = newCursorPos;
        }

        // Dispatch synthetic events
        const beforeInput = new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText'
        });
        element.dispatchEvent(beforeInput);

        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText'
        });
        element.dispatchEvent(inputEvent);

        const changeEvent = new Event('change', { bubbles: true });
        element.dispatchEvent(changeEvent);

        // Auto-adjust height if textarea has autosize behavior
        if (element.tagName.toLowerCase() === 'textarea') {
          element.style.height = 'auto';
          element.style.height = `${Math.min(element.scrollHeight, 300)}px`;
        }

        return { success: true, method: 'textarea-setter', newCursorPos };
      } catch (err) {
        console.error('Textarea insertion error:', err);
        return { success: false, error: err.message };
      }
    }

    insertIntoContentEditable(element, promptContent, shortcutTokenInfo) {
      try {
        element.focus();

        if (document.execCommand) {
          // If we have shortcut token to replace, select it first
          if (shortcutTokenInfo && shortcutTokenInfo.shortcut) {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              const range = sel.getRangeAt(0);
              // Attempt backward character deletion of the typed shortcut
              for (let i = 0; i < shortcutTokenInfo.shortcut.length; i++) {
                document.execCommand('delete', false, null);
              }
            }
          }

          const inserted = document.execCommand('insertText', false, promptContent);
          if (inserted) {
            element.dispatchEvent(new Event('input', { bubbles: true }));
            return { success: true, method: 'execCommand' };
          }
        }

        // Fallback: Range replacement
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(promptContent);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          sel.removeAllRanges();
          sel.addRange(range);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          return { success: true, method: 'range-insert' };
        }

        this.fallbackCopyToClipboard(promptContent);
        return { success: false, method: 'clipboard-fallback' };
      } catch (err) {
        console.error('Contenteditable insertion error:', err);
        this.fallbackCopyToClipboard(promptContent);
        return { success: false, error: err.message };
      }
    }

    async fallbackCopyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.showToast('Prompt copied to clipboard! (Paste into chat with Ctrl+V)', 'info');
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }

    showToast(message, type = 'info') {
      const existing = document.getElementById('nlm-toast-container');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.id = 'nlm-toast-container';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483647;
        background: #1e1e2f;
        color: #f1f5f9;
        border: 1px solid #4f46e5;
        border-radius: 8px;
        padding: 12px 18px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: nlmFadeIn 0.2s ease-out;
      `;

      container.textContent = message;
      document.body.appendChild(container);

      setTimeout(() => {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.3s ease';
        setTimeout(() => container.remove(), 300);
      }, 3500);
    }
  }

  return new NotebookLMAdapter();
});
