# Release Checklist

Use this checklist before every Ludoria release (preview or production). The current deployment is preview-only; production release steps are marked as future.

## Pre-Release: Local Quality

- [ ] `corepack pnpm lint` passes
- [ ] `corepack pnpm typecheck` passes (all 8 packages)
- [ ] `corepack pnpm test` passes (all tests)
- [ ] `corepack pnpm build` passes
- [ ] `corepack pnpm check:local` passes
- [ ] `corepack pnpm check:preview-config` passes
- [ ] `corepack pnpm preview:plan` runs without errors

## Pre-Release: Local Smoke

- [ ] Worker starts: `corepack pnpm dev:worker`
- [ ] Web starts: `corepack pnpm dev:web`
- [ ] `corepack pnpm smoke:local` passes

## Pre-Release: Config Safety

- [ ] `wrangler.preview.toml` is not tracked by git
- [ ] No real database_id in `apps/worker/wrangler.toml`
- [ ] No real account_id in any committed file
- [ ] No API token in any committed file
- [ ] `.env.example` has no real secrets

## Pre-Release: D1

- [ ] All migrations present in `packages/db/migrations/`
- [ ] Migration files match local schema
- [ ] Seed data is up to date
- [ ] D1 schema contains no forbidden fields (`hiddenTokens`, `rawToken`, `sessionToken`, `solution`, `fullState`)

## Pre-Release: Durable Objects

- [ ] DO class name matches `wrangler.toml` binding
- [ ] Migration tag is correct
- [ ] WebSocket Hibernation is working (verified by smoke test)
- [ ] Room lifecycle (idle_checking/abandoned) behaves as expected

## Pre-Release: Hidden Information

- [ ] `getPlayerView` returns self.hiddenTokens, not others'
- [ ] `getSpectatorView` returns no hiddenTokens
- [ ] Public events contain no hidden state
- [ ] D1 contains no hidden game state
- [ ] Session tokens are hashed (SHA-256) before storage

## Deployment

- [ ] `wrangler d1 migrations apply --remote` succeeds (if D1 changed)
- [ ] Seed applied (if game_catalog changed)
- [ ] `wrangler deploy --dry-run` passes
- [ ] `wrangler deploy` succeeds
- [ ] Preview/production URL recorded

## Post-Deploy

- [ ] `/health` returns ok
- [ ] `smoke:preview` passes (all checks)
- [ ] Spectator hiddenTokens safety confirmed
- [ ] D1 security scan passes remotely
- [ ] `check:preview-config` passes against committed files
- [ ] Deploy result documented in `docs/PREVIEW_DEPLOY_RESULT.md`

## Rollback Preparedness

- [ ] Rollback command recorded
- [ ] D1 backup exists (automatic on migration apply)
- [ ] Previous Worker version available via Cloudflare Dashboard

## Production-Specific (Future)

These steps do not apply to the current preview deployment:

- [ ] Custom domain configured
- [ ] DNS records verified
- [ ] Production D1 database separate from preview
- [ ] Production secrets set via `wrangler secret put`
- [ ] Monitoring/alerting configured
- [ ] Rate limiting reviewed
- [ ] Load testing performed
