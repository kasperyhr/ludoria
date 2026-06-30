# Security Model

Ludoria treats the frontend as untrusted. UI state and disabled buttons are convenience only; Worker endpoints and game definitions must validate all meaningful input.

## Hidden Multiplayer Information

`Token Bluffing Demo` full state contains player hidden tokens. Full state is never sent to clients.

`getPlayerView` may include the current player's own `self.hiddenTokens`, but other players expose only:

- `id`
- `displayName`
- `tokenCount`
- `connected`

`getSpectatorView` must not include any `hiddenTokens` field.

Public events may include what a player declared, using `declaredToken`, but must not include the player's real hidden token list.

## Runtime Protocol Validation

`packages/protocol` uses Valibot to reject malformed payloads before they reach game logic. Current schemas cover join requests, WebSocket client messages, and Sudoku Lite moves.

`RECONNECT` is intentionally simplified to:

```json
{ "type": "RECONNECT" }
```

The session token remains in the WebSocket URL used to reconnect to the same session.

## Solo Puzzle Solution Safety

Sudoku Lite keeps the private solution in `packages/game-definitions`. The Worker returns a public puzzle with givens and a `solutionHash` placeholder, but not the solution grid.

Hints return only one target cell and a short candidate list. Completion is checked server-side from puzzle plus progress.

## Placeholder Risks

Phase 3 still uses local in-memory session maps. This means there is no durable auth, expiry, revocation, rate limiting, or cross-instance coordination yet. Phase 4 should move authority and persistence into Cloudflare Durable Objects and D1.

## Test Coverage

Security-oriented tests cover:

- player views do not leak other players' hidden tokens
- spectator views do not leak hidden tokens
- public events use `declaredToken` and do not leak hidden state
- invalid multiplayer commands are rejected
- public Sudoku puzzles do not contain the solution
- locked givens and invalid Sudoku digits are rejected
- invalid protocol shapes are rejected by schemas
