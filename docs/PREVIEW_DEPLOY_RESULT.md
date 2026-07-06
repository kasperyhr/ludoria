# Preview Deploy Result

**Date**: 2026-07-06
**Phase**: 7B (deployed), 7C (hardening)
**Environment**: Preview (NOT production)

## Resources Created

| Resource | Name | Status |
|----------|------|--------|
| D1 Database | ludoria-preview-db (WNAM) | Created + Migrated + Seeded |
| Worker | ludoria-worker | Deployed |

## Preview URL

```
https://ludoria-worker.kasperyhr.workers.dev
```

## D1 Migrations

- [x] `0000_initial_metadata.sql` -- 9 tables
- [x] `0001_add_metadata_indexes.sql` -- 12 indexes

## Seed Data

- [x] Token Bluffing Demo (multiplayer, preview)
- [x] Sudoku Lite (solo, preview)
- [x] Nonogram (solo, planned)

## Smoke Test (28/28 passed)

- [x] Health
- [x] Game catalog (3 games)
- [x] Token Bluffing: create, player join, spectator join, WebSocket, DECLARE_TOKEN_COUNT, KEEP_ALIVE
- [x] Spectator hiddenTokens safety
- [x] Sudoku Lite: create, move, hint, check, no solution leak

## Security Scan

- [x] No hiddenTokens, rawToken, sessionToken in D1 schema
- [x] No Sudoku solution column in D1
- [x] No fullState or gameState in D1
- [x] Spectator WebSocket messages contain no hiddenTokens

## Config Safety

- [x] `wrangler.preview.toml` is gitignored -- contains real database_id
- [x] `apps/worker/wrangler.toml` still uses local placeholder -- safe for local dev
- [x] No account_id, API token, or database_id committed to git
- [x] `check:preview-config` passes

## DO Migration Note

Local `wrangler.toml` uses `new_classes`; preview `wrangler.preview.toml` uses `new_sqlite_classes` (free plan requirement). Both target the same `GameSessionObject` class.

## Resource Retention

Preview resources are kept until explicitly cleaned up. No auto-expiry is configured.

## Rollback

```powershell
# Delete Worker
wrangler delete --config apps/worker/wrangler.preview.toml

# Delete D1 database (via Cloudflare Dashboard -- wrangler d1 delete not available)
# D1 name: ludoria-preview-db
```

## Cleanup

When preview resources are no longer needed:

1. Delete the Worker: `wrangler delete --config apps/worker/wrangler.preview.toml`
2. Delete the D1 database via Cloudflare Dashboard
3. Delete `apps/worker/wrangler.preview.toml` locally
