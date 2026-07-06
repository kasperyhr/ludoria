# Architecture

Ludoria is a Cloudflare-first TypeScript monorepo. The web shell lives in apps/web, the Worker/BFF lives in apps/worker, shared contracts in packages/*, and dev tooling scripts in scripts/.

## Phase 6 Shape

- apps/web: React UI for the game catalog, Token Bluffing Demo, and Sudoku Lite.
- apps/worker: Hono Worker with split route modules, GameSessionObject Durable Object (hibernatable WebSocket, lifecycle alarms, session:snapshot), local Sudoku puzzle sessions, and D1 metadata writes.
- packages/game-engine: framework-neutral multiplayer and solo puzzle contracts.
- packages/game-definitions: concrete game rules for token-bluffing-demo and sudoku-lite.
- packages/protocol: shared protocol types plus Valibot runtime validation.
- packages/db: Drizzle ORM schema (9 tables, 12 indexes), two migration SQL files, seed data, and metadata helpers for local D1.
- scripts/: lint, smoke-local (comprehensive local smoke test), check-local (environment readiness), seed-d1 (D1 seed).

## Durable Object / D1 / Web Boundaries

- Durable Object storage: authoritative multiplayer game state, hidden tokens, session snapshots, WebSocket attachments.
- D1: platform metadata (game catalog, session summaries, player rosters, puzzle progress). Never contains hidden state, raw tokens, or solutions.
- Web: display and interaction only. No authoritative state. No game rules.

## Multiplayer Flow

Token Bluffing follows:

```text
Client command -> protocol schema parse -> GameSessionObject -> game definition validation -> public event -> authoritative state update -> player/spectator view projection -> WebSocket update
```

## Durable Object Persistence And Lifecycle

GameSessionObject uses WebSocket Hibernation. Snapshot key: session:snapshot. Lifecycle alarms manage idle_checking/abandoned transitions. KEEP_ALIVE resets room activity.

## Solo Puzzle Flow

Sudoku Lite follows: Puzzle -> Progress -> Move -> Completion. Sessions live in Worker memory. Progress writes to D1 puzzle_progress (without solution data).

## Cloudflare Target

Workers, Durable Objects, D1, and R2. Phase 6 runs only in local wrangler dev. No real Cloudflare resources are created.
