# Security Model

Ludoria treats the frontend as untrusted. UI state and disabled buttons are convenience only; Worker endpoints, Durable Objects, and game definitions must validate all meaningful input.

## Durable Object Authority

Phase 4A moves Token Bluffing authority into `GameSessionObject`. The Worker routes requests to a per-session Durable Object; the DO owns participants, session tokens, WebSocket connections, chat, commands, and authoritative game state.

This is a runtime boundary validation, not final persistence. State is still stored in DO instance memory for now.

## Hidden Multiplayer Information

`Token Bluffing Demo` full state contains player hidden tokens. Full state is never sent to clients.

`getPlayerView` may include the current player's own `self.hiddenTokens`, but other players expose only:

- `id`
- `displayName`
- `tokenCount`
- `connected`

`getSpectatorView` must not include any `hiddenTokens` field.

Public events may include what a player declared, using `declaredToken` and `declaredCount`, but must not include the player's real hidden token list.

## Runtime Protocol Validation

`packages/protocol` uses Valibot to reject malformed payloads before they reach game logic. Current schemas cover join requests, WebSocket client messages, and Sudoku Lite moves.

`RECONNECT` is intentionally simplified to:

```json
{ "type": "RECONNECT" }
```

The session token remains in the WebSocket URL used to connect to the same session.

## Solo Puzzle Solution Safety

Sudoku Lite keeps the private solution in `packages/game-definitions`. The Worker returns a public puzzle with givens and a `solutionHash` placeholder, but not the solution grid.

Hints return one target cell and a single candidate for the current demo. They still do not return the full solution. Completion is checked server-side from puzzle plus progress.

## Placeholder Risks

Phase 4A still lacks durable auth, expiry, revocation, rate limiting, account identity, match history, and persisted recovery after DO instance eviction. Phase 4B should decide which data belongs in Durable Object storage and which belongs in D1.

## Test Coverage

Security-oriented tests cover:

- player views do not leak other players' hidden tokens
- spectator views do not leak hidden tokens
- public events use `declaredToken` and do not leak hidden state
- invalid multiplayer commands are rejected
- public Sudoku puzzles do not contain the solution
- locked givens and invalid Sudoku digits are rejected
- invalid protocol shapes are rejected by schemas
