import test from 'node:test';
import assert from 'node:assert/strict';
// TODO(pre-phase-5): Switch to '@ludoria/game-definitions' once all
// packages use explicit '.ts' extensions in ESM re-exports. Node's
// native ESM loader currently cannot resolve extension-less imports.
import {
  addTokenBluffingPlayer,
  createTokenBluffingPlayer,
  tokenBluffingDemoDefinition
} from '../../../packages/game-definitions/src/multiplayer/token-bluffing-demo.ts';
import {
  advanceRoomLifecycle,
  createRoomLifecycle,
  createTokenExpiry,
  getNextLifecycleAlarm,
  hashSessionToken,
  isValidSocketAttachment,
  isParticipantTokenActive,
  snapshotContainsToken,
  touchRoomActivity,
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
    ...createRoomLifecycle(new Date(state.createdAt)),
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

test('socket attachment validates persisted hibernation identity', () => {
  assert.equal(isValidSocketAttachment({
    sessionId: 'session-test',
    actorId: 'player-1',
    role: 'player',
    sessionTokenHash: 'hash-player'
  }), true);

  assert.equal(isValidSocketAttachment({
    sessionId: 'session-test',
    actorId: 'player-1',
    role: 'admin',
    sessionTokenHash: 'hash-player'
  }), false);

  assert.equal(isValidSocketAttachment({
    actorId: 'player-1',
    role: 'player',
    sessionTokenHash: 'hash-player'
  }), false);
});

test('room lifecycle starts active and records activity timestamps', () => {
  const startedAt = new Date('2026-07-01T00:00:00.000Z');
  const lifecycle = createRoomLifecycle(startedAt);

  assert.equal(lifecycle.roomStatus, 'active');
  assert.equal(lifecycle.lastActivityAt, startedAt.toISOString());
  assert.equal(lifecycle.idleCheckAt, '2026-07-01T00:30:00.000Z');

  const snapshot = createSnapshotFixture(lifecycle);
  const touched = touchRoomActivity(snapshot, new Date('2026-07-01T00:10:00.000Z'));

  assert.equal(touched.roomStatus, 'active');
  assert.equal(touched.lastActivityAt, '2026-07-01T00:10:00.000Z');
  assert.equal(touched.idleCheckAt, '2026-07-01T00:40:00.000Z');
});

test('room lifecycle enters idle check before abandoned closure', () => {
  const snapshot = createSnapshotFixture({
    roomStatus: 'active',
    expiresAt: '2026-07-02T00:00:00.000Z',
    idleCheckAt: '2026-07-01T00:30:00.000Z',
    lastActivityAt: '2026-07-01T00:00:00.000Z'
  });

  const idle = advanceRoomLifecycle(snapshot, {
    now: new Date('2026-07-01T00:31:00.000Z'),
    connectedCount: 1
  });

  assert.equal(idle.roomStatus, 'idle_checking');

  const abandoned = advanceRoomLifecycle(snapshot, {
    now: new Date('2026-07-02T00:01:00.000Z'),
    connectedCount: 0
  });

  assert.equal(abandoned.roomStatus, 'abandoned');
  assert.equal(abandoned.closedAt, '2026-07-02T00:01:00.000Z');
});

test('idle checking rooms schedule the next alarm at expiry', () => {
  const snapshot = createSnapshotFixture({
    roomStatus: 'idle_checking',
    expiresAt: '2026-07-02T00:00:00.000Z',
    idleCheckAt: '2026-07-01T00:30:00.000Z',
    lastActivityAt: '2026-07-01T00:00:00.000Z'
  });

  assert.equal(getNextLifecycleAlarm(snapshot), Date.parse('2026-07-02T00:00:00.000Z'));
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
