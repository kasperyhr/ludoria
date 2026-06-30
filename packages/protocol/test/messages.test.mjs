import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseApplyPuzzleMoveRequest,
  parseClientToServerMessage,
  parseJoinSessionRequest
} from '../src/index.ts';

test('client message schema accepts simplified RECONNECT', () => {
  const result = parseClientToServerMessage({ type: 'RECONNECT' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { type: 'RECONNECT' });
});

test('client message schema rejects invalid WebSocket messages', () => {
  const result = parseClientToServerMessage({
    type: 'SUBMIT_COMMAND',
    commandId: 'cmd-1',
    command: {
      type: 'DECLARE_TOKEN_COUNT',
      payload: {
        token: 'purple',
        count: -1
      }
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_MESSAGE');
});

test('join session schema rejects unknown roles', () => {
  const result = parseJoinSessionRequest({ displayName: 'Ada', role: 'host' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_MESSAGE');
});

test('puzzle move schema rejects out-of-range Sudoku values', () => {
  const result = parseApplyPuzzleMoveRequest({ row: 0, col: 1, value: 5 });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'INVALID_MESSAGE');
});
