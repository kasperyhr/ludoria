# Deployment Plan

Phase 4A is local-only. Do not deploy, create real Cloudflare resources, modify DNS, or create paid resources for this phase.

## Local Development

Install dependencies:

```powershell
corepack pnpm install
```

Start the Worker with local Durable Object support:

```powershell
corepack pnpm dev:worker
```

Start the web app:

```powershell
corepack pnpm dev:web
```

You can also start both:

```powershell
corepack pnpm dev
```

## Local Origins

Worker:

```text
http://127.0.0.1:8787
```

Web:

```text
http://127.0.0.1:5173
```

The web app uses the Vite proxy to send `/worker-api/*` to the local Worker.

## Health Check

```powershell
curl http://127.0.0.1:8787/health
```

Expected phase:

```json
{
  "ok": true,
  "service": "ludoria-worker",
  "phase": "phase-4a"
}
```

## Durable Object Local Binding

`apps/worker/wrangler.toml` configures one local Durable Object binding used by `corepack pnpm dev:worker`:

```toml
[[durable_objects.bindings]]
name = "GAME_SESSION_OBJECT"
class_name = "GameSessionObject"
```

This lets `wrangler dev` route multiplayer sessions through `GameSessionObject`. It does not create a real production Durable Object resource until someone explicitly deploys.

## Example Config

The root `wrangler.example.toml` mirrors the local shape and documents what must be reviewed before a real deployment: names, migration tags, account settings, environment bindings, and future D1/R2 resources.

## Future Cloudflare Deployment Steps

Phase 4B or later should:

- decide Durable Object storage snapshot strategy
- add D1 schema and migrations for session metadata
- define production environment bindings
- add Wrangler deployment checks
- document rollback and migration practices
