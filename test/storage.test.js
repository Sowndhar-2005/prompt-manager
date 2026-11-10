/**
 * Test: Storage Architecture & CRUD Operations
 */
const assert = require('assert');
const storage = require('../storage/storage.js');
const constants = require('../shared/constants.js');

async function runStorageTests() {
  console.log('\n--- Running Storage Architecture Tests ---');

  // Test 1: Initialize defaults
  const initRes = await storage.initDefaults(true);
  assert(initRes.initialized, 'Defaults should be initialized');
  const initialPrompts = await storage.getPrompts();
  assert(initialPrompts.length >= 5, `Expected at least 5 default prompts, got ${initialPrompts.length}`);
  console.log(`✅ Default prompts seeded (${initialPrompts.length} items)`);

  // Test 2: Create a prompt
  const newPrompt = await storage.savePrompt({
    title: 'Test Summary Generator',
    shortcut: ';testsum',
    content: 'Please summarize the text thoroughly.',
    folderId: 'f_analysis',
    tags: ['test', 'summary'],
    favorite: false
  });

  assert(newPrompt.id, 'Prompt must have an ID');
  assert.strictEqual(newPrompt.shortcut, ';testsum', 'Shortcut must match');
  console.log('✅ Created prompt successfully:', newPrompt.id);

  // Test 3: Retrieve prompt by shortcut
  const retrieved = await storage.getPromptByShortcut(';testsum');
  assert(retrieved, 'Should retrieve by shortcut');
  assert.strictEqual(retrieved.id, newPrompt.id, 'Retrieved prompt ID must match');
  console.log('✅ Retrieved prompt by shortcut (;testsum)');

  // Test 4: Shortcut validation rules
  // Rule A: Auto-prefixing shortcut when semicolon omitted
  const autoPrefixed = await storage.savePrompt({
    title: 'Auto Prefix Shortcut',
    shortcut: 'autoprefix',
    content: 'content'
  });
  assert.strictEqual(autoPrefixed.shortcut, ';autoprefix', 'Should auto-prefix semicolon if omitted');
  console.log('✅ Auto-prefixed missing semicolon (;autoprefix)');

  // Rule B: Invalid characters (e.g. spaces or symbols)
  await assert.rejects(
    async () => {
      await storage.savePrompt({
        title: 'Invalid Symbol Shortcut',
        shortcut: ';invalid symbol!',
        content: 'content'
      });
    },
    /can only contain letters, numbers, hyphens/,
    'Should reject invalid symbols in shortcut'
  );
  console.log('✅ Rejected shortcut with invalid characters');

  // Rule C: Duplicate shortcut (case-insensitive)
  await assert.rejects(
    async () => {
      await storage.savePrompt({
        title: 'Duplicate Shortcut',
        shortcut: ';TESTSUM',
        content: 'content'
      });
    },
    /already used by another prompt/,
    'Should reject duplicate shortcut'
  );
  console.log('✅ Rejected duplicate shortcut case-insensitively');

  // Test 5: Edit prompt
  const updated = await storage.savePrompt({
    id: newPrompt.id,
    title: 'Updated Summary Generator',
    shortcut: ';testsum2',
    content: 'Updated content.',
    folderId: 'f_writing',
    tags: ['test', 'updated'],
    favorite: true
  });
  assert.strictEqual(updated.title, 'Updated Summary Generator');
  assert.strictEqual(updated.shortcut, ';testsum2');
  assert.strictEqual(updated.favorite, true);
  console.log('✅ Edited prompt successfully');

  // Test 6: Toggle favorite
  const favToggled = await storage.toggleFavorite(newPrompt.id);
  assert.strictEqual(favToggled.favorite, false, 'Favorite should toggle to false');
  const favToggled2 = await storage.toggleFavorite(newPrompt.id);
  assert.strictEqual(favToggled2.favorite, true, 'Favorite should toggle back to true');
  console.log('✅ Toggled favorite state twice');

  // Test 7: Search and filter
  const searchResults = await storage.searchPrompts('updated');
  assert(searchResults.length > 0, 'Should find prompt by keyword');
  assert(searchResults.some((p) => p.id === newPrompt.id));

  const tagResults = await storage.searchPrompts('', { tag: 'updated' });
  assert(tagResults.some((p) => p.id === newPrompt.id), 'Should filter by tag');
  console.log('✅ Search and tag filters working');

  // Test 8: Folder CRUD & unlinking
  const newFolder = await storage.saveFolder({ name: 'Special Test Folder' });
  assert(newFolder.id, 'Folder must have ID');
  const folders = await storage.getFolders();
  assert(folders.some((f) => f.id === newFolder.id), 'New folder must exist in list');

  // Assign prompt to folder
  await storage.savePrompt({
    id: newPrompt.id,
    title: newPrompt.title,
    shortcut: ';testsum2',
    content: 'content',
    folderId: newFolder.id
  });

  // Delete folder
  await storage.deleteFolder(newFolder.id);
  const foldersAfter = await storage.getFolders();
  assert(!foldersAfter.some((f) => f.id === newFolder.id), 'Folder should be deleted');

  // Verify prompt folderId was cleared to null
  const promptAfterFolderDelete = await storage.getPromptById(newPrompt.id);
  assert.strictEqual(promptAfterFolderDelete.folderId, null, 'Prompt folderId should be unlinked to null');
  console.log('✅ Folder CRUD and prompt unlinking verified');

  // Test 9: Export Data
  const exported = await storage.exportData();
  assert.strictEqual(exported.schemaVersion, constants.SCHEMA_VERSION);
  assert(Array.isArray(exported.prompts));
  assert(Array.isArray(exported.folders));
  console.log(`✅ Export data verified (Schema version: ${exported.schemaVersion})`);

  // Test 10: Import Data (Merge mode)
  const mockImport = {
    schemaVersion: 1,
    prompts: [
      {
        id: 'p_imported_1',
        title: 'Imported Outline Tool',
        shortcut: ';outline',
        content: 'Create detailed hierarchical outline.',
        tags: ['outline', 'structure'],
        favorite: true
      }
    ],
    folders: [{ id: 'f_imported', name: 'Imported Category' }]
  };

  const mergeRes = await storage.importData(mockImport, 'merge');
  assert.strictEqual(mergeRes.success, true);
  assert(mergeRes.added >= 1, 'Should add imported prompt');
  const importedPrompt = await storage.getPromptByShortcut(';outline');
  assert(importedPrompt, 'Imported prompt should be retrievable');
  console.log('✅ Import merge mode verified');

  // Test 11: Import Data (Replace mode)
  const replaceRes = await storage.importData(mockImport, 'replace');
  assert.strictEqual(replaceRes.success, true);
  const replacedPrompts = await storage.getPrompts();
  assert.strictEqual(replacedPrompts.length, 1, 'Replace mode should replace all prompts');
  console.log('✅ Import replace mode verified');

  // Test 12: Delete prompt
  const delRes = await storage.deletePrompt(importedPrompt.id);
  assert.strictEqual(delRes.success, true);
  const afterDel = await storage.getPromptById(importedPrompt.id);
  assert.strictEqual(afterDel, null, 'Deleted prompt should be null');
  console.log('✅ Prompt deletion verified');

  console.log('🎉 All storage tests passed successfully!\n');
}

if (require.main === module) {
  runStorageTests().catch((err) => {
    console.error('❌ Storage test failed:', err);
    process.exit(1);
  });
}

module.exports = runStorageTests;
