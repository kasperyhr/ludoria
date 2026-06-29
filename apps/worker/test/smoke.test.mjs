import test from 'node:test';
import assert from 'node:assert/strict';

test('worker placeholder smoke test', () => {
  assert.equal('/health'.startsWith('/'), true);
});
