# Roadmap

## Phase 0: Bootstrap

Create the monorepo, documentation, rules, local skills, and package placeholders.

## Phase 1: Runnable Shell

Make the web and Worker apps run locally with basic navigation, a health API, a mock game catalog, and shared protocol types.

## Phase 2: Demo Multiplayer Game

Implement Token Bluffing Demo to validate local session actor shape, WebSocket session flow, command validation, public events, server-authoritative hidden state, and safe player/spectator view projection.

## Phase 3: Demo Solo Puzzle

Implement Sudoku Lite to validate Puzzle -> Progress -> Move -> Completion, public puzzle projection without solution leakage, locked givens, move validation, hint endpoint, completion check, and Valibot runtime validation.

## Phase 4A: Durable Object Runtime Boundary

Migrate multiplayer Token Bluffing sessions from Worker-global memory map to GameSessionObject Durable Objects for local wrangler dev.

## Phase 4B: Durable Object Session Snapshots

Add DO storage snapshots, participant token hashes, 24-hour guest token expiry, revoked-token support, and chat message trimming.

## Phase 4C: Recovery Policy and Metadata Boundaries

Migrate to WebSocket Hibernation, add per-socket attachment identity, add RoomStatus/KEEP_ALIVE/IDLE_CHECK/ROOM_STATUS_CHANGED, room lifecycle fields, idle alarm scheduling, and basic abandoned-room policy.

## Phase 5: D1 Metadata Layer

Add Cloudflare D1 + Drizzle ORM for platform-level metadata:

- 9 Drizzle schema tables (users, guest_sessions, game_catalog, game_sessions, session_players, session_invites, puzzle_sessions, puzzle_progress, review_summaries)
- Drizzle Kit migration generation
- Seed data for game catalog (Token Bluffing Demo, Sudoku Lite, Nonogram)
- Metadata helper functions for D1 reads/writes
- Worker routes updated to write platform metadata on session create/join and puzzle create/move/check
- D1 writes are best-effort with fallback; failures do not break game operations
- D1 never contains hidden state, raw tokens, or Sudoku solutions

Remaining future work:

- Connect Sudoku Lite sessions to Durable Objects or D1 for persistence
- Add real account system and OAuth
- Deploy to Cloudflare with production D1/Durable Objects/R2
- Add stronger D1 integration tests

## Phase 6: Real Games

Add real multiplayer board games and richer solo puzzle games after the engine contracts, security boundaries, and persistence model are stable.
