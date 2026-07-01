# Roadmap

## Phase 0: Bootstrap

Create the monorepo, documentation, rules, local skills, and package placeholders.

## Phase 1: Runnable Shell

Make the web and Worker apps run locally with basic navigation, a health API, a mock game catalog, and shared protocol types.

## Phase 2: Demo Multiplayer Game

Implement `Token Bluffing Demo` to validate:

- local session actor shape
- WebSocket session flow
- command validation
- public events
- server-authoritative hidden state
- safe player and spectator view projection

## Phase 3: Demo Solo Puzzle

Implemented `Sudoku Lite` to validate:

- `Puzzle -> Progress -> Move -> Completion`
- public puzzle projection without solution leakage
- locked givens
- move validation
- progress updates
- hint endpoint
- completion check endpoint
- minimal protocol runtime validation with Valibot

## Phase 4A: Durable Object Runtime Boundary

Migrate multiplayer Token Bluffing sessions from a Worker-global memory map to `GameSessionObject` Durable Objects for local `wrangler dev`.

Validated goals:

- deterministic `sessionId -> Durable Object id` routing
- per-session authoritative multiplayer state
- WebSocket connect through Durable Object
- heartbeat, chat, submit command, and reconnect snapshot still handled by the session object
- Sudoku Lite remains a local solo puzzle placeholder

Phase 4A does not deploy and does not create real Cloudflare resources.

## Phase 4B: Durable Object Session Snapshots

Implemented local Durable Object storage snapshots for Token Bluffing sessions:

- `session:snapshot` with versioned authoritative game state
- participant token hashes instead of raw tokens
- 24-hour guest token expiry
- optional revoked token field and actor revoke method
- recent chat message trimming
- snapshot serialization/restoration tests

Phase 4B still does not deploy, create D1/R2 resources, or add a complete account system.

## Phase 4C: Recovery Policy and Metadata Boundaries

Recommended next step:

- define production recovery semantics after DO eviction
- decide D1 schema for lobby/session metadata
- document session expiry, revocation, and cleanup policy
- add stronger local DO integration tests with Cloudflare's workers test pool
- keep R2 out until asset or replay storage has a clear use case

## Phase 5: Polish UI

Refine the game hall into a premium board game lounge experience with responsive layouts, stronger game cards, cleaner session ergonomics, and visual QA.

## Phase 6: Real Games

Add real multiplayer board games and richer solo puzzle games after the engine contracts, security boundaries, and persistence model are stable.
