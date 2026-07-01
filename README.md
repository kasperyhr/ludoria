# Ludoria

Ludoria is a Cloudflare-first TypeScript monorepo for an online game hall where multiplayer board games and solo puzzle games can coexist behind shared contracts.

Phase 4B builds on the Durable Object routing from Phase 4A and adds a minimal Durable Object storage snapshot plus guest session token lifecycle for the multiplayer `Token Bluffing Demo`:

```text
sessionId -> Durable Object id -> GameSessionObject
```

This phase is local-only. It is meant to validate Durable Object recovery shape with `wrangler dev`; it does not deploy, create real Cloudflare resources, or add D1/R2 persistence. `Sudoku Lite` remains a solo puzzle memory placeholder.

## Workspace

- `apps/web`: Vite + React runnable shell, game catalog, Token Bluffing Demo UI, and Sudoku Lite UI.
- `apps/worker`: Cloudflare Workers + Hono shell, split route modules, `GameSessionObject` Durable Object with `session:snapshot` storage, and local Sudoku Lite puzzle APIs.
- `packages/game-engine`: shared multiplayer and solo puzzle engine contracts.
- `packages/game-definitions`: `token-bluffing-demo` and `sudoku-lite` rule implementations.
- `packages/protocol`: shared REST/WebSocket protocol types and Valibot runtime validation.
- `packages/db`: database schema placeholder.
- `packages/ui`: lightweight UI primitives.
- `packages/config`: shared config placeholder.

Valibot is used for the minimal runtime schemas because it is lightweight and sufficient for Phase 4A transport validation without adding a heavier dependency.

## Install

```powershell
corepack pnpm install
```

## Local Run

Start the Worker with local Durable Object support:

```powershell
corepack pnpm dev:worker
```

Default Worker origin:

```text
http://127.0.0.1:8787
```

Start the web app:

```powershell
corepack pnpm dev:web
```

Default web origin:

```text
http://127.0.0.1:5173
```

The web app proxies `/worker-api/*` to `http://127.0.0.1:8787/*`. WebSocket reconnection defaults to:

```text
ws://127.0.0.1:8787
```

## API Smoke Tests

```powershell
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/api/games
```

Create a multiplayer Durable Object session:

```powershell
curl -X POST http://127.0.0.1:8787/api/sessions
```

Join as a player:

```powershell
curl -X POST http://127.0.0.1:8787/api/sessions/<sessionId>/join `
  -H "Content-Type: application/json" `
  -d "{\"displayName\":\"Alice\",\"role\":\"player\"}"
```

Join as a spectator:

```powershell
curl -X POST http://127.0.0.1:8787/api/sessions/<sessionId>/join `
  -H "Content-Type: application/json" `
  -d "{\"displayName\":\"Watcher\",\"role\":\"spectator\"}"
```

Create a Sudoku Lite puzzle session:

```powershell
curl -X POST http://127.0.0.1:8787/api/puzzles/sudoku-lite/sessions
```

Apply a Sudoku Lite move:

```powershell
curl -X POST http://127.0.0.1:8787/api/puzzles/<sessionId>/move `
  -H "Content-Type: application/json" `
  -d "{\"row\":0,\"col\":1,\"value\":2}"
```

## Demo Paths

- `http://127.0.0.1:5173/demo/token-bluffing`
- `http://127.0.0.1:5173/demo/sudoku-lite`

## Snapshot Recovery Checks

Phase 4B recovery is covered by tests for snapshot serialization, token hashes, token expiry, revoked-token handling, and safe player/spectator views after restoring from snapshot state.

Local smoke should also create a Token Bluffing session, join player and spectator, connect WebSockets, submit `DECLARE_TOKEN_COUNT`, and confirm the spectator snapshot does not contain `hiddenTokens`.

## Quality Commands

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Architecture Principles

Multiplayer games follow `Command -> Validate -> Event -> State -> View`. Full hidden state stays inside the server-authoritative session object; clients receive only role-safe views from `getPlayerView` or `getSpectatorView`.

Solo puzzles follow `Puzzle -> Progress -> Move -> Completion`. React components display public puzzle data and submit moves; puzzle rules, hinting, and completion checks live in `packages/game-definitions`.

## Still Placeholder

- `GameSessionObject` stores a minimal `session:snapshot` in Durable Object storage, but there is still no D1 session metadata, account system, or production recovery policy.
- Session tokens are returned to clients once and stored only as SHA-256 hashes with a 24-hour expiry. Revocation exists as an actor method, but no user-facing account/session management UI exists yet.
- Sudoku Lite sessions remain a Worker-local memory placeholder.
- There is no real account system, lobby lifecycle, match history, D1, R2, or deployed Cloudflare resource.
- `solutionHash` is a placeholder string until persistent puzzle generation and verification are introduced.
