English summary:
This document is the handoff guide for deployment. It explains the current MVP Worker Static Assets approach, the future Pages migration plan, how to run local/preview smoke tests, and which commands create real resources. Never commit wrangler.preview.toml or database_id.

---

# Handoff: Deployment

## Current Preview

- URL: https://ludoria-worker.kasperyhr.workers.dev/
- Worker: ludoria-worker
- D1: ludoria-preview-db (WNAM)

## Current Deployment: Worker Static Assets MVP

Phase 8C 选择了 Worker Static Assets 方案：同一个 Worker URL 同时服务 Web UI 和 API。这是 MVP preview 方案，不是最终正式方案。

## Future: Cloudflare Pages Migration

计划将 `apps/web` 部署到 Cloudflare Pages，Worker 保留为 API/WebSocket/Durable Object/D1 后端。

迁移时只需在 Pages 环境变量设置：
```
VITE_LUDORIA_API_ORIGIN=https://ludoria-worker.kasperyhr.workers.dev
```

## Local Dev

```powershell
corepack pnpm dev:worker   # starts Worker at :8787
corepack pnpm dev:web      # starts Vite at :5173, proxies /worker-api to worker
```

## Preview Smoke

```powershell
$env:LUDORIA_WORKER_ORIGIN="https://ludoria-worker.kasperyhr.workers.dev"
corepack pnpm smoke:preview
corepack pnpm smoke:web-preview
```

## Deploy UI Updates

```powershell
corepack pnpm build
corepack pnpm wrangler deploy --config apps/worker/wrangler.preview.toml
```

## NEVER Commit

- `wrangler.preview.toml` (contains real database_id)
- `database_id`, `account_id`, API tokens, secrets

## Commands That Create Resources

- `wrangler d1 create` — creates D1
- `wrangler d1 migrations apply --remote` — modifies remote D1
- `wrangler d1 execute --remote` — modifies remote D1 data
- `wrangler deploy` — deploys Worker

## Commands That Are Safe (read-only / local)

- `pnpm smoke:preview` / `pnpm smoke:web-preview` — read-only smoke
- `pnpm check:local` / `pnpm check:preview-config` / `pnpm check:encoding` — local checks
- `pnpm preview:plan` — prints plan only
