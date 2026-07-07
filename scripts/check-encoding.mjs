// Scan repository text files for encoding issues.
// Run: corepack pnpm check:encoding

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const EXCLUDE = new Set(['node_modules', '.wrangler', 'dist', '.turbo', '.git', 'coverage', '.pnpm', 'cache', '.bin']);
const EXTENSIONS = new Set(['.md', '.ts', '.tsx', '.mjs', '.json', '.toml', '.sql', '.css', '.html']);

let errors = 0;
let warnings = 0;

function scanDir(dir, depth = 0) {
  if (depth > 5 || EXCLUDE.has(dir.split(/[\\/]/).pop())) return;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) { scanDir(full, depth + 1); continue; }
    if (full.includes('scripts' + String.fromCharCode(92) + 'check-encoding')) continue;
    if (!EXTENSIONS.has(extname(e.name).toLowerCase())) continue;

    const bytes = readFileSync(full);
    if (bytes.length === 0) continue;

    // Check BOM
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      console.log('[ERROR] BOM found: ' + full.replace(root, ''));
      errors++;
    }

    const text = bytes.toString('utf8');

    // U+FFFD replacement character
    if (text.includes('\uFFFD')) {
      console.log('[ERROR] U+FFFD replacement char: ' + full.replace(root, ''));
      errors++;
    }

    // Mojibake markers
    if (text.includes('锟斤拷')) {
      console.log('[ERROR] mojibake (锟斤拷): ' + full.replace(root, ''));
      errors++;
    }

    // Suspicious question marks (may be false positive)
    if (/\?{4,}/.test(text) && !/https?:\/\//.test(text)) {
      console.log('[WARN] repeated ????: ' + full.replace(root, ''));
      warnings++;
    }
  }
}

console.log('Ludoria Encoding Check\n');
scanDir(root);

if (errors === 0 && warnings === 0) {
  console.log('Encoding check passed.');
} else {
  console.log('\n' + errors + ' error(s), ' + warnings + ' warning(s)');
  if (errors > 0) process.exit(1);
}
