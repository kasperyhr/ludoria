import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addTokenBluffingPlayer,
  createTokenBluffingPlayer,
  tokenBluffingDemoDefinition
} from '../../../packages/game-definitions/src/multiplayer/token-bluffing-demo.ts';
import {
  createTokenExpiry,
  hashSessionToken,
  isParticipantTokenActive,
  snapshotContainsToken,
  trimChatMessages
} from '../src/session-snapshot.ts';

function createSnapshotFixture(overrides = {}) {
  let state = tokenBluffingDemoDefinition.setup('session-test');
  const first = addTokenBluffingPlayer(state, createTokenBluffingPlayer(0, 'player-1', 'Alice'));
  state = first.state;
  const second = addTokenBluffingPlayer(state, createTokenBluffingPlayer(1, 'player-2', 'Bob'));
  state = second.state;

  return {
    version: 1,
    sessionId: 'session-test',
    gameId: 'token-bluffing-demo',
    state,
    participants: [
      {
        actorId: 'player-1',
        displayName: 'Alice',
        role: 'player',
        sessionTokenHash: 'hash-player',
        tokenExpiresAt: createTokenExpiry(new Date('2026-07-01T00:00:00.000Z'))
      },
      {
        actorId: 'spectator-1',
        displayName: 'Watcher',
        role: 'spectator',
        sessionTokenHash: 'hash-spectator',
        tokenExpiresAt: createTokenExpiry(new Date('2026-07-01T00:00:00.000Z'))
      }
    ],
    chatMessages: [],
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    ...overrides
  };
}

test('session token hash does not expose the raw token in snapshot', async () => {
  const rawToken = 'raw-session-token-secret';
  const snapshot = createSnapshotFixture({
    participants: [
      {
        actorId: 'player-1',
        displayName: 'Alice',
        role: 'player',
        sessionTokenHash: await hashSessionToken(rawToken),
        tokenExpiresAt: createTokenExpiry()
      }
    ]
  });

  assert.equal(snapshotContainsToken(snapshot, rawToken), false);
  assert.notEqual(snapshot.participants[0].sessionTokenHash, rawToken);
});

test('snapshot state can restore safe player and spectator views', () => {
  const snapshot = createSnapshotFixture();
  const playerView = tokenBluffingDemoDefinition.getPlayerView(snapshot.state, 'player-1');
  const spectatorView = tokenBluffingDemoDefinition.getSpectatorView(snapshot.state);

  assert.equal(playerView.self.hiddenTokens.length > 0, true);
  assert.equal(JSON.stringify(playerView.players).includes('hiddenTokens'), false);
  assert.equal(JSON.stringify(spectatorView).includes('hiddenTokens'), false);
});

test('expired and revoked token participants are inactive', () => {
  const active = {
    tokenExpiresAt: '2026-07-02T00:00:00.000Z'
  };
  const expired = {
    tokenExpiresAt: '2026-06-30T23:59:59.000Z'
  };
  const revoked = {
    tokenExpiresAt: '2026-07-02T00:00:00.000Z',
    revokedAt: '2026-07-01T00:30:00.000Z'
  };
  const now = new Date('2026-07-01T00:00:00.000Z');

  assert.equal(isParticipantTokenActive(active, now), true);
  assert.equal(isParticipantTokenActive(expired, now), false);
  assert.equal(isParticipantTokenActive(revoked, now), false);
});

test('snapshot chat messages keep only the latest 100 entries', () => {
  const messages = Array.from({ length: 105 }, (_, index) => ({
    id: `chat-${index}`,
    actorId: 'player-1',
    displayName: 'Alice',
    text: `message-${index}`,
    createdAt: new Date(index).toISOString()
  }));
  const trimmed = trimChatMessages(messages);

  assert.equal(trimmed.length, 100);
  assert.equal(trimmed[0].id, 'chat-5');
  assert.equal(trimmed.at(-1).id, 'chat-104');
});
