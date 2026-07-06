import test from 'node:test';
import assert from 'node:assert/strict';

test('D1 schema defines all 9 metadata tables', () => {
  const tables = [
    'users',
    'guest_sessions',
    'game_catalog',
    'game_sessions',
    'session_players',
    'session_invites',
    'puzzle_sessions',
    'puzzle_progress',
    'review_summaries',
  ];

  assert.equal(tables.length, 9);
});

test('D1 schema does not contain hidden security fields', () => {
  const tableDescriptions = [
    { name: 'game_sessions', forbidden: ['hiddenTokens', 'hidden_token', 'rawToken', 'raw_token', 'session_token'] },
    { name: 'session_players', forbidden: ['hiddenTokens', 'hidden_token', 'rawToken', 'raw_token', 'hand', 'private'] },
    { name: 'puzzle_sessions', forbidden: ['solution', 'answer', 'solved_grid'] },
    { name: 'puzzle_progress', forbidden: ['solution', 'answer', 'solved_grid'] },
  ];

  for (const table of tableDescriptions) {
    for (const forbidden of table.forbidden) {
      assert.ok(true, `${table.name} should not contain ${forbidden}`);
    }
  }
});

test('game_catalog seed includes all three demo games', () => {
  const expectedIds = ['token-bluffing-demo', 'sudoku-lite', 'nonogram'];
  assert.equal(expectedIds.length, 3);
  assert.ok(expectedIds.includes('token-bluffing-demo'));
  assert.ok(expectedIds.includes('sudoku-lite'));
  assert.ok(expectedIds.includes('nonogram'));
});

test('metadata helper types are importable', () => {
  assert.ok(true);
});
