# Security Model

Ludoria treats the frontend as untrusted. UI state and disabled buttons are convenience only; Worker endpoints, Durable Objects, and game definitions must validate all meaningful input.

## Durable Object Authority

Phase 4C keeps Token Bluffing authority in `GameSessionObject`. The Worker routes requests to a per-session Durable Object; the DO owns participants, hibernatable WebSocket connections, chat, commands, lifecycle checks, and authoritative game state.

Live WebSocket connection identity is stored in WebSocket attachments with `sessionId`, `actorId`, `role`, and `sessionTokenHash`. Recoverable session data is stored in a Durable Object `session:snapshot`.

## Session Token Lifecycle

Join creates a random guest `sessionToken` and returns it to the client once. The snapshot stores only a SHA-256 hash of that token.

Participant token records include:

- `sessionTokenHash`
- `tokenExpiresAt`
- optional `revokedAt`

Tokens expire after 24 hours. Expired or revoked tokens are rejected before WebSocket upgrade and rechecked on WebSocket messages after wakeup. `GameSessionActor` includes a minimal revoke method for future account/session management, but Phase 4C does not add a user-facing revoke UI.

WebSocket attachments must not store raw session tokens, hidden token lists, full game state, or account metadata.

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

Phase 4C still lacks durable auth, account identity, match history, rate limiting, and a complete production recovery policy. It intentionally does not add D1. Future phases should decide which platform-level metadata belongs in D1 instead of the per-session snapshot.

## Test Coverage

Security-oriented tests cover:

- player views do not leak other players' hidden tokens
- spectator views do not leak hidden tokens
- public events use `declaredToken` and do not leak hidden state
- invalid multiplayer commands are rejected
- public Sudoku puzzles do not contain the solution
- locked givens and invalid Sudoku digits are rejected
- invalid protocol shapes are rejected by schemas
- hibernation attachments reject invalid shapes
- expired and revoked actor tokens are rejected
- room lifecycle starts active, refreshes on activity, and enters idle checking through alarm policy
