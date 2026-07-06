# Architecture

Ludoria is a Cloudflare-first TypeScript monorepo. The web shell lives in apps/web, the Worker/BFF lives in apps/worker, and shared contracts live in packages/*.

## Phase 5 Shape

- apps/web: React UI for the game catalog, Token Bluffing Demo, and Sudoku Lite.
- apps/worker: Hono Worker with split route modules, a GameSessionObject Durable Object, hibernatable WebSocket connections, lifecycle alarms, a session:snapshot storage key, local Sudoku puzzle sessions, and D1 metadata writes.
- packages/game-engine: framework-neutral multiplayer and solo puzzle contracts.
- packages/game-definitions: concrete game rules for token-bluffing-demo and sudoku-lite.
- packages/protocol: shared protocol types plus lightweight Valibot runtime validation.
- packages/db: Drizzle ORM schema (9 tables), migration SQL, seed data, and metadata helpers for local D1.

## Durable Object Session Routing

Multiplayer sessions route deterministically:

`  ext
sessionId -> env.GAME_SESSION_OBJECT.idFromName(sessionId) -> GameSessionObject
`

The public Worker routes stay stable:

`  ext
POST /api/sessions
POST /api/sessions/:sessionId/join
GET  /api/sessions/:sessionId/connect
`

## Multiplayer Flow

Token Bluffing follows:

`  ext
Client command -> protocol schema parse -> GameSessionObject -> game definition validation -> public event -> authoritative state update -> player/spectator view projection -> WebSocket update
`

React does not implement game rules. Worker route handlers do routing and protocol boundaries; game rules remain in packages/game-definitions.

## D1 / Durable Object Data Boundary

- Durable Object storage: authoritative multiplayer game state, hidden tokens, session snapshots, WebSocket attachments. This is the only place where complete multiplayer GameState lives.
- D1: platform metadata (game catalog, session summaries, player rosters, puzzle progress, review summaries). Never contains hidden state, raw session tokens, or Sudoku solutions.
- R2: reserved for future image/card/token assets.

D1 metadata writes are best-effort during session create/join and puzzle create/move/check. Failures log warnings without breaking game operations. The game catalog reads from D1 first, falling back to a static mock catalog if D1 is unavailable.

## Durable Object Persistence And Lifecycle

GameSessionObject uses Durable Object WebSocket Hibernation for live Token Bluffing sockets. Each accepted socket serializes a small attachment with sessionId, actorId, role, and sessionTokenHash. The DO persists a minimal session:snapshot after state changes.

The snapshot does not contain raw session tokens, account metadata, D1-style lobby metadata, WebSocket objects, or platform-level analytics. WebSocket attachments also do not contain raw tokens or hidden game state.

Lifecycle alarms move inactive rooms to idle_checking and broadcast IDLE_CHECK. A KEEP_ALIVE message marks the room active again. Empty rooms can be marked abandoned after expiry.

## Solo Puzzle Flow

Sudoku Lite follows:

`  ext
Puzzle -> Progress -> Move -> Completion
`

Sudoku sessions remain local Worker memory placeholders. The public puzzle includes givens, board metadata, and a solution hash placeholder. It does not include the solution grid. Puzzle progress is written to D1 puzzle_progress as JSON (without solution data).

## Runtime Validation

packages/protocol uses Valibot for minimal runtime validation of join session requests, WebSocket client messages, and Sudoku Lite move bodies.

## Cloudflare Target

The target runtime remains Workers, Durable Objects, D1, and R2. Phase 5 intentionally runs only in local wrangler dev; it does not deploy or create real Cloudflare resources.
