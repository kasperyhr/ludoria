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
Add Cloudflare D1 + Drizzle ORM for platform-level metadata: 9 tables, migrations, seed data, metadata helpers, and worker route integration.

## Phase 5.1: D1 Cleanup
Remove UTF-8 BOM from all source files, add 12 D1 indexes, clean up metadata helper unused variables, and verify security boundaries.

## Phase 6: Local Deployment Readiness
Prepare the project for preview deployment:

- Cleaned up wrangler.toml, wrangler.example.toml, and .env.example with clear placeholder markers
- Added `pnpm db:migrate:local` and `pnpm db:seed:local` scripts
- Added `scripts/smoke-local.mjs` -- comprehensive local smoke test covering health, game catalog, Token Bluffing session create/join/WebSocket/command/keep-alive, spectator hidden-token safety, and Sudoku Lite create/move/hint/check
- Added `scripts/check-local.mjs` -- environment readiness check (Node, pnpm, wrangler, config files)
- Added `packages/db/test/security-scan.test.mjs` -- automated forbidden-field scan across D1 schema, migrations, and worker services
- Added `docs/PREVIEW_DEPLOY_CHECKLIST.md` -- pre-deploy checklist for Cloudflare preview
- Updated README with quick-start guide and script table
- Updated all architecture docs

Remaining future work:

- Deploy to Cloudflare for preview (follow PREVIEW_DEPLOY_CHECKLIST.md)
- Add real account system and OAuth
- Polish UI to premium board game lounge standard
- Add real multiplayer board games and richer solo puzzles

## Phase 7: Cloudflare Preview Deploy
Deploy to Cloudflare Workers with real D1 and Durable Objects in preview mode. Follow the PREVIEW_DEPLOY_CHECKLIST.md.
