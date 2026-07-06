# Roadmap

## Phase 0: Bootstrap
Create the monorepo, documentation, rules, local skills, and package placeholders.

## Phase 1: Runnable Shell
Make the web and Worker apps run locally.

## Phase 2: Demo Multiplayer Game
Implement Token Bluffing Demo with WebSocket, command validation, and hidden information safety.

## Phase 3: Demo Solo Puzzle
Implement Sudoku Lite with puzzle/move/hint/completion flow.

## Phase 4A-C: Durable Object Architecture
Durable Object routing, storage snapshots, WebSocket Hibernation, room lifecycle.

## Phase 5-5.1: D1 Metadata Layer
Drizzle ORM schema (9 tables, 12 indexes), migrations, seed data, metadata helpers, BOM cleanup.

## Phase 6-6.1: Local Deployment Readiness
Local smoke test, environment check, D1 migration/seed scripts, preview deploy checklist.

## Phase 7A: Cloudflare Preview Deploy Dry Run
Runbook, preview plan script, preview config check, wrangler preview template.

## Phase 7B: Actual Cloudflare Preview Deploy -- COMPLETED
- Worker: ludoria-worker
- Preview URL: https://ludoria-worker.kasperyhr.workers.dev
- D1: ludoria-preview-db (WNAM)
- Remote migrations: 2/2
- Remote seed: 3/3
- smoke:preview: 28/28
- Security scan: clean

## Phase 7C: Post-deploy Hardening -- CURRENT
Post-deploy verification checklist, release checklist, security model updates, preview result documentation.

## Phase 8: Premium UI Polish -- NEXT
Polish the game hall UI to premium board game lounge standard. Focus on responsive layouts, visual refinement, and demo ergonomics. Does not change deployment architecture or game rules.
