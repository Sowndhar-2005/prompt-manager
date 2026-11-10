/**
 * Packages the Chrome Extension into a clean .zip file for installation or distribution.
 * Excludes test files, source scripts, documentation, and git metadata.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function packageExtension() {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  const zipPath = path.join(distDir, 'notebooklm-prompt-manager.zip');

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  console.log('Packaging extension files into:', zipPath);

  // Files & folders to include
  const includePaths = [
    'manifest.json',
    'background.js',
    'assets',
    'popup',
    'manager',
    'content',
    'storage',
    'shared'
  ];

  // In PowerShell on Windows:
  const filesList = includePaths.map(p => `"${path.join(rootDir, p)}"`).join(', ');
  const psCommand = `Compress-Archive -Path ${filesList} -DestinationPath "${zipPath}" -Force`;

  try {
    execSync(`powershell -NoProfile -Command "${psCommand}"`, { stdio: 'inherit' });
    const stat = fs.statSync(zipPath);
    console.log(`\n🎉 Successfully packaged extension!`);
    console.log(`📦 Archive: ${zipPath} (${(stat.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error('Packaging failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  packageExtension();
}

module.exports = packageExtension;
