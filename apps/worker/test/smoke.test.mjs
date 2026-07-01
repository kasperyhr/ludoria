import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const workerRoot = resolve(currentDir, '..');

test('multiplayer routes are wired to Durable Object binding', () => {
  const source = readFileSync(resolve(workerRoot, 'src/routes/multiplayer-sessions.ts'), 'utf8');

  assert.match(source, /GAME_SESSION_OBJECT\.idFromName\(sessionId\)/);
  assert.match(source, /GAME_SESSION_OBJECT\.get/);
  assert.match(source, /objectUrl\('\/create'/);
  assert.match(source, /objectUrl\('\/join'/);
  assert.match(source, /objectUrl\('\/connect'/);
});

test('worker exports GameSessionObject for Wrangler binding', () => {
  const source = readFileSync(resolve(workerRoot, 'src/index.ts'), 'utf8');

  assert.match(source, /export \{ GameSessionObject \}/);
});

test('GameSessionObject reads and writes the session snapshot key', () => {
  const source = readFileSync(resolve(workerRoot, 'src/durable-objects/GameSessionObject.ts'), 'utf8');

  assert.match(source, /SESSION_SNAPSHOT_KEY/);
  assert.match(source, /state\.storage\.get<GameSessionSnapshot>/);
  assert.match(source, /state\.storage\.put\(SESSION_SNAPSHOT_KEY/);
  assert.match(source, /hashSessionToken/);
});
