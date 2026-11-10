/**
 * Toolbar Button Controller.
 * Prompts button injection has been removed per user instruction.
 * Ensures any lingering or legacy injected buttons are cleanly removed.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NLM_TOOLBAR = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class ToolbarButtonManager {
    constructor() {
      // Injected button removed per user request: "remove Prompts btn to all"
      this.destroy();
    }

    destroy() {
      document.getElementById('nlm-prompts-toolbar-btn')?.remove();
      document.getElementById('nlm-prompts-floating-btn')?.remove();
    }
  }

  return ToolbarButtonManager;
});
