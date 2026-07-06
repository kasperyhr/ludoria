# Deployment

Phase 6 is local-only. This document explains how to run locally and what deployment will look like.

## Local Development

```powershell
# Environment check
corepack pnpm check:local

# Install
corepack pnpm install

# Start Worker (includes local D1 + Durable Objects)
corepack pnpm dev:worker

# Start Web
corepack pnpm dev:web

# First-time D1 setup
corepack pnpm db:migrate:local
corepack pnpm db:seed:local

# Smoke test (requires running Worker)
corepack pnpm smoke:local
```

## Local Wrangler Configuration

`apps/worker/wrangler.toml` is configured for local `wrangler dev`:

- **D1**: `ludoria-db` with placeholder `database_id` (`local-ludoria-db-placeholder`).
- **Durable Objects**: `GAME_SESSION_OBJECT` bound to `GameSessionObject` class, migration tag `v1`.
- **R2**: not configured.

`wrangler.example.toml` in the repo root shows what changes are needed for Cloudflare preview/production deployment.

## Future Cloudflare Deployment Steps

1. Authenticate: `wrangler login`
2. Create D1 database: `wrangler d1 create ludoria-db`
3. Update `database_id` in `apps/worker/wrangler.toml`
4. Apply migrations: `wrangler d1 migrations apply ludoria-db`
5. Seed game catalog (or rely on auto-seed)
6. Deploy: `wrangler deploy`
7. Verify: `curl https://<your-worker>.<your-subdomain>.workers.dev/health`

See `docs/PREVIEW_DEPLOY_CHECKLIST.md` for the full pre-deploy checklist.

## Environment Variables

Copy `.env.example` to `.env` and adjust. For Cloudflare deployment, secrets are set via:

```powershell
wrangler secret put <NAME>
```

No secrets are required for local development.

## What is Not Deployed

- No real Cloudflare resources exist yet.
- No real D1 database, no real Durable Objects, no real R2.
- No DNS records are configured.
- Everything runs locally via `wrangler dev --local`.
