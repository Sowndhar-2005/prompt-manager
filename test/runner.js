/**
 * Test Runner for NotebookLM Prompt Manager
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const runManifestTests = require('./manifest.test.js');
const runStorageTests = require('./storage.test.js');
const runAdapterTests = require('./adapter.test.js');

async function runAll() {
  console.log('========================================================');
  console.log('🚀 Running NotebookLM Prompt Manager Test Suite');
  console.log('========================================================');

  // Syntax check all JS files
  console.log('\n--- Checking JavaScript Syntax (node --check) ---');
  const jsFiles = [
    'background.js',
    'shared/constants.js',
    'shared/utils.js',
    'storage/storage.js',
    'content/notebooklm-adapter.js',
    'content/autocomplete.js',
    'content/toolbar-button.js',
    'content/content.js',
    'manager/manager.js',
    'popup/popup.js'
  ];

  for (const file of jsFiles) {
    const fullPath = path.resolve(__dirname, '..', file);
    assertFileExists(fullPath, file);
    try {
      execSync(`node --check "${fullPath}"`);
      console.log(`✅ Syntax OK: ${file}`);
    } catch (err) {
      console.error(`❌ Syntax Error in ${file}:`, err.message);
      process.exit(1);
    }
  }

  // Run test modules
  runManifestTests();
  await runStorageTests();
  runAdapterTests();

  console.log('========================================================');
  console.log('🏆 ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('========================================================\n');
}

function assertFileExists(fullPath, label) {
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing file: ${label}`);
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
