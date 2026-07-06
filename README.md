# Ludoria

Ludoria is a Cloudflare-first TypeScript monorepo for an online game hall where multiplayer board games and solo puzzle games can coexist behind shared contracts.

Phase 5 adds a local D1 metadata layer with Drizzle ORM for platform-level indexing, game catalog persistence, session summaries, and puzzle progress tracking -- while keeping authoritative game state in Durable Objects and hidden information out of D1.

## Workspace

- pps/web: Vite + React runnable shell, game catalog, Token Bluffing Demo UI, and Sudoku Lite UI.
- pps/worker: Cloudflare Workers + Hono shell, Durable Object multiplayer sessions, local D1 metadata, and Sudoku Lite puzzle APIs.
- packages/game-engine: shared multiplayer and solo puzzle engine contracts.
- packages/game-definitions:   oken-bluffing-demo and sudoku-lite rule implementations.
- packages/protocol: shared REST/WebSocket protocol types and Valibot runtime validation.
- packages/db: Drizzle ORM schema, migrations, seed data, and metadata helpers for D1.
- packages/ui: lightweight UI primitives.
- packages/config: shared config placeholder.

Valibot is used for minimal runtime schemas; Drizzle ORM manages the D1 schema layer.

## Install

`powershell
corepack pnpm install
`

## Local D1 Setup

`powershell
cd packages/db
npx drizzle-kit generate --config drizzle.config.ts
npx wrangler d1 migrations apply ludoria-db --local
`

The worker seeds the game catalog automatically on first read if the table is empty.

## Local Run

`powershell
corepack pnpm dev:worker
corepack pnpm dev:web
`

Default origins: http://127.0.0.1:8787 (worker) and http://127.0.0.1:5173 (web).
The web app proxies /worker-api/* to the worker.

## Quality Commands

`powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
`

## Data Boundaries

- **Durable Object storage**: authoritative multiplayer game state, hidden tokens, session snapshots, WebSocket attachments.
- **D1**: platform metadata (game catalog, session summaries, player rosters, puzzle progress). Never contains hidden state, raw tokens, or solutions.
- **R2**: reserved for future image/card/token assets.

## Still Placeholder

- No deployed Cloudflare resources (local-only wrangler dev).
- No real account system, OAuth, or lobby lifecycle.
- solutionHash is a placeholder string.
- Sudoku Lite sessions still use Worker memory (not Durable Objects).
- D1 writes are best-effort; failures log warnings without breaking game operations.
