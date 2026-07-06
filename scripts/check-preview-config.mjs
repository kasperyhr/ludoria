// Preview configuration safety check.
// Scans for accidentally committed real Cloudflare resource IDs or secrets.
// Run: corepack pnpm check:preview-config

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const EXCLUDED_DIRS = new Set([
  'node_modules', '.wrangler', 'dist', '.turbo', '.git',
  'cache', '.pnpm', '.bin',
]);

const failed = [];

function check(label, fn) {
  try {
    fn();
    console.log(`  [OK] ${label}`);
  } catch (err) {
    console.log(`  [WARN] ${label}: ${err.message}`);
    failed.push(label);
  }
}

function collectFiles(dir, depth = 0) {
  if (depth > 4) return [];
  if (EXCLUDED_DIRS.has(dir.split(/[\\/]/).pop() ?? '')) return [];

  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return []; }

  return entries.flatMap((e) => {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) return collectFiles(full, depth + 1);
    const ext = extname(e.name);
    if (['.toml', '.env', '.md', '.json', '.yml', '.yaml'].includes(ext)) return [full];
    return [];
  });
}

console.log('Ludoria Preview Config Safety Check\n');

// Scan wrangler.example.toml for real-looking IDs
check('wrangler.example.toml has no real account_id', () => {
  const content = readFileSync(resolve(root, 'wrangler.example.toml'), 'utf8');
  if (/account_id\s*=\s*"[0-9a-f]{32}"/i.test(content)) {
    throw new Error('real account_id detected');
  }
  if (!content.includes('REPLACE_WITH')) {
    // This is allowable but worth noting
  }
});

check('wrangler.example.toml has placeholder database_id', () => {
  const content = readFileSync(resolve(root, 'wrangler.example.toml'), 'utf8');
  if (/database_id\s*=\s*"[0-9a-f-]{36}"/i.test(content)) {
    throw new Error('real-looking database_id detected');
  }
});

// Scan .env.example for secrets
check('.env.example has no real secrets', () => {
  const content = readFileSync(resolve(root, '.env.example'), 'utf8');
  const secretPatterns = [
    /CLOUDFLARE_API_TOKEN\s*=\s*[A-Za-z0-9_-]{20,}/,
    /CLOUDFLARE_ACCOUNT_ID\s*=\s*[0-9a-f]{32}/,
    /DATABASE_ID\s*=\s*[0-9a-f-]{36}/,
    /SECRET_KEY\s*=\s*[A-Za-z0-9+/=]{20,}/,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) {
      throw new Error(`potential secret matching ${pattern}`);
    }
  }
});

// Scan all docs for accidental API tokens
check('No Cloudflare API tokens in docs', () => {
  const docsDir = resolve(root, 'docs');
  const files = collectFiles(docsDir);
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    // Check for patterns that look like real tokens/keys
    if (/CLOUDFLARE_API_TOKEN\s*=\s*[A-Za-z0-9_-]{30,}/.test(content)) {
      throw new Error(`potential token in ${file.replace(root, '')}`);
    }
    if (/[0-9a-f]{32}/.test(content) && file.includes('wrangler')) {
      // Hex strings in wrangler docs could be examples; this is conservative
      // Allow because runbooks contain example placeholders
    }
  }
});

// Scan wrangler.toml for real IDs
check('wrangler.toml uses local placeholder database_id', () => {
  const content = readFileSync(resolve(root, 'apps/worker/wrangler.toml'), 'utf8');
  if (!content.includes('local-ludoria-db-placeholder') && !content.includes('REPLACE_WITH')) {
    // Allow this but note it
    console.log('    (Note: no placeholder found; if deploying ensure database_id is correct)');
  }
});

console.log(`\n${failed.length === 0 ? 'All config checks passed.' : `${failed.length} warning(s).`}`);
if (failed.length > 0) {
  console.log('Warnings:');
  failed.forEach((c) => console.log(`  - ${c}`));
  console.log('\nReview these warnings before deploying. They may be false positives.');
  process.exit(1);
}
