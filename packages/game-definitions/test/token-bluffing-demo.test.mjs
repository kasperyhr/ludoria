import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addTokenBluffingPlayer,
  createTokenBluffingPlayer,
  tokenBluffingDemoDefinition
} from '../src/multiplayer/token-bluffing-demo.ts';

function createStateWithPlayers() {
  let state = tokenBluffingDemoDefinition.setup('test-session');
  const alice = createTokenBluffingPlayer(0, 'player-alice', 'Alice');
  const bob = createTokenBluffingPlayer(1, 'player-bob', 'Bob');
  state = addTokenBluffingPlayer(state, alice).state;
  state = addTokenBluffingPlayer(state, bob).state;
  return { state, alice, bob };
}

test('getPlayerView 只能看到自己的 hidden token', () => {
  const { state, alice, bob } = createStateWithPlayers();
  const aliceView = tokenBluffingDemoDefinition.getPlayerView(state, alice.id);

  assert.deepEqual(aliceView.self.hiddenTokens, alice.hiddenTokens);
  assert.equal(aliceView.players.find((player) => player.id === bob.id)?.tokenCount, bob.hiddenTokens.length);
  assert.equal('hiddenTokens' in aliceView.players.find((player) => player.id === bob.id), false);
});

test('getPlayerView 看不到其他玩家 token 种类', () => {
  const { state, alice, bob } = createStateWithPlayers();
  const aliceView = tokenBluffingDemoDefinition.getPlayerView(state, alice.id);
  const bobPublicView = aliceView.players.find((player) => player.id === bob.id);

  assert.ok(bobPublicView);
  assert.deepEqual(Object.keys(bobPublicView).sort(), ['connected', 'displayName', 'id', 'tokenCount'].sort());
  assert.equal('hiddenTokens' in bobPublicView, false);
});

test('getSpectatorView 看不到任何玩家 hidden token 种类', () => {
  const { state } = createStateWithPlayers();
  const spectatorView = tokenBluffingDemoDefinition.getSpectatorView(state);
  const spectatorJson = JSON.stringify(spectatorView);

  assert.equal(spectatorJson.includes('hiddenTokens'), false);
  assert.equal(spectatorView.players.every((player) => typeof player.tokenCount === 'number'), true);
});

test('public event 不泄露玩家实际 hidden token', () => {
  const { state, alice } = createStateWithPlayers();
  const result = tokenBluffingDemoDefinition.applyCommand({
    type: 'DECLARE_TOKEN_COUNT',
    playerId: alice.id,
    payload: {
      token: 'red',
      count: 2
    }
  }, state);

  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(result.value.event).includes('hiddenTokens'), false);
  assert.equal(JSON.stringify(result.value.event).includes(alice.hiddenTokens.join(',')), false);
});

test('非法 command 会被 reject', () => {
  const { state, alice } = createStateWithPlayers();
  const result = tokenBluffingDemoDefinition.applyCommand({
    type: 'DECLARE_TOKEN_COUNT',
    playerId: alice.id,
    payload: {
      token: 'red',
      count: -1
    }
  }, state);

  assert.equal(result.ok, false);
});
