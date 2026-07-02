# Architecture

Ludoria is a Cloudflare-first TypeScript monorepo. The web shell lives in `apps/web`, the Worker/BFF lives in `apps/worker`, and shared contracts live in `packages/*`.

## Phase 4C Shape

- `apps/web`: React UI for the game catalog, Token Bluffing Demo, and Sudoku Lite.
- `apps/worker`: Hono Worker with split route modules, a `GameSessionObject` Durable Object, hibernatable WebSocket connections, lifecycle alarms, a `session:snapshot` storage key, and local Sudoku puzzle sessions.
- `packages/game-engine`: framework-neutral multiplayer and solo puzzle contracts.
- `packages/game-definitions`: concrete game rules for `token-bluffing-demo` and `sudoku-lite`.
- `packages/protocol`: shared protocol types plus lightweight Valibot runtime validation.

## Durable Object Session Routing

Multiplayer sessions route deterministically:

```text
sessionId -> env.GAME_SESSION_OBJECT.idFromName(sessionId) -> GameSessionObject
```

The public Worker routes stay stable:

```text
POST /api/sessions
POST /api/sessions/:sessionId/join
GET  /api/sessions/:sessionId/connect
```

The route module forwards each request to the matching Durable Object. The Worker no longer keeps a global `Map<string, GameSessionActor>` for multiplayer sessions.

## Multiplayer Flow

Token Bluffing follows:

```text
Client command
  -> protocol schema parse
  -> GameSessionObject
  -> game definition validation
  -> public event
  -> authoritative state update
  -> player/spectator view projection
  -> WebSocket update
```

React does not implement game rules. Worker route handlers do routing and protocol boundaries; game rules remain in `packages/game-definitions`.

## Durable Object Persistence And Lifecycle

`GameSessionObject` uses Durable Object WebSocket Hibernation for live Token Bluffing sockets. Each accepted socket serializes a small attachment with `sessionId`, `actorId`, `role`, and `sessionTokenHash`; after eviction and wakeup the DO restores context from that attachment plus the stored `session:snapshot`.

The DO persists a minimal `session:snapshot` after create, join, chat, command, connect, disconnect, and lifecycle state changes.

The snapshot contains:

- `version`
- `sessionId`
- `gameId`
- server-authoritative Token Bluffing state
- participant records with token hashes and expiry
- recent chat messages
- `roomStatus`
- `expiresAt`
- `idleCheckAt`
- `lastActivityAt`
- `createdAt` and `updatedAt`

The snapshot does not contain raw session tokens, account metadata, D1-style lobby metadata, WebSocket objects, or platform-level analytics. WebSocket attachments also do not contain raw tokens or hidden game state.

Lifecycle alarms currently move inactive rooms to `idle_checking` and broadcast `IDLE_CHECK`. A `KEEP_ALIVE` message marks the room active again and refreshes `lastActivityAt` / `idleCheckAt`. Empty rooms can be marked `abandoned` after expiry; connected rooms are not closed simply because a player thinks for a long time.

## Solo Puzzle Flow

Sudoku Lite still follows:

```text
Puzzle -> Progress -> Move -> Completion
```

Sudoku sessions remain local Worker memory placeholders in Phase 4C. The public puzzle includes givens, board metadata, and a solution hash placeholder. It does not include the solution grid.

## Runtime Validation

`packages/protocol` uses Valibot for minimal runtime validation of:

- join session requests
- WebSocket client messages
- Sudoku Lite move bodies

Valibot was chosen because it is lightweight and enough for the current transport boundary without adding unnecessary dependency weight.

## Cloudflare Target

The target runtime remains Workers, Durable Objects, D1, and R2. Phase 4C intentionally runs only in local `wrangler dev`; it does not deploy or create real Cloudflare resources.
