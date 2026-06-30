# Ludoria

Ludoria is a Cloudflare-first TypeScript monorepo for an online game hall where multiplayer board games and solo puzzle games can coexist behind shared contracts.

Phase 3 adds `Sudoku Lite`, a 4x4 solo puzzle demo that validates `Puzzle -> Progress -> Move -> Completion`, hinting, autosave-style progress updates, and a public puzzle representation that never exposes the full solution. Phase 2's `Token Bluffing Demo` remains in place for multiplayer hidden-information validation.

## Workspace

- `apps/web`: Vite + React runnable shell, game catalog, Token Bluffing Demo UI, and Sudoku Lite UI.
- `apps/worker`: Cloudflare Workers + Hono shell, session REST APIs, WebSocket entrypoint, local `GameSessionActor` placeholder, and Sudoku Lite puzzle APIs.
- `packages/game-engine`: shared multiplayer and solo puzzle engine contracts.
- `packages/game-definitions`: `token-bluffing-demo` and `sudoku-lite` rule implementations.
- `packages/protocol`: shared REST/WebSocket protocol types and Valibot runtime validation.
- `packages/db`: database schema placeholder.
- `packages/ui`: lightweight UI primitives.
- `packages/config`: shared config placeholder.

## Install

```powershell
corepack pnpm install
```

## Local Run

Start the Worker:

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

Create a multiplayer session:

```powershell
curl -X POST http://127.0.0.1:8787/api/sessions
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

## Quality Commands

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Architecture Principles

Multiplayer games follow `Command -> Validate -> Event -> State -> View`. Full hidden state stays in server-authoritative state; clients receive only role-safe views.

Solo puzzles follow `Puzzle -> Progress -> Move -> Completion`. React components display public puzzle data and submit moves; puzzle rules, hinting, and completion checks live in `packages/game-definitions`.

## Still Placeholder

- `GameSessionActor` and Sudoku sessions are local in-memory placeholders, not Durable Objects or persistent storage.
- There is no real account system, lobby lifecycle, match history, D1, R2, or deployed Cloudflare resource.
- `solutionHash` is a placeholder string until persistent puzzle generation and verification are introduced.
