import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(currentDir, '..');

test('routes.ts defines all expected demo pages', () => {
  const source = readFileSync(resolve(webRoot, 'src/routes.ts'), 'utf8');

  assert.match(source, /path:\s*'\/'/);
  assert.match(source, /path:\s*'\/demo\/token-bluffing'/);
  assert.match(source, /path:\s*'\/demo\/sudoku-lite'/);
  assert.match(source, /Component:\s*HomePage/);
  assert.match(source, /Component:\s*TokenBluffingDemoPage/);
  assert.match(source, /Component:\s*SudokuLitePage/);
});

test('API client exports expected functions', () => {
  const source = readFileSync(resolve(webRoot, 'src/api/client.ts'), 'utf8');

  assert.match(source, /export function getHealth/);
  assert.match(source, /export function getGameCatalog/);
  assert.match(source, /export function createSession/);
  assert.match(source, /export function joinSession/);
  assert.match(source, /export function createSudokuLiteSession/);
  assert.match(source, /export function applyPuzzleMove/);
  assert.match(source, /export function getPuzzleHint/);
  assert.match(source, /export function checkPuzzleCompletion/);
});

test('Vite config proxies /worker-api to the Worker dev server', () => {
  const source = readFileSync(resolve(webRoot, 'vite.config.ts'), 'utf8');

  assert.match(source, /\/worker-api'/);
  assert.match(source, /proxy/);
  assert.match(source, /rewrite/);
});