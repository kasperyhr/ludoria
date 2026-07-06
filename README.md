# Ludoria

Ludoria is a Cloudflare-first TypeScript monorepo for an online game hall where multiplayer board games and solo puzzle games can coexist behind shared contracts.

Phase 6 prepares the project for local deployment readiness: clean configuration, repeatable D1 migration/seed scripts, a comprehensive local smoke test, an environment check script, a security boundary scan, and a preview deploy checklist.

## Workspace

- `apps/web` -- Vite + React runnable shell, game catalog, Token Bluffing Demo UI, and Sudoku Lite UI.
- `apps/worker` -- Cloudflare Workers + Hono shell, Durable Object multiplayer sessions, local D1 metadata, and Sudoku Lite puzzle APIs.
- `packages/game-engine` -- shared multiplayer and solo puzzle engine contracts.
- `packages/game-definitions` -- `token-bluffing-demo` and `sudoku-lite` rule implementations.
- `packages/protocol` -- shared REST/WebSocket protocol types and Valibot runtime validation.
- `packages/db` -- Drizzle ORM schema, migrations, seed data, and metadata helpers for D1.
- `packages/ui` -- lightweight UI primitives (Button, Card, Badge).
- `packages/config` -- shared config placeholder.
- `scripts/` -- lint, smoke test, environment check, D1 seed.

## Install

```powershell
corepack pnpm install
```

## Local Development Quick Start

```powershell
# 1. Check your environment
corepack pnpm check:local

# 2. Start the Worker (with local D1 + Durable Objects)
corepack pnpm dev:worker

# 3. In another terminal, start the web app
corepack pnpm dev:web

# 4. Run local D1 migrations (first time only)
corepack pnpm db:migrate:local

# 5. Seed the game catalog (or the worker auto-seeds on first /api/games read)
corepack pnpm db:seed:local

# 6. Run smoke tests
corepack pnpm smoke:local
```

Default origins: `http://127.0.0.1:8787` (worker), `http://127.0.0.1:5173` (web).
The web app proxies `/worker-api/*` to the worker.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Start Vite dev server |
| `pnpm dev:worker` | Start Wrangler dev server (local DO + D1) |
| `pnpm dev` | Start both in parallel |
| `pnpm lint` | Run lint checks |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run all unit tests |
| `pnpm build` | Build all packages |
| `pnpm check:local` | Verify local environment readiness |
| `pnpm db:migrate:local` | Apply D1 migrations locally |
| `pnpm db:seed:local` | Seed local D1 game_catalog |
| `pnpm smoke:local` | Run local smoke test (requires running Worker) |

## Demo Paths

- `http://127.0.0.1:5173/demo/token-bluffing`
- `http://127.0.0.1:5173/demo/sudoku-lite`

## Data Boundaries

- **Durable Object storage**: authoritative multiplayer game state, hidden tokens, session snapshots, WebSocket attachments.
- **D1**: platform metadata (game catalog, session summaries, player rosters, puzzle progress). Never contains hidden state, raw tokens, or solutions.
- **R2**: reserved for future image/card/token assets.

## Still Placeholder

- No deployed Cloudflare resources (local-only `wrangler dev`).
- No real account system, OAuth, or lobby lifecycle.
- `solutionHash` is a placeholder string.
- Sudoku Lite sessions still use Worker memory (not Durable Objects).
- D1 writes are best-effort; failures log warnings without breaking game operations.
