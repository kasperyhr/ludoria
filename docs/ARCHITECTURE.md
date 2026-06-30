# Architecture

Ludoria is a Cloudflare-first TypeScript monorepo. The web shell lives in `apps/web`, the Worker/BFF lives in `apps/worker`, and shared contracts live in `packages/*`.

## Current Shape

- `apps/web`: React UI for the game catalog, Token Bluffing Demo, and Sudoku Lite.
- `apps/worker`: Hono Worker with REST endpoints, a WebSocket endpoint, local multiplayer sessions, and local Sudoku puzzle sessions.
- `packages/game-engine`: framework-neutral multiplayer and solo puzzle contracts.
- `packages/game-definitions`: concrete game rules for `token-bluffing-demo` and `sudoku-lite`.
- `packages/protocol`: shared protocol types plus Valibot runtime validation.

## Multiplayer Flow

Token Bluffing follows:

```text
Client command
  -> protocol schema parse
  -> game definition validation
  -> public event
  -> authoritative state update
  -> player/spectator view projection
  -> WebSocket update
```

React does not implement game rules. Worker route handlers and WebSocket handlers parse protocol input and delegate rule decisions to `packages/game-definitions`.

## Solo Puzzle Flow

Sudoku Lite follows:

```text
Puzzle
  -> Progress
  -> Move
  -> Progress
  -> Hint / Completion check
```

The public puzzle includes givens, board metadata, and a solution hash placeholder. It does not include the solution grid. Progress is updated through Worker endpoints and returned as a public progress view.

## Runtime Validation

`packages/protocol` uses Valibot for minimal runtime validation of:

- join session requests
- WebSocket client messages
- Sudoku Lite move bodies

Invalid protocol input returns `INVALID_MESSAGE` instead of flowing into game logic as unchecked casts.

## Phase 3 Data Flow

```text
apps/web
  -> REST /worker-api/api/games
  -> REST /worker-api/api/sessions
  -> REST /worker-api/api/puzzles/sudoku-lite/sessions
  -> REST /worker-api/api/puzzles/:sessionId/move
  -> REST /worker-api/api/puzzles/:sessionId/hint
  -> REST /worker-api/api/puzzles/:sessionId/check
  -> WebSocket /api/sessions/:sessionId/connect
  -> local in-memory Worker state
  -> packages/game-definitions rules
```

## Cloudflare Target

The target runtime remains Workers, Durable Objects, D1, and R2. Phase 3 intentionally does not create or deploy real Cloudflare resources. Local in-memory state is a proving ground for API shape and trust boundaries before Phase 4 persistence and coordination work.
