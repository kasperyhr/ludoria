# Preview Deploy Runbook

**Phase 7A -- DO NOT DEPLOY.** This document is a manual runbook for future Cloudflare preview deployment. No commands in this document should be executed during Phase 7A. Phase 7B will be the actual deployment phase.

## Prerequisites

Before starting, confirm:

- [ ] Cloudflare account is active
- [ ] Wrangler is installed and authenticated: `wrangler whoami`
- [ ] `workers.dev` is enabled for your account
- [ ] You have the Ludoria repo cloned and on `main` branch
- [ ] All local quality checks pass: `corepack pnpm lint && corepack pnpm typecheck && corepack pnpm test && corepack pnpm build`

## Phase 7A vs Phase 7B

| Phase | Action |
|-------|--------|
| Phase 7A (current) | Prepare runbook and scripts. No real resources created. |
| Phase 7B (future) | Execute the commands in this runbook to deploy. |

---

## Step 1: Create Preview D1 Database

**Do not run in Phase 7A.**

```powershell
# Create the preview D1 database
npx wrangler d1 create ludoria-preview-db --config apps/worker/wrangler.toml

# The output will include a database_id. Copy it.
# Example output:
#   binding = "DB"
#   database_name = "ludoria-preview-db"
#   database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## Step 2: Update wrangler.toml with Preview D1

**Do not run in Phase 7A.**

In `apps/worker/wrangler.toml`, replace the local placeholder `database_id` with the preview ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "ludoria-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   # <-- replace with real ID
```

Or use a separate `[env.preview]` section (see wrangler.example.toml).

## Step 3: Apply Remote D1 Migrations

**Do not run in Phase 7A.**

```powershell
# Apply all migrations to the remote preview database
npx wrangler d1 migrations apply ludoria-db --remote --config apps/worker/wrangler.toml

# The migrations applied are:
#   0000_initial_metadata.sql  -- 9 tables
#   0001_add_metadata_indexes.sql -- 12 indexes
```

Confirm the prompt to proceed. A backup will be captured automatically.

## Step 4: Seed Remote D1 Game Catalog

**Do not run in Phase 7A.**

Option A: The worker auto-seeds `game_catalog` on the first `/api/games` read.

Option B: Run manually:

```powershell
# Generate a seed SQL file
# (or use the auto-seed feature of the worker)
npx wrangler d1 execute ludoria-db --remote --config apps/worker/wrangler.toml --command="
INSERT INTO game_catalog (id, name, mode, status, description, player_count_label, created_at, updated_at) VALUES
  ('token-bluffing-demo', 'Token Bluffing Demo', 'multiplayer', 'preview', '最小多人隐藏信息 demo', '2-6 players', datetime('now'), datetime('now'))
  ON CONFLICT(id) DO UPDATE SET updated_at = datetime('now');
"
```

## Step 5: Verify Durable Object Migration

**Do not run in Phase 7A.**

The wrangler.toml already has:

```toml
[[durable_objects.bindings]]
name = "GAME_SESSION_OBJECT"
class_name = "GameSessionObject"

[[migrations]]
tag = "v1"
new_classes = ["GameSessionObject"]
```

No changes needed for preview unless the DO class list or migration tag has changed.

## Step 6: Deploy Worker (Preview)

**Do not run in Phase 7A.**

```powershell
# Dry-run first (safe, does not deploy)
npx wrangler deploy --config apps/worker/wrangler.toml --dry-run

# Deploy
npx wrangler deploy --config apps/worker/wrangler.toml
```

After deployment, Wrangler will output the preview URL, e.g.:
```
https://ludoria-worker.<your-subdomain>.workers.dev
```

## Step 7: Verify Deployment

**Do not run in Phase 7A.**

```powershell
# Check health
curl https://<preview-url>/health

# Check game catalog
curl https://<preview-url>/api/games
```

## Step 8: Run Preview Smoke Test

**Do not run in Phase 7A.**

```powershell
$env:LUDORIA_WORKER_ORIGIN = "https://<preview-url>"
corepack pnpm smoke:preview
```

## Step 9: Verify Security Boundaries

**Do not run in Phase 7A.**

After deployment, verify via D1 queries that:

- [ ] `game_sessions` table does not contain `hiddenTokens`, `rawToken`, or `fullState` columns
- [ ] `session_players` table does not contain raw session tokens
- [ ] `puzzle_sessions` and `puzzle_progress` tables do not contain Sudoku `solution` column
- [ ] WebSocket spectator connections do not receive `hiddenTokens` in their views

```powershell
# Check D1 schema remotely
npx wrangler d1 execute ludoria-db --remote --config apps/worker/wrangler.toml --command="SELECT sql FROM sqlite_master WHERE type='table';"
```

## Rollback / Cleanup

**Do not run in Phase 7A.**

To remove preview resources:

```powershell
# Delete the Worker
npx wrangler delete --config apps/worker/wrangler.toml

# Delete the D1 database (via Cloudflare Dashboard or API)
# Note: wrangler d1 delete may not be available; use the Dashboard.
```

---

## Commands Explicitly Forbidden in Phase 7A

The following commands must NOT be run during Phase 7A:

- `wrangler deploy`
- `wrangler d1 create`
- `wrangler d1 migrations apply --remote`
- `wrangler d1 execute --remote`
- `wrangler delete`

Phase 7A only prepares scripts, docs, and templates. Actual deployment happens in Phase 7B.
