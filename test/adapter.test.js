/**
 * Test: NotebookLM Adapter & Autocomplete Extraction Utilities
 */
const assert = require('assert');
const utils = require('../shared/utils.js');

function runAdapterTests() {
  console.log('\n--- Running Adapter & Shortcut Parser Tests ---');

  // Test 1: Shortcut token extraction
  // Case A: Simple shortcut at start of line
  const t1 = utils.extractShortcutToken(';boo', 4);
  assert.strictEqual(t1.hasMatch, true);
  assert.strictEqual(t1.shortcut, ';boo');
  assert.strictEqual(t1.start, 0);
  assert.strictEqual(t1.end, 4);
  console.log('✅ Extracted shortcut token at start: ;boo');

  // Case B: Shortcut preceded by words and space
  const text2 = 'Please analyze this chapter ;book';
  const t2 = utils.extractShortcutToken(text2, text2.length);
  assert.strictEqual(t2.hasMatch, true);
  assert.strictEqual(t2.shortcut, ';book');
  assert.strictEqual(t2.start, 28);
  assert.strictEqual(t2.end, 33);
  console.log('✅ Extracted shortcut token after text: ;book');

  // Case C: Cursor in the middle of typing
  const text3 = 'Here is ;su and more text';
  const t3 = utils.extractShortcutToken(text3, 11);
  assert.strictEqual(t3.hasMatch, true);
  assert.strictEqual(t3.shortcut, ';su');
  console.log('✅ Extracted partial shortcut with cursor mid-string');

  // Case D: Semicolon in normal punctuation without shortcut (e.g. "code; int x")
  const text4 = 'code; int x';
  const t4 = utils.extractShortcutToken(text4, text4.length);
  assert.strictEqual(t4.hasMatch, false);
  console.log('✅ Correctly ignored semicolon in code/normal text');

  // Case E: Multi-symbol trigger extraction (\, ~, ^, !, @, #, $, etc.)
  const symbolsToTest = ['\\', '~', '^', '!', '@', '#', '$', '%', '&', '?', '>', '|', '.'];
  symbolsToTest.forEach((sym) => {
    const sample = `Hello ${sym}prompt here`;
    const token = utils.extractShortcutToken(sample, 6 + 1 + 'prompt'.length);
    assert.strictEqual(token.hasMatch, true, `Should detect shortcut with symbol ${sym}`);
    assert.strictEqual(token.shortcut, `${sym}prompt`);
  });
  console.log('✅ Multi-symbol trigger prefixes verified (\\, ~, ^, !, @, #, $, %, &, ?, >, |, .)');

  // Test 2: Replace shortcut token with prompt
  const original = 'Draft section: ;book then finalize.';
  const token = utils.extractShortcutToken(original, 20);
  const promptBody = 'Create a comprehensive textbook chapter...';
  const result = utils.replaceShortcutWithPrompt(original, token.start, token.end, promptBody);

  assert.strictEqual(
    result.newText,
    'Draft section: Create a comprehensive textbook chapter... then finalize.'
  );
  assert.strictEqual(
    result.newCursorPos,
    'Draft section: Create a comprehensive textbook chapter...'.length
  );
  console.log('✅ Replaced shortcut token while strictly preserving surrounding text & calculating new cursor position');

  // Test 3: HTML escaping
  const escaped = utils.escapeHtml('<script>alert("xss")</script> & "quotes"');
  assert(!escaped.includes('<script>'), 'Must escape HTML tags');
  assert(escaped.includes('&lt;script&gt;'));
  assert(escaped.includes('&amp;'));
  assert(escaped.includes('&quot;'));
  console.log('✅ HTML escaping verified for safety against XSS');

  console.log('🎉 All adapter & utility tests passed successfully!\n');
}

if (require.main === module) {
  try {
    runAdapterTests();
  } catch (err) {
    console.error('❌ Adapter test failed:', err);
    process.exit(1);
  }
}

module.exports = runAdapterTests;
