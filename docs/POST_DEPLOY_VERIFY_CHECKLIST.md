# Post-Deploy Verification Checklist

Use this checklist after every Cloudflare preview or production deployment. Run against the deployed Worker URL (not localhost).

## Quick Verification

```powershell
$env:LUDORIA_WORKER_ORIGIN = "https://<your-worker-url>"
corepack pnpm smoke:preview
```

If smoke:preview passes all checks, the deployment is verified.

## Manual Verification Steps

### 1. Health

```powershell
curl https://<worker-url>/health
```

Expected: `{"ok":true,"service":"ludoria-worker"}`

- [ ] Health returns ok

### 2. Game Catalog

```powershell
curl https://<worker-url>/api/games
```

Expected: array with token-bluffing-demo, sudoku-lite, nonogram

- [ ] /api/games returns expected games

### 3. Token Bluffing

- [ ] POST /api/sessions returns 201 + sessionId + websocketUrl
- [ ] Player join returns sessionToken + actorId + role=player
- [ ] Spectator join returns sessionToken + role=spectator
- [ ] Player WebSocket connects and receives SESSION_SNAPSHOT
- [ ] Player snapshot: viewer=player, self.hiddenTokens present, players have tokenCount (not hiddenTokens)
- [ ] Spectator WebSocket connects and receives SESSION_SNAPSHOT
- [ ] Spectator messages contain no `hiddenTokens` string
- [ ] Player DECLARE_TOKEN_COUNT accepted
- [ ] KEEP_ALIVE accepted

### 4. Sudoku Lite

- [ ] POST /api/puzzles/sudoku-lite/sessions returns sessionId + puzzle (no solution)
- [ ] POST /api/puzzles/:id/move accepted for valid move
- [ ] POST /api/puzzles/:id/hint returns hint data
- [ ] POST /api/puzzles/:id/check returns isComplete/isSolved/errorCount

### 5. D1 Security

```powershell
wrangler d1 execute <db-name> --remote --config <config> --command "SELECT name, sql FROM sqlite_master WHERE type='table';"
```

Verify no columns named:
- [ ] hiddenTokens / hidden_token
- [ ] rawToken / raw_token
- [ ] sessionToken / session_token
- [ ] solution (Sudoku answer column; solutionHash is OK)
- [ ] fullState / gameState

### 6. Config Safety

```powershell
corepack pnpm check:preview-config
```

- [ ] No real account_id in committed files
- [ ] No real database_id in committed files
- [ ] No API tokens in committed files
- [ ] wrangler.preview.toml is gitignored

## Pre-Rollback Check

- [ ] Have the preview URL recorded?
- [ ] Have all resource names recorded?
- [ ] Know the rollback procedure?

## Post-Rollback Check

- [ ] Worker deleted or disabled
- [ ] D1 database deleted via Dashboard (if applicable)
- [ ] No orphaned resources remain
- [ ] Preview smoke test against the URL returns connection error (expected)
