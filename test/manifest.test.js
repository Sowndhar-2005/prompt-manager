/**
 * Test: Manifest V3 Static Validation
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runManifestTests() {
  console.log('\n--- Running Manifest Static Checks ---');
  const rootDir = path.resolve(__dirname, '..');
  const manifestPath = path.join(rootDir, 'manifest.json');

  assert(fs.existsSync(manifestPath), 'manifest.json must exist');
  const raw = fs.readFileSync(manifestPath, 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(raw);
    console.log('✅ manifest.json is valid JSON');
  } catch (err) {
    assert.fail('manifest.json has invalid JSON: ' + err.message);
  }

  // MV3 checks
  assert.strictEqual(manifest.manifest_version, 3, 'Must be Manifest V3');
  assert(manifest.name, 'Name is required');
  assert(manifest.version, 'Version is required');
  assert(manifest.description, 'Description is required');
  assert(manifest.background?.service_worker, 'background.service_worker is required');
  console.log('✅ Manifest V3 baseline schema valid');

  // Verify all icons exist
  assert(manifest.icons, 'icons object required');
  for (const [size, relPath] of Object.entries(manifest.icons)) {
    const fullPath = path.join(rootDir, relPath);
    assert(fs.existsSync(fullPath), `Icon file ${relPath} (${size}x${size}) must exist`);
    const stat = fs.statSync(fullPath);
    assert(stat.size > 0, `Icon file ${relPath} must not be empty`);
  }
  console.log('✅ All declared icons exist and are non-empty');

  // Verify action files
  if (manifest.action?.default_popup) {
    const popupPath = path.join(rootDir, manifest.action.default_popup);
    assert(fs.existsSync(popupPath), `default_popup file ${manifest.action.default_popup} must exist`);
  }
  console.log('✅ Popup HTML file exists');

  // Verify background script
  const bgPath = path.join(rootDir, manifest.background.service_worker);
  assert(fs.existsSync(bgPath), `Service worker ${manifest.background.service_worker} must exist`);
  console.log('✅ Service worker file exists');

  // Verify content scripts and stylesheets
  assert(Array.isArray(manifest.content_scripts), 'content_scripts must be an array');
  for (const cs of manifest.content_scripts) {
    assert(Array.isArray(cs.matches), 'content_script matches must be an array');
    if (cs.js) {
      for (const jsFile of cs.js) {
        const full = path.join(rootDir, jsFile);
        assert(fs.existsSync(full), `Content script file ${jsFile} must exist`);
      }
    }
    if (cs.css) {
      for (const cssFile of cs.css) {
        const full = path.join(rootDir, cssFile);
        assert(fs.existsSync(full), `Content style file ${cssFile} must exist`);
      }
    }
  }
  console.log('✅ All content scripts and stylesheets exist');

  // Verify web accessible resources
  if (manifest.web_accessible_resources) {
    for (const entry of manifest.web_accessible_resources) {
      for (const res of entry.resources) {
        if (!res.includes('*')) {
          const resPath = path.join(rootDir, res);
          assert(fs.existsSync(resPath), `Web accessible resource ${res} must exist`);
        }
      }
    }
  }
  console.log('✅ Web accessible resources verified');

  console.log('🎉 All manifest tests passed successfully!\n');
}

if (require.main === module) {
  try {
    runManifestTests();
  } catch (err) {
    console.error('❌ Manifest test failed:', err);
    process.exit(1);
  }
}

module.exports = runManifestTests;
