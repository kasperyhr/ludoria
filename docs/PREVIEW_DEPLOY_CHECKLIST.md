# Preview Deploy Checklist

This document lists everything that must be reviewed before deploying Ludoria to Cloudflare for preview or production. Phase 6 does not deploy; this checklist exists so the next phase can proceed safely.

## Cloudflare Account

- [ ] Cloudflare account is active
- [ ] Wrangler is authenticated: `wrangler whoami`
- [ ] Target zone/account ID is known

## Worker

- [ ] Worker name (`ludoria-worker`) is available or adjusted
- [ ] `apps/worker/wrangler.toml` is updated with real values (not placeholders)
- [ ] `compatibility_date` is current
- [ ] `main` points to the correct entry file

## Durable Objects

- [ ] `GAME_SESSION_OBJECT` binding is configured
- [ ] Migration tag (`v1`) is reviewed; if schema changed, bump tag
- [ ] `new_classes` includes all DO class names

## D1

- [ ] D1 database created: `wrangler d1 create ludoria-db`
- [ ] `database_id` replaced from placeholder (`local-ludoria-db-placeholder`) to real ID
- [ ] All migrations applied: `wrangler d1 migrations apply ludoria-db`
- [ ] Migration files match local schema
- [ ] Seed data applied (or auto-seed confirmed working)

## R2

- [ ] R2 is not configured (no asset storage needed yet)
- [ ] If R2 is added, create bucket and add binding

## Environment Variables

- [ ] `.env.example` reviewed; real `.env` created with production values
- [ ] No real secrets in example files or committed config
- [ ] Any secrets set via `wrangler secret put`

## DNS

- [ ] DNS is not modified in Phase 6
- [ ] Future: configure custom domain or use `workers.dev` subdomain

## Security

- [ ] `wrangler.toml` does not contain real secrets
- [ ] D1 schema does not contain `hiddenTokens`, `rawToken`, `sessionToken` columns
- [ ] D1 schema does not contain Sudoku `solution` column
- [ ] Game catalog seed does not contain hidden state or solutions
- [ ] Session tokens are hashed (SHA-256) before storage
- [ ] `wrangler.example.toml` has clear placeholder markers

## Local Verification (before deploy)

- [ ] `corepack pnpm lint` passes
- [ ] `corepack pnpm typecheck` passes
- [ ] `corepack pnpm test` passes
- [ ] `corepack pnpm build` passes
- [ ] `corepack pnpm check:local` passes
- [ ] Worker starts with `corepack pnpm dev:worker`
- [ ] Web starts with `corepack pnpm dev:web`
- [ ] `corepack pnpm smoke:local` passes (requires running Worker)

## Deploy Steps (for reference only; do not execute in Phase 6)

1. `wrangler d1 migrations apply ludoria-db` (remote)
2. `wrangler deploy`
3. Verify `/health` returns ok on deployed URL
4. Verify `/api/games` returns seeded catalog
5. Run smoke test against deployed URL

## Rollback

- [ ] Previous Wrangler deploy can be rolled back via Cloudflare Dashboard
- [ ] D1 migrations are additive; rollback means creating a reverse migration if needed
- [ ] Durable Object migration tags can be bumped to trigger new DO versions

## Notes

- This checklist is a living document. Update it as the project evolves.
- Do not deploy from Phase 6. This document exists for Phase 7+ readiness.
