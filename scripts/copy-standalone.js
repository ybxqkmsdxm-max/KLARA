/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceStatic = path.join(root, '.next', 'static');
const targetStatic = path.join(root, '.next', 'standalone', '.next', 'static');
const sourcePublic = path.join(root, 'public');
const targetPublic = path.join(root, '.next', 'standalone', 'public');

function copyRecursive(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}

try {
  copyRecursive(sourceStatic, targetStatic);
  copyRecursive(sourcePublic, targetPublic);
  console.log('✅ Copy complete: .next/static and public have been copied to .next/standalone');
} catch (error) {
  console.error('❌ Error copying standalone files:', error);
  process.exit(1);
}
