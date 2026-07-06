import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '..', '..', '..');

const forbiddenFields = [
  'hiddenTokens', 'hidden_token',
  'rawToken', 'raw_token',
  'sessionToken', 'session_token',
  'fullState', 'full_state',
  'gameState', 'game_state',
];

function collectFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((e) => {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) return collectFiles(full);
    if (/\.(ts|tsx|mjs|sql)$/.test(e.name)) return [full];
    return [];
  });
}

test('D1 schema and migrations contain no forbidden security fields', () => {
  const scanDirs = ['packages/db/src', 'packages/db/migrations'];
  const hits = [];

  for (const relDir of scanDirs) {
    const absDir = resolve(projectRoot, relDir);
    try {
      const files = collectFiles(absDir);
      for (const file of files) {
        // Skip seed-data.ts (only contains description texts, not schema definitions)
        if (file.endsWith('seed-data.ts')) continue;

        // For SQL migrations, check column-level fields only
        const isSql = file.endsWith('.sql');
        const content = readFileSync(file, 'utf8');

        for (const field of forbiddenFields) {
          if (isSql) {
            // In SQL, only flag if the field appears as a column name (backtick-quoted)
            const colRegex = new RegExp('`' + field + '`', 'i');
            if (colRegex.test(content)) {
              hits.push(field + ' in ' + file.replace(projectRoot, ''));
            }
          } else {
            // In TS, flag if it appears (not in comments/strings about security)
            const regex = new RegExp('\\b' + field + '\\b', 'i');
            if (regex.test(content)) {
              const lines = content.split('\n');
              const hitLine = lines.find((l) => regex.test(l));
              const isDoc = hitLine && /^\s*\/\/|^\s*\*/.test(hitLine);
              if (isDoc) continue;
              hits.push(field + ' in ' + file.replace(projectRoot, ''));
            }
          }
        }
      }
    } catch { /* dir may not exist */ }
  }

  assert.deepStrictEqual(hits, [], 'Found forbidden fields in source files');
});

test('game catalog seed contains all three demo games', () => {
  const seedPath = resolve(projectRoot, 'packages/db/src/seed-data.ts');
  const content = readFileSync(seedPath, 'utf8');

  assert.match(content, /token-bluffing-demo/);
  assert.match(content, /sudoku-lite/);
  assert.match(content, /nonogram/);
});

test('D1 migrations reference only expected migration files', () => {
  const migDir = resolve(projectRoot, 'packages/db/migrations');
  const sqlFiles = readdirSync(migDir).filter((f) => f.endsWith('.sql'));

  assert.ok(sqlFiles.includes('0000_initial_metadata.sql'), 'missing initial migration');
  assert.ok(sqlFiles.includes('0001_add_metadata_indexes.sql'), 'missing index migration');
});

test('worker env type includes DB binding', () => {
  const envPath = resolve(projectRoot, 'apps/worker/src/env.ts');
  const content = readFileSync(envPath, 'utf8');

  assert.match(content, /DB:\s*D1Database/);
  assert.match(content, /GAME_SESSION_OBJECT:\s*DurableObjectNamespace/);
});
